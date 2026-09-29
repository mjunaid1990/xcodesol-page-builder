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
	} = config;

	const mediaUrl = typeof value === 'object' && value !== null ? ( value.url || '' ) : ( value || '' );
	const isModified = Boolean( mediaUrl );

	const openMediaFrame = () => {
		if ( typeof window === 'undefined' || ! window.wp || ! window.wp.media ) {
			return;
		}

		const frame = window.wp.media( {
			title: __( 'Select or Upload Media', 'xcodesol-page-builder' ),
			button: { text: __( 'Use this media', 'xcodesol-page-builder' ) },
			library: { type: allowedTypes },
			multiple: false,
		} );

		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first().toJSON();
			if ( attachment && attachment.url ) {
				onChange( {
					id: attachment.id,
					url: attachment.url,
					alt: attachment.alt || '',
					width: attachment.width,
					height: attachment.height,
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
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( '' ) }
			className="xsb-ctrl-media"
		>
			<div className="xsb-media-control-box">
				{ mediaUrl ? (
					<div className="xsb-media-preview-card" onClick={ openMediaFrame }>
						<img src={ mediaUrl } alt="" className="xsb-media-preview-img" />
						<div className="xsb-media-preview-actions">
							<button
								type="button"
								className="xsb-tb-btn"
								onClick={ openMediaFrame }
								title={ __( 'Change media', 'xcodesol-page-builder' ) }
							>
								<span className="dashicons dashicons-edit" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn xsb-tb-btn--remove"
								onClick={ handleRemove }
								title={ __( 'Remove media', 'xcodesol-page-builder' ) }
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
						<span>{ __( 'Choose Image', 'xcodesol-page-builder' ) }</span>
					</button>
				) }
			</div>
		</ControlBase>
	);
}
