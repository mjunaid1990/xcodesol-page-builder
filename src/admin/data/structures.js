/**
 * Template structure definitions for Xcodesol Page Builder.
 *
 * Each structure defines a preset layout arrangement with zones where
 * Elementor-style blocks can be placed.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';

const ALL_ALLOWED_BLOCKS = [
	'xcopb/gb-container',
	'xcopb/container',
	'xcopb/gb-heading',
	'xcopb/gb-image',
	'xcopb/gb-text',
	'xcopb/gb-button',
	'xcopb/gb-divider',
	'xcopb/gb-banner',
	'xcopb/gb-shortcode',
	'xcopb/gb-breadcrumb',
	'xcopb/gb-text-widget',
	// Single Post Dynamic Blocks
	'xcopb/post-title',
	'xcopb/post-content',
	'xcopb/post-featured-image',
	'xcopb/post-meta',
	'xcopb/post-excerpt',
	'xcopb/post-author-box',
	'xcopb/post-navigation',
	'xcopb/post-comments',
	// Archive Dynamic Blocks
	'xcopb/archive-title',
	'xcopb/archive-description',
	'xcopb/archive-posts',
	// Backward compatibility
	'xcosb/gb-container',
	'xcosb/container',
	'xcosb/gb-banner',
	'xcosb/gb-divider',
	'xcosb/gb-text',
	'xcosb/gb-text-widget',
	'xcosb/gb-breadcrumb',
];

/**
 * Standard Page structures.
 */
export const PAGE_STRUCTURES = [
	{
		id: 'page-blank',
		name: __( 'Blank Canvas', 'xcodesol-page-builder' ),
		description: __( 'Full-width empty canvas for creating custom layouts.', 'xcodesol-page-builder' ),
		icon: 'layout-fullwidth',
		cssClass: 'xcopb-structure-blank',
		zones: [
			{
				id: 'main',
				label: __( 'Canvas Content', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{
				type: 'xcopb/gb-heading',
				settings: {
					title: __( 'Start Building With Xcodesol Page Builder', 'xcodesol-page-builder' ),
					tag: 'h1',
					align: 'center',
				},
			},
			{
				type: 'xcopb/gb-text',
				settings: {
					content: __( 'Drag and drop widgets from the left panel to craft beautiful layouts visually.', 'xcodesol-page-builder' ),
					align: 'center',
				},
			},
			{
				type: 'xcopb/gb-button',
				settings: {
					text: __( 'Get Started', 'xcodesol-page-builder' ),
					link: '#',
					align: 'center',
					size: 'md',
					bg_color: '#2563eb',
					text_color: '#ffffff',
				},
			},
		],
		defaultZones: {
			main: [ 0, 1, 2 ],
		},
	},
	{
		id: 'page-hero',
		name: __( 'Hero + Content', 'xcodesol-page-builder' ),
		description: __( 'Prominent hero banner at top with content section below.', 'xcodesol-page-builder' ),
		icon: 'layout-hero',
		cssClass: 'xcopb-structure-hero',
		zones: [
			{
				id: 'hero',
				label: __( 'Hero Section', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'content',
				label: __( 'Main Content', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{
				type: 'xcopb/gb-banner',
				settings: {
					title: __( 'Empower Your Ideas', 'xcodesol-page-builder' ),
					subtitle: __( 'Build modern, responsive web experiences with complete visual freedom.', 'xcodesol-page-builder' ),
					button_text: __( 'Discover More', 'xcodesol-page-builder' ),
					align: 'center',
				},
			},
			{
				type: 'xcopb/gb-heading',
				settings: {
					title: __( 'Welcome to Our Website', 'xcodesol-page-builder' ),
					tag: 'h2',
					align: 'left',
				},
			},
			{
				type: 'xcopb/gb-text',
				settings: {
					content: __( 'This is a sample content area. Replace this text with your own story, services, or product highlights.', 'xcodesol-page-builder' ),
					align: 'left',
				},
			},
		],
		defaultZones: {
			hero: [ 0 ],
			content: [ 1, 2 ],
		},
	},
	{
		id: 'page-split',
		name: __( 'Split 2-Column', 'xcodesol-page-builder' ),
		description: __( 'Side-by-side two column layout.', 'xcodesol-page-builder' ),
		icon: 'layout-split',
		cssClass: 'xcopb-structure-split',
		zones: [
			{
				id: 'left',
				label: __( 'Left Column', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'right',
				label: __( 'Right Column', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{
				type: 'xcopb/gb-heading',
				settings: {
					title: __( 'Build Faster with Visual Tools', 'xcodesol-page-builder' ),
					tag: 'h2',
				},
			},
			{
				type: 'xcopb/gb-text',
				settings: {
					content: __( 'Design pixel-perfect sections without touching complex code.', 'xcodesol-page-builder' ),
				},
			},
			{
				type: 'xcopb/gb-button',
				settings: {
					text: __( 'Explore Now', 'xcodesol-page-builder' ),
					bg_color: '#2563eb',
				},
			},
			{
				type: 'xcopb/gb-image',
				settings: {
					url: '',
					alt: __( 'Feature illustration', 'xcodesol-page-builder' ),
				},
			},
		],
		defaultZones: {
			left: [ 0, 1, 2 ],
			right: [ 3 ],
		},
	},
	{
		id: 'page-landing',
		name: __( 'Landing Page', 'xcodesol-page-builder' ),
		description: __( 'Hero, features grid, and call to action sections.', 'xcodesol-page-builder' ),
		icon: 'layout-center',
		cssClass: 'xcopb-structure-landing',
		zones: [
			{
				id: 'hero',
				label: __( 'Hero Section', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'features',
				label: __( 'Features Section', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'cta',
				label: __( 'Call to Action', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{
				type: 'xcopb/gb-banner',
				settings: {
					title: __( 'High Performance Web Builder', 'xcodesol-page-builder' ),
					subtitle: __( 'Visual flexibility inspired by Elementor with lightweight native output.', 'xcodesol-page-builder' ),
					button_text: __( 'Get Started Free', 'xcodesol-page-builder' ),
				},
			},
			{
				type: 'xcopb/gb-heading',
				settings: {
					title: __( 'Why Choose Us?', 'xcodesol-page-builder' ),
					tag: 'h2',
					align: 'center',
				},
			},
			{
				type: 'xcopb/gb-text',
				settings: {
					content: __( 'Lightning fast performance, visual drag-and-drop precision, and clean code generation.', 'xcodesol-page-builder' ),
					align: 'center',
				},
			},
			{
				type: 'xcopb/gb-banner',
				settings: {
					title: __( 'Ready to Start Building?', 'xcodesol-page-builder' ),
					subtitle: __( 'Join thousands of creators building modern websites today.', 'xcodesol-page-builder' ),
					button_text: __( 'Create Your Page', 'xcodesol-page-builder' ),
				},
			},
		],
		defaultZones: {
			hero: [ 0 ],
			features: [ 1, 2 ],
			cta: [ 3 ],
		},
	},
];

/**
 * Section & Template Parts structures.
 */
export const SECTION_STRUCTURES = [
	{
		id: 'section-single',
		name: __( 'Single Section', 'xcodesol-page-builder' ),
		description: __( 'A single full or boxed section.', 'xcodesol-page-builder' ),
		icon: 'layout-fullwidth',
		cssClass: 'xcopb-structure-section',
		zones: [
			{
				id: 'main',
				label: __( 'Section Content', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [],
		defaultZones: { main: [] },
	},
];

export const HEADER_STRUCTURES = [
	{
		id: 'header-standard',
		name: __( 'Header Layout', 'xcodesol-page-builder' ),
		description: __( 'Top header with branding, navigation, and CTA.', 'xcodesol-page-builder' ),
		icon: 'layout-center',
		cssClass: 'xcopb-structure-header',
		zones: [
			{
				id: 'brand',
				label: __( 'Brand / Logo', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'nav',
				label: __( 'Navigation Area', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'action',
				label: __( 'Action Button', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{
				type: 'xcopb/gb-heading',
				settings: { title: 'Site Brand', tag: 'h3', align: 'left' },
			},
			{
				type: 'xcopb/gb-button',
				settings: { text: 'Contact Us', align: 'right', size: 'sm', bg_color: '#2563eb' },
			},
		],
		defaultZones: {
			brand: [ 0 ],
			nav: [],
			action: [ 1 ],
		},
	},
];

export const FOOTER_STRUCTURES = [
	{
		id: 'footer-multi',
		name: __( 'Footer Multi-Column', 'xcodesol-page-builder' ),
		description: __( 'Multi-column footer with bottom bar.', 'xcodesol-page-builder' ),
		icon: 'layout-center',
		cssClass: 'xcopb-structure-footer',
		zones: [
			{
				id: 'content',
				label: __( 'Footer Content', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
			{
				id: 'bottom',
				label: __( 'Bottom Bar', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{
				type: 'xcopb/gb-text',
				settings: { content: '© ' + new Date().getFullYear() + ' All Rights Reserved.', align: 'center' },
			},
		],
		defaultZones: {
			content: [],
			bottom: [ 0 ],
		},
	},
];

/**
 * Single Post structures.
 */
export const SINGLE_POST_STRUCTURES = [
	{
		id: 'post-standard',
		name: __( 'Standard Post', 'xcodesol-page-builder' ),
		description: __( 'Classic post layout with title, meta, featured image, content and comments.', 'xcodesol-page-builder' ),
		icon: 'layout-fullwidth',
		cssClass: 'xcopb-structure-post-standard',
		zones: [
			{
				id: 'main',
				label: __( 'Post Content', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{ type: 'xcopb/post-title', settings: { tag: 'h1', align: 'left' } },
			{ type: 'xcopb/post-meta', settings: { show_author: true, show_date: true, show_comments: true, show_categories: true } },
			{ type: 'xcopb/post-featured-image', settings: { size: 'full', align: 'center', border_radius: 8 } },
			{ type: 'xcopb/post-content', settings: {} },
			{ type: 'xcopb/post-author-box', settings: { border_radius: 8 } },
			{ type: 'xcopb/post-navigation', settings: {} },
			{ type: 'xcopb/post-comments', settings: {} },
		],
		defaultZones: {
			main: [ 0, 1, 2, 3, 4, 5, 6 ],
		},
	},
];

/**
 * Archive structures.
 */
export const ARCHIVE_STRUCTURES = [
	{
		id: 'archive-grid',
		name: __( 'Archive Grid', 'xcodesol-page-builder' ),
		description: __( 'Archive title, description and responsive 3-column posts grid.', 'xcodesol-page-builder' ),
		icon: 'layout-fullwidth',
		cssClass: 'xcopb-structure-archive-grid',
		zones: [
			{
				id: 'main',
				label: __( 'Archive Content', 'xcodesol-page-builder' ),
				allowedBlocks: ALL_ALLOWED_BLOCKS,
			},
		],
		defaultLayout: [
			{ type: 'xcopb/archive-title', settings: { tag: 'h1', align: 'left', include_context: true } },
			{ type: 'xcopb/archive-description', settings: { align: 'left' } },
			{ type: 'xcopb/gb-divider', settings: { height: 1, color: '#e2e8f0', margin: 20 } },
			{ type: 'xcopb/archive-posts', settings: { columns: 3, show_image: true, show_meta: true, show_excerpt: true, show_button: true, gap: 24 } },
		],
		defaultZones: {
			main: [ 0, 1, 2, 3 ],
		},
	},
];

/**
 * Legacy structures retained for backward compatibility.
 */
export const LEGACY_STRUCTURES = [
	{
		id: 'sp-centered',
		name: __( 'Centered', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'hero', label: __( 'Hero Area', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
			{ id: 'details', label: __( 'Details Area', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { hero: [], details: [] },
	},
	{
		id: 'sp-split',
		name: __( 'Split Layout', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'left', label: __( 'Left', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
			{ id: 'right', label: __( 'Right', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { left: [], right: [] },
	},
	{
		id: 'ar-standard',
		name: __( 'Standard Grid', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'content', label: __( 'Content', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { content: [] },
	},
	{
		id: 'ar-described',
		name: __( 'Described', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'content', label: __( 'Content', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { content: [] },
	},
	{
		id: 'cd-single',
		name: __( 'Card', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'card', label: __( 'Card', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { card: [] },
	},
	{
		id: 'ct-standard',
		name: __( 'Cart', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'main', label: __( 'Cart Content', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { main: [] },
	},
	{
		id: 'ck-standard',
		name: __( 'Checkout', 'xcodesol-page-builder' ),
		zones: [
			{ id: 'main', label: __( 'Checkout Content', 'xcodesol-page-builder' ), allowedBlocks: ALL_ALLOWED_BLOCKS },
		],
		defaultLayout: [],
		defaultZones: { main: [] },
	},
];

export const ALL_STRUCTURES = [
	...PAGE_STRUCTURES,
	...SINGLE_POST_STRUCTURES,
	...ARCHIVE_STRUCTURES,
	...SECTION_STRUCTURES,
	...HEADER_STRUCTURES,
	...FOOTER_STRUCTURES,
	...LEGACY_STRUCTURES,
];

// Compatibility exports
export const SINGLE_PRODUCT_STRUCTURES = LEGACY_STRUCTURES;
export const CARD_STRUCTURES = LEGACY_STRUCTURES;
export const CART_STRUCTURES = LEGACY_STRUCTURES;
export const CHECKOUT_STRUCTURES = LEGACY_STRUCTURES;

/**
 * Get default structure ID for a view type.
 *
 * @param {string} viewType View type slug.
 * @return {string} Structure id.
 */
export function getDefaultStructureId( viewType ) {
	if ( 'single_post' === viewType || 'single' === viewType ) {
		return 'post-standard';
	}
	if ( 'archive' === viewType ) {
		return 'archive-grid';
	}
	if ( 'header' === viewType ) {
		return 'header-standard';
	}
	if ( 'footer' === viewType ) {
		return 'footer-multi';
	}
	if ( 'section' === viewType ) {
		return 'section-single';
	}
	if ( 'landing' === viewType ) {
		return 'page-landing';
	}
	if ( 'single_product' === viewType ) {
		return 'sp-centered';
	}
	if ( 'product_card' === viewType ) {
		return 'cd-single';
	}
	if ( 'cart' === viewType ) {
		return 'ct-standard';
	}
	if ( 'checkout' === viewType ) {
		return 'ck-standard';
	}
	return 'page-blank';
}

/**
 * Get structures for a given view type.
 *
 * @param {string} viewType View type slug.
 * @return {Array} Array of structure objects.
 */
export function getStructuresForView( viewType ) {
	if ( 'single_post' === viewType || 'single' === viewType ) {
		return SINGLE_POST_STRUCTURES;
	}
	if ( 'archive' === viewType ) {
		return ARCHIVE_STRUCTURES;
	}
	if ( 'header' === viewType ) {
		return HEADER_STRUCTURES;
	}
	if ( 'footer' === viewType ) {
		return FOOTER_STRUCTURES;
	}
	if ( 'section' === viewType ) {
		return SECTION_STRUCTURES;
	}
	return PAGE_STRUCTURES;
}

/**
 * Check whether a structure belongs to a view.
 *
 * @param {string} structureId Structure ID.
 * @param {string} viewType View type slug.
 * @return {boolean} True if matches or generally allowed.
 */
export function structureBelongsToView( structureId, viewType ) {
	return true;
}

/**
 * Get a structure by its ID.
 *
 * @param {string} structureId Structure ID.
 * @return {Object|null} Structure object or null.
 */
export function getStructureById( structureId ) {
	return ALL_STRUCTURES.find( ( s ) => s.id === structureId ) || ALL_STRUCTURES[ 0 ] || null;
}
