<?php
/**
 * Block: Dynamic Post Meta (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$post_id = get_the_ID();
if ( empty( $post_id ) && isset( $context['post_id'] ) ) {
	$post_id = absint( $context['post_id'] );
}

$show_author     = ! isset( $settings['show_author'] ) || ! empty( $settings['show_author'] );
$show_date       = ! isset( $settings['show_date'] ) || ! empty( $settings['show_date'] );
$show_comments   = ! isset( $settings['show_comments'] ) || ! empty( $settings['show_comments'] );
$show_categories = ! isset( $settings['show_categories'] ) || ! empty( $settings['show_categories'] );
$align           = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$color           = ! empty( $settings['color'] ) ? $settings['color'] : '#64748b';

$wrap_styles = array(
	'display:flex',
	'flex-wrap:wrap',
	'align-items:center',
	'gap:16px',
	'color:' . esc_attr( $color ),
	'font-size:13px',
	'line-height:1.4',
);

if ( 'center' === $align ) {
	$wrap_styles[] = 'justify-content:center';
} elseif ( 'right' === $align ) {
	$wrap_styles[] = 'justify-content:flex-end';
}

foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$wrap_styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$style_attr = ' style="' . implode( ';', $wrap_styles ) . ';"';

?>
<div class="xcopb-post-meta xcopb-widget"<?php echo $style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( $show_author ) : ?>
		<span class="xcopb-meta-item xcopb-meta-author" style="display:inline-flex;align-items:center;gap:6px;">
			<span class="dashicons dashicons-admin-users" style="font-size:16px;width:16px;height:16px;" aria-hidden="true"></span>
			<span><?php the_author_posts_link(); ?></span>
		</span>
	<?php endif; ?>

	<?php if ( $show_date ) : ?>
		<span class="xcopb-meta-item xcopb-meta-date" style="display:inline-flex;align-items:center;gap:6px;">
			<span class="dashicons dashicons-calendar-alt" style="font-size:16px;width:16px;height:16px;" aria-hidden="true"></span>
			<span><?php echo esc_html( get_the_date( '', $post_id ) ); ?></span>
		</span>
	<?php endif; ?>

	<?php if ( $show_comments && comments_open( $post_id ) ) : ?>
		<span class="xcopb-meta-item xcopb-meta-comments" style="display:inline-flex;align-items:center;gap:6px;">
			<span class="dashicons dashicons-admin-comments" style="font-size:16px;width:16px;height:16px;" aria-hidden="true"></span>
			<span><?php comments_number( __( 'No Comments', 'xcodesol-page-builder' ), __( '1 Comment', 'xcodesol-page-builder' ), __( '% Comments', 'xcodesol-page-builder' ) ); ?></span>
		</span>
	<?php endif; ?>

	<?php if ( $show_categories && has_category( '', $post_id ) ) : ?>
		<span class="xcopb-meta-item xcopb-meta-categories" style="display:inline-flex;align-items:center;gap:6px;">
			<span class="dashicons dashicons-category" style="font-size:16px;width:16px;height:16px;" aria-hidden="true"></span>
			<span><?php the_category( ', ', '', $post_id ); ?></span>
		</span>
	<?php endif; ?>
</div>
