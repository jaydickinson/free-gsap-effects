/**
 * Scrollspy Table of Contents Rail
 *
 * A sticky table of contents beside a long article. A marker slides down the
 * rail to whichever section is in view, the active label brightens, a thin
 * progress line fills as the article is read, and clicking a link scrolls the
 * page to that section.
 *
 * @plugins ScrollTrigger, ScrollToPlugin
 */

(function () {
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(function initScrollspyTocRail() {
    if (typeof gsap === 'undefined') {
        console.warn('[scrollspy-toc-rail] GSAP is required but was not found.');
        return;
    }
    if (typeof ScrollTrigger === 'undefined' || typeof ScrollToPlugin === 'undefined') {
        console.warn('[scrollspy-toc-rail] ScrollTrigger and ScrollToPlugin are required.');
        return;
    }

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    var rail = document.getElementById('tocRail');
    var marker = document.getElementById('tocMarker');
    var progress = document.getElementById('tocProgress');
    var article = document.getElementById('tocArticle');
    if (!rail || !marker || !progress || !article) return;

    var links = Array.prototype.slice.call(rail.querySelectorAll('.toc-link'));
    var sections = links.map(function (link) {
        return document.querySelector(link.getAttribute('href'));
    }).filter(Boolean);
    if (!links.length || links.length !== sections.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var T = reduce ? 0 : 1; // duration multiplier: reduced motion lands instantly
    var activeIndex = -1;

    // Helpers are declared before use: build:demos un-hoists function declarations.
    var railTop = function () {
        return marker.parentNode.getBoundingClientRect().top;
    };

    var measure = function (index) {
        var rect = links[index].getBoundingClientRect();
        return { y: rect.top - railTop(), height: rect.height };
    };

    var setActive = function (index, instant) {
        if (index < 0 || index >= links.length || index === activeIndex) return;
        activeIndex = index;
        links.forEach(function (link, i) { link.classList.toggle('is-active', i === index); });
        var box = measure(index);
        gsap.to(marker, {
            y: box.y,
            height: box.height,
            duration: instant ? 0 : 0.45 * T,
            ease: 'power3.out',
            overwrite: 'auto'
        });
    };

    var remeasure = function () {
        if (activeIndex < 0) return;
        var box = measure(activeIndex);
        gsap.set(marker, { y: box.y, height: box.height });
    };

    // The marker carries no CSS transform and keeps top: 0, so the measured y
    // is the whole offset. A CSS top or margin here would double it.
    gsap.set(marker, { y: 0, height: links[0].getBoundingClientRect().height });
    gsap.set(progress, { scaleY: 0, transformOrigin: 'top center' });

    // Reading progress: the fill is scrubbed across the whole article, from the
    // first section reaching the top band to the last one leaving it.
    ScrollTrigger.create({
        trigger: article,
        start: 'top 30%',
        end: 'bottom 60%',
        scrub: true,
        onUpdate: function (self) {
            gsap.set(progress, { scaleY: self.progress });
        }
    });

    // One trigger per section. The band sits a third of the way down the
    // viewport, so the active entry changes when a heading reaches reading
    // position rather than when it first appears.
    sections.forEach(function (section, index) {
        ScrollTrigger.create({
            trigger: section,
            start: 'top 32%',
            end: 'bottom 32%',
            onToggle: function (self) {
                if (self.isActive) setActive(index);
            }
        });
    });

    links.forEach(function (link, index) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            setActive(index);
            gsap.to(window, {
                duration: reduce ? 0 : 0.8,
                ease: 'power2.inOut',
                scrollTo: { y: sections[index], offsetY: 60, autoKill: false },
                onComplete: function () {
                    // Move the keyboard caret with the view, so Tab continues
                    // from the section that was just jumped to.
                    sections[index].setAttribute('tabindex', '-1');
                    sections[index].focus({ preventScroll: true });
                }
            });
        });
    });

    setActive(0, true);

    // Fonts change link heights, and so does a resize or a variant swap.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            remeasure();
            ScrollTrigger.refresh();
        });
    }
    window.addEventListener('resize', function () {
        remeasure();
        ScrollTrigger.refresh();
    });

    // The thumbnail generator wants the rail mid-article, where the marker has
    // travelled and the progress line has something in it.
    window.__thumbnail = function () {
        var target = sections[Math.min(2, sections.length - 1)];
        window.scrollTo(0, Math.max(0, target.offsetTop - 60));
        ScrollTrigger.update();
    };
});
})();
