/**
 * Main React application for the template builder.
 *
 * Presents a two-step workflow:
 *   1. Structure Picker – choose a preset layout arrangement.
 *   2. Editor – customise blocks within the chosen structure.
 *
 * Structure selection is persisted in sessionStorage so that a page
 * refresh restores the previously chosen structure and layout.
 *
 * @package WooCommerce_Template_Builder
 */

import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, Notice, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import {
	DndContext,
	PointerSensor,
	KeyboardSensor,
	useSensor,
	useSensors,
	DragOverlay,
	closestCenter,
	pointerWithin,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

import BlockPalette, { getBlocksForView, BASIC_BLOCKS, GENERAL_BLOCKS, CONTAINER_BLOCKS, WOO_CONTENT_BLOCKS, WIDGET_BLOCKS } from './components/block-palette';
import PreviewCanvas from './components/preview-canvas';
import Navigator from './components/navigator';
import Inspector from './components/inspector';
import { getStructureById, getDefaultStructureId, structureBelongsToView } from './data/structures';
import { computeDropGuide } from './lib/dropguide';
import { useHistory } from './lib/use-history';
import {
	IconUndo,
	IconRedo,
	IconDesktop,
	IconTablet,
	IconMobile,
	IconZoomIn,
	IconZoomOut,
	IconSun,
	IconMoon,
	IconCommand,
	IconHelp,
	IconSettings,
	IconEye,
	IconShare,
	IconSave,
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	IconChevronDown,
	IconGridGuides,
	IconLayers,
	IconPalette,
} from './components/icons';
import CommandPalette from './components/command-palette';
import ShortcutsModal from './components/shortcuts-modal';
import ToastNotification from './components/toast-notification';

/**
 * Resolve full metadata for a block type.
 *
 * @param {string} type Block type.
 * @return {Object} Block metadata.
 */
function getBlockInfo( type ) {
	const all = [
		...getBlocksForView( 'page' ),
		...GENERAL_BLOCKS,
		...CONTAINER_BLOCKS,
		...WIDGET_BLOCKS,
	];
	return all.find( ( b ) => b.type === type ) || { type, label: type, icon: 'dashicons-admin-generic' };
}

/**
 * Human-readable label for a block type (canvas drag overlay).
 *
 * @param {string} type Block type.
 * @return {string} Label.
 */
function blockTypeLabel( type ) {
	return getBlockInfo( type ).label;
}

/**
 * Map a canvas ('cv-N') or outline ('block-N') droppable id to a layout index.
 *
 * @param {*} id Droppable id.
 * @return {number} Layout index or -1.
 */
function toBlockIndex( id ) {
	if ( typeof id !== 'string' ) {
		return -1;
	}
	if ( id.startsWith( 'block-' ) ) {
		return parseInt( id.slice( 6 ), 10 );
	}
	if ( id.startsWith( 'cv-' ) ) {
		return parseInt( id.slice( 3 ), 10 );
	}
	return -1;
}

const STORE = 'xcosb/templates';

/**
 * Read a previously-selected structure ID from sessionStorage.
 *
 * @param {number} templateId Current template post ID.
 * @return {string|null} Structure ID or null.
 */
function loadSavedStructure( templateId ) {
	try {
		const raw = window.sessionStorage.getItem( `xcosb_structure_${ templateId }` );
		return raw || null;
	} catch ( e ) {
		return null;
	}
}

/**
 * Build a default zoneMap from a structure definition.
 *
 * Returns an array of zone IDs parallel to the layout array so that
 * each block knows which zone it belongs to.
 *
 * @param {Object} structure Structure definition.
 * @param {Array}  layout    Layout array.
 * @return {string[]} Zone IDs parallel to layout.
 */
function buildDefaultZoneMap( structure, layout ) {
	if ( ! structure || ! structure.defaultZones ) {
		return layout.map( () => '' );
	}

	const map = new Array( layout.length ).fill( '' );

	Object.entries( structure.defaultZones ).forEach( ( [ zoneId, indices ] ) => {
		indices.forEach( ( idx ) => {
			if ( idx < map.length ) {
				map[ idx ] = zoneId;
			}
		} );
	} );

	return map;
}

/**
 * Returns true when a block type string is any variant of the Container block.
 * Handles all historical type prefixes so guards do not silently fail.
 */
function isContainerType( type ) {
	return (
		type === 'xcopb/gb-container' ||
		type === 'xcosb/gb-container' ||
		type === 'xcopb/container'    ||
		type === 'xcosb/container'
	);
}

function cloneBlockTree( block ) {
	return {
		...block,
		settings: { ...( block.settings || {} ) },
		...( Array.isArray( block.inner ) ? { inner: block.inner.map( ( column ) => ( Array.isArray( column ) ? column.map( cloneBlockTree ) : [] ) ) } : {} ),
	};
}

let generatedBlockId = 0;

function createBlockId( usedIds ) {
	let id = '';
	do {
		generatedBlockId += 1;
		id = `xsb-${ Date.now().toString( 36 ) }-${ generatedBlockId.toString( 36 ) }-${ Math.random().toString( 36 ).slice( 2, 8 ) }`;
	} while ( usedIds.has( id ) );
	return id;
}

/** Give every block in a layout a persistent, unique identity. */
function ensureUniqueBlockIds( layout ) {
	const usedIds = new Set();
	const normalizeBlock = ( block ) => {
		if ( ! block || typeof block !== 'object' || Array.isArray( block ) ) return block;
		const existingId = typeof block.id === 'string' ? block.id.trim().replace( /[^a-zA-Z0-9_-]/g, '' ) : '';
		const id = existingId && ! usedIds.has( existingId ) ? existingId : createBlockId( usedIds );
		usedIds.add( id );
		return {
			...block,
			id,
			...( Array.isArray( block.inner ) ? {
				inner: block.inner.map( ( column ) => Array.isArray( column ) ? column.map( normalizeBlock ) : [] ),
			} : {} ),
		};
	};
	return Array.isArray( layout ) ? layout.map( normalizeBlock ) : [];
}

function findBlockAddressById( layout, blockId ) {
	if ( ! blockId || ! Array.isArray( layout ) ) return null;
	const walk = ( block, rootIndex, path ) => {
		if ( block?.id === blockId ) {
			return path.length ? { kind: 'nested', ci: rootIndex, path } : { kind: 'root', index: rootIndex };
		}
		if ( ! Array.isArray( block?.inner ) ) return null;
		for ( let cj = 0; cj < block.inner.length; cj++ ) {
			const column = Array.isArray( block.inner[ cj ] ) ? block.inner[ cj ] : [];
			for ( let bi = 0; bi < column.length; bi++ ) {
				const found = walk( column[ bi ], rootIndex, [ ...path, { cj, bi } ] );
				if ( found ) return found;
			}
		}
		return null;
	};
	for ( let index = 0; index < layout.length; index++ ) {
		const found = walk( layout[ index ], index, [] );
		if ( found ) return found;
	}
	return null;
}

function editorCollisionDetection( args ) {
	if ( args.active?.data?.current?.navigatorMove ) {
		// Navigator moves only land on the row directly under the pointer.
		// Falling back to the nearest row made a drag released outside the tree
		// unexpectedly reorder the closest item.
		const navigatorRows = args.droppableContainers.filter( ( container ) =>
			container.id !== args.active.id && container.data.current?.navigatorMove
		);
		if ( ! navigatorRows.length ) return [];
		const candidates = { ...args, droppableContainers: navigatorRows };
		// KeyboardSensor has no pointer coordinates, so retain its standard
		// nearest-row navigation while pointer drags require a real row hit.
		return args.pointerCoordinates ? pointerWithin( candidates ) : closestCenter( candidates );
	}
	return closestCenter( args );
}

function nestedBlockSettings( block ) {
	const settings = { ...( block?.defaults || {} ) };
	if ( isContainerType( block?.type ) ) {
		// Nested containers start compact and fluid. Their own layout and gap
	// controls remain available, while defaults no longer compound into a
	// large stack of padded boxes as containers are nested.
	settings.padding = { top: 10, right: 10, bottom: 10, left: 10, unit: 'px', isLinked: true };
	settings.content_width = 'full';
	settings.border_radius = 0;
	}
	return settings;
}

function findNestedBlockPath( container, target ) {
	if ( ! container || ! Array.isArray( container.inner ) ) return null;
	for ( let cj = 0; cj < container.inner.length; cj++ ) {
		const column = Array.isArray( container.inner[ cj ] ) ? container.inner[ cj ] : [];
		for ( let bi = 0; bi < column.length; bi++ ) {
			const child = column[ bi ];
			if ( child === target ) return [ { cj, bi } ];
			const nestedPath = findNestedBlockPath( child, target );
			if ( nestedPath ) return [ { cj, bi }, ...nestedPath ];
		}
	}
	return null;
}

/**
 * Effective container layout mode for a settings map. Mirrors the canvas
 * fallbacks so legacy containers (layout_type only) resolve identically in
 * the editor and the front end.
 *
 * @param {Object} settings Container settings.
 * @return {string} Layout mode slug.
 */
function containerLayoutMode( settings ) {
	const s = settings || {};
	return s.layout_mode || ( s.layout_type === 'grid' ? 'grid' : ( s.layout_type === 'flex' ? 'list' : 'columns' ) );
}

/**
 * Convert a flattened child index (the position the insertion line shows for
 * non-column containers) back into a { cj, bi } address inside the stored
 * column arrays. `exclude` is the dragged widget that was left out when the
 * slot was measured.
 *
 * @param {Array}     inner    Stored columns (each an array of blocks).
 * @param {number}    flatSlot Flattened insertion index.
 * @param {?Object}   exclude  { cj, bi } of the dragged widget (same container).
 * @return {{cj:number, bi:number}} Column/block address.
 */
function flatInsertTarget( inner, flatSlot, exclude ) {
	const flat = [];
	( Array.isArray( inner ) ? inner : [] ).forEach( ( column, cj ) => {
		( Array.isArray( column ) ? column : [] ).forEach( ( _block, bi ) => {
			if ( exclude && exclude.cj === cj && exclude.bi === bi ) {
				return;
			}
			flat.push( { cj, bi } );
		} );
	} );

	const slot = Number.isFinite( Number( flatSlot ) ) ? Number( flatSlot ) : flat.length;
	const at = Math.max( 0, Math.min( slot, flat.length ) );

	if ( at === flat.length ) {
		if ( flat.length ) {
			const last = flat[ flat.length - 1 ];
			return { cj: last.cj, bi: last.bi + 1 };
		}
		return { cj: 0, bi: 0 };
	}

	return { cj: flat[ at ].cj, bi: flat[ at ].bi };
}

function Editor( { config, structure: savedStructure } ) {
	const templateId = config.templateId || 0;
	const viewOptions = config.viewOptions || {};

	const { template, loading, saving, error, notice } = useSelect( ( select ) => {
		const store = select( STORE );
		return {
			template: store.getTemplate(),
			loading: store.isLoading(),
			saving: store.isSaving(),
			error: store.getError(),
			notice: store.getNotice(),
		};
	}, [] );

	const { fetchTemplate, saveTemplate, clearNotice, setError, exportTemplate, importTemplate } = useDispatch( STORE );
	const importFileRef = useRef( null );

	const [ viewType, setViewType ] = useState( config.viewType || 'page' );

	const initialHistoryState = useMemo( () => ( {
		layout: ensureUniqueBlockIds( savedStructure ? savedStructure.defaultLayout : [] ),
		zoneMap: savedStructure ? buildDefaultZoneMap( savedStructure, savedStructure.defaultLayout ) : [],
	} ), [ savedStructure ] );

	const {
		present: historyState,
		setPresent: setHistoryState,
		canUndo,
		canRedo,
		undo,
		redo,
		reset: resetHistory,
	} = useHistory( initialHistoryState );

	const layout = historyState.layout;
	const zoneMap = historyState.zoneMap;

	const setLayoutAndZoneMap = useCallback( ( nextLayout, nextZoneMap, options = {} ) => {
		const preparedLayout = typeof nextLayout === 'function' ? nextLayout : ensureUniqueBlockIds( nextLayout );
		setHistoryState( ( prev ) => ( {
			layout: ensureUniqueBlockIds( typeof preparedLayout === 'function' ? preparedLayout( prev.layout ) : preparedLayout ),
			zoneMap: typeof nextZoneMap === 'function' ? nextZoneMap( prev.zoneMap ) : ( nextZoneMap !== undefined ? nextZoneMap : prev.zoneMap ),
		} ), options );
	}, [ setHistoryState ] );

	const setLayout = useCallback( ( nextLayout, options = {} ) => {
		const preparedLayout = typeof nextLayout === 'function' ? nextLayout : ensureUniqueBlockIds( nextLayout );
		setHistoryState( ( prev ) => ( {
			...prev,
			layout: ensureUniqueBlockIds( typeof preparedLayout === 'function' ? preparedLayout( prev.layout ) : preparedLayout ),
		} ), options );
	}, [ setHistoryState ] );

	const setZoneMap = useCallback( ( nextZoneMap, options = {} ) => {
		setHistoryState( ( prev ) => ( {
			...prev,
			zoneMap: typeof nextZoneMap === 'function' ? nextZoneMap( prev.zoneMap ) : nextZoneMap,
		} ), options );
	}, [ setHistoryState ] );

	const [ conditions, setConditions ] = useState( { mode: 'include', rules: [] } );
	const [ priority, setPriority ] = useState( 10 );
	const [ settings, setSettings ] = useState( {
		disable_on_mobile: false,
		respect_theme_templates: true,
	} );
	const [ title, setTitle ] = useState( '' );
	const [ selectedIndex, setSelectedIndex ] = useState( null );
	const [ selectedNested, setSelectedNested ] = useState( null ); // { ci, cj, bi }
	// Style panel visibility + click point ({ x, y } viewport coords, or null
	// to use the default anchor). Open when a widget is selected.
	const [ stylePanel, setStylePanel ] = useState( { open: false, point: null } );
	const [ activeDrag, setActiveDrag ] = useState( null );
	const navigatorDragPointerYRef = useRef( null );
	// Elementor-style insertion point: where a pointer drag would land. It is
	// recomputed on pointermove while dragging and mirrored in a ref so the
	// drop handler always sees the latest position.
	const [ dropGuide, setDropGuide ] = useState( null );
	const dropGuideRef = useRef( null );
	const previewWrapRef = useRef( null );
	const [ inspectorOpen, setInspectorOpen ] = useState( false );
	const [ sidebarOpen, setSidebarOpen ] = useState( false );
	const [ sidebarPinned, setSidebarPinned ] = useState( false );
	const openWidgetPanel = useCallback( () => {
		setSidebarPinned( true );
		setSidebarOpen( true );
	}, [] );
	// Template-level rules (view type, settings, conditions) panel toggled
	// from the topbar gear icon. When on, the right inspector shows the
	const [ templateSettingsOpen, setTemplateSettingsOpen ] = useState( false );
	const [ pageSettingsOpen, setPageSettingsOpen ] = useState( false );
	const [ pageSettings, setPageSettings ] = useState( {} );
	const [ globalSettingsOpen, setGlobalSettingsOpen ] = useState( false );
	const [ globalSettings, setGlobalSettings ] = useState( config.siteSettings || {} );
	const [ previewDevice, setPreviewDevice ] = useState( 'desktop' );

	// Modern UI & workspace states:
	const [ isDark, setIsDark ] = useState( () => {
		try {
			return localStorage.getItem( 'xcopb_theme' ) === 'dark';
		} catch ( e ) {
			return false;
		}
	} );

	useEffect( () => {
		try {
			localStorage.setItem( 'xcopb_theme', isDark ? 'dark' : 'light' );
		} catch ( e ) {}
		if ( isDark ) {
			document.documentElement.setAttribute( 'data-theme', 'dark' );
			document.body.classList.add( 'xcopb-theme-dark' );
		} else {
			document.documentElement.removeAttribute( 'data-theme' );
			document.body.classList.remove( 'xcopb-theme-dark' );
		}
	}, [ isDark ] );

	const [ zoom, setZoom ] = useState( 100 );
	const [ showGuides, setShowGuides ] = useState( false );
	const [ navigatorOpen, setNavigatorOpen ] = useState( false );
	const [ shortcutsOpen, setShortcutsOpen ] = useState( false );
	const [ commandPaletteOpen, setCommandPaletteOpen ] = useState( false );
	const [ toasts, setToasts ] = useState( [] );
	const [ saveSuccess, setSaveSuccess ] = useState( false );

	const addToast = useCallback( ( message, type = 'info' ) => {
		const id = Date.now() + Math.random();
		setToasts( ( prev ) => [ ...prev, { id, message, type } ] );
		setTimeout( () => {
			setToasts( ( prev ) => prev.filter( ( t ) => t.id !== id ) );
		}, 3500 );
	}, [] );

	// The effective structure must always match the current view type.
	// `savedStructure` is resolved by App for the template's saved view; a
	// pending (not yet saved) view-type change immediately adopts that
	// view's default structure so the canvas zones and the block palette
	// always show the blocks related to the selected template type.
	const structure = useMemo( () => {
		const savedView = template?.view_type || config.viewType || 'page';
		if ( viewType === savedView ) {
			return savedStructure;
		}
		return getStructureById( getDefaultStructureId( viewType ) ) || savedStructure;
	}, [ savedStructure, viewType, template, config.viewType ] );

	// Changing the template's view type resets the editor to that view's
	// default structure + layout (the previous view's blocks don't belong
	// to the new template type).
	function handleViewTypeChange( nextViewType ) {
		if ( ! nextViewType || nextViewType === viewType ) {
			return;
		}

		setViewType( nextViewType );

		const nextStructure = getStructureById( getDefaultStructureId( nextViewType ) );
		if ( nextStructure ) {
			setLayoutAndZoneMap(
				[ ...nextStructure.defaultLayout ],
				buildDefaultZoneMap( nextStructure, nextStructure.defaultLayout )
			);
		}

		setSelectedIndex( null );
		setSelectedNested( null );
		closeStylePanel();
	}

	const closeStylePanel = useCallback( () => {
		setStylePanel( { open: false, point: null } );
	}, [] );

	const selectBlock = useCallback( ( index, point ) => {
		setSelectedIndex( index );
		setSelectedNested( null );
		setTemplateSettingsOpen( false );
		setPageSettingsOpen( false );
		setGlobalSettingsOpen( false );
		if ( index !== null && index !== undefined ) {
			setInspectorOpen( true );
		}
		closeStylePanel();
	}, [ closeStylePanel ] );

	const selectNestedBlock = useCallback( ( ci, cj, bi, point, path ) => {
		const selectedPath = Array.isArray( path ) && path.length ? path : [ { cj, bi } ];
		setSelectedNested( { ci, cj: selectedPath[ 0 ].cj, bi: selectedPath[ 0 ].bi, path: selectedPath } );
		setTemplateSettingsOpen( false );
		setPageSettingsOpen( false );
		setGlobalSettingsOpen( false );
		setInspectorOpen( true );
		closeStylePanel();
	}, [ closeStylePanel ] );

	// A single Navigator click selects and highlights the block without opening
	// its settings panel. Double-click uses selectBlock/selectNestedBlock above.
	const selectNavigatorBlock = useCallback( ( index ) => {
		setSelectedIndex( index );
		setSelectedNested( null );
		setTemplateSettingsOpen( false );
		setPageSettingsOpen( false );
		setGlobalSettingsOpen( false );
		closeStylePanel();
	}, [ closeStylePanel ] );

	const selectNavigatorNestedBlock = useCallback( ( ci, cj, bi, point, path ) => {
		const selectedPath = Array.isArray( path ) && path.length ? path : [ { cj, bi } ];
		setSelectedNested( { ci, cj: selectedPath[ 0 ].cj, bi: selectedPath[ 0 ].bi, path: selectedPath } );
		setTemplateSettingsOpen( false );
		setPageSettingsOpen( false );
		setGlobalSettingsOpen( false );
		closeStylePanel();
	}, [ closeStylePanel ] );

	const handleCanvasSelectNested = useCallback( ( ci, cj, bi, point, path ) => {
		if ( ci === null || ci === undefined ) {
			setSelectedNested( null );
			return;
		}
		selectNestedBlock( ci, cj, bi, point, path );
	}, [ selectNestedBlock ] );

	const handleAddPreset = useCallback( ( blocks ) => {
		if ( ! Array.isArray( blocks ) || blocks.length === 0 ) return;
		const next = [ ...layout, ...blocks ];
		const nextZone = [ ...zoneMap ];
		const defaultZone = structure?.zones?.[ 0 ]?.id || '';
		blocks.forEach( () => nextZone.push( defaultZone ) );
		setLayoutAndZoneMap( next, nextZone );
		selectBlock( next.length - blocks.length );
		addToast( sprintf( __( 'Added %d section(s) to canvas', 'xcodesol-page-builder' ), blocks.length ), 'success' );
	}, [ layout, zoneMap, structure, setLayoutAndZoneMap, selectBlock, addToast ] );

	// Duplicate the currently selected block (top-level or nested widget).
	const duplicateBlock = useCallback( () => {
		if ( selectedNested ) {
			const { ci, cj, bi } = selectedNested;
			const container = layout[ ci ];
			if ( ! container || ! Array.isArray( container.inner ) || ! container.inner[ cj ] || ! container.inner[ cj ][ bi ] ) {
				return;
			}
			const targetBlock = container.inner[ cj ][ bi ];
			const clonedBlock = JSON.parse( JSON.stringify( targetBlock ) );
			const nextLayout = layout.map( ( b, i ) => {
				if ( i !== ci ) {
					return b;
				}
				const nextInner = b.inner ? b.inner.map( ( col, colIdx ) => {
					if ( colIdx !== cj ) {
						return [ ...col ];
					}
					const copy = [ ...col ];
					copy.splice( bi + 1, 0, clonedBlock );
					return copy;
				} ) : [];
				return { ...b, inner: nextInner };
			} );
			setLayout( nextLayout );
			setSelectedNested( { ci, cj, bi: bi + 1 } );
			return;
		}

		if ( selectedIndex !== null && selectedIndex >= 0 && selectedIndex < layout.length ) {
			const targetBlock = layout[ selectedIndex ];
			const clonedBlock = JSON.parse( JSON.stringify( targetBlock ) );
			const nextLayout = [ ...layout ];
			const nextZone = [ ...zoneMap ];
			const zone = nextZone[ selectedIndex ] || '';
			nextLayout.splice( selectedIndex + 1, 0, clonedBlock );
			nextZone.splice( selectedIndex + 1, 0, zone );
			setLayoutAndZoneMap( nextLayout, nextZone );
			setSelectedIndex( selectedIndex + 1 );
		}
	}, [ layout, zoneMap, selectedIndex, selectedNested, setLayout, setLayoutAndZoneMap ] );

	// Move a top-level block up or down within its zone.
	const moveBlock = useCallback( ( index, direction ) => {
		const targetIndex = index + direction;
		if ( targetIndex < 0 || targetIndex >= layout.length ) {
			return;
		}
		// Zone constraint: only swap if in the same zone
		const currentZone = zoneMap[ index ] || '';
		const targetZone = zoneMap[ targetIndex ] || '';
		if ( currentZone && targetZone && currentZone !== targetZone ) {
			return;
		}
		setLayoutAndZoneMap( arrayMove( layout, index, targetIndex ), arrayMove( zoneMap, index, targetIndex ) );
		setSelectedIndex( targetIndex );
	}, [ layout, zoneMap, setLayoutAndZoneMap ] );

	// Duplicate a block at a specific top-level index.
	const duplicateBlockAtIndex = useCallback( ( index ) => {
		if ( index < 0 || index >= layout.length ) {
			return;
		}
		const targetBlock = layout[ index ];
		const clonedBlock = JSON.parse( JSON.stringify( targetBlock ) );
		const nextLayout = [ ...layout ];
		const nextZone = [ ...zoneMap ];
		const zone = nextZone[ index ] || '';
		nextLayout.splice( index + 1, 0, clonedBlock );
		nextZone.splice( index + 1, 0, zone );
		setLayoutAndZoneMap( nextLayout, nextZone );
		setSelectedIndex( index + 1 );
	}, [ layout, zoneMap, setLayoutAndZoneMap ] );

	// Move a nested widget within its column.
	const moveNestedBlock = useCallback( ( ci, cj, bi, direction ) => {
		const targetBi = bi + direction;
		const container = layout[ ci ];
		if ( ! container || ! container.inner || ! container.inner[ cj ] ) {
			return;
		}
		const colBlocks = container.inner[ cj ];
		if ( targetBi < 0 || targetBi >= colBlocks.length ) {
			return;
		}
		const nextColBlocks = arrayMove( colBlocks, bi, targetBi );
		const nextInner = container.inner.map( ( c, idx ) => ( idx === cj ? nextColBlocks : [ ...c ] ) );
		const nextLayout = layout.map( ( b, idx ) => ( idx === ci ? { ...b, inner: nextInner } : b ) );
		setLayout( nextLayout );
		setSelectedNested( { ci, cj, bi: targetBi } );
	}, [ layout, setLayout ] );

	const reorderNavigatorItem = useCallback( ( source, target ) => {
		if ( ! source || ! target ) return;
		const position = target.position || 'before';
		const next = layout.map( cloneBlockTree );
		const nextZones = [ ...zoneMap ];
		const sourceAddress = findBlockAddressById( next, source.blockId ) || source;
		const targetAddress = findBlockAddressById( next, target.blockId ) || target;
		const sourceRootIndex = sourceAddress.kind === 'root' ? sourceAddress.index : sourceAddress.ci;
		const sourceRoot = next[ sourceRootIndex ];
		const resolvePath = ( root, path = [] ) => path.reduce( ( block, step ) => block?.inner?.[ step.cj ]?.[ step.bi ], root );
		const moving = sourceAddress.kind === 'root' ? sourceRoot : resolvePath( sourceRoot, sourceAddress.path );
		const targetRootIndex = targetAddress.kind === 'root' ? targetAddress.index : targetAddress.ci;
		const targetRoot = next[ targetRootIndex ];
		const targetBlock = targetAddress.kind === 'root' ? targetRoot : resolvePath( targetRoot, targetAddress.path );
		if ( ! moving || ! targetBlock || moving === targetBlock ) return;
		const targetItemAddress = targetAddress.kind === 'nested' ? targetAddress.path?.[ targetAddress.path.length - 1 ] : null;
		const targetParent = targetAddress.kind === 'nested' ? resolvePath( targetRoot, targetAddress.path?.slice( 0, -1 ) ) : null;
		const targetColumn = targetParent?.inner?.[ targetItemAddress?.cj ];
		if ( sourceAddress.kind === 'root' && targetAddress.kind === 'root' && position !== 'inside' && ( zoneMap[ sourceAddress.index ] || '' ) !== ( zoneMap[ targetAddress.index ] || '' ) ) return;
		// A container cannot be moved into or alongside one of its descendants.
		if ( findNestedBlockPath( moving, targetBlock ) ) return;
		if ( position === 'inside' && ! isContainerType( targetBlock.type ) ) return;

		const targetZone = nextZones[ targetRootIndex ] || '';
		let sourceColumn = null;
		if ( sourceAddress.kind === 'root' ) {
			next.splice( sourceAddress.index, 1 );
			nextZones.splice( sourceAddress.index, 1 );
		} else {
			const sourceItemAddress = sourceAddress.path?.[ sourceAddress.path.length - 1 ];
			const sourceParent = resolvePath( sourceRoot, sourceAddress.path?.slice( 0, -1 ) );
			sourceColumn = sourceParent?.inner?.[ sourceItemAddress?.cj ];
			if ( ! Array.isArray( sourceColumn ) || sourceColumn[ sourceItemAddress.bi ] !== moving ) return;
			sourceColumn.splice( sourceItemAddress.bi, 1 );
		}

		if ( position === 'inside' ) {
			targetBlock.inner = Array.isArray( targetBlock.inner ) ? targetBlock.inner.map( ( column ) => [ ...column ] ) : [ [] ];
			if ( ! Array.isArray( targetBlock.inner[ 0 ] ) ) targetBlock.inner[ 0 ] = [];
			targetBlock.inner[ 0 ].push( moving );
		} else if ( targetAddress.kind === 'root' ) {
			const targetIndex = next.indexOf( targetBlock );
			if ( targetIndex < 0 ) return;
			const insertAt = targetIndex + ( position === 'after' ? 1 : 0 );
			next.splice( insertAt, 0, moving );
			nextZones.splice( insertAt, 0, targetZone );
		} else {
			const targetIndex = Array.isArray( targetColumn ) ? targetColumn.indexOf( targetBlock ) : -1;
			if ( targetIndex < 0 ) return;
			targetColumn.splice( targetIndex + ( position === 'after' ? 1 : 0 ), 0, moving );
		}

		setLayoutAndZoneMap( next, nextZones );
		const movedRootIndex = next.findIndex( ( block ) => block === moving || findNestedBlockPath( block, moving ) );
		const movedPath = movedRootIndex >= 0 ? findNestedBlockPath( next[ movedRootIndex ], moving ) : null;
		if ( movedRootIndex >= 0 ) {
			setSelectedIndex( movedRootIndex );
			setSelectedNested( movedPath ? { ci: movedRootIndex, cj: movedPath[ 0 ].cj, bi: movedPath[ 0 ].bi, path: movedPath } : null );
		}
	}, [ layout, zoneMap, setLayoutAndZoneMap ] );

	// Duplicate a nested widget within its column.
	const duplicateNestedBlock = useCallback( ( ci, cj, bi ) => {
		const container = layout[ ci ];
		if ( ! container || ! container.inner || ! container.inner[ cj ] || ! container.inner[ cj ][ bi ] ) {
			return;
		}
		const targetBlock = container.inner[ cj ][ bi ];
		const clonedBlock = JSON.parse( JSON.stringify( targetBlock ) );
		const nextInner = container.inner.map( ( c, idx ) => {
			if ( idx !== cj ) {
				return [ ...c ];
			}
			const copy = [ ...c ];
			copy.splice( bi + 1, 0, clonedBlock );
			return copy;
		} );
		const nextLayout = layout.map( ( b, idx ) => ( idx === ci ? { ...b, inner: nextInner } : b ) );
		setLayout( nextLayout );
		setSelectedNested( { ci, cj, bi: bi + 1 } );
	}, [ layout, setLayout ] );

	// Open the style popover for a top-level block.
	const openStylePanel = useCallback( ( index, point ) => {
		setSelectedIndex( index );
		setSelectedNested( null );
		setPageSettingsOpen( false );
		setGlobalSettingsOpen( false );
		setTemplateSettingsOpen( false );
		setStylePanel( { open: true, point: point || null } );
	}, [] );

	// Open the style popover for a nested widget.
	const openStylePanelForNested = useCallback( ( ci, cj, bi, point ) => {
		setSelectedNested( { ci, cj, bi } );
		setPageSettingsOpen( false );
		setGlobalSettingsOpen( false );
		setTemplateSettingsOpen( false );
		setStylePanel( { open: true, point: point || null } );
	}, [] );

	// Patch a top-level block's settings (supports an object patch for
	// several keys updating atomically).
	function updateBlockSettings( index, key, value ) {
		if ( ! layout[ index ] ) {
			return;
		}
		const next = [ ...layout ];
		const patch = key && typeof key === 'object' && ! Array.isArray( key ) ? key : { [ key ]: value };
		next[ index ] = {
			...next[ index ],
			settings: {
				...( next[ index ].settings || {} ),
				...patch,
			},
		};
		setLayout( next, { debounce: true } );
	}

	// Patch a nested widget's settings inside a container column.
	function updateNestedSettings( ci, cj, bi, key, value, path ) {
		const address = Array.isArray( path ) && path.length ? path : [ { cj, bi } ];
		const next = layout.map( cloneBlockTree );
		let parent = next[ ci ];
		if ( ! parent || ! isContainerType( parent.type ) ) return;
		for ( let stepIndex = 0; stepIndex < address.length - 1; stepIndex++ ) {
			const step = address[ stepIndex ];
			parent = parent.inner?.[ Number( step.cj ) ]?.[ Number( step.bi ) ];
			if ( ! parent || ! isContainerType( parent.type ) ) return;
		}
		const target = address[ address.length - 1 ];
		const nestedBlock = parent.inner?.[ Number( target.cj ) ]?.[ Number( target.bi ) ];
		if ( ! nestedBlock ) return;
		const patch = key && typeof key === 'object' && ! Array.isArray( key ) ? key : { [ key ]: value };
		parent.inner[ Number( target.cj ) ][ Number( target.bi ) ] = {
			...nestedBlock,
			settings: {
				...( nestedBlock.settings || {} ),
				...patch,
			},
		};
		setLayout( next, { debounce: true } );
	}

	const loadTemplate = useCallback( () => {
		if ( ! templateId ) {
			return;
		}
		fetchTemplate( templateId );
	}, [ templateId, fetchTemplate ] );

	useEffect( () => {
		loadTemplate();
	}, [ loadTemplate ] );

	useEffect( () => {
		if ( ! template ) {
			return;
		}

		const tplView = template.view_type || viewType;
		setTitle( template.title || '' );
		setViewType( tplView );

		// When the saved structure does not belong to the template's view
		// (e.g. a template whose view type was changed while it still held
		// the old view's structure/blocks), start from that view's default
		// layout instead of the mismatched saved one.
		const structureMismatch = template.structure && ! structureBelongsToView( template.structure, tplView );
		const layoutToUse = structureMismatch
			? ( getStructureById( getDefaultStructureId( tplView ) )?.defaultLayout || [] )
			: ( Array.isArray( template.layout ) ? template.layout : [] );

		let nextZones = [];
		if ( structure && layoutToUse.length > 0 ) {
			if ( Array.isArray( template.zones ) && template.zones.length === layoutToUse.length ) {
				nextZones = template.zones;
			} else {
				nextZones = buildDefaultZoneMap( structure, layoutToUse );
			}
		}

		resetHistory( { layout: ensureUniqueBlockIds( layoutToUse ), zoneMap: nextZones } );

		setConditions(
			template.conditions && template.conditions.mode
				? template.conditions
				: { mode: 'include', rules: [] }
		);
		setPriority( template.priority || 10 );
		setSettings( {
			disable_on_mobile: template.settings?.disable_on_mobile || false,
			respect_theme_templates: template.settings?.respect_theme_templates ?? true,
		} );
		if ( template.page_settings ) {
			setPageSettings( template.page_settings );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ template ] );

	const handleSave = useCallback( async () => {
		clearNotice();
		setSaveSuccess( false );
		const result = await saveTemplate( templateId, {
			title,
			view_type: viewType,
			layout,
			structure: structure ? structure.id : '',
			zones: zoneMap,
			conditions,
			priority: Number( priority ) || 10,
			settings,
			...( config.isWordPressPage ? { page_settings: pageSettings } : {} ),
		} );
		if ( result ) {
			setSaveSuccess( true );
			addToast( __( 'Template saved successfully!', 'xcodesol-page-builder' ), 'success' );
			setTimeout( () => setSaveSuccess( false ), 2500 );
		}
	}, [ clearNotice, saveTemplate, templateId, title, viewType, layout, structure, zoneMap, conditions, priority, settings, pageSettings, config.isWordPressPage, addToast ] );

	const handleSaveGlobalSettings = useCallback( async () => {
		try {
			const saved = await apiFetch( { path: '/xcopb/v1/site-settings', method: 'POST', data: globalSettings } );
			setGlobalSettings( saved );
			addToast( __( 'Site settings saved.', 'xcodesol-page-builder' ), 'success' );
		} catch ( error ) {
			addToast( error?.message || __( 'Could not save site settings.', 'xcodesol-page-builder' ), 'error' );
		}
	}, [ globalSettings, addToast ] );

	// Keyboard shortcuts listener (Save, Undo, Redo, Duplicate, Delete, Esc).
	useEffect( () => {
		const handleKeyDown = ( e ) => {
			const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;
			const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
			const tag = e.target?.tagName?.toLowerCase();
			const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;

			// Save shortcut (Ctrl/Cmd + S)
			if ( cmdOrCtrl && ( e.key === 's' || e.key === 'S' ) ) {
				e.preventDefault();
				handleSave();
				return;
			}

			// Command Palette (Ctrl/Cmd + K)
			if ( cmdOrCtrl && ( e.key === 'k' || e.key === 'K' ) ) {
				e.preventDefault();
				setCommandPaletteOpen( ( v ) => ! v );
				return;
			}

			// Keyboard shortcuts cheat sheet (?)
			if ( ! isInput && e.key === '?' ) {
				e.preventDefault();
				setShortcutsOpen( ( v ) => ! v );
				return;
			}

			// Device switcher numeric shortcuts
			if ( ! isInput && e.key === '1' ) {
				setPreviewDevice( 'desktop' );
				return;
			}
			if ( ! isInput && e.key === '2' ) {
				setPreviewDevice( 'tablet' );
				return;
			}
			if ( ! isInput && e.key === '3' ) {
				setPreviewDevice( 'mobile' );
				return;
			}

			// Undo shortcut (Ctrl/Cmd + Z without Shift)
			if ( cmdOrCtrl && ! e.shiftKey && ( e.key === 'z' || e.key === 'Z' ) ) {
				if ( ! isInput && canUndo ) {
					e.preventDefault();
					undo();
				}
				return;
			}

			// Redo shortcut (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
			if ( ( cmdOrCtrl && ( e.key === 'y' || e.key === 'Y' ) ) || ( cmdOrCtrl && e.shiftKey && ( e.key === 'z' || e.key === 'Z' ) ) ) {
				if ( ! isInput && canRedo ) {
					e.preventDefault();
					redo();
				}
				return;
			}

			// Duplicate shortcut (Ctrl/Cmd + D)
			if ( cmdOrCtrl && ( e.key === 'd' || e.key === 'D' ) ) {
				if ( ! isInput && ( selectedIndex !== null || selectedNested !== null ) ) {
					e.preventDefault();
					duplicateBlock();
				}
				return;
			}

			// Delete shortcut (Del or Backspace outside text fields)
			if ( ( e.key === 'Delete' || e.key === 'Backspace' ) && ! isInput ) {
				if ( selectedNested ) {
					e.preventDefault();
					removeBlockAtNestedPath( selectedNested.ci, selectedNested.path || [ selectedNested ] );
				} else if ( selectedIndex !== null ) {
					e.preventDefault();
					removeBlockAtIndex( selectedIndex );
				}
				return;
			}

			// Escape shortcut
			if ( e.key === 'Escape' ) {
				if ( shortcutsOpen ) {
					setShortcutsOpen( false );
				} else if ( commandPaletteOpen ) {
					setCommandPaletteOpen( false );
				} else if ( stylePanel.open ) {
					closeStylePanel();
				} else {
					setSelectedIndex( null );
					setSelectedNested( null );
				}
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );
		return () => window.removeEventListener( 'keydown', handleKeyDown );
	}, [ handleSave, canUndo, canRedo, undo, redo, selectedIndex, selectedNested, duplicateBlock, layout, setLayout, stylePanel.open, closeStylePanel, shortcutsOpen, commandPaletteOpen ] );

	// Download the current template as a self-contained JSON document
	// (hierarchical layout + every block's settings/styles).
	async function handleExport() {
		const document = await exportTemplate( templateId );
		if ( ! document ) {
			return;
		}

		const slug = ( title || 'template' )
			.toLowerCase()
			.replace( /[^a-z0-9]+/g, '-' )
			.replace( /^-+|-+$/g, '' ) || 'template';

		const blob = new Blob( [ JSON.stringify( document, null, 2 ) ], { type: 'application/json' } );
		const url = URL.createObjectURL( blob );
		const anchor = document.createElement( 'a' );
		anchor.href = url;
		anchor.download = `${ slug }.xcosb.json`;
		document.body.appendChild( anchor );
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL( url );
	}

	// Read an imported .json file and recreate it as a new template.
	function handleImportFile( file ) {
		if ( ! file ) {
			return;
		}

		const reader = new FileReader();

		reader.onload = async () => {
			let document;
			try {
				document = JSON.parse( reader.result );
			} catch ( e ) {
				setError( __( 'That file is not a valid template JSON.', 'xcodesol-page-builder' ) );
				return;
			}

			const result = await importTemplate( document );
			if ( result && result.editUrl ) {
				window.location.href = result.editUrl;
			}
		};

		reader.readAsText( file );
	}

	// ---- Drag & Drop ----

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 6 } } ),
		useSensor( KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates } )
	);

	function handleDragStart( { active, activatorEvent } ) {
		setActiveDrag( active );
		navigatorDragPointerYRef.current = active.data.current?.navigatorMove && Number.isFinite( activatorEvent?.clientY )
			? activatorEvent.clientY
			: null;
		updateDropGuide( null );
	}

	function handleDragMove( { active, delta, activatorEvent } ) {
		if ( ! active.data.current?.navigatorMove || ! Number.isFinite( activatorEvent?.clientY ) ) {
			navigatorDragPointerYRef.current = null;
			return;
		}
		navigatorDragPointerYRef.current = activatorEvent.clientY + ( delta?.y || 0 );
	}

	function handleDragCancel() {
		setActiveDrag( null );
		navigatorDragPointerYRef.current = null;
		updateDropGuide( null );
	}

	// Store the computed drop guide (mirrored in a ref for the drop handler).
	const updateDropGuide = useCallback( ( guide ) => {
		const prev = dropGuideRef.current;
		if ( prev === guide ) {
			return;
		}
		if ( prev && guide && prev.kind === guide.kind ) {
			if ( 'col' === guide.kind && prev.ci === guide.ci && prev.cj === guide.cj && prev.slot === guide.slot ) {
				return;
			}
			if ( 'top' === guide.kind && prev.zoneId === guide.zoneId && prev.slot === guide.slot ) {
				return;
			}
		}
		if ( ! prev && ! guide ) {
			return;
		}
		dropGuideRef.current = guide;
		setDropGuide( guide );
	}, [] );

	// While a pointer drag is in progress, resolve the exact drop slot from
	// the cursor position so the canvas can draw the insertion line.
	useEffect( () => {
		if ( ! activeDrag ) {
			return undefined;
		}
		const onPointerMove = ( event ) => {
			if ( activeDrag.data?.current?.navigatorMove ) return;
			const rootEl = previewWrapRef.current;
			if ( ! rootEl ) {
				return;
			}
			const guide = computeDropGuide( event.clientX, event.clientY, rootEl, {
				activeId: activeDrag.id,
				activeData: activeDrag.data,
				structure,
				zoneMap,
			} );
			updateDropGuide( guide );
		};
		window.addEventListener( 'pointermove', onPointerMove );
		return () => {
			window.removeEventListener( 'pointermove', onPointerMove );
		};
	}, [ activeDrag, structure, zoneMap, updateDropGuide ] );

	function handleDragEnd( { active, over } ) {
		setActiveDrag( null );
		const navigatorSource = active.data.current?.navigatorMove;
		const navigatorTarget = over?.data?.current?.navigatorMove;
		if ( navigatorSource ) {
			if ( navigatorTarget ) {
				const activeRect = document.getElementById( String( active.id ) )?.getBoundingClientRect() || active.rect?.current?.translated;
				const targetRect = document.getElementById( String( over.id ) )?.getBoundingClientRect() || over.rect;
				const activeCenter = activeRect ? activeRect.top + activeRect.height / 2 : null;
				const dropY = Number.isFinite( navigatorDragPointerYRef.current ) ? navigatorDragPointerYRef.current : activeCenter;
				const targetRatio = dropY !== null && dropY !== undefined && targetRect?.height
					? ( dropY - targetRect.top ) / targetRect.height
					: 0.5;
				const insideContainer = navigatorTarget.container && targetRatio >= 0.24 && targetRatio <= 0.76;
				reorderNavigatorItem( navigatorSource, {
					...navigatorTarget,
					position: insideContainer ? 'inside' : targetRatio < 0.5 ? 'before' : 'after',
				} );
			}
			navigatorDragPointerYRef.current = null;
			updateDropGuide( null );
			return;
		}

		// Pointer drags commit at the exact slot the insertion line showed;
		// keyboard / outline-panel drags keep the dnd-kit `over` logic below.
		const guide = dropGuideRef.current;
		updateDropGuide( null );
		if ( guide ) {
			commitDropByGuide( active, guide );
			return;
		}

		const fromPalette = active.data.current?.fromPalette;
		const block = active.data.current?.block;

			// ---- Dropping a new block from palette ----
		if ( fromPalette && block ) {
			const newBlock = { type: block.type, settings: { ...block.defaults } };
			const next = [ ...layout ];
			const nextZone = [ ...zoneMap ];
			const innerTarget = over?.data?.current?.innerContainer;
			if ( innerTarget && Array.isArray( innerTarget.path ) ) {
				addBlockToNestedContainerPath( innerTarget, block );
				return;
			}
			if ( typeof over?.id === 'string' && over.id.startsWith( 'inner-' ) ) {
				const [ ci, cj, bi ] = over.id.slice( 6 ).split( '-' ).map( Number );
				if ( [ ci, cj, bi ].every( Number.isInteger ) ) addBlockToNestedContainer( ci, cj, bi, block );
				return;
			}

			// Was the block dropped into a container column (dropzone or a widget inside it)?
			if ( typeof over?.id === 'string' && ( over.id.startsWith( 'col-' ) || over.id.startsWith( 'nested-' ) ) ) {
				const parts = over.id.startsWith( 'col-' ) ? over.id.slice( 4 ).split( '-' ) : over.id.slice( 7 ).split( '-' );
				const containerIndex = parseInt( parts[ 0 ], 10 );
				const colIndex = parseInt( parts[ 1 ], 10 );
				if ( Number.isInteger( containerIndex ) && Number.isInteger( colIndex ) ) {
					addBlockToColumn( containerIndex, colIndex, block );
					// Ensure the container column has a zone (fallback).
					if ( ! nextZone[ containerIndex ] && structure && structure.zones?.[ 0 ] ) {
						nextZone[ containerIndex ] = structure.zones[ 0 ].id;
						setZoneMap( nextZone );
					}
				}
				return;
			}

			// When a container is selected, palette drops outside a specific
			// column still go into that container rather than escaping to the page.
			if ( addToSelectedContainer( block ) ) return;

			// Was the block dropped over a live canvas zone container?
			const zoneDrop = (() => {
				if ( structure && structure.zones && typeof over?.id === 'string' && over.id.startsWith( 'zone-' ) ) {
					return over.id.slice( 5 );
				}
				return null;
			})();

			if ( zoneDrop && structure ) {
				// Validate that the block is allowed in this zone. Containers and
				// general (Common) blocks are always allowed; only view-specific
				// WooCommerce blocks (sp/ar) are restricted by zone allow-lists.
				const alwaysAllowed = isContainerType( block.type ) || block.type.startsWith( 'xcopb/gb-' ) || block.type.startsWith( 'xcosb/gb-' );
				const zoneDef = structure.zones.find( ( z ) => z.id === zoneDrop );
				if ( ! alwaysAllowed && zoneDef && Array.isArray( zoneDef.allowedBlocks ) && ! zoneDef.allowedBlocks.includes( block.type ) ) {
					return; // Reject disallowed block for this zone.
				}

				// Append the new block to the end of this zone's group.
				let insertIndex = next.length; // default append
				for ( let i = nextZone.length - 1; i >= 0; i-- ) {
					if ( nextZone[ i ] === zoneDrop ) {
						insertIndex = i + 1;
						break;
					}
				}
				next.splice( insertIndex, 0, newBlock );
				nextZone.splice( insertIndex, 0, zoneDrop );
				selectBlock( insertIndex );
				setLayoutAndZoneMap( next, nextZone );
				return;
			}

			// Determine which zone this block can go into (default fallback).
			let targetZone = '';

			if ( structure && structure.zones ) {
				// Find the first zone that allows this block type.
				const matchingZone = structure.zones.find( ( z ) =>
					z.allowedBlocks && z.allowedBlocks.includes( block.type )
				);
				targetZone = matchingZone ? matchingZone.id : ( structure.zones[ 0 ]?.id || '' );
			}

			// If dropped over an existing block (canvas or outline), insert near it.
			const overIndex = toBlockIndex( over?.id );

			if ( overIndex >= 0 && overIndex < next.length ) {
				// If dropped directly onto a container block, insert inside its first column
				if ( isContainerType( next[ overIndex ].type ) ) {
					addBlockToColumn( overIndex, 0, block );
					return;
				}

				// Respect zone constraint: only drop within same zone. Containers
				// and general (Common) blocks are always allowed anywhere.
				const canFlow = isContainerType( block.type ) || block.type.startsWith( 'xcopb/gb-' ) || block.type.startsWith( 'xcosb/gb-' );
				const overZone = nextZone[ overIndex ] || '';
				if ( ! canFlow && targetZone && overZone && targetZone !== overZone ) {
					return; // Reject cross-zone drop.
				}
				const effectiveZone = overZone || targetZone;
				next.splice( overIndex, 0, newBlock );
				nextZone.splice( overIndex, 0, effectiveZone );
				selectBlock( overIndex );
			} else {
				next.push( newBlock );
				nextZone.push( targetZone );
				selectBlock( next.length - 1 );
			}

			setLayoutAndZoneMap( next, nextZone );
			return;
		}

		// ---- Reordering existing blocks ----
		if ( ! over || active.id === over.id ) {
			return;
		}

		// Nested widget drag: move it within/between container columns.
		if ( typeof active.id === 'string' && active.id.startsWith( 'nested-' ) ) {
			const source = active.data.current?.canvasNested;
			const target = over.data?.current?.canvasNested;
			if ( source?.path?.length && target?.path?.length ) {
				const activeRect = active.rect?.current?.translated;
				const targetRect = over.rect;
				const activeCenter = activeRect ? activeRect.top + activeRect.height / 2 : null;
				const pointerY = Number.isFinite( navigatorDragPointerYRef.current ) ? navigatorDragPointerYRef.current : activeCenter;
				const ratio = pointerY !== null && pointerY !== undefined && targetRect?.height ? ( pointerY - targetRect.top ) / targetRect.height : 0.5;
				reorderNavigatorItem( { kind: 'nested', ci: source.ci, path: source.path }, { kind: 'nested', ci: target.ci, path: target.path, position: ratio < 0.5 ? 'before' : 'after' } );
				return;
			}
			if ( source?.path?.length && typeof over.id === 'string' && over.id.startsWith( 'col-' ) ) {
				const [ ci, cj ] = over.id.slice( 4 ).split( '-' ).map( Number );
				moveNestedToSlot( active, { kind: 'col', ci, cj, slot: Number.MAX_SAFE_INTEGER } );
				return;
			}
			moveNestedWidget( active.id, over );
			return;
		}

		const oldIndex = toBlockIndex( active.id );
		const newIndex = toBlockIndex( over.id );

		if ( oldIndex === -1 || newIndex === -1 ) {
			return;
		}

		// Enforce zone constraint: only reorder within the same zone.
		const oldZone = zoneMap[ oldIndex ] || '';
		const newZone = zoneMap[ newIndex ] || '';

		if ( oldZone && newZone && oldZone !== newZone ) {
			return; // Reject cross-zone reorder.
		}

		setLayoutAndZoneMap( arrayMove( layout, oldIndex, newIndex ), arrayMove( zoneMap, oldIndex, newIndex ) );
		selectBlock( newIndex );
	}

	// ---- Precise guide-based drop commits ----

	// Commit a pointer drop at the exact slot the insertion line showed.
	function commitDropByGuide( active, guide ) {
		const data = active.data?.current || {};
		const block = data.block;

		if ( data.fromPalette && block ) {
			if ( 'inner-container' === guide.kind ) {
				if ( Array.isArray( guide.path ) ) addBlockToNestedContainerPath( guide, block, guide.slot );
				else addBlockToNestedContainer( guide.ci, guide.cj, guide.bi, block, guide.slot );
				return;
			}
			if ( 'col' === guide.kind ) {
				const targetContainer = layout[ guide.ci ];
				// Flow modes (list/row/grid/masonry/scroll-row) render every stored
				// column as a single list, so the guide slot is a flat index that has
				// to be mapped back to a column/block address.
				if ( targetContainer && containerLayoutMode( targetContainer.settings ) !== 'columns' ) {
					const target = flatInsertTarget( targetContainer.inner, guide.slot, null );
					addBlockToColumn( guide.ci, target.cj, block, target.bi );
					return;
				}
				const existing = Array.isArray( layout[ guide.ci ]?.inner?.[ guide.cj ] )
					? layout[ guide.ci ].inner[ guide.cj ].length
					: 0;
				addBlockToColumn( guide.ci, guide.cj, block, Math.min( guide.slot, existing ) );
				return;
			}
			if ( 'top' === guide.kind ) {
				if ( addToSelectedContainer( block ) ) return;
				// Mirror the zone allow-list used by the over-based drop path.
				const alwaysAllowed = isContainerType( block.type ) || block.type.startsWith( 'xcopb/gb-' ) || block.type.startsWith( 'xcosb/gb-' );
				const zoneDef = structure?.zones?.find( ( z ) => z.id === guide.zoneId ) || null;
				if ( ! alwaysAllowed && zoneDef && Array.isArray( zoneDef.allowedBlocks ) && ! zoneDef.allowedBlocks.includes( block.type ) ) {
					return; // Not allowed in this zone.
				}
				const newBlock = { type: block.type, settings: { ...block.defaults } };
				const next = [ ...layout ];
				const nextZone = [ ...zoneMap ];
				const insertAt = flatInsertIndexForZone( guide.zoneId, guide.slot, next, nextZone, structure );
				next.splice( insertAt, 0, newBlock );
				nextZone.splice( insertAt, 0, guide.zoneId );
				setLayoutAndZoneMap( next, nextZone );
				selectBlock( insertAt );
			}
			return;
		}

		const id = typeof active.id === 'string' ? active.id : '';
		if ( id.startsWith( 'nested-' ) ) {
			moveNestedToSlot( active, guide );
			return;
		}
		moveTopLevelToSlot( id, guide );
	}

	// Flat-layout index where a block becomes the slot-th block of `zoneId`
	// (empty zones are anchored next to their nearest populated neighbours).
	function flatInsertIndexForZone( zoneId, slot, list, zones, structureDef ) {
		const inZone = [];
		zones.forEach( ( z, i ) => {
			if ( z === zoneId ) {
				inZone.push( i );
			}
		} );
		if ( inZone.length ) {
			const at = slot < inZone.length ? inZone[ slot ] : inZone[ inZone.length - 1 ] + 1;
			return Math.max( 0, Math.min( at, list.length ) );
		}

		const order = ( structureDef?.zones || [] ).map( ( z ) => z.id );
		const zi = order.indexOf( zoneId );
		const byZone = {};
		zones.forEach( ( z, i ) => {
			( byZone[ z ] = byZone[ z ] || [] ).push( i );
		} );
		for ( let j = zi + 1; j < order.length; j++ ) {
			const l = byZone[ order[ j ] ];
			if ( l && l.length ) {
				return Math.min( l[ 0 ], list.length );
			}
		}
		for ( let j = zi - 1; j >= 0; j-- ) {
			const l = byZone[ order[ j ] ];
			if ( l && l.length ) {
				return Math.min( l[ l.length - 1 ] + 1, list.length );
			}
		}
		return list.length;
	}

	// Reorder an existing top-level block to the guide's zone/slot.
	function moveTopLevelToSlot( activeId, guide ) {
		if ( ! guide || 'top' !== guide.kind ) {
			return;
		}
		const id = String( activeId );
		let oldIndex = -1;
		if ( id.startsWith( 'cv-' ) ) {
			oldIndex = parseInt( id.slice( 3 ), 10 );
		} else if ( id.startsWith( 'block-' ) ) {
			oldIndex = parseInt( id.slice( 6 ), 10 );
		}
		if ( oldIndex < 0 || oldIndex >= layout.length ) {
			return;
		}
		if ( ( zoneMap[ oldIndex ] || '' ) !== guide.zoneId ) {
			return; // Same-zone reorder only.
		}

		const next = [ ...layout ];
		const nextZone = [ ...zoneMap ];
		const moved = next[ oldIndex ];
		next.splice( oldIndex, 1 );
		nextZone.splice( oldIndex, 1 );

		const remaining = [];
		nextZone.forEach( ( z, i ) => {
			if ( z === guide.zoneId ) {
				remaining.push( i );
			}
		} );
		let insertAt;
		if ( remaining.length ) {
			insertAt = guide.slot < remaining.length ? remaining[ guide.slot ] : remaining[ remaining.length - 1 ] + 1;
		} else {
			insertAt = flatInsertIndexForZone( guide.zoneId, guide.slot, next, nextZone, structure );
		}
		insertAt = Math.max( 0, Math.min( insertAt, next.length ) );

		if ( insertAt === oldIndex ) {
			return; // Dropped back in place.
		}

		next.splice( insertAt, 0, moved );
		nextZone.splice( insertAt, 0, guide.zoneId );
		setLayoutAndZoneMap( next, nextZone );
		selectBlock( insertAt );
	}

	// Move a nested widget to the guide's column/slot (remove-then-insert).
	function moveNestedToSlot( active, guide ) {
		if ( ! guide || ! [ 'col', 'inner-container' ].includes( guide.kind ) ) return;
		const activeId = typeof active === 'string' ? active : String( active?.id || '' );
		let sourceAddress = active?.data?.current?.canvasNested;
		if ( ! sourceAddress?.path?.length ) {
			const encoded = activeId.slice( 7 );
			const separator = encoded.indexOf( '-' );
			const ci = Number( encoded.slice( 0, separator ) );
			const encodedPath = encoded.slice( separator + 1 );
			const path = encodedPath.includes( '.' )
				? encodedPath.split( '_' ).map( ( step ) => { const [ cj, bi ] = step.split( '.' ).map( Number ); return { cj, bi }; } )
				: [ { cj: Number( encodedPath.split( '-' )[ 0 ] ), bi: Number( encodedPath.split( '-' )[ 1 ] ) } ];
			sourceAddress = { ci, path };
		}
		const sourcePath = sourceAddress.path;
		if ( ! Number.isInteger( sourceAddress.ci ) || ! sourcePath.length || sourcePath.some( ( step ) => ! Number.isInteger( step.cj ) || ! Number.isInteger( step.bi ) ) ) return;

		const next = layout.map( cloneBlockTree );
		const resolvePath = ( root, path ) => path.reduce( ( block, step ) => block?.inner?.[ step.cj ]?.[ step.bi ], root );
		const sourceRoot = next[ sourceAddress.ci ];
		const sourceParent = resolvePath( sourceRoot, sourcePath.slice( 0, -1 ) );
		const sourceStep = sourcePath[ sourcePath.length - 1 ];
		const sourceColumn = sourceParent?.inner?.[ sourceStep.cj ];
		const moving = sourceColumn?.[ sourceStep.bi ];
		if ( ! moving || ! Array.isArray( sourceColumn ) ) return;

		let targetContainer;
		let targetPath = [];
		let targetRootIndex;
		let targetColumnIndex;
		if ( guide.kind === 'col' ) {
			targetRootIndex = guide.ci;
			targetContainer = next[ guide.ci ];
			targetColumnIndex = guide.cj;
		} else {
			targetRootIndex = guide.ci;
			targetPath = guide.path || [];
			targetContainer = resolvePath( next[ guide.ci ], targetPath );
			targetColumnIndex = guide.columnIndex || 0;
		}
		if ( ! targetContainer || ! isContainerType( targetContainer.type ) ) return;
		const isMovingIntoOwnTree = sourceAddress.container && sourceAddress.ci === targetRootIndex && targetPath.length >= sourcePath.length &&
			sourcePath.every( ( step, index ) => step.cj === targetPath[ index ]?.cj && step.bi === targetPath[ index ]?.bi );
		if ( isMovingIntoOwnTree ) return;

		sourceColumn.splice( sourceStep.bi, 1 );
		targetContainer.inner = Array.isArray( targetContainer.inner ) ? targetContainer.inner : [];
		while ( targetContainer.inner.length <= targetColumnIndex ) targetContainer.inner.push( [] );
		if ( ! Array.isArray( targetContainer.inner[ targetColumnIndex ] ) ) targetContainer.inner[ targetColumnIndex ] = [];

		let targetBlockIndex = guide.slot;
		if ( guide.kind === 'inner-container' && containerLayoutMode( targetContainer.settings ) !== 'columns' ) {
			const address = flatInsertTarget( targetContainer.inner, guide.slot, null );
			targetColumnIndex = address.cj;
			targetBlockIndex = address.bi;
		}
		const targetColumn = targetContainer.inner[ targetColumnIndex ];
		const at = Math.max( 0, Math.min( Number( targetBlockIndex ) || 0, targetColumn.length ) );
		targetColumn.splice( at, 0, moving );

		setLayout( next );
		setSelectedIndex( targetRootIndex );
		const movedPath = findNestedBlockPath( next[ targetRootIndex ], moving );
		setSelectedNested( movedPath ? { ci: targetRootIndex, cj: movedPath[ 0 ].cj, bi: movedPath[ 0 ].bi, path: movedPath } : null );
		setInspectorOpen( true );
	}

	// ---- Derived data ----

	// Collect all allowed block types from the structure zones.
	const allowedBlockTypes = useMemo( () => {
		if ( ! structure || ! structure.zones ) {
			return null; // null = no restriction.
		}
		const types = new Set();
		structure.zones.forEach( ( z ) => {
			if ( z.allowedBlocks ) {
				z.allowedBlocks.forEach( ( t ) => types.add( t ) );
			}
		} );
		return types;
	}, [ structure ] );

	// Helper: remove a block and clean up zoneMap.
	function removeBlockAtIndex( index ) {
		const next = [ ...layout ];
		const nextZone = [ ...zoneMap ];
		next.splice( index, 1 );
		nextZone.splice( index, 1 );
		setLayoutAndZoneMap( next, nextZone );
		setSelectedNested( null );
		if ( selectedIndex === index ) {
			setSelectedIndex( null );
		} else if ( selectedIndex !== null && selectedIndex > index ) {
			setSelectedIndex( selectedIndex - 1 );
		}
	}

	// Add a widget (from palette) into a container column, optionally at a
	// precise slot (the Elementor-style drop position).
	function addBlockToColumn( containerIndex, colIndex, block, insertSlot ) {
		const next = layout.map( cloneBlockTree );
		const container = next[ containerIndex ];
		if ( ! container || ! isContainerType( container.type ) ) {
			return;
		}
		const inner = Array.isArray( container.inner ) ? container.inner.map( ( c ) => [ ...c ] ) : [];
		const newBlock = {
			type: block.type,
			settings: nestedBlockSettings( block ),
			...( isContainerType( block.type ) ? { inner: [ [] ] } : {} ),
		};
		if ( ! inner[ colIndex ] ) {
			inner[ colIndex ] = [];
		}
		const at = typeof insertSlot === 'number' && insertSlot >= 0
			? Math.min( insertSlot, inner[ colIndex ].length )
			: inner[ colIndex ].length;
		inner[ colIndex ].splice( at, 0, newBlock );
		container.inner = inner;
		setLayout( next );
		setSelectedIndex( containerIndex );
		setSelectedNested( { ci: containerIndex, cj: colIndex, bi: at } );
		setInspectorOpen( true );
	}

	// A selected container remains the insertion target if the user drops
	// outside its visible columns. Explicitly dropping on another column still
	// takes priority in the handlers above.
	function addToSelectedContainer( block ) {
		if ( selectedNested ) {
			const { ci, cj, bi } = selectedNested;
			const child = layout[ ci ]?.inner?.[ cj ]?.[ bi ];
			if ( child && isContainerType( child.type ) ) {
				addBlockToNestedContainer( ci, cj, bi, block );
				return true;
			}
			if ( layout[ ci ] && isContainerType( layout[ ci ].type ) ) {
				addBlockToColumn( ci, cj, block );
				return true;
			}
		}
		if ( selectedIndex !== null && layout[ selectedIndex ] && isContainerType( layout[ selectedIndex ].type ) ) {
			addBlockToColumn( selectedIndex, 0, block );
			return true;
		}
		return false;
	}

	// Add to the selected nested container itself. The selectedNested address
	// identifies its parent column and widget, while this helper edits that
	// child container's own first column without flattening it onto the page.
	function addBlockToNestedContainer( containerIndex, colIndex, blockIndex, block, insertSlot ) {
		addBlockToNestedContainerPath( { ci: containerIndex, path: [ { cj: colIndex, bi: blockIndex } ] }, block, insertSlot );
	}

	function addBlockToNestedContainerPath( target, block, insertSlot ) {
		const ci = Number( target?.ci );
		const path = Array.isArray( target?.path ) ? target.path : [];
		if ( ! Number.isInteger( ci ) || ! path.length ) return;
		const next = layout.map( cloneBlockTree );
		let child = next[ ci ];
		for ( const step of path ) {
			child = child?.inner?.[ Number( step.cj ) ]?.[ Number( step.bi ) ];
			if ( ! child || ! isContainerType( child.type ) ) return;
		}
		child.inner = Array.isArray( child.inner ) ? child.inner.map( ( column ) => [ ...column ] ) : [ [] ];
		const inner = child.inner;
		const newBlock = {
			type: block.type,
			settings: nestedBlockSettings( block ),
			...( isContainerType( block.type ) ? { inner: [ [] ] } : {} ),
		};
		const columnIndex = Math.max( 0, Number( target?.columnIndex ) || 0 );
		while ( inner.length <= columnIndex ) inner.push( [] );
		const at = typeof insertSlot === 'number' && insertSlot >= 0
			? Math.min( insertSlot, inner[ columnIndex ].length )
			: inner[ columnIndex ].length;
		inner[ columnIndex ].splice( at, 0, newBlock );
		child.inner = inner;
		setLayout( next );
		setSelectedIndex( ci );
		const selectedPath = [ ...path, { cj: columnIndex, bi: at } ];
		setSelectedNested( { ci, cj: selectedPath[ 0 ].cj, bi: selectedPath[ 0 ].bi, path: selectedPath } );
		setInspectorOpen( true );
	}

	// Remove a widget from a container column.
	function removeBlockFromColumn( containerIndex, colIndex, blockIndex ) {
		const next = [ ...layout ];
		const container = next[ containerIndex ];
		if ( ! container || ! isContainerType( container.type ) || ! Array.isArray( container.inner ) ) {
			return;
		}
		const inner = container.inner.map( ( c ) => [ ...c ] );
		if ( inner[ colIndex ] ) {
			inner[ colIndex ].splice( blockIndex, 1 );
		}
		container.inner = inner;
		setLayout( next );

		// Keep the nested selection valid after removal.
		setSelectedNested( ( prev ) => {
			if ( ! prev || prev.ci !== containerIndex || prev.cj !== colIndex ) {
				return prev;
			}
			if ( prev.bi === blockIndex ) {
				return null;
			}
			if ( prev.bi > blockIndex ) {
				return { ...prev, bi: prev.bi - 1 };
			}
			return prev;
		} );
	}

	// Remove exactly the selected node, including widgets several containers deep.
	function removeBlockAtNestedPath( containerIndex, path ) {
		if ( ! Array.isArray( path ) || ! path.length ) return;
		const next = layout.map( cloneBlockTree );
		let parent = next[ containerIndex ];
		if ( ! parent || ! isContainerType( parent.type ) ) return;

		for ( let index = 0; index < path.length - 1; index++ ) {
			const step = path[ index ];
			parent = parent.inner?.[ Number( step.cj ) ]?.[ Number( step.bi ) ];
			if ( ! parent || ! isContainerType( parent.type ) ) return;
		}

		const last = path[ path.length - 1 ];
		const column = parent.inner?.[ Number( last.cj ) ];
		if ( ! Array.isArray( column ) || ! column[ Number( last.bi ) ] ) return;
		column.splice( Number( last.bi ), 1 );
		setLayout( next );
		const parentPath = path.slice( 0, -1 );
		setSelectedIndex( containerIndex );
		setSelectedNested( parentPath.length ? {
			ci: containerIndex,
			cj: parentPath[ 0 ].cj,
			bi: parentPath[ 0 ].bi,
			path: parentPath,
		} : null );
	}

	// Move a nested widget to a new column/position (drag & drop).
	function moveNestedWidget( activeId, over ) {
		const parts = activeId.slice( 7 ).split( '-' ).map( Number );
		const ci = parts[ 0 ];
		const cj = parts[ 1 ];
		const bi = parts[ 2 ];
		if ( ! Number.isInteger( ci ) || ! Number.isInteger( cj ) || ! Number.isInteger( bi ) ) {
			return;
		}

		let tci;
		let tcj;
		let tbi;
		if ( typeof over?.id === 'string' && over.id.startsWith( 'nested-' ) ) {
			const overParts = over.id.slice( 7 ).split( '-' ).map( Number );
			tci = overParts[ 0 ];
			tcj = overParts[ 1 ];
			tbi = overParts[ 2 ];
		} else if ( typeof over?.id === 'string' && over.id.startsWith( 'col-' ) ) {
			const overParts = over.id.slice( 4 ).split( '-' ).map( Number );
			tci = overParts[ 0 ];
			tcj = overParts[ 1 ];
			tbi = -1; // Append at the end of the column.
		} else {
			return;
		}
		if ( ! Number.isInteger( tci ) || ! Number.isInteger( tcj ) ) {
			return;
		}

		const next = layout.map( ( b ) => ( {
			...b,
			inner: b.inner ? b.inner.map( ( c ) => [ ...c ] ) : undefined,
		} ) );

		const source = next[ ci ];
		if ( ! source || ! isContainerType( source.type ) || ! Array.isArray( source.inner ) || ! source.inner[ cj ] || ! source.inner[ cj ][ bi ] ) {
			return;
		}

		const [ moved ] = source.inner[ cj ].splice( bi, 1 );

		const target = next[ tci ];
		if ( ! target || ! isContainerType( target.type ) ) {
			return;
		}

		// Flow-mode containers render one flattened list, so an "append" or a
		// widget-over-widget drop maps to a flattened insertion address.
		if ( containerLayoutMode( target.settings ) !== 'columns' ) {
			const resolved = flatInsertTarget(
				target.inner,
				typeof tbi === 'number' && tbi >= 0 ? tbi : Number.MAX_SAFE_INTEGER,
				tci === ci ? { cj, bi } : null
			);
			tcj = resolved.cj;
			tbi = resolved.bi;
		}

		if ( ! Array.isArray( target.inner ) ) {
			target.inner = [];
		}
		if ( ! Array.isArray( target.inner[ tcj ] ) ) {
			target.inner[ tcj ] = [];
		}

		let insertAt = tbi;
		// Same column: the removal above shifted indices after bi.
		if ( tci === ci && tcj === cj && typeof tbi === 'number' && tbi > bi ) {
			insertAt = tbi - 1;
		}

		let finalIndex;
		if ( typeof insertAt === 'number' && insertAt >= 0 && insertAt <= target.inner[ tcj ].length ) {
			target.inner[ tcj ].splice( insertAt, 0, moved );
			finalIndex = insertAt;
		} else {
			target.inner[ tcj ].push( moved );
			finalIndex = target.inner[ tcj ].length - 1;
		}

		setLayout( next );
		setSelectedIndex( tci );
		setSelectedNested( { ci: tci, cj: tcj, bi: finalIndex } );
		setInspectorOpen( true );
	}

	if ( loading ) {
		return (
			<div className="xsb-splash">
				<span className="xsb-splash-icon dashicons dashicons-admin-customizer" aria-hidden="true" />
				<h2>{ __( 'Loading builder…', 'xcodesol-page-builder' ) }</h2>
				<p>{ __( 'Fetching your template.', 'xcodesol-page-builder' ) }</p>
			</div>
		);
	}

	if ( ! templateId ) {
		return (
			<div className="xsb-error-box">
				<Notice status="error" isDismissible={ false }>
					{ __( 'Save this template first (give it a title), then the builder will load.', 'xcodesol-page-builder' ) }
				</Notice>
			</div>
		);
	}

	const blockLabels = layout.map( ( b ) => b.type );

	const activeBlock = selectedIndex !== null && layout[ selectedIndex ] ? layout[ selectedIndex ] : null;
	const activeBlockMeta = activeBlock ? getBlockInfo( activeBlock.type ) : null;
	const activeZoneId = selectedIndex !== null ? ( zoneMap[ selectedIndex ] || '' ) : '';
	const activeZoneDef = structure?.zones?.find( ( z ) => z.id === activeZoneId ) || null;
	const activeZoneLabel = activeZoneDef ? activeZoneDef.label : ( activeZoneId ? activeZoneId.toUpperCase() : '' );

	let activeNestedBlock = null;
	let activeNestedMeta = null;
	if ( selectedNested && layout[ selectedNested.ci ] ) {
		const path = Array.isArray( selectedNested.path ) && selectedNested.path.length ? selectedNested.path : [ selectedNested ];
		let current = layout[ selectedNested.ci ];
		for ( const step of path ) current = current?.inner?.[ Number( step.cj ) ]?.[ Number( step.bi ) ];
		activeNestedBlock = current || null;
		activeNestedMeta = activeNestedBlock ? getBlockInfo( activeNestedBlock.type ) : null;
	}

	return (
		<DndContext
			sensors={ sensors }
			collisionDetection={ editorCollisionDetection }
			onDragStart={ handleDragStart }
			onDragMove={ handleDragMove }
			onDragEnd={ handleDragEnd }
			onDragCancel={ handleDragCancel }
		>
			<div className="xsb-app xsb-app--editor" style={ { '--xcopb-primary': globalSettings.global_colors?.primary || '#6c63ff', '--xcopb-secondary': globalSettings.global_colors?.secondary || '#292d50', '--xcopb-text': globalSettings.global_colors?.text || '#172033', '--xcopb-accent': globalSettings.global_colors?.accent || '#18a0fb', '--xcopb-background': globalSettings.global_colors?.background || '#ffffff' } }>
				<header className="xsb-topbar">
					{/* Left cluster: Back, Title, Undo/Redo */}
					<div className="xsb-topbar-cluster xsb-topbar-cluster--left">
						{ config.backUrl && (
							<a
								href={ config.backUrl }
								className="xsb-back-btn"
								title={ __( 'Exit to dashboard', 'xcodesol-page-builder' ) }
							>
								<IconChevronLeft width={ 16 } height={ 16 } />
								<span className="xsb-back-btn__label">{ __( 'Back', 'xcodesol-page-builder' ) }</span>
							</a>
						) }

						<div className="xsb-title-wrap">
							<input
								type="text"
								className="xsb-title-input"
								value={ title }
								placeholder={ __( 'Untitled Page', 'xcodesol-page-builder' ) }
								onChange={ ( e ) => setTitle( e.target.value ) }
							/>
						</div>

						<div className="xsb-history-actions">
							<button
								type="button"
								className="xsb-topbar-icon-btn"
								disabled={ ! canUndo }
								title={ __( 'Undo (Ctrl+Z)', 'xcodesol-page-builder' ) }
								aria-label={ __( 'Undo', 'xcodesol-page-builder' ) }
								onClick={ undo }
							>
								<IconUndo width={ 15 } height={ 15 } />
							</button>
							<button
								type="button"
								className="xsb-topbar-icon-btn"
								disabled={ ! canRedo }
								title={ __( 'Redo (Ctrl+Y)', 'xcodesol-page-builder' ) }
								aria-label={ __( 'Redo', 'xcodesol-page-builder' ) }
								onClick={ redo }
							>
								<IconRedo width={ 15 } height={ 15 } />
							</button>
						</div>
					</div>

					{/* Center cluster: Device switcher & Zoom */}
					<div className="xsb-topbar-cluster xsb-topbar-cluster--center">
						<Dropdown
							popoverProps={ { placement: 'bottom', className: 'xsb-device-popover' } }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<button
									type="button"
									className="xsb-device-menu-toggle"
									aria-haspopup="menu"
									aria-expanded={ isOpen }
									aria-label={ sprintf( __( 'Preview device: %s', 'xcodesol-page-builder' ), previewDevice ) }
									title={ __( 'Choose preview device', 'xcodesol-page-builder' ) }
									onClick={ onToggle }
								>
									{ previewDevice === 'tablet' ? <IconTablet width={ 17 } height={ 17 } /> : previewDevice === 'mobile' ? <IconMobile width={ 17 } height={ 17 } /> : <IconDesktop width={ 17 } height={ 17 } /> }
									<span className="xsb-device-menu-toggle__label">{ previewDevice === 'tablet' ? __( 'Tablet', 'xcodesol-page-builder' ) : previewDevice === 'mobile' ? __( 'Mobile', 'xcodesol-page-builder' ) : __( 'Desktop', 'xcodesol-page-builder' ) }</span>
									<IconChevronDown width={ 12 } height={ 12 } />
								</button>
							) }
							renderContent={ ( { onClose } ) => (
								<div className="xsb-device-menu" role="menu" aria-label={ __( 'Preview device', 'xcodesol-page-builder' ) }>
									{ [
										{ id: 'desktop', label: __( 'Desktop', 'xcodesol-page-builder' ), width: __( 'Full width', 'xcodesol-page-builder' ), Icon: IconDesktop },
										{ id: 'tablet', label: __( 'Tablet', 'xcodesol-page-builder' ), width: '768px', Icon: IconTablet },
										{ id: 'mobile', label: __( 'Mobile', 'xcodesol-page-builder' ), width: '375px', Icon: IconMobile },
									].map( ( item ) => (
										<button key={ item.id } type="button" role="menuitemradio" aria-checked={ previewDevice === item.id } className={ `xsb-device-menu__item${ previewDevice === item.id ? ' is-active' : '' }` } onClick={ () => { setPreviewDevice( item.id ); onClose(); } }>
											<span className="xsb-device-menu__icon"><item.Icon width={ 16 } height={ 16 } /></span>
											<span className="xsb-device-menu__name">{ item.label }</span>
											<span className="xsb-device-menu__width">{ item.width }</span>
										</button>
									) ) }
								</div>
							) }
						/>

						{/* Zoom Controls */}
						<div className="xsb-zoom-controls">
							<button
								type="button"
								className="xsb-topbar-icon-btn xsb-topbar-icon-btn--sm"
								onClick={ () => setZoom( ( z ) => Math.max( 50, z - 25 ) ) }
								title={ __( 'Zoom Out', 'xcodesol-page-builder' ) }
								disabled={ zoom <= 50 }
							>
								<IconZoomOut width={ 14 } height={ 14 } />
							</button>
							<select
								className="xsb-zoom-select"
								value={ zoom }
								onChange={ ( e ) => setZoom( Number( e.target.value ) ) }
								aria-label={ __( 'Canvas Zoom Level', 'xcodesol-page-builder' ) }
							>
								<option value={ 50 }>50%</option>
								<option value={ 75 }>75%</option>
								<option value={ 100 }>100%</option>
								<option value={ 125 }>125%</option>
								<option value={ 150 }>150%</option>
							</select>
							<button
								type="button"
								className="xsb-topbar-icon-btn xsb-topbar-icon-btn--sm"
								onClick={ () => setZoom( ( z ) => Math.min( 150, z + 25 ) ) }
								title={ __( 'Zoom In', 'xcodesol-page-builder' ) }
								disabled={ zoom >= 150 }
							>
								<IconZoomIn width={ 14 } height={ 14 } />
							</button>
						</div>
					</div>

					{/* Right cluster: Command Palette, Theme, Shortcuts, Preview, Save */}
					<div className="xsb-topbar-cluster xsb-topbar-cluster--right">
						<Dropdown
							popoverProps={ { placement: 'bottom-end', className: 'xsb-topbar-menu' } }
							renderToggle={ ( { isOpen, onToggle } ) => <button type="button" className={ `xsb-topbar-icon-btn${ isOpen || pageSettingsOpen || templateSettingsOpen ? ' is-active' : '' }` } title={ __( 'Settings', 'xcodesol-page-builder' ) } aria-label={ __( 'Settings', 'xcodesol-page-builder' ) } aria-expanded={ isOpen } onClick={ onToggle }><IconSettings width={ 15 } height={ 15 } /></button> }
							renderContent={ ( { onClose } ) => <MenuGroup label={ __( 'Editor Settings', 'xcodesol-page-builder' ) }>
								{ config.isWordPressPage ? <MenuItem icon="admin-page" onClick={ () => { onClose(); setPageSettingsOpen( true ); setGlobalSettingsOpen( false ); setTemplateSettingsOpen( false ); setInspectorOpen( true ); } }>{ __( 'Page Settings', 'xcodesol-page-builder' ) }</MenuItem> : <MenuItem icon="admin-generic" onClick={ () => { onClose(); setTemplateSettingsOpen( true ); setPageSettingsOpen( false ); setGlobalSettingsOpen( false ); setInspectorOpen( true ); } }>{ __( 'Template Rules & Settings', 'xcodesol-page-builder' ) }</MenuItem> }
								{ config.canManageSiteSettings && <MenuItem icon="admin-appearance" onClick={ () => { onClose(); setGlobalSettingsOpen( true ); setPageSettingsOpen( false ); setTemplateSettingsOpen( false ); setInspectorOpen( true ); } }>{ __( 'Site Settings', 'xcodesol-page-builder' ) }</MenuItem> }
							</MenuGroup> }
						/>
						{ config.canManageSiteSettings && <button type="button" className={ `xsb-topbar-icon-btn${ globalSettingsOpen ? ' is-active' : '' }` } title={ __( 'Global Styles', 'xcodesol-page-builder' ) } aria-label={ __( 'Global Styles', 'xcodesol-page-builder' ) } onClick={ () => { setGlobalSettingsOpen( true ); setPageSettingsOpen( false ); setTemplateSettingsOpen( false ); setInspectorOpen( true ); } }><IconPalette width={ 15 } height={ 15 } /></button> }
						{ /* Template display conditions and advanced template behavior. */ }
		<button
			type="button"
			className={ `xsb-topbar-icon-btn${ showGuides ? ' is-active' : '' }` }
							onClick={ () => setShowGuides( ( v ) => ! v ) }
							title={ __( 'Toggle grid layout guides', 'xcodesol-page-builder' ) }
						>
			<IconGridGuides width={ 15 } height={ 15 } />
		</button>
		<button
			type="button"
			className={ `xsb-topbar-icon-btn${ navigatorOpen ? ' is-active' : '' }` }
			onClick={ () => setNavigatorOpen( ( open ) => ! open ) }
			title={ __( 'Navigator', 'xcodesol-page-builder' ) }
			aria-label={ __( 'Navigator', 'xcodesol-page-builder' ) }
			aria-expanded={ navigatorOpen }
		>
			<IconLayers width={ 15 } height={ 15 } />
		</button>

						<button
							type="button"
							className="xsb-topbar-icon-btn xsb-command-btn"
							onClick={ () => setCommandPaletteOpen( true ) }
							title={ __( 'Command Palette (Ctrl+K)', 'xcodesol-page-builder' ) }
						>
							<IconCommand width={ 15 } height={ 15 } />
							<kbd className="xsb-kbd">⌘K</kbd>
						</button>

						<button
							type="button"
							className="xsb-topbar-icon-btn"
							onClick={ () => setIsDark( ( v ) => ! v ) }
							title={ isDark ? __( 'Switch to Light Theme', 'xcodesol-page-builder' ) : __( 'Switch to Dark Theme', 'xcodesol-page-builder' ) }
						>
							{ isDark ? <IconSun width={ 15 } height={ 15 } /> : <IconMoon width={ 15 } height={ 15 } /> }
						</button>

						<button
							type="button"
							className="xsb-topbar-icon-btn"
							onClick={ () => {
								const viewUrl = config.viewUrl || config.backUrl || '';
								if ( viewUrl ) {
									window.open( viewUrl, '_blank', 'noopener' );
								}
							} }
							title={ __( 'Preview page on site', 'xcodesol-page-builder' ) }
						>
							<IconEye width={ 15 } height={ 15 } />
						</button>

						<Dropdown
							popoverProps={ { placement: 'bottom-end', className: 'xsb-topbar-menu' } }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<button
									type="button"
									className="xsb-topbar-icon-btn"
									aria-expanded={ isOpen }
									title={ __( 'Import / Export template JSON', 'xcodesol-page-builder' ) }
									onClick={ onToggle }
								>
									<IconShare width={ 15 } height={ 15 } />
								</button>
							) }
							renderContent={ ( { onClose } ) => (
								<MenuGroup label={ __( 'Template Data', 'xcodesol-page-builder' ) }>
									<MenuItem
										icon="share"
										onClick={ () => {
											onClose();
											handleExport();
										} }
									>
										{ __( 'Export JSON', 'xcodesol-page-builder' ) }
									</MenuItem>
									<MenuItem
										icon="upload"
										onClick={ () => {
											onClose();
											if ( importFileRef.current ) {
												importFileRef.current.click();
											}
										} }
									>
										{ __( 'Import JSON', 'xcodesol-page-builder' ) }
									</MenuItem>
								</MenuGroup>
							) }
						/>
						<input
							ref={ importFileRef }
							type="file"
							accept="application/json,.json"
							style={ { display: 'none' } }
							onChange={ ( e ) => {
								handleImportFile( e.target.files && e.target.files[ 0 ] );
								e.target.value = '';
							} }
						/>


						<button
							type="button"
							className={ `xsb-btn xsb-btn--primary xsb-save-btn${ saving ? ' is-saving' : '' }${ saveSuccess ? ' is-success' : '' }` }
							onClick={ handleSave }
							disabled={ saving }
						>
							{ saving ? (
								<>
									<span className="xsb-btn-spinner" />
									<span>{ __( 'Saving…', 'xcodesol-page-builder' ) }</span>
								</>
							) : saveSuccess ? (
								<>
									<IconCheck width={ 15 } height={ 15 } />
									<span>{ __( 'Saved!', 'xcodesol-page-builder' ) }</span>
								</>
							) : (
								<>
									<IconSave width={ 15 } height={ 15 } />
									<span>{ __( 'Save', 'xcodesol-page-builder' ) }</span>
								</>
							) }
						</button>
					</div>
				</header>

				{ error && (
					<div className="xsb-notice-row">
						<Notice status="error" onRemove={ clearNotice }>
							{ error }
						</Notice>
					</div>
				) }

				<div className={ `xsb-workspace${ sidebarOpen ? ' has-sidebar' : '' }${ inspectorOpen ? ' has-inspector' : '' }` }>
					<button
						type="button"
						className={ `xsb-edge-toggle xsb-edge-toggle--left${ sidebarOpen ? ' is-collapsed' : ' is-expanded' }` }
						onClick={ () => { setSidebarPinned( false ); setSidebarOpen( ( v ) => ! v ); } }
						title={ __( 'Toggle left panel', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Toggle left panel', 'xcodesol-page-builder' ) }
					>
						{ sidebarOpen ? <IconChevronLeft size={ 14 } /> : <IconChevronRight size={ 14 } /> }
					</button>

					<aside
						className={ `xsb-sidebar${ sidebarOpen ? ' is-expanded' : ' is-rail' }` }
						onMouseEnter={ () => setSidebarOpen( true ) }
						onMouseLeave={ () => { if ( ! sidebarPinned ) setSidebarOpen( false ); } }
						onFocusCapture={ () => setSidebarOpen( true ) }
					>
							<BlockPalette
								viewType={ viewType }
								structure={ structure }
								allowedBlockTypes={ allowedBlockTypes }
								layout={ layout }
								selectedIndex={ selectedIndex }
								selectedNested={ selectedNested }
								onSelectBlockIndex={ selectBlock }
								onSelectNestedBlock={ selectNestedBlock }
								onMoveBlockIndex={ moveBlock }
								onDeleteBlockIndex={ removeBlockAtIndex }
								onAdd={ ( block ) => {
									// If a nested container itself is active, add inside that
									// container. Otherwise add alongside the selected child in its
									// parent column. Containers follow the same nesting rule.
									if ( selectedNested ) {
										const { ci, cj } = selectedNested;
										const selectedChild = layout[ ci ]?.inner?.[ cj ]?.[ selectedNested.bi ];
											if ( selectedChild && isContainerType( selectedChild.type ) ) {
											addBlockToNestedContainer( ci, cj, selectedNested.bi, block );
											return;
										}
										if ( layout[ ci ] && isContainerType( layout[ ci ].type ) ) {
											addBlockToColumn( ci, cj, block );
											return;
										}
									}
									// If a container itself is selected, insert into its first column
									if ( selectedIndex !== null && layout[ selectedIndex ] && isContainerType( layout[ selectedIndex ].type ) ) {
										addBlockToColumn( selectedIndex, 0, block );
										return;
									}
									let targetZone = '';
									if ( structure && structure.zones ) {
										const matchingZone = structure.zones.find( ( z ) =>
											z.allowedBlocks && z.allowedBlocks.includes( block.type )
										);
										targetZone = matchingZone ? matchingZone.id : ( structure.zones[ 0 ]?.id || '' );
									}
									const next = [ ...layout, { type: block.type, settings: { ...block.defaults } } ];
									const nextZone = [ ...zoneMap, targetZone ];
									setLayoutAndZoneMap( next, nextZone );
									selectBlock( next.length - 1 );
								} }
								onAddPreset={ handleAddPreset }
							/>
					</aside>

					<main className={ `xsb-canvas${ showGuides ? ' has-guides-overlay' : '' }${ previewDevice !== 'desktop' ? ' xsb-canvas--responsive' : '' }` }>
						<div className={ `xsb-preview xsb-preview--live xsb-preview--device-${ previewDevice }` }>
							<div
								className="xsb-preview-frame-wrap"
								ref={ previewWrapRef }
								style={ {
									transform: zoom !== 100 ? `scale(${ zoom / 100 })` : undefined,
									transformOrigin: 'top center',
									transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
								} }
							>
								{ previewDevice === 'mobile' ? (
									<div className="xsb-device-mockup xsb-device-mockup--mobile">
										<PreviewCanvas
											pageSettings={ pageSettings }
											globalSettings={ globalSettings }
											structure={ structure }
											layout={ layout }
											zoneMap={ zoneMap }
											selectedIndex={ selectedIndex }
											onSelect={ selectBlock }
											onRemove={ removeBlockAtIndex }
											onUpdateSettings={ updateBlockSettings }
											selectedNested={ selectedNested }
											onSelectNested={ selectNestedBlock }
											onUpdateNested={ updateNestedSettings }
											stylePanel={ stylePanel }
											onCloseStylePanel={ closeStylePanel }
											device={ previewDevice }
											onStyleDevice={ setPreviewDevice }
											isDragging={ !! activeDrag }
											activeDragId={ activeDrag ? String( activeDrag.id ) : null }
											dropGuide={ dropGuide }
											onMove={ moveBlock }
											onDuplicate={ duplicateBlockAtIndex }
											onMoveNested={ moveNestedBlock }
											onDuplicateNested={ duplicateNestedBlock }
											onOpenStyle={ openStylePanel }
											onOpenStyleNested={ openStylePanelForNested }
							callbacks={ {
								onAddToColumn: addBlockToColumn,
								onRemoveFromColumn: removeBlockFromColumn,
								onAddPreset: handleAddPreset,
														onOpenWidgetPanel: openWidgetPanel,
							} }
										/>
									</div>
								) : previewDevice === 'tablet' ? (
									<div className="xsb-device-mockup xsb-device-mockup--tablet">
										<PreviewCanvas
											pageSettings={ pageSettings }
											globalSettings={ globalSettings }
											structure={ structure }
											layout={ layout }
											zoneMap={ zoneMap }
											selectedIndex={ selectedIndex }
											onSelect={ selectBlock }
											onRemove={ removeBlockAtIndex }
											onUpdateSettings={ updateBlockSettings }
											selectedNested={ selectedNested }
											onSelectNested={ selectNestedBlock }
											onUpdateNested={ updateNestedSettings }
											stylePanel={ stylePanel }
											onCloseStylePanel={ closeStylePanel }
											device={ previewDevice }
											onStyleDevice={ setPreviewDevice }
											isDragging={ !! activeDrag }
											activeDragId={ activeDrag ? String( activeDrag.id ) : null }
											dropGuide={ dropGuide }
											onMove={ moveBlock }
											onDuplicate={ duplicateBlockAtIndex }
											onMoveNested={ moveNestedBlock }
											onDuplicateNested={ duplicateNestedBlock }
											onOpenStyle={ openStylePanel }
											onOpenStyleNested={ openStylePanelForNested }
							callbacks={ {
								onAddToColumn: addBlockToColumn,
								onRemoveFromColumn: removeBlockFromColumn,
								onAddPreset: handleAddPreset,
														onOpenWidgetPanel: openWidgetPanel,
							} }
										/>
									</div>
								) : (
									<PreviewCanvas
										pageSettings={ pageSettings }
										globalSettings={ globalSettings }
										structure={ structure }
										layout={ layout }
										zoneMap={ zoneMap }
										selectedIndex={ selectedIndex }
										onSelect={ selectBlock }
										onRemove={ removeBlockAtIndex }
										onUpdateSettings={ updateBlockSettings }
										selectedNested={ selectedNested }
										onSelectNested={ selectNestedBlock }
										onUpdateNested={ updateNestedSettings }
										stylePanel={ stylePanel }
										onCloseStylePanel={ closeStylePanel }
										device={ previewDevice }
										onStyleDevice={ setPreviewDevice }
										isDragging={ !! activeDrag }
										activeDragId={ activeDrag ? String( activeDrag.id ) : null }
										dropGuide={ dropGuide }
										onMove={ moveBlock }
										onDuplicate={ duplicateBlockAtIndex }
										onMoveNested={ moveNestedBlock }
										onDuplicateNested={ duplicateNestedBlock }
										onOpenStyle={ openStylePanel }
										onOpenStyleNested={ openStylePanelForNested }
						callbacks={ {
							onAddToColumn: addBlockToColumn,
							onRemoveFromColumn: removeBlockFromColumn,
							onAddPreset: handleAddPreset,
														onOpenWidgetPanel: openWidgetPanel,
						} }
									/>
								) }
							</div>
						</div>
						{ navigatorOpen && (
							<Navigator
								layout={ layout }
								zoneMap={ zoneMap }
								selectedIndex={ selectedIndex }
								selectedNested={ selectedNested }
								onSelect={ selectNavigatorBlock }
								onSelectNested={ selectNavigatorNestedBlock }
								onOpenSettings={ selectBlock }
								onOpenSettingsNested={ selectNestedBlock }
								onClose={ () => setNavigatorOpen( false ) }
							/>
						) }
					</main>

					<Inspector
						selectedIndex={ selectedIndex }
						selectedNested={ selectedNested }
						layout={ layout }
						setLayout={ setLayout }
						onUpdateNested={ updateNestedSettings }
						onSelectBlock={ selectBlock }
						onSelectNested={ handleCanvasSelectNested }
						onDuplicate={ ( selectedIndex !== null || selectedNested !== null ) ? duplicateBlock : null }
						onDelete={ ( selectedIndex !== null || selectedNested !== null ) ? () => {
							if ( selectedNested ) {
					removeBlockAtNestedPath( selectedNested.ci, selectedNested.path || [ selectedNested ] );
							} else if ( selectedIndex !== null ) {
								removeBlockAtIndex( selectedIndex );
							}
						} : null }
						viewOptions={ viewOptions }
						viewType={ viewType }
						showTemplateSettings={ templateSettingsOpen }
						showPageSettings={ pageSettingsOpen && !! config.isWordPressPage }
						showGlobalSettings={ globalSettingsOpen }
						globalSettings={ globalSettings }
						customPalette={ ( globalSettings.custom_colors || [] ).map( ( color ) => color.value ) }
						setGlobalSettings={ setGlobalSettings }
						globalFontOptions={ config.fontOptions || [] }
						onSaveGlobalSettings={ handleSaveGlobalSettings }
						pageSettings={ pageSettings }
						setPageSettings={ setPageSettings }
						pageTemplateOptions={ config.pageTemplateOptions || [] }
						title={ title }
						setTitle={ setTitle }
						setViewType={ handleViewTypeChange }
						structure={ structure }
						open={ inspectorOpen }
						onClose={ () => setInspectorOpen( false ) }
						device={ previewDevice }
						onDeviceChange={ setPreviewDevice }
						rules={ {
							priority,
							setPriority,
							settings,
							setSettings,
							conditions,
							setConditions,
						} }
					/>
					<button
						type="button"
						className={ `xsb-edge-toggle xsb-edge-toggle--right${ inspectorOpen ? ' is-collapsed' : ' is-expanded' }` }
						onClick={ () => setInspectorOpen( ( v ) => ! v ) }
						title={ __( 'Toggle right panel', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Toggle right panel', 'xcodesol-page-builder' ) }
					>
						{ inspectorOpen ? <IconChevronRight size={ 14 } /> : <IconChevronLeft size={ 14 } /> }
					</button>
				</div>

				<footer className="xsb-statusbar">
					<div className="xsb-statusbar-left">
						<span className="xsb-status-pill xsb-status-pill--type">
							{ viewOptions[ viewType ]?.label || viewOptions[ viewType ] || viewType }
						</span>
						<span className="xsb-status-pill">
							{ layout.length } { layout.length === 1 ? __( 'block', 'xcodesol-page-builder' ) : __( 'blocks', 'xcodesol-page-builder' ) }
						</span>
						<div className="xsb-status-breadcrumb">
							<span className="xsb-status-bc-item">{ __( 'Page', 'xcodesol-page-builder' ) }</span>
							{ activeBlockMeta && (
								<>
									<span className="xsb-status-bc-sep">/</span>
									<span className="xsb-status-bc-item is-active">{ activeBlockMeta.label }</span>
								</>
							) }
							{ selectedNested && activeNestedMeta && (
								<>
									<span className="xsb-status-bc-sep">/</span>
									<span className="xsb-status-bc-item is-active">{ activeNestedMeta.label }</span>
								</>
							) }
						</div>
					</div>

					<div className="xsb-statusbar-right">
						<div className="xsb-status-save-state">
							<span className={ `xsb-status-dot${ saving ? ' is-saving' : ( notice || saveSuccess ? ' is-saved' : '' ) }` } />
							<span>{ saving ? __( 'Saving…', 'xcodesol-page-builder' ) : saveSuccess ? __( 'All changes saved', 'xcodesol-page-builder' ) : ( notice ? notice : __( 'Ready', 'xcodesol-page-builder' ) ) }</span>
						</div>
						<button
							type="button"
							className="xsb-status-zoom-btn"
							onClick={ () => setZoom( 100 ) }
							title={ __( 'Reset zoom to 100%', 'xcodesol-page-builder' ) }
						>
							{ zoom }%
						</button>
						<button
							type="button"
							className="xsb-status-shortcuts-btn"
							onClick={ () => setShortcutsOpen( true ) }
							title={ __( 'Keyboard Shortcuts (?)', 'xcodesol-page-builder' ) }
						>
							<IconHelp width={ 13 } height={ 13 } />
							<span>{ __( 'Shortcuts', 'xcodesol-page-builder' ) }</span>
						</button>
					</div>
				</footer>
			</div>

			<CommandPalette
				isOpen={ commandPaletteOpen }
				onClose={ () => setCommandPaletteOpen( false ) }
				availableBlocks={ [
					...CONTAINER_BLOCKS,
					...BASIC_BLOCKS,
					...GENERAL_BLOCKS,
					...WIDGET_BLOCKS,
				] }
				onSelectBlock={ ( block ) => {
					const next = [ ...layout, { type: block.type, settings: { ...block.defaults } } ];
					const nextZone = [ ...zoneMap, structure?.zones?.[ 0 ]?.id || '' ];
					setLayoutAndZoneMap( next, nextZone );
					selectBlock( next.length - 1 );
					addToast( sprintf( __( 'Added %s to canvas', 'xcodesol-page-builder' ), block.label ), 'success' );
				} }
				onSave={ handleSave }
				onUndo={ undo }
				onRedo={ redo }
				canUndo={ canUndo }
				canRedo={ canRedo }
				onToggleTheme={ () => setIsDark( ( v ) => ! v ) }
				isDark={ isDark }
				onSetDevice={ setPreviewDevice }
				onOpenSettings={ () => {
					setPageSettingsOpen( !! config.isWordPressPage );
					setTemplateSettingsOpen( ! config.isWordPressPage );
					setGlobalSettingsOpen( false );
					setInspectorOpen( true );
				} }
			/>

			<ShortcutsModal
				isOpen={ shortcutsOpen }
				onClose={ () => setShortcutsOpen( false ) }
			/>

			<ToastNotification
				toasts={ toasts }
				onDismiss={ ( id ) => setToasts( ( prev ) => prev.filter( ( t ) => t.id !== id ) ) }
			/>

			<DragOverlay dropAnimation={ null }>
				{ activeDrag ? (
					<div className={ `xsb-drag-overlay${ activeDrag.data.current?.navigatorMove ? ' xsb-drag-overlay--navigator' : '' }` }>
						{ activeDrag.data.current?.navigatorMove
							? activeDrag.data.current.navigatorMove.label
							: activeDrag.data.current?.fromPalette
							? activeDrag.data.current.block.label
							: (() => {
									const id = String( activeDrag.id );
									if ( id.startsWith( 'block-' ) || id.startsWith( 'cv-' ) ) {
										const idx = toBlockIndex( id );
										return layout[ idx ] ? blockTypeLabel( layout[ idx ].type ) : '';
									}
									if ( id.startsWith( 'nested-' ) ) {
										const parts = id.slice( 7 ).split( '-' ).map( Number );
										const b = layout[ parts[ 0 ] ]?.inner?.[ parts[ 1 ] ]?.[ parts[ 2 ] ];
										return b ? blockTypeLabel( b.type ) : '';
									}
									return blockLabels[ parseInt( id.slice( 6 ), 10 ) ] || '';
								})() }
					</div>
				) : null }
			</DragOverlay>
		</DndContext>
	);
}

function App( { config } ) {
	const templateId = config.templateId || 0;

	const { template } = useSelect( ( select ) => {
		const store = select( STORE );
		return {
			template: store.getTemplate(),
		};
	}, [] );

	const { fetchTemplate } = useDispatch( STORE );

	useEffect( () => {
		if ( templateId ) {
			fetchTemplate( templateId );
		}
	}, [ templateId, fetchTemplate ] );

	// Resolve the structure: saved template → sessionStorage → the single
	// default structure for this view type. A saved structure is only kept
	// when it actually belongs to the template's view type — otherwise the
	// view's default structure is used so the editor always offers the
	// blocks related to the selected template type (e.g. card blocks for a
	// Product Card template, cart/checkout blocks for those pages).
	const savedStructureId = templateId ? loadSavedStructure( templateId ) : null;

	const viewType = template?.view_type || config.viewType || 'page';
	const defaultStructureId = getDefaultStructureId( viewType );
	const requestedStructureId = template?.structure || savedStructureId || '';
	const currentStructure =
		( requestedStructureId &&
			structureBelongsToView( requestedStructureId, viewType ) &&
			getStructureById( requestedStructureId ) ) ||
		getStructureById( defaultStructureId );

	return (
		<Editor
			config={ config }
			structure={ currentStructure }
		/>
	);
}

export default App;
