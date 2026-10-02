/**
 * Media Picker Control using the WordPress Media Frame.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function MediaPickerControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label = __( 'Image / Media', 'xcodesol-page-builder' ),
		description,
		allowedTypes = [ 'image' ],
		imageSource = 'upload',
		dynamicPreviewUrl = '',
		dynamicPreviewLabel = '',
		dynamicPreviewEmptyLabel = '',
		frameBackground = '',
	} = config;
	const normalizedTypes = Array.isArray( allowedTypes ) ? allowedTypes : [ allowedTypes ];
	const isVideo = normalizedTypes.includes( 'video' );

	const mediaUrl = typeof value === 'object' && value !== null ? ( value.url || '' ) : ( value || '' );
	const isDynamicImage = normalizedTypes.includes( 'image' ) && imageSource !== 'upload';
	const isModified = ! isDynamicImage && Boolean( mediaUrl );
	const previewUrl = typeof value === 'object' && value !== null && value.thumbnail ? value.thumbnail : mediaUrl;

	const openMediaFrame = () => {
		if ( typeof window === 'undefined' || ! window.wp || ! window.wp.media ) {
			return;
		}

		const frame = window.wp.media( {
			title: __( 'Select or Upload Media', 'xcodesol-page-builder' ),
			button: { text: __( 'Use this media', 'xcodesol-page-builder' ) },
			library: { type: normalizedTypes },
			multiple: false,
		} );

		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first().toJSON();
			if ( attachment && attachment.url ) {
				onChange( {
					id: attachment.id,
					url: attachment.url,
					alt: attachment.alt || '',
					thumbnail: attachment.image?.src || '',
					width: attachment.width,
					height: attachment.height,
					mime: attachment.mime || '',
				} );
			}
		} );

		frame.open();
	};

	const handleRemove = ( e ) => {
		e.stopPropagation();
		onChange( '' );
	};

	return (
		<ControlBase
			id={ id }
			label={ isDynamicImage ? __( 'Image preview', 'xcodesol-page-builder' ) : label }
			description={ isDynamicImage ? dynamicPreviewLabel : description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( '' ) }
			className="xsb-ctrl-media"
		>
			<div className="xsb-media-control-box">
				{ isDynamicImage ? (
					<div className="xsb-media-preview-card xsb-media-preview-card--dynamic" style={ { backgroundColor: frameBackground || undefined } }>
						{ dynamicPreviewUrl ? (
							<img src={ dynamicPreviewUrl } alt="" className="xsb-media-preview-img" />
						) : (
							<div className="xsb-media-dynamic-empty">
								<span className="dashicons dashicons-format-image" aria-hidden="true" />
								<span>{ dynamicPreviewEmptyLabel || __( 'No image is available for this source yet.', 'xcodesol-page-builder' ) }</span>
							</div>
						) }
						{ dynamicPreviewUrl && <span className="xsb-media-preview-card__source">{ dynamicPreviewLabel }</span> }
					</div>
				) : mediaUrl ? (
					<div className="xsb-media-preview-card" style={ { backgroundColor: frameBackground || undefined } }>
						{ isVideo ? (
							<video src={ previewUrl } className="xsb-media-preview-img" muted controls playsInline preload="metadata" />
						) : (
							<img src={ previewUrl } alt="" className="xsb-media-preview-img" />
						) }
						<div className="xsb-media-preview-actions">
							<button
								type="button"
								className="xsb-tb-btn"
								onClick={ openMediaFrame }
								title={ __( 'Change media', 'xcodesol-page-builder' ) }
								aria-label={ __( 'Change media', 'xcodesol-page-builder' ) }
							>
								<span className="dashicons dashicons-edit" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn xsb-tb-btn--remove"
								onClick={ handleRemove }
								title={ __( 'Remove media', 'xcodesol-page-builder' ) }
								aria-label={ __( 'Remove media', 'xcodesol-page-builder' ) }
							>
								<span className="dashicons dashicons-trash" aria-hidden="true" />
							</button>
						</div>
					</div>
				) : (
					<button
						type="button"
						className="xsb-media-upload-placeholder"
						onClick={ openMediaFrame }
					>
						<span className="dashicons dashicons-upload" aria-hidden="true" />
						<span>{ isVideo ? __( 'Choose Video', 'xcodesol-page-builder' ) : __( 'Choose Image', 'xcodesol-page-builder' ) }</span>
					</button>
				) }
			</div>
		</ControlBase>
	);
}
