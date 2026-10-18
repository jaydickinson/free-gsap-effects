#!/usr/bin/env node
/**
 * Import from your LinkedIn® data export.
 *
 *   bun tools/linkedin-import.mjs <export folder or .zip>    import, then render
 *   bun tools/linkedin-import.mjs --render                   render from cv.json
 *   add --dry to print what would change and write nothing
 *   add --site <folder> to work on a copy of the site elsewhere
 *
 * Works with Bun or Node 18+, with no packages to install. It reads the CSV
 * files LinkedIn sends you, updates cv.json with the sections it found (any
 * file may be missing), then rewrites the marked regions in every page using
 * each page's own <template data-cv-row> rows. Nothing is sent anywhere.
 *
 * Only named fields are copied: never birth date, address, phone numbers or
 * email addresses. Only recommendations with Status VISIBLE are kept.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const sandbox = {};
new Function('globalThis', readFileSync(join(here, 'cv-core.js'), 'utf8'))(sandbox);
const { readExport, mergeCV, renderPage, readZip } = sandbox.CVCore;

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const siteArg = args.indexOf('--site');
const site = resolve(siteArg >= 0 ? args[siteArg + 1] : join(here, '..'));
const source = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--site');
const dry = flag('--dry');

if (!source && !flag('--render')) {
    console.log('Usage: bun tools/linkedin-import.mjs <LinkedIn export folder or .zip> [--dry]\n' +
        '       bun tools/linkedin-import.mjs --render [--dry]');
    process.exit(1);
}

function walk(dir, out = {}) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (extname(name).toLowerCase() === '.csv') out[p] = readFileSync(p, 'utf8');
    }
    return out;
}

const cvPath = join(site, 'cv.json');
let cv = existsSync(cvPath) ? JSON.parse(readFileSync(cvPath, 'utf8')) : {};

if (source) {
    const src = resolve(source);
    if (!existsSync(src)) { console.error(`Not found: ${src}`); process.exit(1); }
    const files = statSync(src).isDirectory()
        ? walk(src)
        : await readZip(readFileSync(src), (raw) => inflateRawSync(raw));
    const { part, report } = readExport(files);
    if (!report.found.length) {
        console.error('No LinkedIn CSV files were recognised. Point this at the unzipped export folder or the .zip itself.');
        process.exit(1);
    }
    cv = mergeCV(cv, part);
    console.log('Read:     ' + report.found.join(', '));
    if (report.missing.length) console.log('Missing:  ' + report.missing.join(', ') + ' (those sections keep their current cv.json content)');
    if (report.hiddenRecommendations) console.log(`Skipped:  ${report.hiddenRecommendations} recommendation(s) not marked VISIBLE`);
    report.notes.forEach((n) => console.log('Note:     ' + n));
    const c = (k) => (cv[k] || []).length;
    console.log(`CV now:   ${c('positions')} positions, ${c('education')} education, ${c('certifications')} certifications, ${c('skills')} skills, ${c('recommendations')} recommendations`);
    if (!dry) writeFileSync(cvPath, JSON.stringify(cv, null, 2) + '\n');
}

for (const name of readdirSync(site).filter((f) => f.endsWith('.html')).sort()) {
    const p = join(site, name);
    const before = readFileSync(p, 'utf8');
    const { html, regions } = renderPage(before, cv);
    if (!regions.length) continue;
    const verb = html === before ? 'unchanged' : (dry ? 'would update' : 'updated');
    console.log(`${name.padEnd(18)} ${verb.padEnd(13)} ${[...new Set(regions)].join(', ')}`);
    if (!dry && html !== before) writeFileSync(p, html);
}
console.log(dry ? 'Dry run: nothing written.' : 'Done. Check the pages, then edit any wording by hand.\n' +
    'Then rebuild the PDFs: node tools/build-pdf.mjs (or open print.html and Save as PDF).');
