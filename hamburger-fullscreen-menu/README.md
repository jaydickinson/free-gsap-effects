# Fullscreen Hamburger Menu

A hamburger button that morphs into an X while a full-screen overlay menu wipes in from the top and its links stagger up behind it.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- Button morphs to an X: two bars rotate to a cross, the middle one scales out
- Overlay wipes in on an animated clip-path inset, not opacity, so the links behind it are already laid out
- Menu links stagger up from below on the panel's own timeline, the small secondary column a beat later
- Escape, the X, and a link click all close it
- Focus moves to the first link on open, is trapped in the panel while it is open, and returns to the button on close
- The page behind is locked on `<html>` and `<body>` while the menu is open, and the scroll position is restored on close
- Menu links live in the DOM at all times, so they survive with JavaScript off
- Reduced motion collapses every duration to an instant state change

## Quick Start

**1. Add to your `<head>`:**

```html
<link rel="stylesheet" href="assets/style.css">
```

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

**3. Copy the `.site-bar` header and the `.menu-overlay` nav from `index.html` into your page.**

The script finds its two roots by id (`menuToggle` and `fullscreenMenu`) on load, so keep the ids or update the two selectors at the top of `assets/script.js`. Everything else it needs is found inside those two elements: `[data-line]` for the three bars, `.menu-item a` for the staggered links, `.menu-foot a` for the small secondary column. `.menu-body` is only the layout wrapper that puts the list and that column side by side; drop it if you want the column underneath.

Nothing else on the demo page is part of the component. The toolbar strip at the top and the `Subscribe` button in the bar are demo furniture: the bar is there because a hamburger has to live in one, and the button is there to show a real header's second control. Leave both behind.

## Keyboard & Accessibility

| Key | What it does |
|-----|--------------|
| `Enter` / `Space` on the button | Opens the menu, then closes it: the button is the X |
| `Escape` | Closes the menu, focus returns to the button |
| `Tab` / `Shift+Tab` | Cycles through the panel's links and the button while open, and cannot leave them |

- The button carries `aria-expanded`, `aria-controls` and an `aria-label` that flips between "Open menu" and "Close menu"; the panel is a `<nav aria-label="Main">` holding a real list of links.
- Opening moves focus to the first link, so a keyboard user is inside the menu rather than behind it, and closing hands focus back to the button.
- The page behind is locked while the menu is open. `<html>` is locked as well as `<body>`, because `<body>`'s overflow only reaches the viewport while `<html>`'s own overflow is `visible`; the scroll offset is captured on open and restored on close, and the scrollbar's width is compensated so the layout does not shift sideways.
- `prefers-reduced-motion: reduce` sets the duration multiplier to zero: the same open and closed states, reached instantly. The component is never disabled.

## How It Works

**The wipe.** The overlay starts at `clipPath: inset(0% 0% 100% 0%)`, set by GSAP rather than CSS so nothing fights the tween, and opens to `inset(0% 0% 0% 0%)` on `power3.out`. Because the panel is clipped rather than faded, the links behind it are already laid out and simply get revealed. Closing removes the `is-open` class in the timeline's `onComplete`, so a finished panel is `visibility: hidden` and never left covering the page.

**The morph.** The three bars are absolutely positioned with margin offsets, never a CSS transform, so GSAP owns `rotation`, `y` and `scaleX` outright. Opening tweens the outer pair to plus and minus 45 degrees and scales the middle bar to zero. The open colour is read from the `--burger-ink-open` custom property at the call site, and the inline colour is cleared on close, so a theme change needs no JavaScript.

**Focus and keyboard.** Opening moves focus to the first link. A `keydown` handler cycles Tab and Shift+Tab through the panel's focusable elements plus the button itself, which is the X, so focus cannot escape to the page behind. Escape closes, and closing returns focus to the button with `aria-expanded` flipped back to `false`.

## Themes

The menu ships in two themes, `light` (the default) and `dark`: one design at two sets of token values. Pick one by setting the attribute on `<body>`, or on your own wrapper around the bar and the panel:

```html
<body data-variant="dark">
```

Nothing else changes: same markup, same script, and no theme name is ever read in JavaScript. The demo's toolbar toggle and the `?variant=dark` URL parameter only set that attribute.

Every colour, radius and border weight the component uses is a custom property in the `body[data-variant="light"]` and `body[data-variant="dark"]` blocks at the top of `assets/style.css`:

`--bar-line`, `--bar-h`, `--burger-ink`, `--burger-ink-open`, `--burger-h`, `--menu-bg`, `--menu-ink`, `--menu-index`, `--menu-hover`, `--menu-line`, `--menu-foot-ink`, `--cta-bg`, `--cta-ink`, `--radius-btn`, `--border-w`, `--focus-ring`.

Most of them resolve from a small ground scale in the same blocks (`--ground`, `--ground-2`, `--raised`, `--hover`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-strong`, `--accent`, `--accent-strong`, `--accent-ink`, `--font`, `--radius`, `--radius-sm`), so matching your own site usually means re-valuing those and nothing else. The accent has one job here: the X the button morphs into, the link hover colour, the focus ring and `::selection`. `--accent-strong` is the same red darkened enough to carry white text at 4.5:1, which the plain accent does not.

To add a third theme, copy either block, rename the attribute value, and change the properties. No selector override is ever needed.

## Customisation

- Link stagger: the `stagger` value on the `links` tween in `openMenu`.
- Wipe direction: change the `clipPath` inset edge, for example `inset(100% 0% 0% 0%)` to wipe up from the bottom or `inset(0% 100% 0% 0%)` to wipe in from the right.
- Link size: `font-size` on `.menu-item a` is a `clamp()`, so it scales with the viewport between 1.6rem and 2.75rem.
- Durations and easing are the `gsap.timeline` calls in `assets/script.js`; every duration is multiplied by `T`, which is `0` under `prefers-reduced-motion`.
- Colours live in `assets/style.css` as custom properties per theme (list above).

## Requirements

- GSAP 3.12+ (demo uses 3.15.0), core only, no plugins
- No build step, no framework
