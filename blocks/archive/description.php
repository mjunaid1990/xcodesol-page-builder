<?php
/**
 * Block: Dynamic Archive Description (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$desc = get_the_archive_description();
if ( empty( $desc ) ) {
	return;
}

$align = ! empty( $settings['align'] ) ? $settings['align'] : 'left';
$color = ! empty( $settings['color'] ) ? $settings['color'] : '#64748b';

$styles = array(
	'color:' . esc_attr( $color ),
	'text-align:' . esc_attr( $align ),
	'font-size:15px',
	'line-height:1.6',
	'margin:10px 0 24px',
);

$style_attr = ' style="' . implode( ';', $styles ) . ';"';

?>
<div class="xcopb-archive-description xcopb-widget"<?php echo $style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php echo wp_kses_post( $desc ); ?>
</div>
