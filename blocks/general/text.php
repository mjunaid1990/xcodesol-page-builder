<?php
/**
 * Block: General Text.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$content = isset( $settings['content'] ) ? $settings['content'] : '';
$tag     = ! empty( $settings['tag'] ) ? $settings['tag'] : 'p';
$color   = ! empty( $settings['color'] ) ? $settings['color'] : '';
$align   = ! empty( $settings['align'] ) ? $settings['align'] : 'left';

// Typography (all optional – only output when explicitly set).
$font_size     = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? $settings['font_size'] : '';
$font_weight   = ! empty( $settings['font_weight'] ) ? $settings['font_weight'] : '';
$line_height   = isset( $settings['line_height'] ) && '' !== $settings['line_height'] ? $settings['line_height'] : '';
$letter_spacing = isset( $settings['letter_spacing'] ) && '' !== $settings['letter_spacing'] ? $settings['letter_spacing'] : '';

// Border + entrance animation.
$border_width  = isset( $settings['border_width'] ) ? max( 0, absint( $settings['border_width'] ) ) : 0;
$border_style  = ! empty( $settings['border_style'] ) ? $settings['border_style'] : 'solid';
$border_color  = ! empty( $settings['border_color'] ) ? $settings['border_color'] : '';
$border_radius = isset( $settings['border_radius'] ) ? max( 0, absint( $settings['border_radius'] ) ) : 0;
$animation     = isset( $settings['animation'] ) ? $settings['animation'] : 'none';
$anim_duration = isset( $settings['animation_duration'] ) ? absint( $settings['animation_duration'] ) : 600;
$anim_delay    = isset( $settings['animation_delay'] ) ? absint( $settings['animation_delay'] ) : 0;

// Per-side margins (only sides that were explicitly set are emitted).
$margins = array();
foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$margin_key = 'margin_' . $side;
	if ( isset( $settings[ $margin_key ] ) && '' !== $settings[ $margin_key ] ) {
		$margins[ $side ] = (float) $settings[ $margin_key ];
	}
}

$allowed_tags = array( 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'blockquote' );
$anim_list    = array( 'fade-in', 'slide-up', 'slide-down', 'zoom-in' );

if ( ! in_array( $tag, $allowed_tags, true ) ) {
	$tag = 'p';
}

if ( '' === $content ) {
	return;
}

$style = '';
$has_extra = '' !== $color || 'left' !== $align || '' !== $font_size || '' !== $font_weight || '' !== $line_height || '' !== $letter_spacing || $border_width > 0 || $border_radius > 0 || ! empty( $margins );
if ( $has_extra ) {
	$style .= ' style="';
	if ( '' !== $color ) {
		$style .= 'color:' . esc_attr( $color ) . ';';
	}
	if ( 'left' !== $align ) {
		$style .= 'text-align:' . esc_attr( $align ) . ';';
	}
	if ( '' !== $font_size ) {
		$style .= 'font-size:' . absint( $font_size ) . 'px;';
	}
	if ( '' !== $font_weight ) {
		$style .= 'font-weight:' . esc_attr( $font_weight ) . ';';
	}
	if ( '' !== $line_height ) {
		$style .= 'line-height:' . esc_attr( $line_height ) . ';';
	}
	if ( '' !== $letter_spacing ) {
		$style .= 'letter-spacing:' . (float) $letter_spacing . 'px;';
	}
	if ( $border_width > 0 ) {
		$style .= 'border:' . $border_width . 'px ' . esc_attr( $border_style ) . ' ' . esc_attr( $border_color ? $border_color : '#000000' ) . ';';
	}
	if ( $border_radius > 0 ) {
		$style .= 'border-radius:' . $border_radius . 'px;';
	}
	if ( $border_width > 0 || $border_radius > 0 ) {
		$style .= 'box-sizing:border-box;';
	}
	if ( ! empty( $margins ) ) {
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			if ( isset( $margins[ $side ] ) ) {
				$style .= 'margin-' . $side . ':' . $margins[ $side ] . 'px;';
			}
		}
	}
	$style .= '"';
}

// Entrance animation (class carries the keyframes; duration/delay inline).
$anim_class = '';
if ( 'none' !== $animation && in_array( $animation, $anim_list, true ) ) {
	$anim_class = ' xsb-anim-' . $animation;
	$duration_delay = ' animation-duration:' . $anim_duration . 'ms; animation-delay:' . $anim_delay . 'ms;';
	if ( '' === $style ) {
		$style = ' style="' . trim( $duration_delay, ' ;' ) . '"';
	} else {
		$style = substr( $style, 0, -1 ) . $duration_delay . '"';
	}
}

echo wp_kses( sprintf(
	'<%1$s class="xsb-text-block%2$s"%3$s>%4$s</%1$s>',
	$tag,
	$anim_class,
	$style,
	wp_kses_post( $content )
), XCOPB_Block_Registry::allowed_output_html() );