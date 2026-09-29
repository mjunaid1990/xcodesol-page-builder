/**
 * Style popover — public surface.
 *
 * This file is kept as a thin facade so existing imports keep working:
 *
 *   import StylePopover, { hasStylePopover, SHADOW_VALUES } from './style-popover';
 *
 * The implementation lives in ./style-popover/ (index.js + modular parts):
 *   - index.js          main component (progressive-disclosure shell)
 *   - controls.js       reusable compact controls
 *   - config.js         per-widget element/category configs (ref JSON)
 *   - categories.js     generic category renderers
 *   - header/toolbar/category-menu/footer/position  UI chrome + portal
 *
 * @package WooCommerce_Template_Builder
 */

export { default } from './style-popover/index';
export { hasStylePopover } from './style-popover/api';
export { SHADOW_OPTIONS, SHADOW_VALUES, ANIMATION_OPTIONS, FONT_OPTIONS, FONT_WEIGHT_OPTIONS } from './style-popover/controls';
export { getWidgetConfig, getWidgetElements } from './style-popover/config';
export { CATEGORY_META } from './style-popover/category-menu';