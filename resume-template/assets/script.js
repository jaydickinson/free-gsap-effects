/**
 * Nadia Osei, Resume Template
 *
 * A single-page CV that morphs between two layouts. The signature
 * moment is the Web / Resume toggle: Flip records the position of
 * every structural block, one class switch reflows the page into an
 * A4 document, and Flip animates the difference while the type
 * scales down with it. Around it sit a masked name reveal,
 * highlighter sweeps drawn on scroll, expandable roles, and a
 * copy-email control. Sections are independent: the script skips
 * anything it cannot find, so you can delete sections freely.
 *
 * @plugins ScrollTrigger, Flip
 * @techniques flip, layout-morph, text-animation, click-toggle
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
})(function initResume() {

    const root = document.documentElement;

    /* The inline script in <head> added .has-js before first paint, which
       pre-hides everything this file animates in. If a CDN script failed
       to load, take the class back off so the page reads as a complete,
       static document instead of staying hidden. */
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof Flip === 'undefined') {
        root.classList.remove('has-js');
        return;
    }

    /* Tells the head script's 4s failsafe that the gate is in good hands */
    root.classList.add('js-ready');

    gsap.registerPlugin(ScrollTrigger, Flip);

    /* OPTIONAL: Lenis smooth scroll. Delete this helper, its call below and
       the Lenis <script> tag to drop it. Smooth scroll is opt-out with
       data-smooth="off" on <html> or ?smooth=off in the URL, and it only
       runs in the motion branch, so reduced motion never gets it. */
    function initLenis() {
        const wantsSmooth = (new URLSearchParams(location.search).get('smooth')
            || root.dataset.smooth) !== 'off';
        /* An existing window.lenis belongs to a host page: leave it alone */
        if (!wantsSmooth || typeof Lenis === 'undefined' || window.lenis) return null;

        const lenis = new Lenis({ allowNestedScroll: true, anchors: true, autoRaf: false });

        /* Lenis and ScrollTrigger share ONE clock. On its own rAF, Lenis
           would move the page while ScrollTrigger reads the previous frame. */
        const tick = function (time) { lenis.raf(time * 1000); };
        /* A refresh restores the native scroll position while Lenis may
           still be easing toward an older target: resync it. */
        const resync = function () {
            lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        };

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        ScrollTrigger.addEventListener('refresh', resync);
        window.lenis = lenis;

        return function destroyLenis() {
            gsap.ticker.remove(tick);
            gsap.ticker.lagSmoothing(500, 33);
            ScrollTrigger.removeEventListener('refresh', resync);
            lenis.destroy();
            if (window.lenis === lenis) delete window.lenis;
        };
    }

    /* Jump the page (no easing) whether or not Lenis is driving it. Lenis
       caches the page height, so after a layout change it is told to
       re-measure first, or it would clamp the jump to the old height. */
    function jumpTo(y) {
        if (window.lenis) {
            window.lenis.resize();
            window.lenis.scrollTo(y, { immediate: true, force: true });
        } else {
            window.scrollTo(0, y);
        }
    }

    const ctx = gsap.context(function (rootContext) {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            const isMotion = context.conditions.isMotion;
            const removers = [];
            const resets = [];
            const destroySmooth = isMotion ? initLenis() : null;

            /* Every listener goes through here. context.add(null, fn) wraps
               the handler without running it, so tweens it creates later
               still belong to this context and revert() cleans them up. */
            function on(target, type, fn) {
                const listener = context.add(null, fn);
                target.addEventListener(type, listener);
                removers.push(function () { target.removeEventListener(type, listener); });
            }

            /* ============================================
               NAME REVEAL
               Each word rides up out of its own mask.
               ============================================ */
            (function initName() {
                const words = gsap.utils.toArray('[data-word]');
                if (!words.length || !isMotion) return;

                /* fromTo, not from: the start state matches the CSS exactly,
                   so there is nothing to snap and nothing to flash. y is
                   pinned to 0 because GSAP parses the CSS translateY(118%)
                   into a pixel y, which would otherwise survive the tween. */
                gsap.fromTo(words, { yPercent: 118, y: 0 }, {
                    yPercent: 0,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    stagger: 0.08,
                    delay: 0.15
                });
            })();

            /* ============================================
               HIGHLIGHTER SWEEPS
               Each mark is drawn left to right the first time
               it scrolls in, the way someone marks a page.
               ============================================ */
            (function initHighlighters() {
                const marks = gsap.utils.toArray('.hl');
                if (!marks.length) return;

                if (!isMotion) {
                    gsap.set(marks, { backgroundSize: '100% 48%' });
                    return;
                }

                marks.forEach(function (mark) {
                    gsap.to(mark, {
                        backgroundSize: '100% 48%',
                        duration: 0.65,
                        ease: 'power2.out',
                        scrollTrigger: { trigger: mark, start: 'top 90%', once: true }
                    });
                });
            })();

            /* ============================================
               EXPANDABLE ROLES
               Height is animated, then handed back to CSS so
               Resume mode and print can force everything open.
               ============================================ */
            const expanders = gsap.utils.toArray('[data-expand]');

            function panelFor(btn) {
                const id = btn.getAttribute('aria-controls');
                return id ? document.getElementById(id) : null;
            }

            function isOpen(btn) {
                return btn.getAttribute('aria-expanded') === 'true';
            }

            (function initExpanders() {
                if (!expanders.length) return;

                expanders.forEach(function (btn) {
                    const panel = panelFor(btn);
                    if (!panel) return;

                    on(btn, 'click', function () {
                        const open = isOpen(btn);
                        gsap.killTweensOf(panel);
                        const from = panel.offsetHeight;   /* before the CSS state flips */

                        btn.setAttribute('aria-expanded', String(!open));
                        panel.style.height = open ? '' : 'auto';

                        if (!isMotion) {
                            ScrollTrigger.refresh();
                            return;
                        }

                        const to = panel.offsetHeight;

                        gsap.fromTo(panel, { height: from }, {
                            height: to,
                            duration: open ? 0.4 : 0.45,
                            ease: open ? 'power2.inOut' : 'power2.out',
                            onComplete: function () {
                                panel.style.height = open ? '' : 'auto';
                                ScrollTrigger.refresh();
                            }
                        });
                    });
                });

                /* Put each role back as the markup authored it */
                const authored = expanders.map(isOpen);
                resets.push(function () {
                    expanders.forEach(function (btn, i) {
                        const panel = panelFor(btn);
                        btn.setAttribute('aria-expanded', String(authored[i]));
                        if (panel) panel.style.height = '';
                    });
                });
            })();

            /* ============================================
               SIGNATURE: WEB / RESUME MORPH
               1. Flip records every [data-flip-id] block.
               2. One class on <body> swaps the layout tokens
                  in style.css: the web page becomes A4.
               3. Flip animates each block from where it was,
                  while --scale tweens so the type shrinks
                  with the page instead of snapping.
               The block the reader was looking at stays put,
               so switching from deep in the page never
               throws them back to the top.
               ============================================ */
            (function initModes() {
                const group = document.querySelector('[data-modes]');
                if (!group) return;

                const body = document.body;
                const buttons = gsap.utils.toArray('[data-mode]', group);
                const status = document.querySelector('[data-mode-status]');
                const name = document.querySelector('.name');
                const bar = document.querySelector('.bar');
                const desk = document.querySelector('.desk');
                const details = expanders.map(panelFor).filter(Boolean);
                let current = 'web';
                let morph = null;

                /* Inline heights from the expanders would beat the document
                   tokens, so clear them for Resume mode and restore each
                   open panel's height on the way back. */
                function syncDetailHeights(mode) {
                    expanders.forEach(function (btn) {
                        const panel = panelFor(btn);
                        if (!panel) return;
                        gsap.killTweensOf(panel);
                        panel.style.height = mode === 'paper' || !isOpen(btn) ? '' : 'auto';
                    });
                }

                /* The first row still on screen below the bar, from the
                   main column, where the reader's eye is. Rows, not whole
                   sections: a section's top can be a screen away. */
                function findAnchor() {
                    const top = bar ? bar.getBoundingClientRect().bottom : 0;
                    const candidates = gsap.utils.toArray('.head-main, .col .entry, .col .work, .sheet-foot');
                    for (let i = 0; i < candidates.length; i++) {
                        const box = candidates[i].getBoundingClientRect();
                        if (box.height && box.bottom > top + 24) return candidates[i];
                    }
                    return null;
                }

                function readScale() {
                    return parseFloat(getComputedStyle(body).getPropertyValue('--scale')) || 1;
                }

                function setMode(next) {
                    if (next === current) return;

                    /* A second click mid-morph finishes the first one, so
                       the new state is always measured from a settled page */
                    if (morph) morph.progress(1);

                    const targets = gsap.utils.toArray('[data-flip-id]');
                    const deskFrom = desk ? desk.offsetHeight : 0;
                    const anchor = window.scrollY > 0 ? findAnchor() : null;
                    const anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;
                    const state = isMotion ? Flip.getState(targets) : null;
                    const fromScale = readScale();
                    const fromName = name ? parseFloat(getComputedStyle(name).fontSize) : 0;
                    const closed = details.filter(function (panel) { return !panel.offsetHeight; });

                    syncDetailHeights(next);
                    body.classList.toggle('mode-paper', next === 'paper');

                    buttons.forEach(function (btn) {
                        btn.setAttribute('aria-pressed', String(btn.dataset.mode === next));
                    });
                    current = next;

                    if (status) {
                        status.textContent = next === 'paper'
                            ? 'Resume layout: one A4 page, as it prints.'
                            : 'Web layout.';
                    }

                    /* Hold the anchor block at the same height on screen */
                    if (anchor) {
                        jumpTo(window.scrollY + anchor.getBoundingClientRect().top - anchorTop);
                    }

                    if (!state) {
                        ScrollTrigger.refresh();
                        return;
                    }

                    const toScale = readScale();
                    const toName = name ? parseFloat(getComputedStyle(name).fontSize) : 0;
                    const duration = 0.8;
                    const ease = 'power3.inOut';

                    /* Flip lifts every block out of flow while it moves, which
                       would collapse the page under the reader. Hold the desk
                       at the taller of its two heights until the morph ends. */
                    if (desk) desk.style.minHeight = Math.max(deskFrom, desk.offsetHeight) + 'px';

                    body.classList.add('is-morphing');
                    morph = gsap.timeline({
                        onComplete: function () {
                            body.classList.remove('is-morphing');
                            if (desk) desk.style.minHeight = '';
                            body.style.removeProperty('--scale');
                            if (name) name.style.fontSize = '';
                            morph = null;
                            ScrollTrigger.refresh();
                        }
                    });

                    /* Flip.from measures the new layout the moment it is
                       called, so it goes first, before the type tweens
                       below put the old sizes back for the first frame. */
                    morph.add(Flip.from(state, {
                        duration: duration,
                        ease: ease,
                        absolute: true,
                        nested: true,
                        prune: true,
                        /* Blocks that only exist in one mode, such as the
                           at-a-glance list, fade rather than pop. */
                        onEnter: function (els) {
                            return gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.35, delay: duration * 0.55 });
                        },
                        onLeave: function (els) {
                            return gsap.to(els, { opacity: 0, duration: 0.2 });
                        }
                    }), 0);

                    /* The type settles a little ahead of the boxes, so it
                       is close to its final size while they are still
                       travelling and has room to reflow cleanly. */
                    const typeTime = duration * 0.8;
                    const typeEase = 'power2.inOut';
                    morph.fromTo(body, { '--scale': fromScale }, { '--scale': toScale, duration: typeTime, ease: typeEase }, 0);
                    if (name) {
                        morph.fromTo(name, { fontSize: fromName }, { fontSize: toName, duration: typeTime, ease: typeEase }, 0);
                    }

                    /* Screen-only details inside a moving block (the
                       availability line) return after the block has
                       settled, rather than popping in at full strength. */
                    const fades = gsap.utils.toArray('[data-mode-fade]');
                    if (next === 'web' && fades.length) {
                        morph.fromTo(fades, { opacity: 0 }, {
                            opacity: 1,
                            duration: 0.35,
                            clearProps: 'opacity'
                        }, duration * 0.6);
                    }

                    /* Role details a reader never opened arrive with the
                       document: hidden while their rows move, then in. */
                    if (next === 'paper' && closed.length) {
                        morph.fromTo(closed, { opacity: 0 }, {
                            opacity: 1,
                            duration: 0.35,
                            ease: 'power1.out',
                            clearProps: 'opacity'
                        }, duration * 0.62);
                    }
                }

                buttons.forEach(function (btn) {
                    on(btn, 'click', function () { setMode(btn.dataset.mode); });
                });

                resets.push(function () {
                    if (morph) morph.progress(1);
                    if (desk) desk.style.minHeight = '';
                    body.classList.remove('mode-paper', 'is-morphing');
                    buttons.forEach(function (btn) {
                        btn.setAttribute('aria-pressed', String(btn.dataset.mode === 'web'));
                    });
                });
            })();

            /* ============================================
               COPY EMAIL
               Confirms in place, then returns to its label.
               ============================================ */
            (function initCopy() {
                gsap.utils.toArray('[data-copy]').forEach(function (btn) {
                    const label = btn.querySelector('[data-copy-label]');
                    if (!label) return;
                    const original = label.textContent;
                    let restore = null;

                    on(btn, 'click', function () {
                        const value = btn.dataset.copy;

                        function confirm(text) {
                            if (restore) restore.kill();
                            label.textContent = text;
                            if (isMotion) {
                                gsap.fromTo(label, { opacity: 0.3 }, { opacity: 1, duration: 0.3 });
                            }
                            restore = gsap.delayedCall(1.8, function () {
                                label.textContent = original;
                            });
                        }

                        /* No clipboard (an insecure origin, a refused
                           permission): show the address so it can be read */
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(value).then(
                                function () { confirm('Copied'); },
                                function () { confirm(value); }
                            );
                        } else {
                            confirm(value);
                        }
                    });

                    resets.push(function () { label.textContent = original; });
                });
            })();

            /* ============================================
               PRINT
               The print stylesheet always emits the A4 CV,
               so this works from either mode.
               ============================================ */
            (function initPrint() {
                gsap.utils.toArray('[data-print]').forEach(function (btn) {
                    on(btn, 'click', function () { window.print(); });
                });
            })();

            /* ============================================
               CLEANUP
               revert() undoes this context's tweens and its
               ScrollTriggers; this removes what it cannot see.
               ============================================ */
            return function cleanup() {
                removers.forEach(function (remove) { remove(); });
                removers.length = 0;
                resets.forEach(function (reset) { reset(); });
                resets.length = 0;
                if (destroySmooth) destroySmooth();
            };
        });

        const handleUnload = function () { rootContext.revert(); };
        window.addEventListener('beforeunload', handleUnload);

        return function cleanupPage() {
            window.removeEventListener('beforeunload', handleUnload);
        };
    });

    /* Exposed so a host page or SPA router can tear the page down:
       window.gsapContext.revert() */
    window.gsapContext = ctx;
});
