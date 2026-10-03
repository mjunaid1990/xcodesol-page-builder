<?php
/**
 * Control Sanitizer for Xcodesol Page Builder.
 *
 * Provides per-control-type sanitizers: allowlisting units, clamping numbers,
 * validating colors, escaping strings, and blocking url() / script abuse.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Control Sanitizer Class.
 */
class XCOPB_Sanitizer {

	/**
	 * Allowed CSS length units.
	 *
	 * @var string[]
	 */
	const ALLOWED_UNITS = array( 'px', '%', 'em', 'rem', 'vw', 'vh', 'ch', 'dvh', 'fr', 'auto' );

	/**
	 * Allowed layout modes for Container.
	 *
	 * @var string[]
	 */
	const ALLOWED_LAYOUT_MODES = array( 'list', 'row', 'columns', 'grid', 'masonry', 'scroll-row' );

	/**
	 * Validate and sanitize CSS color (Hex, RGB, RGBA, HSL, HSLA, or transparent).
	 *
	 * @param mixed $color Color value.
	 * @return string Sanitized color or empty string.
	 */
	public static function sanitize_color( $color ) {
		if ( ! is_string( $color ) ) {
			return '';
		}

		$color = trim( $color );
		if ( '' === $color || 'transparent' === $color || 'inherit' === $color || 'currentColor' === $color ) {
			return $color;
		}

		// Hex color (#fff, #ffffff, #ffffffff)
		if ( preg_match( '/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/', $color ) ) {
			return $color;
		}

		// RGB / RGBA
		if ( preg_match( '/^rgba?\(\s*([0-9]{1,3}\s*,\s*){2}[0-9]{1,3}\s*(,\s*(0|1|0?\.[0-9]+)\s*)?\)$/i', $color ) ) {
			return $color;
		}

		// HSL / HSLA
		if ( preg_match( '/^hsla?\(\s*[0-9]{1,3}\s*,\s*[0-9]{1,3}%\s*,\s*[0-9]{1,3}%\s*(,\s*(0|1|0?\.[0-9]+)\s*)?\)$/i', $color ) ) {
			return $color;
		}

		return '';
	}

	/**
	 * Validate and clamp a numeric value.
	 *
	 * @param mixed      $val     Input value.
	 * @param float|null $min     Minimum bound.
	 * @param float|null $max     Maximum bound.
	 * @param float      $default Fallback value.
	 * @return float Clamped numeric value.
	 */
	public static function sanitize_number( $val, $min = null, $max = null, $default = 0.0 ) {
		if ( ! is_numeric( $val ) ) {
			return (float) $default;
		}

		$num = (float) $val;

		if ( null !== $min && $num < $min ) {
			$num = (float) $min;
		}

		if ( null !== $max && $num > $max ) {
			$num = (float) $max;
		}

		return $num;
	}

	/**
	 * Validate a CSS unit against allowlist.
	 *
	 * @param string   $unit    Unit string.
	 * @param string[] $allowed Custom allowlist.
	 * @return string Validated unit.
	 */
	public static function sanitize_unit( $unit, $allowed = null ) {
		$allowed = is_array( $allowed ) ? $allowed : self::ALLOWED_UNITS;
		$unit    = strtolower( trim( (string) $unit ) );
		return in_array( $unit, $allowed, true ) ? $unit : 'px';
	}

	/**
	 * Sanitize a number-with-unit control value ({ value: 24, unit: 'px' } or scalar).
	 *
	 * @param mixed      $input   Input.
	 * @param float|null $min     Min limit.
	 * @param float|null $max     Max limit.
	 * @param string[]   $allowed Allowed units.
	 * @return array{value: float, unit: string}
	 */
	public static function sanitize_number_unit( $input, $min = null, $max = null, $allowed = null ) {
		if ( is_array( $input ) ) {
			$val  = self::sanitize_number( $input['value'] ?? 0, $min, $max );
			$unit = self::sanitize_unit( $input['unit'] ?? 'px', $allowed );
			return array(
				'value' => $val,
				'unit'  => $unit,
			);
		}

		return array(
			'value' => self::sanitize_number( $input, $min, $max ),
			'unit'  => 'px',
		);
	}

	/**
	 * Sanitize 4-sided dimensions (padding, margin, radius).
	 *
	 * @param mixed $input Dimensions map.
	 * @return array{top: int|float, right: int|float, bottom: int|float, left: int|float, unit: string, isLinked: bool}
	 */
	public static function sanitize_dimensions( $input ) {
		if ( ! is_array( $input ) ) {
			$val = self::sanitize_number( $input, 0, 500, 0 );
			return array(
				'top'      => $val,
				'right'    => $val,
				'bottom'   => $val,
				'left'     => $val,
				'unit'     => 'px',
				'isLinked' => true,
			);
		}

		return array(
			'top'      => self::sanitize_number( $input['top'] ?? 0, -500, 1000 ),
			'right'    => self::sanitize_number( $input['right'] ?? 0, -500, 1000 ),
			'bottom'   => self::sanitize_number( $input['bottom'] ?? 0, -500, 1000 ),
			'left'     => self::sanitize_number( $input['left'] ?? 0, -500, 1000 ),
			'unit'     => self::sanitize_unit( $input['unit'] ?? 'px' ),
			'isLinked' => ! empty( $input['isLinked'] ),
		);
	}

	/**
	 * Sanitize URL and block abuse (javascript:, data:, vbscript:).
	 *
	 * @param string $url Input URL.
	 * @return string Safe URL or empty string.
	 */
	public static function sanitize_url( $url ) {
		if ( ! is_string( $url ) ) {
			return '';
		}

		$url = trim( $url );
		if ( preg_match( '/^(javascript|vbscript|data):/i', $url ) ) {
			return '';
		}

		return esc_url_raw( $url );
	}

	/**
	 * Sanitize raw CSS/style string against url() abuse, expressions, or injection.
	 *
	 * @param string $css Input CSS text.
	 * @return string Safe CSS string.
	 */
	public static function sanitize_style_value( $css ) {
		if ( ! is_string( $css ) ) {
			return '';
		}

		// Reject url() abuse, expressions, javascript: and script-like tokens.
		if ( preg_match( '/expression|javascript:|vbscript:|data:|<script|@import/i', $css ) ) {
			return '';
		}

		return sanitize_text_field( $css );
	}

	/**
	 * Sanitize container layout mode.
	 *
	 * @param string $mode Layout mode slug.
	 * @return string Validated layout mode.
	 */
	public static function sanitize_layout_mode( $mode ) {
		$mode = strtolower( trim( (string) $mode ) );
		return in_array( $mode, self::ALLOWED_LAYOUT_MODES, true ) ? $mode : 'columns';
	}

	/**
	 * Allowed values for the container's enumerated (fixed-option) settings.
	 *
	 * Device (`tablet_` / `mobile_`) and state (`hover_`) variants are
	 * accepted automatically: the variant is checked against its base key.
	 *
	 * @return array<string,array<int,string>>
	 */
	public static function container_enum_map() {
		return array(
			'bg_type'             => array( 'none', 'color', 'gradient', 'image', 'video' ),
			'bg_size'             => array( 'cover', 'contain', 'auto', '100% 100%', 'custom' ),
			'bg_position'         => array( 'left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom', 'custom' ),
			'bg_repeat'           => array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'space', 'round' ),
			'bg_attachment'       => array( 'scroll', 'fixed', 'local' ),
			'bg_origin'           => array( 'border-box', 'padding-box', 'content-box' ),
			'bg_clip'             => array( 'border-box', 'padding-box', 'content-box' ),
			'overlay_blend_mode'  => array( 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity' ),
			'layout_mode'         => self::ALLOWED_LAYOUT_MODES,
			'layout_type'         => array( 'flex', 'grid' ),
			'stacking_breakpoint' => array( 'tablet', 'mobile', 'none' ),
			'column_valign'       => array( 'top', 'center', 'bottom', 'stretch' ),
			'column_divider'      => array( 'none', 'solid', 'dashed', 'dotted' ),
			'flex_direction'      => array( 'row', 'row-reverse', 'column', 'column-reverse' ),
			'flex_wrap'           => array( 'nowrap', 'wrap', 'wrap-reverse' ),
			'justify_content'     => array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly' ),
			'align_items'         => array( 'flex-start', 'center', 'flex-end', 'stretch', 'baseline' ),
			'align_content'       => array( 'stretch', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around' ),
			'align_self'          => array( 'auto', 'flex-start', 'center', 'flex-end', 'stretch', 'start', 'end', 'self-start', 'self-end' ),
			'grid_auto_flow'      => array( 'row', 'column', 'dense', 'row dense', 'column dense' ),
			'grid_align_items'    => array( 'start', 'center', 'end', 'stretch', 'baseline' ),
			'grid_justify_items'  => array( 'start', 'center', 'end', 'stretch' ),
			'grid_align_content'  => array( 'start', 'center', 'end', 'stretch', 'space-between', 'space-around', 'space-evenly' ),
			'grid_justify_content' => array( 'start', 'center', 'end', 'stretch', 'space-between', 'space-around', 'space-evenly' ),
			'grid_justify_self'   => array( 'auto', 'start', 'center', 'end', 'stretch' ),
			'masonry_item_break'  => array( 'avoid', 'auto' ),
			'masonry_item_span'   => array( 'none', 'all' ),
			'masonry_break_inside' => array( 'avoid', 'auto' ),
			'scroll_snap_type'    => array( 'none', 'mandatory', 'proximity' ),
			'scroll_snap_align'   => array( 'start', 'center', 'end' ),
			'overflow'            => array( 'visible', 'hidden', 'auto', 'scroll', 'clip' ),
			'border_style'        => array( 'none', 'solid', 'dashed', 'dotted', 'double' ),
			'aspect_ratio'        => array( 'auto', '1 / 1', '4 / 3', '3 / 2', '16 / 9', '21 / 9' ),
		);
	}

	/**
	 * Numeric container settings, as key => array( min, max, default ).
	 *
	 * @return array<string,array{0:float,1:float,2:float}>
	 */
	public static function container_number_map() {
		return array(
			'columns'             => array( 1, 6, 2 ),
			'grid_columns_count'  => array( 1, 24, 12 ),
			'masonry_columns'     => array( 1, 6, 3 ),
			'child_order'         => array( -99, 99, 0 ),
			'flex_grow'           => array( 0, 20, 0 ),
			'flex_shrink'         => array( 0, 20, 1 ),
			'child_min_width'     => array( 0, 5000, 0 ),
			'child_max_width'     => array( 0, 5000, 0 ),
			'grid_column_span'    => array( 1, 12, 1 ),
			'grid_row_span'       => array( 1, 12, 1 ),
			'z_index'             => array( -9999, 9999, 0 ),
			'rotate'              => array( -360, 360, 0 ),
			'filter_blur'         => array( 0, 100, 0 ),
			'overlay_opacity'     => array( 0, 100, 100 ),
			'child_span'          => array( 1, 12, 1 ),
		);
	}

	/**
	 * Boolean container settings (stored as real booleans).
	 *
	 * @return string[]
	 */
	public static function container_boolean_keys() {
		return array(
			'equal_height',
			'flex_reverse',
			'scroll_hide_scrollbar',
			'column_reverse_mobile',
			'sticky_column',
			'container_queries',
			'grid_subgrid',
		);
	}

	/**
	 * Dimension settings stored either as a plain number or as a
	 * { value, unit } object.
	 *
	 * @return string[]
	 */
	public static function container_dimension_keys() {
		return array(
			'grid_gap',
			'column_gap',
			'masonry_gap',
			'scroll_gap',
			'scroll_padding_peek',
			'scroll_item_width',
		);
	}

	/**
	 * CSS-safe text settings: free-form CSS fragments (grid track lists, area
	 * names, flex bases) that are only allowed to carry CSS tokens.
	 *
	 * @return string[]
	 */
	public static function container_css_text_keys() {
		return array( 'grid_named_areas', 'flex_basis', 'grid_area', 'bg_size_custom', 'bg_position_custom' );
	}

	/**
	 * Strip anything that could break out of a CSS value or inject a rule.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	public static function sanitize_css_fragment( $value ) {
		$value = is_scalar( $value ) ? (string) $value : '';

		if ( '' === trim( $value ) ) {
			return '';
		}

		// Reject url() abuse, expressions, script tokens and rule separators.
		if ( preg_match( '/expression|javascript:|vbscript:|data:|<|>|\|"|\'|@import|;/i', $value ) ) {
			return '';
		}

		// Only CSS function / track / keyword characters survive.
		$clean = preg_replace( '/[^0-9a-zA-Z%.,()\s\/\-_:]/', '', $value );

		return trim( (string) $clean );
	}

	/**
	 * Sanitize one dimension value: plain number or { value, unit } object.
	 *
	 * @param mixed $value Raw value.
	 * @return mixed
	 */
	public static function sanitize_container_dimension( $value ) {
		$units = array( 'px', '%', 'em', 'rem', 'vw', 'vh', 'fr', 'ch', 'svh', 'lvh' );

		if ( is_array( $value ) ) {
			if ( isset( $value['row'] ) || isset( $value['col'] ) ) {
				$unit = isset( $value['unit'] ) && in_array( $value['unit'], $units, true ) ? $value['unit'] : 'px';
				$out  = array( 'unit' => $unit );
				foreach ( array( 'row', 'col' ) as $side ) {
					if ( isset( $value[ $side ] ) ) {
						$out[ $side ] = self::sanitize_number( $value[ $side ], 0, 1000, 0 );
					}
				}
				if ( isset( $value['isLinked'] ) ) {
					$out['isLinked'] = ! empty( $value['isLinked'] );
				}
				return $out;
			}

			$unit = isset( $value['unit'] ) && in_array( $value['unit'], $units, true ) ? $value['unit'] : 'px';

			return array(
				'value' => self::sanitize_number( $value['value'] ?? 0, 0, 5000, 0 ),
				'unit'  => $unit,
			);
		}

		return self::sanitize_number( $value, 0, 5000, 0 );
	}

	/**
	 * Sanitize the visual grid track template: either a { columns, rows,
	 * auto_flow, auto_rows } object or a legacy template string.
	 *
	 * @param mixed $value Raw value.
	 * @return mixed
	 */
	public static function sanitize_grid_template( $value ) {
		if ( is_array( $value ) ) {
			$out = array();
			foreach ( array( 'columns', 'rows', 'auto_rows' ) as $track ) {
				if ( isset( $value[ $track ] ) && '' !== $value[ $track ] ) {
					$out[ $track ] = self::sanitize_css_fragment( $value[ $track ] );
				}
			}
			if ( isset( $value['auto_flow'] ) ) {
				$flow = self::sanitize_css_fragment( $value['auto_flow'] );
				$out['auto_flow'] = in_array( $flow, array( 'row', 'column', 'dense', 'row dense', 'column dense' ), true ) ? $flow : '';
			}
			foreach ( array( 'subgrid', 'areas' ) as $extra ) {
				if ( isset( $value[ $extra ] ) ) {
					$out[ $extra ] = 'subgrid' === $extra ? ! empty( $value[ $extra ] ) : self::sanitize_css_fragment( $value[ $extra ] );
				}
			}

			return $out;
		}

		return self::sanitize_css_fragment( $value );
	}

	/**
	 * Sanitize any single container setting, including its device
	 * (`tablet_` / `mobile_`) and state (`hover_`) variants.
	 *
	 * @param string $key   Setting key, possibly with a device/state prefix.
	 * @param mixed  $value Raw value.
	 * @return mixed|null Sanitized value, or null when the key is unknown.
	 */
	public static function sanitize_container_value( $key, $value ) {
		$base = (string) $key;
		foreach ( array( 'tablet_', 'mobile_', 'hover_' ) as $prefix ) {
			if ( 0 === strpos( $base, $prefix ) ) {
				$base = substr( $base, strlen( $prefix ) );
				break;
			}
		}

		$enums = self::container_enum_map();
		if ( isset( $enums[ $base ] ) ) {
			$candidate = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';
			if ( in_array( $candidate, $enums[ $base ], true ) ) {
				return $candidate;
			}
			// Unknown option: keep the previous value untouched by dropping it.
			return null;
		}

		$numbers = self::container_number_map();
		if ( isset( $numbers[ $base ] ) ) {
			return self::sanitize_number( $value, $numbers[ $base ][0], $numbers[ $base ][1], $numbers[ $base ][2] );
		}

		if ( in_array( $base, self::container_boolean_keys(), true ) ) {
			return ! empty( $value );
		}

		if ( in_array( $base, self::container_dimension_keys(), true ) ) {
			return self::sanitize_container_dimension( $value );
		}

		if ( in_array( $base, self::container_css_text_keys(), true ) ) {
			// Area names keep their quotes ("header" "content"); everything
			// else is restricted to plain CSS tokens.
			if ( 'grid_named_areas' === $base ) {
				$areas = is_scalar( $value ) ? (string) $value : '';
				$areas = preg_replace( '/[^0-9a-zA-Z_.\s"\-]/', '', $areas );
				return trim( (string) $areas );
			}
			return self::sanitize_css_fragment( $value );
		}

		switch ( $base ) {
			case 'bg_color':
			case 'overlay_color':
			case 'border_color':
			case 'text_color':
			case 'color':
			case 'background':
				return self::sanitize_color( $value );
			case 'box_shadow':
			case 'hover_box_shadow':
				return self::sanitize_box_shadow( $value );
			case 'padding':
			case 'margin':
			case 'border_radius':
				return self::sanitize_dimensions( $value );
			case 'bg_image':
			case 'bg_video_url':
			case 'url':
				return self::sanitize_url_or_media( $value );
			case 'padding_top':
			case 'padding_right':
			case 'padding_bottom':
			case 'padding_left':
				return self::sanitize_number( $value, 0, 1000, 0 );
			case 'grid_template':
				return self::sanitize_grid_template( $value );
			case 'column_widths':
				if ( ! is_array( $value ) ) {
					return null;
				}
				return array_values( array_map( function ( $w ) {
					return (float) self::sanitize_number( $w, 0.5, 12, 6 );
				}, $value ) );
			case 'gradient':
				if ( ! is_array( $value ) ) {
					return null;
				}
				$type = isset( $value['type'] ) && in_array( $value['type'], array( 'linear', 'radial' ), true ) ? $value['type'] : 'linear';
				return array(
					'type'  => $type,
					'angle' => self::sanitize_number( $value['angle'] ?? 90, 0, 360, 90 ),
					'colorA' => self::sanitize_color( $value['colorA'] ?? '#4f46e5' ) ?: '#4f46e5',
					'colorB' => self::sanitize_color( $value['colorB'] ?? '#06b6d4' ) ?: '#06b6d4',
					'posA' => self::sanitize_number( $value['posA'] ?? 0, 0, 100, 0 ),
					'posB' => self::sanitize_number( $value['posB'] ?? 100, 0, 100, 100 ),
				);
		}

		return null;
	}

	/**
	 * Sanitize a URL or { url, id } media object.
	 *
	 * @param mixed $value Raw value.
	 * @return mixed
	 */
	public static function sanitize_url_or_media( $value ) {
		if ( is_array( $value ) ) {
			return array(
				'url' => isset( $value['url'] ) ? esc_url_raw( (string) $value['url'] ) : '',
				'id'  => isset( $value['id'] ) ? absint( $value['id'] ) : 0,
			);
		}

		return esc_url_raw( (string) $value );
	}

	/**
	 * Sanitize box shadow definition.
	 *
	 * @param mixed $shadow Array of layers or string preset.
	 * @return mixed Sanitized box shadow.
	 */
	public static function sanitize_box_shadow( $shadow ) {
		if ( is_string( $shadow ) ) {
			$allowed_presets = array( 'none', 'soft', 'medium', 'strong' );
			return in_array( $shadow, $allowed_presets, true ) ? $shadow : 'none';
		}

		if ( ! is_array( $shadow ) ) {
			return 'none';
		}

		$clean = array();
		foreach ( $shadow as $layer ) {
			if ( ! is_array( $layer ) ) {
				continue;
			}
			$clean[] = array(
				'x'      => self::sanitize_number( $layer['x'] ?? 0, -200, 200 ),
				'y'      => self::sanitize_number( $layer['y'] ?? 4, -200, 200 ),
				'blur'   => self::sanitize_number( $layer['blur'] ?? 14, 0, 300 ),
				'spread' => self::sanitize_number( $layer['spread'] ?? 0, -100, 100 ),
				'color'  => self::sanitize_color( $layer['color'] ?? 'rgba(0,0,0,0.1)' ) ?: 'rgba(0,0,0,0.1)',
				'inset'  => ! empty( $layer['inset'] ),
			);
		}

		return $clean;
	}

	/**
	 * Master sanitizer for a full container settings map.
	 *
	 * @param array<string,mixed> $settings Settings array.
	 * @return array<string,mixed> Cleaned settings.
	 */
	public static function sanitize_container_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return array();
		}
		$clean = array();

		// Layout mode
		$clean['layout_mode'] = self::sanitize_layout_mode( $settings['layout_mode'] ?? ( ( $settings['layout_type'] ?? '' ) === 'grid' ? 'grid' : 'columns' ) );
		$clean['layout_type'] = $clean['layout_mode'] === 'grid' ? 'grid' : 'flex';

		// Columns
		if ( isset( $settings['columns'] ) ) {
			$clean['columns'] = (int) self::sanitize_number( $settings['columns'], 1, 6, 2 );
		}
		if ( ! empty( $settings['column_widths'] ) && is_array( $settings['column_widths'] ) ) {
			$clean['column_widths'] = array_map( function ( $w ) {
				return (float) self::sanitize_number( $w, 0.5, 12, 6 );
			}, array_values( $settings['column_widths'] ) );
		}

		// Colors
		if ( isset( $settings['bg_color'] ) ) {
			$clean['bg_color'] = self::sanitize_color( $settings['bg_color'] );
		}
		if ( isset( $settings['border_color'] ) ) {
			$clean['border_color'] = self::sanitize_color( $settings['border_color'] );
		}
		if ( isset( $settings['animation'] ) ) {
			$motion_ids = class_exists( 'XCOPB_Motion_Presets' ) ? XCOPB_Motion_Presets::ids() : array( 'none', 'fade-in', 'slide-up', 'slide-down', 'zoom-in' );
			$animation = is_string( $settings['animation'] ) ? $settings['animation'] : '';
			$clean['animation'] = in_array( $animation, $motion_ids, true ) ? $animation : 'none';
		}
		if ( isset( $settings['animation_duration'] ) ) {
			$clean['animation_duration'] = (int) self::sanitize_number( $settings['animation_duration'], 100, 5000, 600 );
		}
		if ( isset( $settings['animation_delay'] ) ) {
			$clean['animation_delay'] = (int) self::sanitize_number( $settings['animation_delay'], 0, 3000, 0 );
		}
		if ( isset( $settings['animation_easing'] ) ) {
			$clean['animation_easing'] = in_array( $settings['animation_easing'], array( 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ), true ) ? $settings['animation_easing'] : 'ease';
		}
		if ( isset( $settings['animation_repeat'] ) ) {
			$clean['animation_repeat'] = in_array( (string) $settings['animation_repeat'], array( '1', '2', '3', 'infinite' ), true ) ? (string) $settings['animation_repeat'] : '1';
		}

		// Spacing & Borders
		if ( isset( $settings['padding'] ) ) {
			$clean['padding'] = self::sanitize_dimensions( $settings['padding'] );
		}
		if ( isset( $settings['margin'] ) ) {
			$clean['margin'] = self::sanitize_dimensions( $settings['margin'] );
		}
		if ( isset( $settings['border_radius'] ) ) {
			$clean['border_radius'] = self::sanitize_dimensions( $settings['border_radius'] );
		}
		if ( isset( $settings['box_shadow'] ) ) {
			$clean['box_shadow'] = self::sanitize_box_shadow( $settings['box_shadow'] );
		}

		// New layout options (list / row / grid / masonry / scroll-row) and
		// every device or hover variant of them.
		foreach ( $settings as $k => $v ) {
			if ( isset( $clean[ $k ] ) ) {
				continue;
			}

			$sanitized = self::sanitize_container_value( $k, $v );
			if ( null !== $sanitized ) {
				$clean[ $k ] = $sanitized;
				continue;
			}

			// Passthrough safe scalar settings
			if ( is_string( $v ) ) {
				$clean[ $k ] = sanitize_text_field( $v );
			} elseif ( is_numeric( $v ) || is_bool( $v ) ) {
				$clean[ $k ] = $v;
			} elseif ( is_array( $v ) ) {
				$clean[ $k ] = $v;
			}
		}

		return $clean;
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Sanitizer', 'XCOSB_Sanitizer' );
