<?php
/**
 * Template Name: Page Builder Full Width
 *
 * Full-width template with theme header and footer for Xcodesol Page Builder.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'XCOPB_IN_TEMPLATE_RENDERER' ) ) {
	define( 'XCOPB_IN_TEMPLATE_RENDERER', true );
}

get_header();
?>
<main id="xcopb-content" class="xcopb-main xcopb-full-width-content xcopb-template-full-width" role="main">
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
</main>
<?php
get_footer();
