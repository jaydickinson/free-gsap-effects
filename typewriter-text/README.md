# Typewriter Text

A scroll-triggered typewriter sequence that types rapidly, holds, accelerates through deletion, and cycles through optional phrases. Cursor, status, progress, and background hooks can react to every phase.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="path/to/script.js"></script>
```

**3. Add `data-typewriter` to text in your `<body>`:**

```html
<h1 data-typewriter>WE MAKE IDEAS MOVE.</h1>
```

The element's complete text is the static fallback. When it reaches 85% of the viewport, the script clears it and types it back once.

## Options

| Attribute | Values | Default | Description |
|---|---:|---:|---|
| `data-type-speed` | Seconds per character | `0.045` | Typing speed; lower values type faster |
| `data-type-delay` | Seconds | `0` | Delay after the element enters the viewport |
| `data-type-cursor` | `true`, `false` | `true` | Adds the generated cursor when no external cursor hook exists |
| `data-type-loop` | Comma-separated phrases | none | Phrases to rotate through after the element's own text |
| `data-type-mobile` | Text | element text | Shorter initial phrase below 600px to preserve a single line |
| `data-type-loop-mobile` | Comma-separated phrases | `data-type-loop` | Shorter looping phrases below 600px |
| `data-type-hold` | Seconds | `1.8` | Time each looping phrase remains complete |
| `data-type-delete-speed` | Multiplier | `0.5` | Delete duration relative to typing; lower is faster |

The original `speed`, `delay`, `cursor`, and looping phrase attributes remain compatible. `hold` and `delete-speed` are optional additions.

## Examples

### Looping Creative Commands

**Add to your HTML `<body>`:**

```html
<h1 data-typewriter
    data-type-speed="0.055"
    data-type-delay="0.35"
    data-type-hold="3"
    data-type-delete-speed="0.75"
    data-type-mobile="MAKE IT MOVE."
    data-type-loop="WE DESIGN SYSTEMS WITH INTENT.,WE SHIP MOTION AT FRAME RATE."
    data-type-loop-mobile="IDEAS IN MOTION.,SYSTEMS THAT MOVE.">
  WE MAKE DIGITAL IDEAS MOVE.
</h1>
```

The element's own text always runs first. Every phrase types linearly, holds, then deletes with `power3.in` acceleration before the next phrase lands.

### Deliberate One-Time Reveal

**Add to your HTML `<body>`:**

```html
<h2 data-typewriter data-type-speed="0.08" data-type-delay="0.5">
  Deliberate, dramatic typing.
</h2>
```

Omit `data-type-loop` for a one-time scroll-triggered sequence.

### Hide the Generated Cursor

**Add to your HTML `<body>`:**

```html
<p data-typewriter data-type-cursor="false">Clean typing, no cursor.</p>
```

## Optional System Hooks

Wrap the line in `data-typewriter-system` to synchronize your own interface. All hooks are optional.

**Add to your HTML `<body>`:**

```html
<section data-typewriter-system data-phase="ready">
  <h2 data-typewriter data-type-loop="BUILD BOLDLY,SHIP CLEARLY">
    DESIGN WITH INTENT
  </h2>

  <span data-typewriter-cursor aria-hidden="true"></span>
  <span data-typewriter-status aria-hidden="true">READY</span>
  <span class="progress" aria-hidden="true">
    <span data-typewriter-progress></span>
  </span>
  <button type="button" data-typewriter-replay>Replay</button>
</section>
```

During playback, the wrapper's `data-phase` changes between `typing`, `holding`, `deleting`, and `ready`. Use those values in CSS to react without adding more JavaScript:

**Add to your CSS:**

```css
[data-typewriter-system][data-phase="typing"] [data-typewriter-cursor] {
  background: lime;
}

[data-typewriter-system][data-phase="deleting"] [data-typewriter-cursor] {
  background: cyan;
  transform: scaleY(0.45);
}
```

## Generated CSS Classes

| Class | Description |
|---|---|
| `.typewriter__text` | Span containing the animated characters |
| `.typewriter__cursor` | Generated cursor when `data-type-cursor` is enabled |
| `.is-typing` | Applied while characters are being added |
| `.is-deleting` | Applied while characters are being removed |
| `.is-complete` | Applied after a non-looping sequence settles |

## Events

Events bubble from the animated element.

**Add to your JavaScript:**

```javascript
const el = document.querySelector('[data-typewriter]');

el.addEventListener('typewriter:start', (event) => {
  console.log('Sequence started:', event.detail.text);
});

el.addEventListener('typewriter:complete', (event) => {
  console.log('Phrase complete:', event.detail.text, event.detail.index);
});
```

| Event | Detail | Description |
|---|---|---|
| `typewriter:start` | `{ text }` | Fires when the timeline first begins |
| `typewriter:complete` | `{ text, index }` | Fires whenever a phrase finishes typing |

## Cleanup

The effect stores its GSAP context on `window.gsapContext`. In a page transition or component teardown, call:

**Add to your JavaScript teardown:**

```javascript
window.gsapContext?.revert();
```

This kills the effect's timelines and ScrollTriggers and removes replay listeners.

## Accessibility

- The element's original complete phrase is its no-JavaScript fallback and accessible label.
- Generated character and cursor spans are hidden from assistive technology.
- `prefers-reduced-motion: reduce` skips typing, deletion, cursor motion, and looping, leaving the strongest complete phrase visible.
- Replay uses a native `<button>`, so it works with keyboard and touch input.
- Reserve enough height for the longest phrase if your phrases vary substantially, preventing layout shift.

## Dependencies

**Required:**

- GSAP 3.12+
- ScrollTrigger

No SplitText or smooth-scroll library is required.
