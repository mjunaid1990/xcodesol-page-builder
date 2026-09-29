/**
 * Repeater Control for dynamic list of repeatable items.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function RepeaterControl( {
	config = {},
	value = [],
	onChange,
	device,
	state,
} ) {
	const {
		id = 'items',
		label = __( 'Items', 'xcodesol-page-builder' ),
		itemLabel = __( 'Item', 'xcodesol-page-builder' ),
		defaultItem = {},
	} = config;

	const items = Array.isArray( value ) ? value : [];

	const handleAdd = () => {
		onChange( [ ...items, { ...defaultItem } ] );
	};

	const handleRemove = ( index ) => {
		const next = [ ...items ];
		next.splice( index, 1 );
		onChange( next );
	};

	const handleMove = ( index, delta ) => {
		const targetIndex = index + delta;
		if ( targetIndex < 0 || targetIndex >= items.length ) return;
		const next = [ ...items ];
		const [ moved ] = next.splice( index, 1 );
		next.splice( targetIndex, 0, moved );
		onChange( next );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-repeater"
		>
			<div className="xsb-repeater-list">
				{ items.map( ( item, idx ) => (
					<div key={ idx } className="xsb-repeater-item-row">
						<span className="xsb-repeater-item-title">
							{ item.title || item.label || `${ itemLabel } #${ idx + 1 }` }
						</span>
						<div className="xsb-repeater-item-actions">
							<button
								type="button"
								className="xsb-tb-btn"
								disabled={ idx === 0 }
								onClick={ () => handleMove( idx, -1 ) }
								title={ __( 'Move Up', 'xcodesol-page-builder' ) }
							>
								<span className="dashicons dashicons-arrow-up-alt2" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn"
								disabled={ idx === items.length - 1 }
								onClick={ () => handleMove( idx, 1 ) }
								title={ __( 'Move Down', 'xcodesol-page-builder' ) }
							>
								<span className="dashicons dashicons-arrow-down-alt2" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn xsb-tb-btn--remove"
								onClick={ () => handleRemove( idx ) }
								title={ __( 'Remove', 'xcodesol-page-builder' ) }
							>
								<span className="dashicons dashicons-trash" aria-hidden="true" />
							</button>
						</div>
					</div>
				) ) }

				<button
					type="button"
					className="xsb-repeater-add-btn"
					onClick={ handleAdd }
				>
					<span className="dashicons dashicons-plus-alt2" aria-hidden="true" />
					<span>{ __( 'Add Item', 'xcodesol-page-builder' ) }</span>
				</button>
			</div>
		</ControlBase>
	);
}
