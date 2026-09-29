/**
 * Heading Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Heading widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps a text
 * widget from pulling the grid editor down with it: only the listed types are
 * declared as needed, and dev builds warn when a schema body reaches for a
 * control the manifest does not list.
 *
 * The schema body (sections + controls) is added here when the widget moves
 * off the hand-written inspector onto SchemaInspectorRenderer.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'heading',
	type: 'xcopb/gb-heading',
	aliases: [ 'xcosb/gb-heading' ],
	controls: [
		'typography',
		'color',
		'segmented',
		'choose',
		'spacing-box',
		'dimensions',
		'select',
		'url-link',
		'link',
		'animation',
		'visibility',
		'code',
		'css',
		'text',
		'toggle',
	],
};
