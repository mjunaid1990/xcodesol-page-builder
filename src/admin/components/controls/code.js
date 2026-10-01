/**
 * Custom Code & CSS Editor Control.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';
import CssEditor from './css-editor';

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
			<CssEditor value={ value } onChange={ onChange } rows={ rows } />
		</ControlBase>
	);
}
