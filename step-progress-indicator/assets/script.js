/**
 * Step Progress Indicator
 *
 * Numbered steps joined by a track whose fill tweens to the active step.
 * Completed nodes flip their number into a drawn checkmark; the active node
 * pulses once. Collapses to a vertical list on narrow screens.
 *
 * @plugins none (core GSAP only)
 */

(function () {
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(function initStepProgressIndicator() {
    if (typeof gsap === 'undefined') {
        console.warn('[step-progress-indicator] GSAP is required but was not found.');
        return;
    }

    var stepper = document.getElementById('stepper');
    var rail = document.getElementById('stepperRail');
    var fill = document.getElementById('stepperFill');
    var list = document.getElementById('stepperList');
    var statusEl = document.getElementById('stepperStatus');
    var backBtn = document.getElementById('stepBack');
    var nextBtn = document.getElementById('stepNext');
    if (!stepper || !rail || !fill || !list) return;

    var steps = Array.prototype.slice.call(list.querySelectorAll('.step'));
    var nodes = steps.map(function (s) { return s.querySelector('.step-node'); });
    var last = steps.length - 1;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* One duration multiplier: under reduced motion everything switches
       instantly and no state is skipped. */
    var d = reduced ? 0 : 1;
    /* Below this width the indicator stacks and the rail runs vertically. */
    var VERTICAL_QUERY = '(max-width: 600px)';

    var current = 0;

    /* Declared before first use: build:demos un-hoists function declarations. */
    function token(name) {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    }

    function isVertical() {
        return window.matchMedia(VERTICAL_QUERY).matches;
    }

    function checkPathOf(step) {
        return step.querySelector('.step-check-path');
    }

    function armCheck(step) {
        var path = checkPathOf(step);
        if (!path) return 0;
        var len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        return len;
    }

    /* Measure the rail from the centre of the first node to the centre of the
       last one, in whichever axis the layout is currently using. Called on
       load, after web fonts land, on resize and on a variant change. */
    function layout() {
        var base = stepper.getBoundingClientRect();
        var a = nodes[0].getBoundingClientRect();
        var b = nodes[last].getBoundingClientRect();
        var thickness = parseFloat(token('--track-w')) || 3;

        if (isVertical()) {
            var y1 = a.top + a.height / 2 - base.top;
            var y2 = b.top + b.height / 2 - base.top;
            rail.style.left = (a.left + a.width / 2 - base.left - thickness / 2) + 'px';
            rail.style.top = y1 + 'px';
            rail.style.width = thickness + 'px';
            rail.style.height = Math.max(0, y2 - y1) + 'px';
        } else {
            var x1 = a.left + a.width / 2 - base.left;
            var x2 = b.left + b.width / 2 - base.left;
            rail.style.left = x1 + 'px';
            rail.style.top = (a.top + a.height / 2 - base.top - thickness / 2) + 'px';
            rail.style.width = Math.max(0, x2 - x1) + 'px';
            rail.style.height = thickness + 'px';
        }
    }

    function setFill(index, animate) {
        var pct = last > 0 ? (index / last) * 100 : 0;
        var dur = animate ? 0.55 * d : 0;
        /* Pin the axis the fill is not using, or rotating the layout leaves a
           stale width or height behind. */
        if (isVertical()) {
            gsap.set(fill, { width: '100%' });
            gsap.to(fill, { height: pct + '%', duration: dur, ease: 'power3.inOut' });
        } else {
            gsap.set(fill, { height: '100%' });
            gsap.to(fill, { width: pct + '%', duration: dur, ease: 'power3.inOut' });
        }
    }

    function flipToCheck(step, animate) {
        var node = step.querySelector('.step-node');
        var num = step.querySelector('.step-num');
        var chk = step.querySelector('.step-check');
        var path = checkPathOf(step);
        var len = armCheck(step);
        var t = animate ? d : 0;

        gsap.timeline()
            .to(num, { rotationX: -90, opacity: 0, duration: 0.2 * t, ease: 'power2.in' })
            .add(function () { step.classList.add('is-done'); })
            .to(node, {
                backgroundColor: token('--node-done-bg'),
                borderColor: token('--node-done-line'),
                duration: 0.25 * t
            }, '<')
            .fromTo(chk, { rotationX: 90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.22 * t, ease: 'power2.out' })
            /* The tick draws itself: strokeDashoffset only, no DrawSVG. */
            .fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.34 * t, ease: 'power2.out' }, '<0.04');
    }

    function flipToNumber(step, animate) {
        var node = step.querySelector('.step-node');
        var num = step.querySelector('.step-num');
        var chk = step.querySelector('.step-check');
        var t = animate ? d : 0;

        gsap.timeline()
            .to(chk, { rotationX: 90, opacity: 0, duration: 0.18 * t, ease: 'power2.in' })
            .add(function () {
                step.classList.remove('is-done');
                gsap.set(node, { clearProps: 'backgroundColor,borderColor' });
                armCheck(step);
            })
            .fromTo(num, { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.22 * t, ease: 'power2.out' });
    }

    function pulse(step) {
        if (reduced) return;
        var node = step.querySelector('.step-node');
        gsap.fromTo(node,
            { scale: 1 },
            { scale: 1.16, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
    }

    function render(animate, pulseActive) {
        steps.forEach(function (step, i) {
            var node = nodes[i];
            var done = i < current;
            var wasDone = step.classList.contains('is-done');
            if (done && !wasDone) flipToCheck(step, animate);
            if (!done && wasDone) flipToNumber(step, animate);
            step.classList.toggle('is-active', i === current);
            /* Only steps already reached are reachable; the rest are disabled
               buttons, so nothing ahead is focusable or clickable. */
            node.disabled = i > current;
            if (i === current) {
                node.setAttribute('aria-current', 'step');
            } else {
                node.removeAttribute('aria-current');
            }
        });

        setFill(current, animate);
        if (pulseActive) pulse(steps[current]);

        if (backBtn) backBtn.disabled = current === 0;
        if (nextBtn) nextBtn.disabled = current === last;
        if (statusEl) {
            var label = steps[current].querySelector('.step-label');
            statusEl.textContent = 'Step ' + (current + 1) + ' of ' + steps.length +
                (label ? ': ' + label.textContent.trim() : '');
        }
    }

    function goTo(index, animate) {
        var next = Math.max(0, Math.min(last, index));
        if (next === current) return;
        current = next;
        render(animate !== false, true);
    }

    nodes.forEach(function (node, i) {
        node.addEventListener('click', function () {
            /* Forward nodes are disabled, so this only ever jumps back. */
            if (i < current) goTo(i);
        });
    });

    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
    if (backBtn) backBtn.addEventListener('click', function () { goTo(current - 1); });

    window.addEventListener('resize', function () {
        layout();
        setFill(current, false);
    });

    /* Public control: window.stepProgress.goTo(2) from your own form code. */
    window.stepProgress = {
        goTo: goTo,
        next: function () { goTo(current + 1); },
        back: function () { goTo(current - 1); },
        get index() { return current; }
    };

    /* The thumbnail generator would otherwise capture step one of four. */
    window.__thumbnail = function () { goTo(2, false); };

    steps.forEach(function (step) { armCheck(step); });
    layout();
    render(false, false);
    if (document.fonts) {
        document.fonts.ready.then(function () { layout(); setFill(current, false); });
    }
});
})();
