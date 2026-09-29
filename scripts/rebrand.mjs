import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// Helper to replace in file
function updateFile(relPath, replacer) {
	const fullPath = path.join(rootDir, relPath);
	if (!fs.existsSync(fullPath)) {
		console.warn('File not found:', relPath);
		return;
	}
	const original = fs.readFileSync(fullPath, 'utf8');
	const updated = replacer(original);
	if (original !== updated) {
		fs.writeFileSync(fullPath, updated, 'utf8');
		console.log('Updated:', relPath);
	}
}

// 1. includes/class-xcopb-template-loader.php
updateFile('includes/class-xcopb-template-loader.php', (c) => {
	c = c.replaceAll('class XCOSB_Template_Loader', 'class XCOPB_Template_Loader');
	c = c.replaceAll('XCOSB_Template_Loader', 'XCOPB_Template_Loader');
	c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
	c = c.replaceAll('XCOSB_Conditions', 'XCOPB_Conditions');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_Renderer', 'XCOPB_Renderer');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('XCOSB_PLUGIN_URL', 'XCOPB_PLUGIN_URL');
	c = c.replaceAll('XCOSB_VERSION', 'XCOPB_VERSION');
	c = c.replaceAll('xcosb-public', 'xcopb-public');
	c = c.replaceAll('xcosb-cart-qty', 'xcopb-cart-qty');
	c = c.replaceAll('xcosb_edit_builder_', 'xcopb_edit_builder_');
	c = c.replaceAll('xcosb-builder', 'xcopb-builder');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');
	c = c.replaceAll('Edit with Shop Builder', 'Edit with Page Builder');
	c = c.replaceAll('_xcosb_settings', '_xcopb_settings');
	c = c.replaceAll('_xcosb_view_type', '_xcopb_view_type');
	c = c.replaceAll('xsb-edit-builder', 'xpb-edit-builder');
	c = c.replaceAll('assets/public/xsb-styles.css', 'assets/public/xpb-styles.css');
	c = c.replaceAll('assets/public/xsb-cart-qty.js', 'assets/public/xpb-cart-qty.js');

	if (!c.includes('enqueue_public_assets_for_template')) {
		const target = 'public function enqueue_public_assets() {';
		const addition = `public function enqueue_public_assets_for_template( $template_id ) {
		wp_enqueue_style( 'xcopb-public', XCOPB_PLUGIN_URL . 'assets/public/xpb-styles.css', array(), XCOPB_VERSION );
		$view_type = XCOPB_Registrar::get_field( $template_id, '_xcopb_view_type', '' );
		if ( 'cart' === $view_type ) {
			wp_enqueue_script( 'xcopb-cart-qty', XCOPB_PLUGIN_URL . 'assets/public/xpb-cart-qty.js', array(), XCOPB_VERSION, true );
		}
	}

	`;
		c = c.replace(target, addition + target);
	}

	if (!c.includes("class_alias( 'XCOPB_Template_Loader'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Template_Loader', 'XCOSB_Template_Loader' );\n";
	}
	return c;
});

// 2. includes/class-xcopb-conditions.php
updateFile('includes/class-xcopb-conditions.php', (c) => {
	c = c.replaceAll('class XCOSB_Conditions', 'class XCOPB_Conditions');
	c = c.replaceAll('XCOSB_Conditions', 'XCOPB_Conditions');
	c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('XCOSB_PLUGIN_URL', 'XCOPB_PLUGIN_URL');
	c = c.replaceAll('XCOSB_VERSION', 'XCOPB_VERSION');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');
	c = c.replaceAll('_xcosb_', '_xcopb_');

	if (!c.includes("class_alias( 'XCOPB_Conditions'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Conditions', 'XCOSB_Conditions' );\n";
	}
	return c;
});

// 3. includes/class-xcopb-preview.php
updateFile('includes/class-xcopb-preview.php', (c) => {
	c = c.replaceAll('class XCOSB_Preview', 'class XCOPB_Preview');
	c = c.replaceAll('XCOSB_Preview', 'XCOPB_Preview');
	c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
	c = c.replaceAll('XCOSB_Renderer', 'XCOPB_Renderer');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_Template_Loader', 'XCOPB_Template_Loader');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('XCOSB_PLUGIN_URL', 'XCOPB_PLUGIN_URL');
	c = c.replaceAll('XCOSB_VERSION', 'XCOPB_VERSION');
	c = c.replaceAll('xcosb_preview', 'xcopb_preview');
	c = c.replaceAll('xcosb-public', 'xcopb-public');
	c = c.replaceAll('assets/public/xsb-styles.css', 'assets/public/xpb-styles.css');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');

	if (!c.includes("class_alias( 'XCOPB_Preview'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Preview', 'XCOSB_Preview' );\n";
	}
	return c;
});

// 4. includes/class-xcopb-checkout-enhancements.php
updateFile('includes/class-xcopb-checkout-enhancements.php', (c) => {
	c = c.replaceAll('class XCOSB_Checkout_Enhancements', 'class XCOPB_Checkout_Enhancements');
	c = c.replaceAll('XCOSB_Checkout_Enhancements', 'XCOPB_Checkout_Enhancements');
	c = c.replaceAll('xcosb_template_render_start', 'xcopb_template_render_start');
	c = c.replaceAll('xcosb_template_render_end', 'xcopb_template_render_end');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');

	// Also hook legacy events for backward compat
	if (!c.includes('xcosb_template_render_start')) {
		c = c.replace(
			"add_action( 'xcopb_template_render_start', array( $this, 'on_render_start' ) );",
			"add_action( 'xcopb_template_render_start', array( $this, 'on_render_start' ) );\n\t\tadd_action( 'xcosb_template_render_start', array( $this, 'on_render_start' ) );"
		);
		c = c.replace(
			"add_action( 'xcopb_template_render_end', array( $this, 'on_render_end' ) );",
			"add_action( 'xcopb_template_render_end', array( $this, 'on_render_end' ) );\n\t\tadd_action( 'xcosb_template_render_end', array( $this, 'on_render_end' ) );"
		);
	}

	if (!c.includes("class_alias( 'XCOPB_Checkout_Enhancements'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Checkout_Enhancements', 'XCOSB_Checkout_Enhancements' );\n";
	}
	return c;
});

// 5. includes/class-xcopb-style-engine.php
updateFile('includes/class-xcopb-style-engine.php', (c) => {
	c = c.replaceAll('class XCOSB_Style_Engine', 'class XCOPB_Style_Engine');
	c = c.replaceAll('XCOSB_Style_Engine', 'XCOPB_Style_Engine');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('_xcosb_', '_xcopb_');
	c = c.replaceAll('xcosb-', 'xcopb-');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');

	if (!c.includes("class_alias( 'XCOPB_Style_Engine'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Style_Engine', 'XCOSB_Style_Engine' );\n";
	}
	return c;
});

// 6. includes/class-xcopb-presets.php
updateFile('includes/class-xcopb-presets.php', (c) => {
	c = c.replaceAll('class XCOSB_Presets', 'class XCOPB_Presets');
	c = c.replaceAll('XCOSB_Presets', 'XCOPB_Presets');
	c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('xcosb_preset', 'xcopb_preset');
	c = c.replaceAll('xcosb_presets_seeded', 'xcopb_presets_seeded');
	c = c.replaceAll('_xcosb_', '_xcopb_');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');

	if (!c.includes("class_alias( 'XCOPB_Presets'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Presets', 'XCOSB_Presets' );\n";
	}
	return c;
});

// 7. includes/class-xcopb-migrator.php
updateFile('includes/class-xcopb-migrator.php', (c) => {
	c = c.replaceAll('class XCOSB_Migrator', 'class XCOPB_Migrator');
	c = c.replaceAll('XCOSB_Migrator', 'XCOPB_Migrator');
	c = c.replaceAll('XCOSB_Presets', 'XCOPB_Presets');
	c = c.replaceAll('const DB_VERSION = 3;', 'const DB_VERSION = 4;');
	c = c.replaceAll("const OPTION = 'xcosb_db_version';", "const OPTION = 'xcopb_db_version';");
	c = c.replaceAll(
		`const POST_TYPE_MAP = array(
		'wtb_template' => 'xcosb_template',
		'wtb_preset'   => 'xcosb_preset',
		'xsb_template' => 'xcosb_template',
		'xsb_preset'   => 'xcosb_preset',
	);`,
		`const POST_TYPE_MAP = array(
		'wtb_template'   => 'xcopb_template',
		'wtb_preset'     => 'xcopb_preset',
		'xsb_template'   => 'xcopb_template',
		'xsb_preset'     => 'xcopb_preset',
		'xcosb_template' => 'xcopb_template',
		'xcosb_preset'   => 'xcopb_preset',
	);`
	);
	c = c.replaceAll(
		"const LEGACY_PREFIXES = array( 'wtb_', 'xsb_' );",
		"const LEGACY_PREFIXES = array( 'wtb_', 'xsb_', 'xcosb_' );"
	);
	c = c.replaceAll(
		"array( 'wtb/', 'xsb/', 'wtb_', 'xsb_', 'wtb-' ),\n\t\t\tarray( 'xcosb/', 'xcosb/', 'xcosb_', 'xcosb_', 'xsb-' ),",
		"array( 'wtb/', 'xsb/', 'xcosb/', 'wtb_', 'xsb_', 'xcosb_', 'wtb-', 'xsb-' ),\n\t\t\tarray( 'xcopb/', 'xcopb/', 'xcopb/', 'xcopb_', 'xcopb_', 'xcopb_', 'xpb-', 'xpb-' ),"
	);
	c = c.replaceAll('xcosb_', 'xcopb_');
	c = c.replaceAll('XCOSB_', 'XCOPB_');

	if (!c.includes("class_alias( 'XCOPB_Migrator'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Migrator', 'XCOSB_Migrator' );\n";
	}
	return c;
});

// 8. includes/class-xcopb-block-registry.php
updateFile('includes/class-xcopb-block-registry.php', (c) => {
	c = c.replaceAll('class XCOSB_Block_Registry', 'class XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('XCOSB_PLUGIN_URL', 'XCOPB_PLUGIN_URL');
	c = c.replaceAll('XCOSB_VERSION', 'XCOPB_VERSION');
	c = c.replaceAll('xcosb-public', 'xcopb-public');
	c = c.replaceAll('xcosb-frontend', 'xcopb-frontend');
	c = c.replaceAll('assets/public/xsb-styles.css', 'assets/public/xpb-styles.css');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');

	// Map both xcopb/ and xcosb/ prefixes in register_block & render_block
	if (!c.includes("xcopb/gb-shortcode")) {
		const target = "private function register_general_blocks() {";
		const shortcodeBlock = `private function register_general_blocks() {
		$this->register_block( 'xcopb/gb-shortcode', function ( $block, $context ) {
			return $this->render_block_file( XCOPB_PLUGIN_DIR . 'blocks/general/shortcode.php', $block, $context );
		}, array(
			'title'     => '',
			'shortcode' => '',
		) );
		$this->register_block( 'xcosb/gb-shortcode', function ( $block, $context ) {
			return $this->render_block_file( XCOPB_PLUGIN_DIR . 'blocks/general/shortcode.php', $block, $context );
		}, array(
			'title'     => '',
			'shortcode' => '',
		) );
`;
		c = c.replace(target, shortcodeBlock);
	}

	// In render_block, normalize prefix if needed
	if (!c.includes("$norm_type = str_replace(")) {
		const renderBlockTarget = "public function render_block( $type, $block, $context = array() ) {\n\t\tif ( ! isset( $this->blocks[ $type ] ) ) {";
		const renderBlockNorm = `public function render_block( $type, $block, $context = array() ) {
		if ( ! isset( $this->blocks[ $type ] ) ) {
			$alt_type = str_replace( array( 'xcosb/', 'xsb/', 'wtb/' ), 'xcopb/', $type );
			if ( isset( $this->blocks[ $alt_type ] ) ) {
				$type = $alt_type;
			}
		}
		if ( ! isset( $this->blocks[ $type ] ) ) {`;
		c = c.replace(renderBlockTarget, renderBlockNorm);
	}

	// In register_block, also register alias under xcopb/ or xcosb/
	if (!c.includes("$alias_type = str_replace( 'xcosb/', 'xcopb/', $type );")) {
		const regTarget = "public function register_block( $type, $callback, $defaults = array() ) {\n\t\t$this->blocks[ $type ] = array(";
		const regReplace = `public function register_block( $type, $callback, $defaults = array() ) {
		$this->blocks[ $type ] = array(
			'callback' => $callback,
			'defaults' => $defaults,
		);
		$alias_type = str_replace( 'xcosb/', 'xcopb/', $type );
		if ( $alias_type !== $type ) {
			$this->blocks[ $alias_type ] = array(
				'callback' => $callback,
				'defaults' => $defaults,
			);
		}
		return;
		$dummy = array(`;
		c = c.replace(regTarget, regReplace);
	}

	if (!c.includes("class_alias( 'XCOPB_Block_Registry'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Block_Registry', 'XCOSB_Block_Registry' );\n";
	}
	return c;
});

// 9. includes/class-xcopb-rest-templates.php
updateFile('includes/class-xcopb-rest-templates.php', (c) => {
	c = c.replaceAll('class XCOSB_REST_Templates', 'class XCOPB_REST_Templates');
	c = c.replaceAll('XCOSB_REST_Templates', 'XCOPB_REST_Templates');
	c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
	c = c.replaceAll('XCOSB_Conditions', 'XCOPB_Conditions');
	c = c.replaceAll('XCOSB_Presets', 'XCOPB_Presets');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_Renderer', 'XCOPB_Renderer');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('XCOSB_PLUGIN_URL', 'XCOPB_PLUGIN_URL');
	c = c.replaceAll('XCOSB_VERSION', 'XCOPB_VERSION');
	c = c.replaceAll("protected $namespace = 'xcosb/v1';", "protected $namespace = 'xcopb/v1';");
	c = c.replaceAll('_xcosb_', '_xcopb_');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');

	// Register legacy route aliases under xcosb/v1 too
	if (!c.includes("register_rest_route(\n\t\t\t'xcosb/v1'")) {
		c = c.replace(
			"add_action( 'rest_api_init', array( $this, 'register_routes' ) );",
			"add_action( 'rest_api_init', array( $this, 'register_routes' ) );\n\t\tadd_action( 'rest_api_init', array( $this, 'register_legacy_routes' ) );"
		);
		const legacyReg = `
	/**
	 * Register legacy xcosb/v1 routes for backwards compatibility.
	 */
	public function register_legacy_routes() {
		$old_ns = 'xcosb/v1';
		register_rest_route( $old_ns, '/' . $this->rest_base, array(
			array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_templates' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
			array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'create_template' ), 'permission_callback' => array( $this, 'check_permissions' ), 'args' => $this->get_update_args() ),
		) );
		register_rest_route( $old_ns, '/' . $this->rest_base . '/(?P<id>\\d+)', array(
			array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_template' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
			array( 'methods' => WP_REST_Server::EDITABLE, 'callback' => array( $this, 'update_template' ), 'permission_callback' => array( $this, 'check_permissions' ), 'args' => $this->get_update_args() ),
			array( 'methods' => WP_REST_Server::DELETABLE, 'callback' => array( $this, 'delete_template' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
		) );
		register_rest_route( $old_ns, '/' . $this->rest_base . '/import', array(
			'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'import_template' ), 'permission_callback' => array( $this, 'check_permissions' ),
		) );
	}
`;
		c = c.replace("public function register_routes() {", legacyReg + "\n\tpublic function register_routes() {");
	}

	if (!c.includes("class_alias( 'XCOPB_REST_Templates'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_REST_Templates', 'XCOSB_REST_Templates' );\n";
	}
	return c;
});

// 10. includes/admin/class-xcopb-admin.php
updateFile('includes/admin/class-xcopb-admin.php', (c) => {
	c = c.replaceAll('class XCOSB_Admin', 'class XCOPB_Admin');
	c = c.replaceAll('XCOSB_Admin', 'XCOPB_Admin');
	c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
	c = c.replaceAll('XCOSB_Conditions', 'XCOPB_Conditions');
	c = c.replaceAll('XCOSB_Presets', 'XCOPB_Presets');
	c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
	c = c.replaceAll('XCOSB_Renderer', 'XCOPB_Renderer');
	c = c.replaceAll('XCOSB_Preview', 'XCOPB_Preview');
	c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
	c = c.replaceAll('XCOSB_PLUGIN_URL', 'XCOPB_PLUGIN_URL');
	c = c.replaceAll('XCOSB_VERSION', 'XCOPB_VERSION');

	c = c.replaceAll('xcosb_export_template', 'xcopb_export_template');
	c = c.replaceAll('xcosb_preview', 'xcopb_preview');
	c = c.replaceAll('xcosb_toggle_template_status', 'xcopb_toggle_template_status');
	c = c.replaceAll('xcosb_edit_builder_', 'xcopb_edit_builder_');
	c = c.replaceAll('xcosb-builder', 'xcopb-builder');
	c = c.replaceAll('xcosb-admin', 'xcopb-admin');
	c = c.replaceAll('xcosb Builder', 'xcopb Builder');
	c = c.replaceAll('xcosb-builder-frame', 'xcopb-builder-frame xcosb-builder-frame');
	c = c.replaceAll('xcosb-builder-root', 'xcopb-builder-root');
	c = c.replaceAll('xcosb/v1/templates', 'xcopb/v1/templates');
	c = c.replaceAll('xcosbBuilderConfig', 'xcopbBuilderConfig');

	c = c.replaceAll('_xcosb_', '_xcopb_');
	c = c.replaceAll("'xcosb_status'", "'xcopb_status'");
	c = c.replaceAll("'xcosb_view_type'", "'xcopb_view_type'");
	c = c.replaceAll("'xcosb_preset'", "'xcopb_preset'");
	c = c.replaceAll("'xcosb_priority'", "'xcopb_priority'");
	c = c.replaceAll("'xcosb_message'", "'xcopb_message'");

	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');
	c = c.replaceAll('Xcodesol Shop Builder', 'Xcodesol Page Builder');
	c = c.replaceAll('Shop Builder', 'Page Builder');

	// Localize both xcopbBuilderConfig and xcosbBuilderConfig for compatibility
	if (!c.includes("wp_localize_script( 'xcopb-builder', 'xcosbBuilderConfig'")) {
		c = c.replace(
			"wp_localize_script( 'xcopb-builder', 'xcopbBuilderConfig', $config );",
			"wp_localize_script( 'xcopb-builder', 'xcopbBuilderConfig', $config );\n\t\twp_localize_script( 'xcopb-builder', 'xcosbBuilderConfig', $config );"
		);
	}

	// Add shortcode column in template list
	if (!c.includes("'xcopb_shortcode'")) {
		const targetCol = "$new['xcopb_status']    = __( 'Applied Status', 'xcodesol-page-builder' );";
		const shortcodeCol = "$new['xcopb_shortcode'] = __( 'Shortcode', 'xcodesol-page-builder' );\n\t\t\t\t" + targetCol;
		c = c.replace(targetCol, shortcodeCol);

		const targetContent = "if ( 'xcopb_status' === $column ) {";
		const shortcodeContent = `if ( 'xcopb_shortcode' === $column ) {
			$sc = '[xcodesol_page_builder id="' . absint( $post_id ) . '"]';
			echo '<code class="xcopb-shortcode-snippet" style="cursor:pointer;background:#f1f5f9;padding:4px 8px;border-radius:4px;user-select:all;display:inline-block;font-size:12px;" title="' . esc_attr__( 'Click to copy shortcode', 'xcodesol-page-builder' ) . '" onclick="navigator.clipboard.writeText(this.innerText);alert(\\'Shortcode copied!\\');">' . esc_html( $sc ) . '</code>';
			return;
		}

		` + targetContent;
		c = c.replace(targetContent, shortcodeContent);
	}

	// Add admin post compatibility for xcosb_* actions
	if (!c.includes("admin_post_xcosb_preview")) {
		const hookTarget = "add_action( 'admin_post_xcopb_preview', array( $this, 'handle_preview' ) );";
		const hookReplace = hookTarget + "\n\t\tadd_action( 'admin_post_xcosb_preview', array( $this, 'handle_preview' ) );\n\t\tadd_action( 'admin_post_xcosb_export_template', array( $this, 'handle_export_download' ) );\n\t\tadd_action( 'admin_post_xcosb_toggle_template_status', array( $this, 'handle_toggle_template_status' ) );";
		c = c.replace(hookTarget, hookReplace);
	}

	if (!c.includes("class_alias( 'XCOPB_Admin'")) {
		c += "\n// Backward-compatibility class alias.\nclass_alias( 'XCOPB_Admin', 'XCOSB_Admin' );\n";
	}
	return c;
});

// 11. renderers/*.php
const rendererFiles = ['renderers/cart.php', 'renderers/checkout.php', 'renderers/product-archive.php', 'renderers/single-product.php'];
for (const rf of rendererFiles) {
	updateFile(rf, (c) => {
		c = c.replaceAll('XCOSB_Template_Loader', 'XCOPB_Template_Loader');
		c = c.replaceAll('XCOSB_Renderer', 'XCOPB_Renderer');
		c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
		c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
		c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
		c = c.replaceAll('_xcosb_', '_xcopb_');
		c = c.replaceAll('xcosb_template_render_start', 'xcopb_template_render_start');
		c = c.replaceAll('xcosb_template_render_end', 'xcopb_template_render_end');
		return c;
	});
}

// 12. blocks/**/*.php
function scanDir(dir) {
	const entries = fs.readdirSync(path.join(rootDir, dir), { withFileTypes: true });
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) {
			scanDir(full);
		} else if (e.name.endsWith('.php')) {
			updateFile(full, (c) => {
				c = c.replaceAll('XCOSB_Block_Registry', 'XCOPB_Block_Registry');
				c = c.replaceAll('XCOSB_Registrar', 'XCOPB_Registrar');
				c = c.replaceAll('XCOSB_PLUGIN_DIR', 'XCOPB_PLUGIN_DIR');
				c = c.replaceAll('XCOSB_', 'XCOPB_');
				c = c.replaceAll('_xcosb_', '_xcopb_');
				c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');
				return c;
			});
		}
	}
}
scanDir('blocks');

// 13. includes/data/presets.php
updateFile('includes/data/presets.php', (c) => {
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');
	c = c.replaceAll("'xcosb/", "'xcopb/");
	return c;
});

// 14. assets/admin/template-list.js
updateFile('assets/admin/template-list.js', (c) => {
	c = c.replaceAll('/xcosb/v1/templates/import', '/xcopb/v1/templates/import');
	return c;
});

// 15. assets/public/xpb-cart-qty.js
updateFile('assets/public/xpb-cart-qty.js', (c) => {
	c = c.replaceAll('Shop Builder', 'Page Builder');
	c = c.replaceAll('.xsb-cc-box', '.xcopb-cc-box, .xsb-cc-box');
	c = c.replaceAll('xsb-qty-enhanced', 'xcopb-qty-enhanced xsb-qty-enhanced');
	c = c.replaceAll('xsb-qty-btn xsb-qty-minus', 'xcopb-qty-btn xcopb-qty-minus xsb-qty-btn xsb-qty-minus');
	c = c.replaceAll('xsb-qty-btn xsb-qty-plus', 'xcopb-qty-btn xcopb-qty-plus xsb-qty-btn xsb-qty-plus');
	return c;
});

// Also keep xsb-cart-qty.js in assets/public as fallback
fs.copyFileSync(
	path.join(rootDir, 'assets/public/xpb-cart-qty.js'),
	path.join(rootDir, 'assets/public/xsb-cart-qty.js')
);

// Also duplicate xpb-styles.css to xsb-styles.css for fallback
fs.copyFileSync(
	path.join(rootDir, 'assets/public/xpb-styles.css'),
	path.join(rootDir, 'assets/public/xsb-styles.css')
);

// 16. package.json
updateFile('package.json', (c) => {
	c = c.replace('"name": "xcodesol-shop-builder"', '"name": "xcodesol-page-builder"');
	c = c.replace('"description": "Xcodesol Shop Builder - React admin editor."', '"description": "Xcodesol Page Builder - React admin editor."');
	return c;
});

// 17. readme.txt
updateFile('readme.txt', (c) => {
	c = c.replaceAll('Xcodesol Shop Builder', 'Xcodesol Page Builder');
	c = c.replaceAll('xcodesol-shop-builder', 'xcodesol-page-builder');
	c = c.replaceAll('Shop Builder', 'Page Builder');
	return c;
});

console.log('REBRAND SCRIPT FINISHED');
