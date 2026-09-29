<?php
/**
 * Standalone structural test for includes/data/presets.php.
 *
 * Run: php tests/presets.test.php
 *
 * @package WooCommerce_Template_Builder
 */

define( 'ABSPATH', 'standalone' );
define( 'XCOPB_PLUGIN_DIR', dirname( __DIR__ ) . '/' );
if ( ! defined( 'XCOSB_PLUGIN_DIR' ) ) {
	define( 'XCOSB_PLUGIN_DIR', XCOPB_PLUGIN_DIR );
}

if ( ! function_exists( 'esc_html' ) ) {
	function esc_html( $str ) { // phpcs:ignore
		return htmlspecialchars( (string) $str, ENT_QUOTES, 'UTF-8', false );
	}
}
if ( ! function_exists( '__' ) ) {
	function __( $text, $domain = 'default' ) { // phpcs:ignore
		return $text;
	}
}
if ( ! function_exists( '_x' ) ) {
	function _x( $text, $context, $domain = 'default' ) { // phpcs:ignore
		return $text;
	}
}

$presets = require XCOPB_PLUGIN_DIR . 'includes/data/presets.php';

$fails = 0;
$count = 0;

// The exact widget set registered in the builder.
$allowed = array(
	'xcopb/gb-container',
	'xcopb/gb-heading',
	'xcopb/gb-text',
	'xcopb/gb-button',
	'xcopb/gb-image',
	'xcopb/gb-banner',
	'xcopb/gb-divider',
	'xcopb/gb-shortcode',
	'xcopb/gb-breadcrumb',
	'xcopb/gb-text-widget',
);

$view_types = array( 'page', 'section', 'header', 'footer', 'landing' );

foreach ( $presets as $slug => $preset ) {
	$count++;
	$label = "[$slug] ";

	if ( $slug !== $preset['slug'] ) {
		echo esc_html( $label . 'FAIL slug key mismatch' ) . "\n";
		$fails++;
	}
	if ( empty( $preset['title'] ) ) {
		echo esc_html( $label . 'FAIL missing title' ) . "\n";
		$fails++;
	}
	if ( ! in_array( $preset['view_type'], $view_types, true ) ) {
		echo esc_html( $label . "FAIL bad view_type {$preset['view_type']}" ) . "\n";
		$fails++;
	}

	// Every top-level and nested block must be a registered widget.
	$blocks = array();
	foreach ( $preset['layout'] as $b ) {
		$blocks[] = $b['type'];
		if ( isset( $b['inner'] ) && is_array( $b['inner'] ) ) {
			foreach ( $b['inner'] as $col ) {
				foreach ( $col as $n ) {
					$blocks[] = $n['type'];
				}
			}
		}
	}
	foreach ( $blocks as $t ) {
		if ( ! in_array( $t, $allowed, true ) ) {
			echo esc_html( $label . "FAIL unregistered widget $t" ) . "\n";
			$fails++;
		}
	}

	// zones must be parallel to the top-level layout.
	if ( count( $preset['zones'] ) !== count( $preset['layout'] ) ) {
		echo esc_html( $label . 'FAIL zones (' . count( $preset['zones'] ) . ') != layout (' . count( $preset['layout'] ) . ')' ) . "\n";
		$fails++;
	}

	// ar-loop blocks must carry columns + card_layout.
	foreach ( $preset['layout'] as $b ) {
		if ( ( 'xcopb/ar-loop' === $b['type'] || 'xcosb/ar-loop' === $b['type'] ) && ( empty( $b['settings']['card_layout'] ) || ! is_array( $b['settings']['card_layout'] ) ) ) {
			echo esc_html( $label . 'FAIL ar-loop missing card_layout' ) . "\n";
			$fails++;
		}
	}

	if ( empty( $preset['structure'] ) ) {
		echo esc_html( $label . 'FAIL missing structure' ) . "\n";
		$fails++;
	}

	echo esc_html( $label . 'OK ' . implode( ', ', array_unique( $blocks ) ) ) . "\n";
}

echo esc_html( "\n{$count} presets, {$fails} failures" ) . "\n";
exit( $fails ? 1 : 0 );