# Online CV Template

A one-page CV site where the page is the CV itself: a real A4 sheet with a huge serif name, a black-and-white portrait, a drop-cap profile and numbered sections, lying on an ultramarine desk. A rail on the left carries the name, three key facts and the contact details; a small action bar switches between the one-page and the two-page CV, downloads the matching PDF, prints the sheet, starts an email and copies a link. The worked example is Clare Whitlock, a history teacher and Head of Year 9 in Sheffield; every name, school and figure in it is fictional.

## Quick Start

1. Unzip the folder and open `index.html` in a browser. It is plain HTML with no build step.
2. Fill `cv.json` from LinkedIn (below) or by hand, then run `bun tools/linkedin-import.mjs --render` (or `node`) to rewrite the sheets from it.
3. Rebuild the PDFs: `node tools/build-pdf.mjs`, or open `print.html?full=0` and `print.html?full=1` in Chrome and use Print, Save as PDF, margins None, saving over `assets/cv.pdf` and `assets/cv-full.pdf`.
4. Replace `assets/img/portrait.webp` with your own photograph (4:5), and search `index.html` and `print.html` for `clare@clarewhitlock.co.uk`, `clarewhitlock.co.uk` and the LinkedIn profile URL to put yours in.
5. Upload the folder to any static host. You can delete `tools/` before publishing; nothing on the site links to it.

## Using It With Your Own Design

- **Colour** is one blue, `--ground` / `--accent` in `assets/style.css` (with `--ground-rgb`): the desk, the italic surname, every number and chip. Change it and the site and the PDFs change together. White text on it must stay above 4.5:1.
- **Type** is Instrument Serif for the name, headings and figures, and Hanken Grotesk for text, from Google Fonts in the `<head>`. Change `--font-display` and `--font-text` and the link.
- **The sheet** is 794 x 1123 CSS px (A4 at 96 dpi) and is styled in CSS pixels on purpose, so what you see is what prints. Its type sizes live under "The sheet" in the stylesheet.
- **The rail facts** (`.rail__facts`) are plain text in `index.html`: Now, Looking for and Available. Change or delete them.

## The CV: one page and full (`index.html`, `print.html`)

- `.set--one` holds the one-page sheet, `.set--full` the two pages of the full CV. They are separate layouts, not one layout scaled. `<html data-cv="one|full">` picks one; the head script sets it from `?cv=full`, or from the last choice in this visit.
- The bar (`[data-dock]`): `[data-length]` buttons switch; `[data-pdf]` follows the switch between `assets/cv.pdf` and `assets/cv-full.pdf`; `[data-print]` prints; `[data-email]` gets a `mailto:` with a subject and a body holding the absolute URLs of the PDF and the site; `[data-copy]` copies the PDF link and confirms in place.
- **Zoom** (wide screens): a click on the sheet, or the bar's `[data-zoom]` button, scales it up to fill the space between the rail and the bar and back, keeping the line you clicked under the pointer.
- Switching never blanks the sheet: page one keeps its place while its text crossfades, and page two slides out from behind it (or tucks back under it first).
- **Narrow windows and phones**: where the A4 type would be too small to read, the sheet reflows into one column at a larger size (`.is-reflow`, set by `initFit`; the threshold is `REFLOW_BELOW` in `assets/script.js`). Print and the PDFs always use the A4 layout.
- **Print** uses `@page { size: A4; margin: 0 }` and hides everything but the chosen sheet(s), one page per sheet.
- `print.html` is the same two sheets with nothing else, for making PDFs. `?full=0` is the one-pager, `?full=1` the full CV.

## Import from your LinkedIn® data export

The import reads the data file LinkedIn lets you download about yourself. It does not sign in to LinkedIn or connect to your account; it only reads the export you give it, on your own computer.

1. On LinkedIn, open **Me > Settings & Privacy > Data privacy > Download your data**, pick the larger archive (or tick Profile, Positions, Education, Skills, Certifications and Recommendations) and **Request archive**. LinkedIn emails you a link, usually within a day.
2. Either run the script with Bun or Node 18+ (no packages to install):

   ```bash
   bun tools/linkedin-import.mjs ~/Downloads/Basic_LinkedInDataExport.zip
   # add --dry to see what would change and write nothing
   ```

   or open `tools/import.html` and drop the `.zip` on it. It reads the file in your browser and gives you a `.zip` of the updated `cv.json` and pages. **Your files stay on your computer; nothing is uploaded.**
3. Rebuild the PDFs (Quick Start, step 3).

| From the export | Goes to |
|---|---|
| `Profile.csv`: name, headline, summary, location, websites | Name, the sheet's profile |
| `Positions.csv` | Experience on both sheets |
| `Education.csv`, `Certifications.csv` | Education and Training |
| `Skills.csv` | Skills |
| `Recommendations_Received.csv` (only those marked VISIBLE) | The one-pager's quote and the full CV's references |

Any file may be missing; that section keeps what `cv.json` already has. Selected work (`projects` in `cv.json`) is never touched by an import. **Never read:** birth date, address, phone numbers, email addresses, connections or messages, even though some of them are in the export.

`tools/sample-export/` is a made-up export with a preamble line, a hidden recommendation and phone and email files, so you can try it first. `node tools/test-import.mjs` checks the importer and that the pages match `cv.json`.

This template is not affiliated with, endorsed by or sponsored by LinkedIn Corporation. LinkedIn is a registered trademark of LinkedIn Corporation. The [in] logo is used only as a link to the site owner's own profile, unaltered except for colour (white on the blue, black on paper), as LinkedIn's brand guidelines allow.

### Marked regions and row templates

Each data section sits between two comments, for example `<!-- cv:experience -->` and `<!-- /cv:experience -->`, with a `<template data-cv-row="experience">` beside it that every row is built from. Edit the template to change every row, then render. Placeholders are `{{field}}` (escaped text), `{{{field}}}` (prepared HTML) and `{{#field}}...{{/field}}` (only when the field has a value).

- A region name can carry a variant after `@` (`experience@one`, `experience@full`), so one page can render the same data twice with different templates.
- `data-cv-max="1"` on a row template keeps only the first rows; `data-cv-bullets="3"` keeps only the first bullets of each post. This is how the one-pager stays on one page.
- Post fields: `title`, `org`, `from`, `to` ("present" or a year), `intro`, `points`, `description`. Recommendation fields include `lead` (the first sentence) and `text`.

## Palette

| Token | Value | Use |
|---|---|---|
| `--ground` / `--accent` | `#1d2b8f` ultramarine | The desk, the surname, numbers and chips |
| `--paper` | `#fdfcf8` | The sheet |
| `--ink` | `#16161a` | Text on paper (17.6:1) |
| `--muted` | `#5f5f6b` | Secondary text on paper (6.2:1) |

White on the blue measures 10.9:1, and the blue on paper 10.6:1.

### Colour options

Four more colours ship as token blocks in `assets/style.css`. Put `data-palette="..."` on the `<html>` tag of `index.html` **and** `print.html`, then rebuild the PDFs (Quick Start, step 3) so they match. Or copy a block's values into `:root` and delete the others.

| `data-palette` | Desk | Light accent on the desk |
|---|---|---|
| (none) | `#1d2b8f` ultramarine | `#b9c1ff` |
| `forest` | `#1f4a38` | `#b5e3c7` |
| `oxblood` | `#6b1f2a` | `#f5c3c9` |
| `charcoal` | `#26272c` | `#e3d6b8` |
| `teal` | `#0f5257` | `#a6e6e1` |

The measured contrast for each is in the comment above the blocks.

## Example

Add a Languages block to the full CV's second page:

```html
<section class="sec">
  <h2><span class="secnum">08</span>Languages</h2>
  <p><span class="t">French</span><span class="s">Conversational</span></p>
</section>
```

Then run `node tools/build-pdf.mjs`; it warns if the page no longer fits.

## Accessibility and Fallbacks

- Every control is a native link or button with visible keyboard focus, and the length switch reports its state with `aria-pressed`.
- Copy link announces its result to screen readers.
- Reduced motion turns off the opening and every tween; the length switch changes instantly.
- Without JavaScript, or if the GSAP CDN is blocked, the sheet shows the one-page CV and the PDF download is still there.

## Dependencies

- GSAP 3.12+ core (demo built against 3.15.0), from jsDelivr. No plugins.
- Google Fonts: Instrument Serif, Hanken Grotesk.
- The importer and tests need Bun or Node 18+, or a current browser for `tools/import.html`; no packages. `tools/build-pdf.mjs` needs Playwright with Chromium, or use the browser's Save as PDF.

## Cleanup

All animation runs inside one `gsap.context()`; `window.gsapContext.revert()` removes every tween, listener and timer the script added and leaves the page readable.

## Images and Credits

The photograph is from Pexels, used under the Pexels licence. The file in `assets/img/` is a cropped, resized WebP derivative, shown in black and white by CSS; `assets/img-manifest.json` records its source and output size. Replace it with your own at the same name and shape, or edit the manifest and run `bun scripts/build-template-assets.ts online-cv-template --force` from the GSAP Vault repository.

- https://www.pexels.com/photo/smiling-black-female-teacher-with-textbooks-5905898/ (portrait)
