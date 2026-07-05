# Parallax Hero

A layered hero section where elements move at different speeds while scrolling, creating depth with a single scrubbed ScrollTrigger per container.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add before closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

**3. Add the effect HTML anywhere in your `<body>`:**

```html
<section class="parallax-hero" data-parallax>
  <div class="parallax-layer" data-parallax-speed="0.2">
    <!-- Slow background: gradient shapes, textures -->
  </div>
  <div class="parallax-layer" data-parallax-speed="0.7" data-parallax-fade>
    <h1>Your Headline</h1>
  </div>
  <div class="parallax-layer" data-parallax-speed="1.3">
    <!-- Fast foreground: badges, labels -->
  </div>
</section>
```

That is the whole setup. The script finds every `[data-parallax]` container, collects its `[data-parallax-speed]` layers, and wires up one scrubbed ScrollTrigger per container.

## Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-parallax` | (none, marker) | required | Marks a container as a parallax scene. One ScrollTrigger is created per container |
| `data-parallax-speed` | Any number | `1` | Layer speed relative to the scroll. `1` tracks the scroll exactly, values below `1` lag behind (background), values above `1` race ahead (foreground) |
| `data-parallax-fade` | (none, marker) | off | Fades the layer out (opacity and visibility) as the container leaves the top of the viewport |

### Choosing speed values

The layer's vertical shift is proportional to `(1 - speed)`, so the further a value sits from `1`, the more the layer separates from the page:

- `0.2` deep background, barely moves
- `0.5` mid background, clearly lags
- `0.9` near-normal, subtle drift
- `1` moves with the page (no parallax)
- `1.3` foreground, moves faster than the scroll

## Examples

### Minimal Two-Layer Hero

**HTML:**
```html
<section class="parallax-hero" data-parallax>
  <div class="parallax-layer" data-parallax-speed="0.3">
    <div class="hero-blob hero-blob--violet"></div>
  </div>
  <div class="parallax-layer" data-parallax-speed="0.8">
    <h1>Depth Without Images</h1>
  </div>
</section>
```

### Headline That Fades On Exit

**HTML:**
```html
<div class="parallax-layer" data-parallax-speed="0.7" data-parallax-fade>
  <h1>Fades as the hero leaves the viewport</h1>
</div>
```

### Multiple Scenes On One Page

Each `data-parallax` container is independent, so you can repeat the pattern for section headers further down the page:

**HTML:**
```html
<section class="parallax-hero" data-parallax>...</section>

<section class="parallax-hero" data-parallax>
  <div class="parallax-layer" data-parallax-speed="0.4">
    <div class="hero-grid"></div>
  </div>
  <div class="parallax-layer" data-parallax-speed="1.1">
    <h2>Second Scene</h2>
  </div>
</section>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.parallax-hero` | The scene container: sets height, `overflow: clip`, and background |
| `.parallax-layer` | Absolutely positioned layer that fills the hero, with `will-change: transform` |
| `.hero-blob` | Pure CSS radial-gradient shape for background depth |
| `.hero-grid` | Faint dot grid layer, masked to the center of the hero |
| `.hero-strip` | Foreground label strip (JetBrains Mono, pill-shaped) |

Layers use `inset: -12% 0` so they overscan the container vertically; this hides the edges that would otherwise be revealed as layers shift. If you use aggressive speeds (below `0.2` or above `1.5`), increase the overscan to match.

## How It Works

Each container gets one GSAP timeline with `scrub: true`, running from `clamp(top bottom)` to `clamp(bottom top)`, so timeline progress maps to the container's full journey through the viewport. Every layer receives a `fromTo` tween on `yPercent` between `-(1 - speed) * 50` and `(1 - speed) * 50`. The `clamp()` wrapper prevents a visual jump when the hero is already on screen at load, and `invalidateOnRefresh` recalculates on resize.

## Accessibility

- **Reduced motion**: respects `prefers-reduced-motion`. The `gsap.matchMedia` reduce branch pins every layer at `yPercent: 0` with full opacity, and a CSS rule enforces `transform: none` on layers, so all content stays visible and static
- **No interaction required**: the effect is purely scroll-driven, so there are no hover or keyboard traps
- **Decorative layers**: mark purely visual layers (blobs, grids) with `aria-hidden="true"` so screen readers skip them, as the demo does
- **Content order**: keep the headline layer as real heading markup (`<h1>`/`<h2>`) so the document outline survives the visual layering

## Performance Notes

- Only `yPercent` (a transform) and `autoAlpha` are animated, so all work stays on the compositor
- `will-change: transform` and `force3D: true` promote layers to their own GPU layers
- One ScrollTrigger per container, regardless of layer count

## Browser Support

Modern browsers (ES6+). Not compatible with IE11.

## Dependencies

**Required:**
- GSAP 3.12+
- ScrollTrigger plugin

**Optional:**
- Lenis (smooth scroll integration; the script auto-detects it and the effect works without it)
