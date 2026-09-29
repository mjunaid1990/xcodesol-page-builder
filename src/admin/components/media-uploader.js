/**
 * Media uploader control built on the native WordPress media library (wp.media).
 *
 * Opens the default WP media modal and reports the chosen attachment URL back
 * to the caller. Used by the banner block for image/video backgrounds.
 *
 * @package WooCommerce_Template_Builder
 */

import { __ } from '@wordpress/i18n';
import { BaseControl, Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';

/**
 * Media uploader field.
 *
 * @param {Object}   props
 * @param {string}   props.label       Field label.
 * @param {string}   props.mediaType   'image' or 'video'.
 * @param {string}   props.value       Current attachment URL.
 * @param {Function} props.onChange    Called with the chosen URL ('' to clear).
 * @return {Element}
 */
function MediaUploader( { label, mediaType = 'image', value = '', onChange } ) {
	const frameRef = useRef( null );

	function openLibrary() {
		if ( ! window.wp || ! window.wp.media ) {
			return;
		}

		if ( frameRef.current ) {
			frameRef.current.open();
			return;
		}

		const isVideo = mediaType === 'video';

		const frame = window.wp.media( {
			title: isVideo
				? __( 'Select a video for the background', 'xcodesol-page-builder' )
				: __( 'Select an image for the background', 'xcodesol-page-builder' ),
			button: {
				text: __( 'Use this file', 'xcodesol-page-builder' ),
			},
			multiple: false,
			library: { type: isVideo ? 'video' : 'image' },
		} );

		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first();
			if ( ! attachment ) {
				return;
			}

			const data = attachment.toJSON();
			const url =
				data.url ||
				( data.sizes && data.sizes.full && data.sizes.full.url ) ||
				'';

			if ( url ) {
				onChange( url );
			}
		} );

		frameRef.current = frame;
		frame.open();
	}

	return (
		<BaseControl label={ label }>
			<div className="xsb-media-uploader">
				{ value ? (
					<div className="xsb-media-uploader-preview">
						{ mediaType === 'video' ? (
							<video src={ value } muted loop playsInline />
						) : (
							<img src={ value } alt="" />
						) }
						<div className="xsb-media-uploader-actions">
							<Button isSecondary isSmall onClick={ openLibrary }>
								{ __( 'Replace', 'xcodesol-page-builder' ) }
							</Button>
							<Button isDestructive isSmall onClick={ () => onChange( '' ) }>
								{ __( 'Remove', 'xcodesol-page-builder' ) }
							</Button>
						</div>
					</div>
				) : (
					<Button
						isSecondary
						className="xsb-media-uploader-add"
						onClick={ openLibrary }
					>
						{ mediaType === 'video'
							? __( 'Choose video', 'xcodesol-page-builder' )
							: __( 'Choose image', 'xcodesol-page-builder' ) }
					</Button>
				) }
			</div>
		</BaseControl>
	);
}

export default MediaUploader;