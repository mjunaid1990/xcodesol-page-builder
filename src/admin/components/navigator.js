/**
 * Recursive page structure navigator.
 *
 * @package Xcodesol_Page_Builder
 */

import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDndContext } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	IconLayers,
	IconChevronDown,
	IconChevronRight,
	IconClose,
	IconWidgetContainer,
	IconWidgetHeading,
	IconWidgetText,
	IconWidgetImage,
	IconWidgetButton,
	IconWidgetDivider,
	IconWidgetBanner,
	IconWidgetShortcode,
	IconWidgetBreadcrumb,
	IconWidgetProduct,
} from './icons';

const isContainer = ( block ) => /(?:xcopb|xcosb)\/(?:gb-container|container)/.test( block?.type || '' );
const widgetIcons = {
	heading: IconWidgetHeading,
	text: IconWidgetText,
	'text-widget': IconWidgetText,
	image: IconWidgetImage,
	button: IconWidgetButton,
	divider: IconWidgetDivider,
	banner: IconWidgetBanner,
	shortcode: IconWidgetShortcode,
	breadcrumb: IconWidgetBreadcrumb,
	'sp-title': IconWidgetHeading,
	'sp-content': IconWidgetText,
	'sp-featured-image': IconWidgetImage,
	'ar-title': IconWidgetHeading,
	'ar-description': IconWidgetText,
	'ar-loop': IconWidgetProduct,
};
const sortableId = ( block, rootIndex, path = [] ) => `navigator-item-${ block?.id || `${ rootIndex }-${ path.map( ( step ) => `${ step.cj }-${ step.bi }` ).join( '-' ) }` }`;
const blockNodeKey = ( block, rootIndex, path = [] ) => `container-${ block?.id || `${ rootIndex }-${ path.map( ( step ) => `${ step.cj }-${ step.bi }` ).join( '-' ) }` }`;
const blockTitle = ( block ) => {
	if ( isContainer( block ) ) return __( 'Container', 'xcodesol-page-builder' );
	const slug = ( block?.type || '' ).split( '/' ).pop().replace( /^gb-/, '' );
	const rawLabel = String( block?.label || '' ).trim();
	const cleanLabel = rawLabel && ! /^[a-z0-9_-]+\/[a-z0-9_-]+$/i.test( rawLabel ) ? rawLabel : '';
	const labels = {
		heading: __( 'Heading', 'xcodesol-page-builder' ),
		text: __( 'Text Editor', 'xcodesol-page-builder' ),
		'text-widget': __( 'Text Editor', 'xcodesol-page-builder' ),
		image: __( 'Image', 'xcodesol-page-builder' ),
		button: __( 'Button', 'xcodesol-page-builder' ),
		divider: __( 'Divider', 'xcodesol-page-builder' ),
		banner: __( 'Banner', 'xcodesol-page-builder' ),
		shortcode: __( 'Shortcode', 'xcodesol-page-builder' ),
		breadcrumb: __( 'Breadcrumbs', 'xcodesol-page-builder' ),
		'sp-title': __( 'Post Title', 'xcodesol-page-builder' ),
		'sp-content': __( 'Post Content', 'xcodesol-page-builder' ),
		'sp-featured-image': __( 'Featured Image', 'xcodesol-page-builder' ),
		'sp-post-meta': __( 'Post Meta', 'xcodesol-page-builder' ),
		'sp-comments': __( 'Comments', 'xcodesol-page-builder' ),
		'ar-title': __( 'Archive Title', 'xcodesol-page-builder' ),
		'ar-description': __( 'Archive Description', 'xcodesol-page-builder' ),
		'ar-loop': __( 'Posts', 'xcodesol-page-builder' ),
		'ar-pagination': __( 'Pagination', 'xcodesol-page-builder' ),
	};
	return cleanLabel || labels[ slug ] || ( block?.type || __( 'Element', 'xcodesol-page-builder' ) ).replace( /^xcopb\/|^xcosb\//, '' ).replace( /^gb-/, '' ).replace( /[-_/]+/g, ' ' );
};

function SortableTreeItem( { id, moveData, className, dragPointerY, children } ) {
	const { active, over } = useDndContext();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable( {
		id,
		data: { navigatorMove: moveData },
	} );
	const rowRef = useRef( null );
	const style = { transform: CSS.Transform.toString( transform ), transition };
	const source = active?.data?.current?.navigatorMove;
	const overThisItem = String( over?.id ) === String( id ) && String( active?.id ) !== String( id );
	const activeRect = String( active?.id ) === String( id ) ? rowRef.current?.getBoundingClientRect() : active?.rect?.current?.translated;
	const targetRect = overThisItem ? rowRef.current?.getBoundingClientRect() || over?.rect : over?.rect;
	const activeCenter = activeRect ? activeRect.top + activeRect.height / 2 : null;
	const dropY = Number.isFinite( dragPointerY ) ? dragPointerY : activeCenter;
	const targetRatio = dropY !== null && dropY !== undefined && targetRect?.height
		? ( dropY - targetRect.top ) / targetRect.height
		: 0.5;
	const isInside = overThisItem && !! moveData.container && targetRatio >= 0.24 && targetRatio <= 0.76;
	const dropPosition = isInside ? 'inside' : targetRatio < 0.5 ? 'before' : 'after';
	const invalidSelfDrop = source && (
		( source.kind === 'root' && moveData.kind === 'root' && source.index === moveData.index && ! isInside ) ||
		( source.kind === 'root' && moveData.kind === 'root' && ! isInside && ( source.zone || '' ) !== ( moveData.zone || '' ) ) ||
		( source.kind === 'root' && moveData.kind === 'nested' && source.index === moveData.ci ) ||
		( source.kind === 'nested' && moveData.kind === 'nested' && source.ci === moveData.ci &&
			Array.isArray( source.path ) && moveData.path.length >= source.path.length &&
			source.path.every( ( step, index ) => step.cj === moveData.path[ index ]?.cj && step.bi === moveData.path[ index ]?.bi ) )
	);
	const canDrop = overThisItem && !! source && ! invalidSelfDrop && ( ! isInside || moveData.container );
	const dropClass = canDrop ? ` is-drop-${ dropPosition }` : '';
	return <div className={ `${ className }${ isDragging ? ' is-dragging' : '' }` } style={ style }>{ children( attributes, listeners, rowRef, dropClass, setNodeRef ) }</div>;
}

function NavigatorItem( props ) {
	const {
		block, rootIndex, path, root, columnIndex, itemIndex, selectedIndex, selectedNested,
		onSelect, onSelectNested, expandedContainers, toggleContainer, collapsedColumns, toggleColumn, dragPointerY,
	} = props;
	const container = isContainer( block );
	const ItemIcon = container ? IconWidgetContainer : widgetIcons[ ( block?.type || '' ).split( '/' ).pop().replace( /^gb-/, '' ) ];
	const nodeKey = blockNodeKey( block, rootIndex, path );
	const expanded = !! expandedContainers[ nodeKey ];
	const children = container && Array.isArray( block.inner ) ? block.inner : [];
	const hasChildren = children.some( ( column ) => Array.isArray( column ) && column.length );
	const selectedPath = Array.isArray( selectedNested?.path ) && selectedNested.path.length
		? selectedNested.path
		: selectedNested ? [ { cj: selectedNested.cj, bi: selectedNested.bi } ] : [];
	const nestedSelected = ! root && selectedNested?.ci === rootIndex && JSON.stringify( selectedPath ) === JSON.stringify( path );
	const rootSelected = root && selectedIndex === rootIndex && ! selectedNested;
	const selected = rootSelected || nestedSelected;
	const ancestorSelected = !! selectedNested && selectedNested.ci === rootIndex && (
		root || ( path.length < selectedPath.length && path.every( ( step, index ) => step.cj === selectedPath[ index ]?.cj && step.bi === selectedPath[ index ]?.bi ) )
	);
	const moveData = root
		? { kind: 'root', blockId: block.id, index: rootIndex, container, label: blockTitle( block ), zone: props.zoneMap?.[ rootIndex ] || '' }
		: { kind: 'nested', blockId: block.id, ci: rootIndex, path, container, label: blockTitle( block ) };
	const itemSortableId = sortableId( block, rootIndex, path );

	return (
		<SortableTreeItem id={ itemSortableId } moveData={ moveData } className="xsb-navigator__branch" dragPointerY={ dragPointerY }>
			{ ( dragAttributes, dragListeners, rowRef, dropClass, setSortableRef ) => <>
				<div ref={ ( element ) => { rowRef.current = element; setSortableRef( element ); } } id={ itemSortableId } { ...dragAttributes } { ...dragListeners } className={ `xsb-navigator__row${ selected ? ' is-selected' : '' }${ ancestorSelected && ! selected ? ' is-ancestor' : '' }${ dropClass }` } role="treeitem" aria-selected={ selected } aria-level={ root ? 1 : path.length + 1 } aria-expanded={ container ? expanded : undefined }>
					{ container && <button type="button" className="xsb-navigator__disclosure" onClick={ ( event ) => { event.stopPropagation(); toggleContainer( nodeKey ); } } aria-label={ expanded ? __( 'Collapse container', 'xcodesol-page-builder' ) : __( 'Expand container', 'xcodesol-page-builder' ) } aria-expanded={ expanded }>{ expanded ? <IconChevronDown width={ 13 } height={ 13 } /> : <IconChevronRight width={ 13 } height={ 13 } /> }</button> }
					<button
						type="button"
						className="xsb-navigator__select"
						onClick={ () => root ? onSelect?.( rootIndex ) : onSelectNested?.( rootIndex, path[ 0 ]?.cj ?? columnIndex, path[ 0 ]?.bi ?? itemIndex, null, path ) }
						onDoubleClick={ () => root ? onOpenSettings?.( rootIndex ) : onOpenSettingsNested?.( rootIndex, path[ 0 ]?.cj ?? columnIndex, path[ 0 ]?.bi ?? itemIndex, null, path ) }
					>
						{ ItemIcon && <span className="xsb-navigator__item-icon"><ItemIcon width={ 14 } height={ 14 } /></span> }
						<span className="xsb-navigator__label">{ blockTitle( block ) }</span>
					</button>
				</div>
				{ container && expanded && (
					<div className="xsb-navigator__children" role="group">
						{ hasChildren ? children.map( ( column, cj ) => {
							const items = Array.isArray( column ) ? column : [];
							const showColumn = children.length > 1;
							const colKey = `${ nodeKey }-column-${ cj }`;
							const columnExpanded = ! collapsedColumns[ colKey ];
							return <div className="xsb-navigator__column" key={ colKey }>
								{ showColumn && <button type="button" className="xsb-navigator__column-label" onClick={ () => toggleColumn( colKey ) } aria-expanded={ columnExpanded }>{ columnExpanded ? <IconChevronDown width={ 12 } height={ 12 } /> : <IconChevronRight width={ 12 } height={ 12 } />}<span>{ sprintf( __( 'Column %d', 'xcodesol-page-builder' ), cj + 1 ) }</span><span className="xsb-navigator__count">{ items.length }</span></button> }
								{ ( ! showColumn || columnExpanded ) && <SortableContext
									items={ items.map( ( child, bi ) => sortableId( child, rootIndex, [ ...path, { cj, bi } ] ) ) }
									strategy={ verticalListSortingStrategy }
								>
									{ items.map( ( child, bi ) => <NavigatorItem
										key={ child.id || `${ nodeKey }-${ cj }-${ bi }` }
										{ ...props }
										block={ child }
										root={ false }
										path={ [ ...path, { cj, bi } ] }
										columnIndex={ cj }
										itemIndex={ bi }
									/> ) }
								</SortableContext> }
							</div>;
						} ) : <span className="xsb-navigator__empty-child">{ __( 'Empty', 'xcodesol-page-builder' ) }</span> }
					</div>
				) }
			</> }
		</SortableTreeItem>
	);
}

export default function Navigator( { layout = [], zoneMap = [], selectedIndex, selectedNested, onSelect, onSelectNested, onOpenSettings, onOpenSettingsNested, onClose } ) {
	const { active } = useDndContext();
	const [ expandedContainers, setExpandedContainers ] = useState( {} );
	const [ collapsedColumns, setCollapsedColumns ] = useState( {} );
	const [ dragPointerY, setDragPointerY ] = useState( null );
	const navigatorDragActive = !! active?.data?.current?.navigatorMove;
	const toggleContainer = ( key ) => setExpandedContainers( ( current ) => ( { ...current, [ key ]: ! current[ key ] } ) );
	const toggleColumn = ( key ) => setCollapsedColumns( ( current ) => ( { ...current, [ key ]: ! current[ key ] } ) );
	useEffect( () => {
		if ( ! navigatorDragActive ) {
			setDragPointerY( null );
			return undefined;
		}
		let frame = 0;
		const trackPointer = ( event ) => {
			if ( frame ) window.cancelAnimationFrame( frame );
			const nextY = event.clientY;
			frame = window.requestAnimationFrame( () => {
				setDragPointerY( ( current ) => current === nextY ? current : nextY );
				frame = 0;
			} );
		};
		window.addEventListener( 'pointermove', trackPointer, { passive: true } );
		return () => {
			window.removeEventListener( 'pointermove', trackPointer );
			if ( frame ) window.cancelAnimationFrame( frame );
		};
	}, [ navigatorDragActive, active?.id ] );
	const selectedPath = useMemo( () => Array.isArray( selectedNested?.path ) && selectedNested.path.length
		? selectedNested.path
		: selectedNested ? [ { cj: selectedNested.cj, bi: selectedNested.bi } ] : [], [ selectedNested ] );
	const selectedBlock = selectedNested
		? selectedPath.reduce( ( current, step ) => current?.inner?.[ step.cj ]?.[ step.bi ], layout[ selectedNested.ci ] )
		: layout[ selectedIndex ];
	const selectedNodeId = selectedBlock?.id ? sortableId( selectedBlock, selectedNested?.ci ?? selectedIndex, selectedPath ) : null;

	// Containers start folded. Selecting an element in the canvas or in this
	// tree opens its path so the matching row is always visible in Navigator.
	useEffect( () => {
		if ( ! selectedBlock ) return;
		const keys = [];
		if ( selectedNested ) {
			let current = layout[ selectedNested.ci ];
			if ( isContainer( current ) ) keys.push( blockNodeKey( current, selectedNested.ci, [] ) );
			selectedPath.forEach( ( step, index ) => {
				current = current?.inner?.[ step.cj ]?.[ step.bi ];
				if ( isContainer( current ) && index < selectedPath.length ) {
					keys.push( blockNodeKey( current, selectedNested.ci, selectedPath.slice( 0, index + 1 ) ) );
				}
			} );
		} else if ( isContainer( selectedBlock ) ) {
			keys.push( blockNodeKey( selectedBlock, selectedIndex, [] ) );
		}
		if ( keys.length ) {
			setExpandedContainers( ( current ) => {
				const next = { ...current };
				let changed = false;
				keys.forEach( ( key ) => {
					if ( ! next[ key ] ) { next[ key ] = true; changed = true; }
				} );
				return changed ? next : current;
			} );
		}
	}, [ layout, selectedIndex, selectedNested, selectedBlock, selectedPath ] );

	useEffect( () => {
		if ( ! selectedNodeId ) return undefined;
		const frame = window.requestAnimationFrame( () => {
			document.getElementById( selectedNodeId )?.scrollIntoView( { block: 'nearest', inline: 'nearest', behavior: 'smooth' } );
		} );
		return () => window.cancelAnimationFrame( frame );
	}, [ selectedNodeId, expandedContainers ] );

	const shared = { layout, zoneMap, selectedIndex, selectedNested, onSelect, onSelectNested, onOpenSettings, onOpenSettingsNested, expandedContainers, toggleContainer, collapsedColumns, toggleColumn, dragPointerY };
	return (
		<section className="xsb-navigator" aria-label={ __( 'Structure', 'xcodesol-page-builder' ) }>
			<header className="xsb-navigator__header"><span className="xsb-navigator__heading-icon"><IconLayers width={ 15 } height={ 15 } /></span><strong>{ __( 'Structure', 'xcodesol-page-builder' ) }</strong><button type="button" className="xsb-navigator__close" onClick={ onClose } aria-label={ __( 'Close Structure', 'xcodesol-page-builder' ) } title={ __( 'Close', 'xcodesol-page-builder' ) }><IconClose width={ 14 } height={ 14 } /></button></header>
			<div className="xsb-navigator__tree" role="tree" aria-label={ __( 'Page structure', 'xcodesol-page-builder' ) }>
				{ ! layout.length ? <div className="xsb-navigator__empty">{ __( 'Add a container or widget to start building.', 'xcodesol-page-builder' ) }</div> : <SortableContext items={ layout.map( ( block, index ) => sortableId( block, index ) ) } strategy={ verticalListSortingStrategy }>
					{ layout.map( ( block, index ) => <NavigatorItem key={ block.id || `navigator-root-${ index }` } { ...shared } block={ block } rootIndex={ index } root path={ [] } /> ) }
				</SortableContext> }
			</div>
		</section>
	);
}
