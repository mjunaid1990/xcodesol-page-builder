<?php
/**
 * Template editor container view.
 *
 * This view renders the mount point for the React builder SPA.
 * The React app is enqueued via XCOSB_Admin::enqueue_assets() using
 * the compiled bundle at assets/admin/builder.js.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;
?>
<div id="xcosb-builder-root"></div>
