<?php
/**
 * Block: General Divider.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$height = isset( $settings['height'] ) ? absint( $settings['height'] ) : 2;
$color  = ! empty( $settings['color'] ) ? $settings['color'] : '#e6e9f0';
$style  = ! empty( $settings['style'] ) ? $settings['style'] : 'solid';
$margin = isset( $settings['margin'] ) ? absint( $settings['margin'] ) : 24;

$allowed_styles = array( 'solid', 'dashed', 'dotted', 'double' );

if ( ! in_array( $style, $allowed_styles, true ) ) {
	$style = 'solid';
}

echo wp_kses( sprintf(
	'<div class="xsb-divider" style="border-top:%1$dpx %2$s %3$s;margin:%4$dpx 0;"></div>',
	$height,
	esc_attr( $style ),
	esc_attr( $color ),
	$margin
), XCOPB_Block_Registry::allowed_output_html() );