# Scroll Progress Indicator

A precise, reversible reading-progress system built with GSAP ScrollTrigger. Use the bar, ring, rail, or percentage independently, or combine them into one navigation instrument.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add one indicator inside your `<body>`:**

```html
<div class="progress-bar" data-progress-style="bar"
  role="progressbar" aria-label="Reading progress"
  aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
  <div class="progress-bar__fill"></div>
</div>
```

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

The default range is the full document, from `top top` to `bottom bottom`. Updates are direct, reversible, and settle on an exact `100` at the endpoint.

## Options

### Data attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-progress-style` | `bar`, `circle`, `ring`, `rail`, `counter`, `percentage` | `bar` | Selects the rendering mode. `ring` and `percentage` are aliases. |
| `data-progress-position` | Any project-specific value | — | Preserved on the instance for custom positioning logic. CSS position classes are provided below. |

### JavaScript options

| Option | Type | Default | Description |
|---|---|---|---|
| `style` | string | Element data attribute or `bar` | Rendering mode. |
| `position` | string | Element data attribute or `null` | Optional position metadata. |
| `trigger` | Element | `document.documentElement` | Element whose scroll range is tracked. |
| `start` | string | `top top` | ScrollTrigger start expression. |
| `end` | string | `bottom bottom` | ScrollTrigger end expression. |

## Style Markup

### Bar

**Add inside your `<body>`:**

```html
<div class="progress-bar" data-progress-style="bar">
  <div class="progress-bar__fill"></div>
</div>
```

Add `progress-bar--bottom` for the bottom edge or `progress-bar--thick` for a 5px bar.

### Ring

**Add inside your `<body>`:**

```html
<div class="progress-circle" data-progress-style="circle">
  <svg class="progress-circle__svg" viewBox="0 0 60 60" aria-hidden="true">
    <circle class="progress-circle__bg" cx="30" cy="30" r="25" />
    <circle class="progress-circle__fill" cx="30" cy="30" r="25" />
  </svg>
  <span class="progress-circle__text">0%</span>
</div>
```

The script reads the path length, so changing the radius does not require a hard-coded dash array. Position classes are `progress-circle--top-right`, `progress-circle--top-left`, and `progress-circle--bottom-left`; bottom-right is the default.

### Rail

**Add inside your `<body>`:**

```html
<div class="progress-rail progress-rail--right" data-progress-style="rail">
  <div class="progress-rail__fill"></div>
</div>
```

Use `progress-rail--left` or `progress-rail--right`.

### Percentage

**Add inside your `<body>`:**

```html
<div class="progress-counter" data-progress-style="counter">
  <span class="progress-counter__value">000</span>
  <span class="progress-counter__symbol">%</span>
</div>
```

Position classes are `progress-counter--top-left`, `progress-counter--top-right`, and `progress-counter--bottom-right`; bottom-left is the default.

## Programmatic Example

The global `ScrollProgress` class supports custom scroll ranges.

**Add to your JavaScript after `script.js`:**

```javascript
const article = document.querySelector('.article');
const indicator = document.querySelector('.article-progress');

const progress = new ScrollProgress(indicator, {
  style: 'bar',
  trigger: article,
  start: 'top top',
  end: 'bottom bottom'
});

// Remove this instance and its ScrollTrigger when no longer needed.
progress.destroy();
```

For single-page app teardown, call the included global cleanup:

```javascript
window.destroyScrollProgress();
```

## Customization

**Add to your own stylesheet after `style.css`:**

```css
:root {
  --accent: #c8ff00;
  --orange: #ff6b1a;
}

.progress-bar { height: 5px; }
.progress-circle { width: 88px; }
.progress-rail { width: 4px; }
```

## Accessibility

- Add `role="progressbar"`, an accessible label, `aria-valuemin="0"`, and `aria-valuemax="100"`; the script maintains `aria-valuenow`.
- Progress remains live under `prefers-reduced-motion` because it is useful information, but updates have no scrub, easing, or decorative transition.
- All controls in the demo are native buttons and keyboard operable.
- With JavaScript unavailable, article content and the initial instrument remain visible and readable.

## Cleanup

Every instance owns one ScrollTrigger and exposes `destroy()`. The demo wraps initialization in `gsap.context()`, uses `gsap.matchMedia()` for both motion preferences, removes mode-switch listeners, and destroys all instances on teardown.

## Dependencies

- GSAP 3.15.0+
- ScrollTrigger 3.15.0+
- No smooth-scroll library required
