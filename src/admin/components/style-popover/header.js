/**
 * Sticky popover header.
 *
 * Root (menu) view:   [brush] Style — {element}    [⋯] [×]
 *                            {path context}
 * Category view:      [←] {Category}               [⋯] [×]
 *                            {element context}
 *
 * The more menu is controlled by the parent (so any click on the popover
 * body can close it). Clicks inside the header/menu stop propagation so
 * they never bubble to the popover root's "interior click" handler.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';

/**
 * The "more actions" popover menu. Closes when the user clicks outside it
 * (native document listener) or picks an item.
 *
 * @param {Object} props
 * @param {Array}  props.items  [{ label, icon, onClick, disabled }].
 * @param {Function} props.onClose Close after an item is picked.
 */
export function MoreMenu( { items, onClose } ) {
	const ref = useRef( null );

	useEffect( () => {
		const onDocDown = ( e ) => {
			if ( ref.current && ! ref.current.contains( e.target ) ) {
				onClose();
			}
		};
		const onKey = ( e ) => {
			if ( 'Escape' === e.key ) {
				onClose();
			}
		};
		document.addEventListener( 'mousedown', onDocDown );
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'mousedown', onDocDown );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [ onClose ] );

	return (
		<div
			className="xsb-style-popover__more-menu"
			role="menu"
			ref={ ref }
			onClick={ ( e ) => e.stopPropagation() }
		>
			{ items.map( ( item ) => (
				<button
					key={ item.label }
					type="button"
					role="menuitem"
					className="xsb-style-popover__more-item"
					disabled={ item.disabled }
					onClick={ ( e ) => {
						e.stopPropagation();
						if ( item.onClick ) {
							item.onClick();
						}
						onClose();
					} }
				>
					<span className={ `dashicons ${ item.icon }` } aria-hidden="true" />
					<span>{ item.label }</span>
				</button>
			) ) }
		</div>
	);
}

/**
 * @param {Object}   props
 * @param {string}   props.title        Primary title (element or category).
 * @param {string}   props.context      Small context path below the title.
 * @param {boolean}  props.isCategory   Whether we are inside a category view.
 * @param {boolean}  props.moreOpen     More menu open (controlled).
 * @param {Function} props.onToggleMore Toggle the more menu.
 * @param {Function} props.onCloseMore  Close the more menu.
 * @param {Function} props.onBack       Back to the category menu.
 * @param {Function} props.onClose      Close the whole popover.
 * @param {Array}    props.moreItems    Items for the more menu.
 */
export function StylePopoverHeader( {
	title,
	context,
	isCategory,
	moreOpen,
	onToggleMore,
	onCloseMore,
	onBack,
	onClose,
	moreItems,
} ) {
	return (
		<div className="xsb-style-popover__header">
			{ isCategory && (
				<button
					type="button"
					className="xsb-style-popover__back"
					onClick={ onBack }
					aria-label={ __( 'Back to style categories', 'xcodesol-page-builder' ) }
				>
					<span className="dashicons dashicons-arrow-left-alt2" aria-hidden="true" />
				</button>
			) }
			<div className="xsb-style-popover__title-group">
				{ ! isCategory && (
					<span className="dashicons dashicons-admin-customizer xsb-style-popover__brush" aria-hidden="true" />
				) }
				<div>
					<strong className="xsb-style-popover__title" id="xsb-style-popover-title">
						{ isCategory
							? sprintf( __( 'Style %s', 'xcodesol-page-builder' ), title )
							: sprintf( __( 'Style — %s', 'xcodesol-page-builder' ), title ) }
					</strong>
					{ context && (
						<span className="xsb-style-popover__context" title={ context }>
							{ context }
						</span>
					) }
				</div>
			</div>
			<div className="xsb-style-popover__header-actions">
				<button
					type="button"
					className="xsb-style-popover__more"
					aria-label={ __( 'More style actions', 'xcodesol-page-builder' ) }
					aria-haspopup="menu"
					aria-expanded={ moreOpen }
					onClick={ ( e ) => {
						e.stopPropagation();
						onToggleMore();
					} }
				>
					<span className="dashicons dashicons-ellipsis" aria-hidden="true" />
				</button>
				<button
					type="button"
					className="xsb-style-popover__close"
					onClick={ ( e ) => {
						e.stopPropagation();
						onClose();
					} }
					aria-label={ __( 'Close style panel', 'xcodesol-page-builder' ) }
				>
					<span className="dashicons dashicons-no-alt" aria-hidden="true" />
				</button>
			</div>
			{ moreOpen && (
				<MoreMenu items={ moreItems } onClose={ onCloseMore } />
			) }
		</div>
	);
}