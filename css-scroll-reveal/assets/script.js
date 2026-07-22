/**
 * CSS Scroll Reveal
 *
 * This effect is pure CSS - no JavaScript required for the animations.
 * This file only handles browser support detection for better UX.
 */

/**
 * CSS Scroll Reveal
 *
 * This effect is pure CSS - no JavaScript required for the animations.
 * This file only handles browser support detection for the UI notice.
 */

/* Runs the init straight away if the DOM is already parsed (a script
   executed late or deferred, e.g. by Cloudflare Rocket Loader), and
   waits for DOMContentLoaded otherwise. */
(function onReady(init) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})(function() {
	'use strict';

	// Check for CSS scroll-driven animation support
	var supportsScrollTimeline = CSS.supports('animation-timeline', 'view()');

	if (!supportsScrollTimeline) {
		// Add class to body for potential styling hooks
		document.body.classList.add('no-scroll-timeline');

		// Update the browser notice
		var notice = document.querySelector('.browser-notice');
		if (notice) {
			notice.style.background = 'rgba(255, 100, 100, 0.08)';
			notice.style.borderColor = '#ff6464';
			notice.querySelector('.browser-notice-content').innerHTML = '<strong>Browser Not Supported:</strong> Your browser does not support native CSS scroll-driven animations yet. Elements will be visible but static.';
		}
	}
});
