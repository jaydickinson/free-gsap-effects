# Hover Underline

Four GSAP-powered underline materials for semantic links: an exit-through line, a marker sweep, a hand-drawn wave, and a travelling wave that keeps rolling for as long as the link is held. Each activation also coordinates the link colour and horizontal offset; grouped links can update a small active index.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="path/to/script.js"></script>
```

**3. Add `data-underline` to semantic links in your `<body>`:**

```html
<a href="/events/night" data-underline="slide">After Dark</a>
<a href="/events/radio" data-underline="fill">Radio Body</a>
<a href="/events/riot" data-underline="wave">Soft Riot</a>
<a href="/events/long" data-underline="travel">Long Wave</a>
```

The script injects all decorative spans and SVG markup automatically.

## Options

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-underline` | `slide`, `fill`, `wave`, `travel` | `slide` | Selects the exit-through line, marker sweep, hand-drawn wave, or travelling wave |
| `data-underline-color` | Any CSS colour | `--hu-color` / site accent | Sets the underline and active text colour for one link |
| `data-underline-stage` | Present or absent | Absent | Groups links so a new active item settles the previous one and can drive an index |
| `data-active-index` | Present or absent | Absent | Marks an optional visual counter inside the nearest underline stage |

`slide`, `fill` and `wave` draw once and settle. `travel` is the only one that keeps moving: it loops until the pointer leaves or the link loses focus.

## Examples

### Standalone Links

**Add to your HTML `<body>`:**

```html
<nav aria-label="Sections">
  <a href="/work" data-underline>Work</a>
  <a href="/studio" data-underline="fill" data-underline-color="#b8532a">Studio</a>
  <a href="/contact" data-underline="wave" data-underline-color="#37675a">Contact</a>
  <a href="/notes" data-underline="travel" data-underline-color="#6d4a7e">Notes</a>
</nav>
```

### Chasing Programme Index

The stage integration is optional. It lets focus or pointer movement settle the previously active link before playing the next treatment.

**Add to your HTML `<body>`:**

```html
<section data-underline-stage>
  <nav aria-label="Programme">
    <a href="/after-dark" data-underline="slide" data-underline-color="#2f5bd7">After Dark</a>
    <a href="/radio-body" data-underline="fill" data-underline-color="#b8532a">Radio Body</a>
    <a href="/soft-riot" data-underline="wave" data-underline-color="#37675a">Soft Riot</a>
    <a href="/long-wave" data-underline="travel" data-underline-color="#6d4a7e">Long Wave</a>
  </nav>

  <p aria-hidden="true"><span data-active-index>01</span>/03</p>
</section>
```

Keep the index decorative (`aria-hidden="true"`) when it only repeats the link position. The anchors remain the accessible navigation.

## CSS Hooks

| Class | Description |
|---|---|
| `.hu-ready` | Added while the animated enhancement is active |
| `.hu-line` | Clipped shell for the exit-through line |
| `.hu-line__track` | Solid line that travels through the shell |
| `.hu-fill` | Irregular marker underline |
| `.hu-wave` | Inline SVG wave |
| `.hu-travel` | Clipping rail for the travelling wave; its `overflow: hidden` is what hides the loop's seam |
| `.is-active` | Added to a `data-underline-stage` while one link is active |

Each treatment reads `--hu-color`. A stage also receives `--active-color`, which can style borders, counters, or other small response elements.

## Accessibility

- Real `<a>` elements retain native link and keyboard behaviour.
- `focus` and `blur` mirror `mouseenter` and `mouseleave`.
- Touch or pen `pointerdown` plays the treatment; focused links remain active until blur.
- `:focus-visible` should remain clearly styled in your CSS.
- Injected decoration is marked `aria-hidden="true"`.
- The `travel` loop runs only while a link is hovered or focused, so nothing moves on an idle page.
- With `prefers-reduced-motion: reduce`, JavaScript skips animation and CSS shows static coloured underlines.
- Without JavaScript, ordinary CSS text decoration remains visible; only `.hu-ready` removes it during enhancement.

## Cleanup

The GSAP context is exposed for SPA teardown.

**Add to your JavaScript when unmounting the view:**

```javascript
window.gsapContext.revert();
```

Reverting removes every pointer and focus listener, clears touch timers, kills active tweens, removes injected decoration, and restores stage/index state.

## Dependencies

- GSAP 3.12+ core
- No GSAP plugins
- Modern browser with ES6 support
