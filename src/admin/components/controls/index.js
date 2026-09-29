/**
 * Control Registry for Xcodesol Page Builder.
 * Maps control type strings → lazy-loaded React components with Suspense.
 * Every type used in any schema or inspector must be listed here.
 *
 * Naming rules:
 *  - Primary key  = the canonical type string (matches the file name)
 *  - Alias keys   = schema shorthands / legacy names → reuse the same lazy chunk
 *
 * @package Xcodesol_Page_Builder
 */

import { lazy, Suspense } from '@wordpress/element';
import './controls.css';

export { default as ControlBase } from './control-base';

// ---------------------------------------------------------------------------
// Lazy control factories (one webpack chunk per file)
// ---------------------------------------------------------------------------
const _segmented    = lazy( () => import( /* webpackChunkName: "ctrl-segmented"    */ './segmented'    ) );
const _presetChips  = lazy( () => import( /* webpackChunkName: "ctrl-preset-chips" */ './preset-chips' ) );
const _numberUnit   = lazy( () => import( /* webpackChunkName: "ctrl-number-unit"  */ './number-unit'  ) );
const _number       = lazy( () => import( /* webpackChunkName: "ctrl-number"       */ './number'       ) );
const _slider       = lazy( () => import( /* webpackChunkName: "ctrl-slider"       */ './slider'       ) );
const _select       = lazy( () => import( /* webpackChunkName: "ctrl-select"       */ './select'       ) );
const _toggle       = lazy( () => import( /* webpackChunkName: "ctrl-toggle"       */ './toggle'       ) );
const _text         = lazy( () => import( /* webpackChunkName: "ctrl-text"         */ './text'         ) );
const _textarea     = lazy( () => import( /* webpackChunkName: "ctrl-textarea"     */ './textarea'     ) );
const _color        = lazy( () => import( /* webpackChunkName: "ctrl-color"        */ './color'        ) );
const _gradient     = lazy( () => import( /* webpackChunkName: "ctrl-gradient"     */ './gradient'     ) );
const _media        = lazy( () => import( /* webpackChunkName: "ctrl-media"        */ './media'        ) );
const _spacingBox   = lazy( () => import( /* webpackChunkName: "ctrl-spacing-box"  */ './spacing-box'  ) );
const _border       = lazy( () => import( /* webpackChunkName: "ctrl-border"       */ './border'       ) );
const _boxShadow    = lazy( () => import( /* webpackChunkName: "ctrl-box-shadow"   */ './box-shadow'   ) );
const _typography   = lazy( () => import( /* webpackChunkName: "ctrl-typography"   */ './typography'   ) );
const _layoutPicker = lazy( () => import( /* webpackChunkName: "ctrl-layout-picker"*/ './layout-picker') );
const _columnRatio  = lazy( () => import( /* webpackChunkName: "ctrl-column-ratio" */ './column-ratio' ) );
const _gridTemplate = lazy( () => import( /* webpackChunkName: "ctrl-grid-template"*/ './grid-template') );
const _alignmentGrid= lazy( () => import( /* webpackChunkName: "ctrl-alignment-grid"*/'./alignment-grid') );
const _flexOptions  = lazy( () => import( /* webpackChunkName: "ctrl-flex-options" */ './flex-options' ) );
const _gap          = lazy( () => import( /* webpackChunkName: "ctrl-gap"          */ './gap'          ) );
const _transform    = lazy( () => import( /* webpackChunkName: "ctrl-transform"    */ './transform'    ) );
const _visibility   = lazy( () => import( /* webpackChunkName: "ctrl-visibility"   */ './visibility'   ) );
const _urlLink      = lazy( () => import( /* webpackChunkName: "ctrl-url-link"     */ './url-link'     ) );
const _animation    = lazy( () => import( /* webpackChunkName: "ctrl-animation"    */ './animation'    ) );
const _code         = lazy( () => import( /* webpackChunkName: "ctrl-code"         */ './code'         ) );
const _repeater     = lazy( () => import( /* webpackChunkName: "ctrl-repeater"     */ './repeater'     ) );

// ---------------------------------------------------------------------------
// Registry map  (type string → lazy component)
// ---------------------------------------------------------------------------
const CONTROL_REGISTRY = {
	// ── Segmented / Choose ─────────────────────────────────────────────────
	segmented:       _segmented,
	choose:          _segmented,   // alias used in schemas

	// ── Preset Chips ───────────────────────────────────────────────────────
	'preset-chips':  _presetChips,

	// ── Number / Unit ──────────────────────────────────────────────────────
	'number-unit':   _numberUnit,
	number:          _number,

	// ── Slider ─────────────────────────────────────────────────────────────
	slider:          _slider,

	// ── Select (dropdown) ──────────────────────────────────────────────────
	select:          _select,

	// ── Toggle (checkbox) ──────────────────────────────────────────────────
	toggle:          _toggle,

	// ── Text / URL / Textarea ───────────────────────────────────────────────
	text:            _text,
	textarea:        _textarea,
	url:             _text,        // alias
	email:           _text,        // alias
	video:           _text,        // schema uses 'video' as a URL text field
	image:           _media,       // schema uses 'image' as synonym for media


	// ── Color ──────────────────────────────────────────────────────────────
	color:           _color,

	// ── Gradient ───────────────────────────────────────────────────────────
	gradient:        _gradient,

	// ── Media (image / file picker) ────────────────────────────────────────
	media:           _media,

	// ── Spacing Box (dimensions / padding / margin) ────────────────────────
	'spacing-box':   _spacingBox,
	dimensions:      _spacingBox,  // alias used in schemas
	gap:             _gap,

	// ── Border ─────────────────────────────────────────────────────────────
	border:          _border,

	// ── Box Shadow ─────────────────────────────────────────────────────────
	'box-shadow':    _boxShadow,
	box_shadow:      _boxShadow,   // alias — underscore variant used in schemas
	shadow:          _boxShadow,   // alias

	// ── Typography ─────────────────────────────────────────────────────────
	typography:      _typography,

	// ── Layout Picker ──────────────────────────────────────────────────────
	'layout-picker': _layoutPicker,

	// ── Column Ratio ───────────────────────────────────────────────────────
	'column-ratio':  _columnRatio,

	// ── Grid Template ──────────────────────────────────────────────────────
	'grid-template': _gridTemplate,
	grid:            _gridTemplate, // alias

	// ── Alignment Grid ─────────────────────────────────────────────────────
	'alignment-grid': _alignmentGrid,
	alignment:        _alignmentGrid, // alias

	// ── Flex Options ───────────────────────────────────────────────────────
	'flex-options':  _flexOptions,
	flex:            _flexOptions,  // alias

	// ── Transform ──────────────────────────────────────────────────────────
	transform:       _transform,

	// ── Responsive Visibility ──────────────────────────────────────────────
	visibility:      _visibility,

	// ── URL / Link ─────────────────────────────────────────────────────────
	'url-link':      _urlLink,
	link:            _urlLink,      // alias

	// ── Animation ──────────────────────────────────────────────────────────
	animation:       _animation,

	// ── Code / CSS ─────────────────────────────────────────────────────────
	code:            _code,
	css:             _code,         // alias

	// ── Repeater ───────────────────────────────────────────────────────────
	repeater:        _repeater,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the control type is known to the registry.
 *
 * @param {string} type Control type string.
 * @return {boolean}
 */
export function hasControl( type ) {
	return Boolean( CONTROL_REGISTRY[ type ] );
}

/**
 * Control types rendered by the inspector's built-in fallback switch instead
 * of a lazy chunk. They are valid in a manifest but have no registry entry,
 * so `hasControl()` deliberately stays false for them.
 */
export const BUILTIN_CONTROL_TYPES = [
	'text',
	'textarea',
	'number',
	'slider',
	'select',
	'choose',
	'toggle',
	'color',
	'gradient',
	'media',
	'dimensions',
	'box_shadow',
	'border',
	'typography',
	'repeater',
	'code',
];

/**
 * Every control type the editor can render — lazy chunks plus the built-in
 * fallbacks. Used by the dev-mode manifest audit, not by rendering.
 *
 * @return {Array<string>} Sorted control type strings.
 */
export function knownControlTypes() {
	return [ ...new Set( [ ...Object.keys( CONTROL_REGISTRY ), ...BUILTIN_CONTROL_TYPES ] ) ].sort();
}

/**
 * Fallback skeleton shown while a lazy control chunk is downloading.
 */
function ControlSkeleton() {
	return (
		<div className="xsb-control-skeleton" aria-hidden="true">
			<div className="xsb-skeleton-label" />
			<div className="xsb-skeleton-input" />
		</div>
	);
}

/**
 * Render a control by type with Suspense.
 * Emits a dev-mode warning when an unknown control type is encountered.
 *
 * @param {string} type     Control type string.
 * @param {Object} props    Props forwarded to the control component.
 * @param {Object} manifest Optional widget manifest for dev-mode validation.
 * @return {JSX.Element}
 */
export function renderControl( type, props, manifest ) {
	const LazyComponent = CONTROL_REGISTRY[ type ];

	if ( process.env.NODE_ENV !== 'production' ) {
		if ( manifest && Array.isArray( manifest.controls ) && ! manifest.controls.includes( type ) ) {
			// eslint-disable-next-line no-console
			console.warn(
				`[XSB] Widget "${ manifest.widget || 'unknown' }" uses control "${ type }" which is not declared in its manifest.`,
				manifest.controls
			);
		}
		if ( ! LazyComponent ) {
			// eslint-disable-next-line no-console
			console.warn( `[XSB] Unregistered control type: "${ type }"` );
		}
	}

	if ( ! LazyComponent ) {
		return (
			<div
				className="xsb-control-unknown"
				style={ { fontSize: '11px', color: '#ef4444', padding: '6px 0' } }
			>
				Unknown control: &ldquo;{ type }&rdquo;
			</div>
		);
	}

	return (
		<Suspense fallback={ <ControlSkeleton /> }>
			<LazyComponent { ...props } />
		</Suspense>
	);
}

export default CONTROL_REGISTRY;
