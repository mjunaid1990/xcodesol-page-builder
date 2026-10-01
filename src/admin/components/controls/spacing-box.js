/**
 * 4-sided Box Model Spacing Control (Padding / Margin).
 * Supports linked/unlinked sides and modern unit switching.
 *
 * @package Xcodesol_Page_Builder
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';
import UnitSelect from './unit-select';

export default function SpacingBoxControl( {
	config = {},
	value,
	values,
	onChange,
	device,
	state,
	id: directId,
	label: directLabel,
	units: directUnits,
	default: directDefault,
	allowNegative: directAllowNegative,
	mode: directMode,
} ) {
	const {
		id,
		label = __( 'Spacing', 'xcodesol-page-builder' ),
		description,
		units = [ 'px', '%', 'rem', 'em' ],
		default: defaultValue = { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true },
	} = config;
	const controlId = id || directId;
	const controlLabel = directLabel || label;
	const controlUnits = directUnits || units;
	const initialValue = directDefault !== undefined ? directDefault : defaultValue;
	const allowNegative = directAllowNegative ?? config.allowNegative ?? false;
	const mode = directMode || config.mode || 'sides';
	value = value ?? values;

	// Normalize incoming value (could be a number or object)
	const isObject = typeof value === 'object' && value !== null;
	const currentUnit = isObject && value.unit ? value.unit : ( initialValue.unit || defaultValue.unit || 'px' );

	const [ isLinked, setIsLinked ] = useState( () => {
		if ( isObject && value.isLinked !== undefined ) return Boolean( value.isLinked );
		return initialValue.isLinked !== undefined ? Boolean( initialValue.isLinked ) : true;
	} );
	useEffect( () => {
		if ( isObject && value.isLinked !== undefined ) setIsLinked( Boolean( value.isLinked ) );
	}, [ isObject, value?.isLinked ] );

	const sides = {
		top: isObject ? ( value.top ?? '' ) : ( typeof value === 'number' ? value : ( initialValue.top ?? '' ) ),
		right: isObject ? ( value.right ?? '' ) : ( typeof value === 'number' ? value : ( initialValue.right ?? '' ) ),
		bottom: isObject ? ( value.bottom ?? '' ) : ( typeof value === 'number' ? value : ( initialValue.bottom ?? '' ) ),
		left: isObject ? ( value.left ?? '' ) : ( typeof value === 'number' ? value : ( initialValue.left ?? '' ) ),
		row: isObject ? ( value.row ?? '' ) : ( initialValue.row ?? '' ),
		col: isObject ? ( value.col ?? '' ) : ( initialValue.col ?? '' ),
	};
	const sideKeys = mode === 'gap' ? [ 'row', 'col' ] : [ 'top', 'right', 'bottom', 'left' ];
	const sideLabels = mode === 'gap' ? { row: __( 'Row', 'xcodesol-page-builder' ), col: __( 'Column', 'xcodesol-page-builder' ) } : { top: __( 'Top', 'xcodesol-page-builder' ), right: __( 'Right', 'xcodesol-page-builder' ), bottom: __( 'Bottom', 'xcodesol-page-builder' ), left: __( 'Left', 'xcodesol-page-builder' ) };

	const isModified = sideKeys.some( ( side ) => Boolean( sides[ side ] ) );

	const handleSideChange = ( side, val ) => {
		const parsed = val === '' ? '' : ( isNaN( Number( val ) ) ? val : Number( val ) );
		if ( isLinked && mode === 'gap' ) {
			onChange( { ...sides, row: parsed, col: parsed, unit: currentUnit, isLinked: true } );
		} else if ( isLinked ) {
			onChange( {
				top: parsed,
				right: parsed,
				bottom: parsed,
				left: parsed,
				unit: currentUnit,
				isLinked: true,
			} );
		} else {
			onChange( {
				...sides,
				[ side ]: parsed,
				unit: currentUnit,
				isLinked: false,
			} );
		}
	};

	const handleUnitChange = ( u ) => {
		onChange( {
			...sides,
			unit: u,
			isLinked,
		} );
	};

	const toggleLinked = () => {
		const nextLinked = ! isLinked;
		setIsLinked( nextLinked );
		if ( nextLinked ) {
			// Linking syncs every field to the first value for an intuitive start.
			const syncVal = mode === 'gap' ? sides.row : sides.top;
			onChange( {
				...( mode === 'gap' ? { row: syncVal, col: syncVal } : { top: syncVal, right: syncVal, bottom: syncVal, left: syncVal } ),
				unit: currentUnit,
				isLinked: true,
			} );
		}
	};

	return (
		<ControlBase
			id={ controlId }
			label={ controlLabel }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( initialValue ) }
			className="xsb-ctrl-spacing-box"
		>
			<div className="xsb-box-model-wrapper">
				<div className="xsb-dims-row">
					{ sideKeys.map( ( side ) => (
						<input
							key={ side }
							type="number"
							min={ allowNegative ? undefined : 0 }
							value={ sides[ side ] }
							onChange={ ( e ) => handleSideChange( side, e.target.value ) }
							className="xsb-number-input xsb-dims-input"
							placeholder={ __( 'All', 'xcodesol-page-builder' ) }
							aria-label={ `${ controlLabel } ${ sideLabels[ side ] }` }
							title={ sideLabels[ side ] }
						/>
					) ) }
					<button
						type="button"
						className={ `xsb-link-btn${ isLinked ? ' is-linked' : '' }` }
						onClick={ toggleLinked }
						title={ isLinked ? __( 'Unlink values', 'xcodesol-page-builder' ) : __( 'Link values together', 'xcodesol-page-builder' ) }
						aria-label={ isLinked ? __( 'Unlink values', 'xcodesol-page-builder' ) : __( 'Link values together', 'xcodesol-page-builder' ) }
					>
						<span className={ `dashicons ${ isLinked ? 'dashicons-admin-links' : 'dashicons-editor-unlink' }` } aria-hidden="true" />
					</button>
				</div>
				<div className="xsb-box-model-footer-row">
					<span className="xsb-dims-hint">{ mode === 'gap' ? __( 'Row · Column', 'xcodesol-page-builder' ) : __( 'Top · Right · Bottom · Left', 'xcodesol-page-builder' ) }</span>
					<UnitSelect
						units={ controlUnits }
						value={ currentUnit }
						onChange={ handleUnitChange }
					/>
				</div>
			</div>
		</ControlBase>
	);
}
