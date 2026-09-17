# Progress Stepper

Numbered steps joined by a track whose fill tweens to the active step, with completed nodes flipping their number into a drawn checkmark.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, every colour and size a plain CSS custom property
- `assets/script.js`: readable, commented source with an `onReady` guard

- Track fill tweens to the active step in whichever axis the layout is using
- Completed nodes flip on `rotationX` from number to a stroke-drawn checkmark
- The active node pulses once on arrival
- Click any completed node to jump back; steps ahead are disabled
- Rail measured from first node centre to last, so any node size works
- Compact vertical layout under 600px, remeasured on resize
- `window.stepProgress.goTo / next / back` for your own form code

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="assets/style.css">
```

**2. Add to your `<body>`:**

Copy the `<nav class="stepper">` block and the `<p class="stepper-status">` line out of `index.html` (everything else on that page is demo furniture). Add or remove `<li class="step">` items freely: the script counts them, and the rail and the fill percentages follow. The ids it needs are `stepper`, `stepperRail`, `stepperFill`, `stepperList` and `stepperStatus`.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

**4. Drive it from your form:**

```js
// after the step-one fields validate
window.stepProgress.next();

// or jump straight to a step, zero-based
window.stepProgress.goTo(2);

// current index
console.log(window.stepProgress.index);
```

The demo's Continue and Back buttons are only wired to those same calls, so delete them once your own form owns the flow.

## How It Works

**A measured rail, not a padded one.** The rail is positioned from the centre of the first node to the centre of the last with `getBoundingClientRect`, so it never pokes past the end nodes whatever their size, gap or label width. It is remeasured on load, after web fonts land, on resize and whenever the theme changes.

**One fill, two axes.** The fill is a child of the rail. Horizontally GSAP tweens its `width` to a percentage of the step index; below 600px the same call tweens `height` instead, and the unused axis is pinned to 100% so rotating the layout never leaves a stale dimension behind.

**Flipping a number into a check.** The number and the checkmark sit stacked inside the node with `backface-visibility: hidden` and a `perspective` on the parent. Completing a step rotates the number out on `rotationX`, rotates the check in, and tweens the check path's `strokeDashoffset` from its measured length to zero so the tick draws itself. No DrawSVG plugin. Jumping back plays the same flip in reverse and clears the inline colours GSAP set.

**Reachable means focusable.** Every node is a real `<button>`. Steps ahead of the current one carry `disabled` plus `pointer-events: none`, so they are skipped by keyboard navigation and cannot swallow a click; completed steps stay live and jump the flow back.

## Themes

The indicator ships in two themes, `light` (the default) and `dark`: one design at two token values. Pick one with an attribute:

```html
<body data-variant="dark">
```

In your own app the attribute can sit on any wrapper around the component instead of on `<body>`; nothing in the script ever reads it.

Both themes define the same short list of custom properties in `assets/style.css`, so re-valuing them for your own brand is one block:

| Group | Properties |
|-------|-----------|
| Ground (demo only) | `--ground`, `--ground-2`, `--raised`, `--hover`, `--line`, `--line-strong`, `--shadow` |
| Ink | `--ink`, `--ink-2`, `--ink-3` |
| Accent | `--accent`, `--accent-ink`, `--accent-text`, `--accent-wash` |
| Nodes | `--node-size`, `--node-radius`, `--node-bg`, `--node-line`, `--node-fg`, `--node-active-bg`, `--node-active-line`, `--node-active-fg`, `--node-done-bg`, `--node-done-line`, `--node-done-fg` |
| Rail | `--track-w`, `--track-bg`, `--fill-bg` |
| Labels | `--label-fg`, `--label-active-fg`, `--label-done-fg`, `--label-weight`, `--label-size` |

Point `--accent` at your own brand colour and the fill, the active node, the completed nodes and the focus ring all follow. Keep `--node-done-bg` and `--node-done-line` as solid colour values: the script reads them with `getComputedStyle` at the moment the flip tween starts, so a theme swap is correct on the next move without a colour ever being hard-coded in JS.

**Demo furniture.** The toolbar strip at the top of `index.html`, the `.stage` / `.stage__inner` wrapper that centres the component on the grey ground, and the Back / Continue pair in `.demo-controls` are the demo, not the component. Delete them; the component is the `<nav class="stepper">` block, the `.stepper-status` line and `assets/script.js`.

## Customisation

| Property | Where | Default (light) | Description |
|----------|-------|-----------------|-------------|
| `--node-size` | `style.css` | `32px` | Node diameter; the rail re-measures itself around it |
| `--node-radius` | `style.css` | `9999px` | Node corner radius; set it to `6px` for square nodes |
| `--node-done-bg` | `style.css` | `#2563eb` | Fill a node tweens to when it completes |
| `--node-active-line` | `style.css` | `var(--accent)` | Border of the step you are on |
| `--track-w` | `style.css` | `2px` | Rail thickness, in both orientations |
| `--fill-bg` | `style.css` | `var(--accent)` | The progress fill colour |
| `--label-*` | `style.css` | see block | Label size, weight and colour per state |
| `VERTICAL_QUERY` | `script.js` | `(max-width: 600px)` | Where the layout stacks; keep it in step with the CSS media query |

Easings and durations are the `gsap.to` / `gsap.fromTo` calls in `assets/script.js`. The checkmark shape is the `d` attribute of `.step-check-path` in `index.html`; change it and the draw still works, because each path's length is measured at runtime.

## Accessibility

- Every node is a real `<button>`, so the whole indicator is keyboard operable with Tab and Enter; nothing relies on hover.
- Steps ahead of the current one are `disabled`, which keeps them out of the tab order, and `.step-node:disabled` sets `pointer-events: none` so a disabled node never absorbs a press.
- The active node carries `aria-current="step"`, and a `role="status"` line announces "Step 2 of 5: Bank account" on every change.
- Each node has a visually hidden full name ("Step 2, Bank account"), so the visible label under it is `aria-hidden` and nothing is read twice.
- Under `prefers-reduced-motion: reduce` every duration collapses to zero and the pulse is skipped: the states still change in order, they just do not animate.
- Focus is visible on the nodes and the demo controls via `:focus-visible` outlines.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- No build step, no framework
