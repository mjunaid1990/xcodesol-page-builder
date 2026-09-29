/**
 * Template list screen: adds an "Import Template (.json)" button next to
 * the page title. The file is posted to the xcosb/v1/templates/import REST
 * endpoint which recreates the template exactly; the user is then taken
 * straight into the builder for the imported template.
 *
 * @package WooCommerce_Template_Builder
 */
( function () {
	'use strict';

	if ( typeof window.wp === 'undefined' || ! window.wp.apiFetch ) {
		return;
	}

	var heading = document.querySelector( '.wp-heading-inline' );
	if ( ! heading ) {
		return;
	}

	var button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'page-title-action';
	button.textContent = 'Import Template (.json)';

	var input = document.createElement( 'input' );
	input.type = 'file';
	input.accept = 'application/json,.json';
	input.style.display = 'none';

	button.addEventListener( 'click', function () {
		input.click();
	} );

	input.addEventListener( 'change', function () {
		var file = input.files && input.files[ 0 ];
		if ( ! file ) {
			return;
		}

		var reader = new FileReader();

		reader.onload = function () {
			var document;
			try {
				document = JSON.parse( reader.result );
			} catch ( e ) {
				// eslint-disable-next-line no-alert
				window.alert( 'That file is not a valid template JSON.' );
				return;
			}

			window.wp.apiFetch( {
				path: '/xcopb/v1/templates/import',
				method: 'POST',
				data: document,
			} ).then( function ( result ) {
				if ( result && result.editUrl ) {
					window.location.href = result.editUrl;
				}
			} ).catch( function ( e ) {
				// eslint-disable-next-line no-alert
				window.alert( ( e && e.message ) || 'Import failed.' );
			} );
		};

		reader.readAsText( file );
		input.value = '';
	} );

	heading.appendChild( button );
	heading.appendChild( input );
}() );