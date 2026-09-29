/**
 * Gradient Builder Control with live swatch preview.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function GradientControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label = __( 'Gradient', 'xcodesol-page-builder' ),
		description,
		default: defaultValue = {
			type: 'linear',
			angle: 90,
			colorA: '#4f46e5',
			colorB: '#06b6d4',
			posA: 0,
			posB: 100,
		},
	} = config;

	const current = {
		type: value?.type || defaultValue.type || 'linear',
		angle: value?.angle !== undefined ? value.angle : ( defaultValue.angle ?? 90 ),
		colorA: value?.colorA || defaultValue.colorA || '#4f46e5',
		colorB: value?.colorB || defaultValue.colorB || '#06b6d4',
		posA: value?.posA !== undefined ? value.posA : ( defaultValue.posA ?? 0 ),
		posB: value?.posB !== undefined ? value.posB : ( defaultValue.posB ?? 100 ),
	};

	const gradientCss = current.type === 'linear'
		? `linear-gradient(${ current.angle }deg, ${ current.colorA } ${ current.posA }%, ${ current.colorB } ${ current.posB }%)`
		: `radial-gradient(circle, ${ current.colorA } ${ current.posA }%, ${ current.colorB } ${ current.posB }%)`;

	const update = ( key, val ) => {
		onChange( { ...current, [ key ]: val } );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-gradient"
		>
			<div className="xsb-gradient-control">
				<div
					className="xsb-gradient-preview"
					style={ { background: gradientCss } }
					title="Gradient live preview"
				/>

				<div className="xsb-gradient-type-row">
					<button
						type="button"
						className={ `xsb-sub-tab${ current.type === 'linear' ? ' is-active' : '' }` }
						onClick={ () => update( 'type', 'linear' ) }
					>
						{ __( 'Linear', 'xcodesol-page-builder' ) }
					</button>
					<button
						type="button"
						className={ `xsb-sub-tab${ current.type === 'radial' ? ' is-active' : '' }` }
						onClick={ () => update( 'type', 'radial' ) }
					>
						{ __( 'Radial', 'xcodesol-page-builder' ) }
					</button>
				</div>

				{ current.type === 'linear' && (
					<div className="xsb-gradient-row">
						<label className="xsb-sub-label">{ __( 'Angle', 'xcodesol-page-builder' ) }</label>
						<div className="xsb-slider-control-row">
							<input
								type="range"
								min="0"
								max="360"
								value={ current.angle }
								onChange={ ( e ) => update( 'angle', parseInt( e.target.value, 10 ) ) }
								className="xsb-range-slider"
							/>
							<span className="xsb-unit-pill">{ current.angle }°</span>
						</div>
					</div>
				) }

				<div className="xsb-gradient-stops-row">
					<div className="xsb-stop-field">
						<label className="xsb-sub-label">{ __( 'Color 1', 'xcodesol-page-builder' ) }</label>
						<div className="xsb-color-input-row">
							<input
								type="color"
								value={ current.colorA }
								onChange={ ( e ) => update( 'colorA', e.target.value ) }
								className="xsb-native-color-picker"
							/>
							<input
								type="number"
								min="0"
								max="100"
								value={ current.posA }
								onChange={ ( e ) => update( 'posA', parseInt( e.target.value, 10 ) ) }
								className="xsb-slider-number-input"
							/>
							<span className="xsb-unit-pill">%</span>
						</div>
					</div>

					<div className="xsb-stop-field">
						<label className="xsb-sub-label">{ __( 'Color 2', 'xcodesol-page-builder' ) }</label>
						<div className="xsb-color-input-row">
							<input
								type="color"
								value={ current.colorB }
								onChange={ ( e ) => update( 'colorB', e.target.value ) }
								className="xsb-native-color-picker"
							/>
							<input
								type="number"
								min="0"
								max="100"
								value={ current.posB }
								onChange={ ( e ) => update( 'posB', parseInt( e.target.value, 10 ) ) }
								className="xsb-slider-number-input"
							/>
							<span className="xsb-unit-pill">%</span>
						</div>
					</div>
				</div>
			</div>
		</ControlBase>
	);
}
