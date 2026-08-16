# 3D Card Flip Gallery

A tactile, accessible two-sided card effect with deep perspective, directional face light, edge glow, shadow inversion, and a restrained response from neighbouring cards.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add a card to your HTML `<body>`:**

```html
<div data-flip-group="auto-close" data-flip-stagger>
  <button class="flip-card" type="button" data-flip="hover" aria-pressed="false">
    <span class="card-shadow" aria-hidden="true"></span>
    <span class="flip-card-inner">
      <span class="card-edge" aria-hidden="true"></span>
      <span class="flip-card-front">
        <span class="face-light" aria-hidden="true"></span>
        <strong>Front content</strong>
      </span>
      <span class="flip-card-back">
        <span class="face-light" aria-hidden="true"></span>
        <strong>Back content</strong>
      </span>
    </span>
  </button>
</div>
```

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

## Options

| Attribute / class | Values | Default | Description |
|---|---|---|---|
| `data-flip` | `hover`, `click` | `hover` | Hover/focus on fine pointers, or click/tap toggling. Hover cards automatically use tap on coarse pointers. |
| `data-flip-group` | `auto-close` | none | Put on a shared ancestor to close other open cards when one opens. |
| `data-flip-stagger` | present | absent | Adds the optional staggered ScrollTrigger entrance to cards inside the container. |
| `.flipped` | present / absent | absent | Public state class for programmatic control. |
| `--card-accent` | any CSS color | cyan | Per-card face, edge, and focus color. |

## Trigger Examples

### Hover, focus, and touch fallback

**Add to your HTML `<body>`:**

```html
<button class="flip-card" type="button" data-flip="hover" aria-pressed="false">
  <!-- card-shadow, flip-card-inner, edge, and both faces -->
</button>
```

A fine pointer opens this card on hover and keyboard focus. On a coarse pointer, tapping toggles it.

### Click/tap toggle

**Add to your HTML `<body>`:**

```html
<button class="flip-card" type="button" data-flip="click" aria-pressed="false">
  <!-- card content -->
</button>
```

Click, Enter, or Space toggles this card on every device.

### Auto-close roster with entrance

**Add to your HTML `<body>`:**

```html
<div class="roster" data-flip-group="auto-close" data-flip-stagger>
  <button class="flip-card" data-flip="hover" type="button">...</button>
  <button class="flip-card" data-flip="hover" type="button">...</button>
  <button class="flip-card" data-flip="hover" type="button">...</button>
</div>
```

## Programmatic API

The `.flipped` class remains the public state API. A `MutationObserver` synchronizes class changes with the full GSAP lighting, shadow, and grid response.

**Add to your JavaScript:**

```javascript
const card = document.querySelector('.flip-card');

card.classList.add('flipped');    // open
card.classList.remove('flipped'); // close
card.classList.toggle('flipped'); // toggle
```

Pressing Escape closes every card initialized by the effect. The script also keeps `aria-pressed` synchronized with the open state.

## Customization

**Add to your stylesheet after `style.css`:**

```css
.flip-card {
  --card-accent: #c7f36b;
  max-width: 320px;
  aspect-ratio: 0.76;
}

.roster {
  perspective: 1800px;
}
```

The core classes are `.flip-card`, `.flip-card-inner`, `.flip-card-front`, and `.flip-card-back`. `.card-edge`, `.card-shadow`, and each `.face-light` provide the layered secondary response and should be retained for the complete effect.

## Accessibility

- Use a semantic `<button>` for each card. Non-semantic `.flip-card` elements receive `role="button"` and `tabindex="0"` as a compatibility fallback.
- Hover cards mirror their open state on keyboard focus; click cards support Enter and Space.
- Escape closes open cards.
- `aria-pressed` is updated whenever the card state changes.
- `prefers-reduced-motion: reduce` removes interpolation and switches faces instantly while preserving every interaction.
- The front remains readable without JavaScript. Adding `.flipped` still switches faces through the CSS fallback.

## Cleanup

All GSAP work is wrapped in `gsap.context()` and responsive behavior uses `gsap.matchMedia()`. Event listeners, the class observer, and effect-owned ScrollTriggers are removed when `window.gsapContext.kill()` runs or the page unloads.

## Dependencies

- GSAP 3.12+ (demo uses 3.14.2)
- ScrollTrigger (only required when keeping the `data-flip-stagger` entrance capability)
- No smooth-scroll library required
