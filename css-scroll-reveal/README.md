# CSS Scroll Reveal

Pure CSS scroll-triggered entrance animations. No JavaScript required.

## Browser Support

CSS scroll-driven animations work in:
- Chrome 115+
- Edge 115+
- Safari 18+

Check [caniuse.com](https://caniuse.com/css-scroll-driven-animations) for current support.

## Quick Start

**1. Add the CSS to your stylesheet or `<style>` tag:**

```css
.reveal-fade {
  animation: fade-in auto linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**2. Add the class to any HTML element:**

```html
<div class="reveal-fade">This fades in on scroll</div>
```

## Available Classes

| Class | Effect |
|-------|--------|
| `.reveal-fade` | Fade from transparent to opaque |
| `.reveal-slide-up` | Fade + slide up from below |
| `.reveal-scale` | Fade + scale from 0.85 to 1 |
| `.reveal-slide-left` | Fade + slide in from left |
| `.reveal-slide-right` | Fade + slide in from right |

## Examples

### Basic Fade

**HTML:**
```html
<div class="reveal-fade">
  Content fades in as it enters the viewport
</div>
```

### Slide Up

**HTML:**
```html
<div class="reveal-slide-up">
  Content slides up while fading in
</div>
```

### Scale In

**HTML:**
```html
<div class="reveal-scale">
  Content grows from 85% to 100% size
</div>
```

### Side Slides

**HTML:**
```html
<div class="reveal-slide-left">From the left</div>
<div class="reveal-slide-right">From the right</div>
```

## Customization

Add these to your stylesheet or `<style>` tag to customize behavior.

### Animation Range

Control when the animation starts and ends:

**CSS:**
```css
.reveal-fade {
  /* Default: animate during entry */
  animation-range: entry 0% cover 40%;

  /* Start when 20% visible, complete at 80% */
  animation-range: entry 20% entry 80%;

  /* Animate through the entire visibility */
  animation-range: cover 0% cover 100%;
}
```

### Animation Speed

The `linear` timing function ties animation directly to scroll. For smoother motion, use easing:

**CSS:**
```css
.reveal-fade {
  animation: fade-in auto ease-out both;
}
```

### Custom Keyframes

Create your own animations:

**CSS:**
```css
.reveal-rotate {
  animation: rotate-in auto linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes rotate-in {
  from {
    opacity: 0;
    transform: rotate(-10deg) translateY(30px);
  }
  to {
    opacity: 1;
    transform: rotate(0) translateY(0);
  }
}
```

## Accessibility

The effect respects `prefers-reduced-motion`:

**CSS:**
```css
@media (prefers-reduced-motion: reduce) {
  .reveal-fade,
  .reveal-slide-up,
  .reveal-scale,
  .reveal-slide-left,
  .reveal-slide-right {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

## Fallback for Unsupported Browsers

This demo is designed to show pure CSS capabilities. In unsupported browsers, content will simply be visible without animation:

**CSS:**
```css
@supports not (animation-timeline: view()) {
  .reveal-fade,
  .reveal-slide-up,
  .reveal-scale,
  .reveal-slide-left,
  .reveal-slide-right {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

For production sites requiring broad browser support and complex features (pinning, scrubbing, callbacks), we recommend using **GSAP ScrollTrigger**.

## Dependencies

None. Pure CSS.
