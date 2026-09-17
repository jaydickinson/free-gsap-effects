/**
 * FAQ Disclosure Accordion
 *
 * A WAI-ARIA accordion for FAQ blocks. Panels open to their natural height
 * with the answer fading and rising a beat behind; a plus morphs into a minus.
 * In one-open mode the previous answer closes on the same timeline as the new
 * one opens, and the clicked question is held still on screen while the
 * content above it shrinks. Expand all / Collapse all, Up/Down/Home/End
 * between questions, #faq-<id> deep links, and closed answers kept in the DOM
 * behind hidden="until-found" so the browser's find-in-page still reaches them.
 *
 * @plugins none (GSAP core only)
 * @techniques click-toggle, state-transition, micro-interaction, keyboard-navigation, focus-management
 */

(function () {
  (function onReady(init) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  })(function initFaqAccordion() {
    if (typeof gsap === 'undefined') {
      // Without GSAP the CSS pre-hide is lifted, so every answer stays readable.
      document.documentElement.classList.remove('has-js');
      return;
    }
    document.documentElement.classList.add('has-js');

    /* Timing. Product motion: short, eased out, the answer a beat behind the
       panel. Change these rather than the tweens below. */
    var OPEN_DURATION = 0.34;
    var CLOSE_DURATION = 0.28;
    var ANSWER_DELAY = 0.08;
    var ANSWER_RISE = 6;

    /* hidden="until-found" keeps a closed answer searchable: Ctrl/Cmd+F finds
       text inside it, the browser removes the attribute and fires
       `beforematch`. Browsers without it treat the value as plain `hidden`. */
    var supportsUntilFound = 'onbeforematch' in document.body;

    var slice = function (nodes) { return Array.prototype.slice.call(nodes); };

    var hidePanel = function (panel) {
      if (supportsUntilFound) panel.setAttribute('hidden', 'until-found');
      else panel.hidden = true;
    };

    var ctx = gsap.context(function () {
      var mm = gsap.matchMedia();

      /* A complementary pair: gsap.matchMedia only runs the callback while at
         least one condition matches, so every device lands in exactly one. */
      mm.add({
        isMotion: '(prefers-reduced-motion: no-preference)',
        isReduced: '(prefers-reduced-motion: reduce)'
      }, function (context) {
        var isReduced = context.conditions.isReduced;
        var dur = function (seconds) { return isReduced ? 0 : seconds; };
        var teardown = [];

        slice(document.querySelectorAll('[data-accordion]')).forEach(function (root) {
          teardown.push(setupAccordion(root, dur));
        });

        return function cleanup() {
          teardown.forEach(function (fn) { fn(); });
        };
      });
    });

    window.addEventListener('beforeunload', function () { ctx.revert(); });

    /* ------------------------------------------------------------------ */

    function setupAccordion(root, dur) {
      var handlers = [];
      var on = function (el, type, fn, opts) {
        el.addEventListener(type, fn, opts);
        handlers.push(function () { el.removeEventListener(type, fn, opts); });
      };

      var expandAllBtn = root.querySelector('[data-accordion-expand]');
      var collapseAllBtn = root.querySelector('[data-accordion-collapse]');
      var swap = null;         // the running one-open timeline, if any
      var lastOpened = null;

      var isSingle = function () {
        return root.getAttribute('data-accordion-mode') !== 'multiple';
      };

      /* Read every item from the markup. Missing ids and ARIA wiring are
         filled in, so the minimum markup is the item, its button and its
         panel. The open state comes from aria-expanded, so a re-init (for
         example after a reduced-motion change) keeps what the reader opened. */
      var items = slice(root.querySelectorAll('[data-accordion-item]')).map(function (el, i) {
        var trigger = el.querySelector('[data-accordion-trigger]');
        var panel = el.querySelector('[data-accordion-panel]');
        var answer = el.querySelector('[data-accordion-answer]') || panel;
        var iconBar = el.querySelector('[data-accordion-icon-bar]');
        var id = el.id || (el.id = 'faq-item-' + (i + 1));
        if (!trigger.id) trigger.id = id + '-trigger';
        if (!panel.id) panel.id = id + '-panel';
        trigger.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', trigger.id);
        return {
          el: el, trigger: trigger, panel: panel, answer: answer, iconBar: iconBar,
          open: trigger.getAttribute('aria-expanded') === 'true'
        };
      });
      if (!items.length) return function () {};

      var itemFor = function (node) {
        var el = node && node.closest ? node.closest('[data-accordion-item]') : null;
        for (var i = 0; i < items.length; i++) if (items[i].el === el) return items[i];
        return null;
      };

      var emit = function (item) {
        root.dispatchEvent(new CustomEvent('accordion:toggle', {
          bubbles: true, detail: { id: item.el.id, open: item.open }
        }));
      };

      var syncBulkButtons = function () {
        var openCount = items.filter(function (it) { return it.open; }).length;
        // aria-disabled, not disabled: a button that disables itself under
        // the keyboard would drop focus to <body>.
        if (expandAllBtn) expandAllBtn.setAttribute('aria-disabled', String(openCount === items.length));
        if (collapseAllBtn) collapseAllBtn.setAttribute('aria-disabled', String(openCount === 0));
      };

      var setState = function (item, open) {
        item.open = open;
        item.trigger.setAttribute('aria-expanded', String(open));
        item.el.classList.toggle('is-open', open);
        if (open) lastOpened = item;
      };

      /* Opening: remove `hidden`, tween height from where it is to `auto`,
         then clear it so the panel hands back to CSS (a theme or font change
         later can never leave it at a stale pixel height). The answer rises
         6px and fades in a beat after the panel starts moving. */
      var openTween = function (item, ease) {
        var panel = item.panel;
        gsap.killTweensOf([panel, item.answer, item.iconBar]);
        var fromHidden = panel.hasAttribute('hidden');
        var startHeight = fromHidden ? 0 : panel.offsetHeight;
        panel.removeAttribute('hidden');

        var tl = gsap.timeline();
        tl.fromTo(panel, { height: startHeight }, {
          height: 'auto', duration: dur(OPEN_DURATION), ease: ease || 'power2.out', clearProps: 'height'
        }, 0);
        tl.fromTo(item.answer,
          { opacity: fromHidden ? 0 : gsap.getProperty(item.answer, 'opacity'), y: fromHidden ? ANSWER_RISE : gsap.getProperty(item.answer, 'y') },
          { opacity: 1, y: 0, duration: dur(0.26), ease: 'power2.out', clearProps: 'opacity,transform' },
          dur(ANSWER_DELAY));
        if (item.iconBar) {
          tl.to(item.iconBar, { rotation: 90, duration: dur(0.3), ease: 'power2.inOut' }, 0);
        }
        return tl;
      };

      /* Closing: the answer fades first, the panel follows, and `hidden` is
         set in onComplete so nothing invisible is left in the tab order or the
         accessibility tree. The guard skips it if the item was reopened
         mid-close. */
      var closeTween = function (item, ease) {
        var panel = item.panel;
        gsap.killTweensOf([panel, item.answer, item.iconBar]);
        var tl = gsap.timeline();
        if (panel.hasAttribute('hidden')) return tl;
        tl.to(item.answer, { opacity: 0, duration: dur(0.14), ease: 'power1.out' }, 0);
        tl.fromTo(panel, { height: panel.offsetHeight }, {
          height: 0, duration: dur(CLOSE_DURATION), ease: ease || 'power2.inOut',
          onComplete: function () {
            if (item.open) return;
            hidePanel(panel);
            gsap.set(panel, { clearProps: 'height' });
            gsap.set(item.answer, { clearProps: 'opacity,transform' });
          }
        }, 0);
        if (item.iconBar) {
          tl.to(item.iconBar, { rotation: 0, duration: dur(0.3), ease: 'power2.inOut' }, 0);
        }
        return tl;
      };

      /* Keeps `anchor` at the same place in the viewport while the timeline
         runs. Closing an answer ABOVE the clicked question would otherwise
         pull the question up under the pointer by that answer's height. The
         correction is measured every frame, so it cooperates with the
         browser's own scroll anchoring instead of doubling it. */
      var holdInPlace = function (tl, anchor) {
        var startTop = anchor.getBoundingClientRect().top;
        var hold = function () {
          var drift = anchor.getBoundingClientRect().top - startTop;
          if (Math.abs(drift) >= 0.5) window.scrollBy(0, drift);
        };
        tl.eventCallback('onUpdate', hold);
        tl.eventCallback('onComplete', hold);
      };

      var open = function (item, opts) {
        opts = opts || {};
        if (item.open) return;
        if (swap) { swap.progress(1); swap = null; }

        var others = isSingle() && !opts.keepOthers
          ? items.filter(function (it) { return it !== item && it.open; })
          : [];

        setState(item, true);
        emit(item);

        if (!others.length) {
          openTween(item);
        } else {
          /* One timeline, one ease for both heights: the page's total height
             moves by the difference only, never grows then shrinks. */
          var tl = gsap.timeline({ onComplete: function () { swap = null; } });
          others.forEach(function (other) {
            setState(other, false);
            emit(other);
            tl.add(closeTween(other, 'power2.inOut'), 0);
          });
          tl.add(openTween(item, 'power2.inOut'), 0);
          var above = others.some(function (other) {
            return other.el.compareDocumentPosition(item.el) & Node.DOCUMENT_POSITION_FOLLOWING;
          });
          if (above && opts.hold !== false) holdInPlace(tl, item.trigger);
          swap = tl;
        }
        syncBulkButtons();
      };

      var close = function (item) {
        if (!item.open) return;
        setState(item, false);
        emit(item);
        closeTween(item);
        syncBulkButtons();
      };

      var toggle = function (item) { item.open ? close(item) : open(item); };

      var expandAll = function () {
        items.forEach(function (it) { if (!it.open) open(it, { keepOthers: true }); });
      };
      var collapseAll = function () { items.forEach(close); };

      /* ---- initial state: set without animation ---- */
      items.forEach(function (item) {
        setState(item, item.open);
        if (item.open) item.panel.removeAttribute('hidden');
        else hidePanel(item.panel);
        if (item.iconBar) gsap.set(item.iconBar, { rotation: item.open ? 90 : 0 });
      });
      // One-open mode starting with several open keeps the first.
      if (isSingle()) {
        var openNow = items.filter(function (it) { return it.open; });
        openNow.slice(1).forEach(function (it) { setState(it, false); hidePanel(it.panel); if (it.iconBar) gsap.set(it.iconBar, { rotation: 0 }); });
        lastOpened = openNow[0] || null;
      }
      syncBulkButtons();
      root.setAttribute('data-accordion-ready', '');

      /* ---- pointer and keyboard ---- */
      items.forEach(function (item) {
        on(item.trigger, 'click', function () { toggle(item); });

        /* Find-in-page revealed a closed answer: the browser has already
           removed `hidden` and is scrolling to the match. Record it as open
           without animating, and leave the others alone so that scroll is not
           undone by a panel collapsing above it. */
        on(item.panel, 'beforematch', function () {
          gsap.killTweensOf([item.panel, item.answer, item.iconBar]);
          gsap.set(item.panel, { clearProps: 'height' });
          gsap.set(item.answer, { clearProps: 'opacity,transform' });
          if (item.iconBar) gsap.set(item.iconBar, { rotation: 90 });
          setState(item, true);
          emit(item);
          syncBulkButtons();
        });
      });

      // Up/Down move between questions (wrapping), Home/End jump to the ends.
      on(root, 'keydown', function (e) {
        var current = itemFor(document.activeElement);
        if (!current || document.activeElement !== current.trigger) return;
        var index = items.indexOf(current);
        var next = null;
        if (e.key === 'ArrowDown') next = items[(index + 1) % items.length];
        else if (e.key === 'ArrowUp') next = items[(index - 1 + items.length) % items.length];
        else if (e.key === 'Home') next = items[0];
        else if (e.key === 'End') next = items[items.length - 1];
        if (!next) return;
        e.preventDefault();
        next.trigger.focus();
      });

      if (expandAllBtn) on(expandAllBtn, 'click', function () {
        if (expandAllBtn.getAttribute('aria-disabled') !== 'true') expandAll();
      });
      if (collapseAllBtn) on(collapseAllBtn, 'click', function () {
        if (collapseAllBtn.getAttribute('aria-disabled') !== 'true') collapseAll();
      });

      /* Switching to one-open mode with several answers open keeps the most
         recently opened one and closes the rest. */
      var modeObserver = new MutationObserver(function () {
        if (!isSingle()) return;
        var keep = lastOpened && lastOpened.open ? lastOpened : items.filter(function (it) { return it.open; })[0];
        items.forEach(function (it) { if (it !== keep) close(it); });
      });
      modeObserver.observe(root, { attributes: true, attributeFilter: ['data-accordion-mode'] });

      /* ---- deep links: #faq-<id> opens that item and scrolls to it ---- */
      var fromHash = function (focus) {
        var id = decodeURIComponent(location.hash.slice(1));
        if (!id) return;
        var target = document.getElementById(id);
        var item = target && root.contains(target) ? itemFor(target) : null;
        if (!item) return;
        // No hold here: the reader asked to go to this item, so let it move.
        open(item, { hold: false });
        var land = function () {
          item.el.scrollIntoView({ block: 'start', behavior: dur(1) ? 'smooth' : 'auto' });
          if (focus) item.trigger.focus({ preventScroll: true });
        };
        // Scroll once the panels have settled, so the target does not move
        // out from under the scroll as the answer above it closes.
        gsap.delayedCall(dur(OPEN_DURATION), land);
      };
      fromHash(false);
      on(window, 'hashchange', function () { fromHash(true); });

      /* A small public API on the root element. */
      root.accordion = {
        open: function (id) { var it = itemFor(document.getElementById(id)); if (it) open(it); },
        close: function (id) { var it = itemFor(document.getElementById(id)); if (it) close(it); },
        toggle: function (id) { var it = itemFor(document.getElementById(id)); if (it) toggle(it); },
        expandAll: expandAll,
        collapseAll: collapseAll
      };

      return function teardownAccordion() {
        handlers.forEach(function (off) { off(); });
        modeObserver.disconnect();
        if (swap) swap.progress(1);
        // Land every item in its recorded state with no inline leftovers.
        items.forEach(function (item) {
          gsap.killTweensOf([item.panel, item.answer, item.iconBar]);
          gsap.set([item.panel, item.answer], { clearProps: 'height,opacity,transform' });
          if (item.open) item.panel.removeAttribute('hidden');
          else hidePanel(item.panel);
        });
        delete root.accordion;
      };
    }
  });
})();
