<?php
/**
 * Template Name: Page Builder Canvas
 *
 * Blank canvas template for Xcodesol Page Builder without theme header or footer.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'XCOPB_IN_TEMPLATE_RENDERER' ) ) {
	define( 'XCOPB_IN_TEMPLATE_RENDERER', true );
}

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<?php if ( ! current_theme_supports( 'title-tag' ) ) : ?>
		<title><?php echo esc_html( wp_get_document_title() ); ?></title>
	<?php endif; ?>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'xcopb-canvas xcopb-template-full-width xcopb-full-width' ); ?>>
<?php
if ( function_exists( 'wp_body_open' ) ) {
	wp_body_open();
}
?>
<div class="xcopb-canvas-wrapper xcopb-full-width">
	<?php
	$template_id = class_exists( 'XCOPB_Template_Loader' ) ? XCOPB_Template_Loader::get_selected_template_id() : null;

	if ( $template_id ) {
		$context = XCOPB_Template_Loader::get_context();
		echo wp_kses( XCOPB_Renderer::instance()->render( $template_id, $context ), XCOPB_Block_Registry::allowed_output_html() );
	} elseif ( have_posts() ) {
		while ( have_posts() ) {
			the_post();
			the_content();
		}
	}
	?>
</div>
<?php wp_footer(); ?>
</body>
</html>
