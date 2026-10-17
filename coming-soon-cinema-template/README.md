# Coming Soon Template — "The Lantern"

A complete single-screen holding page shaped like the still card a picture house
projects before the film: a dark auditorium, a lit slide floating in it, a
projector beam raking down from the top right with dust turning over inside it,
and film grain over the whole print. The demo dresses it as The Lantern, a
two-screen repertory cinema opening in Sheffield; every word and colour is
yours to change.

This template is free. It runs on GSAP core alone — no plugins, no smooth-scroll
library, one CDN script tag.

## Quick Start

1. Copy `index.html` and the `assets/` folder to your server. There is no build
   step; it deploys as static files.
2. Set your opening date in `data-open` on the leader (see below).
3. Replace the wordmark, headline, sub line, facts and footer with your own
   words.
4. Wire the email form to your list provider (see below).

Open `index.html` in a browser. That's the whole install.

## The countdown

The countdown is an Academy leader — the focus chart spliced onto the head of a
reel — and it is a real countdown to your opening date, not decoration.

Set the date on the markup. There is no date logic to edit:

```html
<div class="leader-block" data-leader data-open="2027-10-02T19:30:00">
```

`data-open` is read in the visitor's local time zone. For one global moment,
append an offset: `2027-10-02T19:30:00+00:00`. Once the date passes, the leader
reads **Now open**. If the attribute is missing or unparseable the leader stays
an empty ring rather than showing an invented number.

### Why it is split three ways

Each part of the countdown updates at a different rate, and that is the whole
design:

| Part | Changes | Why |
|---|---|---|
| Sweep hand | continuously, one turn a minute | proves the page is live |
| Day count | once a day | the number people actually want |
| Hours and minutes | once a minute | confirms it is ticking |

**There is no seconds digit anywhere, on purpose.** On a launch months out, a
seconds digit is the only thing that ever visibly moves and it carries the least
information, so the page spends all its motion budget on its least useful
element. Worse, a one-second cadence leaves no rest state — by the time a roll
has eased and settled, the next one is already due — which reads as restless
rather than alive. No easing curve fixes that, because the problem is the beat,
not the curve.

The sweep hand does that job instead. It turns continuously, driven straight
off the wall clock, so it never starts, never stops, and cannot drift or arrive
late. The numerals **cut** rather than tweening, which is correct for something
that changes once a day: there is no settle to overrun.

Every value is read from the clock rather than accumulated, so a backgrounded
tab comes back correct with no catch-up.

### Placement

It sits in the flow above the card by default, so a phone gets it too. Above
1180px, where there is dark either side of the slide, it pins into the left
strip. It carries the countdown, so it is never the piece that gets dropped at
small sizes.

## The wandering house light

The soft glow drifting around the auditorium is two sines per axis at
frequencies with no common multiple:

```js
x = w * (0.5  + 0.30*sin(t*0.083) + 0.13*sin(t*0.191))
y = h * (0.46 + 0.24*sin(t*0.117) + 0.11*sin(t*0.237))
```

A single sine is a loop, and a loop long enough to notice is still a loop the
eye eventually learns. Summing two that never line up gives a path that never
closes, so it reads as drift rather than as animation. Change the four
frequencies if you want a different wander — just keep them from landing on
simple ratios of each other, or the path snaps back into an obvious figure.

## The facts row

```html
<li class="fact">
    <span class="fact-key">First screening</span>
    <span class="fact-val">2 October 2027</span>
</li>
```

Edit it, delete it, or add a fourth fact. The row is a plain `<ul>` and wraps on
its own. Keep the written date here in step with `data-open` on the leader —
this one does not depend on JavaScript, so it is what a visitor with scripting
off reads.

## Wiring the email form

The form is front-end only: submitting shows the success state and goes no
further. Point it at your provider by giving the `<form>` a real `action`
(Mailchimp, Buttondown, ConvertKit and Formspree all accept a plain HTML form
POST) and removing the `e.preventDefault()` line at the top of the submit
handler in `initForm`. Keep the handler itself: the morphing success state and
the screen-reader announcement both live there.

## Palette and type

Five colours and two faces run the whole page. In `:root`:

```css
--house: #1A0E11;      /* the dark auditorium, page base */
--screen: #EDE6D8;     /* the lit slide, and type on the dark */
--ink: #1A0E11;        /* primary type, on the slide only */
--ink-dim: #574549;    /* body copy, on the slide only */
--house-dim: #A99089;  /* secondary type, on the dark only */
--oxblood: #8E2233;    /* kicker, rule, button */
--bulb: #F0B44E;       /* the lamp — light only, never type */
```

Repaint those and keep the matching `--*-rgb` triples in step — the beam, dust,
grain, scrims and button shadow all resolve from the triples, so a swap that
misses them leaves the light the old colour. The faces are Oswald for display
and Cabin for UI; swap the two `--font-*` tokens and the Google Fonts link to
change them.

Two measured constraints to respect if you recolour, both explained at length in
the comment at the top of `style.css`:

- **`--bulb` is never a text colour.** It is the lamp. On the bone slide it
  measures 1.63:1.
- **`--ink` and `--ink-dim` belong on the slide; `--house-dim` belongs on the
  dark.** They are not interchangeable, and the two grounds are far enough apart
  that swapping them fails immediately.

## The beam, mechanically

The beam is a rotated rectangle, not a clipped wedge. That distinction is the
whole reason it reads as light: a `clip-path` polygon gives the shaft hard
geometric edges and a uniform cross-section, which looks like a smear of haze.
Instead, a vertical gradient supplies the soft falloff **across** the band, a
`mask-image` supplies the falloff **along** it (light fading with distance from
the lamp), and a CSS rotation sets the angle.

It sits inside an otherwise empty `.beam-pivot`. That wrapper exists so GSAP's
pointer lean writes its transform to a different element than the one carrying
the beam's own `rotate()` — otherwise the two fight, and the beam snaps flat the
first time the pointer moves. It also means the angle survives with JavaScript
off.

The chrome sits on scrims rather than on bare ground. `.top` and `.foot` each
carry a `--house` gradient at 0.94, so their text keeps its contrast wherever the
beam happens to land. Keep them if you move the beam: the beam is positioned in
percentages and the chrome is not, so routing the geometry around the chrome
holds at one width and quietly fails at others.

## The grain, mechanically

Noise is expensive to generate and cheap to move. The tile is generated **once**
into a 128px offscreen canvas, then drawn as a repeating pattern at a random
integer offset each frame — one fill per frame, rather than rebuilding a
full-screen buffer pixel by pixel. It runs at 24fps because that is what a film
gate runs at, and it composites in `overlay` against mid-grey noise, so it
textures the image without shifting any measured contrast pair.

It renders at device-pixel-ratio 1 deliberately. Grain should be the size of
grain, not the size of a pixel, and this is a quarter of the fill cost on a
retina screen.

## Deleting pieces

Every block is independent — the script checks for each piece and skips what it
doesn't find. Delete the form, the facts, the beam, the grain or the footer
freely; nothing else breaks.

## Accessibility

- **Without JavaScript the page is complete.** Every animation start state is
  set from JavaScript, and the beam is pure CSS, so the art direction survives
  with scripting off. The one thing JS gates is the leader's numerals: with
  scripting off it renders as an empty ring and crosshair rather than an
  invented or stale number, and the written date in the facts row carries the
  information instead.
- **With reduced motion**, the grain and dust are gone, the beam and house light
  are still, the leader keeps its ring, crosshair and a static numeral but loses
  its sweep, and the form works with an instant success state.
- **No flicker anywhere.** A strobing lamp was the obvious flourish here and it
  is deliberately absent: flicker is a photosensitivity risk, and the beam is
  eased over fourteen seconds instead.
- The beam, dust, grain, house light and leader are all `aria-hidden`
  decoration. The form announces its success politely to screen readers.
- Focus is visible on the input, button and links throughout.

## Browser Support

Modern evergreen browsers. The layout is flexbox and the beam is plain CSS, so
the page degrades gracefully; the canvas grain and dust simply do not appear if
canvas is unavailable. `mask-image` ships prefixed for older WebKit.

## Dependencies

- [GSAP core](https://gsap.com) (CDN) — that's all.
