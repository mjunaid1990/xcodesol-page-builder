/**
 * Button Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Button widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps the
 * button from pulling the grid/column editors down with it, and dev builds
 * warn when a schema body reaches for a control the manifest does not list.
 *
 * The controls use the existing flat settings keys consumed by the anchor
 * renderer and keep old button sizes and URLs intact.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'button',
	type: 'xcopb/gb-button',
	aliases: [ 'xcosb/gb-button' ],
	controls: [
		'color',
		'typography',
		'spacing-box',
		'segmented',
		'url-link',
		'transform',
		'animation',
		'border',
		'box-shadow',
		'dimensions',
		'choose',
		'select',
		'text',
		'toggle',
		'number',
		'slider',
		'visibility',
		'code',
	],
};

export const BUTTON_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'content', tab: 'content', title: 'Button content', defaultOpen: true },
		{ id: 'link', tab: 'content', title: 'Link behavior' },
		{ id: 'appearance', tab: 'style', title: 'Colors', stateful: true, defaultOpen: true },
		{ id: 'typography', tab: 'style', title: 'Text style' },
		{ id: 'border', tab: 'style', title: 'Border & shape' },
		{ id: 'shadow', tab: 'style', title: 'Shadow', stateful: true },
		{ id: 'spacing', tab: 'style', title: 'Spacing' },
		{ id: 'layout', tab: 'advanced', title: 'Size & motion' },
		{ id: 'visibility', tab: 'advanced', title: 'Responsive visibility' },
		{ id: 'attributes', tab: 'advanced', title: 'Attributes & custom CSS' },
	],
	controls: [
		{ id: 'text', type: 'text', label: 'Button text', tab: 'content', section: 'content', default: 'Click Here' },
		{ id: 'icon', type: 'text', label: 'Icon class (optional)', tab: 'content', section: 'content', placeholder: 'dashicons-arrow-right-alt', help: 'Use a WordPress Dashicon class. The icon appears before the text.' },
		{ id: 'link', type: 'text', label: 'Link URL', tab: 'content', section: 'link', default: '#', placeholder: 'https://example.com' },
		{ id: 'target_blank', type: 'toggle', label: 'Open in a new tab', tab: 'content', section: 'link', default: false },
		{ id: 'link_nofollow', type: 'toggle', label: 'Mark as nofollow', tab: 'content', section: 'link', default: false },
		{ id: 'size', type: 'choose', label: 'Button size', tab: 'style', section: 'typography', default: 'md', options: [ { value: 'xs', label: 'XS' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' } ] },
		{ id: 'font_family', type: 'select', label: 'Font', tab: 'style', section: 'typography', default: '', options: [ { value: '', label: 'Theme default' }, ...[ 'Arial', 'Georgia', 'Inter', 'Roboto', 'system-ui' ].map( ( value ) => ( { value, label: value } ) ) ] },
		{ id: 'font_size', type: 'number', label: 'Text size (px)', tab: 'style', section: 'typography', min: 8, max: 80, default: 15 },
		{ id: 'font_weight', type: 'select', label: 'Weight', tab: 'style', section: 'typography', default: '600', options: [ '400', '500', '600', '700', '800' ].map( ( value ) => ( { value, label: value } ) ) },
		{ id: 'letter_spacing', type: 'number', label: 'Letter spacing (px)', tab: 'style', section: 'typography', min: -5, max: 20, step: 0.1, default: 0 },
		{ id: 'text_transform', type: 'select', label: 'Letter case', tab: 'style', section: 'typography', default: 'none', options: [ 'none', 'uppercase', 'lowercase', 'capitalize' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'bg_color', type: 'color', label: 'Background color', tab: 'style', section: 'appearance', state: true, supportsHover: true, supportsFocus: true, default: '#2563eb' },
		{ id: 'text_color', type: 'color', label: 'Text color', tab: 'style', section: 'appearance', state: true, supportsHover: true, supportsFocus: true, default: '#ffffff' },
		{ id: 'hover_bg_color', type: 'color', label: 'Hover background', tab: 'style', section: 'appearance', supportsHover: true },
		{ id: 'hover_text_color', type: 'color', label: 'Hover text', tab: 'style', section: 'appearance', supportsHover: true },
		{ id: 'focus_bg_color', type: 'color', label: 'Keyboard focus background', tab: 'style', section: 'appearance', supportsFocus: true },
		{ id: 'focus_text_color', type: 'color', label: 'Keyboard focus text', tab: 'style', section: 'appearance', supportsFocus: true },
		{ id: 'border_style', type: 'select', label: 'Border style', tab: 'style', section: 'border', default: 'none', options: [ 'none', 'solid', 'dashed', 'dotted' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'border_width', type: 'number', label: 'Border width (px)', tab: 'style', section: 'border', min: 0, max: 20, default: 0 },
		{ id: 'border_color', type: 'color', label: 'Border color', tab: 'style', section: 'border', supportsHover: true, supportsFocus: true, default: '#2563eb' },
		{ id: 'border_radius', type: 'number', label: 'Corner roundness (px)', tab: 'style', section: 'border', min: 0, max: 100, default: 8, supportsHover: true, presets: [ 0, 4, 8, 16, 999 ] },
		{ id: 'box_shadow', type: 'select', label: 'Shadow', tab: 'style', section: 'shadow', default: 'none', supportsHover: true, options: [ { value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' } ] },
		{ id: 'padding_x', type: 'number', label: 'Side padding (px)', tab: 'style', section: 'spacing', min: 0, max: 100, default: 24 },
		{ id: 'padding_y', type: 'number', label: 'Top and bottom padding (px)', tab: 'style', section: 'spacing', min: 0, max: 80, default: 12 },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }, units: [ 'px', 'rem', '%' ], allowNegative: true },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes', placeholder: 'selector { color: inherit; }' },
	],
};
