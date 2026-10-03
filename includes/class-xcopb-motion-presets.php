<?php
/**
 * Shared motion preset registry used by the inspector, REST sanitizers and renderers.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

final class XCOPB_Motion_Presets {
	/** Normalize and validate an animation preset ID. */
	public static function normalize_id( $id ) {
		if ( ! is_string( $id ) ) {
			return 'none';
		}
		$id = sanitize_key( $id );
		return in_array( $id, self::ids(), true ) ? $id : 'none';
	}

	/**
	 * Return the stable motion catalog from the shared JSON manifest.
	 *
	 * @return array<int,array<string,string>>
	 */
	public static function all() {
		static $presets = null;
		if ( null !== $presets ) {
			return $presets;
		}

		$file    = defined( 'XCOPB_PLUGIN_DIR' ) ? XCOPB_PLUGIN_DIR . 'includes/data/motion-presets.json' : __DIR__ . '/data/motion-presets.json';
		$decoded = file_exists( $file ) ? json_decode( file_get_contents( $file ), true ) : array(); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$presets = array();
		foreach ( is_array( $decoded ) ? $decoded : array() as $preset ) {
			if ( ! is_array( $preset ) || empty( $preset['value'] ) || empty( $preset['keyframe'] ) ) {
				continue;
			}
			$id = sanitize_key( $preset['value'] );
			if ( $id && preg_match( '/^xsb-motion-[a-z0-9-]+$/', $preset['keyframe'] ) ) {
				$presets[ $id ] = array(
					'value'    => $id,
					'label'    => sanitize_text_field( $preset['label'] ?? $id ),
					'keyframe' => $preset['keyframe'],
				);
			}
		}
		return $presets;
	}

	/** Return allowed preset IDs, optionally including the disabled value. */
	public static function ids() {
		return array_merge( array( 'none' ), array_keys( self::all() ) );
	}

	/** Resolve an animation to its CSS keyframe name. */
	public static function keyframe( $id ) {
		$presets = self::all();
		return isset( $presets[ $id ] ) ? $presets[ $id ]['keyframe'] : '';
	}
}
