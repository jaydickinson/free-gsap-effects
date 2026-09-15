# CSS Scroll Reveal

Native CSS scroll-driven entrance classes for opacity, translate, and scale. Animation requires no JavaScript; the optional script only adds an unsupported-browser fallback hook.

## Quick Start

**1. Copy the reveal classes and keyframes from `assets/style.css` into your stylesheet.** They sit under the `THE REVEAL API` heading, together with the reduced-motion and `@supports` fallback blocks below it.

**2. Add a reveal class to an element in your `<body>`:**

```html
<article class="reveal-slide-up">
  This fades and rises as it enters the viewport.
</article>
```

**3. Optionally tune that element's range in your CSS:**

```css
.feature-card {
  --reveal-range: entry 10% cover 35%;
}
```

No animation script or GSAP CDN tag is required.

## Using It With Your Own Design

**What the effect requires of your markup:** one of the five `.reveal-*` classes on any block-level element. Nothing else: no wrapper, no data attributes, no particular parent. The element animates against its own position in the nearest scroll container (`view()`), so it works inside any layout.

**What is only the demo's CSS:** everything above the `THE REVEAL API` heading in `assets/style.css` (the studio page, its cards, the `.about` grid, the button, the colours and Mona Sans) is the demo and can be deleted. The `.projects .card:nth-child()` ranges and the `.closing` and `.colophon` ranges are examples of tuning `--reveal-range`, not part of the API.

**Non-obvious CSS the effect depends on:**

- `overflow-x: clip` on `html` and `body`. The side slides translate an element 4rem off the page for a moment; without the clip a phone gains a horizontal scroll area.
- `--ease-reveal` (or any timing function you set on the classes). Scroll-scrubbed reveals want a gentler curve than a timed tween: with an expo ease the element is 90% settled a third of the way in and any stagger between neighbours disappears.
- **Blocks at the very end of a page never reach `cover 40%`**, because the document stops scrolling first, so they stay partly transparent. Give them a shorter range: the demo uses `entry 0% cover 28%` on its closing block and `entry 0% entry 100%` on the footer line.
- Keep the `@media (prefers-reduced-motion: reduce)` and `@supports not (animation-timeline: view())` blocks, and the `.no-scroll-timeline` rules if you ship the optional script. Together they are what makes an unsupported or reduced-motion browser show the settled page instead of a blank one.

## Options

| Class / property | Values | Default | Description |
|---|---|---|---|
| `.reveal-fade` | Class | — | Reveals with opacity only |
| `.reveal-slide-up` | Class | — | Fades and translates upward from `4rem` below |
| `.reveal-scale` | Class | — | Fades and scales from `0.72` |
| `.reveal-slide-left` | Class | — | Fades while entering from the left |
| `.reveal-slide-right` | Class | — | Fades while entering from the right |
| `--reveal-range` | Any valid `animation-range` | `entry 0% cover 40%` | Controls where the reveal starts and settles |

Every element in the demo uses `view()`, its own progress through the viewport. Nothing is bound to the root scroll.

## Examples

### A staggered row of cards

Three cards in one row enter the viewport together, so give each a later range and they arrive one after another:

**Add to your HTML `<body>`:**

```html
<div class="card-row">
  <article class="reveal-slide-up">First</article>
  <article class="reveal-slide-up">Second</article>
  <article class="reveal-slide-up">Third</article>
</div>
```

**Add to your stylesheet:**

```css
.card-row > :nth-child(1) { --reveal-range: entry 0% cover 34%; }
.card-row > :nth-child(2) { --reveal-range: entry 6% cover 40%; }
.card-row > :nth-child(3) { --reveal-range: entry 12% cover 46%; }
```

### Accent-rule growth

The demo's secondary response, a rule that draws itself under a heading, is also CSS-driven:

```css
.accent-rule {
  transform-origin: left;
  animation: rule-grow auto ease-out both;
  animation-timeline: view();
  animation-range: entry 10% cover 35%;
}

@keyframes rule-grow {
  from { opacity: 0; transform: scaleX(0); }
  to { opacity: 1; transform: scaleX(1); }
}
```

## Browser Support and Fallback

Native scroll-driven animations are supported in current Chromium-based browsers and Safari releases. Check [Can I Use](https://caniuse.com/css-scroll-driven-animations) for current versions.

The stylesheet includes an `@supports not (animation-timeline: view())` branch that removes animation and shows the final composition. `assets/script.js` is optional: it performs the same support check and adds `.no-scroll-timeline` for older browsers whose CSS feature detection is inconsistent. It never drives animation.

Without JavaScript, supported browsers animate normally and unsupported browsers receive the complete static content through CSS.

## Accessibility

A `prefers-reduced-motion: reduce` media query disables every reveal and presents the settled content immediately. Keep meaningful content in normal HTML rather than pseudo-elements so it remains available to assistive technology and all fallback modes.

## Dependencies

None. The effect uses native CSS only. The demo loads Mona Sans from Google Fonts for its page styling, but the reveal API does not depend on it.
