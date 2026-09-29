/**
 * Style engine — the single source of truth for the hierarchical style
 * model used across the builder.
 *
 * Every widget's styles live in a versioned document:
 *
 *   {
 *     version: 1,
 *     tokens:  {},                       // design tokens (site level)
 *     responsive: { desktop:{}, tablet:{}, mobile:{} },
 *     states:  { default:{}, hover:{}, active:{}, focus:{}, focusVisible:{}, disabled:{} },
 *     elements:{ wrapper:{}, title:{}, price:{}, button:{} }
 *   }
 *
 * Resolution order (low → high precedence, each an overlay layer):
 *   design tokens  →  widget defaults  →  widget override  →  element override
 *   →  state (hover…)  →  breakpoint (tablet/mobile)
 *
 * A key is *inherited* when the topmost layer does not define it, so the
 * inspector can show where every value comes from.
 *
 * @package WooCommerce_Template_Builder
 */

export const STYLE_MODEL_VERSION = 1;

export const BREAKPOINTS = [ 'desktop', 'tablet', 'mobile' ];
export const DEFAULT_BREAKPOINT = 'desktop';

export const STATES = [
	'default', 'hover', 'active', 'focus', 'focusVisible', 'disabled', 'selected', 'loading',
];
export const DEFAULT_STATE = 'default';

/** Known group ids. New group = new entry in this list + a css props map. */
export const CONTROL_GROUPS = [
	'layout', 'spacing', 'dimensions', 'typography', 'colors', 'background',
	'border', 'radius', 'shadow', 'effects', 'responsive', 'visibility', 'advanced',
];

export const GROUP_LABELS = {
	layout: 'Layout',
	spacing: 'Spacing',
	dimensions: 'Dimensions',
	typography: 'Typography',
	colors: 'Colors',
	background: 'Background',
	border: 'Border',
	radius: 'Border radius',
	shadow: 'Shadow',
	effects: 'Effects',
	responsive: 'Responsive',
	visibility: 'Visibility',
	advanced: 'Advanced',
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function isPlainObject( value ) {
	return value !== null && typeof value === 'object' && ! Array.isArray( value );
}

function isDefined( value ) {
	return value !== undefined && value !== null && value !== '';
}

function deepClone( value ) {
	return isPlainObject( value ) || Array.isArray( value ) ? JSON.parse( JSON.stringify( value ) ) : value;
}

function deepMerge( ...layers ) {
	const out = {};
	const mergeOne = ( src ) => {
		if ( ! isPlainObject( src ) ) {
			return;
		}
		Object.keys( src ).forEach( ( key ) => {
			const value = src[ key ];
			if ( isPlainObject( value ) && isPlainObject( out[ key ] ) ) {
				deepMerge( out[ key ], value );
			} else if ( isDefined( value ) ) {
				out[ key ] = deepClone( value );
			}
		} );
	};
	layers.forEach( mergeOne );
	return out;
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

/**
 * Normalize any input into a valid style model. Unknown top-level keys are
 * dropped, so future model additions stay backward compatible.
 *
 * @param {Object} input Raw model (may be partial or missing).
 * @return {Object} Normalized model.
 */
export function normalizeStyles( input ) {
	const src = isPlainObject( input ) ? input : {};

	const responsive = {};
	BREAKPOINTS.forEach( ( bp ) => {
		responsive[ bp ] = isPlainObject( src.responsive?.[ bp ] ) ? deepClone( src.responsive[ bp ] ) : {};
	} );

	const states = {};
	STATES.forEach( ( state ) => {
		states[ state ] = isPlainObject( src.states?.[ state ] ) ? deepClone( src.states[ state ] ) : {};
	} );

	const elements = {};
	if ( isPlainObject( src.elements ) ) {
		Object.keys( src.elements ).forEach( ( name ) => {
			const layer = src.elements[ name ];
			if ( isPlainObject( layer ) ) {
				elements[ name ] = {
					base: isPlainObject( layer.base ) ? deepClone( layer.base ) : {},
					states: {},
					responsive: {},
				};
				STATES.forEach( ( state ) => {
					elements[ name ].states[ state ] = isPlainObject( layer.states?.[ state ] )
						? deepClone( layer.states[ state ] )
						: {};
				} );
				BREAKPOINTS.forEach( ( bp ) => {
					elements[ name ].responsive[ bp ] = isPlainObject( layer.responsive?.[ bp ] )
						? deepClone( layer.responsive[ bp ] )
						: {};
				} );
			}
		} );
	}

	return {
		version: Number( src.version ) || STYLE_MODEL_VERSION,
		tokens: isPlainObject( src.tokens ) ? deepClone( src.tokens ) : {},
		responsive,
		states,
		elements,
	};
}

/**
 * The widget-level override layer (everything that is not an element).
 *
 * @param {Object} model Style model.
 * @return {Object} Overlay { base, states, responsive }.
 */
export function widgetOverrideLayer( model ) {
	const normalized = normalizeStyles( model );
	return {
		base: normalized.states.default,
		states: normalized.states,
		responsive: normalized.responsive,
	};
}

/* ------------------------------------------------------------------ *
 * Tokens
 * ------------------------------------------------------------------ */

/**
 * Resolve a design token reference ("var(--xsb-color-primary)" or the bare
 * name "color.primary") against the model's token table. Returns the raw
 * value when no token is referenced.
 *
 * Token table shape (nested groups are flattened on lookup):
 *   { colors:{ primary:'#2563eb' }, spacing:{ 4:'4px' } }
 *
 * @param {Object} tokens Token table.
 * @param {*}     value  Value that may reference a token.
 * @return {*} Resolved value.
 */
export function resolveToken( tokens, value ) {
	if ( typeof value !== 'string' || ! isPlainObject( tokens ) ) {
		return value;
	}

	const flat = {};
	const walk = ( obj, path ) => {
		Object.keys( obj ).forEach( ( key ) => {
			const next = obj[ key ];
			if ( isPlainObject( next ) ) {
				walk( next, path ? `${ path }.${ key }` : key );
			} else {
				flat[ path ? `${ path }.${ key }` : key ] = next;
			}
		} );
	};
	walk( tokens, '' );

	const ref = value.match( /^\s*(?:var\(\s*--)?([\w.-]+)\s*\)?\s*$/ );
	const bare = value.match( /^([\w.]+)\.([\w.-]+)$/ );

	let key = null;
	if ( ref && flat[ ref[ 1 ] ] !== undefined ) {
		key = ref[ 1 ];
	} else if ( bare && flat[ value ] !== undefined ) {
		key = value;
	}
	return key !== null ? flat[ key ] : value;
}

/* ------------------------------------------------------------------ *
 * Resolution
 * ------------------------------------------------------------------ */

/**
 * Merge overlay layers for one style object, resolving token references at
 * each step so local overrides can re-reference tokens.
 *
 * @param {Object} layers Style layers, later wins.
 * @return {Object} Resolved style object.
 */
export function mergeStyleLayers( ...layers ) {
	const tokenized = layers.map( ( layer, index ) => {
		if ( ! isPlainObject( layer ) ) {
			return {};
		}
		const tokens = isPlainObject( layers.tokens ) ? layers.tokens : {};
		const out = {};
		Object.keys( layer ).forEach( ( key ) => {
			out[ key ] = index === 0 ? resolveToken( tokens, layer[ key ] ) : layer[ key ];
		} );
		return out;
	} );
	return deepMerge( ...tokenized );
}

/**
 * Pick the responsive values for one breakpoint.
 *
 * @param {Object} base      Base style values.
 * @param {Object} responsive { desktop:{}, tablet:{}, mobile:{} }.
 * @param {string} breakpoint Which breakpoint (desktop/tablet/mobile).
 * @return {Object} Merged values (breakpoint overlays base).
 */
export function resolveResponsiveStyles( base, responsive, breakpoint = DEFAULT_BREAKPOINT ) {
	const list = BREAKPOINTS.slice( 0, BREAKPOINTS.indexOf( breakpoint ) + 1 );
	const layers = [ isPlainObject( base ) ? base : {} ];
	list.forEach( ( bp ) => {
		if ( isPlainObject( responsive?.[ bp ] ) ) {
			layers.push( responsive[ bp ] );
		}
	} );
	return deepMerge( ...layers );
}

/**
 * Pick the values for one pseudo state over the base.
 *
 * @param {Object} base  Default values.
 * @param {Object} stateMap { default:{}, hover:{} … }.
 * @param {string} state Which state (default/hover/active/…).
 * @return {Object} Merged values.
 */
export function resolveStateStyles( base, stateMap, state = DEFAULT_STATE ) {
	return deepMerge(
		isPlainObject( base ) ? base : {},
		isPlainObject( stateMap?.[ DEFAULT_STATE ] ) ? stateMap[ DEFAULT_STATE ] : {},
		state && state !== DEFAULT_STATE && isPlainObject( stateMap?.[ state ] ) ? stateMap[ state ] : {}
	);
}

/**
 * Resolve the full effective style of one element at a given breakpoint and
 * state. Precedence: tokens → widget base → element base → element state →
 * element responsive.
 *
 * @param {Object} model   Style model.
 * @param {string} element Element id ('wrapper' when none).
 * @param {Object} options { breakpoint, state }.
 * @return {Object} Effective CSS value object (flat, camelCase css props).
 */
export function resolveElementStyles( model, element = 'wrapper', options = {} ) {
	const normalized = normalizeStyles( model );
	const { breakpoint = DEFAULT_BREAKPOINT, state = DEFAULT_STATE } = options;

	const tokens = isPlainObject( normalized.tokens ) ? normalized.tokens : {};
	const widget = {
		base: normalized.states.default,
		states: normalized.states,
		responsive: normalized.responsive,
	};
	const el = normalized.elements[ element ] || { base: {}, states: {}, responsive: {} };

	const widgetForState = resolveStateStyles( widget.base, widget.states, state );
	const widgetResolved = resolveResponsiveStyles( widgetForState, widget.responsive, breakpoint );
	const elForState = resolveStateStyles( el.base, el.states, state );
	const elResolved = resolveResponsiveStyles( elForState, el.responsive, breakpoint );

	return mergeStyleLayers( widgetResolved, elResolved, { tokens } );
}

/* ------------------------------------------------------------------ *
 * CSS generation
 * ------------------------------------------------------------------ */

/**
 * Property map: group id → css properties. Kept in one place so the editor
 * preview (camelCase) and the frontend generator (kebab-case) agree.
 * Each entry maps a *semantic key* to the CSS property it drives.
 */
export const CSS_PROPERTY_MAP = {
	layout: {
		display: 'display',
		width: 'width',
		minWidth: 'min-width',
		maxWidth: 'max-width',
		height: 'height',
		minHeight: 'min-height',
		maxHeight: 'max-height',
		position: 'position',
		overflow: 'overflow',
		zIndex: 'z-index',
		flexDirection: 'flex-direction',
		flexWrap: 'flex-wrap',
		justifyContent: 'justify-content',
		alignItems: 'align-items',
		gap: 'gap',
		gridColumns: 'grid-template-columns',
		rowGap: 'row-gap',
		columnGap: 'column-gap',
	},
	spacing: {
		marginTop: 'margin-top',
		marginRight: 'margin-right',
		marginBottom: 'margin-bottom',
		marginLeft: 'margin-left',
		paddingTop: 'padding-top',
		paddingRight: 'padding-right',
		paddingBottom: 'padding-bottom',
		paddingLeft: 'padding-left',
	},
	dimensions: {
		width: 'width',
		minWidth: 'min-width',
		maxWidth: 'max-width',
		height: 'height',
		minHeight: 'min-height',
		maxHeight: 'max-height',
	},
	typography: {
		fontFamily: 'font-family',
		fontSize: 'font-size',
		fontWeight: 'font-weight',
		fontStyle: 'font-style',
		lineHeight: 'line-height',
		letterSpacing: 'letter-spacing',
		wordSpacing: 'word-spacing',
		textAlign: 'text-align',
		textTransform: 'text-transform',
		textDecoration: 'text-decoration',
		color: 'color',
		textShadow: 'text-shadow',
		maxWidth: 'max-width',
		overflow: 'overflow',
	},
	colors: {
		text: 'color',
		background: 'background-color',
		link: '--xsb-color-link',
		hover: '--xsb-color-hover',
		active: '--xsb-color-active',
		focus: '--xsb-color-focus',
		disabled: '--xsb-color-disabled',
		icon: '--xsb-color-icon',
		border: '--xsb-color-border',
		placeholder: '--xsb-color-placeholder',
		overlay: '--xsb-color-overlay',
	},
	background: {
		color: 'background-color',
		gradient: 'background-image',
		image: 'background-image',
		imagePosition: 'background-position',
		imageSize: 'background-size',
		repeat: 'background-repeat',
		attachment: 'background-attachment',
		focalPoint: 'background-position',
		overlayColor: '--xsb-bg-overlay-color',
		overlayOpacity: '--xsb-bg-overlay-opacity',
	},
	border: {
		style: 'border-style',
		widthTop: 'border-top-width',
		widthRight: 'border-right-width',
		widthBottom: 'border-bottom-width',
		widthLeft: 'border-left-width',
		color: 'border-color',
		outlineStyle: 'outline-style',
		outlineWidth: 'outline-width',
		outlineColor: 'outline-color',
		outlineOffset: 'outline-offset',
	},
	radius: {
		topLeft: 'border-top-left-radius',
		topRight: 'border-top-right-radius',
		bottomRight: 'border-bottom-right-radius',
		bottomLeft: 'border-bottom-left-radius',
	},
	shadow: {
		preset: 'box-shadow',
		offsetX: 'box-shadow',
		offsetY: 'box-shadow',
		blur: 'box-shadow',
		spread: 'box-shadow',
		color: 'box-shadow',
		inset: 'box-shadow',
	},
	effects: {
		animation: 'animation',
		animationDuration: 'animation-duration',
		animationDelay: 'animation-delay',
		transitionDuration: 'transition-duration',
		transitionEasing: 'transition-timing-function',
		opacity: 'opacity',
		cursor: 'cursor',
		transform: 'transform',
	},
	visibility: {
		display: 'display',
		visibility: 'visibility',
		opacity: 'opacity',
		pointerEvents: 'pointer-events',
	},
	advanced: {
		zIndex: 'z-index',
		position: 'position',
	},
};

function unitSuffix( key ) {
	const lengthKeys = new Set( [
		'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
		'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
		'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
		'fontSize', 'letterSpacing', 'wordSpacing', 'gap', 'rowGap', 'columnGap',
		'widthTop', 'widthRight', 'widthBottom', 'widthLeft', 'outlineWidth', 'outlineOffset',
		'topLeft', 'topRight', 'bottomRight', 'bottomLeft',
		'offsetX', 'offsetY', 'blur', 'spread',
	] );
	return lengthKeys.has( key ) ? 'px' : '';
}

/**
 * Sanitize one style value for a group/key: only known types allowed.
 *
 * @param {string} group Control group id.
 * @param {string} key   Semantic key.
 * @param {*}     value  Raw value.
 * @return {*} Safe value ('' for invalid / unknown).
 */
export function sanitizeStyleValue( group, key, value ) {
	if ( value === undefined || value === null ) {
		return '';
	}
	if ( typeof value === 'number' ) {
		return Number.isFinite( value ) ? value : '';
	}
	if ( typeof value !== 'string' ) {
		return '';
	}
	const trimmed = value.trim();
	if ( trimmed === '' ) {
		return '';
	}

	// Colour-ish values: hex / rgba() / named subset. Anything containing
	// url(), var() other than our token references, or CSS brackets is out.
	if ( /(color|shadow|background|text|border|overlay|focal)/.test( group + key ) || /color/i.test( key ) ) {
		if ( /^#[0-9a-fA-F]{3,8}$/.test( trimmed ) || /^rgba?\([0-9.,\s%]+\)$/.test( trimmed ) ) {
			return trimmed;
		}
		const named = [ 'transparent', 'currentColor', 'inherit', 'white', 'black', 'red', 'green', 'blue' ];
		return named.includes( trimmed.toLowerCase() ) ? trimmed : '';
	}

	if ( /[;{}]/.test( trimmed ) || /url\(/.test( trimmed ) ) {
		return '';
	}

	// Font stacks may contain quotes and commas.
	if ( /font/i.test( group + key ) && /family/i.test( key ) ) {
		return trimmed.slice( 0, 200 );
	}

	// Everything else: printable characters only.
	return /^[\x20-\x7E]+$/.test( trimmed ) ? trimmed.slice( 0, 200 ) : '';
}

/**
 * Turn one group object into camelCase css props for the editor preview.
 *
 * @param {Object} model       Style model.
 * @param {string} element     Element id.
 * @param {Object} options     { breakpoint, state, defaults }.
 * @param {Object} options.defaults Optional map key → css value fallback.
 * @return {Object} React inline style.
 */
export function getEditorStyles( model, element = 'wrapper', options = {} ) {
	const { defaults } = options;
	const resolved = resolveElementStyles( model, element, options );
	const out = {};
	const map = CSS_PROPERTY_MAP;

	Object.keys( resolved ).forEach( ( key ) => {
		const value = resolved[ key ];
		if ( ! isDefined( value ) ) {
			return;
		}
		const parts = key.split( '.' );
		const group = parts[ 0 ];
		const semantic = parts[ 1 ];
		const cssProp = map[ group ]?.[ semantic ];
		if ( ! cssProp || cssProp.startsWith( '--' ) ) {
			if ( cssProp && cssProp.startsWith( '--' ) ) {
				out[ cssProp ] = String( value );
			}
			return;
		}
		const unit = unitSuffix( semantic );
		// React inline styles need camelCase keys; CSS custom props stay as-is.
		const styleKey = cssProp.startsWith( '--' )
			? cssProp
			: cssProp.replace( /-([a-z])/g, ( _m, c ) => c.toUpperCase() );
		out[ styleKey ] = typeof value === 'number' && unit ? `${ value }${ unit }` : String( value );
	} );

	// Merged presets: shadow/background handled as whole-value keys below.
	if ( defaults ) {
		Object.keys( defaults ).forEach( ( cssProp ) => {
			if ( out[ cssProp ] === undefined ) {
				out[ cssProp ] = defaults[ cssProp ];
			}
		} );
	}

	return out;
}

/**
 * Serialize resolved css values with css prop names for output.
 *
 * @param {Object} styleObject camelCase css object (from getEditorStyles).
 * @return {string} Inline style attribute value.
 */
export function cssObjectToCssText( styleObject ) {
	return Object.keys( styleObject )
		.map( ( prop ) => `${ prop.replace( /[A-Z]/g, ( m ) => `-${ m.toLowerCase() }` ) }:${ styleObject[ prop ] }` )
		.join( ';' );
}

/* ------------------------------------------------------------------ *
 * Scoped classes + css
 * ------------------------------------------------------------------ */

/**
 * Stable scoped class name for one widget element. Deterministic so the
 * PHP renderer can output the same class without knowing the instance.
 *
 * @param {string} type    Block type (xcosb/sp-title…).
 * @param {string} element Element id.
 * @return {string} Class name.
 */
export function generateScopedClassName( type, element = 'wrapper' ) {
	const slug = String( type ).replace( /[^a-z0-9]+/gi, '-' ).replace( /^-+|-+$/g, '' );
	return `xsb-el--${ slug }--${ String( element ).replace( /[^a-z0-9]/gi, '-' ) }`;
}

/**
 * Generate the CSS text for every element/state/breakpoint of a model.
 * Only emits rules for values actually present (no default bloat), wraps
 * hover/focus/… in pseudo selectors, tablet/mobile in media queries and
 * honours prefers-reduced-motion for animation/transition values.
 *
 * @param {Object} model       Style model.
 * @param {string} type        Block type (for the scoped class).
 * @param {Object} options     { stateOrder, selector }.
 * @return {string} CSS text.
 */
export function generateScopedCSS( model, type, options = {} ) {
	const normalized = normalizeStyles( model );
	const elementNames = Object.keys( normalized.elements ).length
		? Object.keys( normalized.elements )
		: [ 'wrapper' ];
	const selector = options.selector || null;

	let css = '';

	elementNames.forEach( ( element ) => {
		const scope = generateScopedClassName( type, element );
		const target = selector ? `${ selector } .${ scope }` : `.${ scope }`;

		const writeRule = ( state, stylesText, breakpoint ) => {
			if ( ! stylesText ) {
				return;
			}
			let rule = '';
			if ( state && state !== 'default' ) {
				const pseudo = {
					hover: ':hover', active: ':active', focus: ':focus',
					focusVisible: ':focus-visible', disabled: ':disabled',
					selected: '.is-selected', loading: '.is-loading',
				}[ state ];
				if ( pseudo ) {
					rule += `${ target }${ pseudo } { ${ stylesText } }`;
				}
			} else {
				rule += `${ target } { ${ stylesText } }`;
			}

			if ( /animation|transition/.test( stylesText ) ) {
				rule += `\n@media (prefers-reduced-motion: reduce) {\n\t${ target }${ state && state !== 'default' ? ( { hover: ':hover', focus: ':focus', focusVisible: ':focus-visible', active: ':active', disabled: ':disabled', selected: '.is-selected', loading: '.is-loading' } )[ state ] || '' : '' } { animation: none !important; transition: none !important; }\n}`;
			}

			if ( breakpoint && breakpoint !== 'desktop' ) {
				const bp = { tablet: '768px', mobile: '480px' }[ breakpoint ];
				css += `\n@media (max-width: ${ bp }) {\n\t${ rule }\n}`;
			} else {
				css += `\n${ rule }`;
			}
		};

		BREAKPOINTS.forEach( ( breakpoint ) => {
			STATES.forEach( ( state ) => {
				const style = getEditorStyles( normalized, element, { breakpoint, state } );
				const text = cssObjectToCssText( style );
				writeRule( state, text, breakpoint );
			} );
		} );
	} );

	return css.trim();
}

/* ------------------------------------------------------------------ *
 * Reset / copy / paste
 * ------------------------------------------------------------------ */

/**
 * Remove one key at a path inside the model (immutable update).
 *
 * @param {Object} model Model.
 * @param {Array}  path  Path of keys, e.g. ['elements','title','base','color'].
 * @return {Object} New model without that value.
 */
export function resetStyleProperty( model, path ) {
	if ( ! Array.isArray( path ) || ! path.length ) {
		return model;
	}
	const next = deepClone( model );
	let cursor = next;
	for ( let i = 0; i < path.length - 1; i += 1 ) {
		if ( ! isPlainObject( cursor[ path[ i ] ] ) ) {
			return model;
		}
		cursor = cursor[ path[ i ] ];
	}
	delete cursor[ path[ path.length - 1 ] ];
	return next;
}

/**
 * Serialize the style layers of chosen elements into a clipboard payload.
 *
 * @param {Object} model Model.
 * @param {Array}  elementIds Elements to copy ([] = widget layer only).
 * @return {string} JSON payload.
 */
export function copyStyles( model, elementIds = [] ) {
	const normalized = normalizeStyles( model );
	const payload = {
		engine: 'xcosb-style-engine',
		version: STYLE_MODEL_VERSION,
		at: Date.now(),
		tokens: normalized.tokens,
		widget: {
			states: normalized.states,
			responsive: normalized.responsive,
		},
		elements: {},
	};
	elementIds.forEach( ( id ) => {
		if ( normalized.elements[ id ] ) {
			payload.elements[ id ] = normalized.elements[ id ];
		}
	} );
	return JSON.stringify( payload );
}

/**
 * Merge a clipboard payload back into a model (only same-engine payloads).
 *
 * @param {Object} model  Target model.
 * @param {string} payload JSON payload from copyStyles().
 * @return {Object} New model with pasted styles merged over the targets.
 */
export function pasteStyles( model, payload ) {
	if ( typeof payload !== 'string' ) {
		return model;
	}
	let data;
	try {
		data = JSON.parse( payload );
	} catch ( e ) {
		return model;
	}
	if ( ! isPlainObject( data ) || data.engine !== 'xcosb-style-engine' ) {
		return model;
	}
	// Build on a normalized clone so every layer shell (states/responsive/elements)
	// exists even when the target model is a bare { version: 1 }.
	const next = deepClone( normalizeStyles( model ) );

	if ( isPlainObject( data.widget?.states ) ) {
		STATES.forEach( ( state ) => {
			if ( isPlainObject( data.widget.states[ state ] ) ) {
				next.states[ state ] = deepMerge( next.states[ state ] || {}, data.widget.states[ state ] );
			}
		} );
	}
	if ( isPlainObject( data.widget?.responsive ) ) {
		BREAKPOINTS.forEach( ( bp ) => {
			if ( isPlainObject( data.widget.responsive[ bp ] ) ) {
				next.responsive[ bp ] = deepMerge( next.responsive[ bp ] || {}, data.widget.responsive[ bp ] );
			}
		} );
	}
	if ( isPlainObject( data.elements ) ) {
		Object.keys( data.elements ).forEach( ( id ) => {
			const incoming = data.elements[ id ];
			if ( ! isPlainObject( incoming ) ) {
				return;
			}
			next.elements[ id ] = next.elements[ id ] || { base: {}, states: {}, responsive: {} };
			if ( isPlainObject( incoming.base ) ) {
				next.elements[ id ].base = deepMerge( next.elements[ id ].base, incoming.base );
			}
			STATES.forEach( ( state ) => {
				if ( isPlainObject( incoming.states?.[ state ] ) ) {
					next.elements[ id ].states[ state ] = deepMerge(
						next.elements[ id ].states[ state ] || {},
						incoming.states[ state ]
					);
				}
			} );
			BREAKPOINTS.forEach( ( bp ) => {
				if ( isPlainObject( incoming.responsive?.[ bp ] ) ) {
					next.elements[ id ].responsive[ bp ] = deepMerge(
						next.elements[ id ].responsive[ bp ] || {},
						incoming.responsive[ bp ]
					);
				}
			} );
		} );
	}
	return next;
}

/* ------------------------------------------------------------------ *
 * Editor <-> frontend contract helpers (used by PHP mirror too)
 * ------------------------------------------------------------------ */

/**
 * Canonical layer path for a value key in the flat (legacy) representation:
 * "desktop.default.wrapper.font_size" style address used by the schema
 * registry to map old keys onto the model.
 *
 * @param {string} legacyKey Flat style key.
 * @return {string} Model address or '' when not a style key.
 */
export function legacyKeyToModelAddress( legacyKey ) {
	if ( typeof legacyKey !== 'string' || ! legacyKey ) {
		return '';
	}
	// Content keys never live in the style model.
	if ( /^(title|subtitle|button_text|text|content|tag|prefix|placeholder|size|link|separator|limit|display_type)$/.test( legacyKey ) ) {
		return '';
	}
	const style = /(color|font|align|text_|line_height|letter_spacing|word_spacing|margin|padding|radius|shadow|border|animation|background|overlay|gradient|gap|width|height|display|position|overflow|flex|grid|opacity|z_index|cursor|transform)/;
	if ( ! style.test( legacyKey ) ) {
		return '';
	}
	return `desktop.default.wrapper.${ legacyKey }`;
}

/**
 * Flat style keys (desktop/default/wrapper) → style model document. Used by
 * the migration layer so existing templates keep working unchanged while
 * newer widgets write the full model.
 *
 * @param {Object} settings Widget settings (legacy keys).
 * @return {Object} Style model document.
 */
export function legacySettingsToModel( settings ) {
	const model = {
		version: STYLE_MODEL_VERSION,
		tokens: {},
		responsive: { desktop: {}, tablet: {}, mobile: {} },
		states: { default: {} },
		elements: {},
	};
	STATES.filter( ( s ) => s !== 'default' ).forEach( ( s ) => {
		model.states[ s ] = {};
	} );
	if ( ! isPlainObject( settings ) ) {
		return model;
	}
	Object.keys( settings ).forEach( ( key ) => {
		const address = legacyKeyToModelAddress( key );
		if ( address ) {
			model.states.default[ key ] = deepClone( settings[ key ] );
		}
	} );
	return model;
}
