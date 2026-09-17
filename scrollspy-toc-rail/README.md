# Scrollspy Table of Contents

Sticky table of contents beside a long document, with a marker that slides to the section in view and a reading-progress line down the rail.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- One ScrollTrigger per section, so the active entry changes at reading position rather than at the viewport edge
- Marker slides on measured offsets, so labels can wrap to any height
- Reading-progress line scrubbed across the whole article
- Clicking an entry scrolls with ScrollToPlugin and moves focus to that section
- Re-measures after web fonts load and on resize, then refreshes ScrollTrigger
- Works with no JavaScript: the entries are plain anchors and still jump
- Reduced motion keeps every state change but drops the travel time to zero

## Quick Start

```html
<link rel="stylesheet" href="assets/style.css">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollToPlugin.min.js"></script>
<script src="assets/script.js"></script>
```

Copy the `.toc-rail` nav and the `.toc-layout` grid from `index.html`. The script finds `tocRail`, `tocMarker`, `tocProgress` and `tocArticle` by id on load, so keep those ids or update the selectors at the top of `assets/script.js`.

The rail's structure is the whole contract: every `.toc-link` is an anchor whose `href` points at the id of one section in the article. The script builds its section list from those hrefs, so adding, removing or reordering entries needs no JavaScript change, and a link pointing at nothing is skipped rather than throwing.

**Demo furniture.** The strip across the top of `index.html` (the prompt, the rail-side buttons and the Light/Dark toggle) is demo-only: its markup, CSS and script live in `index.html` and never in the two shipped assets. The webhooks article is furniture too, in the sense that it is there for the rail to read; replace it with your own content and keep the section ids the entries point at.

## Keyboard and ARIA

- The rail is a `<nav>` with `aria-label="On this page"` and an ordinary list of anchors, so a screen reader announces it as a named navigation landmark and reads the entry count.
- Tab moves through the entries in document order. Enter or Space activates one, exactly as for any link; the visible focus ring is the accent at 2px with a 2px offset.
- Activating an entry scrolls the page and then moves the keyboard caret to the destination section (`tabindex="-1"` plus `focus({ preventScroll: true })`), so the next Tab continues from the section that was jumped to rather than from the rail.
- The marker, the track and the progress line are `aria-hidden`, because they duplicate the state already carried by the active entry.
- With JavaScript blocked, the entries are still anchors to in-page ids and still jump.

## How It Works

**One trigger per section.** Each section gets a ScrollTrigger whose start and end sit on a band a third of the way down the viewport. `onToggle` fires when that band is inside the section, which is what makes the rail change at reading position instead of when a heading first appears at the bottom of the screen.

**A measured marker.** The marker carries no CSS transform and keeps `top: 0`, so the `y` GSAP tweens is the entire offset. Each move measures the target link against the rail with `getBoundingClientRect` and tweens both `y` and `height`, which means a label that wraps to two lines gets a taller marker rather than a misaligned one. A CSS `top` or margin on the marker would be added to the measurement and double it.

**Progress and clicks.** A single scrubbed ScrollTrigger over the article sets the progress line's `scaleY` from its own `progress` value, so the fill is exact rather than interpolated from the active section. Clicking an entry cancels the default jump and hands the scroll to ScrollToPlugin with an offset for the sticky header, then focuses the destination section so a keyboard user carries on from there.

## Themes

The component ships in two themes, `light` (the default) and `dark`: one design at two sets of token values. Every colour, radius, rule width and marker shape the rail and the page around it use is a CSS custom property, and each theme is one block in `assets/style.css`, so the script is identical across both and reads no theme name.

**Pick one**: set the attribute on `<body>` in the demo, or on the element that wraps the rail and the article in your own page.

```html
<body data-variant="dark">
```

Leaving the attribute off gives you `light`. The demo's toggle and the `?variant=dark` URL parameter only set this attribute; neither is part of the component.

**Re-value it for your brand**: the token list is short and lives at the top of `assets/style.css`.

| Token | What it colours |
|-------|-----------------|
| `--ground`, `--ground-2`, `--raised`, `--hover` | the page and the surfaces on it |
| `--ink`, `--ink-2`, `--ink-3` | headings and the active entry, body copy, the rail label and resting entries |
| `--line`, `--line-strong` | hairlines |
| `--accent`, `--accent-ink` | the marker, the focus ring and `::selection` |
| `--track`, `--progress` | the unread rule and the read portion of it |
| `--marker`, `--marker-w`, `--marker-radius`, `--track-w` | the marker's colour, width and shape, and the rule's width |
| `--link-fg`, `--link-fg-active` | the two entry states |
| `--font`, `--radius`, `--radius-sm`, `--radius-xs` | the face and the corner radii |

Give text a solid colour rather than a translucent one, so contrast can be measured against the surface behind it. To add a third theme, copy either `body[data-variant="..."]` block, rename it and change the values; nothing in `assets/script.js` needs to change.

## Customisation

- **Rail side**: `data-rail-side="right"` on `.toc-layout` puts the rail on the far side of the document. Nothing measured changes, because the marker's offset is read from the rail rather than from the page.
- Reading band: the `start: 'top 32%'` and `end: 'bottom 32%'` pair on the per-section triggers. Move both together, or the bands overlap and two entries fight.
- Scroll offset on click: `offsetY: 60` in the ScrollToPlugin tween. Set it to the height of your fixed header.
- Scroll duration: `duration: 0.8` in the same tween, or drop the plugin entirely and call `section.scrollIntoView({ behavior: 'smooth' })`.
- Progress span: the `trigger: article` ScrollTrigger's `start` and `end`. Ending at `bottom 60%` fills the line as the last section reaches reading position rather than when the page bottoms out.
- Marker travel: `duration: 0.45` and `ease: 'power3.out'` in `setActive`.
- Reduced motion sets the duration multiplier `T` to `0`, so the marker jumps and the page scroll is instant.

## Requirements

- GSAP 3.12+ (demo uses 3.15.0), plus the ScrollTrigger and ScrollToPlugin plugins
- No build step, no framework
