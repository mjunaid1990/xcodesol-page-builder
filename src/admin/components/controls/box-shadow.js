/**
 * Box Shadow Control with presets and full custom parameter sliders.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

const SHADOW_PRESETS = [
	{ label: 'None', value: 'none' },
	{ label: 'Soft', value: 'soft' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'Strong', value: 'strong' },
	{ label: 'Custom', value: 'custom' },
];

export default function BoxShadowControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label = __( 'Box Shadow', 'xcodesol-page-builder' ),
		description,
	} = config;

	// Distinguish preset vs custom object
	const isObject = typeof value === 'object' && value !== null && ! Array.isArray( value );
	const presetValue = typeof value === 'string' ? value : ( isObject ? 'custom' : 'none' );

	const custom = isObject ? value : {
		x: 0,
		y: 4,
		blur: 14,
		spread: 0,
		color: 'rgba(0, 0, 0, 0.12)',
		inset: false,
	};

	const handlePresetChange = ( p ) => {
		if ( p === 'custom' ) {
			onChange( custom );
		} else {
			onChange( p );
		}
	};

	const updateCustom = ( key, val ) => {
		onChange( {
			...custom,
			[ key ]: val,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			className="xsb-ctrl-box-shadow"
		>
			<div className="xsb-shadow-control-group">
				<div className="xsb-segmented-control xsb-segmented-control--compact">
					{ SHADOW_PRESETS.map( ( p ) => (
						<button
							key={ p.value }
							type="button"
							className={ `xsb-segmented-btn${ presetValue === p.value ? ' is-active' : '' }` }
							onClick={ () => handlePresetChange( p.value ) }
						>
							{ p.label }
						</button>
					) ) }
				</div>

				{ presetValue === 'custom' && (
					<div className="xsb-custom-shadow-sliders">
						{ [
							{ key: 'x', label: 'X', min: -50, max: 50 },
							{ key: 'y', label: 'Y', min: -50, max: 50 },
							{ key: 'blur', label: 'Blur', min: 0, max: 100 },
							{ key: 'spread', label: 'Spread', min: -30, max: 50 },
						].map( ( field ) => (
							<div key={ field.key } className="xsb-control-sub-row">
								<span className="xsb-sub-label">{ field.label }</span>
								<div className="xsb-slider-control-row">
									<input
										type="range"
										min={ field.min }
										max={ field.max }
										value={ custom[ field.key ] ?? 0 }
										onChange={ ( e ) => updateCustom( field.key, parseInt( e.target.value, 10 ) || 0 ) }
										className="xsb-range-slider"
									/>
									<span className="xsb-unit-pill">{ custom[ field.key ] ?? 0 }px</span>
								</div>
							</div>
						) ) }

						<div className="xsb-control-sub-row">
							<span className="xsb-sub-label">{ __( 'Color', 'xcodesol-page-builder' ) }</span>
							<input
								type="text"
								value={ custom.color }
								onChange={ ( e ) => updateCustom( 'color', e.target.value ) }
								className="xsb-color-hex-input"
								placeholder="rgba(0,0,0,0.12)"
							/>
						</div>

						<div className="xsb-control-sub-row">
							<span className="xsb-sub-label">{ __( 'Position', 'xcodesol-page-builder' ) }</span>
							<div className="xsb-segmented-control xsb-segmented-control--compact">
								<button
									type="button"
									className={ `xsb-segmented-btn${ ! custom.inset ? ' is-active' : '' }` }
									onClick={ () => updateCustom( 'inset', false ) }
								>
									{ __( 'Outline', 'xcodesol-page-builder' ) }
								</button>
								<button
									type="button"
									className={ `xsb-segmented-btn${ custom.inset ? ' is-active' : '' }` }
									onClick={ () => updateCustom( 'inset', true ) }
								>
									{ __( 'Inset', 'xcodesol-page-builder' ) }
								</button>
							</div>
						</div>
					</div>
				) }
			</div>
		</ControlBase>
	);
}
