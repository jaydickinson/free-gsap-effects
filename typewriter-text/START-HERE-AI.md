# Start Here: AI Setup Prompt

Typewriter Text is a production-ready GSAP animation effect from GSAP Vault. This file is designed for Cursor, Claude Code, ChatGPT, GitHub Copilot, Windsurf, and other coding assistants.

## Product context

- Product: Typewriter Text
- Type: animation effect
- Description: A sharp terminal-style typewriter that types, holds, accelerates through deletion, and cycles to the next phrase in sync with cursor and progress signals.
- GSAP plugins: ScrollTrigger
- Techniques: text-animation, typewriter, scroll-reveal, infinite-loop
- Lenis smooth scrolling: not required
- Difficulty: beginner

The supplied package is the source of truth. It includes the working page markup, readable JavaScript, CSS, documentation, and any product assets. Read the README before changing the implementation.

## Copy and paste this into your coding assistant

```text
Integrate the supplied Typewriter Text animation effect into my project.

Before editing anything:
1. Inspect my project to identify its framework, routing, file structure, styling system, existing GSAP setup, and component conventions.
2. Read START-HERE-AI.md, README.md, the supplied HTML, CSS, and JavaScript, plus any linked local assets.
3. Explain briefly where the animation effect should live and which existing files you plan to change.

During implementation:
1. Adapt the supplied code to my project's conventions instead of introducing a duplicate styling, routing, or dependency system.
2. Preserve the visual design, interaction model, and animation timing unless I explicitly request changes.
3. Scope selectors and animation queries so they cannot affect unrelated components.
4. Reuse the project's existing GSAP installation where possible. Register only the plugins this product needs: ScrollTrigger.
5. Preserve responsive behaviour, keyboard operation, semantic HTML, ARIA attributes, and prefers-reduced-motion handling.
6. Preserve or add correct GSAP, ScrollTrigger, observer, ticker, and event-listener cleanup for the detected framework and routing model.
7. Keep the page usable if JavaScript or an animation dependency fails. Do not leave content hidden in fallback or reduced-motion states.
8. Do not replace working local assets with placeholders, remove licence notices, or add dependencies without explaining why.
9. Test for console errors, layout overflow, missing assets, and broken interactions at desktop and mobile sizes.

When finished:
1. List every file changed or created.
2. Summarise any framework-specific adaptation you made.
3. Identify the safest colours, copy, timing, easing, and content values I can customise.
4. Report what you tested and flag anything that still needs manual review.

Ask before making a major design change, changing the animation concept, or replacing an existing project dependency.
```

## Suggested follow-up requests

- “Match this to my existing design tokens without changing the animation.”
- “Replace the demo copy with my supplied content and keep the current hierarchy.”
- “Convert this implementation to my framework's component pattern with complete cleanup.”
- “Audit the result for mobile overflow, reduced motion, keyboard access, and console errors.”

---

Downloaded from https://gsapvault.com. See the included LICENSE.txt where present for usage terms.
