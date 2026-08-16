/**
 * Scroll Text Highlight
 *
 * SplitText turns each highlighted block into a reversible reading sequence.
 * A sharp orange-to-lime front lifts the active word, then leaves completed
 * words calm and white. Optional progress and coordinate elements can follow
 * the same scrubbed ScrollTrigger.
 *
 * @plugins ScrollTrigger, SplitText
 * @techniques scrub, text-animation, scroll-highlight
 */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initScrollTextHighlight() {
    const BLOCKS = '.scroll-highlight';

    /* A blocked CDN must leave the unsplit, fully readable statement alone. */
    if (typeof gsap === 'undefined'
        || typeof ScrollTrigger === 'undefined'
        || typeof SplitText === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);

    const wantsSmooth = (new URLSearchParams(location.search).get('smooth')
        || document.documentElement.dataset.smooth) !== 'off'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lenis = null;
    let lenisTick = null;
    let syncLenisOnRefresh = null;

    if (wantsSmooth && typeof Lenis !== 'undefined') {
        lenis = new Lenis({ autoRaf: false });
        lenis.on('scroll', ScrollTrigger.update);
        lenisTick = function (time) { lenis.raf(time * 1000); };
        syncLenisOnRefresh = function () {
            if (lenis) {
                lenis.scrollTo(window.scrollY, { immediate: true, force: true });
            }
        };
        gsap.ticker.add(lenisTick);
        gsap.ticker.lagSmoothing(0);
        ScrollTrigger.addEventListener('refresh', syncLenisOnRefresh);
    }

    const splits = [];
    const STEP = 1;
    const EDGE = 0.16;
    const FLASH = 0.28;
    const SETTLE = 0.72;

    function numericAttribute(element, name, fallback) {
        const value = parseFloat(element.dataset[name]);
        return Number.isFinite(value) ? value : fallback;
    }

    function resolveColor(element, value) {
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;color:' + value;
        element.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
    }

    function resolveElement(value, container) {
        if (!value) return null;
        try {
            return document.querySelector(value) || container.closest(value);
        } catch (error) {
            return null;
        }
    }

    function buildBlock(container) {
        if (!container.isConnected) return;

        const CONFIG = {
            dim: numericAttribute(container, 'highlightDim', 0.16),
            accent: container.dataset.highlightAccent !== 'false',
            lift: numericAttribute(container, 'highlightLift', 7),
            scrub: container.dataset.highlightScrub === undefined
                ? true
                : (container.dataset.highlightScrub === 'true'
                    ? true
                    : numericAttribute(container, 'highlightScrub', true))
        };

        const trigger = resolveElement(container.dataset.highlightTrigger, container) || container;
        const progress = resolveElement(container.dataset.highlightProgress, container);
        const current = resolveElement(container.dataset.highlightCurrent, container);
        const split = new SplitText(container, { type: 'words', wordsClass: 'sh-word' });
        splits.push(split);

        const words = split.words;
        if (!words.length) return;

        const foreground = getComputedStyle(container).color;
        const accent = CONFIG.accent ? resolveColor(container, 'var(--accent)') : foreground;
        const edge = CONFIG.accent ? resolveColor(container, 'var(--highlight-edge, #ff6b35)') : foreground;
        const usesStageTrigger = trigger !== container;

        container.classList.add('is-reading');
        gsap.set(words, { opacity: CONFIG.dim, y: CONFIG.lift, color: foreground });
        if (progress) gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });
        if (current) current.textContent = '00 / ' + String(words.length).padStart(2, '0');

        const timeline = gsap.timeline({ defaults: { ease: 'none' } });

        words.forEach(function (word, index) {
            const at = index * STEP;
            timeline
                .to(word, {
                    opacity: 1,
                    y: -CONFIG.lift * 0.45,
                    color: edge,
                    duration: EDGE
                }, at)
                .to(word, {
                    y: -CONFIG.lift,
                    color: accent,
                    duration: FLASH
                }, at + EDGE)
                .to(word, {
                    y: 0,
                    color: foreground,
                    duration: SETTLE
                }, at + EDGE + FLASH);
        });

        ScrollTrigger.create({
            trigger: trigger,
            animation: timeline,
            start: usesStageTrigger ? 'top top' : 'top 80%',
            end: usesStageTrigger ? 'bottom bottom' : 'bottom 65%',
            scrub: CONFIG.scrub,
            invalidateOnRefresh: true,
            onUpdate: function (self) {
                if (!container.isConnected) return;
                if (progress && progress.isConnected) {
                    gsap.set(progress, { scaleX: self.progress });
                }
                if (current && current.isConnected) {
                    const count = Math.min(words.length, Math.floor(self.progress * words.length));
                    current.textContent = String(count).padStart(2, '0')
                        + ' / ' + String(words.length).padStart(2, '0');
                }
            }
        });
    }

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            let active = true;

            if (context.conditions.isReduced) {
                document.querySelectorAll(BLOCKS).forEach(function (block) {
                    gsap.set(block, { opacity: 1, clearProps: 'transform' });
                });
                return function () { active = false; };
            }

            document.documentElement.classList.add('has-scroll-highlight');
            document.fonts.ready.then(function () {
                if (!active) return;
                document.querySelectorAll(BLOCKS).forEach(buildBlock);
                ScrollTrigger.refresh();
            });

            return function cleanup() {
                active = false;
                document.documentElement.classList.remove('has-scroll-highlight');
                ScrollTrigger.getAll().forEach(function (scrollTrigger) {
                    scrollTrigger.kill();
                });
                splits.forEach(function (split) {
                    split.revert();
                });
                splits.length = 0;
            };
        });
    });

    window.gsapContext = ctx;

    function teardown() {
        if (ctx) ctx.kill();
        if (syncLenisOnRefresh) {
            ScrollTrigger.removeEventListener('refresh', syncLenisOnRefresh);
            syncLenisOnRefresh = null;
        }
        if (lenisTick) {
            gsap.ticker.remove(lenisTick);
            lenisTick = null;
        }
        if (lenis) {
            lenis.destroy();
            lenis = null;
        }
        window.removeEventListener('beforeunload', teardown);
    }

    window.addEventListener('beforeunload', teardown);
});
