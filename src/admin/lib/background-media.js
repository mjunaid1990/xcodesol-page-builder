/**
 * Shared resolver for image and video backgrounds in canvas previews.
 * Keep URL normalization and image-fit controls consistent across blocks.
 *
 * @package Xcodesol_Page_Builder
 */

export function resolveMediaUrl( media ) {
	if ( typeof media === 'string' ) return media;
	return media && typeof media === 'object' && typeof media.url === 'string' ? media.url : '';
}

export function resolveBackgroundMedia( settings = {} ) {
	const image = settings.bg_image;
	const video = settings.bg_video_url || settings.bg_video;
	const imageUrl = resolveMediaUrl( image );
	const videoUrl = resolveMediaUrl( video );
	const size = settings.bg_size === 'custom' ? ( settings.bg_size_custom || 'cover' ) : ( settings.bg_size || 'cover' );
	const position = settings.bg_position === 'custom' ? ( settings.bg_position_custom || 'center center' ) : ( settings.bg_position || 'center center' );

	return {
		imageUrl,
		videoUrl,
		imageStyle: {
			backgroundSize: size,
			backgroundPosition: position,
			backgroundRepeat: settings.bg_repeat === undefined ? 'no-repeat' : settings.bg_repeat,
			backgroundAttachment: settings.bg_attachment || 'scroll',
			backgroundOrigin: settings.bg_origin || 'padding-box',
			backgroundClip: settings.bg_clip || 'border-box',
		},
		videoStyle: {
			objectFit: settings.bg_video_fit || 'cover',
			objectPosition: settings.bg_video_position || 'center center',
		},
	};
}

/**
 * Resolve image widget sizing through the same background image controls used
 * by containers and banners.
 *
 * @param {Object} settings Block settings.
 * @param {string} url      Resolved static or dynamic image URL.
 * @return {Object} Shared inline styles for the image element.
 */
export function resolveImageWidgetMedia( settings = {}, url = '' ) {
	const legacySize = { cover: 'cover', contain: 'contain', fill: '100% 100%', none: 'auto', 'scale-down': 'contain' }[ settings.object_fit ];
	const effectiveSettings = {
		...settings,
		bg_image: url,
		bg_size: settings.bg_size || legacySize || 'cover',
		bg_position: settings.bg_position || settings.object_position || 'center center',
	};
	const background = resolveBackgroundMedia( effectiveSettings );
	const size = background.imageStyle.backgroundSize;
	const objectFit = size === 'auto' ? 'none' : size === '100% 100%' ? 'fill' : [ 'cover', 'contain', 'fill', 'none', 'scale-down' ].includes( size ) ? size : 'cover';
	const imageBackground = url ? { backgroundImage: `url("${ url }")` } : {};
	const transforms = [];
	if ( Number( settings.scale ) > 0 && Number( settings.scale ) !== 100 ) transforms.push( `scale(${ Math.min( 150, Math.max( 50, Number( settings.scale ) ) ) / 100 })` );
	if ( Number( settings.rotate ) !== 0 ) transforms.push( `rotate(${ Math.min( 180, Math.max( -180, Number( settings.rotate ) ) ) }deg)` );

	return {
		imageStyle: {
			objectFit,
			objectPosition: background.imageStyle.backgroundPosition,
			transform: transforms.length ? transforms.join( ' ' ) : undefined,
			transformOrigin: settings.transform_origin || 'center center',
			...background.imageStyle,
			...imageBackground,
		},
	};
}

export function resolveImageFilter( settings = {} ) {
	const filters = [];
	if ( Number( settings.grayscale ) > 0 ) filters.push( `grayscale(${ Math.min( 100, Number( settings.grayscale ) ) }%)` );
	if ( Number( settings.blur ) > 0 ) filters.push( `blur(${ Math.min( 40, Number( settings.blur ) ) }px)` );
	if ( settings.brightness !== undefined && Number( settings.brightness ) !== 100 ) filters.push( `brightness(${ Math.min( 200, Math.max( 0, Number( settings.brightness ) ) ) }%)` );
	if ( settings.contrast !== undefined && Number( settings.contrast ) !== 100 ) filters.push( `contrast(${ Math.min( 200, Math.max( 0, Number( settings.contrast ) ) ) }%)` );
	if ( settings.saturate !== undefined && Number( settings.saturate ) !== 100 ) filters.push( `saturate(${ Math.min( 200, Math.max( 0, Number( settings.saturate ) ) ) }%)` );
	if ( Number( settings.hue_rotate ) > 0 ) filters.push( `hue-rotate(${ Math.min( 360, Number( settings.hue_rotate ) ) }deg)` );
	if ( Number( settings.sepia ) > 0 ) filters.push( `sepia(${ Math.min( 100, Number( settings.sepia ) ) }%)` );
	return filters.length ? filters.join( ' ' ) : undefined;
}
