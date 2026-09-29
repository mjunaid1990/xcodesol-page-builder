/**
 * Custom Code & CSS Editor Control.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function CodeControl( {
	config = {},
	value = '',
	onChange,
	device,
	state,
} ) {
	const {
		id = 'custom_css',
		label = __( 'Custom CSS', 'xcodesol-page-builder' ),
		description = __( 'Use selector to target the current element container.', 'xcodesol-page-builder' ),
		rows = 5,
	} = config;

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			className="xsb-ctrl-code"
		>
			<div className="xsb-code-editor-wrap">
				<textarea
					rows={ rows }
					value={ value || '' }
					onChange={ ( e ) => onChange( e.target.value ) }
					className="xsb-code-textarea"
					placeholder="selector {&#10;  /* Custom CSS */&#10;}"
					spellCheck="false"
				/>
			</div>
		</ControlBase>
	);
}
