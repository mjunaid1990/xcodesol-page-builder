/**
 * Column Ratio Control with thumbnail presets and custom track widths.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

export const RATIO_PRESETS = {
	1: [
		{ label: '100%', widths: [ 12 ], fr: '1fr', icon: [ 100 ] },
	],
	2: [
		{ label: '50 / 50', widths: [ 6, 6 ], fr: '1fr 1fr', icon: [ 50, 50 ] },
		{ label: '66 / 33', widths: [ 8, 4 ], fr: '2fr 1fr', icon: [ 66, 33 ] },
		{ label: '33 / 66', widths: [ 4, 8 ], fr: '1fr 2fr', icon: [ 33, 66 ] },
		{ label: '75 / 25', widths: [ 9, 3 ], fr: '3fr 1fr', icon: [ 75, 25 ] },
		{ label: '25 / 75', widths: [ 3, 9 ], fr: '1fr 3fr', icon: [ 25, 75 ] },
	],
	3: [
		{ label: '33 / 33 / 33', widths: [ 4, 4, 4 ], fr: '1fr 1fr 1fr', icon: [ 33, 33, 33 ] },
		{ label: '25 / 50 / 25', widths: [ 3, 6, 3 ], fr: '1fr 2fr 1fr', icon: [ 25, 50, 25 ] },
		{ label: '50 / 25 / 25', widths: [ 6, 3, 3 ], fr: '2fr 1fr 1fr', icon: [ 50, 25, 25 ] },
		{ label: '25 / 25 / 50', widths: [ 3, 3, 6 ], fr: '1fr 1fr 2fr', icon: [ 25, 25, 50 ] },
	],
	4: [
		{ label: '25 x 4', widths: [ 3, 3, 3, 3 ], fr: '1fr 1fr 1fr 1fr', icon: [ 25, 25, 25, 25 ] },
		{ label: '40 / 20 / 20 / 20', widths: [ 5, 2.3, 2.3, 2.3 ], fr: '2fr 1fr 1fr 1fr', icon: [ 40, 20, 20, 20 ] },
	],
	5: [
		{ label: '20 x 5', widths: [ 2.4, 2.4, 2.4, 2.4, 2.4 ], fr: '1fr 1fr 1fr 1fr 1fr', icon: [ 20, 20, 20, 20, 20 ] },
	],
	6: [
		{ label: '16.6 x 6', widths: [ 2, 2, 2, 2, 2, 2 ], fr: '1fr 1fr 1fr 1fr 1fr 1fr', icon: [ 16, 16, 16, 16, 16, 16 ] },
	],
};

export default function ColumnRatioControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id = 'column_widths',
		label = __( 'Column Structure & Ratios', 'xcodesol-page-builder' ),
		columnsCount = 2,
		onAddColumn,
		onRemoveColumn,
	} = config;

	const count = Math.min( 6, Math.max( 1, Number( columnsCount ) || 2 ) );
	const presets = RATIO_PRESETS[ count ] || [];

	const handlePresetClick = ( preset ) => {
		onChange( preset.widths, preset.fr );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-column-ratio"
		>
			<div className="xsb-column-ratio-box">
				{/* Column Count toolbar */}
				<div className="xsb-col-count-row">
					<span className="xsb-sub-label">
						{ count } { count === 1 ? __( 'Column', 'xcodesol-page-builder' ) : __( 'Columns', 'xcodesol-page-builder' ) }
					</span>
					<div className="xsb-col-count-actions">
						<button
							type="button"
							className="xsb-tb-btn"
							disabled={ count <= 1 }
							onClick={ () => onRemoveColumn && onRemoveColumn() }
							title={ __( 'Remove Column', 'xcodesol-page-builder' ) }
						>
							<span className="dashicons dashicons-minus" aria-hidden="true" />
						</button>
						<button
							type="button"
							className="xsb-tb-btn"
							disabled={ count >= 6 }
							onClick={ () => onAddColumn && onAddColumn() }
							title={ __( 'Add Column', 'xcodesol-page-builder' ) }
						>
							<span className="dashicons dashicons-plus-alt2" aria-hidden="true" />
						</button>
					</div>
				</div>

				{/* Ratio Thumbnail Presets */}
				<div className="xsb-ratio-presets-grid">
					{ presets.map( ( p, idx ) => (
						<button
							key={ idx }
							type="button"
							className="xsb-ratio-preset-btn"
							onClick={ () => handlePresetClick( p ) }
							title={ p.label }
						>
							<div className="xsb-ratio-bars-thumb">
								{ p.icon.map( ( pct, bIdx ) => (
									<div
										key={ bIdx }
										className="xsb-ratio-bar"
										style={ { width: `${ pct }%` } }
									/>
								) ) }
							</div>
							<span className="xsb-ratio-preset-label">{ p.label }</span>
						</button>
					) ) }
				</div>
			</div>
		</ControlBase>
	);
}
