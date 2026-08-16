/**
 * 3D Card Flip
 * Tactile front/back cards with hover, focus, tap, grouped auto-close,
 * programmatic class control, and an optional ScrollTrigger entrance.
 *
 * @plugins ScrollTrigger
 * @techniques 3d-transforms, hover-effect, click-toggle, scroll-reveal
 */

gsap.registerPlugin(ScrollTrigger);

(function onReady(init) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})(function initCardFlip() {
	document.documentElement.classList.add('has-js');

	const ctx = gsap.context(function cardFlipContext() {
		const mm = gsap.matchMedia();

		mm.add({
			isFine: '(pointer: fine)',
			isMotionSafe: '(prefers-reduced-motion: no-preference)',
			isReduced: '(prefers-reduced-motion: reduce)'
		}, function setupCards(context) {
			const { isFine, isReduced } = context.conditions;
			const cards = Array.from(document.querySelectorAll('.flip-card'));
			const handlers = new Map();
			const states = new WeakMap();
			const entranceTriggers = [];
			let activeCard = null;

			function updateGrid(nextActive, instant) {
				activeCard = nextActive && nextActive.isConnected ? nextActive : null;
				cards.forEach(function yieldCard(card) {
					const isActive = card === activeCard;
					const shouldYield = Boolean(activeCard && !isActive);
					if (isReduced || instant) {
						gsap.set(card, { scale: isActive ? 1.025 : shouldYield ? 0.965 : 1, y: shouldYield ? 8 : 0 });
						return;
					}
					gsap.to(card, {
						scale: isActive ? 1.025 : shouldYield ? 0.965 : 1,
						y: shouldYield ? 8 : 0,
						duration: 0.55,
						ease: 'power3.out',
						overwrite: 'auto'
					});
				});
		}

			function renderCard(card, open, instant) {
				if (!card.isConnected) return;
				const state = states.get(card);
				if (!state || (state.open === open && !instant)) return;
				state.open = open;
				card.setAttribute('aria-pressed', String(open));

				const inner = card.querySelector('.flip-card-inner');
				const shadow = card.querySelector('.card-shadow');
				const edge = card.querySelector('.card-edge');
				const frontLight = card.querySelector('.flip-card-front .face-light');
				const backLight = card.querySelector('.flip-card-back .face-light');
				const duration = instant || isReduced ? 0 : 0.82;
				const ease = 'power4.inOut';

				gsap.to(inner, {
					rotateY: open ? 180 : 0,
					duration,
					ease,
					overwrite: true
				});
				gsap.to(edge, {
					opacity: open ? 0.82 : 0.3,
					x: open ? -5 : 5,
					duration: duration * 0.72,
					ease: 'power3.inOut',
					overwrite: true
				});
				gsap.to(frontLight, {
					opacity: open ? 0.05 : 0.42,
					xPercent: open ? -35 : 25,
					duration,
					ease,
					overwrite: true
				});
				gsap.to(backLight, {
					opacity: open ? 0.48 : 0.08,
					xPercent: open ? -18 : 35,
					duration,
					ease,
					overwrite: true
				});
				gsap.to(shadow, {
					x: open ? -18 : 18,
					scaleX: open ? 0.86 : 1,
					opacity: open ? 0.58 : 0.34,
					duration,
					ease,
					overwrite: true
				});
			}

			function closeGroup(card, instant) {
				const group = card.closest('[data-flip-group="auto-close"]');
				if (!group) return;
				group.querySelectorAll('.flip-card.flipped').forEach(function closeSibling(sibling) {
					if (sibling !== card) setFlipped(sibling, false, instant);
				});
			}

			function setFlipped(card, open, instant) {
				if (!card || !card.isConnected) return;
				if (open) closeGroup(card, instant);
				card.classList.toggle('flipped', open);
				renderCard(card, open, instant);
				updateGrid(open ? card : activeCard === card ? null : activeCard, instant);
			}

			cards.forEach(function setupCard(card) {
				const flipMode = card.dataset.flip || 'hover';
				if (!card.hasAttribute('tabindex') && !/^(BUTTON|A)$/.test(card.tagName)) card.tabIndex = 0;
				if (!card.hasAttribute('role') && !/^(BUTTON|A)$/.test(card.tagName)) card.setAttribute('role', 'button');
				states.set(card, { open: !card.classList.contains('flipped') });
				renderCard(card, card.classList.contains('flipped'), true);

				function toggle() {
					setFlipped(card, !card.classList.contains('flipped'), isReduced);
				}
				function enter() {
					setFlipped(card, true, isReduced);
				}
				function leave() {
					if (!card.matches(':hover') && document.activeElement !== card) setFlipped(card, false, isReduced);
				}
				function click() {
					if (isReduced || !(flipMode === 'hover' && isFine)) toggle();
				}
				function keydown(event) {
					/* Buttons and links already convert Enter/Space to click. This fallback
					   is only for legacy non-semantic card markup. */
					if (/^(BUTTON|A)$/.test(card.tagName)) return;
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						if (flipMode === 'click' || !isFine || isReduced) toggle();
					}
				}

				card.addEventListener('click', click);
				card.addEventListener('keydown', keydown);
				if (flipMode === 'hover' && isFine && !isReduced) {
					card.addEventListener('mouseenter', enter);
					card.addEventListener('mouseleave', leave);
					card.addEventListener('focus', enter);
					card.addEventListener('blur', leave);
				}
				handlers.set(card, { click, keydown, enter, leave, hoverBound: flipMode === 'hover' && isFine && !isReduced });
			});

			function handleEscape(event) {
				if (event.key !== 'Escape') return;
				cards.forEach(function closeCard(card) { setFlipped(card, false, isReduced); });
			}
			document.addEventListener('keydown', handleEscape);

			const observer = new MutationObserver(function syncClass(mutations) {
				mutations.forEach(function syncCard(mutation) {
					const card = mutation.target;
					renderCard(card, card.classList.contains('flipped'), isReduced);
					updateGrid(card.classList.contains('flipped') ? card : activeCard === card ? null : activeCard, isReduced);
				});
			});
			cards.forEach(function observeCard(card) { observer.observe(card, { attributes: true, attributeFilter: ['class'] }); });

			if (!isReduced) {
				document.querySelectorAll('[data-flip-stagger]').forEach(function setupEntrance(container) {
					const tween = gsap.from(container.querySelectorAll('.flip-card'), {
						y: 52,
						rotationX: -8,
						opacity: 0,
						duration: 0.85,
						ease: 'power3.out',
						stagger: 0.1,
						scrollTrigger: { trigger: container, start: 'top 92%', once: true }
					});
					if (tween.scrollTrigger) entranceTriggers.push(tween.scrollTrigger);
				});
			}

			return function cleanup() {
				observer.disconnect();
				document.removeEventListener('keydown', handleEscape);
				handlers.forEach(function removeHandlers(record, card) {
					card.removeEventListener('click', record.click);
					card.removeEventListener('keydown', record.keydown);
					if (record.hoverBound) {
						card.removeEventListener('mouseenter', record.enter);
						card.removeEventListener('mouseleave', record.leave);
						card.removeEventListener('focus', record.enter);
						card.removeEventListener('blur', record.leave);
					}
				});
				handlers.clear();
				entranceTriggers.forEach(function killTrigger(trigger) { trigger.kill(); });
			};
		});
	});

	window.gsapContext = ctx;
	window.addEventListener('beforeunload', function cleanupCardFlip() { ctx.kill(); }, { once: true });
});
