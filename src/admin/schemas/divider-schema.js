/**
 * Divider Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Divider widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps a
 * one-line separator from pulling the typography or media editors down with
 * it, and dev builds warn when a schema body reaches for a control the
 * manifest does not list.
 *
 * The controls map to the line markup emitted by the divider renderer.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'divider',
	type: 'xcopb/gb-divider',
	aliases: [ 'xcosb/gb-divider' ],
	controls: [
		'select',
		'color',
		'number',
		'number-unit',
		'slider',
		'spacing-box',
		'dimensions',
		'visibility',
		'toggle',
		'text',
		'code',
	],
};

export const DIVIDER_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'line', tab: 'content', title: 'Line', defaultOpen: true },
		{ id: 'decoration', tab: 'content', title: 'Optional label' },
		{ id: 'appearance', tab: 'style', title: 'Appearance', stateful: true, defaultOpen: true },
		{ id: 'spacing', tab: 'style', title: 'Spacing' },
		{ id: 'visibility', tab: 'advanced', title: 'Responsive visibility' },
		{ id: 'attributes', tab: 'advanced', title: 'Attributes & custom CSS' },
	],
	controls: [
		{ id: 'style', type: 'select', label: 'Line style', tab: 'content', section: 'line', default: 'solid', options: [ 'solid', 'dashed', 'dotted', 'double', 'gradient' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'height', type: 'number', label: 'Thickness (px)', tab: 'content', section: 'line', min: 1, max: 30, default: 2 },
		{ id: 'width', type: 'number', label: 'Width (%)', tab: 'content', section: 'line', min: 5, max: 100, default: 100 },
		{ id: 'align', type: 'choose', label: 'Alignment', tab: 'content', section: 'line', default: 'center', options: [ { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' } ] },
		{ id: 'label', type: 'text', label: 'Middle text', tab: 'content', section: 'decoration', placeholder: 'OR' },
		{ id: 'color', type: 'color', label: 'Line color', tab: 'style', section: 'appearance', state: true, supportsHover: true, default: '#e6e9f0' },
		{ id: 'gradient_color', type: 'color', label: 'Gradient end color', tab: 'style', section: 'appearance', supportsHover: true, default: '#4f46e5', condition: { style: 'gradient' } },
		{ id: 'label_color', type: 'color', label: 'Middle text color', tab: 'style', section: 'appearance' },
		{ id: 'label_background', type: 'color', label: 'Middle text background', tab: 'style', section: 'appearance' },
		{ id: 'label_size', type: 'number', label: 'Middle text size (px)', tab: 'style', section: 'appearance', min: 8, max: 48, default: 14 },
		{ id: 'margin', type: 'number', label: 'Space above and below (px)', tab: 'style', section: 'spacing', min: 0, max: 300, default: 24 },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes' },
	],
};
