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

import { __ } from '@wordpress/i18n';
import { DYNAMIC_CONTENT_OPTIONS } from '../lib/dynamic-content';

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
		{ id: 'text_source', type: 'select', label: 'Text source', tab: 'content', section: 'content', default: 'static', options: [ { value: 'static', label: __( 'Custom text', 'xcodesol-page-builder' ) }, { value: 'dynamic', label: __( 'WordPress dynamic value', 'xcodesol-page-builder' ) } ] },
		{ id: 'dynamic_source', type: 'select', label: 'Dynamic value', tab: 'content', section: 'content', default: 'post_title', options: DYNAMIC_CONTENT_OPTIONS.filter( ( item ) => [ 'post_title', 'post_excerpt', 'site_title', 'site_tagline', 'archive_title', 'current_date' ].includes( item.value ) ), condition: { text_source: 'dynamic' } },
		{ id: 'text', type: 'text', label: 'Button text', tab: 'content', section: 'content', default: 'Click Here', condition: { text_source: [ 'static', '', undefined ] } },
		{ id: 'icon', type: 'text', label: 'Icon class (optional)', tab: 'content', section: 'content', placeholder: 'dashicons-arrow-right-alt', help: 'Use a WordPress Dashicon class. The icon appears before the text.' },
		{ id: 'link', type: 'text', label: 'Link URL', tab: 'content', section: 'link', default: '#', placeholder: 'https://example.com', condition: { link_source: [ 'static', '', undefined ] } },
		{ id: 'link_source', type: 'select', label: 'Link source', tab: 'content', section: 'link', default: 'static', options: [ { value: 'static', label: __( 'Custom URL', 'xcodesol-page-builder' ) }, { value: 'dynamic', label: __( 'WordPress dynamic URL', 'xcodesol-page-builder' ) } ] },
		{ id: 'dynamic_url_source', type: 'select', label: 'Dynamic URL', tab: 'content', section: 'link', default: 'post_url', options: [ { value: 'post_url', label: __( 'Current post URL', 'xcodesol-page-builder' ) }, { value: 'site_url', label: __( 'Site URL', 'xcodesol-page-builder' ) } ], condition: { link_source: 'dynamic' } },
		{ id: 'target_blank', type: 'toggle', label: 'Open in a new tab', tab: 'content', section: 'link', default: false },
		{ id: 'link_nofollow', type: 'toggle', label: 'Mark as nofollow', tab: 'content', section: 'link', default: false },
		{ id: 'size', type: 'choose', label: 'Button size', tab: 'style', section: 'typography', default: 'md', options: [ { value: 'xs', label: 'XS' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' } ] },
		{ id: 'font_family', type: 'select', label: 'Font', tab: 'style', section: 'typography', default: '', options: [ { value: '', label: 'Theme default' }, ...[ 'Arial', 'Georgia', 'Inter', 'Roboto', 'system-ui' ].map( ( value ) => ( { value, label: value } ) ) ] },
		{ id: 'font_size', type: 'number', label: 'Text size (px)', tab: 'style', section: 'typography', min: 8, max: 80, default: 15 },
		{ id: 'font_weight', type: 'select', label: 'Weight', tab: 'style', section: 'typography', default: '600', options: [ '400', '500', '600', '700', '800' ].map( ( value ) => ( { value, label: value } ) ) },
		{ id: 'font_style', type: 'select', label: 'Font style', tab: 'style', section: 'typography', default: 'normal', options: [ 'normal', 'italic', 'oblique' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'line_height', type: 'number', label: 'Line height', tab: 'style', section: 'typography', min: 0.8, max: 3, step: 0.05, default: 1.2 },
		{ id: 'letter_spacing', type: 'number', label: 'Letter spacing (px)', tab: 'style', section: 'typography', min: -5, max: 20, step: 0.1, default: 0 },
		{ id: 'text_shadow', type: 'text', label: 'Text shadow', tab: 'style', section: 'typography', placeholder: '0 1px 3px rgba(0,0,0,.2)' },
		{ id: 'text_transform', type: 'select', label: 'Letter case', tab: 'style', section: 'typography', default: 'none', options: [ 'none', 'uppercase', 'lowercase', 'capitalize' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'bg_color', type: 'color', label: 'Background color', tab: 'style', section: 'appearance', state: true, supportsHover: true, supportsFocus: true, default: '#2563eb' },
		{ id: 'background_type', type: 'select', label: 'Background type', tab: 'style', section: 'appearance', default: 'classic', options: [ { value: 'classic', label: 'Classic' }, { value: 'gradient', label: 'Gradient' } ] },
		{ id: 'gradient_start', type: 'color', label: 'Gradient start', tab: 'style', section: 'appearance', default: '#2563eb', condition: { background_type: 'gradient' } },
		{ id: 'gradient_end', type: 'color', label: 'Gradient end', tab: 'style', section: 'appearance', default: '#4f46e5', condition: { background_type: 'gradient' } },
		{ id: 'gradient_angle', type: 'number', label: 'Gradient angle (deg)', tab: 'style', section: 'appearance', min: 0, max: 360, default: 90, condition: { background_type: 'gradient' } },
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
		{ id: 'full_width', type: 'toggle', label: 'Full width button', tab: 'style', section: 'spacing', default: false },
		{ id: 'min_width', type: 'number', label: 'Minimum width (px)', tab: 'style', section: 'spacing', min: 0, max: 1200, default: 0 },
		{ id: 'icon_position', type: 'select', label: 'Icon position', tab: 'style', section: 'spacing', default: 'before', options: [ { value: 'before', label: 'Before text' }, { value: 'after', label: 'After text' } ] },
		{ id: 'icon_gap', type: 'number', label: 'Icon spacing (px)', tab: 'style', section: 'spacing', min: 0, max: 60, default: 8 },
		{ id: 'transition_duration', type: 'number', label: 'Transition duration (ms)', tab: 'advanced', section: 'layout', min: 0, max: 2000, default: 200 },
		{ id: 'hover_lift', type: 'number', label: 'Lift on hover (px)', tab: 'advanced', section: 'layout', min: 0, max: 30, default: 0 },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }, units: [ 'px', 'rem', '%' ], allowNegative: true },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes', placeholder: 'selector { color: inherit; }' },
	],
};
