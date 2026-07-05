gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', function handleDOMLoaded() {

	/* OPTIONAL: Lenis - Remove if not using smooth scroll */
	let lenis = null;
	if (typeof Lenis !== 'undefined') {
		lenis = new Lenis({ autoRaf: true });
	}
	/* END OPTIONAL: Lenis */

	const progressInstances = [];

	/* CORE: ScrollProgress Class - Required */
	class ScrollProgress {
		constructor(element, options = {}) {
			this.element = element;
			this.style = options.style || element.dataset.progressStyle || 'bar';
			this.position = options.position || element.dataset.progressPosition || null;
			this.trigger = null;
			this.quickTo = null;
			this.init();
		}

		init() {
			switch (this.style) {
				case 'bar':
					this.initBar();
					break;
				case 'circle':
					this.initCircle();
					break;
				case 'rail':
					this.initRail();
					break;
				case 'counter':
					this.initCounter();
					break;
			}
		}

		/* STYLE: Linear Bar */
		initBar() {
			const fill = this.element.querySelector('.progress-bar__fill');
			if (!fill) return;

			this.trigger = ScrollTrigger.create({
				trigger: document.documentElement,
				start: 'top top',
				end: 'bottom bottom',
				scrub: 0.5,
				onUpdate: function(self) {
					gsap.set(fill, { scaleX: self.progress });
				}
			});
		}

		/* STYLE: Circular Ring */
		initCircle() {
			const fillPath = this.element.querySelector('.progress-circle__fill');
			const textEl = this.element.querySelector('.progress-circle__text');
			if (!fillPath) return;

			const circumference = 157; // 2 * PI * 25 (radius)

			this.trigger = ScrollTrigger.create({
				trigger: document.documentElement,
				start: 'top top',
				end: 'bottom bottom',
				scrub: 0.5,
				onUpdate: function(self) {
					const offset = circumference * (1 - self.progress);
					gsap.set(fillPath, { strokeDashoffset: offset });
					if (textEl) {
						textEl.textContent = Math.round(self.progress * 100) + '%';
					}
				}
			});
		}

		/* STYLE: Side Rail */
		initRail() {
			const fill = this.element.querySelector('.progress-rail__fill');
			if (!fill) return;

			this.trigger = ScrollTrigger.create({
				trigger: document.documentElement,
				start: 'top top',
				end: 'bottom bottom',
				scrub: 0.5,
				onUpdate: function(self) {
					gsap.set(fill, { scaleY: self.progress });
				}
			});
		}

		/* STYLE: Percentage Counter */
		initCounter() {
			const valueEl = this.element.querySelector('.progress-counter__value');
			if (!valueEl) return;

			const obj = { value: 0 };
			this.quickTo = gsap.quickTo(obj, 'value', {
				duration: 0.3,
				ease: 'power2.out',
				onUpdate: function() {
					valueEl.textContent = Math.round(obj.value);
				}
			});

			const quickTo = this.quickTo;
			this.trigger = ScrollTrigger.create({
				trigger: document.documentElement,
				start: 'top top',
				end: 'bottom bottom',
				onUpdate: function(self) {
					quickTo(self.progress * 100);
				}
			});
		}

		destroy() {
			if (this.trigger) {
				this.trigger.kill();
			}
		}
	}
	/* END CORE */

	const ctx = gsap.context(function() {
		const mm = gsap.matchMedia();

		mm.add('(prefers-reduced-motion: no-preference)', function() {

			/* Initialize all progress indicators */
			document.querySelectorAll('[data-progress-style]').forEach(function(element) {
				const progress = new ScrollProgress(element);
				progressInstances.push(progress);
			});

			return function() {
				progressInstances.forEach(function(instance) {
					instance.destroy();
				});
				progressInstances.length = 0;
			};
		});

		mm.add('(prefers-reduced-motion: reduce)', function() {
			// CSS handles showing 100% state
		});
	});

	window.ScrollProgress = ScrollProgress;
	window.gsapContext = ctx;

	window.addEventListener('beforeunload', function() {
		if (ctx) ctx.kill();
		if (lenis) lenis.destroy();
	});
});
