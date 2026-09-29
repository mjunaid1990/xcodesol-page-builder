/**
 * Comprehensive Flexbox Layout Options Control.
 * Direction, wrap, reverse, justify, align-items, align-content, equal height.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export default function FlexOptionsControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id = 'flex_options',
		label = __( 'Flexbox Options', 'xcodesol-page-builder' ),
	} = config;

	const flex = typeof value === 'object' && value !== null ? value : {};

	const direction = flex.direction || 'row';
	const wrap = flex.wrap !== undefined ? flex.wrap : 'wrap';
	const justify = flex.justify || 'flex-start';
	const align = flex.align || 'stretch';
	const reverse = Boolean( flex.reverse );
	const equalHeight = Boolean( flex.equal_height );

	const update = ( key, val ) => {
		onChange( {
			...flex,
			[ key ]: val,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-flex-options"
		>
			<div className="xsb-flex-options-group">
				{/* Direction & Reverse */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Direction', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-segmented-control xsb-segmented-control--compact">
						<button
							type="button"
							className={ `xsb-segmented-btn${ direction === 'row' ? ' is-active' : '' }` }
							onClick={ () => update( 'direction', 'row' ) }
						>
							{ __( 'Row (Horizontal)', 'xcodesol-page-builder' ) }
						</button>
						<button
							type="button"
							className={ `xsb-segmented-btn${ direction === 'column' ? ' is-active' : '' }` }
							onClick={ () => update( 'direction', 'column' ) }
						>
							{ __( 'Column (Vertical)', 'xcodesol-page-builder' ) }
						</button>
					</div>
				</div>

				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Reverse Order', 'xcodesol-page-builder' ) }</label>
					<label className="xsb-toggle-switch">
						<input
							type="checkbox"
							checked={ reverse }
							onChange={ ( e ) => update( 'reverse', e.target.checked ) }
							className="xsb-toggle-checkbox"
						/>
						<span className="xsb-toggle-slider" aria-hidden="true" />
					</label>
				</div>

				{/* Justify Content */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Justify Content', 'xcodesol-page-builder' ) }</label>
					<select
						value={ justify }
						onChange={ ( e ) => update( 'justify', e.target.value ) }
						className="xsb-select-input"
					>
						<option value="flex-start">{ __( 'Start', 'xcodesol-page-builder' ) }</option>
						<option value="center">{ __( 'Center', 'xcodesol-page-builder' ) }</option>
						<option value="flex-end">{ __( 'End', 'xcodesol-page-builder' ) }</option>
						<option value="space-between">{ __( 'Space Between', 'xcodesol-page-builder' ) }</option>
						<option value="space-around">{ __( 'Space Around', 'xcodesol-page-builder' ) }</option>
						<option value="space-evenly">{ __( 'Space Evenly', 'xcodesol-page-builder' ) }</option>
					</select>
				</div>

				{/* Align Items */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Align Items', 'xcodesol-page-builder' ) }</label>
					<select
						value={ align }
						onChange={ ( e ) => update( 'align', e.target.value ) }
						className="xsb-select-input"
					>
						<option value="stretch">{ __( 'Stretch', 'xcodesol-page-builder' ) }</option>
						<option value="flex-start">{ __( 'Start', 'xcodesol-page-builder' ) }</option>
						<option value="center">{ __( 'Center', 'xcodesol-page-builder' ) }</option>
						<option value="flex-end">{ __( 'End', 'xcodesol-page-builder' ) }</option>
						<option value="baseline">{ __( 'Baseline', 'xcodesol-page-builder' ) }</option>
					</select>
				</div>

				{/* Wrap & Equal Height */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Wrap Items', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-segmented-control xsb-segmented-control--compact">
						<button
							type="button"
							className={ `xsb-segmented-btn${ wrap === 'nowrap' ? ' is-active' : '' }` }
							onClick={ () => update( 'wrap', 'nowrap' ) }
						>
							{ __( 'No Wrap', 'xcodesol-page-builder' ) }
						</button>
						<button
							type="button"
							className={ `xsb-segmented-btn${ wrap === 'wrap' ? ' is-active' : '' }` }
							onClick={ () => update( 'wrap', 'wrap' ) }
						>
							{ __( 'Wrap', 'xcodesol-page-builder' ) }
						</button>
					</div>
				</div>

				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Equal Height Children', 'xcodesol-page-builder' ) }</label>
					<label className="xsb-toggle-switch">
						<input
							type="checkbox"
							checked={ equalHeight }
							onChange={ ( e ) => update( 'equal_height', e.target.checked ) }
							className="xsb-toggle-checkbox"
						/>
						<span className="xsb-toggle-slider" aria-hidden="true" />
					</label>
				</div>
			</div>
		</ControlBase>
	);
}
