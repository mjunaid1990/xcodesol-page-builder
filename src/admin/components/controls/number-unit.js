/**
 * Number + Unit control with draggable scrubber and optional unit selector.
 * Supports both scalar numeric values and { value, unit } objects.
 *
 * @package Xcodesol_Page_Builder
 */

import { useRef } from '@wordpress/element';
import ControlBase from './control-base';

export default function NumberUnitControl( {
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
		units = null,
		min = 0,
		max = 1000,
		step = 1,
		default: defaultValue = '',
	} = config;

	// Distinguish between scalar number and object { value, unit } format
	const isObjectFormat = ( typeof value === 'object' && value !== null ) ||
		( typeof defaultValue === 'object' && defaultValue !== null ) ||
		( Array.isArray( units ) && units.length > 0 );

	const numValue = isObjectFormat
		? ( ( value && typeof value === 'object' && value.value !== undefined ) ? value.value : ( typeof value === 'number' ? value : ( defaultValue?.value ?? '' ) ) )
		: ( value !== undefined && value !== null ? value : defaultValue );

	const unitList = Array.isArray( units ) ? units : ( isObjectFormat ? [ 'px', '%', 'rem' ] : [] );

	const currentUnit = ( typeof value === 'object' && value !== null && value.unit )
		? value.unit
		: ( ( defaultValue && typeof defaultValue === 'object' && defaultValue.unit ) || unitList[ 0 ] || 'px' );

	const isModified = isObjectFormat
		? ( numValue !== '' && (
			! defaultValue ||
			defaultValue.value === undefined ||
			String( numValue ) !== String( defaultValue.value ) ||
			currentUnit !== defaultValue.unit
		) )
		: ( numValue !== '' && String( numValue ) !== String( defaultValue ) );

	const emitChange = ( nextNum, nextUnit = currentUnit ) => {
		if ( isObjectFormat ) {
			onChange( { value: nextNum, unit: nextUnit } );
		} else {
			onChange( nextNum );
		}
	};

	const dragStartRef = useRef( null );

	const handleMouseDown = ( e ) => {
		if ( e.button !== 0 ) return;
		dragStartRef.current = {
			x: e.clientX,
			val: parseFloat( numValue ) || 0,
		};

		const handleMouseMove = ( moveEvent ) => {
			if ( ! dragStartRef.current ) return;
			const delta = moveEvent.clientX - dragStartRef.current.x;
			const factor = moveEvent.shiftKey ? 10 : ( moveEvent.altKey ? 0.1 : 1 );
			const nextVal = Math.round( ( dragStartRef.current.val + ( delta * step * factor ) ) * 10 ) / 10;
			const clamped = Math.max( min, Math.min( max, nextVal ) );
			emitChange( clamped );
		};

		const handleMouseUp = () => {
			dragStartRef.current = null;
			window.removeEventListener( 'mousemove', handleMouseMove );
			window.removeEventListener( 'mouseup', handleMouseUp );
		};

		window.addEventListener( 'mousemove', handleMouseMove );
		window.addEventListener( 'mouseup', handleMouseUp );
	};

	const handleValueChange = ( e ) => {
		const raw = e.target.value;
		if ( raw === '' ) {
			emitChange( '' );
			return;
		}
		const parsed = parseFloat( raw );
		emitChange( isNaN( parsed ) ? '' : parsed );
	};

	const handleUnitChange = ( u ) => {
		emitChange( numValue, u );
	};

	const placeholderValue = isObjectFormat
		? ( defaultValue && defaultValue.value !== undefined ? String( defaultValue.value ) : '—' )
		: ( defaultValue !== undefined && defaultValue !== '' ? String( defaultValue ) : '—' );

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-number-unit"
		>
			<div className="xsb-number-unit-row">
				<div className="xsb-scrubber-field" onMouseDown={ handleMouseDown } title="Drag horizontally to scrub">
					<input
						type="number"
						id={ id ? `xsb-ctrl-${ id }` : undefined }
						value={ numValue }
						min={ min }
						max={ max }
						step={ step }
						onChange={ handleValueChange }
						className="xsb-number-input"
						placeholder={ placeholderValue }
					/>
				</div>
				{ unitList && unitList.length > 1 && (
					<div className="xsb-unit-switcher" role="radiogroup" aria-label="Units">
						{ unitList.map( ( u ) => (
							<button
								key={ u }
								type="button"
								role="radio"
								aria-checked={ currentUnit === u }
								className={ `xsb-unit-btn${ currentUnit === u ? ' is-active' : '' }` }
								onClick={ () => handleUnitChange( u ) }
							>
								{ u }
							</button>
						) ) }
					</div>
				) }
			</div>
		</ControlBase>
	);
}
