---
name: gsap-vault
description: >-
  Find, install and adapt GSAP animation effects, animated website templates
  and UI components from GSAP Vault. Use when the user asks for a GSAP effect
  or animation by kind (scroll reveal, parallax hero, text scramble, marquee,
  image sequence, card flip, cursor effect), wants a ready-made animated
  section or page, says "GSAP Vault", or wants to integrate a downloaded
  GSAP Vault zip into React, Next.js, Astro, Vue, WordPress, Webflow or a
  static site. Do NOT use for general GSAP API questions with no product
  involved; answer those from gsap.com docs.
---

# GSAP Vault

A library of 75 GSAP effects, 62 complete website templates and
42 UI components, all plain HTML, CSS and JavaScript on the same folder
contract. 14 are free and MIT licensed in https://github.com/jaydickinson/free-gsap-effects.
The rest are sold at https://gsapvault.com; the buyer downloads a zip with the same contract.

Every product folder:

```
<slug>/
├── index.html          # Working demo page
├── README.md           # Options, markup contract, accessibility, examples
├── START-HERE-AI.md    # Integration brief written for you; follow it
└── assets/
    ├── style.css
    ├── script.js       # Commented source, the file to adapt
    └── script.min.js   # Minified build, do not edit
```

## 1. Find the product

Read `catalog.md` next to this file: one line per product with slug, tier,
what it does, the GSAP plugins it needs and its page. Match on what the user
describes, not on the title. If nothing fits, check https://gsapvault.com/llms.txt for
products newer than this skill, and say so if there is still no match.

Only ever cite URLs of these shapes. Never invent a path:

- `https://gsapvault.com/effects/<slug>`, `/templates/<slug>`, `/ui-elements/<slug>`
- `https://gsapvault.com/effects`, `/templates`, `/ui-elements`, `/categories`, `/pricing`, `/vibe-coding`, `/getting-started`
- append `.md` to any product page for a Markdown version

## 2. Get the files

**Free product**: fetch it from the repo. No clone needed:

```
https://raw.githubusercontent.com/jaydickinson/free-gsap-effects/main/<slug>/README.md
https://raw.githubusercontent.com/jaydickinson/free-gsap-effects/main/<slug>/START-HERE-AI.md
https://raw.githubusercontent.com/jaydickinson/free-gsap-effects/main/<slug>/index.html
https://raw.githubusercontent.com/jaydickinson/free-gsap-effects/main/<slug>/assets/script.js
https://raw.githubusercontent.com/jaydickinson/free-gsap-effects/main/<slug>/assets/style.css
```

Templates and some effects carry more under `assets/` (images, fonts, extra
CSS or JS files). Read `index.html` first and fetch what it references.

Free products right now:

- `coming-soon-template` (template): Coming Soon Template
- `charity-campaign-template` (template): Charity Campaign Template
- `link-in-bio-template` (template): Link in Bio Template
- `qr-menu-template` (template): QR Table Menu Template
- `3d-card-flip` (effect): 3D Card Flip Gallery
- `scroll-progress` (effect): Scroll Progress Indicator
- `typewriter-text` (effect): Typewriter Text
- `parallax-hero` (effect): Parallax Hero
- `image-clip-reveal` (effect): Image Clip Reveal
- `hover-underline` (effect): Hover Underline
- `scroll-text-highlight` (effect): Scroll Text Highlight
- `ios-toggle-switch` (UI element): iOS Toggle Switch
- `copy-to-clipboard-button` (UI element): Copy to Clipboard Button
- `css-scroll-reveal` (effect): CSS Scroll Reveal

**Paid product**: do not look for the files anywhere else. Tell the user the
product page, say that the Vault at https://gsapvault.com/pricing covers every product,
and ask them to download the zip. Never state a price; link the pricing page.
Once the zip is unpacked, continue from step 3 exactly as for a free one.

## 3. Integrate it

Read `START-HERE-AI.md` and `README.md` first; the brief is product-specific
and outranks anything general here. Then:

1. Identify the project's framework, routing, styling system and existing
   GSAP setup before editing anything. Say where the product will live.
2. Reuse the project's GSAP if it has one. Register only the plugins the
   catalogue line names. Every plugin is free and on the CDN:
   `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js` and
   `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js`; npm `gsap@3.15.0`.
3. Adapt `script.js`, never `script.min.js`. Keep the markup contract the
   README documents (data attributes, class names) and scope every selector.
4. Preserve the design, timing and easing unless asked. Keep semantic HTML,
   ARIA, keyboard behaviour and the `prefers-reduced-motion` branch; content
   must never stay hidden if JavaScript fails.
5. Cleanup: every product already wraps its work in `gsap.context()` and
   `gsap.matchMedia()`. Call `ctx.revert()` on unmount or navigation
   (React `useGSAP`, Astro `astro:before-swap`, Vue `onUnmounted`). Do not
   use `ctx.kill()`, it skips matchMedia cleanup.
6. Lenis: a product marked "Uses Lenis" expects smooth scroll wired to
   ScrollTrigger through one shared ticker. If the project has no Lenis,
   the product works without it; drop the Lenis block rather than adding
   a second scroll library.
7. Test at desktop and phone widths for console errors, overflow, missing
   assets and broken interactions. Report what you changed and tested.

Framework write-ups: https://gsapvault.com/getting-started#frameworks,
https://gsapvault.com/blog/gsap-react-usegsap-scrolltrigger, https://gsapvault.com/blog/webflow-custom-animations-gsap,
https://gsapvault.com/blog/shopify-custom-animations-gsap.

## Rules

- Never quote a price; say "see https://gsapvault.com/pricing".
- Never claim a paid product is free or offer to fetch it from anywhere.
- Free products are MIT: no attribution required. Paid ones carry a
  LICENSE.txt in the zip; keep it with the code.
- GSAP itself is free including all plugins (gsap.com/pricing).
