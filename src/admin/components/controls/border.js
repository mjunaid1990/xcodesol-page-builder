/**
 * Border & Corner Radius Control.
 * Supports border style, width, color, and per-corner radius.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

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
	const [ linkRadius, setLinkRadius ] = useState( true );

	const radius = typeof value?.radius === 'object' && value?.radius !== null
		? value.radius
		: {
			top: value?.radius ?? 0,
			right: value?.radius ?? 0,
			bottom: value?.radius ?? 0,
			left: value?.radius ?? 0,
			unit: 'px',
		};

	const update = ( key, val ) => {
		onChange( {
			...value,
			[ key ]: val,
		} );
	};

	const handleRadiusCorner = ( corner, raw ) => {
		const num = raw === '' ? '' : Math.max( 0, parseInt( raw, 10 ) || 0 );
		if ( linkRadius ) {
			update( 'radius', {
				top: num,
				right: num,
				bottom: num,
				left: num,
				unit: radius.unit || 'px',
			} );
		} else {
			update( 'radius', {
				...radius,
				[ corner ]: num,
			} );
		}
	};

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
						<div className="xsb-control-sub-row">
							<label className="xsb-sub-label">{ __( 'Width', 'xcodesol-page-builder' ) }</label>
							<div className="xsb-number-unit-row">
								<input
									type="number"
									min="0"
									max="50"
									value={ typeof value?.width === 'object' ? ( value?.width?.top ?? 1 ) : ( value?.width ?? 1 ) }
									onChange={ ( e ) => update( 'width', Math.max( 0, parseInt( e.target.value, 10 ) || 0 ) ) }
									className="xsb-number-input"
								/>
								<span className="xsb-unit-pill">px</span>
							</div>
						</div>

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
				<div className="xsb-radius-section">
					<div className="xsb-box-model-header-row">
						<span className="xsb-sub-label">{ __( 'Border Radius', 'xcodesol-page-builder' ) }</span>
						<button
							type="button"
							className={ `xsb-link-btn${ linkRadius ? ' is-linked' : '' }` }
							onClick={ () => setLinkRadius( ( prev ) => ! prev ) }
							title={ linkRadius ? __( 'Unlink corners', 'xcodesol-page-builder' ) : __( 'Link corners', 'xcodesol-page-builder' ) }
						>
							<span className={ `dashicons ${ linkRadius ? 'dashicons-admin-links' : 'dashicons-editor-unlink' }` } aria-hidden="true" />
						</button>
					</div>

					<div className="xsb-box-model-grid">
						{ [
							{ key: 'top', label: 'TL' },
							{ key: 'right', label: 'TR' },
							{ key: 'bottom', label: 'BR' },
							{ key: 'left', label: 'BL' },
						].map( ( c ) => (
							<div key={ c.key } className="xsb-box-side-col">
								<input
									type="number"
									min="0"
									value={ radius[ c.key ] ?? '' }
									onChange={ ( e ) => handleRadiusCorner( c.key, e.target.value ) }
									className="xsb-number-input xsb-box-side-input"
									placeholder="0"
								/>
								<span className="xsb-box-side-label">{ c.label }</span>
							</div>
						) ) }
					</div>
				</div>
			</div>
		</ControlBase>
	);
}
