/**
 * URL Link Control with new window, nofollow, and custom attributes.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function UrlLinkControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id = 'link',
		label = __( 'Link / URL', 'xcodesol-page-builder' ),
	} = config;

	const link = typeof value === 'object' && value !== null
		? value
		: { url: typeof value === 'string' ? value : '', is_external: false, nofollow: false };

	const update = ( key, val ) => {
		onChange( {
			...link,
			[ key ]: val,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-url-link"
		>
			<div className="xsb-url-link-wrapper">
				<div className="xsb-url-input-wrap">
					<input
						type="url"
						value={ link.url || '' }
						onChange={ ( e ) => update( 'url', e.target.value ) }
						className="xsb-text-input"
						placeholder="https://example.com"
					/>
				</div>

				<div className="xsb-link-options-row">
					<label className="xsb-checkbox-label">
						<input
							type="checkbox"
							checked={ Boolean( link.is_external ) }
							onChange={ ( e ) => update( 'is_external', e.target.checked ) }
						/>
						<span>{ __( 'Open in new window', 'xcodesol-page-builder' ) }</span>
					</label>

					<label className="xsb-checkbox-label">
						<input
							type="checkbox"
							checked={ Boolean( link.nofollow ) }
							onChange={ ( e ) => update( 'nofollow', e.target.checked ) }
						/>
						<span>{ __( 'Add nofollow', 'xcodesol-page-builder' ) }</span>
					</label>
				</div>
			</div>
		</ControlBase>
	);
}
