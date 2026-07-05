# Image Clip Reveal

Images reveal on scroll with an animated clip-path wipe and a Ken Burns settle: the inner image eases from 1.25 scale down to 1 as the mask opens.

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

**3. Wrap any image in a `data-clip-reveal` element:**

```html
<div data-clip-reveal>
  <img src="photo.jpg" alt="Description of the photo">
</div>
```

The stylesheet gives the wrapper `overflow: hidden` and a fully closed `clip-path` as its initial state, so images never flash before the script runs. If you copy only the effect styles into your own stylesheet, make sure you bring the `[data-clip-reveal]` rules with you.

## Options

All options are data attributes on the `data-clip-reveal` wrapper:

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-reveal-direction` | `up`, `down`, `left`, `right` | `up` | Wipe direction of the clip-path inset |
| `data-reveal-duration` | Seconds | `1.1` | Duration of the wipe and the scale settle |
| `data-reveal-delay` | Seconds | `0` | Delay before the reveal starts |
| `data-reveal-once` | `true`, `false` | `true` | Play once, or replay when re-entering the viewport |

## Examples

### Direction Control

**HTML:**
```html
<!-- Reveal upward from the bottom edge -->
<div data-clip-reveal data-reveal-direction="up">
  <img src="photo-a.jpg" alt="">
</div>

<!-- Reveal from the right edge, travelling left -->
<div data-clip-reveal data-reveal-direction="left">
  <img src="photo-b.jpg" alt="">
</div>
```

### Slower Reveal That Replays

**HTML:**
```html
<div data-clip-reveal
     data-reveal-direction="right"
     data-reveal-duration="1.6"
     data-reveal-delay="0.2"
     data-reveal-once="false">
  <img src="hero.jpg" alt="">
</div>
```

### Staggered Groups

Wrap multiple reveals in a `data-clip-reveal-group` container. The group gets a single ScrollTrigger and its children reveal in sequence. Children can still set their own direction, duration, and delay; anything they leave out is inherited from the group.

**HTML:**
```html
<div class="image-grid" data-clip-reveal-group data-reveal-stagger="0.15">
  <div data-clip-reveal data-reveal-direction="up">
    <img src="one.jpg" alt="">
  </div>
  <div data-clip-reveal data-reveal-direction="down">
    <img src="two.jpg" alt="">
  </div>
  <div data-clip-reveal data-reveal-direction="left">
    <img src="three.jpg" alt="">
  </div>
</div>
```

| Group Attribute | Values | Default | Description |
|-----------------|--------|---------|-------------|
| `data-clip-reveal-group` | (presence) | n/a | Marks a container whose child reveals are staggered |
| `data-reveal-stagger` | Seconds | `0.12` | Delay between each child reveal |

Group-level `data-reveal-direction`, `data-reveal-duration`, `data-reveal-delay`, and `data-reveal-once` act as defaults for every child.

## How It Works

Each wrapper (or group) gets a ScrollTrigger that fires at `top 85%`. The timeline tweens the wrapper's `clip-path` from a fully closed `inset()` on the chosen edge to `inset(0%)` while simultaneously scaling the inner `img` from 1.25 to 1, both with `expo.out`, so the wipe and the settle read as a single motion. With `data-reveal-once="false"` the trigger uses `toggleActions: 'restart none none reset'` so the reveal resets when you scroll back above it and plays again on re-entry.

## Accessibility

- **Reduced motion**: respects `prefers-reduced-motion` in both CSS and JavaScript. Images display fully with no clip and no scale, and no ScrollTriggers are created
- **No flash of hidden content**: initial states are set in CSS, so nothing pops or jumps while the script loads
- **Alt text**: the wrapper is presentation-only; keep meaningful `alt` text on the `img` elements themselves
- **No pointer requirement**: the effect is scroll-driven only, so keyboard and touch users get the identical experience

### Reduced Motion Behavior

When `prefers-reduced-motion: reduce` is set:
- The stylesheet clears the clip-path and scale with `!important` overrides
- The script's reduce branch sets images to their final state and skips all animation

## Programmatic Control

The GSAP context is exposed globally. Add this to your own JavaScript:

**JavaScript:**
```javascript
// Revert everything the effect created
window.gsapContext.revert();

// Kill all ScrollTriggers manually
ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
```

## Browser Support

Modern browsers (ES6+). `clip-path: inset()` is supported everywhere GSAP 3 runs, except IE11.

## Dependencies

**Required:**
- GSAP 3.12+
- ScrollTrigger plugin

**Optional:**
- Lenis (smooth scroll integration; the effect works without it)
