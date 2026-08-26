/**
 * Typewriter Text
 *
 * Scroll-triggered character typing with looping phrases, an accelerating
 * delete pass, and optional UI hooks for cursor, phase, and progress feedback.
 *
 * @plugins ScrollTrigger
 * @techniques text-animation, typewriter, scroll-reveal, infinite-loop
 */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initTypewriterText() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        document.documentElement.classList.remove('has-js');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const handlers = new Map();
    const ownedTriggers = [];
    const timelines = [];
    const resizeHandlers = [];

    function fitStaticLine(el) {
        el.style.removeProperty('font-size');
        const naturalSize = parseFloat(getComputedStyle(el).fontSize);
        const available = el.clientWidth;
        const required = el.scrollWidth;
        if (!available || !required) return;
        el.style.fontSize = Math.max(11, naturalSize * Math.min(1, (available - 2) / required)) + 'px';
    }

    const ctx = gsap.context(function gsapContextCallback() {
        const mm = gsap.matchMedia();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const isMotion = context.conditions.isMotion;
            const elements = document.querySelectorAll('[data-typewriter]');

            elements.forEach(function initElement(el) {
                const speedValue = parseFloat(el.dataset.typeSpeed);
                const delayValue = parseFloat(el.dataset.typeDelay);
                const isCompact = window.matchMedia('(max-width: 600px)').matches;
                const loopSource = isCompact && el.dataset.typeLoopMobile
                    ? el.dataset.typeLoopMobile
                    : el.dataset.typeLoop;
                const holdValue = parseFloat(el.dataset.typeHold);
                const deleteValue = parseFloat(el.dataset.typeDeleteSpeed);
                const CONFIG = {
                    speed: Number.isFinite(speedValue) ? Math.max(0.01, speedValue) : 0.045,
                    delay: Number.isFinite(delayValue) ? Math.max(0, delayValue) : 0,
                    hold: Number.isFinite(holdValue) ? Math.max(0.4, holdValue) : 1.8,
                    deleteSpeed: Number.isFinite(deleteValue) ? Math.max(0.1, deleteValue) : 0.5,
                    cursor: el.dataset.typeCursor !== 'false',
                    loop: (loopSource || '')
                        .split(',')
                        .map(function trimPhrase(phrase) { return phrase.trim(); })
                        .filter(Boolean)
                };

                const fullText = (isCompact && el.dataset.typeMobile
                    ? el.dataset.typeMobile
                    : el.textContent).trim();
                if (!fullText) return;
                const phrases = [fullText].concat(CONFIG.loop);

                const system = el.closest('[data-typewriter-system]');
                const cursor = system ? system.querySelector('[data-typewriter-cursor]') : null;
                const status = system ? system.querySelector('[data-typewriter-status]') : null;
                const progress = system ? system.querySelector('[data-typewriter-progress]') : null;
                const replay = system ? system.querySelector('[data-typewriter-replay]') : null;

                el.setAttribute('aria-label', fullText);

                if (!isMotion) {
                    el.textContent = fullText;
                    el.classList.add('is-complete');
                    if (system) system.dataset.phase = 'ready';
                    if (status) status.textContent = 'READY';
                    if (progress) gsap.set(progress, { scaleX: 1 });
                    const fitReduced = function fitReducedLine() { fitStaticLine(el); };
                    requestAnimationFrame(fitReduced);
                    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitReduced);
                    window.addEventListener('resize', fitReduced);
                    resizeHandlers.push(fitReduced);
                    return;
                }

                el.textContent = '';
                const textSpan = document.createElement('span');
                textSpan.className = 'typewriter__text';
                textSpan.setAttribute('aria-hidden', 'true');
                el.appendChild(textSpan);

                let generatedCursor = null;
                if (CONFIG.cursor && !cursor) {
                    generatedCursor = document.createElement('span');
                    generatedCursor.className = 'typewriter__cursor';
                    generatedCursor.setAttribute('aria-hidden', 'true');
                    el.appendChild(generatedCursor);
                }
                const activeCursor = CONFIG.cursor ? (cursor || generatedCursor) : null;
                if (cursor && !CONFIG.cursor) cursor.hidden = true;

                const looping = phrases.length > 1;
                const proxy = { chars: 0 };
                let currentChars = Array.from(fullText);

                function fitPhrases() {
                    if (!textSpan.isConnected) return;
                    el.style.removeProperty('font-size');
                    const naturalSize = parseFloat(getComputedStyle(el).fontSize);
                    const previousText = textSpan.textContent;
                    let widest = 0;
                    phrases.forEach(function measurePhrase(phrase) {
                        textSpan.textContent = phrase;
                        widest = Math.max(widest, textSpan.getBoundingClientRect().width);
                    });
                    const cursorWidth = activeCursor
                        ? activeCursor.getBoundingClientRect().width + parseFloat(getComputedStyle(activeCursor).marginLeft || 0)
                        : 0;
                    const available = el.clientWidth - cursorWidth - 2;
                    if (available > 0 && widest > 0) {
                        el.style.fontSize = Math.max(11, naturalSize * Math.min(1, available / widest)) + 'px';
                    }
                    textSpan.textContent = previousText;
                }

                requestAnimationFrame(fitPhrases);
                if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhrases);
                window.addEventListener('resize', fitPhrases);
                resizeHandlers.push(fitPhrases);

                function render() {
                    if (!textSpan.isConnected) return;
                    textSpan.textContent = currentChars.slice(0, Math.round(proxy.chars)).join('');
                }

                function setPhase(phase, label) {
                    el.classList.toggle('is-typing', phase === 'typing');
                    el.classList.toggle('is-deleting', phase === 'deleting');
                    el.classList.toggle('is-complete', phase === 'ready');
                    if (system) system.dataset.phase = phase;
                    if (status) status.textContent = label;
                }

                const tl = gsap.timeline({
                    paused: true,
                    delay: CONFIG.delay,
                    repeat: looping ? -1 : 0,
                    onStart: function dispatchStart() {
                        el.dispatchEvent(new CustomEvent('typewriter:start', {
                            bubbles: true,
                            detail: { text: fullText }
                        }));
                    }
                });
                timelines.push(tl);

                phrases.forEach(function addPhrase(phrase, index) {
                    const chars = Array.from(phrase);
                    const typeDuration = chars.length * CONFIG.speed;
                    const deleteDuration = chars.length * CONFIG.speed * CONFIG.deleteSpeed;

                    tl.call(function preparePhrase() {
                        currentChars = chars;
                        proxy.chars = 0;
                        render();
                        setPhase('typing', 'COMPOSE');
                        if (progress) gsap.set(progress, { scaleX: 0 });
                    });

                    tl.to(proxy, {
                        chars: chars.length,
                        duration: typeDuration,
                        ease: 'none',
                        snap: { chars: 1 },
                        onUpdate: render,
                        onComplete: function dispatchComplete() {
                            el.dispatchEvent(new CustomEvent('typewriter:complete', {
                                bubbles: true,
                                detail: { text: phrase, index: index }
                            }));
                        }
                    });

                    if (progress) {
                        tl.to(progress, { scaleX: 1, duration: typeDuration, ease: 'none' }, '<');
                    }

                    if (!looping) {
                        tl.call(function settleOnce() { setPhase('ready', 'READY'); });
                        return;
                    }

                    tl.call(function beginHold() {
                        setPhase('holding', 'HOLD');
                    });
                    tl.to({}, { duration: CONFIG.hold });
                    tl.call(function beginDelete() {
                        setPhase('deleting', 'PURGE');
                    });
                    tl.to(proxy, {
                        chars: 0,
                        duration: deleteDuration,
                        ease: 'power3.in',
                        snap: { chars: 1 },
                        onUpdate: render
                    });
                    if (progress) {
                        tl.to(progress, { scaleX: 0, duration: deleteDuration, ease: 'power3.in' }, '<');
                    }
                });

                if (activeCursor) {
                    tl.eventCallback('onRepeat', function resetCursor() {
                        gsap.set(activeCursor, { scaleY: 1, opacity: 1 });
                    });
                }

                const trigger = ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                    onEnter: function playTimeline() { tl.play(); }
                });
                ownedTriggers.push(trigger);

                if (replay && !handlers.has(replay)) {
                    const handleReplay = function handleReplay() {
                        if (!el.isConnected) return;
                        tl.pause(0);
                        proxy.chars = 0;
                        render();
                        tl.play();
                    };
                    replay.addEventListener('click', handleReplay);
                    handlers.set(replay, handleReplay);
                }
            });

            document.documentElement.classList.add('typewriter-ready');

            return function cleanupMatchMedia() {
                handlers.forEach(function removeHandler(handler, element) {
                    element.removeEventListener('click', handler);
                });
                handlers.clear();
                timelines.forEach(function killTimeline(timeline) { timeline.kill(); });
                timelines.length = 0;
                ownedTriggers.forEach(function killTrigger(trigger) { trigger.kill(); });
                ownedTriggers.length = 0;
                resizeHandlers.forEach(function removeFitHandler(handler) {
                    window.removeEventListener('resize', handler);
                });
                resizeHandlers.length = 0;
            };
        });
    });

    window.gsapContext = ctx;

    window.addEventListener('beforeunload', function cleanupBeforeUnload() {
        ctx.revert();
    }, { once: true });
});
