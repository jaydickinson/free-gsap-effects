# Parallax Hero

A pinned hero that separates its background image, copy, and foreground card into distinct scroll depths from one scrubbed ScrollTrigger.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add the hero to your `<body>`:**

```html
<section class="hero" data-parallax data-parallax-runway="620">
  <!-- Background image: hangs back -->
  <div class="layer layer--backdrop" data-parallax-speed="0.2" data-parallax-scale="1.12" aria-hidden="true">
    <img src="your-photo.jpg" alt="">
  </div>

  <!-- Your normal hero copy -->
  <div class="layer layer--copy" data-parallax-speed="0.82">
    <h1>Wake up to the tide</h1>
    <p>Your lede.</p>
    <a class="button" href="#book">Check availability</a>
  </div>

  <!-- Anything that should come toward the viewer -->
  <div class="layer layer--front" data-parallax-speed="1.3">
    <aside class="rate-card">From £180 / night</aside>
  </div>
</section>
```

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

The script discovers every `[data-parallax]` scene, builds one scrubbed timeline for its layers, pins it for the configured runway, and then releases it.

## Using It With Your Own Design

The effect makes no demands on how the hero looks. It only needs two things:

1. **A positioning context.** The scene is `position: relative; overflow: clip`, and each layer is `position: absolute; inset: 0` inside it so the layers stack.
2. **A `data-parallax-speed` on anything you want to move.** That is the whole API. The element can be an image wrapper, a `<div>` holding your existing headline markup, a card, an SVG — the script never looks at what is inside it.

To reskin the demo, keep the four `.layer` wrappers and replace their contents. Nothing in `script.js` refers to `.hero`, `.rate-card`, or any other class name in `style.css`.

Two rules worth keeping:

- **Overscan the layers that paint something.** A background image that travels 176px will drag its edge into view unless the layer extends past the scene. The demo gives `.layer--backdrop` and `.layer--glow` `inset: -12%`. Layers that only carry content stay at `inset: 0`, otherwise the padding you lay that content out with starts off-screen.
- **Put interactive content back in the flow.** `.layer` sets `pointer-events: none` so the stacked layers do not block each other; the demo restores `pointer-events: auto` on `.copy-column` and `.rate-card` so links and buttons still work.

## Options

| Attribute | Values | Default | Description |
|---|---:|---:|---|
| `data-parallax` | marker | required | Identifies a parallax scene |
| `data-parallax-speed` | number | `1` | Controls relative depth. Below `1` lags into the background; above `1` advances into the foreground |
| `data-parallax-x` | pixels | unchanged | Optional horizontal travel; automatically reduced on mobile |
| `data-parallax-rotate` | degrees | unchanged | Optional ending rotation; automatically reduced on mobile |
| `data-parallax-scale` | number | unchanged | Optional ending scale for a layer |
| `data-parallax-blur` | pixels | unchanged | Optional ending blur amount, entered without `px` |
| `data-parallax-opacity` | `0`–`1` | unchanged | Optional ending opacity for a layer |
| `data-parallax-distance` | pixels | `236` | Desktop translation multiplier for the scene |
| `data-parallax-mobile-distance` | pixels | `128` | Translation multiplier at `768px` and below |
| `data-parallax-runway` | pixels | `560` | Desktop pinned scroll distance |
| `data-parallax-mobile-runway` | pixels | `340` | Mobile pinned scroll distance |
| `data-parallax-progress` | marker | optional | Displays timeline progress from `000` to `100` |
| `data-parallax-fill` | marker | optional | Scales a progress line from left to right |

Invalid or omitted speeds fall back to `1`, which leaves the layer at the page's base speed.

## Choosing Layer Speeds

- `0.15–0.35`: the background image or a large distant field
- `0.4–0.65`: atmosphere, texture, a light wash
- `0.7–0.9`: the headline and primary copy
- `1`: follows the scene without additional y travel
- `1.1–1.25`: labels and interface details
- `1.3–1.5`: foreground cards, frames, or objects

Keep the deepest and nearest values far apart so the separation develops clearly across the pinned runway. The demo uses `0.2 / 0.55 / 0.82 / 1.3`.

## Examples

### Add a Focus Pull to the Background Image

**Add inside your `[data-parallax]` scene:**

```html
<div
  class="layer layer--backdrop"
  data-parallax-speed="0.2"
  data-parallax-scale="1.12"
  data-parallax-blur="5"
  data-parallax-opacity="0.8"
  aria-hidden="true"
>
  <img src="your-photo.jpg" alt="">
</div>
```

Decorative images should use an empty `alt` attribute. The layer moves, expands, softens, and dims from the same scrubbed progress, so the photograph recedes as the copy travels over it.

### Add a Scroll Meter

**Add inside your `[data-parallax]` scene:**

```html
<div class="scroll-meter" aria-hidden="true">
  <span class="scroll-meter__track"><span data-parallax-fill></span></span>
  <span><span data-parallax-progress>000</span>%</span>
</div>
```

`[data-parallax-fill]` is scaled from `scaleX(0)` to `scaleX(1)` and `[data-parallax-progress]` counts `000`–`100`, both on the same timeline. Both are optional; omit them and the script skips them.

### Disable Lenis

If Lenis is loaded but a page should use native scrolling, set the option on `<html>`:

```html
<html data-smooth="off">
```

You can also append `?smooth=off` to the URL. The ScrollTrigger effect works with or without Lenis.

## How It Works

A scene gets one GSAP timeline whose ScrollTrigger starts at `top top`, pins the hero, and ends after the selected runway. For each layer, the y destination is calculated as `(1 - speed) × distance`. A `0.2` background therefore drifts down while a `1.3` foreground card travels up, creating visible separation across a deliberate but still self-contained hero sequence.

Horizontal travel, rotation, scale, blur, and opacity attributes are added to the same tween, as are the optional scroll meter responses, so every element stays synchronized, scrubbed, and reversible. `invalidateOnRefresh` recalculates the runway after layout changes.

## Composition Notes

- Give moving layers enough overscan to prevent an edge appearing during travel.
- Keep semantic content such as the headline in normal heading markup even when it is absolutely layered.
- Set decorative layers to `aria-hidden="true"`.
- A page can contain multiple independent `[data-parallax]` scenes, but a hero normally needs only one.

## Accessibility

- **Reduced motion:** the JavaScript `gsap.matchMedia` branch creates no pin or animation. CSS removes transforms, filters, and transitions so the complete layered hero remains visible as a strong static composition.
- **No JavaScript:** all layers are visible in their designed starting state; no content depends on JavaScript to be revealed.
- **Keyboard:** the effect is scroll-driven and introduces no custom controls or keyboard traps. Links inside layers keep their focus styles because only the layer wrapper is `pointer-events: none`.
- **Semantics:** keep meaningful copy outside `aria-hidden` decorative layers and connect the scene to its heading with `aria-labelledby`.

## Cleanup

The script stores its GSAP context on `window.gsapContext` for SPA use. Calling `window.gsapContext.revert()` removes the scene timelines and ScrollTriggers. On page unload, the script also removes the Lenis ticker callback and ScrollTrigger refresh listener before destroying Lenis.

## Performance Notes

- Translation and scale remain compositor-friendly.
- Blur is optional because large filtered layers can be expensive on low-power devices.
- One ScrollTrigger coordinates every layer in a scene.
- Mobile defaults reduce both travel and pin distance while preserving the same depth order.

## Dependencies

**Required:**

- GSAP 3.12+
- ScrollTrigger

**Optional:**

- Lenis 1.x for smooth scrolling. If present, the script runs Lenis from GSAP's ticker so both systems share one clock.
