<?php
/**
 * Block: Dynamic Post Comments (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$post_id = get_the_ID();
if ( empty( $post_id ) && isset( $context['post_id'] ) ) {
	$post_id = absint( $context['post_id'] );
}

?>
<div class="xcopb-post-comments xcopb-widget" style="width:100%;margin:30px 0;">
	<?php
	if ( comments_open( $post_id ) || get_comments_number( $post_id ) ) {
		comments_template();
	} else {
		?>
		<p style="color:#94a3b8;font-style:italic;"><?php esc_html_e( 'Comments are closed.', 'xcodesol-page-builder' ); ?></p>
		<?php
	}
	?>
</div>
