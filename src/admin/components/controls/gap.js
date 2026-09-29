/**
 * Linkable Row & Column Gap Control.
 * Supports row gap, column gap, link toggle, and unit switching.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function GapControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id = 'gap',
		label = __( 'Gap Between Items', 'xcodesol-page-builder' ),
		units = [ 'px', 'rem', '%', 'vw' ],
		default: defaultValue = { row: 20, column: 20, unit: 'px', isLinked: true },
	} = config;

	const isObject = typeof value === 'object' && value !== null;
	const currentUnit = isObject && value.unit ? value.unit : ( defaultValue.unit || 'px' );

	const [ isLinked, setIsLinked ] = useState( () => {
		if ( isObject && value.isLinked !== undefined ) return Boolean( value.isLinked );
		return defaultValue.isLinked !== undefined ? Boolean( defaultValue.isLinked ) : true;
	} );

	const rowVal = isObject ? ( value.row ?? 20 ) : ( typeof value === 'number' ? value : 20 );
	const colVal = isObject ? ( value.column ?? 20 ) : ( typeof value === 'number' ? value : 20 );

	const update = ( newRow, newCol, newUnit = currentUnit, newLinked = isLinked ) => {
		onChange( {
			row: newRow,
			column: newCol,
			unit: newUnit,
			isLinked: newLinked,
		} );
	};

	const handleRowChange = ( val ) => {
		const parsed = val === '' ? '' : Math.max( 0, parseFloat( val ) || 0 );
		if ( isLinked ) {
			update( parsed, parsed );
		} else {
			update( parsed, colVal );
		}
	};

	const handleColChange = ( val ) => {
		const parsed = val === '' ? '' : Math.max( 0, parseFloat( val ) || 0 );
		if ( isLinked ) {
			update( parsed, parsed );
		} else {
			update( rowVal, parsed );
		}
	};

	const toggleLinked = () => {
		const next = ! isLinked;
		setIsLinked( next );
		if ( next ) {
			update( rowVal, rowVal, currentUnit, true );
		} else {
			update( rowVal, colVal, currentUnit, false );
		}
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-gap"
		>
			<div className="xsb-gap-control-box">
				<div className="xsb-box-model-header-row">
					<div className="xsb-unit-switcher" role="radiogroup" aria-label="Units">
						{ units.map( ( u ) => (
							<button
								key={ u }
								type="button"
								role="radio"
								aria-checked={ currentUnit === u }
								className={ `xsb-unit-btn${ currentUnit === u ? ' is-active' : '' }` }
								onClick={ () => update( rowVal, colVal, u ) }
							>
								{ u }
							</button>
						) ) }
					</div>
					<button
						type="button"
						className={ `xsb-link-btn${ isLinked ? ' is-linked' : '' }` }
						onClick={ toggleLinked }
						title={ isLinked ? __( 'Unlink Row and Column Gap', 'xcodesol-page-builder' ) : __( 'Link Row and Column Gap', 'xcodesol-page-builder' ) }
					>
						<span className={ `dashicons ${ isLinked ? 'dashicons-admin-links' : 'dashicons-editor-unlink' }` } aria-hidden="true" />
					</button>
				</div>

				<div className="xsb-gap-inputs-row">
					<div className="xsb-gap-input-col">
						<span className="xsb-sub-label">{ __( 'Row Gap', 'xcodesol-page-builder' ) }</span>
						<input
							type="number"
							min="0"
							value={ rowVal }
							onChange={ ( e ) => handleRowChange( e.target.value ) }
							className="xsb-number-input"
						/>
					</div>
					<div className="xsb-gap-input-col">
						<span className="xsb-sub-label">{ __( 'Column Gap', 'xcodesol-page-builder' ) }</span>
						<input
							type="number"
							min="0"
							value={ colVal }
							onChange={ ( e ) => handleColChange( e.target.value ) }
							className="xsb-number-input"
						/>
					</div>
				</div>
			</div>
		</ControlBase>
	);
}
