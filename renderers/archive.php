<?php
/**
 * Renderer for Archive template view.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$template_id = XCOPB_Template_Loader::get_selected_template_id();
$context     = XCOPB_Template_Loader::get_context();

XCOPB_Template_Loader::print_header();
?>
<main id="xcopb-content" class="xcopb-main xcopb-full-width-content xcopb-archive-content xcopb-template-full-width" role="main">
	<?php
	if ( $template_id ) {
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
XCOPB_Template_Loader::print_footer();
