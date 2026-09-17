/**
 * Announcement Banner Bar
 *
 * A top-of-page announcement bar that pushes the page down instead of
 * overlapping it, rotates through the messages you write as list items,
 * shows a thin progress track to the next one, and collapses away on
 * dismiss so the page reflows up. Pauses on hover, on focus and while the
 * tab is hidden; arrow keys and swipes step through the messages; an
 * optional storage key remembers a dismissal.
 *
 * @plugins none (GSAP core only)
 * @techniques micro-interaction, stagger, state-transition, timed-stream, progress-bar, keyboard-navigation
 */

(function () {
  (function onReady(init) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  })(function initAnnouncementBar() {
    if (typeof gsap === 'undefined') {
      console.warn('[announcement-banner-bar] GSAP is required but was not found.');
      return;
    }

    document.documentElement.classList.add('has-js');

    /* The bar's type decides how it is announced. A danger message interrupts
       (role=alert); everything else waits its turn (role=status, polite). */
    var TYPES = ['info', 'promo', 'warning', 'danger'];

    var ctx = gsap.context(function () {
      var mm = gsap.matchMedia();

      // Both pairs are complementary on purpose: gsap.matchMedia only runs the
      // callback while at least one condition matches, so a lone
      // "(pointer: coarse)" would never fire on a desktop.
      mm.add({
        isFine: '(pointer: fine)',
        isCoarse: '(pointer: coarse)',
        isMotion: '(prefers-reduced-motion: no-preference)',
        isReduced: '(prefers-reduced-motion: reduce)'
      }, function (context) {
        var isCoarse = context.conditions.isCoarse;
        var isReduced = context.conditions.isReduced;
        var handlers = [];
        var instances = [];

        var addHandler = function (element, type, handler, options) {
          element.addEventListener(type, handler, options);
          handlers.push([element, type, handler, options]);
        };

        /* Every helper is declared before its first use: the demo build turns
           function declarations into non-hoisted consts. */

        var dur = function (seconds) {
          return isReduced ? 0 : seconds;
        };

        /* Wrap each word of a message in its own span so the incoming line can
           stagger up through the mask. Runs once per message; the CTA link is
           left alone. */
        var splitWords = function (textEl) {
          if (textEl.dataset.split === 'true') return;
          var words = textEl.textContent.trim().split(/\s+/);
          textEl.textContent = '';
          words.forEach(function (word, i) {
            var span = document.createElement('span');
            span.className = 'ann-bar__word';
            span.textContent = word;
            textEl.appendChild(span);
            if (i < words.length - 1) textEl.appendChild(document.createTextNode(' '));
          });
          textEl.dataset.split = 'true';
        };

        var createBar = function (bar) {
          var viewport = bar.querySelector('[data-messages]');
          var items = viewport ? Array.prototype.slice.call(viewport.querySelectorAll('li')) : [];
          if (!viewport || !items.length) return null;

          var inner = bar.querySelector('[data-inner]') || bar.firstElementChild;
          var prevBtn = bar.querySelector('[data-prev]');
          var nextBtn = bar.querySelector('[data-next]');
          var closeBtn = bar.querySelector('[data-close]');
          var progress = bar.querySelector('[data-progress]');
          var closeIcon = closeBtn ? (closeBtn.querySelector('svg') || closeBtn) : null;

          var interval = Math.max(1000, Number(bar.dataset.interval) || 5000);
          var storageKey = bar.dataset.storageKey || '';
          var sticky = bar.dataset.sticky === 'true';

          var index = 0;
          var isOpen = false;
          var swapping = false;
          var queued = null;          // a step requested mid-swap, played after it
          var timer = null;           // the progress tween: pausing it pauses rotation
          var hovering = false;
          var focused = false;
          var userPaused = false;

          items.forEach(function (li) {
            var text = li.querySelector('[data-text]') || li;
            splitWords(text);
            li.setAttribute('aria-hidden', 'true');
            gsap.set(li, { yPercent: 0, y: 0, rotation: 0, opacity: 1 });
          });

          /* ---------- helpers ---------- */

          var emit = function (name, detail) {
            bar.dispatchEvent(new CustomEvent('announcement:' + name, {
              bubbles: true,
              detail: detail || {}
            }));
          };

          var remembered = function () {
            if (!storageKey) return false;
            try { return window.localStorage.getItem(storageKey) === 'dismissed'; } catch (e) { return false; }
          };

          var remember = function () {
            if (!storageKey) return;
            try { window.localStorage.setItem(storageKey, 'dismissed'); } catch (e) { /* private mode */ }
          };

          var forget = function () {
            if (!storageKey) return;
            try { window.localStorage.removeItem(storageKey); } catch (e) { /* private mode */ }
          };

          /* Politeness follows the type: a danger bar is role=alert, the rest
             role=status with a polite live region on the message viewport. */
          var applyType = function (type) {
            var safe = TYPES.indexOf(type) > -1 ? type : 'info';
            bar.setAttribute('data-type', safe);
            if (safe === 'danger') {
              viewport.setAttribute('role', 'alert');
              viewport.setAttribute('aria-live', 'assertive');
            } else {
              viewport.setAttribute('role', 'status');
              viewport.setAttribute('aria-live', 'polite');
            }
            viewport.setAttribute('aria-atomic', 'true');
          };

          var wordsOf = function (li) {
            return li.querySelectorAll('.ann-bar__word');
          };

          var focusablesIn = function (li) {
            return li.querySelectorAll('a[href], button');
          };

          var activate = function (li, on) {
            li.classList.toggle('is-active', on);
            li.setAttribute('aria-hidden', on ? 'false' : 'true');
            // Links in hidden messages must not be tab stops.
            Array.prototype.forEach.call(focusablesIn(li), function (el) {
              if (on) el.removeAttribute('tabindex');
              else el.setAttribute('tabindex', '-1');
            });
          };

          var shouldRun = function () {
            return isOpen && !hovering && !focused && !userPaused && !document.hidden && items.length > 1;
          };

          /* The countdown is a tween scrubbing the progress track, so pausing
             the rotation is pausing the tween and the track holds where it is. */
          var killTimer = function () {
            if (timer) { timer.kill(); timer = null; }
            if (progress) gsap.set(progress, { scaleX: 0 });
          };

          var startTimer = function () {
            killTimer();
            if (items.length < 2 || !isOpen) return;
            var target = progress || {};
            timer = gsap.fromTo(target, { scaleX: 0 }, {
              scaleX: 1,
              duration: interval / 1000,
              ease: 'none',
              paused: !shouldRun(),
              onComplete: function () { step(1); }
            });
          };

          var syncTimer = function () {
            if (!timer) return;
            if (shouldRun()) timer.play();
            else timer.pause();
          };

          /* The signature swap: the current line exits upward through the
             mask with a slight lean, and the next line's words rise in on a
             stagger. Under reduced motion it is an instant cut. */
          var swapTo = function (next, direction, onDone) {
            var from = items[index];
            var to = items[next];
            if (from === to) { if (onDone) onDone(); return; }
            swapping = true;
            var sign = direction < 0 ? -1 : 1;

            gsap.killTweensOf([from, to, wordsOf(from), wordsOf(to)]);
            activate(to, true);
            gsap.set(to, { yPercent: 0, y: 0, rotation: 0, opacity: 1 });
            gsap.set(wordsOf(to), { yPercent: isReduced ? 0 : 115 * sign, y: 0, opacity: isReduced ? 1 : 0 });

            var tl = gsap.timeline({
              onComplete: function () {
                activate(from, false);
                gsap.set(from, { yPercent: 0, y: 0, rotation: 0, opacity: 1 });
                gsap.set(wordsOf(from), { yPercent: 0, y: 0, opacity: 1 });
                index = next;
                swapping = false;
                emit('change', { index: index, type: bar.getAttribute('data-type') });
                if (onDone) onDone();
                if (queued !== null) { var q = queued; queued = null; step(q); }
              }
            });

            tl.to(from, {
              yPercent: -110 * sign,
              rotation: -2 * sign,
              opacity: 0,
              duration: dur(0.55),
              ease: 'expo.inOut'
            }, 0);
            // amount, not each: the spread stays 0.2s whether the line has
            // three words or twelve, so a long message never drags the swap.
            tl.to(wordsOf(to), {
              yPercent: 0,
              opacity: 1,
              duration: dur(0.55),
              ease: 'expo.inOut',
              stagger: { amount: dur(0.2) }
            }, dur(0.1));
          };

          var step = function (delta) {
            if (!isOpen || items.length < 2) return;
            if (swapping) { queued = delta; return; }
            var next = (index + delta + items.length) % items.length;
            swapTo(next, delta, startTimer);
          };

          var go = function (i) {
            if (!isOpen) return;
            var target = ((Number(i) || 0) % items.length + items.length) % items.length;
            if (target === index) { startTimer(); return; }
            if (swapping) { queued = target - index; return; }
            swapTo(target, target > index ? 1 : -1, startTimer);
          };

          /* ---------- open and close ---------- */

          var show = function () {
            if (isOpen) return;
            isOpen = true;
            bar.hidden = false;
            bar.classList.remove('is-dismissed');
            bar.classList.add('is-open');
            if (sticky) bar.classList.remove('is-sticky');

            items.forEach(function (li, i) { activate(li, i === index); });
            var current = items[index];
            var words = wordsOf(current);

            gsap.killTweensOf([bar, inner, words, closeIcon].filter(Boolean));
            if (closeIcon) gsap.set(closeIcon, { rotation: 0 });

            // Tween the height, never a transform: the page below must
            // genuinely move with the bar. Measure with the bar at auto so a
            // variant switch or a different font is measured, not guessed.
            gsap.set(bar, { height: 'auto', overflow: 'hidden' });
            var target = bar.offsetHeight;
            gsap.set(bar, { height: 0 });
            gsap.set(inner, { opacity: 1 });
            gsap.set(words, { yPercent: isReduced ? 0 : 115, y: 0, opacity: isReduced ? 1 : 0 });

            var tl = gsap.timeline({
              onComplete: function () {
                gsap.set(bar, { height: 'auto', clearProps: 'overflow' });
                if (sticky) bar.classList.add('is-sticky');
                startTimer();
                emit('show', { index: index });
              }
            });
            tl.to(bar, { height: target, duration: dur(0.7), ease: 'power3.out' }, 0);
            tl.to(words, {
              yPercent: 0,
              opacity: 1,
              duration: dur(0.6),
              ease: 'power3.out',
              stagger: { amount: dur(0.22) }
            }, dur(0.28));
          };

          var moveFocusOut = function () {
            if (!bar.contains(document.activeElement)) return;
            var all = document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            var next = null;
            for (var i = 0; i < all.length; i += 1) {
              if (!bar.contains(all[i]) && all[i].offsetParent !== null) { next = all[i]; break; }
            }
            if (next) next.focus({ preventScroll: true });
            else document.activeElement.blur();
          };

          var dismiss = function () {
            if (!isOpen) return;
            isOpen = false;
            killTimer();
            remember();
            moveFocusOut();
            bar.classList.remove('is-sticky');

            gsap.killTweensOf([bar, inner, closeIcon].filter(Boolean));
            gsap.set(bar, { height: bar.offsetHeight, overflow: 'hidden' });

            var tl = gsap.timeline({
              onComplete: function () {
                bar.classList.remove('is-open');
                bar.classList.add('is-dismissed');
                bar.hidden = true;
                gsap.set(bar, { height: 0 });
                emit('dismiss', { index: index });
              }
            });
            if (closeIcon) tl.to(closeIcon, { rotation: 90, duration: dur(0.4), ease: 'power3.out' }, 0);
            tl.to(inner, { opacity: 0, duration: dur(0.25), ease: 'power1.out' }, 0);
            tl.to(bar, { height: 0, duration: dur(0.5), ease: 'power3.inOut' }, dur(0.08));
          };

          /* ---------- wiring ---------- */

          applyType(bar.getAttribute('data-type') || 'info');
          if (progress) gsap.set(progress, { scaleX: 0 });

          if (prevBtn) addHandler(prevBtn, 'click', function () { step(-1); });
          if (nextBtn) addHandler(nextBtn, 'click', function () { step(1); });
          if (closeBtn) addHandler(closeBtn, 'click', function () { dismiss(); });

          addHandler(bar, 'mouseenter', function () { hovering = true; syncTimer(); });
          addHandler(bar, 'mouseleave', function () { hovering = false; syncTimer(); });
          addHandler(bar, 'focusin', function () { focused = true; syncTimer(); });
          addHandler(bar, 'focusout', function (e) {
            if (bar.contains(e.relatedTarget)) return;
            focused = false;
            syncTimer();
          });
          addHandler(document, 'visibilitychange', function () { syncTimer(); });

          addHandler(bar, 'keydown', function (e) {
            if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
            else if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
          });

          // Swipe on touch: net displacement, more sideways than down, so a
          // vertical scroll that starts on the bar is left to the page
          // (touch-action: pan-y in the CSS) and a wobbly tap is still a tap.
          if (isCoarse) {
            var startX = 0, startY = 0, tracking = false;
            addHandler(viewport, 'pointerdown', function (e) {
              if (e.pointerType === 'mouse') return;
              tracking = true; startX = e.clientX; startY = e.clientY;
            });
            addHandler(viewport, 'pointerup', function (e) {
              if (!tracking) return;
              tracking = false;
              var dx = e.clientX - startX;
              var dy = e.clientY - startY;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
            });
            addHandler(viewport, 'pointercancel', function () { tracking = false; });
          }

          // Initial state. A remembered dismissal keeps the bar out of the
          // page entirely; otherwise it pushes in.
          gsap.set(bar, { height: 0 });
          if (remembered()) {
            bar.hidden = true;
            bar.classList.add('is-dismissed');
            items.forEach(function (li, i) { activate(li, i === index); });
          } else {
            show();
          }

          var api = {
            element: bar,
            show: show,
            dismiss: dismiss,
            next: function () { step(1); },
            prev: function () { step(-1); },
            go: go,
            pause: function () { userPaused = true; syncTimer(); },
            resume: function () { userPaused = false; syncTimer(); },
            setType: applyType,
            forget: forget,
            index: function () { return index; },
            isOpen: function () { return isOpen; }
          };

          instances.push({
            bar: bar,
            teardown: function () {
              killTimer();
              gsap.set(bar, { clearProps: 'height,overflow' });
              bar.hidden = false;
              bar.classList.remove('is-open', 'is-dismissed', 'is-sticky');
            }
          });
          return api;
        };

        var bars = document.querySelectorAll('[data-announcement-bar]');
        var first = null;
        bars.forEach(function (bar) {
          var api = createBar(bar);
          if (api && !first) first = api;
        });
        window.announcementBar = first;

        return function cleanup() {
          handlers.forEach(function (entry) {
            entry[0].removeEventListener(entry[1], entry[2], entry[3]);
          });
          handlers.length = 0;
          instances.forEach(function (instance) { instance.teardown(); });
          instances.length = 0;
          window.announcementBar = null;
        };
      });
    });

    window.gsapContext = ctx;

    /* revert(), never kill(): kill() drops the context without running the
       cleanup above, so the listeners and inline styles would stay behind. */
    window.addEventListener('beforeunload', function teardown() {
      if (ctx) ctx.revert();
    }, { once: true });
  });
})();
