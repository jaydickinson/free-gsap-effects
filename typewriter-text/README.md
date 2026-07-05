# Typewriter Text

Text types out character by character with a blinking cursor when scrolled into view. Supports looping phrases, custom speed, and delay controls.

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

**3. Add `data-typewriter` to any text element in your `<body>`:**

```html
<h1 data-typewriter>Build interfaces that feel alive.</h1>
```

That's it. The element's own text is read, cleared, and typed back in when it scrolls into view.

## Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-type-speed` | Seconds per character | `0.045` | Typing speed; lower is faster |
| `data-type-delay` | Seconds | `0` | Delay before typing starts, after the element enters the viewport |
| `data-type-cursor` | `true`, `false` | `true` | Show the blinking cursor |
| `data-type-loop` | Comma-separated phrases | none | Phrases to rotate through after the first: types, pauses, deletes, types the next, and loops forever |

## Examples

### Slower Typing With a Delay

**HTML:**
```html
<h2 data-typewriter data-type-speed="0.08" data-type-delay="0.5">
  Deliberate, dramatic typing.
</h2>
```

### No Cursor

**HTML:**
```html
<p data-typewriter data-type-cursor="false">Clean typing, no cursor.</p>
```

### Looping Phrases

The element types its own text first, then rotates through the loop list:

**HTML:**
```html
<p>We build
  <span data-typewriter
        data-type-loop="smooth animations, bold interfaces, memorable experiences">
    delightful websites
  </span>
</p>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.typewriter__text` | Span holding the typed characters (created automatically) |
| `.typewriter__cursor` | Blinking cursor span (created automatically) |
| `.is-typing` | Applied to the element when typing begins |
| `.is-complete` | Applied when a non-looping element finishes typing |

The cursor blink is pure CSS. Restyle it by overriding `.typewriter__cursor`:

**CSS:**
```css
.typewriter__cursor {
  background: #ff3366; /* cursor colour */
  width: 0.5em;        /* block-style cursor */
}
```

## Events

The effect dispatches custom events (they bubble). Add this to your own JavaScript:

**JavaScript:**
```javascript
const el = document.querySelector('[data-typewriter]');

el.addEventListener('typewriter:start', (e) => {
  console.log('Typing started:', e.detail.text);
});

el.addEventListener('typewriter:complete', (e) => {
  console.log('Phrase finished:', e.detail.text, 'index:', e.detail.index);
});
```

| Event | Detail | Description |
|-------|--------|-------------|
| `typewriter:start` | `{ text }` | Fired once when typing begins |
| `typewriter:complete` | `{ text, index }` | Fired each time a phrase finishes typing (once per phrase in loop mode) |

## Accessibility

- **Reduced motion**: with `prefers-reduced-motion: reduce`, the full text is shown instantly and the cursor is hidden; nothing animates
- **Screen readers**: the complete original text is set as `aria-label` on the element before typing starts, so assistive technology never hears partial words; the animated spans are `aria-hidden`
- **No layout shift**: reserve space with `min-height` on the element (see the demo CSS) so surrounding content does not jump while typing
- **Non-interactive**: the effect adds no focusable elements and does not trap keyboard focus

## Browser Support

Modern browsers (ES6+). Not compatible with IE11.

## Dependencies

**Required:**
- GSAP 3.12+
- ScrollTrigger plugin

**Optional:**
- Lenis (smooth scroll integration; effect works without it)
