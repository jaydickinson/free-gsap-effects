/**
 * Scroll Text Highlight
 *
 * Scroll-linked reading highlight: SplitText breaks a block of copy into
 * words, and one scrubbed ScrollTrigger drives a timeline that lights each
 * word from dim to full in sequence. The leading word flashes the accent
 * colour, then relaxes to the foreground, so a bright reading band moves
 * through the paragraph as you scroll. Fully reversible on scroll-up.
 *
 * @plugins ScrollTrigger, SplitText
 * @techniques scroll-reveal, scrub, text-animation
 */

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Runs the init straight away if the DOM is already parsed (a script
   executed late or deferred, e.g. by Cloudflare Rocket Loader), and
   waits for DOMContentLoaded otherwise. A bare DOMContentLoaded listener
   silently never fires under deferred execution. */
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initScrollTextHighlight() {
    const BLOCKS = '.scroll-highlight';

    /* No-JS / no-plugin readers never reach this file, and if SplitText is
       missing we must not leave the copy dimmed. The dim state is only ever
       applied by GSAP below, so simply bailing keeps the text fully legible. */
    if (typeof SplitText === 'undefined') {
        return;
    }

    /* OPTIONAL: Lenis smooth scroll. A scrubbed reading effect benefits from
       it; delete this block (and the CDN tag) for native scroll. */
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ autoRaf: true });
        lenis.on('scroll', ScrollTrigger.update);
    }
    /* END OPTIONAL: Lenis */

    const splits = [];

    // Timeline shape (in abstract units, scrub maps them to scroll distance):
    // STEP   - spacing between one word lighting and the next
    // LIGHT  - how long a word takes to reach full accent (the front's sharpness)
    // SETTLE - how long the accent relaxes back to foreground (the band's tail)
    // A wider SETTLE lights more words at once; too wide and the "front" blurs.
    const STEP = 1;
    const LIGHT = 1.4;
    const SETTLE = 2.6;

    function resolveColor(el, value) {
        // Resolve a CSS custom property or keyword to a concrete rgb() string
        // via a throwaway probe, since GSAP cannot interpolate to var(--x).
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;color:' + value;
        el.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
    }

    function buildBlock(container) {
        if (!container.isConnected) return;

        const CONFIG = {
            // Resting opacity of un-read words (ahead of and, briefly, behind the front)
            dim: parseFloat(container.dataset.highlightDim) || 0.18,
            // Leading word flashes the accent colour before settling to foreground
            accent: container.dataset.highlightAccent !== 'false',
            // Optional restrained secondary channel: px the word lifts as it lights
            lift: parseFloat(container.dataset.highlightLift) || 0,
            // Scrub smoothing: true snaps to scroll, a number adds catch-up lag
            scrub: container.dataset.highlightScrub === undefined
                ? true
                : (container.dataset.highlightScrub === 'true'
                    ? true
                    : parseFloat(container.dataset.highlightScrub))
        };

        const split = new SplitText(container, {
            type: 'words',
            wordsClass: 'sh-word'
        });
        splits.push(split);

        const words = split.words;
        if (!words.length) {
            split.revert();
            return;
        }

        const accentColor = resolveColor(container, 'var(--accent)');
        const fgColor = getComputedStyle(container).color;
        const litColor = CONFIG.accent ? accentColor : fgColor;

        // Class is a CSS hook only; the dim state itself is applied by GSAP
        // below, so a reader without JS keeps full-opacity copy.
        container.classList.add('is-reading');

        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: container,
                // Finish while the block is still comfortably in view (its bottom
                // at 65% of the viewport) so the last words light before the reader
                // runs out of scroll. The demo adds a runway spacer after the final
                // block so this end is always reachable; give any trailing block on
                // your own page similar room below it.
                start: 'top 80%',
                end: 'bottom 65%',
                scrub: CONFIG.scrub
            }
        });

        words.forEach(function(word, i) {
            const at = i * STEP;
            // Phase A: dim -> full, foreground -> lit (accent). immediateRender
            // seeds every word to the dim "from" state, so words ahead of the
            // front sit dimmed before their tween is reached.
            tl.fromTo(word,
                { opacity: CONFIG.dim, y: CONFIG.lift },
                { opacity: 1, y: 0, color: litColor, duration: LIGHT },
                at
            );
            // Phase B: relax the accent back to the settled foreground colour,
            // leaving read words full and calm behind the moving front.
            if (CONFIG.accent) {
                tl.to(word,
                    { color: fgColor, duration: SETTLE },
                    at + LIGHT
                );
            }
        });
    }

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', function() {
            // Wait for fonts so SplitText measures final word widths and wraps
            // lines correctly; refresh ScrollTrigger once positions are set.
            document.fonts.ready.then(function() {
                document.querySelectorAll(BLOCKS).forEach(buildBlock);
                ScrollTrigger.refresh();
            });

            return function cleanup() {
                ScrollTrigger.getAll().forEach(function(trigger) {
                    trigger.kill();
                });
                splits.forEach(function(split) {
                    split.revert();
                });
                splits.length = 0;
            };
        });

        mm.add('(prefers-reduced-motion: reduce)', function() {
            // Never leave copy stuck dim: show every block at full opacity.
            document.querySelectorAll(BLOCKS).forEach(function(block) {
                gsap.set(block, { opacity: 1 });
            });
        });
    });

    window.gsapContext = ctx;

    window.addEventListener('beforeunload', function() {
        if (ctx) ctx.kill();
        if (lenis) lenis.destroy();
    });
});
