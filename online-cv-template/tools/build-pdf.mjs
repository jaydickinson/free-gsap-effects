#!/usr/bin/env node
/**
 * Build the two PDFs from print.html:
 *
 *   assets/cv.pdf        the one-page CV        (print.html?full=0)
 *   assets/cv-full.pdf   the two-page full CV   (print.html?full=1)
 *
 *   node tools/build-pdf.mjs        (or: bun tools/build-pdf.mjs)
 *
 * Needs Playwright with Chromium. If you do not have it:
 *   npm i -D playwright && npx playwright install chromium
 * or skip this script entirely: open print.html?full=0 (then ?full=1) in
 * Chrome or Edge, Print, Destination "Save as PDF", Margins "None", tick
 * "Background graphics", and save them as assets/cv.pdf and assets/cv-full.pdf.
 *
 * Run it after editing cv.json (and tools/linkedin-import.mjs --render), so
 * the PDFs say the same as the site. The fonts load from Google Fonts, so
 * stay online while it runs.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try {
    ({ chromium } = await import('playwright'));
} catch (e) {
    console.error('Playwright is not installed here.\n' +
        '  npm i -D playwright && npx playwright install chromium\n' +
        'or open print.html?full=0 and ?full=1 in your browser and use Print, Save as PDF (margins: None).');
    process.exit(1);
}

const jobs = [
    { query: 'full=0', file: 'cv.pdf', pages: 1 },
    { query: 'full=1', file: 'cv-full.pdf', pages: 2 }
];

const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    for (const job of jobs) {
        const url = pathToFileURL(join(site, 'print.html')).href + '?' + job.query;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        /* Warn if any sheet's content runs past its footer. */
        const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('.page'))
            .filter((p) => p.offsetParent !== null)
            .map((p) => {
                const cv = p.querySelector('.cv');
                return cv.scrollHeight > cv.clientHeight + 1;
            }));
        if (overflow.some(Boolean)) {
            console.warn(`${job.file}: some content does not fit the page. Shorten the text in cv.json or limit rows with data-cv-max / data-cv-bullets on the sheet's row template.`);
        }
        await page.pdf({
            path: join(site, 'assets', job.file),
            preferCSSPageSize: true,
            printBackground: true,
            tagged: true
        });
        console.log(`assets/${job.file.padEnd(12)} written (${job.pages} page${job.pages > 1 ? 's' : ''} expected)`);
    }
} finally {
    await browser.close();
}
