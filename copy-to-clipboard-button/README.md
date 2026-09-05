# Copy to Clipboard Button

A copy control whose clipboard icon morphs into a stroke-drawn check, floats a "Copied" pill above itself and flashes the value it took. Every `.cp-block` on the page becomes its own instance, so a list of API keys and a share link all run the same code.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, every colour and size a plain CSS custom property
- `assets/script.js`: readable, commented source with an `onReady` guard

- Clipboard icon tips and shrinks away while a tick scales in over it
- The tick draws itself by tweening `strokeDashoffset`, no DrawSVG plugin needed
- "Copied" pill rises and fades in above the button, then leaves upward
- The value flashes its success tone so it is clear which one was taken
- A masked value can carry the real string in `data-cp-value`
- Clipboard failure shakes the button, selects the value and explains itself
- Every state change announced through one shared `aria-live` status line
- `window.copyButton.copy / reset / text`, and `window.copyButtons` for the list

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<script>document.documentElement.className += ' has-js';</script>
<link rel="stylesheet" href="assets/style.css">
```

The inline line is a convention shared across these components; nothing this one hides is content, so a no-JavaScript visitor still gets the full value and a real button.

**2. Add to your `<body>`:**

Copy one `<div class="cp-block">` out of `index.html`. The classes the script needs inside it are `cp-btn`, `cp-btn-label`, `cp-code`, `cp-pre` and `cp-pill`, plus `cp-clip`, `cp-check` and `cp-check-path` on the two icons. One `<p class="cp-status" role="status">` anywhere on the page is the shared live region for every block.

Put whatever you like inside the `<code class="cp-code">`: the script copies its `textContent`. If the value on screen is masked, put the real string in `data-cp-value` on the same element and that is what lands on the clipboard:

```html
<pre class="cp-pre"><code class="cp-code" data-cp-value="sk_live_7Qa8xR2mVn41bZk9fD2pT6">sk_live_7Qa8••••••••••••pT6</code></pre>
```

Repeat the block as many times as you need; each one initialises itself. Nothing is queried by id.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

**4. Drive it from your own code:**

```js
// same as a click on the first block
window.copyButton.copy();

// what would be copied, trimmed
console.log(window.copyButton.text());

// back to the resting state early
window.copyButton.reset();

// every block on the page, in document order
window.copyButtons.forEach(function (b) { b.reset(); });
```

## Using It With Your Own Design

What the component actually requires:

- A `.cp-icon` box with `position: relative` holding both SVGs absolutely stacked. That stacking is what makes the swap read as a morph rather than a layout jump.
- A `.cp-copy` wrapper with `position: relative` so the pill can be pinned above the button. Move that and the pill moves with it.
- The check path needs to be a single open path. Its length is measured at runtime, so change the `d` attribute freely and the draw still works.
- Nothing in your CSS may set a `transform` on the button, either icon or the pill. GSAP animates `scale`, `rotation`, `x` and `y` on those, and a CSS transform is parsed into the same values and fights them.
- Give the button a `min-width`. The label swaps between `Copy`, `Copied` and `Select text`, and without one the row shuffles on every copy.

**What is demo furniture and not part of what you bought:** the toolbar strip across the top of `index.html` (its markup, CSS and script all live in that file, never in `assets/`), the `.stage` / `.stage__inner` ground, the `.cp-panel` cards and their headings, the "Simulate no clipboard" toggle, and the key and link copy. The component is the `.cp-block` and the status line.

## Themes

The component ships in two themes, `light` and `dark`: one design at two token values. Set the attribute on `<body>`, or on any wrapper around the blocks:

```html
<body data-variant="dark">
```

Nothing else changes: same markup, same script. The demo's toolbar toggle and the `?variant=light` URL parameter only set that attribute.

Every colour the component and the demo ground use is a custom property in the two `body[data-variant="..."]` blocks at the top of `assets/style.css`:

- **Ground**: `--ground`, `--ground-2`, `--raised`, `--hover`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-strong`, `--shadow`
- **Value**: `--code-bg`, `--code-fg`, `--code-flash`, `--code-size`, `--font-code`
- **Button**: `--btn-bg`, `--btn-hover`, `--btn-fg`, `--btn-line`, `--btn-ok-fg`, `--btn-err-fg`
- **Pill and selection**: `--pill-ok-bg`, `--pill-ok-fg`, `--pill-err-bg`, `--pill-err-fg`, `--sel-bg`, `--sel-fg`
- **Accent and shape**: `--accent`, `--accent-ink`, `--focus`, `--radius`, `--radius-sm`, `--radius-xs`, `--font`

To wear your own brand, re-value that list; there is no selector to override. The script reads `--code-flash`, `--code-bg`, `--pill-ok-bg`, `--pill-ok-fg`, `--pill-err-bg` and `--pill-err-fg` with `getComputedStyle` on the block at the moment each tween starts, so a theme swap is correct on the next copy.

## How It Works

**Two icons, one slot.** The clipboard and the tick are two SVGs absolutely stacked in a 17px box. Copying tweens the clipboard's `opacity`, `scale` and `rotation` away and scales the tick in behind it on a `back` ease, so the swap reads as one object changing rather than two elements toggling.

**Drawing the tick.** The tick is one SVG path. Its length is read once with `getTotalLength`, then `strokeDasharray` and `strokeDashoffset` are both set to that length so the stroke is fully retracted. GSAP tweens `strokeDashoffset` to `0` and the line draws itself. That is the whole trick, and it needs no plugin.

**The failure path is a state, not an error.** The copy runs through the Clipboard API's promise, and both a missing API and a rejected write land in the same handler. That handler puts the button into its error colour, shakes it on `x`, selects the value with a `Range` so the keyboard shortcut works, and writes a sentence explaining what happened into the live region. The demo's "Simulate no clipboard" toggle forces that path so you can see the state without breaking your browser.

**The flash gives the background back.** The value flash tweens `backgroundColor` from `--code-flash` to `--code-bg`, then clears the inline property with `clearProps` so the stylesheet owns the colour again. Without that, switching theme after a copy would leave the block stuck on the previous theme's colour.

## Customisation

| Property | Where | Default (dark) | Description |
|----------|-------|----------------|-------------|
| `--code-bg` | `style.css` | `#232323` | Value ground, and the colour the flash returns to |
| `--code-flash` | `style.css` | `#24382f` | Colour the value flashes from on a successful copy |
| `--code-size` | `style.css` | `0.8125rem` | Value type size |
| `--font-code` | `style.css` | system mono stack | The face the value is set in |
| `--btn-ok-fg` | `style.css` | `#55c08c` | Button colour once the copy has landed |
| `--btn-err-fg` | `style.css` | `#f08b84` | Button colour on the fallback path |
| `--pill-ok-bg` / `--pill-ok-fg` | `style.css` | `#2a5c45` / `#d8f3e5` | "Copied" pill |
| `--pill-err-bg` / `--pill-err-fg` | `style.css` | `#5c2a27` / `#ffd9d5` | Fallback pill |
| `--accent` | `style.css` | `#6d4cff` | The primary button, the focus ring and the selection |
| `--sel-bg` / `--sel-fg` | `style.css` | accent / white | Selection colours used on the fallback path |
| `data-cp-value` | markup | none | The real string to copy when the visible value is masked |
| `TEXT` | `script.js` | `Copy / Copied / Select text` | The three button labels |
| `HOLD_SECONDS` | `script.js` | `1.9` | How long a state is held before it resets |

Easings and durations are the `gsap.to` and `gsap.fromTo` calls in `succeed()`, `fallback()` and `showPill()`. The tick shape is the `d` attribute of `.cp-check-path` in `index.html`; change it and the draw still works, because the path's length is measured at runtime.

## Accessibility

- The control is a real `<button>`, keyboard operable with Tab and Enter, and nothing about the copy relies on hover.
- Each button's accessible name says which value it copies: the visible label plus a visually hidden phrase (`Copy production key`).
- Every state writes a sentence into one shared `role="status"` line, including the fallback, which names the reason and tells the visitor the value has been selected for them.
- The pill is `aria-hidden` decoration, so the same message is never read twice.
- On the fallback path the value is selected with a `Range`, so the browser's own copy shortcut finishes the job without a mouse.
- Under `prefers-reduced-motion: reduce` every duration collapses to zero and the shake and the flash are skipped: the states still happen in order, they just do not animate.
- With JavaScript off every value is fully visible and selectable and the buttons are still buttons; nothing is hidden behind a class that never arrives.
- Focus is visible on every button via a `:focus-visible` outline in the accent.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- A secure context (HTTPS or localhost) for the Clipboard API; anywhere else the component falls back to selecting the value
- No build step, no framework
