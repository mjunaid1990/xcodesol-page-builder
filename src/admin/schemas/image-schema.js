/**
 * Image Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Image widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps an
 * image block from pulling the typography or grid editors down with it, and
 * dev builds warn when a schema body reaches for a control the manifest does
 * not list.
 *
 * Media and presentation fields align with the front-end image wrapper.
 *
 * @package Xcodesol_Page_Builder
 */

import { DYNAMIC_CONTENT_OPTIONS } from '../lib/dynamic-content';

export const manifest = {
	widget: 'image',
	type: 'xcopb/gb-image',
	aliases: [ 'xcosb/gb-image' ],
	controls: [
		'media',
		'select',
		'number',
		'number-unit',
		'color',
		'border',
		'box-shadow',
		'transform',
		'spacing-box',
		'url-link',
		'dimensions',
		'visibility',
		'slider',
		'toggle',
		'text',
		'choose',
		'code',
	],
};

const acfImageFields = typeof window !== 'undefined'
	? ( window.xcopbBuilderConfig?.acfImageFields || window.xcosbBuilderConfig?.acfImageFields || [] )
	: [];
const imageSourceOptions = [
	{ value: 'upload', label: 'Media Library' },
	{ value: 'featured_image', label: 'Post Featured Image' },
	...( acfImageFields.length ? [ { value: 'acf', label: 'ACF image field' } ] : [] ),
];

export const IMAGE_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'image', tab: 'content', title: 'Image', defaultOpen: true },
		{ id: 'link', tab: 'content', title: 'Link' },
		{ id: 'size', tab: 'style', title: 'Size & crop', defaultOpen: true },
		{ id: 'frame', tab: 'style', title: 'Frame background' },
		{ id: 'shape', tab: 'style', title: 'Border & shape', stateful: true },
		{ id: 'shadow', tab: 'style', title: 'Shadow', stateful: true },
		{ id: 'effects', tab: 'style', title: 'Image effects', stateful: true, defaultOpen: true },
		{ id: 'overlay', tab: 'style', title: 'Overlay', stateful: true },
		{ id: 'spacing', tab: 'style', title: 'Spacing' },
		{ id: 'visibility', tab: 'advanced', title: 'Responsive visibility' },
		{ id: 'attributes', tab: 'advanced', title: 'Attributes & custom CSS' },
	],
	controls: [
		{ id: 'image_source', type: 'select', label: 'Image source', tab: 'content', section: 'image', default: 'upload', options: imageSourceOptions },
		...( acfImageFields.length ? [
			{ id: 'acf_field', type: 'select', label: 'ACF image field', tab: 'content', section: 'image', condition: { image_source: 'acf' }, options: [ { value: '', label: 'Choose a field' }, ...acfImageFields.map( ( field ) => ( { value: field.name, label: field.label } ) ) ] },
		] : [] ),
		{ id: 'url', type: 'media', label: 'Choose image', tab: 'content', section: 'image', allowedTypes: [ 'image' ], condition: { image_source: [ 'upload', 'featured_image', 'acf', '', undefined ] }, help: 'Choose an image from your WordPress Media Library.' },
		{ id: 'alt_source', type: 'select', label: 'Alternative text source', tab: 'content', section: 'image', default: 'static', options: [ { value: 'static', label: 'Custom text' }, { value: 'dynamic', label: 'WordPress dynamic value' } ] },
		{ id: 'alt_dynamic_source', type: 'select', label: 'Dynamic alternative text', tab: 'content', section: 'image', default: 'post_title', options: DYNAMIC_CONTENT_OPTIONS.filter( ( item ) => [ 'post_title', 'site_title', 'archive_title' ].includes( item.value ) ), condition: { alt_source: 'dynamic' } },
		{ id: 'alt', type: 'text', label: 'Alternative text', tab: 'content', section: 'image', condition: { alt_source: [ 'static', '', undefined ] }, help: 'Describe the image for people using screen readers. Leave blank only when decorative.' },
		{ id: 'caption_source', type: 'select', label: 'Caption source', tab: 'content', section: 'image', default: 'static', options: [ { value: 'static', label: 'Custom caption' }, { value: 'dynamic', label: 'WordPress dynamic value' } ] },
		{ id: 'caption_dynamic_source', type: 'select', label: 'Dynamic caption', tab: 'content', section: 'image', default: 'post_title', options: DYNAMIC_CONTENT_OPTIONS.filter( ( item ) => [ 'post_title', 'post_excerpt', 'site_title', 'site_tagline', 'archive_title', 'archive_description', 'current_date' ].includes( item.value ) ), condition: { caption_source: 'dynamic' } },
		{ id: 'caption', type: 'text', label: 'Caption', tab: 'content', section: 'image', placeholder: 'Optional caption', condition: { caption_source: [ 'static', '', undefined ] } },
		{ id: 'link', type: 'text', label: 'Link URL', tab: 'content', section: 'link', placeholder: 'https://example.com' },
		{ id: 'link_target', type: 'toggle', label: 'Open link in a new tab', tab: 'content', section: 'link', default: false },
		{ id: 'width', type: 'number', label: 'Width (px)', tab: 'style', section: 'size', min: 0, max: 2400, default: 0, help: 'Set to 0 to use the full available width.' },
		{ id: 'max_width', type: 'number', label: 'Maximum width (px)', tab: 'style', section: 'size', min: 0, max: 2400, default: 0 },
		{ id: 'height', type: 'number', label: 'Height (px)', tab: 'style', section: 'size', min: 0, max: 2400, default: 130, help: 'Set a height to crop the image; 130px is used by default.' },
		{ id: 'background', type: 'color', label: 'Background color', tab: 'style', section: 'frame', help: 'Visible behind transparent images and in the empty image preview.' },
		{ id: 'bg_size', type: 'select', label: 'Background size', tab: 'style', section: 'size', default: 'cover', options: [ { value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'auto', label: 'Original size' }, { value: '100% 100%', label: 'Stretch to fill' }, { value: 'custom', label: 'Custom' } ] },
		{ id: 'bg_size_custom', type: 'text', label: 'Custom background size', tab: 'style', section: 'size', placeholder: 'e.g. 480px auto or 60% 100%', condition: { bg_size: 'custom' } },
		{ id: 'bg_position', type: 'select', label: 'Background position', tab: 'style', section: 'size', default: 'center center', options: [ 'left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom', 'custom' ].map( ( value ) => ( { value, label: value === 'custom' ? 'Custom' : value.replace( /\b\w/g, ( ch ) => ch.toUpperCase() ) } ) ) },
		{ id: 'bg_position_custom', type: 'text', label: 'Custom background position', tab: 'style', section: 'size', placeholder: 'e.g. 25% 40% or right 20px bottom 10px', condition: { bg_position: 'custom' } },
		{ id: 'bg_repeat', type: 'select', label: 'Background repeat', tab: 'style', section: 'size', default: 'no-repeat', options: [ { value: 'no-repeat', label: 'No repeat' }, { value: 'repeat', label: 'Repeat' }, { value: 'repeat-x', label: 'Repeat horizontally' }, { value: 'repeat-y', label: 'Repeat vertically' }, { value: 'space', label: 'Space' }, { value: 'round', label: 'Round' } ] },
		{ id: 'bg_attachment', type: 'select', label: 'Background attachment', tab: 'style', section: 'size', default: 'scroll', options: [ { value: 'scroll', label: 'Scroll' }, { value: 'fixed', label: 'Fixed' }, { value: 'local', label: 'Move with container' } ] },
		{ id: 'border_radius', type: 'number', label: 'Corner roundness (px)', tab: 'style', section: 'shape', min: 0, max: 500, default: 0, supportsHover: true, presets: [ 0, 6, 16, 32, 999 ] },
		{ id: 'border_style', type: 'select', label: 'Border style', tab: 'style', section: 'shape', default: 'none', options: [ 'none', 'solid', 'dashed', 'dotted', 'double' ].map( ( value ) => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'border_width', type: 'number', label: 'Border width (px)', tab: 'style', section: 'shape', min: 0, max: 30, default: 0 },
		{ id: 'border_color', type: 'color', label: 'Border color', tab: 'style', section: 'shape', default: '#e2e8f0' },
		{ id: 'box_shadow', type: 'select', label: 'Shadow', tab: 'style', section: 'shadow', default: 'none', supportsHover: true, options: [ { value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' } ] },
		{ id: 'grayscale', type: 'slider', label: 'Grayscale', tab: 'style', section: 'effects', min: 0, max: 100, step: 1, default: 0, unit: '%' , supportsHover: true },
		{ id: 'blur', type: 'slider', label: 'Blur', tab: 'style', section: 'effects', min: 0, max: 20, step: 0.5, default: 0, unit: 'px' },
		{ id: 'brightness', type: 'slider', label: 'Brightness', tab: 'style', section: 'effects', min: 0, max: 200, step: 1, default: 100, unit: '%' },
		{ id: 'contrast', type: 'slider', label: 'Contrast', tab: 'style', section: 'effects', min: 0, max: 200, step: 1, default: 100, unit: '%' },
		{ id: 'saturate', type: 'slider', label: 'Saturation', tab: 'style', section: 'effects', min: 0, max: 200, step: 1, default: 100, unit: '%' },
		{ id: 'hue_rotate', type: 'number', label: 'Hue rotate (deg)', tab: 'style', section: 'effects', min: 0, max: 360, default: 0 },
		{ id: 'sepia', type: 'slider', label: 'Sepia', tab: 'style', section: 'effects', min: 0, max: 100, step: 1, default: 0, unit: '%' },
		{ id: 'rotate', type: 'number', label: 'Rotate (deg)', tab: 'style', section: 'effects', min: -180, max: 180, default: 0 },
		{ id: 'scale', type: 'slider', label: 'Scale', tab: 'style', section: 'effects', min: 50, max: 150, step: 1, default: 100, unit: '%' },
		{ id: 'transform_origin', type: 'select', label: 'Transform origin', tab: 'style', section: 'effects', default: 'center center', options: [ 'center center', 'left top', 'center top', 'right top', 'left center', 'right center', 'left bottom', 'center bottom', 'right bottom' ].map( ( value ) => ( { value, label: value.replace( /\b\w/g, ( ch ) => ch.toUpperCase() ) } ) ) },
		{ id: 'opacity', type: 'slider', label: 'Opacity', tab: 'style', section: 'effects', min: 0, max: 100, step: 1, default: 100, unit: '%', supportsHover: true },
		{ id: 'overlay_color', type: 'color', label: 'Overlay color', tab: 'style', section: 'overlay' },
		{ id: 'overlay_opacity', type: 'slider', label: 'Overlay opacity', tab: 'style', section: 'overlay', min: 0, max: 100, step: 1, default: 0, unit: '%' },
		{ id: 'overlay_blend_mode', type: 'select', label: 'Blend mode', tab: 'style', section: 'overlay', default: 'normal', options: [ 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity' ].map( ( value ) => ( { value, label: value.replace( /-/g, ' ' ).replace( /\b\w/g, ( ch ) => ch.toUpperCase() ) } ) ) },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }, units: [ 'px', 'rem', '%' ], allowNegative: true },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes' },
	],
};
