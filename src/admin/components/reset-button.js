/** Shared, quiet reset action used by inspector controls and style panels. */
import { __ } from '@wordpress/i18n';
import { IconRotateCcw } from './icons';

export default function ResetButton( { onClick, label, className = '', title } ) {
	const accessibleLabel = label || __( 'Reset to default', 'xcodesol-page-builder' );
	return (
		<button
			type="button"
			className={ `xsb-reset-icon-button ${ className }`.trim() }
			onClick={ onClick }
			title={ title || accessibleLabel }
			aria-label={ accessibleLabel }
		>
			<IconRotateCcw width={ 11 } height={ 11 } />
		</button>
	);
}
