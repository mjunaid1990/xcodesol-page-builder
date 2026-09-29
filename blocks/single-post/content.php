<?php
/**
 * Block: Dynamic Post Content (Elementor-style).
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();

$align = ! empty( $settings['align'] ) ? $settings['align'] : '';
$color = ! empty( $settings['color'] ) ? $settings['color'] : '';

$styles = array();
if ( '' !== $color ) {
	$styles[] = 'color:' . esc_attr( $color );
}
if ( '' !== $align ) {
	$styles[] = 'text-align:' . esc_attr( $align );
}

foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
	$k = 'margin_' . $side;
	if ( isset( $settings[ $k ] ) && '' !== $settings[ $k ] ) {
		$styles[] = 'margin-' . $side . ':' . (float) $settings[ $k ] . 'px';
	}
}

$style_attr = ! empty( $styles ) ? ' style="' . implode( ';', $styles ) . ';"' : '';

?>
<div class="xcopb-post-content xcopb-widget entry-content"<?php echo $style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php
	// Prevent infinite loops if the template renderer is hooked into the_content
	static $rendering = false;
	if ( ! $rendering ) {
		$rendering = true;
		the_content();
		$rendering = false;
	}
	?>
</div>
