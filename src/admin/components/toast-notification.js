/**
 * Modern floating toast notifications for user actions.
 *
 * @package Xcodesol_Page_Builder
 */

import { IconCheck, IconInfo, IconClose } from './icons';

export default function ToastNotification( { toasts = [], onDismiss } ) {
	if ( ! toasts || toasts.length === 0 ) {
		return null;
	}

	return (
		<div className="xsb-toast-container" role="region" aria-live="polite">
			{ toasts.map( ( toast ) => (
				<div key={ toast.id } className={ `xsb-toast xsb-toast--${ toast.type || 'info' }` }>
					<span className="xsb-toast-icon">
						{ toast.type === 'success' ? (
							<IconCheck width={ 16 } height={ 16 } />
						) : (
							<IconInfo width={ 16 } height={ 16 } />
						) }
					</span>
					<span className="xsb-toast-message">{ toast.message }</span>
					<button
						type="button"
						className="xsb-toast-dismiss"
						onClick={ () => onDismiss( toast.id ) }
						aria-label="Dismiss"
					>
						<IconClose width={ 14 } height={ 14 } />
					</button>
				</div>
			) ) }
		</div>
	);
}
