/**
 * Widget manifest registry for Xcodesol Page Builder.
 *
 * Every widget that renders through SchemaInspectorRenderer declares the
 * controls it is allowed to use in a `manifest` inside its schema file. The
 * manifests are collected here so any call site can answer "which controls
 * does this widget need?" with one lookup, and so dev builds can audit the
 * whole set in one pass.
 *
 * Manifests are pure data — no control code is imported here, which keeps
 * the registry usable from plain node scripts.
 *
 * @package Xcodesol_Page_Builder
 */

import { manifest as containerManifest } from './container-schema';
import { manifest as headingManifest } from './heading-schema';
import { manifest as buttonManifest } from './button-schema';
import { manifest as imageManifest } from './image-schema';
import { manifest as textManifest } from './text-schema';
import { manifest as dividerManifest } from './divider-schema';

/**
 * Every declared widget manifest, in registration order.
 */
export const WIDGET_MANIFESTS = [
	containerManifest,
	headingManifest,
	buttonManifest,
	imageManifest,
	textManifest,
	dividerManifest,
];

/**
 * Legacy block-type prefix. Stored documents written before the prefix
 * change carry `xcosb/…`; the migrator rewrites them, and the editor keeps
 * answering for both so a document mid-migration still resolves.
 */
const LEGACY_PREFIX = 'xcosb/';
const CURRENT_PREFIX = 'xcopb/';

/**
 * Block types claimed by more than one manifest (filled while the lookup is
 * built, reported by auditManifests()).
 */
const DUPLICATE_CLAIMS = new Map();

/**
 * Build the block-type → manifest lookup table, including legacy aliases and
 * the mirrored `xcopb/` ⇄ `xcosb/` variant of every declared type.
 *
 * @return {Map<string, Object>} Type → manifest.
 */
function buildLookup() {
	const lookup = new Map();

	const add = ( type, manifest ) => {
		if ( ! type ) {
			return;
		}
		const existing = lookup.get( type );
		if ( existing && existing !== manifest ) {
			// Keep the first claim — audited through DUPLICATE_CLAIMS.
			if ( ! DUPLICATE_CLAIMS.has( manifest.widget ) ) {
				DUPLICATE_CLAIMS.set( manifest.widget, [] );
			}
			DUPLICATE_CLAIMS.get( manifest.widget ).push( type );
			return;
		}
		lookup.set( type, manifest );
	};

	WIDGET_MANIFESTS.forEach( ( manifest ) => {
		[ manifest.type, ...( manifest.aliases || [] ) ].forEach( ( type ) => {
			add( type, manifest );

			// Mirror the prefix so a document still holding the legacy
			// namespace resolves the same manifest.
			if ( type && type.startsWith( CURRENT_PREFIX ) ) {
				add( LEGACY_PREFIX + type.slice( CURRENT_PREFIX.length ), manifest );
			} else if ( type && type.startsWith( LEGACY_PREFIX ) ) {
				add( CURRENT_PREFIX + type.slice( LEGACY_PREFIX.length ), manifest );
			}
		} );
	} );

	return lookup;
}

let lookup = null;

/**
 * Type → manifest lookup table (built once, lazily).
 *
 * @return {Map<string, Object>} The lookup.
 */
export function manifestLookup() {
	if ( ! lookup ) {
		lookup = buildLookup();
	}
	return lookup;
}

/**
 * Manifest for a block type.
 *
 * @param {string} type Block type, e.g. `xcopb/gb-heading`.
 * @return {Object|null} The widget manifest, or null when the widget has none.
 */
export function manifestFor( type ) {
	return manifestLookup().get( type ) || null;
}

/**
 * Control types a block type is allowed to use.
 *
 * @param {string} type Block type.
 * @return {Array<string>} Control types (empty when there is no manifest).
 */
export function manifestControls( type ) {
	const manifest = manifestFor( type );
	return manifest ? [ ...( manifest.controls || [] ) ] : [];
}

/**
 * Audit every manifest against the control registry and against each other.
 *
 * Called once at editor boot in dev builds. Catches the two drift bugs that
 * are otherwise invisible: a manifest listing a control that does not exist
 * (a typo like `box_shadowx` silently renders nothing), and two widgets
 * claiming the same block type.
 *
 * @param {Iterable<string>|Object} knownControls Known control type strings,
 *                                                or a registry object.
 * @return {Array<string>} Human-readable problems (empty when clean).
 */
export function auditManifests( knownControls ) {
	const known =
		knownControls instanceof Map
			? new Set( knownControls.keys() )
			: Array.isArray( knownControls ) || knownControls instanceof Set
			? new Set( knownControls )
			: new Set( Object.keys( knownControls || {} ) );

	manifestLookup();

	const problems = [];

	WIDGET_MANIFESTS.forEach( ( manifest ) => {
		const widget = manifest.widget || 'unknown';

		if ( ! manifest.type ) {
			problems.push( `Widget "${ widget }" declares no block type.` );
		}

		const controls = manifest.controls || [];

		if ( controls.length === 0 ) {
			problems.push( `Widget "${ widget }" declares no controls.` );
		}

		const unknown = controls.filter( ( type ) => ! known.has( type ) );
		if ( unknown.length ) {
			problems.push(
				`Widget "${ widget }" declares unknown controls: ${ unknown.join( ', ' ) }.`
			);
		}

		if ( DUPLICATE_CLAIMS.has( widget ) ) {
			problems.push(
				`Widget "${ widget }" reuses block types already claimed by another widget: ${ DUPLICATE_CLAIMS.get( widget ).join( ', ' ) }.`
			);
		}
	} );

	return problems;
}
