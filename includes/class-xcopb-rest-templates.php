<?php
/**
 * REST API controller for WTB templates.
 *
 * Namespace: xcosb/v1
 * Resource:  /templates
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_REST_Templates
 */
class XCOPB_REST_Templates extends WP_REST_Controller {

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_REST_Templates|null
	 */
	private static $instance = null;

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'xcopb/v1';

	/**
	 * REST resource base.
	 *
	 * @var string
	 */
	protected $rest_base = 'templates';

	/**
	 * Get instance.
	 *
	 * @return XCOPB_REST_Templates
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
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this, 'register_legacy_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	
	/**
	 * Register legacy xcosb/v1 routes for backwards compatibility.
	 */
	public function register_legacy_routes() {
		$old_ns = 'xcosb/v1';
		register_rest_route( $old_ns, '/' . $this->rest_base, array(
			array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_templates' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
			array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'create_template' ), 'permission_callback' => array( $this, 'check_permissions' ), 'args' => $this->get_update_args() ),
		) );
		register_rest_route( $old_ns, '/' . $this->rest_base . '/(?P<id>\d+)', array(
			array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_template' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
			array( 'methods' => WP_REST_Server::EDITABLE, 'callback' => array( $this, 'update_template' ), 'permission_callback' => array( $this, 'check_permissions' ), 'args' => $this->get_update_args() ),
			array( 'methods' => WP_REST_Server::DELETABLE, 'callback' => array( $this, 'delete_template' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
		) );
		register_rest_route( $old_ns, '/' . $this->rest_base . '/import', array(
			'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'import_template' ), 'permission_callback' => array( $this, 'check_permissions' ),
		) );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/site-settings', array(
			array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_site_settings' ), 'permission_callback' => array( $this, 'check_site_settings_permissions' ) ),
			array( 'methods' => WP_REST_Server::EDITABLE, 'callback' => array( $this, 'update_site_settings' ), 'permission_callback' => array( $this, 'check_site_settings_permissions' ) ),
		) );
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_templates' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
					'args'                => $this->get_update_args(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
					'args'                => $this->get_update_args(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/export',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'export_template' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/import',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'import_template' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);
	}

	/**
	 * Permission callback.
	 *
	 * @return bool
	 */
	/**
	 * Permission callback.
	 *
	 * @param WP_REST_Request|null $request Request object.
	 * @return bool
	 */
	public function check_permissions( $request = null ) {
		if ( $request instanceof WP_REST_Request ) {
			$id = absint( $request->get_param( 'id' ) );
			if ( $id && current_user_can( 'edit_post', $id ) ) {
				return true;
			}
		}
		return current_user_can( 'edit_pages' ) || current_user_can( 'edit_posts' ) || current_user_can( 'manage_options' );
	}

	public function check_site_settings_permissions() { return current_user_can( 'manage_options' ); }

	public function get_site_settings() {
		$theme = function_exists( 'wp_get_global_settings' ) ? wp_get_global_settings() : array();
		$theme_styles = function_exists( 'wp_get_global_styles' ) ? wp_get_global_styles() : array();
		$theme_colors = isset( $theme['color']['palette']['theme'] ) && is_array( $theme['color']['palette']['theme'] ) ? $theme['color']['palette']['theme'] : array();
		$pick = static function ( $needles, $fallback ) use ( $theme_colors ) { foreach ( $theme_colors as $item ) { $name = strtolower( isset( $item['slug'] ) ? $item['slug'] : ( isset( $item['name'] ) ? $item['name'] : '' ) ); if ( $name && false !== array_filter( $needles, static function ( $needle ) use ( $name ) { return false !== strpos( $name, $needle ); } ) && ! empty( $item['color'] ) ) { return $item['color']; } } return $fallback; };
		$body_font = isset( $theme_styles['typography']['fontFamily'] ) ? $theme_styles['typography']['fontFamily'] : ( isset( $theme['typography']['fontFamilies']['theme'][0]['fontFamily'] ) ? $theme['typography']['fontFamilies']['theme'][0]['fontFamily'] : 'system-ui' );
		$heading_font = isset( $theme_styles['elements']['heading']['typography']['fontFamily'] ) ? $theme_styles['elements']['heading']['typography']['fontFamily'] : $body_font;
		$theme_text = isset( $theme_styles['color']['text'] ) ? $theme_styles['color']['text'] : ( get_theme_mod( 'body_text_color', get_theme_mod( 'text_color', '#172033' ) ) );
		$theme_background = isset( $theme_styles['color']['background'] ) ? $theme_styles['color']['background'] : ( get_theme_mod( 'background_color', '#ffffff' ) ?: '#ffffff' );
		$theme_type = isset( $theme_styles['typography'] ) && is_array( $theme_styles['typography'] ) ? $theme_styles['typography'] : array();
		$theme_button = isset( $theme_styles['elements']['button'] ) && is_array( $theme_styles['elements']['button'] ) ? $theme_styles['elements']['button'] : array();
		$theme_body_px = isset( $theme_type['fontSize'] ) ? (float) $theme_type['fontSize'] : 16;
		if ( $theme_body_px < 10 || $theme_body_px > 48 ) { $theme_body_px = 16; }
		$theme_button_text = isset( $theme_button['color']['text'] ) ? $theme_button['color']['text'] : '#ffffff';
		$theme_button_background = isset( $theme_button['color']['background'] ) ? $theme_button['color']['background'] : $pick( array( 'primary', 'accent' ), '#6c63ff' );
		$defaults = array(
			'global_colors' => array( 'primary' => $pick( array( 'primary', 'accent' ), get_theme_mod( 'primary_color', get_theme_mod( 'accent_color', '#6c63ff' ) ) ), 'secondary' => $pick( array( 'secondary' ), get_theme_mod( 'secondary_color', '#292d50' ) ), 'text' => $theme_text, 'accent' => $pick( array( 'accent', 'tertiary' ), get_theme_mod( 'accent_color', '#18a0fb' ) ), 'background' => $theme_background ),
			'global_fonts' => array( 'body' => $body_font, 'heading' => $heading_font ),
			'typography' => array( 'body_size' => $theme_body_px, 'body_weight' => isset( $theme_type['fontWeight'] ) ? (string) $theme_type['fontWeight'] : '400', 'line_height' => isset( $theme_type['lineHeight'] ) ? (float) $theme_type['lineHeight'] : 1.6, 'paragraph_spacing' => 16 ),
			'button_style' => array( 'text' => $theme_button_text, 'background' => $theme_button_background, 'hover_text' => '#ffffff', 'hover_background' => '#5148d8', 'gradient_enabled' => false, 'hover_gradient_enabled' => false, 'gradient' => array(), 'hover_gradient' => array(), 'size' => 'medium', 'font_size' => 16, 'radius' => array( 'top' => isset( $theme_button['border']['radius'] ) && is_numeric( $theme_button['border']['radius'] ) ? (float) $theme_button['border']['radius'] : 6, 'right' => isset( $theme_button['border']['radius'] ) && is_numeric( $theme_button['border']['radius'] ) ? (float) $theme_button['border']['radius'] : 6, 'bottom' => isset( $theme_button['border']['radius'] ) && is_numeric( $theme_button['border']['radius'] ) ? (float) $theme_button['border']['radius'] : 6, 'left' => isset( $theme_button['border']['radius'] ) && is_numeric( $theme_button['border']['radius'] ) ? (float) $theme_button['border']['radius'] : 6, 'unit' => 'px', 'isLinked' => true ), 'border_width' => array( 'top' => 0, 'right' => 0, 'bottom' => 0, 'left' => 0, 'unit' => 'px', 'isLinked' => true ), 'border_style' => 'solid', 'border_color' => '', 'padding' => array( 'top' => 12, 'right' => 24, 'bottom' => 12, 'left' => 24, 'unit' => 'px', 'isLinked' => false ), 'padding_y' => 12, 'padding_x' => 24, 'shadow_preset' => 'none', 'shadow' => 'none' ),
			'background_image' => array(), 'background_image_style' => array( 'size' => 'cover', 'repeat' => 'no-repeat', 'position' => 'center center', 'attachment' => 'scroll', 'overlay' => '', 'overlay_opacity' => 0 ),
			'custom_colors' => array(), 'custom_css' => '',
		);
		$saved = get_option( 'xcopb_site_settings', array() );
		return rest_ensure_response( is_array( $saved ) ? array_replace_recursive( $defaults, $saved ) : $defaults );
	}

	public function update_site_settings( WP_REST_Request $request ) {
		$incoming = $request->get_json_params();
		if ( ! is_array( $incoming ) ) { $incoming = array(); }
		$current = $this->get_site_settings()->get_data();
		$colors = isset( $incoming['global_colors'] ) && is_array( $incoming['global_colors'] ) ? $incoming['global_colors'] : array();
		$fonts = isset( $incoming['global_fonts'] ) && is_array( $incoming['global_fonts'] ) ? $incoming['global_fonts'] : array();
		foreach ( array( 'primary', 'secondary', 'text', 'accent', 'background' ) as $key ) {
			if ( isset( $colors[ $key ] ) ) { $current['global_colors'][ $key ] = $this->sanitize_builder_color( $colors[ $key ] ) ?: $current['global_colors'][ $key ]; }
		}
		foreach ( array( 'body', 'heading' ) as $key ) {
			if ( isset( $fonts[ $key ] ) ) { $current['global_fonts'][ $key ] = substr( sanitize_text_field( $fonts[ $key ] ), 0, 120 ); }
		}
		if ( isset( $incoming['custom_colors'] ) && is_array( $incoming['custom_colors'] ) ) {
			$current['custom_colors'] = array();
			foreach ( array_slice( $incoming['custom_colors'], 0, 40 ) as $item ) {
				if ( ! is_array( $item ) ) { continue; }
				$name = sanitize_text_field( isset( $item['name'] ) ? $item['name'] : '' );
				$value = $this->sanitize_builder_color( isset( $item['value'] ) ? $item['value'] : '' );
				if ( '' === $name || ! $value ) { continue; }
				$id = sanitize_key( isset( $item['id'] ) ? $item['id'] : '' );
				$current['custom_colors'][] = array( 'id' => $id ? $id : 'color-' . wp_generate_password( 8, false ), 'name' => substr( $name, 0, 60 ), 'value' => $value );
			}
		}
		if ( isset( $incoming['typography'] ) && is_array( $incoming['typography'] ) ) {
			foreach ( array( 'body_size' => array( 10, 48 ), 'line_height' => array( 1, 3 ), 'paragraph_spacing' => array( 0, 100 ) ) as $key => $range ) {
				if ( isset( $incoming['typography'][ $key ] ) && is_numeric( $incoming['typography'][ $key ] ) ) { $current['typography'][ $key ] = min( $range[1], max( $range[0], (float) $incoming['typography'][ $key ] ) ); }
			}
			if ( isset( $incoming['typography']['body_weight'] ) && in_array( (string) $incoming['typography']['body_weight'], array( '300', '400', '500', '600', '700' ), true ) ) { $current['typography']['body_weight'] = (string) $incoming['typography']['body_weight']; }
		}
		if ( isset( $incoming['button_style'] ) && is_array( $incoming['button_style'] ) ) {
			foreach ( array( 'text', 'background', 'hover_text', 'hover_background' ) as $key ) { if ( isset( $incoming['button_style'][ $key ] ) && ( $color = $this->sanitize_builder_color( $incoming['button_style'][ $key ] ) ) ) { $current['button_style'][ $key ] = $color; } }
			foreach ( array( 'border_color' ) as $key ) { if ( isset( $incoming['button_style'][ $key ] ) ) { $current['button_style'][ $key ] = $this->sanitize_builder_color( $incoming['button_style'][ $key ] ); } }
			foreach ( array( 'radius' => array( 0, 100 ), 'border_width' => array( 0, 20 ), 'padding' => array( 0, 120 ) ) as $key => $range ) { if ( isset( $incoming['button_style'][ $key ] ) ) { $current['button_style'][ $key ] = $this->sanitize_site_box_values( $incoming['button_style'][ $key ], $range, $current['button_style'][ $key ] ?? 0 ); } }
			foreach ( array( 'padding_y' => array( 0, 80 ), 'padding_x' => array( 0, 120 ), 'font_size' => array( 8, 48 ) ) as $key => $range ) { if ( isset( $incoming['button_style'][ $key ] ) && is_numeric( $incoming['button_style'][ $key ] ) ) { $current['button_style'][ $key ] = min( $range[1], max( $range[0], (float) $incoming['button_style'][ $key ] ) ); } }
			foreach ( array( 'gradient_enabled', 'hover_gradient_enabled' ) as $key ) { if ( isset( $incoming['button_style'][ $key ] ) ) { $current['button_style'][ $key ] = (bool) $incoming['button_style'][ $key ]; } }
			if ( isset( $incoming['button_style']['size'] ) && in_array( $incoming['button_style']['size'], array( 'xs', 'small', 'medium', 'large', 'xl', 'custom' ), true ) ) { $current['button_style']['size'] = $incoming['button_style']['size']; }
			if ( isset( $incoming['button_style']['border_style'] ) && in_array( $incoming['button_style']['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ) { $current['button_style']['border_style'] = $incoming['button_style']['border_style']; }
			if ( isset( $incoming['button_style']['shadow_preset'] ) && in_array( $incoming['button_style']['shadow_preset'], array( 'none', 'soft', 'medium', 'strong', 'custom' ), true ) ) { $current['button_style']['shadow_preset'] = $incoming['button_style']['shadow_preset']; }
			if ( isset( $incoming['button_style']['shadow'] ) && ( $shadow = $this->sanitize_site_box_shadow( $incoming['button_style']['shadow'] ) ) !== false ) { $current['button_style']['shadow'] = $shadow; }
			foreach ( array( 'gradient', 'hover_gradient' ) as $key ) { if ( isset( $incoming['button_style'][ $key ] ) && is_array( $incoming['button_style'][ $key ] ) ) { $current['button_style'][ $key ] = $this->sanitize_site_gradient( $incoming['button_style'][ $key ] ); } }
		}
		if ( isset( $incoming['background_image'] ) ) { $current['background_image'] = $this->sanitize_site_background_image( $incoming['background_image'] ); }
		if ( isset( $incoming['background_image_style'] ) && is_array( $incoming['background_image_style'] ) ) {
			$style = $incoming['background_image_style'];
			foreach ( array( 'size' => array( 'cover', 'contain', 'auto' ), 'repeat' => array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y' ), 'position' => array( 'center center', 'center top', 'center bottom', 'left center', 'right center', 'left top', 'right top', 'left bottom', 'right bottom' ), 'attachment' => array( 'scroll', 'fixed' ) ) as $key => $allowed ) { if ( isset( $style[ $key ] ) && in_array( $style[ $key ], $allowed, true ) ) { $current['background_image_style'][ $key ] = $style[ $key ]; } }
			if ( isset( $style['overlay'] ) && ( $overlay = $this->sanitize_builder_color( $style['overlay'] ) ) ) { $current['background_image_style']['overlay'] = $overlay; }
			if ( isset( $style['overlay_opacity'] ) && is_numeric( $style['overlay_opacity'] ) ) { $current['background_image_style']['overlay_opacity'] = min( 100, max( 0, (int) $style['overlay_opacity'] ) ); }
		}
		if ( isset( $incoming['custom_css'] ) ) {
			$current['custom_css'] = substr( wp_strip_all_tags( str_ireplace( '</style', '', (string) $incoming['custom_css'] ) ), 0, 30000 );
		}
		update_option( 'xcopb_site_settings', $current, false );
		return rest_ensure_response( $current );
	}

	private function sanitize_builder_color( $value ) {
		$value = trim( (string) $value );
		$hex = sanitize_hex_color( $value );
		if ( $hex ) { return $hex; }
		if ( preg_match( '/^(?:rgba?|hsla?)\(\s*[0-9.%+\-\s,\/]+\)$/i', $value ) || preg_match( '/^(?:transparent|currentcolor|[a-z]{3,20})$/i', $value ) ) { return $value; }
		return '';
	}

	private function sanitize_site_gradient( $gradient ) {
		$type = isset( $gradient['type'] ) && 'radial' === $gradient['type'] ? 'radial' : 'linear';
		$color_a = $this->sanitize_builder_color( isset( $gradient['colorA'] ) ? $gradient['colorA'] : '' );
		$color_b = $this->sanitize_builder_color( isset( $gradient['colorB'] ) ? $gradient['colorB'] : '' );
		if ( ! $color_a || ! $color_b ) { return array(); }
		return array( 'type' => $type, 'angle' => isset( $gradient['angle'] ) && is_numeric( $gradient['angle'] ) ? min( 360, max( 0, (int) $gradient['angle'] ) ) : 90, 'colorA' => $color_a, 'colorB' => $color_b, 'posA' => isset( $gradient['posA'] ) && is_numeric( $gradient['posA'] ) ? min( 100, max( 0, (int) $gradient['posA'] ) ) : 0, 'posB' => isset( $gradient['posB'] ) && is_numeric( $gradient['posB'] ) ? min( 100, max( 0, (int) $gradient['posB'] ) ) : 100 );
	}

	private function sanitize_site_box_shadow( $shadow ) {
		$shadow = trim( (string) $shadow );
		if ( 'none' === $shadow || '' === $shadow ) { return $shadow; }
		if ( strlen( $shadow ) > 180 || preg_match( '/[;{}<>]|url\s*\(|var\s*\(/i', $shadow ) || ! preg_match( '/^[\w\s#(),.%+\/-]+$/', $shadow ) ) { return false; }
		return $shadow;
	}

	private function sanitize_site_box_values( $value, $range, $fallback = 0 ) {
		$previous = is_array( $fallback ) ? $fallback : array( 'top' => $fallback, 'right' => $fallback, 'bottom' => $fallback, 'left' => $fallback, 'unit' => 'px', 'isLinked' => true );
		if ( is_numeric( $value ) ) { $number = min( $range[1], max( $range[0], (float) $value ) ); return array( 'top' => $number, 'right' => $number, 'bottom' => $number, 'left' => $number, 'unit' => 'px', 'isLinked' => true ); }
		if ( ! is_array( $value ) ) { return $previous; }
		$clean = array();
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) { $raw = $value[ $side ] ?? $previous[ $side ] ?? 0; $clean[ $side ] = is_numeric( $raw ) ? min( $range[1], max( $range[0], (float) $raw ) ) : 0; }
		$clean['unit'] = 'px';
		$clean['isLinked'] = isset( $value['isLinked'] ) ? (bool) $value['isLinked'] : ( $previous['isLinked'] ?? false );
		return $clean;
	}

	private function sanitize_site_background_image( $image ) {
		if ( ! is_array( $image ) ) { return array(); }
		$id = isset( $image['id'] ) ? absint( $image['id'] ) : 0;
		$url = $id && wp_attachment_is_image( $id ) ? wp_get_attachment_image_url( $id, 'full' ) : ( isset( $image['url'] ) ? esc_url_raw( $image['url'] ) : '' );
		if ( ! $url ) { return array(); }
		return array( 'id' => $id, 'url' => $url, 'thumbnail' => $id ? wp_get_attachment_image_url( $id, 'medium' ) : $url, 'alt' => sanitize_text_field( isset( $image['alt'] ) ? $image['alt'] : '' ) );
	}

	/**
	 * Check whether a post is a valid editable item for the page builder.
	 *
	 * @param WP_Post|null $post Post object.
	 * @return bool
	 */
	private function is_valid_editable_post( $post ) {
		if ( ! $post || ! ( $post instanceof WP_Post ) ) {
			return false;
		}

		if ( XCOPB_Registrar::POST_TYPE === $post->post_type || 'xcosb_template' === $post->post_type ) {
			return true;
		}

		$public_types = get_post_types( array( 'public' => true ) );
		return in_array( $post->post_type, $public_types, true );
	}

	/**
	 * Get a list of templates for the builder UI.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_templates( WP_REST_Request $request ) {
		$templates = get_posts( array(
			'post_type'      => XCOPB_Registrar::POST_TYPE,
			'post_status'    => array( 'publish', 'draft' ),
			'posts_per_page' => -1,
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
			'no_found_rows'  => true,
		) );

		$data = array();

		foreach ( $templates as $template ) {
			$data[] = $this->prepare_template_data( $template->ID );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Get a single template.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template( WP_REST_Request $request ) {
		$id   = absint( $request->get_param( 'id' ) );
		$post = get_post( $id );

		if ( ! $post || ! $this->is_valid_editable_post( $post ) ) {
			return new WP_Error(
				'xcopb_not_found',
				__( 'Item not found.', 'xcodesol-page-builder' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( $this->prepare_template_data( $post->ID ) );
	}

	/**
	 * Create a new template.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_template( WP_REST_Request $request ) {
		$title = $request->get_param( 'title' );

		if ( empty( $title ) ) {
			$title = __( 'New Template', 'xcodesol-page-builder' );
		}

		$post_id = wp_insert_post( array(
			'post_type'   => XCOPB_Registrar::POST_TYPE,
			'post_status' => 'publish',
			'post_title'  => sanitize_text_field( $title ),
		) );

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$this->apply_fields_to_post( $post_id, $request );

		return rest_ensure_response( array(
			'id' => $post_id,
		) );
	}

	/**
	 * Update an existing template.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_template( WP_REST_Request $request ) {
		$id   = absint( $request->get_param( 'id' ) );
		$post = get_post( $id );

		if ( ! $post || ! $this->is_valid_editable_post( $post ) ) {
			return new WP_Error(
				'xcopb_not_found',
				__( 'Item not found.', 'xcodesol-page-builder' ),
				array( 'status' => 404 )
			);
		}

		if ( $request->has_param( 'title' ) ) {
			wp_update_post( array(
				'ID'         => $id,
				'post_title' => sanitize_text_field( $request->get_param( 'title' ) ),
			) );
		}

		if ( 'page' === $post->post_type && $request->has_param( 'page_settings' ) ) {
			$this->apply_page_settings( $id, $request->get_param( 'page_settings' ) );
		}

		$this->apply_fields_to_post( $id, $request );

		return rest_ensure_response( $this->prepare_template_data( $id ) );
	}

	/**
	 * Export a template as a self-contained JSON document.
	 *
	 * The document nests everything the template needs to be recreated
	 * 100%: identity, view type, structure, the hierarchical layout (blocks
	 * with their settings/styles and nested container columns), the zone
	 * map, conditions, priority and template settings.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function export_template( WP_REST_Request $request ) {
		$id   = absint( $request->get_param( 'id' ) );
		$post = get_post( $id );

		if ( ! $post || XCOPB_Registrar::POST_TYPE !== $post->post_type ) {
			return new WP_Error(
				'xcosb_not_found',
				__( 'Template not found.', 'xcodesol-page-builder' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( $this->build_export_document( $post->ID ) );
	}

	/**
	 * Import a template from an exported JSON document.
	 *
	 * Creates a brand-new template post and applies every field of the
	 * document through the same sanitizers used by the editor, so the
	 * imported design matches the exported one exactly.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function import_template( WP_REST_Request $request ) {
		$document = $request->get_json_params();

		// Also accept the document via a plain "template" parameter so the
		// endpoint works without a JSON content-type body.
		if ( ! is_array( $document ) || empty( $document['template'] ) ) {
			$maybe_template = $request->get_param( 'template' );
			if ( is_array( $maybe_template ) ) {
				$document = array( 'template' => $maybe_template );
			}
		}

		if ( ! is_array( $document ) || empty( $document['template'] ) || ! is_array( $document['template'] ) ) {
			return new WP_Error(
				'xcosb_invalid_import',
				__( 'Invalid template file — the JSON must contain a "template" object.', 'xcodesol-page-builder' ),
				array( 'status' => 400 )
			);
		}

		return rest_ensure_response( $this->import_document( $document ) );
	}

	/**
	 * Recreate a template from an export document.
	 *
	 * Creates a brand-new template post and applies every field of the
	 * document through the same sanitizers used by the editor, so the
	 * imported design matches the exported one exactly. This is the single
	 * entry point used by both the import REST endpoint and applying a
	 * pre-made template preset.
	 *
	 * @param array $document Export document ({xsb, template} shape).
	 * @return array|WP_Error {id, editUrl} on success.
	 */
	public function import_document( $document ) {
		if ( ! is_array( $document ) || empty( $document['template'] ) || ! is_array( $document['template'] ) ) {
			return new WP_Error(
				'xcosb_invalid_import',
				__( 'Invalid template file — the JSON must contain a "template" object.', 'xcodesol-page-builder' ),
				array( 'status' => 400 )
			);
		}

		$template = $document['template'];
		$title    = isset( $template['title'] ) ? sanitize_text_field( $template['title'] ) : '';

		if ( '' === $title ) {
			$title = __( 'Imported Template', 'xcodesol-page-builder' );
		}

		$post_id = wp_insert_post( array(
			'post_type'   => XCOPB_Registrar::POST_TYPE,
			'post_status' => 'publish',
			'post_title'  => $title,
		) );

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		// Reuse the exact save path of the editor so imported data is
		// sanitized identically (layout, zones, conditions, settings…).
		$import_request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );

		foreach ( array( 'view_type', 'structure', 'layout', 'zones', 'conditions', 'priority', 'settings' ) as $key ) {
			if ( isset( $template[ $key ] ) ) {
				$import_request->set_param( $key, $template[ $key ] );
			}
		}

		$this->apply_fields_to_post( $post_id, $import_request );

		// Mark newly imported template as active.
		update_post_meta( $post_id, '_xcopb_is_active', '1' );

		// Record the originating preset slug if present.
		if ( ! empty( $document['xcosb']['preset'] ) ) {
			update_post_meta( $post_id, '_xcopb_applied_preset', sanitize_title( $document['xcosb']['preset'] ) );
		}

		// Imported templates open in the full-screen builder (same experience
		// as the front-end Edit button) rather than the WP admin post screen.
		return array(
			'id'      => $post_id,
			'editUrl' => add_query_arg(
				array(
					'post'     => $post_id,
					'_wpnonce' => wp_create_nonce( 'xcosb_edit_builder_' . $post_id ),
				),
				admin_url( 'admin.php?page=xcosb-builder' )
			),
		);
	}

	/**
	 * Build the self-contained export document for a template.
	 *
	 * @param int $post_id Template post ID.
	 * @return array
	 */
	public function build_export_document( $post_id ) {
		$data = $this->prepare_template_data( $post_id );

		$document = array(
			'xcosb' => array(
				'version'   => '1.0',
				'generator' => 'xcodesol-page-builder',
			),
			'template' => array(
				'title'      => $data['title'],
				'view_type'  => $data['view_type'],
				'structure'  => $data['structure'],
				'layout'     => $data['layout'],
				'zones'      => $data['zones'],
				'conditions' => $data['conditions'],
				'priority'   => $data['priority'],
				'settings'   => $data['settings'],
			),
		);

		if ( ! empty( $data['applied_preset'] ) ) {
			$document['xcosb']['preset'] = $data['applied_preset'];
		}

		return $document;
	}

	/**
	 * Apply valid meta fields to a template post.
	 *
	 * @param int              $post_id Post ID.
	 * @param WP_REST_Request  $request Request object.
	 */
	private function apply_fields_to_post( $post_id, WP_REST_Request $request ) {
		$view_types = array_keys( XCOPB_Registrar::get_view_type_options() );

		if ( $request->has_param( 'view_type' ) ) {
			$view_type = sanitize_text_field( $request->get_param( 'view_type' ) );

			if ( in_array( $view_type, $view_types, true ) ) {
				update_post_meta( $post_id, '_xcopb_view_type', $view_type );
			}
		}

		if ( $request->has_param( 'priority' ) ) {
			update_post_meta( $post_id, '_xcopb_priority', absint( $request->get_param( 'priority' ) ) );
		}

		if ( $request->has_param( 'structure' ) ) {
			$structure = sanitize_text_field( $request->get_param( 'structure' ) );
			update_post_meta( $post_id, '_xcopb_structure', $structure );
		}

		if ( $request->has_param( 'is_active' ) ) {
			$is_active = $request->get_param( 'is_active' ) ? '1' : '0';
			update_post_meta( $post_id, '_xcopb_is_active', $is_active );
		}

		if ( $request->has_param( 'layout' ) ) {
			$layout = $request->get_param( 'layout' );

			if ( is_array( $layout ) ) {
				update_post_meta( $post_id, '_xcopb_layout', wp_json_encode( $this->sanitize_layout( $layout ) ) );
				update_post_meta( $post_id, '_xcopb_edit_mode', 'builder' );
			}
		}

		if ( $request->has_param( 'zones' ) ) {
			$zones = $request->get_param( 'zones' );

			if ( is_array( $zones ) ) {
				update_post_meta( $post_id, '_xcopb_zones', wp_json_encode( $this->sanitize_zones( $zones ) ) );
			}
		}

		if ( $request->has_param( 'conditions' ) ) {
			$conditions = $request->get_param( 'conditions' );

			if ( is_array( $conditions ) ) {
				update_post_meta( $post_id, '_xcopb_conditions', wp_json_encode( $this->sanitize_conditions( $conditions ) ) );
			}
		}

		if ( $request->has_param( 'settings' ) ) {
			$settings = $request->get_param( 'settings' );

			if ( is_array( $settings ) ) {
				update_post_meta( $post_id, '_xcopb_settings', wp_json_encode( array(
					'disable_on_mobile'       => isset( $settings['disable_on_mobile'] ) ? (bool) $settings['disable_on_mobile'] : false,
					'respect_theme_templates' => isset( $settings['respect_theme_templates'] ) ? (bool) $settings['respect_theme_templates'] : true,
				) ) );
			}
		}
	}

	/**
	 * Save WordPress page-level settings separately from display-condition templates.
	 *
	 * @param int   $post_id Page ID.
	 * @param mixed $settings Page settings from the editor.
	 * @return void
	 */
	private function apply_page_settings( $post_id, $settings ) {
		$post = get_post( $post_id );
		if ( ! $post || 'page' !== $post->post_type || ! is_array( $settings ) ) {
			return;
		}

		$update = array( 'ID' => $post_id );
		$has_post_update = false;

		if ( isset( $settings['status'] ) ) {
			$status = sanitize_key( $settings['status'] );
			$allowed_statuses = array( 'publish', 'draft', 'pending', 'private' );
			$can_publish = current_user_can( 'publish_pages' ) || current_user_can( 'publish_post', $post_id );
			if ( in_array( $status, $allowed_statuses, true ) && ( ! in_array( $status, array( 'publish', 'private' ), true ) || $can_publish ) ) {
				$update['post_status'] = $status;
				$has_post_update = true;
			}
		}

		if ( isset( $settings['order'] ) ) {
			$update['menu_order'] = max( -32768, min( 32767, (int) $settings['order'] ) );
			$has_post_update = true;
		}

		if ( isset( $settings['comments'] ) ) {
			$update['comment_status'] = $settings['comments'] ? 'open' : 'closed';
			$has_post_update = true;
		}

		if ( $has_post_update ) {
			wp_update_post( $update );
		}

		if ( array_key_exists( 'featured_image_id', $settings ) ) {
			$image_id = absint( $settings['featured_image_id'] );
			if ( $image_id && wp_attachment_is_image( $image_id ) ) {
				set_post_thumbnail( $post_id, $image_id );
			} elseif ( ! $image_id ) {
				delete_post_thumbnail( $post_id );
			}
		}

		if ( isset( $settings['page_template'] ) ) {
			$page_template = sanitize_text_field( $settings['page_template'] );
			$available = function_exists( 'get_page_templates' ) ? get_page_templates( $post ) : array();
			$available[''] = __( 'Default', 'xcodesol-page-builder' );
			if ( array_key_exists( $page_template, $available ) ) {
				update_post_meta( $post_id, '_wp_page_template', $page_template );
			}
		}

		if ( array_key_exists( 'hide_title', $settings ) ) {
			update_post_meta( $post_id, '_xcopb_hide_title', $settings['hide_title'] ? '1' : '0' );
		}
		$style_settings = array();
		foreach ( array( 'margin', 'padding' ) as $box ) {
			if ( isset( $settings[ $box ] ) && is_array( $settings[ $box ] ) ) {
				$value = $settings[ $box ];
				$unit = isset( $value['unit'] ) && in_array( $value['unit'], array( 'px', '%', 'em', 'rem', 'vw', 'vh' ), true ) ? $value['unit'] : 'px';
				$sides = isset( $value['values'] ) && is_array( $value['values'] ) ? $value['values'] : $value;
				$clean_sides = array();
				foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
					$raw = isset( $sides[ $side ] ) ? $sides[ $side ] : '';
					$clean_sides[ $side ] = is_numeric( $raw ) ? max( 'margin' === $box ? -500 : 0, min( 2000, (float) $raw ) ) : '';
				}
				$style_settings[ $box ] = array( 'values' => $clean_sides, 'unit' => $unit, 'linked' => ! empty( $value['linked'] ) );
			}
		}
		foreach ( array( 'css_id', 'css_class' ) as $key ) {
			if ( isset( $settings[ $key ] ) ) { $style_settings[ $key ] = 'css_id' === $key ? sanitize_html_class( $settings[ $key ] ) : sanitize_text_field( $settings[ $key ] ); }
		}
		if ( isset( $settings['custom_css'] ) ) { $style_settings['custom_css'] = substr( wp_strip_all_tags( str_ireplace( '</style', '', (string) $settings['custom_css'] ) ), 0, 20000 ); }
		update_post_meta( $post_id, '_xcopb_page_settings', $style_settings );
	}

	/**
	 * Prepare template data for a REST response.
	 *
	 * @param int $post_id Post ID.
	 * @return array
	 */
	private function prepare_template_data( $post_id ) {
		$post = get_post( $post_id );

		$layout     = json_decode( XCOPB_Registrar::get_field( $post_id, '_xcopb_layout', '[]' ), true );
		$conditions = json_decode( XCOPB_Registrar::get_field( $post_id, '_xcopb_conditions', '{"mode":"include","rules":[]}' ), true );
		$settings   = json_decode( XCOPB_Registrar::get_field( $post_id, '_xcopb_settings', '{}' ), true );

		if ( ! is_array( $layout ) ) {
			$layout = array();
		}

		if ( ! is_array( $conditions ) ) {
			$conditions = array( 'mode' => 'include', 'rules' => array() );
		}

		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$is_active_meta = get_post_meta( $post_id, '_xcopb_is_active', true );
		$is_active      = '' === $is_active_meta ? true : ( '1' === (string) $is_active_meta );
		$applied_preset = get_post_meta( $post_id, '_xcopb_applied_preset', true );

		$default_view = 'page';
		if ( $post ) {
			if ( 'post' === $post->post_type ) {
				$default_view = 'single_post';
			} elseif ( 'page' === $post->post_type ) {
				$default_view = 'page';
			}
		}
		$view_type = $post && in_array( $post->post_type, array( 'page', 'post' ), true )
			? $default_view
			: XCOPB_Registrar::get_field( $post_id, '_xcopb_view_type', $default_view );
		if ( empty( $view_type ) ) {
			$view_type = $default_view;
		}

		$page_settings = array();
		if ( $post && 'page' === $post->post_type ) {
			$thumbnail_id = get_post_thumbnail_id( $post_id );
			$saved_page_settings = get_post_meta( $post_id, '_xcopb_page_settings', true );
			if ( ! is_array( $saved_page_settings ) ) { $saved_page_settings = array(); }
			$current_page_template = get_page_template_slug( $post_id );
			if ( 'xcopb_canvas' === $current_page_template ) { $current_page_template = 'elementor_canvas'; }
			if ( 'xcopb_full_width' === $current_page_template ) { $current_page_template = 'elementor_header_footer'; }
			$page_settings = array(
				'status'            => $post->post_status,
				'featured_image_id' => $thumbnail_id ? (int) $thumbnail_id : 0,
				'featured_image_url'=> $thumbnail_id ? ( wp_get_attachment_image_url( $thumbnail_id, 'medium' ) ?: wp_get_attachment_url( $thumbnail_id ) ) : '',
				'order'             => (int) $post->menu_order,
				'comments'          => 'open' === $post->comment_status,
				'hide_title'        => '1' === (string) get_post_meta( $post_id, '_xcopb_hide_title', true ),
				'page_template'     => $current_page_template,
			);
			$page_settings = array_merge( $saved_page_settings, $page_settings );
		}

		return array(
			'id'             => $post_id,
			'title'          => $post->post_title,
			'view_type'      => $view_type,
			'layout'         => $layout,
			'structure'      => XCOPB_Registrar::get_field( $post_id, '_xcopb_structure', '' ),
			'zones'          => json_decode( XCOPB_Registrar::get_field( $post_id, '_xcopb_zones', '[]' ), true ),
			'conditions'     => $conditions,
			'priority'       => absint( XCOPB_Registrar::get_field( $post_id, '_xcopb_priority', 10 ) ),
			'settings'       => $settings,
			'is_active'      => $is_active,
			'applied_preset' => $applied_preset ? sanitize_title( $applied_preset ) : '',
			'post_type'      => $post ? $post->post_type : '',
			'page_settings'  => $page_settings,
		);
	}

	/**
	 * Sanitize layout array.
	 *
	 * @param array $layout Layout array.
	 * @return array
	 */
	private function sanitize_layout( $layout, $depth = 0, &$used_ids = null ) {
		$clean = array();
		if ( ! is_array( $used_ids ) ) {
			$used_ids = array();
		}
		if ( ! is_array( $layout ) ) {
			return $clean;
		}
		if ( $depth > 5 ) {
			return $clean;
		}

		foreach ( $layout as $block ) {
			if ( ! is_array( $block ) || empty( $block['type'] ) ) {
				continue;
			}

			$type = sanitize_text_field( $block['type'] );

			if ( ! XCOPB_Block_Registry::instance()->is_registered( $type ) ) {
				continue;
			}

			$block_id = isset( $block['id'] ) ? sanitize_key( $block['id'] ) : '';
			if ( '' === $block_id || isset( $used_ids[ $block_id ] ) ) {
				do {
					$block_id = 'xsb-' . str_replace( '-', '', wp_generate_uuid4() );
				} while ( isset( $used_ids[ $block_id ] ) );
			}
			$used_ids[ $block_id ] = true;

			$clean_block = array(
				'id'       => $block_id,
				'type'     => $type,
				'settings' => isset( $block['settings'] ) && is_array( $block['settings'] ) ? $this->sanitize_block_settings( $type, $block['settings'] ) : array(),
			);

			if ( 'xcosb/gb-container' === $this->canonical_block_type( $type ) && isset( $block['inner'] ) && is_array( $block['inner'] ) ) {
				$clean_block['inner'] = $this->sanitize_container_inner( $block['inner'], $depth + 1, $used_ids );
			}

			$clean[] = $clean_block;
		}

		return $clean;
	}

	/**
	 * Sanitize layout data supplied to the in-admin preview endpoint.
	 *
	 * @param array $layout Layout array.
	 * @return array
	 */
	public function sanitize_preview_layout( $layout ) {
		return is_array( $layout ) ? $this->sanitize_layout( $layout ) : array();
	}

	/**
	 * Sanitize nested container columns, with a bounded nesting depth.
	 *
	 * Each column is an array of nested widgets or containers.
	 *
	 * @param array $inner Raw inner columns.
	 * @return array
	 */
	private function sanitize_container_inner( $inner, $depth = 0, &$used_ids = null ) {
		$clean_inner = array();
		if ( ! is_array( $used_ids ) ) {
			$used_ids = array();
		}
		if ( ! is_array( $inner ) ) {
			return $clean_inner;
		}
		if ( $depth > 5 ) {
			return $clean_inner;
		}

		foreach ( $inner as $column ) {
			if ( ! is_array( $column ) ) {
				$clean_inner[] = array();
				continue;
			}

			$clean_column = array();

			foreach ( $column as $block ) {
				if ( ! is_array( $block ) || empty( $block['type'] ) ) {
					continue;
				}

				$type = sanitize_text_field( $block['type'] );

				if ( ! XCOPB_Block_Registry::instance()->is_registered( $type ) ) {
					continue;
				}

				$block_id = isset( $block['id'] ) ? sanitize_key( $block['id'] ) : '';
				if ( '' === $block_id || isset( $used_ids[ $block_id ] ) ) {
					do {
						$block_id = 'xsb-' . str_replace( '-', '', wp_generate_uuid4() );
					} while ( isset( $used_ids[ $block_id ] ) );
				}
				$used_ids[ $block_id ] = true;

				$clean_block = array(
					'id'       => $block_id,
					'type'     => $type,
					'settings' => isset( $block['settings'] ) && is_array( $block['settings'] ) ? $this->sanitize_block_settings( $type, $block['settings'] ) : array(),
				);
				if ( 'xcosb/gb-container' === $this->canonical_block_type( $type ) && isset( $block['inner'] ) && is_array( $block['inner'] ) ) {
					$clean_block['inner'] = $this->sanitize_container_inner( $block['inner'], $depth + 1, $used_ids );
				}
				$clean_column[] = $clean_block;
			}

			$clean_inner[] = $clean_column;
		}

		return $clean_inner;
	}

	/**
	 * Sanitize a zones array (parallel to the layout).
	 *
	 * @param array $zones Raw zones array.
	 * @return array
	 */
	private function sanitize_zones( $zones ) {
		$clean = array();

		foreach ( $zones as $zone ) {
			if ( is_string( $zone ) ) {
				$clean[] = sanitize_text_field( $zone );
			} else {
				$clean[] = '';
			}
		}

		return $clean;
	}

	/**
	 * Sanitize settings with support for a product-card layout inside a loop.
	 *
	 * @param string $type     Block type.
	 * @param array  $settings Raw settings.
	 * @return array
	 */
	private function sanitize_block_settings( $type, $settings ) {
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$type_for_sanitizer = $this->canonical_block_type( $type );
		$sanitized = array_merge(
			$this->sanitize_block_type_settings( $type_for_sanitizer, $settings ),
			$this->sanitize_advanced_keys( $settings ),
			$this->sanitize_position_keys( $type, $settings ),
			$this->sanitize_transform_keys( $settings ),
			$this->sanitize_visibility_keys( $settings )
		);

		$sanitized = $this->expand_responsive_variants( $type_for_sanitizer, $settings, $sanitized );
		$sanitized = $this->sanitize_widget_state_variants( $type_for_sanitizer, $settings, $sanitized );

		// Preserve current inspector controls even when an older, widget-specific
		// sanitizer does not know their keys yet. Every value still passes through
		// a type-aware sanitizer before it reaches post meta or front-end output.
		if ( 'xcosb/gb-container' === $type_for_sanitizer && class_exists( 'XCOPB_Sanitizer' ) ) {
			$container_settings = XCOPB_Sanitizer::sanitize_container_settings( $settings );
			$sanitized = array_merge( $sanitized, $container_settings );
			foreach ( $settings as $key => $value ) {
				if ( in_array( $key, array( 'column_styles', 'column_widths', 'tablet_column_widths', 'mobile_column_widths' ), true ) && array_key_exists( $key, $container_settings ) ) {
					continue;
				}
				$container_value = XCOPB_Sanitizer::sanitize_container_value( $key, $value );
				$clean_value = null !== $container_value ? $container_value : $this->sanitize_control_value( $key, $value );
				if ( null !== $clean_value ) {
					$sanitized[ $key ] = $clean_value;
				} else {
					unset( $sanitized[ $key ] );
				}
			}
		}
		foreach ( $settings as $key => $value ) {
			$is_color_value = is_string( $value ) && class_exists( 'XCOPB_Sanitizer' ) && ( preg_match( '/color|colour/i', (string) $key ) || 'background' === $key ) && '' !== XCOPB_Sanitizer::sanitize_color( $value );
			if ( array_key_exists( $key, $sanitized ) && ! $is_color_value ) {
				continue;
			}
			$clean_value = $this->sanitize_control_value( $key, $value );
			if ( null !== $clean_value ) {
				$sanitized[ $key ] = $clean_value;
			}
		}

		return $sanitized;
	}

	/** Normalize current and legacy block namespaces for shared sanitizers. */
	private function canonical_block_type( $type ) {
		return 0 === strpos( $type, 'xcopb/' ) ? 'xcosb/' . substr( $type, 6 ) : $type;
	}

	/**
	 * Sanitize a control value not yet covered by a widget-specific sanitizer.
	 *
	 * @param string $key   Control key.
	 * @param mixed  $value Raw control value.
	 * @param int    $depth Recursion depth.
	 * @return mixed|null Safe value, or null when unsupported.
	 */
	private function sanitize_control_value( $key, $value, $depth = 0 ) {
		if ( $depth > 6 ) {
			return null;
		}
		$key = (string) $key;
		if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) ) {
			return $value;
		}
		if ( is_array( $value ) ) {
			if ( preg_match( '/color|colour/i', $key ) ) {
				return $this->sanitize_control_value( 'gradient', $value, $depth + 1 );
			}
			$clean = array();
			foreach ( array_slice( $value, 0, 100, true ) as $child_key => $child_value ) {
				$clean_key = is_int( $child_key ) ? $child_key : sanitize_key( $child_key );
				$child = $this->sanitize_control_value( (string) $child_key, $child_value, $depth + 1 );
				if ( null !== $child ) {
					$clean[ $clean_key ] = $child;
				}
			}
			return $clean;
		}
		if ( ! is_string( $value ) ) {
			return null;
		}
		$value = trim( $value );
		if ( preg_match( '/(?:^|_)(?:url|src|href|image|video|poster)$/i', $key ) || preg_match( '/(?:_url|_src)$/i', $key ) ) {
			return esc_url_raw( $value );
		}
		if ( preg_match( '/(?:color|colour)/i', $key ) ) {
			return class_exists( 'XCOPB_Sanitizer' ) ? XCOPB_Sanitizer::sanitize_color( $value ) : ( sanitize_hex_color( $value ) ?: '' );
		}
		if ( 'background' === $key && class_exists( 'XCOPB_Sanitizer' ) ) {
			$background_color = XCOPB_Sanitizer::sanitize_color( $value );
			if ( '' !== $background_color ) {
				return $background_color;
			}
		}
		if ( in_array( $key, array( 'content', 'html', 'custom_html' ), true ) ) {
			return wp_kses_post( $value );
		}
		if ( 'custom_css' === $key || 'css' === $key ) {
			$value = preg_replace( '#</?style[^>]*>#i', '', $value );
			if ( preg_match( '/expression\s*\(|javascript:|vbscript:|@import/i', $value ) ) {
				return '';
			}
			return sanitize_textarea_field( $value );
		}
		if ( class_exists( 'XCOPB_Sanitizer' ) && preg_match( '/^(?:font_family|font_weight|font_size|font_style|line_height|letter_spacing|text_transform|text_decoration|text_shadow|box_shadow|shadow|width|height|min_width|max_width|min_height|max_height|margin(?:_(?:top|right|bottom|left))?|padding(?:_(?:top|right|bottom|left))?|gap|border_(?:width|style|radius)|object_(?:fit|position)|transform|background_position|background_size)$/', $key ) ) {
			return XCOPB_Sanitizer::sanitize_css_fragment( $value );
		}
		return sanitize_text_field( $value );
	}

	/**
	 * Keep supported interactive widget hover/focus overrides through REST save.
	 *
	 * @param string $type      Block type.
	 * @param array  $raw       Raw settings.
	 * @param array  $sanitized Sanitized settings.
	 * @return array
	 */
	private function sanitize_widget_state_variants( $type, $raw, $sanitized ) {
		$targets = array(
			'xcosb/gb-heading' => array( 'color', 'text_shadow', 'text_decoration' ),
			'xcosb/gb-button' => array( 'bg_color', 'text_color', 'border_color', 'border_radius', 'box_shadow', 'opacity' ),
			'xcosb/gb-image' => array( 'border_radius', 'box_shadow', 'grayscale', 'opacity' ),
			'xcosb/gb-text' => array( 'color', 'link_color', 'blockquote_background' ),
			'xcosb/gb-divider' => array( 'color' ),
		);
		$type = str_replace( 'xcopb/', 'xcosb/', $type );
		if ( ! isset( $targets[ $type ] ) ) {
			return $sanitized;
		}
		$validators = array(
			'color' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_color( $value ); },
			'bg_color' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_color( $value ); },
			'text_color' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_color( $value ); },
			'border_color' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_color( $value ); },
			'link_color' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_color( $value ); },
			'blockquote_background' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_color( $value ); },
			'text_shadow' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_css_fragment( $value ); },
			'text_decoration' => static function ( $value ) { return in_array( $value, array( 'none', 'underline', 'overline', 'line-through' ), true ) ? $value : ''; },
			'border_radius' => static function ( $value ) { return min( 500, max( 0, absint( $value ) ) ); },
			'box_shadow' => static function ( $value ) { return XCOPB_Sanitizer::sanitize_box_shadow( $value ); },
			'opacity' => static function ( $value ) { return min( 100, max( 0, absint( $value ) ) ); },
			'grayscale' => static function ( $value ) { return min( 100, max( 0, absint( $value ) ) ); },
		);
		foreach ( array( 'hover', 'focus' ) as $state ) {
			foreach ( $targets[ $type ] as $key ) {
				$variant = $state . '_' . $key;
				if ( ! array_key_exists( $variant, $raw ) || ! isset( $validators[ $key ] ) ) {
					continue;
				}
				$clean = $validators[ $key ]( $raw[ $variant ] );
				if ( '' !== $clean && null !== $clean ) {
					$sanitized[ $variant ] = $clean;
				}
			}
		}
		return $sanitized;
	}

	/**
	 * Responsive variants (tablet_<key> / mobile_<key>) are accepted for any
	 * style key the type sanitizer already whitelists, by re-running the same
	 * per-type sanitizer with the variant value injected on the base key. This
	 * keeps variant validation identical to desktop and automatically covers
	 * every current and future property (no per-widget lists).
	 *
	 * @param string $type      Block type.
	 * @param array  $raw       Raw (unsanitized) settings.
	 * @param array  $sanitized Already-sanitized settings.
	 * @return array
	 */
	private function expand_responsive_variants( $type, $raw, $sanitized ) {
		if ( ! is_array( $raw ) ) {
			return $sanitized;
		}

		$skip          = array( 'css_class', 'css_id', 'column_styles', 'card_layout', 'hide_on_desktop', 'hide_on_tablet', 'hide_on_mobile' );
		$position_keys = array( 'pos_preset', 'pos_x', 'pos_y', 'pos_z' );
		foreach ( $sanitized as $key => $value ) {
			// Every key is variant-eligible even when its desktop value is
			// empty: a user may override only on tablet/mobile (e.g. "only
			// position this on mobile" or a tablet-only font size). Only
			// structural / whole-array keys are skipped.
			if ( in_array( $key, $skip, true ) || ! is_scalar( $value ) ) {
				continue;
			}
			$is_pos = in_array( $key, $position_keys, true );
			foreach ( array( 'tablet', 'mobile' ) as $device ) {
				$variant_key = $device . '_' . $key;
				$variant_raw = isset( $raw[ $variant_key ] ) ? $raw[ $variant_key ] : null;
				// An empty variant is only meaningful for pos_preset ("back
				// to in-flow at this width"); every other empty value means
				// "no override" and must stay absent so the CSS cascade
				// inherits the wider device.
				if ( null === $variant_raw || ! is_scalar( $variant_raw ) || ( '' === $variant_raw && ! $is_pos ) ) {
					continue;
				}
				// Reuse the exact per-type sanitizer on the variant value, plus
				// the shared position keys so they stay variant-safe.
				$probe         = $raw;
				$probe[ $key ] = $variant_raw;
				$clean         = array_merge(
					$this->sanitize_block_type_settings( $type, $probe ),
					$this->sanitize_position_keys( $type, $probe ),
					$this->sanitize_transform_keys( $probe )
				);
				// pos_preset may legitimately sanitize to '' (in-flow override);
				// everything else is only stored when it has a real value.
				$allow_empty = 'pos_preset' === $key;
				if ( isset( $clean[ $key ] ) && ( '' !== $clean[ $key ] || $allow_empty ) ) {
					$sanitized[ $variant_key ] = $clean[ $key ];
				}
			}
		}

		return $sanitized;
	}

	/**
	 * Shared Position keys for every block element (widget, container or
	 * card block): a corner/edge preset plus fine X/Y nudges and stacking
	 * order. Values are responsive (tablet_ / mobile_ variant keys) and the
	 * front-end emitter turns them into token-scoped position rules, so the
	 * widget can be lifted out of the flow on any device.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_position_keys( $type, $settings ) {
		$allowed  = array( '', 'relative', 'absolute', 'fixed' );
		$axis     = function ( $value ) {
			if ( ! isset( $value ) || '' === $value || ! is_numeric( $value ) ) {
				return '';
			}
			$n = (float) $value;
			$n = min( 800, max( -800, $n ) );
			return 0 === $n ? '' : $n;
		};

		$z = isset( $settings['pos_z'] ) && '' !== $settings['pos_z'] ? min( 999, max( 0, absint( $settings['pos_z'] ) ) ) : '';

		// The card badge reuses the 'position' key for its corner placement
		// (top-left / top-right / …), which is validated by the per-type
		// sanitizer. Skip the shared CSS-position value here so a save never
		// clobbers the badge placement back to in-flow. Offsets/stack-order
		// are still sanitized for every block type.
		if ( 'xcosb/cd-badge' === $type ) {
			return array(
				'pos_x' => $axis( isset( $settings['pos_x'] ) ? $settings['pos_x'] : '' ),
				'pos_y' => $axis( isset( $settings['pos_y'] ) ? $settings['pos_y'] : '' ),
				'pos_z' => $z,
			);
		}

		$position = isset( $settings['position'] ) ? sanitize_text_field( (string) $settings['position'] ) : '';

		return array(
			'position' => in_array( $position, $allowed, true ) ? $position : '',
			'pos_x'    => $axis( isset( $settings['pos_x'] ) ? $settings['pos_x'] : '' ),
			'pos_y'    => $axis( isset( $settings['pos_y'] ) ? $settings['pos_y'] : '' ),
			'pos_z'    => $z,
		);
	}

	/**
	 * Shared CSS transform keys for every block element: the widget root
	 * (unprefixed transform_type / transform_tx / transform_ty /
	 * transform_scale / transform_rotate / transform_origin) and the
	 * prefixed inner elements the popover exposes the Transform category on
	 * (title_, subtitle_, item_, button_). Every key is responsive — the
	 * tablet_/mobile_ variants are validated by re-running this sanitizer in
	 * expand_responsive_variants().
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_transform_keys( $settings ) {
		$out = array();

		$origins = array( 'top left', 'top center', 'top right', 'center', 'bottom left', 'bottom center', 'bottom right' );
		$clean_type = function ( $value ) {
			$type = sanitize_text_field( (string) $value );
			return in_array( $type, array( '', 'none', 'custom' ), true ) ? $type : 'none';
		};
		$clean_num = function ( $value, $lo, $hi ) {
			if ( ! isset( $value ) || '' === $value || ! is_numeric( $value ) ) {
				return '';
			}
			$n = (float) $value;
			$n = min( $hi, max( $lo, $n ) );
			return 0 === $n ? '' : $n;
		};
		$clean_origin = function ( $value ) use ( $origins ) {
			$origin = sanitize_text_field( (string) $value );
			return in_array( $origin, $origins, true ) ? $origin : '';
		};

		$sets = array( '' );
		foreach ( array( 'title', 'subtitle', 'item', 'button' ) as $prefix ) {
			$sets[] = $prefix . '_';
		}

		foreach ( $sets as $p ) {
			$base_type = $p . 'transform_type';
			$base_tx   = $p . 'transform_tx';
			$base_ty   = $p . 'transform_ty';
			$base_sc   = $p . 'transform_scale';
			$base_rot  = $p . 'transform_rotate';
			$base_org  = $p . 'transform_origin';

			// Only emit a prefixed set when the widget actually wrote one of
			// its keys (keeps unrelated blocks' settings maps lean).
			$touched = false;
			foreach ( array( $base_type, $base_tx, $base_ty, $base_sc, $base_rot, $base_org ) as $k ) {
				if ( isset( $settings[ $k ] ) ) {
					$touched = true;
					break;
				}
			}
			if ( ! $touched ) {
				continue;
			}

			$out[ $base_type ] = $clean_type( isset( $settings[ $base_type ] ) ? $settings[ $base_type ] : '' );
			$out[ $base_tx ]   = $clean_num( isset( $settings[ $base_tx ] ) ? $settings[ $base_tx ] : '', - 2000, 2000 );
			$out[ $base_ty ]   = $clean_num( isset( $settings[ $base_ty ] ) ? $settings[ $base_ty ] : '', - 2000, 2000 );
			$out[ $base_sc ]   = $clean_num( isset( $settings[ $base_sc ] ) ? $settings[ $base_sc ] : '', 0, 500 );
			$out[ $base_rot ]  = $clean_num( isset( $settings[ $base_rot ] ) ? $settings[ $base_rot ] : '', - 3600, 3600 );
			$out[ $base_org ]  = $clean_origin( isset( $settings[ $base_org ] ) ? $settings[ $base_org ] : '' );
		}

		return $out;
	}

	/**
	 * Shared hide-on-device flags for every block.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_visibility_keys( $settings ) {
		return array(
			'hide_on_desktop' => ! empty( $settings['hide_on_desktop'] ),
			'hide_on_tablet'  => ! empty( $settings['hide_on_tablet'] ),
			'hide_on_mobile'  => ! empty( $settings['hide_on_mobile'] ),
		);
	}

	/**
	 * Shared Advanced keys for every block: CSS class and HTML id.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_advanced_keys( $settings ) {
		$class = isset( $settings['css_class'] ) ? sanitize_text_field( (string) $settings['css_class'] ) : '';
		$class = preg_replace( '/[^a-zA-Z0-9_\- ]/', '', $class );
		$class = trim( preg_replace( '/\s+/', ' ', $class ) );

		$id = isset( $settings['css_id'] ) ? sanitize_text_field( (string) $settings['css_id'] ) : '';
		$id = preg_replace( '/[^a-zA-Z0-9_\-]/', '', $id );

		return array(
			'css_class'  => function_exists( 'mb_substr' ) ? mb_substr( $class, 0, 200 ) : substr( $class, 0, 200 ),
			'css_id'     => function_exists( 'mb_substr' ) ? mb_substr( $id, 0, 100 ) : substr( $id, 0, 100 ),
		);
	}

	/**
	 * Per-type sanitization, kept separate so the shared Advanced keys can
	 * be merged on top for every block type.
	 *
	 * @param string $type     Block type.
	 * @param array  $settings Raw settings.
	 * @return array
	 */
	private function sanitize_block_type_settings( $type, $settings ) {
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		if ( 'xcosb/gb-banner' === $type ) {
			return $this->sanitize_banner_settings( $settings );
		}

		if ( 'xcosb/gb-container' === $type ) {
			return $this->sanitize_container_settings( $settings );
		}

		if ( 'xcosb/gb-text' === $type ) {
			return $this->sanitize_text_settings( $settings );
		}

		if ( 'xcosb/gb-core-block' === $type ) {
			$name = isset( $settings['core_block_name'] ) ? sanitize_text_field( $settings['core_block_name'] ) : '';
			$markup = isset( $settings['core_markup'] ) ? (string) $settings['core_markup'] : '';
			$parsed = '' !== $markup && function_exists( 'parse_blocks' ) ? parse_blocks( $markup ) : array();
			$registered = class_exists( 'WP_Block_Type_Registry' ) && 0 === strpos( $name, 'core/' ) && WP_Block_Type_Registry::get_instance()->is_registered( $name );
			if ( ! $registered || empty( $parsed ) || ( $parsed[0]['blockName'] ?? '' ) !== $name ) {
				$markup = '';
			} else {
				$markup = serialize_blocks( array( $parsed[0] ) );
			}
			return array( 'core_block_name' => $registered ? $name : 'core/paragraph', 'core_markup' => $markup );
		}

		if ( 'xcosb/woo-categories' === $type ) {
			return $this->sanitize_woo_categories_settings( $settings );
		}

		if ( 'xcosb/woo-tags' === $type ) {
			return $this->sanitize_woo_tags_settings( $settings );
		}

		if ( 'xcosb/woo-attributes' === $type ) {
			return $this->sanitize_woo_attributes_settings( $settings );
		}

		if ( 'xcosb/woo-search' === $type ) {
			return $this->sanitize_woo_search_settings( $settings );
		}

		if ( 'xcosb/gb-text-widget' === $type ) {
			$clean = array(
				'title'   => isset( $settings['title'] ) ? sanitize_text_field( $settings['title'] ) : '',
				'content' => isset( $settings['content'] ) ? wp_kses_post( (string) $settings['content'] ) : '',
			);
			return array_merge( $clean, $this->sanitize_text_widget_style( $settings ) );
		}

		if ( 'xcosb/ar-loop' === $type ) {
			$clean = array(
				'columns'    => isset( $settings['columns'] ) ? min( 6, max( 1, absint( $settings['columns'] ) ) ) : 3,
				'card_layout' => $this->sanitize_card_layout( isset( $settings['card_layout'] ) && is_array( $settings['card_layout'] ) ? $settings['card_layout'] : array() ),
			);
			$clean['gap'] = isset( $settings['gap'] ) && '' !== $settings['gap']
				? min( 80, max( 0, absint( $settings['gap'] ) ) )
				: '';
			$clean = array_merge( $clean, $this->sanitize_loop_card_style( $settings ) );
			$clean = array_merge( $clean, $this->sanitize_text_style_keys( $settings ) );
			$clean = array_merge( $clean, $this->sanitize_box_chrome_keys( $settings, '' ) );
			return $clean;
		}

		if ( 'xcosb/ar-ordering' === $type ) {
			return $this->sanitize_ordering_style( $settings );
		}

		if ( 'xcosb/sp-title' === $type || 'xcosb/ar-title' === $type ) {
			$tag_key = 'xcosb/sp-title' === $type ? 'tag' : 'tag';
			$tag = isset( $settings['tag'] ) ? sanitize_key( $settings['tag'] ) : ( 'xcosb/ar-title' === $type ? 'h1' : 'h2' );
			$allowed = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' );
			if ( ! in_array( $tag, $allowed, true ) ) {
				$tag = 'xcosb/ar-title' === $type ? 'h1' : 'h2';
			}
			return array_merge( array( $tag_key => $tag ), $this->sanitize_text_style_keys( $settings, true ) );
		}

		if ( 'xcosb/sp-image' === $type ) {
			return $this->sanitize_image_style( $settings );
		}

		if ( 'xcosb/sp-add-to-cart' === $type ) {
			return array_merge(
				$this->sanitize_text_style_keys( $settings ),
				$this->sanitize_button_style_keys( $settings, 'button' )
			);
		}

		if ( 'xcosb/ar-pagination' === $type ) {
			return $this->sanitize_pagination_style( $settings );
		}

		if ( 'xcosb/gb-breadcrumb' === $type ) {
			$clean = $this->sanitize_text_style_keys( $settings );
			$link  = isset( $settings['link_color'] ) ? sanitize_hex_color( $settings['link_color'] ) : '';
			$clean['link_color'] = $link ? $link : '';
			return $clean;
		}

		if ( 0 === strpos( $type, 'xcosb/cd-' ) ) {
			return $this->sanitize_card_block_settings( $type, $settings );
		}

		if ( 'xcosb/cc-cart' === $type || 'xcosb/cc-cart-items' === $type || 'xcosb/cc-cart-totals' === $type || 'xcosb/cc-checkout' === $type || 'xcosb/cc-checkout-contact' === $type || 'xcosb/cc-checkout-billing' === $type || 'xcosb/cc-checkout-shipping' === $type || 'xcosb/cc-checkout-notes' === $type || 'xcosb/cc-checkout-totals' === $type || 'xcosb/cc-checkout-payment' === $type ) {
			return $this->sanitize_page_content_style( $settings );
		}

		if ( 'xcosb/sp-tabs' === $type ) {
			return array_merge(
				$this->sanitize_text_style_keys( $settings ),
				$this->sanitize_box_chrome_keys( $settings )
			);
		}

		if ( 'xcosb/sp-rating' === $type || 'xcosb/sp-meta' === $type ) {
			return $this->sanitize_text_style_keys( $settings );
		}

		// sp-price / sp-excerpt / ar-description / ar-result-count: plain text.
		return $this->sanitize_text_style_keys( $settings );
	}

	/**
	 * Sanitize the banner's presentation settings for safe inline CSS output.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_banner_settings( $settings ) {
		$clean = array();
		$defaults = array(
			'align' => 'center', 'bg_type' => 'color', 'bg_size' => 'cover', 'bg_position' => 'center center', 'bg_repeat' => 'no-repeat', 'bg_attachment' => 'scroll', 'title_text_transform' => 'none', 'title_source' => 'custom',
			'bg_color' => '#2563eb', 'overlay_color' => '', 'title_color' => '#ffffff', 'subtitle_color' => '#ffffff', 'button_bg_color' => 'transparent', 'button_text_color' => '#ffffff', 'button_border_color' => '#ffffff',
			'padding_top' => 80, 'padding_bottom' => 80, 'padding_left' => 20, 'padding_right' => 20, 'min_height' => 400, 'title_font_size' => 32, 'subtitle_font_size' => 18, 'button_border_width' => 2, 'button_padding_x' => 24, 'button_padding_y' => 12, 'button_border_radius' => 4,
			'title_font_weight' => 700, 'subtitle_font_weight' => 400, 'title_line_height' => 1.2, 'subtitle_line_height' => 1.5, 'title_letter_spacing' => 0, 'subtitle_letter_spacing' => 0,
			'show_button' => true,
			'animation_duration' => 600,
			'animation_delay' => 0,
			'border_radius' => 12,
			'content_box_padding' => 28,
			'content_box_radius' => 16,
			'border_width' => 0,
			'gradient_type' => 'linear',
			'gradient_radial_shape' => 'circle',
			'gradient_position' => 'center',
			'box_shadow' => 'none',
			'animation' => 'none',
			'content_position_x' => 'center',
			'content_position_y' => 'center',
			'title_font_family' => '',
			'subtitle_font_family' => '',
			'button_font_family' => '',
		);
		$choices = array(
			'align'                => array( 'left', 'center', 'right' ),
			'bg_type'              => array( 'color', 'gradient', 'image', 'video' ),
			'gradient_type'        => array( 'linear', 'radial' ),
			'gradient_radial_shape' => array( 'circle', 'ellipse' ),
			'gradient_position'    => array( 'center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right' ),
			'box_shadow'           => array( 'none', 'soft', 'medium', 'strong' ),
			'animation'            => XCOPB_Motion_Presets::ids(),
			'bg_size'              => array( 'cover', 'contain', 'auto' ),
			'bg_position'          => array( 'center center', 'top center', 'bottom center', 'center left', 'center right' ),
			'bg_repeat'            => array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y' ),
			'bg_attachment'        => array( 'scroll', 'fixed' ),
			'title_text_transform' => array( 'none', 'uppercase', 'lowercase', 'capitalize' ),
			'title_source'         => array( 'custom', 'archive_title' ),
			'content_position_x'   => array( 'left', 'center', 'right' ),
			'content_position_y'   => array( 'top', 'center', 'bottom' ),
		);

		foreach ( $choices as $key => $allowed ) {
			$value = isset( $settings[ $key ] ) ? sanitize_text_field( $settings[ $key ] ) : $defaults[ $key ];
			$clean[ $key ] = in_array( $value, $allowed, true ) ? $value : $defaults[ $key ];
		}

		foreach ( array( 'title', 'subtitle', 'button_text' ) as $key ) {
			$clean[ $key ] = isset( $settings[ $key ] ) ? sanitize_text_field( $settings[ $key ] ) : '';
		}

		foreach ( array( 'link', 'bg_image', 'bg_video', 'bg_video_url' ) as $key ) {
			$media_value = $settings[ $key ] ?? '';
			$media_url   = is_array( $media_value ) ? ( $media_value['url'] ?? '' ) : $media_value;
			$clean[ $key ] = esc_url_raw( $media_url );
		}

		foreach ( array( 'bg_color', 'overlay_color', 'title_color', 'subtitle_color', 'button_bg_color', 'button_text_color', 'button_border_color', 'gradient_color_a', 'gradient_color_b' ) as $key ) {
			$value = isset( $settings[ $key ] ) ? sanitize_hex_color( $settings[ $key ] ) : '';
			$clean[ $key ] = $value ? $value : $defaults[ $key ];
		}

		// Block border (defaults to no border when width is 0).
		$block_border_color = isset( $settings['border_color'] ) ? sanitize_hex_color( $settings['border_color'] ) : '';
		$clean['border_color'] = $block_border_color ? $block_border_color : '';

		foreach ( array( 'padding_top', 'padding_bottom', 'padding_left', 'padding_right', 'min_height', 'title_font_size', 'subtitle_font_size', 'button_border_width', 'button_padding_x', 'button_padding_y', 'button_border_radius', 'animation_duration', 'animation_delay', 'border_radius', 'content_box_padding', 'content_box_radius', 'border_width' ) as $key ) {
			$clean[ $key ] = isset( $settings[ $key ] ) ? min( 2000, absint( $settings[ $key ] ) ) : $defaults[ $key ];
		}

		$gradient_angle = isset( $settings['gradient_angle'] ) ? absint( $settings['gradient_angle'] ) : 180;
		$clean['gradient_angle'] = min( 360, max( 0, $gradient_angle ) );

		$clean['border_style'] = isset( $settings['border_style'] ) ? sanitize_text_field( $settings['border_style'] ) : 'solid';
		$clean['border_style'] = in_array( $clean['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $clean['border_style'] : 'solid';

		$overlay_opacity = isset( $settings['overlay_opacity'] ) ? absint( $settings['overlay_opacity'] ) : 45;
		$clean['overlay_opacity'] = min( 100, max( 0, $overlay_opacity ) );

		$box_bg = isset( $settings['content_box_bg'] ) ? sanitize_text_field( $settings['content_box_bg'] ) : 'rgba(0,0,0,0.35)';
		if ( '' === $box_bg || 'transparent' === $box_bg || preg_match( '/^#[0-9a-fA-F]{3,8}$/', $box_bg ) || preg_match( '/^rgba?\([0-9.,\s%]+\)$/', $box_bg ) ) {
			$clean['content_box_bg'] = $box_bg;
		} else {
			$clean['content_box_bg'] = 'rgba(0,0,0,0.35)';
		}

		foreach ( array( 'title_font_weight', 'subtitle_font_weight' ) as $key ) {
			$value = isset( $settings[ $key ] ) ? absint( $settings[ $key ] ) : $defaults[ $key ];
			$clean[ $key ] = in_array( $value, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $value : (string) $defaults[ $key ];
		}

		foreach ( array( 'title_line_height', 'subtitle_line_height' ) as $key ) {
			$clean[ $key ] = isset( $settings[ $key ] ) ? min( 5, max( 0.5, (float) $settings[ $key ] ) ) : $defaults[ $key ];
		}

		foreach ( array( 'title_letter_spacing', 'subtitle_letter_spacing' ) as $key ) {
			$clean[ $key ] = isset( $settings[ $key ] ) ? min( 50, max( -20, (float) $settings[ $key ] ) ) : $defaults[ $key ];
		}

		$clean['show_button'] = ! isset( $settings['show_button'] ) ? true : (bool) $settings['show_button'];
		$clean['content_box'] = ! empty( $settings['content_box'] );

		foreach ( array( 'title_font_family', 'subtitle_font_family', 'button_font_family' ) as $font_key ) {
			$clean[ $font_key ] = $this->sanitize_font_family( isset( $settings[ $font_key ] ) ? $settings[ $font_key ] : '' );
		}

		// Keep the complete Hero Banner configuration as one safe JSON object.
		$clean['source_mode'] = isset( $settings['source_mode'] ) && in_array( $settings['source_mode'], array( 'custom', 'posts', 'mixed' ), true ) ? $settings['source_mode'] : 'custom';
		$clean['slides'] = array();
		$raw_slides = isset( $settings['slides'] ) && is_array( $settings['slides'] ) ? array_slice( $settings['slides'], 0, 20 ) : array();
		foreach ( $raw_slides as $index => $slide ) {
			if ( ! is_array( $slide ) ) {
				continue;
			}
			$item = array(
				'id' => isset( $slide['id'] ) ? sanitize_key( $slide['id'] ) : 'hero-slide-' . ( $index + 1 ),
				'type' => isset( $slide['type'] ) && in_array( $slide['type'], array( 'custom', 'linked-post', 'dynamic' ), true ) ? $slide['type'] : 'custom',
				'title' => isset( $slide['title'] ) ? sanitize_text_field( $slide['title'] ) : '',
				'title_tag' => isset( $slide['title_tag'] ) && in_array( $slide['title_tag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div' ), true ) ? $slide['title_tag'] : ( 0 === $index ? 'h1' : 'h2' ),
				'subtitle' => isset( $slide['subtitle'] ) ? wp_kses_post( (string) $slide['subtitle'] ) : '',
				'badge' => isset( $slide['badge'] ) ? sanitize_text_field( $slide['badge'] ) : '',
				'background_type' => isset( $slide['background_type'] ) && in_array( $slide['background_type'], array( 'inherit', 'color', 'image', 'video' ), true ) ? $slide['background_type'] : 'inherit',
				'background_color' => isset( $slide['background_color'] ) ? ( sanitize_hex_color( $slide['background_color'] ) ?: '' ) : '',
				'overlay_color' => isset( $slide['overlay_color'] ) ? ( sanitize_hex_color( $slide['overlay_color'] ) ?: '' ) : '',
				'overlay_opacity' => isset( $slide['overlay_opacity'] ) ? min( 100, absint( $slide['overlay_opacity'] ) ) : null,
				'image_alt' => isset( $slide['image_alt'] ) ? sanitize_text_field( $slide['image_alt'] ) : '',
				'link' => isset( $slide['link'] ) ? esc_url_raw( $slide['link'] ) : '',
				'button_text' => isset( $slide['button_text'] ) ? sanitize_text_field( $slide['button_text'] ) : '',
				'button_url' => isset( $slide['button_url'] ) ? esc_url_raw( $slide['button_url'] ) : '',
				'post_id' => isset( $slide['post_id'] ) ? absint( $slide['post_id'] ) : 0,
				'dynamic_post_id' => isset( $slide['dynamic_post_id'] ) ? absint( $slide['dynamic_post_id'] ) : 0,
			);
			foreach ( array( 'image', 'mobile_image', 'video' ) as $media_key ) {
				$media = $slide[ $media_key ] ?? '';
				$item[ $media_key ] = esc_url_raw( is_array( $media ) ? ( $media['url'] ?? '' ) : $media );
			}
			$item['buttons'] = array();
			if ( isset( $slide['buttons'] ) && is_array( $slide['buttons'] ) ) {
				foreach ( array_slice( $slide['buttons'], 0, 3 ) as $button ) {
					if ( ! is_array( $button ) ) continue;
					$item['buttons'][] = array(
						'label' => isset( $button['label'] ) ? sanitize_text_field( $button['label'] ) : '',
						'url' => isset( $button['url'] ) ? esc_url_raw( $button['url'] ) : '',
						'style' => isset( $button['style'] ) && in_array( $button['style'], array( 'primary', 'secondary', 'outline', 'ghost' ), true ) ? $button['style'] : 'primary',
						'new_tab' => ! empty( $button['new_tab'] ),
						'nofollow' => ! empty( $button['nofollow'] ),
					);
				}
			}
			$clean['slides'][] = $item;
		}

		$clean['slider_enabled'] = ! empty( $settings['slider_enabled'] );
		$clean['loop'] = ! isset( $settings['loop'] ) || ! empty( $settings['loop'] );
		$clean['autoplay'] = ! empty( $settings['autoplay'] );
		$clean['pause_on_interaction'] = ! isset( $settings['pause_on_interaction'] ) || ! empty( $settings['pause_on_interaction'] );
		$clean['pause_on_hover'] = ! isset( $settings['pause_on_hover'] ) || ! empty( $settings['pause_on_hover'] );
		$clean['show_arrows'] = ! isset( $settings['show_arrows'] ) || ! empty( $settings['show_arrows'] );
		$clean['autoplay_delay'] = isset( $settings['autoplay_delay'] ) ? min( 30000, max( 1000, absint( $settings['autoplay_delay'] ) ) ) : 5000;
		$clean['transition'] = isset( $settings['transition'] ) && in_array( $settings['transition'], array( 'slide', 'fade', 'zoom' ), true ) ? $settings['transition'] : 'slide';
		$clean['pagination'] = isset( $settings['pagination'] ) && in_array( $settings['pagination'], array( 'none', 'dots', 'numbers', 'fraction', 'progress' ), true ) ? $settings['pagination'] : 'dots';
		$clean['layout_variant'] = isset( $settings['layout_variant'] ) && in_array( $settings['layout_variant'], array( 'centered', 'left', 'split-left', 'split-right', 'card-over-image' ), true ) ? $settings['layout_variant'] : 'centered';

		$post_type = isset( $settings['posts_post_type'] ) ? sanitize_key( $settings['posts_post_type'] ) : 'post';
		$public_post_types = get_post_types( array( 'public' => true ), 'names' );
		$clean['posts_post_type'] = in_array( $post_type, $public_post_types, true ) ? $post_type : 'post';
		$clean['posts_count'] = isset( $settings['posts_count'] ) ? min( 20, max( 1, absint( $settings['posts_count'] ) ) ) : 3;
		$clean['posts_offset'] = isset( $settings['posts_offset'] ) ? min( 500, absint( $settings['posts_offset'] ) ) : 0;
		$clean['posts_orderby'] = isset( $settings['posts_orderby'] ) && in_array( $settings['posts_orderby'], array( 'date', 'title', 'rand', 'menu_order', 'comment_count' ), true ) ? $settings['posts_orderby'] : 'date';
		$clean['posts_order'] = isset( $settings['posts_order'] ) && 'ASC' === strtoupper( $settings['posts_order'] ) ? 'ASC' : 'DESC';
		foreach ( array( 'posts_category', 'posts_tag', 'posts_author' ) as $query_id ) $clean[ $query_id ] = absint( $settings[ $query_id ] ?? 0 );
		foreach ( array( 'posts_include_ids', 'posts_exclude_ids' ) as $query_ids ) {
			$ids = preg_split( '/[,\s]+/', (string) ( $settings[ $query_ids ] ?? '' ) );
			$clean[ $query_ids ] = implode( ',', array_values( array_filter( array_map( 'absint', $ids ) ) ) );
		}
		$clean['posts_has_image'] = ! empty( $settings['posts_has_image'] );
		$clean['posts_sticky_only'] = ! empty( $settings['posts_sticky_only'] );
		foreach ( array( 'query_title_field' => array( 'title', 'excerpt', 'category' ), 'query_description_field' => array( 'excerpt', 'content', 'date', 'author', 'category', 'none' ), 'query_image_field' => array( 'featured_image', 'category_image', 'none' ), 'query_link_field' => array( 'permalink', 'none' ) ) as $query_field => $valid_values ) {
			$value = isset( $settings[ $query_field ] ) ? sanitize_key( $settings[ $query_field ] ) : '';
			$clean[ $query_field ] = in_array( $value, $valid_values, true ) ? $value : ( 'query_title_field' === $query_field ? 'title' : ( 'query_description_field' === $query_field ? 'excerpt' : ( 'query_image_field' === $query_field ? 'featured_image' : 'permalink' ) ) );
		}
		$clean['query_empty_message'] = isset( $settings['query_empty_message'] ) ? sanitize_text_field( $settings['query_empty_message'] ) : __( 'No posts found.', 'xcodesol-page-builder' );
		$clean['fallback_image'] = esc_url_raw( is_array( $settings['fallback_image'] ?? '' ) ? ( $settings['fallback_image']['url'] ?? '' ) : ( $settings['fallback_image'] ?? '' ) );

		return $clean;
	}

	/**
	 * Sanitize a font-family stack (single names, quoted names, comma
	 * separated fallbacks) for safe inline CSS output.
	 *
	 * @param mixed $value Raw font family value.
	 * @return string
	 */
	private function sanitize_font_family( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$value = trim( wp_strip_all_tags( $value ) );
		$value = preg_replace( '/[^\x20-\x7E]/', '', $value );

		// Only allow plain family names + commas + quotes (no url(), var(), ;).
		if ( '' === $value || preg_match( '/[;{}\(\)]/', $value ) || false !== stripos( $value, 'url(' ) || false !== stripos( $value, 'var(' ) ) {
			return '';
		}

		return substr( $value, 0, 200 );
	}

	/**
	 * Sanitize the text block's presentation settings for safe inline CSS.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_text_settings( $settings ) {
		$text_html = wp_kses_allowed_html( 'post' );
		foreach ( array( 'blockquote', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'p', 'span' ) as $text_tag ) {
			if ( ! isset( $text_html[ $text_tag ] ) || ! is_array( $text_html[ $text_tag ] ) ) {
				$text_html[ $text_tag ] = array();
			}
			$text_html[ $text_tag ]['style'] = true;
		}
		$clean = array(
			'content' => isset( $settings['content'] ) ? wp_kses( (string) $settings['content'], $text_html ) : '',
			'tag'     => isset( $settings['tag'] ) ? sanitize_key( $settings['tag'] ) : 'p',
		);

		$allowed_tags = array( 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'blockquote' );
		if ( ! in_array( $clean['tag'], $allowed_tags, true ) ) {
			$clean['tag'] = 'p';
		}

		$clean['align'] = isset( $settings['align'] ) ? sanitize_text_field( $settings['align'] ) : 'left';
		$clean['align'] = in_array( $clean['align'], array( 'left', 'center', 'right' ), true ) ? $clean['align'] : 'left';

		$color = isset( $settings['color'] ) ? sanitize_hex_color( $settings['color'] ) : '';
		$clean['color'] = $color ? $color : '';

		$clean['font_size']     = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? min( 200, absint( $settings['font_size'] ) ) : '';
		$clean['letter_spacing'] = isset( $settings['letter_spacing'] ) && '' !== $settings['letter_spacing'] ? min( 50, max( -20, (float) $settings['letter_spacing'] ) ) : '';

		$weight = isset( $settings['font_weight'] ) ? absint( $settings['font_weight'] ) : 0;
		$clean['font_weight'] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';

		$clean['line_height'] = isset( $settings['line_height'] ) && '' !== $settings['line_height'] ? min( 5, max( 0.5, (float) $settings['line_height'] ) ) : '';

		// Margin (optional – empty means the stylesheet default applies).
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$margin_key = 'margin_' . $side;
			$margin_value = isset( $settings[ $margin_key ] ) && '' !== $settings[ $margin_key ]
				? min( 500, max( -500, (float) $settings[ $margin_key ] ) )
				: '';
			$clean[ $margin_key ] = $margin_value;
		}

		// Border + entrance animation for the text block.
		$clean['border_width']  = isset( $settings['border_width'] ) ? min( 100, absint( $settings['border_width'] ) ) : 0;
		$clean['border_style']  = isset( $settings['border_style'] ) ? sanitize_text_field( $settings['border_style'] ) : 'solid';
		$clean['border_style']  = in_array( $clean['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $clean['border_style'] : 'solid';
		$border_color = isset( $settings['border_color'] ) ? sanitize_hex_color( $settings['border_color'] ) : '';
		$clean['border_color']  = $border_color ? $border_color : '';
		$clean['border_radius'] = isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 0;

		$clean['animation'] = isset( $settings['animation'] ) ? sanitize_text_field( $settings['animation'] ) : 'none';
		$clean['animation'] = in_array( $clean['animation'], XCOPB_Motion_Presets::ids(), true ) ? $clean['animation'] : 'none';
		$clean['animation_duration'] = isset( $settings['animation_duration'] ) ? min( 3000, max( 100, absint( $settings['animation_duration'] ) ) ) : 600;
		$clean['animation_delay'] = isset( $settings['animation_delay'] ) ? min( 3000, absint( $settings['animation_delay'] ) ) : 0;
		$clean['animation_easing'] = isset( $settings['animation_easing'] ) && in_array( $settings['animation_easing'], array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.16,1,0.3,1)' ), true ) ? $settings['animation_easing'] : 'ease';
		$clean['animation_repeat'] = isset( $settings['animation_repeat'] ) && in_array( (string) $settings['animation_repeat'], array( '1', '2', '3', 'infinite' ), true ) ? (string) $settings['animation_repeat'] : '1';

		return array_merge( $clean, $this->sanitize_text_style_keys( $settings ) );
	}

	/**
	 * Shared optional typography keys for the simple content blocks
	 * (product title/price/excerpt, archive text, breadcrumb, result count…).
	 * Unset values stay '' so renderers simply skip them.
	 *
	 * @param array $settings        Raw settings.
	 * @param bool  $allow_transform Also allow text-transform (headings).
	 * @param string $default_align  Fallback alignment.
	 * @return array
	 */
	private function sanitize_text_style_keys( $settings, $allow_transform = false, $default_align = 'left' ) {
		$clean = array();

		$align = isset( $settings['align'] ) ? sanitize_text_field( $settings['align'] ) : $default_align;
		$clean['align'] = in_array( $align, array( 'left', 'center', 'right' ), true ) ? $align : $default_align;

		$color = isset( $settings['color'] ) ? sanitize_hex_color( $settings['color'] ) : '';
		$clean['color'] = $color ? $color : '';

		$clean['font_family'] = $this->sanitize_font_family( isset( $settings['font_family'] ) ? $settings['font_family'] : '' );

		$clean['font_size'] = isset( $settings['font_size'] ) && '' !== $settings['font_size']
			? min( 200, max( 0, absint( $settings['font_size'] ) ) )
			: '';
		$clean['letter_spacing'] = isset( $settings['letter_spacing'] ) && '' !== $settings['letter_spacing']
			? min( 50, max( -20, (float) $settings['letter_spacing'] ) )
			: '';

		$weight = isset( $settings['font_weight'] ) && '' !== $settings['font_weight'] ? absint( $settings['font_weight'] ) : 0;
		$clean['font_weight'] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';

		$clean['line_height'] = isset( $settings['line_height'] ) && '' !== $settings['line_height']
			? min( 5, max( 0.5, (float) $settings['line_height'] ) )
			: '';

		$font_style = isset( $settings['font_style'] ) ? sanitize_text_field( (string) $settings['font_style'] ) : '';
		$clean['font_style'] = in_array( $font_style, array( 'normal', 'italic' ), true ) ? $font_style : '';

		$decoration = isset( $settings['text_decoration'] ) ? sanitize_text_field( (string) $settings['text_decoration'] ) : '';
		$clean['text_decoration'] = in_array( $decoration, array( 'none', 'underline', 'line-through' ), true ) ? $decoration : '';

		$hover = isset( $settings['hover_color'] ) ? sanitize_hex_color( $settings['hover_color'] ) : '';
		$clean['hover_color'] = $hover ? $hover : '';

		$bg = isset( $settings['background'] ) ? sanitize_hex_color( $settings['background'] ) : '';
		$clean['background'] = $bg ? $bg : '';

		$clean['max_width'] = isset( $settings['max_width'] ) && '' !== $settings['max_width']
			? min( 2000, max( 0, absint( $settings['max_width'] ) ) )
			: '';

		$clean['opacity'] = isset( $settings['opacity'] ) && '' !== $settings['opacity']
			? min( 100, max( 0, absint( $settings['opacity'] ) ) )
			: '';

		if ( $allow_transform ) {
			$transform = isset( $settings['text_transform'] ) ? sanitize_text_field( $settings['text_transform'] ) : 'none';
			$clean['text_transform'] = in_array( $transform, array( 'none', 'uppercase', 'lowercase', 'capitalize' ), true ) ? $transform : 'none';
		}

		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$key = 'margin_' . $side;
			$clean[ $key ] = isset( $settings[ $key ] ) && '' !== $settings[ $key ]
				? min( 500, max( -500, (float) $settings[ $key ] ) )
				: '';
		}

		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$key = 'padding_' . $side;
			$clean[ $key ] = isset( $settings[ $key ] ) && '' !== $settings[ $key ]
				? min( 300, max( 0, (float) $settings[ $key ] ) )
				: '';
		}

		return $clean;
	}

	/**
	 * Optional box chrome keys (background, border, radius, shadow).
	 *
	 * @param array  $settings Raw settings.
	 * @param string $prefix   Key prefix ('' for plain keys).
	 * @return array
	 */
	private function sanitize_box_chrome_keys( $settings, $prefix = '' ) {
		$clean = array();

		$bg_key   = $prefix ? $prefix . '_bg' : 'background';
		$bg       = isset( $settings[ $bg_key ] ) ? sanitize_hex_color( $settings[ $bg_key ] ) : '';
		$clean[ $bg_key ] = $bg ? $bg : '';

		// Border + shadow keys use the underscore form the editor writes
		// (item_border_width, badge_shadow…); with no prefix they are plain
		// keys (border_width, shadow…). Legacy no-underscore keys
		// (itemborder_width…) from older saves are still accepted.
		$read = function ( $key, $fallback ) use ( $prefix, $settings ) {
			$new_key = $prefix ? $prefix . '_' . $key : $key;
			$old_key = $prefix . $key;

			if ( isset( $settings[ $new_key ] ) ) {
				return $settings[ $new_key ];
			}
			if ( $prefix && isset( $settings[ $old_key ] ) ) {
				return $settings[ $old_key ];
			}
			return $fallback;
		};

		$clean[ $prefix ? $prefix . '_border_width' : 'border_width' ] = min( 100, max( 0, absint( $read( 'border_width', 0 ) ) ) );

		$style = sanitize_text_field( $read( 'border_style', 'solid' ) );
		$clean[ $prefix ? $prefix . '_border_style' : 'border_style' ] = in_array( $style, array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $style : 'solid';

		$border = sanitize_hex_color( $read( 'border_color', '' ) );
		$clean[ $prefix ? $prefix . '_border_color' : 'border_color' ] = $border ? $border : '';

		$clean[ $prefix ? $prefix . '_border_radius' : 'border_radius' ] = max( 0, absint( $read( 'border_radius', 0 ) ) );

		$shadow = sanitize_text_field( $read( 'shadow', 'none' ) );
		$clean[ $prefix ? $prefix . '_shadow' : 'shadow' ] = in_array( $shadow, array( 'none', 'soft', 'medium', 'strong' ), true ) ? $shadow : 'none';

		return $clean;
	}

	/**
	 * Optional button styling keys (bg/text/border colours + geometry).
	 *
	 * @param array  $settings Raw settings.
	 * @param string $prefix   Key prefix, e.g. 'button'.
	 * @return array
	 */
	private function sanitize_button_style_keys( $settings, $prefix = 'button' ) {
		$clean = array();

		foreach ( array( 'bg_color', 'text_color', 'border_color', 'hover_bg', 'hover_color' ) as $color_key ) {
			$full  = $prefix . '_' . $color_key;
			$color = isset( $settings[ $full ] ) ? sanitize_hex_color( $settings[ $full ] ) : '';
			$clean[ $full ] = $color ? $color : '';
		}

		foreach ( array( 'border_width', 'border_radius', 'padding_x', 'padding_y', 'font_size' ) as $num_key ) {
			$full = $prefix . '_' . $num_key;
			$clean[ $full ] = isset( $settings[ $full ] ) ? max( 0, absint( $settings[ $full ] ) ) : 0;
		}

		$weight = isset( $settings[ $prefix . '_font_weight' ] ) ? absint( $settings[ $prefix . '_font_weight' ] ) : 0;
		$clean[ $prefix . '_font_weight' ] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';

		$clean[ $prefix . '_font_family' ] = $this->sanitize_font_family( isset( $settings[ $prefix . '_font_family' ] ) ? $settings[ $prefix . '_font_family' ] : '' );

		return $clean;
	}

	/**
	 * Product image style: size (technical), alignment + wrapper margins and
	 * optional chrome for the image box itself.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_image_style( $settings ) {
		$clean = array(
			'size' => isset( $settings['size'] ) ? sanitize_text_field( $settings['size'] ) : 'woocommerce_thumbnail',
		);
		if ( ! in_array( $clean['size'], array( 'woocommerce_thumbnail', 'woocommerce_single', 'large', 'full' ), true ) ) {
			$clean['size'] = 'woocommerce_thumbnail';
		}

		$align = isset( $settings['align'] ) ? sanitize_text_field( $settings['align'] ) : 'left';
		$clean['align'] = in_array( $align, array( 'left', 'center', 'right' ), true ) ? $align : 'left';

		$clean['max_width'] = isset( $settings['max_width'] ) ? min( 2000, max( 0, absint( $settings['max_width'] ) ) ) : 0;

		// Optional fixed band height (0 = natural height). When set the image
		// is cropped to a cover band — the classic card look.
		$clean['height'] = isset( $settings['height'] ) ? min( 2000, max( 0, absint( $settings['height'] ) ) ) : 0;

		// Overlay layer (uniform or bottom-up shade) over the image.
		$clean['overlay'] = ! empty( $settings['overlay'] );
		$clean['overlay_color'] = isset( $settings['overlay_color'] ) ? sanitize_text_field( $settings['overlay_color'] ) : '';
		if ( '' === $clean['overlay_color'] || 'transparent' === $clean['overlay_color'] || preg_match( '/^#[0-9a-fA-F]{3,8}$/', $clean['overlay_color'] ) || preg_match( '/^rgba?\([0-9.,\s%]+\)$/', $clean['overlay_color'] ) ) {
			// accepted.
		} else {
			$clean['overlay_color'] = '#000000';
		}
		$overlay_opacity = isset( $settings['overlay_opacity'] ) ? absint( $settings['overlay_opacity'] ) : 45;
		$clean['overlay_opacity'] = min( 100, max( 0, $overlay_opacity ) );

		$overlay_dir = isset( $settings['overlay_direction'] ) ? sanitize_text_field( $settings['overlay_direction'] ) : 'to-top';
		$clean['overlay_direction'] = in_array( $overlay_dir, array( 'cover', 'to-top' ), true ) ? $overlay_dir : 'to-top';

		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$key = 'margin_' . $side;
			$clean[ $key ] = isset( $settings[ $key ] ) && '' !== $settings[ $key ]
				? min( 500, max( -500, (float) $settings[ $key ] ) )
				: '';
		}

		return array_merge( $clean, $this->sanitize_box_chrome_keys( $settings, 'img' ) );
	}

	/**
	 * Archive ordering style: option text, dropdown box chrome, radio gap.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_ordering_style( $settings ) {
		$clean = $this->sanitize_text_style_keys( $settings );
		$clean['display_type'] = isset( $settings['display_type'] ) && 'radio' === $settings['display_type'] ? 'radio' : 'dropdown';
		$clean['title'] = isset( $settings['title'] ) ? sanitize_text_field( $settings['title'] ) : '';

		$field_bg = isset( $settings['field_bg_color'] ) ? sanitize_hex_color( $settings['field_bg_color'] ) : '';
		$clean['field_bg_color'] = $field_bg ? $field_bg : '';
		$field_border = isset( $settings['field_border_color'] ) ? sanitize_hex_color( $settings['field_border_color'] ) : '';
		$clean['field_border_color'] = $field_border ? $field_border : '';

		$clean['field_border_width'] = isset( $settings['field_border_width'] ) ? min( 20, max( 0, absint( $settings['field_border_width'] ) ) ) : 0;
		$clean['field_radius']        = isset( $settings['field_radius'] ) ? max( 0, absint( $settings['field_radius'] ) ) : 0;
		$clean['field_padding_x']     = isset( $settings['field_padding_x'] ) ? max( 0, absint( $settings['field_padding_x'] ) ) : 0;
		$clean['field_padding_y']     = isset( $settings['field_padding_y'] ) ? max( 0, absint( $settings['field_padding_y'] ) ) : 0;
		$clean['radio_gap']           = isset( $settings['radio_gap'] ) ? max( 0, absint( $settings['radio_gap'] ) ) : 0;

		$shadow = isset( $settings['field_shadow'] ) ? sanitize_text_field( $settings['field_shadow'] ) : 'none';
		$clean['field_shadow'] = in_array( $shadow, array( 'none', 'soft', 'medium', 'strong' ), true ) ? $shadow : 'none';

		// Outer wrapper padding (plain keys; margins come from
		// sanitize_text_style_keys above).
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$key = 'padding_' . $side;
			$clean[ $key ] = isset( $settings[ $key ] ) && '' !== $settings[ $key ]
				? min( 300, max( 0, (float) $settings[ $key ] ) )
				: '';
		}

		// Title heading styling (title_color / title_font_* / margin).
		$clean = array_merge( $clean, $this->sanitize_terms_heading_style( $settings ) );

		// Wrapper box chrome (background, border, radius, shadow).
		return array_merge( $clean, $this->sanitize_box_chrome_keys( $settings ) );
	}

	/**
	 * Archive pagination style (number links + active state).
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_pagination_style( $settings ) {
		$clean = $this->sanitize_text_style_keys( $settings );

		foreach ( array( 'link_color', 'hover_color', 'active_bg', 'active_color' ) as $color_key ) {
			$color = isset( $settings[ $color_key ] ) ? sanitize_hex_color( $settings[ $color_key ] ) : '';
			$clean[ $color_key ] = $color ? $color : '';
		}

		$clean['active_radius'] = isset( $settings['active_radius'] ) ? max( 0, absint( $settings['active_radius'] ) ) : 0;
		$clean['item_gap']      = isset( $settings['item_gap'] ) ? max( 0, absint( $settings['item_gap'] ) ) : 0;

		return $clean;
	}

	/**
	 * Optional heading style used by the term blocks (categories/tags/
	 * attributes). Content keys (title) are handled by the per-block
	 * sanitizers; these are presentation-only.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_terms_heading_style( $settings ) {
		$clean = array();

		$color = isset( $settings['title_color'] ) ? sanitize_hex_color( $settings['title_color'] ) : '';
		$clean['title_color'] = $color ? $color : '';

		$clean['title_font_size'] = isset( $settings['title_font_size'] ) && '' !== $settings['title_font_size']
			? min( 200, max( 0, absint( $settings['title_font_size'] ) ) )
			: '';

		$weight = isset( $settings['title_font_weight'] ) && '' !== $settings['title_font_weight'] ? absint( $settings['title_font_weight'] ) : 0;
		$clean['title_font_weight'] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';

		$clean['title_line_height'] = isset( $settings['title_line_height'] ) && '' !== $settings['title_line_height']
			? min( 5, max( 0.5, (float) $settings['title_line_height'] ) )
			: '';
		$clean['title_letter_spacing'] = isset( $settings['title_letter_spacing'] ) && '' !== $settings['title_letter_spacing']
			? min( 50, max( -20, (float) $settings['title_letter_spacing'] ) )
			: '';

		$transform = isset( $settings['title_text_transform'] ) ? sanitize_text_field( $settings['title_text_transform'] ) : 'none';
		$clean['title_text_transform'] = in_array( $transform, array( 'none', 'uppercase', 'lowercase', 'capitalize' ), true ) ? $transform : 'none';

		$clean['title_font_family'] = $this->sanitize_font_family( isset( $settings['title_font_family'] ) ? $settings['title_font_family'] : '' );

		$clean['title_margin_bottom'] = isset( $settings['title_margin_bottom'] )
			? min( 300, max( 0, absint( $settings['title_margin_bottom'] ) ) )
			: 0;

		return $clean;
	}

	/**
	 * Term item styling shared by the category/tag/attribute blocks:
	 * card/chip chrome, name colour & size, count colour.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_term_items_style( $settings ) {
		$clean = $this->sanitize_box_chrome_keys( $settings, 'item' );
		$clean['item_padding'] = isset( $settings['item_padding'] ) ? max( 0, absint( $settings['item_padding'] ) ) : 0;

		$color = isset( $settings['item_color'] ) ? sanitize_hex_color( $settings['item_color'] ) : '';
		$clean['item_color'] = $color ? $color : '';
		$count = isset( $settings['item_count_color'] ) ? sanitize_hex_color( $settings['item_count_color'] ) : '';
		$clean['item_count_color'] = $count ? $count : '';

		$clean['item_font_size'] = isset( $settings['item_font_size'] ) && '' !== $settings['item_font_size']
			? min( 200, max( 0, absint( $settings['item_font_size'] ) ) )
			: '';
		$weight = isset( $settings['item_font_weight'] ) && '' !== $settings['item_font_weight'] ? absint( $settings['item_font_weight'] ) : 0;
		$clean['item_font_weight'] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';

		$clean['item_font_family'] = $this->sanitize_font_family( isset( $settings['item_font_family'] ) ? $settings['item_font_family'] : '' );

		return $clean;
	}

	/**
	 * WooCommerce search styling (input box + submit button + spacing).
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_woo_search_style( $settings ) {
		$clean = $this->sanitize_text_style_keys( $settings );

		foreach ( array( 'field_bg_color', 'field_border_color', 'field_color' ) as $color_key ) {
			$color = isset( $settings[ $color_key ] ) ? sanitize_hex_color( $settings[ $color_key ] ) : '';
			$clean[ $color_key ] = $color ? $color : '';
		}
		$clean['field_border_width'] = isset( $settings['field_border_width'] ) ? min( 20, max( 0, absint( $settings['field_border_width'] ) ) ) : 0;
		$clean['field_radius']        = isset( $settings['field_radius'] ) ? max( 0, absint( $settings['field_radius'] ) ) : 0;
		$clean['field_height']        = isset( $settings['field_height'] ) ? min( 200, max( 0, absint( $settings['field_height'] ) ) ) : 0;
		$clean['field_font_size']     = isset( $settings['field_font_size'] ) && '' !== $settings['field_font_size']
			? min( 200, max( 0, absint( $settings['field_font_size'] ) ) )
			: '';
		$clean['field_font_family'] = $this->sanitize_font_family( isset( $settings['field_font_family'] ) ? $settings['field_font_family'] : '' );

		return array_merge( $clean, $this->sanitize_button_style_keys( $settings, 'button' ) );
	}

	/**
	 * Classic text widget presentation (title + content typography).
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_text_widget_style( $settings ) {
		$clean = $this->sanitize_text_style_keys( $settings );

		$color = isset( $settings['title_color'] ) ? sanitize_hex_color( $settings['title_color'] ) : '';
		$clean['title_color'] = $color ? $color : '';
		$clean['title_font_size'] = isset( $settings['title_font_size'] ) && '' !== $settings['title_font_size']
			? min( 200, max( 0, absint( $settings['title_font_size'] ) ) )
			: '';
		$weight = isset( $settings['title_font_weight'] ) && '' !== $settings['title_font_weight'] ? absint( $settings['title_font_weight'] ) : 0;
		$clean['title_font_weight'] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';

		$clean['title_font_family'] = $this->sanitize_font_family( isset( $settings['title_font_family'] ) ? $settings['title_font_family'] : '' );

		return $clean;
	}

	/**
	 * Archive product-loop card styling (grid wrapper + card internals).
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_loop_card_style( $settings ) {
		$clean = $this->sanitize_box_chrome_keys( $settings, 'card' );
		$clean['card_padding'] = isset( $settings['card_padding'] ) ? max( 0, absint( $settings['card_padding'] ) ) : 0;

		foreach ( array( 'title_color', 'price_color' ) as $color_key ) {
			$card_key = 'card_' . $color_key;
			$color    = isset( $settings[ $card_key ] ) ? sanitize_hex_color( $settings[ $card_key ] ) : '';
			$clean[ $card_key ] = $color ? $color : '';
		}

		foreach ( array( 'title_font_size', 'title_font_weight', 'price_font_size', 'price_font_weight' ) as $style_key ) {
			$card_key = 'card_' . $style_key;
			if ( false !== strpos( $style_key, 'weight' ) ) {
				$weight = isset( $settings[ $card_key ] ) ? absint( $settings[ $card_key ] ) : 0;
				$clean[ $card_key ] = in_array( $weight, array( 300, 400, 500, 600, 700, 800 ), true ) ? (string) $weight : '';
			} else {
				$clean[ $card_key ] = isset( $settings[ $card_key ] ) && '' !== $settings[ $card_key ]
					? min( 200, max( 0, absint( $settings[ $card_key ] ) ) )
					: '';
			}
		}

		return array_merge( $clean, $this->sanitize_button_style_keys( $settings, 'button' ) );
	}

	/**
	 * Sanitize the product-card blocks (xcosb/cd-*). These share the styling
	 * vocabulary of the single-product blocks plus a few card-only content
	 * keys (link toggle, badge text, term limit/separator, SKU prefix).
	 *
	 * @param string $type     Block type.
	 * @param array  $settings Raw settings.
	 * @return array
	 */
	private function sanitize_card_block_settings( $type, $settings ) {
		if ( 'xcosb/cd-image' === $type ) {
			$clean = $this->sanitize_image_style( $settings );
			$clean['link'] = ! isset( $settings['link'] ) || ! empty( $settings['link'] );
			return $clean;
		}

		if ( 'xcosb/cd-title' === $type ) {
			$tag = isset( $settings['tag'] ) ? sanitize_key( $settings['tag'] ) : 'h2';
			$allowed = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' );
			if ( ! in_array( $tag, $allowed, true ) ) {
				$tag = 'h2';
			}
			return array_merge(
				array(
					'tag'  => $tag,
					'link' => ! isset( $settings['link'] ) || ! empty( $settings['link'] ),
				),
				$this->sanitize_text_style_keys( $settings, true )
			);
		}

		if ( 'xcosb/cd-badge' === $type ) {
			$badge_text = isset( $settings['text'] ) ? sanitize_text_field( $settings['text'] ) : '';
			$clean = array(
				'text' => '' !== $badge_text ? $badge_text : __( 'Sale!', 'xcodesol-page-builder' ),
			);

			$badge_style = isset( $settings['style'] ) ? sanitize_text_field( $settings['style'] ) : 'simple';
			$clean['style'] = in_array( $badge_style, array( 'simple', 'ribbon' ), true ) ? $badge_style : 'simple';

			$badge_position = isset( $settings['position'] ) ? sanitize_text_field( $settings['position'] ) : 'inline';
			$clean['position'] = in_array(
				$badge_position,
				array( 'inline', 'top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right' ),
				true
			) ? $badge_position : 'inline';

			$clean = array_merge( $clean, $this->sanitize_box_chrome_keys( $settings, 'badge' ) );
			$clean['badge_padding'] = isset( $settings['badge_padding'] ) ? min( 100, max( 0, absint( $settings['badge_padding'] ) ) ) : 0;
			return array_merge( $clean, $this->sanitize_text_style_keys( $settings ) );
		}

		if ( 'xcosb/cd-add-to-cart' === $type ) {
			return array_merge(
				$this->sanitize_text_style_keys( $settings ),
				$this->sanitize_button_style_keys( $settings, 'button' )
			);
		}

		if ( 'xcosb/cd-categories' === $type || 'xcosb/cd-tags' === $type ) {
			$clean = array(
				'limit'     => isset( $settings['limit'] ) ? min( 20, max( 0, absint( $settings['limit'] ) ) ) : 0,
				'link'      => ! isset( $settings['link'] ) || ! empty( $settings['link'] ),
				'separator' => isset( $settings['separator'] ) ? sanitize_text_field( $settings['separator'] ) : ', ',
			);
			return array_merge(
				$clean,
				$this->sanitize_term_items_style( $settings ),
				$this->sanitize_text_style_keys( $settings )
			);
		}

		if ( 'xcosb/cd-sku' === $type ) {
			return array_merge(
				array( 'prefix' => isset( $settings['prefix'] ) ? sanitize_text_field( $settings['prefix'] ) : '' ),
				$this->sanitize_text_style_keys( $settings )
			);
		}

		// cd-price / cd-rating / cd-excerpt / cd-stock: plain styled text.
		return $this->sanitize_text_style_keys( $settings );
	}

	/**
	 * Cart / checkout page-content box: placement (align + max width), box
	 * chrome and padding.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_page_content_style( $settings ) {
		$align = isset( $settings['align'] ) ? sanitize_text_field( $settings['align'] ) : 'left';

		$clean = array(
			'align'     => in_array( $align, array( 'left', 'center', 'right' ), true ) ? $align : 'left',
			'max_width' => isset( $settings['max_width'] ) ? min( 2000, max( 0, absint( $settings['max_width'] ) ) ) : 0,
		);

		$clean = array_merge( $clean, $this->sanitize_box_chrome_keys( $settings, '' ) );

		// Optional section heading for the split checkout widgets.
		$clean['title'] = isset( $settings['title'] ) ? sanitize_text_field( $settings['title'] ) : '';

		$uniform_pad = isset( $settings['padding'] ) ? min( 300, max( 0, absint( $settings['padding'] ) ) ) : 0;

		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$clean[ 'padding_' . $side ] = isset( $settings[ 'padding_' . $side ] )
				? min( 300, max( 0, absint( $settings[ 'padding_' . $side ] ) ) )
				: $uniform_pad;
		}

		foreach ( array( 'top', 'bottom' ) as $side ) {
			$key = 'margin_' . $side;
			$clean[ $key ] = isset( $settings[ $key ] ) && '' !== $settings[ $key ]
				? min( 500, max( -500, (float) $settings[ $key ] ) )
				: '';
		}

		return $clean;
	}

	/**
	 * Sanitize blocks that can appear inside a product card.
	 *
	 * @param array $card_layout Raw card layout.
	 * @return array
	 */
	private function sanitize_card_layout( $card_layout ) {
		$allowed = array( 'image', 'badge', 'title', 'price', 'rating', 'excerpt', 'add_to_cart' );
		$clean   = array();

		foreach ( $card_layout as $card_block ) {
			if ( ! is_array( $card_block ) || empty( $card_block['type'] ) ) {
				continue;
			}

			$type = sanitize_key( $card_block['type'] );
			if ( ! in_array( $type, $allowed, true ) ) {
				continue;
			}

			$clean[] = array(
				'type'     => $type,
				'settings' => isset( $card_block['settings'] ) && is_array( $card_block['settings'] ) ? $this->sanitize_settings( $card_block['settings'] ) : array(),
			);
		}

		return $clean;
	}

	/**
	 * Sanitize block settings.
	 *
	 * @param array $settings Settings array.
	 * @return array
	 */
	private function sanitize_settings( $settings ) {
		$clean = array();

		foreach ( $settings as $key => $value ) {
			$key = sanitize_key( $key );

			if ( is_string( $value ) ) {
				$clean[ $key ] = sanitize_text_field( $value );
			} elseif ( is_numeric( $value ) ) {
				$clean[ $key ] = absint( $value );
			} elseif ( is_scalar( $value ) ) {
				$clean[ $key ] = sanitize_text_field( (string) $value );
			}
		}

		return $clean;
	}

	/**
	 * Sanitize the WooCommerce product categories block settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_woo_categories_settings( $settings ) {
		$display = isset( $settings['display'] ) ? sanitize_text_field( $settings['display'] ) : 'grid';
		$orderby = isset( $settings['orderby'] ) ? sanitize_text_field( $settings['orderby'] ) : 'name';
		$order   = isset( $settings['order'] ) ? sanitize_text_field( $settings['order'] ) : 'asc';

		$content = array(
			'display'    => in_array( $display, array( 'grid', 'list' ), true ) ? $display : 'grid',
			'columns'    => isset( $settings['columns'] ) ? min( 6, max( 1, absint( $settings['columns'] ) ) ) : 4,
			'hide_empty' => ! empty( $settings['hide_empty'] ),
			'show_count' => ! empty( $settings['show_count'] ),
			'orderby'    => in_array( $orderby, array( 'name', 'count', 'slug' ), true ) ? $orderby : 'name',
			'order'      => in_array( $order, array( 'asc', 'desc' ), true ) ? $order : 'asc',
		);

		if ( isset( $settings['title'] ) ) {
			$content['title'] = sanitize_text_field( $settings['title'] );
		}

		return array_merge(
			$content,
			$this->sanitize_terms_heading_style( $settings ),
			$this->sanitize_term_items_style( $settings ),
			$this->sanitize_text_style_keys( $settings )
		);
	}

	/**
	 * Sanitize the WooCommerce product tags block settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_woo_tags_settings( $settings ) {
		$display = isset( $settings['display'] ) ? sanitize_text_field( $settings['display'] ) : 'cloud';
		$orderby = isset( $settings['orderby'] ) ? sanitize_text_field( $settings['orderby'] ) : 'count';
		$order   = isset( $settings['order'] ) ? sanitize_text_field( $settings['order'] ) : 'desc';

		$content = array(
			'display'    => in_array( $display, array( 'cloud', 'list' ), true ) ? $display : 'cloud',
			'limit'      => isset( $settings['limit'] ) ? min( 100, max( 0, absint( $settings['limit'] ) ) ) : 0,
			'hide_empty' => ! empty( $settings['hide_empty'] ),
			'orderby'    => in_array( $orderby, array( 'name', 'count', 'slug' ), true ) ? $orderby : 'count',
			'order'      => in_array( $order, array( 'asc', 'desc' ), true ) ? $order : 'desc',
		);

		if ( isset( $settings['title'] ) ) {
			$content['title'] = sanitize_text_field( $settings['title'] );
		}

		return array_merge(
			$content,
			$this->sanitize_terms_heading_style( $settings ),
			$this->sanitize_term_items_style( $settings ),
			$this->sanitize_text_style_keys( $settings )
		);
	}

	/**
	 * Sanitize the WooCommerce product attributes block settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_woo_attributes_settings( $settings ) {
		$attribute = isset( $settings['attribute'] ) ? sanitize_text_field( $settings['attribute'] ) : '';

		// Only accept WooCommerce global attribute taxonomies (pa_*).
		if ( $attribute && ! preg_match( '/^pa_[a-z0-9_-]+$/i', $attribute ) ) {
			$attribute = '';
		}

		$content = array(
			'attribute'  => $attribute,
			'hide_empty' => ! empty( $settings['hide_empty'] ),
		);

		if ( isset( $settings['title'] ) ) {
			$content['title'] = sanitize_text_field( $settings['title'] );
		}

		return array_merge(
			$content,
			$this->sanitize_terms_heading_style( $settings ),
			$this->sanitize_term_items_style( $settings ),
			$this->sanitize_text_style_keys( $settings )
		);
	}

	/**
	 * Sanitize the WooCommerce product search block settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_woo_search_settings( $settings ) {
		$content = array(
			'placeholder'  => isset( $settings['placeholder'] ) ? sanitize_text_field( $settings['placeholder'] ) : '',
			'button_text'  => isset( $settings['button_text'] ) ? sanitize_text_field( $settings['button_text'] ) : '',
			'show_button'  => ! isset( $settings['show_button'] ) || ! empty( $settings['show_button'] ),
		);

		return array_merge( $content, $this->sanitize_woo_search_style( $settings ) );
	}

	/**
	 * Sanitize container block settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	private function sanitize_container_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$columns = isset( $settings['columns'] ) ? min( 6, max( 1, absint( $settings['columns'] ) ) ) : 2;
		$widths  = isset( $settings['column_widths'] ) && is_array( $settings['column_widths'] )
			? $settings['column_widths']
			: array();

		$uniform_padding = isset( $settings['padding'] ) ? absint( $settings['padding'] ) : 20;

		$clean = array(
			'columns'        => $columns,
			'column_widths'  => $this->sanitize_container_widths( $widths, $columns ),
			'gap'            => isset( $settings['gap'] ) ? absint( $settings['gap'] ) : 20,
			'padding_top'    => isset( $settings['padding_top'] ) ? absint( $settings['padding_top'] ) : $uniform_padding,
			'padding_right'  => isset( $settings['padding_right'] ) ? absint( $settings['padding_right'] ) : $uniform_padding,
			'padding_bottom' => isset( $settings['padding_bottom'] ) ? absint( $settings['padding_bottom'] ) : $uniform_padding,
			'padding_left'   => isset( $settings['padding_left'] ) ? absint( $settings['padding_left'] ) : $uniform_padding,
			'align'          => isset( $settings['align'] ) ? sanitize_text_field( $settings['align'] ) : 'stretch',
			'background'     => isset( $settings['background'] ) ? sanitize_hex_color( $settings['background'] ) : '',
			'border_radius'  => isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 8,
			'box_shadow'     => isset( $settings['box_shadow'] ) ? sanitize_text_field( $settings['box_shadow'] ) : 'none',
			'border_width'   => isset( $settings['border_width'] ) ? absint( $settings['border_width'] ) : 0,
			'border_style'   => isset( $settings['border_style'] ) ? sanitize_text_field( $settings['border_style'] ) : 'solid',
			'border_color'   => '',
			'animation'      => isset( $settings['animation'] ) ? sanitize_text_field( $settings['animation'] ) : 'none',
			'position'       => isset( $settings['position'] ) ? sanitize_text_field( $settings['position'] ) : 'full',
			'max_width'      => isset( $settings['max_width'] ) ? min( 2000, max( 0, absint( $settings['max_width'] ) ) ) : 0,
		);

		// Per-device width overrides (tablet_column_widths / mobile_column_widths)
		// are full arrays aligned with the desktop column count; each entry is
		// validated exactly like the desktop widths (1-12 per column). They stay
		// out of expand_responsive_variants() because that pass only clones
		// scalar keys — arrays are handled right here.
		foreach ( array( 'tablet', 'mobile' ) as $device ) {
			$vkey = $device . '_column_widths';
			if ( isset( $settings[ $vkey ] ) && is_array( $settings[ $vkey ] ) ) {
				$clean[ $vkey ] = $this->sanitize_container_widths( $settings[ $vkey ], $columns );
			}
		}

		$clean['column_styles'] = $this->sanitize_container_column_styles(
			isset( $settings['column_styles'] ) && is_array( $settings['column_styles'] ) ? $settings['column_styles'] : array(),
			$columns
		);

		$clean['box_shadow'] = in_array( $clean['box_shadow'], array( 'none', 'soft', 'medium', 'strong' ), true ) ? $clean['box_shadow'] : 'none';
		$clean['border_style'] = in_array( $clean['border_style'], array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $clean['border_style'] : 'solid';
		$clean['animation'] = in_array( $clean['animation'], XCOPB_Motion_Presets::ids(), true ) ? $clean['animation'] : 'none';

		$border_color = isset( $settings['border_color'] ) ? sanitize_hex_color( $settings['border_color'] ) : '';
		$clean['border_color'] = $border_color ? $border_color : '';

		$clean['animation_duration'] = isset( $settings['animation_duration'] ) ? min( 3000, absint( $settings['animation_duration'] ) ) : 600;
		$clean['animation_delay'] = isset( $settings['animation_delay'] ) ? min( 3000, absint( $settings['animation_delay'] ) ) : 0;
		$clean['animation_easing'] = isset( $settings['animation_easing'] ) && in_array( $settings['animation_easing'], array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.16,1,0.3,1)' ), true ) ? $settings['animation_easing'] : 'ease';
		$clean['animation_repeat'] = isset( $settings['animation_repeat'] ) && in_array( (string) $settings['animation_repeat'], array( '1', '2', '3', 'infinite' ), true ) ? (string) $settings['animation_repeat'] : '1';

		$clean['align'] = in_array( $clean['align'], array( 'stretch', 'start', 'center', 'end' ), true ) ? $clean['align'] : 'stretch';
		$clean['position'] = in_array( $clean['position'], array( 'full', 'left', 'center', 'right' ), true ) ? $clean['position'] : 'full';

		return $clean;
	}

	/**
	 * Sanitize per-column presentation overrides (background, padding,
	 * border, radius, shadow, content alignment).
	 *
	 * Stores one index-aligned entry per column so the renderer can rely on
	 * the shape; empty input produces empty rows that render as no-ops.
	 * Every style key may also carry a tablet_<key> / mobile_<key> variant
	 * (same key list as XCOPB_Block_Registry::column_style_responsive_defs())
	 * — validated with the identical per-key rules so device overrides can
	 * never smuggle in values the desktop row would reject. 'start' is
	 * structural grid placement, not a visual style, and stays desktop-only.
	 *
	 * @param array $styles   Raw column_styles value.
	 * @param int   $columns Number of columns.
	 * @return array
	 */
	private function sanitize_container_column_styles( $styles, $columns ) {
		$clean = array();

		// Keys that may carry tablet_/mobile_ variants (mirror the registry
		// defs list — keep both in sync when adding a per-column property).
		$style_keys = array(
			'background', 'padding_top', 'padding_right', 'padding_bottom', 'padding_left',
			'border_width', 'border_style', 'border_color', 'border_radius', 'box_shadow',
			'align_v', 'align_h',
		);

		for ( $i = 0; $i < $columns; $i++ ) {
			$raw = isset( $styles[ $i ] ) && is_array( $styles[ $i ] ) ? $styles[ $i ] : array();

			$background = isset( $raw['background'] ) ? sanitize_hex_color( $raw['background'] ) : '';
			$border_style = isset( $raw['border_style'] ) ? sanitize_text_field( $raw['border_style'] ) : 'solid';
			$border_color = isset( $raw['border_color'] ) ? sanitize_hex_color( $raw['border_color'] ) : '';
			$box_shadow   = isset( $raw['box_shadow'] ) ? sanitize_text_field( $raw['box_shadow'] ) : 'none';

			$row = array(
				'background' => $background ? $background : '',
				'padding_top'    => isset( $raw['padding_top'] ) ? max( 0, absint( $raw['padding_top'] ) ) : 0,
				'padding_right'  => isset( $raw['padding_right'] ) ? max( 0, absint( $raw['padding_right'] ) ) : 0,
				'padding_bottom' => isset( $raw['padding_bottom'] ) ? max( 0, absint( $raw['padding_bottom'] ) ) : 0,
				'padding_left'   => isset( $raw['padding_left'] ) ? max( 0, absint( $raw['padding_left'] ) ) : 0,
				'border_width' => isset( $raw['border_width'] ) ? min( 50, max( 0, absint( $raw['border_width'] ) ) ) : 0,
				'border_style' => in_array( $border_style, array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $border_style : 'solid',
				'border_color' => $border_color ? $border_color : '',
				'border_radius' => isset( $raw['border_radius'] ) ? max( 0, absint( $raw['border_radius'] ) ) : 0,
				'box_shadow'   => in_array( $box_shadow, array( 'none', 'soft', 'medium', 'strong' ), true ) ? $box_shadow : 'none',
				'align_v'      => in_array( isset( $raw['align_v'] ) ? $raw['align_v'] : '', array( '', 'top', 'center', 'bottom' ), true ) ? ( isset( $raw['align_v'] ) ? $raw['align_v'] : '' ) : '',
				'align_h'      => in_array( isset( $raw['align_h'] ) ? $raw['align_h'] : '', array( '', 'left', 'center', 'right' ), true ) ? ( isset( $raw['align_h'] ) ? $raw['align_h'] : '' ) : '',
				'start'        => isset( $raw['start'] ) ? min( 12, max( 0, absint( $raw['start'] ) ) ) : 0,
			);

			// Device variants for the style keys above: stored only when the
			// row actually sets them (absent = inherit the wider device) and
			// validated with the same per-key rules as the desktop row.
			foreach ( array( 'tablet', 'mobile' ) as $device ) {
				foreach ( $style_keys as $style_key ) {
					$vkey = $device . '_' . $style_key;
					if ( ! array_key_exists( $vkey, $raw ) ) {
						continue;
					}
					$sanitized = $this->sanitize_column_style_value( $style_key, $raw[ $vkey ] );
					if ( false !== $sanitized ) {
						$row[ $vkey ] = $sanitized;
					}
				}
			}

			$clean[ $i ] = $row;
		}

		return $clean;
	}

	/**
	 * Validate one per-column style value with the same rules whether it is
	 * the desktop row or a tablet_/mobile_ variant, so validation never
	 * drifts between devices.
	 *
	 * @param string $key   Column style key.
	 * @param mixed  $value Raw value.
	 * @return mixed Sanitized value, or false when empty/invalid (callers
	 *               drop false so an invalid variant inherits the wider
	 *               device instead of corrupting the row).
	 */
	private function sanitize_column_style_value( $key, $value ) {
		if ( '' === $value || null === $value ) {
			return false;
		}
		switch ( $key ) {
			case 'background':
			case 'border_color':
				$hex = sanitize_hex_color( $value );
				return $hex ? $hex : false;
			case 'padding_top':
			case 'padding_right':
			case 'padding_bottom':
			case 'padding_left':
			case 'border_radius':
				return max( 0, absint( $value ) );
			case 'border_width':
				return min( 50, max( 0, absint( $value ) ) );
			case 'border_style':
				return in_array( $value, array( 'solid', 'dashed', 'dotted', 'double' ), true ) ? $value : false;
			case 'box_shadow':
				return in_array( $value, array( 'none', 'soft', 'medium', 'strong' ), true ) ? $value : false;
			case 'align_v':
				return in_array( $value, array( 'top', 'center', 'bottom' ), true ) ? $value : false;
			case 'align_h':
				return in_array( $value, array( 'left', 'center', 'right' ), true ) ? $value : false;
		}
		return false;
	}

	/**
	 * Sanitize per-column widths on the 12-unit grid.
	 *
	 * Keeps the stored array aligned with the column count; missing or
	 * invalid entries fall back to an even split (matching the renderer).
	 *
	 * @param array $widths  Raw column_widths.
	 * @param int   $columns Number of columns.
	 * @return array
	 */
	private function sanitize_container_widths( $widths, $columns ) {
		$clean = array();
		$base  = (int) floor( 12 / $columns );
		$rem   = 12 % $columns;

		for ( $i = 0; $i < $columns; $i++ ) {
			if ( isset( $widths[ $i ] ) && is_numeric( $widths[ $i ] ) ) {
				$clean[] = min( 12, max( 1, absint( $widths[ $i ] ) ) );
			} else {
				$clean[] = $base + ( $i < $rem ? 1 : 0 );
			}
		}

		return $clean;
	}

	/**
	 * Sanitize conditions array.
	 *
	 * @param array $conditions Conditions array.
	 * @return array
	 */
	private function sanitize_conditions( $conditions ) {
		$mode = isset( $conditions['mode'] ) ? sanitize_text_field( $conditions['mode'] ) : 'include';
		$mode = in_array( $mode, array( 'include', 'exclude' ), true ) ? $mode : 'include';

		$rules = isset( $conditions['rules'] ) && is_array( $conditions['rules'] ) ? $conditions['rules'] : array();
		$clean_rules = array();

		foreach ( $rules as $rule ) {
			if ( ! is_array( $rule ) || empty( $rule['type'] ) ) {
				continue;
			}

			$type = sanitize_text_field( $rule['type'] );
			$clean_rule = array( 'type' => $type );				switch ( $type ) {
					case 'page':
						$clean_rule['page'] = isset( $rule['page'] ) ? sanitize_text_field( $rule['page'] ) : 'shop';
						$clean_rule['page'] = in_array( $clean_rule['page'], array( 'shop', 'product_category', 'product_tag', 'product_archive' ), true ) ? $clean_rule['page'] : 'shop';
						$clean_rule['operator'] = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'is';
						$clean_rule['operator'] = in_array( $clean_rule['operator'], array( 'is', 'is_not' ), true ) ? $clean_rule['operator'] : 'is';
						break;

					case 'taxonomy':
						$clean_rule['taxonomy'] = isset( $rule['taxonomy'] ) ? sanitize_text_field( $rule['taxonomy'] ) : 'product_cat';
						$clean_rule['operator'] = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'in';
						$clean_rule['operator'] = in_array( $clean_rule['operator'], array( 'in', 'not_in' ), true ) ? $clean_rule['operator'] : 'in';
						$clean_rule['term_ids'] = isset( $rule['term_ids'] ) && is_array( $rule['term_ids'] ) ? array_values( array_filter( array_map( 'absint', $rule['term_ids'] ) ) ) : array();
						break;

				case 'product_ids':
					$clean_rule['operator'] = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'in';
					$clean_rule['operator'] = in_array( $clean_rule['operator'], array( 'in', 'not_in' ), true ) ? $clean_rule['operator'] : 'in';
					$clean_rule['values']   = isset( $rule['values'] ) && is_array( $rule['values'] ) ? array_values( array_filter( array_map( 'absint', $rule['values'] ) ) ) : array();
					break;

				case 'sale':
					$clean_rule['operator'] = 'is';
					$clean_rule['value']    = isset( $rule['value'] ) ? (bool) $rule['value'] : false;
					break;

				default:
					continue 2;
			}

			$clean_rules[] = $clean_rule;
		}

		return array(
			'mode'  => $mode,
			'rules' => $clean_rules,
		);
	}

	/**
	 * Get update args schema.
	 *
	 * @return array
	 */
	private function get_update_args() {
		return array(
			'title'      => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
			),
			'view_type'  => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
			),
			'structure'  => array(
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
			),
			'layout'     => array(
				'type'              => 'object',
				'required'          => false,
			),
			'zones'      => array(
				'type'              => 'array',
				'required'          => false,
			),
			'conditions' => array(
				'type'              => 'object',
				'required'          => false,
			),
			'priority'   => array(
				'type'              => 'integer',
				'required'          => false,
			),
			'settings'   => array(
				'type'              => 'object',
				'required'          => false,
			),
			'page_settings' => array(
				'type'              => 'object',
				'required'          => false,
			),
		);
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_REST_Templates', 'XCOSB_REST_Templates' );
