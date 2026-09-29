<?php
/**
 * Block: WooCommerce Breadcrumb.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'woocommerce_breadcrumb' ) ) {
	return;
}

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$vars = array();
if ( ! empty( $settings['color'] ) ) {
	$vars['--xsb-bc-fg'] = $settings['color'];
}
if ( ! empty( $settings['link_color'] ) ) {
	$vars['--xsb-bc-link'] = $settings['link_color'];
}
if ( isset( $settings['font_size'] ) && '' !== $settings['font_size'] ) {
	$vars['--xsb-bc-fs'] = absint( $settings['font_size'] ) . 'px';
}
if ( ! empty( $settings['font_weight'] ) ) {
	$vars['--xsb-bc-fw'] = $settings['font_weight'];
}

$wrap_props = array_merge( $vars, XCOPB_Block_Registry::text_css_props( $settings ) );
unset( $wrap_props['color'], $wrap_props['font-size'], $wrap_props['font-weight'] ); // Already exposed as vars.

echo wp_kses( '<div class="xsb-breadcrumb"' . XCOPB_Block_Registry::inline_style_attr( $wrap_props ) . '>', XCOPB_Block_Registry::allowed_output_html() );
woocommerce_breadcrumb();
echo '</div>';
