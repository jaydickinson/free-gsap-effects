# Waitlist Page Template: "Fennick R1"

A one-screen pre-launch page built round one product photograph. The product
is the interface: visitors turn its tuning knob (or slide the needle, or use
the arrow keys), static gives way to "stations" that tune in each part of the
launch story, and the last station, launch day, holds the email sign-up. The
product's own preset key doubles as the submit button.

The demo dresses it as Fennick, a two-person workshop in Glasgow launching a
pocket FM radio in a numbered batch of 300. Every word, photo and colour is
yours to change. This template is free.

## Quick Start

1. Copy `index.html` and the `assets/` folder to your server. There is no
   build step; it deploys as static files.
2. Rewrite the headline, the header batch line and the footer.
3. Rewrite the stations (see **Stations** below). Keep the last one as your
   launch day with the form.
4. Connect the form to your list provider (see **The sign-up form**).
5. Swap the photograph for your own product (see **Using It With Your Own Design**).

## Using It With Your Own Design

The page is built on three things: a flat ground colour, one front-on product
photo on that same colour, and a set of overlays positioned in percentages of
the photo.

1. **Shoot or choose the photo.** Front-on, the product large in frame, on a
   flat neutral backdrop with no vignette. Export it at about 1500px wide.
2. **Match the ground.** Sample the backdrop near the photo's edges and set
   `--ground` (and `--ground-rgb`) in `assets/style.css` to it. The photo's
   edges are feathered into the page so no frame shows.
3. **Place the overlays.** In the `.radio` rule, five custom properties set
   where things sit on the photo, as percentages of its width and height:
   ```css
   --dial-x: 16.4%;  --dial-y: 26.4%;  --dial-w: 44.5%; --dial-h: 17%;
   --knob-x: 76.17%; --knob-y: 36.13%; --knob-d: 15.2%;  /* centre, diameter */
   --lamp-x: 65.63%; --lamp-y: 26.22%;
   --key-x: 76.27%;  --key-y: 68%;     --key-d: 7.5%;
   ```
   Measure them in any image editor: pixel position divided by image size.
   Also update `aspect-ratio` on `.radio` and the image's width/height.
4. **The preset key** is drawn from the photo itself so it can be pressed. If
   you move it, update `.key`'s `background-size` (100 / key diameter, as a
   percentage) and `background-position` (`left / (1 - d)` horizontally and
   `top / (1 - d * aspect)` vertically, where left/top are the key's top-left
   corner as fractions of the photo).
5. **No knob on your product?** Delete the `.knob` element. The dial window,
   wheel, keyboard and station strip still tune the page. No dial window
   either? Place `[data-dial]` over any blank strip of your product, or over
   the ground beneath it.

### Stations

Each station is a list item in `[data-stations]`:

```html
<li class="station" id="price" data-station data-freq="92.4" data-name="Price">
    <h2 class="station__title">£145, posted anywhere in the UK.</h2>
    <p>One or two sentences.</p>
    <ul class="facts"><li>£145</li><li>2-year guarantee</li></ul>
</li>
```

- `data-freq` places it on the band (87.5 to 108). Keep stations two or
  three MHz apart so their scale labels stay readable.
- `data-name` is the short label on the scale, the readout and the strip.
- The `id` is the link target for the strip and for no-JS readers.
- The printed scale, its markers and the station strip are rebuilt from this
  list on load. The static strip in `index.html` is only the no-JS fallback,
  so keep its links in step if you rename stations.
- The **last** station (highest frequency) is launch day: the preset key and
  the header's "Join the list" link tune to it.

### The sign-up form

The form is a front end only: it validates the address, swaps in a success
message and announces it to screen readers, but sends nothing. To connect it:

- **Hosted form endpoint** (Formspree, Buttondown, Mailchimp embedded form):
  set the form's `action` to the provider's URL and remove the
  `e.preventDefault()` in the submit handler, or `fetch()` the endpoint
  there before showing the success message.
- Delete the `.signup__demo` line ("Demo form: nothing was sent.").

### Settings

At the top of `assets/script.js`:

| Constant | Default | What it does |
|---|---|---|
| `BAND_MIN`, `BAND_MAX` | 87.5, 108 | Ends of the scale |
| `DEG_PER_MHZ` | 44 | Knob rotation per MHz (lower = faster tuning) |
| `CAPTURE` | 0.55 | How far from a station the signal starts |
| `DETENT` | 0.28 | How far from a station the knob is gently pulled in |

## Palette

Five colour tokens in `:root`:

| Token | Value | Role |
|---|---|---|
| `--ground` | `#ADB1B5` | Page ground, sampled from the photo's backdrop |
| `--ink` | `#16191B` | All text (8.3:1 on the ground) |
| `--ink-soft` | `#33383C` | Secondary text (5.6:1) |
| `--signal` | `#C4421B` | The product's colour: pills, needle, station markers |
| `--print` | `#2A2C2E` | Ink for the scale printed on the dial |

`--signal` is never used for text on the grey (2.3:1); white text on it
measures 5.2:1.

## Images

`assets/img/` holds two WebP derivatives baked from the masters in
`assets/img-src/` by `assets/img-manifest.json`:

- `radio-front.webp`: the product, front-on, on the grey backdrop
- `knob.webp`: the tuning knob cap, shot from above, rotated by the script

Both are AI-generated images of a fictional product, made for this template.
Replace the files (same names) or edit the
manifest and re-bake with your own image tools.

## Accessibility

- The tuning dial is a native `<input type="range">` under the knob. It takes
  focus (the knob shows the focus ring) and reports `aria-valuetext` such as
  "96.8 FM, Build". Arrow keys and Page Up/Down move station to station;
  Shift+arrows fine-tune by 0.1 MHz; Home and End jump to the ends.
- Stations that are not tuned in are `inert`, so only the visible station's
  content is reachable.
- The station strip is a list of real links; the preset key is a labelled
  button.
- Sign-up errors are tied to the field with `aria-describedby`; success moves
  focus to the confirmation and is announced in a polite live region.
- `prefers-reduced-motion`: the dial works the same, settles instantly, and
  shows no static, blur or needle sweep.
- Without JavaScript (or if the GSAP CDN is blocked) every station is listed
  in order beside the product and the form is a plain form.

## Dependencies

- GSAP core 3.12+ from jsDelivr (the demo is built against 3.15.0). No plugins.
- Google Fonts: Rethink Sans (500, 700, 800) and Spline Sans Mono (500).

## Teardown

Everything runs inside one `gsap.context` stored on `window.gsapContext`.
`window.gsapContext.revert()` kills tweens, removes every listener and the
static ticker, and restores the station list to its plain state.
