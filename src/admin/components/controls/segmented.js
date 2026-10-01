/**
 * Segmented Control for mutually exclusive options in a pill group.
 *
 * @package Xcodesol_Page_Builder
 */

import ControlBase from './control-base';

export default function SegmentedControl( {
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
		default: defaultValue,
		columns,
		size = 'normal',
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
			className="xsb-ctrl-segmented"
		>
			<div
				className={ `xsb-segmented-control${ size ? ` xsb-segmented-control--${ size }` : '' }${ id === 'bg_type' ? ' xsb-segmented-control--background-type' : '' }` }
				role="radiogroup"
				aria-label={ label || id }
				style={ columns ? { gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))` } : undefined }
			>
				{ options.map( ( opt ) => {
					const optVal = typeof opt === 'object' ? opt.value : opt;
					const optLabel = typeof opt === 'object' ? opt.label : opt;
					const optTitle = typeof opt === 'object' ? opt.title || opt.label : opt;
					const isSelected = currentValue === optVal;

					return (
						<button
							key={ String( optVal ) }
							type="button"
							role="radio"
							aria-checked={ isSelected }
							className={ `xsb-segmented-btn${ isSelected ? ' is-active' : '' }` }
							onClick={ () => onChange( optVal ) }
							title={ optTitle }
						>
							{ opt.icon && typeof opt.icon === 'string' && opt.icon.startsWith( 'dashicons-' ) ? (
								<span className={ `dashicons ${ opt.icon }` } aria-hidden="true" />
							) : null }
							<span>{ optLabel }</span>
						</button>
					);
				} ) }
			</div>
		</ControlBase>
	);
}
