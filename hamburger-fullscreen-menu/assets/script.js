/**
 * Hamburger Fullscreen Menu
 *
 * A hamburger button that morphs into an X while a full-screen overlay menu
 * wipes in from the top and its links stagger up. Escape and the X close it,
 * focus is trapped while open and returned to the button on close.
 *
 * @plugins none (GSAP core)
 */

(function () {
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(function initHamburgerFullscreenMenu() {
    if (typeof gsap === 'undefined') {
        console.warn('[hamburger-fullscreen-menu] GSAP is required but was not found.');
        return;
    }

    var toggle = document.getElementById('menuToggle');
    var overlay = document.getElementById('fullscreenMenu');
    if (!toggle || !overlay) return;

    var lineTop = toggle.querySelector('[data-line="top"]');
    var lineMid = toggle.querySelector('[data-line="mid"]');
    var lineBot = toggle.querySelector('[data-line="bot"]');
    var links = overlay.querySelectorAll('.menu-item a');
    var footLinks = overlay.querySelectorAll('.menu-foot a');

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var T = reduce ? 0 : 1; // duration multiplier: reduced motion gets instant states
    var isOpen = false;

    // Declared before use: build:demos un-hoists function declarations.
    var readVar = function (name) {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    };

    // The page's scroll offset while the menu holds it, restored on close.
    //
    // <html> is locked as well as <body>, and that is not belt-and-braces:
    // <body>'s overflow only reaches the viewport while <html>'s own overflow
    // is `visible`, so a page that sets any overflow on <html> (this demo sets
    // `overflow-x: clip`) keeps scrolling behind the menu and the reader is
    // somewhere else when it closes. Compensating for the scrollbar's width
    // stops the layout shifting sideways as it disappears.
    var scrollLock = { y: 0 };

    var lockPage = function () {
        scrollLock.y = window.scrollY;
        var gap = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        if (gap > 0) document.body.style.paddingRight = gap + 'px';
    };

    var unlockPage = function () {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollLock.y);
    };

    var focusables = function () {
        var inOverlay = overlay.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
        return [toggle].concat(Array.prototype.slice.call(inOverlay));
    };

    // GSAP owns the wipe and the X, so the start state is set here, not in CSS.
    gsap.set(overlay, { clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, scaleX: 1, opacity: 1 });

    var openMenu = function () {
        if (isOpen) return;
        isOpen = true;
        overlay.classList.add('is-open');
        lockPage();
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');

        var openInk = readVar('--burger-ink-open');

        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to(overlay, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55 * T }, 0)
            .to(lineTop, { y: 6, rotation: 45, backgroundColor: openInk, duration: 0.35 * T }, 0.05 * T)
            .to(lineBot, { y: -8, rotation: -45, backgroundColor: openInk, duration: 0.35 * T }, 0.05 * T)
            .to(lineMid, { scaleX: 0, opacity: 0, backgroundColor: openInk, duration: 0.2 * T }, 0)
            .fromTo(links, { y: 44, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5 * T, stagger: 0.07 * T }, 0.18 * T)
            .fromTo(footLinks, { y: 14, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4 * T, stagger: 0.05 * T }, 0.38 * T);

        (links[0] || toggle).focus({ preventScroll: true });
    };

    var closeMenu = function (returnFocus) {
        if (!isOpen) return;
        isOpen = false;
        unlockPage();
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');

        var restInk = readVar('--burger-ink');

        gsap.timeline({
            defaults: { ease: 'power3.in' },
            onComplete: function () {
                overlay.classList.remove('is-open');
                // Drop the inline colour so a variant change repaints the button.
                gsap.set([lineTop, lineMid, lineBot], { clearProps: 'backgroundColor' });
            }
        })
            .to(links, { y: 24, opacity: 0, duration: 0.22 * T, stagger: 0.04 * T }, 0)
            .to(footLinks, { opacity: 0, duration: 0.18 * T }, 0)
            .to(overlay, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.45 * T, ease: 'power3.inOut' }, 0.12 * T)
            .to([lineTop, lineBot], { y: 0, rotation: 0, backgroundColor: restInk, duration: 0.3 * T }, 0.1 * T)
            .to(lineMid, { scaleX: 1, opacity: 1, backgroundColor: restInk, duration: 0.25 * T }, 0.2 * T);

        if (returnFocus !== false) toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', function () {
        if (isOpen) closeMenu(); else openMenu();
    });

    document.addEventListener('keydown', function (e) {
        if (!isOpen) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
            return;
        }
        if (e.key !== 'Tab') return;
        // Focus trap: the button is part of the cycle because it is the X.
        var list = focusables();
        if (!list.length) return;
        var first = list[0];
        var last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        } else if (list.indexOf(document.activeElement) === -1) {
            e.preventDefault();
            first.focus();
        }
    });

    // Follow a link, then close. Demo links are in-page anchors.
    links.forEach(function (link) {
        link.addEventListener('click', function () { closeMenu(false); });
    });

    // Thumbnail generator wants the open state, not a lone button.
    window.__thumbnail = openMenu;
    window.openMenu = openMenu;
    window.closeMenu = closeMenu;
});
})();
