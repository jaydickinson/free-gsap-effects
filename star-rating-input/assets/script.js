/**
 * Star Rating Input
 *
 * A five-star rating built on a native radio group. Hovering fills the stars
 * up to the pointer with a stagger, clicking locks the choice with a spring
 * pop and a sparkle, and the word underneath cross-fades to match.
 *
 * GSAP owns each star's scale and each fill window's width, so neither may
 * carry a CSS transform or a hard-coded width.
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
})(function initStarRatingInput() {
    if (typeof gsap === 'undefined') {
        console.warn('[star-rating-input] GSAP is required but was not found.');
        return;
    }

    document.documentElement.classList.add('has-js');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const WORDS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    const STAGGER = 0.045;  // per-star delay on the fill sweep
    const FILL = 0.3;       // below ~0.2s the sweep reads as a jump
    const SPARKS = 7;

    // Every helper is declared before it is used: the demo build converts
    // function declarations into non-hoisted consts.
    const cssVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
    const clamp01 = (n) => Math.min(1, Math.max(0, n));

    function sparkle(star) {
        if (reduce) return;
        // The accent is read at the call site, so a variant only changes CSS.
        const colour = cssVar('--star-on');
        for (let i = 0; i < SPARKS; i++) {
            const dot = document.createElement('span');
            dot.className = 'sparkle';
            star.appendChild(dot);
            const angle = (i / SPARKS) * Math.PI * 2 + Math.random() * 0.4;
            const dist = 16 + Math.random() * 18;
            gsap.set(dot, { backgroundColor: colour, scale: 0.4, opacity: 1 });
            gsap.to(dot, {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                scale: 0,
                opacity: 0,
                duration: 0.55 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => dot.remove()
            });
        }
    }

    function setup(root) {
        const group = root.querySelector('.rating-stars');
        const stars = Array.prototype.slice.call(root.querySelectorAll('.star'));
        const fills = stars.map((s) => s.querySelector('.star-fill'));
        const inputs = Array.prototype.slice.call(root.querySelectorAll('.rating-hit'));
        const labelEl = root.querySelector('[data-rating-label]');
        const row = root.querySelector('.rating-row');
        if (!group || !row || !stars.length || !inputs.length) return;

        const half = root.hasAttribute('data-half');
        const restLabel = root.dataset.restLabel || '';
        const step = half ? 0.5 : 1;
        let painted = -1;

        const chosen = () => {
            const hit = inputs.find((i) => i.checked);
            return hit ? parseFloat(hit.value) : 0;
        };

        function word(value) {
            if (!value) return restLabel;
            return WORDS[Math.min(4, Math.ceil(value) - 1)];
        }

        function say(value) {
            if (!labelEl) return;
            const next = word(value);
            if (labelEl.textContent === next) return;
            if (reduce) { labelEl.textContent = next; return; }
            // Cross-fade rather than swap: the word is the readout, and a
            // hard change under a moving pointer reads as a flicker.
            gsap.timeline({ overwrite: true })
                .to(labelEl, {
                    opacity: 0, y: -6, duration: 0.12, ease: 'power2.in',
                    onComplete: () => { labelEl.textContent = next; }
                })
                .fromTo(labelEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' });
        }

        function paint(value, options) {
            const opts = options || {};
            const up = value >= painted;
            painted = value;
            gsap.to(fills, {
                width: (i) => clamp01(value - i) * 100 + '%',
                duration: reduce || opts.instant ? 0 : FILL,
                ease: 'power2.out',
                overwrite: 'auto',
                stagger: reduce || opts.instant ? 0 : { each: STAGGER, from: up ? 'start' : 'end' }
            });
            say(value);
        }

        function pop(value) {
            if (reduce) return;
            const star = stars[Math.min(stars.length - 1, Math.ceil(value) - 1)];
            if (!star) return;
            gsap.fromTo(star,
                { scale: 0.72 },
                { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.42)', overwrite: 'auto' });
            sparkle(star);
        }

        function valueAt(clientX) {
            const rect = row.getBoundingClientRect();
            if (!rect.width) return 0;
            const raw = ((clientX - rect.left) / rect.width) * stars.length;
            const snapped = Math.ceil(raw / step) * step;
            return Math.min(stars.length, Math.max(step, snapped));
        }

        // Resting state comes from whichever radio the markup checked.
        gsap.set(stars, { scale: 1 });
        paint(chosen(), { instant: true });

        group.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') return;
            const value = valueAt(e.clientX);
            if (value !== painted) paint(value);
        });
        group.addEventListener('pointerleave', () => paint(chosen()));

        inputs.forEach((input) => {
            input.addEventListener('change', () => {
                const value = parseFloat(input.value);
                paint(value, { instant: true });
                pop(value);
            });
            input.addEventListener('focus', () => {
                if (input.matches(':focus-visible')) {
                    const star = stars[Math.min(stars.length - 1, Math.ceil(parseFloat(input.value)) - 1)];
                    if (star) star.classList.add('is-focus');
                }
            });
            input.addEventListener('blur', () => {
                stars.forEach((s) => s.classList.remove('is-focus'));
            });
        });

        window.addEventListener('resize', () => paint(chosen(), { instant: true }));
    }

    document.querySelectorAll('[data-rating]').forEach(setup);
});
})();
