# Image Clip Reveal

A directional polygon aperture opens while the inner photograph settles from a restrained scale. Optional atmosphere, rule, and caption hooks turn the image wipe into a complete editorial entrance.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<script>document.documentElement.classList.add('has-js');</script>
<link rel="stylesheet" href="path/to/style.css">
```

The small `has-js` gate is important: animated elements are hidden only when JavaScript is available, so the full image and caption remain visible without JavaScript.

**2. Add to your `<body>`:**

```html
<figure>
  <div data-clip-reveal data-reveal-direction="right">
    <img src="architecture.jpg" alt="Glass towers beneath a stormy sky">
  </div>

  <figcaption data-reveal-caption>
    <span data-reveal-rule aria-hidden="true"></span>
    <span class="caption-mask"><span data-reveal-copy>Ottawa, Canada</span></span>
    <span class="caption-mask"><span data-reveal-copy>Constitution Square</span></span>
  </figcaption>
</figure>
```

`data-reveal-caption`, `data-reveal-rule`, and `data-reveal-copy` are optional. The image reveal works without caption markup.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

## Options

All image options are data attributes on the `data-clip-reveal` wrapper:

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-reveal-direction` | `up`, `down`, `left`, `right` | `up` | Edge and travel direction of the polygon aperture |
| `data-reveal-duration` | Seconds | `1.1` | Duration of the clip-path wipe; the image settle runs slightly longer |
| `data-reveal-delay` | Seconds | `0` | Delay before the reveal begins |
| `data-reveal-once` | `true`, `false` | `true` | Play once, or reset and replay when the trigger re-enters |

Optional descendant hooks:

| Attribute | Element | Description |
|---|---|---|
| `data-reveal-atmosphere` | Element inside the closest `figure` | Fades and scales subtle ambient color with the image |
| `data-reveal-caption` | `figcaption` inside the closest `figure` | Locates caption animation targets |
| `data-reveal-rule` | Element inside the caption | Scales a rule in shortly after the image |
| `data-reveal-copy` | Elements inside the caption | Reveals caption lines with a short stagger |
| `data-clip-replay` | `button` | Semantically replays every active reveal timeline |

## Examples

### Direction, Duration, and Replay

**Add to your HTML `<body>`:**

```html
<div data-clip-reveal
     data-reveal-direction="left"
     data-reveal-duration="1.45"
     data-reveal-delay="0.1"
     data-reveal-once="false">
  <img src="travel.jpg" alt="Mountain lodge at dusk">
</div>

<button type="button" data-clip-replay>Replay reveal</button>
```

Direction names retain the original API. `right` grows from the left edge toward the right, `left` grows from the right edge, `up` grows from the bottom, and `down` grows from the top.

### Staggered Group

The group API remains available when a project needs multiple images, even though the included demo intentionally uses one cinematic composition.

**Add to your HTML `<body>`:**

```html
<div data-clip-reveal-group
     data-reveal-stagger="0.15"
     data-reveal-direction="right"
     data-reveal-duration="1.2">
  <div data-clip-reveal><img src="one.jpg" alt="First location"></div>
  <div data-clip-reveal data-reveal-direction="up">
    <img src="two.jpg" alt="Second location">
  </div>
</div>
```

| Group Attribute | Values | Default | Description |
|---|---|---|---|
| `data-clip-reveal-group` | Presence | n/a | Builds one ScrollTrigger timeline for all child reveals |
| `data-reveal-stagger` | Seconds | `0.12` | Timeline offset between child reveals |

Direction, duration, delay, and once/replay attributes on the group become defaults. A child's own values override them.

## Styling Notes

The supplied demo CSS is intentionally editorial. For integration, preserve these functional rules while adapting the visual design:

- `overflow: hidden` on `[data-clip-reveal]`
- matching six-point closed polygon states under `.has-js`
- the `transform: scale(1.14)` image start state under `.has-js`
- overflow masks around any `data-reveal-copy` elements
- reduced-motion overrides that clear clip, scale, opacity, and translation

The open and closed polygon strings use the same number of points, which keeps browser interpolation stable.

## How It Works

Each standalone wrapper gets a timeline triggered at `top 85%`. GSAP interpolates the wrapper from a narrow directional six-point polygon to the full frame while scaling the inner image from `1.14` to `1`. The optional atmosphere begins with the image; the caption rule and copy enter at 72% of the configured reveal duration, giving the photograph time to become legible first.

With `data-reveal-once="false"`, ScrollTrigger uses `toggleActions: 'restart none none reset'`. Group wrappers share one timeline and offset child reveals by `data-reveal-stagger`.

## Programmatic API

**Add to your JavaScript after the effect has initialized:**

```javascript
// Replay every active reveal timeline.
window.imageClipReveal.replay();

// Kill timelines, ScrollTriggers, listeners, context, and Lenis integration.
window.imageClipReveal.destroy();

// The original GSAP context handle remains available.
window.gsapContext.revert();
```

## Accessibility

- The full image, rule, and caption are visible when JavaScript is unavailable.
- CSS and `gsap.matchMedia()` both honor `prefers-reduced-motion`; no ScrollTrigger is created in the reduced branch.
- The replay control is a native button with a visible keyboard focus state.
- Keep meaningful image descriptions in `alt`; decorative atmosphere and rules should use `aria-hidden="true"`.
- The effect is scroll-triggered and does not require a pointer.

## Dependencies

**Required:**

- GSAP 3.12+
- ScrollTrigger

**Optional:**

- Lenis for smooth scrolling. The included integration is disabled by `data-smooth="off"`, `?smooth=off`, or reduced-motion preference, and the effect works without Lenis.
