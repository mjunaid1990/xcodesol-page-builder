/**
 * Sticky popover footer.
 *
 * Menu view:     [Reset all]  [Copy] [Paste]              [Done]
 * Category view: [Reset {Category}]                       [Done]
 *
 * There is intentionally no Save button — every change applies live.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {string}   props.view            'menu' | 'category'.
 * @param {string}   props.categoryLabel   Category label (category view).
 * @param {string}   props.categoryCount   Changed count for that category.
 * @param {boolean}  props.hasChanges      Any custom value on the element.
 * @param {boolean}  props.canPaste        Clipboard available + compatible.
 * @param {boolean}  props.confirming      Reset-all confirmation open.
 * @param {Function} props.onAskConfirm    Open the reset-all confirmation.
 * @param {Function} props.onCancelConfirm Close the confirmation.
 * @param {Function} props.onCopy          Copy element styles.
 * @param {Function} props.onPaste         Paste element styles.
 * @param {Function} props.onResetCategory Reset the open category only.
 * @param {Function} props.onResetAll      Reset the whole element.
 * @param {Function} props.onDone          Close the popover.
 */
export function StylePopoverFooter( {
	view,
	categoryLabel,
	categoryCount,
	hasChanges,
	canPaste,
	confirming,
	onAskConfirm,
	onCancelConfirm,
	onCopy,
	onPaste,
	onResetCategory,
	onResetAll,
	onDone,
} ) {
	if ( confirming ) {
		return (
			<div className="xsb-style-popover__footer xsb-style-popover__footer--confirm" role="alertdialog" aria-label={ __( 'Reset all styles', 'xcodesol-page-builder' ) }>
				<p className="xsb-style-popover__confirm-text">
					<strong>{ __( 'Reset all styles for this element?', 'xcodesol-page-builder' ) }</strong>
					<span>{ __( 'This removes every custom value — typography, colors, spacing, border, shadow, effects and layout.', 'xcodesol-page-builder' ) }</span>
				</p>
				<div className="xsb-style-popover__footer-btns">
					<button type="button" className="xsb-btn xsb-btn--ghost" onClick={ onCancelConfirm }>
						{ __( 'Cancel', 'xcodesol-page-builder' ) }
					</button>
					<button type="button" className="xsb-btn xsb-btn--danger" onClick={ onResetAll }>
						{ __( 'Reset all styles', 'xcodesol-page-builder' ) }
					</button>
				</div>
			</div>
		);
	}

	const isMenu = view !== 'category';

	return (
		<div className="xsb-style-popover__footer">
			{ isMenu ? (
				<>
					<div className="xsb-style-popover__footer-group">
						<button
							type="button"
							className="xsb-btn xsb-btn--ghost xsb-btn--icon"
							disabled={ ! hasChanges }
							title={ __( 'Reset all styles for this element', 'xcodesol-page-builder' ) }
							onClick={ onAskConfirm }
						>
							<span className="dashicons dashicons-undo" aria-hidden="true" />
							{ __( 'Reset all', 'xcodesol-page-builder' ) }
						</button>
						<button
							type="button"
							className="xsb-btn xsb-btn--ghost xsb-btn--icon"
							disabled={ ! hasChanges }
							title={ __( 'Copy styles', 'xcodesol-page-builder' ) }
							onClick={ onCopy }
						>
							<span className="dashicons dashicons-admin-page" aria-hidden="true" />
							{ __( 'Copy', 'xcodesol-page-builder' ) }
						</button>
						<button
							type="button"
							className="xsb-btn xsb-btn--ghost xsb-btn--icon"
							disabled={ ! canPaste }
							title={ __( 'Paste styles', 'xcodesol-page-builder' ) }
							onClick={ onPaste }
						>
							<span className="dashicons dashicons-clipboard" aria-hidden="true" />
							{ __( 'Paste', 'xcodesol-page-builder' ) }
						</button>
					</div>
					<button type="button" className="xsb-btn xsb-btn--primary" onClick={ onDone }>
						{ __( 'Done', 'xcodesol-page-builder' ) }
					</button>
				</>
			) : (
				<>
					<div className="xsb-style-popover__footer-group">
						<button
							type="button"
							className="xsb-btn xsb-btn--ghost xsb-btn--icon"
							disabled={ ! ( categoryCount > 0 ) }
							title={ sprintf( __( 'Reset %s to defaults', 'xcodesol-page-builder' ), categoryLabel ) }
							onClick={ onResetCategory }
						>
							<span className="dashicons dashicons-undo" aria-hidden="true" />
							{ sprintf( __( 'Reset %s', 'xcodesol-page-builder' ), categoryLabel ) }
						</button>
						{ categoryCount > 0 && (
							<span className="xsb-style-popover__changed-total">
								{ sprintf( __( '%d changed', 'xcodesol-page-builder' ), categoryCount ) }
							</span>
						) }
					</div>
					<button type="button" className="xsb-btn xsb-btn--primary" onClick={ onDone }>
						{ __( 'Done', 'xcodesol-page-builder' ) }
					</button>
				</>
			) }
		</div>
	);
}