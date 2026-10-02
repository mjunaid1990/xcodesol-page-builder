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
$line_opacity = isset( $settings['line_opacity'] ) && is_numeric( $settings['line_opacity'] ) ? min( 100, max( 0, (float) $settings['line_opacity'] ) ) / 100 : 1;
$line_radius = isset( $settings['line_radius'] ) ? min( 100, absint( $settings['line_radius'] ) ) : 0;
$gradient_angle = isset( $settings['gradient_angle'] ) ? min( 360, max( 0, absint( $settings['gradient_angle'] ) ) ) : 90;
$width = isset( $settings['width'] ) ? min( 100, max( 5, absint( $settings['width'] ) ) ) : 100;
$align = isset( $settings['align'] ) && in_array( $settings['align'], array( 'left', 'center', 'right' ), true ) ? $settings['align'] : 'center';
$label = isset( $settings['label'] ) ? trim( (string) $settings['label'] ) : '';
if ( 'dynamic' === ( $settings['label_source'] ?? 'static' ) ) {
	$label = wp_strip_all_tags( XCOPB_Block_Registry::resolve_dynamic_value( $settings['label_dynamic_source'] ?? 'post_title' ) );
}

$allowed_styles = array( 'solid', 'dashed', 'dotted', 'double', 'gradient' );

if ( ! in_array( $style, $allowed_styles, true ) ) {
	$style = 'solid';
}

$line_styles = array( 'width:' . $width . '%', 'height:' . max( 1, $height ) . 'px' );
if ( 'gradient' === $style ) {
	$line_styles[] = 'background:linear-gradient(' . $gradient_angle . 'deg,' . esc_attr( $color ) . ',' . esc_attr( $settings['gradient_color'] ?? '#4f46e5' ) . ')';
	$line_styles[] = 'border:0';
} elseif ( 'double' === $style ) {
	$line_styles[] = 'border-top:' . max( 1, $height ) . 'px double ' . esc_attr( $color );
	$line_styles[] = 'background:transparent';
} else {
	$line_styles[] = 'border:0';
	$line_styles[] = 'background:' . esc_attr( $color );
	if ( in_array( $style, array( 'dashed', 'dotted' ), true ) ) {
		$line_styles[] = 'height:0';
		$line_styles[] = 'border-top:' . max( 1, $height ) . 'px ' . $style . ' ' . esc_attr( $color );
		$line_styles[] = 'background:transparent';
	}
}
$line_styles[] = 'margin-left:' . ( 'left' === $align ? '0' : 'auto' );
$line_styles[] = 'margin-right:' . ( 'right' === $align ? '0' : 'auto' );
$line_styles[] = 'border-radius:' . $line_radius . 'px';
$line_styles[] = 'opacity:' . $line_opacity;
$line_shadow_map = array( 'soft' => '0 2px 8px rgba(15,23,42,.14)', 'medium' => '0 4px 14px rgba(15,23,42,.18)', 'strong' => '0 8px 24px rgba(15,23,42,.24)' );
if ( isset( $line_shadow_map[ $settings['line_shadow'] ?? '' ] ) ) { $line_styles[] = 'box-shadow:' . $line_shadow_map[ $settings['line_shadow'] ]; }
$label_style = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:0 ' . min( 60, absint( $settings['label_padding'] ?? 10 ) ) . 'px;background:' . esc_attr( $settings['label_background'] ?? '#fff' ) . ';color:' . esc_attr( $settings['label_color'] ?? '#64748b' ) . ';font-size:' . absint( $settings['label_size'] ?? 14 ) . 'px;font-weight:' . esc_attr( $settings['label_font_weight'] ?? '400' ) . ';letter-spacing:' . (float) ( $settings['label_letter_spacing'] ?? 0 ) . 'px;white-space:nowrap;';
if ( ! empty( $settings['label_font_family'] ) ) { $label_style .= 'font-family:' . esc_attr( $settings['label_font_family'] ) . ';'; }
$html = '<div class="xsb-divider-wrap" style="position:relative;width:100%;margin:' . $margin . 'px 0;text-align:' . esc_attr( $align ) . '"><div class="xsb-divider" style="position:relative;' . esc_attr( implode( ';', $line_styles ) ) . '">';
if ( '' !== $label ) { $html .= '<span style="' . esc_attr( $label_style ) . '">' . esc_html( $label ) . '</span>'; }
$html .= '</div></div>';
echo wp_kses( $html, XCOPB_Block_Registry::allowed_output_html() );
