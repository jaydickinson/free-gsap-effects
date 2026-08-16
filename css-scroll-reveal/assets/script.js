/**
 * CSS Scroll Reveal
 *
 * The reveals are entirely CSS-driven. This optional helper only exposes a
 * support hook so unsupported browsers can render the completed composition.
 */
(function onReady(init) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})(function detectScrollTimelineSupport() {
	'use strict';

	if (!window.CSS || !CSS.supports('animation-timeline', 'view()')) {
		document.documentElement.classList.add('no-scroll-timeline');
	}
});
