/**
 * Precise drop-target resolution for the template canvas.
 *
 * While a widget is being dragged we track the pointer and compute the exact
 * slot it would land in. The result ("drop guide") drives both the inline
 * insertion line drawn on the canvas (Elementor-style) and the final drop
 * commit, so dropping inside a container column never falls back to a
 * "whole container box" drop.
 *
 * Guides come in two flavours:
 *   - { kind: 'top', zoneId, slot } — insert before the slot-th block inside
 *     a structure zone (0-based; slot === blocks.length appends at the end).
 *   - { kind: 'col', ci, cj, slot } — insert before the slot-th widget inside
 *     container `ci`'s column `cj`.
 *
 * Slots are computed against the target list *without* the item currently
 * being dragged, so the drop handler can simply remove-then-insert. A `null`
 * result means "no valid drop point here" and the caller falls back to
 * dnd-kit's own collision result (used for keyboard drags / the outline
 * panel, which the pointer never crosses).
 *
 * @package WooCommerce_Template_Builder
 */

function ptInRect( r, px, py ) {
	return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
}

function parseNum( v ) {
	const n = parseInt( v, 10 );
	return Number.isInteger( n ) ? n : -1;
}

/**
 * Insertion index before which the dragged item lands, given the rects of
 * its future siblings (DOM order, excluding the dragged item) and the
 * pointer's Y coordinate.
 *
 * @param {Array<DOMRect>} rects Sibling rects.
 * @param {number}         py    Pointer Y (viewport).
 * @return {number} Slot index in 0..rects.length.
 */
function slotFromRects( rects, py ) {
	for ( let i = 0; i < rects.length; i++ ) {
		const r = rects[ i ];
		if ( py <= r.top + r.height / 2 ) {
			return i;
		}
	}
	return rects.length;
}

/**
 * Whether a block type may be added to a structure zone (mirrors the
 * over-based drop rules in the editor).
 *
 * @param {Object|undefined} zoneDef   Structure zone definition.
 * @param {string}           blockType Block type being dragged.
 * @return {boolean} True when the drop is allowed.
 */
function isContainerBlockType( blockType ) {
	return (
		blockType === 'xcopb/gb-container' ||
		blockType === 'xcosb/gb-container' ||
		blockType === 'xcopb/container'    ||
		blockType === 'xcosb/container'
	);
}

function zoneAllows( zoneDef, blockType ) {
	if ( ! blockType || isContainerBlockType( blockType ) ||
		blockType.indexOf( 'xcopb/gb-' ) === 0 ||
		blockType.indexOf( 'xcosb/gb-' ) === 0 ) {
		return true; // Containers and Common blocks always flow anywhere.
	}
	if ( ! zoneDef || ! Array.isArray( zoneDef.allowedBlocks ) || zoneDef.allowedBlocks.length === 0 ) {
		return true;
	}
	return zoneDef.allowedBlocks.includes( blockType );
}

/**
 * Compute the drop guide for a pointer position over the canvas.
 *
 * @param {number}   px     Pointer X (viewport).
 * @param {number}   py     Pointer Y (viewport).
 * @param {Element}  rootEl Element that contains the canvas zones.
 * @param {Object}   opts
 * @param {*}        opts.activeId   dnd-kit active id (palette, cv-N, block-N or nested-ci-cj-bi).
 * @param {Object}   opts.activeData dnd-kit active .data (fromPalette / block meta).
 * @param {Object}   opts.structure  Template structure (zones).
 * @param {string[]} opts.zoneMap    Zone id per top-level block index.
 * @return {{kind:string, zoneId?:string, ci?:number, cj?:number, slot:number}|null}
 */
export function computeDropGuide( px, py, rootEl, opts ) {
	const { activeId, activeData, structure, zoneMap } = opts || {};
	if ( ! rootEl || ! rootEl.isConnected ) {
		return null;
	}
	const zones = ( structure && structure.zones ) || [];
	if ( zones.length === 0 ) {
		return null;
	}

	const data = ( activeData && activeData.current ) || activeData || {};
	const isPalette = !! data.fromPalette;
	const blockType = data.block ? data.block.type : '';
	const activeStr = activeId == null ? '' : String( activeId );
	const activeIdx = activeStr.indexOf( 'cv-' ) === 0
		? parseNum( activeStr.slice( 3 ) )
		: activeStr.indexOf( 'block-' ) === 0 ? parseNum( activeStr.slice( 6 ) ) : -1;
	const nestedActive = activeStr.indexOf( 'nested-' ) === 0 ? activeStr.slice( 7 ) : null;
	const isNestedDrag = !! nestedActive;
	// Containers are valid children too. Their drag guide should target a
	// container column just like any widget so users can see the nesting point
	// before dropping instead of getting a misleading page-level target.
	const canUseColumns = isPalette || isNestedDrag;

	// A container already inside a column owns its own inner column. Resolve
	// these targets before their parent column so a drop inside a nested
	// container cannot silently land beside it.
	if ( isPalette ) {
		const innerContainers = Array.from( rootEl.querySelectorAll( '[data-inner-container-path], [data-inner-container-id]' ) );
		for ( let i = innerContainers.length - 1; i >= 0; i-- ) {
			const el = innerContainers[ i ];
			if ( ! ptInRect( el.getBoundingClientRect(), px, py ) ) continue;
			const rawPath = el.getAttribute( 'data-inner-container-path' );
			if ( rawPath ) {
				let address;
				try { address = JSON.parse( rawPath ); } catch ( error ) { address = null; }
				if ( address && Array.isArray( address.path ) ) {
					const columns = Array.from( el.querySelectorAll( ':scope > .xsb-nested-container-column' ) );
					let columnIndex = 0;
					if ( columns.length > 1 ) {
						const hoveredColumn = columns.findIndex( ( column ) => ptInRect( column.getBoundingClientRect(), px, py ) );
						if ( hoveredColumn >= 0 ) columnIndex = hoveredColumn;
					}
					const targetColumn = columns[ columnIndex ];
					const childEls = targetColumn
						? Array.from( targetColumn.querySelectorAll( ':scope > .xsb-nested-container-item' ) )
						: Array.from( el.querySelectorAll( ':scope > .xsb-nested-container-item' ) );
					return { kind: 'inner-container', ...address, columnIndex, slot: slotFromRects( childEls.map( ( child ) => child.getBoundingClientRect() ), py ) };
				}
			}
			const [ ci, cj, bi ] = ( el.getAttribute( 'data-inner-container-id' ) || '' ).split( '-' ).map( parseNum );
			if ( ci < 0 || cj < 0 || bi < 0 ) continue;
			const childEls = Array.from( el.querySelectorAll( ':scope > .xsb-nested-container-item' ) );
			return { kind: 'inner-container', ci, cj, bi, slot: slotFromRects( childEls.map( ( child ) => child.getBoundingClientRect() ), py ) };
		}
	}

	const colEls = canUseColumns ? Array.from( rootEl.querySelectorAll( '[data-col-id]' ) ) : [];

	// 1) Container columns are the innermost targets: a pointer anywhere in a
	//    column (its empty space or over one of its widgets) drops in there.
	for ( let i = 0; i < colEls.length; i++ ) {
		const colEl = colEls[ i ];
		const colRect = colEl.getBoundingClientRect();
		if ( ! ptInRect( colRect, px, py ) ) {
			continue;
		}
		const parts = ( colEl.getAttribute( 'data-col-id' ) || '' ).split( '-' );
		const ci = parseNum( parts[ 0 ] );
		const cj = parseNum( parts[ 1 ] );
		if ( ci < 0 || cj < 0 ) {
			continue;
		}
		const childEls = Array.from( colEl.querySelectorAll( ':scope > [data-nested-id]' ) );
		const rects = [];
		for ( let k = 0; k < childEls.length; k++ ) {
			if ( isNestedDrag && childEls[ k ].getAttribute( 'data-nested-id' ) === nestedActive ) {
				continue; // Never treat the dragged widget itself as a sibling.
			}
			rects.push( childEls[ k ].getBoundingClientRect() );
		}
		return { kind: 'col', ci, cj, slot: slotFromRects( rects, py ) };
	}

	// 1b) Container interior tolerance: if pointer is inside a container block
	//     (over its padding, gap, or header) and the widget is column-compatible,
	//     target the horizontally nearest column rather than dropping outside.
	if ( canUseColumns ) {
		const containerEls = Array.from( rootEl.querySelectorAll( '[data-cv-block]' ) );
		for ( let i = 0; i < containerEls.length; i++ ) {
			const cEl = containerEls[ i ];
			const innerCols = Array.from( cEl.querySelectorAll( '[data-col-id]' ) );
			if ( innerCols.length === 0 ) {
				continue;
			}
			const cRect = cEl.getBoundingClientRect();
			if ( ! ptInRect( cRect, px, py ) ) {
				continue;
			}
			// Outer 12px margin on top/bottom allows intentional drop before/after the container.
			if ( ! isNestedDrag && ( py < cRect.top + 12 || py > cRect.bottom - 12 ) ) {
				break;
			}
			let bestCol = innerCols[ 0 ];
			let bestDist = Infinity;
			for ( let c = 0; c < innerCols.length; c++ ) {
				const r = innerCols[ c ].getBoundingClientRect();
				const cx = r.left + r.width / 2;
				const dist = Math.abs( px - cx );
				if ( dist < bestDist ) {
					bestDist = dist;
					bestCol = innerCols[ c ];
				}
			}
			const parts = ( bestCol.getAttribute( 'data-col-id' ) || '' ).split( '-' );
			const ci = parseNum( parts[ 0 ] );
			const cj = parseNum( parts[ 1 ] );
			if ( ci >= 0 && cj >= 0 ) {
				const childEls = Array.from( bestCol.querySelectorAll( ':scope > [data-nested-id]' ) );
				const rects = [];
				for ( let k = 0; k < childEls.length; k++ ) {
					if ( isNestedDrag && childEls[ k ].getAttribute( 'data-nested-id' ) === nestedActive ) {
						continue;
					}
					rects.push( childEls[ k ].getBoundingClientRect() );
				}
				return { kind: 'col', ci, cj, slot: slotFromRects( rects, py ) };
			}
		}
	}

	const zoneEls = Array.from( rootEl.querySelectorAll( '[data-zone-root]' ) );

	// 2) Pointer over a specific top-level block (canvas zones only).
	for ( let i = 0; i < zoneEls.length; i++ ) {
		const zoneEl = zoneEls[ i ];
		const zoneId = zoneEl.getAttribute( 'data-zone-root' );
		const zoneDef = zones.find( ( z ) => z.id === zoneId );
		const blockEls = Array.from( zoneEl.querySelectorAll( ':scope [data-cv-block]' ) );

		for ( let k = 0; k < blockEls.length; k++ ) {
			const idx = parseNum( blockEls[ k ].getAttribute( 'data-cv-block' ) );
			if ( idx < 0 || ( ! isPalette && idx === activeIdx ) ) {
				continue;
			}
			if ( ! ptInRect( blockEls[ k ].getBoundingClientRect(), px, py ) ) {
				continue;
			}
			if ( isNestedDrag ) {
				return null; // Nested widgets only ever live inside columns.
			}

			// Sibling rects for the slot (still excluding the dragged item).
			const rects = [];
			for ( let m = 0; m < blockEls.length; m++ ) {
				const midx = parseNum( blockEls[ m ].getAttribute( 'data-cv-block' ) );
				if ( midx === activeIdx && ! isPalette ) {
					continue;
				}
				rects.push( blockEls[ m ].getBoundingClientRect() );
			}

			if ( isPalette ) {
				if ( ! zoneAllows( zoneDef, blockType ) ) {
					return null;
				}
				return { kind: 'top', zoneId, slot: slotFromRects( rects, py ) };
			}

			// Reordering an existing top-level block: same zone only.
			if ( activeIdx < 0 || ! zoneMap || zoneMap[ activeIdx ] !== zoneId ) {
				return null;
			}
			return { kind: 'top', zoneId, slot: slotFromRects( rects, py ) };
		}
	}

	// 3) Pointer inside a zone body but not over one of its blocks (the gap
	//    between two blocks, or an empty zone).
	for ( let i = 0; i < zoneEls.length; i++ ) {
		const zoneEl = zoneEls[ i ];
		const zoneId = zoneEl.getAttribute( 'data-zone-root' );
		if ( ! ptInRect( zoneEl.getBoundingClientRect(), px, py ) ) {
			continue;
		}
		if ( isNestedDrag ) {
			return null;
		}
		const zoneDef = zones.find( ( z ) => z.id === zoneId );
		const blockEls = Array.from( zoneEl.querySelectorAll( ':scope [data-cv-block]' ) );
		const rects = [];
		for ( let m = 0; m < blockEls.length; m++ ) {
			const midx = parseNum( blockEls[ m ].getAttribute( 'data-cv-block' ) );
			if ( ! isPalette && midx === activeIdx ) {
				continue;
			}
			rects.push( blockEls[ m ].getBoundingClientRect() );
		}
		if ( isPalette ) {
			if ( ! zoneAllows( zoneDef, blockType ) ) {
				return null;
			}
			return { kind: 'top', zoneId, slot: slotFromRects( rects, py ) };
		}
		if ( activeIdx < 0 || ! zoneMap || zoneMap[ activeIdx ] !== zoneId ) {
			return null;
		}
		return { kind: 'top', zoneId, slot: slotFromRects( rects, py ) };
	}

	// 4) Pointer in a gap between zones (or a narrow gutter beside them):
	//    resolve to the nearest zone boundary. Only meaningful for palette /
	//    top-level drags and only when horizontally close to the zone.
	if ( ! isNestedDrag ) {
		let best = null;
		let bestDist = Infinity;
		for ( let i = 0; i < zoneEls.length; i++ ) {
			const r = zoneEls[ i ].getBoundingClientRect();
			const dx = px < r.left ? r.left - px : px > r.right ? px - r.right : 0;
			const dy = py < r.top ? r.top - py : py > r.bottom ? py - r.bottom : 0;
			if ( dx > 28 ) {
				continue; // Too far horizontally (e.g. over the sidebar).
			}
			const dist = dx * dx + dy * dy;
			if ( dist < bestDist ) {
				bestDist = dist;
				best = { zoneEl: zoneEls[ i ], r };
			}
		}
		if ( best ) {
			const r = best.r;
			const gapY = py < r.top ? r.top - py : py > r.bottom ? py - r.bottom : 0;
			if ( gapY <= 40 && gapY >= 0 ) {
				const zoneEl = best.zoneEl;
				const zoneId = zoneEl.getAttribute( 'data-zone-root' );
				const zoneDef = zones.find( ( z ) => z.id === zoneId );
				const blockEls = Array.from( zoneEl.querySelectorAll( ':scope [data-cv-block]' ) );
				const rects = [];
				for ( let m = 0; m < blockEls.length; m++ ) {
					const midx = parseNum( blockEls[ m ].getAttribute( 'data-cv-block' ) );
					if ( ! isPalette && midx === activeIdx ) {
						continue;
					}
					rects.push( blockEls[ m ].getBoundingClientRect() );
				}
				if ( isPalette ) {
					if ( ! zoneAllows( zoneDef, blockType ) ) {
						return null;
					}
					return { kind: 'top', zoneId, slot: slotFromRects( rects, py ) };
				}
				if ( activeIdx < 0 || ! zoneMap || zoneMap[ activeIdx ] !== zoneId ) {
					return null;
				}
				return { kind: 'top', zoneId, slot: slotFromRects( rects, py ) };
			}
		}
	}

	return null;
}
