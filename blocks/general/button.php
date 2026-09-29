<?php
/**
 * Block: Elementor-style Button.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$text = isset( $settings['text'] ) ? (string) $settings['text'] : '';
if ( '' === trim( $text ) ) {
	$text = isset( $settings['button_text'] ) ? (string) $settings['button_text'] : __( 'Click here', 'xcodesol-page-builder' );
}

$link         = ! empty( $settings['link'] ) ? (string) $settings['link'] : '#';
$align        = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$size         = ! empty( $settings['size'] ) ? $settings['size'] : 'md';
$bg_color     = ! empty( $settings['bg_color'] ) ? $settings['bg_color'] : '#2563eb';
$text_color   = ! empty( $settings['text_color'] ) ? $settings['text_color'] : '#ffffff';
$border_rad   = isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 6;
$target_blank = ! empty( $settings['target_blank'] );

$padding_map = array(
	'xs' => '6px 12px; font-size: 12px',
	'sm' => '8px 16px; font-size: 13px',
	'md' => '12px 24px; font-size: 15px',
	'lg' => '16px 32px; font-size: 17px',
	'xl' => '20px 40px; font-size: 19px',
);
$btn_sizing = isset( $padding_map[ $size ] ) ? $padding_map[ $size ] : $padding_map['md'];

$btn_style = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;'
	. 'background-color:' . esc_attr( $bg_color ) . ';'
	. 'color:' . esc_attr( $text_color ) . ';'
	. 'padding:' . $btn_sizing . ';'
	. 'border-radius:' . $border_rad . 'px;'
	. 'text-decoration:none;font-weight:600;line-height:1;transition:all .2s ease;border:none;cursor:pointer;';

$wrap_style = 'text-align:' . esc_attr( $align ) . ';';
foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$wrap_style .= 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px;';
	}
}

$target_attr = $target_blank ? ' target="_blank" rel="noopener noreferrer"' : '';

$output = '<div class="xcopb-button-wrapper xsb-button-wrapper" style="' . esc_attr( $wrap_style ) . '">'
	. '<a href="' . esc_url( $link ) . '" class="xcopb-button xsb-button xcopb-widget" style="' . esc_attr( $btn_style ) . '"' . $target_attr . '>'
	. esc_html( $text )
	. '</a>'
	. '</div>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
