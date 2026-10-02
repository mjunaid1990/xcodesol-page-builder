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
		$blocks = $this->ensure_block_ids( $blocks );

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
		$wrapper_id = '';
		$wrapper_style = array();
		if ( 'page' === get_post_type( $template_id ) ) {
			$page_style = get_post_meta( $template_id, '_xcopb_page_settings', true );
			if ( is_array( $page_style ) ) {
				if ( ! empty( $page_style['css_id'] ) ) { $wrapper_id = ' id="' . esc_attr( $page_style['css_id'] ) . '"'; }
				if ( ! empty( $page_style['css_class'] ) ) { $classes = array_merge( $classes, preg_split( '/\s+/', sanitize_text_field( $page_style['css_class'] ) ) ); }
				foreach ( array( 'margin', 'padding' ) as $box_name ) {
					if ( empty( $page_style[ $box_name ] ) || ! is_array( $page_style[ $box_name ] ) ) { continue; }
					$box = $page_style[ $box_name ]; $unit = isset( $box['unit'] ) && in_array( $box['unit'], array( 'px', '%', 'em', 'rem', 'vw', 'vh' ), true ) ? $box['unit'] : 'px';
					$sides = isset( $box['values'] ) && is_array( $box['values'] ) ? $box['values'] : $box;
					foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) { if ( isset( $sides[ $side ] ) && is_numeric( $sides[ $side ] ) ) { $wrapper_style[] = $box_name . '-' . $side . ':' . (float) $sides[ $side ] . $unit; } }
				}
			}
		}

		$output = '<div' . $wrapper_id . ' class="' . esc_attr( implode( ' ', array_filter( $classes ) ) ) . '"' . ( $wrapper_style ? ' style="' . esc_attr( implode( ';', $wrapper_style ) ) . '"' : '' ) . '>';

		$output .= $this->render_block_list( $blocks, $context );

		$output .= '</div>';

		return $output;
	}

	/**
	 * Ensure legacy and directly imported layouts have unique block identities
	 * before their widgets are rendered to the public page.
	 *
	 * @param array $blocks Layout blocks.
	 * @return array
	 */
	private function ensure_block_ids( $blocks ) {
		$used_ids = array();
		$normalize_block = function ( $block ) use ( &$normalize_block, &$used_ids ) {
			if ( ! is_array( $block ) ) {
				return $block;
			}

			$block_id = isset( $block['id'] ) ? sanitize_key( $block['id'] ) : '';
			if ( '' === $block_id || isset( $used_ids[ $block_id ] ) ) {
				do {
					$block_id = 'xsb-' . str_replace( '-', '', wp_generate_uuid4() );
				} while ( isset( $used_ids[ $block_id ] ) );
			}
			$used_ids[ $block_id ] = true;
			$block['id'] = $block_id;

			if ( isset( $block['inner'] ) && is_array( $block['inner'] ) ) {
				foreach ( $block['inner'] as $column_index => $column ) {
					if ( ! is_array( $column ) ) {
						$block['inner'][ $column_index ] = array();
						continue;
					}
					foreach ( $column as $block_index => $child ) {
						$block['inner'][ $column_index ][ $block_index ] = $normalize_block( $child );
					}
				}
			}
			return $block;
		};

		foreach ( $blocks as $index => $block ) {
			$blocks[ $index ] = $normalize_block( $block );
		}

		return $blocks;
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
		$blocks = $this->ensure_block_ids( $blocks );

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
