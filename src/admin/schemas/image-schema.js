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
		{ id: 'effects', tab: 'style', title: 'Image effects', stateful: true },
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
		{ id: 'alt', type: 'text', label: 'Alternative text', tab: 'content', section: 'image', help: 'Describe the image for people using screen readers. Leave blank only when decorative.' },
		{ id: 'caption', type: 'text', label: 'Caption', tab: 'content', section: 'image', placeholder: 'Optional caption' },
		{ id: 'link', type: 'text', label: 'Link URL', tab: 'content', section: 'link', placeholder: 'https://example.com' },
		{ id: 'link_target', type: 'toggle', label: 'Open link in a new tab', tab: 'content', section: 'link', default: false },
		{ id: 'width', type: 'number', label: 'Width (px)', tab: 'style', section: 'size', min: 0, max: 2400, default: 0, help: 'Set to 0 to use the full available width.' },
		{ id: 'max_width', type: 'number', label: 'Maximum width (px)', tab: 'style', section: 'size', min: 0, max: 2400, default: 0 },
		{ id: 'height', type: 'number', label: 'Height (px)', tab: 'style', section: 'size', min: 0, max: 2400, default: 130, help: 'Set a height to crop the image; 130px is used by default.' },
		{ id: 'background', type: 'color', label: 'Background color', tab: 'style', section: 'frame', help: 'Visible behind transparent images and in the empty image preview.' },
		{ id: 'object_fit', type: 'select', label: 'Crop behavior', tab: 'style', section: 'size', default: 'cover', options: [ { value: 'cover', label: 'Fill frame' }, { value: 'contain', label: 'Show whole image' }, { value: 'fill', label: 'Stretch to fit' }, { value: 'none', label: 'Original size' }, { value: 'scale-down', label: 'Scale down only' } ] },
		{ id: 'object_position', type: 'select', label: 'Focus point', tab: 'style', section: 'size', default: 'center center', options: [ 'center center', 'top center', 'bottom center', 'left center', 'right center', 'top left', 'top right', 'bottom left', 'bottom right' ].map( ( value ) => ( { value, label: value.replace( 'center', 'middle' ).replace( /\b\w/g, ( ch ) => ch.toUpperCase() ) } ) ) },
		{ id: 'border_radius', type: 'number', label: 'Corner roundness (px)', tab: 'style', section: 'shape', min: 0, max: 500, default: 0, supportsHover: true, presets: [ 0, 6, 16, 32, 999 ] },
		{ id: 'box_shadow', type: 'select', label: 'Shadow', tab: 'style', section: 'shadow', default: 'none', supportsHover: true, options: [ { value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' } ] },
		{ id: 'grayscale', type: 'slider', label: 'Grayscale', tab: 'style', section: 'effects', min: 0, max: 100, step: 1, default: 0, unit: '%' , supportsHover: true },
		{ id: 'opacity', type: 'slider', label: 'Opacity', tab: 'style', section: 'effects', min: 10, max: 100, step: 1, default: 100, unit: '%', supportsHover: true },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }, units: [ 'px', 'rem', '%' ], allowNegative: true },
		{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility', default: false },
		{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
		{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
		{ id: 'custom_css', type: 'code', label: 'Custom CSS', tab: 'advanced', section: 'attributes' },
	],
};
