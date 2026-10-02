<?php
/**
 * Admin functionality for the template editor.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Admin
 */
class XCOPB_Admin {

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_Admin|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Admin
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
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'admin_post_xcopb_export_template', array( $this, 'handle_export_download' ) );
		add_action( 'admin_post_xcopb_preview', array( $this, 'handle_preview' ) );
		add_action( 'admin_post_xcosb_preview', array( $this, 'handle_preview' ) );
		add_action( 'admin_post_xcosb_export_template', array( $this, 'handle_export_download' ) );
		add_action( 'admin_post_xcosb_toggle_template_status', array( $this, 'handle_toggle_template_status' ) );
		add_action( 'admin_post_xcopb_toggle_template_status', array( $this, 'handle_toggle_template_status' ) );
		add_filter( 'manage_' . XCOPB_Registrar::POST_TYPE . '_posts_columns', array( $this, 'template_list_columns' ) );
		add_action( 'manage_' . XCOPB_Registrar::POST_TYPE . '_posts_custom_column', array( $this, 'template_list_column_content' ), 10, 2 );
		add_action( 'admin_notices', array( $this, 'display_template_notices' ) );
		add_filter( 'post_row_actions', array( $this, 'row_actions' ), 10, 2 );
		add_filter( 'page_row_actions', array( $this, 'row_actions' ), 10, 2 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_button' ) );
	}

	/**
	 * Top-level "Page Builder" menu.
	 *
	 * The plugin lives in its own admin menu (not inside WooCommerce) so it
	 * has room to grow: Templates is added by the post type itself, and
	 * future sections (Settings, Documentation, Add-ons…) can be appended
	 * here as further add_submenu_page() calls.
	 */
	public function register_menu() {
		add_menu_page(
			__( 'Page Builder', 'xcodesol-page-builder' ),
			__( 'Page Builder', 'xcodesol-page-builder' ),
			'edit_pages',
			'xcodesol-page-builder',
			array( $this, 'render_dashboard' ),
			'dashicons-layout',
			56
		);
		add_submenu_page( null, __( 'Page Builder', 'xcodesol-page-builder' ), __( 'Page Builder', 'xcodesol-page-builder' ), 'edit_pages', 'xcopb-builder', array( $this, 'render_builder_page' ) );
	}

	/**
	 * Get the frontend editor URL for a post or page (Elementor style).
	 *
	 * @param int $post_id Post ID.
	 * @return string URL to open the builder.
	 */
	public static function get_builder_edit_url( $post_id, $back_url = '' ) {
		$post_id = absint( $post_id );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return admin_url( 'edit.php' );
		}

		$nonce = wp_create_nonce( 'xcopb_edit_builder_' . $post_id );
		$args  = array(
			'xcopb_editor' => '1',
			'_wpnonce'     => $nonce,
		);
		if ( ! empty( $back_url ) ) {
			$args['back'] = $back_url;
		}

		// For public post types (pages, posts, etc.):
		// Link directly to the frontend URL with ?xcopb_editor=1 (Elementor style)!
		if ( XCOPB_Registrar::POST_TYPE !== $post->post_type && 'xcosb_template' !== $post->post_type ) {
			$permalink = get_permalink( $post_id );
			if ( $permalink ) {
				return add_query_arg( $args, $permalink );
			}
		}

		// Fallback for templates or drafts without permalink:
		$admin_args = array(
			'post'     => $post_id,
			'_wpnonce' => $nonce,
		);
		if ( ! empty( $back_url ) ) {
			$admin_args['back'] = $back_url;
		}

		return add_query_arg(
			$admin_args,
			admin_url( 'admin.php?page=xcopb-builder' )
		);
	}

	/**
	 * Render the full-screen builder inside the WordPress admin lifecycle.
	 */
	public function render_builder_page() {
		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- verified below.
		$post    = get_post( $post_id );
		if ( ! $post || ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'You are not allowed to edit this content.', 'xcodesol-page-builder' ) );
		}
		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, 'xcopb_edit_builder_' . $post_id ) ) {
			wp_die( esc_html__( 'Invalid builder request.', 'xcodesol-page-builder' ) );
		}

		// If this is a standard page or post, redirect directly to the frontend editor URL:
		if ( XCOPB_Registrar::POST_TYPE !== $post->post_type && 'xcosb_template' !== $post->post_type ) {
			$frontend_url = self::get_builder_edit_url( $post_id );
			if ( $frontend_url && false === strpos( $frontend_url, 'admin.php' ) ) {
				wp_safe_redirect( $frontend_url );
				exit;
			}
		}

		$back_url = isset( $_GET['back'] ) ? esc_url_raw( wp_unslash( $_GET['back'] ) ) : '';
		if ( empty( $back_url ) ) {
			if ( 'page' === $post->post_type ) {
				$back_url = admin_url( 'edit.php?post_type=page' );
			} elseif ( 'post' === $post->post_type ) {
				$back_url = admin_url( 'edit.php' );
			} elseif ( XCOPB_Registrar::POST_TYPE === $post->post_type ) {
				$back_url = admin_url( 'edit.php?post_type=' . XCOPB_Registrar::POST_TYPE );
			} else {
				$back_url = admin_url( 'edit.php?post_type=' . $post->post_type );
			}
		}
		$this->enqueue_builder_assets( $post_id, array( 'backUrl' => $back_url ) );
		show_admin_bar( false );
		wp_enqueue_script( 'xcopb-builder' );
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo( 'charset' ); ?>" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title><?php echo esc_html( sprintf( __( 'Editing: %s — Page Builder', 'xcodesol-page-builder' ), get_the_title( $post_id ) ) ); ?></title><?php wp_head(); ?></head>
		<body class="xcopb-builder-frame"><div id="xcopb-builder-root"></div><?php wp_footer(); ?></body></html>
		<?php
		exit;
	}

	/**
	 * Render the preview through admin-post.php instead of a directly loaded PHP file.
	 */
	public function handle_preview() {
		XCOPB_Preview::render();
	}

	/**
	 * Landing page for the top-level menu item — a small hub that links to
	 * the template list and future sections.
	 */
	public function render_dashboard() {
		$list_url     = admin_url( 'edit.php?post_type=' . XCOPB_Registrar::POST_TYPE );
		$add_url      = admin_url( 'post-new.php?post_type=' . XCOPB_Registrar::POST_TYPE );
		$presets_url  = admin_url( 'edit.php?post_type=' . XCOPB_Presets::POST_TYPE );
		$docs_text    = __( 'Design templates for your Shop, Category, Tag, Single Product, Cart and Checkout pages. Each template applies automatically where its conditions match.', 'xcodesol-page-builder' );
		?>
		<div class="wrap xsb-dashboard">
			<h1><?php echo esc_html__( 'Xcodesol Page Builder', 'xcodesol-page-builder' ); ?></h1>
			<p class="description"><?php echo esc_html( $docs_text ); ?></p>
			<div class="xsb-dashboard__cards" style="display:flex;gap:16px;margin-top:20px;flex-wrap:wrap;">
				<a class="xsb-dashboard__card" href="<?php echo esc_url( $list_url ); ?>" style="display:block;padding:24px;min-width:220px;background:#fff;border:1px solid #dcdcde;border-radius:10px;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,.05);">
					<span class="dashicons dashicons-welcome-view-site" style="font-size:28px;width:28px;height:28px;color:#2271b1;"></span>
					<strong style="display:block;margin-top:10px;color:#1d2327;"><?php echo esc_html__( 'Templates', 'xcodesol-page-builder' ); ?></strong>
					<span style="color:#646970;"><?php echo esc_html__( 'Manage and edit your saved page templates.', 'xcodesol-page-builder' ); ?></span>
				</a>
				<a class="xsb-dashboard__card" href="<?php echo esc_url( $add_url ); ?>" style="display:block;padding:24px;min-width:220px;background:#fff;border:1px solid #dcdcde;border-radius:10px;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,.05);">
					<span class="dashicons dashicons-plus-alt2" style="font-size:28px;width:28px;height:28px;color:#2271b1;"></span>
					<strong style="display:block;margin-top:10px;color:#1d2327;"><?php echo esc_html__( 'Add New Template', 'xcodesol-page-builder' ); ?></strong>
					<span style="color:#646970;"><?php echo esc_html__( 'Start a fresh template for any WooCommerce page.', 'xcodesol-page-builder' ); ?></span>
				</a>
				<a class="xsb-dashboard__card" href="<?php echo esc_url( $presets_url ); ?>" style="display:block;padding:24px;min-width:220px;background:#fff;border:1px solid #dcdcde;border-radius:10px;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,.05);">
					<span class="dashicons dashicons-portfolio" style="font-size:28px;width:28px;height:28px;color:#2271b1;"></span>
					<strong style="display:block;margin-top:10px;color:#1d2327;"><?php echo esc_html__( 'Pre-made Templates', 'xcodesol-page-builder' ); ?></strong>
					<span style="color:#646970;"><?php echo esc_html__( 'Apply a ready-made Shop, Category or Tag layout in one click.', 'xcodesol-page-builder' ); ?></span>
				</a>
			</div>
		</div>
		<?php
	}

	/**
	 * Register the builder meta box that hosts the React SPA.
	 */
	/**
	 * Register the builder meta box that hosts the React SPA or link to builder.
	 */
	public function add_meta_boxes() {
		$post_types   = get_post_types( array( 'public' => true ) );
		$post_types[] = XCOPB_Registrar::POST_TYPE;

		foreach ( array_unique( $post_types ) as $pt ) {
			add_meta_box(
				'xcopb_builder',
				__( 'Xcodesol Page Builder', 'xcodesol-page-builder' ),
				array( $this, 'render_meta_box' ),
				$pt,
				'side',
				'high'
			);
		}
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_assets( $hook ) {
		$screen = get_current_screen();

		if ( ! $screen ) {
			return;
		}

		if ( XCOPB_Registrar::POST_TYPE === $screen->post_type ) {
			// Template list screen: a small script that adds the Import button.
			if ( 'edit' === $screen->base ) {
				wp_enqueue_script(
					'xcosb-template-list',
					XCOPB_PLUGIN_URL . 'assets/admin/template-list.js',
					array( 'wp-api-fetch' ),
					XCOPB_VERSION,
					true
				);
				return;
			}
			wp_enqueue_style( 'xcopb-admin', XCOPB_PLUGIN_URL . 'assets/admin/builder.css', array( 'dashicons' ), XCOPB_VERSION );
			return;
		}

		// Also on standard post/page edit screens, enqueue admin css for the builder meta box.
		if ( 'post' === $screen->base ) {
			wp_enqueue_style( 'xcopb-admin', XCOPB_PLUGIN_URL . 'assets/admin/builder.css', array( 'dashicons' ), XCOPB_VERSION );
		}
	}

	/**
	 * Inject "Edit with Xcodesol" into the Gutenberg header toolbar.
	 */
	public function enqueue_block_editor_button() {
		$post = get_post();
		if ( ! $post || ! current_user_can( 'edit_post', $post->ID ) ) {
			return;
		}

		$builder_url = self::get_builder_edit_url( $post->ID );

		$script = sprintf(
			'(function(){
				window.addEventListener("DOMContentLoaded", function() {
					var check = setInterval(function() {
						var target = document.querySelector(".edit-post-header__settings") || document.querySelector(".editor-header__settings");
						if (target && !document.getElementById("xcopb-gutenberg-btn")) {
							clearInterval(check);
							var a = document.createElement("a");
							a.id = "xcopb-gutenberg-btn";
							a.href = %s;
							a.className = "components-button is-primary";
							a.style.marginRight = "8px";
							a.style.display = "inline-flex";
							a.style.alignItems = "center";
							a.style.gap = "4px";
							a.style.background = "#2563eb";
							a.style.borderColor = "#1d4ed8";
							a.style.textDecoration = "none";
							a.innerHTML = "<span class=\"dashicons dashicons-layout\" style=\"font-size:16px;width:16px;height:16px;line-height:1;\"></span> %s";
							target.insertBefore(a, target.firstChild);
						}
					}, 400);
					setTimeout(function(){ clearInterval(check); }, 8000);
				});
			})();',
			wp_json_encode( esc_url_raw( $builder_url ) ),
			esc_js( __( 'Edit with Xcodesol', 'xcodesol-page-builder' ) )
		);

		wp_add_inline_script( 'wp-edit-post', $script );
	}

	/**
	 * Enqueue the React builder SPA for a template or post.
	 *
	 * Shared by the admin meta box and the full-screen builder admin page.
	 *
	 * @param int   $post_id Template or post ID (0 = new template).
	 * @param array $extra   Extra config values merged into xcopbBuilderConfig.
	 * @return void
	 */
	public function enqueue_builder_assets( $post_id, $extra = array() ) {
		$post_id = absint( $post_id );

		$asset_file = XCOPB_PLUGIN_DIR . 'assets/admin/builder.asset.php';

		$deps      = array();
		$asset_ver = XCOPB_VERSION;

		if ( file_exists( $asset_file ) ) {
			$asset      = include $asset_file;
			$deps       = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
			$asset_ver  = isset( $asset['version'] ) ? $asset['version'] : XCOPB_VERSION;
		}

		if ( empty( $deps ) ) {
			$deps = array( 'wp-element', 'wp-components', 'wp-data', 'wp-i18n', 'wp-api-fetch', 'wp-hooks', 'react', 'react-dom' );
		}

		// Version the admin stylesheets by file mtime so every deploy busts the
		// browser cache (XCOPB_VERSION is constant between deploys).
		$admin_css_ver   = filemtime( XCOPB_PLUGIN_DIR . 'assets/admin/builder.css' );
		$popover_css_ver = filemtime( XCOPB_PLUGIN_DIR . 'assets/admin/popover.css' );
		wp_enqueue_style( 'dashicons' );
		wp_enqueue_style( 'wp-components' );
		if ( function_exists( 'wp_enqueue_code_editor' ) ) {
			wp_enqueue_code_editor( array( 'type' => 'text/css' ) );
		}
		$css_editor_settings = function_exists( 'wp_enqueue_code_editor' ) ? wp_enqueue_code_editor( array( 'type' => 'text/css' ) ) : false;
		$cm_settings = function_exists( 'wp_enqueue_code_editor' ) ? wp_enqueue_code_editor( array( 'type' => 'text/css' ) ) : false;
		if ( is_array( $css_editor_settings ) && is_array( $cm_settings ) && ! empty( $cm_settings['codemirror'] ) ) {
			$css_editor_settings['codemirror'] = $cm_settings['codemirror'];
			$css_editor_settings['codemirror']['mode'] = 'css';
		}
		wp_enqueue_style( 'xcopb-admin', XCOPB_PLUGIN_URL . 'assets/admin/builder.css', array( 'wp-components', 'dashicons' ), $admin_css_ver ? $admin_css_ver : XCOPB_VERSION );
		wp_enqueue_style( 'xcopb-admin-popover', XCOPB_PLUGIN_URL . 'assets/admin/popover.css', array( 'xcopb-admin' ), $popover_css_ver ? $popover_css_ver : XCOPB_VERSION );

		// Load the native WordPress media library so the builder's image and
		// video controls can use wp.media.
		if ( ! is_admin() ) {
			require_once ABSPATH . 'wp-admin/includes/template.php';
			require_once ABSPATH . 'wp-admin/includes/post.php';
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}
		wp_enqueue_media();

		// Load the classic WordPress editor (TinyMCE + Quicktags) so the Text
		// Widget block can edit its content with the default WP editor.
		if ( function_exists( 'wp_enqueue_editor' ) ) {
			wp_enqueue_editor();
		}

		wp_enqueue_script(
			'xcopb-builder',
			XCOPB_PLUGIN_URL . 'assets/admin/builder.js',
			$deps,
			$asset_ver,
			true
		);

		$view_type = $post_id ? XCOPB_Registrar::get_field( $post_id, '_xcopb_view_type', '' ) : '';
		$post_obj  = $post_id ? get_post( $post_id ) : null;
		if ( $post_obj && 'page' === $post_obj->post_type ) {
			$view_type = 'page';
		} elseif ( empty( $view_type ) && $post_obj ) {
			if ( 'page' === $post_obj->post_type ) {
				$view_type = 'page';
			} elseif ( 'post' === $post_obj->post_type ) {
				$view_type = 'single_post';
			} else {
				$view_type = 'page';
			}
		} elseif ( empty( $view_type ) ) {
			$view_type = 'page';
		}

		$view_url = ( $post_obj && 'publish' === $post_obj->post_status ) ? get_permalink( $post_id ) : $this->get_template_view_url( $view_type );
		$list_url = admin_url( 'edit.php?post_type=' . ( ( $post_obj && 'post' !== $post_obj->post_type ) ? $post_obj->post_type : '' ) );

		$config = array(
			'restUrl'           => esc_url_raw( rest_url( 'xcopb/v1/templates' ) ),
			'restNonce'         => wp_create_nonce( 'wp_rest' ),
			'previewUrl'        => esc_url_raw( admin_url( 'admin-post.php?action=xcopb_preview' ) ),
			'previewNonce'      => wp_create_nonce( 'xcopb_preview' ),
			'listUrl'           => esc_url_raw( $list_url ),
			'templateId'        => $post_id,
			'viewType'          => $view_type,
			'viewUrl'           => esc_url_raw( $view_url ),
			'viewOptions'       => XCOPB_Registrar::get_view_type_options(),
			'productAttributes' => $this->get_product_attribute_options(),
			'acfImageFields'   => $this->get_acf_image_fields( $post_id ),
			'featuredImageUrl' => $post_id && has_post_thumbnail( $post_id ) ? (string) get_the_post_thumbnail_url( $post_id, 'medium' ) : '',
			'fontOptions'       => $this->get_theme_font_options(),
			'siteSettings'      => $this->get_site_settings(),
			'isWordPressPage'   => $post_obj && 'page' === $post_obj->post_type,
			'canManageSiteSettings' => current_user_can( 'manage_options' ),
			'pageTemplateOptions' => $post_obj && 'page' === $post_obj->post_type ? $this->get_page_template_options( $post_obj ) : array(),
			'cssEditorSettings' => $css_editor_settings ? $css_editor_settings : array(),
		);

		if ( is_array( $extra ) && ! empty( $extra ) ) {
			$config = array_merge( $config, $extra );
		}

		wp_localize_script( 'xcopb-builder', 'xcopbBuilderConfig', $config );
		wp_localize_script( 'xcopb-builder', 'xcosbBuilderConfig', $config );

		if ( function_exists( 'wp_set_script_translations' ) ) {
			wp_set_script_translations( 'xcopb-builder', 'xcodesol-page-builder', XCOPB_PLUGIN_DIR . 'languages' );
		}
	}

	/**
	 * Get page layouts available to a real WordPress page.
	 *
	 * @param WP_Post $post Page being edited.
	 * @return array[]
	 */
	private function get_page_template_options( $post ) {
		$options = array(
			array( 'value' => '', 'label' => __( 'Default', 'xcodesol-page-builder' ) ),
			array( 'value' => 'elementor_canvas', 'label' => __( 'Elementor Canvas', 'xcodesol-page-builder' ) ),
			array( 'value' => 'elementor_header_footer', 'label' => __( 'Elementor Full Width', 'xcodesol-page-builder' ) ),
		);

		if ( function_exists( 'get_page_templates' ) ) {
			$templates = get_page_templates( $post );
			foreach ( $templates as $slug => $label ) {
				if ( in_array( $slug, array( 'elementor_canvas', 'elementor_header_footer', 'xcopb_canvas', 'xcopb_full_width' ), true ) ) {
					continue;
				}
				$options[] = array(
					'value' => sanitize_text_field( $slug ),
					'label' => sanitize_text_field( $label ),
				);
			}
		}

		return $options;
	}

	/**
	 * Return registered ACF image fields and a preview for the edited post.
	 *
	 * @param int $post_id Current post ID.
	 * @return array[]
	 */
	private function get_acf_image_fields( $post_id ) {
		if ( ! function_exists( 'acf_get_field_groups' ) || ! function_exists( 'acf_get_fields' ) ) {
			return array();
		}

		$fields = array();
		foreach ( acf_get_field_groups() as $group ) {
			if ( empty( $group['key'] ) ) {
				continue;
			}
			$group_fields = acf_get_fields( $group['key'] );
			if ( ! is_array( $group_fields ) ) {
				continue;
			}

			foreach ( $group_fields as $field ) {
				if ( empty( $field['name'] ) || 'image' !== ( $field['type'] ?? '' ) ) {
					continue;
				}

				$name = sanitize_text_field( $field['name'] );
				$value = $post_id && function_exists( 'get_field' ) ? get_field( $name, $post_id ) : null;
				$preview_url = '';
				if ( is_array( $value ) ) {
					$preview_url = isset( $value['url'] ) ? esc_url_raw( $value['url'] ) : '';
					$image_id = absint( $value['ID'] ?? $value['id'] ?? 0 );
					if ( ! $preview_url && $image_id ) {
						$preview_url = (string) wp_get_attachment_image_url( $image_id, 'medium' );
					}
				} elseif ( is_numeric( $value ) ) {
					$preview_url = (string) wp_get_attachment_image_url( absint( $value ), 'medium' );
				} elseif ( is_string( $value ) ) {
					$preview_url = esc_url_raw( $value );
				}

				$label = isset( $field['label'] ) ? sanitize_text_field( $field['label'] ) : $name;
				$fields[ $name ] = array(
					'name'        => $name,
					'label'       => $label,
					'preview_url' => $preview_url,
				);
			}
		}

		return array_values( $fields );
	}

	/** Return persisted site-wide builder design settings. */
	private function get_site_settings() {
		$theme = function_exists( 'wp_get_global_settings' ) ? wp_get_global_settings() : array();
		$theme_styles = function_exists( 'wp_get_global_styles' ) ? wp_get_global_styles() : array();
		$palette = isset( $theme['color']['palette']['theme'] ) && is_array( $theme['color']['palette']['theme'] ) ? $theme['color']['palette']['theme'] : array();
		$pick = static function ( $needles, $fallback ) use ( $palette ) { foreach ( $palette as $item ) { $name = strtolower( isset( $item['slug'] ) ? $item['slug'] : ( isset( $item['name'] ) ? $item['name'] : '' ) ); foreach ( $needles as $needle ) { if ( $name && false !== strpos( $name, $needle ) && ! empty( $item['color'] ) ) { return $item['color']; } } } return $fallback; };
		$body_font = isset( $theme_styles['typography']['fontFamily'] ) ? $theme_styles['typography']['fontFamily'] : ( isset( $theme['typography']['fontFamilies']['theme'][0]['fontFamily'] ) ? $theme['typography']['fontFamilies']['theme'][0]['fontFamily'] : 'system-ui' );
		$heading_font = isset( $theme_styles['elements']['heading']['typography']['fontFamily'] ) ? $theme_styles['elements']['heading']['typography']['fontFamily'] : $body_font;
		$theme_text = isset( $theme_styles['color']['text'] ) ? $theme_styles['color']['text'] : get_theme_mod( 'body_text_color', get_theme_mod( 'text_color', '#172033' ) );
		$theme_background = isset( $theme_styles['color']['background'] ) ? $theme_styles['color']['background'] : ( get_theme_mod( 'background_color', '#ffffff' ) ?: '#ffffff' );
		$theme_type = isset( $theme_styles['typography'] ) && is_array( $theme_styles['typography'] ) ? $theme_styles['typography'] : array();
		$theme_button = isset( $theme_styles['elements']['button'] ) && is_array( $theme_styles['elements']['button'] ) ? $theme_styles['elements']['button'] : array();
		$theme_body_px = isset( $theme_type['fontSize'] ) ? (float) $theme_type['fontSize'] : 16;
		if ( $theme_body_px < 10 || $theme_body_px > 48 ) { $theme_body_px = 16; }
		$theme_button_text = isset( $theme_button['color']['text'] ) ? $theme_button['color']['text'] : '#ffffff';
		$theme_button_background = isset( $theme_button['color']['background'] ) ? $theme_button['color']['background'] : $pick( array( 'primary', 'accent' ), '#6c63ff' );
		$theme_button_radius = isset( $theme_button['border']['radius'] ) && is_numeric( $theme_button['border']['radius'] ) ? (float) $theme_button['border']['radius'] : 6;
		$defaults = array(
			'global_colors' => array( 'primary' => $pick( array( 'primary', 'accent' ), get_theme_mod( 'primary_color', get_theme_mod( 'accent_color', '#6c63ff' ) ) ), 'secondary' => $pick( array( 'secondary' ), get_theme_mod( 'secondary_color', '#292d50' ) ), 'text' => $theme_text, 'accent' => $pick( array( 'accent', 'tertiary' ), get_theme_mod( 'accent_color', '#18a0fb' ) ), 'background' => $theme_background ),
			'global_fonts' => array( 'body' => $body_font, 'heading' => $heading_font ),
			'typography' => array( 'body_size' => $theme_body_px, 'body_weight' => isset( $theme_type['fontWeight'] ) ? (string) $theme_type['fontWeight'] : '400', 'line_height' => isset( $theme_type['lineHeight'] ) ? (float) $theme_type['lineHeight'] : 1.6, 'paragraph_spacing' => 16 ),
			'button_style' => array( 'text' => $theme_button_text, 'background' => $theme_button_background, 'hover_text' => '#ffffff', 'hover_background' => '#5148d8', 'gradient_enabled' => false, 'hover_gradient_enabled' => false, 'gradient' => array(), 'hover_gradient' => array(), 'size' => 'medium', 'font_size' => 16, 'radius' => array( 'top' => $theme_button_radius, 'right' => $theme_button_radius, 'bottom' => $theme_button_radius, 'left' => $theme_button_radius, 'unit' => 'px', 'isLinked' => true ), 'border_width' => array( 'top' => 0, 'right' => 0, 'bottom' => 0, 'left' => 0, 'unit' => 'px', 'isLinked' => true ), 'border_style' => 'solid', 'border_color' => '', 'padding' => array( 'top' => 12, 'right' => 24, 'bottom' => 12, 'left' => 24, 'unit' => 'px', 'isLinked' => false ), 'padding_y' => 12, 'padding_x' => 24, 'shadow_preset' => 'none', 'shadow' => 'none' ),
			'background_image' => array(), 'background_image_style' => array( 'size' => 'cover', 'repeat' => 'no-repeat', 'position' => 'center center', 'attachment' => 'scroll', 'overlay' => '', 'overlay_opacity' => 0 ),
			'custom_colors' => array(), 'custom_css' => '',
		);
		$saved = get_option( 'xcopb_site_settings', array() );
		return is_array( $saved ) ? array_replace_recursive( $defaults, $saved ) : $defaults;
	}

	/**
	 * Font families for the style popovers' font dropdown.
	 *
	 * Lists the fonts actually used by the active theme (Google Fonts
	 * requested by the theme/plugins plus font-family declarations found in
	 * the theme's CSS), followed by the standard web-safe system stacks.
	 * Custom fonts (uploaded) are planned later.
	 *
	 * @return array[] Each entry: { label: string, value: string }.
	 */
	private function get_theme_font_options() {
		$fonts = array();

		// Google Fonts requested by the theme/plugins (functions.php)
		// and @import statements inside the theme CSS.
		foreach ( $this->scan_theme_sources() as $raw ) {
			if ( preg_match_all( '/family=([^&"\'\s]+)/i', $raw, $matches ) ) {
				foreach ( $matches[1] as $family ) {
					$name = rawurldecode( $family );
					$name = str_replace( array( '+', '%20' ), ' ', $name );
					$name = preg_split( '/[:@|]/', $name );
					$name = trim( $name[0] );

					if ( $name ) {
						$fonts[ $name ] = array(
							'label' => $name,
						'value' => '"' . $name . '", sans-serif',
						);
					}
				}
			}

			// Plain font-family declarations from theme CSS.
			if ( preg_match_all( '/font-family\s*:\s*([^;}{]+)/i', $raw, $css_matches ) ) {
				foreach ( $css_matches[1] as $stack ) {
					$stack = trim( preg_replace( '/\s+/', ' ', $stack ) );
					$first = $stack;
					if ( preg_match( '/^(["\'])?(.+?)\1/', $stack, $m ) ) {
						$first = trim( $m[2], "\"'" );
					}
					if ( $first && false === strpos( $first, 'var(' ) && false === strpos( $first, 'inherit' ) ) {
						$fonts[ $first ] = array(
							'label' => $first,
							'value' => $stack,
						);
					}
				}
			}
		}

		$system = array(
			__( 'Arial, Helvetica', 'xcodesol-page-builder' )   => 'Arial, Helvetica, sans-serif',
			__( 'Verdana, Geneva', 'xcodesol-page-builder' )    => 'Verdana, Geneva, sans-serif',
			__( 'Tahoma', 'xcodesol-page-builder' )             => 'Tahoma, Geneva, sans-serif',
			__( 'Trebuchet MS', 'xcodesol-page-builder' )       => '"Trebuchet MS", Helvetica, sans-serif',
			__( 'Georgia, serif', 'xcodesol-page-builder' )     => 'Georgia, "Times New Roman", serif',
			__( 'Times New Roman', 'xcodesol-page-builder' )    => '"Times New Roman", Times, serif',
			__( 'Courier New, monospace', 'xcodesol-page-builder' ) => '"Courier New", Courier, monospace',
			__( 'Impact', 'xcodesol-page-builder' )             => 'Impact, Charcoal, sans-serif',
		);

		$options = array();
		$seen    = array();

		foreach ( array_merge( $fonts, $system ) as $label => $entry ) {
			$value = is_array( $entry ) ? $entry['value'] : $entry;
			$label = is_array( $entry ) ? $entry['label'] : $label;

			if ( isset( $seen[ $value ] ) ) {
				continue;
			}

			$seen[ $value ] = true;
			$options[] = array(
				'label' => $label,
				'value' => $value,
			);
		}

		return array_slice( $options, 0, 60 );
	}

	/**
	 * Scan the active theme (PHP + CSS files) for Google Fonts requests and
	 * font-family declarations so the font dropdown reflects the fonts that
	 * are actually applied on the front end.
	 *
	 * @return string[] File contents worth scanning.
	 */
	private function scan_theme_sources() {
		$sources = array();
		$dir     = get_stylesheet_directory();

		if ( ! $dir || ! is_dir( $dir ) ) {
			return $sources;
		}

		$root = realpath( $dir );

		foreach ( new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root ) ) as $file ) {
			if ( ! $file instanceof SplFileInfo || ! $file->isFile() ) {
				continue;
			}

			$ext = strtolower( $file->getExtension() );

			if ( ! in_array( $ext, array( 'php', 'css' ), true ) ) {
				continue;
			}

			$path = realpath( $file->getPathname() );

			if ( ! $path || 0 !== strpos( $path, $root ) ) {
				continue;
			}

			// Skip node_modules / vendor / build outputs.
			if ( false !== strpos( $path, '/node_modules/' ) || false !== strpos( $path, '/vendor/' ) ) {
				continue;
			}

			$content = file_get_contents( $path );

			if ( $content && false !== $content ) {
				$sources[] = $content;
			}

			// Keep the scan bounded.
			if ( count( $sources ) >= 80 ) {
				break;
			}
		}

		return $sources;
	}

	/**
	 * Front-end URL a template of the given view type renders on, used by the
	 * builder's "view" button to open the live page in a new tab.
	 *
	 * @param string $view_type View type slug.
	 * @return string
	 */
	private function get_template_view_url( $view_type ) {
		$fallback = home_url( '/' );

		if ( ! function_exists( 'wc_get_page_id' ) ) {
			return $fallback;
		}

		switch ( $view_type ) {
			case 'cart':
				return function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : $fallback;

			case 'checkout':
				return function_exists( 'wc_get_checkout_url' ) ? wc_get_checkout_url() : $fallback;

			case 'single_product':
				$ids = wc_get_products( array( 'limit' => 1, 'status' => 'publish', 'return' => 'ids' ) );
				return ! empty( $ids ) ? get_permalink( $ids[0] ) : get_permalink( wc_get_page_id( 'shop' ) );

			case 'product_category':
				$terms = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => true, 'number' => 1 ) );
				if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
					$link = get_term_link( $terms[0] );
					return is_wp_error( $link ) ? $fallback : $link;
				}
				return get_permalink( wc_get_page_id( 'shop' ) );

			case 'product_tag':
				$terms = get_terms( array( 'taxonomy' => 'product_tag', 'hide_empty' => true, 'number' => 1 ) );
				if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
					$link = get_term_link( $terms[0] );
					return is_wp_error( $link ) ? $fallback : $link;
				}
				return get_permalink( wc_get_page_id( 'shop' ) );

			case 'product_archive':
			case 'product_card':
			default:
				return get_permalink( wc_get_page_id( 'shop' ) );
		}
	}

	/**
	 * List of WooCommerce global attribute taxonomies (pa_*) for the product
	 * attributes block selector.
	 *
	 * @return array[] Each entry: { label: string, value: string }.
	 */
	private function get_product_attribute_options() {
		$options = array();

		if ( ! function_exists( 'wc_get_attribute_taxonomies' ) ) {
			return $options;
		}

		foreach ( wc_get_attribute_taxonomies() as $tax ) {
			$options[] = array(
				'label' => $tax->attribute_label,
				'value' => 'pa_' . $tax->attribute_name,
			);
		}

		return $options;
	}

	/**
	 * Columns for the template post type list table.
	 *
	 * @param array $columns Existing columns.
	 * @return array
	 */
	public function template_list_columns( $columns ) {
		$new = array();

		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['xcopb_shortcode'] = __( 'Shortcode', 'xcodesol-page-builder' );
				$new['xcopb_status']    = __( 'Applied Status', 'xcodesol-page-builder' );
				$new['xcopb_view_type'] = __( 'Applies To', 'xcodesol-page-builder' );
				$new['xcopb_preset']    = __( 'Source Preset', 'xcodesol-page-builder' );
				$new['xcopb_priority']  = __( 'Priority', 'xcodesol-page-builder' );
			}
		}

		return $new;
	}

	/**
	 * Content for custom columns on template post type list table.
	 *
	 * @param string $column  Column name.
	 * @param int    $post_id Post ID.
	 */
	public function template_list_column_content( $column, $post_id ) {
		if ( 'xcopb_shortcode' === $column ) {
			$sc = '[xcodesol_page_builder id="' . absint( $post_id ) . '"]';
			echo '<code class="xcopb-shortcode-snippet" style="cursor:pointer;background:#f1f5f9;padding:4px 8px;border-radius:4px;user-select:all;display:inline-block;font-size:12px;" title="' . esc_attr__( 'Click to copy shortcode', 'xcodesol-page-builder' ) . '" onclick="navigator.clipboard.writeText(this.innerText);alert(\'Shortcode copied!\');">' . esc_html( $sc ) . '</code>';
			return;
		}

		if ( 'xcopb_status' === $column ) {
			$is_active_meta = get_post_meta( $post_id, '_xcopb_is_active', true );
			$is_active      = '0' !== (string) $is_active_meta;
			$post_status    = get_post_status( $post_id );

			if ( 'publish' === $post_status && $is_active ) {
				echo '<span class="xsb-badge xsb-badge--applied" style="display:inline-flex;align-items:center;gap:6px;background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:999px;font-weight:600;font-size:12px;"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a;"></span>' . esc_html__( 'Applied (Active)', 'xcodesol-page-builder' ) . '</span>';
			} elseif ( 'publish' === $post_status ) {
				echo '<span class="xsb-badge xsb-badge--unapplied" style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#64748b;padding:3px 10px;border-radius:999px;font-weight:500;font-size:12px;"><span style="width:6px;height:6px;border-radius:50%;background:#94a3b8;"></span>' . esc_html__( 'Not Applied', 'xcodesol-page-builder' ) . '</span>';
			} else {
				echo '<span class="xsb-badge xsb-badge--draft" style="display:inline-flex;align-items:center;gap:6px;background:#fef3c7;color:#b45309;padding:3px 10px;border-radius:999px;font-weight:500;font-size:12px;">' . esc_html__( 'Draft (Inactive)', 'xcodesol-page-builder' ) . '</span>';
			}
			return;
		}

		if ( 'xcopb_view_type' === $column ) {
			$view_type = XCOPB_Registrar::get_field( $post_id, '_xcopb_view_type', 'shop' );
			$options   = XCOPB_Registrar::get_view_type_options();
			$label     = isset( $options[ $view_type ] ) ? $options[ $view_type ] : $view_type;
			echo '<span style="font-weight:600;color:#1e293b;">' . esc_html( $label ) . '</span>';
			return;
		}

		if ( 'xcopb_preset' === $column ) {
			$preset_slug = get_post_meta( $post_id, '_xcopb_applied_preset', true );
			if ( $preset_slug ) {
				$title = ucwords( str_replace( array( '-', '_' ), ' ', $preset_slug ) );
				echo '<span style="display:inline-block;padding:2px 8px;background:#eef2ff;color:#3730a3;border-radius:4px;font-size:12px;font-weight:500;">' . esc_html( $title ) . '</span>';
			} else {
				echo '<span style="color:#94a3b8;">&mdash;</span>';
			}
			return;
		}

		if ( 'xcopb_priority' === $column ) {
			$priority = absint( XCOPB_Registrar::get_field( $post_id, '_xcopb_priority', 10 ) );
			echo '<span style="display:inline-block;padding:2px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;font-weight:600;font-size:12px;color:#475569;">' . esc_html( $priority ) . '</span>';
			return;
		}
	}

	/**
	 * Toggle template active/applied status from the template list.
	 */
	public function handle_toggle_template_status() {
		$id     = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$status = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( ! current_user_can( 'edit_pages' ) && ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to modify template status.', 'xcodesol-page-builder' ) );
		}

		if ( ! check_admin_referer( 'xcopb_toggle_status_' . $id, '_wpnonce', false ) && ! check_admin_referer( 'xcosb_toggle_status_' . $id, '_wpnonce', false ) ) {
			wp_die( esc_html__( 'Security check failed.', 'xcodesol-page-builder' ) );
		}

		$post = get_post( $id );
		if ( ! $post || XCOPB_Registrar::POST_TYPE !== $post->post_type ) {
			wp_die( esc_html__( 'Template not found.', 'xcodesol-page-builder' ) );
		}

		if ( 'activate' === $status ) {
			update_post_meta( $id, '_xcopb_is_active', '1' );
			$msg = 'applied';
		} else {
			update_post_meta( $id, '_xcopb_is_active', '0' );
			$msg = 'unapplied';
		}

		wp_safe_redirect( add_query_arg(
			array(
				'post_type'     => XCOPB_Registrar::POST_TYPE,
				'xcopb_message' => $msg,
			),
			admin_url( 'edit.php' )
		) );
		exit;
	}

	/**
	 * Display admin notices after template status toggle.
	 */
	public function display_template_notices() {
		$screen = get_current_screen();
		if ( ! $screen || 'edit-' . XCOPB_Registrar::POST_TYPE !== $screen->id ) {
			return;
		}

		if ( empty( $_GET['xcopb_message'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$msg = sanitize_key( $_GET['xcopb_message'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'applied' === $msg ) {
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Template applied and activated successfully! It is now used on matching pages.', 'xcodesol-page-builder' ) . '</p></div>';
		} elseif ( 'unapplied' === $msg ) {
			echo '<div class="notice notice-warning is-dismissible"><p>' . esc_html__( 'Template unapplied / deactivated. It will not be rendered on the site.', 'xcodesol-page-builder' ) . '</p></div>';
		}
	}

	/**
	 * Add row actions on the template list screen.
	 *
	 * @param array    $actions Row actions.
	 * @param WP_Post  $post    Current post.
	 * @return array
	 */
	/**
	 * Add row actions on template, page, and post list screens ("Edit with Xcodesol").
	 *
	 * @param array   $actions Row actions.
	 * @param WP_Post $post    Current post.
	 * @return array
	 */
	public function row_actions( $actions, $post ) {
		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return $actions;
		}

		if ( XCOPB_Registrar::POST_TYPE === $post->post_type ) {
			$is_active_meta = get_post_meta( $post->ID, '_xcopb_is_active', true );
			$is_active      = '0' !== (string) $is_active_meta;

			$builder_url = self::get_builder_edit_url( $post->ID );

			$new_actions = array();
			$new_actions['xcopb_builder'] = '<a href="' . esc_url( $builder_url ) . '" style="color:#2563eb;font-weight:600;">' . esc_html__( 'Edit with Xcodesol', 'xcodesol-page-builder' ) . '</a>';

			if ( $is_active ) {
				$toggle_url = wp_nonce_url(
					admin_url( 'admin-post.php?action=xcopb_toggle_template_status&id=' . $post->ID . '&status=deactivate' ),
					'xcosb_toggle_status_' . $post->ID
				);
				$new_actions['xcosb_toggle'] = '<a href="' . esc_url( $toggle_url ) . '" style="color:#b45309;" title="' . esc_attr__( 'Temporarily deactivate this template so it will not apply on the site', 'xcodesol-page-builder' ) . '">' . esc_html__( 'Deactivate / Unapply', 'xcodesol-page-builder' ) . '</a>';
			} else {
				$toggle_url = wp_nonce_url(
					admin_url( 'admin-post.php?action=xcopb_toggle_template_status&id=' . $post->ID . '&status=activate' ),
					'xcosb_toggle_status_' . $post->ID
				);
				$new_actions['xcosb_toggle'] = '<a href="' . esc_url( $toggle_url ) . '" style="color:#15803d;font-weight:600;" title="' . esc_attr__( 'Apply and activate this template on the site', 'xcodesol-page-builder' ) . '">' . esc_html__( 'Apply / Set Active', 'xcodesol-page-builder' ) . '</a>';
			}

			$export_url = wp_nonce_url(
				admin_url( 'admin-post.php?action=xcopb_export_template&id=' . $post->ID ),
				'xcopb_export_template_' . $post->ID
			);
			$new_actions['xcosb_export'] = '<a href="' . esc_url( $export_url ) . '">' . esc_html__( 'Export JSON', 'xcodesol-page-builder' ) . '</a>';

			return array_merge( $new_actions, $actions );
		}

		$allowed_types = get_post_types( array( 'public' => true ) );
		if ( ! in_array( $post->post_type, $allowed_types, true ) ) {
			return $actions;
		}

		$builder_url = self::get_builder_edit_url( $post->ID );

		$new_actions = array(
			'xcopb_builder' => sprintf(
				'<a href="%s" style="color:#2563eb;font-weight:600;">%s</a>',
				esc_url( $builder_url ),
				esc_html__( 'Edit with Xcodesol', 'xcodesol-page-builder' )
			),
		);

		// Place "Edit with Xcodesol" right after "Edit" if present.
		if ( isset( $actions['edit'] ) ) {
			$pos = array_search( 'edit', array_keys( $actions ), true );
			return array_merge(
				array_slice( $actions, 0, $pos + 1, true ),
				$new_actions,
				array_slice( $actions, $pos + 1, null, true )
			);
		}

		return array_merge( $new_actions, $actions );
	}

	/**
	 * Backward compatibility alias for template_row_actions.
	 *
	 * @param array   $actions Row actions.
	 * @param WP_Post $post    Current post.
	 * @return array
	 */
	public function template_row_actions( $actions, $post ) {
		return $this->row_actions( $actions, $post );
	}

	/**
	 * Stream a template as a downloadable .json file (list-screen export).
	 */
	public function handle_export_download() {
		$id = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- checked below.

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You do not have permission to export templates.', 'xcodesol-page-builder' ) );
		}

		check_admin_referer( 'xcopb_export_template_' . $id );

		$post = get_post( $id );

		if ( ! $post || XCOPB_Registrar::POST_TYPE !== $post->post_type ) {
			wp_die( esc_html__( 'Template not found.', 'xcodesol-page-builder' ) );
		}

		$document = XCOSB_REST_Templates::instance()->build_export_document( $post->ID );
		$slug     = sanitize_title( $post->post_title );

		nocache_headers();
		header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . ( $slug ? $slug : 'template' ) . '.xcosb.json"' );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON document, not HTML.
		echo wp_json_encode( $document, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

		exit;
	}

	/**
	 * Render the meta box container.
	 *
	 * Editing happens in the dedicated full-screen builder page
	 * (opened in a new tab) instead of inline in the WordPress post screen.
	 *
	 * @param WP_Post $post Current post object.
	 */
	public function render_meta_box( $post ) {
		$post_id  = absint( $post->ID );
		$back_url = admin_url( 'edit.php?post_type=' . ( ( 'post' !== $post->post_type ) ? $post->post_type : '' ) );

		$edit_url = self::get_builder_edit_url( $post_id, $back_url );

		$has_layout = ! empty( get_post_meta( $post_id, '_xcopb_layout', true ) ) && '[]' !== get_post_meta( $post_id, '_xcopb_layout', true );
		?>
		<div class="xsb-admin-open-builder xcopb-admin-open-builder" style="text-align:center;padding:12px 6px;">
			<p class="xsb-admin-open-builder__desc" style="margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.4;">
				<?php
				if ( $has_layout ) {
					esc_html_e( 'This item is designed with Xcodesol Page Builder.', 'xcodesol-page-builder' );
				} else {
					esc_html_e( 'Design and build this page visually with drag and drop widgets.', 'xcodesol-page-builder' );
				}
				?>
			</p>
			<a class="button button-primary button-large xsb-admin-open-builder__btn" href="<?php echo esc_url( $edit_url ); ?>" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;height:38px;font-weight:600;background:#2563eb;border-color:#1d4ed8;box-shadow:0 2px 4px rgba(37,99,235,0.25);">
				<span class="dashicons dashicons-layout" aria-hidden="true" style="font-size:18px;width:18px;height:18px;"></span>
				<span><?php esc_html_e( 'Edit with Xcodesol', 'xcodesol-page-builder' ); ?></span>
			</a>
		</div>
		<?php
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Admin', 'XCOSB_Admin' );
