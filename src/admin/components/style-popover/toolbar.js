/**
 * Universal compact toolbar: responsive device tabs + style-state selector.
 *
 * Sticky under the header. Desktop is the base layer; tablet/mobile inherit
 * from it unless the user overrides (the blue dot marks devices that carry
 * custom overrides once layered data arrives — today the builder persists a
 * single layer, so only the active device badge logic runs).
 *
 * @package WooCommerce_Template_Builder
 */

import { __ } from '@wordpress/i18n';

export const DEVICES = [
	{ id: 'desktop', label: __( 'Desktop', 'xcodesol-page-builder' ), icon: 'dashicons-desktop' },
	{ id: 'tablet', label: __( 'Tablet', 'xcodesol-page-builder' ), icon: 'dashicons-tablet' },
	{ id: 'mobile', label: __( 'Mobile', 'xcodesol-page-builder' ), icon: 'dashicons-smartphone' },
];

export const STATE_OPTIONS = [
	{ value: 'default', label: __( 'Default', 'xcodesol-page-builder' ) },
	{ value: 'hover', label: __( 'Hover', 'xcodesol-page-builder' ) },
	{ value: 'focusVisible', label: __( 'Focus-visible', 'xcodesol-page-builder' ) },
	{ value: 'focus', label: __( 'Focus', 'xcodesol-page-builder' ) },
	{ value: 'active', label: __( 'Active', 'xcodesol-page-builder' ) },
	{ value: 'selected', label: __( 'Selected', 'xcodesol-page-builder' ) },
	{ value: 'disabled', label: __( 'Disabled', 'xcodesol-page-builder' ) },
];

/**
 * Device segmented tabs.
 *
 * @param {Object}   props
 * @param {string}   props.device   Active device id.
 * @param {Function} props.onChange (deviceId) => void.
 * @param {Object}   props.badges   { tablet?: boolean, mobile?: boolean }.
 */
export function DeviceTabs( { device, onChange, badges = {} } ) {
	return (
		<div className="xsb-device-tabs" role="tablist" aria-label={ __( 'Responsive device', 'xcodesol-page-builder' ) }>
			{ DEVICES.map( ( d ) => (
				<button
					key={ d.id }
					type="button"
					role="tab"
					aria-selected={ device === d.id }
					className={ 'xsb-device-tabs__button' + ( device === d.id ? ' is-active' : '' ) }
					title={ d.label }
					onClick={ () => onChange( d.id ) }
				>
					<span className={ `dashicons ${ d.icon }` } aria-hidden="true" />
					<span className="xsb-device-tabs__label">{ d.label }</span>
					{ d.id !== 'desktop' && badges[ d.id ] && (
						<span className="xsb-device-tabs__badge" aria-hidden="true" />
					) }
				</button>
			) ) }
		</div>
	);
}

/**
 * State selector — only states relevant to the element are offered.
 *
 * @param {Object}   props
 * @param {string}   props.state    Active state key.
 * @param {Array}    props.states   Supported states (['default', 'hover', …]).
 * @param {Function} props.onChange (stateKey) => void.
 */
export function StateSelect( { state, states, onChange } ) {
	const options = STATE_OPTIONS.filter( ( o ) => states.includes( o.value ) );

	if ( options.length <= 1 ) {
		return null;
	}

	if ( options.length <= 3 ) {
		return (
			<div className="xsb-style-state-pills-row">
				<span className="xsb-style-state-pills-label">{ __( 'State', 'xcodesol-page-builder' ) }</span>
				<div className="xsb-style-state-pills" role="radiogroup" aria-label={ __( 'State selector', 'xcodesol-page-builder' ) }>
					{ options.map( ( o ) => (
						<button
							key={ o.value }
							type="button"
							role="radio"
							aria-checked={ ( state || 'default' ) === o.value }
							className={ 'xsb-style-state-pill' + ( ( state || 'default' ) === o.value ? ' is-active' : '' ) }
							onClick={ () => onChange( o.value ) }
						>
							{ o.label }
						</button>
					) ) }
				</div>
			</div>
		);
	}

	return (
		<label className="xsb-style-state-select">
			<span className="xsb-style-state-select__label">{ __( 'State', 'xcodesol-page-builder' ) }</span>
			<select
				className="xsb-select-input"
				value={ states.includes( state ) ? state : 'default' }
				onChange={ ( e ) => onChange( e.target.value ) }
			>
				{ options.map( ( o ) => (
					<option key={ o.value } value={ o.value }>
						{ o.label }
					</option>
				) ) }
			</select>
		</label>
	);
}

/**
 * Full toolbar row (device tabs + state select) with the "inherits" note
 * shown when a non-default state or non-desktop device is active.
 *
 * @param {Object} props
 */
export function StylePopoverToolbar( { device, onDevice, state, states, onState, badgeTablet = false, badgeMobile = false } ) {
	const nonDefault = state !== 'default';
	const nonDesktop = device !== 'desktop';

	return (
		<div className="xsb-style-popover__toolbar">
			<DeviceTabs
				device={ device }
				onChange={ onDevice }
				badges={ { tablet: badgeTablet, mobile: badgeMobile } }
			/>
			<StateSelect state={ state } states={ states } onChange={ onState } />
			{ ( nonDefault || nonDesktop ) && (
				<p className="xsb-style-popover__inherit-note">
					{ nonDefault
						? __( 'This state inherits Default styles unless you override a value below.', 'xcodesol-page-builder' )
						: __( 'This device inherits Desktop values unless you override one below.', 'xcodesol-page-builder' ) }
				</p>
			) }
		</div>
	);
}