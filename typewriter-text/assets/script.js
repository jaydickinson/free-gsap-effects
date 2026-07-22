/**
 * Typewriter Text
 *
 * Text types out character by character with a blinking cursor when
 * scrolled into view. Supports looping phrases, custom speed, and delay.
 *
 * @plugins ScrollTrigger
 * @techniques text-animation, typewriter, scroll-reveal
 */

gsap.registerPlugin(ScrollTrigger);

/* Runs the init straight away if the DOM is already parsed (a script
   executed late or deferred, e.g. by Cloudflare Rocket Loader), and
   waits for DOMContentLoaded otherwise. */
(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initTypewriterText() {
    const HOLD_TIME = 1.6;          // Seconds a looping phrase stays on screen
    const DELETE_FACTOR = 0.5;      // Deleting runs at 2x typing speed

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const { isMotion } = context.conditions;

            const elements = document.querySelectorAll('[data-typewriter]');

            elements.forEach(function initElement(el) {
                // ============================================
                // CONFIGURATION FROM DATA ATTRIBUTES
                // ============================================
                const CONFIG = {
                    // Seconds per character
                    speed: parseFloat(el.dataset.typeSpeed) || 0.045,
                    // Delay before typing starts (seconds)
                    delay: parseFloat(el.dataset.typeDelay) || 0,
                    // Show blinking cursor (default true)
                    cursor: el.dataset.typeCursor !== 'false',
                    // Optional comma-separated phrases to rotate through
                    loop: (el.dataset.typeLoop || '')
                        .split(',')
                        .map(function trim(s) { return s.trim(); })
                        .filter(Boolean)
                };

                const fullText = el.textContent.trim();
                if (!fullText) return;

                // Screen readers always get the complete text
                el.setAttribute('aria-label', fullText);

                // ============================================
                // REDUCED MOTION: static render, no cursor
                // ============================================
                if (!isMotion) {
                    el.textContent = fullText;
                    return;
                }

                // ============================================
                // DOM SETUP: text span + optional cursor span
                // ============================================
                el.textContent = '';

                const textSpan = document.createElement('span');
                textSpan.className = 'typewriter__text';
                textSpan.setAttribute('aria-hidden', 'true');
                el.appendChild(textSpan);

                if (CONFIG.cursor) {
                    const cursorSpan = document.createElement('span');
                    cursorSpan.className = 'typewriter__cursor';
                    cursorSpan.setAttribute('aria-hidden', 'true');
                    el.appendChild(cursorSpan);
                }

                // ============================================
                // TIMELINE: type (and optionally loop phrases)
                // ============================================
                const phrases = [fullText].concat(CONFIG.loop);
                const looping = phrases.length > 1;
                const proxy = { chars: 0 };
                let current = fullText;

                function render() {
                    textSpan.textContent = current.slice(0, Math.round(proxy.chars));
                }

                const tl = gsap.timeline({
                    paused: true,
                    delay: CONFIG.delay,
                    repeat: looping ? -1 : 0,
                    onStart: function dispatchStart() {
                        el.classList.add('is-typing');
                        el.dispatchEvent(new CustomEvent('typewriter:start', {
                            bubbles: true,
                            detail: { text: fullText }
                        }));
                    }
                });

                phrases.forEach(function addPhrase(phrase, index) {
                    // Point the renderer at this phrase
                    tl.call(function setPhrase() { current = phrase; });

                    // Type it out, one snapped character per step
                    tl.to(proxy, {
                        chars: phrase.length,
                        duration: phrase.length * CONFIG.speed,
                        ease: 'none',
                        snap: { chars: 1 },
                        onUpdate: render,
                        onComplete: function dispatchComplete() {
                            if (!looping) el.classList.add('is-complete');
                            el.dispatchEvent(new CustomEvent('typewriter:complete', {
                                bubbles: true,
                                detail: { text: phrase, index: index }
                            }));
                        }
                    });

                    // In loop mode: hold, then delete before the next phrase
                    if (looping) {
                        tl.to(proxy, {
                            chars: 0,
                            duration: phrase.length * CONFIG.speed * DELETE_FACTOR,
                            ease: 'none',
                            snap: { chars: 1 },
                            onUpdate: render
                        }, '+=' + HOLD_TIME);
                    }
                });

                // ============================================
                // SCROLLTRIGGER: play once on enter
                // ============================================
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                    onEnter: function play() { tl.play(); }
                });
            });

            // ============================================
            // CLEANUP FUNCTION
            // ============================================
            return function cleanup() {
                ScrollTrigger.getAll().forEach(function killTrigger(trigger) {
                    trigger.kill();
                });
            };
        });
    });

    // Store context for SPA cleanup
    window.gsapContext = ctx;
});

// ============================================
// OPTIONAL: Lenis smooth scroll integration
// ============================================
(function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add(function raf(time) {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Store for cleanup
    window.lenis = lenis;
})();
