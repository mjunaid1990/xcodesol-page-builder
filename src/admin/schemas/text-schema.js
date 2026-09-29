/**
 * Text Editor Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Text Editor widget is allowed
 * to use. Controls are lazy webpack chunks, so the manifest is what keeps a
 * rich-text block from pulling the border/shadow/grid editors down with it,
 * and dev builds warn when a schema body reaches for a control the manifest
 * does not list.
 *
 * The schema body (sections + controls) is added here when the widget moves
 * off the hand-written inspector onto SchemaInspectorRenderer.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'text',
	type: 'xcopb/gb-text',
	aliases: [ 'xcosb/gb-text', 'xcopb/gb-text-widget', 'xcosb/gb-text-widget' ],
	controls: [
		'typography',
		'color',
		'spacing-box',
		'dimensions',
		'segmented',
		'choose',
		'visibility',
		'textarea',
		'code',
		'css',
		'text',
	],
};
