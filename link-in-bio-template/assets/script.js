/**
 * Link in Bio: the print pile
 *
 * The three latest links are photo prints in a small pile on the first
 * screen. Flick or drag the top print away and it tucks under the pile,
 * revealing the next; a tap or click opens it. The arrow keys do the same
 * on a focused print, and the full list right below (#links) carries every
 * link for anyone who never flicks.
 *
 * Every part is guarded: delete the pile, the kiln block or the form from
 * index.html and the rest keeps working.
 *
 * @plugins Draggable, InertiaPlugin (optional, velocity tracking), ScrollTrigger
 */

/* Helpers and settings are declared before first use: the demo build
   obfuscates this file and does not keep function hoisting. */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initTemplate() {
    var root = document.documentElement;

    /* No GSAP (blocked CDN): take the head script's gate off and leave the
       page as a plain document: the top print, the full list, everything
       visible. */
    if (typeof gsap === 'undefined') {
        root.classList.remove('has-js');
        return;
    }
    root.classList.add('js-ready');

    var HAS_DRAG = typeof Draggable !== 'undefined';
    var HAS_INERTIA = typeof InertiaPlugin !== 'undefined';
    var HAS_ST = typeof ScrollTrigger !== 'undefined';
    if (HAS_DRAG) gsap.registerPlugin(Draggable);
    if (HAS_INERTIA) gsap.registerPlugin(InertiaPlugin);
    if (HAS_ST) gsap.registerPlugin(ScrollTrigger);

    /* ----------------------------------------------------------------------
       SETTINGS
       ---------------------------------------------------------------------- */
    var SEED = 7;                 // change to re-deal every tilt and wobble
    var TAP_PX = 6;               // under this much movement a press is a tap
    var THROW_PX = 90;            // drag further than this and the print goes
    var THROW_SPEED = 600;        // ...or release faster than this (px/s)

    /* Seeded, not random: the pile and the wordmark compose the same way on
       every load, so the page can be judged (and screenshotted) as a design. */
    function rand(i, salt) {
        var x = Math.sin((i + 1) * 12.9898 + salt * 78.233 + SEED) * 43758.5453;
        return x - Math.floor(x);
    }
    function between(i, salt, min, max) { return min + rand(i, salt) * (max - min); }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    var desktopMQ = window.matchMedia('(min-width: 64em)');
    var hero = document.querySelector('[data-hero]');
    var pileEl = document.querySelector('[data-pile]');
    var stack = pileEl ? pileEl.querySelector('[data-pile-stack]') : null;
    var prints = stack ? Array.prototype.slice.call(stack.querySelectorAll('[data-print]')) : [];

    /* ----------------------------------------------------------------------
       WORDMARK: split each word into letters on a seeded, hand-thrown
       wobble, then fit the words to the column once the font has loaded.
       ---------------------------------------------------------------------- */
    var words = Array.prototype.slice.call(document.querySelectorAll('[data-wordmark]'));
    var letters = [];
    words.forEach(function (word) {
        var text = word.textContent.trim();
        word.setAttribute('data-text', text);
        word.textContent = '';
        Array.from(text).forEach(function (ch) {
            var span = document.createElement('span');
            span.className = 'mark__letter';
            span.textContent = ch === ' ' ? ' ' : ch;
            word.appendChild(span);
            letters.push(span);
        });
    });
    var letterBase = letters.map(function (l, i) {
        return { yPercent: between(i, 1, -7, 7), rotation: between(i, 2, -5, 5) };
    });

    function fitWordmark() {
        if (!hero || !words.length) return;
        var cs = getComputedStyle(hero);
        var inner = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        var current = parseFloat(getComputedStyle(words[0]).fontSize) || 100;
        var widths = words.map(function (w) { return w.offsetWidth || 1; });
        var size;
        if (desktopMQ.matches) {
            /* Desktop: one line across the full width, held to about a
               quarter of the window height so the hero fits one screen. */
            var gapEm = parseFloat(getComputedStyle(words[0].parentNode).columnGap) / current || 0.22;
            var line = widths.reduce(function (a, b) { return a + b; }, 0) + gapEm * current * (words.length - 1);
            size = Math.min(inner / line * current, window.innerHeight * 0.24);
        } else {
            /* Phones: each word fills the column, capped by the window
               height so the first rows of the list stay on screen. */
            size = Math.min.apply(null, widths.map(function (w) { return inner / w; })) * current;
            size = Math.min(size, window.innerHeight * 0.105, 176);
        }
        root.style.setProperty('--mark-size', (size * 0.97).toFixed(1) + 'px');
    }

    /* ----------------------------------------------------------------------
       PILE POSES: depth 0 is the top print. Deeper prints fan out a little
       further each, alternating sides, so the stack reads as a real pile.
       ---------------------------------------------------------------------- */
    function pose(depth) {
        if (depth === 0) return { x: 0, y: 0, rotation: between(0, 5, -1.5, 1.5) };
        var side = depth % 2 ? 1 : -1;
        return {
            x: side * (2 + depth * 1.5) + between(depth, 3, -2, 2),
            y: depth * 2.5 + between(depth, 4, -1, 2),
            rotation: side * (2 + depth * 0.9) + between(depth, 5, -1, 1)
        };
    }
    function zFor(depth) { return 10 + prints.length - depth; }

    var previousContext = window.gsapContext;
    var ctx = gsap.context(function (rootContext) {
        var mm = gsap.matchMedia();
        var pageCleanups = [];

        /* Refit on font load and resize; the pile's size follows CSS. */
        var raf = 0;
        function scheduleFit() {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(function () {
                fitWordmark();
                if (HAS_ST) ScrollTrigger.refresh();
            });
        }
        fitWordmark();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
        window.addEventListener('resize', scheduleFit);
        pageCleanups.push(function () {
            window.removeEventListener('resize', scheduleFit);
            cancelAnimationFrame(raf);
        });

        /* ------------------------------------------------------------------
           KILN COUNTDOWN. data-opens is an ISO date, or "next-saturday"
           (with data-opens-hour) so a demo never shows a past opening.
           ------------------------------------------------------------------ */
        (function initKiln() {
            var kiln = document.querySelector('[data-kiln]');
            if (!kiln) return;
            var dateEl = kiln.querySelector('[data-opens-date]');
            var countEl = kiln.querySelector('[data-countdown]');
            var raw = kiln.getAttribute('data-opens') || '';
            var hour = parseInt(kiln.getAttribute('data-opens-hour') || '10', 10);
            var target;
            if (raw === 'next-saturday') {
                var now = new Date();
                target = new Date(now);
                target.setHours(hour, 0, 0, 0);
                target.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
                if (target <= now) target.setDate(target.getDate() + 7);
            } else {
                target = new Date(raw);
            }
            if (isNaN(target.getTime())) return;

            if (dateEl) {
                dateEl.textContent = target.toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short'
                });
            }
            function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
            function tick() {
                if (!countEl) return;
                var ms = target - new Date();
                if (ms <= 0) { countEl.textContent = 'Open now'; return; }
                var mins = Math.floor(ms / 60000);
                var days = Math.floor(mins / 1440);
                var hours = Math.floor((mins % 1440) / 60);
                var time = target.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                countEl.textContent = days > 0
                    ? 'Opens ' + time + ', in ' + plural(days, 'day') + ' ' + plural(hours, 'hour')
                    : 'Opens ' + time + ', in ' + plural(hours, 'hour') + ' ' + plural(mins % 60, 'minute');
            }
            tick();
            var timer = setInterval(tick, 30000);
            pageCleanups.push(function () { clearInterval(timer); });
        })();

        /* ------------------------------------------------------------------
           KILN DIARY FORM: front end only. Point the form's action at your
           list provider and delete this handler, or post from here.
           ------------------------------------------------------------------ */
        (function initDiary() {
            var form = document.querySelector('[data-diary-form]');
            if (!form) return;
            var done = form.querySelector('[data-diary-done]');
            function onSubmit(e) {
                e.preventDefault();
                if (!form.checkValidity()) { form.reportValidity(); return; }
                if (done) done.textContent = 'You are on the list. The next Kiln Diary lands the week of the firing.';
                form.reset();
            }
            form.addEventListener('submit', onSubmit);
            pageCleanups.push(function () { form.removeEventListener('submit', onSubmit); });
        })();

        /* ------------------------------------------------------------------
           MOTION BRANCHES
           ------------------------------------------------------------------ */
        mm.add({
            motion: '(prefers-reduced-motion: no-preference)',
            reduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            var reduced = context.conditions.reduced;
            var branchCleanups = [];
            /* add(null, fn) wraps without running: tweens the handler makes
               later belong to this branch and revert with it. (add(fn)
               would run the handler immediately.) */
            function on(el, type, fn) {
                var wrapped = context.add(null, fn);
                el.addEventListener(type, wrapped);
                branchCleanups.push(function () { el.removeEventListener(type, wrapped); });
            }

            /* Wordmark at rest on its wobble. */
            if (letters.length) gsap.set(letters, { yPercent: function (i) { return letterBase[i].yPercent; }, rotation: function (i) { return letterBase[i].rotation; } });
            gsap.set(words, { opacity: 1 });

            function ripple(dir) {
                if (reduced || !letters.length) return;
                var list = dir < 0 ? letters.slice().reverse() : letters;
                list.forEach(function (l, k) {
                    var i = letters.indexOf(l);
                    gsap.to(l, {
                        keyframes: [
                            { yPercent: letterBase[i].yPercent - 12, rotation: letterBase[i].rotation + dir * 5, duration: 0.15, ease: 'power2.out' },
                            { yPercent: letterBase[i].yPercent, rotation: letterBase[i].rotation, duration: 0.45, ease: 'back.out(3)' }
                        ],
                        delay: k * 0.022,
                        overwrite: true
                    });
                });
            }

            /* --------------------------------------------------------------
               THE PILE
               -------------------------------------------------------------- */
            (function initPile() {
                if (!pileEl || !prints.length) return;

                var order = prints.slice();
                var busy = null;
                var statusEl = pileEl.querySelector('[data-pile-status]');

                function finishBusy() {
                    if (busy) { var t = busy; busy = null; t.progress(1); }
                }

                /* Only the top print is reachable; the rest are inert until
                   they surface, so Tab never lands on a covered link. */
                function syncAccess(announce) {
                    order.forEach(function (p, d) {
                        if (d === 0) { p.removeAttribute('inert'); p.removeAttribute('aria-hidden'); }
                        else { p.setAttribute('inert', ''); p.setAttribute('aria-hidden', 'true'); }
                    });
                    var top = order[0];
                    if (announce && statusEl) {
                        var title = top.querySelector('.print__title');
                        statusEl.textContent = 'Print ' + (prints.indexOf(top) + 1) + ' of ' + prints.length + ': ' + (title ? title.textContent : '');
                    }
                }

                function settleAll() {
                    order.forEach(function (p, d) {
                        gsap.set(p, Object.assign({ zIndex: zFor(d), opacity: 1, scale: 1 }, pose(d)));
                    });
                }

                function keepFocus(had) {
                    if (!had) return;
                    var link = order[0].querySelector('a');
                    if (link) link.focus({ preventScroll: true });
                }

                /* Top print out to the side, under the pile, back in place. */
                function sendToBack(dir, throwFrom) {
                    finishBusy();
                    var had = stack.contains(document.activeElement);
                    var top = order.shift();
                    order.push(top);
                    syncAccess(true);
                    keepFocus(had);

                    if (reduced) {
                        settleAll();
                        gsap.fromTo(order[0], { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'none' });
                        return;
                    }

                    var n = order.length;
                    var outX = dir * (pileEl.offsetWidth * 0.92 + 20);
                    var fromX = gsap.getProperty(top, 'x');
                    var speed = throwFrom ? Math.max(Math.abs(throwFrom.vx), 1500) : 1500;
                    var outDur = clamp(Math.abs(outX - fromX) / speed, 0.14, 0.32);
                    var tl = gsap.timeline({ onComplete: function () { if (busy === tl) busy = null; } });
                    busy = tl;

                    tl.set(top, { zIndex: 100 }, 0)
                      .to(top, { x: outX, y: -16, rotation: dir * 16, duration: outDur, ease: 'power1.out' }, 0)
                      .set(top, { zIndex: zFor(n - 1) })
                      .to(top, Object.assign({ duration: 0.5, ease: 'power3.inOut' }, pose(n - 1)));
                    order.forEach(function (p, d) {
                        if (p === top) return;
                        tl.set(p, { zIndex: zFor(d) }, 0);
                        tl.to(p, Object.assign({ duration: 0.45, ease: 'power3.out' }, pose(d)), 0.08 + d * 0.03);
                    });
                    ripple(dir);
                }

                /* Bottom print out from behind and back on top. */
                function bringToFront() {
                    finishBusy();
                    var had = stack.contains(document.activeElement);
                    var back = order.pop();
                    order.unshift(back);
                    syncAccess(true);
                    keepFocus(had);

                    if (reduced) {
                        settleAll();
                        gsap.fromTo(back, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'none' });
                        return;
                    }

                    var outX = -(pileEl.offsetWidth * 0.92 + 20);
                    var tl = gsap.timeline({ onComplete: function () { if (busy === tl) busy = null; } });
                    busy = tl;
                    tl.set(back, { zIndex: 1 }, 0)
                      .to(back, { x: outX, y: -16, rotation: -16, duration: 0.3, ease: 'power2.out' }, 0)
                      .set(back, { zIndex: 100 })
                      .to(back, Object.assign({ duration: 0.45, ease: 'power3.out' }, pose(0)))
                      .set(back, { zIndex: zFor(0) });
                    order.forEach(function (p, d) {
                        if (p === back) return;
                        tl.set(p, { zIndex: zFor(d) }, 0);
                        tl.to(p, Object.assign({ duration: 0.45, ease: 'power3.out' }, pose(d)), 0.12 + d * 0.02);
                    });
                    ripple(-1);
                }

                /* Deal-in: the prints land one by one, bottom first. */
                if (reduced) {
                    settleAll();
                } else {
                    var deal = gsap.timeline({ onComplete: function () { if (busy === deal) busy = null; } });
                    busy = deal;
                    for (var d = order.length - 1; d >= 0; d--) {
                        var p = pose(d);
                        gsap.set(order[d], { zIndex: zFor(d) });
                        deal.fromTo(order[d],
                            { x: p.x + between(d, 6, -30, 30), y: p.y - 70, rotation: p.rotation + between(d, 7, -14, 14), scale: 1.08, opacity: 0 },
                            { x: p.x, y: p.y, rotation: p.rotation, scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' },
                            (order.length - 1 - d) * 0.08);
                    }
                    if (letters.length) {
                        deal.fromTo(letters,
                            { yPercent: function (i) { return letterBase[i].yPercent - 60; }, opacity: 0 },
                            { yPercent: function (i) { return letterBase[i].yPercent; }, opacity: 1, duration: 0.6, stagger: 0.035, ease: 'back.out(2)' },
                            0);
                    }
                }
                syncAccess(false);

                on(pileEl, 'keydown', function (e) {
                    if (e.key === 'ArrowRight') { e.preventDefault(); sendToBack(1); }
                    else if (e.key === 'ArrowLeft') { e.preventDefault(); bringToFront(); }
                });

                /* Dragging. Each print gets a Draggable bound to a detached
                   trigger, so it only ever starts from the pointerdown below,
                   once this code has decided the print owns the gesture:
                   a mouse press starts at once; a touch waits until the
                   movement is clearly sideways, and a vertical start is left
                   to the browser (touch-action: pan-y), so the page scrolls. */
                if (reduced || !HAS_DRAG) return;

                prints.forEach(function (print) {
                    var link = print.querySelector('a');
                    var dragged = false;
                    var lastX = 0, lastT = 0, vx = 0;
                    if (HAS_INERTIA) InertiaPlugin.track(print, 'x');

                    var drag = Draggable.create(print, {
                        trigger: document.createElement('div'),
                        type: 'x,y',
                        /* Under 6px is a tap: the link opens, no drag starts. */
                        minimumMovement: TAP_PX,
                        dragClickables: true,
                        onPress: function () {
                            finishBusy();
                            gsap.killTweensOf(print);
                            gsap.set(print, { zIndex: 100 });
                            print.classList.add('is-held');
                            lastX = this.x; lastT = performance.now(); vx = 0;
                        },
                        onDragStart: function () { dragged = true; },
                        onDrag: function () {
                            var now = performance.now();
                            var dt = Math.max(now - lastT, 1);
                            vx = vx * 0.4 + ((this.x - lastX) / dt * 1000) * 0.6;
                            lastX = this.x; lastT = now;
                            gsap.set(print, { rotation: pose(0).rotation + clamp(this.x / 12, -14, 14) });
                        },
                        onRelease: function () {
                            print.classList.remove('is-held');
                            var rest = pose(0);
                            if (!dragged) {
                                gsap.set(print, { zIndex: zFor(0) });
                                return;
                            }
                            var speed = HAS_INERTIA ? InertiaPlugin.getVelocity(print, 'x') : vx;
                            var dx = this.x - rest.x;
                            var dir = dx >= 0 ? 1 : -1;
                            var flung = Math.abs(speed) > THROW_SPEED && (speed > 0) === (dx > 0);
                            if (Math.abs(dx) > THROW_PX || flung) {
                                sendToBack(dir, { vx: speed });
                            } else {
                                gsap.to(print, Object.assign({
                                    duration: 0.55,
                                    ease: 'back.out(1.7)',
                                    onComplete: function () { gsap.set(print, { zIndex: zFor(0) }); }
                                }, rest));
                            }
                        }
                    })[0];

                    /* Nothing is handed to Draggable on press. A press that
                       never travels TAP_PX stays an ordinary click on the
                       link, so it navigates natively. Past that, a mouse or
                       pen picks the print up in any direction; a finger only
                       when the movement is clearly sideways, and a vertical
                       start is left to the browser (touch-action: pan-y). */
                    var watch = null;
                    function stopWatching() {
                        watch = null;
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', stopWatching);
                        window.removeEventListener('pointercancel', stopWatching);
                    }
                    function onDown(e) {
                        if (order[0] !== print) return;
                        if (e.pointerType !== 'touch' && e.button !== 0) return;
                        dragged = false;
                        watch = { id: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
                        window.addEventListener('pointermove', onMove);
                        window.addEventListener('pointerup', stopWatching);
                        window.addEventListener('pointercancel', stopWatching);
                    }
                    function onMove(e) {
                        if (!watch || e.pointerId !== watch.id) return;
                        var dx = Math.abs(e.clientX - watch.x);
                        var dy = Math.abs(e.clientY - watch.y);
                        if (watch.touch) {
                            if (dy > dx && dy > 8) { stopWatching(); return; }   // the page scrolls
                            if (dx > 8 && dx > dy) { stopWatching(); drag.startDrag(e); }
                        } else if (dx > TAP_PX || dy > TAP_PX) {
                            stopWatching();
                            drag.startDrag(e);
                        }
                    }
                    /* A gesture that dragged must not also navigate. */
                    function onClick(e) {
                        if (dragged) { e.preventDefault(); dragged = false; }
                    }

                    print.addEventListener('pointerdown', onDown);
                    if (link) link.addEventListener('click', onClick);

                    branchCleanups.push(function () {
                        print.removeEventListener('pointerdown', onDown);
                        stopWatching();
                        if (link) link.removeEventListener('click', onClick);
                        if (HAS_INERTIA) InertiaPlugin.untrack(print);
                        drag.kill();
                    });
                });

                branchCleanups.push(function () {
                    /* Back to the markup's state: only the first print reachable. */
                    prints.forEach(function (p, i) {
                        if (i === 0) { p.removeAttribute('inert'); p.removeAttribute('aria-hidden'); }
                        else { p.setAttribute('inert', ''); p.setAttribute('aria-hidden', 'true'); }
                    });
                });
            })();

            /* --------------------------------------------------------------
               QUIET REVEALS below the fold
               -------------------------------------------------------------- */
            var reveals = document.querySelectorAll('[data-reveal]');
            if (reduced || !HAS_ST) {
                gsap.set(reveals, { opacity: 1 });
            } else {
                reveals.forEach(function (el) {
                    gsap.fromTo(el, { opacity: 0, y: 24 }, {
                        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
                    });
                });
            }

            return function cleanupBranch() {
                branchCleanups.forEach(function (fn) { fn(); });
                branchCleanups.length = 0;
            };
        });

        return function cleanupPage() {
            pageCleanups.forEach(function (fn) { fn(); });
            root.style.removeProperty('--mark-size');
            words.forEach(function (w) {
                if (w.hasAttribute('data-text')) {
                    w.textContent = w.getAttribute('data-text');
                    w.removeAttribute('data-text');
                }
            });
            if (window.gsapContext === rootContext) {
                root.classList.remove('has-js');
                if (previousContext === undefined) delete window.gsapContext;
                else window.gsapContext = previousContext;
            }
        };
    });
    window.gsapContext = ctx;
});
