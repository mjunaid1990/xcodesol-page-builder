<?php
/**
 * Template Name: Page Builder Editor Frame
 *
 * Full-screen visual builder interface mounted directly on the frontend URL.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

?><!doctype html>
<html <?php language_attributes(); ?> class="xcopb-builder-html">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title><?php echo esc_html( sprintf( __( 'Editing: %s — Xcodesol Page Builder', 'xcodesol-page-builder' ), get_the_title() ) ); ?></title>
	<?php wp_head(); ?>
</head>
<body class="xcopb-builder-frame">
<?php
if ( function_exists( 'wp_body_open' ) ) {
	wp_body_open();
}
?>
<div id="xcopb-builder-root"></div>
<?php wp_footer(); ?>
</body>
</html>
