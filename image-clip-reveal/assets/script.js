/**
 * Image Clip Reveal
 *
 * Images reveal on scroll with an animated clip-path wipe and a Ken Burns
 * settle: the inner image scales from 1.25 down to 1 as the clip opens.
 *
 * @plugins ScrollTrigger
 * @techniques scroll-reveal, image-reveal, clip-path, stagger
 */

gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', function initImageClipReveal() {
    const CLOSED_INSETS = {
        up: 'inset(100% 0% 0% 0%)',
        down: 'inset(0% 0% 100% 0%)',
        left: 'inset(0% 0% 0% 100%)',
        right: 'inset(0% 100% 0% 0%)'
    };
    const OPEN_INSET = 'inset(0% 0% 0% 0%)';
    const IMG_START_SCALE = 1.25;

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const { isMotion } = context.conditions;

            const allWrappers = gsap.utils.toArray('[data-clip-reveal]');
            const groups = gsap.utils.toArray('[data-clip-reveal-group]');

            // ============================================
            // REDUCED MOTION: show images fully, no clip or scale
            // ============================================
            if (!isMotion) {
                allWrappers.forEach(function showStatic(wrapper) {
                    gsap.set(wrapper, { clipPath: 'none' });
                    const img = wrapper.querySelector('img');
                    if (img) gsap.set(img, { scale: 1 });
                });
                return;
            }

            // ============================================
            // CONFIGURATION FROM DATA ATTRIBUTES
            // ============================================
            function readConfig(el, fallback) {
                fallback = fallback || {};
                const direction = el.dataset.revealDirection || fallback.direction || 'up';
                const onceAttr = el.dataset.revealOnce;

                return {
                    direction: CLOSED_INSETS[direction] ? direction : 'up',
                    duration: parseFloat(el.dataset.revealDuration) || fallback.duration || 1.1,
                    delay: parseFloat(el.dataset.revealDelay) || fallback.delay || 0,
                    once: onceAttr !== undefined
                        ? onceAttr !== 'false'
                        : fallback.once !== false
                };
            }

            // ============================================
            // ANIMATION BUILDER
            // ============================================
            function addReveal(timeline, wrapper, config, position) {
                const img = wrapper.querySelector('img');

                timeline.fromTo(wrapper, {
                    clipPath: CLOSED_INSETS[config.direction]
                }, {
                    clipPath: OPEN_INSET,
                    duration: config.duration,
                    delay: config.delay,
                    ease: 'expo.out'
                }, position);

                if (img) {
                    timeline.fromTo(img, {
                        scale: IMG_START_SCALE
                    }, {
                        scale: 1,
                        duration: config.duration,
                        delay: config.delay,
                        ease: 'expo.out'
                    }, position);
                }
            }

            function buildScrollTrigger(triggerEl, once) {
                const st = {
                    trigger: triggerEl,
                    start: 'top 85%'
                };

                if (once) {
                    st.once = true;
                } else {
                    // Replay when re-entering from either direction
                    st.toggleActions = 'restart none none reset';
                }

                return st;
            }

            // ============================================
            // GROUPS: stagger child reveals on one trigger
            // ============================================
            groups.forEach(function initGroup(group) {
                const children = gsap.utils.toArray('[data-clip-reveal]', group);
                if (!children.length) return;

                const groupConfig = readConfig(group);
                const stagger = parseFloat(group.dataset.revealStagger) || 0.12;

                const tl = gsap.timeline({
                    scrollTrigger: buildScrollTrigger(group, groupConfig.once)
                });

                children.forEach(function addChild(wrapper, i) {
                    const config = readConfig(wrapper, groupConfig);
                    addReveal(tl, wrapper, config, i * stagger);
                });
            });

            // ============================================
            // STANDALONE WRAPPERS: one trigger each
            // ============================================
            allWrappers.forEach(function initWrapper(wrapper) {
                if (wrapper.closest('[data-clip-reveal-group]')) return;

                const config = readConfig(wrapper);

                const tl = gsap.timeline({
                    scrollTrigger: buildScrollTrigger(wrapper, config.once)
                });

                addReveal(tl, wrapper, config, 0);
            });

            // ============================================
            // CLEANUP FUNCTION
            // ============================================
            return function cleanup() {
                ScrollTrigger.getAll().forEach(function killTrigger(trigger) {
                    trigger.kill();
                });
            };
        });
    });

    // Store context for SPA cleanup
    window.gsapContext = ctx;
});

// ============================================
// OPTIONAL: Lenis smooth scroll integration
// ============================================
(function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add(function raf(time) {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Store for cleanup
    window.lenis = lenis;
})();
