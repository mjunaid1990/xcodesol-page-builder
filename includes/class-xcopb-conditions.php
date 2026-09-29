<?php
/**
 * Conditions engine for evaluating template rules.
 *
 * @package WooCommerce_Template_Builder
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class XCOPB_Conditions
 */
class XCOPB_Conditions {

	/**
	 * Singleton instance.
	 *
	 * @var XCOPB_Conditions|null
	 */
	private static $instance = null;

	/**
	 * Registered rule type callbacks.
	 *
	 * @var array
	 */
	private $rule_handlers = array();

	/**
	 * Get instance.
	 *
	 * @return XCOPB_Conditions
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->register_default_handlers();
	}

	/**
	 * Register default rule type handlers.
	 */
	private function register_default_handlers() {
		$this->register_rule_handler( 'page', array( $this, 'evaluate_page_rule' ) );
		$this->register_rule_handler( 'post_type', array( $this, 'evaluate_post_type_rule' ) );
		$this->register_rule_handler( 'post_ids', array( $this, 'evaluate_post_ids_rule' ) );
		$this->register_rule_handler( 'taxonomy', array( $this, 'evaluate_taxonomy_rule' ) );
		$this->register_rule_handler( 'product_ids', array( $this, 'evaluate_product_ids_rule' ) );
		$this->register_rule_handler( 'sale', array( $this, 'evaluate_sale_rule' ) );
	}

	/**
	 * Register a rule type handler.
	 *
	 * Extension point: add new rule types by calling this method.
	 *
	 * @param string   $rule_type Rule type identifier.
	 * @param callable $callback  Callback function( array $rule, array $context ): bool.
	 */
	public function register_rule_handler( $rule_type, $callback ) {
		$this->rule_handlers[ $rule_type ] = $callback;
	}

	/**
	 * Evaluate whether a template matches the given context.
	 *
	 * @param int   $template_id Template post ID.
	 * @param array $context     Context data for evaluation.
	 * @return bool True if template should apply.
	 */
	public function evaluate_template( $template_id, $context ) {
		$conditions_json = XCOPB_Registrar::get_field( $template_id, '_xcopb_conditions', '{}' );

		$conditions = json_decode( $conditions_json, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return false;
		}

		$mode = isset( $conditions['mode'] ) ? sanitize_text_field( $conditions['mode'] ) : 'include';
		$rules = isset( $conditions['rules'] ) && is_array( $conditions['rules'] ) ? $conditions['rules'] : array();

		if ( empty( $rules ) ) {
			return true;
		}

		$all_match = true;

		foreach ( $rules as $rule ) {
			if ( ! isset( $rule['type'] ) || ! isset( $this->rule_handlers[ $rule['type'] ] ) ) {
				$all_match = false;
				break;
			}

			$handler = $this->rule_handlers[ $rule['type'] ];
			$result  = call_user_func( $handler, $rule, $context );

			if ( ! $result ) {
				$all_match = false;
				break;
			}
		}

		if ( 'exclude' === $mode ) {
			return ! $all_match;
		}

		return $all_match;
	}

	/**
	 * Evaluate a page rule — which archive page the template is used on
	 * (shop page, product category, product tag or other product archive).
	 * This is what lets different product cards target different pages.
	 *
	 * @param array $rule    Rule data.
	 * @param array $context Context data.
	 * @return bool
	 */
	private function evaluate_page_rule( $rule, $context ) {
		$page     = isset( $rule['page'] ) ? sanitize_text_field( $rule['page'] ) : '';
		$operator = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'is';
		$current  = isset( $context['view_type'] ) ? sanitize_text_field( $context['view_type'] ) : '';

		$found = ( $current === $page );

		if ( 'is_not' === $operator ) {
			return ! $found;
		}

		return $found;
	}

	/**
	 * Evaluate a post_type rule.
	 *
	 * @param array $rule    Rule data.
	 * @param array $context Context data.
	 * @return bool
	 */
	private function evaluate_post_type_rule( $rule, $context ) {
		$expected = isset( $rule['post_type'] ) ? sanitize_text_field( $rule['post_type'] ) : 'post';
		$operator = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'is';
		$current  = isset( $context['post_type'] ) ? sanitize_text_field( $context['post_type'] ) : '';

		$match = ( $current === $expected );
		return ( 'is_not' === $operator ) ? ! $match : $match;
	}

	/**
	 * Evaluate a post_ids rule (specific posts or pages).
	 *
	 * @param array $rule    Rule data.
	 * @param array $context Context data.
	 * @return bool
	 */
	private function evaluate_post_ids_rule( $rule, $context ) {
		$operator = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'in';
		$values   = isset( $rule['values'] ) && is_array( $rule['values'] ) ? array_map( 'absint', $rule['values'] ) : array();
		$post_id  = isset( $context['post_id'] ) ? absint( $context['post_id'] ) : 0;

		if ( empty( $values ) || 0 === $post_id ) {
			return false;
		}

		$found = in_array( $post_id, $values, true );
		return ( 'in' === $operator ) ? $found : ! $found;
	}

	/**
	 * Evaluate a taxonomy rule.
	 *
	 * @param array $rule    Rule data.
	 * @param array $context Context data.
	 * @return bool
	 */
	private function evaluate_taxonomy_rule( $rule, $context ) {
		$taxonomy  = isset( $rule['taxonomy'] ) ? sanitize_text_field( $rule['taxonomy'] ) : '';
		$operator  = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'in';
		$term_ids  = isset( $rule['term_ids'] ) && is_array( $rule['term_ids'] ) ? array_map( 'absint', $rule['term_ids'] ) : array();

		if ( empty( $taxonomy ) || empty( $term_ids ) ) {
			return false;
		}

		$context_terms = array();

		if ( isset( $context['terms'][ $taxonomy ] ) && is_array( $context['terms'][ $taxonomy ] ) ) {
			$context_terms = array_map( 'absint', $context['terms'][ $taxonomy ] );
		} elseif ( ( 'category' === $taxonomy || 'product_cat' === $taxonomy ) && isset( $context['categories'] ) ) {
			$context_terms = array_map( 'absint', $context['categories'] );
		} elseif ( ( 'post_tag' === $taxonomy || 'product_tag' === $taxonomy ) && isset( $context['tags'] ) ) {
			$context_terms = array_map( 'absint', $context['tags'] );
		} elseif ( isset( $context['taxonomy'] ) && $context['taxonomy'] === $taxonomy && isset( $context['term_id'] ) ) {
			$context_terms = array( absint( $context['term_id'] ) );
		} else {
			return false;
		}

		$intersection = array_intersect( $term_ids, $context_terms );

		if ( 'in' === $operator ) {
			return ! empty( $intersection );
		}

		if ( 'not_in' === $operator ) {
			return empty( $intersection );
		}

		return false;
	}

	/**
	 * Evaluate a product_ids rule.
	 *
	 * @param array $rule    Rule data.
	 * @param array $context Context data.
	 * @return bool
	 */
	private function evaluate_product_ids_rule( $rule, $context ) {
		$operator = isset( $rule['operator'] ) ? sanitize_text_field( $rule['operator'] ) : 'in';
		$values   = isset( $rule['values'] ) && is_array( $rule['values'] ) ? array_map( 'absint', $rule['values'] ) : array();
		$product_id = isset( $context['product_id'] ) ? absint( $context['product_id'] ) : 0;

		if ( empty( $values ) || 0 === $product_id ) {
			return false;
		}

		$found = in_array( $product_id, $values, true );

		if ( 'in' === $operator ) {
			return $found;
		}

		if ( 'not_in' === $operator ) {
			return ! $found;
		}

		return false;
	}

	/**
	 * Evaluate a sale rule.
	 *
	 * @param array $rule    Rule data.
	 * @param array $context Context data.
	 * @return bool
	 */
	private function evaluate_sale_rule( $rule, $context ) {
		$value = isset( $rule['value'] ) ? (bool) $rule['value'] : false;
		$is_sale = isset( $context['is_sale'] ) ? (bool) $context['is_sale'] : false;

		return $is_sale === $value;
	}
}

// Backward-compatibility class alias.
class_alias( 'XCOPB_Conditions', 'XCOSB_Conditions' );
