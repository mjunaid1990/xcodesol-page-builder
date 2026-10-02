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
if ( 'dynamic' === ( $settings['alt_source'] ?? 'static' ) ) {
	$alt = wp_strip_all_tags( XCOPB_Block_Registry::resolve_dynamic_value( $settings['alt_dynamic_source'] ?? 'post_title' ) );
}
if ( 'dynamic' === ( $settings['caption_source'] ?? 'static' ) ) {
	$caption = wp_strip_all_tags( XCOPB_Block_Registry::resolve_dynamic_value( $settings['caption_dynamic_source'] ?? 'post_title' ) );
}
$link        = isset( $settings['link'] ) ? (string) $settings['link'] : '';
$align       = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$width       = isset( $settings['width'] ) && '' !== $settings['width'] ? $settings['width'] : '';
$max_width   = isset( $settings['max_width'] ) && '' !== $settings['max_width'] && (float) $settings['max_width'] > 0 ? $settings['max_width'] : '100%';
$border_rad  = isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 0;
$border_width = isset( $settings['border_width'] ) ? min( 30, absint( $settings['border_width'] ) ) : 0;
$border_style = isset( $settings['border_style'] ) && in_array( $settings['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $settings['border_style'] : 'solid';
$border_color = isset( $settings['border_color'] ) && class_exists( 'XCOPB_Sanitizer' ) ? XCOPB_Sanitizer::sanitize_color( $settings['border_color'] ) : '#e2e8f0';
$box_shadow  = ! empty( $settings['box_shadow'] ) ? $settings['box_shadow'] : '';
$object_fit = ! empty( $settings['object_fit'] ) ? $settings['object_fit'] : '';
$object_position = ! empty( $settings['object_position'] ) ? $settings['object_position'] : '';
$image_style_settings = $settings;
if ( empty( $image_style_settings['bg_size'] ) ) {
	$legacy_fit = array( 'cover' => 'cover', 'contain' => 'contain', 'fill' => '100% 100%', 'none' => 'auto', 'scale-down' => 'contain' );
	$image_style_settings['bg_size'] = isset( $legacy_fit[ $object_fit ] ) ? $legacy_fit[ $object_fit ] : 'cover';
}
if ( empty( $image_style_settings['bg_position'] ) && '' !== $object_position ) {
	$image_style_settings['bg_position'] = $object_position;
}
$background_image_decls = XCOPB_Block_Registry::background_image_decls( $image_style_settings );
$image_object_fit = 'auto' === $image_style_settings['bg_size'] ? 'none' : ( '100% 100%' === $image_style_settings['bg_size'] ? 'fill' : ( in_array( $image_style_settings['bg_size'], array( 'cover', 'contain', 'fill', 'none', 'scale-down' ), true ) ? $image_style_settings['bg_size'] : 'cover' ) );

$img_styles = array(
	'display:block',
	'width:100%',
	'max-width:' . ( is_numeric( $max_width ) ? $max_width . 'px' : esc_attr( $max_width ) ),
	'height:130px',
	'object-fit:' . $image_object_fit,
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
$img_styles[] = 'background-image:url("' . esc_url( $url ) . '")';
$img_styles = array_merge( $img_styles, $background_image_decls );
if ( $border_rad > 0 ) {
	$img_styles[] = 'border-radius:' . $border_rad . 'px';
}
if ( $border_width > 0 ) {
	$img_styles[] = 'border:' . $border_width . 'px ' . $border_style . ' ' . esc_attr( $border_color );
}
if ( '' !== $box_shadow ) {
	$image_shadow = XCOPB_Block_Registry::shadow_preset( $box_shadow );
	if ( '' !== $image_shadow ) { $img_styles[] = 'box-shadow:' . $image_shadow; }
}
$image_filter = XCOPB_Block_Registry::image_filter_css( $settings );
if ( '' !== $image_filter ) {
	$img_styles[] = 'filter:' . $image_filter;
}
if ( isset( $settings['opacity'] ) && is_numeric( $settings['opacity'] ) ) {
	$img_styles[] = 'opacity:' . min( 100, max( 0, (float) $settings['opacity'] ) ) / 100;
}
$image_transforms = array();
if ( isset( $settings['scale'] ) && is_numeric( $settings['scale'] ) && 100 !== (float) $settings['scale'] ) { $image_transforms[] = 'scale(' . ( min( 150, max( 50, (float) $settings['scale'] ) ) / 100 ) . ')'; }
if ( isset( $settings['rotate'] ) && is_numeric( $settings['rotate'] ) && 0 !== (float) $settings['rotate'] ) { $image_transforms[] = 'rotate(' . min( 180, max( -180, (float) $settings['rotate'] ) ) . 'deg)'; }
if ( ! empty( $image_transforms ) ) { $img_styles[] = 'transform:' . implode( ' ', $image_transforms ); }
$transform_origins = array( 'center center', 'left top', 'center top', 'right top', 'left center', 'right center', 'left bottom', 'center bottom', 'right bottom' );
if ( isset( $settings['transform_origin'] ) && in_array( $settings['transform_origin'], $transform_origins, true ) ) { $img_styles[] = 'transform-origin:' . $settings['transform_origin']; }

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
	$img_tag = '<a href="' . esc_url( $link ) . '"' . ( $target ? ' target="_blank"' : '' ) . $rel . ' style="display:block;">' . $img_tag . '</a>';
}

$frame_width = '' !== $width ? ( is_numeric( $width ) ? (float) $width . 'px' : esc_attr( $width ) ) : '100%';
$frame_style = 'position:relative;display:inline-block;width:' . $frame_width . ';max-width:' . ( is_numeric( $max_width ) ? (float) $max_width . 'px' : esc_attr( $max_width ) ) . ';overflow:hidden;';
if ( $border_rad > 0 ) { $frame_style .= 'border-radius:' . $border_rad . 'px;'; }
$overlay_style = XCOPB_Block_Registry::image_overlay_style( $settings );
$output = '<div class="xcopb-image-wrapper xsb-image-wrapper xcopb-widget" style="' . esc_attr( implode( ';', $wrap_styles ) ) . '">'
	. '<div class="xsb-image-frame" style="' . esc_attr( $frame_style ) . '">' . $img_tag;
if ( '' !== $overlay_style ) {
	$output .= '<span class="xsb-image-overlay" aria-hidden="true" style="' . esc_attr( $overlay_style ) . '"></span>';
}
$output .= '</div>';

if ( '' !== trim( $caption ) ) {
	$output .= '<figcaption class="xcopb-image-caption" style="font-size:13px;color:#64748b;margin-top:6px;">' . esc_html( $caption ) . '</figcaption>';
}

$output .= '</div>';

echo wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() );
