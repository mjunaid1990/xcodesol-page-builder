/**
 * WooCommerce Template Builder - React entry point.
 *
 * @package WooCommerce_Template_Builder
 */

import { createRoot } from '@wordpress/element';
import { register, createRegistry, createRegistrySelector } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';

// Editor design system. Compiled by webpack into assets/admin/builder.css —
// the browser still loads a single stylesheet for the builder.
import './styles/tokens.css';
import './styles/layout.css';

import App from './app';
import { registerTemplatesStore } from './stores/templates-store';
import { knownControlTypes } from './components/controls';
import { auditManifests } from './schemas';
import './styles/canvas.css';

registerTemplatesStore();

// Dev builds only: make manifest drift loud (unknown control types, two
// widgets claiming the same block type) instead of a silently dead control.
if ( process.env.NODE_ENV !== 'production' ) {
	auditManifests( knownControlTypes() ).forEach( ( problem ) => {
		// eslint-disable-next-line no-console
		console.warn( `[XSB] Widget manifest: ${ problem }` );
	} );
}

domReady( () => {
	const rootElement = document.getElementById( 'xcopb-builder-root' ) || document.getElementById( 'xcosb-builder-root' );

	if ( ! rootElement ) {
		return;
	}

	const config = window.xcopbBuilderConfig || window.xcosbBuilderConfig || {};

	const root = createRoot( rootElement );
	root.render( <App config={ config } /> );
} );

export {};
