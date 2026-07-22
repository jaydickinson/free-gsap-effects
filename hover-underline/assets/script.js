/**
 * Hover Underline
 *
 * Animated link underlines with three variants: an exit-through slide,
 * a marker-style fill sweep, and an SVG wave that draws itself in.
 * The script injects all decoration elements, so links only need
 * a data-underline attribute.
 *
 * @plugins none (GSAP core only)
 * @techniques hover-effect, micro-interaction, underline
 */

/* Runs the init straight away if the DOM is already parsed (a script
   executed late or deferred, e.g. by Cloudflare Rocket Loader), and
   waits for DOMContentLoaded otherwise. */
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initHoverUnderline() {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const WAVE_PATH = 'M0 4 Q 12.5 0 25 4 T 50 4 T 75 4 T 100 4';

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const { isMotion } = context.conditions;

            // Reduced motion: CSS supplies a plain static underline.
            // No decoration is injected and no JS animation runs.
            if (!isMotion) return;

            const links = document.querySelectorAll('a[data-underline]');
            const handlers = new Map();
            const injected = [];

            // ============================================
            // VARIANT BUILDERS
            // Each returns { enter, leave } handler pair
            // ============================================

            function buildSlide(link) {
                const line = document.createElement('span');
                line.className = 'hu-line';
                line.setAttribute('aria-hidden', 'true');
                link.appendChild(line);
                injected.push(line);

                gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });

                return {
                    enter: function slideEnter() {
                        gsap.killTweensOf(line);
                        // Grow from the left edge
                        gsap.set(line, { transformOrigin: 'left center' });
                        gsap.fromTo(line, { scaleX: 0 }, {
                            scaleX: 1,
                            duration: 0.45,
                            ease: 'power3.out'
                        });
                    },
                    leave: function slideLeave() {
                        gsap.killTweensOf(line);
                        // Swap origin so the line exits through the right
                        // instead of reversing backwards
                        gsap.set(line, { transformOrigin: 'right center' });
                        gsap.to(line, {
                            scaleX: 0,
                            duration: 0.45,
                            ease: 'power3.out'
                        });
                    }
                };
            }

            function buildFill(link) {
                const fill = document.createElement('span');
                fill.className = 'hu-fill';
                fill.setAttribute('aria-hidden', 'true');
                link.appendChild(fill);
                injected.push(fill);

                gsap.set(fill, { scaleY: 0, transformOrigin: 'center bottom' });

                return {
                    enter: function fillEnter() {
                        gsap.killTweensOf(fill);
                        // Sweep up from the baseline like a marker
                        gsap.set(fill, { transformOrigin: 'center bottom' });
                        gsap.fromTo(fill, { scaleY: 0 }, {
                            scaleY: 1,
                            duration: 0.35,
                            ease: 'power2.out'
                        });
                    },
                    leave: function fillLeave() {
                        gsap.killTweensOf(fill);
                        // Continue upwards and exit through the top
                        gsap.set(fill, { transformOrigin: 'center top' });
                        gsap.to(fill, {
                            scaleY: 0,
                            duration: 0.35,
                            ease: 'power2.out'
                        });
                    }
                };
            }

            function buildWave(link) {
                const svg = document.createElementNS(SVG_NS, 'svg');
                svg.setAttribute('class', 'hu-wave');
                svg.setAttribute('viewBox', '0 0 100 8');
                svg.setAttribute('preserveAspectRatio', 'none');
                svg.setAttribute('aria-hidden', 'true');

                const path = document.createElementNS(SVG_NS, 'path');
                path.setAttribute('d', WAVE_PATH);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', 'currentColor');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linecap', 'round');
                svg.appendChild(path);

                link.appendChild(svg);
                injected.push(svg);

                const length = path.getTotalLength();
                gsap.set(path, {
                    strokeDasharray: length,
                    strokeDashoffset: length
                });

                return {
                    enter: function waveEnter() {
                        gsap.killTweensOf([path, svg]);
                        // Draw the wave in from the left
                        gsap.fromTo(path, { strokeDashoffset: length }, {
                            strokeDashoffset: 0,
                            duration: 0.5,
                            ease: 'power2.out'
                        });
                        // Subtle vertical settle as the line lands
                        gsap.fromTo(svg, { scaleY: 1.6 }, {
                            scaleY: 1,
                            duration: 0.7,
                            ease: 'elastic.out(1.2, 0.4)',
                            transformOrigin: 'center bottom'
                        });
                    },
                    leave: function waveLeave() {
                        gsap.killTweensOf([path, svg]);
                        // Push the offset past zero so the wave keeps
                        // travelling and exits through the right
                        gsap.to(path, {
                            strokeDashoffset: -length,
                            duration: 0.4,
                            ease: 'power2.in'
                        });
                        gsap.to(svg, { scaleY: 1, duration: 0.2 });
                    }
                };
            }

            // ============================================
            // LINK SETUP
            // ============================================
            links.forEach(function initLink(link) {
                const variant = link.dataset.underline || 'slide';
                const color = link.dataset.underlineColor;

                link.classList.add('hu-link');
                if (color) link.style.setProperty('--hu-color', color);

                let pair;
                if (variant === 'fill') {
                    pair = buildFill(link);
                } else if (variant === 'wave') {
                    pair = buildWave(link);
                } else {
                    pair = buildSlide(link);
                }

                // Mouse and keyboard get the same animation
                link.addEventListener('mouseenter', pair.enter);
                link.addEventListener('mouseleave', pair.leave);
                link.addEventListener('focus', pair.enter);
                link.addEventListener('blur', pair.leave);

                handlers.set(link, {
                    mouseenter: pair.enter,
                    mouseleave: pair.leave,
                    focus: pair.enter,
                    blur: pair.leave
                });
            });

            // ============================================
            // CLEANUP
            // ============================================
            return function cleanup() {
                handlers.forEach(function removeHandlers(handlerObj, el) {
                    Object.keys(handlerObj).forEach(function removeHandler(eventType) {
                        el.removeEventListener(eventType, handlerObj[eventType]);
                    });
                });
                handlers.clear();

                injected.forEach(function removeNode(node) {
                    gsap.killTweensOf(node);
                    const child = node.firstElementChild;
                    if (child) gsap.killTweensOf(child);
                    node.remove();
                });
                injected.length = 0;
            };
        });
    });

    // Store context for SPA cleanup
    window.gsapContext = ctx;
});
