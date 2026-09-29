/**
 * Command Palette modal for quick actions and block insertion (Ctrl+K).
 *
 * @package Xcodesol_Page_Builder
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconSearch, IconClose, IconPlus, IconSettings, IconSun, IconMoon, IconDesktop, IconTablet, IconMobile, IconUndo, IconRedo, IconSave } from './icons';

export default function CommandPalette( {
	isOpen,
	onClose,
	availableBlocks = [],
	onSelectBlock,
	onSave,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	onToggleTheme,
	isDark,
	onSetDevice,
	onOpenSettings,
} ) {
	const [ query, setQuery ] = useState( '' );
	const [ activeIndex, setActiveIndex ] = useState( 0 );
	const inputRef = useRef( null );

	useEffect( () => {
		if ( isOpen ) {
			setQuery( '' );
			setActiveIndex( 0 );
			setTimeout( () => inputRef.current?.focus(), 50 );
		}
	}, [ isOpen ] );

	if ( ! isOpen ) {
		return null;
	}

	const normalizedQuery = query.trim().toLowerCase();

	const commands = [
		{
			id: 'cmd-save',
			type: 'action',
			label: __( 'Save Page / Template', 'xcodesol-page-builder' ),
			shortcut: '⌘S',
			icon: <IconSave width={ 16 } height={ 16 } />,
			action: () => {
				onSave();
				onClose();
			},
		},
		{
			id: 'cmd-undo',
			type: 'action',
			label: __( 'Undo Change', 'xcodesol-page-builder' ),
			shortcut: '⌘Z',
			disabled: ! canUndo,
			icon: <IconUndo width={ 16 } height={ 16 } />,
			action: () => {
				if ( canUndo ) {
					onUndo();
					onClose();
				}
			},
		},
		{
			id: 'cmd-redo',
			type: 'action',
			label: __( 'Redo Change', 'xcodesol-page-builder' ),
			shortcut: '⌘Y',
			disabled: ! canRedo,
			icon: <IconRedo width={ 16 } height={ 16 } />,
			action: () => {
				if ( canRedo ) {
					onRedo();
					onClose();
				}
			},
		},
		{
			id: 'cmd-theme',
			type: 'action',
			label: isDark ? __( 'Switch to Light Theme', 'xcodesol-page-builder' ) : __( 'Switch to Dark Theme', 'xcodesol-page-builder' ),
			icon: isDark ? <IconSun width={ 16 } height={ 16 } /> : <IconMoon width={ 16 } height={ 16 } />,
			action: () => {
				onToggleTheme();
				onClose();
			},
		},
		{
			id: 'cmd-device-desktop',
			type: 'action',
			label: __( 'Switch to Desktop View', 'xcodesol-page-builder' ),
			shortcut: '1',
			icon: <IconDesktop width={ 16 } height={ 16 } />,
			action: () => {
				onSetDevice( 'desktop' );
				onClose();
			},
		},
		{
			id: 'cmd-device-tablet',
			type: 'action',
			label: __( 'Switch to Tablet View (768px)', 'xcodesol-page-builder' ),
			shortcut: '2',
			icon: <IconTablet width={ 16 } height={ 16 } />,
			action: () => {
				onSetDevice( 'tablet' );
				onClose();
			},
		},
		{
			id: 'cmd-device-mobile',
			type: 'action',
			label: __( 'Switch to Mobile View (375px)', 'xcodesol-page-builder' ),
			shortcut: '3',
			icon: <IconMobile width={ 16 } height={ 16 } />,
			action: () => {
				onSetDevice( 'mobile' );
				onClose();
			},
		},
		{
			id: 'cmd-settings',
			type: 'action',
			label: __( 'Open Template Rules & Settings', 'xcodesol-page-builder' ),
			icon: <IconSettings width={ 16 } height={ 16 } />,
			action: () => {
				onOpenSettings();
				onClose();
			},
		},
	];

	// Map blocks into command options
	const blockCommands = availableBlocks.map( ( block ) => ( {
		id: `block-${ block.type }`,
		type: 'block',
		label: sprintf( __( 'Insert: %s', 'xcodesol-page-builder' ), block.label ),
		description: block.description || '',
		icon: <IconPlus width={ 16 } height={ 16 } />,
		action: () => {
			onSelectBlock( block );
			onClose();
		},
	} ) );

	const allItems = [ ...commands, ...blockCommands ];
	const filteredItems = normalizedQuery
		? allItems.filter( ( item ) =>
			item.label.toLowerCase().includes( normalizedQuery ) ||
			( item.description && item.description.toLowerCase().includes( normalizedQuery ) )
		)
		: allItems;

	function handleKeyDown( e ) {
		if ( e.key === 'ArrowDown' ) {
			e.preventDefault();
			setActiveIndex( ( prev ) => ( prev + 1 ) % Math.max( 1, filteredItems.length ) );
		} else if ( e.key === 'ArrowUp' ) {
			e.preventDefault();
			setActiveIndex( ( prev ) => ( prev - 1 + filteredItems.length ) % Math.max( 1, filteredItems.length ) );
		} else if ( e.key === 'Enter' ) {
			e.preventDefault();
			const selected = filteredItems[ activeIndex ];
			if ( selected && ! selected.disabled ) {
				selected.action();
			}
		} else if ( e.key === 'Escape' ) {
			onClose();
		}
	}

	return (
		<div className="xsb-modal-backdrop" onClick={ onClose } role="dialog" aria-modal="true">
			<div className="xsb-modal-dialog xsb-modal-dialog--palette" onClick={ ( e ) => e.stopPropagation() }>
				<div className="xsb-palette-input-wrap">
					<span className="xsb-palette-input-icon">
						<IconSearch width={ 18 } height={ 18 } />
					</span>
					<input
						ref={ inputRef }
						type="text"
						className="xsb-palette-input"
						placeholder={ __( 'Type a command or search widgets…', 'xcodesol-page-builder' ) }
						value={ query }
						onChange={ ( e ) => {
							setQuery( e.target.value );
							setActiveIndex( 0 );
						} }
						onKeyDown={ handleKeyDown }
					/>
					<button type="button" className="xsb-modal-close" onClick={ onClose }>
						<IconClose width={ 16 } height={ 16 } />
					</button>
				</div>
				<div className="xsb-palette-results">
					{ filteredItems.length === 0 ? (
						<div className="xsb-palette-empty">
							{ __( 'No commands or elements match your search.', 'xcodesol-page-builder' ) }
						</div>
					) : (
						filteredItems.map( ( item, idx ) => (
							<div
								key={ item.id }
								className={ `xsb-palette-row${ idx === activeIndex ? ' is-active' : '' }${ item.disabled ? ' is-disabled' : '' }` }
								onClick={ () => {
									if ( ! item.disabled ) {
										item.action();
									}
								} }
								onMouseEnter={ () => setActiveIndex( idx ) }
							>
								<span className="xsb-palette-row-icon">{ item.icon }</span>
								<div className="xsb-palette-row-main">
									<span className="xsb-palette-row-label">{ item.label }</span>
									{ item.description && (
										<span className="xsb-palette-row-desc">{ item.description }</span>
									) }
								</div>
								{ item.shortcut && (
									<kbd className="xsb-kbd xsb-palette-row-shortcut">{ item.shortcut }</kbd>
								) }
							</div>
						) )
					) }
				</div>
			</div>
		</div>
	);
}
