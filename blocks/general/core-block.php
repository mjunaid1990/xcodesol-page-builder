<?php
/**
 * Render a native WordPress core block stored by the visual builder.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) && is_array( $block['settings'] ) ? $block['settings'] : array();
$block_name = isset( $settings['core_block_name'] ) ? sanitize_text_field( $settings['core_block_name'] ) : '';
$markup = isset( $settings['core_markup'] ) ? (string) $settings['core_markup'] : '';

if ( 0 !== strpos( $block_name, 'core/' ) || ! class_exists( 'WP_Block_Type_Registry' ) || ! WP_Block_Type_Registry::get_instance()->is_registered( $block_name ) || '' === trim( $markup ) ) {
	return;
}

$rendered = do_blocks( $markup );
echo wp_kses( $rendered, XCOPB_Block_Registry::allowed_output_html() );
