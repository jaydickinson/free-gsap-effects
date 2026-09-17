# Announcement Bar

A top-of-page announcement bar that pushes the page down instead of overlapping it, rotates through the messages you write as list items with a masked line swap and a progress track, and collapses away on dismiss so the page reflows up.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="path/to/style.css">
```

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="path/to/script.js"></script>
```

**3. Add the component markup as the first thing inside `<body>`** (the block marked `<!-- Component starts here -->` in `index.html`). Each message is one `<li>`; the CTA link is optional:

```html
<div class="ann-bar" data-announcement-bar data-type="info" data-interval="5000" role="region" aria-label="Announcements">
  <div class="ann-bar__inner" data-inner>
    <button class="ann-bar__btn ann-bar__prev" type="button" data-prev aria-label="Previous announcement">…</button>
    <div class="ann-bar__viewport" data-messages>
      <ul class="ann-bar__list">
        <li class="ann-bar__msg">
          <span class="ann-bar__pip" aria-hidden="true"></span>
          <span class="ann-bar__text" data-text>Free shipping on every order over £60 until Sunday</span>
          <a class="ann-bar__cta" href="/shipping">See details</a>
        </li>
        <li class="ann-bar__msg">
          <span class="ann-bar__pip" aria-hidden="true"></span>
          <span class="ann-bar__text" data-text>Scheduled maintenance Thursday 02:00 UTC</span>
        </li>
      </ul>
    </div>
    <button class="ann-bar__btn ann-bar__next" type="button" data-next aria-label="Next announcement">…</button>
    <button class="ann-bar__btn ann-bar__close" type="button" data-close aria-label="Dismiss announcement">…</button>
  </div>
  <div class="ann-bar__progress" aria-hidden="true"><span data-progress></span></div>
</div>
```

The bar pushes in on load. Copy the three SVG icons from `index.html`, or use your own.

### Options

| Attribute | Values | Default | What it does |
|-----------|--------|---------|--------------|
| `data-type` | `info`, `promo`, `warning`, `danger` | `info` | Sets the accent (pip, progress fill, CTA) and how the bar is announced |
| `data-interval` | milliseconds | `5000` | Time each message is shown before the next |
| `data-storage-key` | any string | none | When set, a dismissal is written to `localStorage` under this key and the bar does not show again on later visits |
| `data-sticky` | `true` | off | After the push-in the bar becomes `position: sticky` at the top |

## What's Included

- `index.html`: the demo page, the component markup and the light/dark toggle
- `assets/style.css`: the component, its four type accents and both themes
- `assets/script.js`: readable, commented GSAP core source with the public API and cleanup
- `assets/script.min.js`: minified production script

- Height tween on show and dismiss, so the page below moves rather than being covered
- Masked line swap with a per-word stagger on the incoming line; instant cut under reduced motion
- Progress track that is the countdown itself, so pausing holds it where it is
- Pauses on hover, on focus-within and while the tab is hidden
- Steps queued during a swap, so fast arrow presses never desync the index
- Swipe to step on touch; arrows hidden, close and CTA at 44px tap targets
- Roles: `region` on the bar, `status` (polite) or `alert` on the message viewport, real `<button>`s with labels

## Using It With Your Own Design

**What the component needs from your markup:** one element carrying `data-announcement-bar` with, inside it, an element carrying `data-messages` that contains a `<ul>` of `<li>` messages. Everything else is optional and found by hook: `data-inner` (the row that fades on dismiss; defaults to the bar's first child), `data-prev`, `data-next`, `data-close`, `data-progress` (the fill that scales) and `data-text` on the span whose words should stagger (defaults to the whole `<li>`, so put the CTA in its own element if you drop the span).

**What is only the demo's furniture:** the short document under the bar (`.stage-doc`), the 44px toolbar strip across the top of the demo and its script (and the `padding-top: 44px` on `body` that reserves it), and the Google Font links. None of it is part of the component; delete all of it.

**CSS the component depends on:**

- The bar must be in normal flow at the top of the page (not `position: fixed` or `absolute`) or there is nothing to push. Put it before your header.
- `.has-js .ann-bar:not(.is-open) { height: 0; overflow: hidden }` is the pre-hidden start state. Keep it: without it the bar paints at full height and then jumps to zero on the first frame. It is gated under `.has-js` so a page without JavaScript shows the bar in full.
- Do not put a CSS `transform` on `.ann-bar__msg`, `.ann-bar__word` or `[data-progress]`; GSAP owns those, and a CSS transform underneath one is read as a pixel offset it never returns from. `transform-origin` is fine.
- `.ann-bar__viewport` must keep `overflow: hidden` (it is the mask) and `touch-action: pan-y` (so a vertical scroll that starts on the bar is left to the page).
- `.ann-bar__word { display: inline-block }` is what lets each word move on its own.

## Themes

Two themes, `light` (the default) and `dark`: one design at two sets of token values, not two designs.

```html
<body data-variant="dark">
```

The attribute can go on `<body>` or on any ancestor of the bar. Leaving it off gives you `light`. The demo's toggle and the `?variant=dark` URL parameter only set this attribute; neither is part of the component, and nothing in `assets/script.js` reads the theme name.

Every colour, radius and shadow lives in the two `body[data-variant]` blocks at the top of `assets/style.css`, so re-valuing this list is the whole rebrand:

| Token | What it colours |
|-------|-----------------|
| `--ground`, `--ground-2` | The page under the bar (demo furniture) |
| `--raised` | The bar's own background, via `--bar-bg` |
| `--hover` | Button hover on the bar |
| `--ink`, `--ink-2`, `--ink-3` | Message text, body copy, the arrow and close buttons |
| `--line`, `--line-strong` | The hairline under the bar, via `--bar-rule` |
| `--accent`, `--accent-ink` | Focus rings and `::selection` |
| `--progress-track` | The unfilled part of the progress track |
| `--type-info`, `--type-promo`, `--type-warning`, `--type-danger` | The accent per `data-type`; `--bar-accent` derives from them and colours the pip, the progress fill and the CTA |
| `--radius`, `--radius-sm` | Corner radii on the controls |
| `--font` | The face; point it at whatever your page already loads and drop the Google Fonts link |
| `--msg-size`, `--msg-weight` | The message type |

Both themes use one face, Inter, loaded in the demo from Google Fonts. To re-value for your own brand, edit the values in place rather than adding a third block: a second accent is a second opinion, and the four `--type-*` colours already carry the bar's status vocabulary.

## Keyboard & Accessibility

| Key | What it does |
|-----|--------------|
| `Tab` | Reaches the previous, next and close buttons and the current message's CTA (links in hidden messages are out of the tab order) |
| `ArrowLeft` / `ArrowRight` | Previous / next message while focus is inside the bar |
| `Escape` | Dismisses the bar; focus moves to the first focusable element on the page outside it |
| `Enter` / `Space` | Activates the focused button or CTA |

- Roles: the bar is `role="region"` with `aria-label="Announcements"`; the message viewport is `role="status"` with `aria-live="polite"` and `aria-atomic="true"`, switching to `role="alert"` / `assertive` when the type is `danger`. Hidden messages carry `aria-hidden="true"`.
- Rotation pauses on `focus-within`, not just on hover, so a keyboard user gets the same reading time a mouse user does. It also pauses while the tab is hidden.
- Every control has a `:focus-visible` ring in the bar's current accent.
- On coarse pointers the arrow buttons hide; a horizontal swipe on the message steps instead, and the close button and CTA are at least 44px tall.
- Under `prefers-reduced-motion: reduce` the bar mounts open in its final state, messages swap with an instant cut and the progress track is hidden. The interval still runs.

## How It Works

**The push is a height tween.** The bar sits in normal flow. On show the script sets `height: auto`, reads `offsetHeight`, sets the height to zero and tweens it back to the measurement on `power3.out`; `onComplete` clears the inline height to `auto` so a later resize or variant switch reflows naturally. Dismiss runs the same tween to zero on `power3.inOut` while `[data-inner]` fades and the close icon rotates 90 degrees, then sets `hidden`, so an empty bar is never left in the flow. Because the height is real, the page below moves with it.

**A masked line swap.** Every `<li>` is stacked in one grid cell inside the viewport, which has `overflow: hidden`. On a swap the outgoing line tweens `yPercent: -110` with a two-degree lean on `expo.inOut` while the incoming line's word spans rise from `yPercent: 115` on a 35ms stagger. `aria-hidden` and the CTA's `tabindex` follow the active message. A step requested mid-swap is queued and played after it.

**The countdown is the progress track.** The time to the next message is a linear `fromTo` scaling `[data-progress]` from 0 to 1, whose `onComplete` steps forward. Pausing the rotation is pausing that tween, so hover, focus and a hidden tab hold the track where it is.

## Customisation

- Timing: `data-interval` on the bar. Eases and durations are the `gsap.to` / `gsap.fromTo` calls in `assets/script.js` (`show`, `dismiss` and `swapTo`).
- Colours, fonts, radii and the four type accents are custom properties on the two `body[data-variant]` blocks in `assets/style.css` (the table under Themes).
- Swipe threshold: the `40` px net displacement in the `pointerup` handler.
- Message alignment: `.ann-bar__msg { justify-content: center }`; the coarse-pointer block sets it to `flex-start`.

## Programmatic Control

`window.announcementBar` is the first bar on the page.

```js
announcementBar.show();       // push in (a remembered dismissal is left in storage; call forget() to clear it)
announcementBar.dismiss();    // collapse; remembered if data-storage-key is set
announcementBar.next();
announcementBar.prev();
announcementBar.go(2);        // by index, wraps
announcementBar.pause();      // hold the rotation until resume()
announcementBar.resume();
announcementBar.setType('danger');   // swaps the accent and the live-region role
announcementBar.forget();     // clear the localStorage key
announcementBar.index();      // current message index
announcementBar.isOpen();

// On an SPA route change, revert the GSAP context:
window.gsapContext.revert();
```

**Events**, dispatched on the bar element and bubbling:

```js
const bar = document.querySelector('[data-announcement-bar]');
bar.addEventListener('announcement:show', e => {});                    // detail.index
bar.addEventListener('announcement:change', e => console.log(e.detail.index, e.detail.type));
bar.addEventListener('announcement:dismiss', e => {});                 // detail.index
```

## Requirements

- GSAP 3.12+ (the demo uses 3.15.0; core only, no plugins)
- No build step, no framework
