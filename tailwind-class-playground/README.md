# Tailwind Component Remixer

A random component generator built from curated Tailwind class pools. Every remix independently selects layout, surface, corners, typography, colour, measure, action styling and procedural SVG artwork, then GSAP coordinates the resulting reflow and visual transition. The generated recipe is visible but read-only; visitors customise through meaningful controls and copy the finished markup.

## Quick Start

**1. Add to your HTML `<head>`:**

```html
<script data-cfasync="false">document.documentElement.classList.add('has-js')</script>

<link rel="stylesheet" href="path/to/tailwind.css">
<link rel="stylesheet" href="path/to/style.css">
```

The included stylesheet contains the complete class pool. In your own Tailwind project, let the normal build scan the complete class strings in `script.js` and the HTML recipes.

**2. Add before the closing `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js"></script>
<script src="path/to/script.js"></script>
```

**3. Give each generated part a stable name:**

```html
<section data-tailwind-playground>
  <button type="button" data-tw-remix>Random remix</button>
  <button type="button" data-tw-copy>
    <span data-copy-label>Copy markup</span>
  </button>

  <article data-tw-node="card" class="grid max-w-xl grid-cols-2 overflow-hidden">
    <div data-tw-node="body" class="flex flex-col gap-5 p-8">
      <h2 data-tw-node="title" class="text-2xl font-semibold">Your title</h2>
      <p data-tw-node="description" class="text-sm leading-6">Your description.</p>
      <a data-tw-node="action" class="rounded-full bg-blue-600 px-4 py-2 text-white">Open</a>
    </div>
  </article>

  <pre><code data-tw-code-output></code></pre>
  <p data-tw-recipe-status></p>
  <p class="sr-only" data-tw-status role="status"></p>
</section>
```

## Using It With Your Own Design

Replace the complete preview component and preserve the documented `data-` hooks. The script never queries visual class names.

Add `data-tw-node="name"` to every part whose classes should appear in the generated recipe. The included demo exposes:

- `card` — width, grid, surface, border, radius and shadow
- `media` — artwork size, overflow and colour
- `body` — flex layout, spacing and padding
- `title` — typography and contrast-safe colour
- `description` — measure, size, leading and colour
- `action` — spacing, surface, radius and typography

The `buildRandomRecipe()` function contains independent arrays for each random dimension. Replace those complete class strings with tokens from your own Tailwind design system. Surface is selected before text and action colours so light and dark results always use the matching contrast-safe pool.

The dark shell, network artwork, generated-code panel and control styling are presentation only. Remove or replace them without changing the randomisation and transition engine.

## Randomisation

Each click generates a new combination from:

- 3 layouts: Stack, Split and Reverse
- 4 surfaces: Paper, Midnight, Mist and Ink
- 3 corner treatments
- 7 typography treatments, including serif and monospace
- 4 description measures and 4 action shapes
- 6 coordinated artwork, title and action palettes
- 6 SVG families: Orbits, Contours, Waves, Constellation, Tiles and Weave

These pools provide 145,152 combinations before the illustration's geometry is varied. The artwork family always differs from the previous remix. `crypto.getRandomValues()` supplies selection when available, with `Math.random()` as a compatibility fallback.

The SVG generator varies paths, points, spacing, rotation or tile orientation according to the selected family. Copy markup includes the actual inline SVG with its colours and geometry, so the result does not depend on this generator. Artwork crossfades over the previous opaque SVG on each remix; reduced motion changes it immediately. Switching the surface also adapts text contrast while keeping the selected palette.

Transitions begin in the same frame as the class update. Flip uses transforms to preserve the starting geometry without recentering a changing CSS width. Rapid input keeps the latest requested change and applies it after the current transition, rather than snapping an animation to its end.

The demo keeps a deterministic `window.__thumbnail` recipe solely for catalogue capture. Visitor remixes always use the random builder.

## Tailwind Build

The standalone demo uses a local stylesheet covering every utility in its HTML and JavaScript pools. No runtime compiler or artwork request is needed. In this repository, rebuild it after editing the pools:

```bash
bun scripts/build-remixer-css.ts
```

For a production integration, use your application's normal Tailwind build. Keep every utility as a complete string in a scanned source file, or add the script through Tailwind's explicit source configuration. Do not assemble utility names from fragments such as `'text-' + colour`.

## Options

| Hook | Value | Description |
|---|---|---|
| `data-tailwind-playground` | boolean hook | Scopes one independent remixer |
| `data-tw-node` | unique name | Includes an element in class generation, animation and output |
| `data-tw-group` | group name | Makes recipe buttons exclusive within a group |
| `data-tw-apply` | recipe string | Maps node names to utility lists |
| `data-tw-remix` | button | Generates a fresh random recipe |
| `data-tw-code-output` | `<code>` | Displays the live classes as read-only output |
| `data-tw-recipe-status` | text element | Reports how the current recipe was produced |
| `data-tw-copy` | button | Copies the current component markup |
| `data-copy-label` | text element | Reports clipboard success or failure |
| `data-tw-status` | live region | Announces recipe changes accessibly |

Change the layout and shape recipes in `data-tw-apply`. Change typography, measure and action variety in `buildRandomRecipe()`, colours in `palettes`, and SVG geometry in `generateArt()`. The `animatedStyles` list controls which computed visual properties travel with the Flip reflow.

## Example

A recipe button can still offer a deliberate choice alongside the random generator:

```html
<button type="button"
        aria-pressed="false"
        data-tw-choice
        data-tw-group="layout"
        data-tw-apply="card|max-w-sm grid-cols-1;media|min-h-32;body|p-6 gap-5">
  Stack
</button>
```

Assignments are separated by semicolons, and the node name is separated from its classes with `|`. Recipes are always rebuilt from an immutable baseline, so contradictory utilities do not accumulate.

## Accessibility

- Recipe choices and randomisation use native buttons.
- Group choices expose `aria-pressed` and support arrow-key navigation.
- Generated classes are read-only and keyboard-scrollable instead of masquerading as an editable field.
- A polite live region announces each random or deliberate recipe change.
- Colour and action pools are selected from contrast-safe light or dark sets.
- Under `prefers-reduced-motion: reduce`, every control remains functional and changes apply immediately.
- Changing the motion preference while mounted preserves the current generated recipe.
- Without JavaScript or with blocked GSAP, the locally compiled initial component remains visible.

## Programmatic Control

The script exposes its GSAP context on `window.gsapContext`.

```javascript
// Restore original classes and controls, remove listeners and cancel motion.
window.gsapContext.revert();
```

Multiple `[data-tailwind-playground]` instances are supported. Keep each instance's controls, output and preview inside its own root.

## Dependencies

**Required:**

- GSAP 3.12+ (the demo pins 3.15.0)
- GSAP Flip 3.12+
- Tailwind CSS utilities for every class pool in production

**Included for the standalone demo:**

- A local Tailwind v4 build covering the complete recipe pool

**Not required:**

- No syntax-highlighting library
- No ScrollTrigger or Lenis
