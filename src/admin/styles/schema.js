/**
 * Widget style schemas.
 *
 * Every widget can declare which style elements it exposes and which style
 * keys belong to each element. The registry drives:
 *   - element tabs in the style popover (multi-part widgets)
 *   - per-element copy / paste / reset actions
 *   - future responsive + state layers (each key address extends the model)
 *
 * Registering a brand-new widget is one call:
 *
 *   registerWidgetStyleSchema( 'xcosb/cc-my-account', {
 *       elements: [
 *           { id: 'wrapper', label: 'Box',   keys: [ 'background', 'border_width', … ] },
 *           { id: 'nav',     label: 'Menu',  keys: [ 'nav_color', 'nav_font_size', … ] },
 *       ],
 *   } );
 *
 * @package WooCommerce_Template_Builder
 */

const REGISTRY = new Map();

const DEFAULT_EMPTY = Object.freeze( { elements: [] } );

/**
 * Register (or replace) the style schema of one widget type.
 *
 * @param {string} type   Block type (xcosb/gb-banner…).
 * @param {Object} schema { elements: Array<{ id, label, keys }> }.
 * @return {void}
 */
export function registerWidgetStyleSchema( type, schema ) {
	if ( ! type || ! schema || ! Array.isArray( schema.elements ) ) {
		return;
	}
	const elements = schema.elements
		.filter( ( el ) => el && el.id && el.label )
		.map( ( el ) => ( {
			id: String( el.id ),
			label: String( el.label ),
			keys: Array.isArray( el.keys ) ? el.keys.filter( ( k ) => typeof k === 'string' ) : [],
			groups: Array.isArray( el.groups ) ? el.groups.filter( ( g ) => typeof g === 'string' ) : [],
		} ) );

	REGISTRY.set( type, { elements } );
}

/**
 * Get the schema of one widget type (or an empty schema).
 *
 * @param {string} type Block type.
 * @return {Object} { elements: Array }.
 */
export function getWidgetStyleSchema( type ) {
	return REGISTRY.get( type ) || DEFAULT_EMPTY;
}

/**
 * Whether a widget type declares multiple style elements (→ tab UI).
 *
 * @param {string} type Block type.
 * @return {boolean} True when more than one element is declared.
 */
export function hasMultipleStyleElements( type ) {
	return getWidgetStyleSchema( type ).elements.length > 1;
}

/* ------------------------------------------------------------------ *
 * Built-in schemas (keys mirror exactly what the popover panels write)
 * ------------------------------------------------------------------ */

registerWidgetStyleSchema( 'xcosb/gb-banner', {
	elements: [
		{
			id: 'heading',
			label: 'Heading',
			keys: [
				'title_color', 'title_font_family', 'title_font_size', 'title_font_weight',
				'title_text_transform', 'title_line_height', 'title_letter_spacing',
			],
			groups: [ 'typography' ],
		},
		{
			id: 'paragraph',
			label: 'Paragraph',
			keys: [
				'subtitle_color', 'subtitle_font_family', 'subtitle_font_size', 'subtitle_font_weight',
				'subtitle_line_height', 'subtitle_letter_spacing',
			],
			groups: [ 'typography' ],
		},
		{
			id: 'button',
			label: 'Button',
			keys: [
				'button_bg_color', 'button_text_color', 'button_border_color', 'button_border_width',
				'button_padding_x', 'button_padding_y', 'button_border_radius', 'button_font_size',
				'button_font_weight', 'button_font_family',
			],
			groups: [ 'colors', 'typography' ],
		},
		{
			id: 'container',
			label: 'Background & box',
			keys: [
				'bg_type', 'bg_color', 'bg_image', 'bg_size', 'bg_position', 'bg_repeat', 'bg_attachment',
				'bg_video', 'gradient_type', 'gradient_angle', 'gradient_radial_shape', 'gradient_position',
				'gradient_color_a', 'gradient_color_b', 'overlay_color', 'overlay_opacity',
				'padding_top', 'padding_right', 'padding_bottom', 'padding_left', 'min_height', 'align',
				'border_width', 'border_style', 'border_color', 'border_radius', 'box_shadow',
				'animation', 'animation_duration', 'animation_delay',
				'content_box', 'content_box_bg', 'content_box_padding', 'content_box_radius',
				'content_position_x', 'content_position_y',
			],
			groups: [ 'background', 'layout', 'spacing', 'border', 'radius', 'shadow', 'effects' ],
		},
	],
} );

const TERM_TITLE_KEYS = [
	'title_color', 'title_font_family', 'title_font_size', 'title_font_weight',
	'title_text_transform', 'title_line_height', 'title_letter_spacing', 'title_margin_bottom',
];
const TERM_ITEM_KEYS = [
	'item_bg', 'item_padding', 'item_border_width', 'item_border_style', 'item_border_color',
	'item_border_radius', 'item_shadow', 'item_color', 'item_font_family', 'item_font_size',
	'item_font_weight',
];

registerWidgetStyleSchema( 'xcosb/woo-categories', {
	elements: [
		{ id: 'title', label: 'Title', keys: TERM_TITLE_KEYS, groups: [ 'typography' ] },
		{
			id: 'items',
			label: 'Category cards',
			keys: [ ...TERM_ITEM_KEYS, 'item_count_color', 'margin_top', 'margin_right', 'margin_bottom', 'margin_left' ],
			groups: [ 'colors', 'spacing', 'border', 'radius', 'shadow' ],
		},
	],
} );

registerWidgetStyleSchema( 'xcosb/woo-tags', {
	elements: [
		{ id: 'title', label: 'Title', keys: TERM_TITLE_KEYS, groups: [ 'typography' ] },
		{
			id: 'items',
			label: 'Tags',
			keys: [ ...TERM_ITEM_KEYS, 'item_count_color', 'margin_top', 'margin_right', 'margin_bottom', 'margin_left' ],
			groups: [ 'colors', 'spacing', 'border', 'radius', 'shadow' ],
		},
	],
} );

registerWidgetStyleSchema( 'xcosb/woo-attributes', {
	elements: [
		{ id: 'title', label: 'Title', keys: TERM_TITLE_KEYS, groups: [ 'typography' ] },
		{
			id: 'items',
			label: 'Terms',
			keys: [ ...TERM_ITEM_KEYS, 'margin_top', 'margin_right', 'margin_bottom', 'margin_left' ],
			groups: [ 'colors', 'spacing', 'border', 'radius', 'shadow' ],
		},
	],
} );

registerWidgetStyleSchema( 'xcosb/gb-text-widget', {
	elements: [
		{
			id: 'title',
			label: 'Title',
			keys: [ 'title_color', 'title_font_family', 'title_font_size', 'title_font_weight' ],
			groups: [ 'typography', 'colors' ],
		},
		{
			id: 'content',
			label: 'Content',
			keys: [
				'align', 'color', 'font_family', 'font_size', 'font_weight', 'line_height', 'letter_spacing',
				'margin_top', 'margin_right', 'margin_bottom', 'margin_left',
			],
			groups: [ 'typography', 'colors', 'spacing' ],
		},
	],
} );
