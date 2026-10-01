/**
 * Layout Picker Control with thumbnail cards and summary chip.
 * Supports 6 modes: List (vertical), Row (horizontal), Columns, Grid, Masonry, Scroll row.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export const LAYOUT_MODES = [
	{
		id: 'list',
		label: __( 'List', 'xcodesol-page-builder' ),
		description: __( 'Vertical stack (flex-direction: column)', 'xcodesol-page-builder' ),
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
				<rect x="4" y="4" width="16" height="4" rx="1" />
				<rect x="4" y="10" width="16" height="4" rx="1" />
				<rect x="4" y="16" width="16" height="4" rx="1" />
			</svg>
		),
	},
	{
		id: 'row',
		label: __( 'Row', 'xcodesol-page-builder' ),
		description: __( 'Horizontal flex row with wrap', 'xcodesol-page-builder' ),
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
				<rect x="4" y="4" width="4" height="16" rx="1" />
				<rect x="10" y="4" width="4" height="16" rx="1" />
				<rect x="16" y="4" width="4" height="16" rx="1" />
			</svg>
		),
	},
	{
		id: 'columns',
		label: __( 'Columns', 'xcodesol-page-builder' ),
		description: __( 'Multi-column container with customizable ratios', 'xcodesol-page-builder' ),
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
				<rect x="3" y="4" width="8" height="16" rx="1" />
				<rect x="13" y="4" width="8" height="16" rx="1" />
			</svg>
		),
	},
	{
		id: 'grid',
		label: __( 'Grid', 'xcodesol-page-builder' ),
		description: __( 'CSS Grid with visual column & row tracks', 'xcodesol-page-builder' ),
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
				<rect x="4" y="4" width="6" height="6" rx="1" />
				<rect x="14" y="4" width="6" height="6" rx="1" />
				<rect x="4" y="14" width="6" height="6" rx="1" />
				<rect x="14" y="14" width="6" height="6" rx="1" />
			</svg>
		),
	},
	{
		id: 'masonry',
		label: __( 'Masonry', 'xcodesol-page-builder' ),
		description: __( 'Pinterest-style auto-balancing column layout', 'xcodesol-page-builder' ),
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
				<rect x="4" y="3" width="6" height="10" rx="1" />
				<rect x="4" y="15" width="6" height="6" rx="1" />
				<rect x="14" y="3" width="6" height="6" rx="1" />
				<rect x="14" y="11" width="6" height="10" rx="1" />
			</svg>
		),
	},
	{
		id: 'scroll-row',
		label: __( 'Scroll Row', 'xcodesol-page-builder' ),
		description: __( 'Horizontal scroll snap carousel row', 'xcodesol-page-builder' ),
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
				<rect x="3" y="6" width="7" height="12" rx="1" />
				<rect x="12" y="6" width="7" height="12" rx="1" />
				<path d="M21 9l2 3-2 3" />
			</svg>
		),
	},
];

function LayoutModePreview( { mode } ) {
	const classes = {
		list: 'is-list', row: 'is-row', columns: 'is-columns', grid: 'is-grid',
		masonry: 'is-masonry', 'scroll-row': 'is-scroll-row',
	}[ mode ];
	const count = mode === 'list' || mode === 'row' ? 3 : mode === 'columns' ? 2 : 4;
	return (
		<span className={ `xsb-layout-mini ${ classes }` } aria-hidden="true">
			{ Array.from( { length: count }, ( _, index ) => <i key={ index } /> ) }
		</span>
	);
}

export default function LayoutPickerControl( {
	config = {},
	value = 'columns',
	onChange,
	device,
	state,
} ) {
	const {
		id = 'layout_mode',
		label = __( 'Container Layout', 'xcodesol-page-builder' ),
		summary,
	} = config;

	const currentMode = value || 'columns';

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-layout-picker"
		>
			<div className="xsb-layout-picker-wrapper">
				{ summary && (
					<div className="xsb-layout-summary-chip">
						<span className="dashicons dashicons-layout" aria-hidden="true" />
						<span>{ summary }</span>
					</div>
				) }

				<div className="xsb-layout-cards-grid" role="radiogroup" aria-label={ label }>
					{ LAYOUT_MODES.map( ( mode ) => {
						const isSelected = currentMode === mode.id;
						return (
							<button
								key={ mode.id }
								type="button"
								role="radio"
								aria-checked={ isSelected }
								className={ `xsb-layout-thumb-card${ isSelected ? ' is-active' : '' }` }
								onClick={ () => onChange( mode.id ) }
								title={ mode.description }
							>
								<LayoutModePreview mode={ mode.id } />
								<span className="xsb-layout-thumb-label">{ mode.label }</span>
							</button>
						);
					} ) }
				</div>
			</div>
		</ControlBase>
	);
}
