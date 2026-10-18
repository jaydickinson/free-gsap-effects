# Link in Bio Template

A one-page link-in-bio site, links first. A giant wordmark and a one-line bio sit on one loud ground colour. Below them is a small pile of photo prints for the three latest things: flick the top print away and it tucks under the pile, revealing the next, or tap it to open. The full list of links starts on the first screen, right under the pile. The worked example is Mariam Odede, a potter in Margate: kiln openings, Thursday clay classes, the shop, restaurant tableware, and a newsletter, with Instagram, TikTok and email in a row under the bio.

It suits anyone whose one link lives in a social profile: musicians (release, tour dates, merch, bookings), podcasters (latest episode, live shows, back catalogue), small shops and bakeries (the drop, workshops, wholesale), writers (new book, events, newsletter) and chefs (supper club, classes, cookbook).

## Quick Start

1. Open `index.html` in a browser, or upload the folder to any static host. There is no build step.
2. Change the name in three places: the hidden `<h1>` and the two `[data-wordmark]` words.
3. Edit the three prints in `[data-pile-stack]` (your latest things) and the rows in `#links` (every link, the three latest included).
4. Replace the photos in `assets/img/` with your own at the same names (4:5, about 900x1125).
5. Repaint `--glaze` in `assets/style.css`.

## Using It With Your Own Design

The page is one hero (wordmark, pile, bio, list) followed by optional blocks: the dark kiln block (`#kiln`), the about section (`#about`), the newsletter sign-up (`#diary`) and the footer. Delete any of them and the rest keeps working; the script checks for each part before touching it.

- **The pile is the hero.** Keep it on the first screen; on phones the composition is built around a 390px-wide screen with the whole pile, its controls and the bio visible.
- **The wordmark is two words**, stacked on phones and on one line on desktop. A one-word name works: put it in the first `[data-wordmark]` and delete the second. Longer names shrink to fit, because the script sizes the words to the column after the font loads. On phones the size is also held to the window height, so the first rows of the list stay on the first screen.
- **Your own type.** Swap `--font-display` for another heavy, characterful face.
- **Your own links.** Two to four prints work on the pile; the list takes as many rows as you need. Each print and each list row is an ordinary `<a>`; point them anywhere.

## The Pile

Markup: `[data-pile]` holds `[data-pile-stack]` (an `<ol>` of `[data-print]` items, the first on top), the hint line and a visually hidden live region (`[data-pile-status]`). Prints after the first ship with `inert` and `aria-hidden`, so without the script only the top one is reachable; the script moves those attributes as the pile turns.

Each print is a link with three parts: `.print__photo` (the image), `.print__label` (`.print__kicker` and `.print__title`) and `.print__arrow`.

- **Flick or drag** the top print sideways. Past 90px, or released quickly, it goes to the back of the pile; otherwise it springs home.
- **Tap or click** opens the link. Nothing is handed to the drag until the pointer has moved 6px, so a tap is always a plain click. A gesture that did drag never navigates.
- **Vertical swipes scroll the page.** On touch, a print is only picked up when the movement is clearly sideways (`touch-action: pan-y`).
- **Arrow keys** on a focused print do the same as a flick: right sends the top print back, left brings the bottom one forward.

Settings at the top of `assets/script.js`:

| Setting | Default | What it does |
|---|---|---|
| `SEED` | `7` | Re-deals every print tilt and wordmark wobble. Same value, same composition on every load |
| `TAP_PX` | `6` | Movement under this is a tap |
| `THROW_PX` | `90` | Drag further than this and the print goes to the back |
| `THROW_SPEED` | `600` | Or release faster than this, in px/s |

On desktop the wordmark runs across the top on one line, with the bio, the pile and the full list in one row beneath it. The print size follows the window height, so the whole hero fits the first screen.

## The Kiln Block

`[data-kiln]` shows the next date and a countdown. Set `data-opens` to an ISO date (`2026-11-07T10:00:00+00:00`), or leave `next-saturday` with `data-opens-hour="10"` for a date that always rolls forward. The script writes the date into `[data-opens-date]` and the countdown into `[data-countdown]`; without the script both show the static text in the HTML. Rename it for your own drop: a release date, a supper club, a launch.

## The Sign-up Form

`[data-diary-form]` is a front end only. It checks the email field and shows a thank-you line, and sends nothing. Point the form's `action` at your list provider (Buttondown, Mailchimp, ConvertKit, Formspree) and delete the submit handler in `initDiary`, or post from that handler.

## Palette

Six colour tokens in `:root`:

| Token | Value | Role |
|---|---|---|
| `--glaze` | `#E15A2B` | The ground. Persimmon glaze |
| `--ink` | `#1E120D` | Every word on the glaze, the wordmark, rules and controls |
| `--paper` | `#FBF6EE` | Print borders, the form field |
| `--clay` | `#2A1A14` | The kiln block and footer |
| `--slip` | `#F6E8D6` | Text on clay |
| `--celadon` | `#9FD3C1` | The countdown line and focus rings on clay |

Ink on the glaze is 5.0:1. Text on the glaze is full-strength ink only, so there is no dimmed ink token. You can lighten the glaze freely, but a ground darker than about `#D75529` takes body text under 4.5:1. A different loud ground (acid green, cobalt, butter yellow) works the same way: re-measure ink on it.

Type: Bagel Fat One (display: the wordmark and headings) and Onest 400/600 (everything you read), from Google Fonts.

## Example

To make it a musician's page:

- Change the wordmark to the artist name.
- Make the three prints the new single, the next tour date and the merch drop, and list everything (tour dates, merch, a live video, the mailing list, Instagram) underneath.
- Turn the kiln block into the release countdown, with `data-opens` set to the release date.
- Repaint `--glaze` to the record sleeve colour.

## Accessibility and Fallbacks

- **Only the top print is focusable.** The covered prints are `inert` until they surface, so Tab never lands on a hidden link. Focus moves with the pile when you use the arrow keys.
- **A live region announces each print**, for example "Print 2 of 3: Clay classes".
- **The plain list (`#links`) carries every link** for keyboard and screen-reader users, and for anyone who skims. It follows the pile directly, in reading and tab order.
- **The wordmark is decoration** (`aria-hidden`); the hidden `<h1>` carries the name.
- **Reduced motion** removes the deal-in, the drag, the throw and the hint. The arrow keys swap prints with a short crossfade, and the wordmark rests on its wobble.
- **Without JavaScript, or if the GSAP CDN is blocked,** the top print shows as a static link with the other two tilted behind it, not focusable. The full list follows directly, and every section is visible.

## Dependencies

- GSAP 3.12+ core, Draggable and ScrollTrigger (the demo pins 3.15.0 from jsDelivr).
- InertiaPlugin is optional. When present, it measures throw speed; without it the script measures speed itself.
- No Lenis: one short page does not need smooth scrolling.

## Cleanup

Everything runs inside one `gsap.context` stored on `window.gsapContext`. `window.gsapContext.revert()` does the following:

- Kills every tween, Draggable and ScrollTrigger.
- Removes the listeners and the countdown timer.
- Restores the wordmark text and the prints' accessibility attributes.
- Takes the `has-js` gate off.

## Images and Credits

The images in `assets/img/` are cropped, resized and lightly graded WebP derivatives baked from Pexels photographs (Pexels licence), listed with their sources in `assets/img-manifest.json`:

- Teal glazed dishes: pexels.com/photo/28271468
- Studio class at the bench: pexels.com/photo/6694305
- Hand-painted cups: pexels.com/photo/30225370
- Tableware from above: pexels.com/photo/3847440
- Bowls on a kiln shelf: pexels.com/photo/7222326
- Portrait with a pot: pexels.com/photo/6694761
- Glazed plates on wood: pexels.com/photo/9736670

To use your own photos, replace a file at the same name and shape. You can also change an entry's source in the manifest and re-bake it with `bun scripts/build-template-assets.ts link-in-bio-template` from the GSAP Vault repository; any image tool that exports 4:5 WebP does the same job.
