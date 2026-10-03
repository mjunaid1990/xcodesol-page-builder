/**
 * Entrance Animation Control.
 * Supports animation type, duration (ms), and delay (ms).
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';
import { useEffect, useRef } from '@wordpress/element';
import { MOTION_OPTIONS } from '../../lib/motion-controls';
import '../../../../assets/shared/motion-presets.css';

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
	const animations = Array.isArray( config.options ) ? config.options : MOTION_OPTIONS;
	const animation = typeof value === 'string' ? value : 'none';
	const duration = Number( config.duration ) || 600;
	const delay = Number( config.delay ) || 0;
	const easing = config.easing || 'ease';
	const repeat = config.repeat || '1';
	useEffect( () => {
		const node = previewRef.current;
		if ( ! node ) return;
		if ( ! animation || animation === 'none' ) {
			node.style.animation = 'none';
			return;
		}
		node.style.animation = 'none';
		void node.offsetWidth;
		node.style.animation = `xsb-motion-${ animation } ${ duration }ms ${ easing } ${ repeat } both`;
		node.style.animationDelay = `${ delay }ms`;
	}, [ animation, duration, delay, easing, repeat ] );

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
						value={ animation }
						onChange={ ( e ) => onChange( e.target.value ) }
						className="xsb-select-input"
					>
						<option value="none">{ __( 'No animation', 'xcodesol-page-builder' ) }</option>
						{ animations.filter( ( item ) => item.value !== 'none' ).map( ( a ) => (
							<option key={ a.value } value={ a.value }>
								{ __( a.label, 'xcodesol-page-builder' ) }
							</option>
						) ) }
					</select>
				</div>

				{ animation && animation !== 'none' && (
					<div className="xsb-motion-preview-card">
						<div ref={ previewRef } className="xsb-motion-preview"><span className="xsb-motion-preview__spark" aria-hidden="true">✦</span><span>{ __( 'Live animation preview', 'xcodesol-page-builder' ) }</span></div>
					</div>
				) }
			</div>
		</ControlBase>
	);
}
