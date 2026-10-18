/**
 * Online CV template
 *
 * One page: the CV as an A4 sheet on the desk, and a bar that turns it
 * into a PDF. Each part looks for its own markup and does nothing when it is
 * missing.
 *
 *   initFit     scales the A4 sheet(s) to the window
 *   initZoom    click the sheet (or Zoom) to read it larger
 *   initLength  One page / Full CV switch, PDF link, print, email, copy link
 *   initIntro   the sheet settling onto the desk on first arrival
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
    const html = document.documentElement;

    /* If the GSAP CDN is blocked the page stays a plain, readable document:
       take the head script's gate off so nothing stays hidden. */
    if (typeof gsap === 'undefined') {
        html.classList.remove('has-js', 'intro');
        return;
    }
    html.classList.add('js-ready');

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wideQuery = window.matchMedia('(min-width: 1180px)');
    const handlers = [];
    const timers = [];

    function on(el, type, fn, opts) {
        el.addEventListener(type, fn, opts);
        handlers.push(function () { el.removeEventListener(type, fn, opts); });
    }

    function later(fn, ms) {
        const id = setTimeout(fn, ms);
        timers.push(id);
        return id;
    }

    /* Clipboard with a fallback for pages opened from disk or old browsers. */
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            area.remove();
            if (ok) resolve(); else reject(new Error('copy failed'));
        });
    }

    function store(key, value) {
        try { sessionStorage.setItem(key, value); } catch (e) { /* private mode */ }
    }

    const ctx = gsap.context(function () {

        // ====================================================================
        // The sheet
        // ====================================================================

        const desk = document.querySelector('[data-desk]');

        function visibleSet() {
            if (!desk) return null;
            return desk.querySelector(html.dataset.cv === 'full' ? '[data-set="full"]' : '[data-set="one"]');
        }

        /* The sheet is real A4 at 794 x 1123 CSS px. On wide screens it is
           scaled to the window height (never below 0.84, so the page scrolls
           a little on short windows); zoomed in, it fills the space between
           the rail and the bar, up to 1.3. Elsewhere it fills the width. */
        let zoomed = false;
        let zooming = null;
        /* Below this fit the A4 type is too small to read, so the sheet
           reflows instead: one column, at up to REFLOW_ZOOM (see .is-reflow in the
           stylesheet). Print and the PDFs always use the A4 layout. */
        const REFLOW_BELOW = 1;
        const REFLOW_ZOOM = 1.3;
        let availW = 794;
        let reflow = false;
        const targetScale = function () {
            const cs = getComputedStyle(desk);
            availW = desk.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            let s = availW / 794;
            if (wideQuery.matches) {
                s = zoomed ? Math.min(s, 1.3) : Math.min(s, Math.max((window.innerHeight - 48) / 1123, 0.84), 1.15);
            } else {
                s = Math.min(s, 1.15);
            }
            reflow = s < REFLOW_BELOW && !wideQuery.matches;
            /* Never narrower than 260 CSS px of column, even at 320 wide. */
            return reflow ? Math.max(1, Math.min(REFLOW_ZOOM, availW / 260)) : s;
        };
        const currentScale = function () { return parseFloat(desk.style.getPropertyValue('--s')) || 1; };

        function initFit() {
            if (!desk) return;
            const fit = function () {
                if (zooming) return;
                const s = targetScale();
                html.classList.toggle('is-reflow', reflow);
                desk.style.setProperty('--s', s.toFixed(4));
                if (reflow) desk.style.setProperty('--page-w', (availW / s).toFixed(1) + 'px');
                else desk.style.removeProperty('--page-w');
            };
            fit();
            if ('ResizeObserver' in window) {
                const ro = new ResizeObserver(fit);
                ro.observe(desk);
                handlers.push(function () { ro.disconnect(); });
            }
            on(window, 'resize', fit);
            on(wideQuery, 'change', function () { if (!wideQuery.matches) setZoom(false); });
        }

        /* Zoom: a click on the sheet (or the bar's Zoom button) enlarges it
           to reading size and back, keeping the point under the pointer in
           place. Wide screens only; smaller ones reflow the sheet instead. */
        const zoomButton = document.querySelector('[data-zoom]');
        function setZoom(want, clientY) {
            if (!desk || want === zoomed) return;
            zoomed = want;
            html.classList.toggle('is-zoomed', want);
            if (zoomButton) {
                zoomButton.setAttribute('aria-pressed', String(want));
                const label = zoomButton.querySelector('.lbl');
                if (label) label.textContent = want ? 'Zoom out' : 'Zoom in';
            }
            const from = currentScale();
            const to = targetScale();
            const top = desk.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(desk).paddingTop);
            const y = clientY == null ? window.innerHeight / 2 : clientY;
            const rel = (window.scrollY + y - top) / from;
            const step = function (s) {
                desk.style.setProperty('--s', s.toFixed(4));
                window.scrollTo(0, Math.max(0, top + rel * s - y));
            };
            if (zooming) zooming.kill();
            if (reduceQuery.matches) { step(to); zooming = null; return; }
            const proxy = { s: from };
            ctx.add(function () {
                zooming = gsap.to(proxy, {
                    s: to, duration: 0.55, ease: 'power3.inOut',
                    onUpdate: function () { step(proxy.s); },
                    onComplete: function () { zooming = null; }
                });
            });
        }
        function initZoom() {
            if (!desk) return;
            on(desk, 'click', function (e) {
                if (!wideQuery.matches || e.target.closest('a, button')) return;
                setZoom(!zoomed, e.clientY);
            });
            if (zoomButton) on(zoomButton, 'click', function () { setZoom(!zoomed); });
        }

        function initLength() {
            const dock = document.querySelector('[data-dock]');
            if (!dock) return;
            const buttons = dock.querySelectorAll('[data-length]');
            const pdf = dock.querySelector('[data-pdf]');
            const pdfSize = dock.querySelector('[data-pdf-size]');
            const email = dock.querySelector('[data-email]');
            const print = dock.querySelector('[data-print]');
            const copy = dock.querySelector('[data-copy]');
            const copyLabel = dock.querySelector('[data-copy-label]');
            const status = dock.querySelector('[data-copy-status]');
            const nameEl = document.querySelector('.rail__name');
            const person = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : 'this candidate';
            const copyIcon = copy ? copy.querySelector('svg').outerHTML : '';
            const tickIcon = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true" focusable="false"><path d="m4.5 10.5 3.5 3.5 7.5-8"/></svg>';
            let copyTimer = null;

            const files = {
                one: { href: 'assets/cv.pdf', name: person.replace(/\s+/g, '-') + '-CV.pdf', size: '1 page', label: 'one page' },
                full: { href: 'assets/cv-full.pdf', name: person.replace(/\s+/g, '-') + '-CV-full.pdf', size: '2 pages', label: 'two pages' }
            };
            const absolute = function (href) { return new URL(href, location.href).href; };
            const site = absolute('index.html').replace(/index\.html$/, '');

            function apply(mode) {
                const f = files[mode];
                html.dataset.cv = mode;
                store('cv-length', mode);
                buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.length === mode)); });
                if (pdf) { pdf.href = f.href; pdf.setAttribute('download', f.name); }
                if (pdfSize) pdfSize.textContent = f.size;
                if (email) {
                    const subject = 'CV: ' + person;
                    const body = 'Hello,\n\n' + person + '\'s CV (' + f.label + ', PDF):\n' + absolute(f.href) +
                        '\n\nThe same CV as a web page:\n' + site + '\n';
                    email.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
                }
                const url = new URL(location.href);
                if (mode === 'full') url.searchParams.set('cv', 'full'); else url.searchParams.delete('cv');
                try { history.replaceState(history.state, '', url); } catch (e) { /* sandboxed frame */ }

            }

            /* Switching length never blanks the sheet. Page 1 stays where it
               is and its text crossfades from a copy of the old version laid
               over it; page 2 slides out from behind page 1 (Full CV) or
               tucks back under it first (One page). */
            let busy = false;
            function switchTo(mode) {
                const oldSet = visibleSet();
                const oldPage = oldSet && oldSet.querySelector('.page');
                if (reduceQuery.matches || !oldPage) { apply(mode); return; }
                busy = true;
                const run = function () {
                    const ghost = oldPage.querySelector('.cv').cloneNode(true);
                    ghost.classList.add('cv--ghost');
                    ghost.setAttribute('aria-hidden', 'true');
                    ghost.inert = true;
                    ghost.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
                    apply(mode);
                    const pages = visibleSet().querySelectorAll('.page');
                    pages[0].appendChild(ghost);
                    ctx.add(function () {
                        const tl = gsap.timeline({ onComplete: function () { ghost.remove(); busy = false; } });
                        /* Out, then in: the two versions never overlap. */
                        tl.to(ghost, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0);
                        tl.fromTo(pages[0].querySelector('.cv:not(.cv--ghost)'), { opacity: 0 },
                            { opacity: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity' }, 0.14);
                        if (pages[1]) {
                            const s = parseFloat(getComputedStyle(desk).getPropertyValue('--s')) || 1;
                            tl.fromTo(pages[1],
                                { yPercent: -100, y: -28 / s, rotation: -0.8 },
                                { yPercent: 0, y: 0, rotation: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform' }, 0.08);
                        }
                    });
                };
                const oldSecond = oldSet.querySelectorAll('.page')[1];
                if (mode === 'one' && oldSecond) {
                    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
                    const s = parseFloat(getComputedStyle(desk).getPropertyValue('--s')) || 1;
                    ctx.add(function () {
                        gsap.to(oldSecond, {
                            yPercent: -100, y: -28 / s, rotation: -0.8, duration: 0.45, ease: 'power2.in',
                            onComplete: function () { run(); gsap.set(oldSecond, { clearProps: 'transform' }); }
                        });
                    });
                } else {
                    run();
                }
            }

            buttons.forEach(function (b) {
                on(b, 'click', function () {
                    if (busy || b.getAttribute('aria-pressed') === 'true') return;
                    switchTo(b.dataset.length);
                });
            });
            if (print) on(print, 'click', function () { window.print(); });

            if (copy) {
                on(copy, 'click', function () {
                    const f = files[html.dataset.cv === 'full' ? 'full' : 'one'];
                    const done = function (ok) {
                        copy.classList.toggle('is-done', ok);
                        copy.querySelector('svg').outerHTML = ok ? tickIcon : copyIcon;
                        copyLabel.textContent = ok ? 'Copied' : 'Copy failed';
                        status.textContent = ok ? 'Link to the PDF copied.' : 'Could not copy. The link is ' + absolute(f.href);
                        clearTimeout(copyTimer);
                        copyTimer = later(function () {
                            copy.classList.remove('is-done');
                            copy.querySelector('svg').outerHTML = copyIcon;
                            copyLabel.textContent = 'Copy link';
                            status.textContent = '';
                        }, 2400);
                    };
                    copyText(absolute(f.href)).then(function () { done(true); }, function () { done(false); });
                });
            }

            apply(html.dataset.cv === 'full' ? 'full' : 'one');
        }

        function initIntro() {
            if (!html.classList.contains('intro')) return;
            const set = visibleSet();
            const railItems = document.querySelectorAll('.rail__intro, .rail__facts > div');
            const dock = document.querySelector('[data-dock]');
            const tl = gsap.timeline({
                onComplete: function () { html.classList.remove('intro'); }
            });
            if (set) {
                tl.fromTo(set,
                    { opacity: 0, y: 70, rotation: -1.4, transformOrigin: '50% 100%' },
                    { opacity: 1, y: 0, rotation: 0, duration: 1.15, ease: 'expo.out', clearProps: 'transform' }, 0);
            }
            if (railItems.length) {
                tl.fromTo(railItems,
                    { opacity: 0, x: -14 },
                    { opacity: 1, x: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' }, 0.25);
            }
            if (dock) tl.fromTo(dock, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.55);
        }

        initFit();
        initZoom();
        initLength();
        initIntro();
    });

    /* Teardown: reverts every tween and set, removes the listeners and
       timers this script added, and leaves the page readable. */
    window.gsapContext = {
        revert: function () {
            ctx.revert();
            handlers.splice(0).forEach(function (off) { off(); });
            timers.splice(0).forEach(function (id) { clearTimeout(id); });
        }
    };
});
