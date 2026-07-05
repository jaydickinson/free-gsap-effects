# Scroll Progress Indicator

Four scroll progress visualization styles using GSAP ScrollTrigger.

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

**3. Add the indicator HTML anywhere in your `<body>`:**

```html
<div class="progress-bar" data-progress-style="bar">
  <div class="progress-bar__fill"></div>
</div>
```

## Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `bar` | Horizontal bar at top/bottom | Blog posts, documentation |
| `circle` | SVG ring with optional percentage | Landing pages, minimal designs |
| `rail` | Vertical bar on left/right edge | Editorial sites, vertical emphasis |
| `counter` | Numeric percentage display | Technical docs, data-driven UIs |

## Style Markup

Each style requires specific HTML. Add one of these anywhere in your `<body>`:

### Bar

**HTML:**
```html
<div class="progress-bar" data-progress-style="bar">
  <div class="progress-bar__fill"></div>
</div>
```

**Variants:** Add `progress-bar--bottom` for bottom position, `progress-bar--thick` for 5px height.

### Circle

**HTML:**
```html
<div class="progress-circle" data-progress-style="circle">
  <svg class="progress-circle__svg" viewBox="0 0 60 60">
    <circle class="progress-circle__bg" cx="30" cy="30" r="25"/>
    <circle class="progress-circle__fill" cx="30" cy="30" r="25"/>
  </svg>
  <span class="progress-circle__text">0%</span>
</div>
```

**Variants:** Add position classes:
- `progress-circle--top-right`
- `progress-circle--top-left`
- `progress-circle--bottom-left`
- Default is bottom-right

### Rail

**HTML:**
```html
<div class="progress-rail progress-rail--right" data-progress-style="rail">
  <div class="progress-rail__fill"></div>
</div>
```

**Variants:** `progress-rail--left` or `progress-rail--right`

### Counter

**HTML:**
```html
<div class="progress-counter" data-progress-style="counter">
  <span class="progress-counter__value">0</span>
  <span class="progress-counter__symbol">%</span>
</div>
```

**Variants:** Add position classes:
- `progress-counter--top-left`
- `progress-counter--top-right`
- `progress-counter--bottom-right`
- Default is bottom-left

## Core Pattern

All styles use the same ScrollTrigger pattern. This is already included in `script.js` — shown here for reference:

**JavaScript:**
```javascript
ScrollTrigger.create({
  trigger: document.documentElement,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.5,
  onUpdate: (self) => {
    // self.progress = 0 to 1
    updateProgress(self.progress);
  }
});
```

## Programmatic Use

The `ScrollProgress` class is exposed globally. Add this to your own JavaScript file or a `<script>` tag:

**JavaScript:**
```javascript
const element = document.querySelector('.my-progress');
const progress = new ScrollProgress(element, {
  style: 'bar' // 'bar', 'circle', 'rail', 'counter'
});

// Cleanup
progress.destroy();
```

## Customization

Add these to your own stylesheet or a `<style>` tag to override defaults.

### Colors

**CSS:**
```css
:root {
  --accent: #ff6b6b;        /* Progress fill color */
  --border: rgba(255, 255, 255, 0.1); /* Track color */
}
```

### Bar Height

**CSS:**
```css
.progress-bar {
  height: 5px; /* Default is 3px */
}
```

### Circle Size

**CSS:**
```css
.progress-circle {
  width: 80px;
  height: 80px;
}
```

Adjust `stroke-dasharray` when changing circle radius:
- Formula: `2 * PI * radius`
- Default (r=25): `157`

### Rail Width

**CSS:**
```css
.progress-rail {
  width: 6px; /* Default is 4px */
}
```

## Accessibility

- All indicators use `aria-hidden="true"` (decorative, not interactive)
- Respects `prefers-reduced-motion` — shows static 100% state
- No keyboard interaction needed (passive visualization)
- Scroll position remains accessible via native browser UI

## Browser Support

Modern browsers (ES6+). Not compatible with IE11.

## Dependencies

- GSAP 3.12+
- ScrollTrigger plugin
- Lenis (optional — for smooth scrolling; effect works without it)
