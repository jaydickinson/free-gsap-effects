/**
 * Sorrel, QR Table Menu Template
 *
 * A digital menu made to be opened from a QR code at the table. The
 * signature is the sticky category bar: tapping Brunch, Small Plates,
 * Sweets or Drinks crossfades to that section and staggers its dishes
 * in, and the dietary chips (Veg / Vegan / GF) filter every section at
 * once, fading the dishes that do not match out of the list.
 *
 * With JavaScript off the whole menu is one readable document: every
 * section stacked, every dish shown, and the category bar degrades to
 * plain in-page anchor links. The script adds a class that upgrades the
 * bar into a tab set showing one section at a time; nothing is ever
 * hidden behind a control that cannot run.
 *
 * Sections are independent. Every lookup is guarded, so a buyer can
 * delete a whole category or a single dish and the rest still works.
 *
 * @plugins ScrollTrigger
 * @techniques tabs, filter, scroll-reveal, stagger
 */

/* Registering the plugin FIRST, inside the guard, is load-bearing: the
   has-js class gates the tab-panel layout, so a partial CDN failure
   (gsap present, ScrollTrigger missing) must stop BEFORE the class is
   added, leaving the full stacked menu rather than a page with every
   section but one collapsed and no working tabs to reach them. */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-js');
} else {
    // CDN blocked: GSAP never loaded, so undo the pre-paint hide from
    // the head script and let the plain document show.
    document.documentElement.classList.remove('has-js');
}

/* Runs immediately if the DOM is already parsed (a late or deferred
   script, e.g. Cloudflare Rocket Loader) and waits for DOMContentLoaded
   otherwise. A bare listener silently never fires under deferral. */
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initSorrel() {

    /* OPTIONAL: Lenis smooth scroll. Remove this block and the CDN tag to drop it. */
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ autoRaf: true, anchors: true });
    }

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const isMotion = context.conditions.isMotion;
            const handlers = new Map();
            const resets = [];

            function listen(el, type, fn) {
                el.addEventListener(type, fn);
                const entry = handlers.get(el) || {};
                entry[type] = fn;
                handlers.set(el, entry);
            }

            /* Filter state is shared: chips filter every section, and a
               dish stays hidden while you switch categories, so it lives
               out here rather than inside either module. */
            const activeDiets = [];

            /* ============================================
               DIETARY FILTER CHIPS
               Each dish carries its own diet tokens in data-diet
               (a vegan dish is tagged veg too, since it qualifies).
               A chip is a toggle; several active chips AND together,
               so Veg + GF shows only dishes that are both.

               A hidden dish gets .is-filtered, which sets display:none
               in CSS, so with the chips absent (no JS) every dish shows.
               ============================================ */
            (function initFilters() {
                const bar = document.querySelector('[data-filters]');
                const chips = gsap.utils.toArray('[data-diet]');
                const items = gsap.utils.toArray('[data-item]');
                if (!bar || !chips.length || !items.length) return;

                const empties = gsap.utils.toArray('[data-empty]');

                function matches(item) {
                    const diet = item.dataset.diet || '';
                    return activeDiets.every(function (d) {
                        return diet.split(/\s+/).indexOf(d) !== -1;
                    });
                }

                /* A category whose every dish was filtered out shows a
                   short note in place of an empty list. */
                function updateEmpties() {
                    empties.forEach(function (note) {
                        const panel = note.closest('[data-panel]');
                        if (!panel) return;
                        const rows = Array.prototype.slice.call(panel.querySelectorAll('[data-item]'));
                        const anyShown = rows.some(function (r) {
                            return !r.classList.contains('is-filtered');
                        });
                        note.hidden = anyShown || rows.length === 0;
                    });
                }

                function apply() {
                    items.forEach(function (item) {
                        const show = matches(item);
                        const hidden = item.classList.contains('is-filtered');

                        if (show && hidden) {
                            item.classList.remove('is-filtered');
                            if (isMotion) {
                                gsap.fromTo(item,
                                    { opacity: 0, y: 6 },
                                    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
                                );
                            } else {
                                gsap.set(item, { clearProps: 'opacity,transform' });
                            }
                        } else if (!show && !hidden) {
                            if (isMotion) {
                                gsap.to(item, {
                                    opacity: 0,
                                    duration: 0.22,
                                    ease: 'power1.out',
                                    onComplete: function () {
                                        item.classList.add('is-filtered');
                                        gsap.set(item, { clearProps: 'opacity,transform' });
                                        updateEmpties();
                                    }
                                });
                            } else {
                                item.classList.add('is-filtered');
                            }
                        }
                    });
                    if (!isMotion) updateEmpties();
                    /* Sections change height as dishes leave, so anything
                       pinned below has moved. */
                    ScrollTrigger.refresh();
                }

                chips.forEach(function (chip) {
                    listen(chip, 'click', function () {
                        const diet = chip.dataset.diet;
                        const i = activeDiets.indexOf(diet);
                        const on = i === -1;
                        if (on) activeDiets.push(diet);
                        else activeDiets.splice(i, 1);
                        chip.classList.toggle('is-on', on);
                        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
                        apply();
                    });
                });

                resets.push(function () {
                    activeDiets.length = 0;
                    items.forEach(function (item) {
                        item.classList.remove('is-filtered');
                        gsap.set(item, { clearProps: 'opacity,transform' });
                    });
                    chips.forEach(function (chip) {
                        chip.classList.remove('is-on');
                        chip.setAttribute('aria-pressed', 'false');
                    });
                    empties.forEach(function (note) { note.hidden = true; });
                });
            })();

            /* ============================================
               SIGNATURE: THE CATEGORY BAR
               Anchor links in the markup, so with no JS they jump to
               the stacked sections. Here they become a tab set: one
               section shows at a time, and switching crossfades the
               incoming section and staggers its (unfiltered) dishes in.

               No CSS transform start state is set on the dishes, so the
               fromTo below is the only thing touching their transform
               and nothing survives between switches.
               ============================================ */
            (function initTabs() {
                const nav = document.querySelector('[data-tabs]');
                const tabs = gsap.utils.toArray('[data-tab]');
                const panels = gsap.utils.toArray('[data-panel]');
                if (!nav || !tabs.length || !panels.length) return;

                nav.setAttribute('role', 'tablist');

                /* Pair each tab with its panel by name, not by index, so
                   deleting one category cannot shift the rest out of step. */
                const pairs = [];
                tabs.forEach(function (tab) {
                    const name = tab.dataset.tab;
                    const panel = panels.filter(function (p) {
                        return p.dataset.panel === name;
                    })[0];
                    if (!panel) return;

                    tab.setAttribute('role', 'tab');
                    if (!tab.id) tab.id = 'tab-' + name;
                    panel.setAttribute('role', 'tabpanel');
                    panel.setAttribute('aria-labelledby', tab.id);
                    pairs.push({ tab: tab, panel: panel });
                });
                if (!pairs.length) return;

                const root = document.documentElement;
                const allTab = tabs.filter(function (t) { return t.dataset.tab === 'all'; })[0];
                if (allTab) {
                    allTab.setAttribute('role', 'tab');
                    if (!allTab.id) allTab.id = 'tab-all';
                }
                /* Keyboard order across the whole bar: All first, then categories. */
                const order = (allTab ? [allTab] : []).concat(pairs.map(function (p) { return p.tab; }));
                let build = null;

                function play(panelList) {
                    if (build) build.kill();
                    if (!isMotion) return;
                    build = gsap.timeline();
                    build.fromTo(panelList,
                        { opacity: 0 },
                        { opacity: 1, duration: 0.28, ease: 'power1.out', stagger: panelList.length > 1 ? 0.05 : 0 }
                    );
                    /* Per-dish stagger only when a single section is shown; across
                       the whole menu it would be too much motion. */
                    if (panelList.length === 1) {
                        const rows = Array.prototype.slice.call(
                            panelList[0].querySelectorAll('[data-item]:not(.is-filtered)')
                        );
                        if (rows.length) {
                            build.fromTo(rows,
                                { opacity: 0, y: 10 },
                                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.05, clearProps: 'transform' },
                                0.06
                            );
                        }
                    }
                }

                function markActive(activeTab) {
                    order.forEach(function (tab) {
                        const on = tab === activeTab;
                        tab.classList.toggle('is-active', on);
                        tab.setAttribute('aria-selected', on ? 'true' : 'false');
                        tab.tabIndex = on ? 0 : -1;
                    });
                }

                /* "All": every category stacked with its title as a divider. */
                function showAll(animate) {
                    root.classList.add('menu-all');
                    markActive(allTab);
                    pairs.forEach(function (pair) {
                        pair.panel.classList.remove('is-active');
                        gsap.set(pair.panel, { clearProps: 'opacity,transform' });
                    });
                    if (animate) play(pairs.map(function (p) { return p.panel; }));
                    ScrollTrigger.refresh();
                }

                function activate(index, animate) {
                    if (index < 0 || index >= pairs.length) return;
                    root.classList.remove('menu-all');
                    markActive(pairs[index].tab);
                    pairs.forEach(function (pair, i) {
                        const on = i === index;
                        pair.panel.classList.toggle('is-active', on);
                        if (!on) gsap.set(pair.panel, { clearProps: 'opacity,transform' });
                    });
                    if (animate) play([pairs[index].panel]);
                    ScrollTrigger.refresh();
                }

                function select(tab, animate) {
                    if (allTab && tab === allTab) { showAll(animate); return; }
                    const idx = pairs.map(function (p) { return p.tab; }).indexOf(tab);
                    if (idx >= 0) activate(idx, animate);
                }

                order.forEach(function (tab, oi) {
                    listen(tab, 'click', function (event) {
                        /* The tab is an anchor; take over its jump so the page
                           does not leap to the section top on tap. */
                        event.preventDefault();
                        select(tab, true);
                    });
                    listen(tab, 'keydown', function (event) {
                        const key = event.key;
                        let ni = -1;
                        if (key === 'ArrowRight' || key === 'ArrowDown') ni = (oi + 1) % order.length;
                        else if (key === 'ArrowLeft' || key === 'ArrowUp') ni = (oi - 1 + order.length) % order.length;
                        else if (key === 'Home') ni = 0;
                        else if (key === 'End') ni = order.length - 1;
                        else return;
                        event.preventDefault();
                        select(order[ni], true);
                        order[ni].focus();
                    });
                });

                /* Default view: the whole menu ("All") if present, else the
                   first category, shown without the stagger so it opens composed. */
                if (allTab) showAll(false); else activate(0, false);

                resets.push(function () {
                    if (build) build.kill();
                    root.classList.remove('menu-all');
                    pairs.forEach(function (pair) {
                        gsap.set(pair.panel, { clearProps: 'opacity,transform' });
                    });
                });
            })();

            /* ============================================
               FOOTER REVEAL
               The one scroll-reveal on the page, kept for the closing
               notes. Guarded and once-only.
               ============================================ */
            (function initFooterReveal() {
                if (!isMotion) return;
                const items = gsap.utils.toArray('[data-note]');
                if (!items.length) return;

                const st = ScrollTrigger.batch(items, {
                    start: 'top 94%',
                    once: true,
                    onEnter: function (batch) {
                        gsap.fromTo(batch,
                            { opacity: 0, y: 16 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.6,
                                ease: 'power2.out',
                                stagger: 0.08,
                                overwrite: true
                            }
                        );
                    }
                });

                resets.push(function () {
                    st.forEach(function (t) { t.kill(); });
                    gsap.set(items, { clearProps: 'opacity,transform' });
                });
            })();

            /* ============================================
               CLEANUP
               ============================================ */
            return function cleanup() {
                handlers.forEach(function removeAll(entry, el) {
                    Object.keys(entry).forEach(function (type) {
                        el.removeEventListener(type, entry[type]);
                    });
                });
                handlers.clear();
                resets.forEach(function (fn) { fn(); });
                resets.length = 0;
                ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
            };
        });
    });

    window.gsapContext = ctx;

    window.addEventListener('beforeunload', function () {
        if (ctx) ctx.kill();
        if (lenis) lenis.destroy();
    });
});
