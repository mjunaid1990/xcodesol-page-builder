/**
 * Border & Corner Radius Control.
 * Supports border style, width, color, and per-corner radius.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';
import SpacingBoxControl from './spacing-box';

const BORDER_STYLES = [
	{ label: 'None', value: 'none' },
	{ label: 'Solid', value: 'solid' },
	{ label: 'Dashed', value: 'dashed' },
	{ label: 'Dotted', value: 'dotted' },
	{ label: 'Double', value: 'double' },
];

export default function BorderControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label = __( 'Border & Corners', 'xcodesol-page-builder' ),
		description,
	} = config;

	const currentStyle = value?.style || 'none';
	const currentColor = value?.color || '#000000';
	const update = ( key, val ) => {
		onChange( {
			...value,
			[ key ]: val,
		} );
	};

	const asBox = ( source, fallback ) => typeof source === 'object' && source !== null ? source : { top: source ?? fallback, right: source ?? fallback, bottom: source ?? fallback, left: source ?? fallback, unit: 'px', isLinked: true };

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			className="xsb-ctrl-border"
		>
			<div className="xsb-border-control-group">
				{/* Style */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Border Type', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-segmented-control xsb-segmented-control--compact">
						{ BORDER_STYLES.map( ( s ) => (
							<button
								key={ s.value }
								type="button"
								className={ `xsb-segmented-btn${ currentStyle === s.value ? ' is-active' : '' }` }
								onClick={ () => update( 'style', s.value ) }
							>
								{ s.label }
							</button>
						) ) }
					</div>
				</div>

				{ currentStyle !== 'none' && (
					<>
						{/* Width */}
						<SpacingBoxControl config={ { id: `${ id }-border-width`, label: __( 'Width', 'xcodesol-page-builder' ), units: [ 'px' ], default: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px', isLinked: true } } } value={ asBox( value?.width, 1 ) } onChange={ ( next ) => update( 'width', next ) } />

						{/* Color */}
						<div className="xsb-control-sub-row">
							<label className="xsb-sub-label">{ __( 'Color', 'xcodesol-page-builder' ) }</label>
							<div className="xsb-color-input-row">
								<input
									type="color"
									value={ currentColor }
									onChange={ ( e ) => update( 'color', e.target.value ) }
									className="xsb-native-color-picker"
								/>
								<input
									type="text"
									value={ currentColor }
									onChange={ ( e ) => update( 'color', e.target.value ) }
									className="xsb-color-hex-input"
								/>
							</div>
						</div>
					</>
				) }

				{/* Border Radius */}
				<SpacingBoxControl config={ { id: `${ id }-border-radius`, label: __( 'Border Radius', 'xcodesol-page-builder' ), units: [ 'px' ], default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } } value={ asBox( value?.radius, 0 ) } onChange={ ( next ) => update( 'radius', next ) } />
			</div>
		</ControlBase>
	);
}
