/**
 * Recursive page structure navigator.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconLayers, IconChevronDown, IconChevronRight, IconClose, IconWidgetContainer, IconGrip } from './icons';

const isContainer = ( block ) => /(?:xcopb|xcosb)\/(?:gb-container|container)/.test( block?.type || '' );
const sortableId = ( rootIndex, path, root = false ) => root
	? `nav-root-${ rootIndex }`
	: `nav-node-${ rootIndex }-${ path.map( ( step ) => `${ step.cj }_${ step.bi }` ).join( '__' ) }`;
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
	return block?.settings?.title || block?.settings?.text || cleanLabel || labels[ slug ] || ( block?.type || __( 'Element', 'xcodesol-page-builder' ) ).replace( /^xcopb\/|^xcosb\//, '' ).replace( /^gb-/, '' ).replace( /[-_/]+/g, ' ' );
};

function SortableTreeItem( { id, moveData, className, children } ) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable( {
		id,
		data: { navigatorMove: moveData },
	} );
	const style = { transform: CSS.Transform.toString( transform ), transition };
	return <div ref={ setNodeRef } className={ `${ className }${ isDragging ? ' is-dragging' : '' }${ isOver ? ' is-drop-target' : '' }` } style={ style }>{ children( attributes, listeners ) }</div>;
}

function NavigatorItem( props ) {
	const {
		block, rootIndex, path, root, columnIndex, itemIndex, selectedIndex, selectedNested,
		onSelect, onSelectNested, onReorder, collapsed, toggle,
	} = props;
	const container = isContainer( block );
	const nodeKey = root ? `root-${ rootIndex }` : `tree-${ rootIndex }-${ path.map( ( step ) => `${ step.cj }-${ step.bi }` ).join( '-' ) }`;
	const expanded = ! collapsed[ nodeKey ];
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
	const moveData = root ? { kind: 'root', index: rootIndex, container } : { kind: 'nested', ci: rootIndex, path, container };
	const itemSortableId = sortableId( rootIndex, path, root );

	return (
		<SortableTreeItem id={ itemSortableId } moveData={ moveData } className="xsb-navigator__branch">
			{ ( dragAttributes, dragListeners ) => <>
				<div className={ `xsb-navigator__row${ selected ? ' is-selected' : '' }${ ancestorSelected && ! selected ? ' is-ancestor' : '' }` } role="treeitem" aria-selected={ selected } aria-level={ root ? 1 : path.length + 1 } aria-expanded={ container ? expanded : undefined }>
					{ container ? <button type="button" className="xsb-navigator__disclosure" onClick={ () => toggle( nodeKey ) } aria-label={ expanded ? __( 'Collapse container', 'xcodesol-page-builder' ) : __( 'Expand container', 'xcodesol-page-builder' ) }>{ expanded ? <IconChevronDown width={ 13 } height={ 13 } /> : <IconChevronRight width={ 13 } height={ 13 } /> }</button> : <span className="xsb-navigator__disclosure-spacer" /> }
					<button type="button" className="xsb-navigator__drag" { ...dragAttributes } { ...dragListeners } aria-label={ __( 'Drag to move', 'xcodesol-page-builder' ) } title={ __( 'Drag to move', 'xcodesol-page-builder' ) }><IconGrip width={ 14 } height={ 14 } /></button>
					<button type="button" className="xsb-navigator__select" onClick={ () => root ? onSelect?.( rootIndex ) : onSelectNested?.( rootIndex, path[ 0 ]?.cj ?? columnIndex, path[ 0 ]?.bi ?? itemIndex, null, path ) }>
						{ container && <span className="xsb-navigator__item-icon"><IconWidgetContainer width={ 14 } height={ 14 } /></span> }
						<span className="xsb-navigator__label">{ blockTitle( block ) }</span>
					</button>
				</div>
				{ container && expanded && (
					<div className="xsb-navigator__children" role="group">
						{ ! hasChildren && <div className="xsb-navigator__empty-node">{ __( 'Empty', 'xcodesol-page-builder' ) }</div> }
						{ children.map( ( column, cj ) => {
							const items = Array.isArray( column ) ? column : [];
							const showColumn = children.length > 1;
							const colKey = `${ nodeKey }-column-${ cj }`;
							return <div className="xsb-navigator__column" key={ colKey }>
								{ showColumn && <button type="button" className="xsb-navigator__column-label" onClick={ () => toggle( colKey ) }><IconChevronDown width={ 12 } height={ 12 } /><span>{ sprintf( __( 'Column %d', 'xcodesol-page-builder' ), cj + 1 ) }</span><span className="xsb-navigator__count">{ items.length }</span></button> }
								{ ( ! showColumn || ! collapsed[ colKey ] ) && <SortableContext
									items={ items.map( ( _, bi ) => sortableId( rootIndex, [ ...path, { cj, bi } ] ) ) }
									strategy={ verticalListSortingStrategy }
								>
									{ items.map( ( child, bi ) => <NavigatorItem
										key={ `${ nodeKey }-${ cj }-${ bi }` }
										{ ...props }
										block={ child }
										root={ false }
										path={ [ ...path, { cj, bi } ] }
										columnIndex={ cj }
										itemIndex={ bi }
									/> ) }
								</SortableContext> }
							</div>;
						} ) }
					</div>
				) }
			</> }
		</SortableTreeItem>
	);
}

export default function Navigator( { layout = [], selectedIndex, selectedNested, onSelect, onSelectNested, onReorder, onClose } ) {
	const [ collapsed, setCollapsed ] = useState( {} );
	const toggle = ( key ) => setCollapsed( ( current ) => ( { ...current, [ key ]: ! current[ key ] } ) );
	const shared = { layout, selectedIndex, selectedNested, onSelect, onSelectNested, onReorder, collapsed, toggle };
	return (
		<section className="xsb-navigator" aria-label={ __( 'Navigator', 'xcodesol-page-builder' ) }>
			<header className="xsb-navigator__header"><span className="xsb-navigator__heading-icon"><IconLayers width={ 15 } height={ 15 } /></span><strong>{ __( 'Navigator', 'xcodesol-page-builder' ) }</strong><button type="button" className="xsb-navigator__close" onClick={ onClose } aria-label={ __( 'Close Navigator', 'xcodesol-page-builder' ) } title={ __( 'Close', 'xcodesol-page-builder' ) }><IconClose width={ 14 } height={ 14 } /></button></header>
			<div className="xsb-navigator__tree" role="tree" aria-label={ __( 'Page structure', 'xcodesol-page-builder' ) }>
				{ ! layout.length ? <div className="xsb-navigator__empty">{ __( 'Add a container or widget to start building.', 'xcodesol-page-builder' ) }</div> : <SortableContext items={ layout.map( ( _, index ) => sortableId( index, [], true ) ) } strategy={ verticalListSortingStrategy }>
					{ layout.map( ( block, index ) => <NavigatorItem key={ `navigator-root-${ index }` } { ...shared } block={ block } rootIndex={ index } root path={ [] } /> ) }
				</SortableContext> }
			</div>
		</section>
	);
}
