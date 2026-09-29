/**
 * Preset Chips Control for quick value selection.
 *
 * @package Xcodesol_Page_Builder
 */

import ControlBase from './control-base';

export default function PresetChips( {
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
		presets = [],
		default: defaultValue,
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
			className="xsb-ctrl-preset-chips"
		>
			<div className="xsb-preset-chips" role="group" aria-label={ label || id }>
				{ presets.map( ( p ) => {
					const pVal = typeof p === 'object' ? p.value : p;
					const pLabel = typeof p === 'object' ? p.label : p;
					const isSelected = String( currentValue ) === String( pVal );

					return (
						<button
							key={ String( pVal ) }
							type="button"
							className={ `xsb-chip-btn${ isSelected ? ' is-active' : '' }` }
							onClick={ () => onChange( pVal ) }
							title={ String( pLabel ) }
						>
							{ pLabel }
						</button>
					);
				} ) }
			</div>
		</ControlBase>
	);
}
