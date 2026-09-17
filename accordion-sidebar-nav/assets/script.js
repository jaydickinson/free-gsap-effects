/**
 * Accordion Sidebar Nav
 *
 * A docs-style sidebar with collapsible sections. Sections open on a measured
 * height tween, chevrons rotate, and the active link carries a sliding
 * indicator rail on the left edge.
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
})(function initAccordionSidebarNav() {
    if (typeof gsap === 'undefined') {
        console.warn('[accordion-sidebar-nav] GSAP is required but was not found.');
        return;
    }

    var root = document.getElementById('docsSidebar');
    var nav = document.getElementById('sidebarNav');
    var rail = document.getElementById('accRail');
    if (!root || !nav || !rail) return;

    var sections = Array.prototype.slice.call(nav.querySelectorAll('.acc-section'));
    var triggers = sections.map(function (s) { return s.querySelector('.acc-trigger'); });
    var links = Array.prototype.slice.call(nav.querySelectorAll('.acc-link'));

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var T = reduce ? 0 : 1; // duration multiplier: reduced motion gets instant states
    var allowMulti = root.getAttribute('data-multi') === 'true';

    // Helpers are declared before use: build:demos un-hoists function declarations.
    var readVar = function (name) {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    };

    var partsOf = function (section) {
        return {
            trigger: section.querySelector('.acc-trigger'),
            panel: section.querySelector('.acc-panel'),
            chevron: section.querySelector('.acc-chevron'),
            label: section.querySelector('.acc-label')
        };
    };

    var isOpen = function (section) {
        return section.getAttribute('data-open') === 'true';
    };

    var activeLink = function () {
        return nav.querySelector('.acc-link.is-active');
    };

    // The open/closed label colour is tweened, so it lands as an inline
    // style. Re-read it from the custom properties whenever the theme (and
    // therefore the token value) may have changed.
    var refreshInk = function () {
        sections.forEach(function (section) {
            var p = partsOf(section);
            if (p.label) gsap.set(p.label, { color: readVar(isOpen(section) ? '--trigger-ink-open' : '--trigger-ink') });
        });
    };

    // The rail keeps left: 0 in CSS and takes its whole offset from the
    // measurement, so nothing is added twice.
    var placeRail = function (animate) {
        var link = activeLink();
        var section = link ? link.closest('.acc-section') : null;
        if (!link || !section || !isOpen(section)) {
            gsap.to(rail, { opacity: 0, duration: 0.18 * T, overwrite: 'auto' });
            return;
        }
        var navBox = nav.getBoundingClientRect();
        var linkBox = link.getBoundingClientRect();
        var target = { y: linkBox.top - navBox.top, height: linkBox.height, opacity: 1 };
        if (animate === false || T === 0) {
            gsap.set(rail, target);
        } else {
            gsap.to(rail, {
                y: target.y,
                height: target.height,
                opacity: 1,
                duration: 0.35,
                ease: 'power3.out',
                overwrite: 'auto'
            });
        }
    };

    var setSection = function (section, open, animate) {
        var p = partsOf(section);
        if (!p.panel || !p.trigger) return;
        section.setAttribute('data-open', open ? 'true' : 'false');
        p.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

        var chevronRotation = open ? 0 : -90;
        var labelInk = readVar(open ? '--trigger-ink-open' : '--trigger-ink');

        if (animate === false || T === 0) {
            gsap.set(p.panel, { height: open ? 'auto' : 0 });
            gsap.set(p.chevron, { rotation: chevronRotation });
            gsap.set(p.label, { color: labelInk });
            placeRail(false);
            return;
        }

        // Measure the real open height rather than tweening to 'auto'.
        var from = p.panel.offsetHeight;
        gsap.set(p.panel, { height: 'auto' });
        var natural = p.panel.offsetHeight;
        var to = open ? natural : 0;
        gsap.set(p.panel, { height: from });

        gsap.to(p.panel, {
            height: to,
            duration: 0.42,
            ease: open ? 'power3.out' : 'power2.inOut',
            overwrite: 'auto',
            onUpdate: function () { placeRail(false); },
            onComplete: function () {
                // Back to auto so the panel reflows if the viewport changes.
                if (open) gsap.set(p.panel, { height: 'auto' });
                placeRail();
            }
        });
        gsap.to(p.chevron, { rotation: chevronRotation, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(p.label, { color: labelInk, duration: 0.3, overwrite: 'auto' });
    };

    var toggleSection = function (section) {
        var opening = !isOpen(section);
        if (opening && !allowMulti) {
            sections.forEach(function (other) {
                if (other !== section && isOpen(other)) setSection(other, false, true);
            });
        }
        setSection(section, opening, true);
    };

    // Initial state, set by GSAP so no CSS height fights the tween. Without
    // JavaScript every panel stays open, which is the readable fallback.
    sections.forEach(function (section) {
        setSection(section, isOpen(section), false);
    });
    placeRail(false);

    triggers.forEach(function (trigger, i) {
        if (!trigger) return;
        trigger.addEventListener('click', function () { toggleSection(sections[i]); });
        trigger.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
            e.preventDefault();
            var next = i;
            if (e.key === 'ArrowDown') next = (i + 1) % triggers.length;
            if (e.key === 'ArrowUp') next = (i - 1 + triggers.length) % triggers.length;
            if (e.key === 'Home') next = 0;
            if (e.key === 'End') next = triggers.length - 1;
            triggers[next].focus();
        });
    });

    links.forEach(function (link) {
        link.addEventListener('click', function () {
            links.forEach(function (other) {
                other.classList.remove('is-active');
                other.removeAttribute('aria-current');
            });
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
            placeRail(true);
        });
    });

    window.addEventListener('resize', function () { refreshInk(); placeRail(false); });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { placeRail(false); });
    }

    // The demo's theme switcher dispatches resize, which covers both of
    // these; this stays for anything that wants to force the pass by hand.
    window.refreshAccordionRail = function () { refreshInk(); placeRail(false); };
});
})();
