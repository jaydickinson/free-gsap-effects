# Star Rating

Five-star rating on native radios: hovering sweeps the fill up to the pointer with a stagger, clicking locks it with a spring pop, a sparkle and a cross-faded word.

## What's Included

- `index.html`: the demo page and the markup to copy
- `assets/style.css`: component styles, plain CSS custom properties for colours
- `assets/script.js`: readable, commented source with an `onReady` guard

- Hover sweep that fills up to the pointer with a per-star stagger
- Roll-back on leave, staggered from the far end so it unwinds
- Spring pop on the chosen star with an elastic settle
- Sparkle burst in the accent, built and cleaned up per click
- Rating word cross-fades between Poor, Fair, Good, Great and Excellent
- Half-star support with a single `data-half` attribute
- Native radio group: Tab, arrow keys, forms and screen readers all work
- Stars still fill from `:checked` with no JavaScript running
- Light and dark themes on one short list of custom properties

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<link rel="stylesheet" href="assets/style.css">
```

**2. Add to your `<body>`:**

Copy one `.rating` block from `index.html`. Its shape is:

```html
<div class="rating" data-rating data-rest-label="Tap a star to rate">
  <fieldset class="rating-stars">
    <legend class="sr-only">Overall rating</legend>
    <div class="rating-row" aria-hidden="true">
      <!-- five .star spans, each an empty SVG plus a .star-fill window -->
    </div>
    <div class="rating-hits">
      <input type="radio" class="rating-hit" name="overall" value="1" aria-label="1 star, Poor">
      <!-- ...values 2 to 5 -->
    </div>
  </fieldset>
  <p class="rating-label" data-rating-label></p>
</div>
```

Every element carrying `data-rating` is wired up, so a page can hold as many ratings as it likes; give each its own `name`.

**3. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="assets/script.js"></script>
```

## Options

| Attribute | On | Values | Default | Description |
|---|---|---|---|---|
| `data-rating` | `.rating` | present | required | Marks a rating for the script to wire up |
| `data-half` | `.rating` | present | absent | Switches to half-star steps; ship ten radios, `0.5` to `5` |
| `data-rest-label` | `.rating` | any string | empty | Word shown while nothing is chosen |
| `data-rating-label` | any element | present | optional | The element whose text follows the rating |
| `checked` | `.rating-hit` | present | none | The starting rating |

The demo ships whole-star steps. For half stars, add `data-half` to the `.rating` wrapper and ship ten radios, `0.5` through `5`.

## How It Works

**The radios are the control.** Five transparent hit strips are laid across the stars in DOM order, one radio each, so focus, arrow-key movement, form submission and the announced label all come from the browser. The stars are `aria-hidden` decoration drawn underneath, and nothing keeps the rating in a variable of its own.

**Fill is a clipping window.** Each star is drawn twice: an empty one, and a coloured one inside an `overflow: hidden` span. GSAP animates that span's `width` as a percentage, so a fill of 50 per cent is a genuine half star rather than a second icon. The hover sweep tweens all five widths in one call with a stagger that runs `from: 'start'` on the way up and `from: 'end'` on the way back, which is what makes the roll-back read as unwinding rather than snapping.

**Lock, pop, sparkle.** A `change` event on the group paints the fill instantly, springs the chosen star from `scale: 0.72` with `elastic.out(1, 0.42)`, and appends a handful of sparkle spans that tween outward and remove themselves `onComplete`. The word underneath cross-fades: out and up, text swap, in from below.

## Using It With Your Own Design

What the component actually needs from your markup: a `.rating` wrapper with `data-rating`, a `.rating-row` holding five `.star` spans each containing a `.star-fill` window, and a `.rating-hits` row of radios. Everything else on the demo page is furniture: the toolbar strip, the `.stage-*` ground and form group, the comment field and the submit button are demo styling, not part of what you bought, and can be deleted.

The non-obvious CSS the effect depends on:

- **`.star` must carry no CSS `transform`.** GSAP owns its `scale` for the click pop. A CSS transform underneath is parsed as a pixel offset that never clears.
- **`.star-fill` starts at `width: 0`** and is `position: absolute; overflow: hidden`. The SVG inside it is sized in pixels from `--star-size`, not in per cent, or clipping it would squash it instead of cropping it.
- `.rating-hits` is `position: absolute; inset: 0; display: flex` over the star row, and each radio is `flex: 1; opacity: 0`. The number of radios sets the number of steps, so half-star mode is simply ten of them. Anything you want to stay clickable (a visible heading, for instance) goes outside the `<fieldset>`, because the hit strips cover all of it.
- `.has-js` is added by the script. Without it, the `:has(.rating-hit[value="..."]:checked)` rules set a `--nojs-fill` number and each star's width is derived from it with `calc()`, so a visitor with no JavaScript still sees the rating they picked.

## Themes

The rating ships in two themes, `light` (the default) and `dark`. They are one design at two sets of token values, not two designs. Pick one by setting the attribute on `<body>`, or on the component's own wrapper in your page:

```html
<body data-variant="dark">
```

Nothing else changes: same markup, same script, and the script never reads the attribute. The demo's toolbar toggle and the `?variant=dark` URL parameter only set it.

The tokens each theme defines, at the top of `assets/style.css`:

| Token | What it colours |
|---|---|
| `--ground`, `--ground-2`, `--raised`, `--hover` | the surfaces behind and under the control |
| `--ink`, `--ink-2`, `--ink-3` | headings, the rating word, secondary copy |
| `--line`, `--line-strong` | hairlines and the input border |
| `--accent`, `--accent-ink`, `--accent-wash` | the accent (`#f5c400`), text on it, and its wash |
| `--star-on`, `--star-empty`, `--star-gap` | the filled star, the empty star, the spacing |
| `--focus` | the keyboard focus ring |
| `--radius`, `--radius-sm`, `--radius-xs`, `--shadow`, `--font` | shape, elevation and type |

To fit your own brand, re-value that list in the two `body[data-variant="..."]` blocks. The script hard-codes no colour: the sparkle accent is read from `--star-on` with `getComputedStyle` at the moment it is needed.

## Customisation

- Colours, radii and shadows live in `assets/style.css` as custom properties per theme; the accent is `#f5c400` and its only job is the filled star.
- `--star-size` on `.rating-stars` sizes the whole control, and `--star-gap` sets the spacing between stars.
- `STAGGER`, `FILL` and `SPARKS` at the top of `assets/script.js` are the per-star delay, the sweep duration and the number of sparkle particles. Set `SPARKS` to `0` for a quieter click.
- The pop is `elastic.out(1, 0.42)` from `scale: 0.72`. Swap to `back.out(3)` for a shorter, flatter spring.
- `WORDS` is the five-item array behind the label. Replace it with your own wording, or with an empty array plus a `data-rest-label` if you only want the numeric rating.

## Accessibility

- The control is a native radio group inside a `<fieldset>` with a `<legend>`, so Tab reaches it, the arrow keys move through the options and it submits with an ordinary form.
- Every radio carries an `aria-label` naming its rating in words, and the stars are `aria-hidden` so nothing is announced twice.
- Keyboard focus draws a ring on the star that the focused radio represents, using `:focus-visible` so it does not appear on a mouse click.
- Touch pointers skip the hover sweep, so a tap goes straight to the locked state instead of previewing under the finger.
- `prefers-reduced-motion: reduce` fills, pops and swaps the word instantly and skips the sparkle. Every state is still reachable.

## Requirements

- GSAP 3.12+ (core only, no plugins)
- No build step, no framework
