/**
 * Parallax Hero
 *
 * Layered hero section where elements move at different speeds while
 * scrolling. One scrubbed ScrollTrigger per container maps each layer's
 * yPercent to its data-parallax-speed, creating a sense of depth.
 *
 * @plugins ScrollTrigger
 * @techniques parallax, scrub, scroll-reveal
 */

gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', function initParallaxHero() {
    // ============================================
    // OPTIONAL: Lenis smooth scroll integration
    // Remove this block if you are not using Lenis
    // ============================================
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add(function lenisRaf(time) {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        window.lenis = lenis;
    }

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        // ============================================
        // MOTION: scrubbed parallax layers
        // ============================================
        mm.add('(prefers-reduced-motion: no-preference)', function motionBranch() {
            const containers = gsap.utils.toArray('[data-parallax]');

            containers.forEach(function initContainer(container) {
                const layers = gsap.utils.toArray('[data-parallax-speed]', container);
                if (!layers.length) return;

                // One scrubbed timeline per container. Timeline progress maps
                // to the container's full journey through the viewport.
                // clamp() prevents a visual jump when the container is already
                // partially in view on page load.
                const tl = gsap.timeline({
                    defaults: {
                        ease: 'none',
                        duration: 1,
                        force3D: true
                    },
                    scrollTrigger: {
                        trigger: container,
                        start: 'clamp(top bottom)',
                        end: 'clamp(bottom top)',
                        scrub: true,
                        invalidateOnRefresh: true
                    }
                });

                layers.forEach(function initLayer(layer) {
                    const parsed = parseFloat(layer.dataset.parallaxSpeed);
                    const speed = isNaN(parsed) ? 1 : parsed;

                    // speed 1 tracks the scroll exactly (no shift).
                    // speed < 1 lags behind (background depth).
                    // speed > 1 races ahead (foreground depth).
                    const shift = (1 - speed) * 50;

                    tl.fromTo(layer,
                        { yPercent: -shift },
                        { yPercent: shift },
                        0
                    );

                    // Optional: fade the layer out as the container leaves
                    // the top of the viewport
                    if (layer.hasAttribute('data-parallax-fade')) {
                        tl.fromTo(layer,
                            { autoAlpha: 1 },
                            { autoAlpha: 0, duration: 0.45 },
                            0.55
                        );
                    }
                });
            });

            return function cleanup() {
                ScrollTrigger.getAll().forEach(function killTrigger(trigger) {
                    trigger.kill();
                });
            };
        });

        // ============================================
        // REDUCED MOTION: layers stay static
        // ============================================
        mm.add('(prefers-reduced-motion: reduce)', function reducedBranch() {
            gsap.set('[data-parallax] [data-parallax-speed]', {
                yPercent: 0,
                autoAlpha: 1
            });
        });
    });

    // Store context for SPA cleanup
    window.gsapContext = ctx;

    window.addEventListener('beforeunload', function teardown() {
        if (ctx) ctx.kill();
        if (lenis) lenis.destroy();
    });
});
