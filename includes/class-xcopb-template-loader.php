<?php
/**
 * Template loader that detects WordPress page views and loads Page Builder templates.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Template_Loader
 */
class XCOPB_Template_Loader {

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_Template_Loader|null
	 */
	private static $instance = null;

	/**
	 * Selected template ID for current request.
	 *
	 * @var int|null
	 */
	private static $selected_template_id = null;

	/**
	 * Current view type.
	 *
	 * @var string|null
	 */
	private static $view_type = null;

	/**
	 * Current context.
	 *
	 * @var array
	 */
	private static $context = array();

	/** Prevent duplicate inline settings when multiple builder blocks render. */
	private static $inline_settings_added = false;

	/** Convert a supported solid colour to RGBA for the site-background overlay. */
	private function color_with_alpha( $color, $alpha ) {
		$color = trim( (string) $color );
		$alpha = min( 1, max( 0, (float) $alpha ) );
		if ( preg_match( '/^#([a-f0-9]{3}|[a-f0-9]{6})$/i', $color, $match ) ) {
			$hex = $match[1];
			if ( 3 === strlen( $hex ) ) { $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2]; }
			return 'rgba(' . hexdec( substr( $hex, 0, 2 ) ) . ',' . hexdec( substr( $hex, 2, 2 ) ) . ',' . hexdec( substr( $hex, 4, 2 ) ) . ',' . $alpha . ')';
		}
		if ( preg_match( '/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[0-9.]+)?\s*\)$/i', $color, $match ) ) { return 'rgba(' . min( 255, (int) $match[1] ) . ',' . min( 255, (int) $match[2] ) . ',' . min( 255, (int) $match[3] ) . ',' . $alpha . ')'; }
		return '';
	}

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Template_Loader
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'template_redirect', array( $this, 'detect_and_select_template' ), 5 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_public_assets' ), 20 );
		add_filter( 'template_include', array( $this, 'override_template_include' ), 200 );
		add_filter( 'theme_templates', array( $this, 'register_page_templates' ), 10, 4 );
		add_filter( 'theme_page_templates', array( $this, 'register_page_templates' ), 10, 3 );
		add_filter( 'body_class', array( $this, 'filter_body_class' ) );
		add_filter( 'the_content', array( $this, 'filter_the_content' ), 10 );

		// Elementor-style "Edit with Xcodesol" affordances on the front
		// end: a floating button plus an admin-bar shortcut.
		add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_edit_link' ), 100 );
		add_action( 'wp_footer', array( $this, 'print_edit_button' ), 999 );
	}

	/**
	 * Enqueue public styles for templates.
	 */
	public function enqueue_public_styles() {
		if ( ! wp_style_is( 'xcopb-public', 'enqueued' ) ) {
			$css_file = file_exists( XCOPB_PLUGIN_DIR . 'assets/public/xpb-styles.css' )
				? 'assets/public/xpb-styles.css'
				: 'assets/public/xsb-styles.css';
			wp_enqueue_style( 'xcopb-public', XCOPB_PLUGIN_URL . $css_file, array(), XCOPB_VERSION );
		}
		$motion_file = XCOPB_PLUGIN_DIR . 'assets/shared/motion-presets.css';
		if ( file_exists( $motion_file ) ) {
			wp_enqueue_style( 'xcopb-motion-presets', XCOPB_PLUGIN_URL . 'assets/shared/motion-presets.css', array( 'xcopb-public' ), filemtime( $motion_file ) );
		}
		if ( self::$inline_settings_added ) { return; }
		self::$inline_settings_added = true;
		$inline = '.xcopb-hide-page-title .entry-title,.xcopb-hide-page-title .page-title,.xcopb-hide-page-title .wp-block-post-title,.xcopb-hide-page-title .elementor-page-title{display:none!important}';
		$site = get_option( 'xcopb_site_settings', array() );
		if ( is_array( $site ) ) {
			$colors = isset( $site['global_colors'] ) && is_array( $site['global_colors'] ) ? $site['global_colors'] : array();
			$vars = array();
			foreach ( array( 'primary', 'secondary', 'text', 'accent', 'background' ) as $key ) {
				$color = isset( $colors[ $key ] ) ? trim( (string) $colors[ $key ] ) : '';
				if ( $color && ! sanitize_hex_color( $color ) && ! preg_match( '/^(?:rgba?|hsla?)\(\s*[0-9.%+\-\s,\/]+\)$/i', $color ) && ! preg_match( '/^(?:transparent|currentcolor|[a-z]{3,20})$/i', $color ) ) { $color = ''; }
				if ( $color ) { $vars[] = '--xcopb-' . $key . ':' . $color; }
			}
			if ( $vars ) { $inline .= ':root{' . implode( ';', $vars ) . '}'; }
			if ( ! empty( $site['custom_colors'] ) && is_array( $site['custom_colors'] ) ) {
				foreach ( $site['custom_colors'] as $custom ) {
					$name = isset( $custom['name'] ) ? sanitize_title( $custom['name'] ) : '';
					$value = isset( $custom['value'] ) ? trim( (string) $custom['value'] ) : '';
					if ( $name && ( sanitize_hex_color( $value ) || preg_match( '/^(?:rgba?|hsla?)\(\s*[0-9.%+\-\s,\/]+\)$/i', $value ) || preg_match( '/^(?:transparent|currentcolor|[a-z]{3,20})$/i', $value ) ) ) { $inline .= ':root{--xcopb-custom-' . $name . ':' . $value . '}'; }
				}
			}
			if ( ! empty( $colors['background'] ) ) { $inline .= 'body{background-color:var(--xcopb-background)!important}'; }
			$background_image = isset( $site['background_image'] ) && is_array( $site['background_image'] ) ? $site['background_image'] : array();
			$background_style = isset( $site['background_image_style'] ) && is_array( $site['background_image_style'] ) ? $site['background_image_style'] : array();
			$background_url = ! empty( $background_image['url'] ) ? esc_url_raw( $background_image['url'] ) : '';
			if ( $background_url ) {
				$image_layers = array();
				$overlay = isset( $background_style['overlay'] ) ? $background_style['overlay'] : '';
				$opacity = isset( $background_style['overlay_opacity'] ) ? min( 100, max( 0, (int) $background_style['overlay_opacity'] ) ) / 100 : 0;
				if ( $overlay && $opacity > 0 ) { $overlay_rgb = $this->color_with_alpha( $overlay, $opacity ); if ( $overlay_rgb ) { $image_layers[] = 'linear-gradient(' . $overlay_rgb . ',' . $overlay_rgb . ')'; } }
				$image_layers[] = 'url("' . esc_url( $background_url ) . '")';
				$inline .= 'body{background-image:' . implode( ',', $image_layers ) . '!important;background-size:' . ( isset( $background_style['size'] ) && in_array( $background_style['size'], array( 'cover', 'contain', 'auto' ), true ) ? $background_style['size'] : 'cover' ) . '!important;background-position:' . ( isset( $background_style['position'] ) && preg_match( '/^(?:center|left|right) (?:center|top|bottom)$/', $background_style['position'] ) ? $background_style['position'] : 'center center' ) . '!important;background-repeat:' . ( isset( $background_style['repeat'] ) && in_array( $background_style['repeat'], array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y' ), true ) ? $background_style['repeat'] : 'no-repeat' ) . '!important;background-attachment:' . ( isset( $background_style['attachment'] ) && 'fixed' === $background_style['attachment'] ? 'fixed' : 'scroll' ) . '!important}';
			}
			if ( ! empty( $colors['text'] ) ) { $inline .= 'body{color:var(--xcopb-text)}'; }
			$fonts = isset( $site['global_fonts'] ) && is_array( $site['global_fonts'] ) ? $site['global_fonts'] : array();
			$body_font = isset( $fonts['body'] ) ? sanitize_text_field( $fonts['body'] ) : '';
			$heading_font = isset( $fonts['heading'] ) ? sanitize_text_field( $fonts['heading'] ) : '';
			if ( $body_font ) { $inline .= 'body{font-family:' . esc_attr( $body_font ) . ',sans-serif}'; }
			if ( $heading_font ) { $inline .= 'h1,h2,h3,h4,h5,h6{font-family:' . esc_attr( $heading_font ) . ',sans-serif}'; }
			$type = isset( $site['typography'] ) && is_array( $site['typography'] ) ? $site['typography'] : array();
			if ( isset( $type['body_size'] ) ) { $inline .= 'body{font-size:' . absint( $type['body_size'] ) . 'px}'; }
			if ( isset( $type['body_weight'] ) ) { $inline .= 'body{font-weight:' . absint( $type['body_weight'] ) . '}'; }
			if ( isset( $type['line_height'] ) ) { $inline .= 'body{line-height:' . esc_attr( (string) $type['line_height'] ) . '}'; }
			if ( isset( $type['paragraph_spacing'] ) ) { $inline .= 'p{margin-bottom:' . absint( $type['paragraph_spacing'] ) . 'px}'; }
			$button = isset( $site['button_style'] ) && is_array( $site['button_style'] ) ? $site['button_style'] : array();
			$button_css = array();
			foreach ( array( 'text' => 'color', 'background' => 'background-color' ) as $key => $property ) { if ( ! empty( $button[ $key ] ) ) { $button_css[] = $property . ':' . esc_attr( $button[ $key ] ) . '!important'; } }
			if ( ! empty( $button['gradient_enabled'] ) && ! empty( $button['gradient'] ) && is_array( $button['gradient'] ) ) { $gradient = $button['gradient']; if ( ! empty( $gradient['colorA'] ) && ! empty( $gradient['colorB'] ) ) { $button_css[] = 'background-image:' . ( isset( $gradient['type'] ) && 'radial' === $gradient['type'] ? 'radial-gradient(circle,' . esc_attr( $gradient['colorA'] ) . ' ' . absint( $gradient['posA'] ?? 0 ) . '%,' . esc_attr( $gradient['colorB'] ) . ' ' . absint( $gradient['posB'] ?? 100 ) . '%)' : 'linear-gradient(' . absint( $gradient['angle'] ?? 90 ) . 'deg,' . esc_attr( $gradient['colorA'] ) . ' ' . absint( $gradient['posA'] ?? 0 ) . '%,' . esc_attr( $gradient['colorB'] ) . ' ' . absint( $gradient['posB'] ?? 100 ) . '%)' ) . '!important'; } }
			$box_css = static function ( $value, $fallback = 0 ) { if ( is_array( $value ) ) { $parts = array(); foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) { $parts[] = absint( $value[ $side ] ?? $fallback ) . 'px'; } return implode( ' ', $parts ); } return absint( is_numeric( $value ) ? $value : $fallback ) . 'px'; };
			$radius = $box_css( $button['radius'] ?? 6, 6 );
			$padding = isset( $button['padding'] ) && is_array( $button['padding'] ) ? $box_css( $button['padding'] ) : absint( $button['padding_y'] ?? 12 ) . 'px ' . absint( $button['padding_x'] ?? 24 ) . 'px';
			$button_css[] = 'border-radius:' . $radius . '!important';
			$button_css[] = 'padding:' . $padding . '!important';
			foreach ( array( 'font_size' => 'font-size' ) as $key => $property ) { if ( isset( $button[ $key ] ) ) { $button_css[] = $property . ':' . absint( $button[ $key ] ) . 'px!important'; } }
			$button_css[] = 'border-width:' . $box_css( $button['border_width'] ?? 0 ) . '!important';
			if ( ! empty( $button['border_style'] ) && in_array( $button['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ) { $button_css[] = 'border-style:' . $button['border_style'] . '!important'; }
			if ( ! empty( $button['border_color'] ) ) { $button_css[] = 'border-color:' . esc_attr( $button['border_color'] ) . '!important'; }
			if ( ! empty( $button['shadow'] ) && 'none' !== $button['shadow'] && preg_match( '/^[\w\s#(),.%+\/-]+$/', $button['shadow'] ) && ! preg_match( '/[;{}<>]|url\s*\(|var\s*\(/i', $button['shadow'] ) ) { $button_css[] = 'box-shadow:' . esc_attr( $button['shadow'] ) . '!important'; }
			if ( $button_css ) { $inline .= '.xcopb-template-wrapper .xsb-button,.xcopb-template-wrapper .xcopb-button,.xcopb-template-wrapper .wp-block-button__link{' . implode( ';', $button_css ) . '}'; }
			$hover_css = array();
			foreach ( array( 'hover_text' => 'color', 'hover_background' => 'background-color' ) as $key => $property ) { if ( ! empty( $button[ $key ] ) ) { $hover_css[] = $property . ':' . esc_attr( $button[ $key ] ) . '!important'; } }
			if ( ! empty( $button['hover_gradient_enabled'] ) && ! empty( $button['hover_gradient'] ) && is_array( $button['hover_gradient'] ) ) { $gradient = $button['hover_gradient']; if ( ! empty( $gradient['colorA'] ) && ! empty( $gradient['colorB'] ) ) { $hover_css[] = 'background-image:' . ( isset( $gradient['type'] ) && 'radial' === $gradient['type'] ? 'radial-gradient(circle,' . esc_attr( $gradient['colorA'] ) . ' ' . absint( $gradient['posA'] ?? 0 ) . '%,' . esc_attr( $gradient['colorB'] ) . ' ' . absint( $gradient['posB'] ?? 100 ) . '%)' : 'linear-gradient(' . absint( $gradient['angle'] ?? 90 ) . 'deg,' . esc_attr( $gradient['colorA'] ) . ' ' . absint( $gradient['posA'] ?? 0 ) . '%,' . esc_attr( $gradient['colorB'] ) . ' ' . absint( $gradient['posB'] ?? 100 ) . '%)' ) . '!important'; } }
			if ( $hover_css ) { $inline .= '.xcopb-template-wrapper .xsb-button:hover,.xcopb-template-wrapper .xcopb-button:hover,.xcopb-template-wrapper .wp-block-button__link:hover{' . implode( ';', $hover_css ) . '}'; }
			if ( ! empty( $site['custom_css'] ) ) { $inline .= "\n" . $site['custom_css']; }
		}
		if ( is_singular() ) {
			$page_settings = get_post_meta( get_queried_object_id(), '_xcopb_page_settings', true );
			if ( is_array( $page_settings ) && ! empty( $page_settings['custom_css'] ) ) {
				$inline .= "\n" . str_replace( 'selector', 'body.page-id-' . absint( get_queried_object_id() ) . ' .xcopb-template-wrapper', $page_settings['custom_css'] );
			}
		}
		wp_add_inline_style( 'xcopb-public', $inline );
	}

	/**
	 * Enqueue assets for a specific template (used by shortcodes).
	 *
	 * @param int $template_id Template ID.
	 */
	public function enqueue_public_assets_for_template( $template_id ) {
		$this->enqueue_public_styles();
	}

	/**
	 * Enqueue public styles when a template is selected.
	 */
	public function enqueue_public_assets() {
		$site_settings = get_option( 'xcopb_site_settings', array() );
		if ( is_array( $site_settings ) && ( ! empty( $site_settings['custom_css'] ) || ! empty( $site_settings['button_style'] ) || ! empty( $site_settings['typography'] ) || ! empty( $site_settings['global_colors'] ) || ! empty( $site_settings['background_image'] ) ) ) { $this->enqueue_public_styles(); }
		if ( null !== self::$selected_template_id || is_singular( XCOPB_Registrar::POST_TYPE ) || is_singular( 'xcosb_template' ) ) {
			$this->enqueue_public_styles();
			return;
		}

		if ( is_singular() ) {
			$post_id = get_the_ID();
			$tpl     = get_post_meta( $post_id, '_wp_page_template', true );
			$hide_title = '1' === (string) get_post_meta( $post_id, '_xcopb_hide_title', true );
			$page_settings = get_post_meta( $post_id, '_xcopb_page_settings', true );
			if ( $hide_title || ( is_array( $page_settings ) && ! empty( $page_settings ) ) ) {
				$this->enqueue_public_styles();
			}
			if ( in_array( $tpl, array( 'xcopb_canvas', 'xcopb_full_width', 'elementor_canvas', 'elementor_header_footer' ), true ) ) {
				$this->enqueue_public_styles();
				return;
			}
			$layout = get_post_meta( $post_id, '_xcopb_layout', true );
			if ( ! empty( $layout ) && '[]' !== $layout ) {
				$this->enqueue_public_styles();
				return;
			}
		}
	}

	/**
	 * Detect current WordPress view and select a matching template.
	 */
	public function detect_and_select_template() {
		if ( is_admin() ) {
			return;
		}

		// Direct frontend live editor mode (Elementor style):
		if ( isset( $_GET['xcopb_editor'] ) && ! empty( $_GET['xcopb_editor'] ) ) {
			$this->handle_frontend_editor();
			return;
		}

		// When previewing or viewing a template CPT post directly:
		if ( is_singular( XCOPB_Registrar::POST_TYPE ) || is_singular( 'xcosb_template' ) ) {
			$post_id                    = get_the_ID();
			$tpl_view                   = XCOPB_Registrar::get_field( $post_id, '_xcopb_view_type', 'page' );
			self::$selected_template_id = $post_id;
			self::$view_type            = $tpl_view;
			self::$context              = array( 'view_type' => $tpl_view, 'post_id' => $post_id );
			add_filter( 'template_include', array( $this, 'override_template_include' ), 200 );
			return;
		}

		// When viewing any single page or post that has direct Xcodesol Page Builder content:
		if ( is_singular() ) {
			$post_id       = get_the_ID();
			$direct_layout = get_post_meta( $post_id, '_xcopb_layout', true );
			if ( ! empty( $direct_layout ) && '[]' !== $direct_layout ) {
				$tpl_view                   = is_page() ? 'page' : 'single_post';
				self::$selected_template_id = $post_id;
				self::$view_type            = $tpl_view;
				self::$context              = array( 'view_type' => $tpl_view, 'post_id' => $post_id );
				add_filter( 'template_include', array( $this, 'override_template_include' ), 200 );
				return;
			}
		}

		$view_type = $this->detect_view_type();

		if ( ! $view_type ) {
			return;
		}

		$context = $this->build_context( $view_type );

		$template_id = $this->find_matching_template( $view_type, $context );

		if ( $template_id ) {
			self::$selected_template_id = $template_id;
			self::$view_type            = $view_type;
			self::$context              = $context;

			add_filter( 'template_include', array( $this, 'override_template_include' ), 200 );
		}
	}

	/**
	 * Detect the current page view type.
	 *
	 * @return string|false View type slug or false.
	 */
	private function detect_view_type() {
		if ( is_front_page() ) {
			return 'page';
		}

		if ( is_home() ) {
			return 'archive';
		}

		if ( is_page() ) {
			return 'page';
		}

		if ( is_single() ) {
			return 'single_post';
		}

		if ( is_archive() || is_category() || is_tag() || is_author() || is_date() || is_search() ) {
			return 'archive';
		}

		return false;
	}

	/**
	 * Build context array for conditions evaluation.
	 *
	 * @param string $view_type View type slug.
	 * @return array
	 */
	private function build_context( $view_type ) {
		$context = array(
			'view_type' => $view_type,
			'post_id'   => get_the_ID(),
		);

		if ( is_singular() ) {
			$context['post_type'] = get_post_type();
			$categories           = wp_get_post_categories( get_the_ID() );
			if ( ! empty( $categories ) ) {
				$context['categories'] = $categories;
			}
			$tags = wp_get_post_tags( get_the_ID(), array( 'fields' => 'ids' ) );
			if ( ! empty( $tags ) ) {
				$context['tags'] = $tags;
			}
		}

		if ( is_category() ) {
			$cat = get_queried_object();
			if ( $cat && isset( $cat->term_id ) ) {
				$context['term_id']  = $cat->term_id;
				$context['taxonomy'] = 'category';
			}
		} elseif ( is_tag() ) {
			$tag = get_queried_object();
			if ( $tag && isset( $tag->term_id ) ) {
				$context['term_id']  = $tag->term_id;
				$context['taxonomy'] = 'post_tag';
			}
		}

		return $context;
	}

	/**
	 * Find the first matching template for the view type and context.
	 *
	 * @param string $view_type View type slug.
	 * @param array  $context   Context data.
	 * @return int|null Template post ID or null.
	 */
	private function find_matching_template( $view_type, $context ) {
		$view_types_to_try = array( $view_type );
		if ( 'single_post' === $view_type ) {
			$view_types_to_try[] = 'single';
		}

		foreach ( $view_types_to_try as $vt ) {
			$template_ids = XCOPB_Registrar::get_templates_by_view_type( $vt );
			if ( empty( $template_ids ) ) {
				continue;
			}

			foreach ( $template_ids as $template_id ) {
				if ( class_exists( 'XCOPB_Conditions' ) && XCOPB_Conditions::instance()->evaluate_template( $template_id, $context ) ) {
					return $template_id;
				}
			}
		}

		return null;
	}

	/**
	 * Override template_include to return our page renderer or custom templates.
	 *
	 * @param string $template Current template path.
	 * @return string
	 */
	public function override_template_include( $template ) {
		if ( is_singular() ) {
			$page_template = get_post_meta( get_the_ID(), '_wp_page_template', true );

			if ( in_array( $page_template, array( 'xcopb_canvas', 'elementor_canvas' ), true ) ) {
				$canvas_file = XCOPB_PLUGIN_DIR . 'templates/page-builder-canvas.php';
				if ( file_exists( $canvas_file ) ) {
					return $canvas_file;
				}
			}

			if ( in_array( $page_template, array( 'xcopb_full_width', 'elementor_header_footer' ), true ) ) {
				$full_width_file = XCOPB_PLUGIN_DIR . 'templates/page-builder-full-width.php';
				if ( file_exists( $full_width_file ) ) {
					return $full_width_file;
				}
			}

			// Let Elementor and the active theme keep control of their own page
			// layouts. Our content filter still renders the saved builder layout
			// inside their template, while Canvas / Full Width above stay native
			// Xcodesol layouts.
			if ( '' !== $page_template && 'default' !== $page_template ) {
				return $template;
			}
		}

		if ( null !== self::$selected_template_id ) {
			if ( 'single_post' === self::$view_type || 'single' === self::$view_type ) {
				$file = XCOPB_PLUGIN_DIR . 'renderers/single-post.php';
				if ( file_exists( $file ) ) {
					return $file;
				}
			} elseif ( 'archive' === self::$view_type ) {
				$file = XCOPB_PLUGIN_DIR . 'renderers/archive.php';
				if ( file_exists( $file ) ) {
					return $file;
				}
			}
			return XCOPB_PLUGIN_DIR . 'renderers/page.php';
		}

		return $template;
	}

	/**
	 * Register custom Elementor-style page templates with WordPress.
	 *
	 * @param array $templates Registered templates list.
	 * @return array
	 */
	public function register_page_templates( $templates ) {
		if ( ! is_array( $templates ) ) {
			$templates = array();
		}

		$templates['xcopb_full_width'] = __( 'Page Builder Full Width', 'xcodesol-page-builder' );
		$templates['xcopb_canvas']     = __( 'Page Builder Canvas', 'xcodesol-page-builder' );
		if ( ! isset( $templates['elementor_canvas'] ) ) { $templates['elementor_canvas'] = __( 'Elementor Canvas', 'xcodesol-page-builder' ); }
		if ( ! isset( $templates['elementor_header_footer'] ) ) { $templates['elementor_header_footer'] = __( 'Elementor Full Width', 'xcodesol-page-builder' ); }

		return $templates;
	}

	/**
	 * Add Elementor-style full-width classes to the body tag.
	 *
	 * @param string[] $classes Body classes.
	 * @return string[]
	 */
	public function filter_body_class( $classes ) {
		$is_builder_active = false;
		if ( is_singular() && '1' === (string) get_post_meta( get_the_ID(), '_xcopb_hide_title', true ) ) {
			$classes[] = 'xcopb-hide-page-title';
		}

		if ( null !== self::$selected_template_id || is_singular( XCOPB_Registrar::POST_TYPE ) || is_singular( 'xcosb_template' ) ) {
			$is_builder_active = true;
		} elseif ( is_singular() ) {
			$tpl = get_post_meta( get_the_ID(), '_wp_page_template', true );
			if ( in_array( $tpl, array( 'xcopb_canvas', 'xcopb_full_width', 'elementor_canvas', 'elementor_header_footer' ), true ) ) {
				$is_builder_active = true;
				if ( in_array( $tpl, array( 'xcopb_canvas', 'elementor_canvas' ), true ) ) {
					$classes[] = 'xcopb-canvas';
				}
			}
		}

		if ( $is_builder_active ) {
			$classes[] = 'xcopb-page';
			$classes[] = 'xcopb-template-full-width';
			$classes[] = 'xcopb-full-width';
			$classes[] = 'xsb-template-full-width';
		}

		return $classes;
	}

	/**
	 * Get the selected template ID.
	 *
	 * @return int|null
	 */
	public static function get_selected_template_id() {
		return self::$selected_template_id;
	}

	/**
	 * Get the current view type.
	 *
	 * @return string|null
	 */
	public static function get_view_type() {
		return self::$view_type;
	}

	/**
	 * Get the current context.
	 *
	 * @return array
	 */
	public static function get_context() {
		return self::$context;
	}

	/**
	 * Whether current request allows editing the template.
	 *
	 * @return bool
	 */
	/**
	 * Filter the_content to render Page Builder layout when direct layout is present.
	 *
	 * @param string $content Post content.
	 * @return string
	 */
	public function filter_the_content( $content ) {
		if ( is_singular() && in_the_loop() && is_main_query() ) {
			$post_id     = get_the_ID();
			$layout_json = get_post_meta( $post_id, '_xcopb_layout', true );
			if ( ! empty( $layout_json ) && '[]' !== $layout_json && ! defined( 'XCOPB_IN_TEMPLATE_RENDERER' ) ) {
				$this->enqueue_public_styles();
				return XCOPB_Renderer::instance()->render( $post_id );
			}
		}
		return $content;
	}

	/**
	 * Whether current request allows editing with the builder.
	 *
	 * @return bool
	 */
	private function can_edit_current_template() {
		if ( is_admin() ) {
			return false;
		}

		$template_id = self::$selected_template_id;
		if ( ! $template_id && is_singular() ) {
			$template_id = get_the_ID();
		}

		if ( ! $template_id ) {
			return false;
		}

		return current_user_can( 'edit_post', $template_id );
	}

	/**
	 * Full-screen Elementor-style builder URL for a template or post.
	 *
	 * @param int $template_id Template or post ID.
	 * @return string
	 */
	private function get_frame_edit_url( $template_id ) {
		$id = absint( $template_id );
		if ( class_exists( 'XCOPB_Admin' ) ) {
			return XCOPB_Admin::get_builder_edit_url( $id );
		}
		return admin_url( 'admin.php?page=xcopb-builder&post=' . $id );
	}

	/**
	 * Handle direct frontend live builder editing mode (Elementor style).
	 */
	public function handle_frontend_editor() {
		$post_id = get_the_ID();
		if ( ! $post_id && isset( $_GET['post'] ) ) {
			$post_id = absint( $_GET['post'] );
		}
		if ( ! $post_id && isset( $_GET['p'] ) ) {
			$post_id = absint( $_GET['p'] );
		}
		if ( ! $post_id && isset( $_GET['page_id'] ) ) {
			$post_id = absint( $_GET['page_id'] );
		}

		$post = get_post( $post_id );
		if ( ! $post || ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'You are not allowed to edit this content.', 'xcodesol-page-builder' ) );
		}

		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, 'xcopb_edit_builder_' . $post_id ) ) {
			wp_die( esc_html__( 'Invalid builder request.', 'xcodesol-page-builder' ) );
		}

		show_admin_bar( false );

		add_action( 'wp_enqueue_scripts', function() use ( $post_id, $post ) {
			$back_url = isset( $_GET['back'] ) ? esc_url_raw( wp_unslash( $_GET['back'] ) ) : '';
			if ( empty( $back_url ) ) {
				if ( 'page' === $post->post_type ) {
					$back_url = admin_url( 'edit.php?post_type=page' );
				} elseif ( 'post' === $post->post_type ) {
					$back_url = admin_url( 'edit.php' );
				} elseif ( XCOPB_Registrar::POST_TYPE === $post->post_type ) {
					$back_url = admin_url( 'edit.php?post_type=' . XCOPB_Registrar::POST_TYPE );
				} else {
					$back_url = admin_url( 'edit.php?post_type=' . $post->post_type );
				}
			}

			if ( class_exists( 'XCOPB_Admin' ) ) {
				XCOPB_Admin::instance()->enqueue_builder_assets( $post_id, array( 'backUrl' => $back_url ) );
			}
		}, 999 );

		add_filter( 'template_include', function() {
			return XCOPB_PLUGIN_DIR . 'templates/page-builder-editor.php';
		}, 9999 );
	}

	/**
	 * Full-screen builder URL for current page or template.
	 *
	 * @return string
	 */
	private function get_edit_url() {
		$template_id = self::$selected_template_id;
		if ( ! $template_id && is_singular() ) {
			$template_id = get_the_ID();
		}
		return $this->get_frame_edit_url( $template_id );
	}

	/**
	 * Add an "Edit with Xcodesol" node to the admin bar on template and post pages.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin bar instance.
	 * @return void
	 */
	public function add_admin_bar_edit_link( $wp_admin_bar ) {
		if ( ! $this->can_edit_current_template() || ! is_admin_bar_showing() ) {
			return;
		}

		$wp_admin_bar->add_node( array(
			'id'    => 'xpb-edit-builder',
			'title' => '<span class="ab-icon dashicons dashicons-layout"></span><span class="ab-label">' . esc_html__( 'Edit with Xcodesol', 'xcodesol-page-builder' ) . '</span>',
			'href'  => $this->get_edit_url(),
			'meta'  => array(
				'target' => '_blank',
				'class'  => 'xpb-edit-builder-admin xsb-edit-builder-admin',
			),
		) );
	}

	/**
	 * Floating "Edit with Xcodesol" pill on the front end (Elementor style).
	 *
	 * @return void
	 */
	public function print_edit_button() {
		if ( isset( $_GET['xcopb_editor'] ) ) {
			return;
		}

		if ( ! $this->can_edit_current_template() ) {
			return;
		}

		$edit_url = $this->get_edit_url();
		?>
		<div class="xpb-edit-builder xsb-edit-builder" style="position:fixed;bottom:20px;right:20px;z-index:99999;">
			<a class="xpb-edit-builder__pill xsb-edit-builder__pill" href="<?php echo esc_url( $edit_url ); ?>" target="_blank" rel="noopener" title="<?php echo esc_attr__( 'Edit with Xcodesol', 'xcodesol-page-builder' ); ?>" style="display:inline-flex;align-items:center;gap:8px;background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
				<span><?php echo esc_html__( 'Edit with Xcodesol', 'xcodesol-page-builder' ); ?></span>
			</a>
		</div>
		<?php
	}

	/**
	 * Render header.
	 */
	public static function print_header() {
		if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() && function_exists( 'block_header_area' ) ) {
			?>
			<!doctype html>
			<html <?php language_attributes(); ?>>
			<head>
				<meta charset="<?php bloginfo( 'charset' ); ?>" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<?php wp_head(); ?>
			</head>
			<body <?php body_class( 'xcopb-template-full-width xcopb-full-width' ); ?>>
			<?php wp_body_open(); ?>
			<?php block_header_area(); ?>
			<?php
			return;
		}

		get_header();
	}

	/**
	 * Render footer.
	 */
	public static function print_footer() {
		if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() && function_exists( 'block_footer_area' ) ) {
			?>
			<?php block_footer_area(); ?>
			<?php wp_footer(); ?>
			</body>
			</html>
			<?php
			return;
		}

		get_footer();
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Template_Loader', 'XCOSB_Template_Loader' );
