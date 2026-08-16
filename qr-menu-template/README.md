# QR Table Menu Template

A phone-first digital menu made to be opened from a QR code at the table. A compact header with hours and Wi-Fi, a sticky category bar that crossfades between sections, dietary filter chips, four menu sections where any dish taps open to show its calories and allergens, and a footer with the address and allergen note. Built as static files with no build step: one HTML file, one stylesheet, one script, and GSAP from a CDN.

The demo brand is **Sorrel**, a fictional all-day cafe. Replace the copy, dishes and prices with your own.

## Quick Start

1. Upload the whole `qr-menu-template` folder to any static host.
2. Point your QR code at `index.html` (or the folder URL).
3. Edit the header, the dishes and the footer in `index.html`.
4. To reskin, change the six colour tokens in `assets/style.css` (see **Palette**).

That is the entire setup. The GSAP and Lenis `<script>` tags near the bottom of `index.html` load from a CDN; leave them as they are.

## Editing the menu

Everything is plain list markup. Each category is a `<section class="panel">` and each dish is one `<li class="item">`.

**Add or edit a dish** inside any `.dishes` list:

```html
<li class="item" data-item data-diet="veg gf">
  <div class="item__head">
    <h3 class="item__name"><button class="item__toggle" type="button" data-toggle>Dish name</button></h3>
    <span class="item__leader" aria-hidden="true"></span>
    <span class="item__price">£0.00</span>
  </div>
  <p class="item__desc">One line describing the dish.</p>
  <ul class="diet">
    <li class="diet__tag diet__tag--v">Veg</li>
    <li class="diet__tag diet__tag--gf">GF</li>
  </ul>
  <div class="item__more" data-more>
    <span class="item__kcal">000 kcal</span>
    <span class="item__allergen">Contains …</span>
  </div>
</li>
```

- **`data-diet`** drives the filter chips. Use the tokens `veg`, `vegan`, `gf`, space-separated. Tag a vegan dish `veg vegan` so it also shows under the Veg filter. A dish with no dietary tokens gets `data-diet=""` and appears only when no filter is active.
- **`.diet__tag`** is the visible badge on the card. Variants: `--v` (Veg, green), `--vg` (Vegan, green with a tick), `--gf` (GF, tomato). These are just labels; the filtering is driven by `data-diet`, so keep the two in step.
- **`.item__more`** holds the calories and allergens revealed when the dish is tapped. It shows plainly with no JavaScript; with JS it collapses and the name (`.item__toggle`, marked `data-toggle`) becomes the disclosure button. Edit the `.item__kcal` and `.item__allergen` text per dish. To drop the detail for one dish, delete its `.item__more` block: that dish keeps its name as plain static text, with no chevron and nothing to open.
- **`.item__leader`** is the decorative dotted line between the name and the price. Leave it in place.

**Rename a category** by editing both the tab and its section:

```html
<!-- the tab, in the category bar -->
<a class="tab" data-tab="brunch" href="#panel-brunch">Brunch</a>

<!-- its section -->
<section class="panel" id="panel-brunch" data-panel="brunch"> … </section>
```

The `data-tab` on the tab must match the `data-panel` on the section, and the `href` must match the section `id`. That anchor link is also the no-JS fallback, so keep it correct.

**Add or remove a category** by copying a full tab plus its `<section>`, or deleting both. Sections are independent; nothing else needs changing. The `<p class="panel__empty" data-empty hidden>` line inside each section is the note shown when the filters empty that category.

## Palette

The menu runs on a sage-tint ground with near-black ink, one herb green and one warm tomato. To reskin, change these six tokens and their `--*-rgb` triples in `:root`; every translucent value (rules, tints, dotted leaders) resolves from a triple, so it is a six-value edit.

```css
--ground: #E7ECE1;   --ground-rgb: 231, 236, 225;   /* page */
--paper:  #F3F6EF;   --paper-rgb:  243, 246, 239;   /* header, chips, pill text */
--ink:    #23291F;   --ink-rgb:    35, 41, 31;       /* names, body */
--ink-soft: #55604D; --ink-soft-rgb: 85, 96, 77;     /* descriptions */
--herb:   #3F6B47;   --herb-rgb:   63, 107, 71;      /* prices, active tab, Veg pills */
--tomato: #BE4830;   --tomato-rgb: 190, 72, 48;      /* highlights, GF pills */
```

**Measured contrast (WCAG, composited over the surface each colour sits on):**

| Text | Surface | Ratio | Use |
|---|---|---|---|
| ink `#23291F` | ground `#E7ECE1` | 12.4:1 | body, dish names |
| ink `#23291F` | paper `#F3F6EF` | 13.2:1 | header, cards |
| ink-soft `#55604D` | ground | 5.5:1 | descriptions |
| ink-soft `#55604D` | paper | 6.1:1 | descriptions |
| herb `#3F6B47` | ground | 5.1:1 | prices, active tab, footer labels |
| paper `#F3F6EF` | herb `#3F6B47` | 6.1:1 | text on filled green pills |
| paper `#F3F6EF` | tomato `#BE4830` | 4.6:1 | text on filled tomato pills |

**Tomato is a highlight and a mark, not small body text.** On the ground it measures 4.2:1, below the 4.5:1 floor for normal-size text. It is used only as a filled pill (paper text on tomato passes at 4.6:1) and for large or bold accents. If you re-colour, keep tomato-as-text off any surface and check the two pill pairs above still clear 4.5:1.

## Accessibility

- **Reads with JavaScript off.** The whole menu is one stacked document with every dish visible, and the category bar degrades to in-page anchor links. Nothing is hidden behind a control that needs JS.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, the tabs and filters still work but switch instantly, with no crossfade, stagger or fade. Handled by both the CSS media query and the script.
- **Keyboard.** The category bar is a proper ARIA tablist: arrow keys, Home and End move between categories, with roving tabindex. The filter chips are real `<button>`s with `aria-pressed`. Each dish's details open from a real `<button>` with `aria-expanded` and `aria-controls`, operable with Enter or Space. A skip link jumps straight to the menu.
- **Colour is never the only signal.** Dietary information is carried by the badge text (Veg / Vegan / GF), not by colour alone.

## Dependencies

- [GSAP](https://gsap.com/) 3.14.2 with ScrollTrigger (CDN)
- [Lenis](https://github.com/darkroomengineering/lenis) 1.3.17 smooth scroll (CDN, optional; remove the block in `script.js` and its `<script>` tag to drop it)

Yeseva One and Mukta load from Google Fonts.
