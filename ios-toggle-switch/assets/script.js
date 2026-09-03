/**
 * iOS Toggle Switch
 *
 * A native checkbox styled as a switch. The knob can be tapped or dragged;
 * on release it snaps to the nearer side, and a short push still toggles.
 * GSAP owns the knob's x, so the knob must never carry a CSS transform.
 *
 * @plugins Draggable
 */

(function () {
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(function initIosToggleSwitch() {
    if (typeof gsap === 'undefined') {
        console.warn('[ios-toggle-switch] GSAP is required but was not found.');
        return;
    }
    const hasDraggable = typeof Draggable !== 'undefined';
    if (hasDraggable) gsap.registerPlugin(Draggable);

    document.documentElement.classList.add('has-js');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SNAP = 0.4;    // knob travel time on a tap
    const TAP = 8;       // px of movement still counted as a tap, not a drag

    // Helpers are declared before use: the demo build converts function
    // declarations into non-hoisted consts.
    const cssVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

    function setup(track) {
        const input = track.querySelector('.switch-input');
        const knob = track.querySelector('.switch-knob');
        const row = track.closest('.switch-row');
        const label = row ? row.querySelector('[data-switch-label]') : null;
        const onText = track.dataset.on || 'On';
        const offText = track.dataset.off || 'Off';
        if (!input || !knob) return;

        let travel = 0;
        let mix = null;
        let startX = 0;
        let drag = null;

        function measure() {
            const pad = parseFloat(getComputedStyle(knob).left) || 0;
            travel = Math.max(0, track.clientWidth - knob.offsetWidth - pad * 2);
            if (drag) drag.applyBounds({ minX: 0, maxX: travel });
        }

        function paint(animate) {
            const on = input.checked;
            const duration = animate && !reduce ? SNAP : 0;
            track.classList.toggle('is-on', on);
            if (label) label.textContent = on ? onText : offText;
            gsap.to(knob, {
                x: on ? travel : 0,
                y: 0,
                scaleX: 1,
                transformOrigin: '50% 50%',
                duration: duration,
                ease: 'back.out(1.7)',
                overwrite: 'auto',
                // Reset after the snap so the next press measures cleanly.
                onComplete: () => { if (drag) drag.update(); }
            });
            gsap.to(track, {
                backgroundColor: on ? cssVar('--track-on') : cssVar('--track-off'),
                duration: duration * 0.7,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }

        function press() {
            if (reduce) return;
            // Stretch toward the side the knob is heading for.
            gsap.to(knob, {
                scaleX: 1.16,
                transformOrigin: input.checked ? '100% 50%' : '0% 50%',
                duration: 0.16,
                ease: 'power2.out'
            });
        }

        measure();
        gsap.set(knob, { x: input.checked ? travel : 0, y: 0 });
        paint(false);

        input.addEventListener('change', () => paint(true));

        if (hasDraggable && !input.disabled) {
            drag = Draggable.create(knob, {
                type: 'x',
                bounds: { minX: 0, maxX: travel },
                cursor: 'grab',
                activeCursor: 'grabbing',
                allowContextMenu: true,
                onPress: function () {
                    startX = this.x;
                    // Colours are read at the call site, so a variant only
                    // has to change CSS.
                    mix = gsap.utils.interpolate(cssVar('--track-off'), cssVar('--track-on'));
                    press();
                },
                onDrag: function () {
                    if (!travel || !mix) return;
                    gsap.set(track, { backgroundColor: mix(gsap.utils.clamp(0, 1, this.x / travel)) });
                },
                onRelease: function () {
                    const moved = Math.abs(this.x - startX);
                    // A nudge counts as a tap, so a short push still toggles
                    // rather than snapping back to where it came from.
                    const next = moved < TAP ? !input.checked : this.x > travel / 2;
                    if (next === input.checked) {
                        paint(true);
                        return;
                    }
                    input.checked = next;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            })[0];
        }

        window.addEventListener('resize', () => {
            measure();
            gsap.set(knob, { x: input.checked ? travel : 0, y: 0 });
            gsap.set(track, { backgroundColor: input.checked ? cssVar('--track-on') : cssVar('--track-off') });
            if (drag) drag.update();
        });
    }

    document.querySelectorAll('[data-switch]').forEach(setup);
});
})();
