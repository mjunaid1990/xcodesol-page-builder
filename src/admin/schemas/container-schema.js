/**
 * Elementor-grade Container Widget Schema for Xcodesol Page Builder.
 * Covers Content (Layout, Flex, Grid, Child, Additional) and Style (Background, Border, Shadow, Effects, Dividers, Typography).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';

export const manifest = {
	widget: 'container',
	type: 'xcopb/gb-container',
	aliases: [ 'xcosb/gb-container' ],
	controls: [
		'layout-picker',
		'flex-options',
		'column-ratio',
		'grid-template',
		'gap',
		'alignment-grid',
		'segmented',
		'choose',
		'preset-chips',
		'number-unit',
		'number',
		'slider',
		'select',
		'toggle',
		'color',
		'gradient',
		'media',
		'spacing-box',
		'dimensions',
		'border',
		'box-shadow',
		'box_shadow',
		'typography',
		'transform',
		'visibility',
		'url-link',
		'animation',
		'code',
		'repeater',
		'text',
		'textarea',
	],
};

export const CONTAINER_SCHEMA = {
	type: 'xcopb/gb-container',
	version: 2,
	manifest,
	sections: [
		// ---------------- CONTENT TAB ----------------
		{ id: 'layout', tab: 'content', title: __( 'Layout', 'xcodesol-page-builder' ), defaultOpen: true },
		{ id: 'flex_options', tab: 'content', title: __( 'List / Row Settings', 'xcodesol-page-builder' ), condition: { layout_mode: [ 'list', 'row' ] }, defaultOpen: true },
		{ id: 'columns_options', tab: 'content', title: __( 'Columns Settings', 'xcodesol-page-builder' ), condition: { layout_mode: 'columns' }, defaultOpen: true },
		{ id: 'grid_options', tab: 'content', title: __( 'Grid Settings', 'xcodesol-page-builder' ), condition: { layout_mode: 'grid' }, defaultOpen: true },
		{ id: 'masonry_options', tab: 'content', title: __( 'Masonry Settings', 'xcodesol-page-builder' ), condition: { layout_mode: 'masonry' }, defaultOpen: true },
		{ id: 'scroll_row_options', tab: 'content', title: __( 'Scroll Row Settings', 'xcodesol-page-builder' ), condition: { layout_mode: 'scroll-row' }, defaultOpen: true },
		{ id: 'child_behavior', tab: 'content', title: __( 'Child Behavior', 'xcodesol-page-builder' ) },
		{ id: 'additional_content', tab: 'content', title: __( 'Additional Options', 'xcodesol-page-builder' ) },

		// ---------------- STYLE TAB ----------------
		{ id: 'background', tab: 'style', title: __( 'Background', 'xcodesol-page-builder' ), stateful: true, defaultOpen: true },
		{ id: 'border', tab: 'style', title: __( 'Border & Corners', 'xcodesol-page-builder' ), stateful: true },
		{ id: 'box_shadow', tab: 'style', title: __( 'Box Shadow', 'xcodesol-page-builder' ), stateful: true },
		{ id: 'effects', tab: 'style', title: __( 'Effects & Filters', 'xcodesol-page-builder' ) },
		{ id: 'shape_dividers', tab: 'style', title: __( 'Shape Dividers', 'xcodesol-page-builder' ) },
		{ id: 'typography', tab: 'style', title: __( 'Typography Inheritance', 'xcodesol-page-builder' ) },

		// ---------------- ADVANCED TAB ----------------
		{ id: 'spacing', tab: 'advanced', title: __( 'Spacing (Padding & Margin)', 'xcodesol-page-builder' ), defaultOpen: true },
		{ id: 'position', tab: 'advanced', title: __( 'Position', 'xcodesol-page-builder' ) },
		{ id: 'transform', tab: 'advanced', title: __( 'Transform', 'xcodesol-page-builder' ), stateful: true },
		{ id: 'motion', tab: 'advanced', title: __( 'Motion Effects', 'xcodesol-page-builder' ) },
		{ id: 'responsive_visibility', tab: 'advanced', title: __( 'Responsive Visibility', 'xcodesol-page-builder' ) },
		{ id: 'custom_code', tab: 'advanced', title: __( 'Attributes & Custom CSS', 'xcodesol-page-builder' ) },
	],
	controls: [
		// =========================================================================
		// 1. CONTENT > LAYOUT
		// =========================================================================
		{
			id: 'layout_mode',
			type: 'layout-picker',
			label: __( 'Container Layout', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: 'columns',
		},
		{
			id: 'content_width',
			type: 'choose',
			label: __( 'Content Width', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: 'boxed',
			options: [
				{ value: 'boxed', label: __( 'Boxed', 'xcodesol-page-builder' ), icon: 'IconBoxed' },
				{ value: 'full', label: __( 'Full Width', 'xcodesol-page-builder' ), icon: 'IconFullWidth' },
			],
		},
		{
			id: 'max_width',
			type: 'number',
			label: __( 'Max Width', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: { value: 1200, unit: 'px' },
			units: [ 'px', '%', 'vw', 'ch' ],
			responsive: true,
			condition: { content_width: 'boxed' },
			selectors: {
				'{{WRAPPER}}': 'max-width: {{VALUE}}{{UNIT}}; margin-inline: auto;',
			},
		},
		{
			id: 'width',
			type: 'number',
			label: __( 'Width', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: { value: 100, unit: '%' },
			units: [ '%', 'px', 'vw' ],
			responsive: true,
			selectors: {
				'{{WRAPPER}}': 'width: {{VALUE}}{{UNIT}};',
			},
		},
		{
			id: 'min_height',
			type: 'number',
			label: __( 'Min Height', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: { value: 0, unit: 'px' },
			units: [ 'px', 'vh', 'dvh', '%' ],
			responsive: true,
			selectors: {
				'{{WRAPPER}}': 'min-height: {{VALUE}}{{UNIT}};',
			},
		},
		{
			id: 'aspect_ratio',
			type: 'select',
			label: __( 'Aspect Ratio', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: 'auto',
			options: [
				{ value: 'auto', label: __( 'Default (Auto)', 'xcodesol-page-builder' ) },
				{ value: '1 / 1', label: '1:1 Square' },
				{ value: '4 / 3', label: '4:3 Standard' },
				{ value: '16 / 9', label: '16:9 Widescreen' },
				{ value: '21 / 9', label: '21:9 Ultrawide' },
			],
			selectors: {
				'{{WRAPPER}}': 'aspect-ratio: {{VALUE}};',
			},
		},
		{
			id: 'html_tag',
			type: 'select',
			label: __( 'HTML Tag', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: 'div',
			options: [
				{ value: 'div', label: 'div' },
				{ value: 'section', label: 'section' },
				{ value: 'header', label: 'header' },
				{ value: 'footer', label: 'footer' },
				{ value: 'main', label: 'main' },
				{ value: 'article', label: 'article' },
				{ value: 'aside', label: 'aside' },
				{ value: 'nav', label: 'nav' },
				{ value: 'a', label: 'a (Link)' },
			],
		},
		{
			id: 'overflow',
			type: 'select',
			label: __( 'Overflow', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'layout',
			default: 'visible',
			options: [
				{ value: 'visible', label: __( 'Visible (Default)', 'xcodesol-page-builder' ) },
				{ value: 'hidden', label: __( 'Hidden', 'xcodesol-page-builder' ) },
				{ value: 'auto', label: __( 'Auto', 'xcodesol-page-builder' ) },
				{ value: 'clip', label: __( 'Clip', 'xcodesol-page-builder' ) },
			],
			selectors: {
				'{{WRAPPER}}': 'overflow: {{VALUE}};',
			},
		},

		// =========================================================================
		// 2. CONTENT > LIST / ROW (FLEXBOX) OPTIONS
		// =========================================================================
		{
			id: 'flex_direction',
			type: 'choose',
			label: __( 'Direction', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: 'column',
			responsive: true,
			options: [
				{ value: 'column', label: __( 'Vertical (List)', 'xcodesol-page-builder' ), icon: 'IconArrowDown' },
				{ value: 'row', label: __( 'Horizontal (Row)', 'xcodesol-page-builder' ), icon: 'IconArrowRight' },
				{ value: 'column-reverse', label: __( 'Col Reverse', 'xcodesol-page-builder' ), icon: 'IconArrowUp' },
				{ value: 'row-reverse', label: __( 'Row Reverse', 'xcodesol-page-builder' ), icon: 'IconArrowLeft' },
			],
			selectors: {
				'{{WRAPPER}}': 'flex-direction: {{VALUE}};',
			},
		},
		{
			id: 'flex_wrap',
			type: 'choose',
			label: __( 'Wrap', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: 'nowrap',
			responsive: true,
			options: [
				{ value: 'nowrap', label: __( 'No Wrap', 'xcodesol-page-builder' ), icon: 'IconNoWrap' },
				{ value: 'wrap', label: __( 'Wrap', 'xcodesol-page-builder' ), icon: 'IconWrap' },
				{ value: 'wrap-reverse', label: __( 'Reverse', 'xcodesol-page-builder' ), icon: 'IconWrapReverse' },
			],
			selectors: {
				'{{WRAPPER}}': 'flex-wrap: {{VALUE}};',
			},
		},
		{
			id: 'gap',
			type: 'gap',
			label: __( 'Gaps (Row / Column)', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: { row: 20, col: 20, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'em', 'rem' ],
			responsive: true,
			selectors: {
				'{{WRAPPER}}': 'row-gap: {{ROW}}{{UNIT}}; column-gap: {{COL}}{{UNIT}};',
			},
		},
		{
			id: 'justify_content',
			type: 'choose',
			label: __( 'Justify Content', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: 'flex-start',
			responsive: true,
			options: [
				{ value: 'flex-start', label: __( 'Start', 'xcodesol-page-builder' ), icon: 'IconJustifyStart' },
				{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ), icon: 'IconJustifyCenter' },
				{ value: 'flex-end', label: __( 'End', 'xcodesol-page-builder' ), icon: 'IconJustifyEnd' },
				{ value: 'space-between', label: __( 'Between', 'xcodesol-page-builder' ), icon: 'IconJustifyBetween' },
				{ value: 'space-around', label: __( 'Around', 'xcodesol-page-builder' ), icon: 'IconJustifyAround' },
				{ value: 'space-evenly', label: __( 'Evenly', 'xcodesol-page-builder' ), icon: 'IconJustifyEvenly' },
			],
			selectors: {
				'{{WRAPPER}}': 'justify-content: {{VALUE}};',
			},
		},
		{
			id: 'align_items',
			type: 'choose',
			label: __( 'Align Items', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: 'stretch',
			responsive: true,
			options: [
				{ value: 'flex-start', label: __( 'Start', 'xcodesol-page-builder' ), icon: 'IconAlignStart' },
				{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ), icon: 'IconAlignCenter' },
				{ value: 'flex-end', label: __( 'End', 'xcodesol-page-builder' ), icon: 'IconAlignEnd' },
				{ value: 'stretch', label: __( 'Stretch', 'xcodesol-page-builder' ), icon: 'IconAlignStretch' },
			],
			selectors: {
				'{{WRAPPER}}': 'align-items: {{VALUE}};',
			},
		},
		{
			id: 'align_content',
			type: 'choose',
			label: __( 'Align Content', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: 'stretch',
			responsive: true,
			options: [
				{ value: 'flex-start', label: __( 'Start', 'xcodesol-page-builder' ), icon: 'IconAlignStart' },
				{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ), icon: 'IconAlignCenter' },
				{ value: 'flex-end', label: __( 'End', 'xcodesol-page-builder' ), icon: 'IconAlignEnd' },
				{ value: 'space-between', label: __( 'Between', 'xcodesol-page-builder' ), icon: 'IconJustifyBetween' },
				{ value: 'space-around', label: __( 'Around', 'xcodesol-page-builder' ), icon: 'IconJustifyAround' },
				{ value: 'stretch', label: __( 'Stretch', 'xcodesol-page-builder' ), icon: 'IconAlignStretch' },
			],
		},
		{
			id: 'equal_height',
			type: 'toggle',
			label: __( 'Equal Height Items', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: false,
		},
		{
			id: 'items_divider',
			type: 'select',
			label: __( 'Dividers Between Items', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'solid', label: __( 'Solid', 'xcodesol-page-builder' ) },
				{ value: 'dashed', label: __( 'Dashed', 'xcodesol-page-builder' ) },
				{ value: 'dotted', label: __( 'Dotted', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'items_divider_width',
			type: 'number',
			label: __( 'Divider Width', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: { value: 1, unit: 'px' },
			units: [ 'px' ],
		},
		{
			id: 'items_divider_color',
			type: 'color',
			label: __( 'Divider Color', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'flex_options',
			default: '#e2e8f0',
		},

		// =========================================================================
		// 3. CONTENT > COLUMNS OPTIONS
		// =========================================================================
		{
			id: 'columns',
			type: 'slider',
			label: __( 'Column Count', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: 2,
			min: 1,
			max: 6,
			step: 1,
			responsive: true,
		},
		{
			id: 'column_widths',
			type: 'column-ratio',
			label: __( 'Column Ratios & Presets', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: [ 6, 6 ],
		},
		{
			id: 'column_gap',
			type: 'gap',
			label: __( 'Gutter & Row Gap', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: { row: 20, col: 20, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'rem' ],
			responsive: true,
		},
		{
			id: 'column_valign',
			type: 'choose',
			label: __( 'Vertical Alignment', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: 'stretch',
			options: [
				{ value: 'start', label: __( 'Top', 'xcodesol-page-builder' ), icon: 'IconAlignStart' },
				{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ), icon: 'IconAlignCenter' },
				{ value: 'end', label: __( 'Bottom', 'xcodesol-page-builder' ), icon: 'IconAlignEnd' },
				{ value: 'stretch', label: __( 'Stretch', 'xcodesol-page-builder' ), icon: 'IconAlignStretch' },
			],
		},
		{
			id: 'column_reverse_mobile',
			type: 'toggle',
			label: __( 'Reverse Order on Mobile', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: false,
		},
		{
			id: 'stacking_breakpoint',
			type: 'select',
			label: __( 'Stacking Breakpoint', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: 'mobile',
			options: [
				{ value: 'tablet', label: __( 'Tablet (≤ 768px)', 'xcodesol-page-builder' ) },
				{ value: 'mobile', label: __( 'Mobile (≤ 480px)', 'xcodesol-page-builder' ) },
				{ value: 'none', label: __( 'Never Stack', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'column_divider',
			type: 'select',
			label: __( 'Column Divider Line', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'solid', label: __( 'Solid', 'xcodesol-page-builder' ) },
				{ value: 'dashed', label: __( 'Dashed', 'xcodesol-page-builder' ) },
				{ value: 'dotted', label: __( 'Dotted', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'sticky_column',
			type: 'toggle',
			label: __( 'Sticky Columns Support', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'columns_options',
			default: false,
		},

		// =========================================================================
		// 4. CONTENT > GRID OPTIONS
		// =========================================================================
		{
			id: 'grid_template',
			type: 'grid-template',
			label: __( 'Grid Track Template', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: 'repeat(3, minmax(0, 1fr))',
		},
		{
			id: 'grid_gap',
			type: 'gap',
			label: __( 'Grid Gap (Row / Col)', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: { row: 20, col: 20, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'em', 'rem' ],
			responsive: true,
		},
		{
			id: 'grid_auto_flow',
			type: 'select',
			label: __( 'Auto Flow', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: 'row',
			options: [
				{ value: 'row', label: 'Row' },
				{ value: 'column', label: 'Column' },
				{ value: 'dense', label: 'Dense' },
				{ value: 'row dense', label: 'Row Dense' },
				{ value: 'column dense', label: 'Column Dense' },
			],
		},
		{
			id: 'grid_auto_rows',
			type: 'select',
			label: __( 'Auto Rows', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: 'auto',
			options: [
				{ value: 'auto', label: 'Auto' },
				{ value: 'min-content', label: 'Min Content' },
				{ value: 'max-content', label: 'Max Content' },
				{ value: '1fr', label: '1fr' },
				{ value: 'minmax(120px, auto)', label: 'minmax(120px, auto)' },
			],
		},
		{
			id: 'grid_justify_items',
			type: 'choose',
			label: __( 'Justify Items', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: 'stretch',
			options: [
				{ value: 'start', label: 'Start' },
				{ value: 'center', label: 'Center' },
				{ value: 'end', label: 'End' },
				{ value: 'stretch', label: 'Stretch' },
			],
		},
		{
			id: 'grid_align_items',
			type: 'choose',
			label: __( 'Align Items', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: 'stretch',
			options: [
				{ value: 'start', label: 'Start' },
				{ value: 'center', label: 'Center' },
				{ value: 'end', label: 'End' },
				{ value: 'stretch', label: 'Stretch' },
			],
		},
		{
			id: 'grid_subgrid',
			type: 'toggle',
			label: __( 'Subgrid Support', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			default: false,
		},
		{
			id: 'grid_named_areas',
			type: 'code',
			label: __( 'Named Grid Areas (grid-template-areas)', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'grid_options',
			placeholder: '"header header"\n"sidebar main"\n"footer footer"',
		},

		// =========================================================================
		// 5. CONTENT > MASONRY OPTIONS
		// =========================================================================
		{
			id: 'masonry_columns',
			type: 'slider',
			label: __( 'Masonry Columns', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'masonry_options',
			default: 3,
			min: 1,
			max: 6,
			step: 1,
			responsive: true,
		},
		{
			id: 'masonry_gap',
			type: 'number',
			label: __( 'Column Gap', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'masonry_options',
			default: { value: 20, unit: 'px' },
			units: [ 'px', 'rem', '%' ],
			responsive: true,
		},
		{
			id: 'masonry_break_inside',
			type: 'select',
			label: __( 'Default Break Inside', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'masonry_options',
			default: 'avoid',
			options: [
				{ value: 'avoid', label: __( 'Avoid Breaking Items (Recommended)', 'xcodesol-page-builder' ) },
				{ value: 'auto', label: __( 'Auto', 'xcodesol-page-builder' ) },
			],
		},

		// =========================================================================
		// 6. CONTENT > SCROLL ROW OPTIONS
		// =========================================================================
		{
			id: 'scroll_item_width',
			type: 'number',
			label: __( 'Item Width', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'scroll_row_options',
			default: { value: 280, unit: 'px' },
			units: [ 'px', '%', 'vw' ],
			responsive: true,
		},
		{
			id: 'scroll_snap_type',
			type: 'select',
			label: __( 'Snap Type', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'scroll_row_options',
			default: 'mandatory',
			options: [
				{ value: 'mandatory', label: __( 'Mandatory Snap', 'xcodesol-page-builder' ) },
				{ value: 'proximity', label: __( 'Proximity Snap', 'xcodesol-page-builder' ) },
				{ value: 'none', label: __( 'Free Scroll (No Snap)', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'scroll_snap_align',
			type: 'select',
			label: __( 'Snap Alignment', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'scroll_row_options',
			default: 'start',
			options: [
				{ value: 'start', label: __( 'Start', 'xcodesol-page-builder' ) },
				{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ) },
				{ value: 'end', label: __( 'End', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'scroll_hide_scrollbar',
			type: 'toggle',
			label: __( 'Hide Scrollbar', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'scroll_row_options',
			default: true,
		},
		{
			id: 'scroll_gap',
			type: 'number',
			label: __( 'Item Gap', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'scroll_row_options',
			default: { value: 20, unit: 'px' },
			units: [ 'px', 'rem' ],
			responsive: true,
		},
		{
			id: 'scroll_padding_peek',
			type: 'number',
			label: __( 'Peek Padding (Sides)', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'scroll_row_options',
			default: { value: 24, unit: 'px' },
			units: [ 'px', '%' ],
		},

		// =========================================================================
		// 7. CONTENT > CHILD BEHAVIOR
		// =========================================================================
		{
			id: 'align_self',
			type: 'select',
			label: __( 'Align Self', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 'auto',
			options: [
				{ value: 'auto', label: 'Auto' },
				{ value: 'flex-start', label: 'Start' },
				{ value: 'center', label: 'Center' },
				{ value: 'flex-end', label: 'End' },
				{ value: 'stretch', label: 'Stretch' },
			],
			selectors: {
				'{{WRAPPER}}': 'align-self: {{VALUE}};',
			},
		},
		{
			id: 'child_order',
			type: 'number',
			label: __( 'Order', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 0,
			responsive: true,
		},
		{
			id: 'flex_grow',
			type: 'number',
			label: __( 'Flex Grow', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 0,
			min: 0,
			max: 10,
			step: 1,
			selectors: {
				'{{WRAPPER}}': 'flex-grow: {{VALUE}};',
			},
		},
		{
			id: 'flex_shrink',
			type: 'number',
			label: __( 'Flex Shrink', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 1,
			min: 0,
			max: 10,
			step: 1,
			selectors: {
				'{{WRAPPER}}': 'flex-shrink: {{VALUE}};',
			},
		},
		{
			id: 'grid_column_span',
			type: 'number',
			label: __( 'Grid Column Span', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 1,
			min: 1,
			max: 12,
		},
		{
			id: 'grid_row_span',
			type: 'number',
			label: __( 'Grid Row Span', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 1,
			min: 1,
			max: 12,
		},
		{
			id: 'grid_area',
			type: 'text',
			label: __( 'Grid Area Name', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			placeholder: 'e.g. sidebar',
		},
		{
			id: 'masonry_item_break',
			type: 'select',
			label: __( 'Masonry Break Inside', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: 'avoid',
			options: [
				{ value: 'avoid', label: 'Avoid' },
				{ value: 'auto', label: 'Auto' },
			],
		},
		{
			id: 'masonry_item_span',
			type: 'select',
			label: __( 'Masonry Column Span', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'child_behavior',
			default: '1',
			options: [
				{ value: '1', label: '1 Column' },
				{ value: 'all', label: 'Span All Columns' },
			],
		},

		// =========================================================================
		// 5. CONTENT > ADDITIONAL OPTIONS
		// =========================================================================
		{
			id: 'container_queries',
			type: 'toggle',
			label: __( 'Container Queries', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'additional_content',
			default: false,
			help: __( 'Enables container-type: inline-size for children query units (cqw/cqh).', 'xcodesol-page-builder' ),
			selectors: {
				'{{WRAPPER}}': 'container-type: inline-size;',
			},
		},
		{
			id: 'link_url',
			type: 'text',
			label: __( 'Container Link URL', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'additional_content',
			placeholder: 'https://example.com',
		},
		{
			id: 'link_target_blank',
			type: 'toggle',
			label: __( 'Open in new tab', 'xcodesol-page-builder' ),
			tab: 'content',
			section: 'additional_content',
			default: false,
			condition: { link_url: ( val ) => Boolean( val ) },
		},

		// =========================================================================
		// 6. STYLE > BACKGROUND
		// =========================================================================
		{
			id: 'bg_type',
			type: 'choose',
			label: __( 'Background Type', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'background',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ), icon: 'IconBan' },
				{ value: 'color', label: __( 'Classic', 'xcodesol-page-builder' ), icon: 'IconBrush' },
				{ value: 'gradient', label: __( 'Gradient', 'xcodesol-page-builder' ), icon: 'IconGradient' },
				{ value: 'image', label: __( 'Image', 'xcodesol-page-builder' ), icon: 'IconImage' },
				{ value: 'video', label: __( 'Video', 'xcodesol-page-builder' ), icon: 'IconVideo' },
			],
		},
		{
			id: 'bg_color',
			type: 'color',
			label: __( 'Background Color', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'background',
			state: true,
			condition: { bg_type: [ 'color', 'image' ] },
			selectors: {
				'{{WRAPPER}}': 'background-color: {{VALUE}};',
			},
		},
		{
			id: 'gradient',
			type: 'gradient',
			label: __( 'Gradient Colors', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'background',
			condition: { bg_type: 'gradient' },
		},
		{
			id: 'bg_image',
			type: 'media',
			label: __( 'Background Image', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'background',
			condition: { bg_type: 'image' },
			selectors: {
				'{{WRAPPER}}': 'background-image: url("{{VALUE}}"); background-size: cover; background-position: center;',
			},
		},
		{
			id: 'bg_video_url',
			type: 'text',
			label: __( 'Video URL (MP4/YouTube)', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'background',
			condition: { bg_type: 'video' },
			placeholder: 'https://example.com/video.mp4',
		},
		{
			id: 'backdrop_filter_blur',
			type: 'slider',
			label: __( 'Backdrop Glass Blur', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'background',
			default: 0,
			min: 0,
			max: 40,
			step: 1,
			unit: 'px',
			selectors: {
				'{{WRAPPER}}': 'backdrop-filter: blur({{VALUE}}px); -webkit-backdrop-filter: blur({{VALUE}}px);',
			},
		},

		// =========================================================================
		// 7. STYLE > BORDER & CORNERS
		// =========================================================================
		{
			id: 'border_style',
			type: 'select',
			label: __( 'Border Type', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'border',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'solid', label: __( 'Solid', 'xcodesol-page-builder' ) },
				{ value: 'dashed', label: __( 'Dashed', 'xcodesol-page-builder' ) },
				{ value: 'dotted', label: __( 'Dotted', 'xcodesol-page-builder' ) },
				{ value: 'double', label: __( 'Double', 'xcodesol-page-builder' ) },
			],
			selectors: {
				'{{WRAPPER}}': 'border-style: {{VALUE}};',
			},
		},
		{
			id: 'border_width',
			type: 'dimensions',
			label: __( 'Border Width', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'border',
			default: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px', isLinked: true },
			units: [ 'px' ],
			condition: { border_style: [ 'solid', 'dashed', 'dotted', 'double' ] },
			selectors: {
				'{{WRAPPER}}': 'border-width: {{TOP}}px {{RIGHT}}px {{BOTTOM}}px {{LEFT}}px;',
			},
		},
		{
			id: 'border_color',
			type: 'color',
			label: __( 'Border Color', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'border',
			state: true,
			condition: { border_style: [ 'solid', 'dashed', 'dotted', 'double' ] },
			selectors: {
				'{{WRAPPER}}': 'border-color: {{VALUE}};',
			},
		},
		{
			id: 'border_radius',
			type: 'dimensions',
			label: __( 'Border Radius (Corners)', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'border',
			default: { top: 8, right: 8, bottom: 8, left: 8, unit: 'px', isLinked: true },
			units: [ 'px', '%' ],
			selectors: {
				'{{WRAPPER}}': 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
			},
		},

		// =========================================================================
		// 8. STYLE > BOX SHADOW
		// =========================================================================
		{
			id: 'box_shadow',
			type: 'box_shadow',
			label: __( 'Box Shadows', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'box_shadow',
			state: true,
		},

		// =========================================================================
		// 9. STYLE > EFFECTS & FILTERS
		// =========================================================================
		{
			id: 'opacity',
			type: 'slider',
			label: __( 'Opacity', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'effects',
			default: 1,
			min: 0,
			max: 1,
			step: 0.05,
			selectors: {
				'{{WRAPPER}}': 'opacity: {{VALUE}};',
			},
		},
		{
			id: 'filter_blur',
			type: 'slider',
			label: __( 'Blur Filter', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'effects',
			default: 0,
			min: 0,
			max: 20,
			step: 1,
			unit: 'px',
			selectors: {
				'{{WRAPPER}}': 'filter: blur({{VALUE}}px);',
			},
		},

		// =========================================================================
		// 10. STYLE > SHAPE DIVIDERS
		// =========================================================================
		{
			id: 'shape_divider_top',
			type: 'select',
			label: __( 'Top Divider Shape', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'shape_dividers',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'waves', label: __( 'Waves', 'xcodesol-page-builder' ) },
				{ value: 'curve', label: __( 'Curve', 'xcodesol-page-builder' ) },
				{ value: 'tilt', label: __( 'Tilt', 'xcodesol-page-builder' ) },
				{ value: 'triangle', label: __( 'Triangle', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'shape_divider_bottom',
			type: 'select',
			label: __( 'Bottom Divider Shape', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'shape_dividers',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'waves', label: __( 'Waves', 'xcodesol-page-builder' ) },
				{ value: 'curve', label: __( 'Curve', 'xcodesol-page-builder' ) },
				{ value: 'tilt', label: __( 'Tilt', 'xcodesol-page-builder' ) },
				{ value: 'triangle', label: __( 'Triangle', 'xcodesol-page-builder' ) },
			],
		},

		// =========================================================================
		// 11. STYLE > TYPOGRAPHY INHERITANCE
		// =========================================================================
		{
			id: 'text_color',
			type: 'color',
			label: __( 'Text Color', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'typography',
			selectors: {
				'{{WRAPPER}}': 'color: {{VALUE}};',
			},
		},
		{
			id: 'text_align',
			type: 'choose',
			label: __( 'Default Alignment', 'xcodesol-page-builder' ),
			tab: 'style',
			section: 'typography',
			default: 'left',
			options: [
				{ value: 'left', label: __( 'Left', 'xcodesol-page-builder' ), icon: 'IconAlignLeft' },
				{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ), icon: 'IconAlignCenter' },
				{ value: 'right', label: __( 'Right', 'xcodesol-page-builder' ), icon: 'IconAlignRight' },
				{ value: 'justify', label: __( 'Justify', 'xcodesol-page-builder' ), icon: 'IconAlignJustify' },
			],
			selectors: {
				'{{WRAPPER}}': 'text-align: {{VALUE}};',
			},
		},

		// =========================================================================
		// 12. ADVANCED > SPACING (MARGIN & PADDING)
		// =========================================================================
		{
			id: 'padding',
			type: 'dimensions',
			label: __( 'Padding', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'spacing',
			default: { top: 20, right: 20, bottom: 20, left: 20, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'em', 'rem', 'vw', 'vh' ],
			responsive: true,
			selectors: {
				'{{WRAPPER}}': 'padding-block-start: {{TOP}}{{UNIT}}; padding-inline-end: {{RIGHT}}{{UNIT}}; padding-block-end: {{BOTTOM}}{{UNIT}}; padding-inline-start: {{LEFT}}{{UNIT}};',
			},
		},
		{
			id: 'margin',
			type: 'dimensions',
			label: __( 'Margin', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'spacing',
			default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'em', 'rem', 'vw', 'vh' ],
			allowNegative: true,
			responsive: true,
			selectors: {
				'{{WRAPPER}}': 'margin-block-start: {{TOP}}{{UNIT}}; margin-inline-end: {{RIGHT}}{{UNIT}}; margin-block-end: {{BOTTOM}}{{UNIT}}; margin-inline-start: {{LEFT}}{{UNIT}};',
			},
		},

		// =========================================================================
		// 13. ADVANCED > POSITION
		// =========================================================================
		{
			id: 'position',
			type: 'select',
			label: __( 'Position', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'position',
			default: 'static',
			options: [
				{ value: 'static', label: __( 'Default (Static)', 'xcodesol-page-builder' ) },
				{ value: 'relative', label: __( 'Relative', 'xcodesol-page-builder' ) },
				{ value: 'absolute', label: __( 'Absolute', 'xcodesol-page-builder' ) },
				{ value: 'fixed', label: __( 'Fixed', 'xcodesol-page-builder' ) },
				{ value: 'sticky', label: __( 'Sticky', 'xcodesol-page-builder' ) },
			],
			selectors: {
				'{{WRAPPER}}': 'position: {{VALUE}};',
			},
		},
		{
			id: 'z_index',
			type: 'number',
			label: __( 'Z-Index', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'position',
			default: 1,
			min: -999,
			max: 99999,
			step: 1,
			selectors: {
				'{{WRAPPER}}': 'z-index: {{VALUE}};',
			},
		},

		// =========================================================================
		// 14. ADVANCED > TRANSFORM
		// =========================================================================
		{
			id: 'rotate',
			type: 'slider',
			label: __( 'Rotate', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'transform',
			default: 0,
			min: -180,
			max: 180,
			step: 1,
			unit: 'deg',
			state: true,
			selectors: {
				'{{WRAPPER}}': 'transform: rotate({{VALUE}}deg);',
			},
		},
		{
			id: 'scale',
			type: 'slider',
			label: __( 'Scale', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'transform',
			default: 1,
			min: 0.2,
			max: 2,
			step: 0.05,
			state: true,
			selectors: {
				'{{WRAPPER}}': 'transform: scale({{VALUE}});',
			},
		},
		{
			id: 'transform_origin',
			type: 'select',
			label: __( 'Transform Origin', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'transform',
			default: 'center center',
			options: [
				{ value: 'center center', label: __( 'Center Center', 'xcodesol-page-builder' ) },
				{ value: 'top left', label: __( 'Top Left', 'xcodesol-page-builder' ) },
				{ value: 'top center', label: __( 'Top Center', 'xcodesol-page-builder' ) },
				{ value: 'top right', label: __( 'Top Right', 'xcodesol-page-builder' ) },
				{ value: 'bottom left', label: __( 'Bottom Left', 'xcodesol-page-builder' ) },
				{ value: 'bottom center', label: __( 'Bottom Center', 'xcodesol-page-builder' ) },
				{ value: 'bottom right', label: __( 'Bottom Right', 'xcodesol-page-builder' ) },
			],
			selectors: {
				'{{WRAPPER}}': 'transform-origin: {{VALUE}};',
			},
		},
		{
			id: 'transition_duration',
			type: 'number',
			label: __( 'Transition Duration (ms)', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'transform',
			default: { value: 300, unit: 'ms' },
			units: [ 'ms' ],
			selectors: {
				'{{WRAPPER}}': 'transition: all {{VALUE}}ms cubic-bezier(0.16, 1, 0.3, 1);',
			},
		},

		// =========================================================================
		// 15. ADVANCED > MOTION EFFECTS
		// =========================================================================
		{
			id: 'animation',
			type: 'select',
			label: __( 'Entrance Animation', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'motion',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'fade-in', label: __( 'Fade In', 'xcodesol-page-builder' ) },
				{ value: 'slide-up', label: __( 'Slide Up', 'xcodesol-page-builder' ) },
				{ value: 'slide-down', label: __( 'Slide Down', 'xcodesol-page-builder' ) },
				{ value: 'zoom-in', label: __( 'Zoom In', 'xcodesol-page-builder' ) },
			],
		},
		{
			id: 'animation_duration',
			type: 'number',
			label: __( 'Animation Duration (ms)', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'motion',
			default: 600,
			min: 100,
			max: 5000,
			step: 50,
			condition: { animation: [ 'fade-in', 'slide-up', 'slide-down', 'zoom-in' ] },
		},
		{
			id: 'animation_delay',
			type: 'number',
			label: __( 'Animation Delay (ms)', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'motion',
			default: 0,
			min: 0,
			max: 3000,
			step: 50,
			condition: { animation: [ 'fade-in', 'slide-up', 'slide-down', 'zoom-in' ] },
		},
		{
			id: 'hover_animation',
			type: 'select',
			label: __( 'Hover Animation Preset', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'motion',
			default: 'none',
			options: [
				{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
				{ value: 'grow', label: __( 'Grow (Scale Up)', 'xcodesol-page-builder' ) },
				{ value: 'lift', label: __( 'Lift (Translate Up + Shadow)', 'xcodesol-page-builder' ) },
				{ value: 'glow', label: __( 'Glow (Accent Shadow)', 'xcodesol-page-builder' ) },
			],
		},

		// =========================================================================
		// 16. ADVANCED > RESPONSIVE VISIBILITY
		// =========================================================================
		{
			id: 'hide_desktop',
			type: 'toggle',
			label: __( 'Hide on Desktop', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'responsive_visibility',
			default: false,
			help: __( 'Hidden on desktop screens (> 1024px)', 'xcodesol-page-builder' ),
		},
		{
			id: 'hide_tablet',
			type: 'toggle',
			label: __( 'Hide on Tablet', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'responsive_visibility',
			default: false,
			help: __( 'Hidden on tablet screens (768px - 1024px)', 'xcodesol-page-builder' ),
		},
		{
			id: 'hide_mobile',
			type: 'toggle',
			label: __( 'Hide on Mobile', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'responsive_visibility',
			default: false,
			help: __( 'Hidden on mobile screens (< 768px)', 'xcodesol-page-builder' ),
		},

		// =========================================================================
		// 17. ADVANCED > ATTRIBUTES & CUSTOM CSS
		// =========================================================================
		{
			id: 'css_id',
			type: 'text',
			label: __( 'CSS ID', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'custom_code',
			placeholder: 'my-container-id',
		},
		{
			id: 'css_class',
			type: 'text',
			label: __( 'CSS Classes', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'custom_code',
			placeholder: 'class-one class-two',
		},
		{
			id: 'custom_css',
			type: 'code',
			label: __( 'Custom CSS', 'xcodesol-page-builder' ),
			tab: 'advanced',
			section: 'custom_code',
			placeholder: 'selector {\n  /* Scoped CSS for this container */\n}',
		},
	],
};

