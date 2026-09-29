/**
 * Textarea Control for multi-line text input.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function TextareaControl( {
	config = {},
	value,
	onChange,
	device,
	state,
	isModified: isModifiedProp,
	onReset,
} ) {
	const {
		id,
		label,
		description,
		placeholder = '',
		rows = 4,
		default: defaultValue = '',
	} = config;

	const currentValue = value !== undefined && value !== null ? String( value ) : String( defaultValue );
	const isModified = isModifiedProp !== undefined ? isModifiedProp : ( currentValue !== String( defaultValue ) );

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ onReset || ( () => onChange( defaultValue ) ) }
			className="xsb-ctrl-textarea"
		>
			<textarea
				id={ id ? `xsb-ctrl-${ id }` : undefined }
				value={ currentValue }
				placeholder={ placeholder }
				rows={ rows }
				onChange={ ( e ) => onChange( e.target.value ) }
				className="xsb-textarea-input"
			/>
		</ControlBase>
	);
}
