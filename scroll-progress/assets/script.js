gsap.registerPlugin(ScrollTrigger);

/* Runs immediately when the DOM is ready, including when this file is deferred. */
(function onReady(init) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})(function initScrollProgress() {
	document.documentElement.classList.add('has-js');

	const instances = [];
	const handlers = new Map();

	/* CORE: each style remains independently usable through data attributes or JS. */
	class ScrollProgress {
		constructor(element, options = {}) {
			this.element = element;
			this.style = options.style || element.dataset.progressStyle || 'bar';
			this.position = options.position || element.dataset.progressPosition || null;
			this.triggerElement = options.trigger || document.documentElement;
			this.start = options.start || 'top top';
			this.end = options.end || 'bottom bottom';
			this.trigger = null;
			this.update = null;
			this.init();
		}

		init() {
			const element = this.element;
			let render;

			if (this.style === 'bar') {
				const fill = element.querySelector('.progress-bar__fill');
				if (fill) render = function(progress) {
					gsap.set(fill, { scaleX: progress });
				};
			}

			if (this.style === 'circle' || this.style === 'ring') {
				const path = element.querySelector('.progress-circle__fill');
				const text = element.querySelector('.progress-circle__text');
				if (path) {
					const circumference = path.getTotalLength ? path.getTotalLength() : 157;
					gsap.set(path, { strokeDasharray: circumference });
					render = function(progress) {
						gsap.set(path, { strokeDashoffset: circumference * (1 - progress) });
						if (text && text.isConnected) text.textContent = Math.round(progress * 100) + '%';
					};
				}
			}

			if (this.style === 'rail') {
				const fill = element.querySelector('.progress-rail__fill');
				if (fill) render = function(progress) {
					gsap.set(fill, { scaleY: progress });
				};
			}

			if (this.style === 'counter' || this.style === 'percentage') {
				const value = element.querySelector('.progress-counter__value');
				if (value) render = function(progress) {
					if (value.isConnected) value.textContent = String(Math.round(progress * 100)).padStart(3, '0');
				};
			}

			if (!render) return;

			this.update = function(rawProgress) {
				/* Clamp the final fraction so the instrument always lands on exact 100. */
				const progress = rawProgress >= 0.9995 ? 1 : gsap.utils.clamp(0, 1, rawProgress);
				render(progress);
				element.setAttribute('aria-valuenow', Math.round(progress * 100));
			};

			const update = this.update;
			this.trigger = ScrollTrigger.create({
				trigger: this.triggerElement,
				start: this.start,
				end: this.end,
				onUpdate: function(self) { update(self.progress); },
				onRefresh: function(self) { update(self.progress); }
			});
			this.update(this.trigger.progress);
		}

		destroy() {
			if (this.trigger) this.trigger.kill();
			this.trigger = null;
		}
	}

	function mountIndicators() {
		document.querySelectorAll('[data-progress-style]').forEach(function(element) {
			instances.push(new ScrollProgress(element));
		});

		const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
		const chapterLabel = document.querySelector('[data-current-chapter]');
		const routeStops = Array.from(document.querySelectorAll('[data-route-stop]'));
		const stage = document.querySelector('.field-note');

		if (stage && chapters.length) {
			let activeIndex = -1;
			const chapterTrigger = ScrollTrigger.create({
				trigger: document.documentElement,
				start: 'top top',
				end: 'bottom bottom',
				onUpdate: syncFieldNote,
				onRefresh: syncFieldNote
			});

			function syncFieldNote(self) {
				const progress = self.progress >= 0.9995 ? 1 : self.progress;
				const nextIndex = progress === 1
					? chapters.length - 1
					: Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
				stage.style.setProperty('--route-color', gsap.utils.interpolate('#ff6b1a', '#c8ff00', progress));
				if (nextIndex === activeIndex) return;
				activeIndex = nextIndex;
				if (chapterLabel && chapterLabel.isConnected) {
					chapterLabel.textContent = chapters[activeIndex].dataset.chapter;
				}
				routeStops.forEach(function(stop, index) {
					stop.classList.toggle('is-active', index === activeIndex);
					if (index === activeIndex) stop.setAttribute('aria-current', 'step');
					else stop.removeAttribute('aria-current');
				});
			}

			syncFieldNote(chapterTrigger);
			instances.push({ destroy: function() { chapterTrigger.kill(); } });
		}

		return function cleanupIndicators() {
			instances.forEach(function(instance) { instance.destroy(); });
			instances.length = 0;
		};
	}

	function mountModeSwitcher() {
		const buttons = document.querySelectorAll('[data-mode-button]');
		buttons.forEach(function(button) {
			const handleClick = function() {
				const mode = button.dataset.modeButton;
				document.body.dataset.mode = mode;
				buttons.forEach(function(item) {
					item.setAttribute('aria-pressed', String(item === button));
				});
			};
			button.addEventListener('click', handleClick);
			handlers.set(button, handleClick);
		});
	}

	const ctx = gsap.context(function() {
		const mm = gsap.matchMedia();
		mm.add('(prefers-reduced-motion: no-preference)', mountIndicators);
		/* Progress remains useful in reduced motion; updates are direct, with no scrub. */
		mm.add('(prefers-reduced-motion: reduce)', mountIndicators);
		mountModeSwitcher();
	});

	function destroy() {
		handlers.forEach(function(handler, element) {
			element.removeEventListener('click', handler);
		});
		handlers.clear();
		ctx.revert();
	}

	window.ScrollProgress = ScrollProgress;
	window.gsapContext = ctx;
	window.destroyScrollProgress = destroy;
	window.addEventListener('beforeunload', destroy, { once: true });
});
