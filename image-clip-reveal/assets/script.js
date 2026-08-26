/**
 * Image Clip Reveal
 *
 * A directional polygon aperture opens while the image settles from a
 * restrained scale. Optional caption, rule, and atmosphere elements follow.
 *
 * @plugins ScrollTrigger
 * @techniques scroll-reveal, image-reveal, clip-path, ken-burns
 */

gsap.registerPlugin(ScrollTrigger);

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initImageClipReveal() {
    const wantsSmooth = (new URLSearchParams(location.search).get('smooth')
        || document.documentElement.dataset.smooth) !== 'off'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lenis = null;
    let lenisTick = null;
    let syncLenisOnRefresh = null;
    let beforeUnload = null;

    function initLenis() {
        if (!wantsSmooth || lenis || typeof Lenis === 'undefined') return;

        const hasST = typeof ScrollTrigger !== 'undefined';
        lenis = new Lenis({ autoRaf: !hasST });
        if (hasST) {
            lenis.on('scroll', ScrollTrigger.update);
            lenisTick = function (time) { lenis.raf(time * 1000); };
            gsap.ticker.add(lenisTick);
            gsap.ticker.lagSmoothing(0);
            syncLenisOnRefresh = function () {
                if (lenis) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
            };
            ScrollTrigger.addEventListener('refresh', syncLenisOnRefresh);
        }
    }

    function destroyLenis() {
        if (lenisTick) gsap.ticker.remove(lenisTick);
        if (syncLenisOnRefresh) ScrollTrigger.removeEventListener('refresh', syncLenisOnRefresh);
        if (lenis) lenis.destroy();
        lenis = null;
        lenisTick = null;
        syncLenisOnRefresh = null;
    }

    /* Six points keep interpolation stable while the leading edge forms a
       narrow architectural wedge. Direction names retain the original API. */
    const CLOSED_CLIPS = {
        up: 'polygon(0% 100%, 42% 100%, 50% 94%, 58% 100%, 100% 100%, 0% 100%)',
        down: 'polygon(0% 0%, 42% 0%, 50% 6%, 58% 0%, 100% 0%, 0% 0%)',
        left: 'polygon(100% 0%, 100% 42%, 94% 50%, 100% 58%, 100% 100%, 100% 0%)',
        right: 'polygon(0% 0%, 0% 42%, 6% 50%, 0% 58%, 0% 100%, 0% 0%)'
    };
    const OPEN_CLIP = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%, 0% 0%)';
    const IMG_START_SCALE = 1.14;
    const timelines = [];
    const triggers = [];
    const handlers = new Map();

    function numberOr(value, fallback) {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function readConfig(el, fallback) {
        fallback = fallback || {};
        const direction = el.dataset.revealDirection || fallback.direction || 'up';
        const onceAttr = el.dataset.revealOnce;

        return {
            direction: CLOSED_CLIPS[direction] ? direction : 'up',
            duration: numberOr(el.dataset.revealDuration, fallback.duration || 1.1),
            delay: numberOr(el.dataset.revealDelay, fallback.delay || 0),
            once: onceAttr !== undefined ? onceAttr !== 'false' : fallback.once !== false
        };
    }

    function registerTimeline(timeline) {
        timelines.push(timeline);
        if (timeline.scrollTrigger) triggers.push(timeline.scrollTrigger);
        return timeline;
    }

    function addReveal(timeline, wrapper, config, position) {
        const image = wrapper.querySelector('img');
        const figure = wrapper.closest('figure');
        const caption = figure && figure.querySelector('[data-reveal-caption]');
        const rule = caption && caption.querySelector('[data-reveal-rule]');
        const captionItems = caption
            ? gsap.utils.toArray('[data-reveal-copy]', caption)
            : [];
        const atmosphere = figure && figure.querySelector('[data-reveal-atmosphere]');
        const captionAt = position + config.delay + (config.duration * 0.72);

        timeline.fromTo(wrapper, {
            clipPath: CLOSED_CLIPS[config.direction]
        }, {
            clipPath: OPEN_CLIP,
            duration: config.duration,
            delay: config.delay,
            ease: 'expo.inOut'
        }, position);

        if (image) {
            timeline.fromTo(image, {
                scale: IMG_START_SCALE
            }, {
                scale: 1,
                duration: config.duration + 0.18,
                delay: config.delay,
                ease: 'power3.out'
            }, position);
        }

        if (atmosphere) {
            timeline.fromTo(atmosphere, {
                opacity: 0,
                scale: 0.84
            }, {
                opacity: 0.7,
                scale: 1,
                duration: config.duration * 0.9,
                ease: 'sine.out'
            }, position + config.delay + 0.12);
        }

        if (rule) {
            timeline.fromTo(rule, {
                scaleX: 0,
                transformOrigin: config.direction === 'left' ? 'right center' : 'left center'
            }, {
                scaleX: 1,
                duration: 0.65,
                ease: 'expo.out'
            }, captionAt);
        }

        if (captionItems.length) {
            timeline.fromTo(captionItems, {
                yPercent: 115,
                y: 0,
                opacity: 0
            }, {
                yPercent: 0,
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.07,
                ease: 'expo.out'
            }, captionAt + 0.08);
        }
    }

    function buildScrollTrigger(triggerEl, once) {
        const settings = {
            trigger: triggerEl,
            start: 'top 85%'
        };

        if (once) {
            settings.once = true;
        } else {
            settings.toggleActions = 'restart none none reset';
        }

        return settings;
    }

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const { isMotion } = context.conditions;
            const wrappers = gsap.utils.toArray('[data-clip-reveal]');
            const groups = gsap.utils.toArray('[data-clip-reveal-group]');

            if (!isMotion) {
                gsap.set(wrappers, { clipPath: 'none' });
                wrappers.forEach(function showStatic(wrapper) {
                    const image = wrapper.querySelector('img');
                    const figure = wrapper.closest('figure');
                    if (image) gsap.set(image, { scale: 1 });
                    if (figure) {
                        gsap.set(figure.querySelectorAll('[data-reveal-caption], [data-reveal-copy], [data-reveal-rule]'), {
                            clearProps: 'all'
                        });
                        const atmosphere = figure.querySelector('[data-reveal-atmosphere]');
                        if (atmosphere) gsap.set(atmosphere, { opacity: 0.45, scale: 1 });
                    }
                });
                return;
            }

            initLenis();

            groups.forEach(function initGroup(group) {
                const children = gsap.utils.toArray('[data-clip-reveal]', group);
                if (!children.length) return;

                const groupConfig = readConfig(group);
                const stagger = numberOr(group.dataset.revealStagger, 0.12);
                const timeline = registerTimeline(gsap.timeline({
                    scrollTrigger: buildScrollTrigger(group, groupConfig.once)
                }));

                children.forEach(function addChild(wrapper, index) {
                    addReveal(timeline, wrapper, readConfig(wrapper, groupConfig), index * stagger);
                });
            });

            wrappers.forEach(function initWrapper(wrapper) {
                if (wrapper.closest('[data-clip-reveal-group]')) return;
                const config = readConfig(wrapper);
                const timeline = registerTimeline(gsap.timeline({
                    scrollTrigger: buildScrollTrigger(wrapper, config.once)
                }));
                addReveal(timeline, wrapper, config, 0);
            });

            gsap.utils.toArray('[data-clip-replay]').forEach(function initReplay(button) {
                const handleReplay = function () {
                    timelines.forEach(function replayTimeline(timeline) {
                        if (timeline && timeline.scrollTrigger) timeline.restart(true);
                    });
                };
                button.addEventListener('click', handleReplay);
                handlers.set(button, handleReplay);
            });

            return function cleanupMotion() {
                handlers.forEach(function removeHandler(handler, element) {
                    element.removeEventListener('click', handler);
                });
                handlers.clear();
                triggers.forEach(function killTrigger(trigger) { trigger.kill(); });
                timelines.forEach(function killTimeline(timeline) { timeline.kill(); });
                triggers.length = 0;
                timelines.length = 0;
                destroyLenis();
            };
        });
    });

    window.gsapContext = ctx;
    window.imageClipReveal = {
        replay: function replay() {
            timelines.forEach(function restartTimeline(timeline) { timeline.restart(true); });
        },
        destroy: function destroy() {
            ctx.revert();
            destroyLenis();
        }
    };

    beforeUnload = function cleanupBeforeUnload() {
        window.imageClipReveal.destroy();
        window.removeEventListener('beforeunload', beforeUnload);
    };
    window.addEventListener('beforeunload', beforeUnload);
});
