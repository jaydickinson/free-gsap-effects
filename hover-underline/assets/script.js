/**
 * Hover Underline
 *
 * Four material underline treatments for semantic links: an exit-through
 * line, a marker sweep, a hand-drawn SVG wave, and a travelling wave that
 * keeps moving for as long as the link is held. GSAP core only.
 */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initHoverUnderline() {
    if (typeof gsap === 'undefined') return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const WAVE_PATH = 'M1 6 C 9 1, 16 8, 25 4 S 41 7, 51 3 S 68 8, 78 4 S 91 2, 99 5';

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const links = Array.from(document.querySelectorAll('a[data-underline]'));
            const originalColors = new Map();

            links.forEach(function applyLinkColor(link) {
                originalColors.set(link, link.style.getPropertyValue('--hu-color'));
                if (link.dataset.underlineColor) {
                    link.style.setProperty('--hu-color', link.dataset.underlineColor);
                }
            });

            // CSS keeps every link visibly underlined when motion is reduced.
            if (!context.conditions.isMotion) {
                return function reducedCleanup() {
                    originalColors.forEach(function restoreColor(value, link) {
                        if (value) link.style.setProperty('--hu-color', value);
                        else link.style.removeProperty('--hu-color');
                    });
                };
            }

            const handlers = new Map();
            const pairs = new Map();
            const injected = [];
            const touchTimers = new Map();
            const stageCurrent = new Map();
            const stageIndexText = new Map();
            const stages = new Set();

            function registerNode(node) {
                node.setAttribute('aria-hidden', 'true');
                injected.push(node);
                return node;
            }

            function buildSlide(link) {
                const shell = registerNode(document.createElement('span'));
                shell.className = 'hu-line';

                const track = document.createElement('span');
                track.className = 'hu-line__track';
                shell.appendChild(track);
                link.appendChild(shell);

                gsap.set(track, { xPercent: -105 });

                return {
                    targets: [track],
                    enter: function slideEnter() {
                        gsap.killTweensOf(track);
                        gsap.fromTo(track, { xPercent: -105 }, {
                            xPercent: 0,
                            duration: 0.48,
                            ease: 'power4.out'
                        });
                    },
                    leave: function slideLeave() {
                        gsap.killTweensOf(track);
                        gsap.to(track, {
                            xPercent: 105,
                            duration: 0.34,
                            ease: 'power3.in'
                        });
                    }
                };
            }

            function buildFill(link) {
                const fill = registerNode(document.createElement('span'));
                fill.className = 'hu-fill';
                link.appendChild(fill);

                gsap.set(fill, { scaleX: 0, rotation: -1.5, transformOrigin: 'left center' });

                return {
                    targets: [fill],
                    enter: function fillEnter() {
                        gsap.killTweensOf(fill);
                        gsap.set(fill, { transformOrigin: 'left center' });
                        gsap.fromTo(fill, { scaleX: 0, rotation: -1.5 }, {
                            scaleX: 1,
                            rotation: 0.5,
                            duration: 0.42,
                            ease: 'power3.out'
                        });
                    },
                    leave: function fillLeave() {
                        gsap.killTweensOf(fill);
                        gsap.set(fill, { transformOrigin: 'right center' });
                        gsap.to(fill, {
                            scaleX: 0,
                            rotation: 1.5,
                            duration: 0.3,
                            ease: 'power2.inOut'
                        });
                    }
                };
            }

            function buildWave(link) {
                const svg = registerNode(document.createElementNS(SVG_NS, 'svg'));
                svg.setAttribute('class', 'hu-wave');
                svg.setAttribute('viewBox', '0 0 100 10');
                svg.setAttribute('preserveAspectRatio', 'none');

                const path = document.createElementNS(SVG_NS, 'path');
                path.setAttribute('d', WAVE_PATH);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', 'currentColor');
                path.setAttribute('stroke-width', '2.4');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                svg.appendChild(path);
                link.appendChild(svg);

                // Whole units, with two to spare. Browsers round the dash offset
                // they store, and an offset that rounds past the dash length
                // wraps the pattern round and leaves a stub of stroke showing
                // while the link is at rest.
                const length = Math.ceil(path.getTotalLength()) + 2;
                gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

                return {
                    targets: [path, svg],
                    enter: function waveEnter() {
                        gsap.killTweensOf([path, svg]);
                        gsap.fromTo(path, { strokeDashoffset: length }, {
                            strokeDashoffset: 0,
                            duration: 0.56,
                            ease: 'power2.out'
                        });
                        gsap.fromTo(svg, { y: 3, scaleY: 1.7 }, {
                            y: 0,
                            scaleY: 1,
                            duration: 0.72,
                            ease: 'elastic.out(1, 0.38)',
                            transformOrigin: 'center center'
                        });
                    },
                    leave: function waveLeave() {
                        gsap.killTweensOf([path, svg]);
                        gsap.to(path, {
                            strokeDashoffset: -length,
                            duration: 0.38,
                            ease: 'power2.in'
                        });
                        gsap.to(svg, { y: 0, scaleY: 1, duration: 0.2 });
                    }
                };
            }

            /* The travelling wave. Delete this block if you only want the
               three treatments that draw once and settle.

               The trick is that the path is drawn two wavelengths wider than
               the link and the rail clips it, so sliding the whole SVG by
               exactly one wavelength loops with no visible seam. */
            function buildTravel(link) {
                const rail = registerNode(document.createElement('span'));
                rail.className = 'hu-travel';

                const svg = document.createElementNS(SVG_NS, 'svg');
                const path = document.createElementNS(SVG_NS, 'path');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', 'currentColor');
                path.setAttribute('stroke-linecap', 'round');
                svg.appendChild(path);
                rail.appendChild(svg);
                link.appendChild(rail);

                let length = 0;
                let waveLength = 0;
                let travelTween = null;

                // Measured rather than fixed, so the wave keeps its proportions
                // whatever size the link's type ends up at.
                function build() {
                    const size = parseFloat(getComputedStyle(link).fontSize) || 16;
                    const width = link.getBoundingClientRect().width;
                    const height = Math.max(9, size * 0.15);

                    // Long enough that the wave reads as a wave rather than a
                    // zigzag, and short enough that the slide is obvious.
                    waveLength = Math.max(14, size * 0.45);
                    // Above about 0.9 the crests clip against the rail.
                    const amplitude = height * 0.85;
                    const baseline = height / 2;
                    const total = width + waveLength * 2;
                    const waves = Math.ceil(total / waveLength);

                    let d = 'M 0 ' + baseline + ' q ' + (waveLength / 4) + ' ' + (-amplitude) + ' ' + (waveLength / 2) + ' 0';
                    for (let i = 1; i < waves * 2; i++) d += ' t ' + (waveLength / 2) + ' 0';

                    path.setAttribute('d', d);
                    path.setAttribute('stroke-width', String(Math.max(2, size * 0.042)));
                    svg.setAttribute('width', String(total));
                    svg.setAttribute('height', String(height));

                    // Whole units with two to spare: browsers round the stored
                    // offset, and one that rounds past the dash length wraps the
                    // pattern round and leaves a stub of stroke showing at rest.
                    length = Math.ceil(path.getTotalLength()) + 2;
                    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
                }

                build();

                return {
                    targets: [path, svg],
                    enter: function travelEnter() {
                        gsap.killTweensOf([path, svg]);
                        if (travelTween) travelTween.kill();
                        // Re-measured here so a resize since the last hover cannot
                        // leave the wave short of the end of the word.
                        build();
                        gsap.fromTo(path, { strokeDashoffset: length }, {
                            strokeDashoffset: 0,
                            duration: 0.42,
                            ease: 'power2.out'
                        });
                        travelTween = gsap.fromTo(svg, { x: 0 }, {
                            x: -waveLength,
                            duration: 1.1,
                            ease: 'none',
                            repeat: -1
                        });
                    },
                    leave: function travelLeave() {
                        gsap.killTweensOf(path);
                        gsap.to(path, {
                            strokeDashoffset: -length,
                            duration: 0.34,
                            ease: 'power2.in',
                            // The loop is only stopped once the stroke has drawn
                            // itself out. Killing it while it is still visible
                            // freezes the wave mid-slide.
                            onComplete: function stopTravel() {
                                if (travelTween) travelTween.kill();
                                travelTween = null;
                                gsap.set(svg, { x: 0 });
                                gsap.set(path, { strokeDashoffset: length });
                            }
                        });
                    }
                };
            }

            function updateIndex(stage, link) {
                if (!stage || !stage.isConnected) return;
                const display = stage.querySelector('[data-active-index]');
                const stageLinks = Array.from(stage.querySelectorAll('a[data-underline]'));
                const number = link ? String(stageLinks.indexOf(link) + 1).padStart(2, '0') : '00';
                const color = link ? getComputedStyle(link).getPropertyValue('--hu-color').trim() : '';

                stage.classList.toggle('is-active', Boolean(link));
                if (color) stage.style.setProperty('--active-color', color);
                else stage.style.removeProperty('--active-color');

                if (display && display.textContent !== number) {
                    display.textContent = number;
                    gsap.killTweensOf(display);
                    gsap.fromTo(display, { yPercent: link ? 70 : -35, opacity: 0 }, {
                        yPercent: 0,
                        opacity: 1,
                        duration: 0.34,
                        ease: 'power3.out'
                    });
                }
            }

            function enterLink(link) {
                if (!link.isConnected) return;
                const pair = pairs.get(link);
                const stage = link.closest('[data-underline-stage]');
                const previous = stage && stageCurrent.get(stage);

                if (previous && previous !== link) {
                    const previousPair = pairs.get(previous);
                    if (previousPair) previousPair.leave();
                    gsap.to(previous, {
                        x: 0,
                        color: previous.dataset.huRestColor,
                        duration: 0.28,
                        ease: 'power2.out',
                        overwrite: true
                    });
                }

                if (stage) stageCurrent.set(stage, link);
                pair.enter();
                gsap.to(link, {
                    x: 10,
                    color: getComputedStyle(link).getPropertyValue('--hu-color').trim(),
                    duration: 0.36,
                    ease: 'power3.out',
                    overwrite: true
                });
                updateIndex(stage, link);
            }

            function leaveLink(link) {
                if (!link.isConnected) return;
                const pair = pairs.get(link);
                const stage = link.closest('[data-underline-stage]');

                pair.leave();
                gsap.to(link, {
                    x: 0,
                    color: link.dataset.huRestColor,
                    duration: 0.34,
                    ease: 'power3.out',
                    overwrite: true
                });

                if (stage && stageCurrent.get(stage) === link) {
                    stageCurrent.delete(stage);
                    updateIndex(stage, null);
                }
            }

            links.forEach(function initLink(link) {
                const variant = link.dataset.underline || 'slide';
                const stage = link.closest('[data-underline-stage]');
                const restColor = getComputedStyle(link).color;
                let pair;

                link.dataset.huRestColor = restColor;
                link.classList.add('hu-link', 'hu-ready');
                if (stage) {
                    stages.add(stage);
                    const display = stage.querySelector('[data-active-index]');
                    if (display && !stageIndexText.has(display)) {
                        stageIndexText.set(display, display.textContent);
                    }
                }

                if (variant === 'fill') pair = buildFill(link);
                else if (variant === 'wave') pair = buildWave(link);
                else if (variant === 'travel') pair = buildTravel(link);
                else pair = buildSlide(link);
                pairs.set(link, pair);

                const enter = function enter() { enterLink(link); };
                const leave = function leave() { leaveLink(link); };
                const pointerDown = function pointerDown(event) {
                    if (event.pointerType === 'mouse') return;
                    window.clearTimeout(touchTimers.get(link));
                    enterLink(link);
                    touchTimers.set(link, window.setTimeout(function touchSettle() {
                        if (document.activeElement !== link) leaveLink(link);
                    }, 850));
                };

                link.addEventListener('mouseenter', enter);
                link.addEventListener('mouseleave', leave);
                link.addEventListener('focus', enter);
                link.addEventListener('blur', leave);
                link.addEventListener('pointerdown', pointerDown);

                handlers.set(link, {
                    mouseenter: enter,
                    mouseleave: leave,
                    focus: enter,
                    blur: leave,
                    pointerdown: pointerDown
                });
            });

            stages.forEach(function initialiseStage(stage) {
                updateIndex(stage, null);
            });

            return function cleanup() {
                handlers.forEach(function removeHandlers(handlerObject, link) {
                    Object.keys(handlerObject).forEach(function removeHandler(type) {
                        link.removeEventListener(type, handlerObject[type]);
                    });
                });
                touchTimers.forEach(window.clearTimeout);

                pairs.forEach(function killPair(pair) {
                    gsap.killTweensOf(pair.targets);
                });
                links.forEach(function restoreLink(link) {
                    gsap.killTweensOf(link);
                    link.classList.remove('hu-link', 'hu-ready');
                    delete link.dataset.huRestColor;
                    const value = originalColors.get(link);
                    if (value) link.style.setProperty('--hu-color', value);
                    else link.style.removeProperty('--hu-color');
                });
                injected.forEach(function removeNode(node) { node.remove(); });
                stages.forEach(function restoreStage(stage) {
                    stage.classList.remove('is-active');
                    stage.style.removeProperty('--active-color');
                });
                stageIndexText.forEach(function restoreIndex(value, display) {
                    display.textContent = value;
                });

                handlers.clear();
                pairs.clear();
                touchTimers.clear();
                stageCurrent.clear();
                stageIndexText.clear();
                injected.length = 0;
            };
        });
    });

    window.gsapContext = ctx;
});
