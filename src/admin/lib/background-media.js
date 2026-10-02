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

	return {
		imageStyle: {
			objectFit,
			objectPosition: background.imageStyle.backgroundPosition,
			...background.imageStyle,
			...imageBackground,
		},
	};
}
