<?php
/**
 * Block: Dynamic Post Title (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$title = get_the_title();
if ( empty( $title ) && isset( $context['post_id'] ) ) {
	$title = get_the_title( $context['post_id'] );
}
if ( empty( $title ) ) {
	$title = __( 'Sample Post Title', 'xcodesol-page-builder' );
}

$tag          = ! empty( $settings['tag'] ) ? $settings['tag'] : 'h1';
$link_to_post = ! empty( $settings['link_to_post'] );
$align        = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$color        = ! empty( $settings['color'] ) ? $settings['color'] : '';
$font_size    = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? $settings['font_size'] : '';
$font_weight  = ! empty( $settings['font_weight'] ) ? $settings['font_weight'] : '';
$line_height  = isset( $settings['line_height'] ) && '' !== $settings['line_height'] ? $settings['line_height'] : '';

$allowed_tags = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' );
if ( ! in_array( $tag, $allowed_tags, true ) ) {
	$tag = 'h1';
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

$inner = esc_html( $title );
if ( $link_to_post ) {
	$permalink = get_permalink();
	if ( ! empty( $permalink ) ) {
		$inner = '<a href="' . esc_url( $permalink ) . '" style="color:inherit;text-decoration:none;">' . $inner . '</a>';
	}
}

$output = sprintf(
	'<%1$s class="xcopb-post-title xcopb-widget"%2$s>%3$s</%1$s>',
	tag_escape( $tag ),
	$style_attr,
	$inner
);

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
