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
			'posts_per_page'      => min( 20, max( 1, absint( $settings['posts_count'] ?? 3 ) ) ),
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
		if ( $category && 'post' === $post_type ) {
			$args['cat'] = $category;
		}
		if ( $tag && 'post' === $post_type ) {
			$args['tag_id'] = $tag;
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
			'button_text' => __( 'Read more', 'xcodesol-page-builder' ),
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
		$enabled = ! empty( $settings['slider_enabled'] ) && count( $slides ) > 1;
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
		$root_attrs = ' class="' . esc_attr( implode( ' ', $root_classes ) ) . '" style="' . esc_attr( $frame_style ) . '"';
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
		foreach ( $slides as $index => $slide ) {
			$html .= self::render_slide( $slide, $index, count( $slides ), $settings, $legacy_slide, $overlay_color, $overlay_opacity, $content_position, $enabled );
		}

		if ( $enabled && ! empty( $settings['show_arrows'] ) ) {
			$html .= '<button type="button" class="xsb-banner-arrow xsb-banner-arrow--previous" data-banner-prev aria-label="' . esc_attr__( 'Previous slide', 'xcodesol-page-builder' ) . '"><span aria-hidden="true">&#8592;</span></button>';
			$html .= '<button type="button" class="xsb-banner-arrow xsb-banner-arrow--next" data-banner-next aria-label="' . esc_attr__( 'Next slide', 'xcodesol-page-builder' ) . '"><span aria-hidden="true">&#8594;</span></button>';
		}
		if ( $enabled && 'none' !== ( $settings['pagination'] ?? 'dots' ) ) {
			$html .= self::render_pagination( $settings['pagination'], count( $slides ) );
		}
		if ( $enabled && ! empty( $settings['autoplay'] ) ) {
			$html .= '<button type="button" class="xsb-banner-pause" data-banner-pause aria-label="' . esc_attr__( 'Pause slide rotation', 'xcodesol-page-builder' ) . '" aria-pressed="false"><span aria-hidden="true">&#10074;&#10074;</span></button>';
		}
		$html .= '</div>';

		if ( $enabled ) {
			XCOPB_Block_Registry::add_frontend_script( self::slider_script() );
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
		$classes = 'xsb-banner-slide' . ( $active ? ' is-active' : '' );
		$position_x = $settings['content_position_x'] ?? 'center';
		$position_y = $settings['content_position_y'] ?? 'center';
		$slide_style .= 'display:flex;flex-direction:column;justify-content:' . esc_attr( self::flex_y( $position_y ) ) . ';align-items:' . esc_attr( self::flex_x( $position_x ) ) . ';padding:' . absint( $settings['padding_top'] ?? 80 ) . 'px ' . absint( $settings['padding_right'] ?? 24 ) . 'px ' . absint( $settings['padding_bottom'] ?? 80 ) . 'px ' . absint( $settings['padding_left'] ?? 24 ) . 'px;box-sizing:border-box;';
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
			$content_style .= 'background:' . esc_attr( $settings['content_box_bg'] ?? 'rgba(0,0,0,.35)' ) . ';padding:' . absint( $settings['content_box_padding'] ?? 28 ) . 'px;border-radius:' . absint( $settings['content_box_radius'] ?? 16 ) . 'px;';
		}
		$html .= '<div class="xsb-banner-content" style="' . esc_attr( $content_style ) . '" data-banner-content>';
		if ( $badge ) {
			$html .= '<p class="xsb-banner-badge">' . esc_html( $badge ) . '</p>';
		}
		if ( $title ) {
			$title_style = 'color:' . esc_attr( $settings['title_color'] ?? '#ffffff' ) . ';font-size:' . absint( $settings['title_font_size'] ?? 48 ) . 'px;font-weight:' . absint( $settings['title_font_weight'] ?? 700 ) . ';line-height:' . esc_attr( $settings['title_line_height'] ?? 1.2 ) . ';letter-spacing:' . esc_attr( (float) ( $settings['title_letter_spacing'] ?? 0 ) ) . 'px;text-transform:' . esc_attr( $settings['title_text_transform'] ?? 'none' ) . ';';
			$html .= '<' . $title_tag . ' class="xsb-banner-title" style="' . $title_style . '">' . esc_html( $title ) . '</' . $title_tag . '>';
		}
		if ( $subtitle ) {
			$subtitle_style = 'color:' . esc_attr( $settings['subtitle_color'] ?? '#ffffff' ) . ';font-size:' . absint( $settings['subtitle_font_size'] ?? 18 ) . 'px;font-weight:' . absint( $settings['subtitle_font_weight'] ?? 400 ) . ';line-height:' . esc_attr( $settings['subtitle_line_height'] ?? 1.5 ) . ';letter-spacing:' . esc_attr( (float) ( $settings['subtitle_letter_spacing'] ?? 0 ) ) . 'px;';
			if ( ! empty( $settings['subtitle_font_family'] ) ) {
				$subtitle_style .= 'font-family:' . esc_attr( $settings['subtitle_font_family'] ) . ';';
			}
			$html .= '<div class="xsb-banner-subtitle" style="' . $subtitle_style . '">' . wp_kses_post( wpautop( self::replace_tokens( $subtitle, $post ) ) ) . '</div>';
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
				$button_bg = 'primary' === $style ? ( $settings['button_bg_color'] ?? '#4f46e5' ) : ( 'secondary' === $style ? '#ffffff' : 'transparent' );
				$button_color = 'secondary' === $style ? '#172033' : ( $settings['button_text_color'] ?? '#ffffff' );
				$button_border = 'ghost' === $style ? 'transparent' : ( 'secondary' === $style ? '#ffffff' : ( $settings['button_border_color'] ?? '#ffffff' ) );
				$button_style = 'background-color:' . esc_attr( $button_bg ) . ';color:' . esc_attr( $button_color ) . ';border:' . absint( $settings['button_border_width'] ?? 2 ) . 'px solid ' . esc_attr( $button_border ) . ';padding:' . absint( $settings['button_padding_y'] ?? 12 ) . 'px ' . absint( $settings['button_padding_x'] ?? 24 ) . 'px;border-radius:' . absint( $settings['button_border_radius'] ?? 4 ) . 'px;';
				if ( ! empty( $settings['button_font_family'] ) ) {
					$button_style .= 'font-family:' . esc_attr( $settings['button_font_family'] ) . ';';
				}
				$target = ! empty( $button['new_tab'] ) ? ' target="_blank" rel="noopener noreferrer' . ( ! empty( $button['nofollow'] ) ? ' nofollow' : '' ) . '"' : ( ! empty( $button['nofollow'] ) ? ' rel="nofollow"' : '' );
				$html .= '<a class="xsb-banner-btn is-' . esc_attr( $style ) . '" href="' . $url . '" style="' . esc_attr( $button_style ) . '"' . $target . '>' . esc_html( $label ) . '</a>';
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
	private static function render_pagination( $type, $count ) {
		if ( 'fraction' === $type ) {
			return '<div class="xsb-banner-pagination is-fraction" aria-hidden="true"><span data-banner-current>1</span><span>/</span><span>' . absint( $count ) . '</span></div>';
		}
		if ( 'progress' === $type ) {
			return '<div class="xsb-banner-pagination is-progress" role="progressbar" aria-label="' . esc_attr__( 'Slide progress', 'xcodesol-page-builder' ) . '" aria-valuemin="1" aria-valuemax="' . absint( $count ) . '" aria-valuenow="1"><span data-banner-progress></span></div>';
		}
		$html = '<div class="xsb-banner-pagination is-' . esc_attr( 'numbers' === $type ? 'numbers' : 'dots' ) . '" role="group" aria-label="' . esc_attr__( 'Choose a slide', 'xcodesol-page-builder' ) . '">';
		for ( $i = 0; $i < $count; $i++ ) {
			$html .= '<button type="button" data-banner-to="' . $i . '"' . ( 0 === $i ? ' class="is-active" aria-current="true"' : '' ) . ' aria-label="' . esc_attr( sprintf( __( 'Show slide %d', 'xcodesol-page-builder' ), $i + 1 ) ) . '">' . ( 'numbers' === $type ? esc_html( (string) ( $i + 1 ) ) : '<span></span>' ) . '</button>';
		}
		return $html . '</div>';
	}

	private static function flex_x( $value ) {
		$map = array( 'left' => 'flex-start', 'center' => 'center', 'right' => 'flex-end' );
		return $map[ $value ] ?? 'center';
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

	private static function slider_script() {
		return "document.querySelectorAll('.xsb-banner-slider:not([data-banner-ready])').forEach(function(root){root.dataset.bannerReady='1';var slides=Array.from(root.querySelectorAll('[data-banner-slide]'));if(slides.length<2)return;var index=0,timer=null,paused=false,reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,startX=null;function show(next){var target=root.dataset.loop==='true'?(next+slides.length)%slides.length:Math.max(0,Math.min(slides.length-1,next));var before=new CustomEvent('xcopb:beforeRender',{cancelable:true,detail:{index:target,slide:slides[target]}});root.dispatchEvent(before);if(before.defaultPrevented)return;index=target;slides.forEach(function(slide,i){var active=i===index;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',active?'false':'true');if('inert'in slide)slide.inert=!active;});root.querySelectorAll('[data-banner-to]').forEach(function(button,i){button.classList.toggle('is-active',i===index);if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});var current=root.querySelector('[data-banner-current]');if(current)current.textContent=String(index+1);var progress=root.querySelector('[data-banner-progress]');if(progress)progress.style.width=((index+1)/slides.length*100)+'%';var bar=progress&&progress.parentElement;if(bar)bar.setAttribute('aria-valuenow',String(index+1));var change=new CustomEvent('xcopb:slidechange',{detail:{index:index,slide:slides[index]}});root.dispatchEvent(change);if(typeof root.xcopbOnSlideChange==='function')root.xcopbOnSlideChange(change.detail);}function stop(){if(timer){window.clearInterval(timer);timer=null;}}function start(){stop();if(root.dataset.autoplay==='true'&&!paused&&!reduced&&!document.hidden)timer=window.setInterval(function(){if(root.dataset.loop!=='true'&&index>=slides.length-1){stop();return;}show(index+1);},Math.max(1000,Number(root.dataset.delay)||5000));}root.addEventListener('click',function(event){var next=event.target.closest('[data-banner-next]'),previous=event.target.closest('[data-banner-prev]'),to=event.target.closest('[data-banner-to]'),pause=event.target.closest('[data-banner-pause]');if(next)show(index+1);if(previous)show(index-1);if(to)show(Number(to.dataset.bannerTo));if((next||previous||to)&&root.dataset.pauseInteraction==='true'&&root.dataset.autoplay==='true'){paused=true;stop();var pauseButton=root.querySelector('[data-banner-pause]');if(pauseButton){pauseButton.setAttribute('aria-pressed','true');pauseButton.setAttribute('aria-label','Resume slide rotation');pauseButton.querySelector('span').textContent=String.fromCharCode(9654);}}if(pause){paused=!paused;pause.setAttribute('aria-pressed',paused?'true':'false');pause.setAttribute('aria-label',paused?'Resume slide rotation':'Pause slide rotation');pause.querySelector('span').textContent=paused?String.fromCharCode(9654):String.fromCharCode(10074,10074);start();}});root.addEventListener('keydown',function(event){if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}});root.addEventListener('pointerdown',function(event){if(event.target.closest('a,button'))return;startX=event.clientX;});root.addEventListener('pointerup',function(event){if(startX===null)return;var delta=event.clientX-startX;startX=null;if(Math.abs(delta)>48)show(index+(delta<0?1:-1));});if(root.dataset.pauseHover==='true'){root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',start);root.addEventListener('focusin',stop);root.addEventListener('focusout',function(event){if(!root.contains(event.relatedTarget))start();});}function onVisibility(){if(!root.isConnected){stop();document.removeEventListener('visibilitychange',onVisibility);return;}start();}document.addEventListener('visibilitychange',onVisibility);var observer=new MutationObserver(function(){if(!root.isConnected){stop();document.removeEventListener('visibilitychange',onVisibility);observer.disconnect();}});observer.observe(document.documentElement,{childList:true,subtree:true});start();});";
	}
}
