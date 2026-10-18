/**
 * Charity Campaign Template: Hollins Lane Larder
 *
 * One script for index.html and thanks.html. Every section initialiser
 * returns early when its markup is missing, so any section can be deleted.
 *
 *   initAppeal     one shared amount and frequency for the hero card, the
 *                  nav pill and the give form, with the outcome line
 *   initCrate      Pack the crate: drag, tap or Enter an item into the
 *                  crate; Fill it for me; the total drives the give amount
 *   initGiveForm   validation, Gift Aid line, gift-in-someone's-name
 *   initThanks     reads the submitted amount and crate on thanks.html
 *   motion         hero intro, count-ups, reveals, marquee, split bar
 *
 * The crate works under reduced motion too (it is a control, not
 * decoration); only its flights and bounces are dropped.
 *
 * @plugins ScrollTrigger
 */

/* Declare every helper and shared variable BEFORE first use. The demo build
   turns function declarations into non-hoisted consts. */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initTemplate() {

    const docEl = document.documentElement;

    /* The thank-you page needs no animation library: run it first, so a
       blocked CDN still shows the donor what they gave. */
    const formatMoney = function (n) {
        const rounded = Math.round(n * 100) / 100;
        return '£' + rounded.toLocaleString('en-GB', {
            minimumFractionDigits: rounded % 1 ? 2 : 0,
            maximumFractionDigits: 2
        });
    };

    const initThanks = function (root) {
        if (!root) return;
        const params = new URLSearchParams(location.search);
        const amount = parseFloat(params.get('amount'));
        if (!(amount > 0)) return;
        const monthly = params.get('frequency') === 'monthly';
        const set = function (sel, text) {
            const el = root.querySelector(sel);
            if (el) el.textContent = text;
            return el;
        };
        set('[data-thanks-amount]', formatMoney(amount) + (monthly ? ' a month' : ''));
        if (params.get('giftaid') === 'yes') {
            const ga = set('[data-thanks-giftaid]', 'With Gift Aid that is ' + formatMoney(amount * 1.25) + ' to the larder' + (monthly ? ', every month.' : '.'));
            if (ga) ga.hidden = false;
        }
        const crate = (params.get('crate') || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        const list = root.querySelector('[data-thanks-crate]');
        if (list && crate.length) {
            crate.forEach(function (line) {
                const li = document.createElement('li');
                li.textContent = line;
                list.appendChild(li);
            });
            const wrap = root.querySelector('[data-thanks-crate-wrap]');
            if (wrap) wrap.hidden = false;
        }
        const giftName = (params.get('gift_name') || '').trim();
        if (params.get('in_name') === 'yes' && giftName) {
            const card = root.querySelector('[data-thanks-gift]');
            set('[data-thanks-gift-name]', giftName);
            if (card) card.hidden = false;
        }
        const name = (params.get('name') || '').trim().split(/\s+/)[0];
        if (name) set('[data-thanks-name]', 'Thank you, ' + name + '.');

        const share = root.querySelector('[data-share]');
        if (share) {
            const url = share.getAttribute('data-share-url') || location.href;
            const absolute = new URL(url, location.href).href;
            share.addEventListener('click', function () {
                if (navigator.share) {
                    navigator.share({ title: document.title, url: absolute }).catch(function () {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(absolute).then(function () {
                        share.textContent = 'Link copied';
                    });
                }
            });
        }
    };
    initThanks(document.querySelector('[data-thanks]'));

    /* No GSAP (blocked CDN): take the gate off and leave the plain page:
       a priced shelf list and a form that still submits. */
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        docEl.classList.remove('has-js');
        return;
    }
    docEl.classList.add('js-ready');
    gsap.registerPlugin(ScrollTrigger);

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionOK = function () { return !reducedQuery.matches; };

    /* OPTIONAL Lenis smooth scroll. Copy this helper and its call, or omit
       both. An existing window.lenis belongs to the host page. */
    function initLenis() {
        const wantsSmooth = (new URLSearchParams(location.search).get('smooth')
            || docEl.dataset.smooth) !== 'off';
        if (!wantsSmooth || typeof Lenis === 'undefined' || window.lenis) return null;

        const previousLenis = window.lenis;
        const previousDestroy = window.destroyLenis;
        const hasST = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
        const lenis = new Lenis({ autoRaf: !hasST, allowNestedScroll: true });
        let destroyed = false;
        const tick = function (time) { lenis.raf(time * 1000); };
        const refresh = function () {
            lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        };
        if (hasST) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(tick);
            gsap.ticker.lagSmoothing(0);
            ScrollTrigger.addEventListener('refresh', refresh);
        }
        const destroy = function () {
            if (destroyed) return;
            destroyed = true;
            if (hasST) {
                gsap.ticker.remove(tick);
                ScrollTrigger.removeEventListener('refresh', refresh);
            }
            lenis.destroy();
            if (window.lenis === lenis) {
                if (previousLenis === undefined) delete window.lenis;
                else window.lenis = previousLenis;
            }
            if (window.destroyLenis === destroy) {
                if (previousDestroy === undefined) delete window.destroyLenis;
                else window.destroyLenis = previousDestroy;
            }
        };
        window.lenis = lenis;
        window.destroyLenis = destroy;
        return destroy;
    }

    const previousContext = window.gsapContext;
    const ctx = gsap.context(function (rootContext) {
        const handlers = [];
        const on = function (el, type, fn, opts) {
            if (!el) return;
            const listener = rootContext.add(null, fn);
            el.addEventListener(type, listener, opts);
            handlers.push(function () { el.removeEventListener(type, listener, opts); });
        };

        const navH = function () {
            const nav = document.querySelector('[data-nav]');
            return nav ? nav.offsetHeight : 0;
        };

        /* In-page links: Lenis scrolls when it is running, the browser
           otherwise. The target receives focus for keyboard users. */
        const scrollToTarget = function (target, focusEl) {
            if (!target) return;
            const offset = -navH() - 8;
            if (window.lenis && typeof window.lenis.scrollTo === 'function') {
                window.lenis.scrollTo(target, { offset: offset, immediate: !motionOK() });
            } else {
                const y = target.getBoundingClientRect().top + window.scrollY + offset;
                window.scrollTo({ top: y, behavior: motionOK() ? 'smooth' : 'auto' });
            }
            if (focusEl) focusEl.focus({ preventScroll: true });
        };
        on(document, 'click', function (e) {
            const link = e.target.closest('a[href^="#"]');
            if (!link || e.defaultPrevented) return;
            const id = link.getAttribute('href').slice(1);
            const target = id ? document.getElementById(id) : null;
            if (!target) return;
            e.preventDefault();
            scrollToTarget(target);
            history.replaceState(null, '', '#' + id);
        });

        // ====================================================================
        // THE APPEAL STATE: one amount and one frequency, shown everywhere
        // ====================================================================

        const appeal = { amount: 45, frequency: 'once', crate: null };
        const amountInputs = Array.prototype.slice.call(document.querySelectorAll('[data-amount-input]'));
        const chips = Array.prototype.slice.call(document.querySelectorAll('[data-chip]'));
        const freqInputs = Array.prototype.slice.call(document.querySelectorAll('[data-frequency]'));
        const outcomes = Array.prototype.slice.call(document.querySelectorAll('[data-outcome]'));
        const giveLabels = Array.prototype.slice.call(document.querySelectorAll('[data-give-label]'));
        const navTotal = document.querySelector('[data-nav-total]');
        const giftAidLine = document.querySelector('[data-giftaid-line]');

        if (amountInputs.length) {
            const start = parseFloat(amountInputs[0].value);
            if (start > 0) appeal.amount = start;
        }

        const chipOutcome = function (amount) {
            for (let i = 0; i < chips.length; i++) {
                if (parseFloat(chips[i].value) === amount) return chips[i].getAttribute('data-outcome');
            }
            return null;
        };

        /* What any amount does. A crate sentence when the amount is the
           crate, a chip's own line when it matches a preset, otherwise a
           rate: about two meals per pound at wholesale prices. */
        const outcomeFor = function (amount) {
            if (!(amount > 0)) return 'Choose an amount and this line says what it does.';
            const monthly = appeal.frequency === 'monthly';
            const every = monthly ? ', every month' : '';
            if (appeal.crate && appeal.crate.total > 0 && amount === appeal.crate.total) {
                return formatMoney(amount) + ' packs ' + appeal.crate.phrase + every + '.';
            }
            const chip = chipOutcome(amount);
            if (chip) return formatMoney(amount) + ' ' + chip + every + '.';
            const crates = Math.floor(amount / 45);
            if (crates >= 1) {
                return formatMoney(amount) + ' packs ' + (crates === 1 ? 'a full family crate' : crates + ' family crates') +
                    (amount % 45 >= 5 ? ' with change for the supper table' : '') + every + '.';
            }
            const meals = Math.max(1, Math.round(amount * 2));
            return formatMoney(amount) + ' puts about ' + meals + (meals === 1 ? ' meal' : ' meals') + ' on the shelves' + every + '.';
        };

        const renderAppeal = function (sourceInput) {
            const a = appeal.amount;
            amountInputs.forEach(function (input) {
                if (input !== sourceInput) input.value = a > 0 ? String(a) : '';
            });
            chips.forEach(function (chip) { chip.checked = parseFloat(chip.value) === a; });
            freqInputs.forEach(function (input) { input.checked = input.value === appeal.frequency; });
            const line = outcomeFor(a);
            outcomes.forEach(function (el) { el.textContent = line; });
            const monthly = appeal.frequency === 'monthly';
            giveLabels.forEach(function (btn) {
                const inForm = !!btn.closest('[data-give-form]');
                if (!(a > 0)) { btn.textContent = 'Give'; return; }
                btn.textContent = 'Give ' + formatMoney(a) + (monthly ? ' a month' : (inForm ? ' once' : ''));
            });
            if (giftAidLine) {
                giftAidLine.textContent = a > 0
                    ? 'and ' + formatMoney(a) + ' is worth ' + formatMoney(a * 1.25) + ' to us'
                    : 'and every £1 is worth £1.25 to us';
            }
            if (navTotal) {
                const crateTotal = appeal.crate ? appeal.crate.total : 0;
                navTotal.hidden = !(crateTotal > 0);
                navTotal.textContent = crateTotal > 0 ? formatMoney(crateTotal) : '';
            }
        };

        const setAmount = function (amount, sourceInput) {
            appeal.amount = amount;
            renderAppeal(sourceInput);
        };

        amountInputs.forEach(function (input) {
            on(input, 'input', function () {
                const v = parseFloat(input.value);
                setAmount(v > 0 ? v : 0, input);
            });
        });
        chips.forEach(function (chip) {
            on(chip, 'change', function () { if (chip.checked) setAmount(parseFloat(chip.value)); });
        });
        freqInputs.forEach(function (input) {
            on(input, 'change', function () {
                if (!input.checked) return;
                appeal.frequency = input.value;
                renderAppeal();
            });
        });

        /* The hero card is a form whose submit carries the amount down to
           the full form rather than leaving the page. */
        const giveCard = document.querySelector('[data-give-card]');
        on(giveCard, 'submit', function (e) {
            e.preventDefault();
            const give = document.getElementById('give');
            const firstField = give ? give.querySelector('input[name="name"]') : null;
            scrollToTarget(give, firstField);
        });

        // ====================================================================
        // PACK THE CRATE
        // ====================================================================

        /* Where packed items sit, as a share of the crate photograph: left
           edge, bottom edge, rotation, stacking. Back row first; the front
           wall (clipped copy of the photo) hides their lower halves.
           Twelve are drawn; more still count, shown as "+n more". */
        const SLOTS = [
            { x: 8, b: 40, r: -4, z: 1 }, { x: 30, b: 41, r: 3, z: 1 }, { x: 52, b: 40, r: -2, z: 1 }, { x: 72, b: 41, r: 4, z: 1 },
            { x: 18, b: 47, r: 5, z: 2 }, { x: 41, b: 48, r: -4, z: 2 }, { x: 62, b: 47, r: 3, z: 2 }, { x: 4, b: 50, r: -6, z: 2 },
            { x: 27, b: 55, r: -3, z: 3 }, { x: 50, b: 56, r: 4, z: 3 }, { x: 72, b: 54, r: -5, z: 3 }, { x: 38, b: 63, r: 2, z: 4 }
        ];

        function initCrate(root) {
            if (!root) return;
            const box = root.querySelector('[data-crate-box]');
            const slotLayer = root.querySelector('[data-crate-slots]');
            if (!box || !slotLayer) return;

            const totalEl = root.querySelector('[data-crate-total]');
            const outcomeEl = root.querySelector('[data-crate-outcome]');
            const statusEl = root.querySelector('[data-crate-status]');
            const moreEl = root.querySelector('[data-crate-more]');
            /* The list is drawn twice: inside the panel on wide screens and
               under the shelf on phones. CSS shows one of them. */
            const listWraps = root.querySelectorAll('[data-crate-list-wrap]');
            const listEls = Array.prototype.slice.call(root.querySelectorAll('[data-crate-list]'));
            const visibleList = function () {
                return listEls.find(function (el) { return el.offsetParent !== null; }) || listEls[0] || null;
            };
            const giveCrate = document.querySelector('[data-give-crate]');
            const giveCrateList = document.querySelector('[data-give-crate-list]');
            const crateField = document.querySelector('[data-crate-field]');

            /* The catalogue is read from the shelf markup. */
            const items = {};
            const order = [];
            root.querySelectorAll('[data-item]').forEach(function (btn) {
                const id = btn.getAttribute('data-item');
                const extra = (btn.getAttribute('data-extra') || '').split('|');
                const img = btn.querySelector('.item-pic img');
                const count = document.createElement('span');
                count.className = 'item-count';
                count.hidden = true;
                count.setAttribute('aria-hidden', 'true');
                btn.appendChild(count);
                items[id] = {
                    id: id,
                    btn: btn,
                    img: img,
                    countEl: count,
                    name: btn.getAttribute('data-name') || id,
                    price: parseFloat(btn.getAttribute('data-price')) || 0,
                    meals: parseFloat(btn.getAttribute('data-meals')) || 0,
                    extra: extra.length === 3 ? { n: parseFloat(extra[0]) || 1, one: extra[1], many: extra[2] } : null,
                    fill: parseInt(btn.getAttribute('data-fill'), 10) || 0
                };
                order.push(id);
            });
            if (!order.length) return;

            const slotEls = SLOTS.map(function (s) {
                const el = document.createElement('div');
                el.className = 'slot';
                el.style.setProperty('--x', s.x + '%');
                el.style.setProperty('--b', s.b + '%');
                el.style.setProperty('--r', s.r + 'deg');
                el.style.setProperty('--z', s.z);
                slotLayer.appendChild(el);
                return el;
            });

            /* units: one entry per packed item, in packing order. slot is
               the index it is drawn in, or -1 when the crate is full. */
            let units = [];

            const countOf = function (id) {
                return units.filter(function (u) { return u.id === id; }).length;
            };
            const freeSlot = function () {
                for (let i = 0; i < slotEls.length; i++) {
                    if (!units.some(function (u) { return u.slot === i; })) return i;
                }
                return -1;
            };

            const phraseFor = function () {
                let meals = 0;
                const parts = [];
                order.forEach(function (id) {
                    const n = countOf(id);
                    if (!n) return;
                    const item = items[id];
                    meals += item.meals * n;
                    if (item.extra) {
                        const qty = item.extra.n * n;
                        parts.push(qty === 1 ? 'a ' + item.extra.one : qty.toLocaleString('en-GB') + ' ' + item.extra.many);
                    }
                });
                if (meals > 0) parts.unshift('about ' + meals + (meals === 1 ? ' meal' : ' meals'));
                if (parts.length < 2) return parts.join('');
                return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
            };

            const drawSlot = function (unit) {
                const el = slotEls[unit.slot];
                const src = items[unit.id].img;
                el.innerHTML = '';
                const img = document.createElement('img');
                img.src = src.currentSrc || src.src;
                img.width = src.naturalWidth || src.width;
                img.height = src.naturalHeight || src.height;
                img.alt = '';
                img.draggable = false;
                el.appendChild(img);
                return img;
            };

            const render = function () {
                const total = units.reduce(function (sum, u) { return sum + items[u.id].price; }, 0);
                const phrase = phraseFor();
                appeal.crate = { total: total, phrase: phrase };
                if (totalEl) totalEl.textContent = formatMoney(total);
                if (outcomeEl) {
                    outcomeEl.textContent = total > 0
                        ? formatMoney(total) + ' packs ' + phrase + '.'
                        : 'Pack an item and this line says what it does.';
                }
                const hiddenCount = units.filter(function (u) { return u.slot < 0; }).length;
                if (moreEl) {
                    moreEl.hidden = hiddenCount === 0;
                    moreEl.textContent = '+' + hiddenCount + ' more';
                }

                const lines = order.filter(function (id) { return countOf(id) > 0; });
                listEls.forEach(function (listEl) {
                    listEl.innerHTML = '';
                    lines.forEach(function (id) {
                        const item = items[id];
                        const n = countOf(id);
                        const li = document.createElement('li');
                        li.className = 'crate-line';
                        li.innerHTML = '<span></span><span class="crate-line-qty"></span>' +
                            '<button type="button" data-line-remove></button><button type="button" data-line-add></button>';
                        li.children[0].textContent = item.name;
                        li.children[1].textContent = '×' + n;
                        const minus = li.children[2];
                        const plus = li.children[3];
                        minus.textContent = '−';
                        plus.textContent = '+';
                        minus.setAttribute('aria-label', 'Remove one ' + item.name);
                        plus.setAttribute('aria-label', 'Add one more ' + item.name);
                        minus.setAttribute('data-id', id);
                        plus.setAttribute('data-id', id);
                        listEl.appendChild(li);
                    });
                });
                listWraps.forEach(function (wrap) { wrap.hidden = lines.length === 0; });

                order.forEach(function (id) {
                    const item = items[id];
                    const n = countOf(id);
                    item.countEl.hidden = n === 0;
                    item.countEl.textContent = '×' + n;
                    item.btn.setAttribute('aria-label', 'Add ' + item.name + ', ' + formatMoney(item.price) +
                        (n ? '. ' + n + ' in your crate' : ''));
                });

                const summary = lines.map(function (id) { return countOf(id) + ' × ' + items[id].name; });
                if (giveCrate) giveCrate.hidden = lines.length === 0;
                if (giveCrateList) {
                    giveCrateList.innerHTML = '';
                    summary.forEach(function (text) {
                        const li = document.createElement('li');
                        li.textContent = text;
                        giveCrateList.appendChild(li);
                    });
                }
                if (crateField) crateField.value = summary.join('; ');

                /* The crate drives the give amount. An emptied crate hands
                   the form back to the default family-crate preset. */
                setAmount(total > 0 ? total : 45);
            };

            const announce = function (text) {
                if (statusEl) statusEl.textContent = text;
            };

            const bob = function () {
                if (!motionOK()) return;
                gsap.fromTo(box, { y: 0 }, { y: 5, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.out', overwrite: 'auto' });
            };

            /* Fly a ghost image from a rectangle into a slot image. */
            const flyInto = function (slotImg, ghost, fromRect) {
                const to = slotImg.getBoundingClientRect();
                if (!ghost) {
                    ghost = slotImg.cloneNode();
                    ghost.className = 'ghost';
                    ghost.style.width = fromRect.width + 'px';
                    document.body.appendChild(ghost);
                    gsap.set(ghost, { x: fromRect.left, y: fromRect.top, rotation: 0 });
                }
                const startW = parseFloat(ghost.style.width) || fromRect.width;
                gsap.set(slotImg, { autoAlpha: 0 });
                const tl = gsap.timeline({
                    onComplete: function () {
                        ghost.remove();
                        gsap.set(slotImg, { autoAlpha: 1 });
                        gsap.fromTo(slotImg, { y: -10 }, { y: 0, duration: 0.45, ease: 'bounce.out' });
                        bob();
                    }
                });
                tl.to(ghost, { x: to.left, duration: 0.5, ease: 'power1.inOut' }, 0)
                  .to(ghost, { y: to.top, duration: 0.5, ease: 'back.in(1.4)' }, 0)
                  .to(ghost, { scale: to.width / startW, rotation: 0, transformOrigin: '0 0', duration: 0.5, ease: 'power2.in' }, 0);
                return tl;
            };

            const inView = function (el) {
                const r = el.getBoundingClientRect();
                return r.bottom > 0 && r.top < window.innerHeight;
            };

            const add = function (id, opts) {
                const item = items[id];
                if (!item) return;
                opts = opts || {};
                const unit = { id: id, slot: freeSlot() };
                units.push(unit);
                if (unit.slot >= 0) {
                    const slotImg = drawSlot(unit);
                    if (motionOK() && (opts.ghost || (opts.fly && inView(box) && inView(item.img)))) {
                        flyInto(slotImg, opts.ghost || null, item.img.getBoundingClientRect());
                    } else if (opts.ghost) {
                        opts.ghost.remove();
                    }
                } else if (opts.ghost) {
                    gsap.to(opts.ghost, { autoAlpha: 0, scale: 0.6, duration: 0.25, onComplete: function () { opts.ghost.remove(); } });
                    bob();
                }
                render();
                if (!opts.quiet) announce('Added ' + item.name + '. Your crate is ' + formatMoney(appeal.crate.total) + '.');
            };

            const remove = function (id) {
                let idx = -1;
                for (let i = units.length - 1; i >= 0; i--) {
                    if (units[i].id === id) { idx = i; break; }
                }
                if (idx < 0) return;
                const unit = units.splice(idx, 1)[0];
                if (unit.slot >= 0) {
                    const el = slotEls[unit.slot];
                    el.innerHTML = '';
                    /* Promote the first item waiting outside the drawn slots. */
                    const waiting = units.find(function (u) { return u.slot < 0; });
                    if (waiting) {
                        waiting.slot = unit.slot;
                        const img = drawSlot(waiting);
                        if (motionOK()) gsap.fromTo(img, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' });
                    }
                }
                render();
                announce('Removed one ' + items[id].name + '. Your crate is ' + formatMoney(appeal.crate.total) + '.');
            };

            const empty = function () {
                units = [];
                slotEls.forEach(function (el) { el.innerHTML = ''; });
                render();
                announce('The crate is empty.');
            };

            /* Fill it for me: top the crate up to the family set, never
               taking out what the visitor already packed. */
            let fillTimers = [];
            const fill = function (fly) {
                fillTimers.forEach(function (t) { t.kill(); });
                fillTimers = [];
                const queue = [];
                order.forEach(function (id) {
                    const need = items[id].fill - countOf(id);
                    for (let i = 0; i < need; i++) queue.push(id);
                });
                if (!queue.length) {
                    announce('Your crate already holds the family set. It is ' + formatMoney(appeal.crate.total) + '.');
                    return;
                }
                const animate = fly && motionOK() && inView(box);
                if (!animate) {
                    queue.forEach(function (id) { add(id, { quiet: true }); });
                } else {
                    queue.forEach(function (id, i) {
                        fillTimers.push(gsap.delayedCall(i * 0.09, function () { add(id, { fly: true, quiet: true }); }));
                    });
                }
                announce('Packed the family crate. Your crate is ' + formatMoney(
                    units.reduce(function (s, u) { return s + items[u.id].price; }, 0) +
                    (animate ? queue.reduce(function (s, id) { return s + items[id].price; }, 0) : 0)
                ) + '.');
            };

            // ---- Pointer drag, with touch intent: sideways packs, up/down scrolls
            let drag = null;
            let suppressClick = false;

            const overCrate = function (x, y) {
                const r = box.getBoundingClientRect();
                const pad = 28;
                return x > r.left - pad && x < r.right + pad && y > r.top - r.height * 0.4 && y < r.bottom + pad;
            };

            const startGhost = function () {
                const rect = drag.item.img.getBoundingClientRect();
                const ghost = drag.item.img.cloneNode();
                ghost.className = 'ghost';
                ghost.style.width = rect.width + 'px';
                ghost.removeAttribute('width');
                ghost.removeAttribute('height');
                document.body.appendChild(ghost);
                drag.offX = drag.x0 - rect.left;
                drag.offY = drag.y0 - rect.top;
                drag.rect = rect;
                drag.ghost = ghost;
                drag.lastX = drag.x0;
                gsap.set(ghost, { x: rect.left, y: rect.top, transformOrigin: '50% 30%' });
                if (motionOK()) gsap.to(ghost, { scale: 1.08, duration: 0.18, ease: 'power2.out' });
                drag.item.btn.style.opacity = '0.55';
            };

            const endDrag = function (dropped) {
                if (!drag) return;
                const d = drag;
                drag = null;
                box.classList.remove('is-over');
                d.item.btn.style.opacity = '';
                if (!d.committed) return;
                suppressClick = true;
                window.setTimeout(function () { suppressClick = false; }, 350);
                if (dropped) {
                    add(d.item.id, { ghost: d.ghost });
                } else if (motionOK()) {
                    gsap.to(d.ghost, {
                        x: d.rect.left, y: d.rect.top, scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(1.6)',
                        onComplete: function () { d.ghost.remove(); }
                    });
                } else {
                    d.ghost.remove();
                }
            };

            on(root, 'pointerdown', function (e) {
                const btn = e.target.closest('[data-item]');
                if (!btn || e.button !== 0 || drag) return;
                drag = {
                    item: items[btn.getAttribute('data-item')],
                    pointerId: e.pointerId,
                    type: e.pointerType,
                    x0: e.clientX,
                    y0: e.clientY,
                    committed: false
                };
            });

            on(window, 'pointermove', function (e) {
                if (!drag || e.pointerId !== drag.pointerId) return;
                const x = typeof e.clientX === 'number' ? e.clientX : drag.x0;
                const y = typeof e.clientY === 'number' ? e.clientY : drag.y0;
                const dx = x - drag.x0;
                const dy = y - drag.y0;
                if (!drag.committed) {
                    if (Math.hypot(dx, dy) < 8) return;
                    /* A touch that moves mostly up or down is a scroll: let
                       the browser have it (touch-action: pan-y on .item). */
                    if (drag.type !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
                    drag.committed = true;
                    startGhost();
                }
                e.preventDefault();
                const tilt = gsap.utils.clamp(-14, 14, (x - drag.lastX) * 0.8);
                drag.lastX = x;
                gsap.set(drag.ghost, { x: x - drag.offX, y: y - drag.offY });
                if (motionOK()) gsap.to(drag.ghost, { rotation: tilt, duration: 0.25, overwrite: 'auto' });
                box.classList.toggle('is-over', overCrate(x, y));
            }, { passive: false });

            on(window, 'pointerup', function (e) {
                if (!drag || e.pointerId !== drag.pointerId) return;
                endDrag(drag.committed && overCrate(e.clientX, e.clientY));
            });
            on(window, 'pointercancel', function (e) {
                if (!drag || e.pointerId !== drag.pointerId) return;
                endDrag(false);
            });

            /* Tap, click, Enter and Space all arrive here. */
            on(root, 'click', function (e) {
                const btn = e.target.closest('[data-item]');
                if (btn) {
                    if (suppressClick) { suppressClick = false; return; }
                    add(btn.getAttribute('data-item'), { fly: true });
                    return;
                }
                const minus = e.target.closest('[data-line-remove]');
                if (minus) {
                    const id = minus.getAttribute('data-id');
                    remove(id);
                    const listEl = visibleList();
                    const again = listEl && listEl.querySelector('[data-line-remove][data-id="' + id + '"]');
                    if (again) again.focus();
                    else if (listEl && listEl.querySelector('button')) listEl.querySelector('button').focus();
                    else if (items[id]) items[id].btn.focus();
                    return;
                }
                const plus = e.target.closest('[data-line-add]');
                if (plus) {
                    const id = plus.getAttribute('data-id');
                    add(id, { fly: true });
                    const listEl = visibleList();
                    const again = listEl && listEl.querySelector('[data-line-add][data-id="' + id + '"]');
                    if (again) again.focus();
                    return;
                }
                if (e.target.closest('[data-crate-empty]')) {
                    empty();
                    const first = items[order[0]];
                    if (first) first.btn.focus();
                }
            });

            on(root.querySelector('[data-crate-fill]'), 'click', function () { fill(true); });
            on(root.querySelector('[data-crate-give]'), 'click', function (e) {
                e.preventDefault();
                const give = document.getElementById('give');
                scrollToTarget(give, give ? give.querySelector('input[name="name"]') : null);
            });

            /* Buy it all, from the supply band: pack the family crate and
               go straight to the form. */
            on(document.querySelector('[data-buy-all]'), 'click', function () {
                fill(false);
                const give = document.getElementById('give');
                scrollToTarget(give, give ? give.querySelector('input[name="name"]') : null);
            });

            render();

            return function cleanupCrate() {
                fillTimers.forEach(function (t) { t.kill(); });
                if (drag && drag.ghost) drag.ghost.remove();
                document.querySelectorAll('.ghost').forEach(function (g) { g.remove(); });
                slotEls.forEach(function (el) { el.remove(); });
                order.forEach(function (id) {
                    items[id].countEl.remove();
                    items[id].btn.removeAttribute('aria-label');
                    items[id].btn.style.opacity = '';
                });
            };
        }

        // ====================================================================
        // THE GIVE FORM
        // ====================================================================

        function initGiveForm(form) {
            if (!form) return;
            form.noValidate = true;
            const error = form.querySelector('[data-form-error]');
            const inName = form.querySelector('[data-inname]');
            const inNameFields = form.querySelector('[data-inname-fields]');

            const toggleInName = function () {
                if (!inName || !inNameFields) return;
                const open = inName.checked;
                inNameFields.classList.toggle('is-open', open);
                if (open && motionOK()) {
                    gsap.fromTo(inNameFields, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'height' });
                }
                if (open) {
                    const first = inNameFields.querySelector('input');
                    if (first) first.focus();
                }
            };
            on(inName, 'change', toggleInName);
            if (inName && inName.checked) inNameFields.classList.add('is-open');

            on(form, 'submit', function (e) {
                const problems = [];
                form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
                const amountInput = form.querySelector('[data-amount-input]');
                if (!(parseFloat(amountInput.value) > 0)) problems.push([amountInput, 'an amount']);
                const nameInput = form.querySelector('input[name="name"]');
                if (nameInput && !nameInput.value.trim()) problems.push([nameInput, 'your name']);
                const emailInput = form.querySelector('input[name="email"]');
                if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) problems.push([emailInput, 'an email address']);
                if (inName && inName.checked) {
                    const giftName = form.querySelector('input[name="gift_name"]');
                    if (giftName && !giftName.value.trim()) problems.push([giftName, 'their name']);
                }
                if (!problems.length) {
                    if (error) error.hidden = true;
                    return;
                }
                e.preventDefault();
                problems.forEach(function (p) { p[0].setAttribute('aria-invalid', 'true'); });
                if (error) {
                    const names = problems.map(function (p) { return p[1]; });
                    error.textContent = 'Please add ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]) + '.';
                    error.hidden = false;
                }
                problems[0][0].focus();
            });
        }

        // ====================================================================
        // NAV: oat once the hero has scrolled away
        // ====================================================================

        function initNav(nav, hero) {
            if (!nav) return;
            if (!hero) { nav.classList.add('is-solid'); return; }
            ScrollTrigger.create({
                trigger: hero,
                start: function () { return 'bottom top+=' + (nav.offsetHeight + 1); },
                onEnter: function () { nav.classList.add('is-solid'); },
                onLeaveBack: function () { nav.classList.remove('is-solid'); }
            });
        }

        // ====================================================================
        // MOTION (no-preference only)
        // ====================================================================

        const countUp = function (el) {
            const to = parseFloat(el.getAttribute('data-count-to'));
            if (isNaN(to)) return;
            const prefix = el.getAttribute('data-count-prefix') || '';
            const obj = { v: 0 };
            el.textContent = prefix + '0';
            gsap.to(obj, {
                v: to, duration: to > 1000 ? 1.6 : 1.1, ease: 'power2.out',
                onUpdate: function () { el.textContent = prefix + Math.round(obj.v).toLocaleString('en-GB'); },
                onComplete: function () { el.textContent = prefix + to.toLocaleString('en-GB'); }
            });
        };

        function initHero(root) {
            if (!root) return;
            const lines = root.querySelectorAll('[data-hero-line]');
            const fades = root.querySelectorAll('[data-hero-fade]');
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo(lines, { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1, stagger: 0.09 }, 0.1)
              .fromTo(fades, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07 }, 0.35);
            const fill = root.querySelector('[data-raised-fill]');
            if (fill) {
                const share = parseFloat(getComputedStyle(fill).getPropertyValue('--raised')) || 0;
                tl.fromTo(fill, { scaleX: 0 }, { scaleX: share, duration: 1.6, ease: 'power2.inOut' }, 0.5);
            }
            const num = root.querySelector('[data-raised] [data-count]');
            if (num) tl.add(function () { countUp(num); }, 0.5);
        }

        function initReveals() {
            const targets = document.querySelectorAll('[data-reveal]');
            if (targets.length) {
                ScrollTrigger.batch(targets, {
                    start: 'top 88%',
                    once: true,
                    onEnter: function (batch) {
                        gsap.fromTo(batch, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true });
                    }
                });
            }
            document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
                ScrollTrigger.create({
                    trigger: group, start: 'top 85%', once: true,
                    onEnter: function () {
                        gsap.fromTo(group.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out' });
                        group.querySelectorAll('[data-count]').forEach(countUp);
                    }
                });
            });
            document.querySelectorAll('[data-story]').forEach(function (story) {
                const img = story.querySelector('.story-photo img');
                if (!img) return;
                ScrollTrigger.create({
                    trigger: story, start: 'top 80%', once: true,
                    onEnter: function () {
                        gsap.fromTo(img, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12 },
                            { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: 'power3.inOut' });
                    }
                });
            });
            const split = document.querySelector('[data-split]');
            if (split) {
                ScrollTrigger.create({
                    trigger: split, start: 'top 88%', once: true,
                    onEnter: function () {
                        gsap.fromTo(split.children, { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.18, ease: 'power3.out' });
                    }
                });
            }
        }

        function initBuyAll(root) {
            if (!root) return;
            const photo = root.querySelector('[data-buyall-photo]');
            if (photo) {
                gsap.fromTo(photo, { scale: 1.14 }, {
                    scale: 1, ease: 'none',
                    scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true }
                });
            }
            const track = root.querySelector('[data-marquee-track]');
            if (track) {
                const originals = Array.prototype.slice.call(track.children);
                originals.forEach(function (el) { track.appendChild(el.cloneNode(true)); });
                const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
                const marquee = root.querySelector('[data-marquee]');
                on(marquee, 'pointerenter', function () { loop.pause(); });
                on(marquee, 'pointerleave', function () { loop.play(); });
                ScrollTrigger.create({
                    trigger: root, start: 'top bottom', end: 'bottom top',
                    onToggle: function (self) { if (self.isActive) loop.play(); else loop.pause(); }
                });
                return function () { originals.length && track.querySelectorAll('span').forEach(function (s, i) { if (i >= originals.length) s.remove(); }); };
            }
        }

        // ====================================================================
        // START
        // ====================================================================

        const cleanups = [];
        cleanups.push(initCrate(document.querySelector('[data-crate]')));
        initGiveForm(document.querySelector('[data-give-form]'));
        initNav(document.querySelector('[data-nav]'), document.querySelector('[data-hero]'));
        if (amountInputs.length) renderAppeal();

        const mm = gsap.matchMedia();
        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            const isMotion = context.conditions.isMotion;
            const destroySmoothScroll = isMotion ? initLenis() : null;
            let undoBuyAll = null;
            if (isMotion) {
                initHero(document.querySelector('[data-hero]'));
                initReveals();
                undoBuyAll = initBuyAll(document.querySelector('[data-buyall]'));
            } else {
                gsap.set('[data-hero-fade], [data-reveal], [data-reveal-group] > *', { opacity: 1, clearProps: 'transform' });
            }
            return function cleanupMedia() {
                if (undoBuyAll) undoBuyAll();
                if (destroySmoothScroll) destroySmoothScroll();
            };
        });

        /* Fonts change the hero's measured height; refresh triggers after. */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
        }

        const handleUnload = function () { rootContext.revert(); };
        window.addEventListener('beforeunload', handleUnload);
        return function cleanupPage() {
            window.removeEventListener('beforeunload', handleUnload);
            handlers.forEach(function (remove) { remove(); });
            handlers.length = 0;
            cleanups.forEach(function (fn) { if (typeof fn === 'function') fn(); });
            mm.revert();
            if (window.gsapContext === rootContext) {
                docEl.classList.remove('has-js');
                if (previousContext === undefined) delete window.gsapContext;
                else window.gsapContext = previousContext;
            }
        };
    });
    window.gsapContext = ctx;
});
