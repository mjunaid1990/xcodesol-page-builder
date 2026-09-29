/**
 * Positioning for the floating style popover.
 *
 * The popover renders through a portal into document.body with
 * position:fixed. `anchorStyle` is the fixed-coordinate hint produced by
 * the canvas (click point + flip logic); this hook re-measures the real
 * popover size after mount and clamps it inside the viewport so it never
 * overflows, then lets CSS switch to a bottom-sheet below 768px.
 *
 * @package WooCommerce_Template_Builder
 */

import { useEffect, useState } from '@wordpress/element';

export const POPOVER_EDGE = 12;

/**
 * Whether the viewport is below the mobile-sheet breakpoint.
 *
 * @return {boolean} True when the floating popover should become a sheet.
 */
export function isMobileViewport() {
	return typeof window !== 'undefined' && window.innerWidth < 768;
}

/**
 * Measure the popover and compute a clamped fixed position.
 *
 * @param {Object}   options
 * @param {boolean}  options.open        Whether the popover is open.
 * @param {Object}   options.anchorStyle Fixed-coordinate hint { left, top,
 *                                       bottom, maxHeight } from the canvas.
 * @param {Object}   options.contentRef  Ref of the popover root element.
 * @return {Object|null} { left, top, maxHeight } for the inline style.
 */
/**
 * Immediate (unmeasured) placement from the anchor hint so the popover does
 * not flash at a wrong spot during the first frame.
 *
 * @param {Object|null} anchorStyle Fixed-coordinate hint.
 * @return {Object|null} { left, top, maxHeight }.
 */
function estimatePos( anchorStyle ) {
	if ( ! anchorStyle || typeof window === 'undefined' ) {
		return null;
	}
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const edge = POPOVER_EDGE;
	const width = Math.min( 360, vw - 24 );
	const maxHeight = Math.min( 680, vh - 24 );

	let left = typeof anchorStyle.left === 'number' ? anchorStyle.left : edge;
	left = Math.max( edge, Math.min( left, vw - width - edge ) );

	let top;
	if ( typeof anchorStyle.bottom === 'number' && anchorStyle.bottom !== 'auto' ) {
		top = vh - anchorStyle.bottom - maxHeight;
	} else {
		top = typeof anchorStyle.top === 'number' ? anchorStyle.top : edge;
	}
	top = Math.max( edge, Math.min( top, vh - maxHeight - edge ) );

	return { left, top, maxHeight };
}

export function usePopoverPosition( { open, anchorStyle, contentRef } ) {
	const [ pos, setPos ] = useState( () => ( open ? estimatePos( anchorStyle ) : null ) );

	useEffect( () => {
		if ( ! open ) {
			setPos( null );
			return undefined;
		}

		// Measure a frame after the portal node is in the DOM so CSS rules
		// (width clamp, max-height) have applied.
		let raf = 0;
		const tick = () => {
			const el = contentRef.current;
			if ( ! el || typeof window === 'undefined' ) {
				return;
			}

			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const width = el.offsetWidth || Math.min( 360, vw - 24 );
			const height = el.offsetHeight || 400;
			const edge = POPOVER_EDGE;

			// Horizontal: keep 12px clear of both viewport edges.
			const maxLeft = Math.max( edge, vw - width - edge );
			let left = typeof anchorStyle.left === 'number' ? anchorStyle.left : edge;
			left = Math.max( edge, Math.min( left, maxLeft ) );

			// Vertical: honour the canvas hint (below the point, or above),
			// then flip/clamp when it would overflow the bottom.
			let top;
			if ( typeof anchorStyle.top === 'number' && anchorStyle.bottom !== 'auto' ) {
				top = anchorStyle.top;
			} else if ( typeof anchorStyle.bottom === 'number' ) {
				top = vh - anchorStyle.bottom - height;
			} else {
				top = edge;
			}
			top = Math.max( edge, Math.min( top, vh - height - edge ) );

			const maxHeight = Math.min( 680, vh - 24 );
			setPos( ( prev ) =>
				prev && Math.abs( prev.left - left ) < 2 && Math.abs( prev.top - top ) < 2 ? prev : { left, top, maxHeight }
			);
		};

		raf = requestAnimationFrame( tick );
		return () => cancelAnimationFrame( raf );
	}, [ open, anchorStyle, contentRef ] );

	return pos;
}