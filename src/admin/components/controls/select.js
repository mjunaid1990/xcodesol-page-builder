/**
 * Select Control for dropdown selection.
 *
 * @package Xcodesol_Page_Builder
 */

import ControlBase from './control-base';

export default function SelectControl( {
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
		options = [],
		default: defaultValue = '',
	} = config;

	const currentValue = value !== undefined ? value : defaultValue;
	const isModified = currentValue !== defaultValue && defaultValue !== undefined;

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-select"
		>
			<select
				id={ id ? `xsb-ctrl-${ id }` : undefined }
				value={ currentValue }
				onChange={ ( e ) => onChange( e.target.value ) }
				className="xsb-select-input"
			>
				{ options.map( ( opt ) => {
					const optVal = typeof opt === 'object' ? opt.value : opt;
					const optLabel = typeof opt === 'object' ? opt.label : opt;
					return (
						<option key={ String( optVal ) } value={ optVal }>
							{ optLabel }
						</option>
					);
				} ) }
			</select>
		</ControlBase>
	);
}
