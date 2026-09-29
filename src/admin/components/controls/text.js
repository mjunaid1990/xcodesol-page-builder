/**
 * Text / URL / Textarea Control.
 * Handles: type='text', type='textarea', type='url', type='email', type='video' (URL input)
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function TextControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label,
		description,
		placeholder = '',
		multiline = false,
		rows = 4,
		inputType = 'text',
		default: defaultValue = '',
	} = config;

	const currentValue = value !== undefined && value !== null ? String( value ) : String( defaultValue );
	const isModified = currentValue !== String( defaultValue );

	const inputProps = {
		id: id ? `xsb-ctrl-${ id }` : undefined,
		value: currentValue,
		placeholder,
		onChange: ( e ) => onChange( e.target.value ),
		className: 'xsb-text-input',
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-text"
		>
			{ multiline ? (
				<textarea
					{ ...inputProps }
					rows={ rows }
					className="xsb-textarea-input"
				/>
			) : (
				<input
					type={ inputType }
					{ ...inputProps }
				/>
			) }
		</ControlBase>
	);
}
