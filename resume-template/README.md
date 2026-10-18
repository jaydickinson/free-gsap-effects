# Resume Template

A single-page CV site that morphs between two layouts. The signature moment is the **Web / Résumé toggle**: GSAP Flip records the position of every structural block, one class switch reflows the page from a spacious web layout into an A4 page, and Flip animates the difference while the type scales down with it. Print uses the same document layout, so the page prints as a clean one-page CV from either mode and your site and your PDF never drift apart.

Art direction: a document lying on a desk. Deep indigo ground, warm cream sheet, graphite type, and one highlighter yellow used only to mark the lines that matter.

## What's Included

```
resume-template/
├── index.html          # The complete site
├── README.md           # These notes
├── LICENSE.txt         # Your licence, keep it
└── assets/
    ├── style.css       # All styles, responsive + print + reduced motion
    └── script.js       # All behaviour, commented section by section
```

No build step. No images to manage. Open `index.html` and it runs.

## Quick Start

1. Open `index.html` and replace the placeholder person with your own: name, role line, summary, contact list, roles, work, education, and talks.
2. Update the `<title>` and `<meta name="description">`, and remove `<meta name="robots" content="noindex, nofollow">` when you go live.
3. Change `data-copy="nadia@osei.dev"` on the bar button to your address.
4. Change the palette at the top of `style.css`. The whole page reskins from that one token block; see [Colour](#colour).
5. Or pick one of the five shipped palettes instead of editing tokens by hand: set `data-palette` on the `<html>` tag (see [Palettes](#palettes) below).
6. Deploy the folder anywhere that serves static files.

Fonts load from Google Fonts and GSAP from a CDN. To go fully self-hosted, download both and update the tags in `<head>`.

### Optional: minify before you go live

`assets/script.js` is the readable source and is what `index.html` loads. It is around 23KB, which is fine to ship as-is. If you would rather serve it minified, produce it yourself once your edits are done:

```bash
bunx terser assets/script.js -c -m -o assets/script.min.js
```

Then point the last `<script>` tag in `index.html` at `assets/script.min.js`. Keep `script.js` as the file you edit and re-run the command after each change, otherwise the two quietly drift apart.

## Sections & Options

### The mode toggle (`[data-modes]`, the signature)

Two buttons, `data-mode="web"` and `data-mode="paper"`. Clicking one:

- captures `Flip.getState()` on every `[data-flip-id]` block
- toggles `.mode-paper` on `<body>`, which swaps the layout tokens
- runs `Flip.from()` with `absolute: true` and `nested: true` so blocks can move and resize without tearing, while `--scale` and the name's size tween alongside so the type shrinks with the page instead of snapping
- keeps the row you were reading at the same height on screen, so switching from deep in the page does not throw you back to the top

Everything the two modes differ by is a custom property. The `:root` block sets the web values (`--scale`, `--sheet-max`, `--side-col`, `--date-col`, the gaps), and the DOCUMENT TOKENS section of `style.css` swaps them: one set for what the document shows (chips become comma lists, every role opens, the highlighters and at-a-glance block go), and one set for the A4 geometry. In Resume mode the sheet is exactly 794 by 1123 pixels, which is A4 at 96dpi, so what you see is the page the PDF holds. On screens too narrow for that page, Resume mode keeps the document content in a readable single column.

To change what Resume mode looks like, edit those tokens. You do not need to touch the JavaScript. To add another block to the morph, give it a unique `data-flip-id`.

**Keeping it to one page.** The placeholder content fills one A4 page with a little room to spare. If yours runs over, cut a bullet or two, or lower `--scale` in both document token blocks (Resume mode and print) a step at a time. A CV that needs a second page will still print correctly; it just flows on.

To ship only one layout, delete the `.modes` markup from the bar. The page keeps whichever mode the body class says, and printing still works.

### Expandable roles (`[data-expand]`)

Each role's Detail button toggles `aria-expanded` and animates the panel height, then hands the height back to CSS so Resume mode and print can force everything open. Set `aria-expanded="true"` in the markup to start a role open, as the current role does. A role without a Detail button (see Studio Fennec) simply has no `.entry-detail`; nothing else changes.

### Highlighter marks (`.hl`)

Wrap any phrase in `<mark class="hl">`. The mark is a background gradient swept from zero width by ScrollTrigger the first time it scrolls in. It is deliberately removed in Resume mode and in print, because a marked-up page is a screen affordance and not a document one.

Use it sparingly. Two or three marks across a page read as emphasis; ten read as decoration. Change the colour with `--mark`.

The mark sits *behind* the text rather than over it, so the thing to check when you change it is `--ink` against `--mark` at 4.5:1 or better. Keep it pale and saturated: real highlighters are, which is what makes a mark read as a mark instead of as a coloured box.

### The chronology spine

The connecting rule and dots down the experience list are drawn with `::before` and `::after` on `.entry`, positioned in the gutter using the `--date-col` and `--gutter` tokens. Change the date column width in one place and the spine follows. Selected work uses the same two columns, with the kind of project where a date would be. The spine hides below 720px, where the layout stacks and the rule would no longer encode order.

### At a glance (`.head-meta`)

The four label/value pairs beside the name. A screen affordance: Resume mode and print drop it, because the history below already says it. Add or remove `<div><dt>…</dt><dd>…</dd></div>` pairs freely.

### Copy email (`[data-copy]`)

Copies the value of the `data-copy` attribute and confirms in place for 1.8 seconds. Falls back to displaying the address if the Clipboard API is unavailable. Hidden entirely without JavaScript, since the address is in the contact list anyway.

### Side column

Contact, skills, languages, education, and speaking and writing. Below 900px the page goes to one column with contact first, then the history, then the rest of the side column. Delete any `side-block` section freely.

## Colour

Every colour on the page resolves from one token block at the top of `style.css`. There are no stray hex or `rgba()` values anywhere else in the stylesheet, apart from the black and white in the print block, which are meant to be literal, so a reskin really is this block and nothing else.

The block splits into two groups on purpose. The **desk** is the chrome the document lies on; the **sheet** is the document. Keeping them apart is what lets the desk go light without dragging the sticky bar into unreadability with it.

```css
:root {
    /* -- The desk: page ground and sticky-bar chrome -- */
    --desk: #1E2A4A;        /* page ground */
    --desk-deep: #16203A;   /* sticky bar, scrollbar track */
    --desk-lift: #33406A;   /* scrollbar thumb */
    --bar-ink: #F4EFE4;     /* primary type in the bar */
    --bar-dim: #B9BFD2;     /* secondary type in the bar */
    --bar-line: #6A7290;    /* ghost-button border */
    --bar-rule: #2C3654;    /* the hairline under the bar */
    --bar-fill: #2A3556;    /* the mode-toggle track */
    --on-desk: #B9BFD2;     /* the page foot, the only type on the desk itself */

    /* -- The sheet: the document -- */
    --sheet: #F4EFE4;       /* the CV sheet */
    --ink: #23262B;         /* body type */
    --ink-soft: #5C626B;    /* dates, labels, secondary type */
    --rule: #D8D0C1;        /* rules and dividers */
    --mark: #EDE04A;        /* the highlighter, the only accent */
    --ok: #2E7D4F;          /* the one state colour: the availability dot */
    --sheet-shadow: rgba(8, 14, 30, 0.7);

    /* -- Resume mode: the desk becomes a print preview -- */
    --paper-desk: #DBD8D1;
    --on-paper-desk: #4E5158;
    --paper-shadow: rgba(20, 24, 32, 0.55);
}
```

In practice you change three: `--desk`, `--sheet` and `--mark`. The desk and the highlighter carry the whole identity.

Contrast to check after any change, all at 4.5:1 or better: `--ink` on `--sheet`, `--ink-soft` on `--sheet` (the small mono date and label type is the most at-risk thing on the page), `--ink` over `--mark` where the highlighter sweeps, and `--bar-ink` plus `--bar-dim` on `--desk-deep`. Then `--on-desk` on `--desk` for the page foot, and `--on-paper-desk` on `--paper-desk` for the same foot in Resume mode. The five shipped palettes are all measured at that bar, so they double as worked examples.

The page foot is the only type sitting directly on the desk, so it uses solid `--on-desk` and `--on-paper-desk` tokens rather than a translucent tint of the sheet colour: in the default palette they measure 7.7:1 and 5.6:1.

## Palettes

The template ships with five palettes, each paired with its own display face so the five read as five identities rather than one design in five colours. Indigo is the default; the other four are in the `ALTERNATE PALETTES` block at the end of `assets/style.css`.

| Palette | Desk | Highlighter | Display face |
|--------|------|-------------|--------------|
| **Indigo** (default) | deep indigo | yellow | Bricolage Grotesque 800, a contemporary grotesk |
| Moss | deep green | lime | Fraunces 700, a soft warm serif |
| Claret | wine | amber | Playfair Display 700, a high-contrast editorial serif |
| Charcoal | near-black | cyan | IBM Plex Mono 700, a mono |
| Kraft | light kraft paper, with the bar staying dark | pink | Zilla Slab 700, a slab |

The face and the colours are independent tokens (`--font-display` and `--font-display-weight` sit in each block next to the colours), so keep the palette and swap the face, or the other way round. All five faces are in the Google Fonts `<link>` in `index.html`; a browser only downloads the one the page uses, but once you have settled, trim the link to the family you kept. The body face (Literata) and the mono face (Azeret Mono) are the same in every palette. Only the name and the bar monogram read the weight token; the entry titles and the role line keep their own weights, and a family loaded at one weight answers with that weight.

To use one, set the attribute on the `<html>` tag in `index.html`:

```html
<html lang="en" data-palette="moss">
```

That is the whole change. Each palette block restates the same nineteen colour tokens as `:root`, including the two shadow tokens, so nothing is left resolving from the palette you switched away from. Everything on the page is already drawing from those tokens.

Once you have settled on one, the tidier end state is to copy its values into the `:root` block at the top of `style.css` and delete the other three. **Keep the `@media print` rule at the end of that block either way**; see [Printing](#printing).

**Kraft is the one that inverts the template's ground**, and it is why the desk and bar tokens are separate groups: `--on-desk` goes dark for the page foot while `--bar-ink` stays light one element away. Its desk is kept dark enough to clear 3:1 against the sheet, because below that the sheet stops reading as a sheet lying on a desk and the whole conceit falls apart.

**Contrast.** Every palette was measured against the same bar as the default, all at 4.5:1 or better: body type on the sheet, the small mono date and label type, type sitting over the highlighter, and every piece of type in the sticky bar. The highlighter itself, the availability dot and the sheet's edge against the desk were checked at 3:1 or better, so the marks still read as marks. If you edit a palette yourself, re-check those pairs.

**The picker on the demo is not in your download.** The dock in the corner of the online demo is preview scaffolding that lives in a file the zip does not contain. Your copy has the palettes without it, which is the right way round: nobody's CV should carry a theme switcher.

## Printing

`@page` is A4 with no browser margin: the sheet's own padding is the page margin, so print and Resume mode are the same layout from the same tokens. The print stylesheet does not depend on the on-screen mode, so `Cmd/Ctrl+P` produces the same one-page CV whether the visitor is looking at the web layout or the résumé layout, and it works without JavaScript too. The Download PDF button just calls `window.print()`.

**Print is also independent of the palette**, deliberately. A CV gets printed, and a printed CV is ink on white whatever the screen is doing: the print stylesheet forces a white page and black body type, drops the highlighter, and hides the desk entirely. On top of that, one rule at the very end of the `ALTERNATE PALETTES` block pins the document's own tokens back to their defaults under `@media print`, so a CV set to Claret or Kraft still prints as ink on white.

That rule has to stay **below** the palette blocks. `:root[data-palette]` and `:root[data-palette="moss"]` have identical specificity, so source order is the only thing making it win; move it above them and an alternate palette will print in its own colours. If you strip the file back to a single palette, you can drop the rule with the rest (your one remaining palette *is* the default), but there is no cost to leaving it.

## Smooth Scrolling

Lenis is wired in and optional. Remove the CDN tag, the `initLenis` helper at the top of `script.js` and its one call to drop it. It shares GSAP's ticker with ScrollTrigger, never runs under reduced motion, and can be turned off with `data-smooth="off"` on `<html>` or `?smooth=off` in the URL.

## Accessibility

- The mode toggle is a real pressed-state control (`aria-pressed`) with a live region announcing the change.
- Expandable roles use `aria-expanded` and `aria-controls` on real buttons.
- Every interaction is reachable and operable by keyboard, with a visible focus ring.
- `prefers-reduced-motion` gets the same layouts with no tweens: the mode switch applies instantly and the highlighters are pre-drawn. Nothing is hidden or unreachable.
- Without JavaScript the page reads as a complete document, with every role's detail already open. Only the toggle and the two bar buttons, which need JS, are hidden.

## Customisation Notes

- **Colour**: one token block at the top of `style.css`, split into desk and sheet groups; see [Colour](#colour). The desk and the highlighter carry the identity, so change `--desk`, `--sheet` and `--mark` first.
- **Type**: `--font-display` (Bricolage Grotesque), `--font-body` (Literata), `--font-mono` (Azeret Mono). Update the Google Fonts link when you swap them.
- **Scale**: `--scale` multiplies the sheet's type sizes, so you can tune the density of each mode from one value.
- **Sections are independent**: the script skips any section it cannot find, so delete what you do not need.

## Dependencies

- GSAP 3.15.0 (core)
- ScrollTrigger
- Flip
- Lenis 1.3.17 (optional)
