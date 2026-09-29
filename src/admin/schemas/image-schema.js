/**
 * Image Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Image widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps an
 * image block from pulling the typography or grid editors down with it, and
 * dev builds warn when a schema body reaches for a control the manifest does
 * not list.
 *
 * The schema body (sections + controls) is added here when the widget moves
 * off the hand-written inspector onto SchemaInspectorRenderer.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'image',
	type: 'xcopb/gb-image',
	aliases: [ 'xcosb/gb-image' ],
	controls: [
		'media',
		'image',
		'select',
		'number-unit',
		'number',
		'border',
		'box-shadow',
		'box_shadow',
		'spacing-box',
		'dimensions',
		'url-link',
		'link',
		'visibility',
		'slider',
		'toggle',
	],
};
