/**
 * Button Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Button widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps the
 * button from pulling the grid/column editors down with it, and dev builds
 * warn when a schema body reaches for a control the manifest does not list.
 *
 * The schema body (sections + controls) is added here when the widget moves
 * off the hand-written inspector onto SchemaInspectorRenderer.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'button',
	type: 'xcopb/gb-button',
	aliases: [ 'xcosb/gb-button' ],
	controls: [
		'typography',
		'color',
		'border',
		'box-shadow',
		'box_shadow',
		'spacing-box',
		'dimensions',
		'segmented',
		'choose',
		'url-link',
		'link',
		'transform',
		'animation',
		'visibility',
		'text',
		'toggle',
	],
};
