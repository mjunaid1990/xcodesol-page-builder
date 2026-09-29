/**
 * Product-card editor used by each archive product loop.
 *
 * @package WooCommerce_Template_Builder
 */

import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const CARD_BLOCKS = [
	{ type: 'image', label: __( 'Product Image', 'xcodesol-page-builder' ) },
	{ type: 'badge', label: __( 'Sale Badge', 'xcodesol-page-builder' ) },
	{ type: 'title', label: __( 'Product Title', 'xcodesol-page-builder' ) },
	{ type: 'price', label: __( 'Price', 'xcodesol-page-builder' ) },
	{ type: 'rating', label: __( 'Rating', 'xcodesol-page-builder' ) },
	{ type: 'excerpt', label: __( 'Short Description', 'xcodesol-page-builder' ) },
	{ type: 'add_to_cart', label: __( 'Add to Cart', 'xcodesol-page-builder' ) },
];

function ProductCardEditor( { value = [], onChange } ) {
	const layout = Array.isArray( value ) ? value : [];
	const label = ( type ) => CARD_BLOCKS.find( ( item ) => item.type === type )?.label || type;
	const move = ( index, offset ) => {
		const next = [ ...layout ];
		const target = index + offset;
		if ( target < 0 || target >= next.length ) return;
		[ next[ index ], next[ target ] ] = [ next[ target ], next[ index ] ];
		onChange( next );
	};

	return (
		<div className="xsb-card-editor">
			<p className="description">{ __( 'Design one product card. This card is repeated for every product in this loop.', 'xcodesol-page-builder' ) }</p>
			<div className="xsb-card-palette">
				{ CARD_BLOCKS.map( ( item ) => <Button key={ item.type } isSecondary onClick={ () => onChange( [ ...layout, { type: item.type, settings: {} } ] ) }>{ item.label }</Button> ) }
			</div>
			{ layout.map( ( item, index ) => (
				<div className="xsb-card-block" key={ `${ item.type }-${ index }` }>
					<strong>{ index + 1 }. { label( item.type ) }</strong>
					<span>
						<Button isSmall disabled={ index === 0 } onClick={ () => move( index, -1 ) }>↑</Button>
						<Button isSmall disabled={ index === layout.length - 1 } onClick={ () => move( index, 1 ) }>↓</Button>
						<Button isSmall isDestructive onClick={ () => onChange( layout.filter( ( _, itemIndex ) => itemIndex !== index ) ) }>{ __( 'Remove', 'xcodesol-page-builder' ) }</Button>
					</span>
				</div>
			) ) }
		</div>
	);
}

export default ProductCardEditor;
