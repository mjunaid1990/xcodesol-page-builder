/**
 * Public API helpers for the style popover.
 *
 * @package WooCommerce_Template_Builder
 */

import { getWidgetConfig } from './config';

/**
 * Whether a block type has an inline style popover.
 *
 * @param {string} type Block type.
 * @return {boolean} True when a popover config exists for this type.
 */
export function hasStylePopover( type ) {
	return !! getWidgetConfig( type );
}