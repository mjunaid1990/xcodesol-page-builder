<?php
/**
 * Block: Dynamic Archive Title (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$include_context = isset( $settings['include_context'] ) ? (bool) $settings['include_context'] : true;

if ( $include_context ) {
	$title = get_the_archive_title();
} else {
	if ( is_category() ) {
		$title = single_cat_title( '', false );
	} elseif ( is_tag() ) {
		$title = single_tag_title( '', false );
	} elseif ( is_author() ) {
		$title = get_the_author();
	} elseif ( is_post_type_archive() ) {
		$title = post_type_archive_title( '', false );
	} elseif ( is_tax() ) {
		$title = single_term_title( '', false );
	} else {
		$title = get_the_archive_title();
	}
}

if ( empty( $title ) ) {
	$title = __( 'Archives', 'xcodesol-page-builder' );
}

$tag         = ! empty( $settings['tag'] ) ? $settings['tag'] : 'h1';
$align       = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$color       = ! empty( $settings['color'] ) ? $settings['color'] : '';
$font_size   = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? $settings['font_size'] : '';
$font_weight = ! empty( $settings['font_weight'] ) ? $settings['font_weight'] : '';

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

foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$style_attr = ! empty( $styles ) ? ' style="' . implode( ';', $styles ) . ';"' : '';

$output = sprintf(
	'<%1$s class="xcopb-archive-title xcopb-widget"%2$s>%3$s</%1$s>',
	tag_escape( $tag ),
	$style_attr,
	wp_kses_post( $title )
);

echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
