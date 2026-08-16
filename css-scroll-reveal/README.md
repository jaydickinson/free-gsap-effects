# CSS Scroll Reveal

Native CSS scroll-driven entrance classes for opacity, translate, and scale. Animation requires no JavaScript; the optional script only adds an unsupported-browser fallback hook.

## Quick Start

**1. Copy the reveal classes and keyframes from `assets/style.css` into your stylesheet.**

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

## Options

| Class / property | Values | Default | Description |
|---|---|---|---|
| `.reveal-fade` | Class | — | Reveals with opacity only |
| `.reveal-slide-up` | Class | — | Fades and translates upward |
| `.reveal-scale` | Class | — | Fades and scales from `0.72` |
| `.reveal-slide-left` | Class | — | Fades while entering from the left |
| `.reveal-slide-right` | Class | — | Fades while entering from the right |
| `--reveal-range` | Any valid `animation-range` | `entry 0% cover 40%` | Controls where the reveal starts and settles |

The class names are preserved as the reusable API. The editorial demo binds its three panels to `scroll(root block)` only to make one compact, synchronized sequence; ordinary elements continue to use `view()`.

## Examples

### A three-item cascade

**Add to your HTML `<body>`:**

```html
<div class="story-grid">
  <article class="reveal-slide-up">First story</article>
  <article class="reveal-scale">Second story</article>
  <article class="reveal-slide-left">Third story</article>
</div>
```

**Add to your stylesheet:**

```css
.story-grid > :nth-child(1) { --reveal-range: entry 0% cover 35%; }
.story-grid > :nth-child(2) { --reveal-range: entry 8% cover 43%; }
.story-grid > :nth-child(3) { --reveal-range: entry 16% cover 51%; }
```

### Accent-rule growth

The poster's secondary response is also CSS-driven:

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

A `prefers-reduced-motion: reduce` media query disables every reveal, removes the extra runway, and presents the settled content immediately. Keep meaningful content in normal HTML rather than pseudo-elements so it remains available to assistive technology and all fallback modes.

## Dependencies

None. The effect uses native CSS only. The demo loads Google Fonts for its poster styling, but the reveal API does not depend on them.
