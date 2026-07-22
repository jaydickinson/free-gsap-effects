# Link in Bio Template: "Tati Moreno"

A complete one-page creator profile: avatar, name, one-line bio, a stack of
link cards, one feature slot for whatever is newest, and a tiny footer. The
cards are the page: styled as die-cut stickers, they toss onto the desk on
load, drag anywhere with momentum, and a **Tidy up** button sweeps them back
into a neat stack. A tap on a card always just opens the link.

The demo dresses it as Tati Moreno, an illustrator in Bristol; every word,
link and colour is yours to change. This template is free.

## Quick Start

1. Copy `index.html` and the `assets/` folder to your server. There is no
   build step; it deploys as static files.
2. Replace the name, handle, bio and footer with your own words, and the
   avatar initial in `.avatar-mark` with yours.
3. Point each card's `href` at a real destination and edit its label and
   sub line.
4. Rewrite the **Latest drop** panel for whatever you are pushing this month,
   or delete the whole `#latest` section.

Open `index.html` in a browser. That's the whole install.

## The cards

Each card is one block. Add as many as you like, delete freely, reorder
freely; the toss, drag and tidy all read the list at load time:

```html
<a class="card" data-card href="https://example.com/shop">
    <span class="card-text">
        <span class="card-label">The shop</span>
        <span class="card-sub">Sticker sheets &amp; riso prints</span>
    </span>
    <span class="card-arrow" aria-hidden="true">&#8599;</span>
</a>
```

The sub line is optional; remove the `card-sub` span and the card slims down.

The hint line above the desk and the **Tidy up** button are not in the HTML:
`initDeskBar` in `assets/script.js` injects them, because they describe a
feature only the script provides. Edit their wording there, or delete that
function's call to ship without them.

### Tap versus drag

A card is both a link and a draggable object, and the two never fight:

- Movement under **6px** is a tap, and a tap always navigates. Draggable only
  enters a drag past that distance (`minimumMovement` in `initDrag`).
- When a real drag happens, the click that the mouse release fires is
  cancelled, so a throw never accidentally opens a link.
- On touch, a finger that lands on a card and swipes **vertically scrolls the
  page**: the cards carry `touch-action: pan-y`, which hands vertical
  gestures back to the browser. A sideways start picks the card up.

### The scatter is deterministic

Landing spots and tilts are derived from each card's index through a seeded
sine hash. There is no `Math.random`, so the desk composes exactly the same
way on every visit. Change `SEED` at the top of `initLinkInBio` in
`assets/script.js` for a different composition; every value from 1 upward is
a different desk.

The horizontal throw is bounded by the desk's own measured width, so no card
can land outside the dashed frame at any screen size. Below 880px the cards
keep the tidy stack with a slight settle tilt instead, sized so a rotated
corner never overflows a phone screen.

### Momentum is optional

With the `InertiaPlugin` script tag on the page, a thrown card glides to a
stop against the desk's edge resistance. Remove that tag and everything still
works; cards simply stop where you release them.

## The latest drop panel

One feature slot for whatever is newest: a badge, a title, two lines and a
button, on an ink panel. The three grumpy pigeons are drawn entirely in CSS;
restyle them, or delete `.latest-art` and the panel simply narrows. Swap the
whole panel's copy monthly; it is the only part of the page meant to change
often.

## Palette and type

Six colours and two faces run the whole page. In `:root`:

```css
--ground: #D8CEEE;      /* the desk, page base */
--card: #F1EDFA;        /* sticker faces, inside a white die-cut edge */
--ink: #251C38;         /* near-black violet: type, and the drop panel */
--ink-dim: #4E4370;     /* secondary type on ground and cards */
--panel-dim: #B7A8DC;   /* secondary type on the ink panel only */
--accent: #FF4D0D;      /* hot orange: fills and panel type, never type on light */
```

Repaint those and keep the matching `--*-rgb` triples in step; the shadows,
the desk's dashed frame and the tidy button's glow all resolve from the
triples, so a swap that misses them leaves those the old colour. The faces
are Baloo 2 for display and Atkinson Hyperlegible for body and UI; swap the
two `--font-*` tokens and the Google Fonts link to change them.

One measured constraint to respect if you recolour, explained in full in the
comment at the top of `style.css`: **the orange is never a text colour on the
light surfaces.** It measures 2.21:1 on the lilac and 3.32:1 on white, both
under the 4.5:1 floor, so it only ever appears as a fill with ink type on
it, or as type on the ink panel, where it measures 4.85:1.

## Deleting pieces

Every block is independent: the script checks for each piece and skips what
it doesn't find. Delete the hero, the drop panel, the footer, or any card
freely; nothing else breaks.

## Accessibility

- **Without JavaScript the page is a plain, readable stacked list** with
  every link reachable. The desk frame, hint line and tidy button never
  appear, because there is nothing for them to control. The `has-js` class
  is only added once GSAP is confirmed present, so a blocked CDN behaves
  the same way.
- **With reduced motion** the cards render in the tidy stacked layout (no
  toss, no reveal, no glide) via both the CSS media query and the
  `matchMedia` branch. Dragging still works; cards just stop where you put
  them.
- Cards are real `<a>` elements: they are tabbable in order, Enter follows
  them, and focus is visible throughout. The tidy button is a real
  `<button>`.
- The avatar, arrows and pigeons are `aria-hidden` decoration.

## Browser Support

Modern evergreen browsers. The layout is flexbox and the stickers are plain
CSS, so with anything missing the page degrades to the stacked list.

## Dependencies

- [GSAP core](https://gsap.com) (CDN)
- GSAP Draggable (CDN): the drag surface; without it the cards are a
  static list
- GSAP InertiaPlugin (CDN, optional): the glide; remove freely
- [Lenis](https://lenis.darkroom.engineering/) (CDN, optional): smooth
  scrolling; remove freely
