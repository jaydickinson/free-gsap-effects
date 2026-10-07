# Spotlight Background

Two theatre follow-spots hung at the top of the frame, drawn in WebGL as real light in a hazed room: a small hot lamp at each fixture, a cone of drifting smoke that thins with distance, and a soft pool where each beam lands. On load the beams sweep in from the wings, cross once over your headline and land on it. After that they follow the pointer like spots worked by an operator: heavy, a little behind, with a slight overshoot when you stop. Press and hold to pull both into a tight pin spot. The headline catches the light as each beam crosses it.

GSAP core for every motion, three.js for the canvas. No GSAP plugins.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
<script>
  (function () {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return;
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      document.documentElement.classList.add('gl');
    } catch (e) {}
  })();
</script>
```

The inline script is not optional. The layer carries a CSS rendition of the beams for visitors without JavaScript or WebGL, and without this probe it would paint for the half second three.js takes to arrive and then be swapped for the canvas. The probe runs before first paint, stamps `html.gl` when a canvas is coming, and the stylesheet hides the CSS beams under that class. The effect removes the class again if it cannot build a renderer after all.

**2. Put the layer inside any positioned container, before your content:**

```html
<section class="hero" style="position: relative;">
  <div class="spotlight" data-spotlight aria-hidden="true">
    <div class="spotlight__beam" data-spotlight-beam="key">
      <div class="spotlight__cone"></div>
      <div class="spotlight__haze"></div>
    </div>
    <div class="spotlight__beam" data-spotlight-beam="gel">
      <div class="spotlight__cone"></div>
      <div class="spotlight__haze"></div>
    </div>
    <div class="spotlight__pool" data-spotlight-pool="key"></div>
    <div class="spotlight__pool" data-spotlight-pool="gel"></div>
  </div>

  <div class="hero__content" style="position: relative;">
    <h1>Your headline</h1>
    <p>Support line.</p>
  </div>
</section>
```

The beam and pool elements are the CSS rendition only; the WebGL canvas is added next to them at runtime. The beams land on the first `h1`, `h2` or `h3` in the container unless you point them elsewhere with `data-spotlight-target`.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js"
  }
}
</script>
<script type="module">
  const showFallback = () => document.documentElement.classList.remove('gl');
  import('three').then((THREE) => {
    window.THREE = THREE;
    const effect = document.createElement('script');
    effect.src = 'path/to/script.js';
    effect.onerror = showFallback;
    document.body.appendChild(effect);
  }).catch(showFallback);
</script>
```

**Why the import map rather than a plain `<script src>` for three.js:** three ships as ES modules only, and its old UMD build logs a deprecation warning on every page load. The shim imports it as a module (dynamically, so a blocked CDN falls back to the CSS rendition instead of a blank stage), puts it on `window`, and then loads `script.js` as an ordinary script, so the effect itself stays a plain file you can drop into any build (or none).

**Already using three.js as a module?** Skip the shim and make sure `window.THREE` is set before `script.js` runs:

```javascript
import * as THREE from 'three';
window.THREE = THREE;
```

## Using It With Your Own Design

**What the effect needs from your markup:** a positioned container (`relative`, `absolute` or `fixed`) holding the `[data-spotlight]` layer and your content. The layer fills the container with `position: absolute; inset: 0`, at any size, so it works on a full-viewport hero or a single card. Your content needs `position: relative` (or any z-index context) to sit above it.

**What is only the demo's styling:** everything under `DEMO` in `style.css`: the `.stage` hero, the type, the button and the cue line. Replace it wholesale.

**CSS the effect depends on:**

- **The container must have a real size.** The canvas is sized from the layer, which takes the container's box. A container with no height gives a canvas of no height.
- The `.spotlight` block (`overflow: hidden`, `pointer-events: none`) and `.spotlight__canvas`.
- The `.spotlight__beam` / `.spotlight__pool` rules and the `.gl` and `.is-live` rules that hide them. Keep the four beam and pool children in the markup: they are what visitors without WebGL or JavaScript see.
- The `.spotlight-lit` rule. The script adds it to the target heading for the catch and removes it on teardown. It pads the heading's painted box so descenders and accents are never clipped by the clipped-to-text highlight, with a matching negative margin so your layout does not move. The heading should be a block element (an inline one splits the catch per line).
- On touch screens the container needs `touch-action: pan-y` so vertical swipes still scroll the page. The script sets it inline while it runs if you have not.

**Colours** are custom properties on `.spotlight`, read once at start and handed to the shader, so a restyle never touches the script:

```css
.spotlight {
  --spotlight-ground: #0a0a0a; /* the stage */
  --spotlight-key: #fff1dc;    /* warm white key light */
  --spotlight-gel: #ff2d6f;    /* theatre gel, the accent */
  --spotlight-haze: 0.6;       /* how much the smoke varies in the cones, 0 (even) to 1 (rolling) */
}
```

Any CSS colour works (hex, `rgb()`, `oklch()`, `color-mix()`). The light is additive, so the effect wants a dark ground. On a mid-tone ground lower `data-spotlight-intensity` and re-check contrast.

**Contrast.** The heading keeps its own colour when unlit; the catch only brightens it. In the demo the headline holds at least 4:1 against the brightest light behind it, even on its unlit ink (entrance crossing, landed and pin spot, measured at 1200 x 675 and 390 x 844), and the support line holds 7.5:1. If you change the heading colour, the key or gel colour, or the haze, measure again with the pin spot held on your heading.

## Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-spotlight` | (present) | | Marks the layer |
| `data-spotlight-target` | CSS selector | first `h1, h2, h3` in the container | The element the beams land on and light |
| `data-spotlight-beams` | `1`, `2` | `2` | One centred key light, or key plus gel |
| `data-spotlight-follow` | `0` | on | `0` stops the beams following the pointer or a dragging finger |
| `data-spotlight-idle` | `0` | on | `0` turns off all autonomous motion: the idle sway, the touch auto-sweep and the drifting haze. The canvas then stops drawing once the beams settle |
| `data-spotlight-entrance` | `0` | on | `0` skips the entrance; the beams start landed |
| `data-spotlight-intensity` | `0` to `1` | `1` | Scales brightness and every motion together |
| `data-spotlight-keys` | (present) | | On a focusable ancestor: enables the keyboard controls below |

## Examples

### One beam, no idle motion

```html
<div class="spotlight" data-spotlight data-spotlight-beams="1" data-spotlight-idle="0" aria-hidden="true">
  ...
</div>
```

### Lighting a specific element, at half strength

```html
<div class="spotlight" data-spotlight data-spotlight-target=".price" data-spotlight-intensity="0.5" aria-hidden="true">
  ...
</div>
```

### Keyboard control

```html
<section class="hero" tabindex="0" data-spotlight-keys
         aria-label="Spring season" aria-describedby="hero-keys">
  <div class="spotlight" data-spotlight aria-hidden="true">...</div>
  ...
  <p class="sr-only" id="hero-keys">Arrow keys aim the stage lights; hold Space to focus them.</p>
</section>
```

## Behaviour

- **Entrance:** the lamps strike and the beams swing in from off-stage, past each other over the target, then back to land, in 1.5 seconds.
- **Pointer:** both beams aim at the pointer; the gel beam trails the key. Faster movement widens the cones and thickens the haze.
- **Press and hold:** a tight, brighter pin spot with a crisper edge; release springs it open. Presses on links, buttons and form fields are ignored.
- **Idle:** 2.5 seconds after the last input the beams drift home to the target and sway about two degrees. The haze keeps rolling the whole time.
- **Touch:** after the entrance the beams sweep slowly across the content on their own. Drag to aim, tap for a pin-spot pulse.
- **Crossing:** where the two beams or pools overlap, the colours add like real light.

## Accessibility

- **Reduced motion:** one WebGL frame, drawn once: both beams landed on the target, haze held still. No entrance, sway, sweep or pointer following. The keyboard controls and the API still work and redraw instantly.
- **Without JavaScript, or without WebGL:** the CSS rendition, a composed still of both beams resting on the middle of the box. It is never hidden until a canvas actually exists.
- **Keyboard:** with `data-spotlight-keys` on a focusable ancestor, arrow keys jump the key beam a step (the gel beam eases after it), Space or Enter held focuses the pin spot, Escape sends the beams home.
- **Screen readers:** the layer and its canvas are `aria-hidden`; nothing in them is content.

## Programmatic Control

```javascript
// Aim both beams at a point, as fractions of the layer (0 to 1).
SpotlightBackground.aim(0.3, 0.6);
// No arguments: back to the target.
SpotlightBackground.aim();

// Pin spot on and off.
SpotlightBackground.focus(true);
SpotlightBackground.focus(false);

// Re-run the entrance.
SpotlightBackground.replay();

// Freeze and resume.
SpotlightBackground.pause();
SpotlightBackground.play();

// Tear everything down: the canvas and its WebGL context, listeners,
// observers, the loop, and the classes and inline styles it added.
window.gsapContext.revert();   // or SpotlightBackground.revert()
```

The methods act on every `[data-spotlight]` layer on the page. Always tear down with `revert()`, never `kill()`: `kill()` skips the cleanup that releases the WebGL context, and browsers cap how many a page may hold.

## Dependencies

| Dependency | Version | Required |
|---|---|---|
| three.js | 0.180.0 | Yes, as an ES module (see Quick Start) |
| GSAP core | 3.12+ (the demo is built against 3.15.0) | Yes: every motion value (the entrance timeline, the lagged aim, the pin spot and its elastic release, the idle return and sway), the frame loop's ticker, matchMedia branching and teardown |

No GSAP plugins. GSAP moves plain numbers (where each beam points, how wide, how bright); the shader reads them each frame and draws the light. Everything used from three.js (`WebGLRenderer`, `ShaderMaterial`, `PlaneGeometry`, `OrthographicCamera`) is long-stable API, so pinning a different version is a one-line change in the import map.

## Browser Support

Anything with WebGL, which is every current browser. Support is probed before three.js is asked for a renderer: three logs its own failure to the console as errors before it throws, so a visitor with WebGL disabled would otherwise get a console full of red on a page that had quietly fallen back. Probed first, that visitor gets the CSS rendition and a clean console. In a browser too old for import maps the module never runs, and the CSS rendition is again what shows.

## Performance

One draw call per frame: a single full-screen pass. The expensive part is the haze, three octaves of 3D noise, and it is only computed where a beam actually is. The loop runs only while the layer is on screen and the tab is visible, and with `data-spotlight-idle="0"` it stops entirely once the beams settle. Pixel ratio is capped at 2 (1.5 on touch devices).

To buy back frames on low-end hardware, set `data-spotlight-idle="0"`: the canvas then draws only while the beams are moving, instead of continuously for the drifting haze.
