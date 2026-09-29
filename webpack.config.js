/**
 * Webpack configuration for the WooCommerce Template Builder admin bundle.
 *
 * Extends the default @wordpress/scripts webpack config so that the
 * compiled React app and its .asset.php dependency manifest are emitted
 * into assets/admin/ (matching where the PHP admin enqueues them).
 *
 * @package WooCommerce_Template_Builder
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config.js' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		builder: path.resolve( __dirname, 'src', 'admin', 'index.js' ),
	},
	output: {
		filename: '[name].js',
		chunkFilename: 'controls-[name].chunk.js',
		path: path.resolve( __dirname, 'assets', 'admin' ),
		publicPath: 'auto',
	},
};
