/**
 * Reusable compact controls for the floating style popover.
 *
 * Everything here is generic — no widget-specific logic. Widgets declare
 * which categories and fields they expose (config.js); these primitives
 * render the actual controls.
 *
 * @package WooCommerce_Template_Builder
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/* ------------------------------------------------------------------ *
 * Shared option sets
 * ------------------------------------------------------------------ */

export const SHADOW_OPTIONS = [
	{ label: __( 'None', 'xcodesol-page-builder' ), value: 'none' },
	{ label: __( 'Soft', 'xcodesol-page-builder' ), value: 'soft' },
	{ label: __( 'Medium', 'xcodesol-page-builder' ), value: 'medium' },
	{ label: __( 'Strong', 'xcodesol-page-builder' ), value: 'strong' },
];

export const SHADOW_VALUES = {
	none: '',
	soft: '0 4px 14px rgba(0,0,0,0.12)',
	medium: '0 10px 28px rgba(0,0,0,0.18)',
	strong: '0 18px 50px rgba(0,0,0,0.28)',
};

export const ANIMATION_OPTIONS = [
	{ label: __( 'None', 'xcodesol-page-builder' ), value: 'none' },
	{ label: __( 'Fade in', 'xcodesol-page-builder' ), value: 'fade-in' },
	{ label: __( 'Slide up', 'xcodesol-page-builder' ), value: 'slide-up' },
	{ label: __( 'Slide down', 'xcodesol-page-builder' ), value: 'slide-down' },
	{ label: __( 'Zoom in', 'xcodesol-page-builder' ), value: 'zoom-in' },
];

/**
 * Font families available in the font dropdown.
 *
 * Populated by the PHP side from the active theme's Google Fonts requests
 * and font-family declarations (xcosbBuilderConfig.fontOptions); falls back
 * to the common system stacks when the config is missing.
 */
export const FONT_OPTIONS = ( () => {
	const cfg = typeof window !== 'undefined' ? window.xcosbBuilderConfig || {} : {};
	if ( Array.isArray( cfg.fontOptions ) && cfg.fontOptions.length ) {
		return cfg.fontOptions;
	}
	return [
		{ label: 'Arial, Helvetica', value: 'Arial, Helvetica, sans-serif' },
		{ label: 'Georgia, serif', value: 'Georgia, "Times New Roman", serif' },
		{ label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
		{ label: 'Courier New, monospace', value: '"Courier New", Courier, monospace' },
		{ label: 'Verdana, Geneva', value: 'Verdana, Geneva, sans-serif' },
		{ label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
	];
} )();

export const FONT_WEIGHT_OPTIONS = [
	{ label: __( 'Light (300)', 'xcodesol-page-builder' ), value: '300' },
	{ label: __( 'Normal (400)', 'xcodesol-page-builder' ), value: '400' },
	{ label: __( 'Medium (500)', 'xcodesol-page-builder' ), value: '500' },
	{ label: __( 'Semi-bold (600)', 'xcodesol-page-builder' ), value: '600' },
	{ label: __( 'Bold (700)', 'xcodesol-page-builder' ), value: '700' },
	{ label: __( 'Extra-bold (800)', 'xcodesol-page-builder' ), value: '800' },
];

export const ALIGN_OPTIONS = [
	{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
	{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
	{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
];

export const BORDER_STYLE_OPTIONS = [
	{ label: __( 'Solid', 'xcodesol-page-builder' ), value: 'solid' },
	{ label: __( 'Dashed', 'xcodesol-page-builder' ), value: 'dashed' },
	{ label: __( 'Dotted', 'xcodesol-page-builder' ), value: 'dotted' },
	{ label: __( 'Double', 'xcodesol-page-builder' ), value: 'double' },
];

export const TRANSFORM_OPTIONS = [
	{ label: __( 'None', 'xcodesol-page-builder' ), value: 'none' },
	{ label: __( 'Uppercase', 'xcodesol-page-builder' ), value: 'uppercase' },
	{ label: __( 'Lowercase', 'xcodesol-page-builder' ), value: 'lowercase' },
	{ label: __( 'Capitalize', 'xcodesol-page-builder' ), value: 'capitalize' },
];

export const RADIUS_PRESETS = [
	{ label: '0', value: 0 },
	{ label: '4', value: 4 },
	{ label: '8', value: 8 },
	{ label: '12', value: 12 },
	{ label: '16', value: 16 },
	{ label: '24', value: 24 },
	{ label: __( 'Pill', 'xcodesol-page-builder' ), value: 999 },
];

/* ------------------------------------------------------------------ *
 * Value helpers
 * ------------------------------------------------------------------ */

/**
 * Whether a settings key carries a real (non-default) value.
 *
 * @param {Object} settings Flat settings map.
 * @param {string} key      Settings key.
 * @return {boolean} True when the key is set to something meaningful.
 */
export function isKeySet( settings, key ) {
	const value = settings ? settings[ key ] : undefined;
	return value !== undefined && value !== '' && value !== null && value !== false;
}

/**
 * Read a possibly-prefixed key with a fallback.
 *
 * @param {Object} settings Flat settings map.
 * @param {string} prefix   Key prefix ('title' → 'title_color').
 * @param {string} key      Base key.
 * @param {*}      fallback Value used when unset/empty.
 * @return {*} The stored value or fallback.
 */
export function readKey( settings, prefix, key, fallback ) {
	const full = prefix ? `${ prefix }_${ key }` : key;
	const value = settings ? settings[ full ] : undefined;
	return value === undefined || value === '' ? fallback : value;
}

/**
 * Number-normalise a raw input value ('' stays '').
 *
 * @param {*} raw Raw value.
 * @return {number|string} Normalised value.
 */
export function toNumber( raw ) {
	return raw === '' || raw === undefined || raw === null ? '' : Number( raw );
}

/* ------------------------------------------------------------------ *
 * Clipboard (per-element style copy / paste)
 * ------------------------------------------------------------------ */

const WTBCLIP_KEY = 'xsb-style-clipboard-v1';
let xsbClipMemory = '';

export function writeStyleClipboard( payload ) {
	xsbClipMemory = payload;
	try {
		window.localStorage.setItem( WTBCLIP_KEY, payload );
	} catch ( e ) {
		/* storage may be unavailable — memory copy still works */
	}
}

export function readStyleClipboard() {
	if ( xsbClipMemory ) {
		return xsbClipMemory;
	}
	try {
		return window.localStorage.getItem( WTBCLIP_KEY ) || '';
	} catch ( e ) {
		return '';
	}
}

export function hasStyleClipboard() {
	return !! readStyleClipboard();
}

/* ------------------------------------------------------------------ *
 * Layout primitives
 * ------------------------------------------------------------------ */

/**
 * One property row: label on the left, control on the right, optional
 * reset button + inherited/custom indicator.
 *
 * @param {Object}   props
 * @param {string}   props.label       Property label.
 * @param {*}        props.children    The control.
 * @param {boolean}  props.custom      Whether this property holds a custom value.
 * @param {Function} props.onReset     Reset handler (shown when custom).
 * @param {string}   props.help        Optional help text.
 * @param {string}   props.status      'custom' | 'inherit' | ''.
 */
export function PropertyRow( { label, children, custom, onReset, help, status } ) {
	return (
		<div className={ `xsb-style-property${ custom ? ' xsb-style-property--custom' : '' }${ ! custom ? ' xsb-style-property--inherited' : '' }` }>
			<div className="xsb-style-property__main">
				<label className="xsb-style-property__label">
					{ label }
					{ status ? (
						<span className="xsb-style-property__status">{ status }</span>
					) : (
						<span className="xsb-style-property__dot" aria-hidden="true" />
					) }
				</label>
				<div className="xsb-style-property__control">{ children }</div>
				{ custom && onReset && (
					<button
						type="button"
						className="xsb-style-reset-button"
						onClick={ onReset }
						title={ __( 'Reset to default', 'xcodesol-page-builder' ) }
						aria-label={ sprintfReset( label ) }
					>
						<span className="dashicons dashicons-undo" aria-hidden="true" />
					</button>
				) }
			</div>
			{ help && <p className="xsb-field-help">{ help }</p> }
		</div>
	);
}

function sprintfReset( label ) {
	/* Small helper to keep the aria-label translatable-ish without i18n plural
	   machinery for a single label. */
	return `${ label } — ${ __( 'reset', 'xcodesol-page-builder' ) }`;
}

/**
 * Simple labelled field block (no inherited chrome).
 *
 * @param {Object} props label/help/children.
 */
export function Field( { label, help, children } ) {
	return (
		<div className="xsb-inspector-field-block">
			<label className="xsb-field-label">{ label }</label>
			{ children }
			{ help && <p className="xsb-field-help">{ help }</p> }
		</div>
	);
}

/**
 * Collapsible sub-group inside a category (e.g. Margin / Padding inside
 * Spacing). Accordion with aria-expanded + aria-controls.
 *
 * @param {Object}  props
 * @param {string}  props.title       Group title.
 * @param {boolean} props.defaultOpen Whether expanded by default.
 * @param {number}  props.changed     Count of changed properties (badge).
 * @param {*}       props.children    Group body.
 */
export function StyleGroup( { title, icon, children, defaultOpen = false, changed = 0 } ) {
	const [ open, setOpen ] = useState( defaultOpen );
	const bodyId = `xsb-sg-${ title.replace( /\W+/g, '-' ).toLowerCase() }`;

	return (
		<div className={ `xsb-style-section${ open ? ' is-open' : '' }${ changed > 0 ? ' has-changes' : '' }` }>
			<button
				type="button"
				className={ `xsb-style-section-head${ open ? ' is-open' : '' }${ changed > 0 ? ' has-changes' : '' }` }
				aria-expanded={ open }
				aria-controls={ bodyId }
				onClick={ () => setOpen( ( v ) => ! v ) }
			>
				<span className="xsb-style-section-title-wrap">
					{ icon && (
						<span className="xsb-style-section-icon" aria-hidden="true">
							<span className={ `dashicons ${ icon }` } />
						</span>
					) }
					<span className="xsb-style-section-title">{ title }</span>
				</span>
				<span className="xsb-style-section-head-right">
					{ changed > 0 && <span className="xsb-style-section-dot" title={ __( 'Customized', 'xcodesol-page-builder' ) } aria-hidden="true" /> }
					<span
						className="dashicons dashicons-arrow-down-alt2 xsb-style-section-caret"
						aria-hidden="true"
					/>
				</span>
			</button>
			{ open && (
				<div className="xsb-style-section-body" id={ bodyId }>
					{ children }
				</div>
			) }
		</div>
	);
}

/* ------------------------------------------------------------------ *
 * Input primitives
 * ------------------------------------------------------------------ */

/**
 * Normalise any colour value to a 7-character hex accepted by <input type="color">.
 *
 * @param {string} value Any colour string.
 * @return {string} #rrggbb (fallback #2271b1).
 */
export function toHexInput( value ) {
	const raw = String( value || '' ).trim().toLowerCase();
	let m = raw.match( /^#([0-9a-f]{6})$/ );
	if ( m ) {
		return raw;
	}
	m = raw.match( /^#([0-9a-f]{3})$/ );
	if ( m ) {
		const [ r, g, b ] = m[ 1 ].split( '' );
		return `#${ r }${ r }${ g }${ g }${ b }${ b }`;
	}
	return '#2271b1';
}

/**
 * Small native colour picker chip (opens the OS/browser picker on click).
 */
export function ColorPickerChip( { value, onChange } ) {
	return (
		<span className="xsb-color-native" title={ __( 'Pick a color', 'xcodesol-page-builder' ) }>
			<input
				type="color"
				value={ toHexInput( value ) }
				onChange={ ( e ) => onChange( e.target.value ) }
				aria-label={ __( 'Pick a color', 'xcodesol-page-builder' ) }
			/>
			<span className="xsb-color-native-plus dashicons dashicons-plus" aria-hidden="true" />
		</span>
	);
}

/**
 * Compact color field: native swatch + hex input, one row.
 */
export function ColorField( { label, value, onChange } ) {
	return (
		<Field label={ label }>
			<div className="xsb-color-field">
				<div className="xsb-color-tools">
					<ColorPickerChip value={ value } onChange={ onChange } />
					<label className="xsb-color-custom">
						<span className="xsb-color-custom-label">#</span>
						<input
							type="text"
							value={ String( value || '' ).startsWith( '#' ) ? ( value || '' ).replace( '#', '' ).slice( 0, 6 ) : '' }
							placeholder="2563eb"
							onChange={ ( e ) =>
								onChange( '#' + e.target.value.replace( /[^0-9a-fA-F]/g, '' ).slice( 0, 6 ) )
							}
						/>
					</label>
				</div>
			</div>
		</Field>
	);
}

/**
 * Color input that accepts hex, rgba() or 'transparent'.
 */
export function CssColorField( { label, value, onChange } ) {
	return (
		<Field label={ label }>
			<div className="xsb-color-field">
				<div className="xsb-color-tools">
					<ColorPickerChip value={ value } onChange={ onChange } />
					<input
						className="xsb-css-color-input"
						type="text"
						value={ value || '' }
						placeholder="#00000059 or rgba(0,0,0,0.35)"
						onChange={ ( e ) => onChange( e.target.value ) }
					/>
				</div>
			</div>
		</Field>
	);
}

/**
 * Number input with optional unit suffix.
 */
export function NumberField( { label, value, min = 0, max, step, suffix, help, onChange } ) {
	return (
		<Field label={ label } help={ help }>
			<div className="xsb-number-row">
				<input
					className="xsb-number-input"
					type="number"
					value={ value === '' || value === undefined ? '' : String( value ) }
					min={ min }
					max={ max }
					step={ step }
					onChange={ ( e ) => onChange( e.target.value === '' ? '' : Number( e.target.value ) ) }
				/>
				{ suffix && <span className="xsb-number-suffix">{ suffix }</span> }
			</div>
		</Field>
	);
}

/**
 * Select dropdown.
 */
export function SelectField( { label, value, options, help, onChange } ) {
	return (
		<Field label={ label } help={ help }>
			<select
				className="xsb-select-input"
				value={ value === undefined || value === '' ? ( options[ 0 ]?.value || '' ) : String( value ) }
				onChange={ ( e ) => onChange( e.target.value ) }
			>
				{ options.map( ( opt ) => (
					<option key={ opt.value } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
			</select>
		</Field>
	);
}

/**
 * Checkbox toggle row.
 */
export function ToggleField( { label, checked, help, onChange } ) {
	return (
		<div className="xsb-inspector-field-block">
			<label className="xsb-toggle-row">
				<input type="checkbox" checked={ !! checked } onChange={ ( e ) => onChange( e.target.checked ) } />
				<span>{ label }</span>
			</label>
			{ help && <p className="xsb-field-help">{ help }</p> }
		</div>
	);
}

/**
 * Dropdown of the theme's font families with a "Theme default" first.
 */
export function FontFamilyField( { label, value, help, onChange } ) {
	return (
		<Field label={ label || __( 'Font family', 'xcodesol-page-builder' ) } help={ help }>
			<select
				className="xsb-select-input"
				value={ value || '' }
				onChange={ ( e ) => onChange( e.target.value ) }
			>
				<option value="">{ __( 'Theme default', 'xcodesol-page-builder' ) }</option>
				{ FONT_OPTIONS.map( ( opt ) => (
					<option key={ opt.value } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
			</select>
		</Field>
	);
}

/**
 * Segmented control (radio-group pattern) for small option sets.
 *
 * @param {Object} props
 * @param {Array}  props.options [{ label, value }].
 * @param {string} props.value   Active value.
 * @param {string} props.label   Accessible label for the group.
 */
export function SegmentedControl( { options, value, onChange, label } ) {
	return (
		<div
			className="xsb-style-segmented-control"
			role="radiogroup"
			aria-label={ label }
		>
			{ options.map( ( opt ) => (
				<button
					key={ opt.value }
					type="button"
					role="radio"
					aria-checked={ value === opt.value }
					className={ 'xsb-style-segmented-control__button' + ( value === opt.value ? ' is-active' : '' ) }
					onClick={ () => onChange( opt.value ) }
				>
					{ opt.label }
				</button>
			) ) }
		</div>
	);
}

/**
 * Preset chips row (e.g. radius presets, shadow presets). Shows presets
 * first; when a custom value is set the chip row still lets users jump
 * back to a preset.
 *
 * @param {Object} props
 * @param {Array}  props.presets  [{ label, value }].
 * @param {*}      props.value    Current value (compared loosely).
 * @param {string} props.label    Accessible label.
 */
export function PresetChips( { presets, value, onChange, label } ) {
	const current = String( value === undefined || value === '' ? '' : value );
	return (
		<div className="xsb-style-preset-chips" role="radiogroup" aria-label={ label }>
			{ presets.map( ( preset ) => (
				<button
					key={ String( preset.value ) }
					type="button"
					role="radio"
					aria-checked={ current === String( preset.value ) }
					className={ 'xsb-style-preset-chip' + ( current === String( preset.value ) ? ' is-active' : '' ) }
					onClick={ () => onChange( preset.value ) }
				>
					{ preset.label }
				</button>
			) ) }
		</div>
	);
}

/* ------------------------------------------------------------------ *
 * Spacing (4-side linked group — shared by margin AND padding)
 * ------------------------------------------------------------------ */

const SPACING_SIDES = [
	{ side: 'top', hint: __( 'Top', 'xcodesol-page-builder' ) },
	{ side: 'right', hint: __( 'Right', 'xcodesol-page-builder' ) },
	{ side: 'bottom', hint: __( 'Bottom', 'xcodesol-page-builder' ) },
	{ side: 'left', hint: __( 'Left', 'xcodesol-page-builder' ) },
];

/**
 * Elementor-style spacing group: one labelled group with four linked
 * side-by-side inputs (top, right, bottom, left) that fill the full width,
 * plus a link/unlink toggle. Used for BOTH margin and padding so both feel
 * identical.
 *
 * @param {Object}   props
 * @param {string}   props.label     Group title ("Margin" / "Padding").
 * @param {Object}   props.values    { top, right, bottom, left }.
 * @param {Function} props.onChange  (side, value) => void.
 * @param {string}   props.unit      Unit suffix (default px).
 */
export function SpacingGroup( { label, values, onChange, unit = __( 'px', 'xcodesol-page-builder' ) } ) {
	const [ linked, setLinked ] = useState( false );

	const read = ( side ) => {
		const v = values ? values[ side ] : '';
		return v === '' || v === undefined || v === null ? '' : Number( v );
	};

	const applyToAll = ( side, value ) => {
		SPACING_SIDES.forEach( ( cell ) => onChange( cell.side, value ) );
	};

	return (
		<div className="xsb-inspector-field-block xsb-spacing-group">
			<span className="xsb-spacing-label-row">
				<label className="xsb-field-label">{ label }</label>
				<span className="xsb-spacing-label-right">
					{ unit && <span className="xsb-spacing-unit">{ unit }</span> }
					<button
						type="button"
						className={ 'xsb-spacing-link' + ( linked ? ' is-linked' : '' ) }
						title={ linked
							? __( 'All sides linked — edit them together', 'xcodesol-page-builder' )
							: __( 'Unlink sides to edit them separately', 'xcodesol-page-builder' ) }
						aria-pressed={ linked }
						onClick={ () => setLinked( ( v ) => ! v ) }
					>
						<span className={ `dashicons ${ linked ? 'dashicons-admin-links' : 'dashicons-editor-unlink' }` } aria-hidden="true" />
					</button>
				</span>
			</span>
			<div className="xsb-spacing-inputs">
				{ SPACING_SIDES.map( ( cell ) => (
					<div className="xsb-spacing-cell" key={ cell.side }>
						<input
							type="number"
							className="xsb-spacing-input"
							title={ cell.hint }
							value={ read( cell.side ) }
							onChange={ ( e ) => {
								const value = e.target.value === '' ? '' : Number( e.target.value );
								if ( linked ) {
									applyToAll( cell.side, value );
								} else {
									onChange( cell.side, value );
								}
							} }
						/>
						<span className="xsb-spacing-cell-hint">{ cell.hint }</span>
					</div>
				) ) }
			</div>
		</div>
	);
}