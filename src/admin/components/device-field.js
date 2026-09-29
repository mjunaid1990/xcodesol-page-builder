/**
 * Reusable per-device (responsive) layout controls for the inspector.
 *
 * One pattern is used over and over: a setting can hold a desktop value
 * plus optional tablet_<key> / mobile_<key> overrides, the preview device
 * comes from a shared app state, a device layer either has its own value or
 * inherits the layer above, and clearing an override must be one click.
 *
 * This module centralises that pattern so a future per-device property
 * (gap, alignment, padding, typography size, …) is a small composition
 * instead of a copy/paste of tabs + inheritance + reset plumbing:
 *
 *   <DeviceShell settings device baseKey="gap" noun="gap" valueLabel="20 px" onReset={ () => set('gap', undefined) }>
 *     { ( { device, resetLink, inheritedNote } ) => (
 *       <div className="xsb-inspector-device-field__row">
 *         <GapControl … />
 *         { resetLink }
 *       </div>
 *     ) }
 *   </DeviceShell>
 *
 * or, for option pickers, the ready-made <DeviceSelectField />.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

import { deviceKey, effectiveForDevice } from '../styles/responsive';

/** Ordered device definitions used by the tabs and labels. */
export const DEVICE_TABS = [
	{ id: 'desktop', label: __( 'Desktop', 'xcodesol-page-builder' ) },
	{ id: 'tablet', label: __( 'Tablet', 'xcodesol-page-builder' ) },
	{ id: 'mobile', label: __( 'Mobile', 'xcodesol-page-builder' ) },
];

/** Human label of a device id ('desktop' → 'Desktop'). */
export function deviceName( device ) {
	const found = DEVICE_TABS.find( ( d ) => d.id === device );
	return found ? found.label : device;
}

/** Setting label qualified for a device: 'Columns' → 'Columns on Tablet'. */
export function deviceLabelOf( label, device ) {
	if ( device === 'desktop' ) {
		return label;
	}
	return sprintf(
		/* translators: 1: setting name, 2: device name. */
		__( '%1$s on %2$s', 'xcodesol-page-builder' ),
		label,
		deviceName( device )
	);
}

/**
 * Settings key that stores the value for one device (desktop keeps the bare
 * key so old templates stay valid).
 *
 * @param {string} key    Base setting key ('columns', 'column_widths', …).
 * @param {string} device 'desktop' | 'tablet' | 'mobile'.
 * @return {string} Storage key.
 */
export function deviceKeyFor( key, device ) {
	return deviceKey( key, device );
}

/**
 * True when a device layer holds its own stored override for a key (not an
 * inherited one). Array overrides count only when non-empty.
 *
 * @param {Object} settings Raw settings map (may hold tablet_/mobile_ keys).
 * @param {string} device   'desktop' | 'tablet' | 'mobile'.
 * @param {string} key      Base key.
 * @return {boolean}
 */
export function hasDeviceOverride( settings, device, key ) {
	if ( device === 'desktop' || ! settings ) {
		return false;
	}
	const value = settings[ `${ device }_${ key }` ];
	if ( Array.isArray( value ) ) {
		return value.length > 0;
	}
	return value !== undefined && value !== '' && value !== null;
}

/**
 * Effective value of a key for one device: the device's own override, or the
 * inherited one (tablet inherits desktop, mobile inherits tablet).
 *
 * @param {Object} settings Raw settings map.
 * @param {string} key      Base key.
 * @param {string} device   Active device.
 * @return {*} The value, or undefined when nothing is set anywhere.
 */
export function deviceEffective( settings, key, device ) {
	const effective = effectiveForDevice( settings || {}, device );
	return effective ? effective[ key ] : undefined;
}

/**
 * Desktop / Tablet / Mobile switch. Reuses the popover device-tab classes;
 * the blue dot marks a device that has its own stored override.
 */
export function DeviceTabs( { device, onChange, tabletHas, mobileHas } ) {
	return (
		<div
			className="xsb-device-tabs xsb-device-tabs--inspector"
			role="tablist"
			aria-label={ __( 'Responsive device for these layout settings', 'xcodesol-page-builder' ) }
		>
			{ DEVICE_TABS.map( ( d ) => (
				<button
					key={ d.id }
					type="button"
					role="tab"
					aria-selected={ device === d.id }
					className={ 'xsb-device-tabs__button' + ( device === d.id ? ' is-active' : '' ) }
					onClick={ () => onChange( d.id ) }
				>
					<span className="xsb-device-tabs__label">{ d.label }</span>
					{ ( ( d.id === 'tablet' && tabletHas ) || ( d.id === 'mobile' && mobileHas ) ) && (
						<span className="xsb-device-tabs__badge" aria-hidden="true" />
					) }
				</button>
			) ) }
		</div>
	);
}

/**
 * One-click "stop overriding, inherit again" link shown next to a customised
 * per-device value.
 */
export function InheritResetLink( { onClick, title, label } ) {
	return (
		<button
			type="button"
			className="xsb-inspector-reset-link"
			title={ title }
			onClick={ onClick }
		>
			<span className="dashicons dashicons-undo" aria-hidden="true" />
			{ label || __( 'Inherit', 'xcodesol-page-builder' ) }
		</button>
	);
}

/**
 * Layout shell for any single-key per-device setting. Renders the device
 * tabs (with override dots) above whatever the render-prop returns, and
 * gives that render function everything it needs to place the control, the
 * "inherit again" reset link (visible only when this device is customised)
 * and an inherit note (visible only when it isn't) exactly where it wants.
 *
 * @param {Object}   props
 * @param {Object}   props.settings       Raw settings map.
 * @param {string}   props.device         Active device.
 * @param {Function} props.onDeviceChange Device switch handler.
 * @param {string}   props.baseKey        Base settings key.
 * @param {string}   props.noun           Lower-case noun used in copy, e.g. 'column widths'.
 * @param {string}   [props.valueLabel]   Current value shown in the default inherit note.
 * @param {string}   [props.resetLabel]   Label of the reset link.
 * @param {Function} props.onReset        Clears the override for baseKey (caller owns the setter).
 * @param {Function} props.children       ({ device, overridden, resetLink, inheritedNote, deviceName }) => ReactNode.
 */
export function DeviceShell( {
	settings = {},
	device = 'desktop',
	onDeviceChange,
	baseKey,
	noun,
	valueLabel = '',
	resetLabel,
	onReset,
	children,
} ) {
	const overridden = hasDeviceOverride( settings, device, baseKey );

	const resetTitle = sprintf(
		/* translators: 1: noun phrase, 2: device name. */
		__( 'Use the desktop %1$s on %2$s again', 'xcodesol-page-builder' ),
		noun || baseKey.replace( /_/g, ' ' ),
		deviceName( device )
	);

	const resetLink =
		device !== 'desktop' && overridden ? (
			<InheritResetLink label={ resetLabel } title={ resetTitle } onClick={ onReset } />
		) : null;

	let inheritedNote = null;
	if ( device !== 'desktop' && ! overridden ) {
		if ( noun ) {
			inheritedNote = sprintf(
				/* translators: 1: noun phrase, 2: current (inherited) value. */
				__( 'Inherits the desktop %1$s (%2$s) until you pick another value.', 'xcodesol-page-builder' ),
				noun,
				valueLabel
			);
		}
	}

	return (
		<div className="xsb-inspector-device-field">
			<DeviceTabs
				device={ device }
				onChange={ onDeviceChange }
				tabletHas={ hasDeviceOverride( settings, 'tablet', baseKey ) }
				mobileHas={ hasDeviceOverride( settings, 'mobile', baseKey ) }
			/>
			{ children( {
				device,
				deviceName: deviceName( device ),
				overridden,
				resetLink,
				inheritedNote,
			} ) }
		</div>
	);
}

/**
 * Ready-made per-device option picker (columns, alignment, border style…):
 * device tabs, a SelectControl showing the effective/inherited value, an
 * inherit note when the device isn't customised and an "Inherit" reset link
 * when it is. Options keep their own value type via `parse`.
 *
 * @param {Object}  props
 * @param {Object}  props.settings       Raw settings map.
 * @param {Function} props.set           (key, value) => void writer.
 * @param {string}  props.device         Active device.
 * @param {Function} props.onDeviceChange Device switch handler.
 * @param {string}  props.baseKey        Base settings key, e.g. 'columns'.
 * @param {string}  props.label          Base label, e.g. 'Columns'.
 * @param {Array}   props.options        SelectControl options [{ label, value }].
 * @param {*}       [props.fallback]     Shown value when nothing is stored (e.g. 4).
 * @param {Function} [props.parse]       Maps the raw select value to the stored type.
 * @param {string}  [props.noun]         Lower-case noun used in the copy.
 * @param {string}  [props.resetLabel]   Label of the reset link.
 */
export function DeviceSelectField( {
	settings = {},
	set,
	device = 'desktop',
	onDeviceChange,
	baseKey,
	label,
	options,
	fallback = '',
	parse = ( value ) => value,
	noun,
	resetLabel,
} ) {
	const raw = deviceEffective( settings, baseKey, device );
	const isSet = raw !== undefined && raw !== null && raw !== '';
	const current = isSet ? raw : fallback;
	const option = options.find( ( o ) => String( o.value ) === String( current ) );
	const currentLabel = option ? option.label : String( current );

	return (
		<DeviceShell
			settings={ settings }
			device={ device }
			onDeviceChange={ onDeviceChange }
			baseKey={ baseKey }
			noun={ noun || label.toLowerCase() }
			valueLabel={ currentLabel }
			resetLabel={ resetLabel }
			onReset={ () => set( deviceKeyFor( baseKey, device ), undefined ) }
		>
			{ ( { device: active, resetLink, inheritedNote } ) => (
				<div className="xsb-inspector-device-field__row">
					<SelectControl
						label={ deviceLabelOf( label, active ) }
						help={ inheritedNote || undefined }
						value={ String( current ) }
						options={ options }
						onChange={ ( next ) => set( deviceKeyFor( baseKey, active ), parse( next ) ) }
					/>
					{ resetLink }
				</div>
			) }
		</DeviceShell>
	);
}
