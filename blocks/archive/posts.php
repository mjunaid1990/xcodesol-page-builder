<?php
/**
 * Block: Dynamic Archive Posts Grid (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$columns        = isset( $settings['columns'] ) ? absint( $settings['columns'] ) : 3;
if ( $columns < 1 || $columns > 6 ) {
	$columns = 3;
}

$show_image     = ! isset( $settings['show_image'] ) || ! empty( $settings['show_image'] );
$show_meta      = ! isset( $settings['show_meta'] ) || ! empty( $settings['show_meta'] );
$show_excerpt   = ! isset( $settings['show_excerpt'] ) || ! empty( $settings['show_excerpt'] );
$show_button    = ! isset( $settings['show_button'] ) || ! empty( $settings['show_button'] );
$button_text    = ! empty( $settings['button_text'] ) ? $settings['button_text'] : __( 'Read More', 'xcodesol-page-builder' );
$gap            = isset( $settings['gap'] ) ? absint( $settings['gap'] ) : 24;

$grid_style = sprintf(
	'display:grid;grid-template-columns:repeat(%d, minmax(0, 1fr));gap:%dpx;margin:24px 0;',
	$columns,
	$gap
);

?>
<div class="xcopb-archive-posts-widget xcopb-widget">
	<?php if ( have_posts() ) : ?>
		<div class="xcopb-posts-grid" style="<?php echo esc_attr( $grid_style ); ?>">
			<?php
			while ( have_posts() ) :
				the_post();
				$post_id   = get_the_ID();
				$permalink = get_permalink();
				?>
				<article id="post-<?php the_ID(); ?>" <?php post_class( 'xcopb-post-card' ); ?> style="background:#ffffff;border:0;border-radius:0;overflow:hidden;display:flex;flex-direction:column;">
					<?php if ( $show_image && has_post_thumbnail() ) : ?>
						<div class="xcopb-post-card-thumb" style="aspect-ratio:16/9;overflow:hidden;background:#f1f5f9;">
							<a href="<?php echo esc_url( $permalink ); ?>" style="display:block;width:100%;height:100%;">
								<?php the_post_thumbnail( 'medium_large', array( 'style' => 'width:100%;height:100%;object-fit:cover;display:block;' ) ); ?>
							</a>
						</div>
					<?php endif; ?>

					<div class="xcopb-post-card-body" style="padding:20px;flex-grow:1;display:flex;flex-direction:column;">
						<?php if ( $show_meta ) : ?>
							<div class="xcopb-post-card-meta" style="font-size:12px;color:#64748b;margin-bottom:8px;display:flex;gap:12px;align-items:center;">
								<span><?php echo esc_html( get_the_date() ); ?></span>
								<span>&bull;</span>
								<span><?php the_author(); ?></span>
							</div>
						<?php endif; ?>

						<h3 class="xcopb-post-card-title" style="margin:0 0 10px;font-size:18px;line-height:1.4;">
							<a href="<?php echo esc_url( $permalink ); ?>" style="color:#0f172a;text-decoration:none;">
								<?php the_title(); ?>
							</a>
						</h3>

						<?php if ( $show_excerpt ) : ?>
							<div class="xcopb-post-card-excerpt" style="font-size:14px;color:#475569;line-height:1.5;margin-bottom:16px;flex-grow:1;">
								<?php the_excerpt(); ?>
							</div>
						<?php endif; ?>

						<?php if ( $show_button ) : ?>
							<div class="xcopb-post-card-action" style="margin-top:auto;">
								<a href="<?php echo esc_url( $permalink ); ?>" style="display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;color:#2563eb;text-decoration:none;">
									<span><?php echo esc_html( $button_text ); ?></span>
									<span>&rarr;</span>
								</a>
							</div>
						<?php endif; ?>
					</div>
				</article>
			<?php endwhile; ?>
		</div>

		<div class="xcopb-posts-pagination" style="margin:30px 0;text-align:center;">
			<?php
			echo paginate_links( array( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				'prev_text' => '&larr; ' . __( 'Previous', 'xcodesol-page-builder' ),
				'next_text' => __( 'Next', 'xcodesol-page-builder' ) . ' &rarr;',
				'type'      => 'list',
			) );
			?>
		</div>
	<?php else : ?>
		<p style="padding:40px 0;text-align:center;color:#64748b;font-size:16px;">
			<?php esc_html_e( 'No posts found in this archive.', 'xcodesol-page-builder' ); ?>
		</p>
	<?php endif; ?>
</div>
