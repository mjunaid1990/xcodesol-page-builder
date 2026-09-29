/**
 * Base wrapper for all controls in Xcodesol Page Builder.
 * Standardizes label display, responsive indicator, state (normal/hover),
 * reset action, and accessibility attributes.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import { IconDesktop, IconTablet, IconMobile } from '../icons';

export default function ControlBase( {
	id,
	label,
	description,
	help,
	device,
	state,
	isModified,
	onReset,
	className = '',
	children,
} ) {
	const controlId = id ? `xsb-ctrl-${ id }` : undefined;

	return (
		<div
			className={ `xsb-control-field ${ className }${ isModified ? ' is-modified' : '' }` }
			id={ controlId ? `${ controlId }-wrap` : undefined }
		>
			{ ( label || onReset || device || state ) && (
				<div className="xsb-control-field__header">
					<div className="xsb-control-field__label-wrap">
						{ label && (
							<label
								htmlFor={ controlId }
								className="xsb-control-field__label"
							>
								{ label }
							</label>
						) }
						{ state && state !== 'normal' && (
							<span className="xsb-control-field__state-badge" title={ `${ state } state` }>
								{ state }
							</span>
						) }
						{ device && (
							<span className="xsb-control-field__device-badge" title={ `Applied to ${ device }` }>
								{ device === 'mobile' ? (
									<IconMobile width={ 11 } height={ 11 } />
								) : device === 'tablet' ? (
									<IconTablet width={ 11 } height={ 11 } />
								) : (
									<IconDesktop width={ 11 } height={ 11 } />
								) }
							</span>
						) }
					</div>
					{ onReset && isModified && (
						<button
							type="button"
							className="xsb-control-field__reset-btn"
							onClick={ ( e ) => {
								e.stopPropagation();
								onReset();
							} }
							title={ __( 'Reset to default', 'xcodesol-page-builder' ) }
							aria-label={ __( 'Reset to default', 'xcodesol-page-builder' ) }
						>
							<span className="dashicons dashicons-undo" aria-hidden="true" />
						</button>
					) }
				</div>
			) }
			<div className="xsb-control-field__body">
				{ children }
			</div>
			{ ( description || help ) && (
				<p className="xsb-control-field__help">
					{ description || help }
				</p>
			) }
		</div>
	);
}
