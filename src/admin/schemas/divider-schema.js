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

import { DYNAMIC_CONTENT_OPTIONS } from '../lib/dynamic-content';

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
		{ id: 'label_source', type: 'select', label: 'Label source', tab: 'content', section: 'decoration', default: 'static', options: [ { value: 'static', label: 'Custom label' }, { value: 'dynamic', label: 'WordPress dynamic value' } ] },
		{ id: 'label_dynamic_source', type: 'select', label: 'Dynamic label', tab: 'content', section: 'decoration', default: 'post_title', options: DYNAMIC_CONTENT_OPTIONS.filter( ( item ) => [ 'post_title', 'post_excerpt', 'site_title', 'site_tagline', 'archive_title', 'current_date' ].includes( item.value ) ), condition: { label_source: 'dynamic' } },
		{ id: 'label', type: 'text', label: 'Middle text', tab: 'content', section: 'decoration', placeholder: 'OR', condition: { label_source: [ 'static', '', undefined ] } },
		{ id: 'color', type: 'color', label: 'Line color', tab: 'style', section: 'appearance', state: true, supportsHover: true, default: '#e6e9f0' },
		{ id: 'gradient_color', type: 'color', label: 'Gradient end color', tab: 'style', section: 'appearance', supportsHover: true, default: '#4f46e5', condition: { style: 'gradient' } },
		{ id: 'gradient_angle', type: 'number', label: 'Gradient angle (deg)', tab: 'style', section: 'appearance', min: 0, max: 360, default: 90, condition: { style: 'gradient' } },
		{ id: 'line_opacity', type: 'slider', label: 'Line opacity', tab: 'style', section: 'appearance', min: 0, max: 100, step: 1, default: 100, unit: '%' },
		{ id: 'line_radius', type: 'number', label: 'Line corner radius (px)', tab: 'style', section: 'appearance', min: 0, max: 100, default: 0 },
		{ id: 'line_shadow', type: 'select', label: 'Line shadow', tab: 'style', section: 'appearance', default: 'none', options: [ { value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' } ] },
		{ id: 'label_color', type: 'color', label: 'Middle text color', tab: 'style', section: 'appearance' },
		{ id: 'label_background', type: 'color', label: 'Middle text background', tab: 'style', section: 'appearance' },
		{ id: 'label_size', type: 'number', label: 'Middle text size (px)', tab: 'style', section: 'appearance', min: 8, max: 48, default: 14 },
		{ id: 'label_font_family', type: 'select', label: 'Label font', tab: 'style', section: 'appearance', default: '', options: [ { value: '', label: 'Theme default' }, ...[ 'Arial', 'Georgia', 'Inter', 'Roboto', 'system-ui' ].map( ( value ) => ( { value, label: value } ) ) ] },
		{ id: 'label_font_weight', type: 'select', label: 'Label weight', tab: 'style', section: 'appearance', default: '400', options: [ '300', '400', '500', '600', '700' ].map( ( value ) => ( { value, label: value } ) ) },
		{ id: 'label_letter_spacing', type: 'number', label: 'Label letter spacing (px)', tab: 'style', section: 'appearance', min: -5, max: 20, step: 0.1, default: 0 },
		{ id: 'label_padding', type: 'number', label: 'Label side padding (px)', tab: 'style', section: 'appearance', min: 0, max: 60, default: 10 },
		{ id: 'margin', type: 'number', label: 'Space above and below (px)', tab: 'style', section: 'spacing', min: 0, max: 300, default: 24 },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes' },
	],
};
