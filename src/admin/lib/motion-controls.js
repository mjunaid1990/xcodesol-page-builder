/** Shared motion presets and controls for all widget inspectors. */

import { __ } from '@wordpress/i18n';
import motionCatalog from '../../../includes/data/motion-presets.json';

export const MOTION_OPTIONS = motionCatalog.map( ( preset ) => ( {
	value: preset.value,
	label: __( preset.label, 'xcodesol-page-builder' ),
} ) );

export const MOTION_IDS = MOTION_OPTIONS.map( ( option ) => option.value );

const EFFECT_OPTIONS = [
	{ value: 'ease', label: __( 'Ease', 'xcodesol-page-builder' ) },
	{ value: 'ease-in', label: __( 'Ease in', 'xcodesol-page-builder' ) },
	{ value: 'ease-out', label: __( 'Ease out', 'xcodesol-page-builder' ) },
	{ value: 'ease-in-out', label: __( 'Ease in out', 'xcodesol-page-builder' ) },
	{ value: 'linear', label: __( 'Linear', 'xcodesol-page-builder' ) },
];

const REPEAT_OPTIONS = [
	{ value: '1', label: __( 'Once', 'xcodesol-page-builder' ) },
	{ value: '2', label: __( '2 times', 'xcodesol-page-builder' ) },
	{ value: '3', label: __( '3 times', 'xcodesol-page-builder' ) },
	{ value: 'infinite', label: __( 'Loop', 'xcodesol-page-builder' ) },
];

/** Build the common entrance animation controls under an existing section. */
export function createMotionControls( tab, section ) {
	const common = { tab, section };
	const condition = { animation: MOTION_IDS };
	return [
		{ ...common, id: 'animation', type: 'animation', label: __( 'Entrance effect', 'xcodesol-page-builder' ), default: 'none', options: MOTION_OPTIONS },
		{ ...common, id: 'animation_duration', type: 'number', label: __( 'Duration (ms)', 'xcodesol-page-builder' ), min: 100, max: 5000, default: 600, condition },
		{ ...common, id: 'animation_delay', type: 'number', label: __( 'Delay (ms)', 'xcodesol-page-builder' ), min: 0, max: 3000, default: 0, condition },
		{ ...common, id: 'animation_easing', type: 'select', label: __( 'Timing', 'xcodesol-page-builder' ), default: 'ease', options: EFFECT_OPTIONS, condition },
		{ ...common, id: 'animation_repeat', type: 'select', label: __( 'Repeat', 'xcodesol-page-builder' ), default: '1', options: REPEAT_OPTIONS, condition },
	];
}
