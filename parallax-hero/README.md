# Parallax Hero

A pinned hero that pulls its layers into depth from one scrubbed ScrollTrigger. The headline sits inside the stack rather than on top of it, so the near layers climb over it as you scroll, while the far layers sink and a sun sets behind the ridge. The demo ships two layer sets, ink silhouettes and photographs, driven by the same script.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add the hero to your `<body>`:**

```html
<section class="hero" data-parallax data-parallax-runway="720" data-parallax-pointer="1.6">
  <!-- Far: sinks. Negative speeds move against the scroll. -->
  <div class="layer" data-parallax-speed="-0.15" aria-hidden="true">
    <span class="sun"></span>
  </div>
  <div class="layer" data-parallax-speed="0.5" data-parallax-blur="3" aria-hidden="true">
    <svg class="ridge" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice">…</svg>
  </div>

  <!-- The headline, inside the stack -->
  <div class="layer layer--headline" data-parallax-speed="0.9">
    <h1>Higher ground.</h1>
  </div>

  <!-- Near: rises over the headline -->
  <div class="layer" data-parallax-speed="1.7" data-parallax-scale="1.06" aria-hidden="true">
    <svg class="ridge" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice">…</svg>
  </div>

  <!-- Whatever must stay readable, in front of everything -->
  <div class="layer layer--deck" data-parallax-speed="1.15">
    <p>Your lede.</p>
    <a href="#routes">See the route</a>
  </div>
</section>
```

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

The script discovers every `[data-parallax]` scene, builds one scrubbed timeline for its layers, pins it for the configured runway, and then releases it. With `data-parallax-pointer` set, fine-pointer devices also get a cursor drift from the same depth values.

## Using It With Your Own Design

The effect makes no demands on how the hero looks. It only needs two things:

1. **A positioning context.** The scene is `position: relative; overflow: clip`, and each layer is `position: absolute; inset: 0` inside it so the layers stack in source order.
2. **A `data-parallax-speed` on anything you want to move.** That is the whole API. The element can be an SVG, an image wrapper, a `<div>` holding your existing headline markup, a card, a gradient band; the script never looks at what is inside it.

Nothing in `script.js` refers to `.hero`, `.ridge`, `.tile`, or any other class name in `style.css`. To reskin the demo, keep the `.layer` wrappers and replace their contents.

**What is the demo's, and can go:**

- The ridge SVGs, the pine paths, the sun and the mist band are one layer set. The photograph, its wash and the two photo tiles are the other. Keep either, both, or neither; `style.css` shows which layers each `data-mode` value hides.
- The `Illustration / Photo` switch and the tiny inline script under `script.js` in `index.html` exist to show both sets in one demo. Delete them and the `data-mode` attribute together, or leave one set in the markup and drop the switch.
- The photographs in `assets/img/` are demo placeholders, baked for this demo. Replace them with your own.

**The CSS the effect depends on:**

- **Overscan the layers that paint to an edge.** A photograph that recedes and grows needs slack past the scene, or its travel and its ending scale drag an edge into view; the demo gives `.layer--photo` `inset: -24%`. The ridge SVGs solve the same problem differently: their fill runs on to twice the viewBox height and the SVG is `overflow: visible`, so a ridge that rises 180px never exposes the ground beneath its own foot. Layers that only carry content stay at `inset: 0`, otherwise the padding you lay that content out with starts off-screen.
- **Put interactive content back in the flow.** `.layer` sets `pointer-events: none` so the stacked layers do not block each other, and so the pointer drift reads the cursor over the whole scene; the demo restores `pointer-events: auto` on `.deck` so the link inside it still works.
- **Do not put the scroll's transform on the same element you transform in CSS.** The script owns `transform` on every `[data-parallax-speed]` element. Position a layer's contents with a child (`.sun`, `.tile`) rather than by transforming the layer itself.
- **Set `transform-origin` where the scale should grow from.** The near ridge scales from `50% 100%` so it grows upward; the photograph from `50% 55%` so it grows outward.

## Options

| Attribute | Values | Default | Description |
|---|---:|---:|---|
| `data-parallax` | marker | required | Identifies a parallax scene |
| `data-parallax-speed` | number | `1` | Controls relative depth. Below `1` lags into the background; above `1` advances into the foreground; below `0` moves against the scroll |
| `data-parallax-x` | pixels | unchanged | Optional horizontal travel; automatically reduced on mobile |
| `data-parallax-rotate` | degrees | unchanged | Optional ending rotation; automatically reduced on mobile |
| `data-parallax-scale` | number | unchanged | Optional ending scale for a layer |
| `data-parallax-blur` | pixels | unchanged | Optional ending blur amount, entered without `px` |
| `data-parallax-opacity` | `0`–`1` | unchanged | Optional ending opacity for a layer |
| `data-parallax-distance` | pixels | `236` | Desktop translation multiplier for the scene |
| `data-parallax-mobile-distance` | pixels | `128` | Translation multiplier at `768px` and below |
| `data-parallax-runway` | pixels | `560` | Desktop pinned scroll distance |
| `data-parallax-mobile-runway` | pixels | `340` | Mobile pinned scroll distance |
| `data-parallax-pointer` | number | off | Cursor drift strength on fine-pointer devices, as the percentage a layer at depth 1 travels for a cursor at the scene's edge. Omit to disable |
| `data-parallax-progress` | marker | optional | Displays timeline progress from `000` to `100` |
| `data-parallax-fill` | marker | optional | Scales a progress line from left to right |

Invalid or omitted speeds fall back to `1`, which leaves the layer at the page's base speed.

## Choosing Layer Speeds

Travel is `(1 - speed) × distance`, so the further a speed sits from `1`, the further the layer moves, and the sign decides the direction.

- `-0.3`–`0`: something that should move against everything else, such as a sun that sets while the ridges rise
- `0.3`–`0.6`: the far ridge or a background photograph
- `0.6`–`0.85`: mid layers, atmosphere, a mist band
- `0.85`–`0.95`: the headline, if it is to sit inside the stack
- `1`: follows the scene without additional travel
- `1.1`–`1.3`: the copy that must stay readable, labels, interface details
- `1.4`–`1.8`: foreground ridges, tiles, frames, anything meant to climb over the headline

Keep the deepest and nearest values far apart so the separation develops clearly across the pinned runway. The demo's illustration set uses `-0.15 / 0.5 / 0.7 / 0.8 / 0.9 / 1.7 / 1.15`; the photo set uses `0.5 / 0.6 / 0.9 / 1.4 / 1.8 / 1.15`.

## Examples

### Put the Headline Inside the Stack

The demo's signature. Give the headline a speed just under `1` and place at least one layer after it in source order with a speed well over `1`:

**Inside your `[data-parallax]` scene:**

```html
<div class="layer layer--headline" data-parallax-speed="0.9">
  <h1>Higher ground.</h1>
</div>
<div class="layer" data-parallax-speed="1.7" data-parallax-scale="1.06" aria-hidden="true">
  <img src="foreground.png" alt="">
</div>
```

The foreground rises about `(1.7 - 1) × distance` pixels over the runway, so at the default distance it covers the lower 165px of whatever sits behind it. Position the headline so that its second line, not its first, is what gets covered.

### Add a Focus Pull to a Background Photograph

**Inside your `[data-parallax]` scene:**

```html
<div
  class="layer layer--photo"
  data-parallax-speed="0.5"
  data-parallax-scale="1.12"
  data-parallax-blur="3"
  data-parallax-opacity="0.85"
  aria-hidden="true"
>
  <img src="your-photo.jpg" alt="">
</div>
```

Decorative images should use an empty `alt` attribute. The layer moves, expands, softens, and dims from the same scrubbed progress, so the photograph recedes as the copy travels over it.

### Add Cursor Drift

**On the scene:**

```html
<section class="hero" data-parallax data-parallax-pointer="1.6">
```

Every layer drifts by its depth: layers below speed `1` move with the cursor, layers above it move against, which is what reads as looking through a window. The drift tweens `xPercent` and `yPercent`, separate transform components from the scroll's pixel `y`, so the two inputs compose instead of competing. It is only attached on `(hover: hover) and (pointer: fine)`; touch devices never get it.

### Add a Scroll Progress Cue

**Inside your `[data-parallax]` scene:**

```html
<div class="scroll-cue" aria-hidden="true">
  <span>Scroll</span>
  <span class="scroll-cue__track"><span data-parallax-fill></span></span>
  <span><span data-parallax-progress>000</span>%</span>
</div>
```

`[data-parallax-fill]` is scaled from `scaleX(0)` to `scaleX(1)` and `[data-parallax-progress]` counts `000`–`100`, both on the same timeline. Both are optional; omit them and the script skips them. The demo ships the filling line only, without the numeric readout.

### Disable Lenis

If Lenis is loaded but a page should use native scrolling, set the option on `<html>`:

```html
<html data-smooth="off">
```

You can also append `?smooth=off` to the URL. The ScrollTrigger effect works with or without Lenis.

## How It Works

A scene gets one GSAP timeline whose ScrollTrigger starts at `top top`, pins the hero, and ends after the selected runway. For each layer, the y destination is calculated as `(1 - speed) × distance`. A `0.5` ridge therefore drifts down, a `-0.15` sun drifts down further still, and a `1.7` foreground ridge travels up, creating visible separation across a deliberate but still self-contained hero sequence.

Horizontal travel, rotation, scale, blur, and opacity attributes are added to the same tween, as are the optional scroll cue responses, so every element stays synchronized, scrubbed, and reversible. `invalidateOnRefresh` recalculates the runway after layout changes.

The pointer drift is a `gsap.quickTo` pair per layer on `xPercent` and `yPercent`, fed from a single `pointermove` listener on the scene and returned to zero on `pointerleave`.

## Composition Notes

- Give moving layers enough overscan to prevent an edge appearing during travel.
- Keep semantic content such as the headline in normal heading markup even when it is absolutely layered.
- Set decorative layers to `aria-hidden="true"`.
- Anything that must stay readable for the whole runway belongs in front of the near layers, with a speed above `1` so it lifts with them.
- A page can contain multiple independent `[data-parallax]` scenes, but a hero normally needs only one.

## Accessibility

- **Reduced motion:** the JavaScript `gsap.matchMedia` branch creates no pin, animation, or pointer listener. CSS removes transforms, filters, and transitions so the complete layered hero remains visible as a strong static composition.
- **No JavaScript:** all layers are visible in their designed starting state; no content depends on JavaScript to be revealed.
- **Keyboard:** the effect is scroll-driven and introduces no custom controls or keyboard traps. The demo's layer switch is a pair of real `<button>`s with `aria-pressed`. Links inside layers keep their focus styles because only the layer wrapper is `pointer-events: none`.
- **Semantics:** keep meaningful copy outside `aria-hidden` decorative layers and connect the scene to its heading with `aria-labelledby`.

## Cleanup

The script stores its GSAP context on `window.gsapContext` for SPA use. Calling `window.gsapContext.revert()` removes the scene timelines, ScrollTriggers, and pointer listeners. On page unload, the script also removes the Lenis ticker callback and ScrollTrigger refresh listener before destroying Lenis.

## Performance Notes

- Translation and scale remain compositor-friendly.
- The mist band is a gradient rather than a filter, so it composites for free while it travels.
- Blur is optional because large filtered layers can be expensive on low-power devices; the demo blurs one simple SVG ridge and one photograph.
- One ScrollTrigger coordinates every layer in a scene.
- Mobile defaults reduce both travel and pin distance while preserving the same depth order.

## Dependencies

**Required:**

- GSAP 3.12+
- ScrollTrigger

**Optional:**

- Lenis 1.x for smooth scrolling. If present, the script runs Lenis from GSAP's ticker so both systems share one clock.
