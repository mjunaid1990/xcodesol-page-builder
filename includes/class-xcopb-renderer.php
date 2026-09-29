<?php
/**
 * Renderer that processes layout JSON and outputs HTML.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Renderer
 */
class XCOPB_Renderer {

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_Renderer|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Renderer
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
	private function __construct() {}

	/**
	 * Shortcode callback for [xcodesol_page_builder id="..."] and aliases.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string Rendered template HTML.
	 */
	public static function shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'   => 0,
				'slug' => '',
			),
			$atts,
			'xcodesol_page_builder'
		);

		$template_id = absint( $atts['id'] );

		if ( ! $template_id && ! empty( $atts['slug'] ) ) {
			$post = get_page_by_path( sanitize_title( $atts['slug'] ), OBJECT, array( XCOPB_Registrar::POST_TYPE, 'xcosb_template' ) );
			if ( $post ) {
				$template_id = $post->ID;
			}
		}

		if ( ! $template_id ) {
			return '';
		}

		// Enqueue the public assets for this template.
		if ( class_exists( 'XCOPB_Template_Loader' ) ) {
			XCOPB_Template_Loader::instance()->enqueue_public_assets_for_template( $template_id );
		}

		return self::instance()->render( $template_id );
	}

	/**
	 * Render a template by ID.
	 *
	 * @param int   $template_id Template post ID.
	 * @param array $context     Context data.
	 * @return string Rendered HTML.
	 */
	public function render( $template_id, $context = array() ) {
		$layout_json = XCOPB_Registrar::get_field( $template_id, '_xcopb_layout', '[]' );

		$blocks = json_decode( $layout_json, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $blocks ) ) {
			return '';
		}

		$settings = json_decode( XCOPB_Registrar::get_field( $template_id, '_xcopb_settings', '{}' ), true );
		$classes  = array( 'xcopb-template-wrapper', 'xsb-template-wrapper', 'xcopb-full-width' );

		$structure = XCOPB_Registrar::get_field( $template_id, '_xcopb_structure', '' );

		if ( ! empty( $structure ) ) {
			$valid_structures = array(
				'page-blank', 'page-hero', 'page-split', 'page-landing',
				'section-single', 'header-standard', 'footer-multi',
				'sp-centered', 'sp-split', 'sp-hero', 'sp-minimal',
				'ar-standard', 'ar-described', 'ar-banner', 'ar-minimal',
				'cd-single', 'ct-standard', 'ck-standard',
			);

			if ( in_array( $structure, $valid_structures, true ) ) {
				$classes[] = 'xcopb-structure-' . esc_attr( $structure );
				$classes[] = 'xsb-structure-' . esc_attr( $structure );
			}
		}

		if ( is_array( $settings ) && ! empty( $settings['disable_on_mobile'] ) ) {
			$classes[] = 'xcopb-disable-on-mobile';
			$classes[] = 'xsb-disable-on-mobile';
		}

		$output = '<div class="' . esc_attr( implode( ' ', $classes ) ) . '">';

		$output .= $this->render_block_list( $blocks, $context );

		$output .= '</div>';

		return $output;
	}

	/**
	 * Render a list of block arrays (used for nested layouts such as the
	 * product-card template rendered inside an archive loop item).
	 *
	 * @param array $blocks  Array of block arrays with type/settings.
	 * @param array $context Context data.
	 * @return string Rendered HTML.
	 */
	public function render_block_list( $blocks, $context = array() ) {
		if ( ! is_array( $blocks ) ) {
			return '';
		}

		$output = '';

		foreach ( $blocks as $block ) {
			if ( ! isset( $block['type'] ) ) {
				continue;
			}

			$block_html = XCOPB_Block_Registry::instance()->render_block( $block['type'], $block, $context );

			if ( ! empty( $block_html ) ) {
				$output .= $block_html;
			}
		}

		return $output;
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Renderer', 'XCOSB_Renderer' );
