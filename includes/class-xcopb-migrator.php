<?php
/**
 * One-time data migrator for the plugin's prefix changes.
 *
 * Versions <= 1.1.0 stored everything under the `wtb` prefix, and versions
 * <= 2.1.x stored everything under the `xsb` prefix: the template / preset
 * post types, the `_wtb_*` / `_xsb_*` meta keys, the seeded/version options,
 * the block types inside the layout JSON and CSS class names in authored
 * values. This class rewrites all of that in place to the current `xcosb`
 * equivalents so the renamed code keeps working with existing templates and
 * pre-made templates — no data loss, no reseeding.
 *
 * The migration runs automatically once on `plugins_loaded` when the stored
 * DB version is older than {@see XCOPB_Migrator::DB_VERSION}, so upgrades are
 * transparent. Fresh installs have nothing to migrate and simply record the
 * current DB version.
 *
 * The legacy `wtb*` / `xsb*` strings below are intentionally spelled out:
 * they name historical data, not current code.
 *
 * @package Xcodesol_Shop_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Data migrator.
 */
final class XCOPB_Migrator {

	/**
	 * Current data schema version.
	 *
	 * Bump when a future release needs another one-time rewrite.
	 *
	 * 2 = `wtb*` → `xsb*` (2.0.0 rebrand).
	 * 3 = `xsb*` → `xcosb*` (current prefix).
	 * 4 = layout documents renamed to the current block types.
	 * 5 = containers gained explicit layout modes (list / row / columns /
	 *     grid / masonry / scroll-row): every saved container records the
	 *     mode it renders with, and legacy grid containers get an explicit
	 *     grid template, so the canvas and the front end agree.
	 *
	 * @var int
	 */
	const DB_VERSION = 5;

	/**
	 * Option that stores the migrated data schema version.
	 *
	 * @var string
	 */
	const OPTION = 'xcopb_db_version';

	/**
	 * Legacy post type → replacement post type.
	 *
	 * @var array<string,string>
	 */
	const POST_TYPE_MAP = array(
		'wtb_template'   => 'xcopb_template',
		'wtb_preset'     => 'xcopb_preset',
		'xsb_template'   => 'xcopb_template',
		'xsb_preset'     => 'xcopb_preset',
		'xcopb_template' => 'xcopb_template',
		'xcopb_preset'   => 'xcopb_preset',
	);

	/**
	 * Legacy option / meta prefixes (both are four characters long).
	 *
	 * @var string[]
	 */
	const LEGACY_PREFIXES = array( 'wtb_', 'xsb_', 'xcopb_' );

	/**
	 * Run the migration when the stored DB version is out of date.
	 *
	 * Hooked early on `plugins_loaded`, before any template queries run.
	 *
	 * @return void
	 */
	public static function maybe_migrate() {
		$stored = (int) get_option( self::OPTION, 0 );

		if ( $stored >= self::DB_VERSION ) {
			return;
		}

		// The prefix/token rewrites only apply to data written before version
		// 4 — re-running them on current documents would rewrite authored CSS
		// class names a second time.
		if ( $stored < 4 ) {
			$had_legacy_preset_data  = self::migrate_options();
			$had_legacy_preset_posts = self::migrate_posts();
			wp_cache_flush();

			// Upgrades that already had seeded presets keep their migrated posts;
			// mark them seeded at the current seed version so the seeder does not
			// create duplicates. Fresh installs are left unmarked and the seeder
			// runs normally on the first admin request.
			if ( $had_legacy_preset_data || $had_legacy_preset_posts ) {
				update_option( 'xcopb_presets_seeded', XCOPB_Presets::SEED_VERSION, false );
			}
		}

		self::migrate_container_layouts();

		update_option( self::OPTION, self::DB_VERSION, false );
	}

	/**
	 * Record the explicit layout mode on every saved container.
	 *
	 * Containers authored before the layout modes existed carry either no
	 * mode (a 12-unit column grid) or the legacy `layout_type: grid` with a
	 * `grid_columns_count`. Writing the mode in data — instead of guessing at
	 * render time — keeps the editor canvas and the front end on one code
	 * path, and leaves every existing layout rendering exactly as before.
	 *
	 * @return void
	 */
	private static function migrate_container_layouts() {
		$types = array_values( array_unique( array_values( self::POST_TYPE_MAP ) ) );

		$ids = get_posts(
			array(
				'post_type'        => $types,
				'post_status'      => 'any',
				'numberposts'      => -1,
				'fields'           => 'ids',
				'orderby'          => 'ID',
				'order'            => 'ASC',
				'suppress_filters' => true,
			)
		);

		foreach ( $ids as $post_id ) {
			$raw = get_post_meta( $post_id, '_xcopb_layout', true );

			if ( ! is_string( $raw ) || '' === $raw ) {
				continue;
			}

			$layout = json_decode( $raw, true );

			if ( ! is_array( $layout ) ) {
				continue;
			}

			$migrated = self::map_container_layouts( $layout );

			if ( $migrated !== $layout ) {
				update_post_meta( $post_id, '_xcopb_layout', wp_json_encode( $migrated ) );
			}
		}
	}

	/**
	 * Walk a layout document (recursively, so containers inside containers
	 * are covered) and give every container an explicit layout mode.
	 *
	 * @param array $blocks List of block documents.
	 * @return array
	 */
	private static function map_container_layouts( $blocks ) {
		if ( ! is_array( $blocks ) ) {
			return $blocks;
		}

		foreach ( $blocks as $index => $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			$type = isset( $block['type'] ) ? (string) $block['type'] : '';

			if ( false !== strpos( $type, 'gb-container' ) ) {
				$settings = isset( $block['settings'] ) && is_array( $block['settings'] ) ? $block['settings'] : array();
				$block['settings'] = self::map_container_settings( $settings );
			}

			if ( isset( $block['inner'] ) && is_array( $block['inner'] ) ) {
				$inner = array();
				foreach ( $block['inner'] as $ci => $column ) {
					$inner[ $ci ] = is_array( $column ) ? self::map_container_layouts( $column ) : $column;
				}
				$block['inner'] = $inner;
			}

			$blocks[ $index ] = $block;
		}

		return $blocks;
	}

	/**
	 * Give one container's settings an explicit layout mode (and, for legacy
	 * grid containers, an explicit track template built from the old
	 * `grid_columns_count`).
	 *
	 * @param array $settings Container settings.
	 * @return array
	 */
	private static function map_container_settings( $settings ) {
		if ( ! empty( $settings['layout_mode'] ) ) {
			return $settings;
		}

		$is_grid = ( isset( $settings['layout_type'] ) && 'grid' === $settings['layout_type'] )
			|| ! empty( $settings['grid_columns_count'] )
			|| ! empty( $settings['grid_settings'] );

		if ( $is_grid ) {
			$settings['layout_mode'] = 'grid';

			if ( empty( $settings['grid_template'] ) ) {
				$columns = ! empty( $settings['grid_columns_count'] ) ? absint( $settings['grid_columns_count'] ) : 12;
				$settings['grid_template'] = array(
					'columns' => 'repeat(' . max( 1, $columns ) . ', minmax(0, 1fr))',
				);
			}
		} else {
			// Everything else has always rendered as the 12-unit column grid.
			$settings['layout_mode'] = 'columns';
		}

		return $settings;
	}

	/**
	 * Rename every plugin option stored under a legacy prefix.
	 *
	 * @return bool True when at least one legacy option existed (upgrade).
	 */
	private static function migrate_options() {
		global $wpdb;

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT option_id, option_name, option_value, autoload FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				'wtb\\_%',
				'xsb\\_%'
			)
		);

		foreach ( $rows as $row ) {
			$new_name = 'xcopb_' . substr( $row->option_name, 4 );

			if ( false === get_option( $new_name ) ) {
				add_option( $new_name, maybe_unserialize( $row->option_value ), '', 'no' === $row->autoload ? 'no' : 'yes' );
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->delete( $wpdb->options, array( 'option_id' => (int) $row->option_id ), array( '%d' ) );
		}

		return ! empty( $rows );
	}

	/**
	 * Migrate legacy template/preset posts: post type, meta keys and any
	 * legacy tokens stored inside meta values (layout JSON, conditions, CSS).
	 *
	 * @return bool True when at least one legacy preset post existed.
	 */
	private static function migrate_posts() {
		$legacy_types = array_keys( self::POST_TYPE_MAP );

		$ids = get_posts(
			array(
				'post_type'        => $legacy_types,
				'post_status'      => 'any',
				'numberposts'      => -1,
				'fields'           => 'ids',
				'orderby'          => 'ID',
				'order'            => 'ASC',
				'suppress_filters' => true,
			)
		);

		$had_presets = false;

		foreach ( $ids as $post_id ) {
			$post = get_post( $post_id );

			if ( ! $post || empty( self::POST_TYPE_MAP[ $post->post_type ] ) ) {
				continue;
			}

			if ( in_array( $post->post_type, array( 'wtb_preset', 'xsb_preset' ), true ) ) {
				$had_presets = true;
			}

			self::update_post_type( $post_id, self::POST_TYPE_MAP[ $post->post_type ] );
			self::migrate_post_meta( $post_id );
		}

		return $had_presets;
	}

	/**
	 * Change one post's post type without touching its modified date or
	 * firing update hooks (a pure data rename).
	 *
	 * @param int    $post_id Post ID.
	 * @param string $new_type New post type slug.
	 * @return void
	 */
	private static function update_post_type( $post_id, $new_type ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->update(
			$wpdb->posts,
			array( 'post_type' => $new_type ),
			array( 'ID' => (int) $post_id ),
			array( '%s' ),
			array( '%d' )
		);

		clean_post_cache( $post_id );
	}

	/**
	 * Rename legacy meta keys to `_xcopb_*` and rewrite legacy tokens inside
	 * every meta value of the post.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	private static function migrate_post_meta( $post_id ) {
		$all = get_post_meta( $post_id );

		foreach ( $all as $meta_key => $values ) {
			$new_key = $meta_key;

			foreach ( self::LEGACY_PREFIXES as $prefix ) {
				$legacy_key = '_' . $prefix;
				if ( 0 === strpos( $meta_key, $legacy_key ) ) {
					$new_key = '_xcopb_' . substr( $meta_key, strlen( $legacy_key ) );
					// Idempotent: clear any rows left by a partially-completed run.
					delete_post_meta( $post_id, $new_key );
					break;
				}
			}

			foreach ( $values as $value ) {
				$value = self::rewrite_tokens( $value );

				if ( $meta_key !== $new_key ) {
					add_post_meta( $post_id, $new_key, $value, false );
				} else {
					update_post_meta( $post_id, $meta_key, $value );
				}
			}

			if ( $meta_key !== $new_key ) {
				delete_post_meta( $post_id, $meta_key );
			}
		}
	}

	/**
	 * Recursively rewrite legacy tokens inside a stored value.
	 *
	 * Layout documents are JSON strings whose block types read `wtb/cd-...`
	 * (or `xsb/cd-...`); option/meta references may carry a legacy prefix.
	 * The original CSS class rename (`wtb-` → `xsb-`) is preserved because the
	 * plugin's stylesheet class names still use the short form. Plain string
	 * and serialized-array values are both handled.
	 *
	 * @param mixed $value Stored value.
	 * @return mixed Rewritten value.
	 */
	private static function rewrite_tokens( $value ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $k => $v ) {
				$value[ $k ] = self::rewrite_tokens( $v );
			}
			return $value;
		}

		if ( ! is_string( $value ) || '' === $value ) {
			return $value;
		}

		return str_replace(
			array( 'wtb/', 'xsb/', 'xcosb/', 'wtb_', 'xsb_', 'xcopb_', 'wtb-', 'xsb-' ),
			array( 'xcopb/', 'xcopb/', 'xcopb/', 'xcopb_', 'xcopb_', 'xcopb_', 'xpb-', 'xpb-' ),
			$value
		);
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Migrator', 'XCOSB_Migrator' );
