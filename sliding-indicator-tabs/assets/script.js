/**
 * Sliding Indicator Tabs
 *
 * A tab list whose indicator slides and stretches between tabs, and panels that
 * change directionally: the underline leads, the outgoing panel leaves the way
 * you are travelling, the incoming one arrives from the other side a frame
 * later, and the panel box morphs between the two heights so nothing below the
 * component jumps.
 *
 * @plugins none (GSAP core)
 * @techniques hover-effect, click-toggle, keyboard-navigation, micro-interaction, snap
 */

(function () {
    /* Runs the init straight away if the DOM is already parsed (a script
       executed late or deferred, e.g. by Cloudflare Rocket Loader), and waits
       for DOMContentLoaded otherwise. Never a bare DOMContentLoaded listener:
       if the script runs after the event fired, the init silently never does. */
    (function onReady(init) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        } else {
            init();
        }
    })(function initSlidingIndicatorTabs() {
        if (typeof gsap === 'undefined') {
            console.warn('[sliding-indicator-tabs] GSAP is required but was not found.');
            return;
        }

        document.documentElement.classList.add('has-js');

        /* Every helper and every piece of shared state is declared before first
           use: the demo build turns function declarations into non-hoisted
           consts, so anything relying on hoisting throws only once shipped. */

        var DURATION = {
            indicator: 0.34,   // the underline leads
            height: 0.36,      // the box morphs with it
            out: 0.18,         // the outgoing panel leaves
            in: 0.3,           // the incoming one arrives...
            inDelay: 0.08,     // ...a frame later, which is the whole idea
            hover: 0.24,
            scroll: 0.35
        };
        var SLIDE = 24;        // px the panels travel; short enough to read as one move
        var EASE = 'power3.out';

        var instances = [];

        var isReducedNow = function () {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        };

        /* Panels are absolutely stacked, so a panel that is currently hidden has
           to be measured with the attribute off and visibility off; anything
           else measures zero and the box collapses on the first change. */
        var measurePanels = function (inst) {
            inst.heights = inst.panels.map(function (panel) {
                if (!panel.hasAttribute('hidden')) return panel.offsetHeight;
                panel.style.visibility = 'hidden';
                panel.removeAttribute('hidden');
                var h = panel.offsetHeight;
                panel.setAttribute('hidden', '');
                panel.style.visibility = '';
                return h;
            });
        };

        /* offsetLeft/offsetWidth against the list, never getBoundingClientRect:
           the rect is multiplied by any page zoom (the thumbnail frame sets
           one), which lands the indicator at a multiple of its own offset. The
           indicator has no CSS transform and no CSS left, so x IS the offset. */
        var placeIndicator = function (inst, animate) {
            var tab = inst.tabs[inst.index];
            if (!tab) return;
            var to = { x: tab.offsetLeft, width: tab.offsetWidth };
            if (animate) {
                gsap.to(inst.indicator, Object.assign({
                    duration: DURATION.indicator, ease: EASE, overwrite: 'auto'
                }, to));
            } else {
                gsap.set(inst.indicator, to);
            }
        };

        var setBoxHeight = function (inst, animate) {
            var h = inst.heights[inst.index];
            if (!h) return;
            if (animate) {
                gsap.to(inst.box, { height: h, duration: DURATION.height, ease: EASE, overwrite: 'auto' });
            } else {
                gsap.set(inst.box, { height: h });
            }
        };

        /* The strip fades whichever edge still has tabs behind it, so an
           overflowing list reads as scrollable without a scrollbar. */
        var updateEdges = function (inst) {
            var sc = inst.scroller;
            var host = inst.strip;
            var over = sc.scrollWidth > sc.clientWidth + 1;
            host.classList.toggle('is-overflow', over);
            host.classList.toggle('is-start', over && sc.scrollLeft > 2);
            host.classList.toggle('is-end', over && sc.scrollLeft < sc.scrollWidth - sc.clientWidth - 2);
        };

        var scrollTabIntoView = function (inst, animate) {
            var sc = inst.scroller;
            var tab = inst.tabs[inst.index];
            if (!tab || sc.scrollWidth <= sc.clientWidth + 1) return;
            var pad = 16;
            var target = sc.scrollLeft;
            var left = tab.offsetLeft - pad;
            var right = tab.offsetLeft + tab.offsetWidth + pad;
            if (left < sc.scrollLeft) target = left;
            else if (right > sc.scrollLeft + sc.clientWidth) target = right - sc.clientWidth;
            target = Math.max(0, Math.min(target, sc.scrollWidth - sc.clientWidth));
            if (Math.abs(target - sc.scrollLeft) < 1) return;
            if (animate) {
                gsap.to(sc, { scrollLeft: target, duration: DURATION.scroll, ease: 'power2.out', overwrite: 'auto' });
            } else {
                sc.scrollLeft = target;
            }
        };

        var setHoverPill = function (inst, tab) {
            if (!inst.hover) return;
            var showing = Number(gsap.getProperty(inst.hover, 'opacity')) > 0.01;
            var to = { x: tab.offsetLeft, width: tab.offsetWidth, opacity: 1 };
            if (!showing || inst.reduced) {
                gsap.set(inst.hover, to);
            } else {
                gsap.to(inst.hover, Object.assign({ duration: DURATION.hover, ease: EASE, overwrite: 'auto' }, to));
            }
        };

        var hideHoverPill = function (inst) {
            if (!inst.hover) return;
            gsap.to(inst.hover, { opacity: 0, duration: inst.reduced ? 0 : 0.18, ease: 'power2.out', overwrite: 'auto' });
        };

        var syncHash = function (inst) {
            if (!inst.useHash) return;
            var key = inst.tabs[inst.index].dataset.tab;
            if (!key) return;
            /* replaceState, never `location.hash = …`: assigning the hash makes
               the browser jump to the element with that id. */
            try {
                history.replaceState(null, '', '#' + key);
            } catch (err) { /* file:// and sandboxed frames refuse; the tabs still work */ }
        };

        var activate = function (inst, next, opts) {
            var options = opts || {};
            var count = inst.tabs.length;
            if (!count) return;
            next = Math.max(0, Math.min(next, count - 1));

            var previous = inst.index;
            var first = !inst.started;
            var changed = next !== previous || first;
            var dir = next > previous ? 1 : -1;
            var animate = !inst.reduced && !first && changed && options.animate !== false;

            inst.index = next;
            inst.started = true;

            inst.tabs.forEach(function (tab, i) {
                var selected = i === next;
                tab.setAttribute('aria-selected', String(selected));
                tab.tabIndex = selected ? 0 : -1;
            });

            if (changed) {
                var outgoing = inst.panels[previous];
                var incoming = inst.panels[next];

                inst.panels.forEach(function (panel, i) {
                    if (i === next) panel.removeAttribute('hidden');
                    else if (i !== previous || !animate) panel.setAttribute('hidden', '');
                });

                if (animate && outgoing && incoming && outgoing !== incoming) {
                    gsap.killTweensOf([outgoing, incoming]);
                    /* Opacity, not autoAlpha: the `hidden` attribute owns
                       presence here, and a visibility flip on the same frame
                       would make the panel unfocusable while it is on screen. */
                    gsap.to(outgoing, {
                        x: -SLIDE * dir,
                        opacity: 0,
                        duration: DURATION.out,
                        ease: 'power2.in',
                        onComplete: function () {
                            outgoing.setAttribute('hidden', '');
                            gsap.set(outgoing, { x: 0, opacity: 1 });
                        }
                    });
                    gsap.fromTo(incoming,
                        { x: SLIDE * dir, opacity: 0 },
                        { x: 0, opacity: 1, duration: DURATION.in, delay: DURATION.inDelay, ease: EASE }
                    );
                } else if (incoming) {
                    gsap.set(inst.panels, { x: 0, opacity: 1 });
                }
            }

            placeIndicator(inst, animate);
            setBoxHeight(inst, animate);
            scrollTabIntoView(inst, animate);
            /* Not on the first paint: a page that opens with no hash should keep
               its clean URL until the reader actually picks a tab. */
            if (!first) syncHash(inst);

            if (options.focus) inst.tabs[next].focus();

            if (changed && !first) {
                inst.root.dispatchEvent(new CustomEvent('tabchange', {
                    bubbles: true,
                    detail: {
                        index: next,
                        previousIndex: previous,
                        id: inst.tabs[next].dataset.tab || inst.tabs[next].id,
                        tab: inst.tabs[next],
                        panel: inst.panels[next]
                    }
                }));
            }
        };

        /* Re-measure everything and re-seat the indicator without motion. Called
           on resize, on fonts.ready, and after the demo's theme or style switch,
           either of which can change padding under a measured element. */
        var refresh = function (inst) {
            inst.reduced = isReducedNow();
            measurePanels(inst);
            placeIndicator(inst, false);
            setBoxHeight(inst, false);
            updateEdges(inst);
            scrollTabIntoView(inst, false);
        };

        var setup = function (root) {
            var list = root.querySelector('[role="tablist"]');
            var scroller = root.querySelector('.tabs__scroller') || list;
            var box = root.querySelector('.tabs__panels');
            if (!list || !box) return null;

            var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
            var panels = tabs.map(function (tab) {
                return document.getElementById(tab.getAttribute('aria-controls'));
            }).filter(Boolean);
            if (!tabs.length || panels.length !== tabs.length) return null;

            var inst = {
                root: root,
                list: list,
                scroller: scroller,
                box: box,
                strip: root.querySelector('.tabs__strip') || scroller,
                tabs: tabs,
                panels: panels,
                indicator: root.querySelector('.tabs__indicator'),
                hover: root.querySelector('.tabs__hover'),
                heights: [],
                index: Math.max(0, tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; })),
                started: false,
                reduced: isReducedNow(),
                useHash: root.hasAttribute('data-tabs-hash'),
                handlers: []
            };

            if (inst.useHash) {
                var wanted = decodeURIComponent(String(location.hash || '').replace('#', ''));
                var found = tabs.findIndex(function (t) { return t.dataset.tab === wanted; });
                if (found > -1) inst.index = found;
            }

            panels.forEach(function (panel, i) {
                if (i === inst.index) panel.removeAttribute('hidden');
                else panel.setAttribute('hidden', '');
            });

            return inst;
        };

        var bind = function (inst, isFine) {
            var on = function (target, type, fn, opts) {
                target.addEventListener(type, fn, opts);
                inst.handlers.push([target, type, fn, opts]);
            };

            inst.tabs.forEach(function (tab, i) {
                on(tab, 'click', function () { activate(inst, i, { focus: true }); });
                if (isFine) {
                    on(tab, 'mouseenter', function () { setHoverPill(inst, tab); });
                }
            });

            if (isFine) on(inst.list, 'mouseleave', function () { hideHoverPill(inst); });

            /* Automatic activation: the arrow keys move focus AND select, which
               is the WAI-ARIA default for tabs whose panels are already loaded. */
            on(inst.list, 'keydown', function (event) {
                var count = inst.tabs.length;
                var next = null;
                if (event.key === 'ArrowRight') next = (inst.index + 1) % count;
                else if (event.key === 'ArrowLeft') next = (inst.index - 1 + count) % count;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = count - 1;
                if (next === null) return;
                event.preventDefault();
                activate(inst, next, { focus: true });
            });

            on(inst.scroller, 'scroll', function () { updateEdges(inst); }, { passive: true });

            var onResize = function () { refresh(inst); };
            on(window, 'resize', onResize);

            if (inst.useHash) {
                on(window, 'hashchange', function () {
                    var wanted = decodeURIComponent(String(location.hash || '').replace('#', ''));
                    var found = inst.tabs.findIndex(function (t) { return t.dataset.tab === wanted; });
                    if (found > -1 && found !== inst.index) activate(inst, found, {});
                });
            }
        };

        var unbind = function (inst) {
            inst.handlers.forEach(function (entry) {
                entry[0].removeEventListener(entry[1], entry[2], entry[3]);
            });
            inst.handlers.length = 0;
        };

        var ctx = gsap.context(function slidingTabsContext() {
            var mm = gsap.matchMedia();

            /* Complementary pairs on BOTH axes. A set like { isFine, isReduced }
               leaves a coarse-pointer device with motion allowed matching
               nothing at all, and the component then never initialises. */
            mm.add({
                isFine: '(hover: hover) and (pointer: fine)',
                isCoarse: '(hover: none), (pointer: coarse)',
                isMotion: '(prefers-reduced-motion: no-preference)',
                isReduced: '(prefers-reduced-motion: reduce)'
            }, function tabsMatchMedia(context) {
                var isFine = !!context.conditions.isFine;
                var reduced = !!context.conditions.isReduced;

                var roots = Array.prototype.slice.call(document.querySelectorAll('[data-tabs]'));
                var built = [];

                roots.forEach(function (root) {
                    var existing = instances.filter(function (i) { return i.root === root; })[0];
                    var inst = setup(root);
                    if (!inst) return;
                    /* Keep the selected tab across a media-query re-run, so
                       rotating a phone does not throw the reader back to tab 1. */
                    if (existing) {
                        inst.index = existing.index;
                        inst.panels.forEach(function (panel, i) {
                            if (i === inst.index) panel.removeAttribute('hidden');
                            else panel.setAttribute('hidden', '');
                        });
                    }
                    inst.reduced = reduced;
                    built.push(inst);
                    bind(inst, isFine);

                    measurePanels(inst);
                    activate(inst, inst.index, { animate: false });
                    updateEdges(inst);

                    /* Inter changes the tab widths once it lands; anything
                       measured before that is measured against the fallback. */
                    if (document.fonts && document.fonts.ready) {
                        document.fonts.ready.then(function () { refresh(inst); });
                    }
                });

                instances = built;

                return function cleanup() {
                    built.forEach(unbind);
                };
            });
        });

        /* Programmatic control, for a router or a "see the files" link elsewhere
           on the page. destroy() calls ctx.revert(), never ctx.kill(): kill drops
           the context without running the cleanup above, leaving the listeners
           and the inline heights behind. */
        window.slidingTabs = {
            select: function (key, root) {
                instances.forEach(function (inst) {
                    if (root && inst.root !== root) return;
                    var index = typeof key === 'number'
                        ? key
                        : inst.tabs.findIndex(function (t) { return t.dataset.tab === key; });
                    if (index > -1) activate(inst, index, {});
                });
            },
            refresh: function () { instances.forEach(refresh); },
            destroy: function () {
                instances.forEach(unbind);
                instances = [];
                ctx.revert();
            }
        };
    });
})();
