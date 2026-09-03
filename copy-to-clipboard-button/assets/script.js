/**
 * Copy to Clipboard Button
 *
 * A snippet block whose copy button morphs its clipboard icon into a
 * stroke-drawn check, floats a "Copied" pill up beside it and flashes the
 * snippet. If the clipboard is unavailable it selects the code instead.
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

    var btn = document.getElementById('cpBtn');
    var code = document.getElementById('cpCode');
    var pre = document.getElementById('cpPre');
    var pill = document.getElementById('cpPill');
    var statusEl = document.getElementById('cpStatus');
    var failToggle = document.getElementById('cpFail');
    if (!btn || !code) return;

    var label = document.getElementById('cpBtnLabel');
    var clip = btn.querySelector('.cp-clip');
    var check = btn.querySelector('.cp-check');
    var checkPath = btn.querySelector('.cp-check-path');

    /* Button copy for each state. Change these three strings and nothing
       else moves. */
    var TEXT = { idle: 'Copy', ok: 'Copied', err: 'Select text' };
    /* How long the copied or fallback state is held before it resets. */
    var HOLD_SECONDS = 1.9;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* One duration multiplier: under reduced motion every tween is instant
       and the states still occur in order, so nothing is skipped. */
    var d = reduced ? 0 : 1;

    var forceFail = false;
    var holdTl = null;
    var checkLength = checkPath ? checkPath.getTotalLength() : 40;

    /* Declared before first use: build:demos un-hoists function declarations. */
    function token(name) {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    }

    function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
    }

    function snippet() {
        return code.textContent.trim();
    }

    function armCheck() {
        gsap.set(checkPath, { strokeDasharray: checkLength, strokeDashoffset: checkLength });
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
        label.textContent = TEXT.idle;
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

    function flashSnippet() {
        if (!pre || reduced) return;
        gsap.killTweensOf(pre);
        gsap.fromTo(pre,
            { backgroundColor: token('--code-flash') },
            {
                backgroundColor: token('--code-bg'),
                duration: 0.7,
                ease: 'power2.out',
                /* Hand the background back to the stylesheet, or a later
                   variant swap would be stuck on this variant's colour. */
                onComplete: function () { gsap.set(pre, { clearProps: 'backgroundColor' }); }
            });
    }

    function succeed() {
        btn.classList.remove('is-error');
        btn.classList.add('is-copied');
        label.textContent = TEXT.ok;
        armCheck();
        gsap.killTweensOf([clip, check]);
        /* The clipboard shrinks and tips away, the tick scales in and then
           draws itself by tweening strokeDashoffset. No DrawSVG needed. */
        gsap.to(clip, { opacity: 0, scale: 0.5, rotation: -25, duration: 0.2 * d, ease: 'power2.in' });
        gsap.fromTo(check,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 0.26 * d, ease: 'back.out(2.4)', delay: 0.1 * d });
        gsap.to(checkPath, { strokeDashoffset: 0, duration: 0.4 * d, ease: 'power2.out', delay: 0.14 * d });
        showPill('Copied', '--pill-ok-bg', '--pill-ok-fg');
        flashSnippet();
        setStatus('Snippet copied to your clipboard.');
        hold();
    }

    function selectSnippet() {
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
        label.textContent = TEXT.err;
        gsap.killTweensOf([clip, check]);
        gsap.set(check, { opacity: 0, scale: 0.6 });
        gsap.set(clip, { opacity: 1, scale: 1, rotation: 0 });
        armCheck();
        selectSnippet();
        /* Shake on x only. Nothing in the CSS sets a transform on the button,
           so this starts and lands at a real zero. */
        if (!reduced) {
            gsap.fromTo(btn, { x: 0 }, { keyframes: { x: [0, -6, 5, -3, 0] }, duration: 0.36, ease: 'power2.out' });
        }
        showPill('Select and copy', '--pill-err-bg', '--pill-err-fg');
        setStatus('Clipboard unavailable. The snippet has been selected for you, press the copy shortcut.');
        hold();
    }

    function copy() {
        if (holdTl) holdTl.kill();
        var text = snippet();
        var api = navigator.clipboard;
        if (forceFail || !api || typeof api.writeText !== 'function') {
            fallback();
            return;
        }
        api.writeText(text).then(succeed, fallback);
    }

    btn.addEventListener('click', copy);

    if (failToggle) {
        failToggle.addEventListener('click', function () {
            forceFail = !forceFail;
            failToggle.setAttribute('aria-pressed', String(forceFail));
        });
    }

    /* A resting Copy button says nothing on a thumbnail, so show the state
       the component exists for: tick drawn, pill up, snippet lit. */
    window.__thumbnail = function () {
        if (holdTl) holdTl.kill();
        btn.classList.add('is-copied');
        label.textContent = TEXT.ok;
        gsap.set(clip, { opacity: 0, scale: 0.5, rotation: -25 });
        gsap.set(check, { opacity: 1, scale: 1 });
        gsap.set(checkPath, { strokeDasharray: checkLength, strokeDashoffset: 0 });
        if (pill) {
            pill.textContent = 'Copied';
            pill.style.backgroundColor = token('--pill-ok-bg');
            pill.style.color = token('--pill-ok-fg');
            gsap.set(pill, { opacity: 1, y: 0 });
        }
        if (pre) gsap.set(pre, { backgroundColor: token('--code-flash') });
        setStatus('Snippet copied to your clipboard.');
    };

    /* Small public API, so the same states can be driven from your own code. */
    window.copyButton = { copy: copy, reset: reset, text: snippet };

    gsap.set(check, { opacity: 0, scale: 0.6 });
    armCheck();
});
})();
