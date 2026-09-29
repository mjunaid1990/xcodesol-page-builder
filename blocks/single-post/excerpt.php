<?php
/**
 * Block: Dynamic Post Excerpt (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$post_id = get_the_ID();
if ( empty( $post_id ) && isset( $context['post_id'] ) ) {
	$post_id = absint( $context['post_id'] );
}

$excerpt = get_the_excerpt( $post_id );
if ( empty( $excerpt ) ) {
	$excerpt = __( 'Sample post excerpt text shown when previewing or designing your post layout.', 'xcodesol-page-builder' );
}

$align       = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$color       = ! empty( $settings['color'] ) ? $settings['color'] : '#475569';
$font_size   = isset( $settings['font_size'] ) && '' !== $settings['font_size'] ? $settings['font_size'] : '16';
$line_height = isset( $settings['line_height'] ) && '' !== $settings['line_height'] ? $settings['line_height'] : '1.6';

$styles = array(
	'color:' . esc_attr( $color ),
	'text-align:' . esc_attr( $align ),
	'font-size:' . ( is_numeric( $font_size ) ? $font_size . 'px' : esc_attr( $font_size ) ),
	'line-height:' . esc_attr( $line_height ),
);

foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$style_attr = ! empty( $styles ) ? ' style="' . implode( ';', $styles ) . ';"' : '';

?>
<div class="xcopb-post-excerpt xcopb-widget"<?php echo $style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<p><?php echo esc_html( $excerpt ); ?></p>
</div>
