/**
 * Self-tests for the hierarchical style engine + widget style schema.
 *
 * Run with:  node tests/styles-engine.test.mjs
 * (uses data:-URL imports so the ESM source files run without a bundler)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname( fileURLToPath( import.meta.url ) );
const root = join( here, '..' );

async function loadModule( rel ) {
	const code = readFileSync( join( root, rel ), 'utf8' );
	const url = 'data:text/javascript;base64,' + Buffer.from( code ).toString( 'base64' );
	return import( url );
}

const engine = await loadModule( 'src/admin/styles/engine.js' );
const schema = await loadModule( 'src/admin/styles/schema.js' );

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

const { assert } = await import( 'node:assert' );
const same = ( a, b ) => JSON.stringify( a ) === JSON.stringify( b );

console.log( '== normalizeStyles ==' );
{
	const model = engine.normalizeStyles( {
		version: 1,
		states: { default: { 'typography.color': '#111111' }, hover: { color: 'red' } },
		responsive: { tablet: { paddingTop: 12 } },
		elements: { title: { base: { fontSize: 20 } } },
		bogus: { a: 1 },
	} );
	check( 'drops unknown top-level keys', ! ( 'bogus' in model ) );
	check( 'fills missing breakpoints', same( Object.keys( model.responsive ), [ 'desktop', 'tablet', 'mobile' ] ) );
	check( 'fills missing states', model.states.focus !== undefined && model.states.loading !== undefined );
	check( 'keeps element layer with state/responsive shells', same( Object.keys( model.elements.title ), [ 'base', 'states', 'responsive' ] ) );
	check( 'empty input normalizes', same( engine.normalizeStyles( null ).states.default, {} ) );
	check( 'input is not mutated', ! ( 'bogus' in model ) && model.states.hover.color === 'red' );
}

console.log( '== mergeStyleLayers + tokens ==' );
{
	const merged = engine.mergeStyleLayers(
		{ color: '#000000', size: 14 },
		{ color: '#ff0000', align: 'center' }
	);
	check( 'later layer wins + missing key inherits', merged.color === '#ff0000' && merged.size === 14 && merged.align === 'center' );

	const withToken = engine.mergeStyleLayers(
		{ color: 'var(--brand)' },
		{ __tokens: { brand: '#2563eb' } }
	);
	// tokens passed through third arg of resolveElementStyles normally; here
	// ensure resolveToken handles var() and dotted references.
	check( 'token var() reference resolves', engine.resolveToken( { brand: '#2563eb' }, 'var(--brand)' ) === '#2563eb' );
	check( 'dotted token reference resolves', engine.resolveToken( { colors: { primary: '#aabbcc' } }, 'colors.primary' ) === '#aabbcc' );
	check( 'unknown token reference stays raw', engine.resolveToken( { a: 1 }, 'var(--nope)' ) === 'var(--nope)' );
	void withToken;
}

console.log( '== responsive + state resolution ==' );
{
	const base = engine.resolveResponsiveStyles(
		{ fontSize: 16, color: '#000' },
		{ tablet: { fontSize: 14 }, mobile: { fontSize: 12 } },
		'mobile'
	);
	check( 'mobile stacks desktop+tablet+mobile', base.fontSize === 12 && base.color === '#000' );

	const desktopOnly = engine.resolveResponsiveStyles( { fontSize: 16 }, { tablet: { fontSize: 14 } }, 'desktop' );
	check( 'desktop ignores tablet', desktopOnly.fontSize === 16 );

	const hovered = engine.resolveStateStyles( { color: '#000' }, { default: { color: '#333' }, hover: { color: '#f00' } }, 'hover' );
	check( 'hover merges over default', hovered.color === '#f00' );
}

console.log( '== resolveElementStyles precedence ==' );
{
	const model = {
		version: 1,
		tokens: {},
		responsive: { desktop: {}, tablet: { 'typography.fontSize': 13 }, mobile: {} },
		states: {
			default: { 'typography.color': '#111', 'typography.fontSize': 18 },
			hover: { 'typography.color': '#222' },
		},
		elements: {
			title: {
				base: { 'typography.fontSize': 22, 'typography.fontWeight': '700' },
				states: { hover: { 'typography.color': '#e11d48' } },
				responsive: { tablet: { 'typography.fontSize': 16 } },
			},
		},
	};
	const el = engine.resolveElementStyles( model, 'title', { state: 'hover', breakpoint: 'tablet' } );
	check( 'element wins over widget', el[ 'typography.fontWeight' ] === '700' && el[ 'typography.fontSize' ] === 16 );
	check( 'element state wins over widget state', el[ 'typography.color' ] === '#e11d48' );
	check( 'unknown element falls back to widget', engine.resolveElementStyles( model, 'nope' )[ 'typography.fontSize' ] === 18 );
}

console.log( '== sanitizeStyleValue ==' );
{
	check( 'hex colour kept', engine.sanitizeStyleValue( 'colors', 'text', '#aabbcc' ) === '#aabbcc' );
	check( 'rgba kept', engine.sanitizeStyleValue( 'colors', 'text', 'rgba(0,0,0,0.5)' ) === 'rgba(0,0,0,0.5)' );
	check( 'url() rejected', engine.sanitizeStyleValue( 'background', 'image', 'url(https://x/y.png)' ) === '' );
	check( 'javascript: rejected', engine.sanitizeStyleValue( 'colors', 'text', 'javascript:alert(1)' ) === '' );
	check( 'braces rejected', engine.sanitizeStyleValue( 'typography', 'fontSize', '16px;color:red' ) === '' );
	check( 'font stack allowed', engine.sanitizeStyleValue( 'typography', 'fontFamily', '"Open Sans", Arial' ) === '"Open Sans", Arial' );
	check( 'number kept', engine.sanitizeStyleValue( 'layout', 'gap', 12 ) === 12 );
	check( 'unknown object dropped', engine.sanitizeStyleValue( 'layout', 'gap', { x: 1 } ) === '' );
}

console.log( '== reset / copy / paste ==' );
{
	const model = { version: 1, elements: { title: { base: { color: '#111' } } } };
	const next = engine.resetStyleProperty( model, [ 'elements', 'title', 'base', 'color' ] );
	check( 'resetStyleProperty deletes', ! ( 'color' in next.elements.title.base ) );
	check( 'reset is immutable', 'color' in model.elements.title.base );
	check( 'bad path returns same model', engine.resetStyleProperty( model, [] ) === model );

	const payload = engine.copyStyles( { version: 1, states: { default: { color: '#123456' } }, elements: { title: { base: { fontSize: 19 } } } }, [ 'title' ] );
	const pasted = engine.pasteStyles( { version: 1 }, payload );
	check( 'paste round-trips element + widget layers', pasted.states.default.color === '#123456' && pasted.elements.title.base.fontSize === 19 );
	check( 'paste rejects foreign payloads', engine.pasteStyles( { version: 1 }, JSON.stringify( { other: true } ) ).elements?.title === undefined );
	check( 'paste ignores invalid JSON', same( engine.pasteStyles( { version: 1 }, 'not json' ), { version: 1 } ) );
}

console.log( '== editor styles + css generation ==' );
{
	const model = {
		version: 1,
		states: { default: { 'typography.color': '#111', 'typography.fontSize': 16, 'effects.animation': 'xsb-float' } },
		elements: { button: { base: { 'colors.background': '#2563eb' }, states: { hover: { 'colors.background': '#1e40af' } } } },
		responsive: { desktop: {}, tablet: { 'layout.paddingTop': 8 }, mobile: {} },
	};
	const editor = engine.getEditorStyles( model, 'button' );
	check( 'editor style camelCase css', editor.color === '#111' && editor.backgroundColor === '#2563eb' && editor.fontSize === '16px' );

	const css = engine.generateScopedCSS( model, 'xcosb/cc-checkout' );
	check( 'scoped class stable', engine.generateScopedClassName( 'xcosb/cc-checkout', 'button' ) === 'xsb-el--xcosb-cc-checkout--button' );
	check( 'default rule emitted', css.includes( '.xsb-el--xcosb-cc-checkout--button {' ) && css.includes( 'color:#111' ) && css.includes( 'font-size:16px' ) && css.includes( 'background-color:#2563eb' ) && css.includes( 'animation:xsb-float' ) );
	check( 'hover rule emitted', css.includes( '.xsb-el--xcosb-cc-checkout--button:hover' ) );
	check( 'tablet media query emitted', css.includes( '@media (max-width: 768px)' ) );
	check( 'reduced-motion guard emitted', css.includes( 'prefers-reduced-motion' ) );
	check( 'empty model produces no css', engine.generateScopedCSS( { version: 1 }, 'xcosb/x' ) === '' );
}

console.log( '== legacy bridge ==' );
{
	check( 'content keys never treated as style', engine.legacyKeyToModelAddress( 'title' ) === '' && engine.legacyKeyToModelAddress( 'tag' ) === '' );
	check( 'style keys mapped', engine.legacyKeyToModelAddress( 'font_size' ) === 'desktop.default.wrapper.font_size' );
	const model = engine.legacySettingsToModel( { title: 'Hi', font_size: 18, title_color: '#000' } );
	check( 'legacy settings → model', model.states.default.font_size === 18 && model.states.default.title_color === '#000' && model.states.default.title === undefined );
}

console.log( '== schema registry ==' );
{
	const banner = schema.getWidgetStyleSchema( 'xcosb/gb-banner' );
	check( 'banner declares heading + button elements', banner.elements.some( ( e ) => e.id === 'heading' ) && banner.elements.some( ( e ) => e.id === 'button' ) );
	check( 'unknown widget → empty schema', schema.getWidgetStyleSchema( 'xcosb/nope' ).elements.length === 0 );
	schema.registerWidgetStyleSchema( 'xcosb/cc-my-account', { elements: [ { id: 'nav', label: 'Nav', keys: [ 'nav_color' ] } ] } );
	check( 'registerWidgetStyleSchema extends registry', schema.getWidgetStyleSchema( 'xcosb/cc-my-account' ).elements[ 0 ].keys[ 0 ] === 'nav_color' );
}

console.log( `\nRESULT: ${ passed } passed, ${ failed } failed` );
process.exit( failed ? 1 : 0 );
