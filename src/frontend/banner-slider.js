import Swiper from 'swiper';
import { A11y, Autoplay, EffectCreative, EffectFade, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-creative';

const emit = ( root, name, detail, cancelable = false ) => {
	const event = new CustomEvent( name, { detail, cancelable } );
	root.dispatchEvent( event );
	return event;
};

const initBanner = ( root ) => {
	if ( root.dataset.bannerReady === '1' ) return;
	const viewport = root.querySelector( '.xsb-banner-swiper' );
	const slides = Array.from( root.querySelectorAll( '[data-banner-slide]' ) );
	if ( ! viewport || slides.length < 2 ) return;
	root.dataset.bannerReady = '1';

	const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	const transition = root.dataset.transition || 'slide';
	const swiper = new Swiper( viewport, {
		modules: [ A11y, Autoplay, EffectCreative, EffectFade, Keyboard ],
		init: false,
		loop: root.dataset.loop === 'true',
		effect: transition === 'fade' ? 'fade' : ( transition === 'zoom' ? 'creative' : 'slide' ),
		fadeEffect: { crossFade: true },
		creativeEffect: {
			prev: { translate: [ 0, 0, -1 ], scale: 0.96, opacity: 0 },
			next: { translate: [ 0, 0, -1 ], scale: 1.04, opacity: 0 },
		},
		speed: reducedMotion ? 0 : 450,
		keyboard: { enabled: true, onlyInViewport: true },
		watchOverflow: true,
		a11y: { enabled: true },
		autoplay: root.dataset.autoplay === 'true' && ! reducedMotion ? {
			delay: Math.max( 1000, Number( root.dataset.delay ) || 5000 ),
			disableOnInteraction: root.dataset.pauseInteraction === 'true',
			pauseOnMouseEnter: root.dataset.pauseHover === 'true',
		} : false,
		on: {
			beforeSlideChangeStart( instance ) {
				const target = instance.realIndex;
				emit( root, 'xcopb:beforeRender', { index: target, slide: slides[ target ] } );
			},
			slideChange( instance ) {
				const index = instance.realIndex;
				instance.slides.forEach( ( slide ) => {
					const active = slide.classList.contains( 'swiper-slide-active' );
					slide.setAttribute( 'aria-hidden', active ? 'false' : 'true' );
					if ( 'inert' in slide ) slide.inert = ! active;
				} );
				root.querySelectorAll( '[data-banner-to]' ).forEach( ( button ) => {
					const active = Number( button.dataset.bannerTo ) === index;
					button.classList.toggle( 'is-active', active );
					if ( active ) button.setAttribute( 'aria-current', 'true' );
					else button.removeAttribute( 'aria-current' );
				} );
				const current = root.querySelector( '[data-banner-current]' );
				if ( current ) current.textContent = String( index + 1 );
				const progress = root.querySelector( '[data-banner-progress]' );
				if ( progress ) {
					progress.style.transitionDuration = instance.autoplay.running ? '0ms' : '280ms';
					progress.style.transform = `scaleX(${ instance.autoplay.running ? 0 : ( index + 1 ) / slides.length })`;
				}
				const bar = progress && progress.parentElement;
				if ( bar ) bar.setAttribute( 'aria-valuenow', String( index + 1 ) );
				const detail = { index, slide: slides[ index ] };
				emit( root, 'xcopb:slidechange', detail );
				if ( typeof root.xcopbOnSlideChange === 'function' ) root.xcopbOnSlideChange( detail );
			},
			autoplayTimeLeft( instance, _timeLeft, percentage ) {
				const progress = root.querySelector( '[data-banner-progress]' );
				if ( progress ) {
					progress.style.transitionDuration = '0ms';
					progress.style.transform = `scaleX(${ Math.max( 0, Math.min( 1, 1 - percentage ) ) })`;
				}
			},
			autoplayStart() {
				const button = root.querySelector( '[data-banner-pause]' );
				if ( button ) {
					button.setAttribute( 'aria-pressed', 'false' );
					button.setAttribute( 'aria-label', 'Pause slide rotation' );
				}
			},
			autoplayStop() {
				const button = root.querySelector( '[data-banner-pause]' );
				if ( button && root.dataset.autoplay === 'true' ) {
					button.setAttribute( 'aria-pressed', 'true' );
					button.setAttribute( 'aria-label', 'Resume slide rotation' );
				}
			},
		},
	} );

	root.querySelector( '[data-banner-prev]' )?.addEventListener( 'click', () => swiper.slidePrev() );
	root.querySelector( '[data-banner-next]' )?.addEventListener( 'click', () => swiper.slideNext() );
	root.querySelectorAll( '[data-banner-to]' ).forEach( ( button ) => {
		button.addEventListener( 'click', () => swiper.slideToLoop( Number( button.dataset.bannerTo ) ) );
	} );
	root.querySelector( '[data-banner-pause]' )?.addEventListener( 'click', ( event ) => {
		const button = event.currentTarget;
		const paused = button.getAttribute( 'aria-pressed' ) !== 'true';
		button.setAttribute( 'aria-pressed', paused ? 'true' : 'false' );
		button.setAttribute( 'aria-label', paused ? 'Resume slide rotation' : 'Pause slide rotation' );
		if ( paused ) swiper.autoplay.stop();
		else swiper.autoplay.start();
		const icon = button.querySelector( 'span' );
		if ( icon ) icon.textContent = paused ? '▶' : 'Ⅱ';
	} );

	swiper.init();
	const progress = root.querySelector( '[data-banner-progress]' );
	if ( progress && root.dataset.autoplay !== 'true' ) {
		progress.style.transform = `scaleX(${ 1 / slides.length })`;
	}
	root.swiper = swiper;
};

const init = () => document.querySelectorAll( '.xsb-banner-slider' ).forEach( initBanner );

if ( document.readyState === 'loading' ) document.addEventListener( 'DOMContentLoaded', init, { once: true } );
else init();

const observer = new MutationObserver( () => init() );
observer.observe( document.documentElement, { childList: true, subtree: true } );
