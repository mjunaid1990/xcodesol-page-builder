<?php
/**
 * Block: Dynamic Post Featured Image (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$post_id = get_the_ID();
if ( empty( $post_id ) && isset( $context['post_id'] ) ) {
	$post_id = absint( $context['post_id'] );
}

$has_thumbnail = $post_id && has_post_thumbnail( $post_id );
$size          = ! empty( $settings['size'] ) ? $settings['size'] : 'full';
$align         = ! empty( $settings['align'] ) ? $settings['align'] : 'center';
$border_radius = isset( $settings['border_radius'] ) ? absint( $settings['border_radius'] ) : 0;
$link_to_post  = ! empty( $settings['link_to_post'] );

$wrap_styles = array(
	'text-align:' . esc_attr( $align ),
	'width:100%',
);

foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$wrap_styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$img_styles = array(
	'max-width:100%',
	'height:auto',
	'display:inline-block',
	'border-radius:' . $border_radius . 'px',
);

$wrap_attr = ' style="' . implode( ';', $wrap_styles ) . ';"';
$img_style = implode( ';', $img_styles );

?>
<div class="xcopb-post-featured-image-wrapper xcopb-widget"<?php echo $wrap_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php
	if ( $has_thumbnail ) {
		$img_html = get_the_post_thumbnail( $post_id, $size, array( 'style' => $img_style, 'class' => 'xcopb-featured-image' ) );
		if ( $link_to_post ) {
			echo '<a href="' . esc_url( get_permalink( $post_id ) ) . '">' . $img_html . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		} else {
			echo $img_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
	} else {
		?>
		<div class="xcopb-image-placeholder" style="<?php echo esc_attr( $img_style ); ?>;background:#f1f5f9;border:1px dashed #cbd5e1;padding:60px 20px;text-align:center;color:#94a3b8;width:100%;box-sizing:border-box;">
			<span class="dashicons dashicons-format-image" style="font-size:48px;width:48px;height:48px;" aria-hidden="true"></span>
			<p style="margin:10px 0 0;font-size:14px;"><?php esc_html_e( 'No featured image set', 'xcodesol-page-builder' ); ?></p>
		</div>
		<?php
	}
	?>
</div>
