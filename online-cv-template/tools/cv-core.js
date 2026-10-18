/**
 * cv-core.js: shared by tools/linkedin-import.mjs (Node or Bun) and
 * tools/import.html (your browser). No dependencies, no network.
 *
 *   readExport(files)       LinkedIn CSV texts -> a partial CV (whitelisted)
 *   mergeCV(current, part)  replaces only the sections the export contained
 *   renderPage(html, cv)    rewrites every marked region in one page
 *                           (the website pages and the A4 sheets alike)
 *   readZip / writeZip      just enough ZIP for the export and the download
 *
 * PRIVACY: readExport copies named fields only. Birth date, address, phone
 * numbers, email addresses, connections and messages are never read into
 * the CV, even when they are in the export.
 */
(function (root) {
    'use strict';

    // ---------------------------------------------------------------- CSV

    function parseCSV(text) {
        text = String(text || '').replace(/^﻿/, '');
        const rows = [];
        let row = [], field = '', quoted = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (quoted) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
                } else field += c;
            } else if (c === '"') quoted = true;
            else if (c === ',') { row.push(field); field = ''; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(field); rows.push(row); row = []; field = '';
            } else field += c;
        }
        if (field !== '' || row.length) { row.push(field); rows.push(row); }
        return rows;
    }

    /* Some exports open with a "Notes:" preamble, so the header row is found
       by name rather than assumed to be the first line. */
    function table(text, mustHave) {
        const rows = parseCSV(text);
        const want = mustHave.map(function (h) { return h.toLowerCase(); });
        for (let i = 0; i < rows.length; i++) {
            const head = rows[i].map(function (h) { return h.trim().toLowerCase(); });
            if (want.every(function (h) { return head.indexOf(h) !== -1; })) {
                return rows.slice(i + 1)
                    .filter(function (r) { return r.some(function (v) { return v.trim() !== ''; }); })
                    .map(function (r) {
                        const o = {};
                        head.forEach(function (h, k) { o[h] = (r[k] || '').trim(); });
                        return o;
                    });
            }
        }
        return null;
    }

    function pick(files, name) {
        const key = Object.keys(files).find(function (k) {
            return k.split('/').pop().toLowerCase() === name.toLowerCase();
        });
        return key ? files[key] : null;
    }

    // -------------------------------------------------------------- dates

    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    /* "Sep 2021", "September 2021", "2021", "2021-09(-15)", "09/15/21, 3:04 PM" */
    function parseDate(s) {
        s = String(s || '').trim();
        if (!s) return null;
        let m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{4})$/);
        if (m) {
            const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
            return { y: +m[2], m: mi >= 0 ? mi + 1 : null };
        }
        m = s.match(/^(\d{4})(?:-(\d{1,2}))?/);
        if (m) return { y: +m[1], m: m[2] ? +m[2] : null };
        m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (m) {
            let y = +m[3]; if (y < 100) y += 2000;
            return { y: y, m: +m[1] };
        }
        return null;
    }
    function iso(d) { return d.m ? d.y + '-' + String(d.m).padStart(2, '0') : String(d.y); }
    function sortKey(s) { const d = parseDate(s); return d ? d.y * 12 + (d.m || 1) : 0; }

    /* Years only on the page; the full month stays in datetime="". */
    function datesHTML(start, end, openEnded) {
        const a = parseDate(start), b = parseDate(end);
        const t = function (d) { return '<time datetime="' + iso(d) + '">' + d.y + '</time>'; };
        if (!a && !b) return '';
        if (!a) return t(b);
        if (!b) return openEnded ? t(a) + ' &ndash; now' : t(a);
        if (a.y === b.y && iso(a) === iso(b)) return t(a);
        return t(a) + ' &ndash; ' + t(b);
    }

    // ------------------------------------------------------------- export

    function readExport(files) {
        const part = {};
        const report = { found: [], missing: [], hiddenRecommendations: 0, notes: [] };
        const note = function (file, rows) { (rows ? report.found : report.missing).push(file); };

        let t = pick(files, 'Profile.csv');
        let rows = t && table(t, ['First Name', 'Last Name']);
        note('Profile.csv', rows);
        if (rows && rows[0]) {
            const r = rows[0];
            const websites = [];
            String(r['websites'] || '').replace(/\[([A-Z_]+):([^\]]+)\]/g, function (_, kind, url) {
                const label = kind.replace(/^MY_/, '').replace(/_/g, ' ').toLowerCase();
                websites.push({ label: label.charAt(0).toUpperCase() + label.slice(1), url: url.trim() });
                return '';
            });
            part.profile = {
                firstName: r['first name'] || '',
                lastName: r['last name'] || '',
                headline: r['headline'] || '',
                summary: r['summary'] || '',
                location: r['geo location'] || r['location'] || '',
                websites: websites
            };
        }

        t = pick(files, 'Positions.csv');
        rows = t && table(t, ['Company Name', 'Title']);
        note('Positions.csv', rows);
        if (rows) {
            part.positions = rows.map(function (r) {
                return {
                    title: r['title'], company: r['company name'], location: r['location'] || '',
                    startedOn: r['started on'] || '', finishedOn: r['finished on'] || '',
                    description: r['description'] || ''
                };
            }).sort(function (a, b) {
                const cur = (a.finishedOn ? 0 : 1) - (b.finishedOn ? 0 : 1);
                return cur ? -cur : sortKey(b.startedOn) - sortKey(a.startedOn);
            });
        }

        t = pick(files, 'Education.csv');
        rows = t && table(t, ['School Name']);
        note('Education.csv', rows);
        if (rows) {
            part.education = rows.map(function (r) {
                const degree = [r['degree name'], r['field of study']].filter(Boolean).join(', ');
                return {
                    school: r['school name'], degree: degree,
                    startDate: r['start date'] || '', endDate: r['end date'] || '',
                    notes: r['notes'] || r['activities'] || ''
                };
            }).sort(function (a, b) { return sortKey(b.startDate) - sortKey(a.startDate); });
        }

        t = pick(files, 'Skills.csv');
        rows = t && table(t, ['Name']);
        note('Skills.csv', rows);
        if (rows) part.skills = rows.map(function (r) { return r['name']; }).filter(Boolean);

        t = pick(files, 'Certifications.csv');
        rows = t && table(t, ['Name', 'Authority']);
        note('Certifications.csv', rows);
        if (rows) {
            part.certifications = rows.map(function (r) {
                return {
                    name: r['name'], authority: r['authority'] || '', url: r['url'] || '',
                    startedOn: r['started on'] || '', finishedOn: r['finished on'] || ''
                };
            }).sort(function (a, b) { return sortKey(b.startedOn) - sortKey(a.startedOn); });
        }

        t = pick(files, 'Recommendations_Received.csv');
        rows = t && table(t, ['First Name', 'Text']);
        note('Recommendations_Received.csv', rows);
        if (rows) {
            if (rows.length && !('status' in rows[0])) {
                report.notes.push('Recommendations_Received.csv has no Status column, so none were imported.');
            }
            const visible = rows.filter(function (r) { return String(r['status'] || '').toUpperCase() === 'VISIBLE'; });
            report.hiddenRecommendations = rows.length - visible.length;
            part.recommendations = visible.map(function (r) {
                const d = parseDate(r['creation date']);
                return {
                    firstName: r['first name'], lastName: r['last name'] || '',
                    company: r['company'] || '', jobTitle: r['job title'] || '',
                    text: r['text'], date: d ? (d.m ? MONTHS[d.m - 1].charAt(0).toUpperCase() + MONTHS[d.m - 1].slice(1) + ' ' : '') + d.y : ''
                };
            });
        }
        return { part: part, report: report };
    }

    function mergeCV(current, part) {
        const cv = JSON.parse(JSON.stringify(current || {}));
        Object.keys(part).forEach(function (k) {
            if (k === 'profile') {
                cv.profile = Object.assign({}, cv.profile || {});
                Object.keys(part.profile).forEach(function (f) {
                    const v = part.profile[f];
                    if (Array.isArray(v) ? v.length : v) cv.profile[f] = v;
                });
            } else cv[k] = part[k];
        });
        return cv;
    }

    // ------------------------------------------------------------- render

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&rsquo;');
    }

    /* LinkedIn descriptions are plain text: lines starting with a bullet
       become a list, everything else a paragraph. */
    function textHTML(text) {
        const out = [];
        let list = null;
        String(text || '').split(/\r?\n/).forEach(function (line) {
            line = line.trim();
            if (!line) { list = null; return; }
            const b = line.match(/^[•·*–-]\s*(.+)$/);
            if (b) {
                if (!list) { list = []; out.push(list); }
                list.push('<li>' + esc(b[1]) + '</li>');
            } else { list = null; out.push('<p>' + esc(line) + '</p>'); }
        });
        return out.map(function (x) { return Array.isArray(x) ? '<ul>\n' + x.map(function (li) { return '  ' + li; }).join('\n') + '\n</ul>' : x; }).join('\n');
    }

    /* A description split into its opening paragraph(s) and its bullet
       lines, so the sheets can show the bullets alone or only the first few. */
    function splitText(text) {
        const intro = [], points = [];
        String(text || '').split(/\r?\n/).forEach(function (line) {
            line = line.trim();
            if (!line) return;
            const b = line.match(/^[•·*–-]\s*(.+)$/);
            if (b) points.push(b[1]); else intro.push(line);
        });
        return { intro: intro, points: points };
    }
    function yearOf(s) { const d = parseDate(s); return d ? String(d.y) : ''; }
    function firstSentence(text) {
        const t = String(text || '').replace(/\s+/g, ' ').trim();
        const m = t.match(/^.+?[.!?](?=\s|$)/);
        return m ? m[0] : t;
    }

    function hostOf(url) { return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''); }

    /* Rows for each region. Every value is escaped unless the template asks
       for it raw with {{{triple}}} (dates and descriptions, built above). */
    function regionRows(name, cv, opts) {
        const p = cv.profile || {};
        const lim = opts && opts.bullets ? opts.bullets : Infinity;
        switch (name) {
            case 'summary':
                return String(p.summary || '').split(/\r?\n\s*\r?\n|\r?\n/).map(function (t) { return t.trim(); })
                    .filter(Boolean).map(function (t) { return { text: t }; });
            case 'experience':
                return (cv.positions || []).map(function (r, i) {
                    const parts = splitText(r.description);
                    return {
                        n: i + 1, title: r.title, company: r.company, location: r.location,
                        org: [r.company, r.location].filter(Boolean).join(', '),
                        dates: datesHTML(r.startedOn, r.finishedOn, true),
                        from: yearOf(r.startedOn),
                        to: r.finishedOn ? yearOf(r.finishedOn) : 'present',
                        toYear: r.finishedOn ? yearOf(r.finishedOn) : String(new Date().getFullYear()),
                        description: textHTML(r.description),
                        intro: parts.intro.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join(''),
                        points: parts.points.slice(0, lim).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('')
                    };
                });
            case 'education':
                return (cv.education || []).map(function (r, i) {
                    return { n: i + 1, school: r.school, degree: r.degree || r.school, notes: r.notes, dates: datesHTML(r.startDate, r.endDate, false), year: yearOf(r.endDate || r.startDate) };
                });
            case 'certifications':
                return (cv.certifications || []).map(function (r, i) {
                    return { n: i + 1, name: r.name, authority: r.authority, url: r.url, dates: datesHTML(r.startedOn, r.finishedOn, false), year: yearOf(r.startedOn) };
                });
            case 'skills':
                return (cv.skills || []).map(function (s) { return { name: s }; });
            case 'recommendations':
                return (cv.recommendations || []).map(function (r, i) {
                    const d = parseDate(r.date);
                    return {
                        n: i + 1, total: (cv.recommendations || []).length,
                        name: [r.firstName, r.lastName].filter(Boolean).join(' '),
                        jobTitle: r.jobTitle, company: r.company,
                        role: [r.jobTitle, r.company].filter(Boolean).join(', '),
                        text: textHTML(r.text),
                        lead: firstSentence(r.text),
                        date: d ? (d.m ? MONTH_NAMES[d.m - 1] + ' ' : '') + d.y : '',
                        dateISO: d ? iso(d) : ''
                    };
                });
            case 'projects':
                return (cv.projects || []).map(function (r, i) {
                    return { n: i + 1, title: r.title, meta: r.meta, text: r.text };
                });
            case 'websites':
                return (p.websites || []).map(function (w) { return { label: w.label, url: w.url, host: hostOf(w.url) }; });
            default:
                return null;
        }
    }

    /* Inline regions hold one value and have no row template. */
    function inlineValue(name, cv) {
        const p = cv.profile || {};
        if (name === 'name') return esc([p.firstName, p.lastName].filter(Boolean).join(' '));
        if (name === 'first-name') return esc(p.firstName || '');
        if (name === 'last-name') return esc(p.lastName || '');
        if (name === 'now') {
            const now = (cv.positions || []).filter(function (r) { return !r.finishedOn; })[0];
            return now ? esc(now.title) : '';
        }
        if (name === 'headline') return esc(p.headline || '');
        if (name === 'location') return esc(p.location || '');
        if (name === 'city') return esc(String(p.location || '').split(',')[0].trim());
        return null;
    }

    function fill(tpl, data) {
        tpl = tpl.replace(/\{\{([#^])(\w+)\}\}([\s\S]*?)\{\{\/\2\}\}/g, function (_, kind, key, inner) {
            const on = !!(data[key] && String(data[key]).trim());
            return (kind === '#' ? on : !on) ? inner : '';
        });
        return tpl
            .replace(/\{\{\{(\w+)\}\}\}/g, function (_, k) { return data[k] == null ? '' : String(data[k]); })
            .replace(/\{\{(\w+)\}\}/g, function (_, k) { return esc(data[k]); });
    }

    function dedent(block) {
        const lines = block.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
        const min = Math.min.apply(null, lines.filter(function (l) { return l.trim(); })
            .map(function (l) { return l.match(/^ */)[0].length; }));
        return lines.map(function (l) { return l.slice(min); });
    }

    /* A region may carry a variant after "@" (experience@sheet), so one
       page can render the same data twice with different row templates.
       The row template can limit what it shows:
         data-cv-max="3"       only the first three rows
         data-cv-bullets="2"   only the first two bullet points per row */
    function renderPage(html, cv) {
        const changed = [];
        const out = html.replace(/<!-- cv:([\w@-]+) -->([\s\S]*?)<!-- \/cv:\1 -->/g, function (all, name) {
            const base = name.split('@')[0];
            const value = inlineValue(base, cv);
            if (value !== null) { changed.push(name); return '<!-- cv:' + name + ' -->' + value + '<!-- /cv:' + name + ' -->'; }
            const tm = html.match(new RegExp('( *)<template data-cv-row="' + name + '"([^>]*)>([\\s\\S]*?)</template>'));
            if (!tm) return all;
            const attr = function (a) { const m = tm[2].match(new RegExp(a + '="(\\d+)"')); return m ? +m[1] : 0; };
            let rows = regionRows(base, cv, { bullets: attr('data-cv-bullets') });
            if (!rows) return all;
            if (attr('data-cv-max')) rows = rows.slice(0, attr('data-cv-max'));
            const indent = tm[1] + '  ';
            const lines = dedent(tm[3]);
            const body = rows.map(function (data) {
                return fill(lines.join('\n'), data).split('\n')
                    .map(function (l) { return l.trim() ? indent + l : ''; })
                    .filter(Boolean).join('\n');
            }).join('\n');
            changed.push(name);
            return '<!-- cv:' + name + ' -->\n' + body + (body ? '\n' : '') + '<!-- /cv:' + name + ' -->';
        });
        return { html: out, regions: changed };
    }

    // ---------------------------------------------------------------- ZIP

    function u16(b, o) { return b[o] | (b[o + 1] << 8); }
    function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

    /* Reads the .csv files out of a LinkedIn export ZIP. inflateRaw is
       supplied by the caller (zlib in Node, DecompressionStream in a
       browser) and may return a Promise. */
    async function readZip(bytes, inflateRaw) {
        const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        let e = b.length - 22;
        while (e >= 0 && u32(b, e) !== 0x06054b50) e--;
        if (e < 0) throw new Error('That file is not a ZIP archive.');
        const count = u16(b, e + 10);
        let p = u32(b, e + 16);
        const files = {};
        const dec = new TextDecoder('utf-8');
        for (let i = 0; i < count; i++) {
            if (u32(b, p) !== 0x02014b50) break;
            const method = u16(b, p + 10), size = u32(b, p + 20);
            const nameLen = u16(b, p + 28), extraLen = u16(b, p + 30), commentLen = u16(b, p + 32);
            const local = u32(b, p + 42);
            const name = dec.decode(b.subarray(p + 46, p + 46 + nameLen));
            p += 46 + nameLen + extraLen + commentLen;
            if (!/\.csv$/i.test(name)) continue;
            const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
            const raw = b.subarray(start, start + size);
            let data;
            if (method === 0) data = raw;
            else if (method === 8) data = await inflateRaw(raw);
            else continue;
            files[name] = dec.decode(data);
        }
        return files;
    }

    let crcTable = null;
    function crc32(b) {
        if (!crcTable) {
            crcTable = new Uint32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
                crcTable[n] = c >>> 0;
            }
        }
        let c = 0xFFFFFFFF;
        for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    /* A stored (uncompressed) ZIP of text files, for the browser download. */
    function writeZip(entries) {
        const enc = new TextEncoder();
        const parts = [], central = [];
        let offset = 0;
        const le = function (n, size) { const a = []; for (let i = 0; i < size; i++) a.push((n >>> (8 * i)) & 0xFF); return a; };
        entries.forEach(function (f) {
            const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
            const head = [].concat(le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2),
                le(crc, 4), le(data.length, 4), le(data.length, 4), le(name.length, 2), le(0, 2));
            parts.push(new Uint8Array(head), name, data);
            central.push(new Uint8Array([].concat(le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2),
                le(crc, 4), le(data.length, 4), le(data.length, 4), le(name.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(offset, 4))), name);
            offset += head.length + name.length + data.length;
        });
        const cdSize = central.reduce(function (s, x) { return s + x.length; }, 0);
        const end = new Uint8Array([].concat(le(0x06054b50, 4), le(0, 2), le(0, 2), le(entries.length, 2), le(entries.length, 2),
            le(cdSize, 4), le(offset, 4), le(0, 2)));
        return parts.concat(central, [end]);
    }

    root.CVCore = {
        parseCSV: parseCSV, readExport: readExport, mergeCV: mergeCV,
        renderPage: renderPage, readZip: readZip, writeZip: writeZip, textHTML: textHTML
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
