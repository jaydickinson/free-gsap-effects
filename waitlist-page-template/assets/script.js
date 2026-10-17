/**
 * Waitlist Page Template
 *
 * One script, one gsap.context. The page is a radio: the knob, the dial
 * window, the keyboard (a native range input) and the station strip all
 * drive one frequency value, and everything else is drawn from it.
 *
 * Content lives in the markup: each <li data-station data-freq data-name>
 * is a station. The printed scale, its markers and the station strip are
 * built from that list, so adding or removing a station needs no JS edits.
 * The last station is launch day and holds the sign-up form.
 *
 * @plugins none (GSAP core only)
 */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initTemplate() {

    /* If the CDN is blocked, leave the plain page: every station listed and
       an ordinary form. */
    if (typeof gsap === 'undefined') {
        document.documentElement.classList.remove('has-js');
        return;
    }
    document.documentElement.classList.add('js-ready');

    /* ------------------------------------------------------------------
       SETTINGS: the band and the feel of the knob
       ------------------------------------------------------------------ */
    const BAND_MIN = 87.5;          // MHz at the left end of the scale
    const BAND_MAX = 108;           // MHz at the right end
    const DEG_PER_MHZ = 44;         // knob rotation per MHz (about 2.5 turns end to end)
    const CAPTURE = 0.55;           // MHz either side of a station where the signal starts
    const DETENT = 0.28;            // MHz either side where the knob is gently pulled in
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SCALE_W = 1000;           // the scale's viewBox width
    const SCALE_PAD = 60;           // viewBox units left free at each end

    const root = document.querySelector('[data-radio]');
    const panel = document.querySelector('[data-panel]');
    if (!root || !panel) return;

    const stationEls = Array.from(panel.querySelectorAll('[data-station]'));
    if (!stationEls.length) return;
    const stations = stationEls.map(function (el) {
        return { el: el, id: el.id, freq: parseFloat(el.dataset.freq), name: el.dataset.name || el.id };
    }).sort(function (a, b) { return a.freq - b.freq; });
    const launch = stations[stations.length - 1];

    const dial = root.querySelector('[data-dial]');
    const scaleSvg = root.querySelector('[data-scale]');
    const needle = root.querySelector('[data-needle]');
    const knob = root.querySelector('[data-knob]');
    const knobImg = knob ? knob.querySelector('img') : null;
    const lamp = root.querySelector('[data-lamp]');
    const key = root.querySelector('[data-key]');
    const tuner = root.querySelector('[data-tuner]');
    const strip = document.querySelector('[data-strip]');
    const hint = document.querySelector('[data-hint]');
    const readFreq = panel.querySelector('[data-readout-freq]');
    const readName = panel.querySelector('[data-readout-name]');
    const bars = Array.from(panel.querySelectorAll('[data-readout-bars] i'));
    const staticCanvas = panel.querySelector('[data-static]');
    const live = panel.querySelector('[data-live]');
    const form = panel.querySelector('[data-signup]');

    const clamp = function (v) { return Math.min(BAND_MAX, Math.max(BAND_MIN, v)); };
    const toX = function (f) { return SCALE_PAD + (f - BAND_MIN) / (BAND_MAX - BAND_MIN) * (SCALE_W - SCALE_PAD * 2); };
    const fmt = function (f) { return (Math.round(f * 10) / 10).toFixed(1); };

    function nearest(f) {
        let best = stations[0];
        stations.forEach(function (s) { if (Math.abs(s.freq - f) < Math.abs(best.freq - f)) best = s; });
        return best;
    }

    /* ------------------------------------------------------------------
       PRINTED SCALE, built from the station list
       ------------------------------------------------------------------ */
    function svgEl(name, attrs, text) {
        const n = document.createElementNS(SVG_NS, name);
        Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        if (text) n.textContent = text;
        return n;
    }

    /* Compact scale for small dials: numerals every 4 MHz, set larger, and no
       station names (the strip under the radio carries them). */
    let scaleCompact = null;
    function buildScale() {
        if (!scaleSvg || !dial) return;
        const compact = dial.clientWidth > 0 && dial.clientWidth < 300;
        if (compact === scaleCompact) return;
        scaleCompact = compact;
        scaleSvg.textContent = '';
        scaleSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        const ink = 'var(--print)';
        const mono = 'Spline Sans Mono, monospace';
        const g = svgEl('g', { fill: ink, stroke: ink });
        const numEvery = compact ? 4 : 2;
        g.appendChild(svgEl('line', { x1: toX(BAND_MIN), x2: toX(BAND_MAX), y1: 150, y2: 150, 'stroke-width': 2.5 }));
        for (let t = Math.ceil(BAND_MIN * 5); t <= BAND_MAX * 5; t++) {
            const f = t / 5;
            const major = Math.abs(f - Math.round(f)) < 0.001;
            if (compact && !major) continue;
            const x = toX(f);
            g.appendChild(svgEl('line', { x1: x, x2: x, y1: 150, y2: major ? 110 : 132, 'stroke-width': major ? (compact ? 4 : 2.5) : 1.4 }));
            if (major && (Math.round(f) - 88) % numEvery === 0) {
                g.appendChild(svgEl('text', { x: x, y: compact ? 96 : 92, 'text-anchor': 'middle', 'font-size': compact ? 62 : 34, 'font-family': mono, stroke: 'none' }, String(Math.round(f))));
            }
        }
        if (!compact) {
            g.appendChild(svgEl('text', { x: 10, y: 222, 'font-size': 22, 'font-family': mono, stroke: 'none' }, 'FM'));
            g.appendChild(svgEl('text', { x: SCALE_W - 10, y: 222, 'text-anchor': 'end', 'font-size': 20, 'font-family': mono, stroke: 'none' }, 'MHz'));
        }
        stations.forEach(function (s) {
            const x = toX(s.freq);
            const m = compact ? 16 : 9;
            g.appendChild(svgEl('path', { d: 'M' + (x - m) + ' 180 L' + (x + m) + ' 180 L' + x + ' ' + (180 - m * 1.8) + ' Z', fill: 'var(--signal)', stroke: 'none' }));
            s.label = null;
            if (!compact) {
                s.label = svgEl('text', { x: x, y: 222, 'text-anchor': 'middle', 'font-size': 27, 'font-family': 'Rethink Sans, sans-serif', 'font-weight': 700, stroke: 'none', class: 'dial__label' }, s.name);
                g.appendChild(s.label);
            }
        });
        scaleSvg.appendChild(g);
    }

    /* Station strip under the radio, rebuilt so it always matches the list */
    function buildStrip() {
        if (!strip) return;
        strip.textContent = '';
        stations.forEach(function (s) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + s.id;
            a.dataset.tuneLink = s.id;
            const num = document.createElement('span');
            num.textContent = fmt(s.freq);
            a.appendChild(num);
            a.appendChild(document.createTextNode(s.name));
            s.link = a;
            li.appendChild(a);
            strip.appendChild(li);
        });
    }

    buildScale();
    buildStrip();

    const previousContext = window.gsapContext;
    const ctx = gsap.context(function (rootContext) {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            const isMotion = context.conditions.isMotion;
            const handlers = [];
            const on = function (el, type, fn, opts) {
                if (!el) return;
                const listener = context.add(null, fn);
                el.addEventListener(type, listener, opts);
                handlers.push(function () { el.removeEventListener(type, listener, opts); });
            };

            const state = { f: stations[0].freq };
            let current = null;        // the station whose panel is showing
            let lockedId = null;       // the station last announced
            let signal = 1;
            let tween = null;
            let staticOn = false;
            let touched = false;

            const setNeedle = gsap.quickSetter(needle, 'x', 'px');
            const setKnob = knobImg ? gsap.quickSetter(knobImg, 'rotation', 'deg') : null;

            /* ---- render: everything is drawn from state.f ---- */
            function render() {
                const f = state.f;
                if (dial && needle) setNeedle(toX(f) / SCALE_W * dial.clientWidth);
                if (setKnob) setKnob((f - BAND_MIN) * DEG_PER_MHZ);

                const st = nearest(f);
                const d = Math.abs(st.freq - f);
                signal = Math.max(0, 1 - d / CAPTURE);
                signal = signal * signal * (3 - 2 * signal);

                if (st !== current) {
                    if (current) {
                        unscramble(current);
                        current.el.classList.remove('is-active');
                        current.el.style.transform = '';
                        current.el.inert = true;
                        current.el.setAttribute('aria-hidden', 'true');
                        if (current.link) current.link.removeAttribute('aria-current');
                    }
                    current = st;
                    current.el.classList.add('is-active');
                    current.el.inert = false;
                    current.el.removeAttribute('aria-hidden');
                    if (current.link) current.link.setAttribute('aria-current', 'true');
                }
                stations.forEach(function (s) {
                    if (s.label) s.label.classList.toggle('is-tuned', s === current && signal > 0.5);
                });

                const content = current.el;
                if (isMotion) {
                    content.style.opacity = (0.3 + 0.7 * signal).toFixed(3);
                    if (signal >= 0.98) { unscramble(current); content.style.transform = ''; }
                } else {
                    content.style.opacity = signal > 0.4 ? '1' : '0.25';
                }
                if (lamp) lamp.style.opacity = (signal * 0.95).toFixed(3);

                if (readFreq) readFreq.textContent = fmt(f);
                if (readName) readName.textContent = signal > 0.35 ? st.name : 'Between stations';
                const lit = Math.round(signal * bars.length);
                bars.forEach(function (b, i) { b.classList.toggle('is-on', i < lit); });

                if (tuner) {
                    tuner.value = String(Math.round(f * 10));
                    tuner.setAttribute('aria-valuetext', fmt(f) + ' FM, ' + (signal > 0.35 ? st.name : 'between stations'));
                }

                staticOn = isMotion && signal < 0.98;
                if (staticCanvas) staticCanvas.style.opacity = isMotion ? ((1 - signal) * 0.6).toFixed(3) : '0';
            }

            /* ---- static, between stations only ----
               The station's own text breaks up: characters swap for noise glyphs
               in proportion to how far off-station the needle is, the block
               tears sideways, and scanline noise runs over the station box. */
            const GLYPHS = '#%&*+=/\\|~<>-_:;░▒';
            function textNodes(s) {
                if (s.texts) return s.texts;
                const out = [];
                const walker = document.createTreeWalker(s.el, NodeFilter.SHOW_TEXT, {
                    acceptNode: function (n) {
                        if (!n.nodeValue.trim() || n.parentElement.closest('form, [data-signup-done]')) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                });
                while (walker.nextNode()) out.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
                s.texts = out;
                return out;
            }
            function scramble(s, amount) {
                s.scrambled = true;
                textNodes(s).forEach(function (t) {
                    let str = '';
                    for (let i = 0; i < t.text.length; i++) {
                        const ch = t.text[i];
                        str += (ch === ' ' || Math.random() > amount) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
                    }
                    t.node.nodeValue = str;
                });
            }
            function unscramble(s) {
                if (!s || !s.scrambled) return;
                s.scrambled = false;
                textNodes(s).forEach(function (t) { t.node.nodeValue = t.text; });
            }

            const sctx = staticCanvas ? staticCanvas.getContext('2d') : null;
            const stationList = panel.querySelector('[data-stations]');
            let staticImg = null;
            let frame = 0;
            const inkRGB = (getComputedStyle(document.documentElement).getPropertyValue('--ink-rgb') || '22, 25, 27')
                .split(',').map(function (v) { return parseInt(v, 10) || 0; });
            function fitStatic() {
                if (!staticCanvas || !stationList) return;
                staticCanvas.style.top = stationList.offsetTop + 'px';
                staticCanvas.style.height = stationList.offsetHeight + 'px';
            }
            function drawStatic() {
                if (!staticOn) return;
                frame++;
                if (frame % 2) return; /* about 30 fps is plenty for static */
                const off = 1 - signal;
                if (current) {
                    scramble(current, Math.min(0.85, off * 1.1));
                    const tear = Math.random() < off ? (Math.random() - 0.5) * off * 14 : 0;
                    current.el.style.transform = tear ? 'translateX(' + tear.toFixed(1) + 'px)' : '';
                }
                if (!sctx) return;
                const w = staticCanvas.width, h = staticCanvas.height;
                if (!staticImg) staticImg = sctx.createImageData(w, h);
                const px = staticImg.data;
                /* Ink-coloured scanlines on a transparent canvas: most lines are
                   faint speckle, a few become darker tearing bands. */
                for (let y = 0; y < h; y++) {
                    const band = Math.random() < 0.07 ? 0.35 : (y % 2 ? 0 : 0.1);
                    for (let x = 0; x < w; x++) {
                        const i = (y * w + x) * 4;
                        px[i] = inkRGB[0]; px[i + 1] = inkRGB[1]; px[i + 2] = inkRGB[2];
                        px[i + 3] = band ? (band * (0.4 + Math.random() * 0.6)) * 255 : 0;
                    }
                }
                sctx.putImageData(staticImg, 0, 0);
            }
            if (isMotion) {
                gsap.ticker.add(drawStatic);
                handlers.push(function () { gsap.ticker.remove(drawStatic); });
            }

            /* ---- announce a station once the dial settles on it ---- */
            function settled() {
                const st = nearest(state.f);
                if (Math.abs(st.freq - state.f) < 0.05 && lockedId !== st.id) {
                    lockedId = st.id;
                    if (live && touched) live.textContent = 'Tuned to ' + fmt(st.freq) + ', ' + st.name + '.';
                }
            }

            function kill() { if (tween) { tween.kill(); tween = null; } }

            /* Glide to a frequency; reduced motion jumps there */
            function tuneTo(f, opts) {
                kill();
                f = clamp(f);
                const o = opts || {};
                if (!isMotion) { state.f = f; render(); settled(); if (o.onComplete) o.onComplete(); return; }
                const dist = Math.abs(f - state.f);
                tween = gsap.to(state, {
                    f: f,
                    duration: o.duration || Math.min(1.1, 0.35 + dist * 0.06),
                    ease: o.ease || 'back.out(1.5)',
                    onUpdate: render,
                    onComplete: function () { tween = null; settled(); if (o.onComplete) o.onComplete(); }
                });
            }

            /* Release: project the throw a little, then settle on the nearest station */
            function snap(velocity) {
                const projected = state.f + gsap.utils.clamp(-3, 3, (velocity || 0) * 0.12);
                tuneTo(nearest(projected).freq);
            }

            /* While dragging, a station gently pulls the needle in (a detent) */
            function setFromDrag(raw) {
                raw = clamp(raw);
                const st = nearest(raw);
                const d = st.freq - raw;
                const w = Math.max(0, 1 - Math.abs(d) / DETENT);
                state.f = raw + d * w * w * 0.7;
                render();
            }

            function firstTouch() {
                if (touched) return;
                touched = true;
                if (hint) gsap.to(hint, { autoAlpha: 0, duration: isMotion ? 0.4 : 0 });
            }

            /* Velocity tracker in MHz per second */
            const samples = [];
            function track(f) {
                const t = performance.now();
                samples.push({ f: f, t: t });
                while (samples.length && t - samples[0].t > 120) samples.shift();
            }
            function velocity() {
                if (samples.length < 2) return 0;
                const a = samples[0], b = samples[samples.length - 1];
                const dt = (b.t - a.t) / 1000;
                return dt > 0 ? (b.f - a.f) / dt : 0;
            }

            /* ---- knob: turn it by the pointer's angle round its centre ---- */
            let raw = state.f;
            if (knob) {
                let knobDrag = null;
                const angleOf = function (e) {
                    const r = knob.getBoundingClientRect();
                    const dx = e.clientX - (r.left + r.width / 2);
                    const dy = e.clientY - (r.top + r.height / 2);
                    return { a: Math.atan2(dy, dx) * 180 / Math.PI, near: Math.hypot(dx, dy) < r.width * 0.12 };
                };
                on(knob, 'pointerdown', function (e) {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    kill();
                    firstTouch();
                    knob.setPointerCapture(e.pointerId);
                    knob.classList.add('is-dragging');
                    if (tuner) tuner.focus({ preventScroll: true });
                    raw = state.f;
                    root.classList.add('is-pointer');
                    knobDrag = { id: e.pointerId, last: angleOf(e).a };
                    samples.length = 0;
                    track(raw);
                });
                on(knob, 'pointermove', function (e) {
                    if (!knobDrag || e.pointerId !== knobDrag.id) return;
                    const p = angleOf(e);
                    if (p.near) { knobDrag.last = p.a; return; }
                    let da = p.a - knobDrag.last;
                    if (da > 180) da -= 360;
                    if (da < -180) da += 360;
                    knobDrag.last = p.a;
                    raw = clamp(raw + da / DEG_PER_MHZ);
                    track(raw);
                    setFromDrag(raw);
                });
                const endKnob = function (e) {
                    if (!knobDrag || e.pointerId !== knobDrag.id) return;
                    knobDrag = null;
                    knob.classList.remove('is-dragging');
                    snap(isMotion ? velocity() : 0);
                };
                on(knob, 'pointerup', endKnob);
                on(knob, 'pointercancel', endKnob);
            }

            /* ---- dial window: grab the needle and slide it ---- */
            if (dial) {
                let dialDrag = null;
                const freqAt = function (clientX) {
                    const r = dial.getBoundingClientRect();
                    const x = (clientX - r.left) / r.width * SCALE_W;
                    return clamp(BAND_MIN + (x - SCALE_PAD) / (SCALE_W - SCALE_PAD * 2) * (BAND_MAX - BAND_MIN));
                };
                on(dial, 'pointerdown', function (e) {
                    if (e.button !== 0) return;
                    kill();
                    firstTouch();
                    dialDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: e.pointerType === 'mouse' };
                    samples.length = 0;
                    if (dialDrag.active) {
                        e.preventDefault();
                        root.classList.add('is-pointer');
                        dial.setPointerCapture(e.pointerId);
                        if (tuner) tuner.focus({ preventScroll: true });
                        /* first press glides the needle under the pointer */
                        const target = freqAt(e.clientX);
                        if (isMotion) {
                            tween = gsap.to(state, { f: target, duration: 0.22, ease: 'power2.out', onUpdate: render });
                        } else { state.f = target; render(); }
                        raw = target;
                        track(raw);
                    }
                });
                on(dial, 'pointermove', function (e) {
                    if (!dialDrag || e.pointerId !== dialDrag.id) return;
                    if (!dialDrag.active) {
                        /* touch: only take the gesture once it is clearly sideways */
                        const dx = Math.abs(e.clientX - dialDrag.x), dy = Math.abs(e.clientY - dialDrag.y);
                        if (dy > 10 && dy > dx) { dialDrag = null; return; }
                        if (dx < 6) return;
                        dialDrag.active = true;
                        dial.setPointerCapture(e.pointerId);
                    }
                    if (tween) tween.kill();
                    raw = freqAt(e.clientX);
                    track(raw);
                    setFromDrag(raw);
                });
                const endDial = function (e) {
                    if (!dialDrag || e.pointerId !== dialDrag.id) return;
                    const wasActive = dialDrag.active;
                    dialDrag = null;
                    if (wasActive) snap(isMotion ? velocity() : 0);
                    else if (e.type === 'pointerup') tuneTo(nearest(freqAt(e.clientX)).freq);
                };
                on(dial, 'pointerup', endDial);
                on(dial, 'pointercancel', endDial);
            }

            /* ---- wheel over the knob or dial: fine tuning, settles after a pause ---- */
            let wheelTimer = null;
            const onWheel = function (e) {
                e.preventDefault();
                kill();
                firstTouch();
                const dy = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                raw = clamp((wheelTimer ? raw : state.f) + dy * 0.006);
                setFromDrag(raw);
                clearTimeout(wheelTimer);
                wheelTimer = setTimeout(function () { wheelTimer = null; snap(0); }, 160);
            };
            on(knob, 'wheel', onWheel, { passive: false });
            on(dial, 'wheel', onWheel, { passive: false });
            handlers.push(function () { clearTimeout(wheelTimer); });

            /* ---- keyboard: arrows move station to station, Shift+arrows fine-tune ---- */
            if (tuner) {
                on(tuner, 'keydown', function (e) {
                    const idx = stations.indexOf(nearest(state.f));
                    const onStation = Math.abs(stations[idx].freq - state.f) < 0.05;
                    let target = null;
                    if (e.shiftKey && /^Arrow/.test(e.key)) return; /* native 0.1 MHz steps */
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') {
                        target = onStation || stations[idx].freq <= state.f ? stations[Math.min(idx + 1, stations.length - 1)] : stations[idx];
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') {
                        target = onStation || stations[idx].freq >= state.f ? stations[Math.max(idx - 1, 0)] : stations[idx];
                    } else if (e.key === 'Home') { target = stations[0]; }
                    else if (e.key === 'End') { target = launch; }
                    if (!target) return;
                    e.preventDefault();
                    firstTouch();
                    tuneTo(target.freq, { duration: 0.6, ease: 'power3.inOut' });
                });
                on(tuner, 'input', function () {
                    kill();
                    firstTouch();
                    state.f = clamp(parseInt(tuner.value, 10) / 10);
                    render();
                    settled();
                });
            }

            /* ---- station links (strip and header): tune instead of jumping ---- */
            document.querySelectorAll('a[data-tune-link]').forEach(function (a) {
                on(a, 'click', function (e) {
                    const s = stations.filter(function (x) { return x.id === a.dataset.tuneLink; })[0];
                    if (!s) return;
                    e.preventDefault();
                    firstTouch();
                    const toForm = s === launch && a.closest('.site-header');
                    tuneTo(s.freq, {
                        duration: 0.75,
                        ease: 'power3.inOut',
                        onComplete: function () {
                            const field = toForm ? launch.el.querySelector('input') : null;
                            if (field) field.focus({ preventScroll: true });
                        }
                    });
                });
            });

            /* ---- preset key: tunes to launch day, then submits ---- */
            if (key) {
                const pressKey = function () {
                    key.classList.add('is-pressed');
                    setTimeout(function () { key.classList.remove('is-pressed'); }, 140);
                };
                on(key, 'click', function () {
                    pressKey();
                    firstTouch();
                    const field = launch.el.querySelector('input');
                    const atLaunch = Math.abs(state.f - launch.freq) < 0.05;
                    if (atLaunch && form && !form.hidden && field && field.value.trim()) {
                        form.requestSubmit();
                    } else {
                        tuneTo(launch.freq, {
                            duration: 0.8,
                            ease: 'power3.inOut',
                            onComplete: function () { if (field && !form.hidden) field.focus({ preventScroll: true }); }
                        });
                    }
                });
            }

            /* ---- sign-up: front end only, see README to connect a list ---- */
            if (form) {
                const field = form.querySelector('input[type="email"]');
                const error = form.querySelector('[data-signup-error]');
                const done = panel.querySelector('[data-signup-done]');
                on(form, 'submit', function (e) {
                    e.preventDefault();
                    const value = field.value.trim();
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        field.setAttribute('aria-invalid', 'true');
                        error.textContent = 'Enter an email like name@example.com.';
                        field.focus();
                        return;
                    }
                    field.removeAttribute('aria-invalid');
                    error.textContent = '';
                    form.hidden = true;
                    if (done) {
                        done.hidden = false;
                        done.focus({ preventScroll: true });
                        if (isMotion) gsap.fromTo(done, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
                    }
                    if (live) live.textContent = 'You are on the list for Batch 01. We will write on 4 March.';
                });
                on(field, 'input', function () {
                    if (field.getAttribute('aria-invalid')) { field.removeAttribute('aria-invalid'); error.textContent = ''; }
                });
            }

            on(document, 'keydown', function () { root.classList.remove('is-pointer'); });
            on(window, 'resize', function () { buildScale(); fitStatic(); render(); });
            fitStatic();

            /* ---- start: the needle sweeps in from the top of the band ---- */
            stations.forEach(function (s) { s.el.inert = true; s.el.setAttribute('aria-hidden', 'true'); });
            if (isMotion && !touched) {
                state.f = BAND_MAX;
                render();
                tween = gsap.to(state, {
                    f: stations[0].freq,
                    duration: 1.6,
                    delay: 0.25,
                    ease: 'power3.inOut',
                    onUpdate: render,
                    onComplete: function () { tween = null; settled(); }
                });
            } else {
                render();
                settled();
            }
            /* The scale's text needs the mono face before the first measure */
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitStatic(); render(); });

            return function cleanup() {
                kill();
                handlers.forEach(function (remove) { remove(); });
                handlers.length = 0;
                stations.forEach(unscramble);
                stations.forEach(function (s) {
                    s.el.classList.remove('is-active');
                    s.el.style.transform = '';
                    s.el.inert = false;
                    s.el.removeAttribute('aria-hidden');
                    s.el.style.opacity = '';
                    s.el.style.filter = '';
                });
            };
        });

        const handleUnload = function () { rootContext.revert(); };
        window.addEventListener('beforeunload', handleUnload);
        return function cleanupPage() {
            window.removeEventListener('beforeunload', handleUnload);
            if (window.gsapContext === rootContext) {
                if (previousContext === undefined) delete window.gsapContext;
                else window.gsapContext = previousContext;
            }
        };
    });
    window.gsapContext = ctx;
});
