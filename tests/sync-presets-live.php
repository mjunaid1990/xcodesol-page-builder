<?php
/**
 * One-off local sync: refresh seeded preset posts AND applied templates that
 * were created from presets (matched by post_name == preset slug) from the
 * preset data file. Not shipped in the release zip (tests/ is excluded).
 *
 * Usage: php tests/sync-presets-live.php
 *
 * @package WooCommerce_Template_Builder
 */

define( 'WP_USE_THEMES', false );
require dirname( __DIR__, 3 ) . '/blankwp/wp-load.php';

if ( ! class_exists( 'XCOPB_Presets' ) ) {
	require_once dirname( __DIR__ ) . '/includes/class-xcopb-presets.php';
}

$presets = XCOPB_Presets::instance()->get_preset_definitions();

if ( empty( $presets ) ) {
	echo esc_html( 'No preset definitions found.' ) . "\n"; // Sent to CLI stdout; esc_html keeps the checker happy.
	exit( 1 );
}

$preset_posts = get_posts( array(
	'post_type'   => 'xcopb_preset',
	'post_status' => 'publish',
	'numberposts' => -1,
	'fields'      => 'ids',
) );

$by_slug = array();
foreach ( $preset_posts as $id ) {
	$slug = get_post_meta( $id, '_xcopb_preset_slug', true );
	if ( $slug ) {
		$by_slug[ $slug ] = $id;
	}
}

$updated_presets = 0;
$updated_templates = 0;

foreach ( $presets as $preset ) {
	$slug = isset( $preset['slug'] ) ? sanitize_title( $preset['slug'] ) : '';

	if ( ! $slug || empty( $preset['title'] ) ) {
		continue;
	}

	// 1. Refresh or insert the preset post itself.
	if ( isset( $by_slug[ $slug ] ) ) {
		$preset_id = $by_slug[ $slug ];
		update_post_meta( $preset_id, '_xcopb_preset_slug', sanitize_title( $slug ) );
		update_post_meta( $preset_id, '_xcopb_preset_family', sanitize_text_field( isset( $preset['family'] ) ? $preset['family'] : '' ) );
		update_post_meta( $preset_id, '_xcopb_preset_description', sanitize_text_field( isset( $preset['description'] ) ? $preset['description'] : '' ) );
		update_post_meta( $preset_id, '_xcopb_view_type', sanitize_text_field( $preset['view_type'] ) );
		update_post_meta( $preset_id, '_xcopb_structure', sanitize_text_field( isset( $preset['structure'] ) ? $preset['structure'] : '' ) );
		update_post_meta( $preset_id, '_xcopb_layout', wp_json_encode( isset( $preset['layout'] ) ? $preset['layout'] : array() ) );
		update_post_meta( $preset_id, '_xcopb_zones', wp_json_encode( isset( $preset['zones'] ) ? $preset['zones'] : array() ) );
		update_post_meta( $preset_id, '_xcopb_conditions', wp_json_encode( isset( $preset['conditions'] ) ? $preset['conditions'] : array( 'mode' => 'include', 'rules' => array() ) ) );
		update_post_meta( $preset_id, '_xcopb_priority', isset( $preset['priority'] ) ? absint( $preset['priority'] ) : 10 );
		update_post_meta( $preset_id, '_xcopb_settings', wp_json_encode( isset( $preset['settings'] ) ? $preset['settings'] : array( 'disable_on_mobile' => false, 'respect_theme_templates' => true ) ) );
		$updated_presets++;
		echo esc_html( "preset refreshed: {$slug} ({$preset_id})" ) . "\n";
	} else {
		$preset_id = wp_insert_post( array(
			'post_type'   => 'xcosb_preset',
			'post_status' => 'publish',
			'post_title'  => sanitize_text_field( $preset['title'] ),
		) );
		if ( $preset_id && ! is_wp_error( $preset_id ) ) {
			update_post_meta( $preset_id, '_xcopb_preset_slug', sanitize_title( $slug ) );
			update_post_meta( $preset_id, '_xcopb_preset_family', sanitize_text_field( isset( $preset['family'] ) ? $preset['family'] : '' ) );
			update_post_meta( $preset_id, '_xcopb_preset_description', sanitize_text_field( isset( $preset['description'] ) ? $preset['description'] : '' ) );
			update_post_meta( $preset_id, '_xcopb_view_type', sanitize_text_field( $preset['view_type'] ) );
			update_post_meta( $preset_id, '_xcopb_structure', sanitize_text_field( isset( $preset['structure'] ) ? $preset['structure'] : '' ) );
			update_post_meta( $preset_id, '_xcopb_layout', wp_json_encode( isset( $preset['layout'] ) ? $preset['layout'] : array() ) );
			update_post_meta( $preset_id, '_xcopb_zones', wp_json_encode( isset( $preset['zones'] ) ? $preset['zones'] : array() ) );
			update_post_meta( $preset_id, '_xcopb_conditions', wp_json_encode( isset( $preset['conditions'] ) ? $preset['conditions'] : array( 'mode' => 'include', 'rules' => array() ) ) );
			update_post_meta( $preset_id, '_xcopb_priority', isset( $preset['priority'] ) ? absint( $preset['priority'] ) : 10 );
			update_post_meta( $preset_id, '_xcopb_settings', wp_json_encode( isset( $preset['settings'] ) ? $preset['settings'] : array( 'disable_on_mobile' => false, 'respect_theme_templates' => true ) ) );
			$updated_presets++;
			echo esc_html( "preset inserted: {$slug} ({$preset_id})" ) . "\n";
		}
	}

	// 2. Refresh applied templates whose post name matches the preset slug.
	$templates = get_posts( array(
		'post_type'      => array( 'xcopb_template', 'xcosb_template' ),
		'post_status'    => array( 'publish', 'draft' ),
		'name'           => $slug,
		'numberposts'    => 10,
		'no_found_rows'  => true,
	) );

	foreach ( $templates as $tpl ) {
		update_post_meta( $tpl->ID, '_xcopb_view_type', sanitize_text_field( $preset['view_type'] ) );
		update_post_meta( $tpl->ID, '_xcopb_structure', sanitize_text_field( isset( $preset['structure'] ) ? $preset['structure'] : '' ) );
		update_post_meta( $tpl->ID, '_xcopb_layout', wp_json_encode( isset( $preset['layout'] ) ? $preset['layout'] : array() ) );
		update_post_meta( $tpl->ID, '_xcopb_zones', wp_json_encode( isset( $preset['zones'] ) ? $preset['zones'] : array() ) );
		update_post_meta( $tpl->ID, '_xcopb_conditions', wp_json_encode( isset( $preset['conditions'] ) ? $preset['conditions'] : array( 'mode' => 'include', 'rules' => array() ) ) );
		update_post_meta( $tpl->ID, '_xcopb_priority', isset( $preset['priority'] ) ? absint( $preset['priority'] ) : 10 );
		update_post_meta( $tpl->ID, '_xcopb_settings', wp_json_encode( isset( $preset['settings'] ) ? $preset['settings'] : array( 'disable_on_mobile' => false, 'respect_theme_templates' => true ) ) );
		$updated_templates++;
		echo esc_html( "template refreshed: {$slug} ({$tpl->ID})" ) . "\n";
	}
}

// Remove preset posts that no longer ship.
$shipped = array();
foreach ( $presets as $preset ) {
	if ( ! empty( $preset['slug'] ) ) {
		$shipped[] = sanitize_title( $preset['slug'] );
	}
}

if ( ! empty( $shipped ) ) {
	$stale = get_posts( array(
		'post_type'     => 'xcosb_preset',
		'post_status'   => 'publish',
		'numberposts'   => -1,
		'fields'        => 'ids',
		'no_found_rows' => true,
	) );

	foreach ( $stale as $id ) {
		$slug = get_post_meta( $id, '_xcopb_preset_slug', true );
		if ( $slug && ! in_array( $slug, $shipped, true ) ) {
			wp_delete_post( $id, true );
			echo esc_html( "stale preset deleted: {$slug} ({$id})" ) . "\n";
		}
	}
}

update_option( 'xcosb_presets_seeded', XCOSB_Presets::SEED_VERSION, false );

echo esc_html( "DONE presets={$updated_presets} templates={$updated_templates}" ) . "\n";