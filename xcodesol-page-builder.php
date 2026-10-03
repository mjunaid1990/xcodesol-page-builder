<?php
/**
 * Plugin Name: Xcodesol Page Builder
 * Plugin URI: https://wordpress.org/plugins/xcodesol-page-builder/
 * Description: Visually design your WordPress pages, landing pages, and sections with a drag-and-drop page builder. Style every widget, make it responsive, embed via shortcodes, and save reusable templates.
 * Version: 2.2.0
 * Author: Xcodesol
 * Author URI: https://profiles.wordpress.org/xcodesol/
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: xcodesol-page-builder
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Main plugin class.
 */
final class Xcodesol_Page_Builder {

	/**
	 * Plugin version.
	 *
	 * @var string
	 */
	const VERSION = "2.2.0";

	/**
	 * Plugin instance.
	 *
	 * @var Xcodesol_Page_Builder|null
	 */
	private static $instance = null;

	/**
	 * Get plugin instance.
	 *
	 * @return Xcodesol_Page_Builder
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
		$this->define_constants();
		$this->load_dependencies();
		$this->init_hooks();
	}

	/**
	 * Define plugin constants.
	 */
	private function define_constants() {
		define( 'XCOPB_VERSION', self::VERSION );
		define( 'XCOPB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
		define( 'XCOPB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
		define( 'XCOPB_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

		// Backward-compatibility aliases for constants.
		if ( ! defined( 'XCOSB_VERSION' ) ) {
			define( 'XCOSB_VERSION', XCOPB_VERSION );
		}
		if ( ! defined( 'XCOSB_PLUGIN_DIR' ) ) {
			define( 'XCOSB_PLUGIN_DIR', XCOPB_PLUGIN_DIR );
		}
		if ( ! defined( 'XCOSB_PLUGIN_URL' ) ) {
			define( 'XCOSB_PLUGIN_URL', XCOPB_PLUGIN_URL );
		}
		if ( ! defined( 'XCOSB_PLUGIN_BASENAME' ) ) {
			define( 'XCOSB_PLUGIN_BASENAME', XCOPB_PLUGIN_BASENAME );
		}
	}

	/**
	 * Load required files.
	 */
	private function load_dependencies() {
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-registrar.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-sanitizer.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-svg-upload.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-motion-presets.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-style-engine.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-conditions.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-template-loader.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-block-registry.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-renderer.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-rest-templates.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-preview.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-presets.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/class-xcopb-migrator.php';
		require_once XCOPB_PLUGIN_DIR . 'includes/admin/class-xcopb-admin.php';
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );

		// Rewrite legacy `wtb_*` / `xsb_*` / `xcosb_*` data to `xcopb_*` before any template query runs.
		add_action( 'plugins_loaded', array( $this, 'maybe_run_migration' ), 5 );
		add_action( 'init', array( $this, 'init' ), 1 );
	}

	/**
	 * Plugin initialization.
	 */
	public function init() {
		XCOPB_SVG_Upload::init();
		XCOPB_Registrar::instance();
		XCOPB_Conditions::instance();
		XCOPB_Block_Registry::instance()->register_defaults();
		XCOPB_Template_Loader::instance();
		XCOPB_Renderer::instance();
		XCOPB_REST_Templates::instance();
		XCOPB_Presets::instance();
		XCOPB_Admin::instance();

		$this->register_shortcodes();
	}

	/**
	 * Register template embed shortcodes.
	 */
	private function register_shortcodes() {
		$shortcode_handler = array( 'XCOPB_Renderer', 'shortcode' );

		// Modern shortcodes.
		add_shortcode( 'xcodesol_page_builder', $shortcode_handler );
		add_shortcode( 'xcopb_template', $shortcode_handler );

		// Legacy aliases.
		add_shortcode( 'xcodesol_shop_builder', $shortcode_handler );
		add_shortcode( 'xcosb_template', $shortcode_handler );
		add_shortcode( 'xsb_template', $shortcode_handler );
	}

	/**
	 * Run the one-time data migration for rebrands and schema updates.
	 *
	 * @return void
	 */
	public function maybe_run_migration() {
		if ( class_exists( 'XCOPB_Migrator' ) ) {
			XCOPB_Migrator::maybe_migrate();
		}
	}

	/**
	 * Plugin activation.
	 */
	public function activate() {
		XCOPB_Registrar::instance()->register_post_type();
		flush_rewrite_rules();
	}

	/**
	 * Plugin deactivation.
	 */
	public function deactivate() {
		flush_rewrite_rules();
	}
}

// Backward-compatibility class alias.
class_alias( 'Xcodesol_Page_Builder', 'Xcodesol_Shop_Builder' );

Xcodesol_Page_Builder::instance();
