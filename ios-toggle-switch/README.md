# iOS Toggle Switch

Native checkbox toggle whose knob can be tapped or dragged, snaps to the nearer side, stretches while pressed and cross-fades the track colour.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- Tap the track or drag the knob, both reach the same state
- Draggable with bounds, snapping to the nearer side on release
- A short drag still toggles, so a nudge is never ignored
- Track colour cross-fades between the off and on custom properties
- Knob stretches toward the direction of travel while pressed
- Optional label whose text follows the state
- Disabled state that refuses the pointer and the keyboard

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="assets/style.css">
```

**2. Add to your `<body>`:**

```html
<span class="switch" data-switch data-on="On" data-off="Off">
  <input type="checkbox" class="switch-input" id="toggle" name="cellular" role="switch">
  <span class="switch-knob"></span>
</span>
```

Every element carrying `data-switch` is wired up, so a page can hold as many as it likes. An optional state label is any element with `data-switch-label` inside the same `.switch-row`. Add `disabled` to the input for a disabled switch and `is-disabled` to the row for the dimmed styling.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Draggable.min.js"></script>
<script src="assets/script.js"></script>
```

## How It Works

**The checkbox is the state.** The transparent input covers the whole track, so a click anywhere on it is a real checkbox click and the browser does the toggling. Every other path, the drag and the keyboard, writes `checked` and dispatches `change`; the animation is a single listener on that event. Nothing keeps the state in a variable of its own, which is why the switch cannot drift out of step with the form.

**Snap, then reset.** Draggable is created with `type: 'x'` and numeric bounds measured from the track. On release the knob is either within `TAP` pixels of where it started, which counts as a tap and toggles, or it snaps to whichever end it is nearer. The snap tween always finishes with `y: 0` and calls `draggable.update()`, so the next press starts from a clean measurement.

**Colour from custom properties.** The track colour is interpolated with `gsap.utils.interpolate` between the values read from `--track-off` and `--track-on` when the gesture starts, so it tracks the knob live during a drag and cross-fades on a tap.

## Using It With Your Own Design

What the component actually needs from your markup: the `.switch` wrapper with `data-switch`, a checkbox with class `switch-input` inside it, and a `.switch-knob` sibling after that input. Everything else, the card, the rows, the rules and the name labels, is demo styling you can delete.

The non-obvious CSS the effect depends on:

- **The knob must carry no CSS `transform`.** GSAP owns its `x` and `scaleX`. A CSS `translateX` underneath is parsed as a pixel `x` that never clears, and the knob ends up permanently offset.
- The knob's resting position is `left: var(--track-pad)`, and `x: 0` means "off". Move the knob with `left`, not with a transform, if you change the geometry.
- The input is `position: absolute; inset: 0; opacity: 0` and sits **below** the knob in stacking order, so the knob receives the drag and the rest of the track receives the click.
- `.has-js` is added by the script. Without it, `:checked ~ .switch-knob` and `:has(.switch-input:checked)` move and colour the switch in plain CSS, so a no-JavaScript visitor still gets a working, legible control.

## Variants

The switch ships in three looks: `vault` (the default), `glass` and `corporate`. Pick one by setting the attribute on `<body>`:

```html
<body data-variant="glass">
```

Nothing else changes: same markup, same script. The demo's top-right switcher and the `?variant=glass` URL parameter only set that attribute, and dispatch `resize` so the geometry re-measures.

To add your own look, copy any `body[data-variant="..."]` block in `assets/style.css`, rename the attribute value and change the custom properties. The script never hard-codes a colour: both track colours are read with `getComputedStyle` at the moment they are needed.

## Customisation

- Colours, radii and shadows live in `assets/style.css` as custom properties per variant; the vault accent is `#c8ff00`.
- `SNAP` and `TAP` at the top of `assets/script.js` are the knob travel time and the movement threshold below which a drag counts as a tap. Raise `TAP` for a more forgiving nudge.
- The snap easing is `back.out(1.7)`. Drop the overshoot to `power3.out` for a flatter, more system-like feel.
- The press stretch is `scaleX: 1.16` with the transform origin set to whichever side the knob is heading for.
- Switch size is `.switch` width and height plus `--track-pad`; the knob sizes itself from the track height, so one number changes the whole control.

## Accessibility

- The control is a native `<input type="checkbox">` with `role="switch"`, so Tab, Space, form submission and the announced on/off state all come from the browser.
- The visible name is a `<label for="...">`, so clicking the text toggles the switch too.
- A focus ring is drawn on the track with `:has(.switch-input:focus-visible)`.
- The disabled switch uses the real `disabled` attribute; Draggable is not created for it, so the knob cannot be dragged either.
- `prefers-reduced-motion: reduce` sets the knob and the track colour instantly and skips the press stretch. Dragging still works.

## Requirements

- GSAP 3.12+ and the Draggable plugin
- No build step, no framework
