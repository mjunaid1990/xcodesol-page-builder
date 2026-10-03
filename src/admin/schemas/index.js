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

import { CONTAINER_SCHEMA } from './container-schema';
import { HEADING_SCHEMA } from './heading-schema';
import { BUTTON_SCHEMA } from './button-schema';
import { IMAGE_SCHEMA } from './image-schema';
import { TEXT_SCHEMA } from './text-schema';
import { DIVIDER_SCHEMA } from './divider-schema';
import { BANNER_SCHEMA } from './banner-schema';
import { SHORTCODE_SCHEMA } from './shortcode-schema';
import { BREADCRUMB_SCHEMA } from './breadcrumb-schema';
import { HTML_SCHEMA } from './html-schema';
import { DYNAMIC_SCHEMA } from './dynamic-schema';
import { CORE_BLOCK_SCHEMA } from './core-block-schema';

const containerManifest = CONTAINER_SCHEMA.manifest;
const headingManifest = HEADING_SCHEMA.manifest;
const buttonManifest = BUTTON_SCHEMA.manifest;
const imageManifest = IMAGE_SCHEMA.manifest;
const textManifest = TEXT_SCHEMA.manifest;
const dividerManifest = DIVIDER_SCHEMA.manifest;
const bannerManifest = BANNER_SCHEMA.manifest;
const shortcodeManifest = SHORTCODE_SCHEMA.manifest;
const breadcrumbManifest = BREADCRUMB_SCHEMA.manifest;
const htmlManifest = HTML_SCHEMA.manifest;
const dynamicManifest = DYNAMIC_SCHEMA.manifest;
const coreBlockManifest = CORE_BLOCK_SCHEMA.manifest;

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
	bannerManifest,
	shortcodeManifest,
	breadcrumbManifest,
	htmlManifest,
	dynamicManifest,
	coreBlockManifest,
];

// Shared Advanced spacing uses the registered dimensions control for every
// widget schema, including widgets whose original schema did not need it.
WIDGET_MANIFESTS.forEach( ( manifest ) => {
	if ( ! manifest.controls.includes( 'dimensions' ) ) manifest.controls.push( 'dimensions' );
} );

const RAW_WIDGET_SCHEMAS = [ CONTAINER_SCHEMA, HEADING_SCHEMA, BUTTON_SCHEMA, IMAGE_SCHEMA, TEXT_SCHEMA, DIVIDER_SCHEMA, BANNER_SCHEMA, SHORTCODE_SCHEMA, BREADCRUMB_SCHEMA, HTML_SCHEMA, DYNAMIC_SCHEMA, CORE_BLOCK_SCHEMA ];

/**
 * Keep shared box spacing in Advanced for every widget. Widget-specific
 * spacing controls (such as button padding or banner slide gaps) remain in
 * their existing Style sections.
 *
 * @param {Object} schema Widget schema.
 * @return {Object} Schema with shared spacing controls normalized.
 */
function withAdvancedWidgetSpacing( schema ) {
	if ( schema.manifest?.widget === 'container' ) {
		return {
			...schema,
			sections: schema.sections.map( ( section ) => section.id === 'spacing' ? { ...section, tab: 'advanced' } : section ),
			controls: schema.controls.map( ( control ) => control.section === 'spacing' && [ 'padding', 'margin' ].includes( control.id ) ? { ...control, tab: 'advanced' } : control ),
		};
	}

	const advancedSectionId = 'widget_spacing';
	const controls = ( schema.controls || [] ).map( ( control ) => {
		if ( schema.manifest?.widget === 'text' && control.id === 'padding' && control.section === 'blockquote' ) {
			return { ...control, id: 'blockquote_padding' };
		}
		if ( control.id === 'margin' && control.tab === 'style' ) {
			return { ...control, tab: 'advanced', section: advancedSectionId };
		}
		return control;
	} );
	const hasMargin = controls.some( ( control ) => control.id === 'margin' );
	if ( ! hasMargin ) {
		controls.push( {
			id: 'margin', type: 'dimensions', label: 'Margin', tab: 'advanced', section: advancedSectionId,
			default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'em', 'rem', 'vw', 'vh' ], allowNegative: true,
		} );
	}
	if ( ! controls.some( ( control ) => control.id === 'padding' ) ) {
		controls.push( {
			id: 'padding', type: 'dimensions', label: 'Padding', tab: 'advanced', section: advancedSectionId,
			default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true },
			units: [ 'px', '%', 'em', 'rem', 'vw', 'vh' ],
		} );
	}
	const hasAdvancedSpacing = ( schema.sections || [] ).some( ( section ) => section.id === advancedSectionId );
	const sections = ( schema.sections || [] ).map( ( section ) => {
		if ( section.id !== 'spacing' || section.tab !== 'style' ) return section;
		const hasStyleControls = controls.some( ( control ) => control.section === section.id && control.tab === 'style' );
		if ( ! hasStyleControls ) return null;
		return { ...section, title: schema.manifest?.widget === 'button' ? 'Button layout' : section.title };
	} ).filter( Boolean );
	if ( ! hasAdvancedSpacing ) {
		const firstAdvancedIndex = sections.findIndex( ( section ) => section.tab === 'advanced' );
		sections.splice( firstAdvancedIndex < 0 ? sections.length : firstAdvancedIndex, 0, {
			id: advancedSectionId, tab: 'advanced', title: 'Spacing (Padding & Margin)', defaultOpen: true,
		} );
	}
	return { ...schema, manifest: { ...schema.manifest, controls: [ ...new Set( [ ...( schema.manifest?.controls || [] ), 'dimensions' ] ) ] }, sections, controls };
}

export const WIDGET_SCHEMAS = RAW_WIDGET_SCHEMAS.map( withAdvancedWidgetSpacing );

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

export function schemaFor( type ) {
	const manifest = manifestFor( type );
	return manifest ? WIDGET_SCHEMAS.find( ( schema ) => schema.manifest.widget === manifest.widget ) || null : null;
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
