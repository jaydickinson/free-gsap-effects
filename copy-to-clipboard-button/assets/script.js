/**
 * Copy to Clipboard Button
 *
 * A copy control whose clipboard icon morphs into a stroke-drawn check,
 * floats a "Copied" pill above itself and flashes the value it took. If the
 * clipboard is unavailable it selects the value instead and says so.
 *
 * Every `.cp-block` on the page becomes its own instance, so a list of keys
 * and a share link all run the same code.
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
})(function initCopyToClipboardButton() {
    if (typeof gsap === 'undefined') {
        console.warn('[copy-to-clipboard-button] GSAP is required but was not found.');
        return;
    }

    var blocks = Array.prototype.slice.call(document.querySelectorAll('.cp-block'));
    if (!blocks.length) return;

    /* One shared live region for the whole page: two blocks announcing at
       once would talk over each other. */
    var statusEl = document.querySelector('.cp-status');
    /* Demo-only control; the component works without it. */
    var failToggle = document.getElementById('cpFail');

    /* Button copy for each state. Change these three strings and nothing
       else moves. */
    var TEXT = { idle: 'Copy', ok: 'Copied', err: 'Select text' };
    /* How long the copied or fallback state is held before it resets. */
    var HOLD_SECONDS = 1.9;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* One duration multiplier: under reduced motion every tween is instant
       and the states still occur in order, so nothing is skipped. */
    var d = reduced ? 0 : 1;

    /* Demo-only: forces the fallback path so the state can be seen. */
    var forceFail = false;

    /* Declared before first use: build:demos un-hoists function declarations. */
    function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
    }

    function createBlock(block) {
        var btn = block.querySelector('.cp-btn');
        var code = block.querySelector('.cp-code');
        var pre = block.querySelector('.cp-pre');
        var pill = block.querySelector('.cp-pill');
        if (!btn || !code) return null;

        var label = btn.querySelector('.cp-btn-label');
        var clip = btn.querySelector('.cp-clip');
        var check = btn.querySelector('.cp-check');
        var checkPath = btn.querySelector('.cp-check-path');
        var checkLength = checkPath ? checkPath.getTotalLength() : 40;
        var holdTl = null;
        var api;

        /* Colours are read off the block at the moment a tween starts, so a
           theme swap is correct on the next copy and nothing is hard-coded. */
        function token(name) {
            return getComputedStyle(block).getPropertyValue(name).trim();
        }

        /* The visible value may be masked; data-cp-value carries the real
           string to put on the clipboard. */
        function snippet() {
            var override = code.getAttribute('data-cp-value');
            return (override !== null ? override : code.textContent).trim();
        }

        function armCheck() {
            if (checkPath) gsap.set(checkPath, { strokeDasharray: checkLength, strokeDashoffset: checkLength });
        }

        function showPill(text, bgToken, fgToken) {
            if (!pill) return;
            pill.textContent = text;
            pill.style.backgroundColor = token(bgToken);
            pill.style.color = token(fgToken);
            gsap.killTweensOf(pill);
            gsap.fromTo(pill,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.3 * d, ease: 'power3.out' });
        }

        function hidePill() {
            if (!pill) return;
            gsap.killTweensOf(pill);
            gsap.to(pill, { opacity: 0, y: -6, duration: 0.25 * d, ease: 'power2.in' });
        }

        function reset() {
            btn.classList.remove('is-copied', 'is-error');
            if (label) label.textContent = TEXT.idle;
            gsap.killTweensOf([clip, check]);
            gsap.set(clip, { opacity: 1, scale: 1, rotation: 0 });
            gsap.set(check, { opacity: 0, scale: 0.6 });
            armCheck();
            hidePill();
            if (pre) { gsap.killTweensOf(pre); gsap.set(pre, { clearProps: 'backgroundColor' }); }
            setStatus('');
        }

        function hold() {
            if (holdTl) holdTl.kill();
            holdTl = gsap.timeline();
            holdTl.to({}, { duration: reduced ? 0.6 : HOLD_SECONDS }).add(reset);
        }

        function flashValue() {
            if (!pre || reduced) return;
            gsap.killTweensOf(pre);
            gsap.fromTo(pre,
                { backgroundColor: token('--code-flash') },
                {
                    backgroundColor: token('--code-bg'),
                    duration: 0.7,
                    ease: 'power2.out',
                    /* Hand the background back to the stylesheet, or a later
                       theme swap would be stuck on this theme's colour. */
                    onComplete: function () { gsap.set(pre, { clearProps: 'backgroundColor' }); }
                });
        }

        function succeed() {
            btn.classList.remove('is-error');
            btn.classList.add('is-copied');
            if (label) label.textContent = TEXT.ok;
            armCheck();
            gsap.killTweensOf([clip, check]);
            /* The clipboard shrinks and tips away, the tick scales in and then
               draws itself by tweening strokeDashoffset. No DrawSVG needed. */
            gsap.to(clip, { opacity: 0, scale: 0.5, rotation: -25, duration: 0.2 * d, ease: 'power2.in' });
            gsap.fromTo(check,
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 0.26 * d, ease: 'back.out(2.4)', delay: 0.1 * d });
            if (checkPath) {
                gsap.to(checkPath, { strokeDashoffset: 0, duration: 0.4 * d, ease: 'power2.out', delay: 0.14 * d });
            }
            showPill('Copied', '--pill-ok-bg', '--pill-ok-fg');
            flashValue();
            setStatus('Copied to your clipboard.');
            hold();
        }

        function selectValue() {
            var selection = window.getSelection();
            if (!selection || typeof document.createRange !== 'function') return;
            var range = document.createRange();
            range.selectNodeContents(code);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        function fallback() {
            btn.classList.remove('is-copied');
            btn.classList.add('is-error');
            if (label) label.textContent = TEXT.err;
            gsap.killTweensOf([clip, check]);
            gsap.set(check, { opacity: 0, scale: 0.6 });
            gsap.set(clip, { opacity: 1, scale: 1, rotation: 0 });
            armCheck();
            selectValue();
            /* Shake on x only. Nothing in the CSS sets a transform on the
               button, so this starts and lands at a real zero. */
            if (!reduced) {
                gsap.fromTo(btn, { x: 0 }, { keyframes: { x: [0, -6, 5, -3, 0] }, duration: 0.36, ease: 'power2.out' });
            }
            showPill('Select and copy', '--pill-err-bg', '--pill-err-fg');
            setStatus('Clipboard unavailable. The value has been selected for you, press the copy shortcut.');
            hold();
        }

        function copy() {
            if (holdTl) holdTl.kill();
            var text = snippet();
            var clipboard = navigator.clipboard;
            if (forceFail || !clipboard || typeof clipboard.writeText !== 'function') {
                fallback();
                return;
            }
            clipboard.writeText(text).then(succeed, fallback);
        }

        /* Show the state the component exists for, for a thumbnail or a
           screenshot: tick drawn, pill up, value lit. */
        function preview() {
            if (holdTl) holdTl.kill();
            btn.classList.add('is-copied');
            if (label) label.textContent = TEXT.ok;
            gsap.set(clip, { opacity: 0, scale: 0.5, rotation: -25 });
            gsap.set(check, { opacity: 1, scale: 1 });
            if (checkPath) gsap.set(checkPath, { strokeDasharray: checkLength, strokeDashoffset: 0 });
            if (pill) {
                pill.textContent = 'Copied';
                pill.style.backgroundColor = token('--pill-ok-bg');
                pill.style.color = token('--pill-ok-fg');
                gsap.set(pill, { opacity: 1, y: 0 });
            }
            if (pre) gsap.set(pre, { backgroundColor: token('--code-flash') });
            setStatus('Copied to your clipboard.');
        }

        btn.addEventListener('click', copy);
        gsap.set(check, { opacity: 0, scale: 0.6 });
        armCheck();

        api = { el: block, copy: copy, reset: reset, text: snippet, preview: preview };
        return api;
    }

    var instances = [];
    for (var i = 0; i < blocks.length; i++) {
        var made = createBlock(blocks[i]);
        if (made) instances.push(made);
    }
    if (!instances.length) return;

    if (failToggle) {
        failToggle.addEventListener('click', function () {
            forceFail = !forceFail;
            failToggle.setAttribute('aria-pressed', String(forceFail));
        });
    }

    /* A resting Copy button says nothing on a thumbnail, so show the state
       the component exists for on the first block. */
    window.__thumbnail = function () { instances[0].preview(); };

    /* Small public API. The first block for the common single-block case,
       and the whole list for a page of them. */
    window.copyButton = instances[0];
    window.copyButtons = instances;
});
})();
