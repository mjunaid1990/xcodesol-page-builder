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
$image_source = isset( $settings['image_source'] ) ? sanitize_key( $settings['image_source'] ) : 'upload';
if ( in_array( $image_source, array( 'featured_image', 'acf' ), true ) ) {
	$url = '';
}

// Dynamic ACF image fields are resolved for the post currently being rendered.
if ( 'featured_image' === $image_source ) {
	$featured_post_id = function_exists( 'get_queried_object_id' ) ? absint( get_queried_object_id() ) : 0;
	if ( ! $featured_post_id ) {
		$featured_post_id = get_the_ID();
	}
	$featured_image_id = $featured_post_id ? get_post_thumbnail_id( $featured_post_id ) : 0;
	if ( $featured_image_id ) {
		$url = (string) wp_get_attachment_image_url( $featured_image_id, 'full' );
		if ( empty( $settings['alt'] ) ) {
			$settings['alt'] = get_post_meta( $featured_image_id, '_wp_attachment_image_alt', true );
		}
	}
} elseif ( 'acf' === $image_source && ! empty( $settings['acf_field'] ) && function_exists( 'get_field' ) ) {
	$acf_post_id = function_exists( 'get_queried_object_id' ) ? absint( get_queried_object_id() ) : 0;
	if ( ! $acf_post_id ) {
		$acf_post_id = get_the_ID();
	}
	$acf_image = get_field( sanitize_text_field( $settings['acf_field'] ), $acf_post_id );
	if ( is_array( $acf_image ) ) {
		$url = isset( $acf_image['url'] ) ? (string) $acf_image['url'] : '';
		$acf_image_id = absint( $acf_image['ID'] ?? $acf_image['id'] ?? 0 );
		if ( '' === $url && $acf_image_id ) {
			$url = (string) wp_get_attachment_image_url( $acf_image_id, 'full' );
		}
		if ( empty( $settings['alt'] ) && ! empty( $acf_image['alt'] ) ) {
			$settings['alt'] = $acf_image['alt'];
		}
	} elseif ( is_numeric( $acf_image ) ) {
		$url = (string) wp_get_attachment_image_url( absint( $acf_image ), 'full' );
	} elseif ( is_string( $acf_image ) ) {
		$url = $acf_image;
	}
}

if ( '' === trim( $url ) && ! empty( $settings['image'] ) && in_array( $image_source, array( '', 'upload' ), true ) ) {
	$url = (string) $settings['image'];
}

if ( '' === trim( $url ) ) {
	// Fallback placeholder for empty image in builder
	$url = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="130" viewBox="0 0 600 130" fill="%23f1f5f9"><rect width="600" height="130" fill="%23f1f5f9"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2394a3b8">Choose an image</text></svg>';
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
	'display:block',
	'width:100%',
	'max-width:' . ( is_numeric( $max_width ) ? $max_width . 'px' : esc_attr( $max_width ) ),
	'height:130px',
	'object-fit:cover',
);
if ( '' !== $width ) {
	$img_styles[1] = 'width:' . ( is_numeric( $width ) ? $width . 'px' : esc_attr( $width ) );
}
if ( is_numeric( $max_width ) && (float) $max_width > 0 ) {
	$img_styles[2] = 'max-width:' . (float) $max_width . 'px';
}
if ( isset( $settings['height'] ) && is_numeric( $settings['height'] ) && (float) $settings['height'] > 0 ) {
	$img_styles[3] = 'height:' . (float) $settings['height'] . 'px';
}
if ( in_array( $object_fit, array( 'cover', 'contain', 'fill', 'none', 'scale-down' ), true ) ) {
	$img_styles[4] = 'object-fit:' . $object_fit;
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
	'width:100%',
	'box-sizing:border-box',
	'text-align:' . esc_attr( $align ),
);
$frame_background = isset( $settings['background'] ) ? sanitize_text_field( $settings['background'] ) : ( isset( $settings['bg_color'] ) ? sanitize_text_field( $settings['bg_color'] ) : '' );
if ( '' !== $frame_background && ( sanitize_hex_color( $frame_background ) || 'transparent' === $frame_background || preg_match( '/^rgba?\([0-9.,\s%]+\)$/', $frame_background ) ) ) {
	$wrap_styles[] = 'background:' . esc_attr( $frame_background );
}
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
