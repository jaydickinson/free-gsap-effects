# FAQ Accordion

An accessible FAQ accordion: answers open to their natural height with the text rising a beat behind, a plus morphs into a minus, and in one-open mode the previous answer closes on the same timeline while the question you clicked stays still.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- Height-to-auto open and close, with the inline height cleared afterwards so a panel never keeps a stale pixel size
- The answer fades in and rises 6px a beat after its panel starts opening
- A plus built from two strokes: the vertical one rotates flat to make a minus, and the icon takes the accent colour
- One-open or many-open from one attribute, switchable at runtime; Expand all and Collapse all
- In one-open mode the clicked question is held still on screen while an answer above it closes
- Up, Down, Home and End move between questions; `#faq-<id>` links open and scroll to an item
- Closed answers stay in the DOM behind `hidden="until-found"`, so find-in-page still finds them
- WAI-ARIA accordion roles: a button inside a heading, `aria-expanded`, `aria-controls`, and a `region` labelled by its button

## Quick Start

**1. Add to your `<head>`:**

```html
<link rel="stylesheet" href="assets/style.css">
<script>document.documentElement.classList.add('has-js')</script>
```

The one-line script adds `.has-js` before the page paints, so closed answers are held shut from the first frame. Without it they flash open until the script runs.

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

**3. Copy the `<section class="faq" data-accordion>` block from `index.html` into your page.**

One item is:

```html
<div class="faq-item" id="faq-refunds" data-accordion-item>
  <h3 class="faq-q">
    <button class="faq-trigger" type="button" aria-expanded="false" data-accordion-trigger>
      <span class="faq-trigger__text">Can I get a refund?</span>
      <span class="faq-icon" aria-hidden="true">
        <span class="faq-icon__bar"></span>
        <span class="faq-icon__bar faq-icon__bar--v" data-accordion-icon-bar></span>
      </span>
    </button>
  </h3>
  <div class="faq-panel" data-accordion-panel>
    <div class="faq-answer" data-accordion-answer>
      <p>Annual plans cancelled within 14 days are refunded in full.</p>
    </div>
  </div>
</div>
```

The script looks for `data-` hooks only: `[data-accordion]` on the root, `[data-accordion-item]`, `[data-accordion-trigger]`, `[data-accordion-panel]`, and the optional `[data-accordion-answer]` (what fades and rises; the panel itself if absent), `[data-accordion-icon-bar]`, `[data-accordion-expand]` and `[data-accordion-collapse]`. Button and panel ids, `aria-controls`, `role="region"` and `aria-labelledby` are filled in from the item id if you leave them out, but writing them in the markup keeps it correct before the script runs.

Mark an item open by starting its button at `aria-expanded="true"` and giving the item `is-open`. Leave `hidden` off every panel in your markup: the script adds it to the closed ones, so a visitor without JavaScript still sees every answer.

**Heading levels.** The demo uses an `h1` for the block and `h2` for each question because the FAQ is the whole page. Inside an article, use the level that fits your outline, usually an `h2` for "Frequently asked questions" and `h3` for the questions. The script does not care which.

The 44px toolbar strip across the top of `index.html` (mode and theme buttons) and the `.stage` wrapper are demo furniture, not part of the component; leave them behind.

## Options

| Attribute / API | Where | What it does |
|-----------------|-------|--------------|
| `data-accordion-mode="single"` | root | One answer open at a time (the default when the attribute is missing) |
| `data-accordion-mode="multiple"` | root | Any number open. Changing the attribute at runtime back to `single` keeps the most recently opened answer and closes the rest |
| `id="faq-<id>"` | item | The deep-link target: `#faq-<id>` in the URL opens it on load and on `hashchange`, and scrolls to it |
| `--faq-scroll-offset` | CSS | Space left above an item a deep link scrolls to (a fixed header's height). Default `64px` |
| `accordion:toggle` | event on root | Fires on every open and close with `detail: { id, open }` |
| `root.accordion` | JS | `open(id)`, `close(id)`, `toggle(id)`, `expandAll()`, `collapseAll()` |

Expand all opens every item in either mode; in one-open mode the next single question you open then closes the others. Each bulk button is marked `aria-disabled="true"` when it has nothing to do (all open, or none open).

## Keyboard & Accessibility

| Key | What it does |
|-----|--------------|
| `Enter` / `Space` | Opens or closes the focused question |
| `ArrowDown` / `ArrowUp` | Moves focus to the next / previous question, wrapping at the ends |
| `Home` / `End` | Moves focus to the first / last question |
| `Tab` / `Shift+Tab` | Moves through the bulk buttons, the questions and any links in open answers |

- Roles: this is the WAI-ARIA accordion pattern. Each question is a native `<button>` inside a heading, carrying `aria-expanded` and `aria-controls`; each answer is a `role="region"` with `aria-labelledby` pointing at its button, so a screen reader announces "Can I get a refund?, collapsed, button" and names the region when you enter it.
- Closed answers carry `hidden`, so they are out of the tab order and the accessibility tree; a link inside a closed answer is never reached by Tab.
- The bulk buttons use `aria-disabled` rather than `disabled`, so a keyboard user who presses Collapse all keeps focus on the button instead of being dropped to the top of the page.
- A deep link that arrives by `hashchange` (a link in another answer, say) moves focus to that question's button, so keyboard and screen reader users land where they were sent.
- Every interactive part has a `:focus-visible` ring in the accent. Hover styles sit behind `@media (hover: hover)`, so nothing stays highlighted after a tap.
- `prefers-reduced-motion: reduce`: every duration drops to zero, so answers open and close instantly with the same end states. Nothing is disabled.
- Without JavaScript, every answer is shown and every icon reads as a minus.

### Why answers stay in the DOM

Closed answers are hidden, never removed or emptied. Where the browser supports it (Chromium today), they are hidden with `hidden="until-found"` rather than plain `hidden`. The difference matters for an FAQ: a visitor who presses Ctrl+F or Cmd+F and types "refund" finds the text inside a closed answer, the browser opens it and scrolls to the match, and the accordion hears the `beforematch` event and updates the button, the icon and its own state to agree. Search engines read the answers too, since they are in the markup. Browsers without `until-found` treat the value as ordinary `hidden`, so nothing breaks; find-in-page simply does not see closed answers there. A find-in-page reveal leaves other open answers alone, even in one-open mode, so the browser's scroll to the match is never undone by a panel collapsing above it.

## How It Works

**Opening to auto height.** Opening removes `hidden`, then `gsap.fromTo` tweens the panel's `height` from zero to `'auto'` with `clearProps: 'height'`, so the panel hands back to CSS the moment it lands and a later font or theme change can never leave it at a stale height. The answer inside is a separate tween from `opacity: 0, y: 6` starting a beat later, so the text arrives into space that is already opening. Closing fades the answer, collapses the panel, and sets `hidden` in `onComplete`, guarded so an item reopened mid-close is not hidden under the reader. The panel has no padding or border of its own for the same reason: under `until-found` a hidden panel keeps a box, and only an unpadded one collapses to zero.

**One open, no jump.** In one-open mode the closing and opening tweens are added to one `gsap.timeline` at time zero with the same `power2.inOut` ease, so the page's height moves by the difference only, never growing and then shrinking. If the answer closing sits above the question you clicked, the timeline's `onUpdate` measures that question's position every frame and `scrollBy`s the drift, which holds it under the pointer. Because it measures rather than predicts, it cooperates with the browser's own scroll anchoring instead of doubling it. A deep link opts out of the hold: there the reader asked to be taken somewhere.

**The icon.** Two 1.5px bars sit centred in a 16px box. GSAP rotates the vertical one to 90 degrees on open, flat onto the horizontal bar, and back to 0 on close; the colour change is a CSS transition keyed off `.is-open`. Neither bar has a CSS transform, because GSAP would read it back as the starting angle.

**Interruption.** Every open and close first calls `gsap.killTweensOf` on that item's panel, answer and icon bar and starts from the current height and opacity, so clicking a question again mid-tween reverses it smoothly. A pending one-open swap is completed before the next one starts.

## Customisation

- Timings are the constants at the top of `assets/script.js`: `OPEN_DURATION`, `CLOSE_DURATION`, `ANSWER_DELAY` and `ANSWER_RISE`.
- The swap ease is `'power2.inOut'` in `open()`; a lone open uses `'power2.out'` in `openTween()`.
- Row height and padding are on `.faq-trigger`; the answer's measure is `max-width: 62ch` on `.faq-answer p`.
- The soft hover is `--item-hover`; set it equal to `--raised` to turn it off.
- For a separated-cards look instead of one list, move the border, radius and background from `.faq-list` to `.faq-item` and add a gap.

## Themes

Two themes, `light` (the default) and `dark`: one design at two token values. Pick one with the attribute, on `<body>` or on the accordion root itself:

```html
<section class="faq" data-accordion data-variant="dark">
```

Nothing else changes: same markup, same script, and nothing in `assets/script.js` reads the theme name. The demo's toolbar toggle and the `?variant=dark` URL parameter only set that attribute on `<body>`.

Every colour, radius and shadow is a custom property in the two `data-variant` blocks at the top of `assets/style.css`:

| Group | Properties |
|-------|-----------|
| Ground and ink | `--ground`, `--ground-2`, `--raised`, `--hover`, `--ink`, `--ink-2`, `--ink-3` |
| Hairlines | `--line`, `--line-strong` |
| Accent | `--accent` (focus ring, open icon), `--accent-ink` (text on it), `--accent-text` (links) |
| The accordion | `--item-hover`, `--icon`, `--faq-scroll-offset` |
| Shape and type | `--font`, `--radius`, `--radius-sm`, `--shadow` |

To wear your own brand, re-value `--accent` and `--accent-text` (the accent as text, which needs 4.5:1 on `--raised`); to sit on your own surfaces, re-value `--raised`, `--item-hover` and `--line`. Keep text colours solid rather than translucent, or their contrast cannot be measured. The demo uses Mona Sans; `--font` takes any face.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- No build step, no framework
- `hidden="until-found"` is a progressive enhancement: supported browsers get searchable closed answers, others get plain `hidden`
