/**
 * Self-tests for the per-widget control manifests.
 *
 * Run with:  node tests/widget-manifests.test.mjs
 *
 * Guards the two failure modes that are invisible in the editor: a manifest
 * listing a control type the registry does not know (a typo silently renders
 * an "Unknown control" box), and two widgets claiming the same block type.
 * The registry is read from source so a renamed or removed control fails here
 * instead of shipping.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname( fileURLToPath( import.meta.url ) );
const root = join( here, '..' );

function read( rel ) {
	return readFileSync( join( root, rel ), 'utf8' );
}

function dataUrl( code ) {
	return 'data:text/javascript;base64,' + Buffer.from( code ).toString( 'base64' );
}

/** Load a source module with its `@wordpress/*` imports replaced by stubs. */
async function loadModule( rel, stubs = {} ) {
	let code = read( rel );
	Object.entries( stubs ).forEach( ( [ spec, replacement ] ) => {
		const pattern = new RegExp( `import\\s*\\{[^}]*\\}\\s*from\\s*'${ spec.replace( '/', '\\/' ) }';`, 'g' );
		code = code.replace( pattern, replacement );
	} );
	return import( dataUrl( code ) );
}

/** Collect the keys of an object literal by name (comments and blanks ignored). */
function objectKeys( source, constName ) {
	const start = source.indexOf( `const ${ constName } = {` );
	if ( start < 0 ) {
		return [];
	}
	const end = source.indexOf( '\n};', start );
	const body = source.slice( start, end < 0 ? source.length : end );
	const keys = [];
	body.split( '\n' ).forEach( ( line ) => {
		const trimmed = line.trim();
		if ( ! trimmed || trimmed.startsWith( '//' ) || trimmed.startsWith( '*' ) ) {
			return;
		}
		const match = trimmed.match( /^(?:'([^']+)'|([A-Za-z0-9_$]+))\s*:/ );
		if ( match ) {
			keys.push( match[ 1 ] || match[ 2 ] );
		}
	} );
	return keys;
}

/** Collect the quoted strings of an array literal by name. */
function arrayStrings( source, constName ) {
	const start = source.indexOf( `export const ${ constName } = [` );
	if ( start < 0 ) {
		return [];
	}
	const end = source.indexOf( '\n];', start );
	const body = source.slice( start, end < 0 ? source.length : end );
	return [ ...body.matchAll( /'([^']+)'/g ) ].map( ( m ) => m[ 1 ] );
}

const registrySource = read( 'src/admin/components/controls/index.js' );
const registryKeys = objectKeys( registrySource, 'CONTROL_REGISTRY' );
const builtinKeys = arrayStrings( registrySource, 'BUILTIN_CONTROL_TYPES' );
const knownTypes = new Set( [ ...registryKeys, ...builtinKeys ] );

const SCHEMA_FILES = [
	'schemas/container-schema.js',
	'schemas/heading-schema.js',
	'schemas/button-schema.js',
	'schemas/image-schema.js',
	'schemas/text-schema.js',
	'schemas/divider-schema.js',
];

const manifests = [];
for ( const rel of SCHEMA_FILES ) {
	const mod = await loadModule( `src/admin/${ rel }`, {
		'@wordpress/i18n': 'const __ = ( s ) => s; const sprintf = ( s ) => s;',
	} );
	manifests.push( { rel, manifest: mod.manifest } );
}

/**
 * Load schemas/index.js with its manifest imports inlined, so the real lookup
 * and audit code can be exercised without a bundler. Numeric export names are
 * not an issue because every manifest is plain JSON.
 */
async function loadRegistry() {
	const byBase = new Map();
	SCHEMA_FILES.forEach( ( rel ) => {
		const base = rel.split( '/' ).pop().replace( /\.js$/, '' );
		byBase.set( base, manifests.find( ( m ) => m.rel === rel ).manifest );
	} );

	const code = read( 'src/admin/schemas/index.js' ).replace(
		/import\s*\{\s*manifest\s+as\s+(\w+)\s*\}\s*from\s*'\.\/([\w-]+)'\s*;/g,
		( match, name, base ) => {
			const manifest = byBase.get( base );
			return manifest ? `const ${ name } = ${ JSON.stringify( manifest ) };` : match;
		}
	);

	return import( dataUrl( code ) );
}

const registry = await loadRegistry();

let passed = 0;
let failed = 0;

function check( label, cond ) {
	if ( cond ) {
		passed += 1;
		console.log( `  PASS  ${ label }` );
	} else {
		failed += 1;
		console.error( `  FAIL  ${ label }` );
	}
}

console.log( '== control registry parse ==' );
check( `registry keys found (${ registryKeys.length })`, registryKeys.length >= 25 );
check( `builtin control types found (${ builtinKeys.length })`, builtinKeys.length >= 10 );
check( 'registry knows layout-picker', knownTypes.has( 'layout-picker' ) );
check( 'registry knows grid-template', knownTypes.has( 'grid-template' ) );
check( 'registry knows textarea (builtin)', knownTypes.has( 'textarea' ) );

console.log( '== manifest shape ==' );
manifests.forEach( ( { rel, manifest } ) => {
	check( `${ rel } exports a manifest`, !! manifest );
	check( `${ manifest?.widget || rel } declares widget + type`, !! manifest?.widget && !! manifest?.type );
	check(
		`${ manifest?.widget || rel } declares controls`,
		Array.isArray( manifest?.controls ) && manifest.controls.length > 0
	);
} );

console.log( '== declared controls are known ==' );
manifests.forEach( ( { manifest } ) => {
	const unknown = ( manifest?.controls || [] ).filter( ( t ) => ! knownTypes.has( t ) );
	check( `${ manifest?.widget }: all controls registered`, unknown.length === 0 );
	if ( unknown.length ) {
		console.error( `        unknown: ${ unknown.join( ', ' ) }` );
	}
} );

console.log( '== block types are unique ==' );
{
	const claims = new Map();
	const clashes = [];
	manifests.forEach( ( { rel, manifest } ) => {
		[ manifest?.type, ...( manifest?.aliases || [] ) ].filter( Boolean ).forEach( ( type ) => {
			if ( claims.has( type ) && claims.get( type ) !== rel ) {
				clashes.push( `${ type } (${ claims.get( type ) } vs ${ rel })` );
			}
			claims.set( type, rel );
		} );
	} );
	check( `no block type claimed twice${ clashes.length ? `: ${ clashes.join( ', ' ) }` : '' }`, clashes.length === 0 );
	check( 'every widget answers for its current prefix', manifests.every( ( { manifest } ) => ( manifest?.type || '' ).startsWith( 'xcopb/' ) ) );
	check( 'every widget also answers for the legacy prefix', manifests.every( ( { manifest } ) => ( manifest?.aliases || [] ).some( ( a ) => a.startsWith( 'xcosb/' ) ) ) );
}

console.log( '== required minimum control sets ==' );
{
	const required = {
		heading: [ 'typography', 'color', 'segmented', 'spacing-box', 'select', 'url-link', 'animation', 'visibility', 'code' ],
		button: [ 'typography', 'color', 'border', 'box-shadow', 'spacing-box', 'segmented', 'url-link', 'transform', 'animation', 'visibility' ],
		image: [ 'media', 'select', 'number-unit', 'border', 'box-shadow', 'spacing-box', 'url-link', 'visibility' ],
		text: [ 'typography', 'color', 'spacing-box', 'segmented', 'visibility' ],
		divider: [ 'select', 'color', 'number-unit', 'slider', 'spacing-box', 'visibility' ],
		container: [
			'layout-picker', 'flex-options', 'column-ratio', 'grid-template', 'gap',
			'alignment-grid', 'spacing-box', 'border', 'box-shadow', 'typography',
			'transform', 'visibility', 'animation', 'code', 'media', 'color',
		],
	};

	Object.entries( required ).forEach( ( [ widget, types ] ) => {
		const found = manifests.find( ( m ) => m.manifest?.widget === widget );
		check( `${ widget } manifest exists`, !! found );
		if ( ! found ) {
			return;
		}
		const missing = types.filter( ( t ) => ! found.manifest.controls.includes( t ) );
		check( `${ widget } declares its minimum set`, missing.length === 0 );
		if ( missing.length ) {
			console.error( `        missing: ${ missing.join( ', ' ) }` );
		}
	} );
}

console.log( '== lookup + audit (schemas/index.js) ==' );
{
	const { manifestFor, manifestControls, auditManifests, WIDGET_MANIFESTS } = registry;

	check( 'registry collects every manifest', WIDGET_MANIFESTS.length === SCHEMA_FILES.length );
	check( 'canonical type resolves', manifestFor( 'xcopb/gb-heading' )?.widget === 'heading' );
	check( 'declared alias resolves', manifestFor( 'xcosb/gb-heading' )?.widget === 'heading' );
	check( 'mirrored legacy prefix resolves', manifestFor( 'xcosb/gb-divider' )?.widget === 'divider' );
	check( 'unknown type resolves to null', manifestFor( 'xcopb/gb-nope' ) === null );
	check( 'helpers expose the control list', manifestControls( 'xcopb/gb-image' ).includes( 'media' ) );
	check( 'no manifest drift reported', auditManifests( knownTypes ).length === 0 );
	if ( auditManifests( knownTypes ).length ) {
		auditManifests( knownTypes ).forEach( ( p ) => console.error( `        ${ p }` ) );
	}
	check( 'audit flags a typo', auditManifests( [ 'color' ] ).some( ( p ) => p.includes( 'unknown controls' ) ) );
	check( 'audit runs against a registry object too', auditManifests( { color: 1, typography: 1 } ).length > 0 );
}

console.log( `\n${ passed } passed, ${ failed } failed` );
process.exit( failed === 0 ? 0 : 1 );
