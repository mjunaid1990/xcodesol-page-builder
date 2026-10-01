/**
 * Recursive page structure navigator.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconLayers, IconChevronDown, IconChevronRight, IconClose, IconPlus, IconArrowUp, IconArrowDown, IconWidgetContainer, IconGrip } from './icons';

const isContainer = ( block ) => /(?:xcopb|xcosb)\/(?:gb-container|container)/.test( block?.type || '' );
const blockTitle = ( block ) => {
	if ( isContainer( block ) ) return __( 'Container', 'xcodesol-page-builder' );
	return block?.settings?.title || block?.settings?.text || block?.label || ( block?.type || __( 'Element', 'xcodesol-page-builder' ) ).replace( /^xcopb\/|^xcosb\//, '' ).replace( /^gb-/, '' ).replace( /[-_/]+/g, ' ' );
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
		onSelect, onSelectNested, onAddContainerInside, onMoveBlock, onReorder, collapsed, toggle,
	} = props;
	const container = isContainer( block );
	const nodeKey = root ? `root-${ rootIndex }` : `tree-${ rootIndex }-${ path.map( ( step ) => `${ step.cj }-${ step.bi }` ).join( '-' ) }`;
	const expanded = ! collapsed[ nodeKey ];
	const children = container && Array.isArray( block.inner ) ? block.inner : [];
	const hasChildren = children.some( ( column ) => Array.isArray( column ) && column.length );
	const directSelected = ! root && selectedNested?.ci === rootIndex && selectedNested?.cj === path[ 0 ]?.cj && selectedNested?.bi === path[ 0 ]?.bi && path.length === 1;
	const rootSelected = root && selectedIndex === rootIndex && ! selectedNested;
	const selected = rootSelected || directSelected;
	const moveData = root ? { kind: 'root', index: rootIndex, container } : { kind: 'nested', ci: rootIndex, path, container };
	const sortableId = root ? `nav-root-${ rootIndex }` : `nav-node-${ rootIndex }-${ path.map( ( step ) => `${ step.cj }_${ step.bi }` ).join( '__' ) }`;
	let parentContainer = props.layout?.[ rootIndex ];
	if ( ! root ) {
		for ( const step of path.slice( 0, -1 ) ) parentContainer = parentContainer?.inner?.[ step.cj ]?.[ step.bi ];
	}
	const siblings = root ? null : ( parentContainer?.inner?.[ path[ path.length - 1 ]?.cj ] || [] );
	const canMove = root ? !! onMoveBlock : !! onReorder;
	const moveBy = ( delta ) => {
		if ( root ) {
			onMoveBlock?.( rootIndex, delta );
			return;
		}
		const last = path[ path.length - 1 ];
		const targetBi = last.bi + delta;
		const siblingCount = siblings?.length;
		if ( Number.isInteger( siblingCount ) && targetBi >= 0 && targetBi < siblingCount ) {
			onReorder?.( moveData, { kind: 'nested', ci: rootIndex, path: [ ...path.slice( 0, -1 ), { cj: last.cj, bi: targetBi } ] } );
		}
	};

	return (
		<SortableTreeItem id={ sortableId } moveData={ moveData } className="xsb-navigator__branch">
			{ ( dragAttributes, dragListeners ) => <>
				<div className={ `xsb-navigator__row${ selected ? ' is-selected' : '' }` } role="treeitem" aria-selected={ selected } aria-level={ root ? 1 : path.length + 1 } aria-expanded={ container ? expanded : undefined }>
					{ container ? <button type="button" className="xsb-navigator__disclosure" onClick={ () => toggle( nodeKey ) } aria-label={ expanded ? __( 'Collapse container', 'xcodesol-page-builder' ) : __( 'Expand container', 'xcodesol-page-builder' ) }>{ expanded ? <IconChevronDown width={ 13 } height={ 13 } /> : <IconChevronRight width={ 13 } height={ 13 } /> }</button> : <span className="xsb-navigator__disclosure-spacer" /> }
					<button type="button" className="xsb-navigator__drag" { ...dragAttributes } { ...dragListeners } aria-label={ __( 'Drag to move', 'xcodesol-page-builder' ) } title={ __( 'Drag to move', 'xcodesol-page-builder' ) }><IconGrip width={ 14 } height={ 14 } /></button>
					<button type="button" className="xsb-navigator__select" onClick={ () => root ? onSelect?.( rootIndex ) : onSelectNested?.( rootIndex, path[ 0 ]?.cj ?? columnIndex, path[ 0 ]?.bi ?? itemIndex, path ) }>
						<span className="xsb-navigator__item-icon">{ container ? <IconWidgetContainer width={ 14 } height={ 14 } /> : <IconLayers width={ 14 } height={ 14 } /> }</span>
						<span className="xsb-navigator__label">{ blockTitle( block ) }</span>
					</button>
					{ canMove && <span className="xsb-navigator__move-actions"><button type="button" onClick={ () => moveBy( -1 ) } aria-label={ __( 'Move up', 'xcodesol-page-builder' ) } title={ __( 'Move up', 'xcodesol-page-builder' ) }><IconArrowUp width={ 12 } height={ 12 } /></button><button type="button" onClick={ () => moveBy( 1 ) } aria-label={ __( 'Move down', 'xcodesol-page-builder' ) } title={ __( 'Move down', 'xcodesol-page-builder' ) }><IconArrowDown width={ 12 } height={ 12 } /></button></span> }
					{ container && onAddContainerInside && <button type="button" className="xsb-navigator__add" onClick={ () => onAddContainerInside( rootIndex, path ) } aria-label={ __( 'Add a nested container', 'xcodesol-page-builder' ) } title={ __( 'Add nested container', 'xcodesol-page-builder' ) }><IconPlus width={ 13 } height={ 13 } /></button> }
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
								{ ( ! showColumn || ! collapsed[ colKey ] ) && items.map( ( child, bi ) => <NavigatorItem
									key={ `${ nodeKey }-${ cj }-${ bi }` }
									{ ...props }
									block={ child }
									root={ false }
									path={ [ ...path, { cj, bi } ] }
									columnIndex={ cj }
									itemIndex={ bi }
								/> ) }
							</div>;
						} ) }
					</div>
				) }
			</> }
		</SortableTreeItem>
	);
}

export default function Navigator( { layout = [], selectedIndex, selectedNested, onSelect, onSelectNested, onAddContainerInside, onMoveBlock, onReorder, onClose } ) {
	const [ collapsed, setCollapsed ] = useState( {} );
	const toggle = ( key ) => setCollapsed( ( current ) => ( { ...current, [ key ]: ! current[ key ] } ) );
	const shared = { layout, selectedIndex, selectedNested, onSelect, onSelectNested, onAddContainerInside, onMoveBlock, onReorder, collapsed, toggle };
	return (
		<section className="xsb-navigator" aria-label={ __( 'Navigator', 'xcodesol-page-builder' ) }>
			<header className="xsb-navigator__header"><span className="xsb-navigator__heading-icon"><IconLayers width={ 15 } height={ 15 } /></span><strong>{ __( 'Navigator', 'xcodesol-page-builder' ) }</strong><button type="button" className="xsb-navigator__close" onClick={ onClose } aria-label={ __( 'Close Navigator', 'xcodesol-page-builder' ) } title={ __( 'Close', 'xcodesol-page-builder' ) }><IconClose width={ 14 } height={ 14 } /></button></header>
			<div className="xsb-navigator__tree" role="tree" aria-label={ __( 'Page structure', 'xcodesol-page-builder' ) }>
				{ ! layout.length ? <div className="xsb-navigator__empty">{ __( 'Add a container or widget to start building.', 'xcodesol-page-builder' ) }</div> : layout.map( ( block, index ) => <NavigatorItem key={ `navigator-root-${ index }` } { ...shared } block={ block } rootIndex={ index } root path={ [] } /> ) }
			</div>
		</section>
	);
}
