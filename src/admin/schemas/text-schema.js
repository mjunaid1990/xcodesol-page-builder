/**
 * Text Editor Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Text Editor widget is allowed
 * to use. Controls are lazy webpack chunks, so the manifest is what keeps a
 * rich-text block from pulling the border/shadow/grid editors down with it,
 * and dev builds warn when a schema body reaches for a control the manifest
 * does not list.
 *
 * The controls stay on the renderer's existing flat text settings.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import motionCatalog from '../../../includes/data/motion-presets.json';
import { DYNAMIC_CONTENT_OPTIONS } from '../lib/dynamic-content';

export const manifest = {
	widget: 'text',
	type: 'xcopb/gb-text',
	aliases: [ 'xcosb/gb-text' ],
	controls: [
		'typography',
		'color',
		'choose',
		'visibility',
		'spacing-box',
		'segmented',
		'textarea',
		'code',
		'text',
		'select',
		'number',
		'toggle',
		'dimensions',
		'slider',
	],
};

export const TEXT_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'content', tab: 'content', title: 'Text content', defaultOpen: true },
		{ id: 'typography', tab: 'style', title: 'Typography', defaultOpen: true },
		{ id: 'color', tab: 'style', title: 'Colors', stateful: true },
		{ id: 'paragraphs', tab: 'style', title: 'Paragraph layout' },
		{ id: 'blockquote', tab: 'style', title: 'Text decoration & box' },
		{ id: 'spacing', tab: 'style', title: 'Spacing' },
		{ id: 'visibility', tab: 'advanced', title: 'Responsive visibility' },
		{ id: 'attributes', tab: 'advanced', title: 'Attributes & custom CSS' },
	],
	controls: [
		{ id: 'content_source', type: 'select', label: 'Content source', tab: 'content', section: 'content', default: 'static', options: [ { value: 'static', label: 'Custom text' }, { value: 'dynamic', label: 'WordPress dynamic value' } ] },
		{ id: 'dynamic_source', type: 'select', label: 'Dynamic value', tab: 'content', section: 'content', default: 'post_title', options: DYNAMIC_CONTENT_OPTIONS, condition: { content_source: 'dynamic' } },
		{ id: 'content', type: 'textarea', label: 'Text', tab: 'content', section: 'content', default: 'Add your text here.', condition: { content_source: [ 'static', '', undefined ] }, help: 'Basic HTML is supported, including links, lists and emphasis.' },
		{ id: 'tag', type: 'select', label: 'Text style', tab: 'content', section: 'content', default: 'p', options: [ { value: 'p', label: 'Paragraph' }, { value: 'div', label: 'Block' }, { value: 'blockquote', label: 'Quote' }, { value: 'span', label: 'Inline text' }, ...[ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].map( ( value ) => ( { value, label: `Heading ${ value.slice( 1 ) }` } ) ) ] },
		{ id: 'drop_cap', type: 'toggle', label: 'Large first letter', tab: 'style', section: 'paragraphs', default: false },
		{ id: 'text_columns', type: 'select', label: 'Columns', tab: 'style', section: 'paragraphs', default: 1, options: [ 1, 2, 3 ].map( ( value ) => ( { value, label: String( value ) } ) ) },
		{ id: 'column_gap', type: 'number', label: 'Column gap (px)', tab: 'style', section: 'paragraphs', min: 0, max: 120, default: 24, condition: { text_columns: [ 2, 3 ] } },
		{ id: 'paragraph_spacing', type: 'number', label: 'Space between paragraphs (px)', tab: 'style', section: 'paragraphs', min: 0, max: 100, default: 16 },
		{ id: 'font_family', type: 'select', label: 'Font', tab: 'style', section: 'typography', default: '', options: [ { value: '', label: 'Theme default' }, ...[ 'Arial', 'Georgia', 'Inter', 'Roboto', 'system-ui' ].map( ( value ) => ( { value, label: value } ) ) ] },
		{ id: 'font_size', type: 'number', label: 'Text size (px)', tab: 'style', section: 'typography', min: 8, max: 120, default: 16 },
		{ id: 'font_weight', type: 'select', label: 'Weight', tab: 'style', section: 'typography', default: '400', options: [ '300', '400', '500', '600', '700', '800' ].map( ( value ) => ( { value, label: value } ) ) },
		{ id: 'font_style', type: 'select', label: 'Font style', tab: 'style', section: 'typography', default: 'normal', options: [ 'normal', 'italic', 'oblique' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'line_height', type: 'number', label: 'Line spacing', tab: 'style', section: 'typography', min: 0.8, max: 3, step: 0.05, default: 1.6 },
		{ id: 'letter_spacing', type: 'number', label: 'Letter spacing (px)', tab: 'style', section: 'typography', min: -10, max: 30, step: 0.1, default: 0 },
		{ id: 'text_transform', type: 'select', label: 'Letter case', tab: 'style', section: 'typography', default: 'none', options: [ 'none', 'uppercase', 'lowercase', 'capitalize' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'align', type: 'choose', label: 'Alignment', tab: 'style', section: 'typography', default: 'left', options: [ 'left', 'center', 'right', 'justify' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'color', type: 'color', label: 'Text color', tab: 'style', section: 'color', state: true, supportsHover: true },
		{ id: 'background_color', type: 'color', label: 'Background color', tab: 'style', section: 'color', supportsHover: true },
		{ id: 'opacity', type: 'slider', label: 'Opacity', tab: 'style', section: 'color', min: 0, max: 100, step: 1, default: 100, unit: '%' },
		{ id: 'link_color', type: 'color', label: 'Link color', tab: 'style', section: 'color', supportsHover: true },
		{ id: 'text_shadow', type: 'text', label: 'Text shadow', tab: 'style', section: 'color', placeholder: '0 2px 6px rgba(0,0,0,.2)' },
		{ id: 'text_decoration', type: 'select', label: 'Text decoration', tab: 'style', section: 'typography', default: 'none', options: [ 'none', 'underline', 'overline', 'line-through' ].map( ( value ) => ( { value, label: value === 'line-through' ? 'Line through' : value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'text_decoration_color', type: 'color', label: 'Decoration color', tab: 'style', section: 'typography' },
		{ id: 'text_decoration_style', type: 'select', label: 'Decoration style', tab: 'style', section: 'typography', default: 'solid', options: [ 'solid', 'double', 'dotted', 'dashed', 'wavy' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'word_break', type: 'select', label: 'Word wrapping', tab: 'style', section: 'paragraphs', default: 'normal', options: [ { value: 'normal', label: 'Normal' }, { value: 'break-word', label: 'Break long words' }, { value: 'keep-all', label: 'Keep words together' } ] },
		{ id: 'blockquote_color', type: 'color', label: 'Quote accent color', tab: 'style', section: 'blockquote' },
		{ id: 'blockquote_background', type: 'color', label: 'Quote background', tab: 'style', section: 'blockquote', supportsHover: true },
		{ id: 'border_width', type: 'number', label: 'Border width (px)', tab: 'style', section: 'blockquote', min: 0, max: 20, default: 0 },
		{ id: 'border_style', type: 'select', label: 'Border style', tab: 'style', section: 'blockquote', default: 'solid', options: [ 'solid', 'dashed', 'dotted', 'double' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'border_color', type: 'color', label: 'Border color', tab: 'style', section: 'blockquote' },
		{ id: 'border_radius', type: 'number', label: 'Corner roundness (px)', tab: 'style', section: 'blockquote', min: 0, max: 100, default: 0 },
		{ id: 'padding', type: 'number', label: 'Inner spacing (px)', tab: 'style', section: 'blockquote', min: 0, max: 100, default: 0 },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }, units: [ 'px', 'rem', '%' ], allowNegative: true },
		{ id: 'animation', type: 'animation', label: 'Entrance effect', tab: 'advanced', section: 'attributes', default: 'none', options: motionCatalog.map( ( item ) => ( { value: item.value, label: __( item.label, 'xcodesol-page-builder' ) } ) ) },
		{ id: 'animation_duration', type: 'number', label: 'Effect duration (ms)', tab: 'advanced', section: 'attributes', min: 100, max: 5000, default: 600, condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'animation_delay', type: 'number', label: 'Effect delay (ms)', tab: 'advanced', section: 'attributes', min: 0, max: 3000, default: 0, condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'animation_easing', type: 'select', label: 'Effect timing', tab: 'advanced', section: 'attributes', default: 'ease', options: [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ].map( ( value ) => ( { value, label: value } ) ), condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'animation_repeat', type: 'select', label: 'Effect repeat', tab: 'advanced', section: 'attributes', default: '1', options: [ { value: '1', label: 'Once' }, { value: '2', label: '2 times' }, { value: '3', label: '3 times' }, { value: 'infinite', label: 'Loop' } ], condition: { animation: motionCatalog.map( ( item ) => item.value ) } },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes' },
	],
};
