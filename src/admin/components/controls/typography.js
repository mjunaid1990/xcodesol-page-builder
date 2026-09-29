/**
 * Typography Control Group.
 * Covers font family, size with units, font weight, line height, letter spacing, and text transform.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

const FONT_WEIGHTS = [
	{ label: '300 (Light)', value: '300' },
	{ label: '400 (Normal)', value: '400' },
	{ label: '500 (Medium)', value: '500' },
	{ label: '600 (Semi-bold)', value: '600' },
	{ label: '700 (Bold)', value: '700' },
	{ label: '800 (Extra-bold)', value: '800' },
];

const TEXT_TRANSFORMS = [
	{ label: 'Default', value: 'none' },
	{ label: 'Uppercase', value: 'uppercase' },
	{ label: 'Lowercase', value: 'lowercase' },
	{ label: 'Capitalize', value: 'capitalize' },
];

export default function TypographyControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label = __( 'Typography', 'xcodesol-page-builder' ),
		description,
	} = config;

	const typo = typeof value === 'object' && value !== null ? value : {};

	const update = ( key, val ) => {
		onChange( {
			...typo,
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
			className="xsb-ctrl-typography"
		>
			<div className="xsb-typography-group">
				{/* Font Size */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Size', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-number-unit-row">
						<input
							type="number"
							min="8"
							max="120"
							value={ typo.font_size || '' }
							onChange={ ( e ) => update( 'font_size', e.target.value === '' ? '' : parseInt( e.target.value, 10 ) ) }
							className="xsb-number-input"
							placeholder="16"
						/>
						<span className="xsb-unit-pill">px</span>
					</div>
				</div>

				{/* Font Weight */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Weight', 'xcodesol-page-builder' ) }</label>
					<select
						value={ typo.font_weight || '400' }
						onChange={ ( e ) => update( 'font_weight', e.target.value ) }
						className="xsb-select-input"
					>
						{ FONT_WEIGHTS.map( ( w ) => (
							<option key={ w.value } value={ w.value }>
								{ w.label }
							</option>
						) ) }
					</select>
				</div>

				{/* Line Height */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Line Height', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-slider-control-row">
						<input
							type="range"
							min="0.8"
							max="3"
							step="0.05"
							value={ typo.line_height || 1.5 }
							onChange={ ( e ) => update( 'line_height', parseFloat( e.target.value ) ) }
							className="xsb-range-slider"
						/>
						<span className="xsb-unit-pill">{ typo.line_height || 1.5 }</span>
					</div>
				</div>

				{/* Letter Spacing */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Letter Spacing', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-number-unit-row">
						<input
							type="number"
							step="0.1"
							value={ typo.letter_spacing ?? '' }
							onChange={ ( e ) => update( 'letter_spacing', e.target.value === '' ? '' : parseFloat( e.target.value ) ) }
							className="xsb-number-input"
							placeholder="0"
						/>
						<span className="xsb-unit-pill">px</span>
					</div>
				</div>

				{/* Transform */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Transform', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-segmented-control xsb-segmented-control--compact">
						{ TEXT_TRANSFORMS.map( ( t ) => (
							<button
								key={ t.value }
								type="button"
								className={ `xsb-segmented-btn${ ( typo.text_transform || 'none' ) === t.value ? ' is-active' : '' }` }
								onClick={ () => update( 'text_transform', t.value ) }
							>
								{ t.label }
							</button>
						) ) }
					</div>
				</div>
			</div>
		</ControlBase>
	);
}
