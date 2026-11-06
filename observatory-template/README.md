# Astronomy Template

A six-page site for a planetarium, observatory or science centre, drawn like an engineering sheet: cream paper, a hairline six-column grid, ultra-condensed capitals at page scale, photographs framed in the grid with numbered callouts, a tuning-band navigation and flat blocks of signal red and sea green. Carrick Head Tracking Station, a 1964 satellite-tracking station on the Lizard in Cornwall reopened as a charity space-science centre, is the worked example.

The station, its people, prices, figures and history are fictional. Replace them with your own before publishing.

## Quick Start

1. Unzip and open `index.html` in a browser, or upload the folder to any static host. There is no build step.
2. The six pages are `index.html`, `programme.html`, `instruments.html`, `visit.html`, `schools.html` and `support.html`. Each loads `assets/style.css` and `assets/script.js` and works on its own.
3. Edit the copy in the HTML, the weekly `SCHEDULE` and the `HOURS` at the top of `assets/script.js`, and the colour tokens at the top of `assets/style.css`.
4. Replace the photographs in `assets/img/` with your own at the same file names and proportions (see Images and Credits).

## Using It With Your Own Design

Every interactive part is found by a `data-` hook (`data-slew`, `data-filters`, `data-instruments`, `data-drawing`, `data-routes`, `data-night-toggle`, `data-planner`, `data-adopt`, `data-donate`, `data-clock`, `data-channels`) and its initialiser returns early when that hook is missing. Delete a section and the rest keeps working; to move one, copy its markup, the matching block of `assets/style.css` (each is headed by a comment) and its `init` function from `assets/script.js`.

The header, channel sheet and footer are ordinary markup repeated on each page.

### The tuning band

The desktop navigation is a frequency scale across the frame with each page as a station on it. Each `<li>` in `.dial__list` is placed with `--at` (a percentage along the band), and the needle rests where the `<nav data-dial>` sets `--needle`, which is the current page's `--at`. Hovering or focusing a station slides the needle to it and back; under reduced motion it stays on the current page. The frequencies shown are labels only: change them, or the band's range in the scale markup, freely. Below 1100px the band is replaced by the Channels sheet. Pages are plain links with a CSS cross-document view transition (`@view-transition { navigation: auto; }`), turned off for reduced motion, so there is no router to configure.

### Page titles

Home, Programme and Visit set the title up the left edge, reading bottom to top, beside a 16:9 photograph (`.sidehead`). The title's size is solved in CSS so that it is exactly as long as the photograph is tall and its column exactly as wide as the letters are thick; under 900px it lies down above the photograph. The other pages set it across the frame.

Each page title is one line that fills its space. The markup carries its measured width as `--em` (for example `style="--em: 3.886"`, on the `.sidehead` wrapper as well for a side title), so the title is the right size before any script runs, and the script re-measures it once the fonts have loaded. If you change a title's words it will still fit with JavaScript on; to make the no-JavaScript size exact, set `--em` to the text's width divided by its font size (a short title such as "Visit" gives a very large size, so prefer two or three words).

## Pages and Configuration

### Configuration in `assets/script.js`

- `TIME_ZONE`: the station's time zone. The countdown and open-now line use wall-clock time there, whatever the visitor's own clock says.
- `SCHEDULE`: the weekly programme, one entry per session with `id`, `code`, `title` and `slots` (day number, 0 is Sunday, to a list of `HH:MM` times). The countdown in the header, channel sheet and Programme page shows the next one, rolling over to tomorrow or the next open day. `id` matches the row id on `programme.html`, which the day filter uses to sort by start time.
- `HOURS`: opening and closing time per weekday (`null` closed). The Visit page's open-now badge and today's row in the hours table read it; the table text is HTML, so keep the two in step.
- `TARGET_NOTES`: the sentence and programme link shown when the dish locks on to each sky-board target.
- `SESSIONS`, `RATIO` and `PRICE`: the school planner's sessions, adult ratios per key stage and per-pupil pricing.
- `GIFT_SAYS`: the line under each donation amount.

### Home (`index.html`)

The hero photograph has three callout dots (`.co`) placed with `--x` and `--y` percentages; their leaders drop into the three cards below the photograph, so keep each dot's `--x` at a column centre (16.667%, 50%, 83.333%) and move `--y` to suit your picture. The control-room figure uses the same pattern.

The sky board (`data-slew`) is an altitude-azimuth chart from azimuth 60 to 300 degrees and elevation -6 to 80 degrees (`AZ_MIN`, `AZ_MAX`, `EL_TOP`, `EL_BOTTOM` in the script). Each target is a `.tgt` with `data-target`, `data-az` and `data-el` and an inline `left`/`top` in percent; the buttons in the Point at list carry `data-goto` with the same name and link to the programme row when JavaScript is off. To change the sky, move the targets, update both lists, and edit `TARGET_NOTES`. The slew speed is `SLEW_RATE`, the lock distance `LOCK_RADIUS`.

### Programme (`programme.html`)

Each session is an `<article class="row">` with an `id`, `data-type` (`planetarium`, `observing`, `dish`, `talk`, `family`) and `data-days` (`tue wed ...`). The type and day buttons filter on those attributes; add a type by adding a button with a matching `data-filter-type`. Choosing a day sorts the visible rows by their start time on that day from `SCHEDULE`.

### Instruments (`instruments.html`)

Four tabbed spec sheets. Each numeral is `<span data-count="26" data-dec="0">26</span>`; the script counts up to `data-count` with `data-dec` decimal places when the tab opens. A link to `instruments.html#control-room` opens that sheet. The dish drawing is an inline SVG; the range input rotates the group marked `data-dw-dish` about the elevation axis.

### Visit (`visit.html`)

The map container carries `data-pin` (longitude, latitude) and `data-route-json`, an object of routes keyed by the `data-route-tab` names, each a list of `[longitude, latitude]` points. Get routes from any routing service as GeoJSON and paste the coordinates in; keep the distances and times in the tab labels matching. The red-light mode button sets `data-night` on `<html>`, which swaps the colour tokens for the night set in `assets/style.css`.

### Schools and Groups (`schools.html`)

The planner reads the year group, class size and ticked sessions and rebuilds the timetable, groups and cost. Session names, lengths and colours are in `SESSIONS`; the planetarium show is always included.

### Support (`support.html`)

The dish face for Adopt a panel is drawn in the markup: six rings of 24, 48, 72, 96, 144 and 168 panels, each a `<path data-panel="ring-number">` with class `p-taken` or `p-free`. Mark adopted panels by changing the class; adopted panels are dark, free ones paper and the chosen one red. The ring select and panel number drive the same selection for keyboard users.

### Forms

The school enquiry form and the donation form are front ends only. They show a confirmation on the page and send nothing. Point them at Formspree, Netlify Forms, your CRM or your payment provider, and remove the `submit` handlers in `initPlanner` and `initDonate` if your service posts the form itself. The membership and adoption buttons are `mailto:` links you can swap for your own checkout.

## Palette

| Token | Value | Use |
|---|---|---|
| `--paper` | #EFEBE1 | Ground, and all text on the colour blocks |
| `--paper-2` | #E4DED0 | Raised cells, selected rows |
| `--ink` | #16150F | All text on paper |
| `--signal` | #C42E28 | Red blocks, the current station and needle on the tuning band, links that must stand out |
| `--sea` | #1F6B5C | Green blocks: Slew the dish, the 16:00 call, access, selected route |
| `--signal-lt` | #F4A79D | The reticle, the lock card and large marks on green |
| `--sea-2` | #7FB2A3 | Light green tiles and tags, with ink text |
| `--stone` | #8C8676 | Neutral tags |
| `--panel` | #16150F | Dark panels inside the colour blocks |

Text on red or green is full-strength paper (4.7:1 and 5.3:1) and is never dimmed. Red and green never sit edge to edge: they have nearly the same luminance (1.1:1), so to red-green colour-blind visitors they read as one; a mark on green uses `--signal-lt`. Measured pairs are recorded in the `:root` comment. The night set (`:root[data-night]`) restates every token in red on black.

## Accessibility and Fallbacks

- The sky board takes arrow keys (one degree, five with Shift) and Enter to lock on the nearest target; status is announced in a polite live region. Every target is also a button.
- The phone and tablet menu is a real button with `aria-expanded` and `aria-controls`; focus moves to the current page and returns to the button on Escape. A tap outside closes it without following whatever link was underneath.
- Instruments are an ARIA tab set (arrow keys, Home, End); filters are buttons with `aria-pressed`.
- Focus rings show for keyboard use only (`:focus-visible`).
- Reduced motion: no view transition, no reveals, the dish slews instantly, numerals do not count.
- Without JavaScript: the countdown shows the opening pattern, the channel sheet is a plain link list under the header on small screens, every programme row and spec sheet is visible, the sky board is a picture with its target list as programme links, and the map is a link to OpenStreetMap.
- If the GSAP CDN is blocked, the page drops its reveal gate and reads as a plain document.

## Dependencies

- GSAP 3.15.0 with ScrollTrigger on every page and Flip on the Programme page (works with 3.12+).
- MapLibre GL 4.7.1 with OpenFreeMap tiles on the Visit page (no API key; keep the OpenStreetMap attribution). It loads only when the map nears the viewport; the URLs are `MAPLIBRE_JS`, `MAPLIBRE_CSS` and `MAP_STYLE` above `initRoutes` in `assets/script.js`.
- No smooth-scroll library.

## Fonts

Anybody (display, variable width), Martian Mono (labels and figures) and Atkinson Hyperlegible Next (reading) are self-hosted as Latin WOFF2 files in `assets/fonts/` and declared at the top of `assets/style.css`. Each page preloads Anybody and Martian Mono. Licence: SIL Open Font License 1.1, full text and copyright lines in `assets/fonts/OFL.txt`.

To swap a face, put your `.woff2` in `assets/fonts/`, point its `@font-face` rule and the `--font-*` token at it, and change the preloads in each page's `<head>`. The display face's narrow width (`font-stretch: 50%`) is what lets titles fill the frame; a face without a width axis needs larger `--em` values.

## Cleanup

All animations, ScrollTriggers, listeners and the map live in one `gsap.context` per page; `window.gsapContext.revert()` removes them and restores the static page. The countdown is a plain one-second timer outside it.

## Images and Credits

Photographs are bundled as graded, resized WebP files in `assets/img/`. To use your own, replace a file with one of the same name and proportions and update its alt text and caption. Some photographs have smaller copies used in a `srcset` (`-960`, `-800`) and the home hero has a portrait phone crop (`hero-dish-m`); replace those too, or delete the matching `<source>` or `srcset` entry. Several photographs show a painted numeral "1" on the dish and orange and black hazard stripes, which are part of the fictional station's livery.

**Generated images.** All eleven photographs are AI-generated images (Codex image engine, November 2026) of a fictional station, people and equipment: `hero-dish`, `archive-build`, `control-room`, `observing-night`, `dish-feed`, `planetarium`, `telescopes`, `visit-headland`, `schools`, `schools-mission`, `support-volunteers`. They depict no real site, person or organisation.
