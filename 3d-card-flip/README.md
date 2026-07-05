# 3D Card Flip

Interactive cards with smooth 3D flip animations revealing content on the back.

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

**3. Add the card HTML anywhere in your `<body>`:**

```html
<div class="flip-card" data-flip="hover">
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <h3>Front Content</h3>
    </div>
    <div class="flip-card-back">
      <p>Back Content</p>
    </div>
  </div>
</div>
```

## Triggers

| Attribute | Value | Behavior |
|-----------|-------|----------|
| `data-flip` | `hover` | Flip on mouse hover (desktop), tap (touch) |
| `data-flip` | `click` | Flip on click/tap (all devices) |

## CSS Classes

| Class | Description |
|-------|-------------|
| `.flip-card` | Container element with perspective |
| `.flip-card-inner` | Rotating element with transform-style |
| `.flip-card-front` | Front face (visible by default) |
| `.flip-card-back` | Back face (rotated 180deg) |
| `.flipped` | Added to `.flip-card` when flipped |

## Examples

### Hover Flip (Desktop)

**HTML:**
```html
<div class="flip-card" data-flip="hover">
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <h3>Name</h3>
      <p>Role</p>
    </div>
    <div class="flip-card-back">
      <p>Bio text here</p>
    </div>
  </div>
</div>
```

### Click/Tap Toggle

**HTML:**
```html
<div class="flip-card" data-flip="click">
  <div class="flip-card-inner">
    <div class="flip-card-front">Click Me</div>
    <div class="flip-card-back">Back Side</div>
  </div>
</div>
```

### Auto-Close Group

Clicking one card automatically closes others in the group:

**HTML:**
```html
<div data-flip-group="auto-close">
  <div class="flip-card" data-flip="click">...</div>
  <div class="flip-card" data-flip="click">...</div>
  <div class="flip-card" data-flip="click">...</div>
</div>
```

### Staggered Scroll Entrance

Cards animate in with stagger when scrolled into view:

**HTML:**
```html
<div data-flip-stagger>
  <div class="flip-card" data-flip="hover">...</div>
  <div class="flip-card" data-flip="hover">...</div>
  <div class="flip-card" data-flip="hover">...</div>
</div>
```

## Device Behavior

| Device | `data-flip="hover"` | `data-flip="click"` |
|--------|---------------------|---------------------|
| Desktop (pointer: fine) | Hover or focus to flip | Click/Enter/Space to toggle |
| Touch (pointer: coarse) | Tap to toggle | Tap to toggle |
| Keyboard | Tab to focus & flip, Tab away to unflip | Enter/Space to toggle |
| Reduced motion | Instant toggle on click/Enter/Space | Instant toggle on click/Enter/Space |

## Accessibility

- **Reduced motion**: Respects `prefers-reduced-motion` — animations disabled, instant toggle on interaction
- **Keyboard navigation**: Cards are focusable with `tabindex="0"` and `role="button"`
- **Keyboard triggers**: Enter and Space keys trigger flip (same as click)
- **Focus parity**: Hover cards also flip on keyboard focus (Tab to flip, Tab away to unflip)
- **Focus visible**: Cards show a visible focus ring when navigated via keyboard
- **Decorative icons**: SVGs marked with `aria-hidden="true"`

## Programmatic Control

Add this to your own JavaScript file or a `<script>` tag:

**JavaScript:**
```javascript
// Flip a card
document.querySelector('.flip-card').classList.add('flipped');

// Unflip
document.querySelector('.flip-card').classList.remove('flipped');

// Toggle
document.querySelector('.flip-card').classList.toggle('flipped');
```

## Customization

Add these to your own stylesheet or a `<style>` tag to override defaults:

**CSS:**
```css
:root {
  --bg-card: #141414;      /* Card background */
  --accent: #8b5cf6;       /* Accent color */
  --border: rgba(255, 255, 255, 0.1);
}

.flip-card {
  width: 240px;            /* Card width */
  height: 300px;           /* Card height */
}

.flip-card-inner {
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## Dependencies

- GSAP 3.12+
- ScrollTrigger plugin
- Lenis (optional — for smooth scrolling; effect works without it)
