/**
 * Color picker control with theme token swatches and hex/alpha input.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import ControlBase from './control-base';

const THEME_COLOR_SWATCHES = [
	{ label: 'Primary', value: '#2563eb' },
	{ label: 'Indigo', value: '#4f46e5' },
	{ label: 'Dark', value: '#0f172a' },
	{ label: 'Body', value: '#334155' },
	{ label: 'Muted', value: '#64748b' },
	{ label: 'Light', value: '#f8fafc' },
	{ label: 'White', value: '#ffffff' },
	{ label: 'Accent', value: '#06b6d4' },
];

export default function ColorControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label,
		description,
		default: defaultValue = '',
	} = config;

	const currentColor = value !== undefined && value !== null ? String( value ) : String( defaultValue || '' );
	const isModified = currentColor !== String( defaultValue || '' );
	const [ showPalette, setShowPalette ] = useState( false );

	const handleHexChange = ( e ) => {
		onChange( e.target.value );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-color"
		>
			<div className="xsb-color-control-wrap">
				<div className="xsb-color-input-row">
					<div
						className="xsb-color-swatch-chip"
						style={ { backgroundColor: currentColor || 'transparent' } }
					>
						<input
							type="color"
							id={ id ? `xsb-ctrl-${ id }` : undefined }
							value={ currentColor.startsWith( '#' ) && currentColor.length >= 7 ? currentColor.slice( 0, 7 ) : '#2563eb' }
							onChange={ handleHexChange }
							className="xsb-native-color-picker"
							title="Pick color"
						/>
					</div>
					<input
						type="text"
						value={ currentColor }
						placeholder="#000000 or rgba()"
						onChange={ handleHexChange }
						className="xsb-color-hex-input"
					/>
					<button
						type="button"
						className={ `xsb-color-palette-btn${ showPalette ? ' is-open' : '' }` }
						onClick={ () => setShowPalette( ( prev ) => ! prev ) }
						title="Theme color swatches"
					>
						<span className="dashicons dashicons-admin-appearance" aria-hidden="true" />
					</button>
				</div>
				{ showPalette && (
					<div className="xsb-theme-swatches-grid">
						{ THEME_COLOR_SWATCHES.map( ( s ) => (
							<button
								key={ s.value }
								type="button"
								className={ `xsb-swatch-dot${ currentColor.toLowerCase() === s.value.toLowerCase() ? ' is-active' : '' }` }
								style={ { backgroundColor: s.value } }
								onClick={ () => {
									onChange( s.value );
									setShowPalette( false );
								} }
								title={ s.label }
							/>
						) ) }
					</div>
				) }
			</div>
		</ControlBase>
	);
}
