<?php
/**
 * Block: Elementor-style Image.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$media = isset( $settings['url'] ) ? $settings['url'] : '';
$url = is_array( $media ) ? (string) ( $media['url'] ?? '' ) : (string) $media;
if ( '' === trim( $url ) && ! empty( $settings['image'] ) ) {
	$url = (string) $settings['image'];
}

if ( '' === trim( $url ) ) {
	// Fallback placeholder for empty image in builder
	$url = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" fill="%23f1f5f9"><rect width="600" height="350" fill="%23f1f5f9"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%2394a3b8">Choose an image</text></svg>';
}

$alt         = isset( $settings['alt'] ) ? (string) $settings['alt'] : ( is_array( $media ) ? (string) ( $media['alt'] ?? '' ) : '' );
$caption     = isset( $settings['caption'] ) ? (string) $settings['caption'] : '';
$link        = isset( $settings['link'] ) ? (string) $settings['link'] : '';
$align       = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$width       = isset( $settings['width'] ) && '' !== $settings['width'] ? $settings['width'] : '';
$max_width   = isset( $settings['max_width'] ) && '' !== $settings['max_width'] && (float) $settings['max_width'] > 0 ? $settings['max_width'] : '100%';
$border_rad  = isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 0;
$box_shadow  = ! empty( $settings['box_shadow'] ) ? $settings['box_shadow'] : '';
$object_fit = ! empty( $settings['object_fit'] ) ? $settings['object_fit'] : '';
$object_position = ! empty( $settings['object_position'] ) ? $settings['object_position'] : '';

$img_styles = array(
	'display:inline-block',
	'max-width:' . ( is_numeric( $max_width ) ? $max_width . 'px' : esc_attr( $max_width ) ),
	'height:auto',
);
if ( '' !== $width ) {
	$img_styles[] = 'width:' . ( is_numeric( $width ) ? $width . 'px' : esc_attr( $width ) );
}
if ( is_numeric( $max_width ) && (float) $max_width > 0 ) {
	$img_styles[1] = 'max-width:' . (float) $max_width . 'px';
}
if ( isset( $settings['height'] ) && is_numeric( $settings['height'] ) && (float) $settings['height'] > 0 ) {
	$img_styles[] = 'height:' . (float) $settings['height'] . 'px';
}
if ( in_array( $object_fit, array( 'cover', 'contain', 'fill', 'none', 'scale-down' ), true ) ) {
	$img_styles[] = 'object-fit:' . $object_fit;
}
if ( preg_match( '/^(center|top|bottom|left|right)( (center|top|bottom|left|right))?$/', $object_position ) ) {
	$img_styles[] = 'object-position:' . esc_attr( $object_position );
}
if ( $border_rad > 0 ) {
	$img_styles[] = 'border-radius:' . $border_rad . 'px';
}
if ( '' !== $box_shadow ) {
	$img_styles[] = 'box-shadow:' . esc_attr( $box_shadow );
}
if ( isset( $settings['grayscale'] ) && (float) $settings['grayscale'] > 0 ) {
	$img_styles[] = 'filter:grayscale(' . min( 100, max( 0, (float) $settings['grayscale'] ) ) . '%)';
}

$wrap_styles = array(
	'text-align:' . esc_attr( $align ),
);
foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$wrap_styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$img_tag = '<img src="' . esc_url( $url ) . '" alt="' . esc_attr( $alt ) . '" style="' . esc_attr( implode( ';', $img_styles ) ) . ';" class="xcopb-image-element xsb-image-element" />';

if ( '' !== trim( $link ) ) {
	$target = ! empty( $settings['link_target'] ) || ! empty( $settings['target_blank'] );
	$rel = $target ? ' rel="noopener noreferrer"' : '';
	$img_tag = '<a href="' . esc_url( $link ) . '"' . ( $target ? ' target="_blank"' : '' ) . $rel . ' style="display:inline-block;">' . $img_tag . '</a>';
}

$output = '<div class="xcopb-image-wrapper xsb-image-wrapper xcopb-widget" style="' . esc_attr( implode( ';', $wrap_styles ) ) . '">'
	. $img_tag;

if ( '' !== trim( $caption ) ) {
	$output .= '<figcaption class="xcopb-image-caption" style="font-size:13px;color:#64748b;margin-top:6px;">' . esc_html( $caption ) . '</figcaption>';
}

$output .= '</div>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
