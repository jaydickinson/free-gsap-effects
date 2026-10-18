#!/usr/bin/env node
/**
 * Checks for the importer and renderer. No packages needed:
 *
 *   node tools/test-import.mjs      (or: bun tools/test-import.mjs)
 *
 * Reads tools/sample-export/ (a made-up export with a preamble line, a
 * hidden recommendation, and phone and email files that must never be
 * read), then renders every page from cv.json into memory and checks the
 * sheets and pages. Nothing is written.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const sandbox = {};
new Function('globalThis', readFileSync(join(here, 'cv-core.js'), 'utf8'))(sandbox);
const { readExport, mergeCV, renderPage } = sandbox.CVCore;

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok   ' + name); };

const sampleDir = join(here, 'sample-export');
const files = {};
for (const f of readdirSync(sampleDir)) files[join(sampleDir, f)] = readFileSync(join(sampleDir, f), 'utf8');
const { part, report } = readExport(files);
const cv = JSON.parse(readFileSync(join(site, 'cv.json'), 'utf8'));

test('reads the six whitelisted files', () => {
    assert.deepEqual(report.found.sort(), ['Certifications.csv', 'Education.csv', 'Positions.csv', 'Profile.csv', 'Recommendations_Received.csv', 'Skills.csv']);
});

test('never copies phone numbers, email addresses, birth date or address', () => {
    const text = JSON.stringify(part);
    assert.ok(!/@/.test(text.replace(/https?:\/\/[^"]+/g, '')), 'an email address leaked');
    assert.ok(!/\+?\d[\d\s]{9,}\d/.test(text), 'a phone number leaked');
    assert.ok(!('birthDate' in (part.profile || {})) && !('address' in (part.profile || {})));
});

test('skips recommendations not marked VISIBLE', () => {
    assert.ok(report.hiddenRecommendations >= 1);
    assert.ok(part.recommendations.length >= 1);
});

test('merge keeps sections the export did not contain (projects)', () => {
    const merged = mergeCV(cv, part);
    assert.deepEqual(merged.projects, cv.projects);
});

const pages = readdirSync(site).filter((f) => f.endsWith('.html'));

test('every page is already rendered from cv.json (render is a no-op)', () => {
    for (const p of pages) {
        const html = readFileSync(join(site, p), 'utf8');
        assert.equal(renderPage(html, cv).html, html, p + ' differs from cv.json; run tools/linkedin-import.mjs --render');
    }
});

test('the one-page sheet limits bullets and rows from its row templates', () => {
    const html = readFileSync(join(site, 'index.html'), 'utf8');
    const region = (name) => html.split('<!-- cv:' + name + ' -->')[1].split('<!-- /cv:' + name + ' -->')[0];
    const first = region('experience@one').split('<div class="job">')[1];
    assert.ok((first.match(/<li>/g) || []).length <= 3);
    assert.equal((region('recommendations@one').match(/<blockquote>/g) || []).length, 1);
    assert.equal((region('summary@one').match(/<p>/g) || []).length, 1);
});

test('an import changes the sheets and the pages together', () => {
    const merged = mergeCV(cv, { positions: [{ title: 'Head of History', company: 'Test School', location: 'Leeds', startedOn: 'Sep 2026', finishedOn: '', description: 'Intro.\n• One\n• Two' }] });
    for (const p of ['index.html', 'print.html']) {
        const out = renderPage(readFileSync(join(site, p), 'utf8'), merged).html;
        assert.ok(out.includes('Head of History') && out.includes('Test School'), p);
    }
});

console.log(`\n${passed} checks passed.`);
