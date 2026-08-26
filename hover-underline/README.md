# Hover Underline

Three GSAP-powered underline materials for semantic links: an exit-through line, a marker sweep, and a hand-drawn wave. Each activation also coordinates the link colour and horizontal offset; grouped links can update a small active index.

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
```

The script injects all decorative spans and SVG markup automatically.

## Options

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-underline` | `slide`, `fill`, `wave` | `slide` | Selects the exit-through line, marker sweep, or hand-drawn wave |
| `data-underline-color` | Any CSS colour | `--hu-color` / site accent | Sets the underline and active text colour for one link |
| `data-underline-stage` | Present or absent | Absent | Groups links so a new active item settles the previous one and can drive an index |
| `data-active-index` | Present or absent | Absent | Marks an optional visual counter inside the nearest underline stage |

All three original `data-underline` values are preserved.

## Examples

### Standalone Links

**Add to your HTML `<body>`:**

```html
<nav aria-label="Sections">
  <a href="/work" data-underline>Work</a>
  <a href="/studio" data-underline="fill" data-underline-color="#ff6b2c">Studio</a>
  <a href="/contact" data-underline="wave" data-underline-color="#22d3ee">Contact</a>
</nav>
```

### Chasing Programme Index

The stage integration is optional. It lets focus or pointer movement settle the previously active link before playing the next treatment.

**Add to your HTML `<body>`:**

```html
<section data-underline-stage>
  <nav aria-label="Programme">
    <a href="/after-dark" data-underline="slide" data-underline-color="#c8ff00">After Dark</a>
    <a href="/radio-body" data-underline="fill" data-underline-color="#ff6b2c">Radio Body</a>
    <a href="/soft-riot" data-underline="wave" data-underline-color="#22d3ee">Soft Riot</a>
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
| `.is-active` | Added to a `data-underline-stage` while one link is active |

Each treatment reads `--hu-color`. A stage also receives `--active-color`, which can style borders, counters, or other small response elements.

## Accessibility

- Real `<a>` elements retain native link and keyboard behaviour.
- `focus` and `blur` mirror `mouseenter` and `mouseleave`.
- Touch or pen `pointerdown` plays the treatment; focused links remain active until blur.
- `:focus-visible` should remain clearly styled in your CSS.
- Injected decoration is marked `aria-hidden="true"`.
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
