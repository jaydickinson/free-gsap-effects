/* ============================================
   BRENNA RIVERS TRUST - CHARITY CAMPAIGN TEMPLATE

   One script, one gsap.context. Every section initialises
   independently and every querySelector is guarded, so you
   can delete any section of index.html and the rest keeps
   working.

   Signature: the before/after restoration comparator. Two
   photographs of the same kind of river sit stacked in one
   frame; a draggable gauge board clips the "before" pane so
   you wipe between the degraded and the restored reach.
   It is driven from raw pointer coordinates (never GSAP's
   cached pointer, which reads 0 when a browser reclaims a
   touch gesture for scrolling), commits nothing on a touch
   press, and only scrubs once a touch gesture is clearly
   horizontal - so a vertical swipe on the board scrolls the
   page instead of yanking the divider.

   THE NUMBERS A BUYER EDITS are all in index.html: the
   appeal figures, the stats, the tier prices and the work
   party dates are plain markup. The only numeric config
   here is TIER_MATH below, which turns a donation amount
   into a concrete outcome line on the form.
   ============================================ */

/* What a pound buys, for the live outcome line under the amount
   picker. Each band: the minimum amount it applies from, the unit
   cost, and a function that words the outcome. Edit the costs and
   wording to match your own charity's arithmetic. */
var TIER_MATH = [
    {
        from: 60,
        per: 60,
        text: function (n) {
            return n === 1
                ? 'buys a tonne of washed gravel for a spawning riffle.'
                : 'buys ' + n + ' tonnes of washed gravel for spawning riffles.';
        }
    },
    {
        from: 25,
        per: 6.25,
        text: function (n) {
            return 'fences and plants ' + n + ' metres of bank.';
        }
    },
    {
        from: 1,
        per: 0.4,
        text: function (n) {
            return 'rears and releases ' + n + ' trout fry below the weir.';
        }
    }
];

if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
    if (typeof Draggable !== 'undefined') gsap.registerPlugin(Draggable);
    if (typeof InertiaPlugin !== 'undefined') gsap.registerPlugin(InertiaPlugin);
    /* Reveal targets are only pre-hidden once GSAP is known to be
       here, so a blocked CDN leaves a readable page, not a blank one. */
    document.documentElement.classList.add('has-js');
}

/* Runs the init straight away if the DOM is already parsed (a script
   executed late or deferred), and waits for DOMContentLoaded otherwise. */
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initBrenna() {
    if (typeof gsap === 'undefined') return;

    /* Lenis and ScrollTrigger must share one clock: Lenis is driven
       from gsap's ticker and pushes every scroll into ScrollTrigger,
       otherwise scrubbed and triggered animations read a scroll
       position a frame behind the one on screen. */
    var lenis = null;
    var lenisTick = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ autoRaf: false });
        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
        }
        lenisTick = function (time) { lenis.raf(time * 1000); };
        gsap.ticker.add(lenisTick);
        gsap.ticker.lagSmoothing(0);
    }

    /* Handlers live in Maps keyed by element so cleanup can remove
       exactly what was added. */
    var clickHandlers = new Map();
    var keyHandlers = new Map();
    var inputHandlers = new Map();
    var submitHandlers = new Map();

    function on(el, type, fn, map) {
        if (!el) return;
        el.addEventListener(type, fn);
        var list = map.get(el) || [];
        list.push({ type: type, fn: fn });
        map.set(el, list);
    }

    function offAll(map) {
        map.forEach(function (list, el) {
            list.forEach(function (h) { el.removeEventListener(h.type, h.fn); });
        });
        map.clear();
    }

    /* Thousands separator for the count-ups: 41380 -> "41,380". */
    function fmt(value, decimals) {
        var fixed = value.toFixed(decimals);
        var parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    /* Display-scale variant. B612 Mono gives , and . a full character cell,
       which reads as a stray space at headline size ("£41, 380"), so the
       separators are wrapped and the CSS pulls the next digit back in. */
    function fmtDisplay(value, decimals) {
        return fmt(value, decimals).replace(/[,.]/g, '<span class="fig-sep">$&</span>');
    }

    var comparator = null;

    var ctx = gsap.context(function () {

        /* ==================================================
           THE COMPARATOR
           A control, not decoration: it initialises whatever
           the motion preference is. Only its intro sweep is
           gated behind reduced motion, below.
           ================================================== */
        comparator = (function initComparator() {
            var comp = document.querySelector('[data-comparator]');
            if (!comp) return null;
            var handle = comp.querySelector('[data-comp-handle]');
            var before = comp.querySelector('.comp-pane--before');
            if (!handle || !before) return null;

            comp.classList.add('comp--ready');

            var MIN = 0;
            var MAX = 100;
            var start = parseFloat(comp.getAttribute('data-comp-start'));
            if (!isFinite(start)) start = 46;
            start = Math.max(MIN, Math.min(MAX, start));

            /* One number is the whole state: the divider position as a
               percentage from the left. Everything renders from it. */
            var state = { p: start };

            function render() {
                var p = state.p;
                before.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
                handle.style.left = p + '%';
                handle.setAttribute('aria-valuenow', String(Math.round(p)));
                handle.setAttribute('aria-valuetext',
                    Math.round(100 - p) + '% of the restored river shown');
            }

            function setP(value, animate) {
                value = Math.max(MIN, Math.min(MAX, value));
                gsap.killTweensOf(state);
                if (animate) {
                    gsap.to(state, { p: value, duration: 0.4, ease: 'power2.out', onUpdate: render });
                } else {
                    state.p = value;
                    render();
                }
            }

            function pFromClientX(x) {
                var rect = comp.getBoundingClientRect();
                if (!rect.width) return state.p;
                return ((x - rect.left) / rect.width) * 100;
            }

            /* Coordinates come from the raw event, null-safe. When the
               browser reclaims a touch gesture for scrolling, Draggable's
               cached pointer reads 0 - mapping that to the track would
               slam the divider to the far left mid-scroll. */
            function pointFrom(event) {
                if (!event) return null;
                if (typeof event.clientX === 'number') {
                    return { x: event.clientX, y: event.clientY };
                }
                var t = (event.touches && event.touches[0]) ||
                        (event.changedTouches && event.changedTouches[0]);
                if (t && typeof t.clientX === 'number') {
                    return { x: t.clientX, y: t.clientY };
                }
                return null;
            }

            var drag = null;
            var gesture = { active: false, locked: false, touch: false, sx: 0, sy: 0, off: 0 };
            var hasInertia = typeof InertiaPlugin !== 'undefined';
            if (hasInertia) InertiaPlugin.track(state, 'p');

            if (typeof Draggable !== 'undefined') {
                /* The Draggable rides a detached proxy: the divider is
                   positioned in percent and the pane clipped to match, so
                   nothing wants Draggable's own transform. The proxy just
                   gives us its gesture handling. */
                var proxy = document.createElement('div');

                drag = Draggable.create(proxy, {
                    trigger: comp,
                    type: 'x',
                    /* Leaves vertical touch scrolling to the browser, so a
                       finger on the frame can still flick the page. */
                    allowNativeTouchScrolling: true,
                    onPress: function (event) {
                        var pt = pointFrom(event);
                        gesture.active = !!pt;
                        gesture.locked = false;
                        gesture.touch = !!event && (event.pointerType === 'touch' ||
                            (typeof event.type === 'string' && event.type.indexOf('touch') === 0));
                        gesture.off = 0;
                        if (!pt) return;
                        gesture.sx = pt.x;
                        gesture.sy = pt.y;

                        var onHandle = event.target && handle.contains(event.target);
                        if (onHandle) {
                            /* Grabbing the board should not nudge it: keep the
                               offset between pointer and divider for the drag. */
                            gesture.off = pFromClientX(pt.x) - state.p;
                        }
                        /* A mouse or pen press commits immediately (click the
                           frame, the divider goes there). A touch press commits
                           NOTHING: this might be the start of a page scroll. */
                        if (!gesture.touch) {
                            if (!onHandle) setP(pFromClientX(pt.x), true);
                            handle.setAttribute('data-dragging', '');
                        }
                    },
                    onDrag: function (event) {
                        if (!gesture.active) return;
                        var pt = pointFrom(event);
                        if (!pt) return;
                        if (gesture.touch && !gesture.locked) {
                            var dx = Math.abs(pt.x - gesture.sx);
                            var dy = Math.abs(pt.y - gesture.sy);
                            /* Undecided or vertical: commit nothing. Vertical
                               gestures are the page's to scroll. */
                            if (dy > dx && dy > 8) {
                                gesture.active = false;
                                this.endDrag(event);
                                return;
                            }
                            if (dx < 6 || dx <= dy) return;
                            gesture.locked = true;
                            handle.setAttribute('data-dragging', '');
                        }
                        setP(pFromClientX(pt.x) - gesture.off, false);
                    },
                    onRelease: function () {
                        var wasScrubbing = gesture.active && (gesture.locked || !gesture.touch);
                        gesture.active = false;
                        gesture.locked = false;
                        handle.removeAttribute('data-dragging');
                        /* With InertiaPlugin on the page the board glides to a
                           stop; without it, it simply stays put. */
                        if (wasScrubbing && hasInertia) {
                            gsap.to(state, {
                                inertia: { p: { min: MIN, max: MAX } },
                                duration: { max: 0.7 },
                                onUpdate: render
                            });
                        }
                    }
                })[0];
            }

            /* A Draggable is invisible to a keyboard; role="slider"
               promises the arrow keys work. */
            on(handle, 'keydown', function (event) {
                var handled = true;
                switch (event.key) {
                    case 'ArrowLeft':
                    case 'ArrowDown':  setP(state.p - 4, false); break;
                    case 'ArrowRight':
                    case 'ArrowUp':    setP(state.p + 4, false); break;
                    case 'PageDown':   setP(state.p - 20, false); break;
                    case 'PageUp':     setP(state.p + 20, false); break;
                    case 'Home':       setP(MIN, false); break;
                    case 'End':        setP(MAX, false); break;
                    default: handled = false;
                }
                if (handled) event.preventDefault();
            }, keyHandlers);

            render();

            return {
                comp: comp,
                state: state,
                start: start,
                render: render,
                setP: setP,
                kill: function () { if (drag) drag.kill(); }
            };
        })();

        /* ==================================================
           MOTION
           Keyed only on reduced motion, so exactly one branch
           runs on every device.
           ================================================== */
        var mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', function () {

            /* ---- Hero load sequence ---- */
            var lines = gsap.utils.toArray('.pl');
            if (lines.length) {
                /* CSS parks the lines at translateY(112%), which GSAP
                   reads as a pixel y; the tween sets yPercent AND y so
                   no parsed pixel offset is left behind. */
                gsap.fromTo(lines,
                    { yPercent: 112, y: 0 },
                    { yPercent: 0, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' });
            }

            var thread = document.querySelector('[data-thread]');
            if (thread && typeof thread.getTotalLength === 'function') {
                var len = thread.getTotalLength();
                gsap.fromTo(thread,
                    { strokeDasharray: len, strokeDashoffset: len },
                    { strokeDashoffset: 0, duration: 1.6, delay: 0.5, ease: 'power2.inOut' });
            }

            var fill = document.querySelector('[data-counter-fill]');
            if (fill) {
                gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1.4, delay: 0.4, ease: 'power3.out' });
            }

            /* Everything below scrolls into life; without ScrollTrigger
               on the page it must simply be visible instead. */
            if (typeof ScrollTrigger === 'undefined') {
                gsap.set('[data-fade]', { opacity: 1 });
                return;
            }

            /* ---- Scroll reveals ---- */
            gsap.utils.toArray('[data-fade]').forEach(function (el) {
                gsap.fromTo(el,
                    { opacity: 0, y: 18 },
                    {
                        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
                        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
                    });
            });

            /* ---- Count-ups ---- */
            gsap.utils.toArray('[data-count]').forEach(function (el) {
                var target = parseFloat(el.getAttribute('data-count-to'));
                if (!isFinite(target)) return;
                var decimals = parseInt(el.getAttribute('data-count-decimals'), 10) || 0;
                var proxy = { v: 0 };
                gsap.to(proxy, {
                    v: target,
                    duration: 1.6,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                    onUpdate: function () {
                        if (!el.isConnected) return;
                        el.innerHTML = fmtDisplay(proxy.v, decimals);
                    }
                });
            });

            /* ---- Comparator intro: one sweep from nearly-closed to its
               resting split, so the interaction announces itself. ---- */
            if (comparator) {
                ScrollTrigger.create({
                    trigger: comparator.comp,
                    start: 'top 75%',
                    once: true,
                    onEnter: function () {
                        gsap.fromTo(comparator.state,
                            { p: 6 },
                            { p: comparator.start, duration: 1.3, ease: 'power2.inOut', onUpdate: comparator.render });
                    }
                });
            }

            return function cleanup() {
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
                }
            };
        });

        mm.add('(prefers-reduced-motion: reduce)', function () {
            /* The markup already holds every final value; just make sure
               nothing stays parked in a pre-animation state. */
            gsap.set('[data-fade]', { opacity: 1, y: 0 });
            gsap.set('.pl', { yPercent: 0, y: 0 });
            if (comparator) comparator.render();
        });
    });

    /* ==================================================
       THE DONATION FORM
       A front end only: it validates, words the outcome,
       confirms - and says it is not connected to a payment
       provider. Wire the submit to yours (see README).
       ================================================== */
    (function initGiveForm() {
        var form = document.querySelector('[data-give-form]');
        if (!form) return;

        var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="amount"]'));
        var freqs = Array.prototype.slice.call(form.querySelectorAll('input[name="freq"]'));
        var otherWrap = form.querySelector('[data-gf-other]');
        var otherInput = form.querySelector('#gf-other-amount');
        var outcome = form.querySelector('[data-gf-outcome]');
        var submit = form.querySelector('[data-gf-submit]');
        var done = form.querySelector('[data-gf-done]');

        function checked(list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].checked) return list[i].value;
            }
            return null;
        }

        function amount() {
            var v = checked(radios);
            if (v === 'other') {
                var n = otherInput ? parseFloat(otherInput.value) : NaN;
                return isFinite(n) && n > 0 ? n : null;
            }
            var n2 = parseFloat(v);
            return isFinite(n2) ? n2 : null;
        }

        function outcomeFor(a) {
            if (a === null) return 'Pick an amount and see what it does.';
            for (var i = 0; i < TIER_MATH.length; i++) {
                var band = TIER_MATH[i];
                if (a >= band.from) {
                    var n = Math.round((a / band.per) * 10) / 10;
                    if (n >= 10 || n % 1 === 0) n = Math.round(n);
                    return '£' + fmt(a, 0) + ' ' + band.text(n);
                }
            }
            return '';
        }

        function refresh() {
            var a = amount();
            var monthly = checked(freqs) === 'monthly';
            if (otherWrap) otherWrap.hidden = checked(radios) !== 'other';
            if (outcome) {
                var line = outcomeFor(a);
                if (monthly && a !== null) line += ' Every month.';
                outcome.textContent = line;
            }
            if (submit) {
                submit.textContent = a === null
                    ? 'Give to the appeal'
                    : 'Give £' + fmt(a, 0) + (monthly ? ' monthly' : ' once');
            }
        }

        radios.forEach(function (r) { on(r, 'change', refresh, inputHandlers); });
        freqs.forEach(function (r) { on(r, 'change', refresh, inputHandlers); });
        on(otherInput, 'input', refresh, inputHandlers);

        on(form, 'submit', function (event) {
            event.preventDefault();
            var a = amount();
            if (a === null) {
                if (outcome) outcome.textContent = 'Enter an amount first.';
                if (otherInput && checked(radios) === 'other') otherInput.focus();
                return;
            }
            if (done) {
                var monthly = checked(freqs) === 'monthly';
                done.textContent = 'Thank you. £' + fmt(a, 0) +
                    (monthly ? ' a month' : '') +
                    ' is promised to the reach. This form is not yet connected to a ' +
                    'payment provider, so nothing has been charged - it confirms the ' +
                    'pledge and says so.';
                done.hidden = false;
            }
            if (submit) submit.disabled = true;
        }, submitHandlers);

        /* The tier cards' "Give £X" buttons preselect the amount on the
           way down to the form. */
        gsap.utils.toArray('[data-give]').forEach(function (btn) {
            on(btn, 'click', function () {
                var v = btn.getAttribute('data-give');
                var match = null;
                for (var i = 0; i < radios.length; i++) {
                    if (radios[i].value === v) { match = radios[i]; break; }
                }
                if (match) {
                    match.checked = true;
                } else {
                    for (var j = 0; j < radios.length; j++) {
                        if (radios[j].value === 'other') radios[j].checked = true;
                    }
                    if (otherInput) otherInput.value = v;
                }
                if (submit) submit.disabled = false;
                if (done) done.hidden = true;
                refresh();
            }, clickHandlers);
        });

        refresh();
    })();

    window.gsapContext = ctx;

    window.addEventListener('beforeunload', function () {
        if (comparator) comparator.kill();
        offAll(clickHandlers);
        offAll(keyHandlers);
        offAll(inputHandlers);
        offAll(submitHandlers);
        if (ctx) ctx.kill();
        if (lenisTick) gsap.ticker.remove(lenisTick);
        if (lenis) lenis.destroy();
    });
});
