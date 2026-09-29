<?php
/**
 * Block: Elementor-style Heading.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$title = isset( $settings['title'] ) ? (string) $settings['title'] : '';
if ( '' === trim( $title ) ) {
	$title = isset( $settings['content'] ) ? (string) $settings['content'] : '';
}

if ( '' === trim( $title ) ) {
	return;
}

$tag         = ! empty( $settings['tag'] ) ? $settings['tag'] : 'h2';
$link        = isset( $settings['link'] ) ? trim( (string) $settings['link'] ) : '';
$align       = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$color       = ! empty( $settings['color'] ) ? $settings['color'] : '';
$font_size   = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? $settings['font_size'] : '';
$font_weight = ! empty( $settings['font_weight'] ) ? $settings['font_weight'] : '';
$line_height = isset( $settings['line_height'] ) && '' !== $settings['line_height'] ? $settings['line_height'] : '';

$allowed_tags = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' );
if ( ! in_array( $tag, $allowed_tags, true ) ) {
	$tag = 'h2';
}

$styles = array();
if ( '' !== $color ) {
	$styles[] = 'color:' . esc_attr( $color );
}
if ( '' !== $align && 'left' !== $align ) {
	$styles[] = 'text-align:' . esc_attr( $align );
}
if ( '' !== $font_size ) {
	$styles[] = 'font-size:' . ( is_numeric( $font_size ) ? $font_size . 'px' : esc_attr( $font_size ) );
}
if ( '' !== $font_weight ) {
	$styles[] = 'font-weight:' . esc_attr( $font_weight );
}
if ( '' !== $line_height ) {
	$styles[] = 'line-height:' . esc_attr( $line_height );
}

foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$style_attr = ! empty( $styles ) ? ' style="' . implode( ';', $styles ) . ';"' : '';

$heading_content = esc_html( $title );
if ( '' !== $link ) {
	$heading_content = '<a href="' . esc_url( $link ) . '" style="color:inherit;text-decoration:none;">' . $heading_content . '</a>';
}

$output = '<' . $tag . ' class="xcopb-heading xsb-heading xcopb-widget"' . $style_attr . '>' . $heading_content . '</' . $tag . '>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
