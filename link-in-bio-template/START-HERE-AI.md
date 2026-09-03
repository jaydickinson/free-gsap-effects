# Start Here: AI Setup Prompt

Link in Bio Template is a production-ready GSAP website template from GSAP Vault. This file is designed for Cursor, Claude Code, ChatGPT, GitHub Copilot, Windsurf, and other coding assistants.

## Product context

- Product: Link in Bio Template
- Type: website template
- Description: A free creator profile page whose link cards toss onto the page like stickers landing on a desk, drag anywhere with momentum, and tween back into a neat stack on 'Tidy up' - while a tap always just opens the link.
- GSAP plugins: Draggable, InertiaPlugin
- Techniques: draggable, momentum, stagger, load-sequence, micro-interaction
- Lenis smooth scrolling: included
- Difficulty: beginner

The supplied package is the source of truth. It includes the working page markup, readable JavaScript, CSS, documentation, and any product assets. Read the README before changing the implementation.


## Brand and content details to provide

Fill these in before pasting the prompt, or ask your assistant to collect them:

- Brand or project name: [ADD HERE]
- Industry and audience: [ADD HERE]
- Primary goal and CTA: [ADD HERE]
- Brand colours and typefaces: [ADD HERE]
- Content or existing copy to use: [ADD HERE]
- Deployment target: [ADD HERE]

## Copy and paste this into your coding assistant

```text
Integrate the supplied Link in Bio Template website template into my project.

Before editing anything:
1. Inspect my project to identify its framework, routing, file structure, styling system, existing GSAP setup, and component conventions.
2. Read START-HERE-AI.md, README.md, the supplied HTML, CSS, and JavaScript, plus any linked local assets.
3. Explain briefly where the website template should live and which existing files you plan to change.

During implementation:
1. Adapt the supplied code to my project's conventions instead of introducing a duplicate styling, routing, or dependency system.
2. Preserve the visual design, interaction model, and animation timing unless I explicitly request changes.
3. Scope selectors and animation queries so they cannot affect unrelated components.
4. Reuse the project's existing GSAP installation where possible. Register only the plugins this product needs: Draggable, InertiaPlugin.
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
