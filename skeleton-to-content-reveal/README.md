# Skeleton Loader

Shimmering placeholders that crossfade into real content with a stagger, each card's height tweening from the placeholder shape to the content it loaded.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, every colour and size a plain CSS custom property
- `assets/script.js`: readable, commented source with an `onReady` guard

- Placeholder blocks shimmer on `background-position`, so no CSS transform can collide with a GSAP tween
- Card height tweens from the measured placeholder height to the measured content height
- Content crossfades and rises while the height morph is still running
- Cards resolve on a stagger so the panel settles instead of snapping
- The border flashes the accent once as each card lands, read from a token, never a literal
- Optional `.sk-photo` images fade in on their own `load` event, whatever order they arrive in
- With JavaScript off the real content is simply the page, no placeholders and no blank state
- `window.skeletonReveal.reveal / reset` for your own fetch code

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<script>document.documentElement.className += ' has-js';</script>
<link rel="stylesheet" href="assets/style.css">
```

That one inline line is what keeps a no-JavaScript visitor out of a permanent loading state: every pre-hidden rule in the stylesheet is scoped to `.has-js`.

**2. Add to your `<body>`:**

Copy the `<section class="sk-feed">` block out of `index.html`. Each card is one `<article class="sk-card">` holding a `.sk-skeleton` and a `.sk-content`. Add or remove cards freely, group them however your layout wants (the demo has a row of three tiles and a list of five rows); the script counts every `.sk-card` inside the feed and staggers whatever it finds. The only id it needs is `skFeed`, plus `skStatus` if you want the live region.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

**4. Drive it from your own fetch:**

```js
fetch('/api/accounts')
  .then(function (r) { return r.json(); })
  .then(function (data) {
    paintCards(data);                 // your own render into the .sk-content blocks
    window.skeletonReveal.reveal();   // then resolve the placeholders
  });

// back to placeholders, for a refresh or a new query
window.skeletonReveal.reset();
```

Set `AUTO_SECONDS` in `assets/script.js` to `Infinity` once your fetch owns the timing, or leave it as a safety net. The demo's Reload control is wired to nothing but `window.skeletonReveal.reset()`.

## Using It With Your Own Design

What the component actually requires:

- A card element with `position: relative` and `overflow: hidden`, holding exactly one `.sk-skeleton` and one `.sk-content`.
- The `.has-js` gate. Without it, no-JavaScript visitors see placeholders that never resolve.
- The `.has-js .sk-content` rule that positions the content absolutely, and the `.is-live` rule that returns it to the flow. The script only toggles that class; the positioning is CSS.
- Nothing in your CSS may set a `transform` on the card, the content or an optional `.sk-photo`. GSAP animates `height`, `opacity` and `y` on those, and a CSS transform is parsed into the same values and fights them.
- If a card sits in a grid, give the track `align-items: start`. A stretched card is taller than its own placeholder, and the height morph measures the card it is given.

**Demo furniture.** The toolbar strip across the top of `index.html` (the prompt, the Reload button and the Light/Dark toggle) and the `.stage` / `.stage__inner` wrapper that centres the panel on the grey ground are the demo page only. None of it ships in what you drop in; delete both and put `.sk-feed` wherever your own layout wants it.

Everything else in the demo is dressing you can replace: the stat tiles, the avatar initials, the meta line. The placeholder blocks are just divs with `.sk-block`, so make them any shape you like, because the height morph measures whatever you build rather than assuming a size.

## How It Works

**The height morph is measured, not guessed.** While the placeholder still owns the layout the script reads three numbers: the card's own height, the placeholder's height and the content's height. The target is `cardHeight - skeletonHeight + contentHeight`, which cancels the card's padding out of the sum, so no padding value is ever read or assumed. GSAP tweens `height` between those two numbers and the card ends on a cleared inline height, back to `auto`.

**Crossfade, not swap.** The content sits absolutely positioned at the top of the card while the placeholder is in flow, so both exist and both can be measured at once. The placeholder fades out, the content fades and rises in on an overlapping tween, and only when the card has landed does the content become a static in-flow block and the placeholder get `display: none`.

**The shimmer never fights GSAP.** The sweep is a CSS animation on `background-position` across an oversized linear gradient, not a translated highlight element. Nothing in the stylesheet sets a transform on anything GSAP later animates.

**Photos on their own clock.** A card may carry an `img.sk-photo`; if it does, it starts at zero opacity and is faded in from its own `load` event, or immediately if the browser already has it cached. A slow image therefore delays only itself, never the card it sits in. A card without one is left alone.

## Themes

The component ships in two themes, `light` and `dark`, which are one design at two token values. Pick one by setting the attribute on `<body>` in the demo, or on the component's own root in your page:

```html
<body data-variant="dark">
```

Nothing else changes: same markup, same script, same timings. The demo's toolbar toggle and the `?variant=dark` URL parameter only set that attribute.

Every colour, radius and shadow the component uses is a custom property defined in both `body[data-variant="light"]` and `body[data-variant="dark"]` in `assets/style.css`:

`--ground`, `--ground-2`, `--raised`, `--hover`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-strong`, `--accent`, `--accent-ink`, `--shadow`, `--font`, `--radius`, `--radius-sm`, `--card-bg`, `--card-line`, `--card-flash`, `--card-radius`, `--card-pad`, `--sk-block`, `--sk-shine`, `--sk-radius`, `--avatar-bg`, `--avatar-fg`.

To wear your own brand, re-value that list in both blocks; there is no selector to override. The script reads `--card-flash` and `--card-line` with `getComputedStyle` at the moment the landing flash starts, so a theme swap mid-demo is correct on the very next reveal, and no theme name is ever read in JavaScript.

## Customisation

| Property | Where | Default (light) | Description |
|----------|-------|-----------------|-------------|
| `--card-bg` | `style.css` | `#fbfbfa` | Card ground |
| `--card-line` | `style.css` | `rgba(20, 20, 18, 0.12)` | Card border, and the colour the flash returns to |
| `--card-flash` | `style.css` | `#00b8a9` | Border colour flashed once as a card lands |
| `--card-radius` | `style.css` | `10px` | Card corner radius |
| `--card-pad` | `style.css` | `14px` | Card padding, and the inset the absolute content uses |
| `--sk-block` | `style.css` | `#e6e6e3` | Placeholder block base colour |
| `--sk-shine` | `style.css` | `#f0f0ed` | The lighter band that sweeps across it |
| `--sk-radius` | `style.css` | `4px` | Placeholder block corner radius |
| `--avatar-bg` / `--avatar-fg` | `style.css` | `#e4e4e1` / `#141412` | The initials chip on a resolved row |
| `AUTO_SECONDS` | `script.js` | `0.6` | Delay before the reveal starts on its own |
| `STAGGER` | `script.js` | `0.09` | Gap between one card resolving and the next |

The shimmer speed is the `1.6s` in the `.sk-block` animation shorthand. Easings and durations are the `gsap.to` calls in `cardTimeline`.

## Keyboard and ARIA contract

The component is a loading state, not a control: it takes no focus and has no keys of its own, so it never interrupts the tab order of the page it lands in.

- `.sk-feed` carries `aria-busy="true"` while placeholders are showing and `aria-busy="false"` once the content has landed, and an `aria-label` naming what is loading.
- A `role="status"` `aria-live="polite"` line (`#skStatus`) announces "Loading 8 items…" and then "8 items loaded.", so the change is spoken rather than only seen.
- Placeholders are `aria-hidden="true"`, so a screen reader is never read a list of empty boxes.
- Decorative avatar initials are `aria-hidden="true"`; the account name beside them is the real text.
- Under `prefers-reduced-motion: reduce` every duration and the stagger collapse to zero and the shimmer animation is switched off, so the content simply appears.
- With JavaScript off the real content is in the flow and fully visible; the placeholders are never shown at all.
- The demo's toolbar buttons are real buttons with visible `:focus-visible` outlines in the accent.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- No build step, no framework
