<?php
/**
 * Block: Dynamic Post Navigation (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$prev_post = get_previous_post();
$next_post = get_next_post();

$prev_label = ! empty( $settings['prev_label'] ) ? $settings['prev_label'] : __( 'Previous Post', 'xcodesol-page-builder' );
$next_label = ! empty( $settings['next_label'] ) ? $settings['next_label'] : __( 'Next Post', 'xcodesol-page-builder' );

?>
<nav class="xcopb-post-navigation xcopb-widget" style="display:flex;justify-content:space-between;align-items:center;padding:20px 0;margin:30px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;width:100%;">
	<div class="xcopb-nav-prev" style="text-align:left;">
		<?php if ( ! empty( $prev_post ) ) : ?>
			<span style="font-size:12px;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:4px;">&larr; <?php echo esc_html( $prev_label ); ?></span>
			<a href="<?php echo esc_url( get_permalink( $prev_post->ID ) ); ?>" style="font-size:15px;font-weight:600;color:#2563eb;text-decoration:none;">
				<?php echo esc_html( get_the_title( $prev_post->ID ) ); ?>
			</a>
		<?php else : ?>
			<span style="font-size:12px;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:4px;">&larr; <?php echo esc_html( $prev_label ); ?></span>
			<span style="font-size:15px;color:#94a3b8;"><?php esc_html_e( 'No previous post', 'xcodesol-page-builder' ); ?></span>
		<?php endif; ?>
	</div>
	<div class="xcopb-nav-next" style="text-align:right;">
		<?php if ( ! empty( $next_post ) ) : ?>
			<span style="font-size:12px;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:4px;"><?php echo esc_html( $next_label ); ?> &rarr;</span>
			<a href="<?php echo esc_url( get_permalink( $next_post->ID ) ); ?>" style="font-size:15px;font-weight:600;color:#2563eb;text-decoration:none;">
				<?php echo esc_html( get_the_title( $next_post->ID ) ); ?>
			</a>
		<?php else : ?>
			<span style="font-size:12px;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:4px;"><?php echo esc_html( $next_label ); ?> &rarr;</span>
			<span style="font-size:15px;color:#94a3b8;"><?php esc_html_e( 'No next post', 'xcodesol-page-builder' ); ?></span>
		<?php endif; ?>
	</div>
</nav>
