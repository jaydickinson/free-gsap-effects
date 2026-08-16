/**
 * Parallax Hero
 *
 * A pinned, scrubbed depth scene. Add data-parallax to a hero and give each
 * moving layer a data-parallax-speed value: values below 1 recede while values
 * above 1 move into the foreground.
 *
 * @plugins ScrollTrigger
 * @techniques parallax, scrub, pinning
 */

gsap.registerPlugin(ScrollTrigger);

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(function initParallaxHero() {
    const wantsSmooth = (new URLSearchParams(location.search).get('smooth')
        || document.documentElement.dataset.smooth) !== 'off'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lenis = null;
    let lenisTick = null;
    let refreshLenis = null;

    if (wantsSmooth && typeof Lenis !== 'undefined') {
        lenis = new Lenis({ autoRaf: false, duration: 1.05, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        lenisTick = function tickLenis(time) { lenis.raf(time * 1000); };
        refreshLenis = function syncLenisAfterRefresh() {
            lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        };
        gsap.ticker.add(lenisTick);
        gsap.ticker.lagSmoothing(0);
        ScrollTrigger.addEventListener('refresh', refreshLenis);
    }

    const ctx = gsap.context(function effectContext() {
        const mm = gsap.matchMedia();

        mm.add({
            desktop: '(min-width: 769px) and (prefers-reduced-motion: no-preference)',
            mobile: '(max-width: 768px) and (prefers-reduced-motion: no-preference)',
            reduced: '(prefers-reduced-motion: reduce)'
        }, function responsiveBranch(context) {
            const conditions = context.conditions;
            const scenes = gsap.utils.toArray('[data-parallax]');

            if (conditions.reduced) {
                gsap.set('[data-parallax-speed]', {
                    clearProps: 'transform,filter,opacity,visibility'
                });
                return;
            }

            const isMobile = conditions.mobile;
            const triggers = [];

            scenes.forEach(function createScene(scene) {
                const layers = gsap.utils.toArray('[data-parallax-speed]', scene);
                if (!layers.length) return;

                const distance = parseFloat(isMobile
                    ? scene.dataset.parallaxMobileDistance
                    : scene.dataset.parallaxDistance) || (isMobile ? 128 : 236);
                const runway = parseFloat(isMobile
                    ? scene.dataset.parallaxMobileRunway
                    : scene.dataset.parallaxRunway) || (isMobile ? 340 : 560);
                const progressValue = scene.querySelector('[data-parallax-progress]');
                const fill = scene.querySelector('[data-parallax-fill]');
                const state = { progress: 0 };

                const timeline = gsap.timeline({
                    defaults: { duration: 1, ease: 'none', force3D: true },
                    scrollTrigger: {
                        trigger: scene,
                        start: 'top top',
                        end: function endPosition() { return '+=' + runway; },
                        pin: true,
                        scrub: isMobile ? 0.35 : 0.5,
                        invalidateOnRefresh: true
                    }
                });

                layers.forEach(function animateLayer(layer) {
                    const parsedSpeed = parseFloat(layer.dataset.parallaxSpeed);
                    const speed = Number.isFinite(parsedSpeed) ? parsedSpeed : 1;
                    const y = (1 - speed) * distance;
                    const xTo = parseFloat(layer.dataset.parallaxX);
                    const rotateTo = parseFloat(layer.dataset.parallaxRotate);
                    const scaleTo = parseFloat(layer.dataset.parallaxScale);
                    const blurTo = parseFloat(layer.dataset.parallaxBlur);
                    const opacityTo = parseFloat(layer.dataset.parallaxOpacity);
                    const toVars = { y: y };

                    if (Number.isFinite(xTo)) toVars.x = isMobile ? xTo * 0.58 : xTo;
                    if (Number.isFinite(rotateTo)) toVars.rotation = isMobile ? rotateTo * 0.62 : rotateTo;
                    if (Number.isFinite(scaleTo)) toVars.scale = scaleTo;
                    if (Number.isFinite(blurTo)) toVars.filter = 'blur(' + blurTo + 'px)';
                    if (Number.isFinite(opacityTo)) toVars.autoAlpha = opacityTo;
                    timeline.to(layer, toVars, 0);
                });

                if (fill) timeline.to(fill, { scaleX: 1 }, 0);
                if (progressValue) {
                    timeline.to(state, {
                        progress: 100,
                        onUpdate: function updateReadout() {
                            if (progressValue.isConnected) {
                                progressValue.textContent = String(Math.round(state.progress)).padStart(3, '0');
                            }
                        }
                    }, 0);
                }

                triggers.push(timeline.scrollTrigger);
            });

            return function cleanupMotion() {
                triggers.forEach(function killTrigger(trigger) { trigger.kill(); });
            };
        });
    });

    function teardown() {
        window.removeEventListener('beforeunload', teardown);
        if (ctx) ctx.kill();
        if (refreshLenis) ScrollTrigger.removeEventListener('refresh', refreshLenis);
        if (lenisTick) gsap.ticker.remove(lenisTick);
        if (lenis) lenis.destroy();
    }

    window.gsapContext = ctx;
    window.addEventListener('beforeunload', teardown, { once: true });
});
