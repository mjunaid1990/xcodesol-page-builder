/**
 * Shared style editor used in the inspector (docked) and the optional
 * canvas popover. Categories are accordions so values stay one click away.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';

import { StylePopoverToolbar, DeviceTabs, StateSelect } from './style-popover/toolbar';
import {
	CATEGORY_META,
	elementCategoryIds,
	elementChangedCount,
	elementKeys,
	categoryChangedCount,
} from './style-popover/category-menu';
import { getWidgetConfig, getWidgetElements } from './style-popover/config';
import { isKeySet, writeStyleClipboard, readStyleClipboard, StyleGroup } from './style-popover/controls';
import {
	deviceKey,
	deviceLayer,
	deviceHasOverrideOn,
	isKeySetAnyDevice,
} from '../styles/responsive';

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
	renderVisibilityCategory,
} from './style-popover/categories';

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
	visibility: renderVisibilityCategory,
	advanced: renderAdvancedCategory,
};

const PRESETS_KEY = 'xsb-style-presets-v1';

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

function viewSettingsForElement( el, settings ) {
	const match = el && /^col-(\d+)$/.exec( el.id || '' );
	if ( ! match ) {
		return settings;
	}
	const stored = Array.isArray( settings.column_styles ) ? settings.column_styles : [];
	const entry = stored[ Number( match[ 1 ] ) ];
	return entry && typeof entry === 'object' ? entry : {};
}

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

/**
 * @param {Object}   props
 * @param {string}   props.type
 * @param {Object}   props.settings
 * @param {Function} props.onChange
 * @param {string}   props.device
 * @param {Function} props.onDeviceChange
 * @param {string}   props.variant  'docked' | 'popover'
 */
export function StyleEditor( {
	type,
	settings,
	onChange,
	device: deviceProp,
	onDeviceChange,
	variant = 'docked',
} ) {
	const cfg = getWidgetConfig( type );
	const elements = useMemo( () => getWidgetElements( cfg, settings ), [ cfg, settings ] );

	const [ elementId, setElementId ] = useState( null );
	const [ device, setDevice ] = useState( deviceProp || 'desktop' );
	const [ stateKey, setStateKey ] = useState( 'default' );
	const [ notice, setNotice ] = useState( null );
	const [ confirmAll, setConfirmAll ] = useState( false );
	const [ searchFilter, setSearchFilter ] = useState( '' );
	const [ activeCategoryFilter, setActiveCategoryFilter ] = useState( 'all' );

	useEffect( () => {
		if ( deviceProp && deviceProp !== device ) {
			setDevice( deviceProp );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ deviceProp ] );

	useEffect( () => {
		setElementId( elements.length ? elements[ 0 ].id : null );
		setStateKey( 'default' );
		setConfirmAll( false );
		setNotice( null );
		setSearchFilter( '' );
		setActiveCategoryFilter( 'all' );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ type, settings.columns ] );

	const switchDevice = ( next ) => {
		setDevice( next );
		setNotice( null );
		if ( typeof onDeviceChange === 'function' ) {
			onDeviceChange( next );
		}
	};

	if ( cfg && cfg.info && ! elements.length ) {
		return (
			<div className="xsb-style-editor xsb-style-editor--info">
				<p className="xsb-inspector-help">{ cfg.info }</p>
			</div>
		);
	}

	if ( ! cfg || ! elements.length ) {
		return (
			<p className="xsb-inspector-none">
				{ __( 'This widget has no style options yet.', 'xcodesol-page-builder' ) }
			</p>
		);
	}

	const activeElement = elements.find( ( el ) => el.id === elementId ) || elements[ 0 ];
	const sourceSettings = viewSettingsForElement( activeElement, settings );
	const ids = elementCategoryIds( activeElement );

	const activeDevice = device;
	const viewSettings = activeDevice === 'desktop'
		? sourceSettings
		: deviceLayer( sourceSettings, activeDevice );
	const changeBase = makeElementChange( activeElement, settings, onChange );
	const change = ( key, value ) => changeBase( deviceKey( key, activeDevice ), value );

	const activeKeys = elementKeys( activeElement );
	const totalChanges = elementChangedCount( activeElement, viewSettings );
	const badgeTablet = deviceHasOverrideOn( sourceSettings, activeKeys, 'tablet' );
	const badgeMobile = deviceHasOverrideOn( sourceSettings, activeKeys, 'mobile' );

	const states = activeElement.states && activeElement.states.length
		? [ 'default', ...activeElement.states ]
		: [ 'default' ];

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
		activeKeys.forEach( ( k ) => {
			[ '', 'tablet_', 'mobile_' ].forEach( ( prefix ) => changeBase( prefix + k, undefined ) );
		} );
		setConfirmAll( false );
		setNotice( __( 'All styles reset to defaults.', 'xcodesol-page-builder' ) );
	};

	const clipboardData = parseClipboard();
	const canPaste = !! ( clipboardData && clipboardData.values && activeKeys.some( ( k ) => clipboardData.values[ k ] !== undefined ) );

	const query = ( searchFilter || '' ).trim().toLowerCase();
	const visibleIds = ids.filter( ( id ) => {
		if ( activeCategoryFilter !== 'all' && id !== activeCategoryFilter ) {
			return false;
		}
		if ( ! query ) {
			return true;
		}
		const meta = CATEGORY_META[ id ];
		const label = ( meta ? meta.label : id ).toLowerCase();
		const kw = ( meta && meta.keywords ? meta.keywords : '' ).toLowerCase();
		return label.includes( query ) || kw.includes( query );
	} );

	return (
		<div className={ `xsb-style-editor xsb-style-editor--${ variant }` }>
			{ cfg.info && (
				<p className="xsb-inspector-help">{ cfg.info }</p>
			) }

			{ elements.length > 1 && (
				<div className="xsb-style-element-tabs" role="tablist" aria-label={ __( 'Part of the widget to style', 'xcodesol-page-builder' ) }>
					{ elements.map( ( el ) => {
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
									setNotice( null );
								} }
							>
								{ el.label }
								{ changed && <span className="xsb-style-element-tab__dot" aria-hidden="true" /> }
							</button>
						);
					} ) }
				</div>
			) }

			<div className="xsb-style-studio-bar">
				<DeviceTabs
					device={ device }
					onChange={ switchDevice }
					badges={ { tablet: badgeTablet, mobile: badgeMobile } }
				/>
				<div className="xsb-style-studio-actions">
					<button
						type="button"
						className="xsb-studio-btn"
						disabled={ ! totalChanges }
						onClick={ doCopy }
						title={ __( 'Copy styles to clipboard', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Copy styles', 'xcodesol-page-builder' ) }
					>
						<span className="dashicons dashicons-admin-page" aria-hidden="true" />
					</button>
					<button
						type="button"
						className="xsb-studio-btn"
						disabled={ ! canPaste }
						onClick={ doPaste }
						title={ __( 'Paste copied styles', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Paste styles', 'xcodesol-page-builder' ) }
					>
						<span className="dashicons dashicons-clipboard" aria-hidden="true" />
					</button>
					<button
						type="button"
						className="xsb-studio-btn is-danger"
						disabled={ ! totalChanges }
						onClick={ () => setConfirmAll( true ) }
						title={ __( 'Reset element styles', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Reset styles', 'xcodesol-page-builder' ) }
					>
						<span className="dashicons dashicons-undo" aria-hidden="true" />
					</button>
				</div>
			</div>

			<StateSelect state={ stateKey } states={ states } onChange={ setStateKey } />

			{ stateKey !== 'default' && (
				<p className="xsb-style-state-hint">
					<span className="dashicons dashicons-info-outline" aria-hidden="true" />
					<span>{ __( 'Hover state active — customize colors and effects for user mouseover.', 'xcodesol-page-builder' ) }</span>
				</p>
			) }

			{ ( device !== 'desktop' && stateKey === 'default' ) && (
				<p className="xsb-style-device-hint">
					<span className="dashicons dashicons-smartphone" aria-hidden="true" />
					<span>{ sprintf( __( '%s responsive overrides active — unset properties inherit from Desktop.', 'xcodesol-page-builder' ), device === 'tablet' ? __( 'Tablet', 'xcodesol-page-builder' ) : __( 'Mobile', 'xcodesol-page-builder' ) ) }</span>
				</p>
			) }

			{ confirmAll && (
				<div className="xsb-style-editor__confirm">
					<p>{ __( 'Reset all custom styles for this part?', 'xcodesol-page-builder' ) }</p>
					<div className="xsb-style-editor__confirm-btns">
						<button type="button" className="xsb-btn xsb-btn--ghost" onClick={ () => setConfirmAll( false ) }>
							{ __( 'Cancel', 'xcodesol-page-builder' ) }
						</button>
						<button type="button" className="xsb-btn xsb-btn--danger" onClick={ doResetAll }>
							{ __( 'Reset all', 'xcodesol-page-builder' ) }
						</button>
					</div>
				</div>
			) }

			{ notice && (
				<div className="xsb-style-popover__notice" role="status">
					<span className="dashicons dashicons-yes-alt" aria-hidden="true" />
					<span>{ notice }</span>
					<button type="button" className="xsb-style-popover__notice-close" onClick={ () => setNotice( null ) } aria-label={ __( 'Dismiss', 'xcodesol-page-builder' ) }>
						<span className="dashicons dashicons-no-alt" aria-hidden="true" />
					</button>
				</div>
			) }

			<div className="xsb-style-search-box">
				<span className="dashicons dashicons-search xsb-style-search-icon" aria-hidden="true" />
				<input
					type="text"
					className="xsb-style-search-input"
					placeholder={ __( 'Search styles...', 'xcodesol-page-builder' ) }
					value={ searchFilter }
					onChange={ ( e ) => setSearchFilter( e.target.value ) }
				/>
				{ searchFilter && (
					<button
						type="button"
						className="xsb-style-search-clear"
						onClick={ () => setSearchFilter( '' ) }
						aria-label={ __( 'Clear search', 'xcodesol-page-builder' ) }
					>
						×
					</button>
				) }
			</div>

			{ ids.length > 2 && (
				<div className="xsb-style-filter-chips" role="tablist" aria-label={ __( 'Filter style categories', 'xcodesol-page-builder' ) }>
					<button
						type="button"
						className={ 'xsb-style-filter-chip' + ( activeCategoryFilter === 'all' ? ' is-active' : '' ) }
						onClick={ () => setActiveCategoryFilter( 'all' ) }
					>
						{ __( 'All', 'xcodesol-page-builder' ) }
					</button>
					{ ids.map( ( id ) => {
						const meta = CATEGORY_META[ id ];
						const hasChg = categoryChangedCount( activeElement, id, id === 'visibility' ? sourceSettings : viewSettings ) > 0;
						return (
							<button
								key={ id }
								type="button"
								className={ 'xsb-style-filter-chip' + ( activeCategoryFilter === id ? ' is-active' : '' ) + ( hasChg ? ' has-changes' : '' ) }
								onClick={ () => setActiveCategoryFilter( id ) }
							>
								{ meta ? meta.label : id }
								{ hasChg && <span className="xsb-style-filter-chip-dot" aria-hidden="true" /> }
							</button>
						);
					} ) }
				</div>
			) }

			<div className="xsb-style-editor__accordions">
				{ visibleIds.length === 0 ? (
					<div className="xsb-style-empty-search">
						<span className="dashicons dashicons-search" aria-hidden="true" />
						<p>{ __( 'No matching style categories found.', 'xcodesol-page-builder' ) }</p>
						<button
							type="button"
							className="xsb-btn xsb-btn--ghost"
							onClick={ () => {
								setSearchFilter( '' );
								setActiveCategoryFilter( 'all' );
							} }
						>
							{ __( 'Reset filter', 'xcodesol-page-builder' ) }
						</button>
					</div>
				) : (
					visibleIds.map( ( id ) => {
						const renderer = CATEGORY_RENDERERS[ id ];
						if ( ! renderer ) {
							return null;
						}
						const count = categoryChangedCount( activeElement, id, id === 'visibility' ? sourceSettings : viewSettings );
						const meta = CATEGORY_META[ id ];
						const shouldBeOpen = id === visibleIds[ 0 ];

						return (
							<StyleGroup
								key={ id }
								title={ meta ? meta.label : id }
								icon={ meta ? meta.icon : undefined }
								defaultOpen={ shouldBeOpen }
								changed={ count }
							>
								{ renderer( {
									settings: id === 'visibility' || id === 'advanced' ? sourceSettings : viewSettings,
									onChange: id === 'visibility' || id === 'advanced' ? changeBase : change,
									cfg: activeElement.categories[ id ],
								} ) }
							</StyleGroup>
						);
					} )
				) }
			</div>
		</div>
	);
}

export default StyleEditor;
