/**
 * Parallax Hero
 *
 * A pinned, scrubbed depth scene. Add data-parallax to a hero and give each
 * moving layer a data-parallax-speed value: values below 1 recede while values
 * above 1 move into the foreground. On a fine pointer the same depth values
 * also drive an optional cursor drift (data-parallax-pointer on the scene).
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

    // A layer's depth is its distance from speed 1: negative recedes, positive
    // advances. Both the scroll travel and the pointer drift read it.
    function layerSpeed(layer) {
        const parsed = parseFloat(layer.dataset.parallaxSpeed);
        return Number.isFinite(parsed) ? parsed : 1;
    }

    const ctx = gsap.context(function effectContext() {
        const mm = gsap.matchMedia();

        mm.add({
            desktop: '(min-width: 769px) and (prefers-reduced-motion: no-preference)',
            mobile: '(max-width: 768px) and (prefers-reduced-motion: no-preference)',
            pointer: '(hover: hover) and (pointer: fine)',
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
            const pointerHandlers = new Map();

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
                    const speed = layerSpeed(layer);
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

                // Pointer drift. The scroll timeline owns x and y in pixels, so
                // the drift tweens xPercent and yPercent instead: separate
                // transform components, no fight over one property. Strength
                // is the percentage a layer at depth 1 travels for a cursor at
                // the scene's edge; deeper and nearer layers scale with depth,
                // and move against each other, which is what reads as a window.
                const drift = parseFloat(scene.dataset.parallaxPointer);
                if (!conditions.pointer || !(drift > 0)) return;

                const setters = layers.map(function makeSetter(layer) {
                    return {
                        depth: layerSpeed(layer) - 1,
                        x: gsap.quickTo(layer, 'xPercent', { duration: 1.1, ease: 'power3' }),
                        y: gsap.quickTo(layer, 'yPercent', { duration: 1.1, ease: 'power3' })
                    };
                });

                function onPointerMove(event) {
                    const rect = scene.getBoundingClientRect();
                    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
                    setters.forEach(function driftLayer(setter) {
                        setter.x(-nx * setter.depth * drift);
                        setter.y(-ny * setter.depth * drift * 0.6);
                    });
                }

                function onPointerLeave() {
                    setters.forEach(function settleLayer(setter) {
                        setter.x(0);
                        setter.y(0);
                    });
                }

                scene.addEventListener('pointermove', onPointerMove);
                scene.addEventListener('pointerleave', onPointerLeave);
                pointerHandlers.set(scene, { move: onPointerMove, leave: onPointerLeave });
            });

            return function cleanupMotion() {
                triggers.forEach(function killTrigger(trigger) { trigger.kill(); });
                pointerHandlers.forEach(function removeHandlers(handlers, scene) {
                    scene.removeEventListener('pointermove', handlers.move);
                    scene.removeEventListener('pointerleave', handlers.leave);
                });
                pointerHandlers.clear();
            };
        });
    });

    function teardown() {
        window.removeEventListener('beforeunload', teardown);
        if (ctx) ctx.revert();
        if (refreshLenis) ScrollTrigger.removeEventListener('refresh', refreshLenis);
        if (lenisTick) gsap.ticker.remove(lenisTick);
        if (lenis) lenis.destroy();
    }

    window.gsapContext = ctx;
    window.addEventListener('beforeunload', teardown, { once: true });
});
