/**
 * Keyboard Shortcuts Modal Dialog.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import { IconClose } from './icons';

export default function ShortcutsModal( { isOpen, onClose } ) {
	if ( ! isOpen ) {
		return null;
	}

	const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;
	const cmdKey = isMac ? '⌘' : 'Ctrl';

	const shortcutGroups = [
		{
			title: __( 'General & Actions', 'xcodesol-page-builder' ),
			items: [
				{ keys: [ cmdKey, 'S' ], label: __( 'Save page or template', 'xcodesol-page-builder' ) },
				{ keys: [ cmdKey, 'Z' ], label: __( 'Undo last change', 'xcodesol-page-builder' ) },
				{ keys: [ cmdKey, isMac ? '⇧ Z' : 'Y' ], label: __( 'Redo change', 'xcodesol-page-builder' ) },
				{ keys: [ cmdKey, 'K' ], label: __( 'Open Command Palette', 'xcodesol-page-builder' ) },
				{ keys: [ '/' ], label: __( 'Focus element search', 'xcodesol-page-builder' ) },
				{ keys: [ '?' ], label: __( 'Open keyboard shortcuts', 'xcodesol-page-builder' ) },
			],
		},
		{
			title: __( 'Block Selection & Canvas', 'xcodesol-page-builder' ),
			items: [
				{ keys: [ cmdKey, 'D' ], label: __( 'Duplicate selected block', 'xcodesol-page-builder' ) },
				{ keys: [ 'Delete' ], label: __( 'Delete selected block', 'xcodesol-page-builder' ) },
				{ keys: [ 'Esc' ], label: __( 'Deselect block / Close panel', 'xcodesol-page-builder' ) },
				{ keys: [ '1' ], label: __( 'Switch to Desktop preview', 'xcodesol-page-builder' ) },
				{ keys: [ '2' ], label: __( 'Switch to Tablet preview', 'xcodesol-page-builder' ) },
				{ keys: [ '3' ], label: __( 'Switch to Mobile preview', 'xcodesol-page-builder' ) },
			],
		},
	];

	return (
		<div className="xsb-modal-backdrop" onClick={ onClose } role="dialog" aria-modal="true" aria-labelledby="xsb-shortcuts-title">
			<div className="xsb-modal-dialog xsb-modal-dialog--shortcuts" onClick={ ( e ) => e.stopPropagation() }>
				<div className="xsb-modal-header">
					<h3 id="xsb-shortcuts-title" className="xsb-modal-title">
						{ __( 'Keyboard Shortcuts', 'xcodesol-page-builder' ) }
					</h3>
					<button type="button" className="xsb-modal-close" onClick={ onClose } aria-label={ __( 'Close', 'xcodesol-page-builder' ) }>
						<IconClose width={ 18 } height={ 18 } />
					</button>
				</div>
				<div className="xsb-modal-body">
					{ shortcutGroups.map( ( group, gIdx ) => (
						<div key={ gIdx } className="xsb-shortcut-group">
							<h4 className="xsb-shortcut-group-title">{ group.title }</h4>
							<div className="xsb-shortcut-list">
								{ group.items.map( ( item, iIdx ) => (
									<div key={ iIdx } className="xsb-shortcut-row">
										<span className="xsb-shortcut-label">{ item.label }</span>
										<div className="xsb-shortcut-keys">
											{ item.keys.map( ( key, kIdx ) => (
												<kbd key={ kIdx } className="xsb-kbd">{ key }</kbd>
											) ) }
										</div>
									</div>
								) ) }
							</div>
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
}
