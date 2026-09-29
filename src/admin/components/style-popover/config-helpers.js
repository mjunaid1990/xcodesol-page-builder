/**
 * Standard effects config with CSS transform pre-wired.
 *
 * Every widget element that wants the Effects accordion to include the CSS
 * transform group can use this instead of writing { effects: {} } by hand.
 *
 * @param {Object}  opts
 * @param {Object}  opts.transform Transform key overrides (optional).
 * @param {Object}  opts.animation Animation key overrides (optional).
 * @param {string}  opts.prefix   Key prefix for the transform group (e.g.
 *                                'title' → title_transform_type). Inner
 *                                elements of multi-part widgets must pass a
 *                                prefix so their transforms don't collide on
 *                                the same flat keys. The entrance-animation
 *                                keys stay flat (widget-level) on purpose.
 * @return {Object} Effects category config.
 */
export function effectsWithTransform( opts = {} ) {
	const p = opts.prefix ? `${ opts.prefix }_` : '';
	const transform = Object.assign( {
		typeSetKey: `${ p }transform_type`,
		txSetKey: `${ p }transform_tx`,
		tySetKey: `${ p }transform_ty`,
		scaleSetKey: `${ p }transform_scale`,
		rotateSetKey: `${ p }transform_rotate`,
		originSetKey: `${ p }transform_origin`,
	}, opts.transform || {} );

	return {
		effects: {
			animationSetKey: opts.animationSetKey || 'animation',
			durationSetKey: opts.durationSetKey || 'animation_duration',
			delaySetKey: opts.delaySetKey || 'animation_delay',
			transform,
		},
	};
}

/**
 * Shared layout-only categories placeholder for widgets that currently have
 * no other style groups but still want Effects(Transform) enabled.
 */
export function minimalCategoriesWithTransform() {
	return { effects: effectsWithTransform() };
}

/**
 * Full widget-level effects transform: register the same transforms on the
 * widget root so the whole widget (not only inner elements) can be nudged,
 * scaled or rotated.
 */
export function widgetTransformConfig( overrides = {} ) {
	return {
		effects: effectsWithTransform( Object.assign( { transform: { originSetKey: 'transform_origin' } }, overrides ) ),
	};
}
