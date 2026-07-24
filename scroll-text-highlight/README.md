# Scroll Text Highlight

A scroll-linked reading highlight. SplitText breaks a block of copy into words, and one scrubbed ScrollTrigger lights each word from dim to full as you scroll, so a bright band of highlighted words moves through the paragraph: dim text ahead of you, settled text behind. The leading word flashes the accent colour before relaxing to the foreground, and scrolling back up smoothly un-lights the words.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/SplitText.min.js"></script>
<script src="path/to/script.js"></script>
```

**Note:** GSAP and all plugins (including SplitText) are free for everyone. Lenis is optional; add `<script src="https://unpkg.com/lenis@1.3.17/dist/lenis.min.js"></script>` before `script.js` for smooth scrolling.

**3. Add the `scroll-highlight` class to any block of copy in your `<body>`:**

```html
<p class="scroll-highlight">
  Some copy that lights up word by word as the reader scrolls it into view.
</p>
```

That is the whole setup. The block starts dimmed and lights up as it scrolls through the viewport. It works the same on a paragraph or a large heading.

## Options

Set these as data attributes on the `.scroll-highlight` element.

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-highlight-dim` | `0` to `1` | `0.18` | Resting opacity of un-read words |
| `data-highlight-accent` | `true`, `false` | `true` | Whether the leading word flashes the accent colour before settling |
| `data-highlight-lift` | Any number (px) | `0` | Optional restrained lift each word rises as it lights |
| `data-highlight-scrub` | `true` or a number | `true` | `true` locks the highlight to scroll; a number (seconds) adds smoothing catch-up |

The accent colour comes from the `--accent` CSS variable, so restyle it in one place:

```css
.scroll-highlight { --accent: #c8ff00; }
```

## Examples

### Editorial paragraph (default)

**HTML:**
```html
<p class="scroll-highlight">
  We have forgotten how to read slowly. Some ideas only give themselves
  up at reading pace, one word at a time, in the order the writer set them.
</p>
```

### Statement heading

**HTML:**
```html
<h2 class="scroll-highlight">
  Design is the quiet art of deciding what a reader notices first.
</h2>
```

### Deeper dim and a subtle word lift

**HTML:**
```html
<p class="scroll-highlight" data-highlight-dim="0.1" data-highlight-lift="6">
  A stronger contrast between read and unread copy, with each word
  lifting a few pixels as it brightens.
</p>
```

### No accent flash, softer scrub

**HTML:**
```html
<p class="scroll-highlight" data-highlight-accent="false" data-highlight-scrub="0.6">
  Just a clean dim-to-full brightening, with the highlight easing to
  catch up to the scroll position.
</p>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.scroll-highlight` | The block of copy to highlight on scroll |
| `.sh-word` | Applied by SplitText to each generated word span |
| `.is-reading` | Added by the script once the effect is live (CSS hook) |

## Accessibility

- **Reduced motion**: readers with `prefers-reduced-motion: reduce` see the full copy at full opacity immediately, with no dimming or scrubbing.
- **No JavaScript / no SplitText**: the dim state is only ever applied by GSAP, so a reader without JavaScript (or without the SplitText plugin) always gets plain, full-opacity, fully legible text.
- **Native scroll**: the effect is driven purely by scroll position, so it works with keyboard scrolling and on touch with no separate code path.
- **Readable throughout**: even the dimmed state keeps text on its resting foreground colour, so nothing is hidden or unselectable.

## Performance Notes

- One `SplitText` split and one scrubbed `ScrollTrigger` timeline per block.
- Word spans are `display: inline-block` with `will-change: opacity, transform` so the lift and fade stay on the compositor.
- The script waits for `document.fonts.ready` before splitting, so words measure and wrap at their final widths, then calls `ScrollTrigger.refresh()`.

## Dependencies

**Required:**
- GSAP 3.12+
- ScrollTrigger plugin
- SplitText plugin (free)

**Optional:**
- Lenis (smooth scroll integration)
