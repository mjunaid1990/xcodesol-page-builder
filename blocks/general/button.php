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
$target_blank = $target_blank || ! empty( $settings['link_target_blank'] ) || '_blank' === ( $settings['link_target'] ?? '' );
$nofollow = ! empty( $settings['link_nofollow'] );

$padding_map = array(
	'xs' => '6px 12px; font-size: 12px',
	'sm' => '8px 16px; font-size: 13px',
	'md' => '12px 24px; font-size: 15px',
	'lg' => '16px 32px; font-size: 17px',
	'xl' => '20px 40px; font-size: 19px',
);
$btn_sizing = isset( $padding_map[ $size ] ) ? $padding_map[ $size ] : $padding_map['md'];
$padding_x = isset( $settings['padding_x'] ) ? max( 0, (float) $settings['padding_x'] ) : null;
$padding_y = isset( $settings['padding_y'] ) ? max( 0, (float) $settings['padding_y'] ) : null;
$font_size = isset( $settings['font_size'] ) ? max( 8, (float) $settings['font_size'] ) : null;
$font_weight = isset( $settings['font_weight'] ) ? $settings['font_weight'] : '600';
$size_map = array( 'xs' => array( 12, 6, 12 ), 'sm' => array( 13, 8, 16 ), 'md' => array( 15, 12, 24 ), 'lg' => array( 17, 16, 32 ), 'xl' => array( 19, 20, 40 ) );
$size_values = isset( $size_map[ $size ] ) ? $size_map[ $size ] : $size_map['md'];

$btn_style = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;'
	. 'background-color:' . esc_attr( $bg_color ) . ';'
	. 'color:' . esc_attr( $text_color ) . ';'
	. 'padding:' . $size_values[1] . 'px ' . $size_values[2] . 'px;'
	. 'border-radius:' . $border_rad . 'px;'
	. 'text-decoration:none;font-weight:' . esc_attr( $font_weight ) . ';line-height:1;transition:all .2s ease;cursor:pointer;';
if ( null !== $padding_x || null !== $padding_y ) { $btn_style .= 'padding:' . ( null !== $padding_y ? $padding_y : $size_values[1] ) . 'px ' . ( null !== $padding_x ? $padding_x : $size_values[2] ) . 'px;'; }
$btn_style .= 'font-size:' . ( null !== $font_size ? $font_size : $size_values[0] ) . 'px;';
if ( ! empty( $settings['font_family'] ) ) { $btn_style .= 'font-family:' . esc_attr( $settings['font_family'] ) . ';'; }
if ( isset( $settings['letter_spacing'] ) ) { $btn_style .= 'letter-spacing:' . (float) $settings['letter_spacing'] . 'px;'; }
if ( ! empty( $settings['text_transform'] ) && in_array( $settings['text_transform'], array( 'uppercase', 'lowercase', 'capitalize' ), true ) ) { $btn_style .= 'text-transform:' . $settings['text_transform'] . ';'; }
if ( ! empty( $settings['border_style'] ) && 'none' !== $settings['border_style'] ) {
	$btn_style .= 'border:' . max( 1, absint( $settings['border_width'] ?? 1 ) ) . 'px ' . esc_attr( $settings['border_style'] ) . ' ' . esc_attr( $settings['border_color'] ?? $bg_color ) . ';';
} else { $btn_style .= 'border:0;'; }
$shadow_map = array( 'soft' => '0 4px 14px rgba(0,0,0,.12)', 'medium' => '0 10px 28px rgba(0,0,0,.18)', 'strong' => '0 18px 50px rgba(0,0,0,.28)' );
if ( isset( $shadow_map[ $settings['box_shadow'] ?? '' ] ) ) { $btn_style .= 'box-shadow:' . $shadow_map[ $settings['box_shadow'] ] . ';'; }

$wrap_style = 'text-align:' . esc_attr( $align ) . ';';
foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$wrap_style .= 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px;';
	}
}

$rel = array();
if ( $target_blank ) { $rel[] = 'noopener'; $rel[] = 'noreferrer'; }
if ( $nofollow ) { $rel[] = 'nofollow'; }
$target_attr = ( $target_blank ? ' target="_blank"' : '' ) . ( $rel ? ' rel="' . esc_attr( implode( ' ', $rel ) ) . '"' : '' );
$icon = ! empty( $settings['icon'] ) && preg_match( '/^dashicons-[a-z0-9-]+$/', $settings['icon'] ) ? '<span class="dashicons ' . esc_attr( $settings['icon'] ) . '" aria-hidden="true"></span> ' : '';

$output = '<div class="xcopb-button-wrapper xsb-button-wrapper" style="' . esc_attr( $wrap_style ) . '">'
	. '<a href="' . esc_url( $link ) . '" class="xcopb-button xsb-button xcopb-widget" style="' . esc_attr( $btn_style ) . '"' . $target_attr . '>'
	. $icon . esc_html( $text )
	. '</a>'
	. '</div>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
