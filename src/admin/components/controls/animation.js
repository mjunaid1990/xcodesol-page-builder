/**
 * Entrance Animation Control.
 * Supports animation type, duration (ms), and delay (ms).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

const ANIMATIONS = [
	{ label: 'None', value: 'none' },
	{ label: 'Fade In', value: 'fade-in' },
	{ label: 'Slide Up', value: 'slide-up' },
	{ label: 'Slide Down', value: 'slide-down' },
	{ label: 'Zoom In', value: 'zoom-in' },
	{ label: 'Bounce', value: 'bounce' },
];

export default function AnimationControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id = 'animation',
		label = __( 'Entrance Animation', 'xcodesol-page-builder' ),
	} = config;

	const anim = typeof value === 'object' && value !== null
		? value
		: { animation: typeof value === 'string' ? value : 'none', duration: 600, delay: 0 };

	const update = ( key, val ) => {
		onChange( {
			...anim,
			[ key ]: val,
		} );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			device={ device }
			state={ state }
			className="xsb-ctrl-animation"
		>
			<div className="xsb-animation-control-group">
				<div className="xsb-control-sub-row">
					<label className="xsb-sub-label">{ __( 'Animation', 'xcodesol-page-builder' ) }</label>
					<select
						value={ anim.animation || 'none' }
						onChange={ ( e ) => update( 'animation', e.target.value ) }
						className="xsb-select-input"
					>
						{ ANIMATIONS.map( ( a ) => (
							<option key={ a.value } value={ a.value }>
								{ a.label }
							</option>
						) ) }
					</select>
				</div>

				{ anim.animation && anim.animation !== 'none' && (
					<>
						<div className="xsb-control-sub-row">
							<label className="xsb-sub-label">{ __( 'Duration (ms)', 'xcodesol-page-builder' ) }</label>
							<div className="xsb-number-unit-row">
								<input
									type="number"
									min="100"
									max="3000"
									step="50"
									value={ anim.duration ?? 600 }
									onChange={ ( e ) => update( 'duration', parseInt( e.target.value, 10 ) || 0 ) }
									className="xsb-number-input"
								/>
								<span className="xsb-unit-pill">ms</span>
							</div>
						</div>

						<div className="xsb-control-sub-row">
							<label className="xsb-sub-label">{ __( 'Delay (ms)', 'xcodesol-page-builder' ) }</label>
							<div className="xsb-number-unit-row">
								<input
									type="number"
									min="0"
									max="3000"
									step="50"
									value={ anim.delay ?? 0 }
									onChange={ ( e ) => update( 'delay', parseInt( e.target.value, 10 ) || 0 ) }
									className="xsb-number-input"
								/>
								<span className="xsb-unit-pill">ms</span>
							</div>
						</div>
					</>
				) }
			</div>
		</ControlBase>
	);
}
