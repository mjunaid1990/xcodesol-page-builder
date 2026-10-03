/**
 * Per-widget style configuration for the floating popover.
 *
 * The shape mirrors docs/widget-style-reference.json: every widget lists
 * its style "elements" (tabs) and every element lists the style categories
 * (accordions) it supports. Categories are rendered by the generic
 * renderers in categories.js — nothing here is widget code, only data.
 *
 * The key sets deliberately match the PHP sanitizer whitelists
 * (class-xcosb-rest-templates.php), so every control a user touches actually
 * persists. Categories without a data pipeline today (visibility, raw CSS,
 * per-corner radius…) are intentionally omitted until their keys exist —
 * showing a control that silently does nothing would be worse.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';

import { effectsWithTransform, widgetTransformConfig } from './config-helpers';
import { COLUMN_LAYOUT_ITEMS, transformKeysFromCfg } from './categories';

/* ------------------------------------------------------------------ *
 * Reusable pieces (roles)
 * ------------------------------------------------------------------ */

const TEXT_TP = { prefix: '', align: true };
const TEXT_TP_TRANSFORM = { prefix: '', align: true, transform: true };

const TEXT_COLORS = [
	{ setKey: 'color', label: __( 'Text color', 'xcodesol-page-builder' ) },
	{ setKey: 'hover_color', label: __( 'Hover color', 'xcodesol-page-builder' ) },
];
const TEXT_SPACING = { margin: true, padding: 'all' };
const TEXT_LAYOUT = {
	items: [
		{ type: 'align', setKey: 'align' },
		{ type: 'number', setKey: 'max_width', label: __( 'Max width', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10 },
		{ type: 'number', setKey: 'opacity', label: __( 'Opacity', 'xcodesol-page-builder' ), suffix: '%', min: 0, max: 100, help: __( 'Leave empty for fully opaque. 0 hides the widget without removing it.', 'xcodesol-page-builder' ) },
	],
};

/* Shared box chrome category builders */
const boxBorder = ( prefix = '' ) => ( { prefix, padLonghands: true } );
const boxShadow = ( setKey ) => ( { setKey } );

/**
 * Simple styled-text element (headings, prices, descriptions…).
 *
 * @param {Object} opts
 * @param {string} opts.id       Element id.
 * @param {string} opts.label    Element label.
 * @param {Object} opts.tp       Typography cfg (defaults TEXT_TP).
 * @param {Array}  opts.colors   Extra color rows.
 * @param {Object} opts.spacing  Spacing cfg.
 * @param {Object} opts.layout   Layout cfg.
 * @param {Array}  opts.states   Supported pseudo states.
 */
const textEl = ( opts ) => {
	const el = {
		id: opts.id || 'text',
		label: opts.label || __( 'Text', 'xcodesol-page-builder' ),
		states: opts.states || [],
		categories: {},
	};
	if ( opts.tp ) {
		el.categories.typography = { typography: opts.tp };
	}
	const colors = opts.colors || TEXT_COLORS;
	if ( colors.length ) {
		el.categories.colors = { colors };
	}
	if ( opts.spacing ) {
		el.categories.spacing = { spacing: opts.spacing };
	}
	if ( ! el.categories.background && opts.noBackground !== true ) {
		el.categories.background = { background: { setKey: 'background' } };
	}
	// Alignment lives in Typography when that category renders it; other
	// layout fields (max width, opacity) still belong in Layout.
	const typoHasAlign = !! ( opts.tp && opts.tp.align );
	if ( opts.layout ) {
		const items = ( opts.layout.items || [] ).filter(
			( item ) => ! ( typoHasAlign && item.type === 'align' )
		);
		if ( items.length ) {
			el.categories.layout = { layout: { ...opts.layout, items } };
		}
	}
	if ( opts.extraCategories ) {
		Object.assign( el.categories, opts.extraCategories );
	}
	// CSS transform (translate / scale / rotate) on every text element by
	// default — inner elements of multi-part widgets pass a prefixed config
	// via extraCategories, which replaces this flat one. Opt out with
	// noEffects: true when an element genuinely can't take a transform.
	if ( ! el.categories.effects && opts.noEffects !== true ) {
		el.categories.effects = effectsWithTransform();
	}
	return el;
};

/* ------------------------------------------------------------------ *
 * The registry
 * ------------------------------------------------------------------ */

const WIDGET_CONFIG = {};

/**
 * Advanced options every widget element gets (CSS class / ID + custom
 * CSS). Keys are widget-level: the values ride the block settings and are
 * applied to the block's root wrapper on the front end.
 */
const ADVANCED_KEYS = { classKey: 'css_class', idKey: 'css_id' };

function registerWidget( type, cfg ) {
	if ( cfg && Array.isArray( cfg.elements ) ) {
		cfg.elements.forEach( ( el ) => {
			if ( el && el.categories ) {
				if ( ! el.categories.advanced ) {
					el.categories.advanced = { advanced: { ...ADVANCED_KEYS } };
				}
				// Generic Move/Position control for every styled part (card
				// widgets, nested container widgets, boxes, banners…). The
				// widget pins itself to the nearest box — the card, the
				// container column or the section — and can be nudged with
				// X/Y offsets. Container *columns* are grid items placed by
				// their span/start, so absolute positioning would fight the
				// grid layout — they deliberately skip this category.
				if ( ! el.categories.position && ! el.column ) {
					el.categories.position = { position: {} };
				}
				if ( ! el.categories.visibility ) {
					el.categories.visibility = { visibility: {} };
				}
			}
		} );
	}
	WIDGET_CONFIG[ type ] = cfg;
}

/* ------------------------- Archive blocks ------------------------ */

registerWidget( 'xcosb/ar-title', {
	label: __( 'Archive Title', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'title',
			label: __( 'Title text', 'xcodesol-page-builder' ),
			tp: TEXT_TP_TRANSFORM,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			states: [ 'hover' ],
			extraCategories: { effects: { effects: {}, transform: { typeSetKey: 'transform_type', txSetKey: 'transform_tx', tySetKey: 'transform_ty', scaleSetKey: 'transform_scale', rotateSetKey: 'transform_rotate', originSetKey: 'transform_origin' } } },
		} ),
	],
} );

registerWidget( 'xcosb/ar-description', {
	label: __( 'Archive Description', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			extraCategories: { effects: { effects: {}, transform: { typeSetKey: 'transform_type', txSetKey: 'transform_tx', tySetKey: 'transform_ty', scaleSetKey: 'transform_scale', rotateSetKey: 'transform_rotate', originSetKey: 'transform_origin' } } },
		} ),
	],
} );

registerWidget( 'xcosb/ar-result-count', {
	label: __( 'Result Count', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Count text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			extraCategories: { effects: { effects: {}, transform: { typeSetKey: 'transform_type', txSetKey: 'transform_tx', tySetKey: 'transform_ty', scaleSetKey: 'transform_scale', rotateSetKey: 'transform_rotate', originSetKey: 'transform_origin' } } },
		} ),
	],
} );

registerWidget( 'xcosb/ar-ordering', {
	label: __( 'Sort Products', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'title',
			label: __( 'Title', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				typography: { typography: { prefix: 'title', align: false, transform: true } },
				colors: { colors: [ { setKey: 'title_color', label: __( 'Text color', 'xcodesol-page-builder' ) } ] },
				spacing: {
					spacing: {
						margin: false,
						padding: false,
						extra: [ { setKey: 'title_margin_bottom', label: __( 'Space below title', 'xcodesol-page-builder' ), min: 0, max: 300 } ],
					},
				},
				effects: effectsWithTransform( { prefix: 'title' } ),
			},
		},
		{
			id: 'wrapper',
			label: __( 'Box', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				colors: { colors: [ { setKey: 'background', label: __( 'Background color', 'xcodesol-page-builder' ) } ] },
				border: { border: boxBorder( '' ) },
				shadow: { shadow: boxShadow( 'shadow' ) },
				spacing: { spacing: { margin: true, padding: 'all' } },
				effects: effectsWithTransform(),
			},
		},
		{
			id: 'input',
			label: __( 'Select / Radio', 'xcodesol-page-builder' ),
			states: [ 'hover', 'focus', 'focusVisible' ],
			categories: {
				typography: { typography: { prefix: '', align: false } },
				colors: {
					colors: [
						{ setKey: 'color', label: __( 'Text color', 'xcodesol-page-builder' ) },
						{ setKey: 'field_bg_color', label: __( 'Background', 'xcodesol-page-builder' ) },
						{ setKey: 'field_border_color', label: __( 'Border color', 'xcodesol-page-builder' ) },
					],
				},
				border: {
					border: {
						style: false,
						widthSetKey: 'field_border_width',
						colorSetKey: 'field_border_color',
						radiusSetKey: 'field_radius',
					},
				},
				shadow: { shadow: boxShadow( 'field_shadow' ) },
				spacing: {
					spacing: {
						margin: true,
						padding: 'xy',
						paddingPrefix: 'field',
						extra: [ { setKey: 'radio_gap', label: __( 'Gap between options', 'xcodesol-page-builder' ), min: 0, max: 100 } ],
					},
				},
			},
		},
	],
} );

registerWidget( 'xcosb/ar-loop', {
	label: __( 'Product Grid', 'xcodesol-page-builder' ),
	info: __(
		'Each card inside this grid is designed with a Product Card template — create one and compose it from card blocks. Card templates can target the shop, category, tag or other archive pages with their rules.',
		'xcodesol-page-builder'
	),
	elements: [
		{
			id: 'wrapper',
			label: __( 'Grid box', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				layout: {
					layout: {
						items: [
							{ type: 'number', setKey: 'gap', label: __( 'Gap', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 80 },
							{ type: 'number', setKey: 'max_width', label: __( 'Max width', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10 },
						],
					},
				},
				spacing: { spacing: { margin: true, padding: 'all' } },
				background: { background: { setKey: 'background' } },
				border: { border: boxBorder( '' ) },
				shadow: { shadow: boxShadow( 'box_shadow' ) },
				effects: effectsWithTransform(),
			},
		},
	],
} );

registerWidget( 'xcosb/ar-pagination', {
	label: __( 'Pagination', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'wrapper',
			label: __( 'Box', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				spacing: { spacing: { margin: true } },
				layout: TEXT_LAYOUT,
				effects: effectsWithTransform(),
			},
		},
		{
			id: 'link',
			label: __( 'Page button / link', 'xcodesol-page-builder' ),
			states: [ 'hover', 'active', 'focusVisible', 'selected', 'disabled' ],
			categories: {
				typography: { typography: { prefix: '', align: false } },
				colors: {
					colors: [
						{ setKey: 'link_color', label: __( 'Link color', 'xcodesol-page-builder' ) },
						{ setKey: 'hover_color', label: __( 'Hover color', 'xcodesol-page-builder' ) },
						{ setKey: 'active_bg', label: __( 'Current page background', 'xcodesol-page-builder' ) },
						{ setKey: 'active_color', label: __( 'Current page text', 'xcodesol-page-builder' ) },
					],
				},
				border: {
					border: {
						radiusOnly: true,
						radiusSetKey: 'active_radius',
						radiusLabel: __( 'Current page radius', 'xcodesol-page-builder' ),
					},
				},
				spacing: {
					spacing: {
						margin: true,
						extra: [ { setKey: 'item_gap', label: __( 'Gap between pages', 'xcodesol-page-builder' ), min: 0, max: 100 } ],
					},
				},
				layout: TEXT_LAYOUT,
			},
		},
	],
} );

/* ---------------------- Single product blocks -------------------- */

registerWidget( 'xcosb/sp-title', {
	label: __( 'Product Title', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'title',
			label: __( 'Title text', 'xcodesol-page-builder' ),
			tp: TEXT_TP_TRANSFORM,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			states: [ 'hover' ],
		} ),
	],
} );

registerWidget( 'xcosb/sp-price', {
	label: __( 'Product Price', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'price',
			label: __( 'Price text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/sp-excerpt', {
	label: __( 'Product Excerpt', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Excerpt text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/sp-image', {
	label: __( 'Product Image', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'image',
			label: __( 'Image', 'xcodesol-page-builder' ),
			states: [ 'hover' ],
			categories: {
				dimensions: {
					dimensions: {
						items: [
							{ type: 'number', setKey: 'max_width', label: __( 'Max width', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10 },
						],
					},
				},
				layout: {
					layout: {
						items: [
							{ type: 'align', setKey: 'align' },
							{ type: 'number', setKey: 'height', label: __( 'Height (crop)', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10, help: __( 'Set a height to crop the image to a fixed band (0 = natural size).', 'xcodesol-page-builder' ) },
						],
					},
				},
				spacing: { spacing: { margin: true } },
				border: { border: boxBorder( 'img' ) },
				shadow: { shadow: boxShadow( 'img_shadow' ) },
				effects: effectsWithTransform(),
			},
		},
	],
} );

registerWidget( 'xcosb/sp-add-to-cart', {
	label: __( 'Add to Cart', 'xcodesol-page-builder' ),
	elements: [
		buttonEl( 'button', __( 'Button', 'xcodesol-page-builder' ), [ 'hover', 'active', 'focusVisible', 'disabled' ] ),
		{
			id: 'wrapper',
			label: __( 'Box', 'xcodesol-page-builder' ),
			states: [],
			categories: Object.assign( {
				spacing: { spacing: { margin: true } },
				layout: TEXT_LAYOUT,
			}, widgetTransformConfig() ),
		},
	],
} );

registerWidget( 'xcosb/sp-rating', {
	label: __( 'Product Rating', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'stars',
			label: __( 'Stars & Reviews', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			colors: [
				{ setKey: 'color', label: __( 'Star color', 'xcodesol-page-builder' ) },
			],
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/sp-meta', {
	label: __( 'Product Meta', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'meta',
			label: __( 'Meta Text & Links', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			colors: [
				{ setKey: 'color', label: __( 'Text color', 'xcodesol-page-builder' ) },
				{ setKey: 'hover_color', label: __( 'Link hover color', 'xcodesol-page-builder' ) },
			],
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/sp-tabs', {
	label: __( 'Product Tabs', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'tabs',
			label: __( 'Tabs & Content', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			extraCategories: {
				border: { border: boxBorder( '' ) },
				shadow: { shadow: boxShadow( 'shadow' ) },
				effects: { effects: {} },
			},
		} ),
	],
} );

/* ------------------------- Card blocks --------------------------- */

registerWidget( 'xcosb/cd-title', {
	label: __( 'Card Title', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'title',
			label: __( 'Title text', 'xcodesol-page-builder' ),
			tp: TEXT_TP_TRANSFORM,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			states: [ 'hover' ],
		} ),
	],
} );

registerWidget( 'xcosb/cd-price', {
	label: __( 'Card Price', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'price',
			label: __( 'Price text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/cd-rating', {
	label: __( 'Card Rating', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'stars',
			label: __( 'Stars', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			colors: [ { setKey: 'color', label: __( 'Star color', 'xcodesol-page-builder' ) } ],
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/cd-excerpt', {
	label: __( 'Card Excerpt', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Excerpt text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
		} ),
	],
} );

registerWidget( 'xcosb/cd-image', {
	label: __( 'Card Image', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'image',
			label: __( 'Image', 'xcodesol-page-builder' ),
			states: [ 'hover' ],
			categories: {
				dimensions: {
					dimensions: {
						items: [
							{ type: 'select', setKey: 'width', label: __( 'Width', 'xcodesol-page-builder' ), options: [
								{ label: __( 'Auto (full card)', 'xcodesol-page-builder' ), value: '' },
								{ label: '25%', value: '25' },
								{ label: '33%', value: '33' },
								{ label: '50%', value: '50' },
								{ label: '66%', value: '66' },
								{ label: '75%', value: '75' },
								{ label: '100%', value: '100' },
							], help: __( 'Pick a preset to size the image box. Auto keeps the default full-card width; any other value overrides it.', 'xcodesol-page-builder' ) },
							{ type: 'number', setKey: 'max_width', label: __( 'Max width', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10 },
						],
					},
				},
				layout: {
					layout: {
						items: [
							{ type: 'align', setKey: 'align' },
							{ type: 'number', setKey: 'height', label: __( 'Band height', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10, help: __( 'The image keeps a 4:3 ratio; this value caps how tall the band can get (0 = natural image size).', 'xcodesol-page-builder' ) },
						],
					},
				},
				imageEffects: {
					imageEffects: {
						items: [
							{ type: 'toggle', setKey: 'overlay', label: __( 'Show overlay on the photo', 'xcodesol-page-builder' ), help: __( 'A shade over the image — use a bottom-up gradient to keep the card content below the photo readable.', 'xcodesol-page-builder' ) },
							{ type: 'select', setKey: 'overlay_direction', label: __( 'Overlay type', 'xcodesol-page-builder' ), options: [
								{ label: __( 'Bottom-up gradient', 'xcodesol-page-builder' ), value: 'to-top' },
								{ label: __( 'Even shade', 'xcodesol-page-builder' ), value: 'cover' },
							] },
							{ type: 'color', setKey: 'overlay_color', label: __( 'Overlay color', 'xcodesol-page-builder' ) },
							{ type: 'number', setKey: 'overlay_opacity', label: __( 'Overlay strength', 'xcodesol-page-builder' ), suffix: '%', min: 0, max: 100 },
						],
					},
				},
				spacing: { spacing: { margin: true } },
				border: { border: boxBorder( 'img' ) },
				shadow: { shadow: boxShadow( 'img_shadow' ) },
				effects: effectsWithTransform(),
			},
		},
	],
} );

registerWidget( 'xcosb/cd-add-to-cart', {
	label: __( 'Card Add to Cart', 'xcodesol-page-builder' ),
	elements: [
		buttonEl( 'button', __( 'Button', 'xcodesol-page-builder' ), [ 'hover', 'active', 'focusVisible', 'disabled' ] ),
		{
			id: 'wrapper',
			label: __( 'Box', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				spacing: { spacing: { margin: true } },
				layout: TEXT_LAYOUT,
				effects: effectsWithTransform(),
			},
		},
	],
} );

/* Card badge: badge chip (box) + badge text (typography). */
const BADGE_PLACEMENT_ITEMS = [
	{
		type: 'select',
		setKey: 'style',
		label: __( 'Badge style', 'xcodesol-page-builder' ),
		options: [
			{ label: __( 'Simple', 'xcodesol-page-builder' ), value: 'simple' },
			{ label: __( 'Ribbon', 'xcodesol-page-builder' ), value: 'ribbon' },
		],
	},
	{
		type: 'select',
		setKey: 'position',
		label: __( 'Position', 'xcodesol-page-builder' ),
		help: __( 'Overlay positions anchor to the whole card — put the image first at full width so the badge sits on the image.', 'xcodesol-page-builder' ),
		options: [
			{ label: __( 'Inline (in the card flow)', 'xcodesol-page-builder' ), value: 'inline' },
			{ label: __( 'Top left', 'xcodesol-page-builder' ), value: 'top-left' },
			{ label: __( 'Top center', 'xcodesol-page-builder' ), value: 'top-center' },
			{ label: __( 'Top right', 'xcodesol-page-builder' ), value: 'top-right' },
			{ label: __( 'Middle left', 'xcodesol-page-builder' ), value: 'middle-left' },
			{ label: __( 'Middle right', 'xcodesol-page-builder' ), value: 'middle-right' },
			{ label: __( 'Bottom left', 'xcodesol-page-builder' ), value: 'bottom-left' },
			{ label: __( 'Bottom center', 'xcodesol-page-builder' ), value: 'bottom-center' },
			{ label: __( 'Bottom right', 'xcodesol-page-builder' ), value: 'bottom-right' },
		],
	},
];

registerWidget( 'xcosb/cd-badge', {
	label: __( 'Sale Badge', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'placement',
			label: __( 'Placement', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				imageSettings: { imageSettings: { items: BADGE_PLACEMENT_ITEMS } },
			},
		},
		{
			id: 'badge',
			label: __( 'Badge chip', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				colors: {
					colors: [
						{ setKey: 'badge_bg', label: __( 'Background', 'xcodesol-page-builder' ) },
						{ setKey: 'badge_border_color', label: __( 'Border color', 'xcodesol-page-builder' ) },
					],
				},
				border: { border: boxBorder( 'badge' ) },
				shadow: { shadow: boxShadow( 'badge_shadow' ) },
				spacing: {
					spacing: {
						margin: true,
						padding: 'single',
						paddingPrefix: 'badge',
					},
				},
			},
		},
		textEl( {
			id: 'text',
			label: __( 'Badge text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			colors: [ { setKey: 'color', label: __( 'Text color', 'xcodesol-page-builder' ) } ],
			spacing: false,
		} ),
	],
} );

/* Card chips (categories / tags). */
const CHIP_ELEMENT = ( label ) => ( {
	id: 'chip',
	label,
	states: [ 'hover', 'focusVisible' ],
	categories: {
		typography: { typography: { prefix: 'item', align: false } },
		colors: {
			colors: [
				{ setKey: 'item_bg', label: __( 'Background', 'xcodesol-page-builder' ) },
				{ setKey: 'item_color', label: __( 'Text / link', 'xcodesol-page-builder' ) },
			],
		},
		border: { border: boxBorder( 'item' ) },
		shadow: { shadow: boxShadow( 'item_shadow' ) },
		spacing: {
			spacing: {
				margin: true,
				padding: 'single',
				paddingPrefix: 'item',
			},
		},
		effects: effectsWithTransform(),
	},
} );

registerWidget( 'xcosb/cd-categories', {
	label: __( 'Card Categories', 'xcodesol-page-builder' ),
	elements: [
		CHIP_ELEMENT( __( 'Chips', 'xcodesol-page-builder' ) ),
	],
} );

registerWidget( 'xcosb/cd-tags', {
	label: __( 'Card Tags', 'xcodesol-page-builder' ),
	elements: [
		CHIP_ELEMENT( __( 'Chips', 'xcodesol-page-builder' ) ),
	],
} );

registerWidget( 'xcosb/cd-stock', {
	label: __( 'Card Stock Status', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Status text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			extraCategories: { effects: effectsWithTransform() },
		} ),
	],
} );

registerWidget( 'xcosb/cd-sku', {
	label: __( 'Card SKU', 'xcodesol-page-builder' ),
	elements: [			textEl( {
				id: 'text',
				label: __( 'Text row', 'xcodesol-page-builder' ),
				tp: TEXT_TP,
				spacing: TEXT_SPACING,
				layout: TEXT_LAYOUT,
				extraCategories: { effects: effectsWithTransform() },
			} ),
		],
} );

/* -------------------------- General blocks ----------------------- */

registerWidget( 'xcosb/gb-banner', {
	label: __( 'Slider', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'container',
			label: __( 'Background & box', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				background: { background: { type: 'banner' } },
				layout: {
					layout: {
						items: [
							{ type: 'align', setKey: 'align', label: __( 'Text alignment', 'xcodesol-page-builder' ) },
							{ type: 'number', setKey: 'min_height', label: __( 'Height', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 1200 },
						],
					},
				},
				spacing: { spacing: { margin: false, padding: 'all' } },
				border: { border: boxBorder( '' ) },
				shadow: { shadow: boxShadow( 'box_shadow' ) },
				effects: effectsWithTransform(),
			},
		},
		{
			id: 'heading',
			label: __( 'Heading', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				typography: { typography: { prefix: 'title', transform: true, align: false } },
				colors: { colors: [ { setKey: 'title_color', label: __( 'Text color', 'xcodesol-page-builder' ) } ] },
				effects: effectsWithTransform( { prefix: 'title' } ),
			},
		},
		{
			id: 'paragraph',
			label: __( 'Paragraph', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				typography: { typography: { prefix: 'subtitle', align: false } },
				colors: { colors: [ { setKey: 'subtitle_color', label: __( 'Text color', 'xcodesol-page-builder' ) } ] },
				effects: effectsWithTransform( { prefix: 'subtitle' } ),
			},
		},
		{
			id: 'button',
			label: __( 'Button', 'xcodesol-page-builder' ),
			states: [ 'hover', 'active', 'focusVisible' ],
			categories: {
				colors: {
					colors: [
						{ setKey: 'button_bg_color', label: __( 'Background', 'xcodesol-page-builder' ), css: true },
						{ setKey: 'button_text_color', label: __( 'Text', 'xcodesol-page-builder' ) },
						{ setKey: 'button_border_color', label: __( 'Border', 'xcodesol-page-builder' ) },
						{ setKey: 'button_hover_bg', label: __( 'Hover background', 'xcodesol-page-builder' ), css: true },
						{ setKey: 'button_hover_color', label: __( 'Hover text', 'xcodesol-page-builder' ) },
					],
				},
				typography: { typography: { prefix: 'button', size: false, weight: false, lineHeight: false, letterSpacing: false, align: false } },
				border: { border: boxBorder( 'button' ) },
				spacing: {
					spacing: {
						margin: false,
						padding: 'xy',
						paddingPrefix: 'button',
					},
				},
			},
		},
	],
} );

registerWidget( 'xcosb/gb-divider', {
	label: __( 'Divider', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'line',
			label: __( 'Line', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				colors: { colors: [ { setKey: 'color', label: __( 'Line color', 'xcodesol-page-builder' ) } ] },
				layout: {
					layout: {
						items: [
							{ type: 'select', setKey: 'style', label: __( 'Style', 'xcodesol-page-builder' ), options: [
								{ label: __( 'Solid', 'xcodesol-page-builder' ), value: 'solid' },
								{ label: __( 'Dashed', 'xcodesol-page-builder' ), value: 'dashed' },
								{ label: __( 'Dotted', 'xcodesol-page-builder' ), value: 'dotted' },
								{ label: __( 'Double', 'xcodesol-page-builder' ), value: 'double' },
							] },
							{ type: 'number', setKey: 'height', label: __( 'Thickness', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 1, max: 20 },
						],
					},
				},
				spacing: { spacing: { margin: false, padding: false, extra: [ { setKey: 'margin', label: __( 'Spacing around', 'xcodesol-page-builder' ), min: 0, max: 300 } ] } },
				effects: effectsWithTransform(),
			},
		},
	],
} );

registerWidget( 'xcosb/gb-breadcrumb', {
	label: __( 'Breadcrumb', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Links text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			colors: [
				{ setKey: 'color', label: __( 'Text color', 'xcodesol-page-builder' ) },
				{ setKey: 'link_color', label: __( 'Link color', 'xcodesol-page-builder' ) },
			],
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			states: [ 'hover', 'focusVisible' ],
			extraCategories: { effects: effectsWithTransform() },
		} ),
	],
} );

registerWidget( 'xcosb/gb-text', {
	label: __( 'Text', 'xcodesol-page-builder' ),
	elements: [
		textEl( {
			id: 'text',
			label: __( 'Text', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			extraCategories: {
				border: { border: boxBorder( '' ) },
				effects: { effects: {} },
			},
		} ),
	],
} );

registerWidget( 'xcosb/gb-container', {
	label: __( 'Container', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'wrapper',
			label: __( 'Container', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				layout: {
					layout: {
						items: [
							{ type: 'number', setKey: 'gap', label: __( 'Column gap', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 200 },
							{ type: 'select', setKey: 'align', label: __( 'Vertical alignment', 'xcodesol-page-builder' ), options: [
								{ label: __( 'Stretch', 'xcodesol-page-builder' ), value: 'stretch' },
								{ label: __( 'Start', 'xcodesol-page-builder' ), value: 'start' },
								{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
								{ label: __( 'End', 'xcodesol-page-builder' ), value: 'end' },
							] },
							{ type: 'select', setKey: 'position', label: __( 'Container position', 'xcodesol-page-builder' ), options: [
								{ label: __( 'Full width', 'xcodesol-page-builder' ), value: 'full' },
								{ label: __( 'Left aligned', 'xcodesol-page-builder' ), value: 'left' },
								{ label: __( 'Centered', 'xcodesol-page-builder' ), value: 'center' },
								{ label: __( 'Right aligned', 'xcodesol-page-builder' ), value: 'right' },
							] },
							{ type: 'number', setKey: 'max_width', label: __( 'Max width', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10, help: __( 'Used when the container is not full width (0 = full area).', 'xcodesol-page-builder' ) },
						],
					},
				},
				spacing: { spacing: { margin: false, padding: 'all' } },
				colors: { colors: [ { setKey: 'background', label: __( 'Background color', 'xcodesol-page-builder' ) } ] },
				border: { border: boxBorder( '' ) },
				shadow: { shadow: boxShadow( 'box_shadow' ) },
				effects: { effects: {} },
			},
		},
	],
	/* Column elements are appended dynamically (columns setting drives count). */
	columnElement: ( index ) => ( {
		id: `col-${ index }`,
		label: sprintf( __( 'Column %d', 'xcodesol-page-builder' ), index + 1 ),
		states: [],
		column: true,
		categories: {
			layout: { layout: { items: [ ...COLUMN_LAYOUT_ITEMS_SRC ] } },
			spacing: { spacing: { margin: false, padding: 'all' } },
			colors: { colors: [ { setKey: 'background', label: __( 'Background color', 'xcodesol-page-builder' ) } ] },
			border: { border: boxBorder( '' ) },
			shadow: { shadow: boxShadow( 'box_shadow' ) },
		},
	} ),
} );

registerWidget( 'xcosb/gb-text-widget', {
	label: __( 'Text Widget', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'title',
			label: __( 'Title', 'xcodesol-page-builder' ),
			states: [],
			categories: {
				typography: { typography: { prefix: 'title', align: false, lineHeight: false, letterSpacing: false, transform: false } },
				colors: { colors: [ { setKey: 'title_color', label: __( 'Text color', 'xcodesol-page-builder' ) } ] },
				effects: effectsWithTransform(),
			},
		},
		textEl( {
			id: 'content',
			label: __( 'Content', 'xcodesol-page-builder' ),
			tp: TEXT_TP,
			spacing: TEXT_SPACING,
			layout: TEXT_LAYOUT,
			// Title already carries the (root-level) transform; the content
			// area is rich widget output styled via CSS variables, so a second
			// flat transform would collide with it.
			noEffects: true,
		} ),
	],
} );

/* ---------------------- WooCommerce content ---------------------- */

const TERM_HEADING_CATS = ( ) => ( {
	typography: { typography: { prefix: 'title', align: false, transform: true } },
	colors: { colors: [ { setKey: 'title_color', label: __( 'Text color', 'xcodesol-page-builder' ) } ] },
	spacing: {
		spacing: {
			margin: false,
			padding: false,
			extra: [ { setKey: 'title_margin_bottom', label: __( 'Space below title', 'xcodesol-page-builder' ), min: 0, max: 300 } ],
		},
	},
	effects: effectsWithTransform( { prefix: 'title' } ),
} );

const TERM_ITEMS_CATS = () => ( {
	colors: {
		colors: [
			{ setKey: 'item_bg', label: __( 'Background', 'xcodesol-page-builder' ) },
			{ setKey: 'item_color', label: __( 'Text / link', 'xcodesol-page-builder' ) },
			{ setKey: 'item_count_color', label: __( 'Count color', 'xcodesol-page-builder' ) },
		],
	},
	typography: { typography: { prefix: 'item', align: false } },
	border: { border: boxBorder( 'item' ) },
	shadow: { shadow: boxShadow( 'item_shadow' ) },
	spacing: {
		spacing: {
			margin: true,
			padding: 'single',
			paddingPrefix: 'item',
		},
	},
	effects: effectsWithTransform( { prefix: 'item' } ),
} );

const wooTermWidget = ( type, label, itemsLabel ) => registerWidget( type, {
	label,
	elements: [
		{
			id: 'title',
			label: __( 'Title', 'xcodesol-page-builder' ),
			states: [],
			categories: TERM_HEADING_CATS(),
		},
		{
			id: 'items',
			label: itemsLabel,
			states: [],
			categories: TERM_ITEMS_CATS(),
		},
	],
} );

wooTermWidget( 'xcosb/woo-categories', __( 'Product Categories', 'xcodesol-page-builder' ), __( 'Category cards', 'xcodesol-page-builder' ) );
wooTermWidget( 'xcosb/woo-tags', __( 'Product Tags', 'xcodesol-page-builder' ), __( 'Tags', 'xcodesol-page-builder' ) );
wooTermWidget( 'xcosb/woo-attributes', __( 'Product Attributes', 'xcodesol-page-builder' ), __( 'Terms', 'xcodesol-page-builder' ) );

registerWidget( 'xcosb/woo-search', {
	label: __( 'Product Search', 'xcodesol-page-builder' ),
	elements: [
		{
			id: 'input',
			label: __( 'Input', 'xcodesol-page-builder' ),
			states: [ 'hover', 'focus', 'focusVisible' ],
			categories: {
				dimensions: {
					dimensions: {
						items: [
							{ type: 'number', setKey: 'field_height', label: __( 'Height', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 200 },
						],
					},
				},
				typography: { typography: { prefix: 'field', align: false, weight: false, lineHeight: false, letterSpacing: false } },
				colors: {
					colors: [
						{ setKey: 'field_bg_color', label: __( 'Background', 'xcodesol-page-builder' ) },
						{ setKey: 'field_color', label: __( 'Text color', 'xcodesol-page-builder' ) },
						{ setKey: 'field_border_color', label: __( 'Border color', 'xcodesol-page-builder' ) },
					],
				},
				border: {
					border: {
						style: false,
						widthSetKey: 'field_border_width',
						colorSetKey: 'field_border_color',
						radiusSetKey: 'field_radius',
					},
				},
				spacing: {
					spacing: {
						margin: true,
						padding: 'xy',
						paddingPrefix: 'field',
					},
				},
				effects: effectsWithTransform(),
			},
		},
		buttonEl( 'button', __( 'Button', 'xcodesol-page-builder' ), [ 'hover', 'active', 'focusVisible', 'disabled' ] ),
	],
} );

/* --------------------- Cart / checkout boxes --------------------- */

const pageContentEl = ( id, label ) => ( {
	id,
	label,
	states: [],
	categories: {
		layout: {
			layout: {
				items: [
					{ type: 'align', setKey: 'align' },
					{ type: 'number', setKey: 'max_width', label: __( 'Max width', 'xcodesol-page-builder' ), suffix: __( 'px', 'xcodesol-page-builder' ), min: 0, max: 2000, step: 10 },
				],
			},
		},
		colors: { colors: [ { setKey: 'background', label: __( 'Background color', 'xcodesol-page-builder' ), css: true } ] },
		border: { border: boxBorder( '' ) },
		shadow: { shadow: boxShadow( 'shadow' ) },
		spacing: {
			spacing: {
				margin: 'tb',
				padding: 'all',
			},
		},
		effects: effectsWithTransform(),
	},
} );

registerWidget( 'xcosb/cc-cart', {
	label: __( 'Cart (WooCommerce)', 'xcodesol-page-builder' ),
	elements: [ pageContentEl( 'wrapper', __( 'Cart box', 'xcodesol-page-builder' ) ) ],
} );

registerWidget( 'xcosb/cc-cart-items', {
	label: __( 'Cart Items (WooCommerce)', 'xcodesol-page-builder' ),
	elements: [ pageContentEl( 'wrapper', __( 'Cart items box', 'xcodesol-page-builder' ) ) ],
} );

registerWidget( 'xcosb/cc-cart-totals', {
	label: __( 'Cart Totals (WooCommerce)', 'xcodesol-page-builder' ),
	elements: [ pageContentEl( 'wrapper', __( 'Cart totals box', 'xcodesol-page-builder' ) ) ],
} );

registerWidget( 'xcosb/cc-checkout', {
	label: __( 'Checkout (WooCommerce)', 'xcodesol-page-builder' ),
	elements: [ pageContentEl( 'wrapper', __( 'Checkout box', 'xcodesol-page-builder' ) ) ],
} );

[ 'xcosb/cc-checkout-contact', 'xcosb/cc-checkout-billing', 'xcosb/cc-checkout-shipping', 'xcosb/cc-checkout-notes', 'xcosb/cc-checkout-totals', 'xcosb/cc-checkout-payment' ].forEach( ( t, i ) => {
	const labels = {
		'xcosb/cc-checkout-contact': __( 'Contact info box', 'xcodesol-page-builder' ),
		'xcosb/cc-checkout-billing': __( 'Billing address box', 'xcodesol-page-builder' ),
		'xcosb/cc-checkout-shipping': __( 'Shipping address box', 'xcodesol-page-builder' ),
		'xcosb/cc-checkout-notes': __( 'Order notes box', 'xcodesol-page-builder' ),
		'xcosb/cc-checkout-totals': __( 'Order review & totals box', 'xcodesol-page-builder' ),
		'xcosb/cc-checkout-payment': __( 'Payment box', 'xcodesol-page-builder' ),
	};
	registerWidget( t, {
		label: labels[ t ],
		elements: [ pageContentEl( 'wrapper', labels[ t ] ) ],
	} );
} );

/* ------------------------------------------------------------------ *
 * Exports + helpers
 * ------------------------------------------------------------------ */

/**
 * Get the popover config for a block type (or null).
 *
 * @param {string} type Block type.
 * @return {Object|null} Config { label, elements, info?, columnElement? }.
 */
export function getWidgetConfig( type ) {
	return WIDGET_CONFIG[ type ] || null;
}

/**
 * Expand a config's elements, appending container column elements when the
 * widget declares a columnElement factory.
 *
 * @param {Object} cfg      Widget config.
 * @param {Object} settings Current settings (columns count).
 * @return {Array} Element list.
 */
export function getWidgetElements( cfg, settings ) {
	const base = ( cfg && cfg.elements ) || [];
	if ( ! cfg || ! cfg.columnElement ) {
		return base;
	}
	const count = Math.min( 6, Math.max( 1, Number( settings && settings.columns ) || 2 ) );
	const cols = [];
	for ( let i = 0; i < count; i++ ) {
		cols.push( cfg.columnElement( i ) );
	}
	return [ ...base, ...cols ];
}

/**
 * Collect every settings key a category writes (used for per-category reset
 * and the "N changes" menu badges). Colors declare setKeys explicitly;
 * typography/border/spacing/shadow/effects keys are derived from prefixes.
 *
 * @param {string} categoryId Category id.
 * @param {Object} catCfg     Category config (from the element).
 * @return {Array<string>} Settings keys touched by the category.
 */
export function categoryKeys( categoryId, catCfg ) {
	const keys = [];
	const push = ( k ) => {
		if ( k && ! k.startsWith( '__' ) ) {
			keys.push( k );
		}
	};

	if ( categoryId === 'colors' ) {
		( catCfg.colors || [] ).forEach( ( c ) => push( c.setKey ) );
		return keys;
	}

	if ( categoryId === 'layout' || categoryId === 'dimensions' || categoryId === 'imageSettings' || categoryId === 'imageEffects' ) {
		( ( catCfg[ categoryId ] && catCfg[ categoryId ].items ) || [] ).forEach( ( item ) => push( item.setKey ) );
		return keys;
	}

	if ( categoryId === 'typography' ) {
		const tp = catCfg.typography || {};
		const p = tp.prefix ? `${ tp.prefix }_` : '';
		[ 'font_family', 'font_size', 'font_weight', 'line_height', 'letter_spacing', 'text_transform', 'font_style', 'text_decoration' ].forEach( ( k ) => push( p + k ) );
		if ( tp.align ) {
			push( 'align' );
		}
		return keys;
	}

	if ( categoryId === 'border' ) {
		const b = catCfg.border || {};
		if ( b.radiusOnly ) {
			push( b.radiusSetKey || 'border_radius' );
			return keys;
		}
		const p = b.prefix ? `${ b.prefix }_` : '';
		push( b.widthSetKey || `${ p }border_width` );
		push( b.colorSetKey || `${ p }border_color` );
		push( b.radiusSetKey || `${ p }border_radius` );
		if ( b.style !== false ) {
			push( b.styleSetKey || `${ p }border_style` );
		}
		return keys;
	}

	if ( categoryId === 'spacing' ) {
		const sp = catCfg.spacing || {};
		if ( sp.margin ) {
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( s ) => push( `margin_${ s }` ) );
		}
		const pp = sp.paddingPrefix ? `${ sp.paddingPrefix }_` : '';
		if ( sp.padding === 'all' ) {
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( s ) => push( `${ pp }padding_${ s }` ) );
		} else if ( sp.padding === 'xy' ) {
			push( `${ pp }padding_x` );
			push( `${ pp }padding_y` );
		} else if ( sp.padding === 'single' ) {
			push( `${ pp }padding` );
		}
		( sp.extra || [] ).forEach( ( item ) => push( item.setKey ) );
		return keys;
	}

	if ( categoryId === 'shadow' ) {
		push( ( catCfg.shadow && catCfg.shadow.setKey ) || 'box_shadow' );
		return keys;
	}

	if ( categoryId === 'effects' ) {
		const ef = catCfg.effects || {};
		push( ef.animationSetKey || 'animation' );
		push( ef.durationSetKey || 'animation_duration' );
		push( ef.delaySetKey || 'animation_delay' );
		( transformKeysFromCfg( ef ) ).forEach( ( k ) => push( k ) );
		return keys;
	}

	if ( categoryId === 'background' ) {
		const bg = catCfg.background || {};
		if ( bg.type === 'banner' ) {
			return [
				'bg_type', 'bg_color', 'bg_image', 'bg_size', 'bg_position', 'bg_repeat', 'bg_attachment',
				'bg_video', 'gradient_type', 'gradient_angle', 'gradient_radial_shape', 'gradient_position',
				'gradient_color_a', 'gradient_color_b', 'overlay_color', 'overlay_opacity',
			];
		}
		push( bg.setKey || 'background' );
		return keys;
	}

	if ( categoryId === 'visibility' ) {
		const vis = ( catCfg && catCfg.visibility ) || {};
		push( vis.hideDesktop || 'hide_on_desktop' );
		push( vis.hideTablet || 'hide_on_tablet' );
		push( vis.hideMobile || 'hide_on_mobile' );
		return keys;
	}

	if ( categoryId === 'advanced' ) {
		const adv = ( catCfg && catCfg.advanced ) || {};
		push( adv.classKey || 'css_class' );
		push( adv.idKey || 'css_id' );
		return keys;
	}

	if ( categoryId === 'position' ) {
		return [ 'position', 'pos_x', 'pos_y', 'pos_z' ];
	}

	return keys;
}

const COLUMN_LAYOUT_ITEMS_SRC = COLUMN_LAYOUT_ITEMS;

/* Button element factory (colors + typography + padding + border). */
function buttonEl( id, label, states ) {
	return {
		id,
		label,
		states,
		categories: {
			colors: {
				colors: [
					{ setKey: 'button_bg_color', label: __( 'Background', 'xcodesol-page-builder' ), css: true },
					{ setKey: 'button_text_color', label: __( 'Text', 'xcodesol-page-builder' ) },
					{ setKey: 'button_border_color', label: __( 'Border', 'xcodesol-page-builder' ) },
				],
			},
			typography: { typography: { prefix: 'button', align: false } },
			border: { border: boxBorder( 'button' ) },
			spacing: {
				spacing: {
					margin: true,
					padding: 'xy',
					paddingPrefix: 'button',
				},
			},
			layout: TEXT_LAYOUT,
		},
	};
}
