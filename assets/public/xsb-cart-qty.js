/**
 * Quantity steppers for the Page Builder cart widgets.
 *
 * WooCommerce renders the cart quantity as a plain number input; this adds
 * + / − buttons around it (scoped to the cart boxes) so shoppers can bump
 * the count without typing. Values respect the input's min / max / step,
 * and a `change` event is fired so WooCommerce's own cart logic picks the
 * new value up.
 *
 * @package WooCommerce_Template_Builder
 */
( function () {
	'use strict';

	var autoUpdateTimer = null;

	function triggerCartUpdate( form ) {
		if ( ! form ) {
			return;
		}
		var updateBtn = form.querySelector( 'button[name="update_cart"]' );
		if ( updateBtn ) {
			updateBtn.disabled = false;
			updateBtn.click();
		}
	}

	function step( input, dir ) {
		var min = input.min !== '' && input.min !== undefined && ! isNaN( parseFloat( input.min ) )
			? parseFloat( input.min )
			: 0;
		var max = input.max !== '' && input.max !== undefined && ! isNaN( parseFloat( input.max ) )
			? parseFloat( input.max )
			: Infinity;
		var step = input.step && 'any' !== input.step && ! isNaN( parseFloat( input.step ) )
			? parseFloat( input.step )
			: 1;
		var val = parseFloat( input.value );

		if ( isNaN( val ) ) {
			val = min;
		}

		var decimals = ( String( step ).split( '.' )[ 1 ] || '' ).length;
		var next = parseFloat( ( val + dir * step ).toFixed( decimals ) );

		if ( next < min ) {
			next = min;
		}
		if ( next > max ) {
			next = max;
		}

		if ( next !== val ) {
			input.value = next;
			input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			input.dispatchEvent( new Event( 'change', { bubbles: true } ) );

			// Auto-update cart with a friendly debounce.
			var form = input.closest( 'form' );
			if ( form ) {
				clearTimeout( autoUpdateTimer );
				autoUpdateTimer = setTimeout( function () {
					triggerCartUpdate( form );
				}, 650 );
			}
		}
	}

	function enhance( box ) {
		var input = box.querySelector( 'input[type="number"], input.qty' );

		if ( ! input || box.classList.contains( 'xcopb-qty-enhanced xsb-qty-enhanced' ) ) {
			return;
		}

		box.classList.add( 'xcopb-qty-enhanced xsb-qty-enhanced' );

		var minus = document.createElement( 'button' );
		minus.type = 'button';
		minus.className = 'xcopb-qty-btn xcopb-qty-minus xsb-qty-btn xsb-qty-minus';
		minus.setAttribute( 'aria-label', 'Decrease quantity' );
		minus.innerHTML = '&minus;';

		var plus = document.createElement( 'button' );
		plus.type = 'button';
		plus.className = 'xcopb-qty-btn xcopb-qty-plus xsb-qty-btn xsb-qty-plus';
		plus.setAttribute( 'aria-label', 'Increase quantity' );
		plus.innerHTML = '+';

		box.insertBefore( minus, input );
		box.appendChild( plus );

		minus.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			step( input, -1 );
		} );
		plus.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			step( input, 1 );
		} );
	}

	function init() {
		var boxes = document.querySelectorAll( '.xcopb-cc-box, .xsb-cc-box .quantity' );
		Array.prototype.forEach.call( boxes, enhance );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

	// Re-bind when WooCommerce reloads or updates cart fragments via AJAX.
	if ( typeof jQuery !== 'undefined' ) {
		jQuery( document.body ).on( 'updated_wc_div updated_cart_totals wc_fragments_refreshed', function () {
			init();
		} );
	}

	// MutationObserver fallback to catch any async table re-renders.
	if ( typeof MutationObserver !== 'undefined' ) {
		var observer = new MutationObserver( function () {
			init();
		} );
		observer.observe( document.body, { childList: true, subtree: true } );
	}
}() );