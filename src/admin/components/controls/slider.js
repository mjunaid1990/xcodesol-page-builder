/**
 * Slider control with range input, numeric field, and unit switcher.
 *
 * @package Xcodesol_Page_Builder
 */

import ControlBase from './control-base';
import UnitSelect from './unit-select';

export default function SliderControl( {
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
		min = 0,
		max = 100,
		step = 1,
		units = [],
		default: defaultValue = 0,
	} = config;

	const numValue = ( typeof value === 'object' && value !== null )
		? ( value.value !== undefined ? value.value : defaultValue )
		: ( value !== undefined ? value : defaultValue );

	const currentUnit = ( typeof value === 'object' && value !== null && value.unit )
		? value.unit
		: ( units[ 0 ] || '' );

	const isModified = String( numValue ) !== String( typeof defaultValue === 'object' ? defaultValue.value : defaultValue );

	const handleSliderChange = ( e ) => {
		const val = parseFloat( e.target.value );
		if ( units.length > 0 ) {
			onChange( { value: val, unit: currentUnit } );
		} else {
			onChange( val );
		}
	};

	const handleNumberChange = ( e ) => {
		const raw = e.target.value;
		if ( raw === '' ) {
			if ( units.length > 0 ) onChange( { value: '', unit: currentUnit } );
			else onChange( '' );
			return;
		}
		const val = parseFloat( raw );
		if ( units.length > 0 ) {
			onChange( { value: isNaN( val ) ? 0 : val, unit: currentUnit } );
		} else {
			onChange( isNaN( val ) ? 0 : val );
		}
	};

	const handleUnitChange = ( u ) => {
		onChange( { value: numValue, unit: u } );
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
			className="xsb-ctrl-slider"
		>
			<div className="xsb-slider-control-row">
				<input
					type="range"
					min={ min }
					max={ max }
					step={ step }
					value={ numValue || 0 }
					onChange={ handleSliderChange }
					className="xsb-range-slider"
				/>
				<input
					type="number"
					min={ min }
					max={ max }
					step={ step }
					value={ numValue }
					onChange={ handleNumberChange }
					className="xsb-slider-number-input"
				/>
				<UnitSelect
					units={ units }
					value={ currentUnit }
					onChange={ handleUnitChange }
				/>
			</div>
		</ControlBase>
	);
}
