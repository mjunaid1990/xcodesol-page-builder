<?php
/**
 * Block: WordPress Text Widget.
 *
 * Behaves like the classic WordPress "Text" widget: an optional title plus
 * rich-text content, run through wpautop().
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$xsb_title   = isset( $settings['title'] ) ? trim( $settings['title'] ) : '';
$xsb_content = isset( $settings['content'] ) ? (string) $settings['content'] : '';

if ( '' === $xsb_title && '' === trim( $xsb_content ) ) {
	return;
}

// Title/content presentation rides on CSS custom properties consumed by the
// public stylesheet; wrapper spacing/typography defaults are inline.
$vars = array();
if ( ! empty( $settings['title_color'] ) ) {
	$vars['--xsb-twt-title-fg'] = $settings['title_color'];
}
if ( isset( $settings['title_font_size'] ) && '' !== $settings['title_font_size'] ) {
	$vars['--xsb-twt-title-fs'] = absint( $settings['title_font_size'] ) . 'px';
}
if ( ! empty( $settings['title_font_weight'] ) ) {
	$vars['--xsb-twt-title-fw'] = $settings['title_font_weight'];
}
if ( ! empty( $settings['color'] ) ) {
	$vars['--xsb-twt-content-fg'] = $settings['color'];
}
if ( isset( $settings['font_size'] ) && '' !== $settings['font_size'] ) {
	$vars['--xsb-twt-content-fs'] = absint( $settings['font_size'] ) . 'px';
}
if ( ! empty( $settings['font_weight'] ) ) {
	$vars['--xsb-twt-content-fw'] = $settings['font_weight'];
}
if ( isset( $settings['line_height'] ) && '' !== $settings['line_height'] ) {
	$vars['--xsb-twt-content-lh'] = (float) $settings['line_height'];
}
if ( ! empty( $settings['align'] ) && 'left' !== $settings['align'] ) {
	$vars['--xsb-twt-align'] = $settings['align'];
}
if ( ! empty( $settings['font_family'] ) ) { $vars['--xsb-twt-content-ff'] = $settings['font_family']; }

// Margins only inline (typography travels through the vars above).
$wrap_props = $vars;
foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$key = 'margin_' . $side;
	if ( isset( $settings[ $key ] ) && '' !== $settings[ $key ] ) {
		$wrap_props[ 'margin-' . $side ] = (float) $settings[ $key ] . 'px';
	}
}

$xsb_output  = '<div class="xsb-text-widget"' . XCOPB_Block_Registry::inline_style_attr( $wrap_props ) . '>';
if ( '' !== $xsb_title ) {
	$xsb_output .= '<div class="xsb-text-widget-title">' . esc_html( $xsb_title ) . '</div>';
}
if ( '' !== trim( $xsb_content ) ) {
	$xsb_output .= '<div class="xsb-text-widget-content">' . wpautop( $xsb_content ) . '</div>';
}
$xsb_output .= '</div>';

echo wp_kses( $xsb_output, XCOPB_Block_Registry::allowed_output_html() );
