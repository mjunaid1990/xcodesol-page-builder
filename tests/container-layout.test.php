<?php
/**
 * Standalone structural test for the Container layout modes.
 *
 * Covers the three moving parts of the feature:
 *   1. includes/class-xcopb-sanitizer.php  — per-control sanitizers
 *   2. includes/class-xcopb-migrator.php   — legacy layout → explicit mode
 *   3. blocks/general/container.php        — the six rendered modes
 *
 * Run: php tests/container-layout.test.php
 *
 * @package WooCommerce_Template_Builder
 */

define( 'ABSPATH', 'standalone' );

// ---------------------------------------------------------------------------
// Minimal WordPress shims so the pure-PHP parts run standalone.
// ---------------------------------------------------------------------------
if ( ! function_exists( 'absint' ) ) {
	function absint( $value ) { // phpcs:ignore
		return abs( (int) $value );
	}
}
if ( ! function_exists( 'esc_attr' ) ) {
	function esc_attr( $value ) { // phpcs:ignore
		return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8', false );
	}
}
if ( ! function_exists( 'esc_url' ) ) {
	function esc_url( $value ) { // phpcs:ignore
		return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8', false );
	}
}
if ( ! function_exists( 'esc_url_raw' ) ) {
	function esc_url_raw( $value ) { // phpcs:ignore
		return trim( (string) $value );
	}
}
if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $value ) { // phpcs:ignore
		return is_string( $value ) ? trim( strip_tags( $value ) ) : $value;
	}
}
if ( ! function_exists( 'wp_strip_all_tags' ) ) {
	function wp_strip_all_tags( $value ) { // phpcs:ignore
		return is_string( $value ) ? strip_tags( $value ) : $value;
	}
}
if ( ! function_exists( 'sanitize_html_class' ) ) {
	function sanitize_html_class( $value ) { // phpcs:ignore
		return preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $value );
	}
}
if ( ! function_exists( 'wp_json_encode' ) ) {
	function wp_json_encode( $value ) { // phpcs:ignore
		return json_encode( $value );
	}
}
if ( ! function_exists( 'wp_kses' ) ) {
	function wp_kses( $html, $allowed ) { // phpcs:ignore
		return $html;
	}
}

/**
 * Registry stub: records the nested blocks the container asked to render so
 * the test can assert on the composition without loading the real registry.
 */
class XCOPB_Block_Registry {

	public $rendered = array();

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function render_block( $type, $block, $context = array() ) {
		$this->rendered[] = $type;
		$text = isset( $block['settings']['text'] ) ? $block['settings']['text'] : $type;
		return '<span data-nested="' . $type . '">' . $text . '</span>';
	}

	public static function allowed_output_html() {
		return array();
	}
}

require_once __DIR__ . '/../includes/class-xcopb-sanitizer.php';
require_once __DIR__ . '/../includes/class-xcopb-migrator.php';

$GLOBALS['xsb_pass'] = 0;
$GLOBALS['xsb_fail'] = 0;

/**
 * Assert helper.
 */
function xsb_assert( $label, $condition, $detail = '' ) {
	if ( $condition ) {
		$GLOBALS['xsb_pass']++;
		echo "PASS - {$label}\n";
		return;
	}
	$GLOBALS['xsb_fail']++;
	echo "FAIL - {$label}" . ( '' !== $detail ? " ({$detail})" : '' ) . "\n";
}

/**
 * Assert that a haystack contains every needle.
 */
function xsb_assert_contains( $label, $haystack, $needles ) {
	$missing = array();
	foreach ( (array) $needles as $needle ) {
		if ( false === strpos( $haystack, $needle ) ) {
			$missing[] = $needle;
		}
	}
	xsb_assert( $label, empty( $missing ), $missing ? 'missing: ' . implode( ' | ', $missing ) : '' );
}

/**
 * Assert that a haystack contains none of the needles.
 */
function xsb_assert_missing( $label, $haystack, $needles ) {
	$present = array();
	foreach ( (array) $needles as $needle ) {
		if ( false !== strpos( $haystack, $needle ) ) {
			$present[] = $needle;
		}
	}
	xsb_assert( $label, empty( $present ), $present ? 'unexpected: ' . implode( ' | ', $present ) : '' );
}

/**
 * Render one container block through the real block template.
 *
 * @param array $settings Container settings.
 * @param array $inner    Nested columns (array of arrays of block docs).
 * @return string HTML.
 */
function xsb_render_container( $settings, $inner = array() ) {
	$block   = array(
		'type'     => 'xcosb/gb-container',
		'settings' => $settings,
		'inner'    => $inner,
	);
	$context = array();

	ob_start();
	include __DIR__ . '/../blocks/general/container.php';
	return ob_get_clean();
}

/**
 * Pull the inline style attribute off the container root.
 */
function xsb_root_style( $html ) {
	if ( preg_match( '/class="xsb-container[^"]*"[^>]*style="([^"]*)"/', $html, $m ) ) {
		return $m[1];
	}
	return '';
}

/**
 * All <style> block contents.
 */
function xsb_style_blocks( $html ) {
	if ( preg_match_all( '#<style>(.*?)</style>#s', $html, $m ) ) {
		return implode( "\n", $m[1] );
	}
	return '';
}

/**
 * The inner flow wrapper markup.
 */
function xsb_flow_wrapper( $html ) {
	if ( preg_match( '#<div class="xsb-container-flow[^"]*"[^>]*>#', $html, $m ) ) {
		return $m[0];
	}
	return '';
}

$child  = array( 'type' => 'xcosb/gb-heading', 'settings' => array( 'text' => 'One' ) );
$child2 = array( 'type' => 'xcosb/gb-heading', 'settings' => array( 'text' => 'Two' ) );

echo "== sanitizer: container values ==\n";

xsb_assert( 'layout mode allowlisted', 'masonry' === XCOPB_Sanitizer::sanitize_container_value( 'layout_mode', 'masonry' ) );
xsb_assert( 'unknown layout mode rejected', null === XCOPB_Sanitizer::sanitize_container_value( 'layout_mode', 'nope' ) );
xsb_assert( 'device variant clamped to base range', 6.0 === XCOPB_Sanitizer::sanitize_container_value( 'tablet_columns', 99 ) );
xsb_assert( 'device variant keeps valid mode', 'grid' === XCOPB_Sanitizer::sanitize_container_value( 'mobile_layout_mode', 'grid' ) );
xsb_assert( 'state variant validates colour', '#ff0000' === XCOPB_Sanitizer::sanitize_container_value( 'hover_bg_color', '#ff0000' ) );
xsb_assert( 'state variant rejects injected colour', '' === XCOPB_Sanitizer::sanitize_container_value( 'hover_bg_color', 'red; } body { display:none' ) );
xsb_assert( 'dimension object normalized', array( 'value' => 24.0, 'unit' => 'px' ) === XCOPB_Sanitizer::sanitize_container_value( 'scroll_item_width', array( 'value' => '24', 'unit' => 'px' ) ) );
xsb_assert( 'dimension unit allowlisted', 'px' === XCOPB_Sanitizer::sanitize_container_value( 'masonry_gap', array( 'value' => 10, 'unit' => 'url(' ) )['unit'] );
xsb_assert( 'booleans cast', true === XCOPB_Sanitizer::sanitize_container_value( 'equal_height', 1 ) );
xsb_assert( 'unknown enum value dropped', null === XCOPB_Sanitizer::sanitize_container_value( 'masonry_item_break', 'bogus' ) );
xsb_assert( 'css fragments stripped of rule separators', '' === XCOPB_Sanitizer::sanitize_css_fragment( '1fr; } body { color:red' ) );
xsb_assert( 'track templates survive', 'repeat(auto-fit, minmax(240px, 1fr))' === XCOPB_Sanitizer::sanitize_container_value( 'grid_template', array( 'columns' => 'repeat(auto-fit, minmax(240px, 1fr))' ) )['columns'] );
xsb_assert( 'named areas keep quotes', '"head head" "side main"' === XCOPB_Sanitizer::sanitize_container_value( 'grid_named_areas', '"head head" "side main"' ) );
xsb_assert(
	'full map sanitizes variants',
	6.0 === XCOPB_Sanitizer::sanitize_container_settings( array( 'layout_mode' => 'columns', 'tablet_columns' => 42 ) )['tablet_columns']
);
$saved_background = XCOPB_Sanitizer::sanitize_container_settings(
	array(
		'bg_type'            => 'image',
		'bg_image'           => array( 'url' => 'https://example.test/hero.jpg', 'id' => 42, 'unsafe' => 'ignored' ),
		'bg_size'            => 'custom',
		'bg_size_custom'     => '480px auto',
		'bg_position'        => 'custom',
		'bg_position_custom' => '25% 40%',
		'bg_repeat'          => 'round',
		'bg_attachment'      => 'fixed',
		'overlay_color'      => 'rgba(20, 30, 40, 0.6)',
		'overlay_opacity'    => 65,
		'overlay_blend_mode' => 'multiply',
	)
);
xsb_assert( 'image background URL and media ID persist', array( 'url' => 'https://example.test/hero.jpg', 'id' => 42 ) === $saved_background['bg_image'] );
xsb_assert( 'custom image fit and position persist', '480px auto' === $saved_background['bg_size_custom'] && '25% 40%' === $saved_background['bg_position_custom'] );
xsb_assert( 'overlay color supports rgba and opacity persists', 'rgba(20, 30, 40, 0.6)' === $saved_background['overlay_color'] && 65.0 === $saved_background['overlay_opacity'] );
xsb_assert( 'background attachment, repeat and blend mode persist', 'fixed' === $saved_background['bg_attachment'] && 'round' === $saved_background['bg_repeat'] && 'multiply' === $saved_background['overlay_blend_mode'] );

echo "\n== migrator: legacy layouts gain an explicit mode ==\n";

$migrator = new ReflectionClass( 'XCOPB_Migrator' );
$map      = $migrator->getMethod( 'map_container_settings' );
$map->setAccessible( true );

$legacy_grid = $map->invoke( null, array( 'layout_type' => 'grid', 'grid_columns_count' => 4, 'grid_gap' => array( 'row' => 10, 'col' => 10 ) ) );
xsb_assert( 'legacy grid container → grid mode', 'grid' === $legacy_grid['layout_mode'] );
xsb_assert( 'legacy grid count → template', 'repeat(4, minmax(0, 1fr))' === $legacy_grid['grid_template']['columns'] );
xsb_assert( 'legacy grid gap untouched', 10 === (int) $legacy_grid['grid_gap']['row'] );

$legacy_flex = $map->invoke( null, array( 'layout_type' => 'flex', 'columns' => 2 ) );
xsb_assert( 'legacy flex container → columns mode', 'columns' === $legacy_flex['layout_mode'] );
xsb_assert( 'legacy container keeps its settings', 2 === (int) $legacy_flex['columns'] );

$already = $map->invoke( null, array( 'layout_mode' => 'masonry', 'layout_type' => 'flex' ) );
xsb_assert( 'migration is idempotent', 'masonry' === $already['layout_mode'] );

$doc = $migrator->getMethod( 'map_container_layouts' );
$doc->setAccessible( true );
$migrated_doc = $doc->invoke(
	null,
	array(
		array(
			'type'     => 'xcosb/gb-container',
			'settings' => array( 'layout_type' => 'flex' ),
			'inner'    => array(
				array(
					array(
						'type'     => 'xcosb/gb-container',
						'settings' => array( 'layout_type' => 'grid', 'grid_columns_count' => 3 ),
						'inner'    => array(),
					),
				),
			),
		),
	)
);
xsb_assert( 'nested containers migrated too', 'columns' === $migrated_doc[0]['settings']['layout_mode'] );
xsb_assert( 'deepest container migrated', 'grid' === $migrated_doc[0]['inner'][0][0]['settings']['layout_mode'] );

echo "\n== renderer: legacy columns output is unchanged ==\n";

$legacy = xsb_render_container(
	array(
		'columns'        => 2,
		'layout_type'    => 'flex',
		'column_widths'  => array( 6, 6 ),
		'gap'            => 20,
		'padding'        => 20,
		'column_styles'  => array( array( 'background' => '#ffffff' ) ),
	),
	array( array( $child ), array( $child2 ) )
);
$legacy_style = xsb_root_style( $legacy );
xsb_assert_contains( 'legacy grid template emitted', $legacy_style, array( 'grid-template-columns:repeat(12, minmax(0, 1fr))', 'display:grid' ) );
xsb_assert_contains( 'legacy column spans emitted', $legacy, array( 'grid-column:1 / span 6', 'grid-column:7 / span 6' ) );
xsb_assert_contains( 'legacy padding kept', $legacy_style, array( 'padding:20px 20px 20px 20px', 'border-radius:8px' ) );
xsb_assert_missing( 'legacy markup has no flow wrapper', $legacy, array( 'xsb-container-flow' ) );
xsb_assert_contains( 'legacy children render', $legacy, array( 'data-nested="xcosb/gb-heading"' ) );
xsb_assert( 'legacy emits no scoped stylesheet', '' === xsb_style_blocks( $legacy ), xsb_style_blocks( $legacy ) );

echo "\n== renderer: list mode (flex column) ==\n";

$list = xsb_render_container(
	array(
		'layout_mode'    => 'list',
		'gap'            => array( 'row' => 12, 'col' => 8, 'unit' => 'px' ),
		'justify_content' => 'center',
		'align_items'    => 'center',
		'equal_height'   => true,
	),
	array( array( $child ), array( $child2 ) )
);
$list_flow = xsb_flow_wrapper( $list );
xsb_assert_contains( 'flow wrapper carries the mode class', $list_flow, array( 'xsb-container-flow--list' ) );
xsb_assert_contains( 'flex stack declared', $list, array( 'display:flex', 'flex-direction:column', 'row-gap:12px', 'column-gap:8px', 'justify-content:center', 'align-items:stretch' ) );
xsb_assert( 'children wrapped as layout items', 2 === substr_count( $list, 'class="xsb-container-item"' ), substr_count( $list, 'class="xsb-container-item"' ) );

echo "\n== renderer: row mode shares width evenly ==\n";

$row = xsb_render_container(
	array(
		'layout_mode' => 'row',
		'gap'         => 16,
	),
	array( array( $child ), array( $child2 ) )
);
xsb_assert_contains( 'row mode uses the horizontal flex layout', $row, array( 'xsb-container-flow--row', 'display:flex', 'flex-direction:row' ) );
xsb_assert( 'unsized row items each grow from a zero basis', 2 === substr_count( $row, 'flex:1 1 0%' ), substr_count( $row, 'flex:1 1 0%' ) );
xsb_assert( 'row items can shrink evenly without overflowing', 2 === substr_count( $row, 'min-width:0' ), substr_count( $row, 'min-width:0' ) );

$row_custom_sizing = xsb_render_container(
	array( 'layout_mode' => 'row' ),
	array(
		array(
			array( 'type' => 'xcosb/gb-heading', 'settings' => array( 'text' => 'Fixed', 'flex_grow' => 0 ) ),
		),
	)
);
xsb_assert_contains( 'explicit row flex sizing overrides equal-width defaults', $row_custom_sizing, array( 'flex-grow:0' ) );
xsb_assert_missing( 'explicit row sizing does not also get equal-width flex', $row_custom_sizing, array( 'flex:1 1 0%' ) );

echo "\n== renderer: grid mode ==\n";

$grid = xsb_render_container(
	array(
		'layout_mode'   => 'grid',
		'grid_template' => array(
			'columns'   => 'repeat(auto-fit, minmax(240px, 1fr))',
			'rows'      => '120px',
			'auto_flow' => 'row dense',
			'auto_rows' => '140px',
		),
		'grid_justify_items' => 'center',
		'grid_align_items'   => 'end',
	),
	array(
		array(
			array( 'type' => 'xcosb/gb-heading', 'settings' => array( 'text' => 'A', 'grid_column_span' => 2, 'grid_row_span' => 2 ) ),
		),
	)
);
xsb_assert_contains(
	'grid tracks and flow emitted',
	$grid,
	array(
		'grid-template-columns:repeat(auto-fit, minmax(240px, 1fr))',
		'grid-template-rows:120px',
		'grid-auto-flow:row dense',
		'grid-auto-rows:140px',
		'justify-items:center',
		'align-items:end',
	)
);
xsb_assert_contains( 'child placement emitted', $grid, array( 'grid-column:span 2', 'grid-row:span 2' ) );

echo "\n== renderer: masonry mode ==\n";

$masonry = xsb_render_container(
	array(
		'layout_mode'     => 'masonry',
		'masonry_columns' => 3,
		'masonry_gap'     => array( 'value' => 24, 'unit' => 'px' ),
		'masonry_break_inside' => 'auto',
	),
	array(
		array(
			array( 'type' => 'xcosb/gb-heading', 'settings' => array( 'text' => 'A' ) ),
			array( 'type' => 'xcosb/gb-heading', 'settings' => array( 'text' => 'B', 'masonry_item_break' => 'avoid', 'masonry_item_span' => 'all' ) ),
		),
	)
);
xsb_assert_contains( 'masonry container styles', $masonry, array( 'xsb-container-flow--masonry', 'column-count:3', 'column-gap:24px' ) );
xsb_assert_contains( 'masonry parent default and item override render', $masonry, array( 'break-inside:auto', 'break-inside:avoid', 'column-span:all' ) );

echo "\n== renderer: scroll-row mode ==\n";

$scroll = xsb_render_container(
	array(
		'layout_mode'            => 'scroll-row',
		'scroll_snap_type'       => 'mandatory',
		'scroll_snap_align'      => 'center',
		'scroll_hide_scrollbar'  => true,
		'scroll_gap'             => 16,
		'scroll_padding_peek'    => 24,
		'scroll_item_width'      => array( 'value' => 280, 'unit' => 'px' ),
	),
	array( array( $child ), array( $child2 ) )
);
xsb_assert_contains(
	'scroll container styles',
	$scroll,
	array( 'xsb-container-flow--scroll-row', 'overflow-x:auto', 'scroll-snap-type:x mandatory', 'scrollbar-width:none', 'gap:16px', 'padding-left:24px' )
);
xsb_assert( 'scroll items sized and snapping', 2 === substr_count( $scroll, 'flex:0 0 auto;width:280px;scroll-snap-align:center' ), substr_count( $scroll, 'flex:0 0 auto' ) );

echo "\n== renderer: per-device columns, stacking and reversal ==\n";

$responsive = xsb_render_container(
	array(
		'layout_mode'           => 'columns',
		'columns'               => 3,
		'column_widths'         => array( 4, 4, 4 ),
		'tablet_columns'        => 2,
		'stacking_breakpoint'   => 'mobile',
		'column_reverse_mobile' => true,
	),
	array( array( $child ), array( $child2 ), array( $child ) )
);
$responsive_css = xsb_style_blocks( $responsive );

xsb_assert_contains( 'tablet media query emitted', $responsive_css, array( '@media (max-width: 768px)', 'span 6' ) );
xsb_assert_contains( 'mobile media query stacks', $responsive_css, array( '@media (max-width: 480px)', 'display:flex', 'flex-direction:column-reverse', 'width:100%' ) );
xsb_assert_missing( 'reversal is mobile-only', substr( $responsive_css, 0, strpos( $responsive_css, '@media (max-width: 480px)' ) ), array( 'column-reverse' ) );

echo "\n== renderer: hover state ==\n";

$hover = xsb_render_container(
	array(
		'layout_mode'       => 'list',
		'hover_bg_color'    => '#ff0000',
		'hover_box_shadow'  => 'strong',
		'hover_scale'       => 1.05,
		'hover_border_width' => 2,
	),
	array( array( $child ) )
);
$hover_css = xsb_style_blocks( $hover );
xsb_assert_contains( 'hover rule scoped to the instance', $hover_css, array( '[data-xsb-layout="xsb-c-', ']:hover {', 'background:#ff0000', 'box-shadow:0 18px 50px rgba(0,0,0,0.28)', 'transform:scale(1.05)', 'border:2px solid' ) );
xsb_assert( 'container carries its layout token', false !== strpos( $hover, 'data-xsb-layout="xsb-c-' ) );

echo "\n== renderer: flow declarations survive into the wrapper only ==\n";

$flow_root_style = xsb_root_style( $list );
xsb_assert_missing( 'flow layout does not leak onto the box', $flow_root_style, array( 'display:flex' ) );

echo "\n== renderer: saved background and overlay controls ==\n";
$background_output = xsb_render_container(
	array(
		'bg_type'            => 'image',
		'bg_image'           => 'https://example.test/hero.jpg',
		'bg_size'            => 'contain',
		'bg_position'        => 'right bottom',
		'bg_repeat'          => 'repeat-x',
		'bg_attachment'      => 'fixed',
		'bg_origin'          => 'content-box',
		'bg_clip'            => 'padding-box',
		'overlay_color'      => 'rgba(10, 20, 30, 0.8)',
		'overlay_opacity'    => 55,
		'overlay_blend_mode' => 'multiply',
	),
	array( array( $child ) )
);
$background_style = xsb_root_style( $background_output );
xsb_assert_contains( 'image positioning and sizing render on the container', $background_style, array( 'background-size:contain', 'background-position:right bottom', 'background-repeat:repeat-x', 'background-attachment:fixed', 'background-origin:content-box', 'background-clip:padding-box' ) );
xsb_assert_contains( 'background overlay renders with saved opacity and blend', $background_output, array( 'class="xsb-container-background-overlay"', 'rgba(10, 20, 30, 0.8)', 'opacity:0.55', 'mix-blend-mode:multiply' ) );

printf( "\n%d passed, %d failed\n", $GLOBALS['xsb_pass'], $GLOBALS['xsb_fail'] );
exit( $GLOBALS['xsb_fail'] > 0 ? 1 : 0 );
