<?php
/**
 * Block: Dynamic Post Author Box (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$author_id = get_the_author_meta( 'ID' );
if ( empty( $author_id ) && isset( $context['post_id'] ) ) {
	$post = get_post( $context['post_id'] );
	if ( $post ) {
		$author_id = $post->post_author;
	}
}

$author_name = get_the_author_meta( 'display_name', $author_id );
$author_desc = get_the_author_meta( 'description', $author_id );
$author_url  = get_author_posts_url( $author_id );

if ( empty( $author_name ) ) {
	$author_name = __( 'Author Name', 'xcodesol-page-builder' );
}
if ( empty( $author_desc ) ) {
	$author_desc = __( 'Short biography of the author highlighting their expertise and background.', 'xcodesol-page-builder' );
}

$avatar = get_avatar( $author_id, 80, '', '', array( 'class' => 'xcopb-author-avatar' ) );

$border_radius = isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 8;

?>
<div class="xcopb-author-box xcopb-widget" style="display:flex;gap:20px;align-items:flex-start;padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:<?php echo $border_radius; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>px;box-sizing:border-box;margin:24px 0;">
	<div class="xcopb-author-avatar-wrap" style="flex-shrink:0;">
		<?php echo $avatar; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<div class="xcopb-author-info">
		<h4 class="xcopb-author-name" style="margin:0 0 8px;font-size:18px;">
			<a href="<?php echo esc_url( $author_url ); ?>" style="color:inherit;text-decoration:none;">
				<?php echo esc_html( $author_name ); ?>
			</a>
		</h4>
		<p class="xcopb-author-bio" style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">
			<?php echo esc_html( $author_desc ); ?>
		</p>
	</div>
</div>
