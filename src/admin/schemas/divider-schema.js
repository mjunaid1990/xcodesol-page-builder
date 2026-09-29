/**
 * Divider Widget Schema for Xcodesol Page Builder.
 *
 * Declares — in `manifest` — which controls the Divider widget is allowed to
 * use. Controls are lazy webpack chunks, so the manifest is what keeps a
 * one-line separator from pulling the typography or media editors down with
 * it, and dev builds warn when a schema body reaches for a control the
 * manifest does not list.
 *
 * The schema body (sections + controls) is added here when the widget moves
 * off the hand-written inspector onto SchemaInspectorRenderer.
 *
 * @package Xcodesol_Page_Builder
 */

export const manifest = {
	widget: 'divider',
	type: 'xcopb/gb-divider',
	aliases: [ 'xcosb/gb-divider' ],
	controls: [
		'select',
		'color',
		'number-unit',
		'number',
		'slider',
		'spacing-box',
		'dimensions',
		'visibility',
		'toggle',
	],
};
