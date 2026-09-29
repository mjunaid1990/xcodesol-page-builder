/**
 * CSS Transform Control (Rotate, Scale, Translate, Skew).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function TransformControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id = 'transform',
		label = __( 'Transform', 'xcodesol-page-builder' ),
	} = config;

	const t = typeof value === 'object' && value !== null ? value : {};

	const update = ( key, val ) => {
		onChange( {
			...t,
			[ key ]: val,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-transform"
		>
			<div className="xsb-transform-sliders">
				{/* Rotate */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Rotate', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-slider-control-row">
						<input
							type="range"
							min="-180"
							max="180"
							value={ t.rotate ?? 0 }
							onChange={ ( e ) => update( 'rotate', parseInt( e.target.value, 10 ) || 0 ) }
							className="xsb-range-slider"
						/>
						<span className="xsb-unit-pill">{ t.rotate ?? 0 }°</span>
					</div>
				</div>

				{/* Scale */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Scale', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-slider-control-row">
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.05"
							value={ t.scale ?? 1 }
							onChange={ ( e ) => update( 'scale', parseFloat( e.target.value ) || 1 ) }
							className="xsb-range-slider"
						/>
						<span className="xsb-unit-pill">{ t.scale ?? 1 }x</span>
					</div>
				</div>

				{/* Translate X */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Offset X', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-number-unit-row">
						<input
							type="number"
							value={ t.translate_x ?? 0 }
							onChange={ ( e ) => update( 'translate_x', parseInt( e.target.value, 10 ) || 0 ) }
							className="xsb-number-input"
						/>
						<span className="xsb-unit-pill">px</span>
					</div>
				</div>

				{/* Translate Y */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Offset Y', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-number-unit-row">
						<input
							type="number"
							value={ t.translate_y ?? 0 }
							onChange={ ( e ) => update( 'translate_y', parseInt( e.target.value, 10 ) || 0 ) }
							className="xsb-number-input"
						/>
						<span className="xsb-unit-pill">px</span>
					</div>
				</div>
			</div>
		</ControlBase>
	);
}
