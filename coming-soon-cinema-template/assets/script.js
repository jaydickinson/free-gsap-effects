/* ============================================
   THE LANTERN - COMING SOON TEMPLATE
   Single-screen holding page. Sections are
   independent: delete any block from the HTML
   and the rest keeps working.

   The opening date lives on the markup, not in
   here:
   <div data-leader data-open="2027-10-02T19:30:00">
   See the README for the full contract.
   ============================================ */

/* Runs the init straight away if the DOM is already parsed (a script
   executed late or deferred, e.g. by Cloudflare Rocket Loader), and
   waits for DOMContentLoaded otherwise. */
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initLantern() {

    const ctx = gsap.context(function () {
        const mm = gsap.matchMedia();

        mm.add({
            isActive: '(prefers-reduced-motion: no-preference)',
            isFine: '(pointer: fine) and (prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            const cond = context.conditions;
            const cleanups = [];

            if (cond.isReduced) {
                /* Static page, but still a working countdown: the leader
                   fills its numbers and skips the sweep. */
                initLeader(cleanups, false);
                initForm(false);
                return function cleanup() {
                    cleanups.forEach(function (fn) { fn(); });
                    cleanups.length = 0;
                };
            }

            initBeam(cleanups, cond.isFine);
            initSpot(cleanups);
            initDust(cleanups);
            initLeader(cleanups, true);
            initGrain(cleanups);
            initReveal();
            initForm(true);

            return function cleanup() {
                cleanups.forEach(function (fn) { fn(); });
                cleanups.length = 0;
            };
        });
    });

    window.gsapContext = ctx;

    /* ---------- Beam: the lamp, breathing and leaning ---------- */
    function initBeam(cleanups, isFine) {
        const beam = document.querySelector('[data-beam]');
        if (!beam) return;

        /* The breathe goes on the inner band; the load sequence fades the
           pivot. One element, one owner of a property - both writing
           opacity to the same node leaves the beam dim and arbitrary. */
        const band = beam.querySelector('.beam');
        if (band) {
            /* Fourteen seconds a cycle. Long enough that the eye reads it
               as the room rather than as an animation with a tempo. */
            gsap.to(band, {
                opacity: 0.66,
                duration: 14,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
        }

        if (!isFine) return;

        /* The beam pivots at the projection port, top right, the way a
           real one does. Tiny range on purpose: the room shifting, not a
           searchlight following the cursor. The origin is the pivot's
           own CSS transform-origin - GSAP inherits it, so the angle
           lives in one place. */
        const rotTo = gsap.quickTo(beam, 'rotation', { duration: 1.5, ease: 'power2.out' });
        const yTo = gsap.quickTo(beam, 'yPercent', { duration: 1.5, ease: 'power2.out' });

        function lean(e) {
            rotTo((e.clientY / window.innerHeight - 0.5) * 1.1);
            yTo((e.clientX / window.innerWidth - 0.5) * -2.4);
        }

        window.addEventListener('pointermove', lean);
        cleanups.push(function () { window.removeEventListener('pointermove', lean); });
    }

    /* ---------- Spotlight: a house light wandering the room ---------- */
    function initSpot(cleanups) {
        const spot = document.querySelector('[data-spot]');
        if (!spot) return;

        /* Two sines per axis at frequencies with no common multiple, so
           the path never closes. A single sine is a loop, and the eye
           learns a loop; this has no period to learn, so it reads as
           drift rather than as animation. */
        const setX = gsap.quickSetter(spot, 'x', 'px');
        const setY = gsap.quickSetter(spot, 'y', 'px');

        function drift(time) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setX(w * (0.5 + 0.30 * Math.sin(time * 0.083) + 0.13 * Math.sin(time * 0.191)));
            setY(h * (0.46 + 0.24 * Math.sin(time * 0.117) + 0.11 * Math.sin(time * 0.237)));
        }

        gsap.ticker.add(drift);
        cleanups.push(function () { gsap.ticker.remove(drift); });
    }

    /* ---------- Academy leader: the countdown ---------- */
    /* Split by how often each part changes: the sweep is continuous (one
       turn a minute, which is what reads as live), the day count changes
       once a day, hours and minutes once a minute. Every value is read
       from the clock rather than accumulated, so nothing drifts or has
       to catch up after a backgrounded tab. */
    function initLeader(cleanups, animate) {
        const block = document.querySelector('[data-leader]');
        if (!block) return;

        const target = new Date(block.getAttribute('data-open')).getTime();
        if (isNaN(target)) return;      /* bad date: leave the chart empty */

        const sweep = block.querySelector('[data-leader-sweep]');
        const num = block.querySelector('[data-leader-num]');
        const key = block.querySelector('[data-leader-key]');
        const sub = block.querySelector('[data-leader-sub]');

        const setRotation = (animate && sweep)
            ? gsap.quickSetter(sweep, 'rotation', 'deg')
            : null;

        let lastDays = -1;
        let lastMins = -1;
        let opened = false;

        function write() {
            const now = Date.now();

            /* One revolution a minute, straight off the wall clock. */
            if (setRotation) setRotation(((now % 60000) / 60000) * 360);

            if (opened) return;

            const ms = target - now;
            if (ms <= 0) {
                opened = true;
                if (num) num.textContent = '0';
                if (key) key.textContent = 'Now open';
                if (sub) sub.textContent = '';
                return;
            }

            const days = Math.floor(ms / 86400000);
            const mins = Math.floor(ms / 60000) % 60;

            /* Written only when the value actually changes, so on all but
               a handful of frames this whole function is one setter. */
            if (days !== lastDays) {
                lastDays = days;
                if (num) num.textContent = String(days);
                if (key) key.textContent = days === 1 ? 'Day to opening' : 'Days to opening';
            }
            if (mins !== lastMins) {
                lastMins = mins;
                const hours = Math.floor(ms / 3600000) % 24;
                if (sub) sub.textContent = hours + ' hr ' + mins + ' min';
            }
        }

        write();
        block.classList.add('is-live');

        if (!animate) {
            /* No sweep to drive, so a slow interval keeps the text honest
               without putting anything on screen in motion. */
            const timer = window.setInterval(write, 30000);
            cleanups.push(function () { window.clearInterval(timer); });
            return;
        }

        gsap.ticker.add(write);
        cleanups.push(function () { gsap.ticker.remove(write); });
    }

    /* ---------- Dust: what the beam is actually showing you ---------- */
    function initDust(cleanups) {
        const canvas = document.querySelector('[data-dust]');
        if (!canvas) return;
        const cx = canvas.getContext('2d');
        if (!cx) return;

        let w = 0;
        let h = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const specks = [];
        const COUNT = 38;

        function size() {
            w = canvas.offsetWidth;
            h = canvas.offsetHeight;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            cx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        size();

        for (let i = 0; i < COUNT; i++) {
            specks.push({
                x: Math.random() * (w || 1),
                y: Math.random() * (h || 1),
                r: 0.5 + Math.random() * 1.5,
                v: 3 + Math.random() * 8,            /* px per second, upward */
                sway: 8 + Math.random() * 18,
                phase: Math.random() * Math.PI * 2,
                a: 0.14 + Math.random() * 0.34
            });
        }

        function draw(time, delta) {
            if (!w || !h) return;
            const dt = Math.min(delta, 100) / 1000;
            cx.clearRect(0, 0, w, h);
            cx.fillStyle = '#F0B44E';
            for (let i = 0; i < specks.length; i++) {
                const s = specks[i];
                s.y -= s.v * dt;
                if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
                const x = s.x + Math.sin(time * 0.26 + s.phase) * s.sway;
                cx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(time * 0.7 + s.phase));
                cx.beginPath();
                cx.arc(x, s.y, s.r, 0, Math.PI * 2);
                cx.fill();
            }
            cx.globalAlpha = 1;
        }

        gsap.ticker.add(draw);
        window.addEventListener('resize', size);
        cleanups.push(function () {
            gsap.ticker.remove(draw);
            window.removeEventListener('resize', size);
        });
    }

    /* ---------- Grain: one tile, moved, at 24fps ---------- */
    function initGrain(cleanups) {
        const canvas = document.querySelector('[data-grain]');
        if (!canvas) return;
        const cx = canvas.getContext('2d');
        if (!cx) return;

        /* Noise is expensive to generate and cheap to move, so the tile is
           built once and re-offset every frame. Rebuilding full-screen
           noise per frame costs more than the rest of the page. */
        const TILE = 128;
        const tile = document.createElement('canvas');
        tile.width = TILE;
        tile.height = TILE;
        const tcx = tile.getContext('2d');
        if (!tcx) return;

        const img = tcx.createImageData(TILE, TILE);
        for (let i = 0; i < img.data.length; i += 4) {
            /* Centred on mid-grey so the overlay blend nudges contrast
               both ways and shifts no measured pair. */
            const v = 128 + (Math.random() - 0.5) * 96;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        tcx.putImageData(img, 0, 0);

        const pattern = cx.createPattern(tile, 'repeat');
        if (!pattern) return;

        let w = 0;
        let h = 0;

        function size() {
            /* Device-pixel-ratio 1 on purpose: grain should be the size of
               grain, not of a pixel, and this is a quarter of the fill
               cost on a retina screen. */
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
            cx.fillStyle = pattern;
        }
        size();

        /* A film gate runs at 24 frames a second and so does this. Fast
           enough to read as grain rather than as a pulse. */
        const STEP = 1 / 24;
        let acc = 0;

        function draw(time, delta) {
            acc += delta / 1000;
            if (acc < STEP) return;
            acc %= STEP;
            const ox = Math.floor(Math.random() * TILE);
            const oy = Math.floor(Math.random() * TILE);
            cx.setTransform(1, 0, 0, 1, -ox, -oy);
            cx.fillRect(ox, oy, w, h);
        }

        gsap.ticker.add(draw);
        window.addEventListener('resize', size);
        cleanups.push(function () {
            gsap.ticker.remove(draw);
            window.removeEventListener('resize', size);
        });
    }

    /* ---------- Reveal: the lamp strikes, the slide comes up ---------- */
    function initReveal() {
        /* Start states are set here, not in the stylesheet, so the page
           is complete with JavaScript disabled. */
        const beam = document.querySelector('[data-beam]');
        const slide = document.querySelector('[data-slide]');
        const lines = gsap.utils.toArray('.title .line-inner');
        const rule = document.querySelector('.rule-bar');
        const leader = document.querySelector('[data-leader]');
        const fades = gsap.utils.toArray('[data-fade]');

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (beam) {
            /* Struck, not flicked. Nothing on this page strobes: a
               flickering light source is a photosensitivity risk. */
            gsap.set(beam, { opacity: 0 });
            tl.to(beam, { opacity: 1, duration: 1.6, ease: 'power2.inOut' }, 0);
        }
        if (slide) {
            gsap.set(slide, { opacity: 0, y: 16, scale: 0.988 });
            tl.to(slide, { opacity: 1, y: 0, scale: 1, duration: 1.1 }, 0.15);
        }
        if (lines.length) {
            /* yPercent and y together: GSAP parses a CSS translate into a
               pixel y, and tweening only yPercent would strand it. */
            gsap.set(lines, { yPercent: 112, y: 0 });
            tl.to(lines, { yPercent: 0, y: 0, duration: 1.05, stagger: 0.1, ease: 'power4.out' }, 0.4);
        }
        if (rule) {
            gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });
            tl.to(rule, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.8);
        }
        if (fades.length) {
            gsap.set(fades, { opacity: 0, y: 14 });
            tl.to(fades, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08 }, 0.6);
        }
        if (leader) {
            /* Threads up last, the way the projectionist would. */
            gsap.set(leader, { opacity: 0, scale: 0.9 });
            tl.to(leader, { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' }, 1.15);
        }
    }

    /* ---------- Notify form ---------- */
    function initForm(animate) {
        const form = document.querySelector('[data-notify]');
        if (!form) return;
        const field = form.querySelector('.notify-field');
        const doneEl = form.querySelector('.notify-done');
        const status = form.querySelector('.notify-status');

        form.addEventListener('submit', function (e) {
            e.preventDefault();               /* wire to your list provider: see README */
            if (!form.checkValidity()) { form.reportValidity(); return; }
            if (!field || !doneEl) return;

            if (status) status.textContent = 'Saved. We will email you once, when we open.';

            if (!animate) {
                field.hidden = true;
                doneEl.hidden = false;
                return;
            }
            gsap.timeline()
                .to(field, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' })
                .set(field, { display: 'none' })
                .call(function () { doneEl.hidden = false; })
                .set(doneEl, { opacity: 0, y: 12 })
                .to(doneEl, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' });
        });
    }
});
