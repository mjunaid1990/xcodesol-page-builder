/**
 * CSS Grid Template Control.
 * Visual editor for column and row tracks (fr, px, %, minmax, auto) + presets.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export const GRID_PRESETS = [
	{ label: 'Auto-fit (240px)', value: 'repeat(auto-fit, minmax(240px, 1fr))' },
	{ label: '12-Column', value: 'repeat(12, 1fr)' },
	{ label: 'Sidebar Left', value: '280px 1fr' },
	{ label: 'Sidebar Right', value: '1fr 280px' },
	{ label: 'Holy Grail', value: '200px 1fr 200px' },
	{ label: '3 Equal Cols', value: 'repeat(3, 1fr)' },
];

export default function GridTemplateControl( {
	config = {},
	value = {},
	onChange,
	device,
	state,
} ) {
	const {
		id = 'grid_template',
		label = __( 'Grid Template & Tracks', 'xcodesol-page-builder' ),
	} = config;

	const columns = value?.columns || 'repeat(3, 1fr)';
	const rows = value?.rows || 'auto';
	const autoFlow = value?.auto_flow || 'row';
	const autoRows = value?.auto_rows || 'auto';

	const update = ( key, val ) => {
		onChange( {
			...value,
			[ key ]: val,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-grid-template"
		>
			<div className="xsb-grid-template-builder">
				{/* Presets */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Grid Presets', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-preset-chips">
						{ GRID_PRESETS.map( ( p ) => (
							<button
								key={ p.value }
								type="button"
								className={ `xsb-chip-btn${ columns === p.value ? ' is-active' : '' }` }
								onClick={ () => update( 'columns', p.value ) }
								title={ p.value }
							>
								{ p.label }
							</button>
						) ) }
					</div>
				</div>

				{/* Columns Track */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Columns Track', 'xcodesol-page-builder' ) }</label>
					<input
						type="text"
						value={ columns }
						onChange={ ( e ) => update( 'columns', e.target.value ) }
						className="xsb-text-input"
						placeholder="e.g. repeat(3, 1fr) or 1fr 2fr 1fr"
					/>
				</div>

				{/* Rows Track */}
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Rows Track', 'xcodesol-page-builder' ) }</label>
					<input
						type="text"
						value={ rows }
						onChange={ ( e ) => update( 'rows', e.target.value ) }
						className="xsb-text-input"
						placeholder="e.g. auto or minmax(100px, auto)"
					/>
				</div>

				{/* Auto Flow & Auto Rows */}
				<div className="xsb-grid-flow-row">
					<div className="xsb-sub-col">
						<label className="xsb-sub-label">{ __( 'Auto Flow', 'xcodesol-page-builder' ) }</label>
						<select
							value={ autoFlow }
							onChange={ ( e ) => update( 'auto_flow', e.target.value ) }
							className="xsb-select-input"
						>
							<option value="row">Row</option>
							<option value="column">Column</option>
							<option value="dense">Dense</option>
							<option value="row dense">Row Dense</option>
							<option value="column dense">Column Dense</option>
						</select>
					</div>

					<div className="xsb-sub-col">
						<label className="xsb-sub-label">{ __( 'Auto Rows', 'xcodesol-page-builder' ) }</label>
						<input
							type="text"
							value={ autoRows }
							onChange={ ( e ) => update( 'auto_rows', e.target.value ) }
							className="xsb-text-input"
							placeholder="auto or minmax()"
						/>
					</div>
				</div>
			</div>
		</ControlBase>
	);
}
