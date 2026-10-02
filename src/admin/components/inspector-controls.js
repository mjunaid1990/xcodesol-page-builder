/**
 * Elementor-grade reusable inspector controls for Xcodesol Page Builder.
 * Driven by declarative JSON schemas with responsive & state support.
 *
 * Provides:
 * - CollapsibleSection: Accessible section with state memory & reset.
 * - TextControl: Single-line input with placeholder and clear action.
 * - TextareaControl: Multi-line textarea.
 * - NumberScrubberControl: Number input with horizontal drag scrubbing and units.
 * - SliderScrubberControl: Dual slider range + number input with units.
 * - SelectControl: Styled select dropdown.
 * - ChooseSegmentedControl: Icon or text segmented radio group.
 * - ToggleControl: Modern iOS/Figma-style toggle switch.
 * - ColorControl / ColorPickerControl: Swatch + Hex + Popover + Eyedropper + Tokens.
 * - GradientControl: Linear/radial angle, color stops with alpha & position.
 * - MediaPickerControl: Image/media picker integrating with wp.media.
 * - DimensionsControl: 4 sides (top, right, bottom, left) with link toggle & units.
 * - BoxShadowGroup: Multi-layer shadow list with presets and live preview.
 * - BorderGroup: Style, 4-side linked width, color, and 4-corner linked radius.
 * - TypographyGroup: Font family, size, weight, line-height, letter-spacing, transform.
 * - RepeaterControl: Dynamic list items (add, delete, reorder).
 * - CodeEditorControl: Custom CSS / attribute code editor.
 * - PopoverGroupControl: Collapsed advanced popover options.
 * - DynamicControlRenderer: Schema-driven control dispatcher.
 * - SchemaInspectorRenderer: Full tab/section schema inspector renderer.
 * - Legacy compatibility exports: AlignmentControl, SizeControl, BoxModelSpacingControl, ButtonLivePreview, InspectorEmptyState.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { renderControl, hasControl, UnitSelect } from './controls/index';
import SharedColorControl from './controls/color';
import SharedSpacingBoxControl from './controls/spacing-box';
import CssEditor from './controls/css-editor';
import { deviceKey, deviceLayer } from '../styles/responsive';
import ResetButton from './reset-button';
import {
	IconAlignLeft,
	IconAlignCenter,
	IconAlignRight,
	IconAlignJustify,
	IconLink,
	IconUnlink,
	IconExternalLink,
	IconPipette,
	IconRotateCcw,
	IconChevronDown,
	IconChevronRight,
	IconElements,
	IconCheck,
	IconPlus,
	IconTrash,
	IconImage,
	IconVideo,
	IconGlobe,
	IconArrowRight,
	IconArrowDown,
	IconArrowLeft,
	IconArrowUp,
	IconLayoutFlex,
	IconLayoutGrid,
	IconBoxed,
	IconFullWidth,
	IconJustifyStart,
	IconJustifyCenter,
	IconJustifyEnd,
	IconJustifyBetween,
	IconJustifyAround,
	IconJustifyEvenly,
	IconAlignStart,
	IconAlignEnd,
	IconAlignStretch,
	IconWrap,
	IconNoWrap,
	IconBrush,
	IconGradient,
	IconBan,
	IconDesktop,
	IconTablet,
	IconMobile,
} from './icons';

const SAVED_PALETTE = [
	'#4f46e5', // Brand Indigo
	'#6366f1', // Soft Violet
	'#0f172a', // Slate Dark
	'#334155', // Slate Muted
	'#64748b', // Slate Light
	'#ffffff', // Pure White
	'#10b981', // Success Emerald
	'#f59e0b', // Amber
	'#ef4444', // Danger Red
	'#f8fafc', // Canvas Light
];

const ICON_MAP = {
	IconLayoutFlex,
	IconLayoutGrid,
	IconBoxed,
	IconFullWidth,
	IconArrowRight,
	IconArrowDown,
	IconArrowLeft,
	IconArrowUp,
	IconJustifyStart,
	IconJustifyCenter,
	IconJustifyEnd,
	IconJustifyBetween,
	IconJustifyAround,
	IconJustifyEvenly,
	IconAlignStart,
	IconAlignCenter,
	IconAlignEnd,
	IconAlignStretch,
	IconWrap,
	IconNoWrap,
	IconBrush,
	IconGradient,
	IconBan,
	IconImage,
	IconVideo,
	IconAlignLeft,
	IconAlignRight,
	IconAlignJustify,
	IconDesktop,
	IconTablet,
	IconMobile,
};

function renderIcon( iconProp, size = 14 ) {
	if ( ! iconProp ) return null;
	if ( typeof iconProp === 'string' && ICON_MAP[ iconProp ] ) {
		const Comp = ICON_MAP[ iconProp ];
		return <Comp width={ size } height={ size } />;
	}
	return iconProp;
}

/**
 * 1. Collapsible Group Section with state memory and reset button.
 */
export function CollapsibleSection( {
	id,
	title,
	defaultOpen = false,
	hint = null,
	onReset,
	children,
	stateControls = null,
	resetVersion = 0,
} ) {
	const storageKey = `xcopb_sec_${ id }`;
	const [ isOpen, setIsOpen ] = useState( () => {
		try {
			const saved = localStorage.getItem( storageKey );
			return saved !== null ? JSON.parse( saved ) : defaultOpen;
		} catch ( e ) {
			return defaultOpen;
		}
	} );
	useEffect( () => {
		if ( resetVersion ) {
			setIsOpen( !! defaultOpen );
			try { localStorage.removeItem( storageKey ); } catch ( e ) {}
		}
	}, [ resetVersion ] );

	const toggle = () => {
		setIsOpen( ( prev ) => {
			const next = ! prev;
			try {
				localStorage.setItem( storageKey, JSON.stringify( next ) );
			} catch ( e ) {}
			return next;
		} );
	};

	return (
		<div className={ `xsb-inspect-section${ isOpen ? ' is-open' : ' is-collapsed' }` }>
			<div className="xsb-inspect-section__header">
				<button type="button" className="xsb-inspect-section__toggle" onClick={ toggle } aria-expanded={ isOpen }>
					<span className={ `xsb-inspect-section__arrow${ isOpen ? ' is-open' : '' }` } aria-hidden="true"><IconChevronRight width={ 13 } height={ 13 } /></span>
					<span className="xsb-inspect-section__title">{ title }</span>
					{ ! isOpen && hint && <span className="xsb-inspect-section__hint" title={ String( hint ) }>{ hint }</span> }
				</button>
				{ stateControls }
				{ onReset && <ResetButton className="xsb-inspect-section__reset" onClick={ onReset } label={ __( 'Reset these settings', 'xcodesol-page-builder' ) } /> }
			</div>
			{ isOpen && <div className="xsb-inspect-section__body">{ children }</div> }
		</div>
	);
}

/**
 * 2. Text Control
 */
export function TextControl( {
	id,
	label,
	value = '',
	onChange,
	placeholder = '',
	responsive = false,
	activeDevice,
	isOverridden = false,
	onResetDevice,
} ) {
	return (
		<div className="xsb-control-field">
			<div className="xsb-control-label-wrap">
				<label className="xsb-control-label" htmlFor={ id }>{ label }</label>
				{ isOverridden && (
					<button
						type="button"
						className="xsb-control-device-reset"
						onClick={ onResetDevice }
						title={ __( 'Reset to desktop value', 'xcodesol-page-builder' ) }
					>
						<IconRotateCcw width={ 11 } height={ 11 } />
						<span>{ activeDevice }</span>
					</button>
				) }
			</div>
			<div className="xsb-text-input-wrap" style={ { position: 'relative' } }>
				<input
					id={ id }
					type="text"
					className="xsb-text-input"
					value={ value || '' }
					placeholder={ placeholder }
					onChange={ ( e ) => onChange( e.target.value ) }
				/>
				{ value && (
					<button
						type="button"
						className="xsb-color-clear-btn"
						style={ { position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' } }
						onClick={ () => onChange( '' ) }
						title={ __( 'Clear text', 'xcodesol-page-builder' ) }
					>
						&times;
					</button>
				) }
			</div>
		</div>
	);
}

/**
 * 3. Textarea Control
 */
export function TextareaControl( {
	id,
	label,
	value = '',
	onChange,
	rows = 3,
	placeholder = '',
} ) {
	return (
		<div className="xsb-control-field">
			{ label && <label className="xsb-control-label" htmlFor={ id }>{ label }</label> }
			<textarea
				id={ id }
				className="xsb-text-input xsb-textarea-input"
				rows={ rows }
				value={ value || '' }
				placeholder={ placeholder }
				onChange={ ( e ) => onChange( e.target.value ) }
			/>
		</div>
	);
}

/**
 * Rich text input for content widgets, with formatting kept as safe HTML.
 *
 * @param {Object} props Control props.
 * @return {JSX.Element} Rich text control.
 */
function RichTextEditorControl( { id, label, value = '', onChange, placeholder = '' } ) {
	const editorRef = useRef( null );
	const source = String( value || '' );
	useEffect( () => {
		if ( editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== source ) {
			editorRef.current.innerHTML = source;
		}
	}, [ source ] );

	const runCommand = ( command, argument ) => {
		if ( ! editorRef.current ) return;
		editorRef.current.focus();
		if ( 'createLink' === command ) {
			const url = window.prompt( __( 'Enter link URL', 'xcodesol-page-builder' ), 'https://' );
			if ( ! url ) return;
			argument = url;
		}
		document.execCommand( command, false, argument );
		onChange( editorRef.current.innerHTML );
	};

	const tools = [
		[ 'bold', __( 'Bold', 'xcodesol-page-builder' ), 'B' ],
		[ 'italic', __( 'Italic', 'xcodesol-page-builder' ), 'I' ],
		[ 'underline', __( 'Underline', 'xcodesol-page-builder' ), 'U' ],
		[ 'insertUnorderedList', __( 'Bulleted list', 'xcodesol-page-builder' ), '• List' ],
		[ 'insertOrderedList', __( 'Numbered list', 'xcodesol-page-builder' ), '1. List' ],
		[ 'createLink', __( 'Insert link', 'xcodesol-page-builder' ), 'Link' ],
	];

	return (
		<div className="xsb-control-field xsb-rich-text-control">
			{ label && <label className="xsb-control-label" htmlFor={ id }>{ label }</label> }
			<div className="xsb-rich-text-toolbar" role="toolbar" aria-label={ __( 'Text formatting', 'xcodesol-page-builder' ) }>
				{ tools.map( ( [ command, title, text ] ) => (
					<button key={ command } type="button" title={ title } aria-label={ title } onMouseDown={ ( event ) => event.preventDefault() } onClick={ () => runCommand( command ) }>
						{text}
					</button>
				) ) }
				<button type="button" title={ __( 'Remove formatting', 'xcodesol-page-builder' ) } aria-label={ __( 'Remove formatting', 'xcodesol-page-builder' ) } onMouseDown={ ( event ) => event.preventDefault() } onClick={ () => runCommand( 'removeFormat' ) }>Tx</button>
			</div>
			<div
				id={ id }
				ref={ editorRef }
				className="xsb-text-input xsb-rich-text-editor"
				contentEditable
				role="textbox"
				aria-multiline="true"
				data-placeholder={ placeholder }
				suppressContentEditableWarning
				onInput={ () => onChange( editorRef.current?.innerHTML || '' ) }
			/>
		</div>
	);
}

/**
 * 4. Select Control
 */
export function SelectControl( {
	id,
	label,
	value = '',
	onChange,
	options = [],
	responsive = false,
	activeDevice,
	isOverridden = false,
	onResetDevice,
} ) {
	return (
		<div className="xsb-control-field">
			<div className="xsb-control-label-wrap">
				<label className="xsb-control-label" htmlFor={ id }>{ label }</label>
				{ isOverridden && (
					<button
						type="button"
						className="xsb-control-device-reset"
						onClick={ onResetDevice }
						title={ __( 'Reset to desktop value', 'xcodesol-page-builder' ) }
					>
						<IconRotateCcw width={ 11 } height={ 11 } />
						<span>{ activeDevice }</span>
					</button>
				) }
			</div>
			<select
				id={ id }
				className="xsb-select-input"
				value={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
			>
				{ options.map( ( opt ) => (
					<option key={ String( opt.value ) } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
			</select>
		</div>
	);
}

/**
 * 5. Choose / Segmented Control
 */
export function ChooseSegmentedControl( {
	label,
	value,
	onChange,
	options = [],
	responsive = false,
	activeDevice,
	isOverridden = false,
	onResetDevice,
} ) {
	return (
		<div className="xsb-control-field">
			<div className="xsb-control-label-wrap">
				{ label && <label className="xsb-control-label">{ label }</label> }
				{ isOverridden && (
					<button
						type="button"
						className="xsb-control-device-reset"
						onClick={ onResetDevice }
						title={ __( 'Reset to desktop value', 'xcodesol-page-builder' ) }
					>
						<IconRotateCcw width={ 11 } height={ 11 } />
						<span>{ activeDevice }</span>
					</button>
				) }
			</div>
			<div className="xsb-segmented-control" role="radiogroup" aria-label={ label }>
				{ options.map( ( opt ) => {
					const isActive = String( value ) === String( opt.value );
					return (
						<button
							key={ String( opt.value ) }
							type="button"
							role="radio"
							aria-checked={ isActive }
							aria-label={ opt.label }
							title={ opt.label }
							className={ `xsb-segmented-btn${ isActive ? ' is-active' : '' }` }
							onClick={ () => onChange( opt.value ) }
						>
							{ opt.icon ? renderIcon( opt.icon, 14 ) : opt.label }
						</button>
					);
				} ) }
			</div>
		</div>
	);
}

/**
 * 6. Toggle Switch Control
 */
export function ToggleControl( {
	label,
	value = false,
	onChange,
	help = '',
} ) {
	return (
		<div className="xsb-control-field xsb-toggle-field">
			<label className="xsb-toggle-label-row">
				<span className="xsb-control-label">{ label }</span>
				<button
					type="button"
					role="switch"
					aria-checked={ !! value }
					className={ `xsb-toggle-switch${ value ? ' is-checked' : '' }` }
					onClick={ () => onChange( ! value ) }
				>
					<span className="xsb-toggle-thumb" />
				</button>
			</label>
			{ help && <span className="xsb-toggle-help">{ help }</span> }
		</div>
	);
}

/**
 * 7. Slider + Number Scrubber Control
 */
export function SliderScrubberControl( {
	label,
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	unit = 'px',
	units = [],
	onChangeUnit,
	responsive = false,
	activeDevice,
	isOverridden = false,
	onResetDevice,
} ) {
	const numVal = typeof value === 'object' && value !== null ? ( value.value ?? 0 ) : ( Number( value ) || 0 );
	const currentUnit = typeof value === 'object' && value !== null ? ( value.unit || unit ) : unit;
	const unitless = ! units || units.length === 0;

	const handleNumberChange = ( nextNum ) => {
		if ( typeof value === 'object' && value !== null ) {
			onChange( { ...value, value: nextNum, unit: currentUnit } );
		} else if ( units && units.length > 0 ) {
			onChange( { value: nextNum, unit: currentUnit } );
		} else {
			onChange( nextNum );
		}
	};

	const handleUnitChange = ( nextUnit ) => {
		if ( typeof value === 'object' && value !== null ) {
			onChange( { ...value, unit: nextUnit } );
		} else {
			onChange( { value: numVal, unit: nextUnit } );
		}
		if ( onChangeUnit ) {
			onChangeUnit( nextUnit );
		}
	};

	return (
		<div className="xsb-control-field xsb-slider-control-field">
			<div className="xsb-control-label-wrap">
				<label className="xsb-control-label">{ label }</label>
				<div className="xsb-control-label-actions">
					{ isOverridden && (
						<button
							type="button"
							className="xsb-control-device-reset"
							onClick={ onResetDevice }
							title={ __( 'Reset to desktop value', 'xcodesol-page-builder' ) }
						>
							<IconRotateCcw width={ 11 } height={ 11 } />
							<span>{ activeDevice }</span>
						</button>
					) }
					{ ! unitless && (
						<UnitSelect
							units={ units }
							value={ currentUnit }
							onChange={ handleUnitChange }
						/>
					) }
				</div>
			</div>
			<div className="xsb-slider-input-row">
				<input
					type="range"
					className="xsb-slider-range"
					value={ numVal }
					min={ min }
					max={ max }
					step={ step }
					onChange={ ( e ) => handleNumberChange( Number( e.target.value ) ) }
					aria-label={ label }
				/>
				<div className="xsb-number-input-wrap">
					<input
						type="number"
						className="xsb-text-input xsb-number-input"
						value={ numVal }
						min={ min }
						max={ max }
						step={ step }
						onChange={ ( e ) => handleNumberChange( Number( e.target.value ) ) }
						aria-label={ label }
					/>
				</div>
			</div>
		</div>
	);
}

/**
 * 8. Number Control with drag-to-scrub and unit switcher.
 */
export function NumberScrubberControl( {
	label,
	value = 0,
	onChange,
	min = 0,
	max = 1000,
	step = 1,
	unit = 'px',
	units = [ 'px', '%', 'em' ],
	onChangeUnit,
	responsive = false,
	activeDevice,
	isOverridden = false,
	onResetDevice,
} ) {
	const [ isDragging, setIsDragging ] = useState( false );
	const startPosRef = useRef( { x: 0, val: 0 } );

	const numVal = typeof value === 'object' && value !== null ? ( value.value ?? 0 ) : ( Number( value ) || 0 );
	const currentUnit = typeof value === 'object' && value !== null ? ( value.unit || unit ) : unit;
	const unitless = ! units || units.length === 0;

	const handleMouseDown = ( e ) => {
		setIsDragging( true );
		startPosRef.current = { x: e.clientX, val: numVal };

		const onMouseMove = ( ev ) => {
			const delta = ev.clientX - startPosRef.current.x;
			const nextVal = Math.min( max, Math.max( min, startPosRef.current.val + Math.round( delta * step ) ) );
			if ( typeof value === 'object' && value !== null ) {
				onChange( { ...value, value: nextVal, unit: currentUnit } );
			} else if ( units && units.length > 0 ) {
				onChange( { value: nextVal, unit: currentUnit } );
			} else {
				onChange( nextVal );
			}
		};

		const onMouseUp = () => {
			setIsDragging( false );
			window.removeEventListener( 'mousemove', onMouseMove );
			window.removeEventListener( 'mouseup', onMouseUp );
		};

		window.addEventListener( 'mousemove', onMouseMove );
		window.addEventListener( 'mouseup', onMouseUp );
	};

	const handleDirectChange = ( nextNum ) => {
		if ( typeof value === 'object' && value !== null ) {
			onChange( { ...value, value: nextNum, unit: currentUnit } );
		} else if ( units && units.length > 0 ) {
			onChange( { value: nextNum, unit: currentUnit } );
		} else {
			onChange( nextNum );
		}
	};

	const handleUnitChange = ( nextUnit ) => {
		if ( typeof value === 'object' && value !== null ) {
			onChange( { ...value, unit: nextUnit } );
		} else {
			onChange( { value: numVal, unit: nextUnit } );
		}
		if ( onChangeUnit ) {
			onChangeUnit( nextUnit );
		}
	};

	return (
		<div className="xsb-control-field">
			<div className="xsb-control-label-wrap">
				<label
					className="xsb-control-label is-scrubbable"
					onMouseDown={ handleMouseDown }
					title={ __( 'Drag horizontally to scrub number', 'xcodesol-page-builder' ) }
				>
					{ label }
				</label>
				<div className="xsb-control-label-actions">
					{ isOverridden && (
						<button
							type="button"
							className="xsb-control-device-reset"
							onClick={ onResetDevice }
							title={ __( 'Reset to desktop value', 'xcodesol-page-builder' ) }
						>
							<IconRotateCcw width={ 11 } height={ 11 } />
							<span>{ activeDevice }</span>
						</button>
					) }
					{ ! unitless && (
						<UnitSelect
							units={ units }
							value={ currentUnit }
							onChange={ handleUnitChange }
						/>
					) }
				</div>
			</div>
			<div className="xsb-number-input-wrap">
				<input
					type="number"
					className={ `xsb-text-input xsb-number-input${ isDragging ? ' is-scrubbing' : '' }` }
					value={ numVal ?? '' }
					min={ min }
					max={ max }
					step={ step }
					onChange={ ( e ) => handleDirectChange( Number( e.target.value ) ) }
					aria-label={ label }
				/>
			</div>
		</div>
	);
}

export const GLOBAL_THEME_COLOR_TOKENS = [
	{ label: __( 'Primary', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--primary, #2563eb)', color: '#2563eb' },
	{ label: __( 'Secondary', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--secondary, #475569)', color: '#475569' },
	{ label: __( 'Accent', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--accent, #06b6d4)', color: '#06b6d4' },
	{ label: __( 'Dark Text', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--foreground, #0f172a)', color: '#0f172a' },
	{ label: __( 'Light Background', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--background, #ffffff)', color: '#ffffff' },
	{ label: __( 'Muted', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--muted, #64748b)', color: '#64748b' },
	{ label: __( 'Success', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--success, #10b981)', color: '#10b981' },
	{ label: __( 'Warning', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--warning, #f59e0b)', color: '#f59e0b' },
	{ label: __( 'Danger', 'xcodesol-page-builder' ), value: 'var(--wp--preset--color--error, #ef4444)', color: '#ef4444' },
];

/**
 * 9. Color Picker Control with Global Theme Tokens
 */
export function ColorPickerControl( {
	label,
	value = '',
	onChange,
	defaultColor = '#000000',
	state = false,
	showTokens = true,
	inlinePopover = false,
	customPalette = [],
} ) {
	const colorVal = value || '';
	const palette = [ ...new Set( [ ...customPalette.map( ( item ) => typeof item === 'string' ? item : item?.value ), ...SAVED_PALETTE ].filter( ( item ) => typeof item === 'string' && item ) ) ];
	return <SharedColorControl config={ { id: `inspector-color-${ String( label || 'color' ).toLowerCase().replace( /[^a-z0-9]+/g, '-' ) }`, label, default: defaultColor } } value={ colorVal } onChange={ onChange } customPalette={ palette } overlayPopover={ inlinePopover } />;
}

export const ColorControl = ColorPickerControl;

/**
 * 10. Gradient Control (Linear / Radial)
 */
export function GradientControl( {
	label = __( 'Gradient', 'xcodesol-page-builder' ),
	value = { type: 'linear', angle: 90, colorA: '#4f46e5', colorB: '#06b6d4', posA: 0, posB: 100 },
	onChange,
} ) {
	const current = {
		type: 'linear',
		angle: 90,
		colorA: '#4f46e5',
		colorB: '#06b6d4',
		posA: 0,
		posB: 100,
		...( typeof value === 'object' && value !== null ? value : {} ),
	};

	const update = ( patch ) => {
		onChange( { ...current, ...patch } );
	};

	const gradientCSS = current.type === 'linear'
		? `linear-gradient(${ current.angle }deg, ${ current.colorA } ${ current.posA }%, ${ current.colorB } ${ current.posB }%)`
		: `radial-gradient(circle, ${ current.colorA } ${ current.posA }%, ${ current.colorB } ${ current.posB }%)`;

	return (
		<div className="xsb-control-field xsb-gradient-editor">
			<label className="xsb-control-label">{ label }</label>
			<div
				className="xsb-gradient-preview-bar"
				style={ {
					height: '24px',
					borderRadius: '6px',
					background: gradientCSS,
					border: '1px solid var(--xsb-line)',
					marginBottom: '8px',
				} }
			/>

			<div className="xsb-segmented-control" style={ { marginBottom: '8px' } }>
				<button
					type="button"
					className={ `xsb-segmented-btn${ current.type === 'linear' ? ' is-active' : '' }` }
					onClick={ () => update( { type: 'linear' } ) }
				>
					{ __( 'Linear', 'xcodesol-page-builder' ) }
				</button>
				<button
					type="button"
					className={ `xsb-segmented-btn${ current.type === 'radial' ? ' is-active' : '' }` }
					onClick={ () => update( { type: 'radial' } ) }
				>
					{ __( 'Radial', 'xcodesol-page-builder' ) }
				</button>
			</div>

			{ current.type === 'linear' && (
				<div style={ { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } }>
					<span style={ { fontSize: '11px', color: 'var(--xsb-muted)' } }>{ __( 'Angle', 'xcodesol-page-builder' ) }</span>
					<input
						type="range"
						min={ 0 }
						max={ 360 }
						value={ current.angle }
						onChange={ ( e ) => update( { angle: Number( e.target.value ) } ) }
						style={ { flex: 1 } }
					/>
					<span style={ { fontSize: '11px', minWidth: '32px', textAlign: 'right' } }>{ current.angle }°</span>
				</div>
			) }

			<div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }>
				<div>
					<span style={ { fontSize: '10.5px', color: 'var(--xsb-muted)' } }>{ __( 'Start Color', 'xcodesol-page-builder' ) }</span>
					<ColorPickerControl value={ current.colorA } onChange={ ( colorA ) => update( { colorA } ) } />
				</div>
				<div>
					<span style={ { fontSize: '10.5px', color: 'var(--xsb-muted)' } }>{ __( 'End Color', 'xcodesol-page-builder' ) }</span>
					<ColorPickerControl value={ current.colorB } onChange={ ( colorB ) => update( { colorB } ) } />
				</div>
			</div>
		</div>
	);
}

/**
 * 11. Media / Image Picker Control
 */
export function MediaPickerControl( {
	label = __( 'Image', 'xcodesol-page-builder' ),
	value = null,
	onChange,
	allowedTypes = 'image',
} ) {
	const current = typeof value === 'object' && value !== null ? value : { url: value || '' };
	const isVideo = typeof current.mime === 'string' && current.mime.startsWith( 'video/' );

	const openMediaModal = () => {
		if ( typeof window.wp !== 'undefined' && window.wp.media ) {
			const frame = window.wp.media( {
				title: __( 'Select or Upload Media', 'xcodesol-page-builder' ),
				button: { text: __( 'Use this media', 'xcodesol-page-builder' ) },
				multiple: false,
					library: { type: Array.isArray( allowedTypes ) && allowedTypes.length === 1 ? allowedTypes[ 0 ] : allowedTypes },
			} );
			frame.on( 'select', () => {
				const attachment = frame.state().get( 'selection' ).first().toJSON();
				onChange( {
					id: attachment.id,
					url: attachment.url,
					alt: attachment.alt || attachment.title || '',
					mime: attachment.mime || '',
					width: attachment.width,
					height: attachment.height,
				} );
			} );
			frame.open();
		} else {
			const url = prompt( __( 'Enter image URL:', 'xcodesol-page-builder' ), current.url || '' );
			if ( url !== null ) {
				onChange( { url } );
			}
		}
	};

	return (
		<div className="xsb-control-field xsb-media-picker">
			<label className="xsb-control-label">{ label }</label>
			{ current.url ? (
				<div className="xsb-media-preview-wrap" style={ { position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--xsb-line)', background: 'var(--xsb-canvas)' } }>
					{ isVideo ? <video src={ current.url } controls muted style={ { width: '100%', maxHeight: '140px', display: 'block' } } /> : <img src={ current.url } alt={ current.alt || '' } style={ { width: '100%', height: '110px', objectFit: 'cover', display: 'block' } } /> }
					<div style={ { display: 'flex', gap: '4px', padding: '6px 8px', background: 'var(--xsb-panel)', borderTop: '1px solid var(--xsb-line)' } }>
						<button
							type="button"
							className="xsb-btn xsb-btn--sm"
							style={ { flex: 1, fontSize: '11px' } }
							onClick={ openMediaModal }
						>
							{ __( 'Change', 'xcodesol-page-builder' ) }
						</button>
						<button
							type="button"
							className="xsb-btn xsb-btn--sm is-danger"
							style={ { fontSize: '11px', padding: '4px 8px' } }
							onClick={ () => onChange( null ) }
							title={ __( 'Remove', 'xcodesol-page-builder' ) }
						>
							<IconTrash width={ 13 } height={ 13 } />
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					className="xsb-media-dropzone"
					onClick={ openMediaModal }
					style={ {
						width: '100%',
						padding: '20px 10px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '6px',
						border: '1.5px dashed var(--xsb-line)',
						borderRadius: '6px',
						background: 'transparent',
						cursor: 'pointer',
						color: 'var(--xsb-muted)',
						transition: 'all 150ms ease',
					} }
				>
					{ String( allowedTypes ).includes( 'video' ) ? <IconVideo width={ 20 } height={ 20 } /> : <IconImage width={ 20 } height={ 20 } /> }
					<span style={ { fontSize: '11.5px', fontWeight: 500 } }>{ String( allowedTypes ).includes( 'video' ) ? __( 'Choose Video', 'xcodesol-page-builder' ) : __( 'Choose Image', 'xcodesol-page-builder' ) }</span>
				</button>
			) }
		</div>
	);
}

/**
 * 12. Dimensions Control (4 Sides / Row-Col linked)
 */
function LegacyDimensionsControl( {
	label = __( 'Dimensions', 'xcodesol-page-builder' ),
	value = { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true },
	onChange,
	units = [ 'px', '%', 'em', 'rem' ],
	allowNegative = false,
	responsive = false,
	activeDevice,
	isOverridden = false,
	onResetDevice,
	mode = 'sides', // 'sides' (top,right,bottom,left) or 'gap' (row, col)
} ) {
	const current = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		row: 0,
		col: 0,
		unit: 'px',
		isLinked: true,
		...( typeof value === 'object' && value !== null ? value : {} ),
	};

	const [ isLinked, setIsLinked ] = useState( current.isLinked ?? true );

	const handleSideChange = ( side, rawVal ) => {
		const num = rawVal === '' ? '' : Number( rawVal );
		if ( isLinked ) {
			if ( mode === 'gap' ) {
				onChange( { ...current, row: num, col: num, isLinked: true } );
			} else {
				onChange( { ...current, top: num, right: num, bottom: num, left: num, isLinked: true } );
			}
		} else {
			onChange( { ...current, [ side ]: num, isLinked: false } );
		}
	};

	const handleUnitChange = ( unit ) => {
		onChange( { ...current, unit } );
	};

	return (
		<div className="xsb-control-field xsb-box-spacing-field">
			<div className="xsb-control-label-wrap">
				<label className="xsb-control-label">{ label }</label>
				<div className="xsb-control-label-actions">
					{ isOverridden && (
						<button
							type="button"
							className="xsb-control-device-reset"
							onClick={ onResetDevice }
							title={ __( 'Reset to desktop value', 'xcodesol-page-builder' ) }
						>
							<IconRotateCcw width={ 11 } height={ 11 } />
							<span>{ activeDevice }</span>
						</button>
					) }
					<UnitSelect
						units={ units }
						value={ current.unit }
						onChange={ handleUnitChange }
					/>
					<button
						type="button"
						className={ `xsb-link-toggle-btn${ isLinked ? ' is-linked' : '' }` }
						onClick={ () => {
							const next = ! isLinked;
							setIsLinked( next );
							onChange( { ...current, isLinked: next } );
						} }
						title={ isLinked ? __( 'Unlink sides', 'xcodesol-page-builder' ) : __( 'Link sides together', 'xcodesol-page-builder' ) }
					>
						{ isLinked ? <IconLink width={ 13 } height={ 13 } /> : <IconUnlink width={ 13 } height={ 13 } /> }
					</button>
				</div>
			</div>

			{ mode === 'gap' ? (
				<div className="xsb-box-spacing-grid" style={ { gridTemplateColumns: 'repeat(2, 1fr)' } }>
					<div className="xsb-spacing-col">
						<input
							type="number"
							className="xsb-text-input xsb-spacing-input"
							value={ current.row ?? '' }
							onChange={ ( e ) => handleSideChange( 'row', e.target.value ) }
							aria-label={ __( 'Row Gap', 'xcodesol-page-builder' ) }
						/>
						<span className="xsb-spacing-sublabel">{ __( 'Row', 'xcodesol-page-builder' ) }</span>
					</div>
					<div className="xsb-spacing-col">
						<input
							type="number"
							className="xsb-text-input xsb-spacing-input"
							value={ current.col ?? '' }
							onChange={ ( e ) => handleSideChange( 'col', e.target.value ) }
							aria-label={ __( 'Column Gap', 'xcodesol-page-builder' ) }
						/>
						<span className="xsb-spacing-sublabel">{ __( 'Column', 'xcodesol-page-builder' ) }</span>
					</div>
				</div>
			) : (
				<div className="xsb-box-spacing-grid">
					<div className="xsb-spacing-col">
						<input
							type="number"
							className="xsb-text-input xsb-spacing-input"
							value={ current.top ?? '' }
							onChange={ ( e ) => handleSideChange( 'top', e.target.value ) }
							aria-label={ __( 'Top', 'xcodesol-page-builder' ) }
						/>
						<span className="xsb-spacing-sublabel">{ __( 'Top', 'xcodesol-page-builder' ) }</span>
					</div>
					<div className="xsb-spacing-col">
						<input
							type="number"
							className="xsb-text-input xsb-spacing-input"
							value={ current.right ?? '' }
							onChange={ ( e ) => handleSideChange( 'right', e.target.value ) }
							aria-label={ __( 'Right', 'xcodesol-page-builder' ) }
						/>
						<span className="xsb-spacing-sublabel">{ __( 'Right', 'xcodesol-page-builder' ) }</span>
					</div>
					<div className="xsb-spacing-col">
						<input
							type="number"
							className="xsb-text-input xsb-spacing-input"
							value={ current.bottom ?? '' }
							onChange={ ( e ) => handleSideChange( 'bottom', e.target.value ) }
							aria-label={ __( 'Bottom', 'xcodesol-page-builder' ) }
						/>
						<span className="xsb-spacing-sublabel">{ __( 'Bottom', 'xcodesol-page-builder' ) }</span>
					</div>
					<div className="xsb-spacing-col">
						<input
							type="number"
							className="xsb-text-input xsb-spacing-input"
							value={ current.left ?? '' }
							onChange={ ( e ) => handleSideChange( 'left', e.target.value ) }
							aria-label={ __( 'Left', 'xcodesol-page-builder' ) }
						/>
						<span className="xsb-spacing-sublabel">{ __( 'Left', 'xcodesol-page-builder' ) }</span>
					</div>
				</div>
			) }
		</div>
	);
}

export const DimensionsControl = SharedSpacingBoxControl;
export const BoxModelSpacingControl = SharedSpacingBoxControl;

/**
 * 13. Box Shadow Group Control (Multi-layer + Presets)
 */
export function BoxShadowGroup( {
	label = __( 'Box Shadow', 'xcodesol-page-builder' ),
	value = [],
	onChange,
} ) {
	const currentList = Array.isArray( value ) ? value : ( value ? [ value ] : [] );

	const applyPreset = ( preset ) => {
		switch ( preset ) {
			case 'soft':
				onChange( [ { x: 0, y: 4, blur: 14, spread: 0, color: 'rgba(0,0,0,0.08)', inset: false } ] );
				break;
			case 'medium':
				onChange( [ { x: 0, y: 10, blur: 25, spread: -3, color: 'rgba(0,0,0,0.12)', inset: false } ] );
				break;
			case 'large':
				onChange( [ { x: 0, y: 20, blur: 40, spread: -4, color: 'rgba(0,0,0,0.16)', inset: false } ] );
				break;
			case 'inner':
				onChange( [ { x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0,0,0,0.08)', inset: true } ] );
				break;
			case 'glow':
				onChange( [ { x: 0, y: 0, blur: 20, spread: 0, color: 'rgba(99,102,241,0.4)', inset: false } ] );
				break;
			case 'none':
			default:
				onChange( [] );
				break;
		}
	};

	const addLayer = () => {
		onChange( [ ...currentList, { x: 0, y: 6, blur: 18, spread: 0, color: 'rgba(0,0,0,0.1)', inset: false } ] );
	};

	const updateLayer = ( idx, patch ) => {
		const next = [ ...currentList ];
		next[ idx ] = { ...next[ idx ], ...patch };
		onChange( next );
	};

	const removeLayer = ( idx ) => {
		onChange( currentList.filter( ( _, i ) => i !== idx ) );
	};

	return (
		<div className="xsb-control-field xsb-box-shadow-editor">
			<div className="xsb-control-label-wrap">
				<label className="xsb-control-label">{ label }</label>
				<button
					type="button"
					className="xsb-btn xsb-btn--sm"
					style={ { fontSize: '10.5px', padding: '2px 6px' } }
					onClick={ addLayer }
				>
					<IconPlus width={ 11 } height={ 11 } />
					<span>{ __( 'Add Layer', 'xcodesol-page-builder' ) }</span>
				</button>
			</div>

			<div className="xsb-preset-chips" style={ { display: 'flex', gap: '4px', margin: '6px 0 10px', flexWrap: 'wrap' } }>
				{ [ 'none', 'soft', 'medium', 'large', 'inner', 'glow' ].map( ( p ) => (
					<button
						key={ p }
						type="button"
						className="xsb-chip-btn"
						style={ { textTransform: 'capitalize', fontSize: '10px' } }
						onClick={ () => applyPreset( p ) }
					>
						{ p }
					</button>
				) ) }
			</div>

			{ currentList.map( ( shadow, i ) => (
				<div
					key={ i }
					style={ {
						padding: '8px',
						background: 'var(--xsb-canvas)',
						border: '1px solid var(--xsb-line)',
						borderRadius: '6px',
						marginBottom: '6px',
					} }
				>
					<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' } }>
						<span style={ { fontSize: '11px', fontWeight: 600 } }>
							{ __( 'Layer', 'xcodesol-page-builder' ) } #{ i + 1 }
						</span>
						<div style={ { display: 'flex', alignItems: 'center', gap: '6px' } }>
							<label style={ { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' } }>
								<input
									type="checkbox"
									checked={ !! shadow.inset }
									onChange={ ( e ) => updateLayer( i, { inset: e.target.checked } ) }
								/>
								{ __( 'Inset', 'xcodesol-page-builder' ) }
							</label>
							<button
								type="button"
								onClick={ () => removeLayer( i ) }
								style={ { border: 'none', background: 'transparent', color: 'var(--xsb-danger)', cursor: 'pointer', padding: 0 } }
								title={ __( 'Remove shadow', 'xcodesol-page-builder' ) }
							>
								&times;
							</button>
						</div>
					</div>
					<div style={ { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '6px' } }>
						<div>
							<span style={ { fontSize: '9.5px', color: 'var(--xsb-faint)' } }>X</span>
							<input
								type="number"
								className="xsb-text-input"
								style={ { padding: '2px 4px', height: '26px', fontSize: '11px' } }
								value={ shadow.x ?? 0 }
								onChange={ ( e ) => updateLayer( i, { x: Number( e.target.value ) } ) }
							/>
						</div>
						<div>
							<span style={ { fontSize: '9.5px', color: 'var(--xsb-faint)' } }>Y</span>
							<input
								type="number"
								className="xsb-text-input"
								style={ { padding: '2px 4px', height: '26px', fontSize: '11px' } }
								value={ shadow.y ?? 4 }
								onChange={ ( e ) => updateLayer( i, { y: Number( e.target.value ) } ) }
							/>
						</div>
						<div>
							<span style={ { fontSize: '9.5px', color: 'var(--xsb-faint)' } }>Blur</span>
							<input
								type="number"
								className="xsb-text-input"
								style={ { padding: '2px 4px', height: '26px', fontSize: '11px' } }
								value={ shadow.blur ?? 14 }
								onChange={ ( e ) => updateLayer( i, { blur: Number( e.target.value ) } ) }
							/>
						</div>
						<div>
							<span style={ { fontSize: '9.5px', color: 'var(--xsb-faint)' } }>Spread</span>
							<input
								type="number"
								className="xsb-text-input"
								style={ { padding: '2px 4px', height: '26px', fontSize: '11px' } }
								value={ shadow.spread ?? 0 }
								onChange={ ( e ) => updateLayer( i, { spread: Number( e.target.value ) } ) }
							/>
						</div>
					</div>
					<ColorPickerControl
						value={ shadow.color || 'rgba(0,0,0,0.1)' }
						onChange={ ( color ) => updateLayer( i, { color } ) }
					/>
				</div>
			) ) }
		</div>
	);
}

/**
 * 14. Border Group Control
 */
export function BorderGroup( {
	label = __( 'Border', 'xcodesol-page-builder' ),
	value = {},
	onChange,
} ) {
	const current = {
		style: 'none',
		width: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px', isLinked: true },
		color: '',
		radius: { top: 8, right: 8, bottom: 8, left: 8, unit: 'px', isLinked: true },
		...( typeof value === 'object' && value !== null ? value : {} ),
	};

	return (
		<div className="xsb-control-field xsb-border-group">
			<SelectControl
				label={ label }
				value={ current.style }
				onChange={ ( style ) => onChange( { ...current, style } ) }
				options={ [
					{ value: 'none', label: __( 'None', 'xcodesol-page-builder' ) },
					{ value: 'solid', label: __( 'Solid', 'xcodesol-page-builder' ) },
					{ value: 'dashed', label: __( 'Dashed', 'xcodesol-page-builder' ) },
					{ value: 'dotted', label: __( 'Dotted', 'xcodesol-page-builder' ) },
					{ value: 'double', label: __( 'Double', 'xcodesol-page-builder' ) },
				] }
			/>

			{ current.style !== 'none' && (
				<>
					<DimensionsControl
						label={ __( 'Border Width', 'xcodesol-page-builder' ) }
						value={ current.width }
						onChange={ ( width ) => onChange( { ...current, width } ) }
						units={ [ 'px' ] }
					/>
					<ColorPickerControl
						label={ __( 'Border Color', 'xcodesol-page-builder' ) }
						value={ current.color }
						onChange={ ( color ) => onChange( { ...current, color } ) }
					/>
				</>
			) }

			<DimensionsControl
				label={ __( 'Border Radius', 'xcodesol-page-builder' ) }
				value={ current.radius }
				onChange={ ( radius ) => onChange( { ...current, radius } ) }
				units={ [ 'px', '%' ] }
			/>
		</div>
	);
}

/**
 * 15. Typography Group Control
 */
export function TypographyGroup( {
	label = __( 'Typography', 'xcodesol-page-builder' ),
	value = {},
	onChange,
} ) {
	const current = {
		fontFamily: '',
		fontSize: { value: 16, unit: 'px' },
		fontWeight: '400',
		lineHeight: { value: 1.5, unit: 'em' },
		letterSpacing: { value: 0, unit: 'px' },
		textTransform: 'none',
		...( typeof value === 'object' && value !== null ? value : {} ),
	};

	const update = ( patch ) => onChange( { ...current, ...patch } );

	return (
		<div className="xsb-control-field xsb-typography-group">
			<label className="xsb-control-label">{ label }</label>
			<SelectControl
				label={ __( 'Font Family', 'xcodesol-page-builder' ) }
				value={ current.fontFamily }
				onChange={ ( fontFamily ) => update( { fontFamily } ) }
				options={ [
					{ value: '', label: __( 'Default (Inter/System)', 'xcodesol-page-builder' ) },
					{ value: 'Roboto, sans-serif', label: 'Roboto' },
					{ value: 'Outfit, sans-serif', label: 'Outfit' },
					{ value: 'Poppins, sans-serif', label: 'Poppins' },
					{ value: 'Playfair Display, serif', label: 'Playfair Display' },
					{ value: 'Space Grotesk, sans-serif', label: 'Space Grotesk' },
				] }
			/>
			<NumberScrubberControl
				label={ __( 'Size', 'xcodesol-page-builder' ) }
				value={ current.fontSize }
				onChange={ ( fontSize ) => update( { fontSize } ) }
				units={ [ 'px', 'rem', 'em', 'vw' ] }
			/>
			<SelectControl
				label={ __( 'Weight', 'xcodesol-page-builder' ) }
				value={ current.fontWeight }
				onChange={ ( fontWeight ) => update( { fontWeight } ) }
				options={ [
					{ value: '300', label: '300 - Light' },
					{ value: '400', label: '400 - Regular' },
					{ value: '500', label: '500 - Medium' },
					{ value: '600', label: '600 - Semibold' },
					{ value: '700', label: '700 - Bold' },
					{ value: '800', label: '800 - Extra Bold' },
				] }
			/>
			<ChooseSegmentedControl
				label={ __( 'Transform', 'xcodesol-page-builder' ) }
				value={ current.textTransform }
				onChange={ ( textTransform ) => update( { textTransform } ) }
				options={ [
					{ value: 'none', label: '-' },
					{ value: 'uppercase', label: 'TT' },
					{ value: 'lowercase', label: 'tt' },
					{ value: 'capitalize', label: 'Tt' },
				] }
			/>
		</div>
	);
}

/**
 * 16. Repeater Control
 */
export function RepeaterControl( {
	label,
	value = [],
	onChange,
	itemSchema = [],
	addLabel = __( 'Add Item', 'xcodesol-page-builder' ),
} ) {
	const items = Array.isArray( value ) ? value : [];

	const addItem = () => {
		const newItem = {};
		itemSchema.forEach( ( f ) => {
			newItem[ f.id ] = f.default ?? '';
		} );
		onChange( [ ...items, newItem ] );
	};

	const updateItem = ( idx, patch ) => {
		const next = [ ...items ];
		next[ idx ] = { ...next[ idx ], ...patch };
		onChange( next );
	};

	const deleteItem = ( idx ) => {
		onChange( items.filter( ( _, i ) => i !== idx ) );
	};

	return (
		<div className="xsb-control-field xsb-repeater-field">
			<div className="xsb-control-label-wrap">
				<label className="xsb-control-label">{ label }</label>
				<button
					type="button"
					className="xsb-btn xsb-btn--sm"
					style={ { fontSize: '10.5px', padding: '2px 6px' } }
					onClick={ addItem }
				>
					<IconPlus width={ 11 } height={ 11 } />
					<span>{ addLabel }</span>
				</button>
			</div>

			{ items.map( ( item, i ) => (
				<div
					key={ i }
					style={ {
						padding: '8px',
						border: '1px solid var(--xsb-line)',
						borderRadius: '6px',
						background: 'var(--xsb-canvas)',
						marginBottom: '6px',
					} }
				>
					<div style={ { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } }>
						<span style={ { fontSize: '11px', fontWeight: 600 } }>
							#{ i + 1 }
						</span>
						<button
							type="button"
							onClick={ () => deleteItem( i ) }
							style={ { border: 'none', background: 'transparent', color: 'var(--xsb-danger)', cursor: 'pointer', padding: 0 } }
						>
							&times;
						</button>
					</div>
					{ itemSchema.map( ( field ) => (
						<DynamicControlRenderer
							key={ field.id }
							control={ field }
							settings={ item }
							onUpdate={ ( k, v ) => updateItem( i, { [ k ]: v } ) }
						/>
					) ) }
				</div>
			) ) }
		</div>
	);
}

/**
 * 17. Code Editor Control (Custom CSS)
 */
export function CodeEditorControl( {
	label = __( 'Custom CSS', 'xcodesol-page-builder' ),
	value = '',
	onChange,
	placeholder = 'selector {\n  /* Custom CSS */\n}',
} ) {
	return <div className="xsb-control-field xsb-code-field"><CssEditor label={ label } value={ value } onChange={ onChange } placeholder={ placeholder } rows={ 9 } /></div>;
}

/**
 * 18. Popover Group Control
 */
export function PopoverGroupControl( {
	label,
	triggerLabel = __( 'Advanced Options', 'xcodesol-page-builder' ),
	children,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<div className="xsb-control-field xsb-popover-group-field">
			<button
				type="button"
				className="xsb-btn xsb-btn--sm"
				style={ { width: '100%', justifyContent: 'space-between', fontSize: '11.5px' } }
				onClick={ () => setIsOpen( ( v ) => ! v ) }
			>
				<span>{ triggerLabel }</span>
				<IconChevronDown width={ 12 } height={ 12 } />
			</button>
			{ isOpen && (
				<div
					style={ {
						marginTop: '6px',
						padding: '10px',
						background: 'var(--xsb-canvas)',
						border: '1px solid var(--xsb-line)',
						borderRadius: '6px',
					} }
				>
					{ children }
				</div>
			) }
		</div>
	);
}

/**
 * 19. Dynamic Control Renderer: Dispatches control definitions to component.
 */
export function DynamicControlRenderer( {
	control,
	blockType = '',
	settings = {},
	dynamicPreview = {},
	activeDevice = 'desktop',
	activeState = 'default',
	onUpdate,
	manifest,
	sectionStateful = false,
	sectionActiveState = 'default',
} ) {
	if ( ! control || ! control.id ) return null;

	// Whether this control belongs to the Hover (or another non-default)
	// state layer. Sections marked `stateful` in a schema opt every control
	// they own into the state tabs, matching the per-section semantics the
	// two engines already use (states → pseudo-selectors).
	const explicitState = typeof control.state === 'string' && control.state !== 'default'
		? control.state
		: null;
	const supportsActiveState = sectionActiveState === 'focus' ? !! control.supportsFocus : !! control.supportsHover;
	const stateScoped = Boolean( explicitState ) || ( ( control.state || sectionStateful ) && supportsActiveState && sectionActiveState !== 'default' && ( control.supportsHover || control.supportsFocus ) );
	const activeStateKey = explicitState || ( stateScoped ? sectionActiveState : 'default' );

	// Storage keys follow the plugin-wide flat convention:
	//   base              → <id>            (desktop / normal)
	//   device override   → <device>_<id>   (tablet_/, mobile_)
	//   state override    → <state>_<id>    (hover_/active_/…)
	// Both the preview canvas and the front-end @media / :hover rules read
	// exactly these keys, so what the inspector writes is what gets rendered.
	const statePrefix = stateScoped && activeStateKey !== 'default' ? activeStateKey + '_' : '';
	const storeKey = statePrefix + control.id;

	// Resolve the cascading value for the current device/state.
	let val = settings[ storeKey ];
	let isOverridden = false;

	if ( val === undefined && control.responsive && activeDevice !== 'desktop' && ! stateScoped ) {
		const own = deviceLayer( settings, activeDevice );
		const inherited = activeDevice === 'mobile' ? deviceLayer( settings, 'tablet' ) : {};

		if ( own[ control.id ] !== undefined ) {
			val = own[ control.id ];
			isOverridden = true;
		} else if ( inherited[ control.id ] !== undefined ) {
			val = inherited[ control.id ];
		} else if ( settings.__responsive?.[ activeDevice ]?.[ control.id ] !== undefined ) {
			// Legacy layer written by earlier builds of this dispatcher.
			val = settings.__responsive[ activeDevice ][ control.id ];
			isOverridden = true;
		} else if ( activeDevice === 'mobile' && settings.__responsive?.tablet?.[ control.id ] !== undefined ) {
			val = settings.__responsive.tablet[ control.id ];
		}
	}

	if ( val === undefined && settings.__states?.[ activeStateKey ]?.[ control.id ] !== undefined ) {
		// Legacy state layer.
		val = settings.__states[ activeStateKey ][ control.id ];
	}

	if ( val === undefined ) {
		val = control.default;
	}

	const handleValueChange = ( nextVal ) => {
		// Content width and max width describe one choice in the inspector:
		// changing modes should immediately update both the control value and
		// the canvas, rather than leaving a stale boxed width behind.
		if ( control.id === 'content_width' && ! stateScoped ) {
			onUpdate( {
				content_width: nextVal,
				max_width: nextVal === 'full' ? { value: 100, unit: '%' } : { value: 1200, unit: 'px' },
			} );
			return;
		}

		if ( stateScoped ) {
			onUpdate( storeKey, nextVal );
			return;
		}

		if ( control.responsive && activeDevice !== 'desktop' ) {
			onUpdate( deviceKey( control.id, activeDevice ), nextVal );
			return;
		}

		onUpdate( control.id, nextVal );
	};

	const handleResetDevice = () => {
		if ( stateScoped ) {
			if ( settings[ storeKey ] === undefined ) {
				return;
			}
			const next = { ...settings };
			delete next[ storeKey ];
			onUpdate( next );
			return;
		}

		if ( activeDevice === 'desktop' ) {
			return;
		}

		const next = { ...settings };
		delete next[ deviceKey( control.id, activeDevice ) ];

		// Clear the legacy layer too so a reset really clears the device.
		if ( next.__responsive?.[ activeDevice ] ) {
			const layer = { ...next.__responsive[ activeDevice ] };
			delete layer[ control.id ];
			next.__responsive = { ...next.__responsive, [ activeDevice ]: layer };
		}

		onUpdate( next );
	};

	const resetKey = ( key ) => {
		const next = { ...settings };
		delete next[ key ];
		onUpdate( next );
	};

	// The column-ratio control owns the structural add/remove actions for the
	// container's columns, which live in the settings map as `columns` and
	// `column_widths`. Hand them to the control through its config so it stays
	// a dumb, widget-agnostic component.
	const resolvedColumnCount = Math.min(
		6,
		Math.max( 1, Number( settings.columns ) || ( Array.isArray( val ) ? val.length : 2 ) )
	);

	const changeColumnCount = ( delta ) => {
		const current = Math.min( 6, Math.max( 1, Number( settings.columns ) || resolvedColumnCount ) );
		const nextCount = Math.min( 6, Math.max( 1, current + delta ) );
		if ( nextCount === current ) {
			return;
		}

		// Keep a 12-unit total: adding splits the last column, removing folds
		// the dropped column's share back into the remaining ones.
		const currentWidths = Array.isArray( val ) && val.length >= current
			? val.map( Number ).slice( 0, current )
			: Array.from( { length: current }, () => 12 / current );

		let nextWidths;
		if ( delta > 0 ) {
			const last = currentWidths[ currentWidths.length - 1 ] || 12 / current;
			nextWidths = [ ...currentWidths.slice( 0, -1 ), last / 2, last / 2 ];
		} else {
			nextWidths = currentWidths.slice( 0, nextCount );
		}

		const sum = nextWidths.reduce( ( acc, w ) => acc + w, 0 ) || 1;
		nextWidths = nextWidths.map( ( w ) => Math.round( ( ( w / sum ) * 12 ) * 100 ) / 100 );

		const patch = { columns: nextCount, column_widths: nextWidths };
		if ( control.responsive && activeDevice !== 'desktop' ) {
			// Keep the visible device in step with the structural change.
			patch[ deviceKey( 'columns', activeDevice ) ] = nextCount;
		}

		// One atomic patch → a single undo step.
		onUpdate( patch );
	};

	const controlConfig =
		control.type === 'column-ratio'
			? {
					...control,
					columnsCount: resolvedColumnCount,
					onAddColumn: () => changeColumnCount( 1 ),
					onRemoveColumn: () => changeColumnCount( -1 ),
			  }
			: control.type === 'animation'
				? { ...control, duration: settings.animation_duration ?? 600, delay: settings.animation_delay ?? 0, easing: settings.animation_easing || 'ease' }
				: control.type === 'media' && control.id === 'url'
					? ( () => {
						const source = settings.image_source || 'upload';
						const acfFields = window.xcopbBuilderConfig?.acfImageFields || window.xcosbBuilderConfig?.acfImageFields || [];
						const acfField = source === 'acf' ? acfFields.find( ( field ) => field.name === settings.acf_field ) : null;
						const builderFeaturedImage = window.xcopbBuilderConfig?.featuredImageUrl || window.xcosbBuilderConfig?.featuredImageUrl || '';
						return {
							...control,
							imageSource: source,
							frameBackground: settings.background || settings.bg_color || '',
							dynamicPreviewUrl: source === 'featured_image'
								? ( dynamicPreview.featuredImageUrl !== undefined ? dynamicPreview.featuredImageUrl : builderFeaturedImage )
								: source === 'acf' ? ( acfField?.preview_url || '' ) : '',
							dynamicPreviewLabel: source === 'featured_image'
								? __( 'Post Featured Image', 'xcodesol-page-builder' )
								: source === 'acf' ? ( acfField?.label || __( 'ACF image field', 'xcodesol-page-builder' ) ) : '',
							dynamicPreviewEmptyLabel: source === 'featured_image'
								? __( 'This post does not have a featured image yet.', 'xcodesol-page-builder' )
								: source === 'acf' ? __( 'This ACF field does not have an image yet.', 'xcodesol-page-builder' ) : '',
						};
					} )()
				: control;

	if ( hasControl( control.type ) ) {
		return <div className="xsb-schema-control"><div className="xsb-schema-control__field">{ renderControl(
			control.type,
			{
				config: controlConfig,
				value: val,
				onChange: handleValueChange,
				device: activeDevice,
				state: stateScoped ? activeStateKey : activeState,
				isModified: isOverridden,
				onReset: handleResetDevice,
			},
			manifest
		) }</div>{ control.help && <p className="xsb-schema-control__help">{ control.help }</p> }</div>;
	}

	const commonProps = {
		id: control.id,
		label: control.label,
		value: val,
		onChange: handleValueChange,
		responsive: control.responsive,
		activeDevice,
		isOverridden,
		onResetDevice: handleResetDevice,
	};

	let field = null;
	switch ( control.type ) {
		case 'text':
			field = <TextControl { ...commonProps } placeholder={ control.placeholder } />; break;
		case 'textarea':
			// The text widget is always rich text, even if a schema manifest has
			// been serialized by an older editor build that dropped custom flags.
			// Keep the control metadata check for other widgets that opt in.
			field = ( control.richText || ( control.id === 'content' && [ 'xcopb/gb-text', 'xcosb/gb-text' ].includes( blockType ) ) )
				? <RichTextEditorControl { ...commonProps } placeholder={ control.placeholder } />
				: <TextareaControl { ...commonProps } rows={ control.rows } placeholder={ control.placeholder } />; break;
		case 'number':
			field = (
				<NumberScrubberControl
					{ ...commonProps }
					min={ control.min }
					max={ control.max }
					step={ control.step }
					unit={ control.unit }
					units={ control.units || [ 'px' ] }
					responsive={ !! control.responsive }
					activeDevice={ activeDevice }
				/>
			); break;
		case 'slider':
			field = (
				<SliderScrubberControl
					{ ...commonProps }
					min={ control.min }
					max={ control.max }
					step={ control.step }
					unit={ control.unit }
					units={ control.units || [ 'px' ] }
				/>
			); break;
		case 'select':
			field = <SelectControl { ...commonProps } options={ control.options || [] } />; break;
		case 'animation':
			field = <div className="xsb-motion-control"><label className="xsb-control-label">{ control.label }</label><select className="xsb-select-input" value={ val || 'none' } onChange={ ( e ) => handleValueChange( e.target.value ) }><option value="none">{ __( 'No animation', 'xcodesol-page-builder' ) }</option>{ ( control.options || [] ).filter( ( option ) => option.value !== 'none' ).map( ( option ) => <option key={ option.value } value={ option.value }>{ option.label }</option> ) }</select>{ val && val !== 'none' && <><div className="xsb-motion-options"><label>{ __( 'Timing', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ settings.animation_easing || 'ease' } onChange={ ( e ) => onUpdate( { animation_easing: e.target.value } ) }><option value="ease">Ease</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in out</option><option value="linear">Linear</option></select></label><label>{ __( 'Repeat', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ settings.animation_repeat || '1' } onChange={ ( e ) => onUpdate( { animation_repeat: e.target.value } ) }><option value="1">Once</option><option value="2">2 times</option><option value="3">3 times</option><option value="infinite">Loop</option></select></label></div><div className="xsb-motion-preview-card"><div key={ `${ val }-${ settings.animation_duration || 600 }-${ settings.animation_delay || 0 }-${ settings.animation_easing || 'ease' }` } className="xsb-motion-preview" style={ { animationName: `xsb-motion-${ val }`, animationDuration: `${ Number( settings.animation_duration ) || 600 }ms`, animationDelay: `${ Number( settings.animation_delay ) || 0 }ms`, animationTimingFunction: settings.animation_easing || 'ease', animationFillMode: 'both', animationIterationCount: settings.animation_repeat || '1' } }><span className="xsb-motion-preview__spark" aria-hidden="true">✦</span><span>{ __( 'Live preview', 'xcodesol-page-builder' ) }</span></div><span className="xsb-motion-preview-card__caption">{ __( 'This sample previews the selected effect.', 'xcodesol-page-builder' ) }</span></div></>}</div>; break;
		case 'choose':
			field = <ChooseSegmentedControl { ...commonProps } options={ control.options || [] } />; break;
		case 'toggle':
			field = <ToggleControl { ...commonProps } help={ control.help } />; break;
		case 'color':
			field = <ColorPickerControl { ...commonProps } defaultColor={ control.default } />; break;
		case 'gradient':
			field = <GradientControl { ...commonProps } />; break;
		case 'media':
			field = <MediaPickerControl { ...commonProps } label={ control.label } allowedTypes={ control.allowedTypes } />; break;
		case 'dimensions':
			field = (
				<DimensionsControl
					{ ...commonProps }
					units={ control.units || [ 'px', '%', 'em', 'rem' ] }
					allowNegative={ control.allowNegative }
					mode={ control.mode || 'sides' }
				/>
			); break;
		case 'box_shadow':
			field = <BoxShadowGroup { ...commonProps } />; break;
		case 'border':
			field = <BorderGroup { ...commonProps } />; break;
		case 'typography':
			field = <TypographyGroup { ...commonProps } />; break;
		case 'repeater':
			field = <RepeaterControl { ...commonProps } itemSchema={ control.itemSchema } addLabel={ control.addLabel } />; break;
		case 'code':
			field = <CodeEditorControl { ...commonProps } placeholder={ control.placeholder } />; break;
		default:
			return null;
	}
	return <div className="xsb-schema-control"><div className="xsb-schema-control__field">{ field }</div>{ control.help && control.type !== 'toggle' && <p className="xsb-schema-control__help">{ control.help }</p> }</div>;
}

/**
 * 20. Schema Inspector Renderer: Full tab / collapsible section orchestrator.
 */
export function SchemaInspectorRenderer( {
	schema,
	manifest,
	settings = {},
	dynamicPreview = {},
	context = {},
	onUpdateSetting,
	activeTab = 'content',
	activeDevice = 'desktop',
	activeState = 'default',
	searchQuery = '',
	sectionStates = {},
	setSectionStates,
	resetVersion = 0,
	blockType = '',
} ) {
	if ( ! schema || ! Array.isArray( schema.sections ) || ! Array.isArray( schema.controls ) ) {
		return null;
	}

	const evaluateCondition = ( condition ) => {
		if ( ! condition ) return true;
		return Object.entries( condition ).every( ( [ key, expected ] ) => {
			const current = key === 'type' ? blockType : ( key in context ? context[ key ] : settings[ key ] );
			if ( typeof expected === 'function' ) return !! expected( current, settings, context );
			if ( Array.isArray( expected ) ) {
				return expected.includes( current );
			}
			return current === expected;
		} );
	};

	const normalizedQuery = searchQuery.trim().toLowerCase();
	const matchingControls = normalizedQuery ? schema.controls.filter( control => evaluateCondition( control.condition ) && String( control.label || control.id || '' ).toLowerCase().includes( normalizedQuery ) ) : null;
	const resultTabs = matchingControls ? [ ...new Set( matchingControls.map( control => control.tab ) ) ] : [ activeTab ];
	const currentSections = schema.sections.filter( section => resultTabs.includes( section.tab ) );
	const hasSearchMatch = ! normalizedQuery || matchingControls.length > 0;

	return (
		<div className="xsb-schema-inspector-wrap">
			{ ! hasSearchMatch && <p className="xsb-inspector-search-empty">{ __( 'No settings match your search.', 'xcodesol-page-builder' ) }</p> }
			{ currentSections.map( ( section ) => {
				if ( ! evaluateCondition( section.condition ) ) return null;

				const sectionControls = schema.controls.filter(
					( c ) => c.section === section.id && evaluateCondition( c.condition )
				);

				const filteredControls = normalizedQuery
					? sectionControls.filter( ( c ) =>
							String( c.label || c.id || '' ).toLowerCase().includes( normalizedQuery )
					  )
					: sectionControls;
				const visibleControls = section.stateful && ( sectionStates?.[ section.id ] || 'default' ) !== 'default'
					? filteredControls.filter( control => ( sectionStates[ section.id ] === 'focus' ? control.supportsFocus : control.supportsHover ) )
					: filteredControls;

				if ( visibleControls.length === 0 ) return null;

				return (
					<CollapsibleSection
						key={ section.id }
						id={ section.id }
						title={ section.title || section.label }
						defaultOpen={ section.defaultOpen }
						resetVersion={ resetVersion }
							onReset={ () => {
							const patch = {};
							sectionControls.forEach( control => {
								const keys = [ control.id, `hover_${ control.id }`, `focus_${ control.id }`, `hover_${ control.id }_tablet`, `hover_${ control.id }_mobile`, `focus_${ control.id }_tablet`, `focus_${ control.id }_mobile`, ...[ 'tablet', 'mobile' ].map( device => `${ device }_${ control.id }` ) ];
								keys.forEach( key => { patch[ key ] = undefined; } );
								if ( control.id === 'url' && typeof settings.url === 'object' ) { patch.url = null; }
							} );
							setSectionStates?.( prev => ( { ...prev, [ section.id ]: 'default' } ) );
							const next = { ...settings, ...patch };
							Object.keys( next ).forEach( key => { if ( next[ key ] === undefined ) delete next[ key ]; } );
							onUpdateSetting( next );
						} }
						stateControls={ section.stateful && section.tab === 'style' && sectionControls.some( control => control.supportsHover || control.supportsFocus ) ? <div className="xsb-section-state-tabs" role="group" aria-label={ __( 'Style state', 'xcodesol-page-builder' ) }>{ [ [ 'default', __( 'Normal', 'xcodesol-page-builder' ) ], ...( sectionControls.some( c => c.supportsHover ) ? [ [ 'hover', __( 'Hover', 'xcodesol-page-builder' ) ] ] : [] ), ...( sectionControls.some( c => c.supportsFocus ) ? [ [ 'focus', __( 'Focus', 'xcodesol-page-builder' ) ] ] : [] ) ].map( ( [ state, label ] ) => <button key={ state } type="button" className={ ( sectionStates?.[ section.id ] || 'default' ) === state ? 'is-active' : '' } onClick={ () => setSectionStates?.( prev => ( { ...prev, [ section.id ]: state } ) ) }>{ label }</button> ) }</div> : null }
					>
						{ visibleControls.map( ( control ) => (
							<DynamicControlRenderer
								key={ `${ control.id }-${ control.condition?.type?.join?.( '-' ) || control.condition?.type || '' }` }
								control={ control }
								blockType={ blockType }
								settings={ settings }
								activeDevice={ activeDevice }
								activeState={ activeState }
								sectionStateful={ !! section.stateful }
								sectionActiveState={ sectionStates?.[ section.id ] || 'default' }
								dynamicPreview={ dynamicPreview }
								onUpdate={ onUpdateSetting }
								manifest={ manifest || schema?.manifest }
							/>
						) ) }
					</CollapsibleSection>
				);
			} ) }
		</div>
	);
}

/**
 * Legacy exports for compatibility.
 */
export function AlignmentControl( {
	label = __( 'Alignment', 'xcodesol-page-builder' ),
	value = 'left',
	onChange,
	includeJustify = true,
	device,
	isOverridden,
	onResetDevice,
} ) {
	const options = [
		{ value: 'left', label: __( 'Left', 'xcodesol-page-builder' ), icon: <IconAlignLeft width={ 15 } height={ 15 } /> },
		{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ), icon: <IconAlignCenter width={ 15 } height={ 15 } /> },
		{ value: 'right', label: __( 'Right', 'xcodesol-page-builder' ), icon: <IconAlignRight width={ 15 } height={ 15 } /> },
	];
	if ( includeJustify ) {
		options.push( { value: 'justify', label: __( 'Justified', 'xcodesol-page-builder' ), icon: <IconAlignJustify width={ 15 } height={ 15 } /> } );
	}
	return (
		<ChooseSegmentedControl
			label={ label }
			value={ value }
			onChange={ onChange }
			options={ options }
			activeDevice={ device }
			isOverridden={ isOverridden }
			onResetDevice={ onResetDevice }
		/>
	);
}

export function SizeControl( {
	label = __( 'Size', 'xcodesol-page-builder' ),
	value = 'md',
	onChange,
	options = [
		{ value: 'xs', label: 'XS' },
		{ value: 'small', label: 'S' },
		{ value: 'md', label: 'M' },
		{ value: 'large', label: 'L' },
		{ value: 'xl', label: 'XL' },
	],
} ) {
	const normalizedValue = value === 'medium' ? 'md' : value;
	return (
		<ChooseSegmentedControl
			label={ label }
			value={ normalizedValue }
			onChange={ onChange }
			options={ options }
		/>
	);
}

export function LinkControl( {
	label = __( 'Link URL', 'xcodesol-page-builder' ),
	value = '',
	onChangeUrl,
	targetBlank = false,
	onChangeTargetBlank,
	nofollow = false,
	onChangeNofollow,
} ) {
	const [ showOptions, setShowOptions ] = useState( false );

	return (
		<div className="xsb-control-field xsb-link-control">
			<label className="xsb-control-label">{ label }</label>
			<div className="xsb-link-input-wrap">
				<span className="xsb-link-input-icon">
					<IconLink width={ 14 } height={ 14 } />
				</span>
				<input
					type="url"
					className="xsb-text-input xsb-link-input"
					placeholder="https://example.com"
					value={ value || '' }
					onChange={ ( e ) => onChangeUrl( e.target.value ) }
				/>
				<button
					type="button"
					className={ `xsb-link-options-toggle${ showOptions || targetBlank || nofollow ? ' is-active' : '' }` }
					onClick={ () => setShowOptions( ( v ) => ! v ) }
					title={ __( 'Link options', 'xcodesol-page-builder' ) }
				>
					<IconExternalLink width={ 13 } height={ 13 } />
				</button>
			</div>

			{ showOptions && (
				<div className="xsb-link-options-dropdown">
					<label className="xsb-checkbox-row">
						<input
							type="checkbox"
							checked={ !! targetBlank }
							onChange={ ( e ) => onChangeTargetBlank && onChangeTargetBlank( e.target.checked ) }
						/>
						<span>{ __( 'Open in new tab', 'xcodesol-page-builder' ) }</span>
					</label>
					<label className="xsb-checkbox-row">
						<input
							type="checkbox"
							checked={ !! nofollow }
							onChange={ ( e ) => onChangeNofollow && onChangeNofollow( e.target.checked ) }
						/>
						<span>{ __( 'Add nofollow (SEO)', 'xcodesol-page-builder' ) }</span>
					</label>
				</div>
			) }
		</div>
	);
}

export function ButtonLivePreview( { settings = {} } ) {
	const [ isHovered, setIsHovered ] = useState( false );
	const bg = isHovered
		? ( settings.hover_bg_color || settings.bg_color || '#4338ca' )
		: ( settings.bg_color || '#4f46e5' );
	const textCol = isHovered
		? ( settings.hover_text_color || settings.text_color || '#ffffff' )
		: ( settings.text_color || '#ffffff' );
	const radius = settings.border_radius ?? 6;

	return (
		<div className="xsb-live-btn-preview-card">
			<div className="xsb-live-btn-preview-card__header">
				<span className="xsb-live-preview-badge">{ __( 'Live Preview', 'xcodesol-page-builder' ) }</span>
				<div className="xsb-state-pill-group">
					<button
						type="button"
						className={ `xsb-state-pill${ ! isHovered ? ' is-active' : '' }` }
						onClick={ () => setIsHovered( false ) }
					>
						{ __( 'Normal', 'xcodesol-page-builder' ) }
					</button>
					<button
						type="button"
						className={ `xsb-state-pill${ isHovered ? ' is-active' : '' }` }
						onClick={ () => setIsHovered( true ) }
					>
						{ __( 'Hover', 'xcodesol-page-builder' ) }
					</button>
				</div>
			</div>
			<div
				className="xsb-live-btn-preview-stage"
				onMouseEnter={ () => setIsHovered( true ) }
				onMouseLeave={ () => setIsHovered( false ) }
			>
				<button
					type="button"
					className="xsb-sample-rendered-button"
					style={ {
						backgroundColor: bg,
						color: textCol,
						borderRadius: `${ radius }px`,
					} }
				>
					{ settings.text || __( 'Button Text', 'xcodesol-page-builder' ) }
				</button>
			</div>
		</div>
	);
}

export function InspectorEmptyState( { onBrowseElements } ) {
	return (
		<div className="xsb-inspector-empty-state">
			<div className="xsb-inspector-empty-state__icon">
				<IconElements width={ 44 } height={ 44 } />
			</div>
			<h4 className="xsb-inspector-empty-state__title">
				{ __( 'No block selected', 'xcodesol-page-builder' ) }
			</h4>
			<p className="xsb-inspector-empty-state__desc">
				{ __( 'Select an element on the canvas to configure its content, styles, and options.', 'xcodesol-page-builder' ) }
			</p>
			{ onBrowseElements && (
				<button
					type="button"
					className="xsb-btn xsb-btn--primary xsb-btn--sm"
					onClick={ onBrowseElements }
				>
					{ __( 'Browse Elements', 'xcodesol-page-builder' ) }
				</button>
			) }
		</div>
	);
}
