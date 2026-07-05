/**
 * 3D Card Flip Effect
 *
 * Interactive cards with smooth 3D flip animations.
 * Supports hover (desktop) and click/tap (touch) triggers.
 * Includes auto-close groups and staggered scroll entrance.
 *
 * @plugins ScrollTrigger
 * @techniques 3d-transform, flip-card, stagger, scroll-reveal, matchMedia
 * @usesLenis true (optional)
 */

gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', function initCardFlip() {
	// ============================================
	// LENIS SMOOTH SCROLL (OPTIONAL)
	// ============================================
	let lenis = null;

	function initLenis() {
		if (typeof Lenis === 'undefined') return;

		lenis = new Lenis({
			duration: 1.2,
			easing: function lenisEasing(t) {
				return Math.min(1, 1.001 - Math.pow(2, -10 * t));
			},
			smoothWheel: true
		});

		lenis.on('scroll', ScrollTrigger.update);

		gsap.ticker.add(function tickerCallback(time) {
			lenis.raf(time * 1000);
		});

		gsap.ticker.lagSmoothing(0);
	}

	// ============================================
	// GSAP CONTEXT
	// ============================================
	const ctx = gsap.context(function gsapContextCallback() {
		const mm = gsap.matchMedia();

		mm.add({
			isDesktop: '(pointer: fine) and (prefers-reduced-motion: no-preference)',
			isTouch: '(pointer: coarse) and (prefers-reduced-motion: no-preference)',
			isReduced: '(prefers-reduced-motion: reduce)'
		}, function matchMediaCallback(context) {
			const { isDesktop, isTouch, isReduced } = context.conditions;

			// Initialize Lenis for motion-enabled users
			if (!isReduced && !lenis) {
				initLenis();
			}

			// ============================================
			// CARD FLIP HANDLERS
			// ============================================
			const flipCards = document.querySelectorAll('.flip-card');
			const cardHandlers = new Map();

			flipCards.forEach(function setupCard(card) {
				const flipMode = card.dataset.flip || 'hover';
				const group = card.closest('[data-flip-group]');

				// Ensure keyboard accessibility
				if (!card.hasAttribute('tabindex')) {
					card.setAttribute('tabindex', '0');
				}
				if (!card.hasAttribute('role')) {
					card.setAttribute('role', 'button');
				}

				if (isReduced) {
					// Reduced motion: instant class toggle on click/Enter/Space
					function handleReducedClick() {
						card.classList.toggle('flipped');
					}
					function handleReducedKeydown(e) {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							card.classList.toggle('flipped');
						}
					}
					card.addEventListener('click', handleReducedClick);
					card.addEventListener('keydown', handleReducedKeydown);
					cardHandlers.set(card, { click: handleReducedClick, keydown: handleReducedKeydown });
				} else if (flipMode === 'hover' && isDesktop) {
					// Desktop hover mode with keyboard support
					function handleEnter() {
						card.classList.add('flipped');
					}
					function handleLeave() {
						card.classList.remove('flipped');
					}
					// Mouse events
					card.addEventListener('mouseenter', handleEnter);
					card.addEventListener('mouseleave', handleLeave);
					// Keyboard focus events
					card.addEventListener('focus', handleEnter);
					card.addEventListener('blur', handleLeave);
					cardHandlers.set(card, {
						mouseenter: handleEnter,
						mouseleave: handleLeave,
						focus: handleEnter,
						blur: handleLeave
					});
				} else {
					// Click/tap mode (or touch device fallback for hover cards)
					function handleClick() {
						// Auto-close other cards in group
						if (group && group.dataset.flipGroup === 'auto-close') {
							const siblings = group.querySelectorAll('.flip-card');
							siblings.forEach(function closeSibling(sibling) {
								if (sibling !== card) {
									sibling.classList.remove('flipped');
								}
							});
						}
						card.classList.toggle('flipped');
					}
					function handleKeydown(e) {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleClick();
						}
					}
					card.addEventListener('click', handleClick);
					card.addEventListener('keydown', handleKeydown);
					cardHandlers.set(card, { click: handleClick, keydown: handleKeydown });
				}
			});

			// ============================================
			// STAGGERED SCROLL ENTRANCE
			// ============================================
			if (!isReduced) {
				const staggerContainers = document.querySelectorAll('[data-flip-stagger]');

				staggerContainers.forEach(function setupStagger(container) {
					const cards = container.querySelectorAll('.flip-card');

					gsap.from(cards, {
						y: 60,
						opacity: 0,
						rotationX: -10,
						duration: 0.8,
						ease: 'power3.out',
						stagger: 0.15,
						scrollTrigger: {
							trigger: container,
							start: 'top 85%'
						}
					});
				});
			}

			// ============================================
			// CLEANUP
			// ============================================
			return function cleanup() {
				// Remove card event listeners
				cardHandlers.forEach(function removeHandlers(handlers, card) {
					Object.keys(handlers).forEach(function removeHandler(eventType) {
						card.removeEventListener(eventType, handlers[eventType]);
					});
				});
				cardHandlers.clear();

				// Kill ScrollTriggers
				ScrollTrigger.getAll().forEach(function killTrigger(trigger) {
					trigger.kill();
				});

				// Destroy Lenis
				if (lenis) {
					lenis.destroy();
					lenis = null;
				}
			};
		});
	});

	// Store context for SPA cleanup
	window.gsapContext = ctx;
});
