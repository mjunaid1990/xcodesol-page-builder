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
$font_family = ! empty( $settings['font_family'] ) ? $settings['font_family'] : '';
$letter_spacing = isset( $settings['letter_spacing'] ) ? (float) $settings['letter_spacing'] : null;
$text_transform = ! empty( $settings['text_transform'] ) ? $settings['text_transform'] : '';
$animation = isset( $settings['animation'] ) ? sanitize_key( $settings['animation'] ) : 'none';
$motion_id = 'none' !== $animation && class_exists( 'XCOPB_Motion_Presets' ) ? XCOPB_Motion_Presets::keyframe( $animation ) : '';

$allowed_tags = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' );
if ( ! in_array( $tag, $allowed_tags, true ) ) {
	$tag = 'h2';
}

$styles = array();
if ( $motion_id ) {
	$styles[] = 'animation-name:' . $motion_id;
	$styles[] = 'animation-duration:' . min( 5000, max( 100, absint( $settings['animation_duration'] ?? 600 ) ) ) . 'ms';
	$styles[] = 'animation-delay:' . min( 3000, absint( $settings['animation_delay'] ?? 0 ) ) . 'ms';
	$easing = isset( $settings['animation_easing'] ) && in_array( $settings['animation_easing'], array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ), true ) ? $settings['animation_easing'] : 'ease';
	$repeat = isset( $settings['animation_repeat'] ) && in_array( (string) $settings['animation_repeat'], array( '1', '2', '3', 'infinite' ), true ) ? $settings['animation_repeat'] : '1';
	$styles[] = 'animation-timing-function:' . $easing;
	$styles[] = 'animation-iteration-count:' . $repeat;
}
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
if ( '' !== $font_family ) {
	$styles[] = 'font-family:' . esc_attr( $font_family );
}
if ( null !== $letter_spacing ) {
	$styles[] = 'letter-spacing:' . $letter_spacing . 'px';
}
if ( in_array( $text_transform, array( 'uppercase', 'lowercase', 'capitalize' ), true ) ) {
	$styles[] = 'text-transform:' . $text_transform;
}
if ( ! empty( $settings['text_shadow'] ) ) {
	$styles[] = 'text-shadow:' . esc_attr( $settings['text_shadow'] );
}
if ( ! empty( $settings['text_decoration'] ) && in_array( $settings['text_decoration'], array( 'underline', 'overline', 'line-through' ), true ) ) {
	$styles[] = 'text-decoration:' . $settings['text_decoration'];
}
if ( isset( $settings['text_overflow_lines'] ) && absint( $settings['text_overflow_lines'] ) > 0 ) {
	$styles[] = 'display:-webkit-box';
	$styles[] = '-webkit-line-clamp:' . absint( $settings['text_overflow_lines'] );
	$styles[] = '-webkit-box-orient:vertical';
	$styles[] = 'overflow:hidden';
}
if ( isset( $settings['word_break'] ) && 'break-word' === $settings['word_break'] ) {
	$styles[] = 'overflow-wrap:anywhere';
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
	$target = ! empty( $settings['link_target_blank'] ) || '_blank' === ( $settings['link_target'] ?? '' );
	$rel = array();
	if ( $target ) { $rel[] = 'noopener'; $rel[] = 'noreferrer'; }
	if ( ! empty( $settings['link_nofollow'] ) ) { $rel[] = 'nofollow'; }
	$heading_content = '<a href="' . esc_url( $link ) . '"' . ( $target ? ' target="_blank"' : '' ) . ( $rel ? ' rel="' . esc_attr( implode( ' ', $rel ) ) . '"' : '' ) . ' style="color:inherit;text-decoration:none;">' . $heading_content . '</a>';
}

$output = '<' . $tag . ' class="xcopb-heading xsb-heading xcopb-widget' . ( $motion_id ? ' xsb-anim-' . esc_attr( $animation ) : '' ) . '"' . ( ! empty( $settings['css_id'] ) ? ' id="' . esc_attr( sanitize_html_class( $settings['css_id'] ) ) . '"' : '' ) . $style_attr . '>' . $heading_content . '</' . $tag . '>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
