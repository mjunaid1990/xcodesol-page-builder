<?php
/**
 * Block: WordPress Shortcode.
 *
 * Renders any user-supplied shortcode with do_shortcode(), wrapped in a stylable container.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$shortcode = isset( $settings['shortcode'] ) ? trim( (string) $settings['shortcode'] ) : '';
$title     = isset( $settings['title'] ) ? trim( (string) $settings['title'] ) : '';

if ( '' === $shortcode && '' === $title ) {
	return;
}

$rendered = '' !== $shortcode ? do_shortcode( $shortcode ) : '';

$wrap_props = array();
foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$key = 'margin_' . $side;
	if ( isset( $settings[ $key ] ) && '' !== $settings[ $key ] ) {
		$wrap_props[ 'margin-' . $side ] = (float) $settings[ $key ] . 'px';
	}
}

$output  = '<div class="xcopb-shortcode-widget xsb-shortcode-widget xsb-shortcode"' . XCOPB_Block_Registry::inline_style_attr( $wrap_props ) . '>';
if ( '' !== $title ) {
	$output .= '<h4 class="xcopb-shortcode-title xsb-shortcode-title">' . esc_html( $title ) . '</h4>';
}
$output .= '<div class="xcopb-shortcode-content xsb-shortcode-content">' . $rendered . '</div>';
$output .= '</div>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
