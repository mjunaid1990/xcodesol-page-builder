/**
 * Heading Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Heading widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps a text
 * widget from pulling the grid editor down with it: only the listed types are
 * declared as needed, and dev builds warn when a schema body reaches for a
 * control the manifest does not list.
 *
 * Content and style settings use flat keys that are already supported by the
 * heading renderer, so existing page data remains compatible.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import motionCatalog from '../../../includes/data/motion-presets.json';

export const manifest = {
	widget: 'heading',
	type: 'xcopb/gb-heading',
	aliases: [ 'xcosb/gb-heading' ],
	controls: [
		'typography',
		'color',
		'segmented',
		'choose',
		'number-unit',
		'spacing-box',
		'url-link',
		'animation',
		'select',
		'text',
		'toggle',
		'slider',
		'visibility',
		'code',
	],
};

export const HEADING_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'content', tab: 'content', title: 'Text & Link', defaultOpen: true },
		{ id: 'typography', tab: 'style', title: 'Typography', defaultOpen: true },
		{ id: 'color', tab: 'style', title: 'Color', stateful: true },
		{ id: 'spacing', tab: 'style', title: 'Spacing' },
		{ id: 'advanced', tab: 'advanced', title: 'Layout & Motion' },
		{ id: 'visibility', tab: 'advanced', title: 'Responsive Visibility' },
		{ id: 'attributes', tab: 'advanced', title: 'Attributes & Custom CSS' },
	],
	controls: [
		{ id: 'title', type: 'text', label: 'Heading text', tab: 'content', section: 'content', default: 'Add Your Heading Text' },
		{ id: 'tag', type: 'select', label: 'HTML tag', tab: 'content', section: 'content', default: 'h2', options: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' ].map( ( value ) => ( { value, label: value.toUpperCase() } ) ) },
		{ id: 'link', type: 'text', label: 'Link URL', tab: 'content', section: 'content', placeholder: 'https://example.com' },
		{ id: 'link_target_blank', type: 'toggle', label: 'Open in a new tab', tab: 'content', section: 'content', default: false },
		{ id: 'link_nofollow', type: 'toggle', label: 'Mark as nofollow', tab: 'content', section: 'content', default: false },
		{ id: 'font_family', type: 'select', label: 'Font', tab: 'style', section: 'typography', default: '', options: [ { value: '', label: 'Theme default' }, ...[ 'Arial', 'Georgia', 'Inter', 'Roboto', 'system-ui' ].map( ( value ) => ( { value, label: value } ) ) ] },
		{ id: 'font_size', type: 'number', label: 'Text size (px)', tab: 'style', section: 'typography', default: 28, min: 8, max: 180, responsive: true, help: 'Choose a size that stays readable on each screen.' },
		{ id: 'font_weight', type: 'select', label: 'Weight', tab: 'style', section: 'typography', default: '700', options: [ [ '300', 'Light' ], [ '400', 'Regular' ], [ '500', 'Medium' ], [ '600', 'Semi-bold' ], [ '700', 'Bold' ], [ '800', 'Extra-bold' ] ].map( ( [ value, label ] ) => ( { value, label } ) ) },
		{ id: 'line_height', type: 'number', label: 'Line spacing', tab: 'style', section: 'typography', default: 1.2, min: 0.8, max: 3, step: 0.05, help: 'Controls the space between wrapped lines.' },
		{ id: 'letter_spacing', type: 'number', label: 'Letter spacing (px)', tab: 'style', section: 'typography', default: 0, min: -10, max: 30, step: 0.1 },
		{ id: 'text_transform', type: 'choose', label: 'Letter case', tab: 'style', section: 'typography', default: 'none', options: [ 'none', 'uppercase', 'lowercase', 'capitalize' ].map( ( value ) => ( { value, label: value === 'none' ? 'As typed' : value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'align', type: 'choose', label: 'Alignment', tab: 'style', section: 'typography', default: 'left', supportsHover: false, options: [ 'left', 'center', 'right', 'justify' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'color', type: 'color', label: 'Text color', tab: 'style', section: 'color', state: true, supportsHover: true, default: '' },
		{ id: 'text_shadow', type: 'text', label: 'Text shadow', tab: 'style', section: 'color', supportsHover: true, placeholder: '0 2px 8px rgba(0,0,0,.2)', help: 'Example: 0 2px 8px rgba(0,0,0,.2).' },
		{ id: 'text_decoration', type: 'select', label: 'Underline / decoration', tab: 'style', section: 'typography', default: 'none', options: [ 'none', 'underline', 'overline', 'line-through' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'text_overflow_lines', type: 'number', label: 'Maximum lines', tab: 'style', section: 'typography', min: 0, max: 20, default: 0, help: 'Set to 0 to show all lines.' },
		{ id: 'word_break', type: 'select', label: 'Long words', tab: 'style', section: 'typography', default: 'normal', options: [ { value: 'normal', label: 'Keep words together' }, { value: 'break-word', label: 'Wrap long words' } ] },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: false }, units: [ 'px', 'rem', 'em', '%' ], allowNegative: true },
		{ id: 'animation', type: 'animation', label: 'Entrance effect', tab: 'advanced', section: 'advanced', default: 'none', options: motionCatalog.map( ( item ) => ( { value: item.value, label: __( item.label, 'xcodesol-page-builder' ) } ) ) },
		{ id: 'animation_duration', type: 'number', label: 'Effect duration (ms)', tab: 'advanced', section: 'advanced', min: 100, max: 5000, default: 600, condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'animation_delay', type: 'number', label: 'Effect delay (ms)', tab: 'advanced', section: 'advanced', min: 0, max: 3000, default: 0, condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'animation_easing', type: 'select', label: 'Effect timing', tab: 'advanced', section: 'advanced', default: 'ease', options: [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ].map( ( value ) => ( { value, label: value } ) ), condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'animation_repeat', type: 'select', label: 'Effect repeat', tab: 'advanced', section: 'advanced', default: '1', options: [ { value: '1', label: 'Once' }, { value: '2', label: '2 times' }, { value: '3', label: '3 times' }, { value: 'infinite', label: 'Loop' } ], condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes', placeholder: 'my-heading' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes', placeholder: 'class-one class-two' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes', placeholder: 'selector { color: inherit; }' },
	],
};
