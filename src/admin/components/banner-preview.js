/** Live canvas preview for the Hero Banner widget. */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { resolveBackgroundMedia } from '../lib/background-media';

export default function BannerPreview( { settings = {}, archiveTitle = '' } ) {
	const slides = Array.isArray( settings.slides ) && settings.slides.length ? settings.slides : [ {
		title: settings.title || __( 'Designed for creators', 'xcodesol-page-builder' ),
		subtitle: settings.subtitle || __( 'Build a responsive experience with complete visual freedom.', 'xcodesol-page-builder' ),
		button_text: settings.button_text || __( 'Get started', 'xcodesol-page-builder' ),
		link: settings.link || '#',
		background_type: 'inherit',
	} ];
	const querySlides = settings.source_mode === 'posts' ? [ {
		title: __( 'Sample post title', 'xcodesol-page-builder' ),
		subtitle: __( 'A preview of the post fields selected in the query mapping.', 'xcodesol-page-builder' ),
		button_text: __( 'Read more', 'xcodesol-page-builder' ),
		background_type: 'inherit',
	} ] : [];
	const previewSlides = settings.source_mode === 'posts' ? querySlides : ( settings.source_mode === 'mixed' ? [ ...slides, ...querySlides ] : slides );
	const [ active, setActive ] = useState( 0 );
	const current = previewSlides[ active ] || previewSlides[ 0 ] || {};
	const backgroundType = current.background_type && current.background_type !== 'inherit' ? current.background_type : ( settings.bg_type || 'color' );
	const { imageUrl, videoUrl, imageStyle, videoStyle } = resolveBackgroundMedia( {
		bg_type: backgroundType,
		bg_image: current.image || settings.bg_image,
		bg_video: current.video || settings.bg_video,
		bg_size: settings.bg_size,
		bg_position: settings.bg_position,
	} );
	const minHeight = Number( settings.min_height ) || 400;
	const justify = { top: 'flex-start', center: 'center', bottom: 'flex-end' }[ settings.content_position_y || 'center' ];
	const align = { left: 'flex-start', center: 'center', right: 'flex-end' }[ settings.content_position_x || 'center' ];
	const rootStyle = {
		minHeight,
		padding: `${ Number( settings.padding_top ) || 0 }px ${ Number( settings.padding_right ) || 0 }px ${ Number( settings.padding_bottom ) || 0 }px ${ Number( settings.padding_left ) || 0 }px`,
		borderRadius: Number( settings.border_radius ) || 0,
		backgroundColor: current.background_color || settings.bg_color || '#2563eb',
		backgroundImage: backgroundType === 'gradient' ? ( settings.gradient_type === 'radial' ? `radial-gradient(${ settings.gradient_color_a || '#2563eb' }, ${ settings.gradient_color_b || '#4f46e5' })` : `linear-gradient(${ Number( settings.gradient_angle ) || 180 }deg, ${ settings.gradient_color_a || '#2563eb' }, ${ settings.gradient_color_b || '#4f46e5' })` ) : undefined,
		textAlign: settings.align || 'center',
		justifyContent: justify,
		alignItems: align,
	};
	const title = settings.title_source === 'archive_title' ? ( archiveTitle || __( 'Shop', 'xcodesol-page-builder' ) ) : ( current.title || '' );
	const buttons = Array.isArray( current.buttons ) && current.buttons.length ? current.buttons : ( current.button_text || settings.button_text ? [ { label: current.button_text || settings.button_text, url: current.link || settings.link || '#' } ] : [] );
	const slider = !! settings.slider_enabled && previewSlides.length > 1;

	return (
		<div className={ `xsb-bp gb-banner xsb-banner${ slider ? ' xsb-banner-slider' : '' } xsb-banner-layout--${ settings.layout_variant || 'centered' }` } style={ rootStyle } data-transition={ settings.transition || 'slide' }>
			{ backgroundType === 'image' && imageUrl && <div className="xsb-banner-bg" style={ { ...imageStyle, backgroundImage: `url("${ imageUrl }")` } } /> }
			{ backgroundType === 'video' && videoUrl && <video className="xsb-banner-video" style={ videoStyle } src={ videoUrl } muted loop autoPlay playsInline /> }
			{ ( backgroundType === 'image' || backgroundType === 'video' ) && settings.overlay_color && <div className="xsb-banner-overlay" style={ { backgroundColor: settings.overlay_color, opacity: Math.min( 100, Math.max( 0, Number( settings.overlay_opacity ?? 40 ) ) ) / 100 } } /> }
			<div className="xsb-bp-label-chip xsb-bp-label-chip--dark">{ __( 'Hero Banner', 'xcodesol-page-builder' ) }</div>
			{ settings.source_mode === 'posts' && <span className="xsb-banner-source-tag">{ __( 'Posts query preview', 'xcodesol-page-builder' ) }</span> }
			<div className="xsb-banner-content" style={ {
				position: 'relative', zIndex: 2, maxWidth: '100%', alignSelf: align,
				...( settings.content_box ? { background: settings.content_box_bg || 'rgba(0,0,0,.35)', padding: `${ Number( settings.content_box_padding ) || 28 }px`, borderRadius: `${ Number( settings.content_box_radius ) || 16 }px` } : {} ),
			} }>
				{ current.badge && <p className="xsb-banner-badge">{ current.badge }</p> }
				{ title && <h2 className="xsb-banner-title" style={ { color: settings.title_color || '#fff', fontSize: `${ Number( settings.title_font_size ) || 48 }px` } }>{ title }</h2> }
				{ current.subtitle && <p className="xsb-banner-subtitle" style={ { color: settings.subtitle_color || '#fff', fontSize: `${ Number( settings.subtitle_font_size ) || 18 }px` } }>{ current.subtitle }</p> }
				{ settings.show_button !== false && buttons.length > 0 && <div className="xsb-banner-actions">{ buttons.slice( 0, 3 ).map( ( button, index ) => <a key={ index } className={ `xsb-banner-btn is-${ button.style || 'primary' }` } href="#" onClick={ ( event ) => event.preventDefault() }>{ button.label || button.text }</a> ) }</div> }
			</div>
			{ slider && settings.show_arrows !== false && <>
				<button type="button" className="xsb-banner-arrow xsb-banner-arrow--previous" aria-label={ __( 'Previous slide', 'xcodesol-page-builder' ) } onClick={ () => setActive( ( active - 1 + previewSlides.length ) % previewSlides.length ) }><span aria-hidden="true">‹</span></button>
				<button type="button" className="xsb-banner-arrow xsb-banner-arrow--next" aria-label={ __( 'Next slide', 'xcodesol-page-builder' ) } onClick={ () => setActive( ( active + 1 ) % previewSlides.length ) }><span aria-hidden="true">›</span></button>
			</> }
			{ slider && [ 'dots', 'numbers' ].includes( settings.pagination || 'dots' ) && <div className={ `xsb-banner-pagination is-${ settings.pagination || 'dots' }` }>{ previewSlides.map( ( slide, index ) => <button type="button" key={ slide.id || index } aria-label={ `${ __( 'Show slide', 'xcodesol-page-builder' ) } ${ index + 1 }` } className={ active === index ? 'is-active' : '' } onClick={ () => setActive( index ) }>{ settings.pagination === 'numbers' ? index + 1 : <span /> }</button> ) }</div> }
			{ slider && settings.pagination === 'fraction' && <div className="xsb-banner-pagination is-fraction"><span>{ active + 1 }</span><span>/</span><span>{ previewSlides.length }</span></div> }
			{ slider && settings.pagination === 'progress' && <div className="xsb-banner-pagination is-progress"><span style={ { width: `${ ( active + 1 ) / previewSlides.length * 100 }%` } } /></div> }
		</div>
	);
}
