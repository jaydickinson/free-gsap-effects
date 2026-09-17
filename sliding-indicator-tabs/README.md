# Animated Tabs

Content tabs whose indicator slides and stretches between tabs, panels that change in the direction you are travelling, and a panel box that morphs between heights so nothing below the component jumps.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- The indicator is measured from each tab's own `offsetLeft` / `offsetWidth`, so a two-word label and a one-word label both get an indicator the exact width of the tab
- Panels change directionally: the outgoing panel leaves the way you are travelling, the incoming one arrives from the other side a frame later
- The panel box tweens between panel heights, so switching to a shorter panel never snaps the content below it
- A soft hover pill follows the pointer across the strip, gated to `hover: hover` pointers so a tap cannot pin it open
- Re-measures on `resize`, on `document.fonts.ready` and after a theme change, so an indicator is never left sitting off its tab
- An overflowing tab list scrolls sideways with a faded edge, and activating a tab scrolls it into view
- Roles: `tablist`, `tab` with `aria-selected` and `aria-controls`, `tabpanel` with `aria-labelledby`, and a roving `tabindex`

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

**3. Copy the component markup from `index.html` into your page.**

The skeleton the script looks for:

```html
<section class="tabs" data-tabs data-style="underline">
  <div class="tabs__strip">
    <div class="tabs__scroller">
      <div class="tabs__list" role="tablist" aria-label="Sections">
        <span class="tabs__hover" aria-hidden="true"></span>
        <span class="tabs__indicator" aria-hidden="true"></span>

        <button class="tabs__tab" type="button" role="tab" id="tab-one" data-tab="one"
                aria-controls="panel-one" aria-selected="true" tabindex="0">One</button>
        <!-- …more tabs -->
      </div>
    </div>
  </div>

  <div class="tabs__panels">
    <div class="tabs__panel" role="tabpanel" id="panel-one" aria-labelledby="tab-one" tabindex="0">…</div>
    <!-- …more panels, each with the hidden attribute -->
  </div>
</section>
```

What matters:

- `[data-tabs]` on the root, `[role="tablist"]` for the strip, `[role="tab"]` for each tab, and each tab's `aria-controls` pointing at its panel's `id`. Everything is found through those, so the class names can be renamed in the CSS.
- `.tabs__indicator` is optional in the sense that the tabs work without it, but it is the whole point. Give it no CSS `transform` and no CSS `left`: the script positions it with `x`, and an offset in both places doubles it.
- `.tabs__hover` is optional; delete it and the pointer highlight simply does not exist.
- `.tabs__strip` and `.tabs__scroller` are only needed if the list can overflow. Keep both if it might: the scroller does the scrolling and the strip carries the edge fades.
- The panels are absolutely stacked inside `.tabs__panels`, which is what lets the box tween between heights. Give exactly one panel no `hidden` attribute; the script hides the rest on load.

Options on the root:

| Attribute | Values | Default | What it does |
|-----------|--------|---------|--------------|
| `data-style` | `underline`, `pill` | `underline` | Underline bar, or a filled sliding segment at tab scale |
| `data-tabs-hash` | present / absent | absent | Syncs `location.hash` with each tab's `data-tab`, and reads it on load |
| `data-tab` (on a tab) | any slug | — | The tab's key, used for the hash and for `select()` |

Changing `data-style` at runtime changes the strip's padding, so follow it with a `resize` event or a `slidingTabs.refresh()` call and the indicator re-measures.

The variant switcher, the style switcher and the `.stage` wrapper in `index.html` are demo furniture, not part of the component; leave them behind.

## Keyboard & Accessibility

| Key | What it does |
|-----|--------------|
| `Tab` | Moves into the tab strip, landing on the selected tab only (roving tabindex), then on into the panel |
| `Arrow Right` / `Arrow Left` | Moves to the next or previous tab and selects it, wrapping at both ends |
| `Home` / `End` | Selects the first or last tab |
| `Enter` / `Space` | Selects the focused tab (native button behaviour) |

- Roles and state: `role="tablist"` with an `aria-label`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with `aria-labelledby`. Inactive panels carry the `hidden` attribute, so they are out of the accessibility tree and out of the tab order entirely; the active panel is focusable with `tabindex="0"` and anything focusable inside it is reachable as normal.
- Activation is **automatic**: an arrow key selects as it moves, which is the WAI-ARIA default for tabs whose panels are already in the page. Focus follows selection, so a screen reader announces the panel change.
- `prefers-reduced-motion: reduce`: the same end states with every duration at zero. The indicator, the panel and the box height land in one frame; nothing is disabled and nothing is hidden.
- Hover styling is gated behind `hover: hover`, so a tap on a phone cannot leave a tab looking hovered.
- The tab strip scrolls sideways only, so it carries **no** `data-lenis-prevent`: that attribute has no axis check and would hand the vertical wheel back to the browser for as long as the pointer sat over the strip.

## How It Works

**The indicator.** Each tab's position is read as `offsetLeft` / `offsetWidth` against the tab list, never `getBoundingClientRect()`, so a page zoom cannot come back multiplied and land the indicator at a multiple of its own offset. `gsap.to` then tweens the indicator's `x` and `width` to those numbers with `power3.out` over 340ms. Everything measured re-runs on `resize`, on `document.fonts.ready` (a webfont changes every tab width when it lands) and on the theme change the demo's toggle dispatches.

**The panel change.** The panels are absolutely stacked, so both can be on screen at once. A change tweens three things on one beat: the indicator leads, the box tweens to the new panel's height, and 80ms later the incoming panel slides 24px in from the side you came from while the outgoing one leaves the other way. The outgoing panel takes its `hidden` attribute back in the tween's `onComplete` and is reset to `x: 0, opacity: 1` there, so a transparent panel is never left covering the live one and the next measurement is not taken through a half-finished tween.

**The heights.** A hidden panel has no height to measure, so the measure pass removes the `hidden` attribute with `visibility: hidden` set, reads `offsetHeight`, and puts both back. Without that the box collapses to zero on the first change.

**Reduced motion and pointers.** `gsap.matchMedia` uses complementary condition pairs on both axes (`hover`/`pointer` and motion), so every device matches something: a set that only names fine pointers leaves a coarse-pointer phone matching nothing and the component never initialises at all.

## Events

The root dispatches a bubbling `tabchange` after every change:

```js
document.querySelector('[data-tabs]').addEventListener('tabchange', (event) => {
  const { id, index, previousIndex, tab, panel } = event.detail;
  console.log(`moved to ${id} (${previousIndex} -> ${index})`);
});
```

## Programmatic Control

```js
window.slidingTabs.select('files');   // by data-tab, or by index
window.slidingTabs.refresh();         // re-measure after you change layout yourself
window.slidingTabs.destroy();         // removes listeners and reverts the GSAP context
```

`destroy()` calls `ctx.revert()`, never `ctx.kill()`: `kill()` drops the context without running its cleanup, leaving the listeners and the inline heights behind. It is the call to make on an SPA route change.

## Customisation

- **Colours** live in `assets/style.css` as custom properties per theme. `--accent` is the indicator, the badge and the focus ring; `--accent-ink` is the text on it (keep the pair above 4.5:1).
- **Timings and easing** are the `DURATION` object at the top of `assets/script.js`. `SLIDE` is how far the panels travel, in pixels; much past 32 and the change stops reading as one move.
- **The indicator's shape** is `.tabs__indicator` in the underline block and in the `[data-style="pill"]` block. Height, radius and inset are all CSS; the script only supplies `x` and `width`.
- **Density**: tabs are 42px in the underline style and 34px in the pill style, on an 8px rhythm.

## Themes

Ships in two themes, `light` (the default) and `dark`: one design at two token values.

```html
<body data-variant="dark">
```

Nothing else changes: same markup, same script, and no theme name is ever read in JavaScript. The demo's toggle and the `?variant=dark` URL parameter only set that attribute.

To re-value it for your own brand, change the custom properties in the `body[data-variant="light"]` and `body[data-variant="dark"]` blocks at the top of `assets/style.css`: `--ground`, `--ground-2`, `--raised`, `--hover`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-strong`, `--accent`, `--accent-ink`, `--shadow` and the three radii. Every colour the component uses is one of those, so a rebrand never needs a selector override. Give text a solid colour rather than a translucent one, or a contrast checker cannot measure it.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- No build step, no framework
