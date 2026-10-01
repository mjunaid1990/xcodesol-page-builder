/**
 * Entrance Animation Control.
 * Supports animation type, duration (ms), and delay (ms).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';
import { useEffect, useRef } from '@wordpress/element';
import motionCatalog from '../../../../includes/data/motion-presets.json';
import '../../../../assets/shared/motion-presets.css';

const ANIMATIONS = motionCatalog;

export default function AnimationControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const previewRef = useRef( null );
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
	useEffect( () => {
		const node = previewRef.current;
		if ( ! node || ! anim.animation || anim.animation === 'none' ) return;
		node.style.animation = 'none';
		void node.offsetWidth;
		node.style.animation = `xsb-motion-${ anim.animation } ${ Number( anim.duration ) || 600 }ms ${ anim.easing || 'ease' } both`;
	}, [ anim.animation, anim.duration, anim.easing, anim.delay ] );

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
						<option value="none">{ __( 'No animation', 'xcodesol-page-builder' ) }</option>
						{ ANIMATIONS.map( ( a ) => (
							<option key={ a.value } value={ a.value }>
								{ __( a.label, 'xcodesol-page-builder' ) }
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
						<div className="xsb-control-sub-row">
							<label className="xsb-sub-label">{ __( 'Timing', 'xcodesol-page-builder' ) }</label>
							<select className="xsb-select-input" value={ anim.easing || 'ease' } onChange={ ( e ) => update( 'easing', e.target.value ) }>
								<option value="ease">Ease</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in out</option><option value="linear">Linear</option><option value="cubic-bezier(0.16,1,0.3,1)">Smooth</option>
							</select>
						</div>
						<div className="xsb-motion-preview-card"><div ref={ previewRef } className="xsb-motion-preview"><span className="xsb-motion-preview__spark" aria-hidden="true">✦</span><span>{ __( 'Live animation preview', 'xcodesol-page-builder' ) }</span></div></div>
					</>
				) }
			</div>
		</ControlBase>
	);
}
