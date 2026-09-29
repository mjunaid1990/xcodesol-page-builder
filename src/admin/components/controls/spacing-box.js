/**
 * 4-sided Box Model Spacing Control (Padding / Margin).
 * Supports linked/unlinked sides and modern unit switching.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

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
				<div className="xsb-box-model-header-row">
					<div className="xsb-unit-switcher" role="radiogroup" aria-label="Units">
						{ units.map( ( u ) => (
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

				<div className="xsb-box-model-grid">
					{ [ 'top', 'right', 'bottom', 'left' ].map( ( side ) => (
						<div key={ side } className="xsb-box-side-col">
							<input
								type="number"
								value={ sides[ side ] }
								onChange={ ( e ) => handleSideChange( side, e.target.value ) }
								className="xsb-number-input xsb-box-side-input"
								placeholder="0"
							/>
							<span className="xsb-box-side-label">{ side.toUpperCase() }</span>
						</div>
					) ) }
				</div>
			</div>
		</ControlBase>
	);
}
