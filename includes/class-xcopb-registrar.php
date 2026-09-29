<?php
/**
 * Registers the Page Builder template CPT and meta fields.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Registrar
 */
class XCOPB_Registrar {

	/**
	 * Post type slug.
	 *
	 * @var string
	 */
	const POST_TYPE = 'xcopb_template';

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_Registrar|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Registrar
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
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'init', array( $this, 'register_meta_fields' ) );
	}

	/**
	 * Register the xcopb_template post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'                  => _x( 'Templates', 'Post type general name', 'xcodesol-page-builder' ),
			'singular_name'         => _x( 'Template', 'Post type singular name', 'xcodesol-page-builder' ),
			'menu_name'             => _x( 'Templates', 'Admin Menu text', 'xcodesol-page-builder' ),
			'name_admin_bar'        => _x( 'Template', 'Add New on Toolbar', 'xcodesol-page-builder' ),
			'add_new'               => __( 'Add New', 'xcodesol-page-builder' ),
			'add_new_item'          => __( 'Add New Template', 'xcodesol-page-builder' ),
			'new_item'              => __( 'New Template', 'xcodesol-page-builder' ),
			'edit_item'             => __( 'Edit Template', 'xcodesol-page-builder' ),
			'view_item'             => __( 'View Template', 'xcodesol-page-builder' ),
			'all_items'             => __( 'All Templates', 'xcodesol-page-builder' ),
			'search_items'          => __( 'Search Templates', 'xcodesol-page-builder' ),
			'parent_item_colon'     => __( 'Parent Templates:', 'xcodesol-page-builder' ),
			'not_found'             => __( 'No templates found.', 'xcodesol-page-builder' ),
			'not_found_in_trash'    => __( 'No templates found in Trash.', 'xcodesol-page-builder' ),
			'featured_image'        => _x( 'Template Cover Image', 'Overrides the "Featured Image" phrase', 'xcodesol-page-builder' ),
			'set_featured_image'    => _x( 'Set cover image', 'Overrides the "Set featured image" phrase', 'xcodesol-page-builder' ),
			'remove_featured_image' => _x( 'Remove cover image', 'Overrides the "Remove featured image" phrase', 'xcodesol-page-builder' ),
			'use_featured_image'    => _x( 'Use as cover image', 'Overrides the "Use as featured image" phrase', 'xcodesol-page-builder' ),
			'archives'              => _x( 'Template Archives', 'The post type archive label', 'xcodesol-page-builder' ),
			'filter_items_list'     => _x( 'Filter templates list', 'Screen reader text', 'xcodesol-page-builder' ),
			'items_list_navigation' => _x( 'Templates list navigation', 'Screen reader text', 'xcodesol-page-builder' ),
			'items_list'            => _x( 'Templates list', 'Screen reader text', 'xcodesol-page-builder' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false,
			'show_ui'            => true,
			/* Own top-level menu (see XCOPB_Admin::register_menu) — the CPT
			 * becomes its first submenu so Page Builder has its own space in
			 * the admin instead of living inside the WooCommerce menu. */
			'show_in_menu'       => 'xcodesol-page-builder',
			'query_var'          => false,
			'rewrite'            => false,
			'capability_type'    => 'post',
			'has_archive'        => false,
			'hierarchical'       => false,
			'menu_position'      => 56,
			'menu_icon'          => 'dashicons-welcome-view-site',
			'supports'           => array( 'title', 'editor', 'custom-fields' ),
			'show_in_rest'       => false,
			'publicly_queryable' => false,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register meta fields for the CPT.
	 */
	public function register_meta_fields() {
		$meta_fields = array(
			'_xcopb_view_type',
			'_xcopb_layout',
			'_xcopb_structure',
			'_xcopb_zones',
			'_xcopb_conditions',
			'_xcopb_priority',
			'_xcopb_settings',
			'_xcopb_is_active',
			'_xcopb_applied_preset',
		);

		foreach ( $meta_fields as $meta_key ) {
			register_post_meta( self::POST_TYPE, $meta_key, array(
				'show_in_rest'  => false,
				'single'        => true,
				'auth_callback' => function () {
					return current_user_can( 'edit_pages' ) || current_user_can( 'manage_options' );
				},
			) );
		}
	}

	/**
	 * Get a meta field value with sanitization and legacy fallback.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $key     Meta key.
	 * @param mixed  $default Default value.
	 * @return mixed
	 */
	public static function get_field( $post_id, $key, $default = '' ) {
		$value = get_post_meta( $post_id, $key, true );
		if ( '' !== $value ) {
			return $value;
		}

		if ( 0 === strpos( $key, '_xcopb_' ) ) {
			$suffix = substr( $key, 7 );
			foreach ( array( '_xcosb_', '_xsb_', '_wtb_' ) as $prefix ) {
				$fallback = get_post_meta( $post_id, $prefix . $suffix, true );
				if ( '' !== $fallback ) {
					return $fallback;
				}
			}
		}

		return $default;
	}

	/**
	 * Get view type options.
	 *
	 * @return array
	 */
	public static function get_view_type_options() {
		return array(
			'page'             => __( 'Page Template', 'xcodesol-page-builder' ),
			'single_post'      => __( 'Single Post Template', 'xcodesol-page-builder' ),
			'archive'          => __( 'Archive Template', 'xcodesol-page-builder' ),
			'header'           => __( 'Header', 'xcodesol-page-builder' ),
			'footer'           => __( 'Footer', 'xcodesol-page-builder' ),
			'section'          => __( 'Section / Block', 'xcodesol-page-builder' ),
			'landing'          => __( 'Landing Page', 'xcodesol-page-builder' ),
			// Legacy types support
			'single_product'   => __( 'Single Product (Legacy)', 'xcodesol-page-builder' ),
			'shop'             => __( 'Shop Page (Legacy)', 'xcodesol-page-builder' ),
			'product_category' => __( 'Product Category (Legacy)', 'xcodesol-page-builder' ),
			'product_tag'      => __( 'Product Tag (Legacy)', 'xcodesol-page-builder' ),
			'product_archive'  => __( 'Product Archive (Legacy)', 'xcodesol-page-builder' ),
			'product_card'     => __( 'Product Card (Legacy)', 'xcodesol-page-builder' ),
			'cart'             => __( 'Cart Page (Legacy)', 'xcodesol-page-builder' ),
			'checkout'         => __( 'Checkout Page (Legacy)', 'xcodesol-page-builder' ),
		);
	}

	/**
	 * Get all published template IDs for a given view type, ordered by priority DESC.
	 *
	 * Only templates that are active (or whose active status has not been explicitly
	 * disabled with '0') are returned.
	 *
	 * @param string $view_type View type slug.
	 * @return int[] Array of post IDs.
	 */
	public static function get_templates_by_view_type( $view_type ) {
		$query = new WP_Query( array(
			'post_type'      => array( self::POST_TYPE, 'xcosb_template' ),
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'update_post_meta_cache' => true,
			'update_post_term_cache' => false,
			'meta_query'     => array(
				'relation' => 'AND',
				array(
					'relation' => 'OR',
					array(
						'key'   => '_xcopb_view_type',
						'value' => $view_type,
					),
					array(
						'key'   => '_xcosb_view_type',
						'value' => $view_type,
					),
				),
				array(
					'relation' => 'OR',
					array(
						'key'     => '_xcopb_priority',
						'type'    => 'NUMERIC',
					),
					array(
						'key'     => '_xcosb_priority',
						'type'    => 'NUMERIC',
					),
				),
				array(
					'relation' => 'OR',
					array(
						'key'     => '_xcopb_is_active',
						'compare' => 'NOT EXISTS',
					),
					array(
						'key'     => '_xcopb_is_active',
						'value'   => '0',
						'compare' => '!=',
					),
					array(
						'key'     => '_xcosb_is_active',
						'value'   => '0',
						'compare' => '!=',
					),
				),
			),
			'orderby'        => 'meta_value_num',
			'meta_key'       => '_xcopb_priority',
			'order'          => 'DESC',
		) );

		return wp_list_pluck( $query->posts, 'ID' );
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Registrar', 'XCOSB_Registrar' );
