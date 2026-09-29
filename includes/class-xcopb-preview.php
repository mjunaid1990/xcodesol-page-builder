<?php
/**
 * In-admin template preview controller.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

class XCOPB_Preview {

	/**
	 * Render a preview response from a WordPress-managed admin-post request.
	 *
	 * @return void
	 */
	public static function render() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You are not allowed to preview.', 'xcodesol-page-builder' ) );
		}

		check_admin_referer( 'xcopb_preview', 'xcopb_preview_nonce' );

		$view_type = isset( $_POST['view_type'] ) ? sanitize_key( wp_unslash( $_POST['view_type'] ) ) : 'single_product';
		$layout_raw = isset( $_POST['layout'] ) ? wp_unslash( $_POST['layout'] ) : '[]'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- JSON is decoded and passed through the REST layout sanitizer below.
		$structure  = isset( $_POST['structure'] ) ? sanitize_key( wp_unslash( $_POST['structure'] ) ) : '';
		$zones_raw  = isset( $_POST['zones'] ) ? wp_unslash( $_POST['zones'] ) : '[]'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- JSON is decoded and each zone is sanitized below.
		$layout     = json_decode( is_string( $layout_raw ) ? $layout_raw : '[]', true );
		$zones      = json_decode( is_string( $zones_raw ) ? $zones_raw : '[]', true );
		$layout     = XCOSB_REST_Templates::instance()->sanitize_preview_layout( $layout );
		$zones      = is_array( $zones ) ? array_map( 'sanitize_key', $zones ) : array();

		$valid_structures = array( 'sp-centered', 'sp-split', 'sp-hero', 'sp-minimal', 'ar-standard', 'ar-described', 'ar-banner', 'ar-minimal' );
		if ( ! in_array( $structure, $valid_structures, true ) ) {
			$structure = '';
		}

		$context = array( 'view_type' => $view_type );
		if ( 'single_product' === $view_type ) {
			$product = self::get_sample_product();
			if ( $product instanceof WC_Product ) {
				$context['product_id'] = $product->get_id();
				$context['product'] = $product;
				$context['categories'] = wp_get_post_terms( $product->get_id(), 'product_cat', array( 'fields' => 'ids' ) );
				$context['tags'] = wp_get_post_terms( $product->get_id(), 'product_tag', array( 'fields' => 'ids' ) );
				$context['is_sale'] = $product->is_on_sale();
				$GLOBALS['post'] = get_post( $product->get_id() );
				setup_postdata( $product->get_id() );
			}
		} else {
			$context['term_id'] = 0;
			$context['taxonomy'] = 'product_cat';
			$sample_ids = self::get_sample_product_ids( 4 );
			if ( ! empty( $sample_ids ) ) {
				$wp_query_args = array( 'post_type' => 'product', 'post_status' => 'publish', 'posts_per_page' => 4, 'post__in' => $sample_ids, 'orderby' => 'post__in', 'no_found_rows' => true );
				global $wp_query;
				$wp_query = new WP_Query( $wp_query_args );
				$wp_query->is_post_type_archive = true; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				while ( $wp_query->have_posts() ) {
					$wp_query->the_post();
					wc_setup_product_data( get_post() );
				}
				wp_reset_postdata();
			}
		}

		$registry = XCOPB_Block_Registry::instance();
		$registry->register_defaults();
		$classes = 'xsb-preview-canvas' . ( $structure ? ' xsb-structure-' . $structure : '' );
		$output = '<div class="' . esc_attr( $classes ) . '" data-xsb-structure="' . esc_attr( $structure ) . '">';
		$open_zone = '';
		foreach ( $layout as $index => $block ) {
			$block_zone = isset( $zones[ $index ] ) ? $zones[ $index ] : '';
			if ( $structure && $block_zone && $block_zone !== $open_zone ) {
				if ( $open_zone ) { $output .= '</div>'; }
				$output .= '<div class="xsb-structure-zone" data-zone="' . esc_attr( $block_zone ) . '">';
				$open_zone = $block_zone;
			} elseif ( ! $structure || ! $block_zone ) {
				if ( $open_zone ) { $output .= '</div>'; $open_zone = ''; }
			}
			$html = $registry->render_block( $block['type'], $block, $context );
			if ( $html ) { $output .= $html; }
		}
		if ( $open_zone ) { $output .= '</div>'; }
		$output .= '</div>';

		nocache_headers();
		header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
		wp_enqueue_style( 'xcopb-public', XCOPB_PLUGIN_URL . 'assets/public/xpb-styles.css', array(), XCOPB_VERSION );
		wp_enqueue_style( 'xcosb-preview', XCOPB_PLUGIN_URL . 'assets/admin/preview.css', array( 'xcopb-public' ), XCOPB_VERSION );
		echo '<!DOCTYPE html><html><head><title>' . esc_html__( 'Preview', 'xcodesol-page-builder' ) . '</title>';
		wp_print_styles();
		echo '</head><body>' . wp_kses( $output, XCOPB_Block_Registry::allowed_output_html() ) . '</body></html>';
		exit;
	}

	private static function get_sample_product() {
		$ids = get_posts( array( 'post_type' => 'product', 'post_status' => 'publish', 'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true ) );
		$product = empty( $ids ) ? null : wc_get_product( $ids[0] );
		return $product instanceof WC_Product ? $product : null;
	}

	private static function get_sample_product_ids( $count ) {
		$ids = get_posts( array( 'post_type' => 'product', 'post_status' => 'publish', 'fields' => 'ids', 'numberposts' => absint( $count ) ) );
		return is_array( $ids ) ? array_map( 'absint', $ids ) : array();
	}
}
// Backward-compatibility class alias.
class_alias( 'XCOPB_Preview', 'XCOSB_Preview' );
