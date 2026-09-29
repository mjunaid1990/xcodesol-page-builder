/**
 * 9-Point Alignment Grid Control (3x3 Matrix).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

const MATRIX_POINTS = [
	{ id: 'top-left', justify: 'flex-start', align: 'flex-start', label: 'Top Left' },
	{ id: 'top-center', justify: 'center', align: 'flex-start', label: 'Top Center' },
	{ id: 'top-right', justify: 'flex-end', align: 'flex-start', label: 'Top Right' },
	{ id: 'center-left', justify: 'flex-start', align: 'center', label: 'Center Left' },
	{ id: 'center', justify: 'center', align: 'center', label: 'Center' },
	{ id: 'center-right', justify: 'flex-end', align: 'center', label: 'Center Right' },
	{ id: 'bottom-left', justify: 'flex-start', align: 'flex-end', label: 'Bottom Left' },
	{ id: 'bottom-center', justify: 'center', align: 'flex-end', label: 'Bottom Center' },
	{ id: 'bottom-right', justify: 'flex-end', align: 'flex-end', label: 'Bottom Right' },
];

export default function AlignmentGridControl( {
	config = {},
	value = 'center',
	onChange,
	device,
	state,
} ) {
	const {
		id = 'alignment_grid',
		label = __( 'Alignment Matrix', 'xcodesol-page-builder' ),
		description,
	} = config;

	const current = typeof value === 'object' ? ( value.id || 'center' ) : ( value || 'center' );

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			className="xsb-ctrl-alignment-grid"
		>
			<div className="xsb-matrix-grid-3x3" role="radiogroup" aria-label={ label }>
				{ MATRIX_POINTS.map( ( pt ) => {
					const isSelected = current === pt.id;
					return (
						<button
							key={ pt.id }
							type="button"
							role="radio"
							aria-checked={ isSelected }
							className={ `xsb-matrix-point${ isSelected ? ' is-active' : '' }` }
							onClick={ () => onChange( pt ) }
							title={ pt.label }
						>
							<span className="xsb-matrix-dot" aria-hidden="true" />
						</button>
					);
				} ) }
			</div>
		</ControlBase>
	);
}
