/**
 * CSS Grid Template Control.
 * Visual editor for column and row tracks (fr, px, %, minmax, auto) + presets.
 *
 * @package Xcodesol_Page_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import ControlBase from './control-base';

export const GRID_PRESETS = [
	{ label: 'Auto-fit', value: 'repeat(auto-fit, minmax(240px, 1fr))', preview: 'auto' },
	{ label: '12 columns', value: 'repeat(12, 1fr)', preview: 'twelve' },
	{ label: 'Sidebar left', value: '280px 1fr', preview: 'left' },
	{ label: 'Sidebar right', value: '1fr 280px', preview: 'right' },
	{ label: 'Main with rails', value: '200px 1fr 200px', preview: 'rails' },
	{ label: '3 equal columns', value: 'repeat(3, 1fr)', preview: 'three' },
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

	const columns = typeof value === 'string' ? value : ( value?.columns || 'repeat(3, 1fr)' );
	const rows = value?.rows || 'auto';
	const autoFlow = value?.auto_flow || 'row';
	const autoRows = value?.auto_rows || 'auto';

	const update = ( key, val ) => {
		onChange( {
			...( typeof value === 'object' && value !== null ? value : {} ),
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
				<div className="xsb-grid-presets-field">
					<label className="xsb-sub-label">{ __( 'Start with a layout', 'xcodesol-page-builder' ) }</label>
					<div className="xsb-grid-presets">
						{ GRID_PRESETS.map( ( p ) => (
							<button
								key={ p.value }
								type="button"
								className={ `xsb-grid-preset${ columns === p.value ? ' is-active' : '' }` }
								onClick={ () => update( 'columns', p.value ) }
								aria-label={ sprintf( __( 'Use %s grid layout', 'xcodesol-page-builder' ), p.label ) }
								title={ p.label }
							>
								<span className={ `xsb-grid-preset__preview is-${ p.preview }` } aria-hidden="true">
									{ Array.from( { length: p.preview === 'twelve' ? 12 : p.preview === 'auto' ? 6 : p.preview === 'rails' ? 9 : p.preview === 'three' ? 6 : p.preview === 'left' || p.preview === 'right' ? 3 : 4 }, ( _, index ) => <i key={ index } /> ) }
								</span>
								<span className="xsb-grid-preset__label">{ p.label }</span>
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
