/**
 * Shared column helpers for the 12-column grid container block.
 *
 * A xcosb/gb-container stores the number of columns in settings.columns and,
 * optionally, the width (1-12) of every column in settings.column_widths.
 * When column_widths is missing (older templates) columns are split as
 * evenly as possible across the 12-unit grid.
 *
 * @package WooCommerce_Template_Builder
 */

export const GRID_TOTAL = 12;
export const MAX_COLUMNS = 6;

/**
 * Normalise a stored column count.
 *
 * @param {number|string|undefined} value Stored column count.
 * @return {number} Column count clamped to 1..MAX_COLUMNS (default 2).
 */
export function columnCount( value ) {
	const n = Number( value );
	if ( ! Number.isFinite( n ) ) {
		return 2;
	}
	return Math.min( MAX_COLUMNS, Math.max( 1, Math.round( n ) ) );
}

/**
 * Equal widths for a given column count (spread so rows total 12).
 *
 * @param {number} count Column count.
 * @return {number[]} Width per column in grid units.
 */
export function equalColumnWidths( count ) {
	const n = columnCount( count );
	const base = Math.floor( GRID_TOTAL / n );
	const remainder = GRID_TOTAL % n;
	return Array.from( { length: n }, ( _, i ) => base + ( i < remainder ? 1 : 0 ) );
}

/**
 * Resolve the effective width (1-12) for each column.
 *
 * @param {number}        count  Column count.
 * @param {Array|unknown} stored Stored column_widths (optional).
 * @return {number[]} Width per column in grid units.
 */
export function resolveColumnWidths( count, stored ) {
	const n = columnCount( count );
	const equal = equalColumnWidths( n );

	if ( ! Array.isArray( stored ) ) {
		return equal;
	}

	return Array.from( { length: n }, ( _, i ) => {
		const raw = Number( stored[ i ] );
		if ( ! Number.isFinite( raw ) ) {
			return equal[ i ];
		}
		return Math.min( GRID_TOTAL, Math.max( 1, Math.round( raw ) ) );
	} );
}

/**
 * Unit options for the 12-unit grid (1..12).
 *
 * @return {{ label: string, value: string }[]} Select options.
 */
export function gridUnitOptions() {
	return Array.from( { length: GRID_TOTAL }, ( _, i ) => ( {
		label: String( i + 1 ),
		value: String( i + 1 ),
	} ) );
}

/**
 * Resolve the start line (1-based) of every column on the 12-unit grid.
 *
 * Columns are laid out left-to-right; a column may opt into an explicit
 * start line through its per-column style entry (start: 1..12). Requested
 * starts that would overlap the previous column are ignored so the row
 * never breaks into multiple implicit rows.
 *
 * @param {number[]} widths    Width per column in grid units.
 * @param {Array}    colStyles Per-column style entries (optional).
 * @return {number[]} Start line per column.
 */
export function resolveColumnLines( widths, colStyles ) {
	const lines = [];
	let cursor = 1;

	widths.forEach( ( width, i ) => {
		const raw = Number( colStyles && Array.isArray( colStyles ) ? colStyles[ i ]?.start : 0 );
		let line = cursor;
		if ( Number.isFinite( raw ) && raw > 0 && raw >= cursor ) {
			line = Math.min( GRID_TOTAL, Math.round( raw ) );
		}
		lines.push( line );
		cursor = line + width;
	} );

	return lines;
}
