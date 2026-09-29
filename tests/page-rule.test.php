<?php
/**
 * Quick sanity test for the "page" condition rule (the engine behind the
 * Product Card "WooCommerce Page Type" selector). Run with:
 *   php tests/page-rule.test.php
 *
 * @package WooCommerce_Template_Builder
 */

// The plugin's PHP files guard with defined( 'ABSPATH' ) || exit;
defined( 'ABSPATH' ) || define( 'ABSPATH', __DIR__ . '/' );

// Minimal WordPress shim so the conditions engine runs standalone.
if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $str ) {
		return is_string( $str ) ? trim( wp_strip_all_tags( $str ) ) : $str;
	}
}

// Standalone test shim (real wp_strip_all_tags unavailable outside WP).
if ( ! function_exists( 'wp_strip_all_tags' ) ) {
	function wp_strip_all_tags( $str ) {
		return is_string( $str ) ? trim( strip_tags( $str ) ) : $str;
	}
}

// Standalone test shim: escapes output like WP's esc_html().
if ( ! function_exists( 'esc_html' ) ) {
	function esc_html( $str ) {
		return htmlspecialchars( (string) $str, ENT_QUOTES, 'UTF-8', false );
	}
}

require __DIR__ . '/../includes/class-xcopb-conditions.php';

$ref  = new ReflectionClass( 'XCOPB_Conditions' );
$inst = XCOPB_Conditions::instance();
$m    = $ref->getMethod( 'evaluate_page_rule' );
$m->setAccessible( true );

$failures = 0;

function check( $label, $got, $expected, &$failures ) {
	if ( $got === $expected ) {
		echo esc_html( "PASS - {$label}" ) . "\n";
		return;
	}
	$failures++;
	echo esc_html( "FAIL - {$label}: expected " . wp_strip_all_tags( var_export( $expected, true ) ) . ', got ' . wp_strip_all_tags( var_export( $got, true ) ) ) . "\n";
}

$cases = array(
	array( 'Shop card applies on shop page', array( 'page' => 'shop', 'operator' => 'is' ), 'shop', true ),
	array( 'Shop card skipped on category page', array( 'page' => 'shop', 'operator' => 'is' ), 'product_category', false ),
	array( 'Shop card skipped on tag page', array( 'page' => 'shop', 'operator' => 'is' ), 'product_tag', false ),
	array( 'Category card applies on category page', array( 'page' => 'product_category', 'operator' => 'is' ), 'product_category', true ),
	array( 'Category card skipped on shop page', array( 'page' => 'product_category', 'operator' => 'is' ), 'shop', false ),
	array( 'Tag card applies on tag page', array( 'page' => 'product_tag', 'operator' => 'is' ), 'product_tag', true ),
	array( 'Term-archive card applies on other archive', array( 'page' => 'product_archive', 'operator' => 'is' ), 'product_archive', true ),
	array( 'Term-archive card skipped on shop', array( 'page' => 'product_archive', 'operator' => 'is' ), 'shop', false ),
	array( '"Is not shop" applies on category', array( 'page' => 'shop', 'operator' => 'is_not' ), 'product_category', true ),
	array( '"Is not shop" skipped on shop', array( 'page' => 'shop', 'operator' => 'is_not' ), 'shop', false ),
);

foreach ( $cases as $case ) {
	list( $label, $rule, $view_type, $expected ) = $case;
	$got = $m->invoke( $inst, $rule, array( 'view_type' => $view_type ) );
	check( $label, $got, $expected, $failures );
}

if ( $failures ) {
	echo esc_html( "{$failures} FAILURES" ) . "\n";
	exit( 1 );
}
echo "ALL PASS\n";