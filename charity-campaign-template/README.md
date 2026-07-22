# Charity Campaign Template: "Brenna Rivers Trust"

A complete, deployable one-page appeal for a charity campaign, written as a river-restoration trust. Static files, no build step, no backend.

The page argues the way a good small charity argues: with measurements. A placard hero with a live raised-so-far counter, the problem in figures, a before/after photograph pair you wipe between, donation tiers priced in metres of bank and tonnes of gravel, work party dates, and a donation form that words out exactly what an amount buys.

**The signature is the comparator.** Two photographs of the same kind of river fill one frame; a draggable divider styled as a river gauge board clips between them. Drag it, arrow-key it, or swipe it on a phone; a vertical swipe on the board still scrolls the page, because the drag only commits once a touch gesture is clearly horizontal.

---

## Quick Start

1. Copy the whole folder onto your host. It is plain HTML, CSS, JS and WebP; anything that serves static files will do.
2. Replace the campaign copy and figures in `index.html`. Every number on the page is plain markup: the counter, the stats, the tier prices, the work party dates.
3. Replace the photographs in `assets/img/` (see **Images** below).
4. Repaint the three colours at the top of `assets/style.css` if you want a different palette (see **Palette**).
5. Wire the donation form's submit to your payment provider (see **The donation form**).

There is nothing to install and nothing to compile.

---

## Editing the campaign

Everything a visitor reads lives in `index.html`:

- **The counter.** The raised figure and donor count are `data-count` spans: the text content is the final value shown without JavaScript, and `data-count-to` is the value the count-up animates to. Keep the two in agreement. The progress bar's width is an inline `style="width: 69%"`; set it to `raised / target`.
- **The stats band.** Each stat is a `<dt>` figure and a `<dd>` caption. `data-count-to` takes decimals via `data-count-decimals="1"`. A figure without `data-count` (the zero) simply never animates.
- **Tier cards.** Each card's button carries `data-give="25"`; clicking it scrolls to the form and preselects that amount. Amounts that match a form preset select the radio; anything else fills the Other field.
- **Work parties.** Each row is a list item with a mono date, a task, a places note and a mailto link. Mark a full date by adding the `party--full` class and swapping the link for the `party-full-note` span, as the December row shows.

Sections are independent: the script skips any section it does not find, so delete whole `<section>` blocks freely.

---

## The comparator

```html
<div class="comp" data-comparator data-comp-start="46">
```

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `data-comp-start` | `0`–`100` | `46` | Where the divider rests: the percentage of the frame showing the *before* photograph |

The divider position is one number, and everything renders from it: the clip on the before pane, the board's `left`, and the slider's `aria-valuenow`.

**Input behaviour:**

| Input | What happens |
|---|---|
| Drag the board (mouse or pen) | The wipe follows the pointer |
| Click anywhere on the frame | The divider animates to the click |
| Horizontal swipe (touch) | The wipe follows the finger |
| Vertical swipe, even starting on the board (touch) | The page scrolls; the divider does not move |
| Arrow keys | ±4. `Page Up` / `Page Down` ±20, `Home` / `End` to the extremes |

The touch rules are deliberate: a touch press commits nothing, and the drag only starts scrubbing once the gesture is more horizontal than vertical. Coordinates are read from the raw event (null-safe) rather than GSAP's cached pointer, which reads `0` when the browser reclaims a gesture for scrolling.

**Inertia (optional).** Add one script tag next to the others and the board glides to a stop after a flick; without it the board simply stays where it is released:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/InertiaPlugin.min.js"></script>
```

**Swapping the photographs.** The pair must read as the same kind of subject (same scale, similar horizon) or the wipe reads as two unrelated pictures. Replace `comp-before.webp` and `comp-after.webp` (1600×900), update the `alt` text and the two `figcaption` tags, and keep both `<figure>` blocks: without JavaScript they render stacked with their labels, which is the fallback.

**Without JavaScript** the comparator is a labelled stacked pair and the drag instruction swaps for a caption describing it. **Under reduced motion** the comparator stays fully draggable, because it is a control rather than decoration, and only the intro sweep and the surrounding animation are dropped.

---

## The donation form

The form is a front end. It validates, words the outcome, confirms, and tells the visitor nothing has been charged, because it is not connected to a payment provider until you connect one.

- **The outcome line** ("£25 fences and plants 4 metres of bank") is computed by `TIER_MATH` at the top of `assets/script.js`: an array of bands, each with the minimum amount it applies from, a unit cost, and a function that words the outcome. Edit the costs and wording to match your charity's real arithmetic; the point of the line is that it is true.
- **Wiring the submit.** Find the `on(form, 'submit', ...)` handler in `initGiveForm` and replace its confirmation body with a redirect or `fetch()` to your provider: Stripe Payment Links, JustGiving, GoCardless for the monthly option, or your own endpoint. The helper `amount()` returns the chosen amount as a number, and the `freq` radios distinguish one-off from monthly.
- **Gift Aid.** The checkbox is a declaration only; pass its state to your provider or CRM. If your charity is not UK-registered, delete the label.

---

## Palette

Three hues; everything else is one of them at another value or opacity. The tokens live at the top of `assets/style.css` with their measured contrast table in the comment above them:

```css
--river: #14584A;         /* the ground */
--river-deep: #0E463A;    /* recessed bands, and ink on chalk */
--river-lift: #1B6355;    /* raised cards */
--chalk: #EFEBDC;         /* type on green; the donate panel */
--chalk-deep: #E2DCC7;    /* chalk's second value: wells, hover fills */
--water: #8AD6C2;         /* the one accent, rationed to small labels and rules */

--river-rgb: 20, 88, 74;
--chalk-rgb: 239, 235, 220;
--water-rgb: 138, 214, 194;
--ink-rgb: 14, 70, 58;
```

Every translucent value in the stylesheet resolves from the `--*-rgb` triples, so a reskin is an edit to the hex values and their matching triples; nothing else holds a colour. If you change them, re-measure the pairs listed in the comment: the header documents which combinations were measured and where the floors are.

---

## Images

The photographs are **bundled, optimised WebP derivatives** with the template's cool viridian grade baked into the pixels, not original Unsplash files. `assets/img-manifest.json` records each source URL, output size, and grade.

- **To swap a photo:** replace the file in `assets/img/` with your own (same dimensions), or edit the `src` in the manifest and regenerate.
- **To regenerate the set** (from the GSAP Vault repo): `bun scripts/build-template-assets.ts charity-campaign-template --force`. The script downloads each source, applies the crop and grade, and emits WebP into `assets/img/`.
- Keep a `background-color` beneath full-bleed images (already in the CSS) so text never sits on nothing while they load.

Original photography, via Unsplash:

- Before (silted river): https://unsplash.com/photos/debris-and-tree-stumps-in-muddy-water-with-forest-background-Sqrbqx5Ya0g
- After (restored meadow stream): https://unsplash.com/photos/a-winding-stream-flows-through-a-grassy-meadow-cSUpOHhzjh8
- Work party: https://unsplash.com/photos/volunteers-collecting-trash-along-a-riverbank-tX-A7eBc45Q
- Planting: https://unsplash.com/photos/gloved-hands-planting-seedling-in-soil-CbZh3kaPxrE
- Gravel riffle: https://unsplash.com/photos/a-stream-of-water-surrounded-by-rocks-and-grass-H6IORFX4A14

---

## Accessibility

- The comparator divider is a real `role="slider"` with `aria-valuenow`, `aria-valuemin/max`, and an `aria-valuetext` that reports how much of the restored view is shown. Its keydown handler implements the full slider keyboard contract.
- Every campaign figure is present in the markup at its final value, so nothing depends on the count-ups running.
- Reveal states are gated behind an `html.has-js` class that is only added once GSAP is confirmed present: a blocked CDN leaves a fully readable page.
- Reduced motion is honoured twice, by a CSS media query and a `gsap.matchMedia` branch, and leaves a complete static page with the comparator still operable.
- The donation form uses real labels, fieldsets and legends; the outcome line and the confirmation are polite live regions.
- Focus is always visible: water outlines on green grounds, ink outlines on the chalk panel.
- A skip link jumps straight to the donation form.

## Browser Support

Modern browsers (ES5 syntax, CSS `clip-path`, `inset`, custom properties). Not compatible with IE11.

## Dependencies

- GSAP 3.12+ (core)
- ScrollTrigger plugin (reveals and count-ups; the page stays fully readable without it)
- Draggable plugin (the comparator drag; keyboard and click still work without it)
- InertiaPlugin (optional: the board glides after a flick; not loaded by default)
- Lenis (optional: smooth scrolling; the page works without it)
