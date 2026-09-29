<?php
/**
 * Block: General Container.
 *
 * Six author-selectable layout modes drive one shared data model. Children
 * always live in settings-compatible `inner` columns and keep their
 * (column, block) coordinates; the non-column modes flatten that list in
 * authoring order, exactly like the editor canvas does.
 *
 *   columns     12-unit grid, each column holds nested widgets (legacy default)
 *   list        vertical flex stack
 *   row         horizontal flex row (wrap, or scroll)
 *   grid        CSS grid whose tracks come from the grid-template control
 *   masonry     CSS multi-column masonry
 *   scroll-row  scroll-snap carousel
 *
 * `settings.columns` is how many columns exist and `settings.column_widths`
 * (1-12 per column) is each column's span on the 12-unit grid. When
 * column_widths is missing (older layouts) the columns split as evenly as
 * possible across the 12 units.
 *
 * Per-column overrides live in settings.column_styles (index-aligned with the
 * columns): presentation (background, padding, border, radius, shadow),
 * content alignment (align_v / align_h) and a grid start line (start, 1-12)
 * that lets a column begin at any unit on the row.
 *
 * Layout declarations are emitted three times: once inline (desktop), once
 * per device inside a @media block for the keys that device overrides, and
 * once for the Hover state as a scoped :hover rule — the same flat
 * `tablet_*` / `hover_*` settings keys the editor preview reads, so preview
 * and front end never drift apart.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

$settings = isset( $block['settings'] ) ? $block['settings'] : array();
if ( class_exists( 'XCOPB_Sanitizer' ) ) {
	$settings = XCOPB_Sanitizer::sanitize_container_settings( $settings );
}

$xsb_cols = isset( $settings['columns'] ) ? min( 6, max( 1, absint( $settings['columns'] ) ) ) : 2;
$xsb_gap  = isset( $settings['gap'] ) ? max( 0, absint( is_array( $settings['gap'] ) ? ( $settings['gap']['row'] ?? 20 ) : $settings['gap'] ) ) : 20;

// Per-side padding (supports modern dimensions object or older layouts).
if ( isset( $settings['padding'] ) && is_array( $settings['padding'] ) ) {
	$xsb_pu         = isset( $settings['padding']['unit'] ) ? $settings['padding']['unit'] : 'px';
	$xsb_pad_top    = ( isset( $settings['padding']['top'] ) ? (int) $settings['padding']['top'] : 20 ) . $xsb_pu;
	$xsb_pad_right  = ( isset( $settings['padding']['right'] ) ? (int) $settings['padding']['right'] : 20 ) . $xsb_pu;
	$xsb_pad_bottom = ( isset( $settings['padding']['bottom'] ) ? (int) $settings['padding']['bottom'] : 20 ) . $xsb_pu;
	$xsb_pad_left   = ( isset( $settings['padding']['left'] ) ? (int) $settings['padding']['left'] : 20 ) . $xsb_pu;
} else {
	$xsb_uniform_pad = isset( $settings['padding'] ) ? max( 0, absint( $settings['padding'] ) ) : 20;
	$xsb_pad_top     = ( isset( $settings['padding_top'] ) ? max( 0, absint( $settings['padding_top'] ) ) : $xsb_uniform_pad ) . 'px';
	$xsb_pad_right   = ( isset( $settings['padding_right'] ) ? max( 0, absint( $settings['padding_right'] ) ) : $xsb_uniform_pad ) . 'px';
	$xsb_pad_bottom  = ( isset( $settings['padding_bottom'] ) ? max( 0, absint( $settings['padding_bottom'] ) ) : $xsb_uniform_pad ) . 'px';
	$xsb_pad_left    = ( isset( $settings['padding_left'] ) ? max( 0, absint( $settings['padding_left'] ) ) : $xsb_uniform_pad ) . 'px';
}

$xsb_align    = ! empty( $settings['align'] ) ? $settings['align'] : 'stretch';
$xsb_bg       = ! empty( $settings['bg_color'] ) ? $settings['bg_color'] : ( ! empty( $settings['background'] ) ? $settings['background'] : '' );

// Rich background gradient or image
if ( ! empty( $settings['bg_type'] ) && 'gradient' === $settings['bg_type'] && ! empty( $settings['gradient'] ) && is_array( $settings['gradient'] ) ) {
	$g       = $settings['gradient'];
	$g_type  = isset( $g['type'] ) ? $g['type'] : 'linear';
	$g_angle = isset( $g['angle'] ) ? (int) $g['angle'] : 90;
	$g_ca    = isset( $g['colorA'] ) ? $g['colorA'] : '#4f46e5';
	$g_cb    = isset( $g['colorB'] ) ? $g['colorB'] : '#06b6d4';
	$g_pa    = isset( $g['posA'] ) ? (int) $g['posA'] : 0;
	$g_pb    = isset( $g['posB'] ) ? (int) $g['posB'] : 100;
	$xsb_bg  = 'linear' === $g_type
		? sprintf( 'linear-gradient(%ddeg, %s %d%%, %s %d%%)', $g_angle, $g_ca, $g_pa, $g_cb, $g_pb )
		: sprintf( 'radial-gradient(circle, %s %d%%, %s %d%%)', $g_ca, $g_pa, $g_cb, $g_pb );
} elseif ( ! empty( $settings['bg_type'] ) && 'image' === $settings['bg_type'] && ! empty( $settings['bg_image'] ) ) {
	$img_url = is_array( $settings['bg_image'] ) ? ( $settings['bg_image']['url'] ?? '' ) : $settings['bg_image'];
	if ( $img_url ) {
		$xsb_bg = 'url("' . esc_url( $img_url ) . '") center / cover no-repeat';
	}
}

// Border radius (supports dimensions object or number)
if ( isset( $settings['border_radius'] ) && is_array( $settings['border_radius'] ) ) {
	$ru         = isset( $settings['border_radius']['unit'] ) ? $settings['border_radius']['unit'] : 'px';
	$xsb_radius = sprintf( '%d%s %d%s %d%s %d%s',
		isset( $settings['border_radius']['top'] ) ? (int) $settings['border_radius']['top'] : 8, $ru,
		isset( $settings['border_radius']['right'] ) ? (int) $settings['border_radius']['right'] : 8, $ru,
		isset( $settings['border_radius']['bottom'] ) ? (int) $settings['border_radius']['bottom'] : 8, $ru,
		isset( $settings['border_radius']['left'] ) ? (int) $settings['border_radius']['left'] : 8, $ru
	);
} else {
	$xsb_radius = ( isset( $settings['border_radius'] ) ? max( 0, absint( $settings['border_radius'] ) ) : 8 ) . 'px';
}

$xsb_shadow   = isset( $settings['box_shadow'] ) ? $settings['box_shadow'] : 'none';
$xsb_border_w = isset( $settings['border_width'] ) ? ( is_array( $settings['border_width'] ) ? 1 : max( 0, absint( $settings['border_width'] ) ) ) : 0;
$xsb_border_s = ! empty( $settings['border_style'] ) ? $settings['border_style'] : 'solid';
$xsb_border_c = ! empty( $settings['border_color'] ) ? $settings['border_color'] : '';
$xsb_anim     = isset( $settings['animation'] ) ? $settings['animation'] : 'none';
$xsb_anim_ms  = isset( $settings['animation_duration'] ) ? absint( $settings['animation_duration'] ) : 600;
$xsb_anim_delay = isset( $settings['animation_delay'] ) ? absint( $settings['animation_delay'] ) : 0;

// Whole-container placement inside the template area.
$xsb_position  = ! empty( $settings['position'] ) ? $settings['position'] : 'full';
$xsb_max_width = isset( $settings['max_width'] ) ? ( is_array( $settings['max_width'] ) ? absint( $settings['max_width']['value'] ?? 1200 ) : min( 2000, max( 0, absint( $settings['max_width'] ) ) ) ) : 0;

$xsb_shadow_map = array(
	'none'   => '',
	'soft'   => '0 4px 14px rgba(0,0,0,0.12)',
	'medium' => '0 10px 28px rgba(0,0,0,0.18)',
	'strong' => '0 18px 50px rgba(0,0,0,0.28)',
);
$xsb_anim_list = array( 'fade-in', 'slide-up', 'slide-down', 'zoom-in' );

// ---------------------------------------------------------------------------
// Layout mode: one explicit mode per container. Containers saved before the
// layout modes existed keep the 12-unit column grid they were authored with
// (the v5 data migration records the mode explicitly, so the canvas and the
// front end always agree).
// ---------------------------------------------------------------------------
$xsb_layout_type = ! empty( $settings['layout_type'] ) ? $settings['layout_type'] : 'flex';
$xsb_layout_mode = ! empty( $settings['layout_mode'] ) ? (string) $settings['layout_mode'] : ( 'grid' === $xsb_layout_type ? 'grid' : 'columns' );

if ( ! in_array( $xsb_layout_mode, array( 'list', 'row', 'columns', 'grid', 'masonry', 'scroll-row' ), true ) ) {
	$xsb_layout_mode = 'columns';
}

/**
 * Every container instance gets a stable token derived from its own settings
 * so the emitted media queries and hover rules can be scoped to exactly this
 * block. Identical containers share a token on purpose: their layout rules are
 * identical, so the shared stylesheet stays small.
 */
$xsb_token = 'xsb-c-' . substr( md5( wp_json_encode( $settings ) ), 0, 8 );

// --- small value helpers, kept as closures so re-including this template for
// --- the next block never redeclares a function ---------------------------------
$xsb_css_safe = function ( $value ) {
	$clean = preg_replace( '/[^0-9a-zA-Z%.,()\/\s\-_]/', '', (string) $value );
	return trim( $clean );
};

$xsb_enum = function ( $value, $allowed, $fallback ) {
	return in_array( (string) $value, $allowed, true ) ? (string) $value : $fallback;
};

$xsb_dim = function ( $value, $fallback, $default_unit = 'px' ) {
	if ( is_array( $value ) ) {
		$num  = isset( $value['value'] ) ? (float) $value['value'] : (float) $fallback;
		$unit = isset( $value['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $value['unit'] ) : $default_unit;
		return $num . $unit;
	}
	if ( is_numeric( $value ) ) {
		return (float) $value . $default_unit;
	}
	if ( '' === $value || null === $value ) {
		return (float) $fallback . $default_unit;
	}
	return '' === $xsb_css_safe( $value ) ? (float) $fallback . $default_unit : $xsb_css_safe( $value );
};

/**
 * Gap pair (row / column) from either a linked { row, col, unit } object or a
 * plain number, mirroring the canvas.
 */
$xsb_gap_pair = function ( $value, $fallback ) {
	if ( is_array( $value ) ) {
		$row  = isset( $value['row'] ) ? (float) $value['row'] : (float) $fallback;
		$col  = isset( $value['col'] ) ? (float) $value['col'] : $row;
		$unit = isset( $value['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $value['unit'] ) : 'px';
		return array( $row . $unit, $col . $unit );
	}
	$gap = is_numeric( $value ) ? (float) $value : (float) $fallback;
	return array( $gap . 'px', $gap . 'px' );
};

/**
 * Grid tracks: the modern { columns, rows, auto_flow, auto_rows } object, a
 * legacy template string, or the pre-modes `grid_columns_count` number.
 *
 * @return array{0:string,1:string,2:string,3:string} columns, rows, auto-flow, auto-rows
 */
$xsb_grid_tracks = function ( $value, $s ) use ( $xsb_css_safe ) {
	$fallback = ! empty( $s['grid_columns_count'] )
		? 'repeat(' . absint( $s['grid_columns_count'] ) . ', minmax(0, 1fr))'
		: 'repeat(3, minmax(0, 1fr))';

	if ( is_array( $value ) ) {
		$columns = ! empty( $value['columns'] ) ? $xsb_css_safe( $value['columns'] ) : $fallback;
		$rows    = ! empty( $value['rows'] ) && 'auto' !== $value['rows'] ? $xsb_css_safe( $value['rows'] ) : '';
		$flow    = ! empty( $value['auto_flow'] ) ? $xsb_css_safe( $value['auto_flow'] ) : '';
		$auto    = ! empty( $value['auto_rows'] ) && 'auto' !== $value['auto_rows'] ? $xsb_css_safe( $value['auto_rows'] ) : '';
		return array( $columns ? $columns : $fallback, $rows, $flow, $auto );
	}

	if ( is_string( $value ) && '' !== trim( $value ) ) {
		return array( $xsb_css_safe( $value ), '', '', '' );
	}

	return array( $fallback, '', '', '' );
};

/**
 * Effective settings for one device: the bare (desktop) keys overlaid with the
 * device's own `tablet_` / `mobile_` prefixed overrides. Mirrors
 * styles/responsive.js so the inline styles, the media queries and the editor
 * preview all cascade the same way.
 */
$xsb_for_device = function ( $device ) use ( $settings ) {
	if ( 'desktop' === $device ) {
		return $settings;
	}

	$effective = $settings;

	if ( 'mobile' === $device ) {
		foreach ( $settings as $key => $value ) {
			if ( 0 === strpos( (string) $key, 'tablet_' ) ) {
				$effective[ substr( $key, 7 ) ] = $value;
			}
		}
	}

	foreach ( $settings as $key => $value ) {
		if ( 0 === strpos( (string) $key, $device . '_' ) ) {
			$effective[ substr( $key, strlen( $device ) + 1 ) ] = $value;
		}
	}

	return $effective;
};

/**
 * Layout declarations for one mode. Kept in one builder so the desktop
 * inline styles, the per-device @media rules and the editor preview all read
 * from a single definition of each mode.
 *
 * @param string $mode Layout mode.
 * @param array  $s    Settings already resolved for the target device.
 * @return array<string,string> css property => value.
 */
$xsb_layout_decls = function ( $mode, $s ) use ( $xsb_gap_pair, $xsb_enum, $xsb_dim, $xsb_grid_tracks, $xsb_gap ) {
	$decls = array();

	$gap_value = isset( $s['gap'] ) ? $s['gap'] : $xsb_gap;

	if ( 'list' === $mode || 'row' === $mode ) {
		list( $row_gap, $col_gap ) = $xsb_gap_pair( $gap_value, $xsb_gap );
		$is_row = 'row' === $mode;

		$decls['display']         = 'flex';
		$decls['flex-direction']  = $xsb_enum( $s['flex_direction'] ?? '', array( 'row', 'row-reverse', 'column', 'column-reverse' ), $is_row ? 'row' : 'column' );
		$decls['flex-wrap']       = $xsb_enum( $s['flex_wrap'] ?? '', array( 'nowrap', 'wrap', 'wrap-reverse' ), $is_row ? 'wrap' : 'nowrap' );
		$decls['justify-content'] = $xsb_enum( $s['justify_content'] ?? '', array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly' ), 'flex-start' );
		$decls['align-items']     = ! empty( $s['equal_height'] )
			? 'stretch'
			: $xsb_enum( $s['align_items'] ?? '', array( 'flex-start', 'center', 'flex-end', 'stretch', 'baseline' ), 'stretch' );
		$decls['align-content']   = $xsb_enum( $s['align_content'] ?? '', array( 'stretch', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around' ), 'stretch' );
		$decls['row-gap']         = $row_gap;
		$decls['column-gap']      = $col_gap;
		return $decls;
	}

	if ( 'grid' === $mode ) {
		$tracks = $xsb_grid_tracks( $s['grid_template'] ?? '', $s );
		list( $grid_row, $grid_col ) = $xsb_gap_pair( $s['grid_gap'] ?? $gap_value, $xsb_gap );

		$decls['display']               = 'grid';
		$decls['grid-template-columns'] = $tracks[0];
		if ( '' !== $tracks[1] ) {
			$decls['grid-template-rows'] = $tracks[1];
		}
		$decls['row-gap']               = $grid_row;
		$decls['column-gap']            = $grid_col;
		$decls['align-items']           = $xsb_enum( $s['grid_align_items'] ?? '', array( 'start', 'center', 'end', 'stretch', 'baseline' ), 'stretch' );
		$decls['justify-items']         = $xsb_enum( $s['grid_justify_items'] ?? '', array( 'start', 'center', 'end', 'stretch' ), 'stretch' );
		$decls['align-content']         = $xsb_enum( $s['grid_align_content'] ?? '', array( 'start', 'center', 'end', 'stretch', 'space-between', 'space-around', 'space-evenly' ), '' );
		$decls['justify-content']       = $xsb_enum( $s['grid_justify_content'] ?? '', array( 'start', 'center', 'end', 'stretch', 'space-between', 'space-around', 'space-evenly' ), '' );
		$decls['grid-auto-flow']        = $xsb_enum( $tracks[2] ? $tracks[2] : ( $s['grid_auto_flow'] ?? '' ), array( 'row', 'column', 'dense', 'row dense', 'column dense' ), '' );
		$decls['grid-auto-rows']       = $tracks[3] ? $tracks[3] : ( ! empty( $s['grid_auto_rows'] ) && 'auto' !== $s['grid_auto_rows'] ? $xsb_dim( $s['grid_auto_rows'], 120 ) : '' );

		if ( ! empty( $s['grid_named_areas'] ) ) {
			$decls['grid-template-areas'] = '"' . str_replace( array( "\n", ';' ), array( '" "', '" "' ), $xsb_dim( $s['grid_named_areas'], '' , '' ) ) . '"';
		}

		return array_filter(
			$decls,
			function ( $value ) {
				return '' !== $value && null !== $value;
			}
		);
	}

	if ( 'masonry' === $mode ) {
		$decls['column-count'] = (string) min( 6, max( 1, absint( $s['masonry_columns'] ?? 3 ) ) );
		$decls['column-gap']   = $xsb_dim( $s['masonry_gap'] ?? 20, 20 );
		return $decls;
	}

	if ( 'scroll-row' === $mode ) {
		$snap = $xsb_enum( $s['scroll_snap_type'] ?? '', array( 'none', 'mandatory', 'proximity' ), 'mandatory' );

		$decls['display']       = 'flex';
		$decls['flex-direction'] = 'row';
		$decls['overflow-x']    = 'auto';
		$decls['gap']           = $xsb_dim( $s['scroll_gap'] ?? 20, 20 );
		$decls['padding-left']  = $xsb_dim( $s['scroll_padding_peek'] ?? 24, 24 );
		$decls['padding-right'] = $xsb_dim( $s['scroll_padding_peek'] ?? 24, 24 );
		if ( 'none' !== $snap ) {
			$decls['scroll-snap-type'] = 'x ' . $snap;
		}
		if ( ! empty( $s['scroll_hide_scrollbar'] ) ) {
			$decls['scrollbar-width'] = 'none';
		}
		return $decls;
	}

	// Columns: the conversation's original 12-unit grid.
	list( $col_row_gap, $col_col_gap ) = $xsb_gap_pair( $s['column_gap'] ?? $gap_value, $xsb_gap );
	$valign_map = array(
		'top'    => 'flex-start',
		'center' => 'center',
		'bottom' => 'flex-end',
	);

	$decls['display']      = 'grid';
	$decls['align-items']  = $xsb_enum( $s['column_valign'] ?? '', array( 'top', 'center', 'bottom', 'stretch' ), 'stretch' );
	$decls['align-items']  = isset( $valign_map[ $decls['align-items'] ] ) ? $valign_map[ $decls['align-items'] ] : $decls['align-items'];
	$decls['row-gap']      = $col_row_gap;
	$decls['column-gap']   = $col_col_gap;

	return $decls;
};

/**
 * Placement CSS for one nested widget, driven by the widget's own "Parent
 * Layout & Placement" settings and this container's mode. Mirrors
 * childPlacementStyle() in the editor canvas.
 *
 * @param array  $child      Nested block settings.
 * @param string $mode       Container layout mode.
 * @param string $item_width Scroll item width (scroll-row only).
 * @param array  $parent     Container settings (parent-level defaults).
 * @return string css declarations.
 */
$xsb_item_decls = function ( $child, $mode, $item_width, $parent = array() ) use ( $xsb_enum ) {
	$decls = array();

	if ( ! empty( $child['align_self'] ) && 'auto' !== $child['align_self'] ) {
		$decls[] = 'align-self:' . $xsb_enum( $child['align_self'], array( 'flex-start', 'center', 'flex-end', 'stretch', 'start', 'end', 'self-start', 'self-end' ), 'auto' );
	}

	if ( ! empty( $child['child_order'] ) && 0 !== (int) $child['child_order'] ) {
		$decls[] = 'order:' . (int) $child['child_order'];
	}

	if ( 'list' === $mode || 'row' === $mode ) {
		if ( isset( $child['flex_grow'] ) && '' !== $child['flex_grow'] ) {
			$decls[] = 'flex-grow:' . (float) $child['flex_grow'];
		}
		if ( isset( $child['flex_shrink'] ) && '' !== $child['flex_shrink'] ) {
			$decls[] = 'flex-shrink:' . (float) $child['flex_shrink'];
		}
		if ( ! empty( $child['flex_basis'] ) ) {
			$decls[] = 'flex-basis:' . preg_replace( '/[^0-9a-z%.\-]/i', '', (string) $child['flex_basis'] );
		}
		if ( ! empty( $child['child_min_width'] ) ) {
			$decls[] = 'min-width:' . (int) $child['child_min_width'] . 'px';
		}
		if ( ! empty( $child['child_max_width'] ) ) {
			$decls[] = 'max-width:' . (int) $child['child_max_width'] . 'px';
		}
		return implode( ';', $decls );
	}

	if ( 'grid' === $mode ) {
		if ( ! empty( $child['grid_area'] ) ) {
			$decls[] = 'grid-area:' . preg_replace( '/[^0-9a-z\-]/i', '', (string) $child['grid_area'] );
		} else {
			$span = min( 12, max( 1, absint( $child['grid_column_span'] ?? 1 ) ) );
			$decls[] = 'grid-column:span ' . $span;
			$row_span = min( 12, max( 1, absint( $child['grid_row_span'] ?? 1 ) ) );
			if ( $row_span > 1 ) {
				$decls[] = 'grid-row:span ' . $row_span;
			}
		}
		if ( ! empty( $child['grid_justify_self'] ) && 'auto' !== $child['grid_justify_self'] ) {
			$decls[] = 'justify-self:' . $xsb_enum( $child['grid_justify_self'], array( 'start', 'center', 'end', 'stretch' ), 'stretch' );
		}
		return implode( ';', $decls );
	}

	if ( 'masonry' === $mode ) {
		$decls[] = 'break-inside:' . ( 'auto' === ( $child['masonry_item_break'] ?? '' ) ? 'auto' : 'avoid' );
		if ( 'all' === ( $child['masonry_item_span'] ?? '' ) ) {
			$decls[] = 'column-span:all';
		}
		return implode( ';', $decls );
	}

	if ( 'scroll-row' === $mode ) {
		$decls[] = 'flex:0 0 auto';
		if ( $item_width ) {
			$decls[] = 'width:' . $item_width;
		}
		// An item may pick its own snap edge; otherwise the row's default wins.
		$snap = ! empty( $child['scroll_snap_align'] ) ? $child['scroll_snap_align'] : ( $parent['scroll_snap_align'] ?? '' );
		$decls[] = 'scroll-snap-align:' . $xsb_enum( $snap, array( 'start', 'center', 'end' ), 'start' );
		return implode( ';', $decls );
	}

	return implode( ';', $decls );
};

$xsb_base_layout = $xsb_layout_decls( $xsb_layout_mode, $settings );
$xsb_layout_css  = '';
foreach ( $xsb_base_layout as $xsb_prop => $xsb_value ) {
	$xsb_layout_css .= $xsb_prop . ':' . $xsb_value . ';';
}

// Stored per-column widths on the 12-unit grid (older layouts have none).
$xsb_stored_widths = ! empty( $settings['column_widths'] ) && is_array( $settings['column_widths'] )
	? array_values( $settings['column_widths'] )
	: array();

$xsb_width_base = (int) floor( 12 / $xsb_cols );
$xsb_width_rem  = 12 % $xsb_cols;

$xsb_widths = array();
for ( $xsb_i = 0; $xsb_i < $xsb_cols; $xsb_i++ ) {
	if ( isset( $xsb_stored_widths[ $xsb_i ] ) && is_numeric( $xsb_stored_widths[ $xsb_i ] ) ) {
		// Gutter drags and custom ratios store fractional units, so keep the
		// precision and let the % track list below carry the layout.
		$xsb_widths[ $xsb_i ] = min( 12, max( 0.5, (float) $xsb_stored_widths[ $xsb_i ] ) );
	} else {
		$xsb_widths[ $xsb_i ] = $xsb_width_base + ( $xsb_i < $xsb_width_rem ? 1 : 0 );
	}
}

// A fractional track cannot express a `span`, so such layouts switch to a
// percentage column list (the canvas does the same).
$xsb_percent_widths = false;
foreach ( $xsb_widths as $xsb_w ) {
	if ( (float) $xsb_w !== (float) (int) $xsb_w ) {
		$xsb_percent_widths = true;
		break;
	}
}

if ( 'columns' === $xsb_layout_mode ) {
	if ( $xsb_percent_widths ) {
		$xsb_sums   = array_sum( $xsb_widths );
		$xsb_tracks = array();
		foreach ( $xsb_widths as $xsb_w ) {
			$xsb_tracks[] = round( ( $xsb_w / ( $xsb_sums ? $xsb_sums : 12 ) ) * 100, 2 ) . '%';
		}
		$xsb_percent_list        = implode( ' ', $xsb_tracks );
		$xsb_base_layout['grid-template-columns'] = $xsb_percent_list;
		$xsb_layout_css          = '';
		foreach ( $xsb_base_layout as $xsb_prop => $xsb_value ) {
			$xsb_layout_css .= $xsb_prop . ':' . $xsb_value . ';';
		}
	} else {
		$xsb_base_layout['grid-template-columns'] = 'repeat(12, minmax(0, 1fr))';
		$xsb_layout_css                          = '';
		foreach ( $xsb_base_layout as $xsb_prop => $xsb_value ) {
			$xsb_layout_css .= $xsb_prop . ':' . $xsb_value . ';';
		}
	}
}

$xsb_columns = isset( $block['inner'] ) && is_array( $block['inner'] )
	? $block['inner']
	: array();

// Ensure each nested column is an array of blocks.
$xsb_normalized = array();
for ( $xsb_i = 0; $xsb_i < $xsb_cols; $xsb_i++ ) {
	$xsb_normalized[ $xsb_i ] = isset( $xsb_columns[ $xsb_i ] ) && is_array( $xsb_columns[ $xsb_i ] )
		? array_values( $xsb_columns[ $xsb_i ] )
		: array();
}

// Non-column modes read every widget in authoring order, across columns.
$xsb_flat_items = array();
foreach ( $xsb_normalized as $xsb_ci => $xsb_column_blocks ) {
	foreach ( $xsb_column_blocks as $xsb_bi => $xsb_inner_block ) {
		$xsb_flat_items[] = array(
			'block' => $xsb_inner_block,
			'ci'    => $xsb_ci,
			'bi'    => $xsb_bi,
		);
	}
}

$xsb_col_styles = ( isset( $settings['column_styles'] ) && is_array( $settings['column_styles'] ) )
	? array_values( $settings['column_styles'] )
	: array();

// Scroll mode item width (shared by every item in the row).
$xsb_scroll_item_width = '';
if ( 'scroll-row' === $xsb_layout_mode && isset( $settings['scroll_item_width'] ) && '' !== $settings['scroll_item_width'] ) {
	$siw = $settings['scroll_item_width'];
	if ( is_array( $siw ) ) {
		$siw_unit = isset( $siw['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $siw['unit'] ) : 'px';
		$xsb_scroll_item_width = (float) ( $siw['value'] ?? 280 ) . $siw_unit;
	} else {
		$xsb_scroll_item_width = (float) $siw . 'px';
	}
}

// ---------------------------------------------------------------------------
// Container box: padding, background, border, shadow, effects, positioning.
// Layout (flex/grid/masonry/scroll) lives on the container in columns mode and
// on the inner flow wrapper in every other mode.
// ---------------------------------------------------------------------------
$xsb_style  = '';
$xsb_style .= 'padding:' . $xsb_pad_top . ' ' . $xsb_pad_right . ' ' . $xsb_pad_bottom . ' ' . $xsb_pad_left . ';';
$xsb_style .= 'border-radius:' . $xsb_radius . ';';

if ( 'columns' === $xsb_layout_mode ) {
	$xsb_style .= $xsb_layout_css;
}

if ( in_array( $xsb_align, array( 'start', 'center', 'end' ), true ) ) {
	$xsb_style .= 'align-items:' . $xsb_align . ';';
}

if ( ! empty( $xsb_bg ) ) {
	$xsb_style .= 'background:' . esc_attr( $xsb_bg ) . ';';
}

if ( is_array( $xsb_shadow ) && ! empty( $xsb_shadow ) ) {
	$shadow_parts = array();
	foreach ( $xsb_shadow as $s ) {
		$inset = ! empty( $s['inset'] ) ? 'inset ' : '';
		$shadow_parts[] = sprintf( '%s%dpx %dpx %dpx %dpx %s', $inset, (int) ( $s['x'] ?? 0 ), (int) ( $s['y'] ?? 4 ), (int) ( $s['blur'] ?? 14 ), (int) ( $s['spread'] ?? 0 ), $s['color'] ?? 'rgba(0,0,0,0.1)' );
	}
	$xsb_style .= 'box-shadow:' . implode( ', ', $shadow_parts ) . ';';
} elseif ( isset( $xsb_shadow_map[ $xsb_shadow ] ) && '' !== $xsb_shadow_map[ $xsb_shadow ] ) {
	$xsb_style .= 'box-shadow:' . $xsb_shadow_map[ $xsb_shadow ] . ';';
}

if ( ! empty( $settings['border_width'] ) && is_array( $settings['border_width'] ) ) {
	$bw = $settings['border_width'];
	$xsb_style .= sprintf(
		'border-style:%s;border-color:%s;border-width:%dpx %dpx %dpx %dpx;',
		esc_attr( $xsb_border_s ),
		esc_attr( $xsb_border_c ? $xsb_border_c : '#000000' ),
		(int) ( $bw['top'] ?? 1 ),
		(int) ( $bw['right'] ?? 1 ),
		(int) ( $bw['bottom'] ?? 1 ),
		(int) ( $bw['left'] ?? 1 )
	);
} elseif ( $xsb_border_w > 0 ) {
	$xsb_style .= 'border:' . $xsb_border_w . 'px ' . esc_attr( $xsb_border_s ) . ' ' . esc_attr( $xsb_border_c ? $xsb_border_c : '#000000' ) . ';';
}

if ( ! empty( $settings['backdrop_filter_blur'] ) && (int) $settings['backdrop_filter_blur'] > 0 ) {
	$xsb_style .= sprintf( 'backdrop-filter:blur(%dpx);-webkit-backdrop-filter:blur(%dpx);', (int) $settings['backdrop_filter_blur'], (int) $settings['backdrop_filter_blur'] );
}

$xsb_anim_class = '';
if ( 'none' !== $xsb_anim && in_array( $xsb_anim, $xsb_anim_list, true ) ) {
	$xsb_anim_class = ' xsb-anim-' . $xsb_anim;
	$xsb_style .= 'animation-duration:' . $xsb_anim_ms . 'ms;';
	$xsb_style .= 'animation-delay:' . $xsb_anim_delay . 'ms;';
}

// Position the whole container (left / center / right / boxed) with a max width.
if ( ( in_array( $xsb_position, array( 'left', 'center', 'right' ), true ) || ( ! empty( $settings['content_width'] ) && 'boxed' === $settings['content_width'] ) ) && $xsb_max_width > 0 ) {
	$xsb_style .= 'width:100%;max-width:' . $xsb_max_width . 'px;';

	if ( 'center' === $xsb_position || ( ! empty( $settings['content_width'] ) && 'boxed' === $settings['content_width'] ) ) {
		$xsb_style .= 'margin-left:auto;margin-right:auto;';
	} elseif ( 'right' === $xsb_position ) {
		$xsb_style .= 'margin-left:auto;';
	} else {
		$xsb_style .= 'margin-right:auto;';
	}
} elseif ( isset( $settings['width'] ) && '' !== $settings['width'] ) {
	if ( is_array( $settings['width'] ) ) {
		$w_val  = isset( $settings['width']['value'] ) ? (float) $settings['width']['value'] : 100;
		$w_unit = isset( $settings['width']['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $settings['width']['unit'] ) : '%';
		$xsb_style .= 'width:' . $w_val . $w_unit . ';';
	} elseif ( is_numeric( $settings['width'] ) ) {
		$xsb_style .= 'width:' . (float) $settings['width'] . '%;';
	}
}

// Container Min-Height
if ( isset( $settings['min_height'] ) && '' !== $settings['min_height'] ) {
	if ( is_array( $settings['min_height'] ) ) {
		$mh_val  = isset( $settings['min_height']['value'] ) ? (float) $settings['min_height']['value'] : 0;
		$mh_unit = isset( $settings['min_height']['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $settings['min_height']['unit'] ) : 'px';
		if ( $mh_val > 0 ) {
			$xsb_style .= 'min-height:' . $mh_val . $mh_unit . ';';
		}
	} elseif ( is_numeric( $settings['min_height'] ) && (float) $settings['min_height'] > 0 ) {
		$xsb_style .= 'min-height:' . (float) $settings['min_height'] . 'px;';
	}
}

// Spacing (Margin)
if ( isset( $settings['margin'] ) && is_array( $settings['margin'] ) ) {
	$xsb_mu = isset( $settings['margin']['unit'] ) ? $settings['margin']['unit'] : 'px';
	$xsb_style .= sprintf(
		'margin-top:%d%s;margin-bottom:%d%s;',
		isset( $settings['margin']['top'] ) ? (int) $settings['margin']['top'] : 0, $xsb_mu,
		isset( $settings['margin']['bottom'] ) ? (int) $settings['margin']['bottom'] : 0, $xsb_mu
	);
	if ( empty( $settings['content_width'] ) || 'boxed' !== $settings['content_width'] ) {
		$xsb_style .= sprintf(
			'margin-left:%d%s;margin-right:%d%s;',
			isset( $settings['margin']['left'] ) ? (int) $settings['margin']['left'] : 0, $xsb_mu,
			isset( $settings['margin']['right'] ) ? (int) $settings['margin']['right'] : 0, $xsb_mu
		);
	}
}

// Position & Z-Index
if ( ! empty( $settings['position'] ) && in_array( $settings['position'], array( 'relative', 'absolute', 'fixed', 'sticky' ), true ) ) {
	$xsb_style .= 'position:' . esc_attr( $settings['position'] ) . ';';
}
if ( isset( $settings['z_index'] ) && '' !== $settings['z_index'] ) {
	$xsb_style .= 'z-index:' . (int) $settings['z_index'] . ';';
}

// Transform (Rotate, Scale, Origin, Transition)
$xsb_transforms = array();
if ( isset( $settings['rotate'] ) && (int) $settings['rotate'] !== 0 ) {
	$xsb_transforms[] = sprintf( 'rotate(%ddeg)', (int) $settings['rotate'] );
}
if ( isset( $settings['scale'] ) && (float) $settings['scale'] !== 1.0 && (float) $settings['scale'] > 0 ) {
	$xsb_transforms[] = sprintf( 'scale(%s)', (float) $settings['scale'] );
}
if ( ! empty( $xsb_transforms ) ) {
	$xsb_style .= 'transform:' . implode( ' ', $xsb_transforms ) . ';';
}
if ( ! empty( $settings['transform_origin'] ) ) {
	$xsb_style .= 'transform-origin:' . esc_attr( $settings['transform_origin'] ) . ';';
}
if ( ! empty( $settings['transition_duration'] ) ) {
	$xsb_td = is_array( $settings['transition_duration'] ) ? ( $settings['transition_duration']['value'] ?? 300 ) : $settings['transition_duration'];
	$xsb_style .= 'transition:all ' . absint( $xsb_td ) . 'ms cubic-bezier(0.16, 1, 0.3, 1);';
}

// Classes: custom CSS classes, responsive visibility, hover animation
$xsb_extra_classes = array();
if ( ! empty( $settings['css_class'] ) ) {
	$classes = array_filter( array_map( 'sanitize_html_class', explode( ' ', $settings['css_class'] ) ) );
	foreach ( $classes as $c ) {
		$xsb_extra_classes[] = $c;
	}
}
if ( ! empty( $settings['hide_desktop'] ) || ! empty( $settings['hide_on_desktop'] ) ) {
	$xsb_extra_classes[] = 'xsb-hide-desktop';
}
if ( ! empty( $settings['hide_tablet'] ) || ! empty( $settings['hide_on_tablet'] ) ) {
	$xsb_extra_classes[] = 'xsb-hide-tablet';
}
if ( ! empty( $settings['hide_mobile'] ) || ! empty( $settings['hide_on_mobile'] ) ) {
	$xsb_extra_classes[] = 'xsb-hide-mobile';
}
if ( ! empty( $settings['hover_animation'] ) && 'none' !== $settings['hover_animation'] ) {
	$xsb_extra_classes[] = 'xsb-hover-' . sanitize_html_class( $settings['hover_animation'] );
}
$xsb_classes_str = ! empty( $xsb_extra_classes ) ? ' ' . implode( ' ', $xsb_extra_classes ) : '';
$xsb_id_attr     = ! empty( $settings['css_id'] ) ? ' id="' . esc_attr( sanitize_html_class( $settings['css_id'] ) ) . '"' : '';

$allowed_tags = array( 'div', 'section', 'header', 'footer', 'main', 'article', 'aside', 'nav', 'a' );
$xsb_tag      = ( ! empty( $settings['html_tag'] ) && in_array( $settings['html_tag'], $allowed_tags, true ) ) ? $settings['html_tag'] : 'div';
$xsb_link_attr = ( 'a' === $xsb_tag && ! empty( $settings['link_url'] ) )
	? ' href="' . esc_url( $settings['link_url'] ) . '"' . ( ! empty( $settings['link_target_blank'] ) ? ' target="_blank" rel="noopener"' : '' )
	: '';

// ---------------------------------------------------------------------------
// Scoped rules: hover state + per-device layout. Both are keyed off the
// per-instance token so nested containers never inherit each other's rules.
// ---------------------------------------------------------------------------
$xsb_scoped_css = '';

$xsb_hover_decls = array();
$xsb_hover_get   = function ( $key ) use ( $settings ) {
	return isset( $settings[ $key ] ) && '' !== $settings[ $key ] && null !== $settings[ $key ] ? $settings[ $key ] : null;
};

$xsb_hover_bg = null;
if ( null !== $xsb_hover_get( 'hover_bg_color' ) ) {
	$xsb_hover_bg = (string) $settings['hover_bg_color'];
}
if ( 'gradient' === $xsb_hover_get( 'hover_bg_type' ) && ! empty( $settings['hover_gradient'] ) && is_array( $settings['hover_gradient'] ) ) {
	$hg     = $settings['hover_gradient'];
	$hg_a   = $hg['colorA'] ?? '#4f46e5';
	$hg_b   = $hg['colorB'] ?? '#06b6d4';
	$hg_pa  = (int) ( $hg['posA'] ?? 0 );
	$hg_pb  = (int) ( $hg['posB'] ?? 100 );
	$xsb_hover_bg = 'radial' === ( $hg['type'] ?? 'linear' )
		? sprintf( 'radial-gradient(circle, %s %d%%, %s %d%%)', $hg_a, $hg_pa, $hg_b, $hg_pb )
		: sprintf( 'linear-gradient(%ddeg, %s %d%%, %s %d%%)', (int) ( $hg['angle'] ?? 90 ), $hg_a, $hg_pa, $hg_b, $hg_pb );
} elseif ( 'image' === $xsb_hover_get( 'hover_bg_type' ) && ! empty( $settings['hover_bg_image'] ) ) {
	$hover_img = is_array( $settings['hover_bg_image'] ) ? ( $settings['hover_bg_image']['url'] ?? '' ) : $settings['hover_bg_image'];
	if ( $hover_img ) {
		$xsb_hover_bg = 'url("' . esc_url( $hover_img ) . '") center / cover no-repeat';
	}
}
if ( null !== $xsb_hover_bg ) {
	$xsb_hover_decls[] = 'background:' . esc_attr( $xsb_hover_bg );
}

$xsb_hover_bw = $xsb_hover_get( 'hover_border_width' );
if ( is_array( $xsb_hover_bw ) ) {
	$xsb_hover_decls[] = 'border-style:' . esc_attr( $xsb_hover_get( 'hover_border_style' ) ? $xsb_hover_get( 'hover_border_style' ) : 'solid' );
	$xsb_hover_decls[] = 'border-color:' . esc_attr( $xsb_hover_get( 'hover_border_color' ) ? $xsb_hover_get( 'hover_border_color' ) : '#000000' );
	$xsb_hover_decls[] = sprintf(
		'border-width:%dpx %dpx %dpx %dpx',
		(int) ( $xsb_hover_bw['top'] ?? 1 ),
		(int) ( $xsb_hover_bw['right'] ?? 1 ),
		(int) ( $xsb_hover_bw['bottom'] ?? 1 ),
		(int) ( $xsb_hover_bw['left'] ?? 1 )
	);
} elseif ( null !== $xsb_hover_bw && (float) $xsb_hover_bw > 0 ) {
	$xsb_hover_decls[] = 'border:' . (float) $xsb_hover_bw . 'px ' . esc_attr( $xsb_hover_get( 'hover_border_style' ) ? $xsb_hover_get( 'hover_border_style' ) : 'solid' ) . ' ' . esc_attr( $xsb_hover_get( 'hover_border_color' ) ? $xsb_hover_get( 'hover_border_color' ) : '#000000' );
} elseif ( null !== $xsb_hover_get( 'hover_border_color' ) ) {
	$xsb_hover_decls[] = 'border-color:' . esc_attr( $settings['hover_border_color'] );
}

$xsb_hover_radius = $xsb_hover_get( 'hover_border_radius' );
if ( is_array( $xsb_hover_radius ) ) {
	$hru = isset( $xsb_hover_radius['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $xsb_hover_radius['unit'] ) : 'px';
	$xsb_hover_decls[] = sprintf(
		'border-radius:%d%s %d%s %d%s %d%s',
		(int) ( $xsb_hover_radius['top'] ?? 8 ), $hru,
		(int) ( $xsb_hover_radius['right'] ?? 8 ), $hru,
		(int) ( $xsb_hover_radius['bottom'] ?? 8 ), $hru,
		(int) ( $xsb_hover_radius['left'] ?? 8 ), $hru
	);
} elseif ( null !== $xsb_hover_radius ) {
	$xsb_hover_decls[] = 'border-radius:' . (float) $xsb_hover_radius . 'px';
}

$xsb_hover_shadow = $xsb_hover_get( 'hover_box_shadow' );
if ( is_array( $xsb_hover_shadow ) && ! empty( $xsb_hover_shadow ) ) {
	$hover_shadow_parts = array();
	foreach ( $xsb_hover_shadow as $hs ) {
		if ( ! is_array( $hs ) ) {
			continue;
		}
		$hover_shadow_parts[] = sprintf(
			'%s%dpx %dpx %dpx %dpx %s',
			! empty( $hs['inset'] ) ? 'inset ' : '',
			(int) ( $hs['x'] ?? 0 ),
			(int) ( $hs['y'] ?? 4 ),
			(int) ( $hs['blur'] ?? 14 ),
			(int) ( $hs['spread'] ?? 0 ),
			$hs['color'] ?? 'rgba(0,0,0,0.1)'
		);
	}
	if ( ! empty( $hover_shadow_parts ) ) {
		$xsb_hover_decls[] = 'box-shadow:' . implode( ', ', $hover_shadow_parts );
	}
} elseif ( is_string( $xsb_hover_shadow ) && ! empty( $xsb_shadow_map[ $xsb_hover_shadow ] ) ) {
	$xsb_hover_decls[] = 'box-shadow:' . $xsb_shadow_map[ $xsb_hover_shadow ];
}

if ( null !== $xsb_hover_get( 'hover_opacity' ) ) {
	$xsb_hover_decls[] = 'opacity:' . (float) $settings['hover_opacity'];
}

$xsb_hover_parts = array();
if ( ! empty( $settings['hover_rotate'] ) ) {
	$xsb_hover_parts[] = sprintf( 'rotate(%ddeg)', (int) $settings['hover_rotate'] );
}
if ( ! empty( $settings['hover_scale'] ) && (float) $settings['hover_scale'] > 0 && 1.0 !== (float) $settings['hover_scale'] ) {
	$xsb_hover_parts[] = sprintf( 'scale(%s)', (float) $settings['hover_scale'] );
}
if ( ! empty( $xsb_hover_parts ) ) {
	$xsb_hover_decls[] = 'transform:' . implode( ' ', $xsb_hover_parts );
}

if ( ! empty( $xsb_hover_decls ) ) {
	$xsb_scoped_css .= "\n" . '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"]:hover { ' . implode( '; ', $xsb_hover_decls ) . '; }';
}

// Per-device layout: only the properties that device actually overrides.
$xsb_device_widths = array(
	'tablet' => 768,
	'mobile' => 480,
);

foreach ( $xsb_device_widths as $xsb_device => $xsb_max_w ) {
	$xsb_device_settings = $xsb_for_device( $xsb_device );
	$xsb_device_layout   = $xsb_layout_decls( $xsb_layout_mode, $xsb_device_settings );
	$xsb_item_rules      = array();
	$xsb_extra_rules     = array();

	if ( 'columns' === $xsb_layout_mode ) {
		$xsb_device_cols = min( 6, max( 1, absint( $xsb_device_settings['columns'] ?? $xsb_cols ) ) );
		// Stacking is opt-in: containers authored before the option existed keep
		// their side-by-side columns at every width.
		$xsb_stack_at = isset( $settings['stacking_breakpoint'] ) ? (string) $settings['stacking_breakpoint'] : 'none';
		$xsb_reverse  = ! empty( $settings['column_reverse_mobile'] );

		// Stacking turns the 12-unit grid into one full-width column per row
		// (reversed when asked) — the single-widget-per-row layout authors
		// expect on phones.
		$xsb_stacked = ( 'tablet' === $xsb_stack_at ) || ( 'mobile' === $xsb_stack_at && 'mobile' === $xsb_device );

		if ( $xsb_stacked ) {
			$xsb_extra_rules[] = '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"] { display:flex; flex-direction:' . ( $xsb_reverse ? 'column-reverse' : 'column' ) . '; }';
			$xsb_extra_rules[] = '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"] > .xsb-container-col { grid-column:auto; width:100%; }';
		} elseif ( $xsb_device_cols !== $xsb_cols && ! $xsb_percent_widths ) {
			// Fewer columns than desktop reflow the grid: each column spans
			// (12 / N) units so the extra ones wrap onto the next row. An
			// explicit `{device}_column_widths` override (handled by the
			// registry's span rules) always wins over this derivation.
			$xsb_has_width_overrides = isset( $settings[ $xsb_device . '_column_widths' ] ) && is_array( $settings[ $xsb_device . '_column_widths' ] );
			if ( ! $xsb_has_width_overrides ) {
				$xsb_span = max( 1, (int) floor( 12 / $xsb_device_cols ) );
				foreach ( $xsb_normalized as $xsb_di => $xsb_unused ) {
					$xsb_extra_rules[] = '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"] > .xsb-container-col:nth-child(' . ( $xsb_di + 1 ) . ') { grid-column:auto / span ' . $xsb_span . '; }';
				}
			}
		} elseif ( $xsb_reverse ) {
			// Reverse without stacking: grid items place in `order` sequence, so
			// give each column the mirrored order value.
			$xsb_total = count( $xsb_normalized );
			foreach ( $xsb_normalized as $xsb_di => $xsb_unused ) {
				$xsb_extra_rules[] = '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"] > .xsb-container-col:nth-child(' . ( $xsb_di + 1 ) . ') { order:' . ( $xsb_total - $xsb_di ) . '; }';
			}
		}
	}

	$xsb_diff = array();
	foreach ( $xsb_device_layout as $xsb_prop => $xsb_value ) {
		if ( ! isset( $xsb_base_layout[ $xsb_prop ] ) || (string) $xsb_base_layout[ $xsb_prop ] !== (string) $xsb_value ) {
			$xsb_diff[ $xsb_prop ] = $xsb_value;
		}
	}

	// Scroll mode: the item width is per-device too.
	if ( 'scroll-row' === $xsb_layout_mode && isset( $xsb_device_settings['scroll_item_width'] ) && '' !== $xsb_device_settings['scroll_item_width'] ) {
		$siw = $xsb_device_settings['scroll_item_width'];
		$xsb_device_item_width = is_array( $siw )
			? (float) ( $siw['value'] ?? 280 ) . ( isset( $siw['unit'] ) ? preg_replace( '/[^a-z%]/', '', (string) $siw['unit'] ) : 'px' )
			: (float) $siw . 'px';
		$xsb_item_rules[] = '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"] > .xsb-container-item { width:' . $xsb_device_item_width . '; }';
	}

	$xsb_device_css = '';
	foreach ( $xsb_diff as $xsb_prop => $xsb_value ) {
		$xsb_device_css .= $xsb_prop . ':' . $xsb_value . ';';
	}

	if ( '' !== $xsb_device_css ) {
		$xsb_selector = 'columns' === $xsb_layout_mode
			? '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"]'
			: '[data-xsb-layout="' . esc_attr( $xsb_token ) . '"] > .xsb-container-flow';

		array_unshift( $xsb_extra_rules, $xsb_selector . ' { ' . $xsb_device_css . ' }' );
	}

	$xsb_rules = array_merge( $xsb_item_rules, $xsb_extra_rules );
	if ( empty( $xsb_rules ) ) {
		continue;
	}

	$xsb_scoped_css .= "\n@media (max-width: " . $xsb_max_w . 'px) { ' . implode( ' ', $xsb_rules ) . ' }';
}

$xsb_output = '<' . $xsb_tag . $xsb_id_attr . $xsb_link_attr . ' class="xsb-container xsb-layout--' . esc_attr( $xsb_layout_mode ) . $xsb_anim_class . $xsb_classes_str . '" style="' . $xsb_style . '" data-xsb-layout="' . esc_attr( $xsb_token ) . '">';

// Scoped Custom CSS block
if ( ! empty( $settings['custom_css'] ) ) {
	$xsb_uid = ! empty( $settings['css_id'] ) ? '#' . esc_attr( sanitize_html_class( $settings['css_id'] ) ) : '.xsb-container';
	$xsb_scoped = str_replace( 'selector', $xsb_uid, $settings['custom_css'] );
	$xsb_output .= '<style>' . wp_strip_all_tags( $xsb_scoped ) . '</style>';
}

if ( '' !== $xsb_scoped_css ) {
	$xsb_output .= '<style>' . wp_strip_all_tags( $xsb_scoped_css ) . '</style>';
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------
if ( 'columns' !== $xsb_layout_mode ) {
	// Flow modes: the container stays the visual box (background, padding,
	// border) and an inner wrapper carries the flex / grid / masonry / scroll
	// behaviour, so its children are real layout items — same structure the
	// editor canvas renders.
	$xsb_output .= '<div class="xsb-container-flow xsb-container-flow--' . esc_attr( $xsb_layout_mode ) . '" style="width:100%;box-sizing:border-box;' . $xsb_layout_css . '">';

	foreach ( $xsb_flat_items as $xsb_item ) {
		$xsb_inner_block = $xsb_item['block'];
		if ( ! isset( $xsb_inner_block['type'] ) ) {
			continue;
		}

		// Support nested containers up to depth 5 to avoid infinite loops.
		$is_container = in_array( $xsb_inner_block['type'], array( 'xcosb/gb-container', 'xcopb/gb-container', 'xsb/gb-container' ), true );
		$xsb_depth    = isset( $context['container_depth'] ) ? (int) $context['container_depth'] : 0;
		if ( $is_container && $xsb_depth >= 5 ) {
			continue;
		}

		$xsb_child_settings = isset( $xsb_inner_block['settings'] ) && is_array( $xsb_inner_block['settings'] )
			? $xsb_inner_block['settings']
			: array();
		$xsb_item_css = $xsb_item_decls( $xsb_child_settings, $xsb_layout_mode, $xsb_scroll_item_width, $settings );

		$child_context = array_merge( is_array( $context ) ? $context : array(), array( 'container_depth' => $xsb_depth + 1 ) );
		$xsb_output   .= '<div class="xsb-container-item"' . ( '' !== $xsb_item_css ? ' style="' . $xsb_item_css . '"' : '' ) . '>';
		$xsb_output   .= XCOPB_Block_Registry::instance()->render_block( $xsb_inner_block['type'], $xsb_inner_block, $child_context );
		$xsb_output   .= '</div>';
	}

	$xsb_output .= '</div>';
	$xsb_output .= '</div>';

	echo wp_kses( $xsb_output, XCOPB_Block_Registry::allowed_output_html() );
	return;
}

// Cursor tracks the first free grid line so per-column start offsets never
// overlap: columns are placed line-by-line, gaps only where requested.
$xsb_cursor = 1;

foreach ( $xsb_normalized as $xsb_index => $xsb_column ) {
	$xsb_span = isset( $xsb_widths[ $xsb_index ] ) ? $xsb_widths[ $xsb_index ] : 1;

	$xsb_col_class = 'xsb-container-col';
	$xsb_cs        = isset( $xsb_col_styles[ $xsb_index ] ) && is_array( $xsb_col_styles[ $xsb_index ] )
		? $xsb_col_styles[ $xsb_index ]
		: array();

	// Column start line on the 12-unit grid (0 = right after the previous
	// column so the row stays left-to-right).
	$xsb_req    = ( ! empty( $xsb_cs ) && isset( $xsb_cs['start'] ) ) ? absint( $xsb_cs['start'] ) : 0;
	$xsb_line   = ( $xsb_req > 0 && $xsb_req >= $xsb_cursor ) ? min( 12, $xsb_req ) : $xsb_cursor;
	$xsb_cursor = $xsb_line + $xsb_span;

	// Fractional spans cannot be expressed as a `span`, so they switch to the
	// percentage column list (which places columns in order).
	$xsb_col_css = $xsb_percent_widths
		? 'grid-column:auto;'
		: 'grid-column:' . (int) $xsb_line . ' / span ' . (int) round( $xsb_span ) . ';';

	if ( ! empty( $xsb_cs ) ) {
		// Content alignment inside the column. The column becomes a flex
		// column only when an alignment is chosen so untouched layouts keep
		// their exact previous markup/layout.
		$xsb_align_v = isset( $xsb_cs['align_v'] ) ? $xsb_cs['align_v'] : '';
		$xsb_align_h = isset( $xsb_cs['align_h'] ) ? $xsb_cs['align_h'] : '';

		if ( in_array( $xsb_align_v, array( 'top', 'center', 'bottom' ), true ) || in_array( $xsb_align_h, array( 'left', 'center', 'right' ), true ) ) {
			$xsb_col_css .= 'display:flex;flex-direction:column;';

			if ( in_array( $xsb_align_v, array( 'top', 'center', 'bottom' ), true ) ) {
				$xsb_justify = 'flex-start';
				if ( 'center' === $xsb_align_v ) {
					$xsb_justify = 'center';
				} elseif ( 'bottom' === $xsb_align_v ) {
					$xsb_justify = 'flex-end';
				}
				$xsb_col_css .= 'justify-content:' . $xsb_justify . ';';
			}

			if ( in_array( $xsb_align_h, array( 'left', 'center', 'right' ), true ) ) {
				$xsb_align_items = 'flex-start';
				if ( 'center' === $xsb_align_h ) {
					$xsb_align_items = 'center';
				} elseif ( 'right' === $xsb_align_h ) {
					$xsb_align_items = 'flex-end';
				}
				$xsb_col_css .= 'align-items:' . $xsb_align_items . ';';
				$xsb_col_css .= 'text-align:' . esc_attr( $xsb_align_h ) . ';';
			}
		}

		// Box presentation (background / padding / border / radius / shadow).
		$xsb_cbg   = ! empty( $xsb_cs['background'] ) ? $xsb_cs['background'] : '';
		$xsb_crad  = isset( $xsb_cs['border_radius'] ) ? max( 0, absint( $xsb_cs['border_radius'] ) ) : 0;
		$xsb_cbw   = isset( $xsb_cs['border_width'] ) ? max( 0, absint( $xsb_cs['border_width'] ) ) : 0;
		$xsb_cbs   = ! empty( $xsb_cs['border_style'] ) ? $xsb_cs['border_style'] : 'solid';
		$xsb_cbc   = ! empty( $xsb_cs['border_color'] ) ? $xsb_cs['border_color'] : '#000000';
		$xsb_csh   = isset( $xsb_cs['box_shadow'] ) ? $xsb_cs['box_shadow'] : 'none';
		$xsb_cpads = array();
		$xsb_any   = ( '' !== $xsb_cbg );

		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $xsb_side ) {
			$xsb_cpads[ $xsb_side ] = isset( $xsb_cs[ 'padding_' . $xsb_side ] ) ? max( 0, absint( $xsb_cs[ 'padding_' . $xsb_side ] ) ) : 0;
			if ( $xsb_cpads[ $xsb_side ] > 0 ) {
				$xsb_any = true;
			}
		}

		if ( $xsb_crad > 0 || $xsb_cbw > 0 || ( isset( $xsb_shadow_map[ $xsb_csh ] ) && '' !== $xsb_shadow_map[ $xsb_csh ] ) ) {
			$xsb_any = true;
		}

		if ( $xsb_any ) {
			$xsb_col_class .= ' xsb-container-col--styled';

			if ( '' !== $xsb_cbg ) {
				$xsb_col_css .= 'background:' . esc_attr( $xsb_cbg ) . ';';
			}

			$xsb_col_css .= sprintf(
				'padding-top:%1$dpx;padding-right:%2$dpx;padding-bottom:%3$dpx;padding-left:%4$dpx;',
				$xsb_cpads['top'],
				$xsb_cpads['right'],
				$xsb_cpads['bottom'],
				$xsb_cpads['left']
			);

			if ( $xsb_crad > 0 ) {
				$xsb_col_css .= 'border-radius:' . $xsb_crad . 'px;';
			}

			if ( $xsb_cbw > 0 ) {
				$xsb_col_css .= 'border:' . $xsb_cbw . 'px ' . esc_attr( $xsb_cbs ) . ' ' . esc_attr( $xsb_cbc ) . ';';
			}

			if ( isset( $xsb_shadow_map[ $xsb_csh ] ) && '' !== $xsb_shadow_map[ $xsb_csh ] ) {
				$xsb_col_css .= 'box-shadow:' . $xsb_shadow_map[ $xsb_csh ] . ';';
			}
		}
	}

	$xsb_output .= '<div class="' . esc_attr( $xsb_col_class ) . '" style="' . $xsb_col_css . '">';

	foreach ( $xsb_column as $xsb_inner_block ) {
		if ( ! isset( $xsb_inner_block['type'] ) ) {
			continue;
		}

		// Support nested containers up to depth 5 to avoid infinite loops.
		$is_container = in_array( $xsb_inner_block['type'], array( 'xcosb/gb-container', 'xcopb/gb-container', 'xsb/gb-container' ), true );
		$xsb_depth    = isset( $context['container_depth'] ) ? (int) $context['container_depth'] : 0;
		if ( $is_container && $xsb_depth >= 5 ) {
			continue;
		}

		$child_context = array_merge( is_array( $context ) ? $context : array(), array( 'container_depth' => $xsb_depth + 1 ) );
		$xsb_output   .= XCOPB_Block_Registry::instance()->render_block( $xsb_inner_block['type'], $xsb_inner_block, $child_context );
	}

	$xsb_output .= '</div>';
}

$xsb_output .= '</div>';

echo wp_kses( $xsb_output, XCOPB_Block_Registry::allowed_output_html() );
