# Free GSAP Effects

Seven free, production-ready GSAP animation effects. Copy, paste, and ship. Each effect is self-contained, framework-agnostic, accessible, and memory-safe.

From [GSAP Vault](https://gsapvault.com), a library of 28 copy-paste GSAP animation effects.

## The Effects

| Effect | What it does | Live demo |
|--------|--------------|-----------|
| [Typewriter Text](./typewriter-text) | Text types out character by character with a blinking cursor when scrolled into view. Supports looping phrases, custom speed, and delay controls. | [Demo](https://gsapvault.com/effects/typewriter-text) |
| [Parallax Hero](./parallax-hero) | A layered hero section where background blobs, headline, and foreground labels scroll at different speeds, creating scrubbed parallax depth. | [Demo](https://gsapvault.com/effects/parallax-hero) |
| [Image Clip Reveal](./image-clip-reveal) | Images reveal on scroll with an animated clip-path wipe and a Ken Burns settle as the mask opens. | [Demo](https://gsapvault.com/effects/image-clip-reveal) |
| [Hover Underline](./hover-underline) | Animated link underlines with three variants: exit-through slide, marker-style fill sweep, and hand-drawn SVG wave. One data attribute per link. | [Demo](https://gsapvault.com/effects/hover-underline) |
| [3D Card Flip Gallery](./3d-card-flip) | Team/portfolio cards with 3D flip animation. Hover flip for desktop, tap for touch, staggered entrance, scroll-triggered reveals. | [Demo](https://gsapvault.com/effects/3d-card-flip) |
| [Scroll Progress Indicator](./scroll-progress) | Four scroll progress styles using ScrollTrigger: animated bar, circle, rail track, and percentage counter. | [Demo](https://gsapvault.com/effects/scroll-progress) |
| [CSS Scroll Reveal](./css-scroll-reveal) | Pure CSS scroll-triggered entrance animations. No JavaScript required. Native CSS scroll-driven animations for fade, slide, and scale. | [Demo](https://gsapvault.com/effects/css-scroll-reveal) |

## Quick Start

Every effect folder contains:

```
effect-name/
├── index.html        # Working demo page, open it in a browser
├── README.md         # Full documentation: options, examples, accessibility
└── assets/
    ├── style.css     # Effect styles
    ├── script.js     # Commented source
    └── script.min.js # Minified production build
```

1. Open the effect's `index.html` in a browser to see it working.
2. Read the effect's `README.md` for the copy-paste quick start and all options.
3. Copy the markup pattern and the script into your project. GSAP loads from CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
```

## What "production-ready" means here

- **Accessibility built in**: every effect respects [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) with a static fallback, and keyboard focus mirrors hover interactions.
- **Memory-safe**: `gsap.context()` scoping, `gsap.matchMedia()` for responsive and motion branches, event handlers tracked for cleanup, ScrollTriggers killed on teardown.
- **Framework-agnostic**: plain HTML/CSS/JS that drops into WordPress, Webflow, React, Vue, Astro, or static sites. The [GSAP Vault getting started guide](https://gsapvault.com/getting-started) covers framework integration patterns.
- **LLM-friendly**: clearly commented code that AI assistants can read, explain, and adapt for your project.

## Want more?

These 7 effects are the free tier of [GSAP Vault](https://gsapvault.com). The full library has 28 effects, including scroll-image sequences, infinite marquees, draggable galleries, text scramble/decode, magnetic cursors, particle systems, and more.

- Browse everything: [gsapvault.com/effects](https://gsapvault.com/effects)
- All 28 effects, one payment: [All-Access Bundle](https://gsapvault.com/effects) at £29 one-time, unlimited commercial projects
- Tutorials and guides: [gsapvault.com/blog](https://gsapvault.com/blog)

## License

The effects in this repository are MIT licensed: use them in personal and commercial projects, no attribution required (a link back to [gsapvault.com](https://gsapvault.com) is always appreciated).

GSAP itself is created by Greensock/Webflow and is [100% free](https://gsap.com/pricing/) including all plugins.
