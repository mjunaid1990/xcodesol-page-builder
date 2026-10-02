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
