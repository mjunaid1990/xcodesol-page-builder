<?php
/**
 * Block: General Banner / Hero Section.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-hero-banner.php';

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$xsb_banner_color = static function ( $value, $fallback ) {
	if ( empty( $value ) ) {
		return $fallback;
	}
	return $value;
};

// Content
$title       = ! empty( $settings['title'] ) ? $settings['title'] : '';
$subtitle    = ! empty( $settings['subtitle'] ) ? $settings['subtitle'] : '';
$link        = ! empty( $settings['link'] ) ? $settings['link'] : '';
$button_text = ! empty( $settings['button_text'] ) ? $settings['button_text'] : '';

// Title source: allow using the archive/category title as the heading.
if ( isset( $settings['title_source'] ) && 'archive_title' === $settings['title_source'] ) {
	if ( 'product_category' === $context['view_type'] || 'product_tag' === $context['view_type'] ) {
		$term = get_queried_object();
		$title = ( is_object( $term ) && ! empty( $term->name ) ) ? $term->name : get_the_archive_title();
	} elseif ( function_exists( 'woocommerce_page_title' ) ) {
		// Clean page title (no "Archives:" prefix, no <span> wrapper).
		$title = woocommerce_page_title( false );
	} elseif ( ! empty( $context['term'] ) ) {
		$title = $context['term']->name;
	} elseif ( ! empty( $context['term_id'] ) && ! empty( $context['taxonomy'] ) ) {
		$term = get_term( $context['term_id'], $context['taxonomy'] );
		$title = ( $term && ! is_wp_error( $term ) ) ? $term->name : get_the_archive_title();
	} else {
		// Strip the "Archives:" prefix and the wrapping span for a clean title.
		$title = preg_replace( '/\.?$/', '', trim( wp_strip_all_tags( get_the_archive_title() ) ) );
		$title = preg_replace( '/^Archives:\s*/i', '', $title );
	}
}

// Layout
$align       = ! empty( $settings['align'] ) ? $settings['align'] : 'center';
$padding_top    = isset( $settings['padding_top'] ) ? $settings['padding_top'] : 80;
$padding_bottom = isset( $settings['padding_bottom'] ) ? $settings['padding_bottom'] : 80;
$padding_left   = isset( $settings['padding_left'] ) ? $settings['padding_left'] : 20;
$padding_right  = isset( $settings['padding_right'] ) ? $settings['padding_right'] : 20;
$min_height  = isset( $settings['min_height'] ) ? $settings['min_height'] : 400;

// Background
$bg_type     = ! empty( $settings['bg_type'] ) ? $settings['bg_type'] : 'color';
$bg_color    = $xsb_banner_color( isset( $settings['bg_color'] ) ? $settings['bg_color'] : '', '#2563eb' );

// Gradient background (linear / radial with two color stops)
$gradient_type  = ! empty( $settings['gradient_type'] ) ? $settings['gradient_type'] : 'linear';
$gradient_angle = isset( $settings['gradient_angle'] ) ? $settings['gradient_angle'] : 180;
$gradient_shape = ! empty( $settings['gradient_radial_shape'] ) ? $settings['gradient_radial_shape'] : 'circle';
$gradient_pos   = ! empty( $settings['gradient_position'] ) ? $settings['gradient_position'] : 'center';
$gradient_a     = $xsb_banner_color( isset( $settings['gradient_color_a'] ) ? $settings['gradient_color_a'] : '', '#2563eb' );
$gradient_b     = $xsb_banner_color( isset( $settings['gradient_color_b'] ) ? $settings['gradient_color_b'] : '', '#4f46e5' );

$bg_image_value = ! empty( $settings['bg_image'] ) ? $settings['bg_image'] : '';
$bg_image    = is_array( $bg_image_value ) ? ( $bg_image_value['url'] ?? '' ) : $bg_image_value;
$bg_size     = ! empty( $settings['bg_size'] ) ? $settings['bg_size'] : 'cover';
$bg_position = ! empty( $settings['bg_position'] ) ? $settings['bg_position'] : 'center center';
$bg_repeat   = ! empty( $settings['bg_repeat'] ) ? $settings['bg_repeat'] : 'no-repeat';
$bg_attachment = ! empty( $settings['bg_attachment'] ) ? $settings['bg_attachment'] : 'scroll';
$bg_video_value = ! empty( $settings['bg_video'] ) ? $settings['bg_video'] : '';
$bg_video    = is_array( $bg_video_value ) ? ( $bg_video_value['url'] ?? '' ) : $bg_video_value;
$bg_video_style = XCOPB_Block_Registry::background_video_style( $settings );
$overlay_color = $xsb_banner_color( isset( $settings['overlay_color'] ) ? $settings['overlay_color'] : '', '#000000' );

// Title styling
$title_color      = $xsb_banner_color( isset( $settings['title_color'] ) ? $settings['title_color'] : '', '#000000' );
$title_font_family = ! empty( $settings['title_font_family'] ) ? $settings['title_font_family'] : '';
$title_font_size  = ! empty( $settings['title_font_size'] ) ? $settings['title_font_size'] : 32;
$title_font_weight = ! empty( $settings['title_font_weight'] ) ? $settings['title_font_weight'] : '700';
$title_line_height = ! empty( $settings['title_line_height'] ) ? $settings['title_line_height'] : 1.2;
$title_letter_spacing = isset( $settings['title_letter_spacing'] ) ? $settings['title_letter_spacing'] : 0;
$title_text_transform = ! empty( $settings['title_text_transform'] ) ? $settings['title_text_transform'] : 'none';

// Subtitle styling
$subtitle_color      = $xsb_banner_color( isset( $settings['subtitle_color'] ) ? $settings['subtitle_color'] : '', '#000000' );
$subtitle_font_family = ! empty( $settings['subtitle_font_family'] ) ? $settings['subtitle_font_family'] : '';
$subtitle_font_size  = ! empty( $settings['subtitle_font_size'] ) ? $settings['subtitle_font_size'] : 18;
$subtitle_font_weight = ! empty( $settings['subtitle_font_weight'] ) ? $settings['subtitle_font_weight'] : '400';
$subtitle_line_height = ! empty( $settings['subtitle_line_height'] ) ? $settings['subtitle_line_height'] : 1.5;
$subtitle_letter_spacing = isset( $settings['subtitle_letter_spacing'] ) ? $settings['subtitle_letter_spacing'] : 0;

// Button styling
$button_font_family = ! empty( $settings['button_font_family'] ) ? $settings['button_font_family'] : '';
$button_bg_color = $xsb_banner_color( isset( $settings['button_bg_color'] ) ? $settings['button_bg_color'] : '', 'transparent' );
$button_text_color = $xsb_banner_color( isset( $settings['button_text_color'] ) ? $settings['button_text_color'] : '', '#ffffff' );
$button_border_color = $xsb_banner_color( isset( $settings['button_border_color'] ) ? $settings['button_border_color'] : '', '#ffffff' );
$button_border_width = isset( $settings['button_border_width'] ) ? $settings['button_border_width'] : 0;
$button_padding_x = isset( $settings['button_padding_x'] ) ? $settings['button_padding_x'] : 24;
$button_padding_y = isset( $settings['button_padding_y'] ) ? $settings['button_padding_y'] : 12;
$button_border_radius = isset( $settings['button_border_radius'] ) ? $settings['button_border_radius'] : 0;

// Effects (box shadow, entrance animation, corner radius)
$box_shadow         = isset( $settings['box_shadow'] ) ? $settings['box_shadow'] : 'none';
$animation          = class_exists( 'XCOPB_Motion_Presets' ) ? XCOPB_Motion_Presets::normalize_id( $settings['animation'] ?? 'none' ) : ( is_string( $settings['animation'] ?? null ) ? sanitize_key( $settings['animation'] ) : 'none' );
$animation_duration = isset( $settings['animation_duration'] ) ? $settings['animation_duration'] : 600;
$animation_delay    = isset( $settings['animation_delay'] ) ? $settings['animation_delay'] : 0;
$border_radius      = isset( $settings['border_radius'] ) ? $settings['border_radius'] : 0;
$border_width       = isset( $settings['border_width'] ) ? $settings['border_width'] : 0;
$border_style       = ! empty( $settings['border_style'] ) ? $settings['border_style'] : 'solid';
$border_color       = ! empty( $settings['border_color'] ) ? $settings['border_color'] : '';

// Overlay + content placement (flex moves the content around the banner)
$overlay_opacity    = isset( $settings['overlay_opacity'] ) ? min( 100, max( 0, absint( $settings['overlay_opacity'] ) ) ) : 45;
$content_position_x = ! empty( $settings['content_position_x'] ) ? $settings['content_position_x'] : 'center';
$content_position_y = ! empty( $settings['content_position_y'] ) ? $settings['content_position_y'] : 'center';
$content_box        = ! empty( $settings['content_box'] );
$content_box_bg     = isset( $settings['content_box_bg'] ) ? $settings['content_box_bg'] : 'rgba(0,0,0,0.35)';
$content_box_padding = isset( $settings['content_box_padding'] ) ? $settings['content_box_padding'] : 28;
$content_box_radius = isset( $settings['content_box_radius'] ) ? $settings['content_box_radius'] : 0;

$xsb_flex_x = array( 'left' => 'flex-start', 'center' => 'center', 'right' => 'flex-end' );
$xsb_flex_y = array( 'top' => 'flex-start', 'center' => 'center', 'bottom' => 'flex-end' );
$content_position_x = isset( $xsb_flex_x[ $content_position_x ] ) ? $content_position_x : 'center';
$content_position_y = isset( $xsb_flex_y[ $content_position_y ] ) ? $content_position_y : 'center';

$xsb_shadow_map = array(
	'none'   => '',
	'soft'   => '0 4px 14px rgba(0,0,0,0.12)',
	'medium' => '0 10px 28px rgba(0,0,0,0.18)',
	'strong' => '0 18px 50px rgba(0,0,0,0.28)',
);
$xsb_anim_list = class_exists( 'XCOPB_Motion_Presets' ) ? array_slice( XCOPB_Motion_Presets::ids(), 1 ) : array( 'fade-in', 'slide-up', 'slide-down', 'zoom-in' );

if ( '' === $title && '' === $subtitle && '' === $button_text && empty( $settings['slides'] ) && ! in_array( $settings['source_mode'] ?? 'custom', array( 'posts', 'mixed' ), true ) ) {
	return;
}

// Background declarations, shared with the responsive emitter so device
// overrides compose exactly like the desktop background.
$bg_styles = XCOPB_Block_Registry::banner_bg_decls( $settings );

$container_style  = 'padding:' . absint( $padding_top ) . 'px ' . absint( $padding_right ) . 'px ' . absint( $padding_bottom ) . 'px ' . absint( $padding_left ) . 'px;';
$container_style .= 'min-height:' . absint( $min_height ) . 'px;';
$container_style .= 'text-align:' . esc_attr( $align ) . ';';
$container_style .= 'display:flex;flex-direction:column;justify-content:' . $xsb_flex_y[ $content_position_y ] . ';align-items:' . $xsb_flex_x[ $content_position_x ] . ';';
$container_style .= 'border-radius:' . absint( $border_radius ) . 'px;';
if ( absint( $border_width ) > 0 ) {
	$container_style .= 'border:' . absint( $border_width ) . 'px ' . esc_attr( $border_style ) . ' ' . esc_attr( $border_color ? $border_color : '#000000' ) . ';';
}
if ( isset( $xsb_shadow_map[ $box_shadow ] ) && '' !== $xsb_shadow_map[ $box_shadow ] ) {
	$container_style .= 'box-shadow:' . $xsb_shadow_map[ $box_shadow ] . ';';
}
$container_style .= implode( ';', $bg_styles ) . ';';
$container_style = preg_replace( '/padding:[^;]+;/', '', $container_style );

$title_style = sprintf(
	'color:%1$s;font-size:%2$dpx;font-weight:%3$s;line-height:%4$s;letter-spacing:%5$spx;text-transform:%6$s;margin:0 0 16px;',
	esc_attr( $title_color ),
	absint( $title_font_size ),
	esc_attr( $title_font_weight ),
	esc_attr( $title_line_height ),
	(float) $title_letter_spacing,
	esc_attr( $title_text_transform )
);
if ( '' !== $title_font_family ) {
	$title_style .= 'font-family:' . esc_attr( $title_font_family ) . ';';
}

$subtitle_style = sprintf(
	'color:%1$s;font-size:%2$dpx;font-weight:%3$s;line-height:%4$s;letter-spacing:%5$spx;margin:0 0 24px;',
	esc_attr( $subtitle_color ),
	absint( $subtitle_font_size ),
	esc_attr( $subtitle_font_weight ),
	esc_attr( $subtitle_line_height ),
	(float) $subtitle_letter_spacing
);
if ( '' !== $subtitle_font_family ) {
	$subtitle_style .= 'font-family:' . esc_attr( $subtitle_font_family ) . ';';
}

$button_style = sprintf(
	'background-color:%1$s;color:%2$s;border:%3$dpx solid %4$s;padding:%5$dpx %6$dpx;border-radius:%7$dpx;text-decoration:none;display:inline-block;',
	esc_attr( $button_bg_color ),
	esc_attr( $button_text_color ),
	absint( $button_border_width ),
	esc_attr( $button_border_color ),
	absint( $button_padding_y ),
	absint( $button_padding_x ),
	absint( $button_border_radius )
);
if ( '' !== $button_font_family ) {
	$button_style .= 'font-family:' . esc_attr( $button_font_family ) . ';';
}

$overlay_style = '';
if ( ( 'image' === $bg_type || 'video' === $bg_type ) && $overlay_color ) {
	// Overlay sits at z-index 1, under the content (z-index 2) but over the media (z-index 0).
	$overlay_style = sprintf( 'background-color:%s;opacity:%.2f;', esc_attr( $overlay_color ), $overlay_opacity / 100 );
}

$xsb_anim_class = '';
if ( 'none' !== $animation && in_array( $animation, $xsb_anim_list, true ) ) {
	$xsb_anim_class = ' xsb-anim-' . $animation;
	$animation_keyframe = class_exists( 'XCOPB_Motion_Presets' ) ? XCOPB_Motion_Presets::keyframe( $animation ) : 'xsb-' . $animation;
	$container_style .= 'animation-name:' . esc_attr( $animation_keyframe ) . ';animation-duration:' . absint( $animation_duration ) . 'ms;';
	$container_style .= 'animation-delay:' . absint( $animation_delay ) . 'ms;';
	$container_style .= 'animation-timing-function:' . ( isset( $settings['animation_easing'] ) && in_array( $settings['animation_easing'], array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ), true ) ? $settings['animation_easing'] : 'ease' ) . ';';
	$container_style .= 'animation-iteration-count:' . ( isset( $settings['animation_repeat'] ) && in_array( (string) $settings['animation_repeat'], array( '1', '2', '3', 'infinite' ), true ) ? $settings['animation_repeat'] : '1' ) . ';';
}

$legacy_slide = array(
	'type'        => 'custom',
	'title'       => $title,
	'title_tag'   => 'h2',
	'subtitle'    => $subtitle,
	'button_text' => $button_text,
	'link'        => $link,
);

$content = XCOPB_Hero_Banner::render(
	$settings,
	$legacy_slide,
	$container_style,
	$overlay_color,
	$overlay_opacity / 100,
	array( 'x' => $content_position_x, 'y' => $content_position_y )
);

$allowed = XCOPB_Block_Registry::allowed_output_html();
$global_attributes = array( 'class' => true, 'id' => true, 'style' => true, 'role' => true, 'tabindex' => true, 'data-*' => true, 'aria-*' => true );
$allowed['article'] = array_merge( $global_attributes, array( 'aria-roledescription' => true, 'aria-label' => true, 'aria-hidden' => true, 'inert' => true ) );
$allowed['picture'] = $global_attributes;
$allowed['source'] = array_merge( $global_attributes, array( 'media' => true, 'src' => true, 'srcset' => true, 'type' => true, 'sizes' => true ) );
$allowed['time'] = array_merge( $global_attributes, array( 'datetime' => true ) );
$allowed['img'] = array_merge( $allowed['img'] ?? array(), array( 'src' => true, 'srcset' => true, 'sizes' => true, 'alt' => true, 'loading' => true, 'fetchpriority' => true, 'decoding' => true ) );
$allowed['button'] = array_merge( $allowed['button'] ?? array(), array( 'type' => true, 'aria-label' => true, 'aria-pressed' => true, 'aria-current' => true, 'data-*' => true ) );
$allowed['video'] = array_merge( $allowed['video'] ?? array(), array( 'class' => true, 'autoplay' => true, 'muted' => true, 'loop' => true, 'playsinline' => true, 'preload' => true, 'aria-hidden' => true ) );
echo wp_kses( $content, $allowed );
