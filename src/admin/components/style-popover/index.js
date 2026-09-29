/**
 * StylePopover — the redesigned floating style panel.
 *
 * UX flow (progressive disclosure):
 *   1. Opens beside the selected canvas element.
 *   2. Root view lists the style categories supported by the element
 *      (Typography, Colors, Background, Spacing, Border & radius, Shadow,
 *      Effects, Layout…), each with its "N changes" count.
 *   3. Picking a category replaces the menu with that category's controls.
 *      ← returns to the menu. Every change applies instantly.
 *   4. A compact device/state toolbar sits under the header; the footer
 *      offers Reset (per category / all, with confirmation), Copy/Paste
 *      styles and Done (no Save — changes are live).
 *
 * Widgets with several styled parts (banner, term lists, containers…)
 * expose a horizontal element tab strip; every element carries its own
 * categories so styling never mixes between parts.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useRef, useMemo, createPortal } from '@wordpress/element';

import { StylePopoverHeader } from './header';
import { StylePopoverToolbar } from './toolbar';
import {
	StyleCategoryMenu,
	CATEGORY_META,
	elementCategoryIds,
	elementChangedCount,
	elementKeys,
	categoryChangedCount,
} from './category-menu';
import { StylePopoverFooter } from './footer';
import { getWidgetConfig, getWidgetElements, categoryKeys } from './config';
import { usePopoverPosition, isMobileViewport } from './position';
import { isKeySet, writeStyleClipboard, readStyleClipboard } from './controls';
import {
	deviceKey,
	deviceLayer,
	deviceHasOverrideOn,
	isKeySetAnyDevice,
} from '../../styles/responsive';

import {
	renderTypographyCategory,
	renderColorsCategory,
	renderBackgroundCategory,
	renderSpacingCategory,
	renderBorderCategory,
	renderShadowCategory,
	renderEffectsCategory,
	renderTransformCategory,
	renderLayoutCategory,
	renderPositionCategory,
	renderDimensionsCategory,
	renderImageEffectsCategory,
	renderImageSettingsCategory,
	renderAdvancedCategory,
} from './categories';

const CATEGORY_RENDERERS = {
	typography: renderTypographyCategory,
	colors: renderColorsCategory,
	background: renderBackgroundCategory,
	spacing: renderSpacingCategory,
	border: renderBorderCategory,
	shadow: renderShadowCategory,
	effects: renderEffectsCategory,
	transform: renderTransformCategory,
	layout: renderLayoutCategory,
	position: renderPositionCategory,
	dimensions: renderDimensionsCategory,
	imageEffects: renderImageEffectsCategory,
	imageSettings: renderImageSettingsCategory,
	advanced: renderAdvancedCategory,
};

const PRESETS_KEY = 'xsb-style-presets-v1';

/* ------------------------------- presets ------------------------- */

function readPresets() {
	try {
		const raw = window.localStorage.getItem( PRESETS_KEY );
		const list = raw ? JSON.parse( raw ) : [];
		return Array.isArray( list ) ? list : [];
	} catch ( e ) {
		return [];
	}
}

function storePreset( preset ) {
	try {
		const list = readPresets();
		list.unshift( preset );
		window.localStorage.setItem( PRESETS_KEY, JSON.stringify( list.slice( 0, 20 ) ) );
	} catch ( e ) {
		/* storage unavailable — ignore */
	}
}

/* ------------------------- clipboard helpers --------------------- */

function parseClipboard() {
	const raw = readStyleClipboard();
	if ( ! raw ) {
		return null;
	}
	try {
		const data = JSON.parse( raw );
		if ( ! data || ! data.__xsbStyle || ! data.values || typeof data.values !== 'object' ) {
			return null;
		}
		return data;
	} catch ( e ) {
		return null;
	}
}

/**
 * View settings for one element: container columns read their entry from
 * settings.column_styles, everything else reads the flat settings map.
 */
function viewSettingsForElement( el, settings ) {
	const match = el && /^col-(\d+)$/.exec( el.id || '' );
	if ( ! match ) {
		return settings;
	}
	const stored = Array.isArray( settings.column_styles ) ? settings.column_styles : [];
	const entry = stored[ Number( match[ 1 ] ) ];
	return entry && typeof entry === 'object' ? entry : {};
}

/**
 * Change handler for one element: container columns write into
 * settings.column_styles[ index ], everything else writes flat keys.
 */
function makeElementChange( el, settings, onChange ) {
	const match = el && /^col-(\d+)$/.exec( el.id || '' );
	if ( ! match ) {
		return onChange;
	}
	const index = Number( match[ 1 ] );
	return ( key, value ) => {
		const stored = Array.isArray( settings.column_styles ) ? settings.column_styles : [];
		const next = stored.slice();
		while ( next.length <= index ) {
			next.push( {} );
		}
		const updated = { ...( next[ index ] || {} ) };
		if ( value === undefined || value === '' || value === false || value === null ) {
			delete updated[ key ];
		} else {
			updated[ key ] = value;
		}
		next[ index ] = updated;
		onChange( 'column_styles', next );
	};
}

/* --------------------------- main component ---------------------- */

/**
 * @param {Object}   props
 * @param {string}   props.type      Block type.
 * @param {string}   props.label     Human-readable widget label.
 * @param {Object}   props.settings  Resolved block settings.
 * @param {Function} props.onChange  (key, value) => void.
 * @param {Function} props.onClose   Close the popover.
 * @param {Object}   props.style     Fixed-position anchor hint from the canvas.
 */
function StylePopover( { type, label, settings, onChange, onClose, style, onDeviceChange } ) {
	const cfg = getWidgetConfig( type );
	const elements = useMemo( () => getWidgetElements( cfg, settings ), [ cfg, settings ] );

	const [ elementId, setElementId ] = useState( null );
	const [ openCategory, setOpenCategory ] = useState( null );
	const [ device, setDevice ] = useState( 'desktop' );
	const [ stateKey, setStateKey ] = useState( 'default' );

	const switchDevice = ( next ) => {
		setDevice( next );
		setNotice( null );
		if ( typeof onDeviceChange === 'function' ) {
			onDeviceChange( next );
		}
	};
	const [ confirmAll, setConfirmAll ] = useState( false );
	const [ notice, setNotice ] = useState( null );
	const [ moreOpen, setMoreOpen ] = useState( false );

	const contentRef = useRef( null );
	const pos = usePopoverPosition( { open: true, anchorStyle: style, contentRef } );

	// Reset navigation state when the widget (or its layout) changes.
	useEffect( () => {
		setElementId( elements.length ? elements[ 0 ].id : null );
		setOpenCategory( null );
		setDevice( 'desktop' );
		setStateKey( 'default' );
		setConfirmAll( false );
		setNotice( null );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ type, settings.columns ] );

	// Escape closes the whole popover.
	useEffect( () => {
		const onKey = ( e ) => {
			if ( 'Escape' === e.key ) {
				onClose();
			}
		};
		document.addEventListener( 'keydown', onKey );
		return () => document.removeEventListener( 'keydown', onKey );
	}, [ onClose ] );

	// Focus the panel when it opens (desktop popovers are non-modal, so no
	// focus trap — the user can keep interacting with the canvas).
	useEffect( () => {
		const el = contentRef.current;
		if ( el && typeof el.focus === 'function' ) {
			el.focus( { preventScroll: true } );
		}
	}, [] );

	// On mobile the popover is a full-height sheet — lock body scroll.
	useEffect( () => {
		if ( ! isMobileViewport() ) {
			return undefined;
		}
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [] );

	/* Info-only widgets (product grid). */
	if ( cfg && cfg.info && ! elements.length ) {
		return (
			<PopoverShell pos={ pos } contentRef={ contentRef } onClose={ onClose } className="xsb-style-popover--info">
				<div className="xsb-style-popover__info-body">
					<span className="dashicons dashicons-info" aria-hidden="true" />
					<p>{ cfg.info }</p>
				</div>
			</PopoverShell>
		);
	}

	if ( ! cfg || ! elements.length ) {
		return null;
	}

	const activeElement = elements.find( ( el ) => el.id === elementId ) || elements[ 0 ];
	const sourceSettings = viewSettingsForElement( activeElement, settings );

	const ids = elementCategoryIds( activeElement );
	const category = openCategory && ids.includes( openCategory ) ? openCategory : null;

	// Device layer: desktop edits the stored keys directly; tablet/mobile
	// edits land on their own tablet_/mobile_ variants and controls only
	// show the values this device has overridden (everything else inherits).
	const activeDevice = category === 'advanced' ? 'desktop' : device;
	const viewSettings = activeDevice === 'desktop'
		? sourceSettings
		: deviceLayer( sourceSettings, activeDevice );
	const changeBase = makeElementChange( activeElement, settings, onChange );
	const change = ( key, value ) => changeBase( deviceKey( key, activeDevice ), value );

	const activeKeys = elementKeys( activeElement );
	const totalChanges = elementChangedCount( activeElement, viewSettings );
	const categoryCount = category ? categoryChangedCount( activeElement, category, viewSettings ) : 0;

	// Per-device override state (drives the toolbar dots).
	const badgeTablet = deviceHasOverrideOn( sourceSettings, activeKeys, 'tablet' );
	const badgeMobile = deviceHasOverrideOn( sourceSettings, activeKeys, 'mobile' );

	const states = activeElement.states && activeElement.states.length
		? [ 'default', ...activeElement.states ]
		: [ 'default' ];

	const context = cfg.label === activeElement.label
		? cfg.label
		: sprintf( __( '%s / %s', 'xcodesol-page-builder' ), cfg.label, activeElement.label );
	const title = category ? CATEGORY_META[ category ].label : activeElement.label;

	/* ---------------- actions ---------------- */

	const doCopy = () => {
		const values = {};
		activeKeys.forEach( ( k ) => {
			if ( isKeySet( viewSettings, k ) ) {
				values[ k ] = viewSettings[ k ];
			}
		} );
		writeStyleClipboard( JSON.stringify( { __xsbStyle: true, label: activeElement.label, values } ) );
		setNotice( __( 'Styles copied.', 'xcodesol-page-builder' ) );
	};

	const doPaste = () => {
		const data = parseClipboard();
		if ( ! data ) {
			return;
		}
		let applied = 0;
		Object.keys( data.values ).forEach( ( k ) => {
			if ( activeKeys.includes( k ) ) {
				change( k, data.values[ k ] );
				applied += 1;
			}
		} );
		setNotice( applied > 0
			? sprintf( __( 'Pasted %d style values.', 'xcodesol-page-builder' ), applied )
			: __( 'Nothing compatible to paste here.', 'xcodesol-page-builder' ) );
	};

	const doResetAll = () => {
		// Clear the value on every device (bare + tablet_ + mobile_ keys).
		activeKeys.forEach( ( k ) => {
			[ '', 'tablet_', 'mobile_' ].forEach( ( prefix ) => changeBase( prefix + k, undefined ) );
		} );
		setConfirmAll( false );
		setNotice( __( 'All styles reset to defaults (every device).', 'xcodesol-page-builder' ) );
	};

	const doResetCategory = () => {
		if ( ! category ) {
			return;
		}
		categoryKeys( category, activeElement.categories[ category ] ).forEach( ( k ) => change( k, undefined ) );
		setNotice( sprintf( __( '%s reset to defaults.', 'xcodesol-page-builder' ), CATEGORY_META[ category ].label ) );
	};

	const doSavePreset = () => {
		const values = {};
		activeKeys.forEach( ( k ) => {
			if ( isKeySet( viewSettings, k ) ) {
				values[ k ] = viewSettings[ k ];
			}
		} );
		storePreset( {
			label: sprintf( __( '%s — %s', 'xcodesol-page-builder' ), label, activeElement.label ),
			values,
			savedAt: Date.now(),
		} );
		setNotice( __( 'Preset saved — reuse it with the Copy button on any similar element.', 'xcodesol-page-builder' ) );
	};

	const clipboardData = parseClipboard();
	const canPaste = !! ( clipboardData && clipboardData.values && activeKeys.some( ( k ) => clipboardData.values[ k ] !== undefined ) );

	const moreItems = [
		{
			label: __( 'Copy styles', 'xcodesol-page-builder' ),
			icon: 'dashicons-admin-page',
			disabled: ! totalChanges,
			onClick: doCopy,
		},
		{
			label: __( 'Paste styles', 'xcodesol-page-builder' ),
			icon: 'dashicons-clipboard',
			disabled: ! canPaste,
			onClick: doPaste,
		},
		{
			label: __( 'Save as preset', 'xcodesol-page-builder' ),
			icon: 'dashicons-star-filled',
			disabled: ! totalChanges,
			onClick: doSavePreset,
		},
		{
			label: __( 'Reset all styles for this element', 'xcodesol-page-builder' ),
			icon: 'dashicons-undo',
			disabled: ! totalChanges,
			onClick: () => setConfirmAll( true ),
		},
	];

	/* ---------------- body ---------------- */

	const elementTabs = elements.length > 1 ? (
		<div className="xsb-style-element-tabs" role="tablist" aria-label={ __( 'Part of the widget to style', 'xcodesol-page-builder' ) }>					{ elements.map( ( el ) => {
						const elSource = viewSettingsForElement( el, settings );
						const changed = elementKeys( el ).some( ( k ) => isKeySetAnyDevice( elSource, k ) );
				return (
					<button
						key={ el.id }
						type="button"
						role="tab"
						aria-selected={ activeElement.id === el.id }
						className={ 'xsb-style-element-tab' + ( activeElement.id === el.id ? ' is-active' : '' ) + ( changed ? ' is-changed' : '' ) }
						onClick={ () => {
							setElementId( el.id );
							setOpenCategory( null );
							setNotice( null );
						} }
					>
						{ el.label }
						{ changed && <span className="xsb-style-element-tab__dot" aria-hidden="true" /> }
					</button>
				);
			} ) }
		</div>
	) : null;

	const body = (
		<div className="xsb-style-popover__body">
			{ ! category && elementTabs }
			{ ! category ? (
				<>
					{ cfg.info && (
						<p className="xsb-field-help xsb-style-popover__menu-info">
							{ cfg.info }
						</p>
					) }
					{ ids.length ? (
						<StyleCategoryMenu
							ids={ ids }
							element={ activeElement }
							settings={ viewSettings }
							onPick={ ( id ) => {
								setOpenCategory( id );
								setNotice( null );
							} }
						/>
					) : (
						<p className="xsb-field-help xsb-style-popover__empty">
							{ __( 'This element has no style options yet.', 'xcodesol-page-builder' ) }
						</p>
					) }
				</>
			) : (
				<div className="xsb-style-category-panel">
					{CATEGORY_RENDERERS[ category ]( {
						settings: viewSettings,
						onChange: change,
						cfg: activeElement.categories[ category ],
					} )}
				</div>
			) }
		</div>
	);

	return (
		<PopoverShell pos={ pos } contentRef={ contentRef } onClose={ onClose } onInteriorClick={ () => setMoreOpen( false ) }>
			<StylePopoverHeader
				title={ title }
				context={ context }
				isCategory={ !! category }
				moreOpen={ moreOpen }
				onToggleMore={ () => setMoreOpen( ( v ) => ! v ) }
				onCloseMore={ () => setMoreOpen( false ) }
				onBack={ () => setOpenCategory( null ) }
				onClose={ onClose }
				moreItems={ moreItems }
			/>
			<StylePopoverToolbar
				device={ device }
				onDevice={ switchDevice }
				state={ stateKey }
				states={ states }
				onState={ setStateKey }
				badgeTablet={ badgeTablet }
				badgeMobile={ badgeMobile }
			/>
			{ body }
			{ notice && (
				<div className="xsb-style-popover__notice" role="status">
					<span className="dashicons dashicons-yes-alt" aria-hidden="true" />
					<span>{ notice }</span>
					<button
						type="button"
						className="xsb-style-popover__notice-close"
						onClick={ () => setNotice( null ) }
						aria-label={ __( 'Dismiss', 'xcodesol-page-builder' ) }
					>
						<span className="dashicons dashicons-no-alt" aria-hidden="true" />
					</button>
				</div>
			) }
			<StylePopoverFooter
				view={ category ? 'category' : 'menu' }
				categoryLabel={ category ? CATEGORY_META[ category ].label : '' }
				categoryCount={ categoryCount }
				hasChanges={ totalChanges > 0 }
				canPaste={ canPaste }
				confirming={ confirmAll }
				onAskConfirm={ () => setConfirmAll( true ) }
				onCancelConfirm={ () => setConfirmAll( false ) }
				onCopy={ doCopy }
				onPaste={ doPaste }
				onResetCategory={ doResetCategory }
				onResetAll={ doResetAll }
				onDone={ onClose }
			/>
		</PopoverShell>
	);
}

/* --------------------------- portal shell ------------------------ */

/**
 * Renders the popover into document.body with measured fixed positioning
 * (never clipped by the canvas), a high z-index and — below 768px — a
 * full-height bottom sheet instead of a floating panel.
 */
function PopoverShell( { children, pos, contentRef, onInteriorClick, className = '' } ) {
	const root = typeof document !== 'undefined' ? document.body : null;
	if ( ! root ) {
		return null;
	}
	const mobile = isMobileViewport();

	return createPortal(
		<div
			ref={ contentRef }
			role="dialog"
			aria-modal="false"
			aria-labelledby="xsb-style-popover-title"
			tabIndex={ -1 }
			className={ `xsb-style-popover xsb-style-popover__root${ className }${ mobile ? ' xsb-style-popover--mobile-sheet' : '' }` }
			style={ mobile ? undefined : { left: pos ? pos.left : undefined, top: pos ? pos.top : undefined, maxHeight: pos ? pos.maxHeight : undefined } }
			onPointerDown={ ( e ) => e.stopPropagation() }
			onPointerMove={ ( e ) => e.stopPropagation() }
			onPointerUp={ ( e ) => e.stopPropagation() }
			/* The popover is a React child of the canvas widget tree (it is only
			   portaled for the DOM), so synthetic keydowns would bubble up to the
			   widget's drag-and-drop activator — that made Enter/Shift+Enter
			   "activate" the widget while typing. Stop them at the shell. Native
			   document listeners (e.g. Escape to close) still fire. */
			onKeyDown={ ( e ) => e.stopPropagation() }
			onKeyUp={ ( e ) => e.stopPropagation() }
			onClick={ ( e ) => {
				e.stopPropagation();
				if ( onInteriorClick ) {
					onInteriorClick();
				}
			} }
		>
			{ children }
		</div>,
		root
	);
}

export default StylePopover;