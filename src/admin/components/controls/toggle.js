/**
 * Toggle Control for boolean flags.
 *
 * @package Xcodesol_Page_Builder
 */

import ControlBase from './control-base';

export default function ToggleControl( {
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
		default: defaultValue = false,
	} = config;

	const isChecked = value !== undefined ? Boolean( value ) : Boolean( defaultValue );
	const isModified = isChecked !== Boolean( defaultValue );

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-toggle"
		>
			<label className="xsb-toggle-switch">
				<input
					type="checkbox"
					id={ id ? `xsb-ctrl-${ id }` : undefined }
					checked={ isChecked }
					onChange={ ( e ) => onChange( e.target.checked ) }
					className="xsb-toggle-checkbox"
				/>
				<span className="xsb-toggle-slider" aria-hidden="true" />
			</label>
		</ControlBase>
	);
}
