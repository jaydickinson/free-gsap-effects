# Copy to Clipboard Button

A snippet block whose copy button morphs its clipboard icon into a stroke-drawn check, floats a "Copied" pill up beside it and flashes the code it took.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, every colour and size a plain CSS custom property
- `assets/script.js`: readable, commented source with an `onReady` guard

- Clipboard icon tips and shrinks away while a tick scales in over it
- The tick draws itself by tweening `strokeDashoffset`, no DrawSVG plugin needed
- "Copied" pill rises and fades in above the button, then leaves upward
- The snippet flashes its accent so it is clear which block was copied
- Clipboard failure shakes the button, selects the code and explains itself
- Every state change announced through an `aria-live` status line
- `window.copyButton.copy / reset / text` for your own code

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<script>document.documentElement.className += ' has-js';</script>
<link rel="stylesheet" href="assets/style.css">
```

The inline line is a convention shared across these components; nothing this one hides is content, so a no-JavaScript visitor still gets the full snippet and a real button.

**2. Add to your `<body>`:**

Copy the `<div class="cp-block">` block out of `index.html`. It is a bar (filename, pill, button) above a `<pre><code>`. The ids the script needs are `cpBtn`, `cpBtnLabel`, `cpCode`, `cpPre` and `cpPill`, plus `cpStatus` for the live region. Put whatever you like inside the `<code>`: the script copies its `textContent`, so token spans for colouring do not change what lands on the clipboard.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

**4. Drive it from your own code:**

```js
// same as a click
window.copyButton.copy();

// what would be copied, trimmed
console.log(window.copyButton.text());

// back to the resting state early
window.copyButton.reset();
```

For several blocks on one page, wrap the init body in a loop over `document.querySelectorAll('.cp-block')` and read each element from the block rather than by id. The animation code does not change.

## Using It With Your Own Design

What the component actually requires:

- A `.cp-icon` box with `position: relative` holding both SVGs absolutely stacked. That stacking is what makes the swap read as a morph rather than a layout jump.
- A `.cp-copy` wrapper with `position: relative` so the pill can be pinned above the button. Move that and the pill moves with it.
- The check path needs to be a single open path. Its length is measured at runtime, so change the `d` attribute freely and the draw still works.
- Nothing in your CSS may set a `transform` on the button, either icon or the pill. GSAP animates `scale`, `rotation`, `x` and `y` on those, and a CSS transform is parsed into the same values and fights them.

What is only the demo's dressing and can be deleted: the filename in the bar, the token colour spans in the snippet, the status line and the demo controls. The `<pre>` flash is optional too; delete `flashSnippet()` and the rest of the sequence is unchanged.

## How It Works

**Two icons, one slot.** The clipboard and the tick are two SVGs absolutely stacked in a 17px box. Copying tweens the clipboard's `opacity`, `scale` and `rotation` away and scales the tick in behind it on a `back` ease, so the swap reads as one object changing rather than two elements toggling.

**Drawing the tick.** The tick is one SVG path. Its length is read once with `getTotalLength`, then `strokeDasharray` and `strokeDashoffset` are both set to that length so the stroke is fully retracted. GSAP tweens `strokeDashoffset` to `0` and the line draws itself. That is the whole trick, and it needs no plugin.

**The failure path is a state, not an error.** The copy runs through the Clipboard API's promise, and both a missing API and a rejected write land in the same handler. That handler puts the button into its error colour, shakes it on `x`, selects the snippet with a `Range` so the keyboard shortcut works, and writes a sentence explaining what happened into the live region. The demo's "Simulate no clipboard" toggle forces that path so you can see the state without breaking your browser.

**The flash gives the background back.** The snippet flash tweens `backgroundColor` from the variant's `--code-flash` to its `--code-bg`, then clears the inline property with `clearProps` so the stylesheet owns the colour again. Without that, switching variant after a copy would leave the block stuck on the previous look's colour.

## Variants

The component ships in three looks: `vault` (the default), `glass` and `paper`. Pick one by setting the attribute on `<body>`:

```html
<body data-variant="glass">
```

Nothing else changes: same markup, same script. The demo's top-right switcher and the `?variant=paper` URL parameter only set that attribute.

To add your own look, copy any `body[data-variant="..."]` block in `assets/style.css`, rename the attribute value and change the custom properties. Every colour, radius and font the component uses is a property in that block, including the five syntax token colours, so a new variant never needs a selector override. The script reads `--code-flash`, `--code-bg`, `--pill-ok-bg`, `--pill-ok-fg`, `--pill-err-bg` and `--pill-err-fg` with `getComputedStyle` at the moment each tween starts, so a variant swap is correct on the next copy.

## Customisation

| Property | Where | Default (vault) | Description |
|----------|-------|-----------------|-------------|
| `--code-bg` | `style.css` | `#101219` | Snippet ground, and the colour the flash returns to |
| `--code-flash` | `style.css` | `#1d2540` | Colour the snippet flashes from on a successful copy |
| `--code-size` | `style.css` | `0.82rem` | Snippet type size |
| `--tok-key` / `--tok-str` / `--tok-num` / `--tok-fn` / `--tok-prop` | `style.css` | see block | The five syntax token colours |
| `--btn-ok-fg` | `style.css` | `#c8ff00` | Button colour once the copy has landed |
| `--btn-err-fg` | `style.css` | `#ff8a7a` | Button colour on the fallback path |
| `--pill-ok-bg` | `style.css` | `#c8ff00` | "Copied" pill ground |
| `--pill-err-bg` | `style.css` | `#ff5a52` | Fallback pill ground |
| `--sel-bg` / `--sel-fg` | `style.css` | `#c8ff00` / `#05070a` | Selection colours used on the fallback path |
| `--block-radius` | `style.css` | `12px` | Block corner radius (`0px` in paper squares it off) |
| `TEXT` | `script.js` | `Copy / Copied / Select text` | The three button labels |
| `HOLD_SECONDS` | `script.js` | `1.9` | How long a state is held before it resets |

Easings and durations are the `gsap.to` and `gsap.fromTo` calls in `succeed()`, `fallback()` and `showPill()`. The tick shape is the `d` attribute of `.cp-check-path` in `index.html`; change it and the draw still works, because the path's length is measured at runtime.

## Accessibility

- The control is a real `<button>`, keyboard operable with Tab and Enter, and nothing about the copy relies on hover.
- Every state writes a sentence into a `role="status"` line, including the fallback, which names the reason and tells the visitor the snippet has been selected for them.
- The pill is `aria-hidden` decoration, so the same message is never read twice.
- On the fallback path the snippet is selected with a `Range`, so the browser's own copy shortcut finishes the job without a mouse.
- Under `prefers-reduced-motion: reduce` every duration collapses to zero and the shake and the flash are skipped: the states still happen in order, they just do not animate.
- With JavaScript off the snippet is fully visible and selectable and the button is still a button; nothing is hidden behind a class that never arrives.
- Focus is visible on the button, the demo controls and the variant switcher via `:focus-visible` outlines.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- A secure context (HTTPS or localhost) for the Clipboard API; anywhere else the component falls back to selecting the snippet
- No build step, no framework
