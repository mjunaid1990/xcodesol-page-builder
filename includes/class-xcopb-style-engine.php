<?php
/**
 * PHP style engine — frontend mirror of the editor's style model.
 *
 * The same versioned document the React editor writes is resolved here so
 * editor preview and frontend rendering agree:
 *
 *   {
 *     version: 1,
 *     tokens: {},                    // design tokens
 *     responsive: { desktop:{}, tablet:{}, mobile:{} },
 *     states: { default:{}, hover:{}, … },
 *     elements: { wrapper:{ base, states, responsive }, title:{ … } }
 *   }
 *
 * Precedence (low → high): tokens → widget base → element base → element
 * state → element responsive. Values are emitted as scoped CSS rules (with
 * custom properties), never unsanitized raw CSS.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Style_Engine
 */
class XCOPB_Style_Engine {

	/**
	 * Breakpoints (desktop = base, no media query).
	 *
	 * @var string[]
	 */
	const BREAKPOINTS = array( 'desktop', 'tablet', 'mobile' );

	/**
	 * Media query widths for responsive breakpoints.
	 *
	 * @var array
	 */
	const BREAKPOINT_WIDTHS = array( 'tablet' => '768px', 'mobile' => '480px' );

	/**
	 * Pseudo states and their CSS selector suffix.
	 *
	 * @var array
	 */
	const STATE_SELECTORS = array(
		'default'      => '',
		'hover'        => ':hover',
		'active'       => ':active',
		'focus'        => ':focus',
		'focusVisible' => ':focus-visible',
		'disabled'     => ':disabled',
		'selected'     => '.is-selected',
		'loading'      => '.is-loading',
	);

	/**
	 * CSS property map shared with the JS engine (group.semantic => prop).
	 * Mirrors CSS_PROPERTY_MAP in src/admin/styles/engine.js — the semantic
	 * tokens are the camelCase names the model documents use, so a model
	 * serialized by the editor resolves to the same CSS here.
	 *
	 * @var array
	 */
	const CSS_PROPERTY_MAP = array(
		'layout' => array(
			'display' => 'display', 'width' => 'width', 'minWidth' => 'min-width', 'maxWidth' => 'max-width',
			'height' => 'height', 'minHeight' => 'min-height', 'maxHeight' => 'max-height', 'position' => 'position',
			'overflow' => 'overflow', 'zIndex' => 'z-index', 'flexDirection' => 'flex-direction',
			'flexWrap' => 'flex-wrap', 'justifyContent' => 'justify-content', 'alignItems' => 'align-items',
			'gap' => 'gap', 'gridColumns' => 'grid-template-columns', 'rowGap' => 'row-gap',
			'columnGap' => 'column-gap',
		),
		'spacing' => array(
			'marginTop' => 'margin-top', 'marginRight' => 'margin-right', 'marginBottom' => 'margin-bottom',
			'marginLeft' => 'margin-left', 'paddingTop' => 'padding-top', 'paddingRight' => 'padding-right',
			'paddingBottom' => 'padding-bottom', 'paddingLeft' => 'padding-left',
		),
		'dimensions' => array(
			'width' => 'width', 'minWidth' => 'min-width', 'maxWidth' => 'max-width',
			'height' => 'height', 'minHeight' => 'min-height', 'maxHeight' => 'max-height',
		),
		'typography' => array(
			'fontFamily' => 'font-family', 'fontSize' => 'font-size', 'fontWeight' => 'font-weight',
			'fontStyle' => 'font-style', 'lineHeight' => 'line-height', 'letterSpacing' => 'letter-spacing',
			'wordSpacing' => 'word-spacing', 'textAlign' => 'text-align', 'textTransform' => 'text-transform',
			'textDecoration' => 'text-decoration', 'color' => 'color', 'textShadow' => 'text-shadow',
			'maxWidth' => 'max-width', 'overflow' => 'overflow',
		),
		'colors' => array(
			'text' => 'color', 'background' => 'background-color', 'link' => '--xsb-color-link',
			'hover' => '--xsb-color-hover', 'active' => '--xsb-color-active', 'focus' => '--xsb-color-focus',
			'disabled' => '--xsb-color-disabled', 'icon' => '--xsb-color-icon', 'border' => '--xsb-color-border',
			'placeholder' => '--xsb-color-placeholder', 'overlay' => '--xsb-color-overlay',
		),
		'background' => array(
			'color' => 'background-color', 'gradient' => 'background-image', 'image' => 'background-image',
			'imagePosition' => 'background-position', 'imageSize' => 'background-size',
			'repeat' => 'background-repeat', 'attachment' => 'background-attachment',
			'focalPoint' => 'background-position', 'overlayColor' => '--xsb-bg-overlay-color',
			'overlayOpacity' => '--xsb-bg-overlay-opacity',
		),
		'border' => array(
			'style' => 'border-style', 'color' => 'border-color',
			'widthTop' => 'border-top-width', 'widthRight' => 'border-right-width',
			'widthBottom' => 'border-bottom-width', 'widthLeft' => 'border-left-width',
			'outlineStyle' => 'outline-style', 'outlineWidth' => 'outline-width',
			'outlineColor' => 'outline-color', 'outlineOffset' => 'outline-offset',
		),
		'radius' => array(
			'topLeft' => 'border-top-left-radius', 'topRight' => 'border-top-right-radius',
			'bottomRight' => 'border-bottom-right-radius', 'bottomLeft' => 'border-bottom-left-radius',
		),
		'shadow' => array(
			'preset' => 'box-shadow', 'offsetX' => 'box-shadow', 'offsetY' => 'box-shadow',
			'blur' => 'box-shadow', 'spread' => 'box-shadow', 'color' => 'box-shadow', 'inset' => 'box-shadow',
		),
		'effects' => array(
			'animation' => 'animation', 'animationDuration' => 'animation-duration',
			'animationDelay' => 'animation-delay', 'transitionDuration' => 'transition-duration',
			'transitionEasing' => 'transition-timing-function', 'opacity' => 'opacity',
			'cursor' => 'cursor', 'transform' => 'transform',
		),
		'visibility' => array(
			'display' => 'display', 'visibility' => 'visibility', 'opacity' => 'opacity',
			'pointerEvents' => 'pointer-events',
		),
		'advanced' => array(
			'zIndex' => 'z-index', 'position' => 'position',
		),
	);

	/**
	 * Singleton.
	 *
	 * @var XCOPB_Style_Engine|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Style_Engine
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Whether a value is usable.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private function is_defined( $value ) {
		return null !== $value && '' !== $value && false !== $value;
	}

	/**
	 * Normalize an array to a plain array.
	 *
	 * @param mixed $value Value.
	 * @return array
	 */
	private function to_array( $value ) {
		return is_array( $value ) ? $value : array();
	}

	/**
	 * Deep merge overlay arrays (later wins).
	 *
	 * @param array ...$layers Layers.
	 * @return array
	 */
	public function deep_merge( ...$layers ) {
		$out = array();
		foreach ( $layers as $layer ) {
			if ( ! is_array( $layer ) ) {
				continue;
			}
			foreach ( $layer as $key => $value ) {
				if ( is_array( $value ) && isset( $out[ $key ] ) && is_array( $out[ $key ] ) ) {
					$out[ $key ] = $this->deep_merge( $out[ $key ], $value );
				} elseif ( $this->is_defined( $value ) ) {
					$out[ $key ] = $value;
				}
			}
		}
		return $out;
	}

	/**
	 * Normalize a raw model document to its canonical shape.
	 *
	 * @param array $input Raw model.
	 * @return array
	 */
	public function normalize( $input ) {
		$input      = $this->to_array( $input );
		$responsive = array();
		foreach ( self::BREAKPOINTS as $bp ) {
			$responsive[ $bp ] = isset( $input['responsive'][ $bp ] ) && is_array( $input['responsive'][ $bp ] ) ? $input['responsive'][ $bp ] : array();
		}
		$states = array();
		foreach ( array_keys( self::STATE_SELECTORS ) as $state ) {
			$states[ $state ] = isset( $input['states'][ $state ] ) && is_array( $input['states'][ $state ] ) ? $input['states'][ $state ] : array();
		}
		$elements = array();
		if ( isset( $input['elements'] ) && is_array( $input['elements'] ) ) {
			foreach ( $input['elements'] as $name => $layer ) {
				if ( ! is_array( $layer ) ) {
					continue;
				}
				$el = array(
					'base'       => isset( $layer['base'] ) && is_array( $layer['base'] ) ? $layer['base'] : array(),
					'states'     => array(),
					'responsive' => array(),
				);
				foreach ( array_keys( self::STATE_SELECTORS ) as $state ) {
					$el['states'][ $state ] = isset( $layer['states'][ $state ] ) && is_array( $layer['states'][ $state ] ) ? $layer['states'][ $state ] : array();
				}
				foreach ( self::BREAKPOINTS as $bp ) {
					$el['responsive'][ $bp ] = isset( $layer['responsive'][ $bp ] ) && is_array( $layer['responsive'][ $bp ] ) ? $layer['responsive'][ $bp ] : array();
				}
				$elements[ $name ] = $el;
			}
		}
		return array(
			'version'    => isset( $input['version'] ) ? absint( $input['version'] ) : 1,
			'tokens'     => isset( $input['tokens'] ) && is_array( $input['tokens'] ) ? $input['tokens'] : array(),
			'responsive' => $responsive,
			'states'     => $states,
			'elements'   => $elements,
		);
	}

	/**
	 * Resolve one element at a breakpoint + state.
	 *
	 * @param array  $model   Normalized model.
	 * @param string $element Element id ('wrapper' default).
	 * @param array  $options ['breakpoint' => , 'state' => ].
	 * @return array Effective flat style values.
	 */
	public function resolve_element( $model, $element = 'wrapper', $options = array() ) {
		$model      = $this->normalize( $model );
		$breakpoint = isset( $options['breakpoint'] ) && in_array( $options['breakpoint'], self::BREAKPOINTS, true ) ? $options['breakpoint'] : 'desktop';
		$state      = isset( $options['state'] ) && isset( self::STATE_SELECTORS[ $options['state'] ] ) ? $options['state'] : 'default';

		$widget = array(
			'base'       => $model['states']['default'],
			'states'     => $model['states'],
			'responsive' => $model['responsive'],
		);
		$el = isset( $model['elements'][ $element ] ) ? $model['elements'][ $element ] : array(
			'base'       => array(),
			'states'     => array(),
			'responsive' => array(),
		);

		// Responsive layers stack desktop … target breakpoint (later wins), so a
		// tablet value is inherited by mobile — matching the JS resolver.
		$target = array_search( $breakpoint, self::BREAKPOINTS, true );
		if ( false === $target ) {
			$target = 0;
		}

		$widget_layer = $this->deep_merge( $widget['base'], isset( $widget['states'][ $state ] ) ? $widget['states'][ $state ] : array() );
		for ( $i = 0; $i <= $target; $i++ ) {
			$bp           = self::BREAKPOINTS[ $i ];
			$widget_layer = $this->deep_merge( $widget_layer, isset( $widget['responsive'][ $bp ] ) ? $widget['responsive'][ $bp ] : array() );
		}

		$el_layer = $this->deep_merge( $el['base'], isset( $el['states'][ $state ] ) ? $el['states'][ $state ] : array() );
		for ( $i = 0; $i <= $target; $i++ ) {
			$bp        = self::BREAKPOINTS[ $i ];
			$el_layer  = $this->deep_merge( $el_layer, isset( $el['responsive'][ $bp ] ) ? $el['responsive'][ $bp ] : array() );
		}

		return $this->deep_merge( $widget_layer, $el_layer );
	}

	/**
	 * Sanitize one style value for inline/scoped CSS output.
	 *
	 * @param mixed $value Raw value.
	 * @return string Safe value or ''.
	 */
	public function sanitize_value( $value ) {
		if ( is_numeric( $value ) ) {
			return (string) $value;
		}
		if ( ! is_string( $value ) ) {
			return '';
		}
		$value = trim( $value );
		if ( '' === $value || preg_match( '/[;{}]/', $value ) || false !== stripos( $value, 'url(' ) ) {
			return '';
		}
		if ( preg_match( '/^#[0-9a-fA-F]{3,8}$/', $value ) || preg_match( '/^rgba?\([0-9.,\s%]+\)$/', $value ) || in_array( strtolower( $value ), array( 'transparent', 'currentcolor', 'inherit' ), true ) ) {
			return $value;
		}
		// Printable characters only, bounded.
		return preg_replace( '/[^\x20-\x7E]/', '', $value );
	}

	/**
	 * Stable scoped class for one element (same algorithm as the editor).
	 *
	 * @param string $type    Block type (xcosb/sp-title…).
	 * @param string $element Element id.
	 * @return string
	 */
	public function scoped_class( $type, $element = 'wrapper' ) {
		$slug = preg_replace( '/[^a-z0-9]+/i', '-', $type );
		$slug = trim( $slug, '-' );
		$el   = preg_replace( '/[^a-z0-9]/i', '-', $element );
		return 'xsb-el--' . $slug . '--' . $el;
	}

	/**
	 * Generate scoped CSS rules for a model (default/state/breakpoints).
	 *
	 * @param array  $model    Style model.
	 * @param string $type     Block type.
	 * @param array  $options  ['selector' => parent scope class, 'elements' => [] (defaults to model elements / wrapper)].
	 * @return string CSS text ('' when the model has no style values).
	 */
	public function generate_css( $model, $type, $options = array() ) {
		$model    = $this->normalize( $model );
		$selector = isset( $options['selector'] ) ? $options['selector'] : '';
		$elements = array();
		if ( isset( $options['elements'] ) && is_array( $options['elements'] ) ) {
			$elements = $options['elements'];
		} else {
			$elements = array_keys( $model['elements'] );
		}
		if ( empty( $elements ) ) {
			$elements = array( 'wrapper' );
		}

		$css = '';
		foreach ( $elements as $element ) {
			$scope  = $this->scoped_class( $type, $element );
			$target = $selector ? $selector . ' .' . $scope : '.' . $scope;

			foreach ( self::BREAKPOINTS as $bp ) {
				foreach ( array_keys( self::STATE_SELECTORS ) as $state ) {
					$style = $this->resolve_element( $model, $element, array( 'breakpoint' => $bp, 'state' => $state ) );
					$text  = $this->style_to_css_text( $style );
					if ( '' === $text ) {
						continue;
					}
					$suffix = self::STATE_SELECTORS[ $state ];
					$rule   = $target . $suffix . ' {' . $text . '}';

					if ( 'desktop' !== $bp ) {
						$width = self::BREAKPOINT_WIDTHS[ $bp ];
						$css  .= "\n@media (max-width: " . $width . ") {\n\t" . $rule . "\n}";
					} else {
						$css .= "\n" . $rule;
					}
				}
			}
		}

		// Respect reduced motion whenever animation/transition values exist.
		if ( false !== strpos( $css, 'animation' ) || false !== strpos( $css, 'transition' ) ) {
			$css .= "\n@media (prefers-reduced-motion: reduce) {\n\t* { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }\n}";
		}

		return trim( $css );
	}

	/**
	 * Convert resolved flat style values into a CSS declarations string.
	 *
	 * Values use the group.semantic addressing (e.g. 'typography.color')
	 * matching the JS map. Unknown keys are ignored.
	 *
	 * @param array $style Resolved style values.
	 * @return string CSS declarations (leading/without braces).
	 */
	public function style_to_css_text( $style ) {
		$map   = self::CSS_PROPERTY_MAP;
		$units = array(
			'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
			'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
			'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
			'fontSize', 'letterSpacing', 'wordSpacing', 'gap', 'rowGap', 'columnGap',
			'widthTop', 'widthRight', 'widthBottom', 'widthLeft', 'outlineWidth', 'outlineOffset',
			'topLeft', 'topRight', 'bottomRight', 'bottomLeft',
			'offsetX', 'offsetY', 'blur', 'spread',
		);

		$css = '';
		foreach ( $style as $key => $value ) {
			if ( ! is_string( $key ) || false === strpos( $key, '.' ) ) {
				continue;
			}
			list( $group, $semantic ) = explode( '.', $key, 2 );
			if ( ! isset( $map[ $group ][ $semantic ] ) ) {
				continue;
			}
			$safe = $this->sanitize_value( $value );
			if ( '' === $safe && 0 !== $value ) {
				continue;
			}
			$prop = $map[ $group ][ $semantic ];
			$unit = in_array( $semantic, $units, true ) && is_numeric( $safe ) ? 'px' : '';
			$css .= $prop . ':' . $safe . $unit . ';';
		}
		return $css;
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Style_Engine', 'XCOSB_Style_Engine' );
