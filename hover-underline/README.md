# Hover Underline

Animated link underlines with three variants: an exit-through slide, a marker-style fill sweep, and a hand-drawn SVG wave. The script injects all decoration elements, so you only add one data attribute to plain links.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add before closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="path/to/script.js"></script>
```

**3. Add `data-underline` to any link:**

```html
<!-- Slide (default): grows from the left, exits through the right -->
<a href="/work" data-underline>Work</a>

<!-- Fill: highlight sweeps up behind the text like a marker -->
<a href="/about" data-underline="fill">About</a>

<!-- Wave: SVG underline draws in with a springy settle -->
<a href="/contact" data-underline="wave">Contact</a>
```

That is all the markup you need. The underline span (or SVG) is injected automatically.

## Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-underline` | `slide`, `fill`, `wave` | `slide` | Which underline variant to use. An empty value falls back to `slide` |
| `data-underline-color` | Any CSS colour | Accent colour from CSS | Per-link colour override for the underline, fill, or wave |

## Examples

### Navigation Row

**HTML:**
```html
<nav>
  <a href="/work" data-underline>Work</a>
  <a href="/studio" data-underline>Studio</a>
  <a href="/journal" data-underline="wave">Journal</a>
</nav>
```

### Inline Links in Body Copy

**HTML:**
```html
<p>
  Read the <a href="/guide" data-underline>full guide</a> or jump straight to
  the <a href="/examples" data-underline="fill">examples</a>.
</p>
```

### Custom Colour

**HTML:**
```html
<a href="/pricing" data-underline="wave" data-underline-color="#22d3ee">Pricing</a>
```

## CSS Classes

These are created by the script; you can restyle them in your own CSS.

| Class | Description |
|-------|-------------|
| `.hu-line` | Injected slide underline (position, thickness, colour) |
| `.hu-fill` | Injected marker highlight behind the text |
| `.hu-wave` | Injected SVG wave underline |

The colour of all three reads from the `--hu-color` custom property, falling back to your accent colour. `data-underline-color` sets `--hu-color` on the individual link.

## How the Exit-Through Slide Works

The slide variant never plays the enter animation in reverse. On `mouseenter` the transform-origin is set to the left edge and the line scales from 0 to 1, so it grows out of the left. On `mouseleave` the origin swaps to the right edge before scaling back to 0, so the line appears to continue travelling and exit through the right. The wave variant uses the same idea with `strokeDashoffset`: entering animates the offset to 0, leaving pushes it past zero so the line keeps moving in the same direction.

## Accessibility

- **Keyboard parity**: every `mouseenter`/`mouseleave` handler is also bound to `focus`/`blur`, so tabbing through links plays exactly the same animations as hovering
- **Focus visible**: links get a visible `:focus-visible` outline in the accent colour
- **Reduced motion**: with `prefers-reduced-motion: reduce`, no decoration is injected and no JavaScript animation runs; links get a plain static CSS underline instead
- **Semantic HTML**: the effect only targets real `<a>` elements, and injected decorations are marked `aria-hidden="true"` so screen readers ignore them

### Reduced Motion Behavior

When `prefers-reduced-motion: reduce` is set:
- The JavaScript skips setup entirely
- Links show a plain 2px static underline via CSS
- `data-underline-color` still applies to the static underline through `--hu-color`

## Programmatic Control

The GSAP context is exposed for SPA teardown. Add this to your own JavaScript:

**JavaScript:**
```javascript
// Revert all animations and remove listeners plus injected elements
window.gsapContext.revert();
```

## Browser Support

Modern browsers (ES6+). Not compatible with IE11.

## Dependencies

**Required:**
- GSAP 3.12+ (core only, no plugins)
