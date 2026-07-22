/* ============================================
   TATI MORENO - LINK IN BIO TEMPLATE
   A one-page creator profile whose link cards
   toss onto the page like stickers landing on
   a desk, drag anywhere with momentum, and
   tween back into a neat stack on "Tidy up".

   Sections are independent: delete any block
   from the HTML and the rest keeps working.
   Without JavaScript the page is a plain,
   readable list of links - everything below
   only upgrades it.
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
})(function initLinkInBio() {

    /* If the GSAP CDN is blocked the page simply stays the plain list:
       has-js is only added once GSAP is confirmed present, and every
       animation start state is set from here, never in the stylesheet. */
    if (typeof gsap === 'undefined') return;
    if (typeof Draggable !== 'undefined') gsap.registerPlugin(Draggable);
    var hasInertia = typeof InertiaPlugin !== 'undefined';
    if (hasInertia) gsap.registerPlugin(InertiaPlugin);

    document.documentElement.classList.add('has-js');

    /* Lenis is optional. Remove its script tag and this block skips. */
    var lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ autoRaf: true });
    }

    /* Per-index pseudo-random in 0..1. Deterministic on purpose: the
       scatter is the page's composition, and a composition should not
       reshuffle on every reload. Change SEED for a different desk. */
    var SEED = 7;
    function prand(i, salt) {
        var s = Math.sin((i + 1) * 12.9898 + (salt + SEED) * 78.233) * 43758.5453;
        return s - Math.floor(s);
    }

    var ctx = gsap.context(function () {
        var mm = gsap.matchMedia();

        mm.add({
            isActive: '(prefers-reduced-motion: no-preference)',
            /* Wide enough that thrown cards have somewhere to land.
               Narrower screens keep the tidy stack with a settle tilt. */
            isScatter: '(min-width: 880px) and (prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            var cond = context.conditions;
            var cleanups = [];
            var deck = setupDeck();
            if (deck) initDeskBar(deck);

            if (cond.isReduced) {
                /* Tidy layout, nothing tossed, nothing gliding. The cards
                   may still be dragged - moving a thing you are holding is
                   not an animation - but without inertia. */
                if (deck) {
                    initDrag(deck, cleanups, false);
                    initTidy(deck, cleanups, false);
                }
                return makeCleanup(cleanups);
            }

            if (deck) {
                computePoses(deck, !!cond.isScatter);
                toss(deck);
                initDrag(deck, cleanups, hasInertia);
                initTidy(deck, cleanups, true);
                watchResize(deck, cleanups, !!cond.isScatter);
            }
            initReveal();

            return makeCleanup(cleanups);
        });
    });

    window.gsapContext = ctx;

    window.addEventListener('beforeunload', function () {
        if (ctx) ctx.kill();
        if (lenis) lenis.destroy();
    });

    function makeCleanup(cleanups) {
        return function cleanup() {
            cleanups.forEach(function (fn) { fn(); });
            cleanups.length = 0;
        };
    }

    /* ---------- The desk: find the cards ---------- */
    function setupDeck() {
        var desk = document.querySelector('[data-desk]');
        if (!desk) return null;
        var cards = gsap.utils.toArray('[data-card]', desk);
        if (!cards.length) return null;

        /* Later cards sit on top of earlier ones, like a real pile;
           picking a card up raises it above everything (see initDrag). */
        cards.forEach(function (card, i) {
            gsap.set(card, { zIndex: i + 1 });
        });

        return { desk: desk, cards: cards, poses: [], zTop: cards.length + 1 };
    }

    /* ---------- The hint and the Tidy button ---------- */
    /* Injected rather than written in the HTML: both describe a feature
       only this script provides, so with scripting off they never exist
       and the page makes no promises it cannot keep. Edit the wording
       here. */
    function initDeskBar(deck) {
        if (document.querySelector('.desk-bar')) return;

        var bar = document.createElement('div');
        bar.className = 'desk-bar';
        bar.setAttribute('data-rise', '');

        var hint = document.createElement('p');
        hint.className = 'desk-hint';
        hint.textContent = 'Toss them about if you like. A click still opens the link.';

        var btn = document.createElement('button');
        btn.className = 'tidy-btn';
        btn.type = 'button';
        btn.setAttribute('data-tidy', '');
        btn.textContent = 'Tidy up';

        bar.appendChild(hint);
        bar.appendChild(btn);
        deck.desk.parentNode.insertBefore(bar, deck.desk);
    }

    /* ---------- Where each card lands ---------- */
    function computePoses(deck, scatter) {
        deck.poses = deck.cards.map(function (card, i) {
            if (!scatter) {
                /* Stacked, with a settle tilt small enough that a rotated
                   card's corners stay inside the column: about 2 degrees
                   on a 340px card is a single extra pixel each side. */
                return {
                    x: 0,
                    y: 0,
                    rot: (i % 2 ? -1 : 1) * (0.7 + prand(i, 2) * 1.3)
                };
            }
            /* Horizontal throw is bounded by the desk itself, so no card
               can land outside it whatever the screen size. Vertical
               stays near the card's own slot: the pile keeps its reading
               order even when it looks thrown. */
            var maxX = Math.max(0, (deck.desk.clientWidth - card.offsetWidth) / 2 - 18);
            return {
                x: (prand(i, 0) * 2 - 1) * maxX * 0.92,
                y: (prand(i, 1) * 2 - 1) * 34,
                rot: (prand(i, 2) * 2 - 1) * 7
            };
        });
    }

    /* ---------- The toss ---------- */
    var tossed = false;
    function toss(deck) {
        if (tossed) {
            /* Crossing the 880px breakpoint re-runs this branch; the
               cards just take their new poses without a second throw. */
            deck.cards.forEach(function (card, i) {
                var p = deck.poses[i];
                gsap.set(card, { x: p.x, y: p.y, rotation: p.rot, scale: 1, autoAlpha: 1 });
            });
            return;
        }
        tossed = true;

        var tl = gsap.timeline({ delay: 0.45 });
        deck.cards.forEach(function (card, i) {
            var p = deck.poses[i];
            var at = i * 0.09;
            /* Each card starts above its landing spot, over-rotated and a
               touch large, and settles with a small overshoot - dropped,
               not faded. The opacity ramp is short so the card is solid
               for most of its fall. */
            tl.fromTo(card,
                {
                    x: p.x * 0.4,
                    y: p.y - 170 - prand(i, 4) * 60,
                    rotation: p.rot * 2.6 - 6,
                    scale: 1.1
                },
                {
                    x: p.x, y: p.y, rotation: p.rot, scale: 1,
                    duration: 0.75, ease: 'back.out(1.2)'
                }, at)
              .fromTo(card,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.26, ease: 'power1.out' }, at);
        });
    }

    /* ---------- Free drag with momentum ---------- */
    /* A card is both a link and a loose object, on a page that scrolls.
       Draggable with type "x,y" claims every touch gesture the moment it
       lands, which would stop a finger that merely starts on a card from
       scrolling the page. So no Draggable listens to a card directly:
       each one is bound to a detached element it never receives events
       from, and a pointerdown on the card decides who owns the gesture.
       A mouse or pen press starts the drag at once; a touch press waits
       until the movement is clearly sideways, and a vertical start is
       left entirely to the browser - the cards carry touch-action: pan-y,
       so the page just scrolls. */
    function initDrag(deck, cleanups, useInertia) {
        if (typeof Draggable === 'undefined') return;

        deck.cards.forEach(function (card) {
            var dragged = false;

            var drag = Draggable.create(card, {
                /* The trigger is a detached element that never receives an
                   event: gestures reach Draggable only through startDrag
                   below, once this code has decided the card owns them. */
                trigger: document.createElement('div'),
                type: 'x,y',
                bounds: deck.desk,
                edgeResistance: 0.8,
                /* Anything under 6px of movement is a tap, and a tap on a
                   card must always follow the link. Draggable only enters
                   a drag past this distance, so taps never see one. */
                minimumMovement: 6,
                dragClickables: true,
                inertia: useInertia,
                onPress: function () {
                    /* The held card rises above the pile and stops obeying
                       any tween still moving it. */
                    deck.zTop += 1;
                    gsap.killTweensOf(card);
                    gsap.set(card, { zIndex: deck.zTop });
                    card.classList.add('is-held');
                },
                onDragStart: function () { dragged = true; },
                onRelease: function () { card.classList.remove('is-held'); }
            })[0];

            var watch = null;

            function onDown(e) {
                if (e.pointerType === 'touch') {
                    /* Commit nothing yet: this may be the start of a page
                       scroll, and a scroll must win. */
                    watch = { id: e.pointerId, x: e.clientX, y: e.clientY };
                } else {
                    drag.startDrag(e);
                }
            }

            function onMove(e) {
                if (!watch || e.pointerId !== watch.id) return;
                var dx = Math.abs(e.clientX - watch.x);
                var dy = Math.abs(e.clientY - watch.y);
                if (dy > dx && dy > 8) {
                    /* Vertical: the browser is scrolling. Stand down. */
                    watch = null;
                } else if (dx > 8 && dx > dy) {
                    /* Sideways: pick the card up, free in both axes. */
                    watch = null;
                    drag.startDrag(e);
                }
            }

            function onEnd() { watch = null; }

            card.addEventListener('pointerdown', onDown);
            card.addEventListener('pointermove', onMove);
            card.addEventListener('pointerup', onEnd);
            card.addEventListener('pointercancel', onEnd);

            /* A gesture that dragged must not also navigate: the click a
               mouse release fires right after a drag is cancelled here. */
            function onClick(e) {
                if (dragged) {
                    e.preventDefault();
                    dragged = false;
                }
            }
            card.addEventListener('click', onClick);

            cleanups.push(function () {
                card.removeEventListener('pointerdown', onDown);
                card.removeEventListener('pointermove', onMove);
                card.removeEventListener('pointerup', onEnd);
                card.removeEventListener('pointercancel', onEnd);
                card.removeEventListener('click', onClick);
                if (drag) drag.kill();
            });
        });
    }

    /* ---------- Tidy up ---------- */
    function initTidy(deck, cleanups, animate) {
        var btn = document.querySelector('[data-tidy]');
        if (!btn) return;

        function tidy() {
            deck.cards.forEach(function (card, i) {
                gsap.killTweensOf(card);
                if (animate) {
                    gsap.to(card, {
                        x: 0, y: 0, rotation: 0, scale: 1,
                        zIndex: i + 1,
                        duration: 0.55, ease: 'power3.inOut', delay: i * 0.045
                    });
                } else {
                    gsap.set(card, { x: 0, y: 0, rotation: 0, scale: 1, zIndex: i + 1 });
                }
            });
        }

        btn.addEventListener('click', tidy);
        cleanups.push(function () { btn.removeEventListener('click', tidy); });
    }

    /* ---------- Keep thrown cards on a shrinking desk ---------- */
    function watchResize(deck, cleanups, scatter) {
        if (!scatter) return;
        var raf = 0;

        function onResize() {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(function () {
                deck.cards.forEach(function (card) {
                    var maxX = Math.max(0, (deck.desk.clientWidth - card.offsetWidth) / 2 - 18);
                    var x = parseFloat(gsap.getProperty(card, 'x')) || 0;
                    if (Math.abs(x) > maxX) {
                        gsap.to(card, { x: maxX * Math.sign(x), duration: 0.3, ease: 'power2.out' });
                    }
                });
            });
        }

        window.addEventListener('resize', onResize);
        cleanups.push(function () {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
        });
    }

    /* ---------- Everything else arrives quietly ---------- */
    function initReveal() {
        /* Start states live here, not in the stylesheet, so the page is
           complete with JavaScript disabled. Each group is optional. */
        var avatar = document.querySelector('[data-avatar]');
        var heroBits = gsap.utils.toArray('[data-rise]');
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (avatar) {
            gsap.set(avatar, { scale: 0.4, rotation: -22, autoAlpha: 0 });
            tl.to(avatar, {
                scale: 1, rotation: 0, autoAlpha: 1,
                duration: 0.7, ease: 'back.out(1.7)'
            }, 0.1);
        }
        if (heroBits.length) {
            gsap.set(heroBits, { y: 18, autoAlpha: 0 });
            tl.to(heroBits, {
                y: 0, autoAlpha: 1,
                duration: 0.7, stagger: 0.09
            }, 0.25);
        }
    }
});
