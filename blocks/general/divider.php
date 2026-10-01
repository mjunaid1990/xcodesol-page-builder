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
$width = isset( $settings['width'] ) ? min( 100, max( 5, absint( $settings['width'] ) ) ) : 100;
$align = isset( $settings['align'] ) && in_array( $settings['align'], array( 'left', 'center', 'right' ), true ) ? $settings['align'] : 'center';
$label = isset( $settings['label'] ) ? trim( (string) $settings['label'] ) : '';

$allowed_styles = array( 'solid', 'dashed', 'dotted', 'double', 'gradient' );

if ( ! in_array( $style, $allowed_styles, true ) ) {
	$style = 'solid';
}

$line_styles = array( 'width:' . $width . '%', 'height:' . max( 1, $height ) . 'px' );
if ( 'gradient' === $style ) {
	$line_styles[] = 'background:linear-gradient(90deg,' . esc_attr( $color ) . ',' . esc_attr( $settings['gradient_color'] ?? '#4f46e5' ) . ')';
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
$label_style = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:0 10px;background:' . esc_attr( $settings['label_background'] ?? '#fff' ) . ';color:' . esc_attr( $settings['label_color'] ?? '#64748b' ) . ';font-size:' . absint( $settings['label_size'] ?? 14 ) . 'px;white-space:nowrap;';
$html = '<div class="xsb-divider-wrap" style="position:relative;width:100%;margin:' . $margin . 'px 0;text-align:' . esc_attr( $align ) . '"><div class="xsb-divider" style="position:relative;' . esc_attr( implode( ';', $line_styles ) ) . '">';
if ( '' !== $label ) { $html .= '<span style="' . esc_attr( $label_style ) . '">' . esc_html( $label ) . '</span>'; }
$html .= '</div></div>';
echo wp_kses( $html, XCOPB_Block_Registry::allowed_output_html() );
