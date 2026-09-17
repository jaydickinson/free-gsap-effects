# Collapsible Sidebar Menu

A sidebar navigation column with collapsible sections. Sections open on a measured height tween, chevrons rotate with the state, and a slim indicator rail slides down the left edge to sit against the current link.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- Sections open on a measured pixel height, never a `height: auto` jump
- Panels return to `height: auto` once open, so they reflow with the viewport
- Chevrons rotate through the state with their own tween
- Indicator rail follows the current link and hides when its section is closed
- One section open at a time, with a `data-multi` opt-out for stacking
- Real buttons with `aria-expanded`, plus arrow, Home and End key navigation
- Panels stay open with JavaScript off, so nothing is hidden from a crawler
- Light and dark themes, both complete, on one `data-variant` attribute

## Quick Start

```html
<link rel="stylesheet" href="assets/style.css">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

Copy the `.docs-sidebar` block from `index.html`. The script finds its two roots by id (`docsSidebar` and `sidebarNav`) plus the rail by id (`accRail`), so keep those or update the selectors at the top of `assets/script.js`. Inside them it works off classes: `.acc-section`, `.acc-trigger`, `.acc-panel`, `.acc-chevron`, `.acc-label` and `.acc-link`. Mark the current page with `class="acc-link is-active"`; a section starts open when it carries `data-open="true"`.

Allow several sections open at once with one attribute:

```html
<aside class="docs-sidebar" id="docsSidebar" data-multi="true">
```

**Demo furniture.** The fixed toolbar strip at the top of `index.html` (its markup, its CSS and its inline script), the `.stage` wrapper that centres the column on the grey ground, and the `min-height` that holds the column at a fixed height are the demo, not the component. Delete them and drop `.docs-sidebar` into your own layout; nothing in `assets/script.js` reads any of it.

## Themes

The component ships in two themes, `light` (the default) and `dark`: one design at two sets of token values.

**Pick one**: set the attribute on `<body>` in the demo, or on the component's own root in your page.

```html
<body data-variant="dark">
```

The demo's toolbar toggle and the `?variant=dark` URL parameter only set this attribute; neither is part of the component.

**Re-value it for your own brand**: each `body[data-variant="…"]` block in `assets/style.css` sets the whole list, so a rebrand is editing values in two places and nothing else:

| Token | What it colours |
|---|---|
| `--ground`, `--ground-2` | the demo ground and the toolbar strip |
| `--raised` | the column's own surface |
| `--hover` | trigger and link hover |
| `--ink`, `--ink-2`, `--ink-3` | primary, secondary and muted text |
| `--line` | the column's hairline border |
| `--accent`, `--accent-ink` | the indicator rail, the focus ring, `::selection` |
| `--trigger-ink`, `--trigger-ink-open` | section header label, closed and open |
| `--link-ink`, `--link-ink-active` | links, and the current one |
| `--rail` | the indicator rail |
| `--radius`, `--radius-sm` | the column, and the rows inside it |
| `--shadow` | the column's elevation |

`--trigger-ink` and `--trigger-ink-open` are read by `assets/script.js` at the moment the tween runs, so give them literal colour values rather than `var()` references. Nothing in the script reads the theme name.

## Keyboard and ARIA

- Each section header is a real `<button>` inside an `<h2>`, carrying `aria-expanded` and `aria-controls` pointing at its panel, so assistive technology gets the open state for free.
- <kbd>Enter</kbd> / <kbd>Space</kbd> toggle the focused section (native button behaviour).
- <kbd>Down</kbd> and <kbd>Up</kbd> move focus between section headers and wrap; <kbd>Home</kbd> and <kbd>End</kbd> jump to the first and last.
- <kbd>Tab</kbd> moves through the headers and the links of open sections in document order; links inside a collapsed panel are still in the tab order unless you hide them, so collapse is a visual state, not a focus trap.
- The current link carries `aria-current="page"`; clicking another link moves it, and the rail follows.
- Focus is shown by a 2px accent outline on every interactive element.

## How It Works

**Measured height, not auto.** Opening a section reads the panel's current `offsetHeight`, flips it to `height: auto` to measure the natural height, restores the starting value and then tweens between the two numbers. On completion an open panel is set back to `auto` so it reflows if the viewport or the content changes. Nothing ever tweens toward the string `auto`, which is what produces the jump most accordions ship with.

**The sliding rail.** The rail keeps `left: 0` in CSS and takes its entire offset from a measurement: `y` and `height` come from the current link's rectangle relative to the nav, so a CSS offset can never be added on top of the measured one. It re-measures on the height tween's `onUpdate`, on `resize`, and on `document.fonts.ready`, and fades out when the current link's section is collapsed.

**Theme-aware label colour.** The header label colour is tweened, so it lands as an inline style. The values come from the `--trigger-ink` / `--trigger-ink-open` custom properties, read at the moment the tween runs, and they are re-read on `resize` (which the demo's toggle dispatches) so a theme change never leaves a label on a stale colour.

## Customisation

- Colours, radii and shadows live in `assets/style.css` as custom properties on each `body[data-variant]` block; the accent is `#ff4d00`.
- Rail width and shape: the `.acc-rail` rule. Keep `left: 0`, or the measured offset is applied twice.
- Column width and height: `.docs-sidebar` (264px wide in the demo).
- Open and close easing: the `gsap.to` calls in `setSection` in `assets/script.js`.
- Reduced motion sets the duration multiplier `T` to `0`, so every state change lands instantly.

## Requirements

- GSAP 3.12+ (demo uses 3.15.0), core only, no plugins
- No build step, no framework
