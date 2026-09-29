<?php
/**
 * Pre-made (ready-to-use) template presets.
 *
 * Presets live in their own post type (`xcopb_preset`) so they never mix with
 * the user's editable templates (`xcosb_template`). Each preset is a complete
 * template definition that ships with the plugin; a user applies it with one
 * click and the plugin duplicates it into a real, editable template that is
 * then rendered on the matching pages.
 *
 * New presets can be added later by extending the data file
 * (includes/data/presets.php) — the seeder picks them up automatically and
 * they can be grouped into themed families via the family meta field.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Presets
 */
class XCOPB_Presets {

	/**
	 * Preset post type slug.
	 *
	 * @var string
	 */
	const POST_TYPE = 'xcopb_preset';

	/**
	 * Seeder version — bump when the built-in preset set changes so the
	 * seeder re-runs: new presets are added and existing presets are
	 * refreshed from the data file (they are read-only source material, so
	 * refreshing keeps every user on the latest shipped design).
	 *
	 * @var string
	 */
	const SEED_VERSION = '2.5.1';

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_Presets|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Presets
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
	add_action( 'init', array( $this, 'register_post_type' ) );
	add_action( 'init', array( $this, 'register_meta_fields' ) );
	add_action( 'admin_init', array( $this, 'maybe_seed_presets' ) );
	add_action( 'wp_ajax_xcopb_diag_presets', array( $this, 'handle_diag_presets' ) );
		add_action( 'admin_post_xcopb_apply_preset', array( $this, 'handle_apply_preset' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_columns', array( $this, 'list_columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( $this, 'list_column_content' ), 10, 2 );
		add_filter( 'post_row_actions', array( $this, 'row_actions' ), 10, 2 );
	}

	/**
	 * Register the preset post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'                  => _x( 'Pre-made Templates', 'Post type general name', 'xcodesol-page-builder' ),
			'singular_name'         => _x( 'Pre-made Template', 'Post type singular name', 'xcodesol-page-builder' ),
			'menu_name'             => _x( 'Pre-made Templates', 'Admin Menu text', 'xcodesol-page-builder' ),
			'name_admin_bar'        => _x( 'Pre-made Template', 'Add New on Toolbar', 'xcodesol-page-builder' ),
			'add_new'               => __( 'Add New', 'xcodesol-page-builder' ),
			'add_new_item'          => __( 'Add New Pre-made Template', 'xcodesol-page-builder' ),
			'new_item'              => __( 'New Pre-made Template', 'xcodesol-page-builder' ),
			'edit_item'             => __( 'View Pre-made Template', 'xcodesol-page-builder' ),
			'view_item'             => __( 'View Pre-made Template', 'xcodesol-page-builder' ),
			'all_items'             => __( 'Pre-made Templates', 'xcodesol-page-builder' ),
			'search_items'          => __( 'Search Pre-made Templates', 'xcodesol-page-builder' ),
			'not_found'             => __( 'No pre-made templates found.', 'xcodesol-page-builder' ),
			'not_found_in_trash'    => __( 'No pre-made templates found in Trash.', 'xcodesol-page-builder' ),
			'filter_items_list'     => _x( 'Filter pre-made templates list', 'Screen reader text', 'xcodesol-page-builder' ),
			'items_list_navigation' => _x( 'Pre-made templates list navigation', 'Screen reader text', 'xcodesol-page-builder' ),
			'items_list'            => _x( 'Pre-made templates list', 'Screen reader text', 'xcodesol-page-builder' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false,
			'show_ui'            => true,
			'show_in_menu'       => 'xcodesol-page-builder',
			'query_var'          => false,
			'rewrite'            => false,
			'capability_type'    => 'post',
			'has_archive'        => false,
			'hierarchical'       => false,
			'menu_position'      => 57,
			'menu_icon'          => 'dashicons-portfolio',
			'supports'           => array( 'title' ),
			'show_in_rest'       => false,
			'publicly_queryable' => false,
			/* Presets are read-only source material — no trash/delete
			 * needed on the list screen (row actions are replaced by
			 * "Use this template"). */
			'map_meta_cap'       => true,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register meta fields for the preset post type.
	 */
	public function register_meta_fields() {
		$meta_fields = array(
			'_xcopb_preset_slug',
			'_xcopb_preset_family',
			'_xcopb_preset_description',
			'_xcopb_view_type',
			'_xcopb_layout',
			'_xcopb_structure',
			'_xcopb_zones',
			'_xcopb_conditions',
			'_xcopb_priority',
			'_xcopb_settings',
		);

		foreach ( $meta_fields as $meta_key ) {
			register_post_meta( self::POST_TYPE, $meta_key, array(
				'show_in_rest'  => false,
				'single'        => true,
				'auth_callback' => function () {
					return current_user_can( 'manage_woocommerce' );
				},
			) );
		}
	}

	/**
	 * Seed the built-in presets once per seeder version.
	 *
	 * Runs on admin requests only, so a plain front-end page load never
	 * triggers writes. Presets are keyed by slug: existing ones are left
	 * untouched (users may customise their own copy), new slugs are added.
	 */
	public function maybe_seed_presets() {
		if ( get_option( 'xcopb_presets_seeded' ) === self::SEED_VERSION ) {
			return;
		}

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		$this->seed_presets();
		update_option( 'xcopb_presets_seeded', self::SEED_VERSION, false );
	}

	/**
	 * Create any missing preset posts and refresh existing ones from the
	 * data file, so a seeder version bump ships design updates to presets
	 * that were already seeded (presets are read-only source material).
	 */
	public function seed_presets() {
		$presets = $this->get_preset_definitions();

		if ( empty( $presets ) || ! is_array( $presets ) ) {
			return;
		}

		foreach ( $presets as $preset ) {
			if ( empty( $preset['slug'] ) || empty( $preset['title'] ) ) {
				continue;
			}

			$existing = $this->get_preset_by_slug( $preset['slug'] );
			if ( $existing ) {
				// Refresh the read-only preset in place with the shipped design.
				$this->apply_preset_meta( $existing->ID, $preset );
				continue;
			}

			$post_id = wp_insert_post( array(
				'post_type'   => self::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => sanitize_text_field( $preset['title'] ),
			) );

			if ( is_wp_error( $post_id ) || ! $post_id ) {
				continue;
			}

			$this->apply_preset_meta( $post_id, $preset );
		}

		// Remove preset posts that no longer ship. Presets are read-only
		// source material, so the built-in list always mirrors the data file
		// exactly (removed presets never linger in the list).
		$shipped = array();
		foreach ( $presets as $preset ) {
			if ( ! empty( $preset['slug'] ) ) {
				$shipped[] = sanitize_title( $preset['slug'] );
			}
		}

		if ( ! empty( $shipped ) ) {
			$stale = get_posts( array(
				'post_type'              => self::POST_TYPE,
				'post_status'            => 'publish',
				'posts_per_page'         => -1,
				'fields'                 => 'ids',
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
			) );

			foreach ( $stale as $preset_id ) {
				$slug = get_post_meta( $preset_id, '_xcopb_preset_slug', true );
				if ( $slug && ! in_array( $slug, $shipped, true ) ) {
					wp_delete_post( $preset_id, true );
				}
			}
		}
	}

	/**
	 * Write a preset definition's meta onto a preset post.
	 *
	 * @param int   $post_id Preset post ID.
	 * @param array $preset  Preset definition.
	 */
	/**
	 * Admin AJAX (read-only) diagnostic: dump the list of seeded presets for
	 * local verification. Protected to autoloaded WC admins only; not part of
	 * the normal plugin flow.
	 */
	public function handle_diag_presets() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( 'forbidden', 403 );
			return;
		}

		$presets = get_posts( array(
			'post_type'   => self::POST_TYPE,
			'post_status' => 'publish',
			'posts_per_page' => 50,
			'fields'      => 'ids',
		) );

		$list = array();
		foreach ( $presets as $id ) {
			$list[] = array(
				'id'        => $id,
				'title'     => get_the_title( $id ),
				'slug'      => get_post_meta( $id, '_xcopb_preset_slug', true ),
				'structure' => get_post_meta( $id, '_xcopb_structure', true ),
				'seeded'    => get_post_meta( $id, '_xcopb_preset_seeded', true ) ? '1' : '0',
			);
		}

		wp_send_json_success( $list );
	}

	private function apply_preset_meta( $post_id, $preset ) {
		update_post_meta( $post_id, '_xcopb_preset_slug', sanitize_title( $preset['slug'] ) );
		update_post_meta( $post_id, '_xcopb_preset_family', sanitize_text_field( isset( $preset['family'] ) ? $preset['family'] : '' ) );
		update_post_meta( $post_id, '_xcopb_preset_description', sanitize_text_field( isset( $preset['description'] ) ? $preset['description'] : '' ) );
		update_post_meta( $post_id, '_xcopb_view_type', sanitize_text_field( $preset['view_type'] ) );
		update_post_meta( $post_id, '_xcopb_structure', sanitize_text_field( isset( $preset['structure'] ) ? $preset['structure'] : '' ) );
		update_post_meta( $post_id, '_xcopb_layout', wp_json_encode( isset( $preset['layout'] ) ? $preset['layout'] : array() ) );
		update_post_meta( $post_id, '_xcopb_zones', wp_json_encode( isset( $preset['zones'] ) ? $preset['zones'] : array() ) );
		update_post_meta( $post_id, '_xcopb_conditions', wp_json_encode( isset( $preset['conditions'] ) ? $preset['conditions'] : array( 'mode' => 'include', 'rules' => array() ) ) );
		update_post_meta( $post_id, '_xcopb_priority', isset( $preset['priority'] ) ? absint( $preset['priority'] ) : 10 );
		update_post_meta( $post_id, '_xcopb_settings', wp_json_encode( isset( $preset['settings'] ) ? $preset['settings'] : array( 'disable_on_mobile' => false, 'respect_theme_templates' => true ) ) );
	}

	/**
	 * Get a preset post by its slug meta.
	 *
	 * @param string $slug Preset slug.
	 * @return WP_Post|null
	 */
	public function get_preset_by_slug( $slug ) {
		$slug = sanitize_title( $slug );

		if ( '' === $slug ) {
			return null;
		}

		$query = new WP_Query( array(
			'post_type'              => self::POST_TYPE,
			'post_status'            => 'publish',
			'posts_per_page'         => 1,
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'meta_key'               => '_xcopb_preset_slug', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'             => $slug, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		) );

		return $query->have_posts() ? $query->posts[0] : null;
	}

	/**
	 * Load the built-in preset definitions.
	 *
	 * @return array
	 */
	public function get_preset_definitions() {
		$file = XCOPB_PLUGIN_DIR . 'includes/data/presets.php';

		if ( ! file_exists( $file ) ) {
			return array();
		}

		$presets = require $file;

		return is_array( $presets ) ? $presets : array();
	}

	/**
	 * Build a self-contained export document from a preset post, exactly like
	 * the template export format so the standard import path can recreate it.
	 *
	 * @param int $preset_id Preset post ID.
	 * @return array|null Export document or null on failure.
	 */
	public function build_preset_document( $preset_id ) {
		$post = get_post( $preset_id );

		if ( ! $post || self::POST_TYPE !== $post->post_type ) {
			return null;
		}

		$layout = json_decode( XCOPB_Registrar::get_field( $preset_id, '_xcopb_layout', '[]' ), true );

		return array(
			'xcosb' => array(
				'version'   => '1.0',
				'generator' => 'xcodesol-page-builder',
				'preset'    => XCOPB_Registrar::get_field( $preset_id, '_xcopb_preset_slug', '' ),
			),
			'template' => array(
				'title'      => $post->post_title,
				'view_type'  => XCOPB_Registrar::get_field( $preset_id, '_xcopb_view_type', 'shop' ),
				'structure'  => XCOPB_Registrar::get_field( $preset_id, '_xcopb_structure', '' ),
				'layout'     => is_array( $layout ) ? $layout : array(),
				'zones'      => json_decode( XCOPB_Registrar::get_field( $preset_id, '_xcopb_zones', '[]' ), true ),
				'conditions' => json_decode( XCOPB_Registrar::get_field( $preset_id, '_xcopb_conditions', '{"mode":"include","rules":[]}' ), true ),
				'priority'   => absint( XCOPB_Registrar::get_field( $preset_id, '_xcopb_priority', 10 ) ),
				'settings'   => json_decode( XCOPB_Registrar::get_field( $preset_id, '_xcopb_settings', '{}' ), true ),
			),
		);
	}

	/**
	 * Apply a preset: duplicate it into a new editable template and return
	 * the new template's editor URL.
	 *
	 * @param int $preset_id Preset post ID.
	 * @return string|WP_Error Editor URL on success, WP_Error otherwise.
	 */
	public function apply_preset( $preset_id ) {
		$document = $this->build_preset_document( $preset_id );

		if ( ! $document ) {
			return new WP_Error( 'xcopb_preset_not_found', __( 'Pre-made template not found.', 'xcodesol-page-builder' ) );
		}

		// Ensure the new template has the highest priority for its view type so it is immediately applied.
		$view_type        = isset( $document['template']['view_type'] ) ? $document['template']['view_type'] : 'shop';
		$existing_ids     = XCOPB_Registrar::get_templates_by_view_type( $view_type );
		$highest_priority = 10;
		foreach ( $existing_ids as $eid ) {
			$p = absint( get_post_meta( $eid, '_xcopb_priority', true ) );
			if ( $p >= $highest_priority ) {
				$highest_priority = $p + 5;
			}
		}
		$document['template']['priority'] = $highest_priority;

		$result = XCOSB_REST_Templates::instance()->import_document( $document );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return isset( $result['editUrl'] ) ? $result['editUrl'] : '';
	}

	/**
	 * Admin-post handler: apply a preset and jump straight into the builder
	 * for the newly created template.
	 */
	public function handle_apply_preset() {
		$preset_id = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce checked below.

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You do not have permission to apply templates.', 'xcodesol-page-builder' ) );
		}

		check_admin_referer( 'xcosb_apply_preset_' . $preset_id );

		$edit_url = $this->apply_preset( $preset_id );

		if ( is_wp_error( $edit_url ) || '' === $edit_url ) {
			$message = is_wp_error( $edit_url ) ? $edit_url->get_error_message() : __( 'Could not apply the pre-made template.', 'xcodesol-page-builder' );
			wp_die( esc_html( $message ) );
		}

		wp_safe_redirect( $edit_url );
		exit;
	}

	/**
	 * List-screen columns.
	 *
	 * @param array $columns Default columns.
	 * @return array
	 */
	public function list_columns( $columns ) {
		$new = array();

		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['xcosb_applied']    = __( 'Applied Status', 'xcodesol-page-builder' );
				$new['xcosb_view_type']  = __( 'Applies to', 'xcodesol-page-builder' );
				$new['xcosb_family']     = __( 'Family', 'xcodesol-page-builder' );
				$new['xcosb_blocks']     = __( 'Widgets', 'xcodesol-page-builder' );
			}
		}

		return $new;
	}

	/**
	 * List-screen column content.
	 *
	 * @param string $column  Column key.
	 * @param int    $post_id Post ID.
	 */
	public function list_column_content( $column, $post_id ) {
		if ( 'xcosb_applied' === $column ) {
			$slug = XCOPB_Registrar::get_field( $post_id, '_xcopb_preset_slug', '' );
			if ( ! $slug ) {
				echo '<span style="color:#94a3b8;">&mdash;</span>';
				return;
			}

			// Check if any published xcosb_template was created from this preset.
			$matching = get_posts( array(
				'post_type'              => XCOPB_Registrar::POST_TYPE,
				'post_status'            => 'publish',
				'posts_per_page'         => 1,
				'meta_key'               => '_xcopb_applied_preset', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'             => $slug, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
			) );

			if ( ! empty( $matching ) ) {
				$tid       = $matching[0];
				$is_active = '0' !== (string) get_post_meta( $tid, '_xcopb_is_active', true );
				if ( $is_active ) {
					$builder_url = add_query_arg(
						array(
							'post'     => $tid,
							'_wpnonce' => wp_create_nonce( 'xcosb_edit_builder_' . $tid ),
						),
						admin_url( 'admin.php?page=xcosb-builder' )
					);
					echo '<span class="xsb-badge xsb-badge--applied" style="display:inline-flex;align-items:center;gap:6px;background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:999px;font-weight:600;font-size:12px;"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a;"></span>' . esc_html__( 'Applied (Active)', 'xcodesol-page-builder' ) . '</span>';
					echo '<a href="' . esc_url( $builder_url ) . '" style="display:block;margin-top:4px;font-size:11px;font-weight:600;color:#2563eb;">' . esc_html__( 'Edit Template &rarr;', 'xcodesol-page-builder' ) . '</a>';
				} else {
					echo '<span class="xsb-badge" style="display:inline-flex;align-items:center;gap:6px;background:#fef3c7;color:#b45309;padding:3px 10px;border-radius:999px;font-weight:500;font-size:12px;"><span style="width:6px;height:6px;border-radius:50%;background:#d97706;"></span>' . esc_html__( 'Imported (Inactive)', 'xcodesol-page-builder' ) . '</span>';
				}
			} else {
				echo '<span class="xsb-badge xsb-badge--unapplied" style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#64748b;padding:3px 10px;border-radius:999px;font-weight:500;font-size:12px;"><span style="width:6px;height:6px;border-radius:50%;background:#94a3b8;"></span>' . esc_html__( 'Not Applied', 'xcodesol-page-builder' ) . '</span>';
			}
			return;
		}

		if ( 'xcosb_view_type' === $column ) {
			$view_type = XCOPB_Registrar::get_field( $post_id, '_xcopb_view_type', 'shop' );
			$options   = XCOPB_Registrar::get_view_type_options();
			echo '<span style="font-weight:600;color:#1e293b;">' . esc_html( isset( $options[ $view_type ] ) ? $options[ $view_type ] : $view_type ) . '</span>';
			return;
		}

		if ( 'xcosb_family' === $column ) {
			$family = XCOPB_Registrar::get_field( $post_id, '_xcopb_preset_family', '' );
			echo '<span style="display:inline-block;padding:2px 8px;background:#f1f5f9;color:#334155;border-radius:4px;font-size:12px;font-weight:500;">' . esc_html( $family ) . '</span>';
			return;
		}

		if ( 'xcosb_blocks' === $column ) {
			$layout = json_decode( XCOPB_Registrar::get_field( $post_id, '_xcopb_layout', '[]' ), true );
			$types  = array();

			if ( is_array( $layout ) ) {
				foreach ( $layout as $block ) {
					if ( isset( $block['type'] ) ) {
						$types[] = str_replace( 'xcosb/', '', $block['type'] );
					}
					if ( isset( $block['inner'] ) && is_array( $block['inner'] ) ) {
						foreach ( $block['inner'] as $column_blocks ) {
							if ( ! is_array( $column_blocks ) ) {
								continue;
							}
							foreach ( $column_blocks as $nested ) {
								if ( isset( $nested['type'] ) ) {
									$types[] = str_replace( 'xcosb/', '', $nested['type'] );
								}
							}
						}
					}
				}
			}

			echo esc_html( implode( ', ', array_unique( $types ) ) );
		}
	}

	/**
	 * Replace the preset row actions with a single "Use this template" action
	 * plus view — presets are applied, not edited in place.
	 *
	 * @param array   $actions Row actions.
	 * @param WP_Post $post    Current post.
	 * @return array
	 */
	public function row_actions( $actions, $post ) {
		if ( self::POST_TYPE !== $post->post_type ) {
			return $actions;
		}

		$apply_url = wp_nonce_url(
			admin_url( 'admin-post.php?action=xcosb_apply_preset&id=' . $post->ID ),
			'xcosb_apply_preset_' . $post->ID
		);

		$description = XCOPB_Registrar::get_field( $post->ID, '_xcopb_preset_description', '' );
		$slug        = XCOPB_Registrar::get_field( $post->ID, '_xcopb_preset_slug', '' );

		// Check if already applied.
		$is_applied = false;
		if ( $slug ) {
			$matching = get_posts( array(
				'post_type'      => XCOPB_Registrar::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => 1,
				'meta_key'       => '_xcopb_applied_preset', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'     => $slug, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'fields'         => 'ids',
				'no_found_rows'  => true,
			) );
			if ( ! empty( $matching ) ) {
				$is_applied = true;
				$builder_url = add_query_arg(
					array(
						'post'     => $matching[0],
						'_wpnonce' => wp_create_nonce( 'xcosb_edit_builder_' . $matching[0] ),
					),
					admin_url( 'admin.php?page=xcosb-builder' )
				);
			}
		}

		$new = array();
		if ( $is_applied ) {
			$new['xcosb_edit'] = '<a href="' . esc_url( $builder_url ) . '" style="color:#2563eb;font-weight:600;">' . esc_html__( 'Edit Active Template', 'xcodesol-page-builder' ) . '</a>';
			$new['xcosb_use']  = '<a href="' . esc_url( $apply_url ) . '" class="xsb-use-preset" title="' . esc_attr( $description ) . '">' . esc_html__( 'Apply Again (Duplicate)', 'xcodesol-page-builder' ) . '</a>';
		} else {
			$new['xcosb_use'] = '<a href="' . esc_url( $apply_url ) . '" class="xsb-use-preset" style="color:#16a34a;font-weight:600;" title="' . esc_attr( $description ) . '">' . esc_html__( 'Use this template', 'xcodesol-page-builder' ) . '</a>';
		}

		if ( $description ) {
			$new['xcosb_desc'] = '<span class="xsb-preset-desc" title="' . esc_attr( $description ) . '">' . esc_html__( 'Preview info', 'xcodesol-page-builder' ) . '</span>';
		}

		return $new;
	}
}
// Backward-compatibility class alias.
class_alias( 'XCOPB_Presets', 'XCOSB_Presets' );
