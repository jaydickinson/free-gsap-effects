/**
 * Carrick Head Tracking Station: six-page site for a public space-science
 * centre, planetarium or observatory.
 *
 * One script for every page. Each feature looks for its own markup and
 * returns early when it is missing, so a page can drop any section, and a
 * section can move to another page, without breaking the rest.
 *
 * Edit first: SCHEDULE (the weekly programme behind the countdown clock and
 * the Programme sort) and HOURS (the Visit page's open-now line). Both are
 * written in station time, TIME_ZONE below.
 *
 * @plugins ScrollTrigger, Flip (Programme page only)
 */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initStation() {
    'use strict';

    const root = document.documentElement;

    // ====================================================================
    // CONFIG
    // ====================================================================

    /* All times are wall-clock times at the station, whatever the visitor's
       own clock says. */
    const TIME_ZONE = 'Europe/London';

    /* The weekly programme. Days are 0 Sunday to 6 Saturday. `id` matches
       the row id on programme.html, so a day filter there can sort rows by
       the time they run that day. The countdown takes the next of these. */
    const SCHEDULE = [
        { id: 'tonights-sky', code: 'PL-01', title: "Tonight's Sky", slots: { 0: ['11:00', '15:00'], 2: ['11:00', '15:00'], 3: ['11:00', '15:00'], 4: ['11:00', '15:00'], 5: ['11:00', '15:00'], 6: ['11:00', '15:00'] } },
        { id: 'little-astronauts', code: 'PL-04', title: 'Little Astronauts', slots: { 0: ['10:30'], 6: ['10:30'] } },
        { id: 'hydrogen', code: 'DS-01', title: 'Listening to Hydrogen', slots: { 0: ['12:15'], 2: ['12:15'], 3: ['12:15'], 4: ['12:15'], 5: ['12:15'], 6: ['12:15'] } },
        { id: 'rings', code: 'PL-03', title: "Saturn's Rings", slots: { 0: ['13:30'], 3: ['13:30'] } },
        { id: 'giant-planets', code: 'PL-02', title: 'Giant Planets', slots: { 4: ['19:30'], 6: ['13:30'] } },
        { id: 'rocket-lab', code: 'FM-01', title: 'Rocket Lab', slots: { 6: ['11:30'] } },
        { id: 'pedestal', code: 'DS-02', title: 'Inside the Pedestal', slots: { 0: ['14:30'], 6: ['14:30'] } },
        { id: 'apollo-night', code: 'TK-02', title: 'The Night of the Landing', slots: { 0: ['16:00'] } },
        { id: 'first-wednesday', code: 'TK-01', title: 'Wednesday Talk', slots: { 3: ['19:30'] } },
        { id: 'satellite-spotting', code: 'OB-03', title: 'Satellite Spotting', slots: { 6: ['18:00'] } },
        { id: 'moonwatch', code: 'OB-01', title: 'Moonwatch', slots: { 5: ['19:00'] } },
        { id: 'deep-sky', code: 'OB-02', title: 'Deep Sky Night', slots: { 5: ['20:00'], 6: ['20:00'] } }
    ];

    /* Opening hours, 0 Sunday to 6 Saturday; null is closed. */
    const HOURS = {
        0: ['10:00', '17:00'], 1: null, 2: ['10:00', '17:00'], 3: ['10:00', '21:00'],
        4: ['10:00', '21:00'], 5: ['10:00', '22:30'], 6: ['10:00', '22:30']
    };

    const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    // ====================================================================
    // HELPERS (declared before use: the demo build turns declarations
    // into non-hoisted constants)
    // ====================================================================

    const toSecs = function (hhmm) {
        const p = hhmm.split(':');
        return Number(p[0]) * 3600 + Number(p[1]) * 60;
    };
    const pad = function (n) { return String(n).padStart(2, '0'); };

    /* Station wall-clock time now: day of week and seconds since midnight. */
    let stationFormat = null;
    try {
        stationFormat = new Intl.DateTimeFormat('en-GB', {
            timeZone: TIME_ZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
        });
    } catch (err) { stationFormat = null; }
    const stationNow = function () {
        const d = new Date();
        if (!stationFormat) {
            return { dow: d.getDay(), secs: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() };
        }
        const parts = {};
        stationFormat.formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
        return {
            dow: DAY_SHORT.indexOf(parts.weekday),
            secs: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
        };
    };

    /* The next session from now, looking up to a week ahead. */
    const nextShow = function () {
        const now = stationNow();
        let best = null;
        for (let offset = 0; offset < 8 && !best; offset++) {
            const dow = (now.dow + offset) % 7;
            SCHEDULE.forEach(function (item) {
                (item.slots[dow] || []).forEach(function (t) {
                    const at = toSecs(t);
                    if (offset === 0 && at <= now.secs) return;
                    const wait = offset * 86400 + at - now.secs;
                    if (!best || wait < best.wait) best = { item: item, time: t, offset: offset, dow: dow, wait: wait };
                });
            });
        }
        return best;
    };

    const formatWait = function (s) {
        if (s >= 86400) {
            const d = Math.floor(s / 86400);
            return 'T−' + d + 'd ' + pad(Math.floor((s % 86400) / 3600)) + 'h ' + pad(Math.floor((s % 3600) / 60)) + 'm';
        }
        return 'T−' + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
    };
    const dayWord = function (next) {
        if (next.offset === 0) return 'Today';
        if (next.offset === 1) return 'Tomorrow';
        return DAY_SHORT[next.dow];
    };

    // ====================================================================
    // FEATURES THAT RUN WITH OR WITHOUT GSAP
    // ====================================================================

    /* Countdown to the next show, in the header, the channel sheet and the
       Programme page. Plain text that changes once a second. */
    function initClock() {
        const times = document.querySelectorAll('[data-clock-t]');
        if (!times.length) return;
        const whats = document.querySelectorAll('[data-clock-what]');
        const codes = document.querySelectorAll('[data-clock-code]');
        const titles = document.querySelectorAll('[data-clock-title]');
        const clocks = document.querySelectorAll('[data-clock]');
        let last = null;
        const tick = function () {
            const next = nextShow();
            if (!next) {
                clocks.forEach(function (c) { c.dataset.state = 'none'; });
                return;
            }
            const t = formatWait(next.wait);
            times.forEach(function (el) { el.textContent = t; });
            const key = next.item.id + next.offset + next.time;
            if (key === last) return;
            last = key;
            const when = dayWord(next) + ' ' + next.time;
            whats.forEach(function (el) { el.textContent = next.item.code + ' ' + next.item.title + ' · ' + when; });
            codes.forEach(function (el) { el.textContent = next.item.code + ' · ' + when; });
            titles.forEach(function (el) { el.textContent = next.item.title; });
            clocks.forEach(function (c) {
                c.dataset.state = 'live';
                c.setAttribute('aria-label', 'Next show: ' + next.item.title + ', ' + when);
            });
        };
        tick();
        setInterval(tick, 1000);
    }

    /* Visit page: today's row in the hours table and an open-now line. */
    function initHours() {
        const table = document.querySelector('[data-hours]');
        const open = document.querySelector('[data-open-now]');
        if (!table && !open) return;
        const now = stationNow();
        if (table) {
            const row = table.querySelector('[data-day="' + DAY_KEYS[now.dow] + '"]');
            if (row) row.classList.add('is-today');
        }
        if (!open) return;
        const text = open.querySelector('[data-open-text]') || open;
        const h = HOURS[now.dow];
        if (h && now.secs >= toSecs(h[0]) && now.secs < toSecs(h[1])) {
            open.dataset.open = 'yes';
            text.textContent = 'Open now until ' + h[1];
            return;
        }
        open.dataset.open = 'no';
        for (let i = 0; i < 8; i++) {
            const dow = (now.dow + i) % 7;
            const hh = HOURS[dow];
            if (!hh) continue;
            if (i === 0 && now.secs >= toSecs(hh[0])) continue;
            text.textContent = 'Closed now · opens ' + (i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAY_SHORT[dow]) + ' ' + hh[0];
            return;
        }
    }

    /* Page titles fill the frame. The markup carries a measured --em so the
       title is right before any script runs; this re-measures once the
       fonts are in, so a changed title still fits. */
    function initFit() {
        const fits = document.querySelectorAll('[data-fit]');
        if (!fits.length || !document.fonts || !document.fonts.ready) return;
        document.fonts.ready.then(function () {
            fits.forEach(function (el) {
                const size = parseFloat(getComputedStyle(el).fontSize);
                const range = document.createRange();
                range.selectNodeContents(el);
                const box = range.getBoundingClientRect();
                /* A title set up the side measures along its height */
                const w = getComputedStyle(el).writingMode.indexOf('vertical') === 0 ? box.height : box.width;
                if (!size || !w) return;
                el.style.setProperty('--em', (w / size).toFixed(3));
                const side = el.closest('.sidehead');
                if (side) side.style.setProperty('--em', (w / size).toFixed(3));
            });
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        });
    }

    initClock();
    initHours();

    /* Blocked CDN: take the gate off and leave a plain, complete page. */
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        root.classList.remove('has-js');
        initFit();
        return;
    }
    root.classList.add('js-ready');
    gsap.registerPlugin(ScrollTrigger);
    const hasFlip = typeof Flip !== 'undefined';
    if (hasFlip) gsap.registerPlugin(Flip);
    initFit();

    const previousContext = window.gsapContext;
    const ctx = gsap.context(function (rootContext) {
        const mm = gsap.matchMedia();
        const handlers = [];
        const killers = [];
        let mediaContext;

        /* Listeners added here are removed, and tweens they start are
           reverted, when the motion preference changes. */
        function on(el, type, fn, opts) {
            const listener = mediaContext.add(null, fn);
            el.addEventListener(type, listener, opts);
            handlers.push(function () { el.removeEventListener(type, listener, opts); });
        }

        // ================================================================
        // CHANNELS: the phone and tablet navigation sheet
        // ================================================================

        function initChannels() {
            const btn = document.querySelector('[data-channels-btn]');
            const sheet = document.querySelector('[data-channels]');
            if (!btn || !sheet) return;
            btn.hidden = false;
            const links = function () { return Array.from(sheet.querySelectorAll('a')); };
            const setOpen = function (open, returnFocus) {
                sheet.classList.toggle('is-open', open);
                btn.setAttribute('aria-expanded', String(open));
                if (open) {
                    const current = sheet.querySelector('[aria-current="page"]') || links()[0];
                    if (current) current.focus({ preventScroll: true });
                } else if (returnFocus) {
                    btn.focus({ preventScroll: true });
                }
            };
            on(btn, 'click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true', false); });
            on(document, 'keydown', function (e) {
                if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') setOpen(false, true);
            });
            /* A tap outside closes the sheet and does nothing else, so it
               cannot also follow a link that was sitting under the finger. */
            on(document, 'click', function (e) {
                if (btn.getAttribute('aria-expanded') !== 'true') return;
                if (sheet.contains(e.target) || btn.contains(e.target)) return;
                e.preventDefault();
                e.stopPropagation();
                setOpen(false, false);
            }, true);
            /* Tab past the last link closes the sheet back onto the button */
            on(sheet, 'focusout', function (e) {
                if (btn.getAttribute('aria-expanded') !== 'true') return;
                if (e.relatedTarget && !sheet.contains(e.relatedTarget) && e.relatedTarget !== btn) setOpen(false, false);
            });
            const wide = window.matchMedia('(min-width: 1100px)');
            const onWide = function () { if (wide.matches) setOpen(false, false); };
            on(wide, 'change', onWide);
            killers.push(function () { setOpen(false, false); });
        }

        // ================================================================
        // THE TUNING BAND: the needle follows hover and focus
        // ================================================================

        /* The needle rests on the current page (--needle, set in the
           markup) and slides to whichever station is hovered or focused,
           then back. CSS animates it; under reduced motion it stays put. */
        function initDial(nav, reduced) {
            if (!nav || reduced) return;
            const home = nav.style.getPropertyValue('--needle');
            const tune = function (at) { nav.style.setProperty('--needle', at); };
            nav.querySelectorAll('.dial__list li').forEach(function (li) {
                const a = li.querySelector('a');
                const at = li.style.getPropertyValue('--at');
                if (!a || !at) return;
                on(a, 'pointerenter', function () { tune(at); });
                on(a, 'focus', function () { tune(at); });
            });
            on(nav, 'pointerleave', function () { tune(home); });
            on(nav, 'focusout', function (e) { if (!nav.contains(e.relatedTarget)) tune(home); });
            killers.push(function () { tune(home); });
        }

        // ================================================================
        // INTRO AND REVEALS
        // ================================================================

        function initIntro(reduced) {
            const hero = document.querySelector('[data-hero]');
            if (!hero) return;
            const lines = hero.querySelectorAll('[data-title] .fit-line');
            const fades = hero.querySelectorAll('[data-hero-fade]');
            const leaders = hero.querySelectorAll('[data-leader]');
            if (reduced) {
                gsap.set(lines, { y: 0 });
                gsap.set(fades, { opacity: 1 });
                gsap.set(leaders, { scaleY: 1 });
                return;
            }
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            /* The CSS hides lines with translateY(105%), which GSAP reads as
               pixel y, so the tween targets y, not yPercent. */
            tl.to(lines, { y: 0, duration: 1, ease: 'power4.out' }, 0)
              .fromTo(fades, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.15)
              .to(leaders, { scaleY: 1, duration: 0.7, stagger: 0.08, ease: 'power2.inOut' }, 0.7);
        }

        function initReveals(reduced) {
            const singles = document.querySelectorAll('[data-reveal]');
            const groups = document.querySelectorAll('[data-reveal-group]');
            const leaders = Array.from(document.querySelectorAll('[data-leader]')).filter(function (el) { return !el.closest('[data-hero]'); });
            if (reduced) {
                gsap.set(singles, { opacity: 1 });
                groups.forEach(function (g) { gsap.set(g.children, { opacity: 1 }); });
                gsap.set(leaders, { scaleY: 1 });
                return;
            }
            if (singles.length) {
                ScrollTrigger.batch(singles, {
                    start: 'top 88%',
                    once: true,
                    onEnter: function (batch) {
                        gsap.fromTo(batch, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', overwrite: true });
                    }
                });
            }
            groups.forEach(function (group) {
                ScrollTrigger.create({
                    trigger: group,
                    start: 'top 88%',
                    once: true,
                    onEnter: function () {
                        gsap.fromTo(group.children, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' });
                    }
                });
            });
            leaders.forEach(function (el) {
                ScrollTrigger.create({
                    trigger: el.closest('.callouts') || el.parentElement,
                    start: 'top 75%',
                    once: true,
                    onEnter: function () { gsap.to(el, { scaleY: 1, duration: 0.8, ease: 'power2.inOut' }); }
                });
            });
        }

        // ================================================================
        // HOME: SLEW THE DISH
        // ================================================================

        /* The sky board is an alt-az chart: azimuth AZ_MIN..AZ_MAX left to
           right, elevation EL_TOP..EL_BOTTOM top to bottom. Targets carry
           data-az / data-el; positions and notes live in the markup. */
        const AZ_MIN = 60, AZ_MAX = 300, EL_TOP = 80, EL_BOTTOM = -6;
        const DISH_EL_MIN = 5;
        const SLEW_RATE = 37.5;   // degrees per second as shown (1.5 deg/s, 25 times faster)
        const LOCK_RADIUS = 4;    // degrees
        const TARGET_NOTES = {
            moon: { item: 'moonwatch', show: 'Moonwatch, Friday 19:00', note: 'Craters along the terminator through the 406 mm Dobsonian.' },
            jupiter: { item: 'giant-planets', show: 'Giant Planets, Thursday 19:30', note: 'The show ends at the telescopes on clear nights as Jupiter rises.' },
            saturn: { item: 'rings', show: "Saturn's Rings, Wednesday and Sunday 13:30", note: 'Due south on clear evenings this month, rings almost edge-on.' },
            andromeda: { item: 'deep-sky', show: 'Deep Sky Night, Friday and Saturday 20:00', note: '2.5 million light years away, and visible by eye from the headland.' },
            iss: { item: 'satellite-spotting', show: 'Satellite Spotting, Saturday 18:00', note: 'The station’s old job: call the passes as they cross.' }
        };

        function initSlew(rootEl, reduced) {
            if (!rootEl) return;
            const board = rootEl.querySelector('[data-board]');
            const reticle = rootEl.querySelector('[data-reticle]');
            const sight = rootEl.querySelector('[data-boresight]');
            if (!board || !reticle) return;
            const marks = Array.from(rootEl.querySelectorAll('[data-target]'));
            const targets = marks.map(function (m) {
                return { id: m.dataset.target, el: m, az: Number(m.dataset.az), elv: Number(m.dataset.el), name: m.textContent.trim() };
            });
            const dishG = rootEl.querySelector('[data-dish]');
            const needle = rootEl.querySelector('[data-needle]');
            const roAz = rootEl.querySelector('[data-ro-az]');
            const roEl = rootEl.querySelector('[data-ro-el]');
            const roSig = rootEl.querySelector('[data-ro-sig]');
            const spec = rootEl.querySelector('[data-spec]');
            const chips = {};
            rootEl.querySelectorAll('[data-chip]').forEach(function (c) { chips[c.dataset.chip] = c; });
            const lockCard = rootEl.querySelector('[data-lock]');
            const status = rootEl.querySelector('[data-slew-status]');
            const gotos = Array.from(rootEl.querySelectorAll('[data-goto]'));

            const cmd = { az: 180, el: 30 };
            const dish = { az: 180, el: 30 };
            let W = 1, H = 1, tween = null, dragging = false, locked = null;

            const clampAz = function (a) { return Math.min(AZ_MAX, Math.max(AZ_MIN, a)); };
            const clampEl = function (e) { return Math.min(EL_TOP, Math.max(DISH_EL_MIN, e)); };
            const toX = function (az) { return ((az - AZ_MIN) / (AZ_MAX - AZ_MIN)) * W; };
            const toY = function (el) { return ((EL_TOP - el) / (EL_TOP - EL_BOTTOM)) * H; };
            const sep = function (a, t) {
                const dAz = (a.az - t.az) * Math.cos(((a.el + t.elv) / 2) * Math.PI / 180);
                return Math.sqrt(dAz * dAz + (a.el - t.elv) * (a.el - t.elv));
            };
            const nearest = function (p) {
                let best = null, d = Infinity;
                targets.forEach(function (t) { const s = sep(p, t); if (s < d) { d = s; best = t; } });
                return { t: best, d: d };
            };
            const setChip = function (name) {
                Object.keys(chips).forEach(function (k) { chips[k].classList.toggle('is-on', k === name); });
            };

            /* A fixed noise floor so the trace does not shimmer at rest */
            const NOISE = [];
            for (let i = 0; i < 64; i++) NOISE.push(Math.sin(i * 12.9898) * 43758.5453 % 1);

            function render() {
                gsap.set(sight, { x: toX(dish.az), y: toY(dish.el) });
                if (dishG) dishG.setAttribute('transform', 'translate(150 92) rotate(' + (-dish.el).toFixed(2) + ')');
                if (needle) needle.setAttribute('transform', 'rotate(' + dish.az.toFixed(1) + ')');
                if (roAz) roAz.firstChild.nodeValue = dish.az.toFixed(1);
                if (roEl) roEl.firstChild.nodeValue = dish.el.toFixed(1);
                const n = nearest(dish);
                const sig = Math.exp(-Math.pow(n.d / 6, 2));
                if (roSig) roSig.textContent = 'SNR ' + (0.8 + sig * 22.4).toFixed(1) + ' dB';
                if (spec) {
                    let pts = '';
                    for (let i = 0; i < 64; i++) {
                        const x = (i * 200 / 63);
                        const peak = Math.exp(-Math.pow((i - 31.5) / 4.5, 2)) * sig * 38;
                        pts += x.toFixed(1) + ',' + (46 + NOISE[i] * 4.5 - peak).toFixed(1) + ' ';
                    }
                    spec.setAttribute('points', pts.trim());
                }
                targets.forEach(function (t) { t.el.classList.toggle('is-near', sep(dish, t) < 8); });
            }
            function placeReticle() { gsap.set(reticle, { x: toX(cmd.az), y: toY(cmd.el) }); }

            function showLock(t) {
                locked = t;
                targets.forEach(function (x) { x.el.classList.toggle('is-lock', x === t); });
                gotos.forEach(function (b) { b.setAttribute('aria-pressed', String(!!t && b.dataset.goto === t.id)); });
                if (!lockCard) return;
                if (!t) { lockCard.hidden = true; return; }
                const info = TARGET_NOTES[t.id] || {};
                lockCard.querySelector('[data-lock-k]').textContent = 'Locked · AZ ' + Math.round(dish.az) + '° EL ' + Math.round(dish.el) + '°';
                lockCard.querySelector('[data-lock-t]').textContent = t.name;
                lockCard.querySelector('[data-lock-note]').textContent = (info.note || '') + ' On the programme: ' + (info.show || 'see this week') + '.';
                const link = lockCard.querySelector('[data-lock-link]');
                link.href = 'programme.html#' + (info.item || '');
                link.textContent = 'Open ' + (info.show ? info.show.split(',')[0] : 'the programme');
                const wasHidden = lockCard.hidden;
                lockCard.hidden = false;
                if (wasHidden && !reduced) gsap.fromTo(lockCard, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
            }

            function settle() {
                tween = null;
                const n = nearest(dish);
                if (n.d <= LOCK_RADIUS) {
                    setChip('lock');
                    showLock(n.t);
                    if (status) status.textContent = 'Locked on ' + n.t.name + '. Azimuth ' + Math.round(dish.az) + ', elevation ' + Math.round(dish.el) + '.';
                } else {
                    setChip('track');
                    showLock(null);
                    if (status) status.textContent = 'On target at azimuth ' + Math.round(dish.az) + ', elevation ' + Math.round(dish.el) + '. Nearest: ' + n.t.name + '.';
                }
            }

            function slew() {
                placeReticle();
                if (tween) tween.kill();
                const d = Math.hypot(cmd.az - dish.az, cmd.el - dish.el);
                if (d < 0.05) { render(); settle(); return; }
                if (locked) showLock(null);
                setChip('slew');
                if (reduced) {
                    dish.az = cmd.az; dish.el = cmd.el;
                    render(); settle();
                    return;
                }
                tween = gsap.to(dish, {
                    az: cmd.az, el: cmd.el,
                    duration: Math.min(3, Math.max(0.25, d / SLEW_RATE)),
                    ease: 'power2.inOut',
                    onUpdate: render,
                    onComplete: settle
                });
            }

            function measure() {
                W = board.clientWidth; H = board.clientHeight;
                placeReticle(); render();
            }

            /* Pointer: press anywhere to point, drag to follow. Coordinates come
               from the raw event, and the board has touch-action: none. */
            const fromEvent = function (e) {
                const r = board.getBoundingClientRect();
                const x = Math.min(r.width, Math.max(0, e.clientX - r.left));
                const y = Math.min(r.height, Math.max(0, e.clientY - r.top));
                cmd.az = clampAz(AZ_MIN + (x / r.width) * (AZ_MAX - AZ_MIN));
                cmd.el = clampEl(EL_TOP - (y / r.height) * (EL_TOP - EL_BOTTOM));
            };
            on(board, 'pointerdown', function (e) {
                if (e.button !== undefined && e.button > 0) return;
                dragging = true;
                try { board.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
                fromEvent(e); slew();
            });
            on(board, 'pointermove', function (e) {
                if (!dragging) return;
                fromEvent(e); slew();
            });
            const end = function () { dragging = false; };
            on(board, 'pointerup', end);
            on(board, 'pointercancel', end);

            on(board, 'keydown', function (e) {
                const step = e.shiftKey ? 5 : 1;
                let handled = true;
                if (e.key === 'ArrowLeft') cmd.az = clampAz(cmd.az - step);
                else if (e.key === 'ArrowRight') cmd.az = clampAz(cmd.az + step);
                else if (e.key === 'ArrowUp') cmd.el = clampEl(cmd.el + step);
                else if (e.key === 'ArrowDown') cmd.el = clampEl(cmd.el - step);
                else if (e.key === 'Enter' || e.key === ' ') {
                    const n = nearest(cmd);
                    if (n.t) { cmd.az = n.t.az; cmd.el = clampEl(n.t.elv); }
                } else handled = false;
                if (!handled) return;
                e.preventDefault();
                slew();
            });

            /* The target list: links to the programme without JS, slew buttons with it */
            gotos.forEach(function (b) {
                b.setAttribute('role', 'button');
                b.setAttribute('aria-pressed', 'false');
                on(b, 'click', function (e) {
                    const t = targets.find(function (x) { return x.id === b.dataset.goto; });
                    if (!t) return;
                    e.preventDefault();
                    cmd.az = t.az; cmd.el = clampEl(t.elv);
                    slew();
                });
                on(b, 'keydown', function (e) {
                    if (e.key === ' ') { e.preventDefault(); b.click(); }
                });
            });

            measure();
            setChip('idle');
            const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
            if (ro) ro.observe(board); else on(window, 'resize', measure);
            killers.push(function () {
                if (ro) ro.disconnect();
                if (tween) tween.kill();
            });
        }

        // ================================================================
        // PROGRAMME: filters that re-sort the week
        // ================================================================

        function initProgramme(rootEl, reduced) {
            if (!rootEl) return;
            const sched = document.querySelector('[data-sched]');
            if (!sched) return;
            const rows = Array.from(sched.querySelectorAll('[data-item]'));
            const original = rows.slice();
            const typeBtns = Array.from(rootEl.querySelectorAll('[data-filter-type]'));
            const dayBtns = Array.from(rootEl.querySelectorAll('[data-filter-day]'));
            const count = rootEl.querySelector('[data-count]');
            const empty = sched.querySelector('[data-empty]');
            const reset = sched.querySelector('[data-filter-reset]');
            const byId = {};
            SCHEDULE.forEach(function (s) { byId[s.id] = s; });
            const state = { type: 'all', day: 'all' };

            const firstTime = function (row, dayKey) {
                const s = byId[row.id];
                const dow = DAY_KEYS.indexOf(dayKey);
                const slots = s && s.slots[dow];
                return slots && slots.length ? Math.min.apply(null, slots.map(toSecs)) : 99999;
            };

            function apply(animate) {
                const flipState = animate && hasFlip && !reduced ? Flip.getState(rows) : null;
                const before = sched.offsetHeight;
                const order = state.day === 'all' ? original.slice()
                    : original.slice().sort(function (a, b) { return firstTime(a, state.day) - firstTime(b, state.day); });
                let shown = 0;
                order.forEach(function (row) {
                    const okType = state.type === 'all' || row.dataset.type === state.type;
                    const okDay = state.day === 'all' || row.dataset.days.split(' ').indexOf(state.day) > -1;
                    row.style.display = okType && okDay ? '' : 'none';
                    if (okType && okDay) shown++;
                    sched.insertBefore(row, empty);
                });
                if (empty) empty.hidden = shown > 0;
                if (count) count.textContent = shown + ' of ' + rows.length + ' sessions';
                typeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filterType === state.type)); });
                dayBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filterDay === state.day)); });
                if (!flipState) return;
                /* Hold the list's height while rows move, so the page below
                   does not jump, then let it settle. */
                sched.style.minHeight = before + 'px';
                Flip.from(flipState, {
                    duration: 0.6,
                    ease: 'power3.inOut',
                    stagger: 0.02,
                    onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.45, delay: 0.15 }); },
                    onComplete: function () { gsap.to(sched, { minHeight: 0, duration: 0.3, clearProps: 'minHeight' }); }
                });
            }
            typeBtns.forEach(function (b) { on(b, 'click', function () { state.type = b.dataset.filterType; apply(true); }); });
            dayBtns.forEach(function (b) { on(b, 'click', function () { state.day = b.dataset.filterDay; apply(true); }); });
            if (reset) on(reset, 'click', function () { state.type = 'all'; state.day = 'all'; apply(true); });
            apply(false);
            killers.push(function () {
                rows.forEach(function (r) { r.style.display = ''; });
                original.forEach(function (r) { sched.insertBefore(r, empty); });
                sched.style.minHeight = '';
            });
        }

        // ================================================================
        // INSTRUMENTS: tabbed spec sheets, numerals that count
        // ================================================================

        const formatNum = function (v, dec) {
            return Number(v).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        };

        function initInstruments(rootEl, reduced) {
            if (!rootEl) return;
            const tabs = Array.from(rootEl.querySelectorAll('[data-itab]'));
            const panels = Array.from(rootEl.querySelectorAll('[data-ipanel]'));
            if (!tabs.length || tabs.length !== panels.length) return;

            function count(panel) {
                panel.querySelectorAll('[data-count]').forEach(function (el) {
                    const end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0);
                    if (reduced || isNaN(end)) { el.textContent = formatNum(end, dec); return; }
                    const p = { v: 0 };
                    gsap.to(p, {
                        v: end, duration: 0.9, ease: 'power2.out',
                        onUpdate: function () { el.textContent = formatNum(p.v, dec); }
                    });
                });
            }
            function select(i, focus) {
                tabs.forEach(function (t, j) {
                    const on2 = i === j;
                    t.setAttribute('aria-selected', String(on2));
                    t.tabIndex = on2 ? 0 : -1;
                    panels[j].hidden = !on2;
                });
                if (focus) tabs[i].focus();
                const panel = panels[i];
                count(panel);
                if (!reduced) {
                    const img = panel.querySelector('.shot img');
                    if (img) gsap.fromTo(img, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
                    gsap.fromTo(panel.querySelectorAll('.spec__row'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
                }
            }
            tabs.forEach(function (t, i) {
                on(t, 'click', function () { select(i, false); });
                on(t, 'keydown', function (e) {
                    let j = -1;
                    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
                    else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
                    else if (e.key === 'Home') j = 0;
                    else if (e.key === 'End') j = tabs.length - 1;
                    if (j < 0) return;
                    e.preventDefault();
                    select(j, true);
                });
            });
            /* A link such as instruments.html#control-room opens that sheet */
            const fromHash = panels.findIndex(function (p) { return '#' + p.id === location.hash; });
            const start = fromHash > -1 ? fromHash : 0;
            tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(j === start)); t.tabIndex = j === start ? 0 : -1; panels[j].hidden = j !== start; });
            if (fromHash > -1) count(panels[start]);
            killers.push(function () { panels.forEach(function (p) { p.hidden = false; }); });
        }

        function initDrawing(rootEl) {
            if (!rootEl) return;
            const range = rootEl.querySelector('[data-dw-range]');
            const dishG = rootEl.querySelector('[data-dw-dish]');
            const out = rootEl.querySelector('[data-dw-out]');
            const label = rootEl.querySelector('[data-dw-label]');
            const note = rootEl.querySelector('[data-dw-note]');
            if (!range || !dishG) return;
            const say = function (v) {
                if (v >= 88) return 'Parked: straight up, the position for gales and for the night it closed in 2008.';
                if (v >= 60) return 'High: overhead objects, and the angle for checking the panels from the gantry.';
                if (v >= 20) return 'Mid-sky: the angle it uses for hydrogen along the Milky Way.';
                return 'Low: skimming the sea horizon, where the old satellites first came up.';
            };
            const update = function () {
                const v = Number(range.value);
                dishG.setAttribute('transform', 'translate(400 262) rotate(' + (-v) + ')');
                if (out) out.textContent = v;
                if (label) label.textContent = 'ELEVATION ' + v + '° · RANGE 5° TO 90°';
                if (note) note.textContent = say(v);
            };
            on(range, 'input', update);
            update();
        }

        // ================================================================
        // VISIT: route map, red-light mode
        // ================================================================

        /* MapLibre loads only when the map nears the viewport. Change these
           URLs for another version or a self-hosted copy. Without it, the
           OpenStreetMap link in the markup stays. */
        const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
        const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
        const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
        let mapLibreLoading = null;
        const loadMapLibre = function () {
            if (typeof maplibregl !== 'undefined') return Promise.resolve();
            if (mapLibreLoading) return mapLibreLoading;
            mapLibreLoading = new Promise(function (resolve) {
                let pending = 2;
                const settle = function () { pending -= 1; if (!pending) resolve(); };
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = MAPLIBRE_CSS;
                link.onload = link.onerror = settle;
                const script = document.createElement('script');
                script.src = MAPLIBRE_JS;
                script.onload = script.onerror = settle;
                document.head.appendChild(link);
                document.head.appendChild(script);
            });
            return mapLibreLoading;
        };

        function initRoutes(rootEl, reduced) {
            if (!rootEl) return;
            const tabs = Array.from(rootEl.querySelectorAll('[data-route-tab]'));
            const canvas = rootEl.querySelector('[data-map-canvas]');
            if (!tabs.length) return;
            let ROUTES = {};
            try { ROUTES = JSON.parse(rootEl.dataset.routeJson); } catch (err) { ROUTES = {}; }
            const PIN = (rootEl.dataset.pin || '0,0').split(',').map(Number);
            const LINE = getComputedStyle(root).getPropertyValue('--signal').trim() || '#EE5A1C';
            const START = { car: 'Helston', foot: 'Coverack harbour' };
            let map = null, ready = false, current = tabs[0].dataset.routeTab;
            const progress = {};

            const lineData = function (k) {
                const c = ROUTES[k] || [];
                const n = Math.max(2, Math.round(c.length * (progress[k] === undefined ? 1 : progress[k])));
                return { type: 'Feature', geometry: { type: 'LineString', coordinates: c.slice(0, n) } };
            };
            function show(name, animate, focus) {
                current = name;
                tabs.forEach(function (t) {
                    const sel = t.dataset.routeTab === name;
                    t.setAttribute('aria-expanded', String(sel));
                    if (sel && focus) t.focus();
                    const panel = rootEl.querySelector('[data-route-panel="' + t.dataset.routeTab + '"]');
                    if (panel) panel.hidden = !sel;
                });
                if (!ready) return;
                const move = animate && !reduced;
                const b = new maplibregl.LngLatBounds(PIN, PIN);
                (ROUTES[name] || []).forEach(function (c) { b.extend(c); });
                const narrow = canvas.clientWidth < 600;
                map.fitBounds(b, { padding: narrow ? { top: 56, bottom: 30, left: 30, right: 100 } : { top: 70, bottom: 50, left: 60, right: 140 }, duration: move ? 900 : 0, maxZoom: 15.5 });
                Object.keys(ROUTES).forEach(function (k) {
                    const active = k === name;
                    gsap.killTweensOf(progress, k);
                    map.setLayoutProperty('route-' + k, 'visibility', active ? 'visible' : 'none');
                    progress[k] = active && move ? 0 : 1;
                    map.getSource('route-' + k).setData(lineData(k));
                    if (!active || !move) return;
                    const tw = {};
                    tw[k] = 1;
                    gsap.to(progress, Object.assign(tw, {
                        duration: 1.4, ease: 'power2.inOut', delay: 0.3,
                        onUpdate: function () { if (map) map.getSource('route-' + k).setData(lineData(k)); }
                    }));
                });
            }
            tabs.forEach(function (t, i) {
                on(t, 'click', function () { show(t.dataset.routeTab, true, false); });
                on(t, 'keydown', function (e) {
                    let j = -1;
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % tabs.length;
                    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
                    if (j < 0) return;
                    e.preventDefault();
                    show(tabs[j].dataset.routeTab, true, true);
                });
            });
            show(current, false, false);
            if (!canvas) return;

            let alive = true, io = null;
            const ctx2 = mediaContext;
            killers.push(function () {
                alive = false;
                if (io) io.disconnect();
                gsap.killTweensOf(progress);
                if (map) map.remove();
                map = null; ready = false;
            });
            const buildMap = function () {
                if (typeof maplibregl === 'undefined' || !alive) return;
                try {
                    map = new maplibregl.Map({
                        container: canvas, style: MAP_STYLE, center: PIN, zoom: 13,
                        cooperativeGestures: true, dragRotate: false, pitchWithRotate: false,
                        attributionControl: { compact: true }
                    });
                } catch (err) { return; }
                const fb = canvas.querySelector('.map__fallback');
                if (fb) fb.remove();
                map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
                map.touchZoomRotate.disableRotation();
                const marker = function (at, cls, label, html) {
                    const el = document.createElement('div');
                    el.className = cls;
                    el.setAttribute('aria-hidden', 'true');
                    el.title = label;
                    if (html) el.innerHTML = html;
                    return new maplibregl.Marker({ element: el, anchor: cls === 'map-pin' ? 'bottom' : 'center' }).setLngLat(at).addTo(map);
                };
                Object.keys(ROUTES).forEach(function (k) { if (ROUTES[k].length) marker(ROUTES[k][0], 'map-stop', START[k] || k); });
                marker(PIN, 'map-pin', 'Carrick Head', '<span>Carrick Head</span>');
                map.on('load', function () {
                    map.resize();
                    const attrib = canvas.querySelector('.maplibregl-ctrl-attrib');
                    if (attrib) attrib.classList.remove('maplibregl-compact-show');
                    Object.keys(ROUTES).forEach(function (k) {
                        progress[k] = 1;
                        map.addSource('route-' + k, { type: 'geojson', data: lineData(k) });
                        map.addLayer({
                            id: 'route-' + k, type: 'line', source: 'route-' + k,
                            layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
                            paint: { 'line-color': LINE, 'line-width': 5 }
                        });
                    });
                    ready = true;
                    show(current, false, false);
                });
                ScrollTrigger.create({ trigger: canvas, start: 'top 75%', once: true, onEnter: function () { show(current, true, false); } });
            };
            const go = function () { loadMapLibre().then(function () { if (alive) ctx2.add(buildMap); }); };
            if (typeof IntersectionObserver === 'undefined') { go(); return; }
            io = new IntersectionObserver(function (entries) {
                if (!entries.some(function (e) { return e.isIntersecting; })) return;
                io.disconnect(); io = null;
                go();
            }, { rootMargin: '50% 0px' });
            io.observe(canvas);
        }

        /* Red-light mode swaps the token set (see :root[data-night] in the
           stylesheet). It lasts for this page view only. */
        function initNight(btn) {
            if (!btn) return;
            const meta = document.querySelector('meta[name="theme-color"]');
            const set = function (onNight) {
                if (onNight) root.setAttribute('data-night', '');
                else root.removeAttribute('data-night');
                btn.setAttribute('aria-pressed', String(onNight));
                if (meta) meta.setAttribute('content', onNight ? '#0C0605' : '#EFEBE1');
            };
            on(btn, 'click', function () { set(!root.hasAttribute('data-night')); });
            killers.push(function () { set(false); });
        }

        // ================================================================
        // SCHOOLS: visit planner and enquiry
        // ================================================================

        const SESSIONS = {
            dome: { name: 'Planetarium show', place: 'Dome', mins: 35, sw: 'var(--sea)', ink: 'var(--on-sea)', small: 'Tonight’s Sky, 35 min' },
            mission: { name: 'Mission Sim', place: 'Control room', mins: 60, sw: 'var(--stone)', ink: '#16150F', small: 'Control room, 60 min, 16 at a time' },
            dish: { name: 'Dish workshop', place: 'Dish hut', mins: 45, sw: 'var(--signal)', ink: '#EFEBE1', small: 'Steer Dish One, 45 min' },
            rocket: { name: 'Rocket Lab', place: 'Outside', mins: 50, sw: 'var(--sea-2)', ink: '#16150F', small: 'Car park, 50 min' }
        };
        const RATIO = { ks1: 6, ks2: 10, ks3: 15, ks4: 15 };
        const PRICE = { base: 8.5, extraWorkshop: 2, minimum: 170 };

        const hhmm = function (mins) { return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); };
        const money = function (v) { return '£' + (v % 1 ? v.toFixed(2) : String(v)); };

        function initPlanner(form, reduced) {
            if (!form) return;
            const year = form.querySelector('[data-pl-year]');
            const size = form.querySelector('[data-pl-size]');
            const sizeOut = form.querySelector('[data-pl-size-out]');
            const boxes = Array.from(form.querySelectorAll('[data-pl-session]'));
            const day = form.querySelector('[data-pl-day]');
            const groups = form.querySelector('[data-pl-groups]');
            const note = form.querySelector('[data-pl-note]');
            const pp = form.querySelector('[data-pl-pp]');
            const total = form.querySelector('[data-pl-total]');
            const adults = form.querySelector('[data-pl-adults]');
            const msg = form.querySelector('[data-form-msg]');
            if (!year || !size || !day) return;

            function build(animate) {
                const n = Number(size.value);
                if (sizeOut) sizeOut.textContent = n;
                const chosen = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.dataset.plSession; });
                const workshops = chosen.filter(function (k) { return k !== 'dome'; });
                let t = 10 * 60;
                const items = [['10:00', 'Arrive and welcome', 'Coats, toilets, a word about the cliff', 'Gate', '', '']];
                t += 20;
                let lunch = false;
                ['dome'].concat(workshops).forEach(function (k) {
                    if (!lunch && t >= 12 * 60) {
                        items.push([hhmm(t), 'Lunch', 'Indoors in the hall if it rains', 'Hall', '', '']);
                        t += 30; lunch = true;
                    }
                    const s = SESSIONS[k];
                    items.push([hhmm(t), s.name, s.small, s.place, s.sw, s.ink]);
                    t += s.mins + 10;
                });
                if (!lunch) { items.push([hhmm(t), 'Lunch', 'Indoors in the hall if it rains', 'Hall', '', '']); t += 30; }
                items.push([hhmm(t), 'Depart', 'Coaches load at the gate', 'Gate', '', '']);
                day.innerHTML = items.map(function (r) {
                    const style = r[4] ? ' style="--sw:' + r[4] + ';--sw-ink:' + r[5] + '"' : '';
                    return '<li><time>' + r[0] + '</time><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span><span class="tag"' + style + '>' + r[3] + '</span></li>';
                }).join('');
                const g = Math.ceil(n / 30);
                if (groups) groups.textContent = g === 1 ? 'One group of ' + n : g + ' groups rotating, about ' + Math.ceil(n / g) + ' each';
                const ratio = RATIO[year.value] || 10;
                const free = Math.ceil(n / ratio);
                const per = PRICE.base + Math.max(0, workshops.length - 1) * PRICE.extraWorkshop;
                const sum = Math.max(PRICE.minimum, per * n);
                if (pp) pp.textContent = money(per);
                if (total) total.textContent = money(Math.round(sum * 100) / 100);
                if (adults) adults.textContent = free;
                if (note) {
                    note.textContent = 'Adults free at one to every ' + ratio + ' pupils.'
                        + (workshops.indexOf('mission') > -1 && n > 16 ? ' Mission Sim takes 16 at a time; the rest run the console trail alongside.' : '')
                        + (sum === PRICE.minimum && per * n < PRICE.minimum ? ' Minimum booking ' + money(PRICE.minimum) + '.' : '');
                }
                if (animate && !reduced) {
                    gsap.fromTo(day.children, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
                }
            }
            on(year, 'change', function () { build(true); });
            on(size, 'input', function () { build(false); });
            boxes.forEach(function (b) { on(b, 'change', function () { build(true); }); });
            build(false);

            /* Front end only: the enquiry is not sent anywhere until you wire
               the form to your inbox or booking system (README, "Forms"). */
            on(form, 'submit', function (e) {
                e.preventDefault();
                if (!form.checkValidity()) { form.reportValidity(); return; }
                const name = (form.querySelector('[name="name"]') || {}).value || '';
                if (msg) msg.textContent = 'Thank you' + (name ? ', ' + name.split(' ')[0] : '') + '. The learning team replies within two school days.';
            });
        }

        // ================================================================
        // SUPPORT: adopt a dish panel, donate
        // ================================================================

        function initAdopt(rootEl) {
            if (!rootEl) return;
            const svg = rootEl.querySelector('[data-adopt-svg]');
            const ringSel = rootEl.querySelector('[data-adopt-ring]');
            const panelIn = rootEl.querySelector('[data-adopt-panel]');
            const code = rootEl.querySelector('[data-adopt-code]');
            const stateEl = rootEl.querySelector('[data-adopt-state]');
            const plate = rootEl.querySelector('[data-adopt-plate]');
            const nameIn = rootEl.querySelector('[data-adopt-name]');
            const link = rootEl.querySelector('[data-adopt-link]');
            if (!svg) return;
            const paths = Array.from(svg.querySelectorAll('[data-panel]'));
            const byKey = {};
            const ringSize = {};
            paths.forEach(function (p) {
                byKey[p.dataset.panel] = p;
                const r = p.dataset.panel.split('-')[0];
                ringSize[r] = (ringSize[r] || 0) + 1;
            });
            let sel = null;

            function select(key, sync) {
                const p = byKey[key];
                if (!p) return;
                if (sel) sel.classList.remove('p-sel');
                sel = p;
                const free = p.classList.contains('p-free');
                if (free) p.classList.add('p-sel');
                const parts = key.split('-');
                const label = 'R' + parts[0] + '-' + pad(parts[1]);
                if (code) code.textContent = label;
                if (stateEl) stateEl.textContent = free ? 'Free panel · ring ' + parts[0] : 'Already adopted · pick a pale panel';
                if (link) {
                    link.textContent = free ? 'Adopt ' + label + ' · £60' : 'Choose a free panel';
                    link.href = 'mailto:members@carrickhead.org?subject=' + encodeURIComponent('Adopt panel ' + label);
                    link.setAttribute('aria-disabled', String(!free));
                }
                if (sync) {
                    if (ringSel) ringSel.value = parts[0];
                    if (panelIn) { panelIn.max = ringSize[parts[0]]; panelIn.value = parts[1]; }
                }
            }
            const fromControls = function () {
                const r = ringSel ? ringSel.value : '1';
                if (panelIn) panelIn.max = ringSize[r];
                const n = Math.min(ringSize[r], Math.max(1, Number(panelIn ? panelIn.value : 1) || 1));
                select(r + '-' + n, false);
            };
            on(svg, 'click', function (e) {
                const p = e.target.closest('[data-panel]');
                if (p) select(p.dataset.panel, true);
            });
            if (ringSel) on(ringSel, 'change', fromControls);
            if (panelIn) on(panelIn, 'input', fromControls);
            if (nameIn && plate) on(nameIn, 'input', function () { plate.textContent = nameIn.value.trim() || 'Your name here'; });
            if (link) on(link, 'click', function (e) { if (link.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

            /* Start on the first free panel from R4-17 onwards */
            const start = ['4-17'].concat(Object.keys(byKey)).find(function (k) { return byKey[k] && byKey[k].classList.contains('p-free'); });
            if (start) select(start, true);
            killers.push(function () { if (sel) sel.classList.remove('p-sel'); });
        }

        const GIFT_SAYS = {
            10: '£10 buys a tub of bearing grease for the azimuth ring.',
            25: '£25 keeps the drives running for nearly a day.',
            50: '£50 repaints one dish panel, primer and all.',
            100: '£100 pays for a school class’s coach from Helston.'
        };
        function initDonate(form) {
            if (!form) return;
            const says = form.querySelector('[data-donate-says]');
            const msg = form.querySelector('[data-donate-msg]');
            form.querySelectorAll('input[name="amount"]').forEach(function (r) {
                on(r, 'change', function () { if (says && GIFT_SAYS[r.value]) says.textContent = GIFT_SAYS[r.value]; });
            });
            /* Front end only: send this to your payment provider (README, "Forms"). */
            on(form, 'submit', function (e) {
                e.preventDefault();
                const r = form.querySelector('input[name="amount"]:checked');
                if (msg) msg.textContent = 'Thank you. Your £' + (r ? r.value : '') + ' gift goes to the dish fund.';
            });
        }

        // ================================================================
        // MOTION BRANCHES
        // ================================================================

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            const reduced = !context.conditions.isMotion;
            mediaContext = context;

            initChannels();
            initDial(document.querySelector('[data-dial]'), reduced);
            initIntro(reduced);
            initReveals(reduced);
            initSlew(document.querySelector('[data-slew]'), reduced);
            initProgramme(document.querySelector('[data-filters]'), reduced);
            initInstruments(document.querySelector('[data-instruments]'), reduced);
            initDrawing(document.querySelector('[data-drawing]'));
            initRoutes(document.querySelector('[data-routes]'), reduced);
            initNight(document.querySelector('[data-night-toggle]'));
            initPlanner(document.querySelector('[data-planner]'), reduced);
            initAdopt(document.querySelector('[data-adopt]'));
            initDonate(document.querySelector('[data-donate]'));

            return function cleanup() {
                handlers.forEach(function (remove) { remove(); });
                handlers.length = 0;
                killers.forEach(function (kill) { kill(); });
                killers.length = 0;
            };
        });

        return function cleanupPage() {
            if (window.gsapContext === rootContext) {
                root.classList.remove('has-js');
                if (previousContext === undefined) delete window.gsapContext;
                else window.gsapContext = previousContext;
            }
        };
    });
    window.gsapContext = ctx;
});
