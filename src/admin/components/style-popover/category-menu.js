/**
 * Root view of the popover: the scannable style-category menu.
 *
 * Only categories supported by the selected element render, each showing a
 * chevron and — when custom values exist — a count, so "changed" is never
 * communicated by colour alone.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';

import { isKeySet } from './controls';
import { categoryKeys } from './config';

/** Canonical menu order + display metadata. */
export const CATEGORY_META = {
	typography: { label: __( 'Typography', 'xcodesol-page-builder' ), icon: 'dashicons-editor-textcolor', keywords: 'font size weight family text transform' },
	colors: { label: __( 'Colors', 'xcodesol-page-builder' ), icon: 'dashicons-art', keywords: 'color text link accent fill background' },
	spacing: { label: __( 'Margin & Padding', 'xcodesol-page-builder' ), icon: 'dashicons-editor-expand', keywords: 'margin padding spacing gap' },
	border: { label: __( 'Border & Corners', 'xcodesol-page-builder' ), icon: 'dashicons-tag', keywords: 'border radius round corner width outline' },
	background: { label: __( 'Background', 'xcodesol-page-builder' ), icon: 'dashicons-format-image', keywords: 'background color gradient image overlay' },
	shadow: { label: __( 'Box Shadow', 'xcodesol-page-builder' ), icon: 'dashicons-admin-appearance', keywords: 'shadow drop glow elevation' },
	layout: { label: __( 'Layout & Align', 'xcodesol-page-builder' ), icon: 'dashicons-screenoptions', keywords: 'layout display align justify direction' },
	dimensions: { label: __( 'Size & Dimensions', 'xcodesol-page-builder' ), icon: 'dashicons-editor-table', keywords: 'width height max-width min-height size' },
	position: { label: __( 'Positioning', 'xcodesol-page-builder' ), icon: 'dashicons-move', keywords: 'position z-index top left right bottom' },
	effects: { label: __( 'Effects & Motion', 'xcodesol-page-builder' ), icon: 'dashicons-star-filled', keywords: 'animation opacity transition transform effect' },
	imageEffects: { label: __( 'Image Overlay', 'xcodesol-page-builder' ), icon: 'dashicons-format-gallery', keywords: 'overlay filter blend brightness' },
	imageSettings: { label: __( 'Image Fit', 'xcodesol-page-builder' ), icon: 'dashicons-image-crop', keywords: 'fit cover contain position' },
	visibility: { label: __( 'Visibility', 'xcodesol-page-builder' ), icon: 'dashicons-visibility', keywords: 'hide display show mobile tablet desktop' },
	advanced: { label: __( 'Advanced & CSS', 'xcodesol-page-builder' ), icon: 'dashicons-admin-generic', keywords: 'class id custom css selector' },
};

// Common styling properties (Typography, Colors, Spacing, Border, Background) first,
// followed by structural layout, effects, and advanced.
const ORDER = [
	'typography', 'colors', 'spacing', 'border', 'background', 'shadow',
	'layout', 'dimensions', 'position', 'effects', 'imageEffects', 'imageSettings',
	'visibility', 'advanced',
];

/**
 * Ordered, supported category ids for one element.
 *
 * @param {Object} element Element config.
 * @return {Array<string>} Category ids.
 */
export function elementCategoryIds( element ) {
	if ( ! element || ! element.categories ) {
		return [];
	}
	return ORDER.filter( ( id ) => element.categories[ id ] );
}

/**
 * Number of changed (custom) keys a category writes for the element.
 *
 * @param {Object} element    Element config.
 * @param {string} categoryId Category id.
 * @param {Object} settings   Settings map.
 * @return {number} Changed count.
 */
export function categoryChangedCount( element, categoryId, settings ) {
	if ( ! element || ! element.categories || ! element.categories[ categoryId ] || ! settings ) {
		return 0;
	}
	const keys = categoryKeys( categoryId, element.categories[ categoryId ] );
	return keys.filter( ( k ) => isKeySet( settings, k ) ).length;
}

/**
 * Number of changed keys across the whole element.
 *
 * @param {Object} element  Element config.
 * @param {Object} settings Settings map.
 * @return {number} Total custom values.
 */
export function elementChangedCount( element, settings ) {
	if ( ! element || ! element.categories || ! settings ) {
		return 0;
	}
	let total = 0;
	elementCategoryIds( element ).forEach( ( id ) => {
		total += categoryChangedCount( element, id, settings );
	} );
	return total;
}

/**
 * All settings keys an element writes (copy / paste / reset-all scope).
 *
 * @param {Object} element Element config.
 * @return {Array<string>} Keys.
 */
export function elementKeys( element ) {
	if ( ! element || ! element.categories ) {
		return [];
	}
	const keys = [];
	elementCategoryIds( element ).forEach( ( id ) => {
		categoryKeys( id, element.categories[ id ] ).forEach( ( k ) => {
			if ( ! keys.includes( k ) ) {
				keys.push( k );
			}
		} );
	} );
	return keys;
}

/**
 * Category menu rows.
 *
 * @param {Object}   props
 * @param {Array}    props.ids      Category ids (ordered).
 * @param {Object}   props.element  Active element config.
 * @param {Object}   props.settings Settings map (for change counts).
 * @param {Function} props.onPick   (categoryId) => void.
 */
export function StyleCategoryMenu( { ids, element, settings, onPick } ) {
	return (
		<div className="xsb-style-category-list">
			<span className="xsb-style-category-list__eyebrow">
				{ __( 'Style controls', 'xcodesol-page-builder' ) }
			</span>
			{ ids.map( ( id ) => {
				const meta = CATEGORY_META[ id ];
				const count = categoryChangedCount( element, id, settings );
				return (
					<button
						key={ id }
						type="button"
						className={ 'xsb-style-category-item' + ( count > 0 ? ' xsb-style-category-item--changed' : '' ) }
						onClick={ () => onPick( id ) }
					>
						<span className="xsb-style-category-item__label">
							{ meta ? meta.label : id }
							{ count > 0 && (
								<span className="xsb-style-category-item__count">
									{ sprintf( __( '%d changes', 'xcodesol-page-builder' ), count ) }
								</span>
							) }
						</span>
						<span className="dashicons dashicons-arrow-right-alt2" aria-hidden="true" />
					</button>
				);
			} ) }
		</div>
	);
}