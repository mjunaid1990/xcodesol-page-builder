<?php
/**
 * Block: General Text.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$content = isset( $settings['content'] ) ? $settings['content'] : '';
if ( 'dynamic' === ( $settings['content_source'] ?? 'static' ) ) {
	$content = XCOPB_Block_Registry::resolve_dynamic_value( $settings['dynamic_source'] ?? 'post_title' );
}
$tag     = ! empty( $settings['tag'] ) ? $settings['tag'] : 'p';
$color   = ! empty( $settings['color'] ) ? $settings['color'] : '';
$align   = ! empty( $settings['align'] ) ? $settings['align'] : 'left';

// Typography (all optional – only output when explicitly set).
$font_size     = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? $settings['font_size'] : '';
$font_weight   = ! empty( $settings['font_weight'] ) ? $settings['font_weight'] : '';
$line_height   = isset( $settings['line_height'] ) && '' !== $settings['line_height'] ? $settings['line_height'] : '';
$letter_spacing = isset( $settings['letter_spacing'] ) && '' !== $settings['letter_spacing'] ? $settings['letter_spacing'] : '';
$font_family    = ! empty( $settings['font_family'] ) ? $settings['font_family'] : '';
$text_transform = ! empty( $settings['text_transform'] ) ? $settings['text_transform'] : '';
$font_style     = isset( $settings['font_style'] ) && in_array( $settings['font_style'], array( 'normal', 'italic', 'oblique' ), true ) ? $settings['font_style'] : 'normal';
$text_columns   = isset( $settings['text_columns'] ) ? min( 3, max( 1, absint( $settings['text_columns'] ) ) ) : 1;
$column_gap     = isset( $settings['column_gap'] ) ? absint( $settings['column_gap'] ) : 24;
$paragraph_spacing = isset( $settings['paragraph_spacing'] ) ? absint( $settings['paragraph_spacing'] ) : 16;

// Border + entrance animation.
$border_width  = isset( $settings['border_width'] ) ? max( 0, absint( $settings['border_width'] ) ) : 0;
$border_style  = ! empty( $settings['border_style'] ) ? $settings['border_style'] : 'solid';
$border_color  = ! empty( $settings['border_color'] ) ? $settings['border_color'] : '';
$border_style  = isset( $settings['border_style'] ) && in_array( $settings['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $settings['border_style'] : 'solid';
$border_radius = isset( $settings['border_radius'] ) ? max( 0, absint( $settings['border_radius'] ) ) : 0;
$padding       = isset( $settings['padding'] ) ? min( 100, absint( $settings['padding'] ) ) : 0;
$background_color = isset( $settings['background_color'] ) && class_exists( 'XCOPB_Sanitizer' ) ? XCOPB_Sanitizer::sanitize_color( $settings['background_color'] ) : '';
$opacity = isset( $settings['opacity'] ) && is_numeric( $settings['opacity'] ) ? min( 100, max( 0, (float) $settings['opacity'] ) ) / 100 : 1;
$animation     = class_exists( 'XCOPB_Motion_Presets' ) ? XCOPB_Motion_Presets::normalize_id( $settings['animation'] ?? 'none' ) : ( is_string( $settings['animation'] ?? null ) ? sanitize_key( $settings['animation'] ) : 'none' );
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
$anim_list    = class_exists( 'XCOPB_Motion_Presets' ) ? array_slice( XCOPB_Motion_Presets::ids(), 1 ) : array( 'fade-in', 'slide-up', 'slide-down', 'zoom-in' );

if ( ! in_array( $tag, $allowed_tags, true ) ) {
	$tag = 'p';
}

if ( '' === $content ) {
	return;
}

$style = '';
$has_extra = '' !== $color || 'left' !== $align || '' !== $font_size || '' !== $font_weight || '' !== $line_height || '' !== $letter_spacing || '' !== $font_family || '' !== $text_transform || 'normal' !== $font_style || $border_width > 0 || $border_radius > 0 || $padding > 0 || ! empty( $margins ) || $text_columns > 1 || 16 !== $paragraph_spacing || ! empty( $settings['blockquote_background'] ) || '' !== $background_color || ! empty( $settings['link_color'] ) || ! empty( $settings['text_shadow'] ) || 1 !== $opacity;
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
	if ( '' !== $font_family ) { $style .= 'font-family:' . esc_attr( $font_family ) . ';'; }
	if ( 'normal' !== $font_style ) { $style .= 'font-style:' . $font_style . ';'; }
	if ( in_array( $text_transform, array( 'uppercase', 'lowercase', 'capitalize' ), true ) ) { $style .= 'text-transform:' . $text_transform . ';'; }
	if ( isset( $settings['text_decoration'] ) && in_array( $settings['text_decoration'], array( 'none', 'underline', 'overline', 'line-through' ), true ) ) { $style .= 'text-decoration-line:' . $settings['text_decoration'] . ';'; }
	if ( isset( $settings['text_decoration_style'] ) && in_array( $settings['text_decoration_style'], array( 'solid', 'double', 'dotted', 'dashed', 'wavy' ), true ) ) { $style .= 'text-decoration-style:' . $settings['text_decoration_style'] . ';'; }
	if ( ! empty( $settings['text_decoration_color'] ) ) { $style .= 'text-decoration-color:' . esc_attr( $settings['text_decoration_color'] ) . ';'; }
	if ( ! empty( $settings['text_shadow'] ) && class_exists( 'XCOPB_Sanitizer' ) ) { $style .= 'text-shadow:' . XCOPB_Sanitizer::sanitize_css_fragment( $settings['text_shadow'] ) . ';'; }
	if ( isset( $settings['word_break'] ) && in_array( $settings['word_break'], array( 'normal', 'break-word', 'keep-all' ), true ) ) { $style .= 'overflow-wrap:' . ( 'break-word' === $settings['word_break'] ? 'anywhere' : 'normal' ) . ';word-break:' . ( 'keep-all' === $settings['word_break'] ? 'keep-all' : 'normal' ) . ';'; }
	if ( '' !== $background_color ) { $style .= 'background-color:' . esc_attr( $background_color ) . ';'; }
	if ( ! empty( $settings['link_color'] ) && class_exists( 'XCOPB_Sanitizer' ) ) { $style .= '--xsb-text-link-color:' . XCOPB_Sanitizer::sanitize_color( $settings['link_color'] ) . ';'; }
	if ( 1 !== $opacity ) { $style .= 'opacity:' . $opacity . ';'; }
	if ( $text_columns > 1 ) { $style .= 'columns:' . $text_columns . ';column-gap:' . $column_gap . 'px;'; }
	if ( ! empty( $settings['blockquote_background'] ) ) { $style .= 'background:' . esc_attr( $settings['blockquote_background'] ) . ';'; }
	if ( ! empty( $settings['blockquote_color'] ) ) { $style .= 'border-left:' . max( 2, $border_width ) . 'px solid ' . esc_attr( $settings['blockquote_color'] ) . ';'; }
	if ( $border_width > 0 ) {
		$style .= 'border:' . $border_width . 'px ' . esc_attr( $border_style ) . ' ' . esc_attr( $border_color ? $border_color : '#000000' ) . ';';
	}
	if ( $border_radius > 0 ) {
		$style .= 'border-radius:' . $border_radius . 'px;';
	}
	if ( $border_width > 0 || $border_radius > 0 ) {
		$style .= 'box-sizing:border-box;';
	}
	if ( $padding > 0 ) { $style .= 'padding:' . $padding . 'px;'; }
	if ( ! empty( $margins ) ) {
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			if ( isset( $margins[ $side ] ) ) {
				$style .= 'margin-' . $side . ':' . $margins[ $side ] . 'px;';
			}
		}
	}
	$style .= '--xsb-text-paragraph-gap:' . $paragraph_spacing . 'px;';
	$style .= '"';
}

// Entrance animation (class carries the keyframes; duration/delay inline).
$anim_class = '';
if ( 'none' !== $animation && in_array( $animation, $anim_list, true ) ) {
	$anim_class = ' xsb-anim-' . $animation;
	$animation_keyframe = class_exists( 'XCOPB_Motion_Presets' ) ? XCOPB_Motion_Presets::keyframe( $animation ) : 'xsb-' . $animation;
	$animation_easing = isset( $settings['animation_easing'] ) && in_array( $settings['animation_easing'], array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ), true ) ? $settings['animation_easing'] : 'ease';
	$animation_repeat = isset( $settings['animation_repeat'] ) && in_array( (string) $settings['animation_repeat'], array( '1', '2', '3', 'infinite' ), true ) ? $settings['animation_repeat'] : '1';
	$duration_delay = ' animation-name:' . esc_attr( $animation_keyframe ) . '; animation-duration:' . $anim_duration . 'ms; animation-delay:' . $anim_delay . 'ms; animation-timing-function:' . esc_attr( $animation_easing ) . '; animation-iteration-count:' . esc_attr( $animation_repeat ) . ';';
	if ( '' === $style ) {
		$style = ' style="' . trim( $duration_delay, ' ;' ) . '"';
	} else {
		$style = substr( $style, 0, -1 ) . $duration_delay . '"';
	}
}

echo wp_kses( sprintf(
	'<%1$s class="xsb-text-block%2$s%3$s"%4$s>%5$s</%1$s>',
	$tag,
	$anim_class,
	! empty( $settings['drop_cap'] ) ? ' xsb-text-block--drop-cap' : '',
	$style,
	wp_kses( $content, XCOPB_Block_Registry::allowed_output_html() )
), XCOPB_Block_Registry::allowed_output_html() );
