/**
 * 4-sided Box Model Spacing Control (Padding / Margin).
 * Supports linked/unlinked sides and modern unit switching.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';
import UnitSelect from './unit-select';

export default function SpacingBoxControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label = __( 'Spacing', 'xcodesol-page-builder' ),
		description,
		units = [ 'px', '%', 'rem', 'em' ],
		default: defaultValue = { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true },
	} = config;

	// Normalize incoming value (could be a number or object)
	const isObject = typeof value === 'object' && value !== null;
	const currentUnit = isObject && value.unit ? value.unit : ( defaultValue.unit || 'px' );

	const [ isLinked, setIsLinked ] = useState( () => {
		if ( isObject && value.isLinked !== undefined ) return Boolean( value.isLinked );
		return defaultValue.isLinked !== undefined ? Boolean( defaultValue.isLinked ) : true;
	} );

	const sides = {
		top: isObject ? ( value.top ?? '' ) : ( typeof value === 'number' ? value : ( defaultValue.top ?? '' ) ),
		right: isObject ? ( value.right ?? '' ) : ( typeof value === 'number' ? value : ( defaultValue.right ?? '' ) ),
		bottom: isObject ? ( value.bottom ?? '' ) : ( typeof value === 'number' ? value : ( defaultValue.bottom ?? '' ) ),
		left: isObject ? ( value.left ?? '' ) : ( typeof value === 'number' ? value : ( defaultValue.left ?? '' ) ),
	};

	const isModified = Boolean( sides.top || sides.right || sides.bottom || sides.left );

	const handleSideChange = ( side, val ) => {
		const parsed = val === '' ? '' : ( isNaN( Number( val ) ) ? val : Number( val ) );
		if ( isLinked ) {
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
			// Sync all sides to top
			const syncVal = sides.top;
			onChange( {
				top: syncVal,
				right: syncVal,
				bottom: syncVal,
				left: syncVal,
				unit: currentUnit,
				isLinked: true,
			} );
		}
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
			className="xsb-ctrl-spacing-box"
		>
			<div className="xsb-box-model-wrapper">
				<div className="xsb-dims-row">
					{ [ 'top', 'right', 'bottom', 'left' ].map( ( side ) => (
						<input
							key={ side }
							type="number"
							value={ sides[ side ] }
							onChange={ ( e ) => handleSideChange( side, e.target.value ) }
							className="xsb-number-input xsb-dims-input"
							placeholder={ __( 'All', 'xcodesol-page-builder' ) }
							aria-label={ `${ label } ${ side }` }
							title={ side.charAt( 0 ).toUpperCase() + side.slice( 1 ) }
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
					<span className="xsb-dims-hint">{ __( 'Top · Right · Bottom · Left', 'xcodesol-page-builder' ) }</span>
					<UnitSelect
						units={ units }
						value={ currentUnit }
						onChange={ handleUnitChange }
					/>
				</div>
			</div>
		</ControlBase>
	);
}
