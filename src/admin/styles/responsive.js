/**
 * Centralised responsive device layer.
 *
 * Every style value may carry per-breakpoint overrides stored as flat keys:
 *
 *   padding_top   → desktop / base
 *   tablet_padding_top
 *   mobile_padding_top
 *
 * Desktop keeps the bare key so existing templates stay untouched; tablet
 * inherits desktop, mobile inherits tablet, and on the front end the cascade
 * of @media(max-width:…) blocks reproduces that inheritance for free. Any
 * future property automatically gains responsive support by being a normal
 * style key — nothing per-widget is required here.
 *
 * @package WooCommerce_Template_Builder
 */

export const DEVICES = [ 'desktop', 'tablet', 'mobile' ];

/** Front-end media widths (mirrored by includes/class-xcosb-block-registry.php). */
export const DEVICE_WIDTHS = { tablet: 768, mobile: 480 };

/** Keys that never become per-device (they are structural, not visual). */
const NON_DEVICE_KEYS = new Set( [ 'css_class', 'css_id', 'hide_on_desktop', 'hide_on_tablet', 'hide_on_mobile' ] );

export function isDeviceKey( key, device ) {
	return device !== 'desktop' && String( key ).indexOf( device + '_' ) === 0;
}

/** Device-prefixed variant of a plain key (desktop keeps the bare key). */
export function deviceKey( key, device ) {
	if ( device === 'desktop' || NON_DEVICE_KEYS.has( key ) ) {
		return key;
	}
	return device + '_' + key;
}

/** Base (desktop) name for any key — strips a leading device prefix. */
export function baseKey( key ) {
	const s = String( key );
	for ( const d of DEVICES ) {
		if ( d !== 'desktop' && s.indexOf( d + '_' ) === 0 ) {
			return s.slice( d.length + 1 );
		}
	}
	return s;
}

/**
 * Map of explicit values held by one device layer for a settings map —
 * plain (unprefixed) keys → the device's own value. Empty when the device
 * only inherits. Used by the popover to show "custom on this device".
 *
 * @param {Object} settings Source settings map (may include tablet_/mobile_ keys).
 * @param {string} device   'desktop' | 'tablet' | 'mobile'.
 * @return {Object} Plain-key map of this device's own overrides.
 */
export function deviceLayer( settings, device ) {
	const layer = {};
	if ( ! settings || device === 'desktop' ) {
		return layer;
	}
	Object.keys( settings ).forEach( ( key ) => {
		if ( isDeviceKey( key, device ) ) {
			const base = key.slice( device.length + 1 );
			if ( ! NON_DEVICE_KEYS.has( base ) && settings[ key ] !== undefined ) {
				layer[ base ] = settings[ key ];
			}
		}
	} );
	return layer;
}

/**
 * Effective settings for one device: desktop values overlaid with the
 * device's own overrides (tablet → desktop+tablet, mobile → those + mobile),
 * exactly matching the front-end @media cascade.
 *
 * @param {Object} settings Source settings map.
 * @param {string} device   Active device.
 * @return {Object} Copy of settings with the device's effective values on
 *                  the plain keys.
 */
export function effectiveForDevice( settings, device ) {
	if ( ! settings || device === 'desktop' ) {
		return settings;
	}
	const out = { ...settings };
	// Mobile inherits tablet.
	const inherit = device === 'mobile' ? deviceLayer( settings, 'tablet' ) : {};
	const own = deviceLayer( settings, device );
	Object.keys( inherit ).forEach( ( k ) => {
		if ( inherit[ k ] !== undefined ) {
			out[ k ] = inherit[ k ];
		}
	} );
	Object.keys( own ).forEach( ( k ) => {
		if ( own[ k ] !== undefined ) {
			out[ k ] = own[ k ];
		}
	} );
	return out;
}

/** Whether one device layer holds any override for the given base keys. */
export function deviceHasOverrideOn( settings, baseKeys, device ) {
	if ( ! settings || device === 'desktop' ) {
		return false;
	}
	return baseKeys.some( ( k ) => settings[ device + '_' + k ] !== undefined && settings[ device + '_' + k ] !== '' );
}

/** Whether any non-desktop layer holds an override for the given keys. */
export function deviceHasOverrides( settings, baseKeys ) {
	return deviceHasOverrideOn( settings, baseKeys, 'tablet' ) || deviceHasOverrideOn( settings, baseKeys, 'mobile' );
}

/** All keys a reset-all must clear for one base key (3 devices). */
export function allVariants( key ) {
	if ( NON_DEVICE_KEYS.has( key ) ) {
		return [ key ];
	}
	return [ key, 'tablet_' + key, 'mobile_' + key ];
}

/** True when the key is a base key plus any of its device variants is set. */
export function isKeySetAnyDevice( settings, key ) {
	return allVariants( key ).some( ( k ) => settings[ k ] !== undefined && settings[ k ] !== '' );
}
