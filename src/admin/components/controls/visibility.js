/**
 * Responsive Visibility Control (Hide on Desktop / Tablet / Mobile).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function VisibilityControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id = 'visibility',
		label = __( 'Responsive Visibility', 'xcodesol-page-builder' ),
	} = config;

	const vis = typeof value === 'object' && value !== null ? value : {};

	const update = ( key, checked ) => {
		onChange( {
			...vis,
			[ key ]: checked,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-visibility"
		>
			<div className="xsb-visibility-toggle-list">
				<div className="xsb-control-sub-row">
					<span className="xsb-sub-label">{ __( 'Hide on Desktop', 'xcodesol-page-builder' ) }</span>
					<label className="xsb-toggle-switch">
						<input
							type="checkbox"
							checked={ Boolean( vis.hide_desktop ) }
							onChange={ ( e ) => update( 'hide_desktop', e.target.checked ) }
							className="xsb-toggle-checkbox"
						/>
						<span className="xsb-toggle-slider" aria-hidden="true" />
					</label>
				</div>

				<div className="xsb-control-sub-row">
					<span className="xsb-sub-label">{ __( 'Hide on Tablet', 'xcodesol-page-builder' ) }</span>
					<label className="xsb-toggle-switch">
						<input
							type="checkbox"
							checked={ Boolean( vis.hide_tablet ) }
							onChange={ ( e ) => update( 'hide_tablet', e.target.checked ) }
							className="xsb-toggle-checkbox"
						/>
						<span className="xsb-toggle-slider" aria-hidden="true" />
					</label>
				</div>

				<div className="xsb-control-sub-row">
					<span className="xsb-sub-label">{ __( 'Hide on Mobile', 'xcodesol-page-builder' ) }</span>
					<label className="xsb-toggle-switch">
						<input
							type="checkbox"
							checked={ Boolean( vis.hide_mobile ) }
							onChange={ ( e ) => update( 'hide_mobile', e.target.checked ) }
							className="xsb-toggle-checkbox"
						/>
						<span className="xsb-toggle-slider" aria-hidden="true" />
					</label>
				</div>
			</div>
		</ControlBase>
	);
}
