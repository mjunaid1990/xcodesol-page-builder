/** Live canvas preview for the Hero Banner widget. */
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { resolveMotionStyle } from '../lib/widget-styles';
import apiFetch from '@wordpress/api-fetch';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCreative, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-creative';
import { resolveBackgroundMedia } from '../lib/background-media';

const replaceDynamicTokens = ( text, title ) => String( text || '' )
	.replace( /\{post_title\}/g, title )
	.replace( /\{post_excerpt\}/g, __( 'A sample post excerpt.', 'xcodesol-page-builder' ) )
	.replace( /\{post_url\}/g, '#' )
	.replace( /\{post_date\}/g, __( 'Sample date', 'xcodesol-page-builder' ) )
	.replace( /\{author\}/g, __( 'Sample author', 'xcodesol-page-builder' ) )
	.replace( /\{category\}/g, __( 'Sample category', 'xcodesol-page-builder' ) );

const getBannerDesignStyle = ( settings ) => {
	const padding = settings.slide_padding && typeof settings.slide_padding === 'object' ? settings.slide_padding : {};
	const unit = padding.unit || 'px';
	const number = ( key, fallback ) => settings[ key ] === undefined || settings[ key ] === '' ? fallback : Number( settings[ key ] );
	const side = ( key, fallback ) => `${ Number( padding[ key ] ?? settings[ `padding_${ key }` ] ?? fallback ) }${ unit }`;
	const arrowY = { top: '18%', center: '50%', bottom: '82%' }[ settings.arrow_position || 'center' ];
	const dotRadius = { circle: '50%', pill: '999px', square: '3px' }[ settings.dot_shape || 'pill' ];
	const textShadows = { none: 'none', soft: '0 2px 10px rgba(0,0,0,.3)', strong: '0 3px 18px rgba(0,0,0,.6)' };
	const flexAlign = { left: 'flex-start', center: 'center', right: 'flex-end' };
	return {
		'--xsb-banner-slide-padding': `${ side( 'top', 80 ) } ${ side( 'right', 24 ) } ${ side( 'bottom', 80 ) } ${ side( 'left', 24 ) }`,
		'--xsb-banner-heading-font-family': settings.heading_font_family || settings.title_font_family || 'inherit',
		'--xsb-banner-heading-size': `${ number( 'heading_font_size', number( 'title_font_size', 48 ) ) }px`,
		'--xsb-banner-heading-weight': settings.heading_font_weight || settings.title_font_weight || 700,
		'--xsb-banner-heading-font-style': settings.heading_font_style || 'normal',
		'--xsb-banner-heading-line-height': settings.heading_line_height || settings.title_line_height || 1.15,
		'--xsb-banner-heading-letter-spacing': `${ number( 'heading_letter_spacing', number( 'title_letter_spacing', 0 ) ) }px`,
		'--xsb-banner-heading-transform': settings.heading_text_transform || settings.title_text_transform || 'none',
		'--xsb-banner-heading-shadow': textShadows[ settings.heading_text_shadow || 'none' ],
		'--xsb-banner-heading-color': settings.heading_color || settings.title_color || '#fff',
		'--xsb-banner-heading-align': settings.heading_alignment || settings.align || 'center',
		'--xsb-banner-description-font-family': settings.description_font_family || settings.subtitle_font_family || 'inherit',
		'--xsb-banner-description-size': `${ number( 'description_font_size', number( 'subtitle_font_size', 18 ) ) }px`,
		'--xsb-banner-description-weight': settings.description_font_weight || settings.subtitle_font_weight || 400,
		'--xsb-banner-description-font-style': settings.description_font_style || 'normal',
		'--xsb-banner-description-line-height': settings.description_line_height || settings.subtitle_line_height || 1.5,
		'--xsb-banner-description-letter-spacing': `${ number( 'description_letter_spacing', number( 'subtitle_letter_spacing', 0 ) ) }px`,
		'--xsb-banner-description-transform': settings.description_text_transform || 'none',
		'--xsb-banner-description-shadow': textShadows[ settings.description_text_shadow || 'none' ],
		'--xsb-banner-description-color': settings.description_color || settings.subtitle_color || '#fff',
		'--xsb-banner-description-align': settings.description_alignment || settings.align || 'center',
		'--xsb-banner-button-font-family': settings.button_font_family || 'inherit',
		'--xsb-banner-button-size': `${ number( 'button_font_size', 15 ) }px`,
		'--xsb-banner-button-weight': settings.button_font_weight || 600,
		'--xsb-banner-button-font-style': settings.button_font_style || 'normal',
		'--xsb-banner-button-line-height': settings.button_line_height || 1.2,
		'--xsb-banner-button-letter-spacing': `${ number( 'button_letter_spacing', 0 ) }px`,
		'--xsb-banner-button-transform': settings.button_text_transform || 'none',
		'--xsb-banner-button-align': flexAlign[ settings.button_alignment || 'center' ] || 'center',
		'--xsb-banner-button-text-align': settings.button_text_alignment || 'center',
		'--xsb-banner-button-shadow': textShadows[ settings.button_text_shadow || 'none' ],
		'--xsb-banner-button-width': settings.button_width === 'full' ? '100%' : 'auto',
		'--xsb-banner-button-bg': settings.button_bg_color || '#4f46e5',
		'--xsb-banner-button-color': settings.button_text_color || '#fff',
		'--xsb-banner-button-hover-bg': settings.button_hover_bg_color || '#4338ca',
		'--xsb-banner-button-hover-color': settings.button_hover_text_color || '#fff',
		'--xsb-banner-button-border-color': settings.button_border_color || '#fff',
		'--xsb-banner-button-border-width': `${ number( 'button_border_width', 0 ) }px`,
		'--xsb-banner-button-radius': `${ number( 'button_border_radius', 8 ) }px`,
		'--xsb-banner-button-padding': `${ number( 'button_padding_y', 12 ) }px ${ number( 'button_padding_x', 24 ) }px`,
		'--xsb-banner-heading-gap': `${ number( 'heading_description_gap', 12 ) }px`,
		'--xsb-banner-description-gap': `${ number( 'description_button_gap', 18 ) }px`,
		'--xsb-banner-button-gap': `${ number( 'button_gap', 12 ) }px`,
		'--xsb-banner-arrow-size': `${ number( 'arrow_size', 48 ) }px`,
		'--xsb-banner-arrow-icon-size': `${ number( 'arrow_icon_size', 24 ) }px`,
		'--xsb-banner-arrow-inset': `${ number( 'arrow_inset', 18 ) }px`,
		'--xsb-banner-arrow-y': arrowY,
		'--xsb-banner-arrow-bg': settings.arrow_bg_color || '#fff',
		'--xsb-banner-arrow-color': settings.arrow_icon_color || '#20283a',
		'--xsb-banner-arrow-hover-bg': settings.arrow_hover_bg_color || '#fff',
		'--xsb-banner-arrow-hover-color': settings.arrow_hover_icon_color || '#5148c8',
		'--xsb-banner-arrow-border-color': settings.arrow_border_color || '#fff',
		'--xsb-banner-arrow-border-width': `${ number( 'arrow_border_width', 1 ) }px`,
		'--xsb-banner-arrow-radius': `${ number( 'arrow_border_radius', 100 ) }px`,
		'--xsb-banner-pagination-offset': `${ number( 'pagination_offset', 18 ) }px`,
		'--xsb-banner-pagination-align': flexAlign[ settings.pagination_alignment || 'center' ] || 'center',
		'--xsb-banner-pagination-color': settings.pagination_color || '#fff',
		'--xsb-banner-pagination-active': settings.pagination_active_color || '#fff',
		'--xsb-banner-dot-size': `${ number( 'dot_size', 8 ) }px`,
		'--xsb-banner-dot-active-size': `${ number( 'dot_active_size', 22 ) }px`,
		'--xsb-banner-dot-gap': `${ number( 'dot_gap', 7 ) }px`,
		'--xsb-banner-dot-radius': dotRadius,
		'--xsb-banner-progress-height': `${ number( 'progress_height', 3 ) }px`,
		'--xsb-banner-progress-inset': `${ number( 'progress_inset', 18 ) }px`,
		'--xsb-banner-progress-track': settings.progress_track_color || 'rgba(255,255,255,.3)',
		'--xsb-banner-progress-fill': settings.progress_fill_color || '#fff',
	};
};

function ArrowIcon( { settings = {} } ) {
	const custom = settings.arrow_custom_icon;
	const customUrl = typeof custom === 'object' && custom ? custom.url : '';
	if ( customUrl ) return <img className="xsb-banner-arrow-icon is-custom" src={ customUrl } alt="" aria-hidden="true" />;
	const paths = {
		chevron: <path d="m9 18 6-6-6-6" />,
		angle: <path d="m14 5-7 7 7 7" />,
		arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
		'long-arrow': <path d="M3 12h18m-8-8 8 8-8 8" />,
		caret: <path d="m9 6 6 6-6 6" fill="currentColor" stroke="none" />,
	};
	return <svg className="xsb-banner-arrow-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ paths[ settings.arrow_icon_style ] || paths.chevron }</svg>;
}

export default function BannerPreview( { settings = {}, archiveTitle = '' } ) {
	const swiperRef = useRef( null );
	const progressRef = useRef( null );
	const [ active, setActive ] = useState( 0 );
	const [ queryResult, setQueryResult ] = useState( null );
	const querySettings = Object.fromEntries( [ 'posts_post_type', 'posts_count', 'posts_offset', 'posts_orderby', 'posts_order', 'posts_category', 'posts_tag', 'posts_author', 'posts_include_ids', 'posts_exclude_ids', 'posts_has_image', 'posts_sticky_only', 'query_title_field', 'query_description_field', 'query_image_field', 'query_link_field', 'fallback_image' ].map( ( key ) => [ key, settings[ key ] ] ) );
	const queryKey = JSON.stringify( querySettings );
	useEffect( () => {
		let activeRequest = true;
		if ( ! [ 'posts', 'mixed' ].includes( settings.source_mode ) ) { setQueryResult( null ); return undefined; }
		const timer = setTimeout( () => {
			apiFetch( { path: '/xcopb/v1/hero-query-preview', method: 'POST', data: querySettings } )
				.then( ( items ) => { if ( activeRequest ) setQueryResult( { key: queryKey, slides: Array.isArray( items ) ? items : [] } ); } )
				.catch( () => { if ( activeRequest ) setQueryResult( { key: queryKey, slides: [] } ); } );
		}, 180 );
		return () => { activeRequest = false; clearTimeout( timer ); };
	}, [ queryKey, settings.source_mode ] );
	const slides = Array.isArray( settings.slides ) && settings.slides.length ? settings.slides : [ {
		title: settings.title || __( 'Designed for creators', 'xcodesol-page-builder' ),
		subtitle: settings.subtitle || __( 'Build a responsive experience with complete visual freedom.', 'xcodesol-page-builder' ),
		button_text: settings.button_text || __( 'Get started', 'xcodesol-page-builder' ),
		link: settings.link || '#',
		background_type: 'inherit',
	} ];
	const sampleQuerySlides = [ 'posts', 'mixed' ].includes( settings.source_mode ) ? Array.from( { length: Math.min( 5, Math.max( 1, Number( settings.posts_count ) || 3 ) ) }, ( _, index ) => ( {
		id: `query-slide-${ index + 1 }`,
		type: 'linked-post',
		title: settings.query_title_field === 'excerpt' ? __( 'Sample post summary', 'xcodesol-page-builder' ) : ( settings.query_title_field === 'category' ? __( 'Sample category', 'xcodesol-page-builder' ) : `${ __( 'Sample post title', 'xcodesol-page-builder' ) } ${ index + 1 }` ),
		subtitle: settings.query_description_field === 'none' ? '' : ( settings.query_description_field === 'date' ? __( 'Sample date', 'xcodesol-page-builder' ) : ( settings.query_description_field === 'author' ? __( 'Sample author', 'xcodesol-page-builder' ) : ( settings.query_description_field === 'category' ? __( 'Sample category', 'xcodesol-page-builder' ) : __( 'A preview of the post fields selected in the query mapping.', 'xcodesol-page-builder' ) ) ) ),
		button_text: settings.query_link_field === 'none' ? '' : __( 'Read more', 'xcodesol-page-builder' ),
		link: settings.query_link_field === 'none' ? '' : '#',
		image: settings.query_image_field === 'none' ? '' : settings.fallback_image,
		background_type: settings.query_image_field !== 'none' && settings.fallback_image ? 'image' : 'inherit',
	} ) ) : [];
	const querySlides = queryResult?.key === queryKey ? queryResult.slides : sampleQuerySlides;
	const previewSlides = settings.source_mode === 'posts' ? querySlides : ( settings.source_mode === 'mixed' ? [ ...slides, ...querySlides ] : slides );
	const slider = previewSlides.length > 1 && ( settings.source_mode === 'posts' || !! settings.slider_enabled );
	const visibleSlides = slider ? previewSlides : previewSlides.slice( 0, 1 );
	const transition = settings.transition || 'slide';
	const minHeight = Number( settings.min_height ) || 400;
	const justify = { top: 'flex-start', center: 'center', bottom: 'flex-end' }[ settings.content_position_y || 'center' ];
	const align = { left: 'flex-start', center: 'center', right: 'flex-end' }[ settings.content_position_x || 'center' ];
	const rootStyle = {
		...getBannerDesignStyle( settings ),
		position: 'relative',
		minHeight,
		padding: `${ Number( settings.padding_top ) || 0 }px ${ Number( settings.padding_right ) || 0 }px ${ Number( settings.padding_bottom ) || 0 }px ${ Number( settings.padding_left ) || 0 }px`,
		borderRadius: Number( settings.border_radius ) || 0,
		backgroundColor: settings.bg_color || '#2563eb',
		textAlign: settings.align || 'center',
	};
	const swiperModules = [ Autoplay, EffectFade, EffectCreative ];

	useEffect( () => {
		if ( active >= previewSlides.length ) {
			setActive( 0 );
			swiperRef.current?.slideTo( 0 );
		}
	}, [ active, previewSlides.length ] );

	const goTo = ( index ) => swiperRef.current?.slideTo( index );
	const pagination = settings.pagination || 'dots';

	return (
		<div className={ `xsb-bp gb-banner xsb-banner${ slider ? ' xsb-banner-slider' : '' } xsb-banner-layout--${ settings.layout_variant || 'centered' }` } style={ rootStyle } data-transition={ transition }>
			<Swiper
				key={ transition }
				className="xsb-banner-preview-swiper"
				modules={ swiperModules }
				loop={ slider && !! settings.loop && visibleSlides.length > 1 }
				effect={ transition === 'fade' ? 'fade' : ( transition === 'zoom' ? 'creative' : 'slide' ) }
				fadeEffect={ { crossFade: true } }
				creativeEffect={ { prev: { translate: [ 0, 0, -1 ], scale: 0.96, opacity: 0 }, next: { translate: [ 0, 0, -1 ], scale: 1.04, opacity: 0 } } }
				autoplay={ slider && settings.autoplay ? { delay: Math.max( 1000, Number( settings.autoplay_delay ) || 5000 ), disableOnInteraction: !! settings.pause_on_interaction, pauseOnMouseEnter: !! settings.pause_on_hover } : false }
				speed={ window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches ? 0 : 400 }
				onSwiper={ ( swiper ) => { swiperRef.current = swiper; } }
				onSlideChange={ ( swiper ) => {
					setActive( swiper.realIndex );
					if ( progressRef.current ) {
						progressRef.current.style.transitionDuration = settings.autoplay ? '0ms' : '280ms';
						progressRef.current.style.width = settings.autoplay ? '0%' : `${ ( swiper.realIndex + 1 ) / visibleSlides.length * 100 }%`;
					}
				} }
				onAutoplayTimeLeft={ ( _swiper, _timeLeft, percentage ) => {
					if ( settings.autoplay && progressRef.current ) {
						progressRef.current.style.transitionDuration = '0ms';
						progressRef.current.style.width = `${ Math.max( 0, Math.min( 100, ( 1 - percentage ) * 100 ) ) }%`;
					}
				} }
			>
				{ visibleSlides.map( ( slide, index ) => {
					const backgroundType = slide.background_type && slide.background_type !== 'inherit' ? slide.background_type : ( settings.bg_type || 'color' );
					const { imageUrl, videoUrl, imageStyle, videoStyle } = resolveBackgroundMedia( {
						...settings,
						bg_type: backgroundType,
						bg_image: slide.image || settings.bg_image,
						bg_video: slide.video || settings.bg_video,
						bg_size: settings.bg_size,
						bg_position: settings.bg_position,
					} );
					const sampleTitle = slide.type === 'linked-post' ? __( 'Sample linked post', 'xcodesol-page-builder' ) : __( 'Sample post title', 'xcodesol-page-builder' );
					const titleSource = slide.type === 'linked-post' && ( ! slide.title || slide.title === __( 'Your headline', 'xcodesol-page-builder' ) ) ? sampleTitle : ( slide.title || '' );
					const slideTitle = settings.title_source === 'archive_title' ? ( archiveTitle || __( 'Shop', 'xcodesol-page-builder' ) ) : replaceDynamicTokens( titleSource, sampleTitle );
					const TitleTag = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div' ].includes( slide.title_tag ) ? slide.title_tag : 'h2';
					const buttons = Array.isArray( slide.buttons ) && slide.buttons.length ? slide.buttons : ( slide.type === 'linked-post' ? ( slide.button_text ? [ { label: slide.button_text, url: slide.link || '#' } ] : [] ) : ( slide.button_text || settings.button_text ? [ { label: slide.button_text || settings.button_text, url: slide.link || settings.link || '#' } ] : [] ) );
					const slideStyle = {
						position: 'relative', display: 'flex', flexDirection: 'column',
						justifyContent: justify, alignItems: align, minHeight,
						boxSizing: 'border-box', padding: 'var(--xsb-banner-slide-padding)',
						backgroundColor: slide.background_color || settings.bg_color || '#2563eb',
						...( backgroundType === 'gradient' ? { backgroundImage: settings.gradient_type === 'radial' ? `radial-gradient(${ settings.gradient_color_a || '#2563eb' }, ${ settings.gradient_color_b || '#4f46e5' })` : `linear-gradient(${ Number( settings.gradient_angle ) || 180 }deg, ${ settings.gradient_color_a || '#2563eb' }, ${ settings.gradient_color_b || '#4f46e5' })` } : {} ),
					};
					return <SwiperSlide key={ slide.id || index } className={ slide.link ? 'has-slide-link' : '' } style={ slideStyle }>
						{ backgroundType === 'image' && imageUrl && <div className="xsb-banner-bg" style={ { ...imageStyle, backgroundImage: `url("${ imageUrl }")` } } /> }
						{ backgroundType === 'video' && videoUrl && <video className="xsb-banner-video" style={ videoStyle } src={ videoUrl } muted loop autoPlay playsInline /> }
						{ ( backgroundType === 'image' || backgroundType === 'video' ) && settings.overlay_color && <div className="xsb-banner-overlay" style={ { backgroundColor: slide.overlay_color || settings.overlay_color, opacity: Math.min( 100, Math.max( 0, Number( slide.overlay_opacity ?? settings.overlay_opacity ?? 40 ) ) ) / 100 } } /> }
						{ slide.link && <a className="xsb-banner-slide-link" href={ slide.link } aria-label={ slideTitle } onClick={ ( event ) => event.preventDefault() } /> }
						<div className="xsb-banner-content" style={ {
							position: 'relative', zIndex: 2, maxWidth: '100%', alignSelf: align,
							...( settings.content_box ? { background: settings.content_box_bg || 'rgba(0,0,0,.35)', padding: `${ Number( settings.content_box_padding ) || 28 }px`, borderRadius: `${ Number( settings.content_box_radius ) || 0 }px` } : {} ),
						} }>
							{ slide.badge && <p className="xsb-banner-badge">{ slide.badge }</p> }
						{ slideTitle && <TitleTag className="xsb-banner-title" style={ resolveMotionStyle( settings, 'heading_animation' ) }>{ slideTitle }</TitleTag> }
						{ ( slide.subtitle || slide.type === 'linked-post' ) && <div className="xsb-banner-subtitle" style={ resolveMotionStyle( settings, 'description_animation' ) }>{ replaceDynamicTokens( slide.subtitle || ( slide.type === 'linked-post' ? __( 'A sample linked post excerpt.', 'xcodesol-page-builder' ) : '' ), sampleTitle ) }</div> }
							{ settings.show_button !== false && buttons.length > 0 && <div className="xsb-banner-actions">{ buttons.slice( 0, 3 ).map( ( button, buttonIndex ) => <a key={ buttonIndex } className={ `xsb-banner-btn is-${ button.style || 'primary' }` } style={ resolveMotionStyle( settings, 'button_animation' ) } href={ button.url || '#' } onClick={ ( event ) => event.preventDefault() }>{ button.label || button.text }</a> ) }</div> }
						</div>
					</SwiperSlide>;
				} ) }
			</Swiper>
			<div className="xsb-bp-label-chip xsb-bp-label-chip--dark">{ __( 'Slider', 'xcodesol-page-builder' ) }</div>
			{ settings.source_mode === 'posts' && <span className="xsb-banner-source-tag">{ __( 'Posts query preview', 'xcodesol-page-builder' ) }</span> }
			{ settings.source_mode === 'posts' && queryResult?.key === queryKey && ! queryResult.slides.length && <div className="xsb-banner-query-empty">{ settings.query_empty_message || __( 'No posts match this query.', 'xcodesol-page-builder' ) }</div> }
			{ slider && settings.show_arrows !== false && <>
				<button type="button" className="xsb-banner-arrow xsb-banner-arrow--previous" aria-label={ __( 'Previous slide', 'xcodesol-page-builder' ) } onClick={ () => swiperRef.current?.slidePrev() }><ArrowIcon settings={ settings } /></button>
				<button type="button" className="xsb-banner-arrow xsb-banner-arrow--next" aria-label={ __( 'Next slide', 'xcodesol-page-builder' ) } onClick={ () => swiperRef.current?.slideNext() }><ArrowIcon settings={ settings } /></button>
			</> }
			{ slider && [ 'dots', 'numbers' ].includes( pagination ) && <div data-position={ settings.pagination_position || 'bottom' } data-shape={ settings.dot_shape || 'pill' } className={ `xsb-banner-pagination is-${ pagination }` }>{ previewSlides.map( ( slide, index ) => <button type="button" key={ slide.id || index } aria-label={ `${ __( 'Show slide', 'xcodesol-page-builder' ) } ${ index + 1 }` } className={ active === index ? 'is-active' : '' } onClick={ () => goTo( index ) }>{ pagination === 'numbers' ? index + 1 : <span /> }</button> ) }</div> }
			{ slider && pagination === 'fraction' && <div data-position={ settings.pagination_position || 'bottom' } className="xsb-banner-pagination is-fraction"><span>{ active + 1 }</span><span>/</span><span>{ previewSlides.length }</span></div> }
			{ slider && pagination === 'progress' && <div data-position={ settings.pagination_position || 'bottom' } className="xsb-banner-pagination is-progress" role="progressbar" aria-label={ __( 'Slide progress', 'xcodesol-page-builder' ) } aria-valuemin="1" aria-valuemax={ previewSlides.length } aria-valuenow={ active + 1 }><span ref={ progressRef } style={ { width: settings.autoplay ? '0%' : `${ ( active + 1 ) / previewSlides.length * 100 }%` } } /></div> }
		</div>
	);
}
