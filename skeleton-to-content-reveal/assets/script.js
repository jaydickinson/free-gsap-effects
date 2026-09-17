/**
 * Skeleton to Content Reveal
 *
 * Shimmering placeholder cards that crossfade into their real content with a
 * stagger. Each card's height is measured and tweened from the placeholder
 * height to the content height, and photos fade in on their own load event.
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
})(function initSkeletonToContentReveal() {
    if (typeof gsap === 'undefined') {
        console.warn('[skeleton-to-content-reveal] GSAP is required but was not found.');
        return;
    }

    var feed = document.getElementById('skFeed');
    var statusEl = document.getElementById('skStatus');
    var loadBtn = document.getElementById('skLoad');
    var reloadBtn = document.getElementById('skReload');
    if (!feed) return;

    var cards = Array.prototype.slice.call(feed.querySelectorAll('.sk-card'));
    if (!cards.length) return;

    /* How long the fake request runs before the reveal starts on its own.
       Wire this to a real fetch and call skeletonReveal.reveal() from its
       resolve handler instead. */
    var AUTO_SECONDS = 0.6;
    /* Gap between one card's reveal and the next. */
    var STAGGER = 0.09;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* One duration multiplier: under reduced motion every tween is instant
       and the states still occur in order, so nothing is skipped. */
    var d = reduced ? 0 : 1;

    var revealed = false;
    var running = false;
    var autoTimer = null;
    var master = null;

    /* Declared before first use: build:demos un-hoists function declarations. */
    function token(name) {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    }

    function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
    }

    function partsOf(card) {
        return {
            skeleton: card.querySelector('.sk-skeleton'),
            content: card.querySelector('.sk-content'),
            photo: card.querySelector('.sk-photo')
        };
    }

    function whenPhotoReady(photo, done) {
        if (!photo) { done(); return; }
        if (photo.complete && photo.naturalWidth > 0) { done(); return; }
        photo.addEventListener('load', done, { once: true });
        photo.addEventListener('error', done, { once: true });
    }

    function settle(card) {
        var p = partsOf(card);
        p.skeleton.style.display = 'none';
        p.content.classList.add('is-live');
        gsap.set(card, { clearProps: 'height,borderColor' });
        gsap.set(p.content, { clearProps: 'opacity,y' });
        if (p.photo) gsap.set(p.photo, { clearProps: 'opacity' });
    }

    function toSkeleton() {
        if (master) master.kill();
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        cards.forEach(function (card) {
            var p = partsOf(card);
            p.content.classList.remove('is-live');
            p.skeleton.style.display = '';
            gsap.set(card, { clearProps: 'height,borderColor' });
            gsap.set(p.skeleton, { opacity: 1 });
            gsap.set(p.content, { opacity: 0, y: 10 });
            if (p.photo) gsap.set(p.photo, { opacity: 0 });
        });
        revealed = false;
        running = false;
        feed.setAttribute('aria-busy', 'true');
        setStatus('Loading ' + cards.length + ' items…');
    }

    function cardTimeline(card) {
        var p = partsOf(card);
        /* Measure both heights while the skeleton still owns the layout. The
           card's own padding cancels out of the difference, so no padding is
           read or assumed anywhere. */
        var startH = card.getBoundingClientRect().height;
        var skH = p.skeleton.getBoundingClientRect().height;
        var ctH = p.content.getBoundingClientRect().height;
        var targetH = startH - skH + ctH;

        var tl = gsap.timeline();
        tl.set(card, { height: startH })
          .to(p.skeleton, { opacity: 0, duration: 0.28 * d, ease: 'power1.out' })
          .to(card, { height: targetH, duration: 0.5 * d, ease: 'power3.inOut' }, '<')
          /* The flash reads the accent from the variant, never a literal. */
          .to(card, { borderColor: token('--card-flash'), duration: 0.18 * d }, '<')
          .to(p.content, { opacity: 1, y: 0, duration: 0.4 * d, ease: 'power2.out' }, '<0.12')
          .to(card, { borderColor: token('--card-line'), duration: 0.5 * d }, '<')
          .add(function () {
              /* A card need not have a photo; this demo's rows use initials. */
              if (!p.photo) return;
              whenPhotoReady(p.photo, function () {
                  gsap.to(p.photo, { opacity: 1, duration: 0.45 * d, ease: 'power1.out' });
              });
          }, '<')
          .add(function () { settle(card); });
        return tl;
    }

    function reveal() {
        if (revealed || running) return;
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        running = true;
        if (loadBtn) loadBtn.disabled = true;

        master = gsap.timeline({
            onComplete: function () {
                running = false;
                revealed = true;
                feed.setAttribute('aria-busy', 'false');
                setStatus(cards.length + ' items loaded.');
            }
        });
        cards.forEach(function (card, i) {
            master.add(cardTimeline(card), i * STAGGER * (reduced ? 0 : 1));
        });
    }

    function revealInstantly(card) {
        var p = partsOf(card);
        gsap.set(p.skeleton, { opacity: 0 });
        gsap.set(p.content, { opacity: 1, y: 0 });
        if (p.photo) gsap.set(p.photo, { opacity: 1 });
        settle(card);
    }

    function restart() {
        toSkeleton();
        if (loadBtn) loadBtn.disabled = false;
        autoTimer = setTimeout(reveal, AUTO_SECONDS * 1000);
    }

    if (loadBtn) loadBtn.addEventListener('click', reveal);
    if (reloadBtn) reloadBtn.addEventListener('click', restart);

    /* A resting page of skeletons says nothing on a thumbnail, so show the
       moment the component exists for: the front of the panel resolved, the
       rest of it still loading. */
    window.__thumbnail = function () {
        if (master) master.kill();
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        cards.slice(0, 4).forEach(revealInstantly);
        setStatus('Loading ' + cards.length + ' items…');
    };

    /* Small public API so a real fetch can drive the same states. */
    window.skeletonReveal = { reveal: reveal, reset: restart };

    restart();
});
})();
