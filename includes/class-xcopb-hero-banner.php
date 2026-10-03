<?php
/**
 * Query, dynamic data, slide and slider helpers for the Hero Banner widget.
 * Settings stay in the existing block settings JSON; this class only turns
 * that data into safe front-end markup.
 *
 * @package Xcodesol_Page_Builder
 */
defined( 'ABSPATH' ) || exit;

final class XCOPB_Hero_Banner {
	/** Build one shared set of CSS custom properties for all banner content and controls. */
	private static function design_style( $settings ) {
		$padding = isset( $settings['slide_padding'] ) && is_array( $settings['slide_padding'] ) ? $settings['slide_padding'] : array();
		$unit = in_array( $padding['unit'] ?? 'px', array( 'px', 'rem', '%' ), true ) ? $padding['unit'] : 'px';
		$side = static function ( $key, $fallback ) use ( $padding, $unit ) {
			$value = isset( $padding[ $key ] ) && is_numeric( $padding[ $key ] ) ? min( 500, max( 0, (float) $padding[ $key ] ) ) : $fallback;
			return $value . $unit;
		};
		$arrow_y = array( 'top' => '18%', 'center' => '50%', 'bottom' => '82%' );
		$dot_radius = array( 'circle' => '50%', 'pill' => '999px', 'square' => '0' );
		$text_shadows = array( 'none' => 'none', 'soft' => '0 2px 10px rgba(0,0,0,.3)', 'strong' => '0 3px 18px rgba(0,0,0,.6)' );
		$flex_align = array( 'left' => 'flex-start', 'center' => 'center', 'right' => 'flex-end' );
		$vars = array(
			'--xsb-banner-slide-padding' => $side( 'top', 80 ) . ' ' . $side( 'right', 24 ) . ' ' . $side( 'bottom', 80 ) . ' ' . $side( 'left', 24 ),
			'--xsb-banner-heading-font-family' => ! empty( $settings['heading_font_family'] ) ? $settings['heading_font_family'] : ( $settings['title_font_family'] ?? 'inherit' ),
			'--xsb-banner-heading-size' => absint( $settings['heading_font_size'] ?? $settings['title_font_size'] ?? 48 ) . 'px',
			'--xsb-banner-heading-weight' => absint( $settings['heading_font_weight'] ?? $settings['title_font_weight'] ?? 700 ),
			'--xsb-banner-heading-font-style' => $settings['heading_font_style'] ?? 'normal',
			'--xsb-banner-heading-line-height' => (float) ( $settings['heading_line_height'] ?? $settings['title_line_height'] ?? 1.15 ),
			'--xsb-banner-heading-letter-spacing' => (float) ( $settings['heading_letter_spacing'] ?? $settings['title_letter_spacing'] ?? 0 ) . 'px',
			'--xsb-banner-heading-transform' => $settings['heading_text_transform'] ?? $settings['title_text_transform'] ?? 'none',
			'--xsb-banner-heading-shadow' => $text_shadows[ $settings['heading_text_shadow'] ?? 'none' ] ?? 'none',
			'--xsb-banner-heading-color' => $settings['heading_color'] ?? $settings['title_color'] ?? '#ffffff',
			'--xsb-banner-heading-align' => $settings['heading_alignment'] ?? $settings['align'] ?? 'center',
			'--xsb-banner-description-font-family' => ! empty( $settings['description_font_family'] ) ? $settings['description_font_family'] : ( $settings['subtitle_font_family'] ?? 'inherit' ),
			'--xsb-banner-description-size' => absint( $settings['description_font_size'] ?? $settings['subtitle_font_size'] ?? 18 ) . 'px',
			'--xsb-banner-description-weight' => absint( $settings['description_font_weight'] ?? $settings['subtitle_font_weight'] ?? 400 ),
			'--xsb-banner-description-font-style' => $settings['description_font_style'] ?? 'normal',
			'--xsb-banner-description-line-height' => (float) ( $settings['description_line_height'] ?? $settings['subtitle_line_height'] ?? 1.5 ),
			'--xsb-banner-description-letter-spacing' => (float) ( $settings['description_letter_spacing'] ?? $settings['subtitle_letter_spacing'] ?? 0 ) . 'px',
			'--xsb-banner-description-transform' => $settings['description_text_transform'] ?? 'none',
			'--xsb-banner-description-shadow' => $text_shadows[ $settings['description_text_shadow'] ?? 'none' ] ?? 'none',
			'--xsb-banner-description-color' => $settings['description_color'] ?? $settings['subtitle_color'] ?? '#ffffff',
			'--xsb-banner-description-align' => $settings['description_alignment'] ?? $settings['align'] ?? 'center',
			'--xsb-banner-button-font-family' => ! empty( $settings['button_font_family'] ) ? $settings['button_font_family'] : 'inherit',
			'--xsb-banner-button-size' => absint( $settings['button_font_size'] ?? 15 ) . 'px',
			'--xsb-banner-button-weight' => absint( $settings['button_font_weight'] ?? 600 ),
			'--xsb-banner-button-font-style' => $settings['button_font_style'] ?? 'normal',
			'--xsb-banner-button-line-height' => (float) ( $settings['button_line_height'] ?? 1.2 ),
			'--xsb-banner-button-letter-spacing' => (float) ( $settings['button_letter_spacing'] ?? 0 ) . 'px',
			'--xsb-banner-button-transform' => $settings['button_text_transform'] ?? 'none',
			'--xsb-banner-button-align' => $flex_align[ $settings['button_alignment'] ?? 'center' ] ?? 'center',
			'--xsb-banner-button-text-align' => $settings['button_text_alignment'] ?? 'center',
			'--xsb-banner-button-shadow' => $text_shadows[ $settings['button_text_shadow'] ?? 'none' ] ?? 'none',
			'--xsb-banner-button-width' => 'full' === ( $settings['button_width'] ?? 'auto' ) ? '100%' : 'auto',
			'--xsb-banner-button-bg' => $settings['button_bg_color'] ?? '#4f46e5',
			'--xsb-banner-button-color' => $settings['button_text_color'] ?? '#ffffff',
			'--xsb-banner-button-hover-bg' => $settings['button_hover_bg_color'] ?? '#4338ca',
			'--xsb-banner-button-hover-color' => $settings['button_hover_text_color'] ?? '#ffffff',
			'--xsb-banner-button-border-color' => $settings['button_border_color'] ?? '#ffffff',
			'--xsb-banner-button-border-width' => absint( $settings['button_border_width'] ?? 0 ) . 'px',
			'--xsb-banner-button-radius' => absint( $settings['button_border_radius'] ?? 0 ) . 'px',
			'--xsb-banner-button-padding' => absint( $settings['button_padding_y'] ?? 12 ) . 'px ' . absint( $settings['button_padding_x'] ?? 24 ) . 'px',
			'--xsb-banner-heading-gap' => absint( $settings['heading_description_gap'] ?? 12 ) . 'px',
			'--xsb-banner-description-gap' => absint( $settings['description_button_gap'] ?? 18 ) . 'px',
			'--xsb-banner-button-gap' => absint( $settings['button_gap'] ?? 12 ) . 'px',
			'--xsb-banner-arrow-size' => absint( $settings['arrow_size'] ?? 48 ) . 'px',
			'--xsb-banner-arrow-icon-size' => absint( $settings['arrow_icon_size'] ?? 24 ) . 'px',
			'--xsb-banner-arrow-inset' => absint( $settings['arrow_inset'] ?? 18 ) . 'px',
			'--xsb-banner-arrow-y' => $arrow_y[ $settings['arrow_position'] ?? 'center' ] ?? '50%',
			'--xsb-banner-arrow-bg' => $settings['arrow_bg_color'] ?? '#ffffff',
			'--xsb-banner-arrow-color' => $settings['arrow_icon_color'] ?? '#20283a',
			'--xsb-banner-arrow-hover-bg' => $settings['arrow_hover_bg_color'] ?? '#ffffff',
			'--xsb-banner-arrow-hover-color' => $settings['arrow_hover_icon_color'] ?? '#5148c8',
			'--xsb-banner-arrow-border-color' => $settings['arrow_border_color'] ?? '#ffffff',
			'--xsb-banner-arrow-border-width' => absint( $settings['arrow_border_width'] ?? 0 ) . 'px',
			'--xsb-banner-arrow-radius' => absint( $settings['arrow_border_radius'] ?? 0 ) . 'px',
			'--xsb-banner-pagination-offset' => absint( $settings['pagination_offset'] ?? 18 ) . 'px',
			'--xsb-banner-pagination-align' => $flex_align[ $settings['pagination_alignment'] ?? 'center' ] ?? 'center',
			'--xsb-banner-pagination-color' => $settings['pagination_color'] ?? '#ffffff',
			'--xsb-banner-pagination-active' => $settings['pagination_active_color'] ?? '#ffffff',
			'--xsb-banner-dot-size' => absint( $settings['dot_size'] ?? 8 ) . 'px',
			'--xsb-banner-dot-active-size' => absint( $settings['dot_active_size'] ?? 22 ) . 'px',
			'--xsb-banner-dot-gap' => absint( $settings['dot_gap'] ?? 7 ) . 'px',
			'--xsb-banner-dot-radius' => $dot_radius[ $settings['dot_shape'] ?? 'square' ] ?? '0',
			'--xsb-banner-progress-height' => absint( $settings['progress_height'] ?? 3 ) . 'px',
			'--xsb-banner-progress-inset' => absint( $settings['progress_inset'] ?? 18 ) . 'px',
			'--xsb-banner-progress-track' => $settings['progress_track_color'] ?? 'rgba(255,255,255,.3)',
			'--xsb-banner-progress-fill' => $settings['progress_fill_color'] ?? '#ffffff',
		);
		$style = '';
		foreach ( $vars as $name => $value ) {
			$style .= $name . ':' . esc_attr( $value ) . ';';
		}
		return $style;
	}

	/**
	 * Get post slides for the configured query.
	 *
	 * @param array $settings Banner settings.
	 * @return array
	 */
	public static function query_slides( $settings ) {
		if ( ! class_exists( 'WP_Query' ) ) {
			return array();
		}

		$post_type = isset( $settings['posts_post_type'] ) ? sanitize_key( $settings['posts_post_type'] ) : 'post';
		$public_types = get_post_types( array( 'public' => true ), 'names' );
		if ( ! in_array( $post_type, $public_types, true ) ) {
			$post_type = 'post';
		}

		$include = self::ids( $settings['posts_include_ids'] ?? '' );
		$exclude = self::ids( $settings['posts_exclude_ids'] ?? '' );
		$sticky  = get_option( 'sticky_posts', array() );
		if ( ! empty( $settings['posts_sticky_only'] ) ) {
			$include = array_values( array_unique( array_merge( $include, array_map( 'absint', (array) $sticky ) ) ) );
			if ( empty( $include ) ) {
				return array();
			}
		}

		$args = array(
			'post_type'           => $post_type,
			'post_status'         => 'publish',
			'posts_per_page'      => min( 5, max( 1, absint( $settings['posts_count'] ?? 3 ) ) ),
			'offset'              => min( 500, absint( $settings['posts_offset'] ?? 0 ) ),
			'orderby'             => in_array( $settings['posts_orderby'] ?? 'date', array( 'date', 'title', 'rand', 'menu_order', 'comment_count' ), true ) ? $settings['posts_orderby'] : 'date',
			'order'               => 'ASC' === strtoupper( $settings['posts_order'] ?? 'DESC' ) ? 'ASC' : 'DESC',
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		);
		if ( $include ) {
			$args['post__in'] = $include;
		}
		if ( $exclude ) {
			$args['post__not_in'] = $exclude;
		}

		$category = absint( $settings['posts_category'] ?? 0 );
		$tag      = absint( $settings['posts_tag'] ?? 0 );
		$author   = absint( $settings['posts_author'] ?? 0 );
		$tax_query = array();
		if ( $category && is_object_in_taxonomy( $post_type, 'category' ) ) {
			$tax_query[] = array( 'taxonomy' => 'category', 'field' => 'term_id', 'terms' => array( $category ) );
		}
		if ( $tag && is_object_in_taxonomy( $post_type, 'post_tag' ) ) {
			$tax_query[] = array( 'taxonomy' => 'post_tag', 'field' => 'term_id', 'terms' => array( $tag ) );
		}
		if ( $tax_query ) {
			$args['tax_query'] = count( $tax_query ) > 1 ? array_merge( array( 'relation' => 'AND' ), $tax_query ) : $tax_query;
		}
		if ( $author ) {
			$args['author'] = $author;
		}
		if ( ! empty( $settings['posts_has_image'] ) ) {
			$args['meta_query'] = array( array( 'key' => '_thumbnail_id', 'compare' => 'EXISTS' ) );
		}

		$query  = new WP_Query( $args );
		$slides = array();
		foreach ( $query->posts as $post ) {
			$slides[] = self::post_to_slide( $post, $settings );
		}
		wp_reset_postdata();
		return $slides;
	}

	/** Convert one WP post into the widget's normalized slide shape. */
	private static function post_to_slide( $post, $settings ) {
		$title_field = $settings['query_title_field'] ?? 'title';
		$desc_field  = $settings['query_description_field'] ?? 'excerpt';
		$image_field = $settings['query_image_field'] ?? 'featured_image';
		$link_field  = $settings['query_link_field'] ?? 'permalink';
		$terms       = get_the_category( $post->ID );
		$category    = ! empty( $terms ) ? $terms[0]->name : '';
		$excerpt     = has_excerpt( $post ) ? $post->post_excerpt : wp_trim_words( wp_strip_all_tags( $post->post_content ), 28 );
		$title       = 'excerpt' === $title_field ? $excerpt : ( 'category' === $title_field ? $category : get_the_title( $post ) );
		$description = 'none' === $desc_field ? '' : ( 'content' === $desc_field ? wp_trim_words( wp_strip_all_tags( $post->post_content ), 48 ) : ( 'date' === $desc_field ? get_the_date( '', $post ) : ( 'author' === $desc_field ? get_the_author_meta( 'display_name', $post->post_author ) : ( 'category' === $desc_field ? $category : $excerpt ) ) ) );
		$image       = 'none' === $image_field ? '' : get_the_post_thumbnail_url( $post, 'full' );
		if ( 'category_image' === $image_field && ! empty( $terms[0] ) ) {
			$term_image = get_term_meta( $terms[0]->term_id, 'thumbnail_id', true );
			$image = $term_image ? wp_get_attachment_image_url( absint( $term_image ), 'full' ) : '';
		}
		if ( ! $image ) {
			$fallback = $settings['fallback_image'] ?? '';
			$image = is_array( $fallback ) ? ( $fallback['url'] ?? '' ) : $fallback;
		}

		return array(
			'id'         => 'post-' . absint( $post->ID ),
			'type'       => 'linked-post',
			'badge'      => $category,
			'title'      => wp_strip_all_tags( $title ),
			'title_tag'  => 'h2',
			'subtitle'   => wp_strip_all_tags( $description ),
			'image'      => $image,
			'image_alt'  => get_post_meta( get_post_thumbnail_id( $post ), '_wp_attachment_image_alt', true ),
			'background_type' => 'image',
			'link'       => 'none' === $link_field ? '' : get_permalink( $post ),
			'button_text' => 'none' === $link_field ? '' : __( 'Read more', 'xcodesol-page-builder' ),
			'date'       => get_the_date( '', $post ),
			'author'     => get_the_author_meta( 'display_name', $post->post_author ),
		);
	}

	/** Render banner slides and accessible slider controls. */
	public static function render( $settings, $legacy_slide, $frame_style, $overlay_color, $overlay_opacity, $content_position ) {
		$mode   = in_array( $settings['source_mode'] ?? 'custom', array( 'custom', 'posts', 'mixed' ), true ) ? $settings['source_mode'] : 'custom';
		$slides = isset( $settings['slides'] ) && is_array( $settings['slides'] ) ? array_values( array_slice( $settings['slides'], 0, 20 ) ) : array();
		if ( empty( $slides ) && 'posts' !== $mode ) {
			$slides = array( $legacy_slide );
		}
		if ( in_array( $mode, array( 'posts', 'mixed' ), true ) ) {
			$slides = 'mixed' === $mode ? array_merge( $slides, self::query_slides( $settings ) ) : self::query_slides( $settings );
		}

		$slides = array_values( array_filter( $slides, 'is_array' ) );
		$enabled = count( $slides ) > 1 && ( 'posts' === $mode || ! empty( $settings['slider_enabled'] ) );
		if ( ! $enabled ) {
			$slides = array_slice( $slides, 0, 1 );
		}
		$transition = in_array( $settings['transition'] ?? 'slide', array( 'slide', 'fade', 'zoom' ), true ) ? $settings['transition'] : 'slide';
		$variant = in_array( $settings['layout_variant'] ?? 'centered', array( 'centered', 'left', 'split-left', 'split-right', 'card-over-image' ), true ) ? $settings['layout_variant'] : 'centered';
		$root_classes = array( 'xsb-banner', 'xsb-banner-layout--' . $variant );
		if ( ! empty( $settings['css_class'] ) ) {
			$root_classes[] = implode( ' ', array_filter( array_map( 'sanitize_html_class', preg_split( '/\s+/', $settings['css_class'] ) ) ) );
		}
		if ( $enabled ) {
			$root_classes[] = 'xsb-banner-slider';
		}
		$root_style = $frame_style . self::design_style( $settings );
		$root_attrs = ' class="' . esc_attr( implode( ' ', $root_classes ) ) . '" style="' . esc_attr( $root_style ) . '"';
		if ( ! empty( $settings['css_id'] ) ) {
			$root_attrs .= ' id="' . esc_attr( sanitize_html_class( $settings['css_id'] ) ) . '"';
		}
		if ( $enabled ) {
			$root_attrs .= ' data-transition="' . esc_attr( $transition ) . '" data-loop="' . ( ! isset( $settings['loop'] ) || ! empty( $settings['loop'] ) ? 'true' : 'false' ) . '" data-pause-interaction="' . ( ! isset( $settings['pause_on_interaction'] ) || ! empty( $settings['pause_on_interaction'] ) ? 'true' : 'false' ) . '" data-autoplay="' . ( ! empty( $settings['autoplay'] ) ? 'true' : 'false' ) . '" data-delay="' . esc_attr( min( 30000, max( 1000, absint( $settings['autoplay_delay'] ?? 5000 ) ) ) ) . '" data-pause-hover="' . ( ! empty( $settings['pause_on_hover'] ) ? 'true' : 'false' ) . '" role="region" aria-roledescription="carousel" aria-label="' . esc_attr__( 'Hero banner', 'xcodesol-page-builder' ) . '" aria-live="' . ( ! empty( $settings['autoplay'] ) ? 'off' : 'polite' ) . '" tabindex="0"';
		}

		$html = '<div' . $root_attrs . '>';
		if ( empty( $slides ) ) {
			$html .= '<div class="xsb-banner-empty">' . esc_html( $settings['query_empty_message'] ?? __( 'No posts found.', 'xcodesol-page-builder' ) ) . '</div>';
		}
		if ( $enabled ) {
			$html .= '<div class="xsb-banner-swiper swiper"><div class="swiper-wrapper">';
		}
		foreach ( $slides as $index => $slide ) {
			$html .= self::render_slide( $slide, $index, count( $slides ), $settings, $legacy_slide, $overlay_color, $overlay_opacity, $content_position, $enabled );
		}
		if ( $enabled ) {
			$html .= '</div></div>';
		}

		if ( $enabled && ! empty( $settings['show_arrows'] ) ) {
			$html .= '<button type="button" class="xsb-banner-arrow xsb-banner-arrow--previous" data-banner-prev aria-label="' . esc_attr__( 'Previous slide', 'xcodesol-page-builder' ) . '">' . self::render_arrow_icon( $settings ) . '</button>';
			$html .= '<button type="button" class="xsb-banner-arrow xsb-banner-arrow--next" data-banner-next aria-label="' . esc_attr__( 'Next slide', 'xcodesol-page-builder' ) . '">' . self::render_arrow_icon( $settings ) . '</button>';
		}
		if ( $enabled && 'none' !== ( $settings['pagination'] ?? 'dots' ) ) {
			$html .= self::render_pagination( $settings['pagination'], count( $slides ), $settings );
		}
		if ( $enabled && ! empty( $settings['autoplay'] ) ) {
			$html .= '<button type="button" class="xsb-banner-pause" data-banner-pause aria-label="' . esc_attr__( 'Pause slide rotation', 'xcodesol-page-builder' ) . '" aria-pressed="false"><span aria-hidden="true">&#10074;&#10074;</span></button>';
		}
		$html .= '</div>';

		if ( $enabled ) {
			self::enqueue_slider_assets();
		}
		return $html;
	}

	/** Render one accessible slide using global visual values as its fallback. */
	private static function render_slide( $slide, $index, $count, $settings, $legacy, $overlay_color, $overlay_opacity, $content_position, $enabled ) {
		$post = null;
		if ( 'linked-post' === ( $slide['type'] ?? '' ) && ! empty( $slide['post_id'] ) ) {
			$post = self::get_public_post( absint( $slide['post_id'] ) );
			if ( $post instanceof WP_Post ) {
				$post_slide = self::post_to_slide( $post, $settings );
				foreach ( array( 'badge', 'title', 'subtitle', 'image', 'image_alt', 'link', 'button_text' ) as $field ) {
					if ( empty( $slide[ $field ] ) || ( 'title' === $field && __( 'Your headline', 'xcodesol-page-builder' ) === $slide[ $field ] ) ) {
						$slide[ $field ] = $post_slide[ $field ] ?? $slide[ $field ];
					}
				}
			}
		}
		$title      = (string) ( $slide['title'] ?? $legacy['title'] ?? '' );
		$subtitle   = (string) ( $slide['subtitle'] ?? $legacy['subtitle'] ?? '' );
		$badge      = (string) ( $slide['badge'] ?? '' );
		$title_tag  = in_array( $slide['title_tag'] ?? '', array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div' ), true ) ? $slide['title_tag'] : ( 0 === $index ? 'h1' : 'h2' );
		if ( isset( $slide['dynamic_post_id'] ) ) {
			$dynamic_post = self::get_public_post( absint( $slide['dynamic_post_id'] ) );
			if ( $dynamic_post ) {
				$post = $dynamic_post;
				$title = self::replace_tokens( $title, $dynamic_post );
				$subtitle = self::replace_tokens( $subtitle, $dynamic_post );
			}
		}
		if ( $post instanceof WP_Post ) {
			$title = self::replace_tokens( $title, $post );
			$subtitle = self::replace_tokens( $subtitle, $post );
		}
		$image_value = $slide['image'] ?? '';
		$image = is_array( $image_value ) ? ( $image_value['url'] ?? '' ) : $image_value;
		$mobile_value = $slide['mobile_image'] ?? '';
		$mobile_image = is_array( $mobile_value ) ? ( $mobile_value['url'] ?? '' ) : $mobile_value;
		$video_value = $slide['video'] ?? '';
		$video = is_array( $video_value ) ? ( $video_value['url'] ?? '' ) : $video_value;
		$background_type = $slide['background_type'] ?? 'inherit';
		if ( 'inherit' === $background_type && ! empty( $image ) && 'linked-post' === ( $slide['type'] ?? '' ) ) {
			$background_type = 'image';
		}
		if ( 'inherit' === $background_type ) {
			$background_type = $settings['bg_type'] ?? 'color';
			if ( empty( $image ) ) {
				$legacy_image = $settings['bg_image'] ?? '';
				$image = is_array( $legacy_image ) ? ( $legacy_image['url'] ?? '' ) : $legacy_image;
			}
			if ( empty( $video ) ) {
				$legacy_video = $settings['bg_video'] ?? '';
				$video = is_array( $legacy_video ) ? ( $legacy_video['url'] ?? '' ) : $legacy_video;
			}
		}
		$slide_style = '';
		if ( 'color' === $background_type ) {
			$color = $slide['background_color'] ?? $settings['bg_color'] ?? '#2563eb';
			$slide_style = 'background-color:' . esc_attr( $color ) . ';';
		}
		$link = esc_url( $slide['link'] ?? $legacy['link'] ?? '' );
		$active = 0 === $index;
		$classes = 'xsb-banner-slide' . ( $enabled ? ' swiper-slide' : '' ) . ( $active ? ' is-active' : '' ) . ( $link ? ' has-slide-link' : '' );
		$position_x = $settings['content_position_x'] ?? 'center';
		$position_y = $settings['content_position_y'] ?? 'center';
		$slide_style .= 'display:flex;flex-direction:column;justify-content:' . esc_attr( self::flex_y( $position_y ) ) . ';align-items:' . esc_attr( self::flex_x( $position_x ) ) . ';padding:var(--xsb-banner-slide-padding);box-sizing:border-box;';
		$html = '<article class="' . esc_attr( $classes ) . '" data-banner-slide role="group" aria-roledescription="slide" aria-label="' . esc_attr( sprintf( __( '%1$d of %2$d', 'xcodesol-page-builder' ), $index + 1, max( 1, $count ) ) ) . '" aria-hidden="' . ( $active ? 'false' : 'true' ) . '"' . ( $active ? '' : ' inert' ) . ' style="' . esc_attr( $slide_style ) . '">';
		if ( 'image' === $background_type && $image ) {
			$loading = 0 === $index ? 'eager' : 'lazy';
			$html .= '<picture class="xsb-banner-media">';
			if ( $mobile_image ) {
				$html .= '<source media="(max-width: 767px)" srcset="' . esc_url( $mobile_image ) . '">';
			}
			$image_fit = in_array( $settings['bg_size'] ?? 'cover', array( 'cover', 'contain', 'auto' ), true ) ? $settings['bg_size'] : 'cover';
			$image_position = in_array( $settings['bg_position'] ?? 'center center', array( 'left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom' ), true ) ? $settings['bg_position'] : 'center center';
			$attachment_id = attachment_url_to_postid( $image );
			$srcset = $attachment_id ? wp_get_attachment_image_srcset( $attachment_id, 'full' ) : false;
			$html .= '<img src="' . esc_url( $image ) . '"' . ( $srcset ? ' srcset="' . esc_attr( $srcset ) . '" sizes="100vw"' : '' ) . ' alt="' . esc_attr( $slide['image_alt'] ?? '' ) . '" loading="' . esc_attr( $loading ) . '" style="object-fit:' . esc_attr( $image_fit ) . ';object-position:' . esc_attr( $image_position ) . ';"' . ( 0 === $index ? ' fetchpriority="high"' : '' ) . ' decoding="async"></picture>';
		}
		if ( 'video' === $background_type && $video ) {
			$html .= '<video class="xsb-banner-media" autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="' . esc_url( $video ) . '"></video>';
		}
		if ( in_array( $background_type, array( 'image', 'video' ), true ) && $overlay_color ) {
			$slide_overlay_color = sanitize_hex_color( $slide['overlay_color'] ?? '' ) ?: $overlay_color;
			$slide_overlay_opacity = isset( $slide['overlay_opacity'] ) ? min( 100, max( 0, absint( $slide['overlay_opacity'] ) ) ) / 100 : $overlay_opacity;
			$html .= '<div class="xsb-banner-overlay" aria-hidden="true" style="background-color:' . esc_attr( $slide_overlay_color ) . ';opacity:' . esc_attr( $slide_overlay_opacity ) . ';"></div>';
		}
		if ( $link ) {
			$html .= '<a class="xsb-banner-slide-link" href="' . $link . '" aria-label="' . esc_attr( $title ) . '"></a>';
		}
		$content_style = 'position:relative;z-index:2;box-sizing:border-box;width:100%;max-width:100%;text-align:' . esc_attr( in_array( $settings['align'] ?? 'center', array( 'left', 'center', 'right' ), true ) ? $settings['align'] : 'center' ) . ';';
		if ( ! empty( $settings['content_box'] ) ) {
			$content_style .= 'background:' . esc_attr( $settings['content_box_bg'] ?? 'rgba(0,0,0,.35)' ) . ';padding:' . absint( $settings['content_box_padding'] ?? 28 ) . 'px;border-radius:' . absint( $settings['content_box_radius'] ?? 0 ) . 'px;';
		}
		$html .= '<div class="xsb-banner-content" style="' . esc_attr( $content_style ) . '" data-banner-content>';
		if ( $badge ) {
			$html .= '<p class="xsb-banner-badge">' . esc_html( $badge ) . '</p>';
		}
		if ( $title ) {
			$title_motion = self::element_animation_style( $settings, 'heading_animation' );
			$html .= '<' . $title_tag . ' class="xsb-banner-title"' . ( $title_motion ? ' style="' . esc_attr( $title_motion ) . '"' : '' ) . '>' . esc_html( $title ) . '</' . $title_tag . '>';
		}
		if ( $subtitle ) {
			$description_motion = self::element_animation_style( $settings, 'description_animation' );
			$html .= '<div class="xsb-banner-subtitle"' . ( $description_motion ? ' style="' . esc_attr( $description_motion ) . '"' : '' ) . '>' . wp_kses_post( wpautop( self::replace_tokens( $subtitle, $post ) ) ) . '</div>';
		}
		$buttons = isset( $slide['buttons'] ) && is_array( $slide['buttons'] ) ? array_slice( $slide['buttons'], 0, 3 ) : array();
		if ( empty( $buttons ) && ! empty( $slide['button_text'] ?? $legacy['button_text'] ?? '' ) ) {
			$buttons[] = array( 'label' => $slide['button_text'] ?? $legacy['button_text'], 'url' => $slide['button_url'] ?? $slide['link'] ?? $legacy['link'] ?? '#', 'style' => 'primary' );
		}
		if ( ! isset( $settings['show_button'] ) || ! empty( $settings['show_button'] ) ) {
			$html .= '<div class="xsb-banner-actions">';
			foreach ( $buttons as $button ) {
				$label = sanitize_text_field( $button['label'] ?? '' );
				$url = esc_url( $button['url'] ?? '' );
				if ( ! $label || ! $url ) continue;
				$style = in_array( $button['style'] ?? 'primary', array( 'primary', 'secondary', 'outline', 'ghost' ), true ) ? $button['style'] : 'primary';
				$target = ! empty( $button['new_tab'] ) ? ' target="_blank" rel="noopener noreferrer' . ( ! empty( $button['nofollow'] ) ? ' nofollow' : '' ) . '"' : ( ! empty( $button['nofollow'] ) ? ' rel="nofollow"' : '' );
				$button_motion = self::element_animation_style( $settings, 'button_animation' );
				$html .= '<a class="xsb-banner-btn is-' . esc_attr( $style ) . '" href="' . $url . '"' . $target . ( $button_motion ? ' style="' . esc_attr( $button_motion ) . '"' : '' ) . '>' . esc_html( $label ) . '</a>';
			}
			$html .= '</div>';
		}
		if ( $post ) {
			$html .= '<p class="xsb-banner-meta"><time datetime="' . esc_attr( get_the_date( DATE_W3C, $post ) ) . '">' . esc_html( get_the_date( '', $post ) ) . '</time><span>' . esc_html( get_the_author_meta( 'display_name', $post->post_author ) ) . '</span></p>';
		}
		$html .= '</div></article>';
		return $html;
	}

	/** Generate dots, numbers, fraction or progress navigation. */
	private static function render_arrow_icon( $settings ) {
		$custom = $settings['arrow_custom_icon'] ?? '';
		$custom_url = is_array( $custom ) && ! empty( $custom['url'] ) ? esc_url( $custom['url'] ) : '';
		if ( $custom_url ) {
			return '<img class="xsb-banner-arrow-icon is-custom" src="' . $custom_url . '" alt="" aria-hidden="true" loading="lazy" />';
		}
		$icons = array(
			'chevron' => '<path d="m9 18 6-6-6-6" />',
			'angle' => '<path d="m14 5-7 7 7 7" />',
			'arrow' => '<path d="M5 12h14m-7-7 7 7-7 7" />',
			'long-arrow' => '<path d="M3 12h18m-8-8 8 8-8 8" />',
			'caret' => '<path d="m9 6 6 6-6 6" fill="currentColor" stroke="none" />',
		);
		$style = in_array( $settings['arrow_icon_style'] ?? 'chevron', array_keys( $icons ), true ) ? $settings['arrow_icon_style'] : 'chevron';
		return '<svg class="xsb-banner-arrow-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $icons[ $style ] . '</svg>';
	}

	/** Generate dots, numbers, fraction or progress navigation. */
	private static function render_pagination( $type, $count, $settings ) {
		$position = in_array( $settings['pagination_position'] ?? 'bottom', array( 'top', 'bottom' ), true ) ? $settings['pagination_position'] : 'bottom';
		$shape = in_array( $settings['dot_shape'] ?? 'square', array( 'circle', 'pill', 'square' ), true ) ? $settings['dot_shape'] : 'square';
		if ( 'fraction' === $type ) {
			return '<div class="xsb-banner-pagination is-fraction" data-position="' . esc_attr( $position ) . '" aria-hidden="true"><span data-banner-current>1</span><span>/</span><span>' . absint( $count ) . '</span></div>';
		}
		if ( 'progress' === $type ) {
			return '<div class="xsb-banner-pagination is-progress" data-position="' . esc_attr( $position ) . '" role="progressbar" aria-label="' . esc_attr__( 'Slide progress', 'xcodesol-page-builder' ) . '" aria-valuemin="1" aria-valuemax="' . absint( $count ) . '" aria-valuenow="1"><span data-banner-progress></span></div>';
		}
		$html = '<div class="xsb-banner-pagination is-' . esc_attr( 'numbers' === $type ? 'numbers' : 'dots' ) . '" data-position="' . esc_attr( $position ) . '" data-shape="' . esc_attr( $shape ) . '" role="group" aria-label="' . esc_attr__( 'Choose a slide', 'xcodesol-page-builder' ) . '">';
		for ( $i = 0; $i < $count; $i++ ) {
			$html .= '<button type="button" data-banner-to="' . $i . '"' . ( 0 === $i ? ' class="is-active" aria-current="true"' : '' ) . ' aria-label="' . esc_attr( sprintf( __( 'Show slide %d', 'xcodesol-page-builder' ), $i + 1 ) ) . '">' . ( 'numbers' === $type ? esc_html( (string) ( $i + 1 ) ) : '<span></span>' ) . '</button>';
		}
		return $html . '</div>';
	}

	private static function flex_x( $value ) {
		$map = array( 'left' => 'flex-start', 'center' => 'center', 'right' => 'flex-end' );
		return $map[ $value ] ?? 'center';
	}

	/** Build a safe entrance-animation style for a banner content element. */
	private static function element_animation_style( $settings, $key ) {
		if ( ! class_exists( 'XCOPB_Motion_Presets' ) ) {
			return '';
		}
		$animation = XCOPB_Motion_Presets::normalize_id( $settings[ $key ] ?? 'none' );
		$keyframe = XCOPB_Motion_Presets::keyframe( $animation );
		if ( '' === $keyframe ) {
			return '';
		}
		$duration = min( 5000, max( 100, absint( $settings['animation_duration'] ?? 600 ) ) );
		$delay = min( 3000, absint( $settings['animation_delay'] ?? 0 ) );
		$raw_easing = is_string( $settings['animation_easing'] ?? null ) ? $settings['animation_easing'] : 'ease';
		$raw_repeat = is_scalar( $settings['animation_repeat'] ?? null ) ? (string) $settings['animation_repeat'] : '1';
		$easing = in_array( $raw_easing, array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ), true ) ? $raw_easing : 'ease';
		$repeat = in_array( $raw_repeat, array( '1', '2', '3', 'infinite' ), true ) ? $raw_repeat : '1';
		return sprintf( 'animation-name:%s;animation-duration:%dms;animation-delay:%dms;animation-timing-function:%s;animation-iteration-count:%s;animation-fill-mode:both', esc_attr( $keyframe ), $duration, $delay, esc_attr( $easing ), esc_attr( $repeat ) );
	}

	private static function flex_y( $value ) {
		$map = array( 'top' => 'flex-start', 'center' => 'center', 'bottom' => 'flex-end' );
		return $map[ $value ] ?? 'center';
	}

	private static function ids( $value ) {
		if ( is_array( $value ) ) {
			$value = implode( ',', $value );
		}
		return array_values( array_filter( array_map( 'absint', preg_split( '/[,\s]+/', (string) $value ) ) ) );
	}

	private static function replace_tokens( $text, $post ) {
		if ( ! $post instanceof WP_Post ) {
			return $text;
		}
		$terms = get_the_category( $post->ID );
		$values = array(
			'{post_title}' => get_the_title( $post ),
			'{post_excerpt}' => has_excerpt( $post ) ? $post->post_excerpt : wp_trim_words( wp_strip_all_tags( $post->post_content ), 28 ),
			'{post_url}' => get_permalink( $post ),
			'{post_date}' => get_the_date( '', $post ),
			'{author}' => get_the_author_meta( 'display_name', $post->post_author ),
			'{category}' => ! empty( $terms ) ? $terms[0]->name : '',
		);
		foreach ( $values as $token => $value ) {
			$text = str_replace( $token, esc_html( (string) $value ), $text );
		}
		return $text;
	}

	/** Resolve only published posts of public post types for front-end output. */
	private static function get_public_post( $post_id ) {
		$post = get_post( absint( $post_id ) );
		if ( ! ( $post instanceof WP_Post ) || 'publish' !== $post->post_status ) {
			return null;
		}
		$public_types = get_post_types( array( 'public' => true ), 'names' );
		return in_array( $post->post_type, $public_types, true ) ? $post : null;
	}

	private static function enqueue_slider_assets() {
		$asset_file = XCOPB_PLUGIN_DIR . 'assets/admin/banner-slider.asset.php';
		$asset      = file_exists( $asset_file ) ? include $asset_file : array();
		$deps       = isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version    = $asset['version'] ?? XCOPB_VERSION;
		$handle     = 'xcopb-hero-banner-slider';

		if ( ! wp_script_is( $handle, 'registered' ) ) {
			wp_register_script( $handle, XCOPB_PLUGIN_URL . 'assets/admin/banner-slider.js', $deps, $version, true );
		}
		wp_enqueue_script( $handle );

		$style_file = XCOPB_PLUGIN_DIR . 'assets/admin/banner-slider.css';
		if ( file_exists( $style_file ) && ! wp_style_is( $handle, 'registered' ) ) {
			wp_register_style( $handle, XCOPB_PLUGIN_URL . 'assets/admin/banner-slider.css', array(), $version );
		}
		if ( wp_style_is( $handle, 'registered' ) ) {
			wp_enqueue_style( $handle );
		}
	}
}
