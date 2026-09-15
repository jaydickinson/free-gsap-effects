/**
 * Scroll Text Highlight
 *
 * SplitText turns each highlighted block into a reversible reading sequence.
 * Every word holds two layers in one box: a faint ghost preview painted from
 * a data-mark attribute, and the real text, hidden until the reading front
 * arrives. A sharp orange-to-lime front lifts the active word, then leaves
 * completed words calm and dark. Optional progress and coordinate elements can follow
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

    /* The visible block is one word per element mid-animation, which reads as
       twenty-six fragments to a screen reader. Speak the sentence once from a
       hidden sibling and hide the fragments. */
    function announce(container) {
        if (container.previousElementSibling
            && container.previousElementSibling.hasAttribute('data-sh-sr')) return;
        const sr = document.createElement('p');
        sr.setAttribute('data-sh-sr', '');
        sr.textContent = container.textContent.replace(/\s+/g, ' ').trim();
        sr.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;'
            + 'padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);'
            + 'white-space:nowrap;';
        container.parentNode.insertBefore(sr, container);
        container.setAttribute('aria-hidden', 'true');
    }

    function unannounce() {
        document.querySelectorAll('[data-sh-sr]').forEach(function (node) {
            const block = node.nextElementSibling;
            if (block) block.removeAttribute('aria-hidden');
            node.remove();
        });
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
        /* aria: 'none' — SplitText's default puts an aria-label on the block, and
           aria-label is prohibited on a <p> with no role. The readable sentence is
           carried by a visually hidden sibling instead, and the split words are
           taken out of the accessibility tree. */
        const split = new SplitText(container, { type: 'words', wordsClass: 'sh-word', aria: 'none' });
        splits.push(split);
        announce(container);

        const words = split.words;
        if (!words.length) return;

        /* Two layers, one box. The ghost preview is generated content painted
           from data-mark, so it is decoration with no text node; the real text
           moves into .sh-word__text and stays visibility:hidden until the
           front reads it, then crossfades in as the ghost fades out. */
        const texts = words.map(function (word) {
            const text = document.createElement('span');
            text.className = 'sh-word__text';
            while (word.firstChild) {
                text.appendChild(word.firstChild);
            }
            word.appendChild(text);
            word.setAttribute('data-mark', text.textContent);
            return text;
        });

        const foreground = getComputedStyle(container).color;
        const accent = CONFIG.accent ? resolveColor(container, 'var(--accent)') : foreground;
        const edge = CONFIG.accent ? resolveColor(container, 'var(--highlight-edge, #ff6b35)') : foreground;
        const usesStageTrigger = trigger !== container;

        container.classList.add('is-reading');
        /* The ghost opacity rides a custom property, because a pseudo-element
           cannot be tweened directly. GSAP removes an inline custom property
           when it reverts a tween (every ScrollTrigger refresh does), so the
           unread value also lives on the block as --sh-dim and the ::before
           falls back to it. */
        container.style.setProperty('--sh-dim', String(CONFIG.dim));
        gsap.set(words, { y: CONFIG.lift });
        gsap.set(texts, { autoAlpha: 0, color: foreground });
        if (progress) gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });
        if (current) current.textContent = '00 / ' + String(words.length).padStart(2, '0');

        const timeline = gsap.timeline({ defaults: { ease: 'none' } });

        words.forEach(function (word, index) {
            const at = index * STEP;
            const text = texts[index];
            timeline
                .fromTo(word, {
                    '--sh-ghost': CONFIG.dim
                }, {
                    '--sh-ghost': 0,
                    duration: EDGE
                }, at)
                .to(word, {
                    y: -CONFIG.lift * 0.45,
                    duration: EDGE
                }, at)
                .to(text, {
                    autoAlpha: 1,
                    color: edge,
                    duration: EDGE
                }, at)
                .to(word, {
                    y: -CONFIG.lift,
                    duration: FLASH
                }, at + EDGE)
                .to(text, {
                    color: accent,
                    duration: FLASH
                }, at + EDGE)
                .to(word, {
                    y: 0,
                    duration: SETTLE
                }, at + EDGE + FLASH)
                .to(text, {
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
                unannounce();
            };
        });
    });

    window.gsapContext = ctx;

    function teardown() {
        if (ctx) ctx.revert();
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
