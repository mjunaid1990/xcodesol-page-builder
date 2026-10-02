/**
 * Live in-app preview canvas.
 *
 * Renders the selected structure's zones directly in the DOM (instead of an
 * iframe) so that each zone is a real draggable/droppable target with visible
 * separation lines. Blocks render realistic dummy previews (product grid,
 * prices, pagination, banners, etc.) so users can visualise the final page.
 * Containers render columns that accept nested widgets (single-level).
 *
 * @package WooCommerce_Template_Builder
 */

import { Fragment, createElement, useEffect, useRef, useState } from '@wordpress/element';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __, sprintf } from '@wordpress/i18n';
import '../../../assets/shared/motion-presets.css';

import { getBlocksForView, GENERAL_BLOCKS, CONTAINER_BLOCKS, WOO_CONTENT_BLOCKS, WIDGET_BLOCKS } from './block-palette';
import { columnCount, resolveColumnWidths, resolveColumnLines } from '../lib/columns';
import { effectiveForDevice } from '../styles/responsive';
import StylePopover, { hasStylePopover, SHADOW_VALUES } from './style-popover';
import { IconPlus, IconLayoutFlex, IconLayoutGrid } from './icons';

const SAMPLE = {
	name: __('Sample Product', 'xcodesol-page-builder'),
	price: '$99.00',
	regular: '$129.00',
	excerpt: __('A short product description shown in the excerpt block.', 'xcodesol-page-builder'),
	archiveTitle: __('Shop', 'xcodesol-page-builder'),
};

function getBlockMeta(type) {
	const all = [
		...getBlocksForView('page'),
		...GENERAL_BLOCKS,
		...CONTAINER_BLOCKS,
		...WIDGET_BLOCKS,
	];
	return all.find((b) => b.type === type) || { type, label: type, icon: 'dashicons-editor-help', defaults: {} };
}

function getBlockDisplayLabel(type) {
	const meta = getBlockMeta( type );
	const metaLabel = String( meta.label || '' ).trim();
	// A few legacy block manifests use the registered block name as their
	// label. Never expose a namespace/slug such as "xcopb/gb-heading" in the
	// canvas hover chip when a readable fallback can be derived from its type.
	if ( metaLabel && ! /^[a-z0-9_-]+\/[a-z0-9_-]+$/i.test( metaLabel ) ) return metaLabel;
	const slug = String( type || metaLabel ).split( '/' ).pop().replace( /^gb-/, '' );
	const labels = {
		heading: __( 'Heading', 'xcodesol-page-builder' ),
		text: __( 'Text Editor', 'xcodesol-page-builder' ),
		'text-widget': __( 'Text Editor', 'xcodesol-page-builder' ),
		'image': __( 'Image', 'xcodesol-page-builder' ),
		button: __( 'Button', 'xcodesol-page-builder' ),
		container: __( 'Container', 'xcodesol-page-builder' ),
		'breadcrumb': __( 'Breadcrumbs', 'xcodesol-page-builder' ),
		divider: __( 'Divider', 'xcodesol-page-builder' ),
		banner: __( 'Banner', 'xcodesol-page-builder' ),
		shortcode: __( 'Shortcode', 'xcodesol-page-builder' ),
		'sp-title': __( 'Post Title', 'xcodesol-page-builder' ),
		'sp-content': __( 'Post Content', 'xcodesol-page-builder' ),
		'sp-featured-image': __( 'Featured Image', 'xcodesol-page-builder' ),
		'sp-post-meta': __( 'Post Meta', 'xcodesol-page-builder' ),
		'sp-comments': __( 'Comments', 'xcodesol-page-builder' ),
		'ar-title': __( 'Archive Title', 'xcodesol-page-builder' ),
		'ar-description': __( 'Archive Description', 'xcodesol-page-builder' ),
		'ar-loop': __( 'Posts', 'xcodesol-page-builder' ),
		'ar-pagination': __( 'Pagination', 'xcodesol-page-builder' ),
	};
	if ( labels[ slug ] ) return labels[ slug ];
	return slug.replace( /[-_]+/g, ' ' ).replace( /\b\w/g, ( letter ) => letter.toUpperCase() ) || __( 'Widget', 'xcodesol-page-builder' );
}

function nestedCanvasId( containerIndex, path ) {
	const address = path.length === 1
		? `${ path[ 0 ].cj }-${ path[ 0 ].bi }`
		: path.map( ( step ) => `${ step.cj }.${ step.bi }` ).join( '_' );
	return `nested-${ containerIndex }-${ address }`;
}

function SortableNestedCanvasItem( { containerIndex, path, block, className, style, onClick, children, ...rest } ) {
	const id = nestedCanvasId( containerIndex, path );
	const isContainer = [ 'xcopb/gb-container', 'xcopb/container', 'xcosb/gb-container' ].includes( block?.type );
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable( {
		id,
		data: { canvasNested: { ci: containerIndex, path, container: isContainer } },
	} );
	return <div
		ref={ setNodeRef }
		{ ...attributes }
		{ ...listeners }
		{ ...rest }
		data-nested-id={ id.slice( 7 ) }
		data-nested-path={ JSON.stringify( { ci: containerIndex, path } ) }
		className={ `${ className }${ isDragging ? ' is-dragging' : '' }` }
		style={ { ...style, transform: [ CSS.Transform.toString( transform ), style?.transform ].filter( Boolean ).join( ' ' ), transition } }
		onClick={ onClick }
	>{ children }</div>;
}

function nestingAccent(depth = 1) {
	const level = Math.max(1, Number(depth) || 1);
	const hue = (263 + (level - 1) * 67) % 360;
	return `hsl(${hue} 82% 58%)`;
}

function cssDimension(value, fallback = '') {
	const allowedUnits = [ 'px', '%', 'vw', 'ch' ];
	const amount = value && typeof value === 'object' ? Number( value.value ) : Number( value );
	const unit = value && typeof value === 'object' && allowedUnits.includes( value.unit ) ? value.unit : 'px';
	return Number.isFinite( amount ) && amount > 0 ? `${ amount }${ unit }` : fallback;
}

const POPOVER_WIDTH = 360;
const POPOVER_GAP = 12;

/**
 * Position the style popover next to the click point (viewport-fixed) so it
 * opens where the user clicked. Flips above the cursor when there is more
 * room there, and stays inside the viewport horizontally.
 *
 * @param {{x:number,y:number}|null} point Viewport click coordinates.
 * @return {Object} Inline style (empty = use the CSS default anchor).
 */
function stylePanelPosition(point) {
	if (!point || typeof window === 'undefined') {
		return {};
	}
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	const spaceBelow = vh - point.y - POPOVER_GAP;
	const spaceAbove = point.y - POPOVER_GAP;
	const placeBelow = spaceBelow >= 240 || spaceBelow >= spaceAbove;

	// Keep the panel inside the viewport horizontally.
	const maxLeft = Math.max(8, vw - POPOVER_WIDTH - 8);
	const left = Math.max(8, Math.min(point.x + POPOVER_GAP, maxLeft));

	const available = (placeBelow ? spaceBelow : spaceAbove) - 8;
	const maxHeight = Math.max(160, Math.min(available, vh - 40));

	if (placeBelow) {
		return {
			position: 'fixed',
			left,
			top: point.y + POPOVER_GAP,
			right: 'auto',
			bottom: 'auto',
			maxHeight,
			width: Math.min(POPOVER_WIDTH, vw - 24),
		};
	}

	return {
		position: 'fixed',
		left,
		top: 'auto',
		right: 'auto',
		bottom: vh - point.y + POPOVER_GAP,
		maxHeight,
		width: Math.min(POPOVER_WIDTH, vw - 24),
	};
}

/* ---------- Inline-style mirrors of the PHP XCOSB_Block_Registry helpers ----
   The editor canvas reads the same style keys the public renderers do and
   applies them as inline styles to the dummy previews, so what you style is
   what you see. Keys that are empty/unset are skipped (defaults remain). */

/**
 * Shared text keys (color, align, font_size, … margin_*) → inline styles.
 *
 * @param {Object} settings Block settings.
 * @param {boolean} allowTransform Include text-transform.
 * @return {Object} React inline style.
 */
function textInlineCss(settings, allowTransform = false) {
	const style = {};

	if (settings.color) {
		style.color = settings.color;
	}
	if (settings.align && settings.align !== 'left') {
		style.textAlign = settings.align;
	}
	if (settings.font_size !== undefined && settings.font_size !== '') {
		style.fontSize = `${Number(settings.font_size)}px`;
	}
	if (settings.font_weight) {
		style.fontWeight = settings.font_weight;
	}
	if (settings.font_family) {
		style.fontFamily = settings.font_family;
	}
	if (settings.line_height !== undefined && settings.line_height !== '') {
		style.lineHeight = settings.line_height;
	}
	if (settings.letter_spacing !== undefined && settings.letter_spacing !== '') {
		style.letterSpacing = `${Number(settings.letter_spacing)}px`;
	}
	if (allowTransform && settings.text_transform && settings.text_transform !== 'none') {
		style.textTransform = settings.text_transform;
	}
	if (settings.font_style) {
		style.fontStyle = settings.font_style;
	}
	if (settings.text_decoration) {
		style.textDecoration = settings.text_decoration;
	}
	if (settings.background) {
		style.background = settings.background;
	}
	if (settings.max_width !== undefined && settings.max_width !== '' && Number(settings.max_width) > 0) {
		style.maxWidth = `${Number(settings.max_width)}px`;
		style.width = '100%';
	}
	if (settings.opacity !== undefined && settings.opacity !== '') {
		style.opacity = String(Math.min(100, Math.max(0, Number(settings.opacity))) / 100);
	}
	['top', 'right', 'bottom', 'left'].forEach((side) => {
		const value = settings[`margin_${side}`];
		if (value !== undefined && value !== '') {
			style[`margin${side.charAt(0).toUpperCase()}${side.slice(1)}`] = `${Number(value)}px`;
		}
	});
	['top', 'right', 'bottom', 'left'].forEach((side) => {
		const value = settings[`padding_${side}`];
		if (value !== undefined && value !== '') {
			style[`padding${side.charAt(0).toUpperCase()}${side.slice(1)}`] = `${Number(value)}px`;
		}
	});

	return style;
}

/**
 * Typography keys only (no margins) — used on inner content that already
 * sits inside a wrapper carrying the margins.
 *
 * @param {Object} settings Block settings.
 * @param {boolean} allowTransform Include text-transform.
 * @return {Object} React inline style.
 */
function typographyOnlyInlineCss(settings, allowTransform = false) {
	const style = textInlineCss(settings, allowTransform);
	['top', 'right', 'bottom', 'left'].forEach((side) => {
		delete style[`margin${side.charAt(0).toUpperCase()}${side.slice(1)}`];
	});
	return style;
}

/**
 * Margins only from the shared text keys (used on widget wrappers).
 *
 * @param {Object} settings Block settings.
 * @return {Object} React inline style.
 */
function marginInlineCss(settings) {
	const style = {};
	['top', 'right', 'bottom', 'left'].forEach((side) => {
		const value = settings[`margin_${side}`];
		if (value !== undefined && value !== '') {
			style[`margin${side.charAt(0).toUpperCase()}${side.slice(1)}`] = `${Number(value)}px`;
		}
	});
	return style;
}

/**
 * Apply the shared Style-tab spacing values to a widget's editor wrapper.
 * Dimensions stay as authored and legacy numeric values remain supported.
 *
 * @param {Object} settings Block settings.
 * @return {Object} React inline spacing styles.
 */
function widgetSpacingInlineCss(settings) {
	const style = {};
	[ 'padding', 'margin' ].forEach( ( property ) => {
		const value = settings[ property ];
		if ( value === undefined || value === null || value === '' ) {
			return;
		}
		if ( typeof value === 'object' ) {
			const unit = value.unit || 'px';
			style[ property ] = `${ value.top ?? 0 }${ unit } ${ value.right ?? 0 }${ unit } ${ value.bottom ?? 0 }${ unit } ${ value.left ?? 0 }${ unit }`;
			return;
		}
		style[ property ] = `${ Number( value ) || 0 }px`;
	} );
	return style;
}

/**
 * Unprefixed plain box chrome keys (background, border_width/style/color,
 * border_radius, shadow) plus padding_* → inline styles. Used for wrappers
 * styled as plain boxes (e.g. the Sort Products outer Box).
 *
 * @param {Object} settings Block settings.
 * @return {Object} React inline style.
 */
function plainBoxChromeInlineCss(settings) {
	const style = {};
	if (settings.background) {
		style.background = settings.background;
	}
	const width = Number(settings.border_width) || 0;
	if (width > 0 || settings.border_color) {
		style.border = `${width}px ${settings.border_style || 'solid'} ${settings.border_color || '#000000'}`;
	}
	if (Number(settings.border_radius) > 0) {
		style.borderRadius = `${Number(settings.border_radius)}px`;
	}
	const shadow = SHADOW_VALUES[settings.shadow || 'none'];
	if (shadow) {
		style.boxShadow = shadow;
	}
	['top', 'right', 'bottom', 'left'].forEach((side) => {
		const value = settings[`padding_${side}`];
		if (value !== undefined && value !== '') {
			style[`padding${side.charAt(0).toUpperCase()}${side.slice(1)}`] = `${Number(value)}px`;
		}
	});
	return style;
}

/**
 * Prefixed heading keys (title_color, title_font_size, …) → inline styles.
 *
 * @param {Object} settings Block settings.
 * @param {string} prefix   Key prefix, e.g. 'title'.
 * @return {Object} React inline style.
 */
function prefixedHeadingCss(settings, prefix) {
	const style = {};
	const read = (key) => settings[`${prefix}_${key}`];

	if (read('color')) {
		style.color = read('color');
	}
	if (read('font_family')) {
		style.fontFamily = read('font_family');
	}
	if (read('font_size') !== undefined && read('font_size') !== '') {
		style.fontSize = `${Number(read('font_size'))}px`;
	}
	if (read('font_weight')) {
		style.fontWeight = read('font_weight');
	}
	if (read('line_height') !== undefined && read('line_height') !== '') {
		style.lineHeight = read('line_height');
	}
	if (read('letter_spacing') !== undefined && read('letter_spacing') !== '') {
		style.letterSpacing = `${Number(read('letter_spacing'))}px`;
	}
	if (read('text_transform') && read('text_transform') !== 'none') {
		style.textTransform = read('text_transform');
	}
	if (read('font_style')) {
		style.fontStyle = read('font_style');
	}
	if (read('text_decoration')) {
		style.textDecoration = read('text_decoration');
	}
	if (Number(read('margin_bottom')) > 0) {
		style.marginBottom = `${Number(read('margin_bottom'))}px`;
	}

	return { ...style, ...transformInlineCss(settings, prefix) };
}

/**
 * Prefixed box chrome keys (bg / border_width / border_radius / shadow …)
 * → inline styles.
 *
 * @param {Object} settings Block settings.
 * @param {string} prefix   Key prefix, e.g. 'item', 'card', 'img'.
 * @return {Object} React inline style.
 */
function chromeInlineCss(settings, prefix) {
	const style = {};
	const read = (key) => settings[`${prefix}_${key}`];

	if (read('bg')) {
		style.background = read('bg');
	}
	const width = Number(read('border_width')) || 0;
	if (width > 0) {
		style.border = `${width}px ${read('border_style') || 'solid'} ${read('border_color') || '#000000'}`;
	}
	if (Number(read('border_radius')) > 0) {
		style.borderRadius = `${Number(read('border_radius'))}px`;
	}
	const shadow = SHADOW_VALUES[read('shadow') || 'none'];
	if (shadow) {
		style.boxShadow = shadow;
	}
	if (Number(read('padding')) > 0) {
		style.padding = `${Number(read('padding'))}px`;
	}
	['top', 'right', 'bottom', 'left'].forEach((side) => {
		const value = read(`padding_${side}`);
		if (value !== undefined && value !== '') {
			style[`padding${side.charAt(0).toUpperCase()}${side.slice(1)}`] = `${Number(value)}px`;
		}
	});

	return { ...style, ...transformInlineCss(settings, prefix) };
}

/**
 * Prefixed text keys (item_color, item_font_size, …) → inline styles, used
 * together with chromeInlineCss for chips/cards or alone for plain links.
 *
 * @param {Object} settings Block settings.
 * @param {string} prefix   Key prefix, e.g. 'item'.
 * @return {Object} React inline style.
 */
function prefixedTextCss(settings, prefix) {
	const style = {};
	const read = (key) => settings[`${prefix}_${key}`];

	if (read('color')) {
		style.color = read('color');
	}
	if (read('font_family')) {
		style.fontFamily = read('font_family');
	}
	if (read('font_size') !== undefined && read('font_size') !== '') {
		style.fontSize = `${Number(read('font_size'))}px`;
	}
	if (read('font_weight')) {
		style.fontWeight = read('font_weight');
	}
	if (read('line_height') !== undefined && read('line_height') !== '') {
		style.lineHeight = read('line_height');
	}
	if (read('letter_spacing') !== undefined && read('letter_spacing') !== '') {
		style.letterSpacing = `${Number(read('letter_spacing'))}px`;
	}
	if (read('text_transform') && read('text_transform') !== 'none') {
		style.textTransform = read('text_transform');
	}

	return style;
}

/**
 * Prefixed button keys (button_bg_color, …) → inline styles for the dummy
 * button element (matches what --xsb-btn-* do on the public side).
 *
 * @param {Object} settings Block settings.
 * @param {string} prefix   Key prefix, e.g. 'button'.
 * @return {Object} React inline style.
 */
function buttonInlineCss(settings, prefix = 'button') {
	const style = {};
	const read = (key) => settings[`${prefix}_${key}`];

	if (read('bg_color')) {
		style.background = read('bg_color');
	}
	if (read('text_color')) {
		style.color = read('text_color');
	}
	const width = Number(read('border_width')) || 0;
	if (read('border_color') || width > 0) {
		style.border = `${width}px solid ${read('border_color') || 'transparent'}`;
	}
	if (Number(read('border_radius')) > 0) {
		style.borderRadius = `${Number(read('border_radius'))}px`;
	}
	const padX = Number(read('padding_x')) || 0;
	const padY = Number(read('padding_y')) || 0;
	if (padX > 0 || padY > 0) {
		style.padding = `${padY}px ${padX}px`;
	}
	if (read('font_size') !== undefined && read('font_size') !== '') {
		style.fontSize = `${Number(read('font_size'))}px`;
	}
	if (read('font_weight')) {
		style.fontWeight = read('font_weight');
	}
	if (read('font_family')) {
		style.fontFamily = read('font_family');
	}

	return style;
}

/**
 * Mirror of the PHP position_decls(): pos_preset + pos_x/pos_y nudges +
 * pos_z → inline position styles for the editor preview. The widget pins
 * itself to the nearest positioned box (card / column / section) the same
 * way the front-end [data-xsb-r] rule does.
 *
 * @param {Object} settings Block settings.
 * @return {Object} React inline style (empty when nothing to position).
 */
function positionInlineCss(settings) {
	const position = (settings && settings.position) || '';
	const style = {};
	if ('' === position) {
		return style;
	}
	const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));
	const x = clamp(settings.pos_x, -800, 800);
	const y = clamp(settings.pos_y, -800, 800);
	const zRaw = settings.pos_z;
	const z = zRaw === undefined || zRaw === '' ? 0 : clamp(zRaw, 0, 999);

	style.position = position;

	if ('relative' === position) {
		if (x !== 0) {
			style.left = `${x}px`;
		}
		if (y !== 0) {
			style.top = `${y}px`;
		}
	} else if ('absolute' === position || 'fixed' === position) {
		style.left = '0';
		style.top = '0';
		style.right = 'auto';
		style.bottom = 'auto';
		if (x !== 0 || y !== 0) {
			style.transform = `translate(${x}px, ${y}px)`;
		}
	}

	style.zIndex = z > 0 ? z : 'auto';
	return style;
}

/**
 * Mirror of the PHP transform_css_props(): the shared CSS transform group
 * (transform_type + tx/ty/scale/rotate/origin) → React inline styles. The
 * same flat keys the popover writes for the widget root (or prefixed keys
 * for inner elements, e.g. title_transform_type) feed both the editor dummy
 * and the front-end renderer, so the preview stays in sync at every device
 * (effectiveForDevice already maps tablet_/mobile_ variants onto these
 * base keys).
 *
 * @param {Object} settings Block settings.
 * @param {string} prefix   Key prefix ('' for the block root, 'title'…).
 * @return {Object} React inline style (empty when transform is not custom).
 */
function transformInlineCss(settings, prefix = '') {
	const style = {};
	if (!settings) {
		return style;
	}
	const p = prefix ? `${prefix}_` : '';
	const read = (key) => settings[`${p}${key}`];
	if (read('transform_type') !== 'custom') {
		return style;
	}

	const parts = [];
	const tx = Number(read('transform_tx')) || 0;
	const ty = Number(read('transform_ty')) || 0;
	if (tx !== 0 || ty !== 0) {
		parts.push(`translate(${tx}px, ${ty}px)`);
	}
	const scale = Number(read('transform_scale')) || 0;
	if (scale > 0 && scale !== 100) {
		parts.push(`scale(${scale / 100})`);
	}
	const rotate = Number(read('transform_rotate')) || 0;
	if (rotate !== 0) {
		parts.push(`rotate(${rotate}deg)`);
	}
	if (parts.length) {
		style.transform = parts.join(' ');
	}
	if (read('transform_origin')) {
		style.transformOrigin = read('transform_origin');
	}
	return style;
}

/**
 * Convert a #rgb / #rrggbb colour to an rgba() string (used for overlays).
 *
 * @param {string} color Hex colour.
 * @param {number} alpha 0..1 opacity.
 * @return {string} rgba() value.
 */
function hexToRgba(color, alpha) {
	let hex = String(color || '#000000').replace('#', '').trim();
	if (hex.length === 3) {
		hex = hex.split('').map((c) => c + c).join('');
	}
	const num = parseInt(hex, 16);
	if (Number.isNaN(num) || hex.length !== 6) {
		return String(color || '#000000');
	}
	return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

/**
 * Placeholder product card used in the product grid preview.
 *
 * @param {Object} props
 * @param {Object} props.config Part of the loop's card_layout for this card slot.
 * @param {number} props.cols
 * @param {Object} props.settings Loop block settings (card + button styles).
 */
function ProductCard({ config, cols, settings }) {
	const fields = Array.isArray(config) ? config : [
		{ type: 'image' }, { type: 'title' }, { type: 'price' }, { type: 'add_to_cart' },
	];

	const cardCss = chromeInlineCss(settings || {}, 'card');
	const titleCss = prefixedHeadingCss(settings || {}, 'card_title');
	const priceCss = prefixedHeadingCss(settings || {}, 'card_price');
	const buttonCss = buttonInlineCss(settings || {}, 'button');

	const renderField = (field) => {
		switch (field.type) {
			case 'image':
				return <div className="xsb-prod-image"><span className="dashicons dashicons-format-image" aria-hidden="true" /></div>;
			case 'title':
				return <div className="xsb-prod-title" style={titleCss}>{SAMPLE.name}</div>;
			case 'price':
				return (
					<div className="xsb-prod-price" style={priceCss}>
						<del>{SAMPLE.regular}</del>
						<ins>{SAMPLE.price}</ins>
					</div>
				);
			case 'rating':
				return (
					<div className="xsb-prod-rating">
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-empty" aria-hidden="true" />
					</div>
				);
			case 'excerpt':
				return <p className="xsb-prod-excerpt">{SAMPLE.excerpt}</p>;
			case 'add_to_cart':
				return (
					<a className="xsb-prod-add button" href="#" style={buttonCss}>
						{__('Add to cart', 'xcodesol-page-builder')}
					</a>
				);
			case 'sku':
				return <div className="xsb-prod-sku">SKU: WTB-001</div>;
			case 'categories':
				return <div className="xsb-prod-cats">{__('Category', 'xcodesol-page-builder')}</div>;
			case 'divider':
				return <hr className="xsb-prod-divider" />;
			default:
				return <div className="xsb-prod-placeholder">{field.type}</div>;
		}
	};

	return (
		<div className="xsb-prod-card" style={{ flexBasis: cols, ...cardCss }}>
			{fields.map((field, i) => (
				<div key={i}>{renderField(field)}</div>
			))}
		</div>
	);
}

/**
 * Render the visual body of a single (non-container) block.
 *
 * @param {Object} block
 * @param {Object} settings Resolved settings.
 * @param {Object} meta     Block catalog entry.
 * @param {string} device   Active preview device.
 * @return {Object} JSX body.
 */
function renderBlockBody(block, settings, meta, device = 'desktop', canvasActions = {}) {
	switch (block.type) {
		case 'xcopb/post-title': {
			const Tag = settings.tag || 'h1';
			const title = __('The Future of Web Design and Visual Building', 'xcodesol-page-builder');
			const headingStyle = {
				textAlign: settings.align || 'left',
				margin: 0,
				color: settings.color || undefined,
				fontSize: settings.font_size ? `${Number(settings.font_size)}px` : undefined,
				fontWeight: settings.font_weight || undefined,
				lineHeight: settings.line_height || undefined,
				fontFamily: settings.font_family || undefined,
				letterSpacing: settings.letter_spacing !== undefined ? `${ Number( settings.letter_spacing ) }px` : undefined,
				textTransform: settings.text_transform || undefined,
				textShadow: settings.text_shadow || undefined,
				textDecoration: settings.text_decoration || undefined,
				...( Number( settings.text_overflow_lines ) > 0 ? { display: '-webkit-box', WebkitLineClamp: Number( settings.text_overflow_lines ), WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {} ),
				overflowWrap: settings.word_break === 'break-word' ? 'anywhere' : undefined,
				...chromeInlineCss(settings),
				...marginInlineCss(settings),
			};
			if (settings.hover_color) { headingStyle['--xsb-preview-hover-color'] = settings.hover_color; }
			return (
				<div className="xsb-bp xcopb-bp-post-title" style={{ width: '100%' }}>
					<div className="xsb-bp-label-chip">{__('Post Title', 'xcodesol-page-builder')}</div>
					<Tag className={settings.hover_color ? 'xsb-preview-interactive-color' : undefined} style={headingStyle}>{settings.link_to_post ? <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>{title}</a> : title}</Tag>
				</div>
			);
		}
		case 'xcopb/post-featured-image': {
			const wrapStyle = {
				textAlign: settings.align || 'center',
				width: '100%',
				...marginInlineCss(settings),
			};
			const imgStyle = {
				maxWidth: settings.width ? `${ Number( settings.width ) }px` : ( settings.max_width ? `${ Number( settings.max_width ) }px` : '100%' ),
				height: settings.height ? `${ Number( settings.height ) }px` : 'auto',
				objectFit: settings.object_fit || 'cover',
				objectPosition: settings.object_position || 'center center',
				borderRadius: `${Number(settings.border_radius) || 8}px`,
				display: 'inline-block',
				...chromeInlineCss(settings),
			};
			if (settings.grayscale !== undefined) { imgStyle.filter = `grayscale(${ Number( settings.grayscale ) }%)`; }
			if (settings.hover_grayscale !== undefined) { imgStyle['--xsb-preview-hover-filter'] = `grayscale(${ Number( settings.hover_grayscale ) }%)`; }
			return (
				<div className="xsb-bp xcopb-bp-featured-image" style={wrapStyle}>
					<div className="xsb-bp-label-chip">{__('Featured Image', 'xcodesol-page-builder')}</div>
					<div className={`xsb-preview-img-box${settings.hover_grayscale !== undefined ? ' xsb-preview-interactive-filter' : ''}`} style={{ ...imgStyle, minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff' }}>
						<span className="dashicons dashicons-format-image" style={{ fontSize: '48px', width: '48px', height: '48px' }} aria-hidden="true" />
					</div>
				</div>
			);
		}
		case 'xcopb/post-content': {
			return (
				<div className="xsb-bp xcopb-bp-post-content" style={{ width: '100%', ...marginInlineCss(settings) }}>
					<div className="xsb-bp-label-chip">{__('Post Content', 'xcodesol-page-builder')}</div>
					<div style={{ color: '#334155', lineHeight: '1.7', fontSize: '16px' }}>
						<p>{__('Designing web experiences should be intuitive, dynamic, and limitless. With modern page builders, creators can assemble modular components and publish pixel-perfect responsive layouts in minutes.', 'xcodesol-page-builder')}</p>
						<p>{__('Clean semantics and performance-first architecture guarantee fast loading times and superior SEO scores across mobile and desktop devices alike.', 'xcodesol-page-builder')}</p>
					</div>
				</div>
			);
		}
		case 'xcopb/post-meta': {
			const textColor = settings.color || '#64748b';
			const metaItems = [
				settings.show_author !== false && [ 'dashicons-admin-users', 'John Doe' ],
				settings.show_date !== false && [ 'dashicons-calendar-alt', new Date().toLocaleDateString() ],
				settings.show_comments !== false && [ 'dashicons-admin-comments', __('5 Comments', 'xcodesol-page-builder') ],
				settings.show_categories !== false && [ 'dashicons-category', 'Design, Tech' ],
			].filter(Boolean);
			return (
				<div className="xsb-bp xcopb-bp-post-meta" style={{ width: '100%', textAlign: settings.align || 'left', color: textColor, ...marginInlineCss(settings) }}>
					<div className="xsb-bp-label-chip">{__('Post Meta', 'xcodesol-page-builder')}</div>
					<div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', alignItems: 'center', flexWrap: 'wrap' }}>
						{metaItems.map(([icon, text]) => <span key={icon} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span className={`dashicons ${icon}`} style={{ fontSize: '16px', width: '16px', height: '16px' }} aria-hidden="true" /><span>{text}</span></span>)}
					</div>
				</div>
			);
		}
		case 'xcopb/post-excerpt': {
			return (
				<div className="xsb-bp xcopb-bp-post-excerpt" style={{ width: '100%', ...marginInlineCss(settings) }}>
					<div className="xsb-bp-label-chip">{__('Post Excerpt', 'xcodesol-page-builder')}</div>
					<p style={{ color: settings.color || '#475569', textAlign: settings.align || 'left', fontSize: `${ Number( settings.font_size ) || 16 }px`, lineHeight: settings.line_height || 1.6, margin: 0, ...marginInlineCss(settings) }}>
						{__('An insightful overview exploring modern design systems and visual theme builders.', 'xcodesol-page-builder')}
					</p>
				</div>
			);
		}
		case 'xcopb/post-author-box': {
			return (
				<div className="xsb-bp xcopb-bp-author-box" style={{ width: '100%', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: `${Number(settings.border_radius) || 8}px`, display: 'flex', gap: '16px', alignItems: 'center', boxSizing: 'border-box' }}>
					<div className="xsb-bp-label-chip">{__('Author Box', 'xcodesol-page-builder')}</div>
					<div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
						<span className="dashicons dashicons-admin-users" style={{ fontSize: '32px', width: '32px', height: '32px' }} aria-hidden="true" />
					</div>
					<div>
						<h4 style={{ margin: '0 0 6px', fontSize: '16px' }}>John Doe</h4>
						<p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{__('Lead developer and UI designer focused on modern WordPress web experiences.', 'xcodesol-page-builder')}</p>
					</div>
				</div>
			);
		}
		case 'xcopb/post-navigation': {
			return (
				<div className="xsb-bp xcopb-bp-post-nav" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
					<div className="xsb-bp-label-chip">{__('Post Navigation', 'xcodesol-page-builder')}</div>
					<span style={{ color: '#2563eb', fontWeight: 600 }}>← {settings.prev_label || __('Previous Post', 'xcodesol-page-builder')}</span>
					<span style={{ color: '#2563eb', fontWeight: 600 }}>{settings.next_label || __('Next Post', 'xcodesol-page-builder')} →</span>
				</div>
			);
		}
		case 'xcopb/post-comments': {
			return (
				<div className="xsb-bp xcopb-bp-comments" style={{ width: '100%', padding: '20px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
					<div className="xsb-bp-label-chip">{__('Comments Area', 'xcodesol-page-builder')}</div>
					<h4 style={{ margin: '0 0 10px', fontSize: '16px' }}>{__('3 Comments', 'xcodesol-page-builder')}</h4>
					<p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{__('Comments list and comment form placeholder.', 'xcodesol-page-builder')}</p>
				</div>
			);
		}
		case 'xcopb/archive-title': {
			const Tag = settings.tag || 'h1';
			return (
				<div className="xsb-bp xcopb-bp-archive-title" style={{ width: '100%', ...marginInlineCss(settings) }}>
					<div className="xsb-bp-label-chip">{__('Archive Title', 'xcodesol-page-builder')}</div>
					<Tag style={{ margin: 0, textAlign: settings.align || 'left', color: settings.color || undefined, fontSize: settings.font_size ? `${ Number( settings.font_size ) }px` : undefined, fontWeight: settings.font_weight || undefined }}>
						{settings.include_context === false ? __('Web Design', 'xcodesol-page-builder') : __('Category: Web Design', 'xcodesol-page-builder')}
					</Tag>
				</div>
			);
		}
		case 'xcopb/archive-description': {
			return (
				<div className="xsb-bp xcopb-bp-archive-desc" style={{ width: '100%', ...marginInlineCss(settings) }}>
					<div className="xsb-bp-label-chip">{__('Archive Description', 'xcodesol-page-builder')}</div>
					<p style={{ color: settings.color || '#64748b', textAlign: settings.align || 'left', margin: 0, fontSize: '15px', ...marginInlineCss(settings) }}>
						{__('Explore the latest articles, tutorials, and insights about modern visual web design.', 'xcodesol-page-builder')}
					</p>
				</div>
			);
		}
		case 'xcopb/archive-posts': {
			const cols = Number(settings.columns) || 3;
			return (
				<div className="xsb-bp xcopb-bp-archive-posts" style={{ width: '100%' }}>
					<div className="xsb-bp-label-chip">{__('Archive Posts Grid', 'xcodesol-page-builder')}</div>
					<div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${Number(settings.gap) || 20}px` }}>
						{[1, 2, 3, 4, 5, 6].slice(0, cols).map((item) => (
							<div key={item} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
								{settings.show_image !== false && <div style={{ height: '120px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<span className="dashicons dashicons-format-image" style={{ color: '#94a3b8' }} />
								</div>}
								<div style={{ padding: '14px' }}>
									{settings.show_meta !== false && <span style={{ fontSize: '11px', color: '#94a3b8' }}>May 24, 2026</span>}
									<h4 style={{ margin: '6px 0 8px', fontSize: '15px' }}>{sprintf(__('Sample Post %d', 'xcodesol-page-builder'), item)}</h4>
									{settings.show_excerpt !== false && <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>{__('Excerpt of the blog post previewing content in grid...', 'xcodesol-page-builder')}</p>}
									{settings.show_button !== false && <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>{settings.button_text || __('Read More', 'xcodesol-page-builder')} →</span>}
								</div>
							</div>
						))}
					</div>
				</div>
			);
		}
		case 'xcopb/gb-container':
		case 'xcosb/gb-container':
		case 'xcopb/container': {
			return <NestedContainerPreview block={block} settings={settings} device={device} onAddWidget={canvasActions.onAddWidget} dropTarget={canvasActions.dropTarget} dropGuide={canvasActions.dropGuide} depth={canvasActions.depth || 1} containerIndex={canvasActions.containerIndex} containerPath={canvasActions.containerPath} onSelectNested={canvasActions.onSelectNested} selectedNested={canvasActions.selectedNested} />;
		}
		case 'xcopb/gb-heading': {
			const Tag = settings.tag || 'h2';
			const baseFontSize = settings.font_size && typeof settings.font_size === 'object' ? `${ settings.font_size.value || 28 }${ settings.font_size.unit || 'px' }` : ( settings.font_size ? `${ Number( settings.font_size ) }px` : undefined );
			const headingStyle = {
				textAlign: settings.align || 'left',
				margin: 0,
				color: settings.color || undefined,
				fontSize: baseFontSize,
				fontWeight: settings.font_weight || undefined,
				lineHeight: settings.line_height || undefined,
				letterSpacing: settings.letter_spacing ? `${Number(settings.letter_spacing)}px` : undefined,
				fontFamily: settings.font_family || undefined,
				textTransform: settings.text_transform || undefined,
				textDecoration: settings.text_decoration || undefined,
				animation: settings.animation && settings.animation !== 'none' ? `xsb-motion-${ settings.animation } ${ Number( settings.animation_duration ) || 600 }ms ${ settings.animation_easing || 'ease' } ${ settings.animation_repeat || '1' } both` : undefined,
				animationDelay: settings.animation && settings.animation !== 'none' ? `${ Number( settings.animation_delay ) || 0 }ms` : undefined,
				textShadow: settings.text_shadow || undefined,
				wordBreak: settings.word_break === 'break-word' ? 'break-word' : undefined,
				...( Number( settings.text_overflow_lines ) > 0 ? { display: '-webkit-box', WebkitLineClamp: Number( settings.text_overflow_lines ), WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {} ),
				...chromeInlineCss(settings),
				...marginInlineCss(settings),
			};
			const titleText = settings.title || settings.text || __('Heading Title', 'xcodesol-page-builder');
			return (
				<div className="xsb-bp xcopb-bp-heading" style={{ width: '100%' }}>
					<div className="xsb-bp-label-chip">{__('Heading', 'xcodesol-page-builder')}</div>
					<Tag style={headingStyle}>
						{settings.link ? <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>{titleText}</a> : titleText}
					</Tag>
				</div>
			);
		}
		case 'xcopb/gb-button': {
			const btnStyle = {
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '8px',
				backgroundColor: settings.bg_color || '#2563eb',
				color: settings.text_color || '#ffffff',
				padding: settings.padding_y !== undefined || settings.padding_x !== undefined ? `${ Number( settings.padding_y ?? 12 ) }px ${ Number( settings.padding_x ?? 24 ) }px` : ( settings.size === 'xs' ? '6px 12px' : settings.size === 'sm' || settings.size === 'small' ? '8px 16px' : settings.size === 'lg' || settings.size === 'large' ? '16px 32px' : settings.size === 'xl' ? '20px 40px' : '12px 24px' ),
				fontSize: settings.font_size ? `${ Number( settings.font_size ) }px` : ( settings.size === 'xs' ? '12px' : settings.size === 'sm' || settings.size === 'small' ? '13px' : settings.size === 'lg' || settings.size === 'large' ? '17px' : settings.size === 'xl' ? '19px' : '15px' ),
				fontWeight: settings.font_weight || 600,
				fontFamily: settings.font_family || undefined,
				letterSpacing: settings.letter_spacing ? `${ Number( settings.letter_spacing ) }px` : undefined,
				textTransform: settings.text_transform || undefined,
				borderRadius: `${ settings.border_radius !== undefined ? Number(settings.border_radius) : 6 }px`,
				border: settings.border_style && settings.border_style !== 'none' ? `${ Number( settings.border_width ) || 1 }px ${ settings.border_style } ${ settings.border_color || '#2563eb' }` : 'none',
				textDecoration: 'none',
				cursor: 'pointer',
				boxShadow: SHADOW_VALUES[ settings.box_shadow || 'none' ] || undefined,
				...marginInlineCss( settings ),
			};
			const wrapStyle = {
				textAlign: settings.align || 'left',
				width: '100%',
				...marginInlineCss(settings),
			};
			return (
				<div className="xsb-bp xcopb-bp-button" style={wrapStyle}>
					<div className="xsb-bp-label-chip">{__('Button', 'xcodesol-page-builder')}</div>
					<button type="button" className="xsb-preview-button-interactive" style={btnStyle}>
						{settings.icon && <span className={`dashicons ${settings.icon}`} />}
						<span>{settings.text || __('Click Here', 'xcodesol-page-builder')}</span>
					</button>
				</div>
			);
		}
		case 'xcopb/gb-image': {
			const wrapStyle = {
				textAlign: settings.align || 'left',
				width: '100%',
				...marginInlineCss(settings),
			};
			const imgStyle = {
				maxWidth: Number( settings.max_width ) > 0 ? `${ Number( settings.max_width ) }px` : '100%',
				width: Number( settings.width ) > 0 ? `${ Number( settings.width ) }px` : undefined,
				height: Number( settings.height ) > 0 ? `${ Number( settings.height ) }px` : 'auto',
				objectFit: settings.object_fit || undefined,
				objectPosition: settings.object_position || undefined,
				borderRadius: `${ Number( settings.border_radius ) || 0 }px`,
				display: 'inline-block',
				boxShadow: SHADOW_VALUES[ settings.box_shadow || 'none' ] || undefined,
				opacity: Number.isFinite( Number( settings.opacity ) ) && settings.opacity !== undefined ? Math.min( 100, Math.max( 0, Number( settings.opacity ) ) ) / 100 : undefined,
				filter: Number( settings.grayscale ) > 0 ? `grayscale(${ Math.min( 100, Number( settings.grayscale ) ) }%)` : undefined,
				...chromeInlineCss(settings),
			};
			return (
				<div className="xsb-bp xcopb-bp-image" style={wrapStyle}>
					<div className="xsb-bp-label-chip">{__('Image', 'xcodesol-page-builder')}</div>
					{( typeof settings.url === 'object' ? settings.url?.url : settings.url ) ? (
						<img src={typeof settings.url === 'object' ? settings.url.url : settings.url} alt={settings.alt || ( typeof settings.url === 'object' ? settings.url.alt : '' ) || ''} style={imgStyle} />
					) : (
						<div className="xsb-preview-img-box" style={{ ...imgStyle, minHeight: '140px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
							<span className="dashicons dashicons-format-image" style={{ fontSize: '36px', color: '#94a3b8' }} aria-hidden="true" />
						</div>
					)}
					{settings.caption && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>{settings.caption}</p>}
				</div>
			);
		}
		case 'xcopb/gb-shortcode': {
			return (
				<div className="xsb-bp xcopb-bp-shortcode" style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '6px' }}>
					<div className="xsb-bp-label-chip">{__('Shortcode', 'xcodesol-page-builder')}</div>
					{settings.title && <strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#334155' }}>{settings.title}</strong>}
					<code style={{ display: 'block', background: '#e2e8f0', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', color: '#0f172a' }}>
						{settings.shortcode || '[your_shortcode]'}
					</code>
				</div>
			);
		}
		case 'xcosb/sp-image': {
			const wrapCss = marginInlineCss(settings);
			if (settings.align && settings.align !== 'left') {
				wrapCss.textAlign = settings.align;
			}
			const boxCss = chromeInlineCss(settings, 'img');
			if (Number(settings.max_width) > 0) {
				boxCss.maxWidth = `${Number(settings.max_width)}px`;
			}
			return (
				<div className="xsb-bp sp-image" style={wrapCss}>
					<div className="xsb-bp-label-chip">{__('Product Image', 'xcodesol-page-builder')}</div>
					<div className="xsb-preview-img-box" style={boxCss}>
						<span className="dashicons dashicons-format-image" aria-hidden="true" />
					</div>
				</div>
			);
		}
		case 'xcosb/sp-title': {
			const textCss = textInlineCss(settings, true);
			return (
				<div className="xsb-bp sp-title">
					<div className="xsb-bp-label-chip">{__('Product Title', 'xcodesol-page-builder')}</div>
					<h2 className="xsb-bp-text" style={textCss}>{SAMPLE.name}</h2>
				</div>
			);
		}
		case 'xcosb/sp-price': {
			const textCss = textInlineCss(settings);
			return (
				<div className="xsb-bp sp-price">
					<div className="xsb-bp-label-chip">{__('Product Price', 'xcodesol-page-builder')}</div>
					<div className="xsb-prod-price" style={textCss}><del>{SAMPLE.regular}</del> <ins>{SAMPLE.price}</ins></div>
				</div>
			);
		}
		case 'xcosb/sp-excerpt': {
			const textCss = textInlineCss(settings);
			return (
				<div className="xsb-bp sp-excerpt">
					<div className="xsb-bp-label-chip">{__('Product Excerpt', 'xcodesol-page-builder')}</div>
					<p className="xsb-bp-text" style={textCss}>{SAMPLE.excerpt}</p>
				</div>
			);
		}
		case 'xcosb/sp-add-to-cart': {
			const wrapCss = textInlineCss(settings);
			const btnCss = buttonInlineCss(settings, 'button');
			return (
				<div className="xsb-bp sp-add-to-cart">
					<div className="xsb-bp-label-chip">{__('Add to Cart', 'xcodesol-page-builder')}</div>
					<div className="xsb-cart-row" style={wrapCss}>
						<input className="xsb-qty-input" type="number" value="1" readOnly />
						<a className="xsb-add-btn" href="#" style={btnCss}>{__('Add to cart', 'xcodesol-page-builder')}</a>
					</div>
				</div>
			);
		}
		case 'xcosb/sp-rating': {
			const textCss = textInlineCss(settings);
			const starColor = settings.color || '#f59e0b';
			const align = settings.align || 'left';
			const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
			return (
				<div className="xsb-bp sp-rating" style={textCss}>
					<div className="xsb-bp-label-chip">{__('Product Rating', 'xcodesol-page-builder')}</div>
					<div className="xsb-prod-rating" style={{ display: 'flex', alignItems: 'center', justifyContent: justify, gap: '8px', color: starColor, fontSize: settings.font_size ? `${settings.font_size}px` : '14px' }}>
						<span style={{ letterSpacing: '2px', color: starColor }}>★★★★★</span>
						<span style={{ color: '#6b7280', fontSize: '13px' }}>({__('4 customer reviews', 'xcodesol-page-builder')})</span>
					</div>
				</div>
			);
		}
		case 'xcosb/sp-meta': {
			const textCss = textInlineCss(settings);
			const linkColor = settings.hover_color || 'var(--xsb-blue)';
			const align = settings.align || 'left';
			return (
				<div className="xsb-bp sp-meta" style={textCss}>
					<div className="xsb-bp-label-chip">{__('Product Meta', 'xcodesol-page-builder')}</div>
					<div className="xsb-prod-meta" style={{ fontSize: settings.font_size ? `${settings.font_size}px` : '13px', color: settings.color || '#6b7280', textAlign: align, lineHeight: '1.6' }}>
						<div><strong>{__('SKU:', 'xcodesol-page-builder')}</strong> <span>PROD-00123</span></div>
						<div><strong>{__('Category:', 'xcodesol-page-builder')}</strong> <span style={{ color: linkColor }}>{__('Clothing, Hoodies', 'xcodesol-page-builder')}</span></div>
						<div><strong>{__('Tags:', 'xcodesol-page-builder')}</strong> <span style={{ color: linkColor }}>{__('featured, winter', 'xcodesol-page-builder')}</span></div>
					</div>
				</div>
			);
		}
		case 'xcosb/sp-tabs': {
			const textCss = textInlineCss(settings);
			const chromeCss = chromeInlineCss(settings, '');
			const isNarrow = device === 'mobile';
			return (
				<div className="xsb-bp sp-tabs" style={{ ...textCss, ...chromeCss }}>
					<div className="xsb-bp-label-chip">{__('Product Data Tabs', 'xcodesol-page-builder')}</div>
					<div className="xsb-dummy-tabs" style={{ border: '1px solid var(--xsb-line)', borderRadius: settings.border_radius ? `${settings.border_radius}px` : '8px', overflow: 'hidden', background: settings.background || '#ffffff' }}>
						<div className="xsb-dummy-tabs-nav" style={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row', borderBottom: '1px solid var(--xsb-line)', background: 'var(--xsb-canvas)' }}>
							<button type="button" style={{ padding: '10px 16px', background: '#fff', border: 'none', borderBottom: isNarrow ? '1px solid var(--xsb-line)' : '2px solid var(--xsb-blue)', borderLeft: isNarrow ? '3px solid var(--xsb-blue)' : 'none', fontWeight: 600, fontSize: '13px', cursor: 'default', textAlign: 'left' }}>{__('Description', 'xcodesol-page-builder')}</button>
							<button type="button" style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: isNarrow ? '1px solid var(--xsb-line)' : 'none', color: '#6b7280', fontSize: '13px', cursor: 'default', textAlign: 'left' }}>{__('Additional information', 'xcodesol-page-builder')}</button>
							<button type="button" style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'default', textAlign: 'left' }}>{__('Reviews (4)', 'xcodesol-page-builder')}</button>
						</div>
						<div className="xsb-dummy-tabs-content" style={{ padding: isNarrow ? '12px' : '16px', fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>
							<p style={{ margin: 0 }}>{__('Detailed product description will render here with full WooCommerce template formatting, specifications table, and customer review submission form.', 'xcodesol-page-builder')}</p>
						</div>
					</div>
				</div>
			);
		}
		case 'xcosb/ar-title': {
			const textCss = textInlineCss(settings, true);
			return (
				<div className="xsb-bp ar-title">
					<div className="xsb-bp-label-chip">{__('Archive Title', 'xcodesol-page-builder')}</div>
					<h1 className="xsb-bp-text" style={textCss}>{SAMPLE.archiveTitle}</h1>
				</div>
			);
		}
		case 'xcosb/ar-description': {
			const textCss = textInlineCss(settings);
			return (
				<div className="xsb-bp ar-description">
					<div className="xsb-bp-label-chip">{__('Archive Description', 'xcodesol-page-builder')}</div>
					<p className="xsb-bp-text" style={textCss}>
						{__('This is where the category or tag description will be displayed.', 'xcodesol-page-builder')}
					</p>
				</div>
			);
		}
		case 'xcosb/ar-result-count': {
			const textCss = textInlineCss(settings);
			return (
				<div className="xsb-bp ar-result-count">
					<div className="xsb-bp-label-chip">{__('Result Count', 'xcodesol-page-builder')}</div>
					<span className="xsb-bp-result-text" style={textCss}>{sprintf(__('Showing 1–%d of %d results', 'xcodesol-page-builder'), 9, 36)}</span>
				</div>
			);
		}
		case 'xcosb/ar-ordering': {
			const wrapCss = { ...textInlineCss(settings), ...plainBoxChromeInlineCss(settings) };
			const optionCss = {};
			if (settings.color) {
				optionCss.color = settings.color;
			}
			if (settings.font_size !== undefined && settings.font_size !== '') {
				optionCss.fontSize = `${Number(settings.font_size)}px`;
			}
			if (settings.font_weight) {
				optionCss.fontWeight = settings.font_weight;
			}
			const fieldCss = {};
			if (settings.field_bg_color) {
				fieldCss.background = settings.field_bg_color;
			}
			const fieldWidth = Number(settings.field_border_width) || 0;
			if (settings.field_border_color || fieldWidth > 0) {
				fieldCss.border = `${fieldWidth}px solid ${settings.field_border_color || '#d5dae2'}`;
			}
			if (Number(settings.field_radius) > 0) {
				fieldCss.borderRadius = `${Number(settings.field_radius)}px`;
			}
			const fieldShadow = SHADOW_VALUES[settings.field_shadow || 'none'];
			if (fieldShadow) {
				fieldCss.boxShadow = fieldShadow;
			}
			const padX = Number(settings.field_padding_x) || 0;
			const padY = Number(settings.field_padding_y) || 0;
			if (padX > 0 || padY > 0) {
				fieldCss.padding = `${padY}px ${padX}px`;
			}
			const radioCss = {};
			if (Number(settings.radio_gap) > 0) {
				radioCss.gap = `${Number(settings.radio_gap)}px`;
			}
			const textFieldCss = { ...optionCss, ...fieldCss };
			const titleCss = prefixedHeadingCss(settings, 'title');
			const title = settings.title || '';
			const renderTitle = () => (
				title !== '' && <div className="xsb-woo-block-title xsb-ordering-title" style={titleCss}>{title}</div>
			);

			return settings.display_type === 'radio' ? (
				<div className="xsb-bp ar-ordering">
					<div className="xsb-bp-label-chip">{__('Sort Products', 'xcodesol-page-builder')}</div>
					{renderTitle()}
					<div className="xsb-ordering-radio" style={{ ...wrapCss, ...radioCss }}>
						<label className="xsb-ordering-option"><input type="radio" name="orderby-preview" defaultChecked readOnly /><span style={optionCss}>{__('Default sorting', 'xcodesol-page-builder')}</span></label>
						<label className="xsb-ordering-option"><input type="radio" name="orderby-preview" readOnly /><span style={optionCss}>{__('Sort by popularity', 'xcodesol-page-builder')}</span></label>
						<label className="xsb-ordering-option"><input type="radio" name="orderby-preview" readOnly /><span style={optionCss}>{__('Sort by latest', 'xcodesol-page-builder')}</span></label>
					</div>
				</div>
			) : (
				<div className="xsb-bp ar-ordering">
					<div className="xsb-bp-label-chip">{__('Sort Products', 'xcodesol-page-builder')}</div>
					{renderTitle()}
					<div style={wrapCss}>
						<select className="xsb-ordering-select" defaultValue="menu_order" style={textFieldCss}>
							<option value="menu_order">{__('Default sorting', 'xcodesol-page-builder')}</option>
							<option value="popularity">{__('Sort by popularity', 'xcodesol-page-builder')}</option>
							<option value="rating">{__('Sort by average rating', 'xcodesol-page-builder')}</option>
							<option value="date">{__('Sort by latest', 'xcodesol-page-builder')}</option>
						</select>
					</div>
				</div>
			);
		}
		case 'xcosb/ar-loop': {
			let defaultCols = 3;
			if (device === 'tablet') defaultCols = 2;
			if (device === 'mobile') defaultCols = 1;
			const cols = Math.min(6, Math.max(1, Number(settings.columns) || defaultCols));
			const cardLayout = settings.card_layout || null;
			const basis = `calc(${100 / cols}% - ${(14 * (cols - 1)) / cols}px)`;
			const wrapCss = marginInlineCss(settings);
			return (
				<div className="xsb-bp ar-loop" style={wrapCss}>
					<div className="xsb-bp-label-chip">{__('Product Grid', 'xcodesol-page-builder')}</div>
					<p className="xsb-bp-muted xsb-bp-loop-hint">
						{__('The card shown here is a placeholder — design the real card in a Product Card template.', 'xcodesol-page-builder')}
					</p>
					<div className="xsb-prod-grid" style={{ '--xsb-cols': cols }}>
						{Array.from({ length: Math.min(6, cols * 3) }).map((_, i) => (
							<ProductCard key={i} config={cardLayout} cols={basis} settings={settings} />
						))}
					</div>
				</div>
			);
		}
		case 'xcosb/ar-pagination': {
			const wrapCss = textInlineCss(settings);
			const numCss = {};
			if (settings.link_color) {
				numCss.color = settings.link_color;
			}
			if (settings.font_size !== undefined && settings.font_size !== '') {
				numCss.fontSize = `${Number(settings.font_size)}px`;
			}
			if (settings.font_weight) {
				numCss.fontWeight = settings.font_weight;
			}
			const navCss = {};
			if (Number(settings.item_gap) > 0) {
				navCss.gap = `${Number(settings.item_gap)}px`;
			}
			const currentCss = {};
			if (settings.active_bg) {
				currentCss.background = settings.active_bg;
			}
			if (settings.active_color) {
				currentCss.color = settings.active_color;
			}
			if (Number(settings.active_radius) > 0) {
				currentCss.borderRadius = `${Number(settings.active_radius)}px`;
			}
			return (
				<div className="xsb-bp ar-pagination">
					<div className="xsb-bp-label-chip">{__('Pagination', 'xcodesol-page-builder')}</div>
					<nav className="xsb-pagination" style={{ ...wrapCss, ...navCss }}>
						<span className="xsb-page-num is-current" style={{ ...numCss, ...currentCss }}>1</span>
						<span className="xsb-page-num" style={numCss}>2</span>
						<span className="xsb-page-num" style={numCss}>3</span>
						<span className="xsb-page-dots" style={numCss}>…</span>
						<span className="xsb-page-num" style={numCss}>12</span>
						<span className="xsb-page-next" style={numCss}>→</span>
					</nav>
				</div>
			);
		}
		case 'xcopb/gb-banner':
		case 'xcosb/gb-banner': {
			const align = settings.align || 'center';
			const bgType = settings.bg_type || 'color';
			const bgColor = settings.bg_color || settings.background || '#2563eb';
			const bgImage = typeof settings.bg_image === 'object' ? settings.bg_image?.url || '' : settings.bg_image || '';
			const bgVideo = typeof settings.bg_video === 'object' ? settings.bg_video?.url || '' : settings.bg_video || '';
			const overlay = settings.overlay_color || '';
			const isArchiveTitle = settings.title_source === 'archive_title';
			const title = isArchiveTitle
				? SAMPLE.archiveTitle
				: (settings.title || '');
			const subtitle = settings.subtitle || '';
			const buttonText = settings.button_text || '';
			const showButton = !(settings.show_button === false);

			// Background color always sits behind; image/video layer on top.
			const bgStyle = {
				backgroundColor: bgColor,
				color: settings.text_color || '#fff',
				minHeight: settings.min_height ? Number(settings.min_height) : undefined,
				paddingTop: settings.padding_top ? Number(settings.padding_top) : undefined,
				paddingBottom: settings.padding_bottom ? Number(settings.padding_bottom) : undefined,
				paddingLeft: settings.padding_left ? Number(settings.padding_left) : undefined,
				paddingRight: settings.padding_right ? Number(settings.padding_right) : undefined,
				borderRadius: settings.border_radius ? Number(settings.border_radius) : undefined,
				boxShadow: SHADOW_VALUES[settings.box_shadow || 'none'] || undefined,
			};

			const borderWidth = Number(settings.border_width) || 0;
			if (borderWidth > 0) {
				bgStyle.border = `${borderWidth}px ${settings.border_style || 'solid'} ${settings.border_color || '#000000'}`;
				bgStyle.boxSizing = 'border-box';
			}

			const anim = settings.animation || 'none';
			if (anim !== 'none') {
				// Keyframes are namespaced (xsb-fade-in, xsb-slide-up, ...).
				bgStyle.animation = `xsb-motion-${anim} ${Number(settings.animation_duration) || 600}ms ${settings.animation_easing || 'ease'} ${settings.animation_repeat || '1'} both`;
				bgStyle.animationDelay = `${Number(settings.animation_delay) || 0}ms`;
			}

			// Flex placement of the content inside the banner.
			const flexX = { left: 'flex-start', center: 'center', right: 'flex-end' };
			const flexY = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
			bgStyle.display = 'flex';
			bgStyle.flexDirection = 'column';
			bgStyle.justifyContent = flexY[settings.content_position_y || 'center'];
			bgStyle.alignItems = flexX[settings.content_position_x || 'center'];

			const contentBox = !!settings.content_box;
			const overlayOpacity = Math.min(100, Math.max(0, Number(settings.overlay_opacity ?? 45))) / 100;

			if (bgType === 'gradient') {
				const gA = settings.gradient_color_a || '#2563eb';
				const gB = settings.gradient_color_b || '#4f46e5';
				if ((settings.gradient_type || 'linear') === 'radial') {
					bgStyle.backgroundImage = `radial-gradient(${settings.gradient_radial_shape || 'circle'} at ${settings.gradient_position || 'center'}, ${gA}, ${gB})`;
				} else {
					bgStyle.backgroundImage = `linear-gradient(${Number(settings.gradient_angle) || 180}deg, ${gA}, ${gB})`;
				}
			}
			if ( bgType === 'color' && settings.bg_color ) { bgStyle.backgroundColor = settings.bg_color; }

			if (bgType === 'image' && bgImage) {
				const size = settings.bg_size || 'cover';
				const position = settings.bg_position || 'center center';
				const repeat = settings.bg_repeat === undefined ? 'no-repeat' : settings.bg_repeat;
				const attachment = settings.bg_attachment || 'scroll';
				bgStyle.backgroundImage = `url("${bgImage}")`;
				bgStyle.backgroundSize = size;
				bgStyle.backgroundPosition = position;
				bgStyle.backgroundRepeat = repeat;
				bgStyle.backgroundAttachment = attachment;
			}

			return (
				<div className="xsb-bp gb-banner" style={bgStyle}>
					{bgType === 'image' && bgImage && (
						<div
							className="xsb-banner-bg"
							style={{
								backgroundImage: `url("${bgImage}")`,
								backgroundSize: settings.bg_size || 'cover',
								backgroundPosition: settings.bg_position || 'center center',
								backgroundRepeat: settings.bg_repeat === undefined ? 'no-repeat' : settings.bg_repeat,
								backgroundAttachment: settings.bg_attachment || 'scroll',
							}}
						/>
					)}
					{bgType === 'video' && bgVideo && (
						<video className="xsb-banner-video" src={bgVideo} muted loop autoPlay playsInline />
					)}
					{overlay && (bgType === 'image' || bgType === 'video') && (
						// z-index 1: above the media (0) but below the content (2).
						<div className="xsb-banner-overlay" style={{ backgroundColor: overlay, opacity: overlayOpacity, zIndex: 1 }} />
					)}
					<div className="xsb-bp-label-chip xsb-bp-label-chip--dark">{__('Banner', 'xcodesol-page-builder')}</div>
					{isArchiveTitle && (
						<span className="xsb-banner-source-tag">{__('Archive title', 'xcodesol-page-builder')}</span>
					)}
					<div
						className="xsb-banner-inner"
						style={{
							textAlign: align,
							// margin:0 lets the parent's flex alignment place the box
							// (the stylesheet default `0 auto` would always center it).
							margin: 0,
							position: 'relative',
							zIndex: 2,
							...(contentBox
								? {
									background: settings.content_box_bg || 'rgba(0,0,0,0.35)',
									padding: `${Number(settings.content_box_padding) || 28}px`,
									borderRadius: `${Number(settings.content_box_radius) || 16}px`,
									boxSizing: 'border-box',
								}
								: {}),
						}}
					>
						{title !== '' && (
							<h3 className="xsb-banner-title" style={{ color: settings.title_color || settings.text_color || '#fff' }}>
								{title}
							</h3>
						)}
						{subtitle !== '' && (
							<p className="xsb-banner-subtitle" style={{ color: settings.subtitle_color || settings.text_color || '#fff' }}>
								{subtitle}
							</p>
						)}
						{showButton && buttonText !== '' && (
							<a className="xsb-banner-btn" href="#">{buttonText}</a>
						)}
					</div>
				</div>
			);
		}
		case 'xcopb/gb-divider':
		case 'xcosb/gb-divider':
			{
			const lineStyle = { width: `${ Number( settings.width ) || 100 }%`, height: `${ Math.max( 1, Number( settings.height ) || 2 ) }px`, margin: `${ Number( settings.margin ) || 24 }px 0`, background: settings.style === 'gradient' ? `linear-gradient(90deg, ${ settings.color || '#e6e9f0' }, ${ settings.gradient_color || '#4f46e5' })` : settings.color || '#e6e9f0', border: settings.style === 'double' ? `${ Math.max( 1, Number( settings.height ) || 2 ) / 3 }px double ${ settings.color || '#e6e9f0' }` : 'none' };
			lineStyle.marginLeft = settings.align === 'left' ? '0' : settings.align === 'right' ? 'auto' : 'auto';
			lineStyle.marginRight = settings.align === 'right' ? '0' : 'auto';
			if ( [ 'dashed', 'dotted' ].includes( settings.style ) ) { lineStyle.height = '0'; lineStyle.borderTop = `${ Math.max( 1, Number( settings.height ) || 2 ) }px ${ settings.style } ${ settings.color || '#e6e9f0' }`; }
			return (
				<div className="xsb-bp gb-divider">
					<div className="xsb-bp-label-chip">{__('Divider', 'xcodesol-page-builder')}</div>
					<div className="xsb-divider" style={lineStyle}>{settings.label && <span style={{ position: 'relative', top: '-0.75em', padding: '0 10px', color: settings.label_color || '#64748b', background: settings.label_background || '#fff', fontSize: `${ Number( settings.label_size ) || 14 }px` }}>{settings.label}</span>}</div>
				</div>
			);
			}
		case 'xcopb/gb-breadcrumb':
		case 'xcosb/gb-breadcrumb': {
			const wrapCss = { ...textInlineCss(settings), textAlign: settings.align || 'left', fontSize: settings.font_size ? `${ Number( settings.font_size ) }px` : undefined, ...marginInlineCss( settings ) };
			const linkCss = settings.link_color ? { color: settings.link_color } : {};
			return (
				<div className="xsb-bp gb-breadcrumb">
					<div className="xsb-bp-label-chip">{__('Breadcrumb', 'xcodesol-page-builder')}</div>
					<nav className="xsb-breadcrumb" style={wrapCss}>
						{settings.show_home !== false && <><a href="#" style={linkCss}>{settings.home_label || __('Home', 'xcodesol-page-builder')}</a>{' '}</>}
						{settings.show_home !== false && settings.show_current !== false && <><span className="xsb-bc-sep">{settings.separator || '/'}</span>{' '}</>}
						{settings.show_current !== false && SAMPLE.archiveTitle}
					</nav>
				</div>
			);
		}
		case 'xcopb/gb-text':
		case 'xcosb/gb-text': {
			const textStyle = {
				textAlign: settings.align || 'left',
			};
			if (settings.color) {
				textStyle.color = settings.color;
			}
			if (settings.font_size !== undefined && settings.font_size !== '') {
				textStyle.fontSize = `${Number(settings.font_size)}px`;
			}
			if (settings.font_weight) {
				textStyle.fontWeight = settings.font_weight;
			}
			if (settings.font_family) { textStyle.fontFamily = settings.font_family; }
			if (settings.text_transform && settings.text_transform !== 'none') { textStyle.textTransform = settings.text_transform; }
			if (Number( settings.text_columns ) > 1) { textStyle.columns = Number( settings.text_columns ); textStyle.columnGap = `${ Number( settings.column_gap ) || 24 }px`; }
			if (Number.isFinite( Number( settings.paragraph_spacing ) )) { textStyle['--xsb-text-paragraph-gap'] = `${ Number( settings.paragraph_spacing ) }px`; }
			if (settings.blockquote_background) { textStyle.background = settings.blockquote_background; }
			if (settings.blockquote_color) { textStyle.borderLeft = `${ Math.max( 2, Number( settings.border_width ) || 0 ) }px solid ${ settings.blockquote_color }`; }
			if (settings.line_height !== undefined && settings.line_height !== '') {
				textStyle.lineHeight = settings.line_height;
			}
			if (settings.letter_spacing !== undefined && settings.letter_spacing !== '') {
				textStyle.letterSpacing = `${Number(settings.letter_spacing)}px`;
			}
			const textBorderWidth = Number(settings.border_width) || 0;
			if (textBorderWidth > 0) {
				textStyle.border = `${textBorderWidth}px ${settings.border_style || 'solid'} ${settings.border_color || '#000000'}`;
			}
			if (Number(settings.border_radius) > 0) {
				textStyle.borderRadius = `${Number(settings.border_radius)}px`;
			}
			const textAnim = settings.animation || 'none';
			if (textAnim !== 'none') {
				textStyle.animation = `xsb-motion-${textAnim} ${Number(settings.animation_duration) || 600}ms ${settings.animation_easing || 'ease'} ${settings.animation_repeat || '1'} both`;
				textStyle.animationDelay = `${Number(settings.animation_delay) || 0}ms`;
			}
			['top', 'right', 'bottom', 'left'].forEach((side) => {
				const marginValue = settings[`margin_${side}`];
				if (marginValue !== undefined && marginValue !== '') {
					textStyle[`margin${side[0].toUpperCase()}${side.slice(1)}`] = `${Number(marginValue)}px`;
				}
			});
			return (
				<div className="xsb-bp gb-text">
					<div className="xsb-bp-label-chip">{__('Text', 'xcodesol-page-builder')}</div>
					<div className="xsb-bp-text" style={textStyle}>
						{settings.drop_cap ? <span className="xsb-text-drop-cap">{( settings.content || __('Add your text here.', 'xcodesol-page-builder') ).charAt( 0 )}</span> : null}{settings.content || __('Add your text here.', 'xcodesol-page-builder')}
					</div>
				</div>
			);
		}
		case 'xcosb/woo-categories': {
			let defaultCols = 4;
			if (device === 'tablet') defaultCols = 2;
			if (device === 'mobile') defaultCols = 1;
			const cols = Math.min(6, Math.max(1, Number(settings.columns) || defaultCols));
			const names = ['Accessories', 'Apparel', 'Bags', 'Shoes'];
			const wrapCss = textInlineCss(settings);
			const titleCss = prefixedHeadingCss(settings, 'title');
			const title = settings.title || '';
			const itemCss = chromeInlineCss(settings, 'item');
			const itemTextCss = prefixedTextCss(settings, 'item');
			const countCss = settings.item_count_color ? { color: settings.item_count_color } : {};
			const renderTitle = () => (
				title !== '' && <div className="xsb-woo-block-title xsb-woo-categories-title" style={titleCss}>{title}</div>
			);

			return settings.display === 'list' ? (
				<div className="xsb-bp woo-categories">
					<div className="xsb-bp-label-chip">{__('Product Categories', 'xcodesol-page-builder')}</div>
					<div style={wrapCss}>
						{renderTitle()}
						<ul className="xsb-preview-cats xsb-preview-cats--list">
							{names.map((name, i) => (
								<li key={name}>
									<a href="#" style={itemTextCss}>{name}</a>
									{settings.show_count && <span className="xsb-preview-count" style={countCss}>{(i + 1) * 4}</span>}
								</li>
							))}
						</ul>
					</div>
				</div>
			) : (
				<div className="xsb-bp woo-categories">
					<div className="xsb-bp-label-chip">{__('Product Categories', 'xcodesol-page-builder')}</div>
					<div style={wrapCss}>
						{renderTitle()}
						<div className="xsb-preview-cats" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
							{names.map((name, i) => (
								<a key={name} className="xsb-preview-cat" href="#" style={itemCss}>
									<span className="xsb-preview-cat-img" style={{ background: ['#dbeafe', '#fee2e2', '#dcfce7', '#fef9c3'][i] }} />
									<span className="xsb-preview-cat-name" style={itemTextCss}>{name}</span>
									{settings.show_count && <span className="xsb-preview-count" style={countCss}>{(i + 1) * 4}</span>}
								</a>
							))}
						</div>
					</div>
				</div>
			);
		}
		case 'xcosb/woo-tags': {
			const tags = ['New', 'Sale', 'Summer', 'Accessories', 'Best sellers'];
			const wrapCss = textInlineCss(settings);
			const titleCss = prefixedHeadingCss(settings, 'title');
			const title = settings.title || '';
			const itemCss = chromeInlineCss(settings, 'item');
			const itemTextCss = prefixedTextCss(settings, 'item');
			return (
				<div className="xsb-bp woo-tags">
					<div className="xsb-bp-label-chip">{__('Product Tags', 'xcodesol-page-builder')}</div>
					<div style={wrapCss}>
						{title !== '' && <div className="xsb-woo-block-title xsb-woo-tags-title" style={titleCss}>{title}</div>}
						<div className="xsb-preview-tags">
							{tags.map((tag, i) => (
								<a
									key={tag}
									href="#"
									style={{
										...itemCss,
										...itemTextCss,
										...(settings.display === 'cloud' ? { fontSize: `${13 + (i % 3) * 3}px` } : {}),
									}}
								>
									{tag}
								</a>
							))}
						</div>
					</div>
				</div>
			);
		}
		case 'xcosb/woo-attributes': {
			const attribute = settings.attribute || 'pa_color';
			const terms = ['Red', 'Blue', 'Green', 'Black'];
			const wrapCss = textInlineCss(settings);
			const titleCss = prefixedHeadingCss(settings, 'title');
			const title = settings.title || '';
			const itemCss = chromeInlineCss(settings, 'item');
			const itemTextCss = prefixedTextCss(settings, 'item');
			return (
				<div className="xsb-bp woo-attributes">
					<div className="xsb-bp-label-chip">{__('Product Attributes', 'xcodesol-page-builder')}</div>
					<div style={wrapCss}>
						{title !== '' && <div className="xsb-woo-block-title xsb-woo-attributes-title" style={titleCss}>{title}</div>}
						<div className="xsb-preview-attributes">
							{title === '' && <span className="xsb-preview-attr-name" style={itemTextCss}>{attribute}:</span>}
							{terms.map((term) => (
								<a key={term} href="#" style={{ ...itemCss, ...itemTextCss }}>{term}</a>
							))}
						</div>
					</div>
				</div>
			);
		}
		case 'xcosb/woo-search': {
			const wrapCss = textInlineCss(settings);
			const inputCss = {};
			if (settings.field_bg_color) {
				inputCss.background = settings.field_bg_color;
			}
			if (settings.field_color) {
				inputCss.color = settings.field_color;
			}
			const fieldWidth = Number(settings.field_border_width) || 0;
			if (settings.field_border_color || fieldWidth > 0) {
				inputCss.border = `${fieldWidth}px solid ${settings.field_border_color || '#d5dae2'}`;
			}
			if (Number(settings.field_radius) > 0) {
				inputCss.borderRadius = `${Number(settings.field_radius)}px`;
			}
			if (Number(settings.field_height) > 0) {
				inputCss.height = `${Number(settings.field_height)}px`;
			}
			if (settings.field_font_size !== undefined && settings.field_font_size !== '') {
				inputCss.fontSize = `${Number(settings.field_font_size)}px`;
			}
			const buttonCss = buttonInlineCss(settings, 'button');
			return (
				<div className="xsb-bp woo-search">
					<div className="xsb-bp-label-chip">{__('Product Search', 'xcodesol-page-builder')}</div>
					<div className="xsb-preview-search" style={wrapCss}>
						<input type="search" placeholder={settings.placeholder || __('Search products…', 'xcodesol-page-builder')} readOnly style={inputCss} />
						{settings.show_button !== false && (
							<button type="button" style={buttonCss}>{settings.button_text || __('Search', 'xcodesol-page-builder')}</button>
						)}
					</div>
				</div>
			);
		}
		case 'xcopb/gb-text-widget':
		case 'xcosb/gb-text-widget': {
			const content = settings.content || __('Text and links. This widget behaves like the classic WordPress Text widget.', 'xcodesol-page-builder');
			const titleCss = prefixedHeadingCss(settings, 'title');
			const contentCss = typographyOnlyInlineCss(settings);
			return (
				<div className="xsb-bp gb-text-widget" style={marginInlineCss(settings)}>
					<div className="xsb-bp-label-chip">{__('Text Widget', 'xcodesol-page-builder')}</div>
					{settings.title && <div className="xsb-bp-text-widget-title" style={titleCss}>{settings.title}</div>}
					<div className="xsb-bp-text" style={contentCss} dangerouslySetInnerHTML={{ __html: content }} />
				</div>
			);
		}
		case 'xcosb/cd-image': {
			const wrapCss = { ...marginInlineCss(settings) };
			if (settings.align && settings.align !== 'left') {
				wrapCss.textAlign = settings.align;
			}
			const boxCss = chromeInlineCss(settings, 'img');
			boxCss.position = 'relative';
			boxCss.overflow = 'hidden';
			const isBand = Number(settings.height) > 0;
			if (isBand) {
				// Match the frontend: the saved height caps a 4:3 band, so narrow
				// cards keep proportions instead of a tall strip.
				boxCss.aspectRatio = '4 / 3';
				boxCss.height = 'auto';
				boxCss.maxHeight = `${Number(settings.height)}px`;
			}
			if (Number(settings.max_width) > 0) {
				boxCss.maxWidth = `${Number(settings.max_width)}px`;
				boxCss.width = '100%';
			}
			// Optional explicit width override (style popover "Width" preset).
			const imgWidth = settings.width;
			if (imgWidth && imgWidth !== 'auto' && imgWidth !== 'full' && Number(imgWidth) > 0) {
				boxCss.width = `${Number(imgWidth)}%`;
				if (settings.align === 'center') {
					boxCss.marginLeft = 'auto';
					boxCss.marginRight = 'auto';
				} else if (settings.align === 'right') {
					boxCss.marginLeft = 'auto';
				}
			}
			let overlayEl = null;
			if (settings.overlay) {
				const alpha = Math.min(100, Math.max(0, Number(settings.overlay_opacity) ?? 45)) / 100;
				const color = settings.overlay_color || '#000000';
				const overlayCss = {
					position: 'absolute',
					inset: '0',
					zIndex: 1,
					pointerEvents: 'none',
				};
				if (settings.overlay_direction && settings.overlay_direction !== 'cover') {
					overlayCss.background = `linear-gradient(to top, ${hexToRgba(color, alpha)} 0%, transparent 60%)`;
				} else {
					overlayCss.backgroundColor = color;
					overlayCss.opacity = alpha;
				}
				overlayEl = <span className="xsb-card-image-overlay" style={overlayCss} aria-hidden="true" />;
			}
			return (
				<div className="xsb-bp cd-image" style={wrapCss}>
					<div className="xsb-bp-label-chip">{__('Card Image', 'xcodesol-page-builder')}</div>
					<div className={`xsb-prod-image xsb-card-image-link${isBand ? ' xsb-card-image--band' : ''}`} style={boxCss}>
						<span className="dashicons dashicons-format-image" aria-hidden="true" />
						{overlayEl}
					</div>
				</div>
			);
		}
		case 'xcosb/cd-badge': {
			const css = { ...chromeInlineCss(settings, 'badge'), ...textInlineCss(settings) };
			const badgeStyle = settings.style === 'ribbon' ? 'ribbon' : 'simple';
			const badgePosition = settings.position || 'inline';
			const classes = ['xsb-card-badge', `xsb-card-badge--${badgeStyle}`];
			// Corner placements overlay the card root on the live page, so the
			// mock mirrors that: the badge wrapper stays static (no own
			// positioning anchor) — the block chrome collapses via the
			// is-badge-float modifier and the badge anchors to the zone body
			// (the card), exactly like the public stylesheet.
			if (badgePosition !== 'inline') {
				classes.push('xsb-card-badge--overlay', `xsb-card-badge--${badgePosition}`);
			}
			if (badgeStyle === 'ribbon' && !css.background) {
				css.background = '#e11d48';
			}
			return (
				<div className="xsb-bp cd-badge">
					<span className={classes.join(' ')} style={css}>{settings.text || __('Sale!', 'xcodesol-page-builder')}</span>
				</div>
			);
		}
		case 'xcosb/cd-title': {
			const tag = settings.tag || 'h2';
			const css = textInlineCss(settings, true);
			return (
				<div className="xsb-bp cd-title">
					<div className="xsb-bp-label-chip">{__('Card Title', 'xcodesol-page-builder')}</div>
					{createElement(tag, { className: 'xsb-card-title', style: css }, settings.link === false ? SAMPLE.name : <a href="#">{SAMPLE.name}</a>)}
				</div>
			);
		}
		case 'xcosb/cd-price': {
			const css = textInlineCss(settings);
			return (
				<div className="xsb-bp cd-price">
					<div className="xsb-card-price" style={css}>
						<del>{SAMPLE.regular}</del>
						<ins>{SAMPLE.price}</ins>
					</div>
				</div>
			);
		}
		case 'xcosb/cd-rating': {
			const css = textInlineCss(settings);
			return (
				<div className="xsb-bp cd-rating">
					<div className="xsb-prod-rating" style={css}>
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-filled" aria-hidden="true" />
						<span className="dashicons dashicons-star-empty" aria-hidden="true" />
					</div>
				</div>
			);
		}
		case 'xcosb/cd-excerpt': {
			const css = textInlineCss(settings);
			return (
				<div className="xsb-bp cd-excerpt">
					<div className="xsb-card-excerpt" style={css}>{SAMPLE.excerpt}</div>
				</div>
			);
		}
		case 'xcosb/cd-add-to-cart': {
			const css = { ...buttonInlineCss(settings, 'button'), ...textInlineCss(settings) };
			return (
				<div className="xsb-bp cd-add-to-cart">
					<a className="button" href="#" style={css}>{__('Add to cart', 'xcodesol-page-builder')}</a>
				</div>
			);
		}
		case 'xcosb/cd-categories':
		case 'xcosb/cd-tags': {
			const chipCss = { ...chromeInlineCss(settings, 'item'), ...prefixedTextCss(settings, 'item'), ...textInlineCss(settings) };
			const isCats = block.type === 'xcosb/cd-categories';
			return (
				<div className="xsb-bp cd-chips">
					<div className="xsb-bp-label-chip">{isCats ? __('Card Categories', 'xcodesol-page-builder') : __('Card Tags', 'xcodesol-page-builder')}</div>
					<div className="xsb-card-chips">
						<span className="xsb-card-chip" style={chipCss}>{isCats ? __('Category', 'xcodesol-page-builder') : __('Tag', 'xcodesol-page-builder')}</span>
						<span className="xsb-card-chip" style={chipCss}>{isCats ? __('Category 2', 'xcodesol-page-builder') : __('Tag 2', 'xcodesol-page-builder')}</span>
					</div>
				</div>
			);
		}
		case 'xcosb/cd-stock': {
			const css = textInlineCss(settings);
			return (
				<div className="xsb-bp cd-stock">
					<div className="xsb-card-stock xsb-card-stock--instock" style={css}>{__('In stock', 'xcodesol-page-builder')}</div>
				</div>
			);
		}
		case 'xcosb/cd-sku': {
			const css = textInlineCss(settings);
			return (
				<div className="xsb-bp cd-sku">
					<div className="xsb-card-sku" style={css}>{settings.prefix || __('SKU: ', 'xcodesol-page-builder')}WTB-001</div>
				</div>
			);
		}
		case 'xcosb/cc-cart':
		case 'xcosb/cc-cart-items':
		case 'xcosb/cc-cart-totals':
		case 'xcosb/cc-checkout':
		case 'xcosb/cc-checkout-contact':
		case 'xcosb/cc-checkout-billing':
		case 'xcosb/cc-checkout-shipping':
		case 'xcosb/cc-checkout-notes':
		case 'xcosb/cc-checkout-totals':
		case 'xcosb/cc-checkout-payment': {
			const isCart = block.type === 'xcosb/cc-cart';
			const isItems = block.type === 'xcosb/cc-cart-items';
			const isTotals = block.type === 'xcosb/cc-cart-totals';
			const isContact = block.type === 'xcosb/cc-checkout-contact';
			const isBilling = block.type === 'xcosb/cc-checkout-billing';
			const isShipping = block.type === 'xcosb/cc-checkout-shipping';
			const isNotes = block.type === 'xcosb/cc-checkout-notes';
			const isCKTotals = block.type === 'xcosb/cc-checkout-totals';
			const isPayment = block.type === 'xcosb/cc-checkout-payment';
			const boxCss = {};
			if (settings.background) {
				boxCss.background = settings.background;
			}
			const bw = Number(settings.border_width) || 0;
			if (settings.border_color || bw > 0) {
				boxCss.border = `${bw}px ${settings.border_style || 'solid'} ${settings.border_color || '#000000'}`;
			}
			if (Number(settings.border_radius) > 0) {
				boxCss.borderRadius = `${Number(settings.border_radius)}px`;
			}
			const shadow = SHADOW_VALUES[settings.shadow || 'none'];
			if (shadow) {
				boxCss.boxShadow = shadow;
			}
			const padTop = Number(settings.padding_top) || 0;
			const padRight = Number(settings.padding_right) || 0;
			const padBottom = Number(settings.padding_bottom) || 0;
			const padLeft = Number(settings.padding_left) || 0;
			if (padTop || padRight || padBottom || padLeft) {
				boxCss.padding = `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`;
			}
			if (Number(settings.max_width) > 0) {
				boxCss.maxWidth = `${Number(settings.max_width)}px`;
				boxCss.width = '100%';
			}
			if (settings.align === 'center') {
				boxCss.marginLeft = 'auto';
				boxCss.marginRight = 'auto';
			} else if (settings.align === 'right') {
				boxCss.marginLeft = 'auto';
			}

			const sectionTitle = settings.title || '';

			return (
				<div className="xsb-bp cc-box" style={marginInlineCss(settings)}>
					<div className="xsb-cc-preview" style={boxCss}>
						<div className="xsb-bp-label-chip">
							{isCart ? __('Cart (WooCommerce)', 'xcodesol-page-builder') :
							isItems ? __('Cart Items (WooCommerce)', 'xcodesol-page-builder') :
							isTotals ? __('Cart Totals (WooCommerce)', 'xcodesol-page-builder') :
							isContact ? __('Contact Info', 'xcodesol-page-builder') :
							isBilling ? __('Billing Address', 'xcodesol-page-builder') :
							isShipping ? __('Shipping Address', 'xcodesol-page-builder') :
							isNotes ? __('Order Notes', 'xcodesol-page-builder') :
							isCKTotals ? __('Order Review & Totals', 'xcodesol-page-builder') :
							isPayment ? __('Payment & Place Order', 'xcodesol-page-builder') :
							__('Checkout (WooCommerce)', 'xcodesol-page-builder')}
						</div>

						{/* 1. Cart Full Box */}
						{isCart && (
							<div className="xsb-cc-cart-mock-grid">
								<div className="xsb-cc-cart-main">
									<div className="xsb-cc-table-mock">
										<div className="xsb-cc-th-row">
											<span className="xsb-cc-col-prod">{__('Product', 'xcodesol-page-builder')}</span>
											<span className="xsb-cc-col-price">{__('Price', 'xcodesol-page-builder')}</span>
											<span className="xsb-cc-col-qty">{__('Quantity', 'xcodesol-page-builder')}</span>
											<span className="xsb-cc-col-sub">{__('Subtotal', 'xcodesol-page-builder')}</span>
										</div>
										<div className="xsb-cc-tr-row">
											<div className="xsb-cc-item-info">
												<span className="xsb-cc-del-btn" title="Remove">&times;</span>
												<div className="xsb-cc-item-thumb">
													<span className="dashicons dashicons-format-image" aria-hidden="true" />
												</div>
												<div className="xsb-cc-item-meta">
													<span className="xsb-cc-item-title">{SAMPLE.name}</span>
													<span className="xsb-cc-item-sub">Size: L • Space Grey</span>
												</div>
											</div>
											<div className="xsb-cc-col-price">{SAMPLE.price}</div>
											<div className="xsb-cc-col-qty">
												<div className="xsb-cc-qty-stepper">
													<button type="button">&minus;</button>
													<input type="text" readOnly value="1" />
													<button type="button">+</button>
												</div>
											</div>
											<div className="xsb-cc-col-sub font-bold">{SAMPLE.price}</div>
										</div>
										<div className="xsb-cc-actions-row">
											<div className="xsb-cc-coupon-box">
												<input type="text" placeholder={__('Coupon code', 'xcodesol-page-builder')} readOnly />
												<button type="button" className="xsb-cc-btn-sec">{__('Apply coupon', 'xcodesol-page-builder')}</button>
											</div>
											<button type="button" className="xsb-cc-btn-dark">{__('Update cart', 'xcodesol-page-builder')}</button>
										</div>
									</div>
								</div>
								<div className="xsb-cc-cart-side">
									<div className="xsb-cc-totals-card">
										<h4 className="xsb-cc-totals-heading">{__('Cart totals', 'xcodesol-page-builder')}</h4>
										<div className="xsb-cc-totals-line">
											<span>{__('Subtotal', 'xcodesol-page-builder')}</span>
											<strong>{SAMPLE.price}</strong>
										</div>
										<div className="xsb-cc-totals-line xsb-cc-shipping-line">
											<span>{__('Shipping', 'xcodesol-page-builder')}</span>
											<div className="xsb-cc-shipping-opts">
												<label><input type="radio" checked readOnly name="c_ship" /> {__('Free shipping', 'xcodesol-page-builder')}</label>
												<label><input type="radio" readOnly name="c_ship" /> {__('Express: $15.00', 'xcodesol-page-builder')}</label>
											</div>
										</div>
										<div className="xsb-cc-totals-line xsb-cc-grand-total">
											<span>{__('Total', 'xcodesol-page-builder')}</span>
											<span className="xsb-cc-total-amt">{SAMPLE.price}</span>
										</div>
										<button type="button" className="xsb-cc-btn-primary">{__('Proceed to checkout', 'xcodesol-page-builder')} &rarr;</button>
										<div className="xsb-cc-trust-pill">
											<span>🔒 256-Bit SSL Encrypted Checkout</span>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 2. Cart Items Widget Only */}
						{isItems && (
							<div className="xsb-cc-table-mock">
								<div className="xsb-cc-th-row">
									<span className="xsb-cc-col-prod">{__('Product', 'xcodesol-page-builder')}</span>
									<span className="xsb-cc-col-price">{__('Price', 'xcodesol-page-builder')}</span>
									<span className="xsb-cc-col-qty">{__('Quantity', 'xcodesol-page-builder')}</span>
									<span className="xsb-cc-col-sub">{__('Subtotal', 'xcodesol-page-builder')}</span>
								</div>
								<div className="xsb-cc-tr-row">
									<div className="xsb-cc-item-info">
										<span className="xsb-cc-del-btn" title="Remove">&times;</span>
										<div className="xsb-cc-item-thumb">
											<span className="dashicons dashicons-format-image" aria-hidden="true" />
										</div>
										<div className="xsb-cc-item-meta">
											<span className="xsb-cc-item-title">{SAMPLE.name}</span>
											<span className="xsb-cc-item-sub">Color: Classic Black</span>
										</div>
									</div>
									<div className="xsb-cc-col-price">{SAMPLE.price}</div>
									<div className="xsb-cc-col-qty">
										<div className="xsb-cc-qty-stepper">
											<button type="button">&minus;</button>
											<input type="text" readOnly value="1" />
											<button type="button">+</button>
										</div>
									</div>
									<div className="xsb-cc-col-sub font-bold">{SAMPLE.price}</div>
								</div>
								<div className="xsb-cc-actions-row">
									<div className="xsb-cc-coupon-box">
										<input type="text" placeholder={__('Coupon code', 'xcodesol-page-builder')} readOnly />
										<button type="button" className="xsb-cc-btn-sec">{__('Apply coupon', 'xcodesol-page-builder')}</button>
									</div>
									<button type="button" className="xsb-cc-btn-dark">{__('Update cart', 'xcodesol-page-builder')}</button>
								</div>
							</div>
						)}

						{/* 3. Cart Totals Widget Only */}
						{isTotals && (
							<div className="xsb-cc-totals-card">
								<h4 className="xsb-cc-totals-heading">{__('Cart totals', 'xcodesol-page-builder')}</h4>
								<div className="xsb-cc-totals-line">
									<span>{__('Subtotal', 'xcodesol-page-builder')}</span>
									<strong>{SAMPLE.price}</strong>
								</div>
								<div className="xsb-cc-totals-line xsb-cc-shipping-line">
									<span>{__('Shipping', 'xcodesol-page-builder')}</span>
									<div className="xsb-cc-shipping-opts">
										<label><input type="radio" checked readOnly name="t_ship" /> {__('Free shipping', 'xcodesol-page-builder')}</label>
										<label><input type="radio" readOnly name="t_ship" /> {__('Express: $15.00', 'xcodesol-page-builder')}</label>
									</div>
								</div>
								<div className="xsb-cc-totals-line xsb-cc-grand-total">
									<span>{__('Total', 'xcodesol-page-builder')}</span>
									<span className="xsb-cc-total-amt">{SAMPLE.price}</span>
								</div>
								<button type="button" className="xsb-cc-btn-primary">{__('Proceed to checkout', 'xcodesol-page-builder')} &rarr;</button>
								<div className="xsb-cc-trust-pill">
									<span>🔒 256-Bit SSL Encrypted Checkout</span>
								</div>
							</div>
						)}

						{/* 4. Checkout Contact Info */}
						{isContact && (
							<div className="xsb-cc-checkout-section-mock">
								{sectionTitle ? <h3 className="xsb-checkout-section-title">{sectionTitle}</h3> : <h3 className="xsb-checkout-section-title">{__('1. Contact Information', 'xcodesol-page-builder')}</h3>}
								<div className="xsb-cc-form-grid">
									<div className="xsb-cc-field xsb-cc-field--full">
										<label>{__('Email address', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<div className="xsb-cc-input-wrap">
											<span className="dashicons dashicons-email" aria-hidden="true" />
											<input type="text" placeholder="alex.smith@example.com" readOnly />
										</div>
									</div>
									<div className="xsb-cc-field xsb-cc-field--full">
										<label>{__('Phone number', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<div className="xsb-cc-input-wrap">
											<span className="dashicons dashicons-phone" aria-hidden="true" />
											<input type="text" placeholder="+1 (555) 234-5678" readOnly />
										</div>
									</div>
									<div className="xsb-cc-checkbox-row">
										<label><input type="checkbox" checked readOnly /> {__('Email me with news and exclusive offers', 'xcodesol-page-builder')}</label>
									</div>
								</div>
							</div>
						)}

						{/* 5. Checkout Billing Address */}
						{isBilling && (
							<div className="xsb-cc-checkout-section-mock">
								{sectionTitle ? <h3 className="xsb-checkout-section-title">{sectionTitle}</h3> : <h3 className="xsb-checkout-section-title">{__('2. Billing Address', 'xcodesol-page-builder')}</h3>}
								<div className="xsb-cc-form-grid">
									<div className="xsb-cc-field xsb-cc-field--half">
										<label>{__('First name', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<input type="text" placeholder="Alex" readOnly />
									</div>
									<div className="xsb-cc-field xsb-cc-field--half">
										<label>{__('Last name', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<input type="text" placeholder="Smith" readOnly />
									</div>
									<div className="xsb-cc-field xsb-cc-field--full">
										<label>{__('Company name (optional)', 'xcodesol-page-builder')}</label>
										<input type="text" placeholder="Acme Studio" readOnly />
									</div>
									<div className="xsb-cc-field xsb-cc-field--full">
										<label>{__('Country / Region', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<select disabled><option>United States (US)</option></select>
									</div>
									<div className="xsb-cc-field xsb-cc-field--full">
										<label>{__('Street address', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<input type="text" placeholder="House number and street name" readOnly />
									</div>
									<div className="xsb-cc-field xsb-cc-field--third">
										<label>{__('Town / City', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<input type="text" placeholder="New York" readOnly />
									</div>
									<div className="xsb-cc-field xsb-cc-field--third">
										<label>{__('State', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<select disabled><option>New York</option></select>
									</div>
									<div className="xsb-cc-field xsb-cc-field--third">
										<label>{__('ZIP Code', 'xcodesol-page-builder')} <span className="req">*</span></label>
										<input type="text" placeholder="10001" readOnly />
									</div>
								</div>
							</div>
						)}

						{/* 6. Checkout Shipping Address */}
						{isShipping && (
							<div className="xsb-cc-checkout-section-mock">
								{sectionTitle && <h3 className="xsb-checkout-section-title">{sectionTitle}</h3>}
								<div className="xsb-cc-shipping-toggle-card">
									<label><input type="checkbox" readOnly /> {__('Ship to a different address?', 'xcodesol-page-builder')}</label>
									<span className="xsb-cc-hint">{__('Check if delivery destination differs from billing.', 'xcodesol-page-builder')}</span>
								</div>
							</div>
						)}

						{/* 7. Checkout Order Notes */}
						{isNotes && (
							<div className="xsb-cc-checkout-section-mock">
								{sectionTitle ? <h3 className="xsb-checkout-section-title">{sectionTitle}</h3> : <h3 className="xsb-checkout-section-title">{__('Additional Information', 'xcodesol-page-builder')}</h3>}
								<div className="xsb-cc-field xsb-cc-field--full">
									<label>{__('Order notes (optional)', 'xcodesol-page-builder')}</label>
									<textarea rows="3" placeholder={__('Notes about your order, e.g. special delivery instructions.', 'xcodesol-page-builder')} readOnly />
								</div>
							</div>
						)}

						{/* 8. Checkout Order Review & Totals */}
						{isCKTotals && (
							<div className="xsb-cc-checkout-totals-card">
								{sectionTitle ? <h3 className="xsb-checkout-section-title">{sectionTitle}</h3> : <h3 className="xsb-checkout-section-title">{__('Order Summary (1)', 'xcodesol-page-builder')}</h3>}
								<div className="xsb-cc-review-items">
									<div className="xsb-cc-review-item">
										<div className="xsb-cc-review-img-wrap">
											<div className="xsb-cc-review-thumb">
												<span className="dashicons dashicons-format-image" aria-hidden="true" />
											</div>
											<span className="xsb-cc-review-qty-badge">1</span>
										</div>
										<div className="xsb-cc-review-meta">
											<span className="xsb-cc-review-title">{SAMPLE.name}</span>
											<span className="xsb-cc-review-sub">Space Grey / Edition 1</span>
										</div>
										<span className="xsb-cc-review-price">{SAMPLE.price}</span>
									</div>
								</div>
								<div className="xsb-cc-coupon-apply-row">
									<input type="text" placeholder={__('Discount code', 'xcodesol-page-builder')} readOnly />
									<button type="button">{__('Apply', 'xcodesol-page-builder')}</button>
								</div>
								<div className="xsb-cc-totals-breakdown">
									<div className="xsb-cc-breakdown-row">
										<span>{__('Subtotal', 'xcodesol-page-builder')}</span>
										<strong>{SAMPLE.price}</strong>
									</div>
									<div className="xsb-cc-breakdown-row">
										<span>{__('Shipping', 'xcodesol-page-builder')}</span>
										<span className="text-emerald font-semibold">{__('Free', 'xcodesol-page-builder')}</span>
									</div>
									<div className="xsb-cc-breakdown-row">
										<span>{__('Estimated Tax', 'xcodesol-page-builder')}</span>
										<strong>$0.00</strong>
									</div>
									<div className="xsb-cc-breakdown-row xsb-cc-grand-total">
										<span>{__('Total', 'xcodesol-page-builder')}</span>
										<span className="xsb-cc-total-amt">{SAMPLE.price}</span>
									</div>
								</div>
								<div className="xsb-cc-guarantee-badge">
									<span>🛡️ 30-Day Money-Back Guarantee</span>
								</div>
							</div>
						)}

						{/* 9. Checkout Payment */}
						{isPayment && (
							<div className="xsb-cc-checkout-payment-mock">
								{sectionTitle ? <h3 className="xsb-checkout-section-title">{sectionTitle}</h3> : <h3 className="xsb-checkout-section-title">{__('Payment Method', 'xcodesol-page-builder')}</h3>}
								<div className="xsb-cc-payment-methods">
									<div className="xsb-cc-pay-method is-active">
										<div className="xsb-cc-pay-head">
											<label><input type="radio" checked readOnly name="p_meth" /> <strong>{__('Credit / Debit Card', 'xcodesol-page-builder')}</strong></label>
											<span className="xsb-cc-pay-icons">💳 💳 💳</span>
										</div>
										<div className="xsb-cc-pay-body">
											<div className="xsb-cc-input-wrap">
												<input type="text" placeholder="Card number •••• •••• •••• 4242" readOnly />
											</div>
											<div className="xsb-cc-form-grid" style={{ marginTop: 8 }}>
												<div className="xsb-cc-field xsb-cc-field--half">
													<input type="text" placeholder="MM / YY" readOnly />
												</div>
												<div className="xsb-cc-field xsb-cc-field--half">
													<input type="text" placeholder="CVC" readOnly />
												</div>
											</div>
										</div>
									</div>
									<div className="xsb-cc-pay-method">
										<div className="xsb-cc-pay-head">
											<label><input type="radio" readOnly name="p_meth" /> <strong>PayPal</strong></label>
											<span className="xsb-cc-pay-icons">🅿️</span>
										</div>
									</div>
									<div className="xsb-cc-pay-method">
										<div className="xsb-cc-pay-head">
											<label><input type="radio" readOnly name="p_meth" /> <strong>{__('Cash on Delivery', 'xcodesol-page-builder')}</strong></label>
										</div>
									</div>
								</div>
								<div className="xsb-cc-terms-row">
									<label><input type="checkbox" checked readOnly /> {__('I have read and agree to the website terms and conditions', 'xcodesol-page-builder')}</label>
								</div>
								<button type="button" className="xsb-cc-btn-primary xsb-cc-btn-place-order">
									🔒 {sprintf(__('Place Order (%s)', 'xcodesol-page-builder'), SAMPLE.price)}
								</button>
							</div>
						)}

						{/* 10. Whole Classic Checkout Fallback */}
						{!isCart && !isItems && !isTotals && !isContact && !isBilling && !isShipping && !isNotes && !isCKTotals && !isPayment && (
							<div className="xsb-cc-classic-checkout-mock">
								<div className="xsb-cc-classic-col">
									<h4 className="xsb-checkout-section-title">{__('Billing Details', 'xcodesol-page-builder')}</h4>
									<div className="xsb-cc-form-grid">
										<div className="xsb-cc-field xsb-cc-field--half"><input type="text" placeholder="First name" readOnly /></div>
										<div className="xsb-cc-field xsb-cc-field--half"><input type="text" placeholder="Last name" readOnly /></div>
										<div className="xsb-cc-field xsb-cc-field--full"><input type="text" placeholder="Street address" readOnly /></div>
										<div className="xsb-cc-field xsb-cc-field--full"><input type="text" placeholder="Email address" readOnly /></div>
									</div>
								</div>
								<div className="xsb-cc-classic-col">
									<h4 className="xsb-checkout-section-title">{__('Your Order', 'xcodesol-page-builder')}</h4>
									<div className="xsb-cc-totals-breakdown">
										<div className="xsb-cc-breakdown-row"><span>{SAMPLE.name} × 1</span><strong>{SAMPLE.price}</strong></div>
										<div className="xsb-cc-breakdown-row"><span>{__('Shipping', 'xcodesol-page-builder')}</span><strong>{__('Free', 'xcodesol-page-builder')}</strong></div>
										<div className="xsb-cc-breakdown-row xsb-cc-grand-total"><span>{__('Total', 'xcodesol-page-builder')}</span><span className="xsb-cc-total-amt">{SAMPLE.price}</span></div>
									</div>
									<button type="button" className="xsb-cc-btn-primary xsb-cc-btn-place-order" style={{ marginTop: 14 }}>
										🔒 {__('Place order', 'xcodesol-page-builder')}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			);
		}
		default:
			return (
				<div className="xsb-bp default">
					<div className="xsb-bp-label-chip">{meta.label}</div>
					<p className="xsb-bp-text">{meta.label}</p>
				</div>
			);
	}
}

/**
 * Thin insertion line shown at the exact spot a drag would land.
 */
function DropGuideLine() {
	return <div className="xsb-drop-guide-line" aria-hidden="true" />;
}

/**
 * Text-only drop hint. It always sits where the next widget would land:
 * alone in the middle of an empty drop target, and (compact) directly
 * under the last widget once the target already has children.
 */
function DropHint({ compact = false, nested = false, onClick }) {
	return (
		<button
			type="button"
			className={ `xsb-drop-hint${ compact ? ' xsb-drop-hint--end' : '' }${ nested ? ' xsb-drop-hint--nested' : '' }` }
			onClick={ ( event ) => {
				event.stopPropagation();
				if ( onClick ) onClick( event );
			} }
			aria-label={ __( 'Add a widget here', 'xcodesol-page-builder' ) }
		>
			<span className="xsb-drop-hint-plus" aria-hidden="true"><IconPlus width={ 14 } height={ 14 } /></span>
			<span className="xsb-drop-hint-label">{ __( 'Add a widget', 'xcodesol-page-builder' ) }</span>
		</button>
	);
}

/**
 * Single nested widget inside a container column. Draggable within its
 * column (and droppable into other columns), selectable, removable, and it
 * shows its own inline style popover when selected.
 */
function NestedBlock({
	block,
	containerIndex,
	colIndex,
	blockIndex,
	selected,
	onSelect,
	onRemove,
	onUpdateSettings,
	stylePanel,
	onCloseStylePanel,
	device = 'desktop',
	onStyleDevice,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
	onOpenWidgetPanel,
	isLastInColumn,
	placementStyle,
	dropGuide,
	selectedNested,
}) {
	const meta = getBlockMeta(block.type);
	const settings = { ...(meta.defaults || {}), ...(block.settings || {}) };
	const isNestedContainer = [ 'xcopb/gb-container', 'xcopb/container', 'xcosb/gb-container' ].includes( block.type );
	const bodySettings = device !== 'desktop'
		? effectiveForDevice(settings, device)
		: settings;

	const isHiddenOnDevice = (
		(device === 'desktop' && ( !!bodySettings.hide_on_desktop || !!bodySettings.hide_desktop )) ||
		(device === 'tablet' && ( !!bodySettings.hide_on_tablet || !!bodySettings.hide_tablet )) ||
		(device === 'mobile' && ( !!bodySettings.hide_on_mobile || !!bodySettings.hide_mobile ))
	);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `nested-${containerIndex}-${colIndex}-${blockIndex}`,
		data: { canvasNested: { ci: containerIndex, path: [ { cj: colIndex, bi: blockIndex } ], container: isNestedContainer } },
	});
	const widgetSpacing = widgetSpacingInlineCss( bodySettings );
	// Container content padding belongs to its visual container element. The
	// nested sortable wrapper only carries authored margin; duplicating padding
	// here would stack it with NestedContainerPreview's own 20px inner padding.
	if ( isNestedContainer ) {
		delete widgetSpacing.padding;
	}

	const style = {
		'--xsb-depth-color': nestingAccent(1),
		transform: CSS.Transform.toString(transform),
		transition,
		...widgetSpacing,
		...positionInlineCss(bodySettings),
		...transformInlineCss(bodySettings),
		...(placementStyle || {}),
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			data-xsb-block-id={ block.id || undefined }
			data-nested-id={`nested-${containerIndex}-${colIndex}-${blockIndex}`}
			data-nested-path={ JSON.stringify( { ci: containerIndex, path: [ { cj: colIndex, bi: blockIndex } ] } ) }
			data-nesting-column-index={ colIndex }
			data-nesting-level="1"
			className={`xsb-nested-block${isNestedContainer ? ' xsb-nested-block--container' : ''}${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isHiddenOnDevice ? ' is-hidden-on-device' : ''}`}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(containerIndex, colIndex, blockIndex, { x: e.clientX, y: e.clientY }, [ { cj: colIndex, bi: blockIndex } ]);
			}}
		>
			{/* Floating Mini Action Toolbar */}
			<div className={`xsb-nested-toolbar${blockIndex === 0 ? ' is-first' : ''}`} onClick={(e) => e.stopPropagation()}>
				<div className="xsb-nested-toolbar-badge" {...attributes} {...listeners} title={__('Drag to reorder', 'xcodesol-page-builder')}>
					<span className="xsb-toolbar-grip" aria-hidden="true">⠿</span>
					<span className="xsb-nested-toolbar-title">{meta.label}</span>
				</div>
				<div className="xsb-nested-toolbar-actions">
					{onMoveNested && (
						<>
							<button
								type="button"
								className="xsb-tb-btn"
								title={__('Move Up', 'xcodesol-page-builder')}
								disabled={blockIndex === 0}
								onClick={() => onMoveNested(containerIndex, colIndex, blockIndex, -1)}
							>
								<span className="dashicons dashicons-arrow-up-alt2" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn"
								title={__('Move Down', 'xcodesol-page-builder')}
								disabled={isLastInColumn}
								onClick={() => onMoveNested(containerIndex, colIndex, blockIndex, 1)}
							>
								<span className="dashicons dashicons-arrow-down-alt2" aria-hidden="true" />
							</button>
						</>
					)}
					{onDuplicateNested && (
						<button
							type="button"
							className="xsb-tb-btn"
							title={__('Duplicate widget', 'xcodesol-page-builder')}
							onClick={() => onDuplicateNested(containerIndex, colIndex, blockIndex)}
						>
							<span className="dashicons dashicons-admin-page" aria-hidden="true" />
						</button>
					)}
					{hasStylePopover(block.type) && onOpenStyleNested && (
						<button
							type="button"
							className="xsb-tb-btn xsb-tb-btn--style"
							title={__('Edit Styles', 'xcodesol-page-builder')}
							onClick={(e) => onOpenStyleNested(containerIndex, colIndex, blockIndex, { x: e.clientX, y: e.clientY })}
						>
							<span className="dashicons dashicons-admin-customizer" aria-hidden="true" />
						</button>
					)}
					<button
						type="button"
						className="xsb-tb-btn xsb-tb-btn--remove"
						title={__('Remove widget', 'xcodesol-page-builder')}
						onClick={() => onRemove(containerIndex, colIndex, blockIndex)}
					>
						<span className="dashicons dashicons-trash" aria-hidden="true" />
					</button>
				</div>
			</div>

			{isHiddenOnDevice && (
				<div className="xsb-hidden-device-notice">
					<span className="dashicons dashicons-hidden" aria-hidden="true" />
					{sprintf(__('Hidden on %s', 'xcodesol-page-builder'), device)}
				</div>
			)}
			{renderBlockBody(block, bodySettings, meta, device, {
					onAddWidget: () => {
					onSelect(containerIndex, colIndex, blockIndex);
					if ( onOpenWidgetPanel ) onOpenWidgetPanel();
				},
				containerIndex,
				containerPath: isNestedContainer ? [ { cj: colIndex, bi: blockIndex } ] : null,
				onSelectNested: onSelect,
				selectedNested,
				dropTarget: isNestedContainer ? { ci: containerIndex, path: [ { cj: colIndex, bi: blockIndex } ] } : null,
				dropGuide,
				depth: 1,
			})}
			{selected && stylePanel.open && hasStylePopover(block.type) && (
				<StylePopover
					type={block.type}
					label={meta.label}
					settings={settings}
					style={stylePanelPosition(stylePanel.point)}
					onChange={(key, value) => onUpdateSettings(containerIndex, colIndex, blockIndex, key, value)}
					onClose={onCloseStylePanel}
					onDeviceChange={onStyleDevice}
				/>
			)}
		</div>
	);
}

/**
 * Direct-manipulation padding handles for the Container block.
 * Renders 4 inner draggable edges that scrub padding in real-time,
 * linking opposite sides when Shift is held down.
 */
function ContainerPaddingHandles( { padding = {}, onChange } ) {
	const [ liveTip, setLiveTip ] = useState( null );
	const [ draggingEdge, setDraggingEdge ] = useState( null );

	const startDrag = ( edge, e ) => {
		e.stopPropagation();
		e.preventDefault();
		const startX = e.clientX;
		const startY = e.clientY;
		const curTop = typeof padding === 'object' && padding !== null ? Number( padding.top ?? 0 ) : Number( padding || 0 );
		const curRight = typeof padding === 'object' && padding !== null ? Number( padding.right ?? 0 ) : Number( padding || 0 );
		const curBottom = typeof padding === 'object' && padding !== null ? Number( padding.bottom ?? 0 ) : Number( padding || 0 );
		const curLeft = typeof padding === 'object' && padding !== null ? Number( padding.left ?? 0 ) : Number( padding || 0 );
		const unit = ( typeof padding === 'object' && padding !== null ? padding.unit : null ) || 'px';

		setDraggingEdge( edge );
		let currentPad = {
			top: curTop,
			right: curRight,
			bottom: curBottom,
			left: curLeft,
			unit,
			isLinked: false,
		};

		const onMouseMove = ( ev ) => {
			const deltaX = ev.clientX - startX;
			const deltaY = ev.clientY - startY;
			const isShift = ev.shiftKey;
			const next = { ...currentPad };

			if ( edge === 'top' ) {
				next.top = Math.max( 0, curTop + deltaY );
				if ( isShift ) next.bottom = Math.max( 0, curBottom + deltaY );
			} else if ( edge === 'bottom' ) {
				next.bottom = Math.max( 0, curBottom - deltaY );
				if ( isShift ) next.top = Math.max( 0, curTop - deltaY );
			} else if ( edge === 'left' ) {
				next.left = Math.max( 0, curLeft + deltaX );
				if ( isShift ) next.right = Math.max( 0, curRight + deltaX );
			} else if ( edge === 'right' ) {
				next.right = Math.max( 0, curRight - deltaX );
				if ( isShift ) next.left = Math.max( 0, curLeft - deltaX );
			}

			currentPad = next;
			setLiveTip( `${ edge.toUpperCase() }: ${ next[ edge ] }px${ isShift ? ' (Opposite Linked)' : '' }` );
			onChange( next );
		};

		const onMouseUp = () => {
			window.removeEventListener( 'mousemove', onMouseMove );
			window.removeEventListener( 'mouseup', onMouseUp );
			setDraggingEdge( null );
			setLiveTip( null );
			onChange( currentPad );
		};

		window.addEventListener( 'mousemove', onMouseMove );
		window.addEventListener( 'mouseup', onMouseUp );
	};

	return (
		<div className="xsb-container-pad-handles" onClick={ ( e ) => e.stopPropagation() }>
			{ liveTip && (
				<div className="xsb-pad-handle-tooltip">
					{ liveTip }
				</div>
			) }
			<div
				className={ `xsb-pad-handle xsb-pad-handle--top${ draggingEdge === 'top' ? ' is-dragging' : '' }` }
				onMouseDown={ ( e ) => startDrag( 'top', e ) }
				title={ __( 'Drag to scrub top padding (Shift: link bottom)', 'xcodesol-page-builder' ) }
			>
				<span className="xsb-pad-handle-grip" />
			</div>
			<div
				className={ `xsb-pad-handle xsb-pad-handle--bottom${ draggingEdge === 'bottom' ? ' is-dragging' : '' }` }
				onMouseDown={ ( e ) => startDrag( 'bottom', e ) }
				title={ __( 'Drag to scrub bottom padding (Shift: link top)', 'xcodesol-page-builder' ) }
			>
				<span className="xsb-pad-handle-grip" />
			</div>
			<div
				className={ `xsb-pad-handle xsb-pad-handle--left${ draggingEdge === 'left' ? ' is-dragging' : '' }` }
				onMouseDown={ ( e ) => startDrag( 'left', e ) }
				title={ __( 'Drag to scrub left padding (Shift: link right)', 'xcodesol-page-builder' ) }
			>
				<span className="xsb-pad-handle-grip" />
			</div>
			<div
				className={ `xsb-pad-handle xsb-pad-handle--right${ draggingEdge === 'right' ? ' is-dragging' : '' }` }
				onMouseDown={ ( e ) => startDrag( 'right', e ) }
				title={ __( 'Drag to scrub right padding (Shift: link left)', 'xcodesol-page-builder' ) }
			>
				<span className="xsb-pad-handle-grip" />
			</div>
		</div>
	);
}

/**
 * Direct-manipulation gap handle for the Container block.
 */
function ContainerGapHandle( { gap, onChange } ) {
	const [ liveTip, setLiveTip ] = useState( null );
	const [ isDragging, setIsDragging ] = useState( false );

	const startDrag = ( e ) => {
		e.stopPropagation();
		e.preventDefault();
		const startX = e.clientX;
		const curGap = typeof gap === 'object' && gap !== null ? Number( gap.col ?? 20 ) : Number( gap || 20 );
		setIsDragging( true );

		let currentVal = curGap;
		const onMouseMove = ( ev ) => {
			const delta = ev.clientX - startX;
			const newGap = Math.max( 0, curGap + Math.round( delta / 2 ) );
			currentVal = newGap;
			setLiveTip( `Gap: ${ newGap }px` );
			onChange( typeof gap === 'object' && gap !== null
				? { ...gap, col: newGap, row: newGap }
				: newGap
			);
		};

		const onMouseUp = () => {
			window.removeEventListener( 'mousemove', onMouseMove );
			window.removeEventListener( 'mouseup', onMouseUp );
			setIsDragging( false );
			setLiveTip( null );
		};

		window.addEventListener( 'mousemove', onMouseMove );
		window.addEventListener( 'mouseup', onMouseUp );
	};

	return (
		<div
			className={ `xsb-container-gap-handle${ isDragging ? ' is-dragging' : '' }` }
			onMouseDown={ startDrag }
			title={ __( 'Drag to adjust container gap', 'xcodesol-page-builder' ) }
		>
			<span>⇥⇤</span>
			<span>{ liveTip || `${ typeof gap === 'object' && gap !== null ? ( gap.col ?? 20 ) : ( gap || 20 ) }px` }</span>
		</div>
	);
}

/**
 * Resolve a grid-template control value into its individual CSS values.
 * Accepts the modern { columns, rows, auto_flow, auto_rows } object as well
 * as the legacy plain string so containers saved before the track editor
 * keep rendering unchanged.
 *
 * @param {Object|string} template Stored control value.
 * @param {Object}        settings Container settings (legacy fallbacks).
 * @return {{columns: string, rows: string|undefined, autoFlow: string|undefined, autoRows: string|undefined}}
 */
function resolveGridTemplate( template, settings = {} ) {
	const obj = template && typeof template === 'object' && ! Array.isArray( template ) ? template : null;
	const legacy = typeof template === 'string' && template.trim() ? template.trim() : '';
	const fallback = settings.grid_columns_count
		? `repeat(${ Number( settings.grid_columns_count ) }, minmax(0, 1fr))`
		: 'repeat(3, minmax(0, 1fr))';
	return {
		columns: obj && obj.columns ? String( obj.columns ) : ( legacy || fallback ),
		rows: obj && obj.rows && obj.rows !== 'auto' ? String( obj.rows ) : undefined,
		autoFlow: ( obj && obj.auto_flow ) || settings.grid_auto_flow || undefined,
		autoRows: obj && obj.auto_rows && obj.auto_rows !== 'auto'
			? obj.auto_rows
			: ( settings.grid_auto_rows && settings.grid_auto_rows !== 'auto' ? settings.grid_auto_rows : undefined ),
	};
}

/**
 * Count the explicit column tracks in a grid-template-columns value. Returns
 * 0 when the track count is dynamic (auto-fit / auto-fill).
 *
 * @param {string} template CSS track list.
 * @return {number} Track count.
 */
function countGridTracks( template ) {
	if ( typeof template !== 'string' || ! template.trim() ) {
		return 0;
	}
	const repeat = template.match( /repeat\(\s*(\d+)\s*,/ );
	if ( repeat ) {
		return parseInt( repeat[ 1 ], 10 ) || 0;
	}
	if ( /auto-fit|auto-fill/.test( template ) ) {
		return 0;
	}
	const tokens = template.trim().split( /\s+(?![^(]*\))/ ).filter( Boolean );
	return tokens.length > 0 && tokens.length <= 24 ? tokens.length : 0;
}

/**
 * Placement CSS for a widget inside a container, driven by its own
 * "Parent Layout & Placement" settings and the parent's layout mode.
 *
 * @param {Object} setting  Child settings.
 * @param {string} parentMode Parent layout mode.
 * @param {string} itemWidth  Scroll item width (scroll-row mode only).
 * @param {string} parentSnap Parent's default scroll-snap alignment.
 * @return {Object} Inline style.
 */
function childPlacementStyle( setting = {}, parentMode = 'columns', itemWidth, parentSnap, parentSettings = {} ) {
	const s = {};

	if ( setting.align_self && setting.align_self !== 'auto' ) {
		s.alignSelf = setting.align_self;
	}
	const order = Number( setting.child_order );
	if ( Number.isFinite( order ) && order !== 0 ) {
		s.order = order;
	}

	if ( parentMode === 'list' || parentMode === 'row' ) {
		const hasCustomFlexSizing = [ 'flex_grow', 'flex_shrink', 'flex_basis' ].some(
			( key ) => setting[ key ] !== undefined && setting[ key ] !== ''
		);
		if ( parentMode === 'row' && ! hasCustomFlexSizing ) {
			// A fresh row divides its available width evenly between items. Any
			// saved flex sizing remains an explicit per-item override.
			s.flex = '1 1 0%';
		} else {
			if ( setting.flex_grow !== undefined && setting.flex_grow !== '' ) {
				s.flexGrow = Number( setting.flex_grow ) || 0;
			}
			if ( setting.flex_shrink !== undefined && setting.flex_shrink !== '' ) {
				s.flexShrink = Number( setting.flex_shrink ) || 0;
			}
			if ( setting.flex_basis ) {
				s.flexBasis = setting.flex_basis;
			}
		}
		if ( parentMode === 'row' ) {
			s.minWidth = '0';
		}
		if ( setting.child_min_width ) {
			s.minWidth = `${ Number( setting.child_min_width ) }px`;
		}
		if ( setting.child_max_width ) {
			s.maxWidth = `${ Number( setting.child_max_width ) }px`;
		}
	} else if ( parentMode === 'grid' ) {
		if ( setting.grid_area ) {
			s.gridArea = String( setting.grid_area );
		} else {
			const span = Math.min( 12, Math.max( 1, Number( setting.grid_column_span ) || 1 ) );
			s.gridColumn = `span ${ span }`;
			const rowSpan = Math.min( 12, Math.max( 1, Number( setting.grid_row_span ) || 1 ) );
			if ( rowSpan > 1 ) {
				s.gridRow = `span ${ rowSpan }`;
			}
		}
		if ( setting.grid_justify_self && setting.grid_justify_self !== 'auto' ) {
			s.justifySelf = setting.grid_justify_self;
		}
	} else if ( parentMode === 'masonry' ) {
		const breakSetting = setting.masonry_item_break || parentSettings.masonry_break_inside || 'avoid';
		s.breakInside = breakSetting === 'auto' ? 'auto' : 'avoid';
		if ( setting.masonry_item_span === 'all' ) {
			s.columnSpan = 'all';
		}
	} else if ( parentMode === 'scroll-row' ) {
		s.flex = '0 0 auto';
		if ( itemWidth ) {
			s.width = itemWidth;
		}
		// The item may pick its own snap edge; otherwise the row's default wins.
		s.scrollSnapAlign = setting.scroll_snap_align || parentSnap || 'start';
	}

	return s;
}

/**
 * Hover-state declarations for a container box.
 *
 * Stateful style sections (background, border, corners, shadow, transform)
 * keep their Hover values under flat `hover_<key>` settings — the very keys
 * the front end reads. Inline styles cannot express a pseudo-class, so the
 * canvas prints one scoped `:hover` rule per block instead; that keeps the
 * preview and the front end showing the same thing.
 *
 * @param {Object} settings Effective base settings for the container.
 * @return {string} 'prop:value;' declarations, or '' when no hover value is set.
 */
function containerHoverDecls( settings = {} ) {
	const decls = [];
	const val = ( key ) =>
		settings[ key ] === undefined || settings[ key ] === '' || settings[ key ] === null ? null : settings[ key ];

	// Background: colour, gradient or image — mirrors the base composition so
	// a hover override never drops the part the author did not touch.
	let background = val( 'hover_bg_color' ) ? String( settings.hover_bg_color ) : null;
	if ( val( 'hover_bg_type' ) === 'gradient' && settings.hover_gradient && typeof settings.hover_gradient === 'object' ) {
		const g = settings.hover_gradient;
		background = g.type === 'radial'
			? `radial-gradient(circle, ${ g.colorA || '#4f46e5' } ${ g.posA ?? 0 }%, ${ g.colorB || '#06b6d4' } ${ g.posB ?? 100 }%)`
			: `linear-gradient(${ Number( g.angle ) || 90 }deg, ${ g.colorA || '#4f46e5' } ${ g.posA ?? 0 }%, ${ g.colorB || '#06b6d4' } ${ g.posB ?? 100 }%)`;
	} else if ( val( 'hover_bg_type' ) === 'image' && settings.hover_bg_image ) {
		const url = typeof settings.hover_bg_image === 'object' ? settings.hover_bg_image.url : settings.hover_bg_image;
		if ( url ) {
			background = `url("${ url }") center / cover no-repeat`;
		}
	}
	if ( background ) {
		decls.push( `background:${ background }` );
	}

	// Border (4-side or uniform) and per-corner radius.
	const bw = val( 'hover_border_width' );
	if ( bw !== null && typeof bw === 'object' ) {
		decls.push( `border-style:${ val( 'hover_border_style' ) || 'solid' }` );
		decls.push( `border-color:${ val( 'hover_border_color' ) || '#000000' }` );
		decls.push( `border-width:${ bw.top ?? 1 }px ${ bw.right ?? 1 }px ${ bw.bottom ?? 1 }px ${ bw.left ?? 1 }px` );
	} else if ( bw !== null && Number( bw ) > 0 ) {
		decls.push( `border:${ Number( bw ) }px ${ val( 'hover_border_style' ) || 'solid' } ${ val( 'hover_border_color' ) || '#000000' }` );
	} else if ( val( 'hover_border_color' ) ) {
		decls.push( `border-color:${ settings.hover_border_color }` );
	}

	const radius = val( 'hover_border_radius' );
	if ( radius !== null && typeof radius === 'object' ) {
		const u = radius.unit || 'px';
		decls.push( `border-radius:${ radius.top ?? 8 }${ u } ${ radius.right ?? 8 }${ u } ${ radius.bottom ?? 8 }${ u } ${ radius.left ?? 8 }${ u }` );
	} else if ( radius !== null ) {
		decls.push( `border-radius:${ Number( radius ) }px` );
	}

	// Shadow: multi-layer array or a named preset.
	const shadow = val( 'hover_box_shadow' );
	if ( Array.isArray( shadow ) && shadow.length > 0 ) {
		decls.push( `box-shadow:${ shadow.map( ( s ) =>
			`${ s.inset ? 'inset ' : '' }${ s.x || 0 }px ${ s.y || 4 }px ${ s.blur || 14 }px ${ s.spread || 0 }px ${ s.color || 'rgba(0,0,0,0.1)' }`
		).join( ', ' ) }` );
	} else if ( typeof shadow === 'string' && SHADOW_VALUES[ shadow ] ) {
		decls.push( `box-shadow:${ SHADOW_VALUES[ shadow ] }` );
	}

	// Opacity + transform pair.
	const opacity = val( 'hover_opacity' );
	if ( opacity !== null ) {
		decls.push( `opacity:${ Number( opacity ) }` );
	}
	const rotate = Number( settings.hover_rotate );
	const scale = Number( settings.hover_scale );
	const parts = [];
	if ( Number.isFinite( rotate ) && rotate !== 0 ) {
		parts.push( `rotate(${ rotate }deg)` );
	}
	if ( Number.isFinite( scale ) && scale > 0 && scale !== 1 ) {
		parts.push( `scale(${ scale })` );
	}
	if ( parts.length ) {
		decls.push( `transform:${ parts.join( ' ' ) }` );
	}

	return decls.length ? decls.join( ';' ) + ';' : '';
}

/**
 * Grid line overlay with track labels. Shown on the canvas while a Grid
 * container is selected so authors can see the tracks they place widgets in.
 */
function GridLineOverlay( { template, rowGap, columnGap, insets, count } ) {
	const tracks = countGridTracks( template );
	if ( ! tracks ) {
		return null;
	}
	const rows = Math.min( 3, Math.max( 1, Math.ceil( ( Number( count ) || tracks ) / tracks ) ) );

	return (
		<div
			className="xsb-grid-track-overlay"
			aria-hidden="true"
			style={ {
				position: 'absolute',
				top: insets.top,
				right: insets.right,
				bottom: insets.bottom,
				left: insets.left,
				display: 'grid',
				gridTemplateColumns: template,
				rowGap,
				columnGap,
				pointerEvents: 'none',
			} }
		>
			{ Array.from( { length: tracks * rows } ).map( ( _, i ) => (
				<div key={ i } className="xsb-grid-track-cell">
					<span className="xsb-grid-track-label">
						{ sprintf( __( 'C%1$d·R%2$d', 'xcodesol-page-builder' ), ( i % tracks ) + 1, Math.floor( i / tracks ) + 1 ) }
					</span>
				</div>
			) ) }
		</div>
	);
}

/**
 * Mode-aware body for containers that are not in "columns" mode.
 *
 * Children from every stored column are flattened into one ordered list and
 * wrapped per mode (grid cells, masonry items, scroll items, flex items)
 * while keeping their original column/block coordinates so every interaction
 * (select, move, duplicate, remove, style) still targets the right block.
 */
function ContainerFlowZone({
	containerIndex,
	layoutMode,
	layoutStyle,
	items,
	viewSettings,
	selectedNested,
	onSelectNested,
	onUpdateNested,
	stylePanel,
	onCloseStylePanel,
	onOpenWidgetPanel,
	device = 'desktop',
	onStyleDevice,
	onRemoveFromColumn,
	dropGuide,
	activeDragId,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
}) {
	const { setNodeRef, isOver } = useDroppable( {
		id: `col-${ containerIndex }-0`,
		data: { containerIndex, colIndex: 0 },
	} );

	// The drop guide slot is relative to the flattened child list without the
	// dragged widget; shift it back when the dragged widget still occupies an
	// earlier rendered position.
	const colGuide = dropGuide && dropGuide.kind === 'col' && dropGuide.ci === containerIndex ? dropGuide : null;
	let guideAt = null;
	if ( colGuide ) {
		let draggedPos = -1;
		items.forEach( ( item, i ) => {
			if ( activeDragId === `nested-${ containerIndex }-${ item.cj }-${ item.bi }` ) {
				draggedPos = i;
			}
		} );
		guideAt = colGuide.slot + ( draggedPos >= 0 && draggedPos <= colGuide.slot ? 1 : 0 );
	}

	const rawItemWidth = viewSettings.scroll_item_width;
	const itemWidth = rawItemWidth
		? ( typeof rawItemWidth === 'object'
			? `${ rawItemWidth.value ?? 280 }${ rawItemWidth.unit || 'px' }`
			: `${ Number( rawItemWidth ) || 280 }px` )
		: undefined;

	return (
		<div
			ref={ setNodeRef }
			data-col-id={ `${ containerIndex }-0` }
			style={ { width: '100%', boxSizing: 'border-box', ...( layoutStyle || {} ) } }
			className={ `xsb-container-flow xsb-container-flow--${ layoutMode }${ isOver ? ' is-over' : '' }${ colGuide ? ' is-guide' : '' }` }
		>
			{ items.length === 0 && (
				<DropHint
					onClick={ ( e ) => {
						e.stopPropagation();
						if ( onSelectNested ) {
							onSelectNested( containerIndex, 0, -1 );
						}
						if ( onOpenWidgetPanel ) onOpenWidgetPanel();
					} }
				/>
			) }
			{ colGuide && items.length === 0 && <DropGuideLine /> }
			{ items.map( ( item, flatIndex ) => (
				<Fragment key={ `flow-${ item.cj }-${ item.bi }` }>
					{ colGuide && guideAt === flatIndex && <DropGuideLine /> }
					<NestedBlock
						block={ item.block }
						containerIndex={ containerIndex }
						colIndex={ item.cj }
						blockIndex={ item.bi }
						selected={
							!! ( selectedNested &&
								selectedNested.ci === containerIndex &&
								selectedNested.cj === item.cj &&
								selectedNested.bi === item.bi )
						}
						selectedNested={ selectedNested }
						onSelect={ onSelectNested }
						onRemove={ onRemoveFromColumn }
						onUpdateSettings={ onUpdateNested }
						stylePanel={ stylePanel }
						onCloseStylePanel={ onCloseStylePanel }
						device={ device }
						onStyleDevice={ onStyleDevice }
						onMoveNested={ onMoveNested }
						onDuplicateNested={ onDuplicateNested }
						onOpenStyleNested={ onOpenStyleNested }
						onOpenWidgetPanel={ onOpenWidgetPanel }
						dropGuide={ dropGuide }
						isLastInColumn={ flatIndex === items.length - 1 }
						placementStyle={ childPlacementStyle(
							device !== 'desktop' ? effectiveForDevice( item.block.settings || {}, device ) : ( item.block.settings || {} ),
							layoutMode,
							itemWidth,
							viewSettings.scroll_snap_align,
							viewSettings
						) }
					/>
				</Fragment>
			) ) }
			{ colGuide && items.length > 0 && guideAt === items.length && <DropGuideLine /> }
		</div>
	);
}

/**
 * Non-interactive preview of a container nested inside another container's
 * column. Deeper containers still need to be visible on the canvas, so they
 * render with the same layout rules as the top-level container preview.
 */
function NestedContainerPreview({ block, settings, device = 'desktop', onAddWidget, dropTarget, dropGuide, depth = 1, containerIndex, containerPath = [], onSelectNested, selectedNested }) {
	const dropId = dropTarget ? `inner-${ dropTarget.ci }-${ dropTarget.path.map( ( step ) => `${ step.cj }.${ step.bi }` ).join( '_' ) }` : 'inner-container-disabled';
	const { setNodeRef, isOver } = useDroppable( {
		id: dropId,
		data: { innerContainer: dropTarget },
		disabled: ! dropTarget,
	} );
	const viewSettings = device !== 'desktop' ? effectiveForDevice( settings, device ) : settings;
	const layoutMode =
		viewSettings.layout_mode ||
		( viewSettings.layout_type === 'grid' ? 'grid' : ( viewSettings.layout_type === 'flex' ? 'list' : 'columns' ) );
	const cols = columnCount( viewSettings.columns );
	const gap = Number( viewSettings.gap ) || 20;
	const gapRowCss = typeof viewSettings.gap === 'object' && viewSettings.gap !== null
		? `${ viewSettings.gap.row ?? 20 }${ viewSettings.gap.unit || 'px' }`
		: `${ gap }px`;
	const gapColCss = typeof viewSettings.gap === 'object' && viewSettings.gap !== null
		? `${ viewSettings.gap.col ?? 20 }${ viewSettings.gap.unit || 'px' }`
		: `${ gap }px`;
	const gridResolved = resolveGridTemplate( viewSettings.grid_template, viewSettings );
	const gridGap = viewSettings.grid_gap && typeof viewSettings.grid_gap === 'object' ? viewSettings.grid_gap : viewSettings.gap;
	const gridGapRowCss = typeof gridGap === 'object' && gridGap !== null
		? `${ gridGap.row ?? 20 }${ gridGap.unit || 'px' }`
		: `${ Number( gridGap ) || 20 }px`;
	const gridGapColCss = typeof gridGap === 'object' && gridGap !== null
		? `${ gridGap.col ?? 20 }${ gridGap.unit || 'px' }`
		: `${ Number( gridGap ) || 20 }px`;
	const scrollGapCss = typeof viewSettings.scroll_gap === 'object' && viewSettings.scroll_gap !== null
		? `${ viewSettings.scroll_gap.value ?? 20 }${ viewSettings.scroll_gap.unit || 'px' }`
		: `${ Number( viewSettings.scroll_gap ) || 20 }px`;
	const scrollPeekCss = typeof viewSettings.scroll_padding_peek === 'object' && viewSettings.scroll_padding_peek !== null
		? `${ viewSettings.scroll_padding_peek.value ?? 24 }${ viewSettings.scroll_padding_peek.unit || 'px' }`
		: `${ Number( viewSettings.scroll_padding_peek ) || 24 }px`;
	const rawScrollItemWidth = viewSettings.scroll_item_width;
	const scrollItemWidth = rawScrollItemWidth
		? ( typeof rawScrollItemWidth === 'object'
			? `${ rawScrollItemWidth.value ?? 280 }${ rawScrollItemWidth.unit || 'px' }`
			: `${ Number( rawScrollItemWidth ) || 280 }px` )
		: undefined;

	let modeStyles;
	if ( layoutMode === 'grid' ) {
		modeStyles = {
			display: 'grid',
			gridTemplateColumns: gridResolved.columns,
			gridTemplateRows: gridResolved.rows,
			gridAutoFlow: gridResolved.autoFlow,
			gridAutoRows: gridResolved.autoRows,
			gridTemplateAreas: viewSettings.grid_named_areas || undefined,
			alignItems: viewSettings.grid_align_items || 'stretch',
			justifyItems: viewSettings.grid_justify_items || 'stretch',
			alignContent: viewSettings.grid_align_content || undefined,
			justifyContent: viewSettings.grid_justify_content || undefined,
			rowGap: gridGapRowCss,
			columnGap: gridGapColCss,
		};
	} else if ( layoutMode === 'scroll-row' ) {
		const snapType = viewSettings.scroll_snap_type || 'mandatory';
		modeStyles = {
			display: 'flex',
			flexDirection: 'row',
			overflowX: 'auto',
			scrollSnapType: snapType === 'none' ? 'none' : `x ${ snapType }`,
			gap: scrollGapCss,
			paddingLeft: scrollPeekCss,
			paddingRight: scrollPeekCss,
			scrollbarWidth: viewSettings.scroll_hide_scrollbar ? 'none' : undefined,
		};
	} else if ( layoutMode === 'masonry' ) {
		const masonryGapCss = typeof viewSettings.masonry_gap === 'object' && viewSettings.masonry_gap !== null
			? `${ viewSettings.masonry_gap.value ?? 20 }${ viewSettings.masonry_gap.unit || 'px' }`
			: `${ Number( viewSettings.masonry_gap ) || 20 }px`;
		modeStyles = { columnCount: Number( viewSettings.masonry_columns ) || 3, columnGap: masonryGapCss };
	} else if ( layoutMode === 'list' || layoutMode === 'row' ) {
		modeStyles = {
			display: 'flex',
			flexDirection: device === 'mobile' && viewSettings.column_reverse_mobile
				? ( layoutMode === 'row' ? 'row-reverse' : 'column-reverse' )
				: ( viewSettings.flex_direction || ( layoutMode === 'row' ? 'row' : 'column' ) ),
			flexWrap: viewSettings.flex_wrap || ( layoutMode === 'row' ? 'wrap' : 'nowrap' ),
			justifyContent: viewSettings.justify_content || 'flex-start',
			alignItems: viewSettings.equal_height ? 'stretch' : ( viewSettings.align_items || 'stretch' ),
			alignContent: viewSettings.align_content || 'stretch',
			rowGap: gapRowCss,
			columnGap: gapColCss,
		};
	} else {
		const widths = resolveColumnWidths( cols, viewSettings.column_widths );
		const columnGapSetting = viewSettings.column_gap;
		const columnGapRowCss = typeof columnGapSetting === 'object' && columnGapSetting !== null
			? `${ columnGapSetting.row ?? 20 }${ columnGapSetting.unit || 'px' }`
			: `${ Number( columnGapSetting ) || gap }px`;
		const columnGapColCss = typeof columnGapSetting === 'object' && columnGapSetting !== null
			? `${ columnGapSetting.col ?? 20 }${ columnGapSetting.unit || 'px' }`
			: `${ Number( columnGapSetting ) || gap }px`;
		const valignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
		modeStyles = {
			display: 'grid',
			gridTemplateColumns: widths.map( ( width ) => `minmax(0, ${ width }fr)` ).join( ' ' ),
			alignItems: valignMap[ viewSettings.column_valign ] || viewSettings.column_valign || 'stretch',
			rowGap: columnGapRowCss,
			columnGap: columnGapColCss,
		};
	}

	const bg = viewSettings.bg_color || viewSettings.background || undefined;
	const paddingSetting = viewSettings.padding;
	const paddingUnit = paddingSetting && typeof paddingSetting === 'object' ? ( paddingSetting.unit || 'px' ) : 'px';
	const defaultPadding = paddingSetting === undefined || paddingSetting === null || paddingSetting === '' ? 20 : Number( paddingSetting ) || 0;
	const nestedPadding = [ 'top', 'right', 'bottom', 'left' ].map( ( side ) => {
		const sideValue = viewSettings[ `padding_${ side }` ];
		const value = sideValue !== undefined && sideValue !== ''
			? Number( sideValue )
			: paddingSetting && typeof paddingSetting === 'object'
				? ( paddingSetting[ side ] ?? 20 )
				: defaultPadding;
		return `${ Number.isFinite( Number( value ) ) ? Number( value ) : 20 }${ paddingUnit }`;
	} ).join( ' ' );
	const boxStyle = {
		width: '100%',
		boxSizing: 'border-box',
		padding: nestedPadding,
		background: bg,
		borderRadius: Number( viewSettings.border_radius ) > 0 ? `${ Number( viewSettings.border_radius ) }px` : undefined,
		boxShadow: Array.isArray( viewSettings.box_shadow ) && viewSettings.box_shadow.length
			? viewSettings.box_shadow
				.map( ( s ) => `${ s.inset ? 'inset ' : '' }${ s.x || 0 }px ${ s.y || 4 }px ${ s.blur || 14 }px ${ s.spread || 0 }px ${ s.color || 'rgba(0,0,0,0.1)' }` )
				.join( ', ' )
			: ( SHADOW_VALUES[ viewSettings.box_shadow ] || undefined ),
	};
	if ( viewSettings.content_width === 'boxed' ) {
		boxStyle.maxWidth = cssDimension( viewSettings.max_width, '1200px' );
		boxStyle.marginInline = 'auto';
	}

	const inner = Array.isArray( block.inner ) ? block.inner : [];
	const indexedColumns = inner.map( ( column, cj ) => ( Array.isArray( column ) ? column : [] ).map( ( nested, bi ) => ( { nested, cj, bi } ) ) );
	const flat = indexedColumns.flat();
	const columnLayout = layoutMode === 'columns';
	const renderedColumns = Array.from( { length: columnLayout ? Math.max( cols, inner.length, 1 ) : 1 }, ( _, columnIndex ) =>
		columnLayout ? ( indexedColumns[ columnIndex ] || [] ) : flat
	);
	const renderNestedItems = ( items, columnIndex ) => {
		const guideMatches = dropGuide?.kind === 'inner-container' && dropTarget?.path && JSON.stringify( dropGuide.path ) === JSON.stringify( dropTarget.path ) && Number( dropGuide.columnIndex || 0 ) === columnIndex;
		return <SortableContext items={ items.map( ( entry ) => nestedCanvasId( containerIndex, [ ...containerPath, { cj: entry.cj, bi: entry.bi } ] ) ) } strategy={ verticalListSortingStrategy }><>
		{ items.map( ( entry, itemIndex ) => {
		const { nested, cj, bi } = entry;
		const nestedPath = [ ...containerPath, { cj, bi } ];
		const isNestedSelected = selectedNested?.ci === containerIndex && Array.isArray( selectedNested.path ) && JSON.stringify( selectedNested.path ) === JSON.stringify( nestedPath );
		const nestedDropTarget = dropTarget?.path ? { ci: dropTarget.ci, path: [ ...dropTarget.path, { cj, bi } ] } : null;
		const nestedMeta = getBlockMeta( nested.type );
		const nestedBaseSettings = { ...( nestedMeta.defaults || {} ), ...( nested.settings || {} ) };
		const nestedSettings = device !== 'desktop' ? effectiveForDevice( nestedBaseSettings, device ) : nestedBaseSettings;
		return (
		<SortableNestedCanvasItem
			key={ `${ depth }-${ columnIndex }-${ itemIndex }` }
			containerIndex={ containerIndex }
			path={ nestedPath }
			block={ nested }
			className={ `xsb-nested-container-item${ isNestedSelected ? ' is-selected' : '' }` }
			data-nesting-level={ depth + 1 }
			data-nesting-column-index={ columnIndex }
			style={ { ...childPlacementStyle( nestedSettings, layoutMode, scrollItemWidth, viewSettings.scroll_snap_align, viewSettings ), '--xsb-depth-color': nestingAccent( depth + 1 ) } }
			aria-label={ getBlockDisplayLabel( nested.type ) }
			onClick={ ( event ) => {
				event.stopPropagation();
				if ( onSelectNested && Number.isInteger( containerIndex ) ) {
					onSelectNested( containerIndex, nestedPath[ 0 ].cj, nestedPath[ 0 ].bi, { x: event.clientX, y: event.clientY }, nestedPath );
				}
			} }
		>
			<span className="xsb-nested-preview-popover" aria-hidden="true"><span className="xsb-nested-preview-popover__marker" />{ getBlockDisplayLabel( nested.type ) }</span>
			{ guideMatches && dropGuide.slot === itemIndex && <DropGuideLine /> }
			{ renderBlockBody(
				nested,
				nestedSettings,
				nestedMeta,
				device,
				{
					depth: depth + 1,
					onAddWidget,
					containerIndex,
					containerPath: nestedPath,
					onSelectNested,
					selectedNested,
					dropGuide,
					dropTarget: [ 'xcopb/gb-container', 'xcopb/container', 'xcosb/gb-container' ].includes( nested.type ) ? nestedDropTarget : null,
				}
			) }
		</SortableNestedCanvasItem>
		);
		} ) }
		{ guideMatches && dropGuide.slot >= items.length && <DropGuideLine /> }
	</></SortableContext>;
	};

	return (
		<div ref={ setNodeRef } data-inner-container-id={ dropTarget ? dropTarget.path.map( ( step ) => `${ step.cj }-${ step.bi }` ).join( '_' ) : undefined } data-inner-container-path={ dropTarget ? JSON.stringify( dropTarget ) : undefined } data-nesting-level={ depth } data-column-count={ columnLayout ? renderedColumns.length : undefined } className={ `xsb-live-block--nested-container xsb-layout--${ layoutMode }${ layoutMode === 'scroll-row' && viewSettings.scroll_hide_scrollbar ? ' is-scrollbar-hidden' : '' }${ isOver ? ' is-over' : '' }` } style={ { ...boxStyle, ...modeStyles, '--xsb-depth-color': nestingAccent( depth ) } } onClick={ ( event ) => {
			if ( event.target !== event.currentTarget ) return;
			event.stopPropagation();
			if ( onSelectNested && Number.isInteger( containerIndex ) && containerPath.length ) {
				onSelectNested( containerIndex, containerPath[ 0 ].cj, containerPath[ 0 ].bi, { x: event.clientX, y: event.clientY }, containerPath );
			}
		} }>
			{ flat.length === 0 ? (
				columnLayout ? renderedColumns.map( ( _, columnIndex ) => <div key={ `empty-${ depth }-${ columnIndex }` } className="xsb-nested-container-column xsb-nested-container-column--empty" aria-hidden="true">{ dropGuide?.kind === 'inner-container' && JSON.stringify( dropGuide.path ) === JSON.stringify( dropTarget?.path ) && Number( dropGuide.columnIndex || 0 ) === columnIndex && <DropGuideLine /> }</div> ) : <div className="xsb-nested-container-empty" aria-hidden="true">{ dropGuide?.kind === 'inner-container' && JSON.stringify( dropGuide.path ) === JSON.stringify( dropTarget?.path ) && <DropGuideLine /> }</div>
			) : (
				columnLayout
					? renderedColumns.map( ( column, columnIndex ) => <div key={ `column-${ depth }-${ columnIndex }` } className="xsb-nested-container-column">{ renderNestedItems( column, columnIndex ) }</div> )
					: renderNestedItems( flat, 0 )
			) }
		</div>
	);
}

/**
 * A container block rendered as a 12-column grid of droppable columns.
 * Each column spans the number of grid units configured for it.
 */
function ContainerBlock({
	block,
	settings,
	index,
	selected,
	onSelect,
	onRemove,
	onUpdateSettings,
	selectedNested,
	onSelectNested,
	onUpdateNested,
	stylePanel,
	onCloseStylePanel,
	onAddToColumn,
	onOpenWidgetPanel,
	onRemoveFromColumn,
	dropGuide,
	activeDragId,
	showEmptyHint = true,
	device = 'desktop',
	onStyleDevice,
	onMove,
	onDuplicate,
	onAddContainer,
	onOpenStyle,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
	isFirst,
	isLast,
}) {
	const nestedActive = !!(selectedNested && selectedNested.ci === index);
	const editingContainer = !!(selected && !nestedActive && stylePanel.open);
	const viewSettings = device !== 'desktop' ? effectiveForDevice(settings, device) : settings;
	const isHiddenOnDevice = (
		(device === 'desktop' && ( !!viewSettings.hide_on_desktop || !!viewSettings.hide_desktop )) ||
		(device === 'tablet' && ( !!viewSettings.hide_on_tablet || !!viewSettings.hide_tablet )) ||
		(device === 'mobile' && ( !!viewSettings.hide_on_mobile || !!viewSettings.hide_mobile ))
	);
	const cols = columnCount(viewSettings.columns);
	// Stored widths may be fractional (gutter drag / custom ratios), so keep
	// the raw values when they are usable and fall back to the equal 12-unit
	// split for older layouts.
	const storedWidths = Array.isArray(viewSettings.column_widths) ? viewSettings.column_widths.map(Number) : [];
	const rawWidths = storedWidths.length >= cols && storedWidths.slice(0, cols).every((w) => Number.isFinite(w) && w > 0)
		? storedWidths.slice(0, cols).map((w) => Math.min(12, Math.max(0.5, w)))
		: null;
	const widths = rawWidths || resolveColumnWidths(cols, viewSettings.column_widths);
	const usePercentWidths = widths.some((w) => !Number.isInteger(w));
	const gap = viewSettings.gap !== undefined && viewSettings.gap !== '' ? Number( viewSettings.gap ) : 20;
	const uniformPad = viewSettings.padding === undefined || viewSettings.padding === null || viewSettings.padding === '' ? 20 : ( Number(viewSettings.padding) || 0 );
	const pad = (side) =>
		`${Number.isFinite(Number(viewSettings[`padding_${side}`])) ? Number(viewSettings[`padding_${side}`]) : uniformPad}px`;
	const align = ['start', 'center', 'end'].includes(viewSettings.align) ? viewSettings.align : 'stretch';
	const inner = Array.isArray(block.inner) ? block.inner : [];
	const colStylesRaw = Array.isArray(viewSettings.column_styles) ? viewSettings.column_styles : [];
	const colStyles = device !== 'desktop'
		? colStylesRaw.map((entry) => (entry && typeof entry === 'object' ? effectiveForDevice(entry, device) : entry))
		: colStylesRaw;
	const lines = resolveColumnLines(widths, colStyles);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `cv-${index}`,
	});

	const dragStyle = {
		transform: CSS.Transform.toString(transform),
		transition,
		...positionInlineCss(viewSettings),
		...transformInlineCss(viewSettings),
	};
	if ( viewSettings.content_width === 'boxed' ) {
		dragStyle.width = '100%';
		dragStyle.maxWidth = cssDimension( viewSettings.max_width, '1200px' );
		dragStyle.marginInline = 'auto';
		dragStyle.boxSizing = 'border-box';
	}

	// Resolve padding (supports object dimensions or legacy number)
	let resolvedPadding = `${pad('top')} ${pad('right')} ${pad('bottom')} ${pad('left')}`;
	if ( typeof viewSettings.padding === 'object' && viewSettings.padding !== null ) {
		const pu = viewSettings.padding.unit || 'px';
		resolvedPadding = `${viewSettings.padding.top ?? 20}${pu} ${viewSettings.padding.right ?? 20}${pu} ${viewSettings.padding.bottom ?? 20}${pu} ${viewSettings.padding.left ?? 20}${pu}`;
	}

	const paddingParts = String(resolvedPadding).split(' ');
	const overlayInsets = {
		top: paddingParts[0],
		right: paddingParts[1],
		bottom: paddingParts[2],
		left: paddingParts[3],
	};

	// Resolve border radius (supports object corners or legacy number)
	let resolvedRadius = viewSettings.border_radius ? `${viewSettings.border_radius}px` : undefined;
	if ( typeof viewSettings.border_radius === 'object' && viewSettings.border_radius !== null ) {
		const ru = viewSettings.border_radius.unit || 'px';
		resolvedRadius = `${viewSettings.border_radius.top ?? 8}${ru} ${viewSettings.border_radius.right ?? 8}${ru} ${viewSettings.border_radius.bottom ?? 8}${ru} ${viewSettings.border_radius.left ?? 8}${ru}`;
	}

	// Resolve background (color, gradient, image)
	let resolvedBg = viewSettings.bg_color || viewSettings.background || undefined;
	if ( viewSettings.bg_type === 'gradient' && viewSettings.gradient ) {
		const g = viewSettings.gradient;
		resolvedBg = ( g.type || 'linear' ) === 'linear'
			? `linear-gradient(${ g.angle ?? 90 }deg, ${ g.colorA || '#4f46e5' } ${ g.posA ?? 0 }%, ${ g.colorB || '#06b6d4' } ${ g.posB ?? 100 }%)`
			: `radial-gradient(circle, ${ g.colorA || '#4f46e5' } ${ g.posA ?? 0 }%, ${ g.colorB || '#06b6d4' } ${ g.posB ?? 100 }%)`;
	} else if ( viewSettings.bg_type === 'image' && viewSettings.bg_image ) {
		const imgUrl = typeof viewSettings.bg_image === 'object' ? viewSettings.bg_image.url : viewSettings.bg_image;
		if ( imgUrl ) {
			resolvedBg = `url("${ imgUrl }")`;
		}
	}
	const overlayOpacity = Math.min( 100, Math.max( 0, Number( viewSettings.overlay_opacity ?? 100 ) ) ) / 100;
	const hasBackgroundOverlay = Boolean( viewSettings.overlay_color ) && viewSettings.bg_type !== 'none' && overlayOpacity > 0;
	const rawBgVideo = viewSettings.bg_video_url || viewSettings.bg_video || '';
	const bgVideoUrl = typeof rawBgVideo === 'object' && rawBgVideo !== null ? rawBgVideo.url : rawBgVideo;
	const hasBgVideo = viewSettings.bg_type === 'video' && Boolean( bgVideoUrl );

	// Resolve multi-layer box shadows
	let resolvedShadow = SHADOW_VALUES[viewSettings.box_shadow || 'none'] || undefined;
	if ( Array.isArray( viewSettings.box_shadow ) && viewSettings.box_shadow.length > 0 ) {
		resolvedShadow = viewSettings.box_shadow.map( ( s ) =>
			`${ s.inset ? 'inset ' : '' }${ s.x || 0 }px ${ s.y || 4 }px ${ s.blur || 14 }px ${ s.spread || 0 }px ${ s.color || 'rgba(0,0,0,0.1)' }`
		).join( ', ' );
	}

	const layoutMode = viewSettings.layout_mode || ( viewSettings.layout_type === 'grid' ? 'grid' : ( viewSettings.layout_type === 'flex' ? 'list' : 'columns' ) );
	const gridResolved = resolveGridTemplate( viewSettings.grid_template, viewSettings );
	const isColumnsMode = layoutMode === 'columns';

	// Flatten every stored column into one ordered list: the non-column modes
	// read children in the order they were authored regardless of which
	// column they currently live in.
	const flatItems = [];
	( Array.isArray( inner ) ? inner : [] ).forEach((column, cj) => {
		( Array.isArray(column) ? column : [] ).forEach((nested, bi) => {
			flatItems.push({ block: nested, cj, bi });
		});
	});

	let modeStyles = {};
	if ( layoutMode === 'list' ) {
		modeStyles = {
			display: 'flex',
			flexDirection: device === 'mobile' && viewSettings.column_reverse_mobile ? 'column-reverse' : ( viewSettings.flex_direction || 'column' ),
			flexWrap: viewSettings.flex_wrap || 'nowrap',
			justifyContent: viewSettings.justify_content || 'flex-start',
			alignItems: viewSettings.equal_height ? 'stretch' : ( viewSettings.align_items || 'stretch' ),
			alignContent: viewSettings.align_content || 'stretch',
			rowGap: typeof viewSettings.gap === 'object' && viewSettings.gap !== null ? `${viewSettings.gap.row ?? 20}${viewSettings.gap.unit || 'px'}` : `${gap}px`,
			columnGap: typeof viewSettings.gap === 'object' && viewSettings.gap !== null ? `${viewSettings.gap.col ?? 20}${viewSettings.gap.unit || 'px'}` : `${gap}px`,
		};
	} else if ( layoutMode === 'row' ) {
		modeStyles = {
			display: 'flex',
			flexDirection: device === 'mobile' && viewSettings.column_reverse_mobile ? 'row-reverse' : ( viewSettings.flex_direction || 'row' ),
			flexWrap: viewSettings.flex_wrap || 'wrap',
			justifyContent: viewSettings.justify_content || 'flex-start',
			alignItems: viewSettings.equal_height ? 'stretch' : ( viewSettings.align_items || 'stretch' ),
			alignContent: viewSettings.align_content || 'stretch',
			rowGap: typeof viewSettings.gap === 'object' && viewSettings.gap !== null ? `${viewSettings.gap.row ?? 20}${viewSettings.gap.unit || 'px'}` : `${gap}px`,
			columnGap: typeof viewSettings.gap === 'object' && viewSettings.gap !== null ? `${viewSettings.gap.col ?? 20}${viewSettings.gap.unit || 'px'}` : `${gap}px`,
		};
	} else if ( layoutMode === 'grid' ) {
		const gridGapRow = typeof viewSettings.grid_gap === 'object' && viewSettings.grid_gap !== null
			? `${viewSettings.grid_gap.row ?? 20}${viewSettings.grid_gap.unit || 'px'}`
			: ( typeof viewSettings.gap === 'object' && viewSettings.gap !== null ? `${viewSettings.gap.row ?? 20}${viewSettings.gap.unit || 'px'}` : `${gap}px` );
		const gridGapCol = typeof viewSettings.grid_gap === 'object' && viewSettings.grid_gap !== null
			? `${viewSettings.grid_gap.col ?? 20}${viewSettings.grid_gap.unit || 'px'}`
			: ( typeof viewSettings.gap === 'object' && viewSettings.gap !== null ? `${viewSettings.gap.col ?? 20}${viewSettings.gap.unit || 'px'}` : `${gap}px` );

		modeStyles = {
			display: 'grid',
			gridTemplateColumns: gridResolved.columns,
			gridTemplateRows: gridResolved.rows,
			alignItems: viewSettings.grid_align_items || align || 'stretch',
			justifyItems: viewSettings.grid_justify_items || 'stretch',
			alignContent: viewSettings.grid_align_content || undefined,
			justifyContent: viewSettings.grid_justify_content || undefined,
			rowGap: gridGapRow,
			columnGap: gridGapCol,
			gridAutoFlow: gridResolved.autoFlow,
			gridAutoRows: gridResolved.autoRows,
			gridTemplateAreas: viewSettings.grid_named_areas || undefined,
		};
	} else if ( layoutMode === 'masonry' ) {
		const masonCols = Number( viewSettings.masonry_columns ) || 3;
		const masonGap = typeof viewSettings.masonry_gap === 'object' && viewSettings.masonry_gap !== null
			? `${viewSettings.masonry_gap.value ?? 20}${viewSettings.masonry_gap.unit || 'px'}`
			: `${Number( viewSettings.masonry_gap ) || 20}px`;
		modeStyles = {
			columnCount: masonCols,
			columnGap: masonGap,
		};
	} else if ( layoutMode === 'scroll-row' ) {
		const scrollGap = typeof viewSettings.scroll_gap === 'object' && viewSettings.scroll_gap !== null
			? `${viewSettings.scroll_gap.value ?? 20}${viewSettings.scroll_gap.unit || 'px'}`
			: `${Number( viewSettings.scroll_gap ) || 20}px`;
		const scrollPeek = typeof viewSettings.scroll_padding_peek === 'object' && viewSettings.scroll_padding_peek !== null
			? `${viewSettings.scroll_padding_peek.value ?? 24}${viewSettings.scroll_padding_peek.unit || 'px'}`
			: `${Number( viewSettings.scroll_padding_peek ) || 24}px`;
		const snapType = viewSettings.scroll_snap_type || 'mandatory';
		modeStyles = {
			display: 'flex',
			flexDirection: 'row',
			overflowX: 'auto',
			scrollSnapType: snapType === 'none' ? 'none' : `x ${ snapType }`,
			gap: scrollGap,
			paddingLeft: scrollPeek,
			paddingRight: scrollPeek,
			scrollbarWidth: viewSettings.scroll_hide_scrollbar ? 'none' : undefined,
		};
	} else {
		// 'columns' mode
		const colGapRow = typeof viewSettings.column_gap === 'object' && viewSettings.column_gap !== null
			? `${viewSettings.column_gap.row ?? 20}${viewSettings.column_gap.unit || 'px'}`
			: `${gap}px`;
		const colGapCol = typeof viewSettings.column_gap === 'object' && viewSettings.column_gap !== null
			? `${viewSettings.column_gap.col ?? 20}${viewSettings.column_gap.unit || 'px'}`
			: `${gap}px`;
		const valignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
		modeStyles = {
			display: 'grid',
			gridTemplateColumns: usePercentWidths
				? widths.map((w) => `${ Math.round((w / 12) * 10000) / 100 }%`).join(' ')
				: 'repeat(12, minmax(0, 1fr))',
			alignItems: valignMap[viewSettings.column_valign] || viewSettings.column_valign || align || 'stretch',
			rowGap: colGapRow,
			columnGap: colGapCol,
		};
	}

	// In flow modes the layout (flex/grid/columns) lives on the inner flow
	// wrapper so its children are real flex/grid/masonry items; the container
	// itself stays the visual box that carries padding, background and border.
	const containerStyle = {
		...( isColumnsMode ? modeStyles : {} ),
		position: 'relative',
		isolation: hasBgVideo ? 'isolate' : undefined,
		padding: resolvedPadding,
		borderRadius: resolvedRadius,
		background: resolvedBg,
		backgroundSize: viewSettings.bg_type === 'image' ? ( viewSettings.bg_size === 'custom' ? ( viewSettings.bg_size_custom || 'cover' ) : ( viewSettings.bg_size || 'cover' ) ) : undefined,
		backgroundPosition: viewSettings.bg_type === 'image' ? ( viewSettings.bg_position === 'custom' ? ( viewSettings.bg_position_custom || 'center center' ) : ( viewSettings.bg_position || 'center center' ) ) : undefined,
		backgroundRepeat: viewSettings.bg_type === 'image' ? ( viewSettings.bg_repeat || 'no-repeat' ) : undefined,
		backgroundAttachment: viewSettings.bg_type === 'image' ? ( viewSettings.bg_attachment || 'scroll' ) : undefined,
		backgroundOrigin: viewSettings.bg_type === 'image' ? ( viewSettings.bg_origin || 'padding-box' ) : undefined,
		backgroundClip: viewSettings.bg_type === 'image' ? ( viewSettings.bg_clip || 'border-box' ) : undefined,
		color: viewSettings.text_color || undefined,
		textAlign: viewSettings.text_align || undefined,
		boxShadow: resolvedShadow,
		overflow: viewSettings.overflow && viewSettings.overflow !== 'visible' ? viewSettings.overflow : undefined,
		aspectRatio: viewSettings.aspect_ratio && viewSettings.aspect_ratio !== 'auto' ? viewSettings.aspect_ratio : undefined,
		opacity: viewSettings.opacity !== undefined && viewSettings.opacity !== '' ? String( viewSettings.opacity ) : undefined,
		backdropFilter: viewSettings.backdrop_filter_blur ? `blur(${ viewSettings.backdrop_filter_blur }px)` : undefined,
		WebkitBackdropFilter: viewSettings.backdrop_filter_blur ? `blur(${ viewSettings.backdrop_filter_blur }px)` : undefined,
		filter: Number( viewSettings.filter_blur ) > 0 ? `blur(${ viewSettings.filter_blur }px)` : undefined,
		containerType: viewSettings.container_queries ? 'inline-size' : undefined,
		width: viewSettings.width !== undefined && viewSettings.width !== ''
			? ( typeof viewSettings.width === 'object' && viewSettings.width !== null
				? `${viewSettings.width.value ?? 100}${viewSettings.width.unit || '%'}`
				: ( typeof viewSettings.width === 'number' ? `${viewSettings.width}%` : String( viewSettings.width ) ) )
			: undefined,
		minHeight: viewSettings.min_height !== undefined && viewSettings.min_height !== ''
			? ( typeof viewSettings.min_height === 'object' && viewSettings.min_height !== null
				? ( (viewSettings.min_height.value ?? 0) > 0 ? `${viewSettings.min_height.value}${viewSettings.min_height.unit || 'px'}` : undefined )
				: ( Number( viewSettings.min_height ) > 0 ? `${viewSettings.min_height}px` : undefined ) )
			: undefined,
	};

	// Whole-container placement (left / center / right) inside the template.
	const position = viewSettings.position || 'full';
	const maxWidth = cssDimension( viewSettings.max_width );
	if ( viewSettings.content_width === 'boxed' ) {
		containerStyle.width = '100%';
		containerStyle.maxWidth = cssDimension( viewSettings.max_width, '1200px' );
		containerStyle.marginInline = 'auto';
	} else if (['left', 'center', 'right'].includes(position) && maxWidth) {
		containerStyle.width = '100%';
		containerStyle.maxWidth = maxWidth;
		if ('center' === position) {
			containerStyle.margin = '0 auto';
		} else if ('right' === position) {
			containerStyle.marginLeft = 'auto';
		} else {
			containerStyle.marginRight = 'auto';
		}
	}

	// Advanced Spacing (Margin)
	if ( typeof viewSettings.margin === 'object' && viewSettings.margin !== null ) {
		const mu = viewSettings.margin.unit || 'px';
		containerStyle.marginTop = `${viewSettings.margin.top ?? 0}${mu}`;
		containerStyle.marginBottom = `${viewSettings.margin.bottom ?? 0}${mu}`;
		if ( viewSettings.content_width !== 'boxed' && !['left', 'center', 'right'].includes(viewSettings.position) ) {
			containerStyle.marginLeft = `${viewSettings.margin.left ?? 0}${mu}`;
			containerStyle.marginRight = `${viewSettings.margin.right ?? 0}${mu}`;
		}
	}

	// Advanced Position & Z-Index
	if ( viewSettings.position && ['relative', 'absolute', 'fixed', 'sticky'].includes( viewSettings.position ) ) {
		dragStyle.position = viewSettings.position;
	}
	if ( viewSettings.z_index !== undefined && viewSettings.z_index !== '' ) {
		dragStyle.zIndex = Number( viewSettings.z_index );
	}

	// Advanced Transform (Rotate, Scale, Transform Origin, Transition)
	const transformParts = [];
	if ( viewSettings.rotate !== undefined && Number( viewSettings.rotate ) !== 0 ) {
		transformParts.push( `rotate(${ Number( viewSettings.rotate ) }deg)` );
	}
	if ( viewSettings.scale !== undefined && Number( viewSettings.scale ) !== 1 && Number( viewSettings.scale ) > 0 ) {
		transformParts.push( `scale(${ Number( viewSettings.scale ) })` );
	}
	if ( transformParts.length > 0 ) {
		containerStyle.transform = transformParts.join( ' ' );
	}
	if ( viewSettings.transform_origin ) {
		containerStyle.transformOrigin = viewSettings.transform_origin;
	}
	if ( viewSettings.transition_duration ) {
		const dur = typeof viewSettings.transition_duration === 'object'
			? ( viewSettings.transition_duration.value ?? 300 )
			: viewSettings.transition_duration;
		containerStyle.transition = `all ${dur}ms cubic-bezier(0.16, 1, 0.3, 1)`;
	}

	if ( typeof viewSettings.border_width === 'object' && viewSettings.border_width !== null ) {
		containerStyle.borderStyle = viewSettings.border_style && viewSettings.border_style !== 'none' ? viewSettings.border_style : 'solid';
		containerStyle.borderColor = viewSettings.border_color || '#000000';
		containerStyle.borderWidth = `${viewSettings.border_width.top ?? 1}px ${viewSettings.border_width.right ?? 1}px ${viewSettings.border_width.bottom ?? 1}px ${viewSettings.border_width.left ?? 1}px`;
		containerStyle.boxSizing = 'border-box';
	} else {
		const borderWidth = Number(viewSettings.border_width) || 0;
		if (borderWidth > 0) {
			containerStyle.border = `${borderWidth}px ${viewSettings.border_style || 'solid'} ${viewSettings.border_color || '#000000'}`;
			containerStyle.boxSizing = 'border-box';
		}
	}

	const anim = viewSettings.animation || 'none';
	if (anim !== 'none') {
		// Keyframes are namespaced (xsb-fade-in, xsb-slide-up, ...).
		containerStyle.animation = `xsb-motion-${anim} ${Number(viewSettings.animation_duration) || 600}ms ${viewSettings.animation_easing || 'ease'} ${viewSettings.animation_repeat || '1'} both`;
		containerStyle.animationDelay = `${Number(viewSettings.animation_delay) || 0}ms`;
		containerStyle.animationIterationCount = viewSettings.animation_repeat || '1';
	}

	const hoverAnimClass = ( viewSettings.hover_animation && viewSettings.hover_animation !== 'none' )
		? ` xsb-hover-${ viewSettings.hover_animation }`
		: '';

	const [ isHovered, setIsHovered ] = useState( false );
	const isContainerEmpty = inner.length === 0 || inner.every( ( col ) => ! col || col.length === 0 );

	// Hover-state style section values (base settings, so the rule applies at
	// every width exactly like a front-end :hover rule does).
	const hoverDecls = containerHoverDecls( settings );
	const hoverCss = hoverDecls ? `[data-cv-block="${ index }"]:hover{${ hoverDecls }}` : '';

	return (
		<div
			ref={setNodeRef}
			style={dragStyle}
			data-xsb-block-id={ block.id || undefined }
			data-cv-block={index}
			id={viewSettings.css_id || undefined}
			className={`xsb-live-block xsb-live-block--gb-container xsb-layout--${layoutMode}${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isHiddenOnDevice ? ' is-hidden-on-device' : ''}${hoverAnimClass}${viewSettings.css_class ? ' ' + viewSettings.css_class : ''}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(index, { x: e.clientX, y: e.clientY });
			}}
		>
			{viewSettings.custom_css && (
				<style dangerouslySetInnerHTML={ {
					__html: viewSettings.custom_css.replace( /selector/g, `[data-cv-block="${index}"]` )
				} } />
			)}
			{hoverCss && <style dangerouslySetInnerHTML={ { __html: hoverCss } } />}
			{/* Floating Container Action Toolbar */}
			<div className={`xsb-block-toolbar xsb-block-toolbar--container${isFirst ? ' is-first' : ''}`} onClick={(e) => e.stopPropagation()}>
				<div className="xsb-block-toolbar-badge" {...attributes} {...listeners} title={__('Drag container', 'xcodesol-page-builder')}>
					<span className="xsb-toolbar-grip" aria-hidden="true">⠿</span>
					{ layoutMode === 'grid' ? (
						<IconLayoutGrid width={ 14 } height={ 14 } />
					) : (
						<IconLayoutFlex width={ 14 } height={ 14 } />
					) }
					<span className="xsb-block-toolbar-title">{sprintf(__('Container (%s)', 'xcodesol-page-builder'), layoutMode.toUpperCase())}</span>
					{ layoutMode === 'columns' && <span className="xsb-block-toolbar-sub">{widths.map((w) => `${Math.round((w / 12) * 100)}%`).join(' | ')}</span> }
				</div>
				<div className="xsb-block-toolbar-actions">
					{onMove && (
						<>
							<button
								type="button"
								className="xsb-tb-btn"
								title={__('Move Up', 'xcodesol-page-builder')}
								disabled={isFirst}
								onClick={() => onMove(index, -1)}
							>
								<span className="dashicons dashicons-arrow-up-alt2" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn"
								title={__('Move Down', 'xcodesol-page-builder')}
								disabled={isLast}
								onClick={() => onMove(index, 1)}
							>
								<span className="dashicons dashicons-arrow-down-alt2" aria-hidden="true" />
							</button>
						</>
					)}
					{onDuplicate && (
						<button
							type="button"
							className="xsb-tb-btn"
							title={__('Duplicate container', 'xcodesol-page-builder')}
							onClick={() => onDuplicate(index)}
						>
							<span className="dashicons dashicons-admin-page" aria-hidden="true" />
						</button>
					)}
					{onOpenStyle && (
						<button
							type="button"
							className="xsb-tb-btn xsb-tb-btn--style"
							title={__('Container Styles', 'xcodesol-page-builder')}
							onClick={(e) => onOpenStyle(index, { x: e.clientX, y: e.clientY })}
						>
							<span className="dashicons dashicons-admin-customizer" aria-hidden="true" />
						</button>
					)}
					<button
						type="button"
						className="xsb-tb-btn xsb-tb-btn--remove"
						title={__('Delete container', 'xcodesol-page-builder')}
						onClick={() => onRemove(index)}
					>
						<span className="dashicons dashicons-trash" aria-hidden="true" />
					</button>
				</div>
			</div>

			{isHiddenOnDevice && (
				<div className="xsb-hidden-device-notice">
					<span className="dashicons dashicons-hidden" aria-hidden="true" />
					{sprintf(__('Hidden on %s', 'xcodesol-page-builder'), device)}
				</div>
			)}
			<div className={`xsb-container${hasBgVideo ? ' xsb-container--has-video' : ''}${hasBackgroundOverlay ? ' xsb-container--has-overlay' : ''}`} style={containerStyle}>
				{hasBgVideo && <video className="xsb-container-background-video" src={bgVideoUrl} muted loop autoPlay playsInline aria-hidden="true" />}
				{hasBackgroundOverlay && <div className="xsb-container-background-overlay" style={ { backgroundColor: viewSettings.overlay_color, opacity: overlayOpacity, mixBlendMode: viewSettings.overlay_blend_mode || 'normal' } } aria-hidden="true" />}
				{selected && !nestedActive && (
					<ContainerPaddingHandles
						padding={viewSettings.padding}
						onChange={(newPad) => onUpdateSettings(index, 'padding', newPad)}
					/>
				)}
				{selected && !nestedActive && (cols > 1 || !isColumnsMode) && (
					<ContainerGapHandle
						gap={viewSettings.gap}
						onChange={(newGap) => onUpdateSettings(index, 'gap', newGap)}
					/>
				)}

				{selected && !nestedActive && layoutMode === 'grid' && (
					<GridLineOverlay
						template={gridResolved.columns}
						rowGap={modeStyles.rowGap}
						columnGap={modeStyles.columnGap}
						insets={overlayInsets}
						count={flatItems.length}
					/>
				)}

				{isColumnsMode ? (
					Array.from({ length: cols }).map((_, colIndex) => {
						const column = inner[colIndex] || [];
						return (
							<ColumnDropZone
								key={colIndex}
								containerIndex={index}
								colIndex={colIndex}
								width={widths[colIndex]}
								line={lines[colIndex]}
								gridAuto={usePercentWidths}
								colStyle={colStyles[colIndex]}
								blocks={column}
								selectedNested={selectedNested}
								onSelectNested={onSelectNested}
								onUpdateNested={onUpdateNested}
								stylePanel={stylePanel}
								onCloseStylePanel={onCloseStylePanel}
								device={device}
								onStyleDevice={onStyleDevice}
								onAddToColumn={onAddToColumn}
								onOpenWidgetPanel={onOpenWidgetPanel}
								onRemoveFromColumn={onRemoveFromColumn}
								dropGuide={dropGuide}
								activeDragId={activeDragId}
								onMoveNested={onMoveNested}
								onDuplicateNested={onDuplicateNested}
								onOpenStyleNested={onOpenStyleNested}
								widths={widths}
								onWidthsChange={(next) => onUpdateSettings(index, 'column_widths', next)}
							/>
						);
					})
				) : (
					<ContainerFlowZone
						containerIndex={index}
						layoutMode={layoutMode}
						layoutStyle={modeStyles}
						items={flatItems}
						viewSettings={viewSettings}
						selectedNested={selectedNested}
						onSelectNested={onSelectNested}
						onUpdateNested={onUpdateNested}
						stylePanel={stylePanel}
						onCloseStylePanel={onCloseStylePanel}
						device={device}
						onStyleDevice={onStyleDevice}
						onOpenWidgetPanel={onOpenWidgetPanel}
						onRemoveFromColumn={onRemoveFromColumn}
						dropGuide={dropGuide}
						activeDragId={activeDragId}
						onMoveNested={onMoveNested}
						onDuplicateNested={onDuplicateNested}
						onOpenStyleNested={onOpenStyleNested}
					/>
				)}
			</div>

			{(selected || isHovered) && (
				<div className="xsb-container-quick-add-wrap" onClick={(e) => e.stopPropagation()}>
					<button
						type="button"
						className="xsb-container-quick-add-btn"
						title={__('Add a new container below', 'xcodesol-page-builder')}
						onClick={() => onAddContainer && onAddContainer(index)}
					>
						<IconPlus width={12} height={12} />
						<span>{__('Add Container', 'xcodesol-page-builder')}</span>
					</button>
				</div>
			)}

			<span className="xsb-live-block-order">{index + 1}</span>
			{selected && !nestedActive && stylePanel.open && hasStylePopover(block.type) && (
				<StylePopover
					type={block.type}
					label={__('Container', 'xcodesol-page-builder')}
					settings={settings}
					style={stylePanelPosition(stylePanel.point)}
					onChange={(key, value) => onUpdateSettings(index, key, value)}
					onClose={onCloseStylePanel}
					onDeviceChange={onStyleDevice}
				/>
			)}
		</div>
	);
}

/**
 * Resolve a per-column style entry ({ background, padding_*, border_*,
 * box_shadow, align_v, align_h }) into the inline style applied to a column.
 *
 * @param {Object|undefined} colStyle Per-column style entry.
 * @return {{ style: Object, boxStyled: boolean }|null} Inline style plus a
 *         flag for the editor's styled look, or null when nothing is set.
 */
function resolveColumnStyle(colStyle) {
	if (!colStyle || typeof colStyle !== 'object') {
		return null;
	}

	const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
	const pad = {
		top: num(colStyle.padding_top),
		right: num(colStyle.padding_right),
		bottom: num(colStyle.padding_bottom),
		left: num(colStyle.padding_left),
	};
	const background = colStyle.background || '';
	const radius = num(colStyle.border_radius);
	const borderWidth = num(colStyle.border_width);
	const shadow = SHADOW_VALUES[colStyle.box_shadow || 'none'] || '';
	const anyPad = pad.top > 0 || pad.right > 0 || pad.bottom > 0 || pad.left > 0;
	const alignV = ['top', 'center', 'bottom'].includes(colStyle.align_v) ? colStyle.align_v : '';
	const alignH = ['left', 'center', 'right'].includes(colStyle.align_h) ? colStyle.align_h : '';
	const boxStyled = !!(background || radius > 0 || borderWidth > 0 || shadow || anyPad);
	const aligned = !!(alignV || alignH);

	if (!boxStyled && !aligned) {
		return null;
	}

	const style = {
		padding: `${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px`,
		background: background || undefined,
		borderRadius: radius ? `${radius}px` : undefined,
		boxShadow: shadow || undefined,
	};

	if (borderWidth > 0) {
		style.border = `${borderWidth}px ${colStyle.border_style || 'solid'} ${colStyle.border_color || '#000000'}`;
	}

	if (aligned) {
		style.display = 'flex';
		style.flexDirection = 'column';
		if (alignV) {
			style.justifyContent = 'center' === alignV ? 'center' : 'bottom' === alignV ? 'flex-end' : 'flex-start';
		}
		if (alignH) {
			style.alignItems = 'center' === alignH ? 'center' : 'right' === alignH ? 'flex-end' : 'flex-start';
			style.textAlign = alignH;
		}
	}

	return { style, boxStyled };
}

/**
 * A droppable column inside a container.
 */
function ColumnDropZone({
	containerIndex,
	colIndex,
	blocks,
	width,
	line,
	gridAuto = false,
	widths = [],
	onWidthsChange,
	colStyle,
	selectedNested,
	onSelectNested,
	onUpdateNested,
	stylePanel,
	onCloseStylePanel,
	onAddToColumn,
	onOpenWidgetPanel,
	onRemoveFromColumn,
	dropGuide,
	activeDragId,
	device = 'desktop',
	onStyleDevice,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `col-${containerIndex}-${colIndex}`,
		data: { containerIndex, colIndex },
	});

	const resolved = resolveColumnStyle(colStyle);

	// Gutter drag: transfer grid units between the two columns that meet at
	// this boundary. 5% snapping by default (0.6 of a 12-unit grid), Shift for
	// free stepping. Every move patches the container's column_widths so the
	// ratio control follows live; history debouncing keeps undo to one step.
	const startGutterDrag = (e) => {
		if (!onWidthsChange || !Array.isArray(widths) || colIndex < 1) {
			return;
		}
		e.stopPropagation();
		e.preventDefault();
		const containerEl = e.currentTarget.closest('.xsb-container');
		if (!containerEl) {
			return;
		}
		const rect = containerEl.getBoundingClientRect();
		if (!rect.width) {
			return;
		}

		const startWidths = widths.map(Number);
		const leftIndex = colIndex - 1;
		const pairTotal = startWidths[leftIndex] + startWidths[colIndex];
		const leftUnits = startWidths.slice(0, leftIndex).reduce((sum, w) => sum + w, 0);

		const onMouseMove = (ev) => {
			const step = ev.shiftKey ? 0.05 : 0.6; // Shift = free resize.
			const raw = ((ev.clientX - rect.left) / rect.width) * 12 - leftUnits;
			const snapped = Math.round(raw / step) * step;
			const next = Math.max(0.5, Math.min(pairTotal - 0.5, snapped));
			onWidthsChange(
				startWidths.map((w, i) => {
					if (i === leftIndex) return Math.round(next * 100) / 100;
					if (i === colIndex) return Math.round((pairTotal - next) * 100) / 100;
					return w;
				})
			);
		};

		const onMouseUp = () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	};

	// Insertion line inside this column (slot is relative to the column's
	// widgets without the dragged one; shift it back when the dragged widget
	// still occupies an earlier spot in the rendered list).
	const colGuide = dropGuide && dropGuide.kind === 'col' && dropGuide.ci === containerIndex && dropGuide.cj === colIndex ? dropGuide : null;
	let guideAt = null;
	if (colGuide) {
		let draggedPos = -1;
		blocks.forEach((_, blockIndex) => {
			if (activeDragId === `nested-${containerIndex}-${colIndex}-${blockIndex}`) {
				draggedPos = blockIndex;
			}
		});
		guideAt = colGuide.slot + (draggedPos >= 0 && draggedPos <= colGuide.slot ? 1 : 0);
	}

	return (
		<div
			ref={setNodeRef}
			data-col-id={`${containerIndex}-${colIndex}`}
			className={`xsb-container-col${resolved?.boxStyled ? ' xsb-container-col--styled' : ''}${isOver ? ' is-over' : ''}${colGuide ? ' is-guide' : ''}`}
			style={{ ...(gridAuto ? {} : { gridColumn: `${line} / span ${width}` }), ...(resolved?.style || {}) }}
		>
			{onWidthsChange && colIndex > 0 && (
				<div
					className="xsb-col-gutter-handle"
					onMouseDown={startGutterDrag}
					title={__('Drag to resize columns (Shift: free resize)', 'xcodesol-page-builder')}
					aria-label={__('Resize columns', 'xcodesol-page-builder')}
				/>
			)}
			{blocks.length === 0 && (
				<DropHint
					onClick={(e) => {
						e.stopPropagation();
						if (onSelectNested) {
							onSelectNested(containerIndex, colIndex, -1);
						}
						if (onOpenWidgetPanel) onOpenWidgetPanel();
					}}
				/>
			)}
			{colGuide && blocks.length === 0 && <DropGuideLine />}
			<SortableContext
				items={blocks.map((_, blockIndex) => `nested-${containerIndex}-${colIndex}-${blockIndex}`)}
				strategy={verticalListSortingStrategy}
			>
				{blocks.map((block, blockIndex) => (
					<Fragment key={`n-${blockIndex}`}>
						{colGuide && guideAt === blockIndex && <DropGuideLine />}
						<NestedBlock
							block={block}
							containerIndex={containerIndex}
							colIndex={colIndex}
							blockIndex={blockIndex}
							selected={
								!!(selectedNested &&
									selectedNested.ci === containerIndex &&
									selectedNested.cj === colIndex &&
									selectedNested.bi === blockIndex)
							}
							selectedNested={ selectedNested }
							onSelect={onSelectNested}
							onRemove={onRemoveFromColumn}
							onUpdateSettings={onUpdateNested}
							stylePanel={stylePanel}
							onCloseStylePanel={onCloseStylePanel}
							device={device}
							onStyleDevice={onStyleDevice}
							onMoveNested={onMoveNested}
							onDuplicateNested={onDuplicateNested}
							onOpenStyleNested={onOpenStyleNested}
							onOpenWidgetPanel={onOpenWidgetPanel}
							dropGuide={dropGuide}
							isLastInColumn={blockIndex === blocks.length - 1}
							placementStyle={childPlacementStyle(block.settings || {}, 'columns')}
						/>
					</Fragment>
				))}
				{colGuide && blocks.length > 0 && guideAt === blocks.length && <DropGuideLine />}
			</SortableContext>
		</div>
	);
}

/**
 * Render a single block as a realistic dummy preview. Draggable for
 * reordering, selectable, removable, and shows an inline style popover.
 *
 * @param {Object} props
 * @param {Object} props.block
 * @param {number} props.index Global layout index (for selection).
 * @param {boolean} props.selected
 * @param {Function} props.onSelect
 * @param {Function} props.onRemove
 * @param {Function} props.onUpdateSettings (index, key, value) => void.
 * @param {Object} props.callbacks Container add/remove callbacks.
 * @param {Object|null} props.selectedNested
 * @param {Function} props.onSelectNested
 * @param {Function} props.onUpdateNested
 */
function BlockPreview({
	block,
	index,
	selected,
	onSelect,
	onRemove,
	onUpdateSettings,
	callbacks,
	selectedNested,
	onSelectNested,
	onUpdateNested,
	stylePanel,
	onCloseStylePanel,
	dropGuide,
	activeDragId,
	device = 'desktop',
	onStyleDevice,
	onMove,
	onDuplicate,
	onOpenStyle,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
	isFirst,
	isLast,
}) {
	const meta = getBlockMeta(block.type);
	const settings = { ...(meta.defaults || {}), ...(block.settings || {}) };
	const bodySettings = device !== 'desktop'
		? effectiveForDevice(settings, device)
		: settings;

	const isHiddenOnDevice = (
		(device === 'desktop' && ( !!bodySettings.hide_on_desktop || !!bodySettings.hide_desktop )) ||
		(device === 'tablet' && ( !!bodySettings.hide_on_tablet || !!bodySettings.hide_tablet )) ||
		(device === 'mobile' && ( !!bodySettings.hide_on_mobile || !!bodySettings.hide_mobile ))
	);

	if (block.type === 'xcopb/gb-container' || block.type === 'xcopb/container' || block.type === 'xcosb/gb-container') {
		return (
			<ContainerBlock
				block={block}
				settings={settings}
				index={index}
				selected={selected}
				onSelect={onSelect}
				onRemove={onRemove}
				onUpdateSettings={onUpdateSettings}
				selectedNested={selectedNested}
				onSelectNested={onSelectNested}
				onUpdateNested={onUpdateNested}
				stylePanel={stylePanel}
				onCloseStylePanel={onCloseStylePanel}
				device={device}
				onStyleDevice={onStyleDevice}
				onAddToColumn={callbacks.onAddToColumn}
				onOpenWidgetPanel={callbacks.onOpenWidgetPanel}
				onRemoveFromColumn={callbacks.onRemoveFromColumn}
				dropGuide={dropGuide}
				activeDragId={activeDragId}
					onMove={onMove}
				onDuplicate={onDuplicate}
				onAddContainer={callbacks.onAddContainer}
				onOpenStyle={onOpenStyle}
				onMoveNested={onMoveNested}
				onDuplicateNested={onDuplicateNested}
				onOpenStyleNested={onOpenStyleNested}
				isFirst={isFirst}
				isLast={isLast}
			/>
		);
	}

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `cv-${index}`,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		...positionInlineCss(bodySettings),
		...transformInlineCss(bodySettings),
	};

	// A Sale Badge with a corner placement overlays the card root on the live
	// page. Its preview block collapses (no slot / no box) and the badge is
	// positioned by the public-style corner classes against the zone body.
	const isFloatingBadge = block.type === 'xcosb/cd-badge' &&
		bodySettings.position && bodySettings.position !== 'inline';

	return (
		<div
			ref={setNodeRef}
			style={style}
			data-xsb-block-id={ block.id || undefined }
			data-cv-block={index}
			id={settings.css_id || undefined}
			className={`xsb-live-block xsb-live-block--${block.type.replace(/\//g, '-')}${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isFloatingBadge ? ' is-badge-float' : ''}${isHiddenOnDevice ? ' is-hidden-on-device' : ''}${settings.css_class ? ' ' + settings.css_class : ''}`}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(index, { x: e.clientX, y: e.clientY });
			}}
		>
			{/* Floating Action Bar */}
			<div className={`xsb-block-toolbar${isFirst ? ' is-first' : ''}`} onClick={(e) => e.stopPropagation()}>
				<div className="xsb-block-toolbar-badge" {...attributes} {...listeners} title={__('Drag to reorder', 'xcodesol-page-builder')}>
					<span className="xsb-toolbar-grip" aria-hidden="true">⠿</span>
					<span className={`dashicons ${meta.icon || 'dashicons-admin-generic'}`} aria-hidden="true" />
					<span className="xsb-block-toolbar-title">{meta.label}</span>
				</div>
				<div className="xsb-block-toolbar-actions">
					{onMove && (
						<>
							<button
								type="button"
								className="xsb-tb-btn"
								title={__('Move Up', 'xcodesol-page-builder')}
								disabled={isFirst}
								onClick={() => onMove(index, -1)}
							>
								<span className="dashicons dashicons-arrow-up-alt2" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="xsb-tb-btn"
								title={__('Move Down', 'xcodesol-page-builder')}
								disabled={isLast}
								onClick={() => onMove(index, 1)}
							>
								<span className="dashicons dashicons-arrow-down-alt2" aria-hidden="true" />
							</button>
						</>
					)}
					{onDuplicate && (
						<button
							type="button"
							className="xsb-tb-btn"
							title={__('Duplicate block', 'xcodesol-page-builder')}
							onClick={() => onDuplicate(index)}
						>
							<span className="dashicons dashicons-admin-page" aria-hidden="true" />
						</button>
					)}
					{hasStylePopover(block.type) && onOpenStyle && (
						<button
							type="button"
							className="xsb-tb-btn xsb-tb-btn--style"
							title={__('Edit Styles', 'xcodesol-page-builder')}
							onClick={(e) => onOpenStyle(index, { x: e.clientX, y: e.clientY })}
						>
							<span className="dashicons dashicons-admin-customizer" aria-hidden="true" />
						</button>
					)}
					<button
						type="button"
						className="xsb-tb-btn xsb-tb-btn--remove"
						title={__('Delete block', 'xcodesol-page-builder')}
						onClick={() => onRemove(index)}
					>
						<span className="dashicons dashicons-trash" aria-hidden="true" />
					</button>
				</div>
			</div>

			{isHiddenOnDevice && (
				<div className="xsb-hidden-device-notice">
					<span className="dashicons dashicons-hidden" aria-hidden="true" />
					{sprintf(__('Hidden on %s', 'xcodesol-page-builder'), device)}
				</div>
			)}
			{renderBlockBody(block, bodySettings, meta, device)}
			<span className="xsb-live-block-order">{index + 1}</span>
			{selected && stylePanel.open && hasStylePopover(block.type) && (
				<StylePopover
					type={block.type}
					label={meta.label}
					settings={settings}
					style={stylePanelPosition(stylePanel.point)}
					onChange={(key, value) => onUpdateSettings(index, key, value)}
					onClose={onCloseStylePanel}
					onDeviceChange={onStyleDevice}
				/>
			)}
		</div>
	);
}

/**
 * Droppable zone container on the canvas.
 *
 * @param {Object} props
 * @param {string} props.zoneId
 * @param {string} props.label
 * @param {Array}  props.blocks      Blocks (with global indices) in this zone.
 * @param {boolean} props.isActive    Whether a drag is in progress.
 */
function ZoneContainer({
	zoneId,
	label,
	blocks,
	isActive,
	selectedIndex,
	onSelect,
	onRemove,
	onUpdateSettings,
	selectedNested,
	onSelectNested,
	onUpdateNested,
	stylePanel,
	onCloseStylePanel,
	callbacks,
	dropGuide,
	activeDragId,
	showEmptyHint = true,
	showEndHint = true,
	device = 'desktop',
	onStyleDevice,
	onMove,
	onDuplicate,
	onOpenStyle,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `zone-${zoneId}`,
		data: { zoneId },
	});

	// Insertion line for top-level drops in this zone. The guide slot is
	// relative to the zone's blocks without the dragged one; nudge it past
	// the dragged block when it still sits earlier in the rendered list.
	const zoneGuide = dropGuide && dropGuide.kind === 'top' && dropGuide.zoneId === zoneId ? dropGuide : null;
	let guideAt = null;
	if (zoneGuide) {
		let draggedPos = -1;
		blocks.forEach((entry, i) => {
			if (activeDragId === `cv-${entry.index}` || activeDragId === `block-${entry.index}`) {
				draggedPos = i;
			}
		});
		guideAt = zoneGuide.slot + (draggedPos >= 0 && draggedPos <= zoneGuide.slot ? 1 : 0);
	}

	return (
		<div
			ref={setNodeRef}
			data-zone-root={zoneId}
			className={`xsb-live-zone xsb-live-zone--${zoneId}${showEmptyHint || showEndHint ? ' is-final-page-zone' : ''}${isOver ? ' is-over' : ''}${isActive ? ' is-active' : ''}`}
		>
			<div className="xsb-live-zone-label">
				<span className="xsb-live-zone-label-text">{label}</span>
				<span className="xsb-live-zone-label-count">{blocks.length}</span>
			</div>
			<div className="xsb-live-zone-body">
				{blocks.length === 0 && showEmptyHint && <DropHint onClick={ () => callbacks?.onOpenWidgetPanel && callbacks.onOpenWidgetPanel() } />}
				{zoneGuide && blocks.length === 0 && <DropGuideLine />}
				<SortableContext
					items={blocks.map((entry) => `cv-${entry.index}`)}
					strategy={verticalListSortingStrategy}
				>
					{blocks.map((entry, blockIndex) => (
						<Fragment key={`cv-${entry.index}`}>
							{zoneGuide && guideAt === blockIndex && <DropGuideLine />}
							<BlockPreview
								block={entry.block}
								index={entry.index}
								selected={selectedIndex === entry.index && !selectedNested}
								onSelect={onSelect}
								onRemove={onRemove}
								onUpdateSettings={onUpdateSettings}
								selectedNested={selectedNested}
								onSelectNested={onSelectNested}
								onUpdateNested={onUpdateNested}
								stylePanel={stylePanel}
								onCloseStylePanel={onCloseStylePanel}
								device={device}
								onStyleDevice={onStyleDevice}
								callbacks={callbacks}
								dropGuide={dropGuide}
								activeDragId={activeDragId}
								onMove={onMove}
								onDuplicate={onDuplicate}
								onOpenStyle={onOpenStyle}
								onMoveNested={onMoveNested}
								onDuplicateNested={onDuplicateNested}
								onOpenStyleNested={onOpenStyleNested}
								isFirst={blockIndex === 0}
								isLast={blockIndex === blocks.length - 1}
							/>
						</Fragment>
					))}
					{zoneGuide && blocks.length > 0 && guideAt === blocks.length && <DropGuideLine />}
				</SortableContext>
				{blocks.length > 0 && showEndHint && <DropHint compact onClick={ () => callbacks?.onOpenWidgetPanel && callbacks.onOpenWidgetPanel() } />}
			</div>
		</div>
	);
}

/**
 * Live preview canvas.
 */
function PreviewCanvas({
	structure,
	layout,
	zoneMap,
	selectedIndex,
	onSelect,
	isDragging,
	callbacks,
	onRemove,
	onUpdateSettings,
	selectedNested,
	onSelectNested,
	onUpdateNested,
	stylePanel,
	onCloseStylePanel,
	dropGuide,
	activeDragId,
	showEmptyHint = true,
	device = 'desktop',
	pageSettings = {},
	globalSettings = {},
	onStyleDevice,
	onMove,
	onDuplicate,
	onOpenStyle,
	onMoveNested,
	onDuplicateNested,
	onOpenStyleNested,
}) {
	const defaultStylePanel = stylePanel || { open: false, point: null };
	const closeStylePanel = onCloseStylePanel || (() => { });
	const hasStructure = structure && structure.zones && structure.zones.length > 0;

	let cssClass = 'xsb-preview-canvas-live';
	if (dropGuide) {
		cssClass += ' has-guide';
	}
	if (structure) {
		cssClass += ` xsb-structure-${structure.id}`;
	}
	if (device) {
		cssClass += ` is-device-${device}`;
	}

	const cb = callbacks || {};
	const pageStyle = {};
	[ 'margin', 'padding' ].forEach( ( name ) => {
		const box = pageSettings?.[ name ];
		if ( ! box ) return;
		const unit = box.unit || 'px';
		[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
			const value = box[ side ] ?? box.values?.[ side ];
			if ( value !== '' && value !== undefined && value !== null ) pageStyle[ `${ name }${ side[ 0 ].toUpperCase() }${ side.slice( 1 ) }` ] = `${ value }${ unit }`;
		} );
	} );
	const extraClasses = String( pageSettings?.css_class || '' ).split( /\s+/ ).filter( ( value ) => /^[a-zA-Z0-9_-]+$/.test( value ) ).join( ' ' );
	const pageCustomCss = String( pageSettings?.custom_css || '' ).replace( /<\/style/gi, '' ).replace( /\bselector\b/g, '.xsb-preview-canvas-live' );
	const globalColors = globalSettings?.global_colors || {};
	const globalFonts = globalSettings?.global_fonts || {};
	const globalTypography = globalSettings?.typography || {};
	const globalButtonStyle = globalSettings?.button_style || {};
	const siteBackgroundImage = globalSettings?.background_image || {};
	const siteBackgroundStyle = globalSettings?.background_image_style || {};
	pageStyle.backgroundColor = globalColors.background || undefined;
	if ( siteBackgroundImage.url ) {
		const overlay = siteBackgroundStyle.overlay || '';
		const opacity = Math.max( 0, Math.min( 100, Number( siteBackgroundStyle.overlay_opacity || 0 ) ) ) / 100;
		const rgbaOverlay = ( color, alpha ) => {
			const hex = color.match( /^#([\da-f]{3}|[\da-f]{6})$/i );
			if ( hex ) { let value = hex[1]; if ( value.length === 3 ) value = value.split( '' ).map( ( digit ) => digit + digit ).join( '' ); return `rgba(${ parseInt( value.slice( 0, 2 ), 16 ) },${ parseInt( value.slice( 2, 4 ), 16 ) },${ parseInt( value.slice( 4, 6 ), 16 ) },${ alpha })`; }
			const rgb = color.match( /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i );
			return rgb ? `rgba(${ rgb[1] },${ rgb[2] },${ rgb[3] },${ alpha })` : '';
		};
		const overlayColor = opacity && overlay ? rgbaOverlay( overlay, opacity ) : '';
		pageStyle.backgroundImage = `${ overlayColor ? `linear-gradient(${ overlayColor },${ overlayColor }),` : '' }url("${ String( siteBackgroundImage.url ).replace( /["\\]/g, '' ) }")`;
		pageStyle.backgroundSize = siteBackgroundStyle.size || 'cover';
		pageStyle.backgroundPosition = siteBackgroundStyle.position || 'center center';
		pageStyle.backgroundRepeat = siteBackgroundStyle.repeat || 'no-repeat';
		pageStyle.backgroundAttachment = siteBackgroundStyle.attachment || 'scroll';
	}
	pageStyle.color = globalColors.text || undefined;
	pageStyle.fontFamily = globalFonts.body || undefined;
	pageStyle.fontSize = globalTypography.body_size ? `${ globalTypography.body_size }px` : undefined;
	pageStyle.fontWeight = globalTypography.body_weight || undefined;
	pageStyle.lineHeight = globalTypography.line_height || undefined;
	const rootVariables = { '--xcopb-primary': globalColors.primary || '#6c63ff', '--xcopb-secondary': globalColors.secondary || '#292d50', '--xcopb-text': globalColors.text || '#172033', '--xcopb-accent': globalColors.accent || '#18a0fb' };
	( globalSettings?.custom_colors || [] ).forEach( ( color ) => { const slug = String( color?.name || '' ).toLowerCase().trim().replace( /[^a-z0-9_-]+/g, '-' ); if ( slug && color?.value ) rootVariables[ `--xcopb-custom-${ slug }` ] = color.value; } );
	const cssGradient = ( gradient ) => gradient?.colorA && gradient?.colorB ? gradient.type === 'radial' ? `radial-gradient(circle,${ gradient.colorA } ${ gradient.posA ?? 0 }%,${ gradient.colorB } ${ gradient.posB ?? 100 }%)` : `linear-gradient(${ gradient.angle ?? 90 }deg,${ gradient.colorA } ${ gradient.posA ?? 0 }%,${ gradient.colorB } ${ gradient.posB ?? 100 }%)` : '';
	const cssBox = ( value, fallback = 0 ) => typeof value === 'object' && value ? [ 'top', 'right', 'bottom', 'left' ].map( ( side ) => `${ Number( value[ side ] ?? fallback ) || 0 }px` ).join( ' ' ) : `${ Number( value ?? fallback ) || 0 }px`;
	const buttonPadding = globalButtonStyle.padding && typeof globalButtonStyle.padding === 'object' ? `padding:${ cssBox( globalButtonStyle.padding ) }!important` : `padding:${ Number( globalButtonStyle.padding_y ?? 12 ) }px ${ Number( globalButtonStyle.padding_x ?? 24 ) }px!important`;
	const buttonDeclarations = [ globalButtonStyle.text ? `color:${ globalButtonStyle.text }!important` : '', globalButtonStyle.background ? `background-color:${ globalButtonStyle.background }!important` : '', globalButtonStyle.gradient_enabled && cssGradient( globalButtonStyle.gradient ) ? `background-image:${ cssGradient( globalButtonStyle.gradient ) }!important` : '', `border-radius:${ cssBox( globalButtonStyle.radius, 6 ) }!important`, buttonPadding, globalButtonStyle.font_size !== undefined ? `font-size:${ globalButtonStyle.font_size }px!important` : '', `border-width:${ cssBox( globalButtonStyle.border_width ) }!important`, globalButtonStyle.border_style ? `border-style:${ globalButtonStyle.border_style }!important` : '', globalButtonStyle.border_color ? `border-color:${ globalButtonStyle.border_color }!important` : '', globalButtonStyle.shadow && globalButtonStyle.shadow !== 'none' ? `box-shadow:${ globalButtonStyle.shadow }!important` : '' ].filter( Boolean ).join( ';' );
	const buttonHoverDeclarations = [ globalButtonStyle.hover_text ? `color:${ globalButtonStyle.hover_text }!important` : '', globalButtonStyle.hover_background ? `background-color:${ globalButtonStyle.hover_background }!important` : '', globalButtonStyle.hover_gradient_enabled && cssGradient( globalButtonStyle.hover_gradient ) ? `background-image:${ cssGradient( globalButtonStyle.hover_gradient ) }!important` : '' ].filter( Boolean ).join( ';' );
	const sharedStyleRules = `${ buttonDeclarations ? `.xsb-preview-canvas-live .xsb-button,.xsb-preview-canvas-live .xcopb-button,.xsb-preview-canvas-live .wp-block-button__link{${ buttonDeclarations }}` : '' }${ buttonHoverDeclarations ? `.xsb-preview-canvas-live .xsb-button:hover,.xsb-preview-canvas-live .xcopb-button:hover,.xsb-preview-canvas-live .wp-block-button__link:hover{${ buttonHoverDeclarations }}` : '' }${ globalTypography.paragraph_spacing !== undefined ? `.xsb-preview-canvas-live p{margin-bottom:${ globalTypography.paragraph_spacing }px}` : '' }`;
	const scopedGlobalCss = String( globalSettings?.custom_css || '' ).replace( /<\/style/gi, '' ).replace( /([^{}]+)\{([^{}]*)\}/g, ( rule, rawSelectors, declarations ) => {
		const selectors = rawSelectors.trim();
		if ( ! selectors || selectors.startsWith( '@' ) ) return rule;
		return selectors.split( ',' ).map( ( selector ) => {
			const clean = selector.trim().replace( /^(?:html|body|:root)\b/, '.xsb-preview-canvas-live' );
			return `${ clean.startsWith( '.xsb-preview-canvas-live' ) ? '' : '.xsb-preview-canvas-live ' }${ clean }`;
		} ).join( ', ' ) + `{${ declarations }}`;
	} );
	const pageRootProps = { id: pageSettings?.css_id || undefined, className: `${ cssClass }${ extraClasses ? ` ${ extraClasses }` : '' }`, style: { ...pageStyle, ...rootVariables } };

	if (!hasStructure) {
		return (
			<div { ...pageRootProps }>
				{ ( pageCustomCss || scopedGlobalCss || globalFonts.heading || sharedStyleRules ) && <style>{ `${ scopedGlobalCss || '' }${ pageCustomCss || '' }${ globalFonts.heading ? `.xsb-preview-canvas-live h1,.xsb-preview-canvas-live h2,.xsb-preview-canvas-live h3,.xsb-preview-canvas-live h4,.xsb-preview-canvas-live h5,.xsb-preview-canvas-live h6{font-family:${ globalFonts.heading }}` : '' }${ sharedStyleRules }` }</style> }
				{layout.length === 0 ? (
					<div className="xsb-live-empty xsb-live-empty--rich">
						<div className="xsb-empty-illustration" aria-hidden="true">
							<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="6" y="10" width="48" height="40" rx="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
								<rect x="14" y="18" width="32" height="6" rx="3" fill="currentColor" opacity="0.25" />
								<rect x="14" y="28" width="20" height="4" rx="2" fill="currentColor" opacity="0.2" />
								<rect x="14" y="36" width="14" height="6" rx="3" fill="#6366f1" />
							</svg>
						</div>
						<h3 className="xsb-empty-title">{__('Drop elements here or start with a layout', 'xcodesol-page-builder')}</h3>
						<p className="xsb-empty-desc">{__('Drag elements from the left panel or click a pre-configured section below to kickstart your page.', 'xcodesol-page-builder')}</p>
						<div className="xsb-empty-starters">
							<button
								type="button"
								className="xsb-starter-pill"
								onClick={() => cb.onAddPreset && cb.onAddPreset([
									{
										type: 'xcopb/gb-banner',
										settings: {
											title: __('Hero Headline', 'xcodesol-page-builder'),
											subtitle: __('Build fast, modern WordPress pages with visual drag & drop controls.', 'xcodesol-page-builder'),
											button_text: __('Get Started', 'xcodesol-page-builder'),
											background: '#4f46e5',
											text_color: '#ffffff',
											padding: 64,
										}
									}
								])}
							>
								<span className="xsb-starter-pill-icon">⚡</span>
								<span>{__('Hero Banner', 'xcodesol-page-builder')}</span>
							</button>
							<button
								type="button"
								className="xsb-starter-pill"
								onClick={() => cb.onAddPreset && cb.onAddPreset([
									{
										type: 'xcopb/gb-container',
										settings: { columns: 2, column_widths: [6, 6], gap: 24, padding: 28 },
										inner: [
											[
												{ type: 'xcopb/gb-heading', settings: { title: __('Flexible Two Columns', 'xcodesol-page-builder'), tag: 'h2' } },
												{ type: 'xcopb/gb-text', settings: { content: __('Combine headings, text, buttons, and media effortlessly in responsive columns.', 'xcodesol-page-builder') } },
												{ type: 'xcopb/gb-button', settings: { text: __('Learn More', 'xcodesol-page-builder'), bg_color: '#4f46e5' } }
											],
											[
												{ type: 'xcopb/gb-banner', settings: { title: __('Visual Canvas', 'xcodesol-page-builder'), subtitle: __('Responsive live editing', 'xcodesol-page-builder'), padding: 44, background: '#1e1b4b' } }
											]
										]
									}
								])}
							>
								<span className="xsb-starter-pill-icon">⚏</span>
								<span>{__('Two Columns', 'xcodesol-page-builder')}</span>
							</button>
							<button
								type="button"
								className="xsb-starter-pill"
								onClick={() => cb.onAddPreset && cb.onAddPreset([
									{
										type: 'xcopb/gb-container',
										settings: { columns: 3, column_widths: [4, 4, 4], gap: 20, padding: 24 },
										inner: [
											[
												{ type: 'xcopb/gb-heading', settings: { title: __('Feature 1', 'xcodesol-page-builder'), tag: 'h3' } },
												{ type: 'xcopb/gb-text', settings: { content: __('Custom styling and responsive spacing.', 'xcodesol-page-builder') } }
											],
											[
												{ type: 'xcopb/gb-heading', settings: { title: __('Feature 2', 'xcodesol-page-builder'), tag: 'h3' } },
												{ type: 'xcopb/gb-text', settings: { content: __('Tablet and mobile breakpoint fine-tuning.', 'xcodesol-page-builder') } }
											],
											[
												{ type: 'xcopb/gb-heading', settings: { title: __('Feature 3', 'xcodesol-page-builder'), tag: 'h3' } },
												{ type: 'xcopb/gb-text', settings: { content: __('Condition rules and WooCommerce support.', 'xcodesol-page-builder') } }
											]
										]
									}
								])}
							>
								<span className="xsb-starter-pill-icon">▦</span>
								<span>{__('Three Columns', 'xcodesol-page-builder')}</span>
							</button>
							<button
								type="button"
								className="xsb-starter-pill"
								onClick={() => cb.onAddPreset && cb.onAddPreset([
									{
										type: 'xcopb/gb-container',
										settings: { columns: 2, column_widths: [6, 6], gap: 20, padding: 24 },
										inner: [[], []]
									}
								])}
							>
								<span className="xsb-starter-pill-icon">□</span>
								<span>{__('Blank Container', 'xcodesol-page-builder')}</span>
							</button>
						</div>
					</div>
				) : (
					<SortableContext
						items={layout.map((_, index) => `cv-${index}`)}
						strategy={verticalListSortingStrategy}
					>
						<div className="xsb-live-flat">
							{layout.map((block, index) => (
								<BlockPreview
									key={`cv-${index}`}
									block={block}
									index={index}
									selected={selectedIndex === index && !selectedNested}
									onSelect={onSelect}
									onRemove={onRemove}
									onUpdateSettings={onUpdateSettings}
									selectedNested={selectedNested}
									onSelectNested={onSelectNested}
									onUpdateNested={onUpdateNested}
									stylePanel={defaultStylePanel}
									onCloseStylePanel={closeStylePanel}
									device={device}
									onStyleDevice={onStyleDevice}
									callbacks={cb}
									dropGuide={dropGuide}
									activeDragId={activeDragId}
									onMove={onMove}
									onDuplicate={onDuplicate}
									onOpenStyle={onOpenStyle}
									onMoveNested={onMoveNested}
									onDuplicateNested={onDuplicateNested}
									onOpenStyleNested={onOpenStyleNested}
									isFirst={index === 0}
									isLast={index === layout.length - 1}
								/>
							))}
						</div>
					</SortableContext>
				)}
			</div>
		);
	}

	// Group the flat layout by zone.
	const zoneBundles = {};
	structure.zones.forEach((z) => {
		zoneBundles[z.id] = [];
	});

	layout.forEach((block, index) => {
		const zoneId = (zoneMap && zoneMap[index]) || '';
		if (!zoneBundles[zoneId]) {
			zoneBundles[zoneId] = [];
		}
		zoneBundles[zoneId].push({ block, index });
	});

	return (
		<div { ...pageRootProps }>
			{ ( pageCustomCss || scopedGlobalCss || globalFonts.heading || sharedStyleRules ) && <style>{ `${ scopedGlobalCss || '' }${ pageCustomCss || '' }${ globalFonts.heading ? `.xsb-preview-canvas-live h1,.xsb-preview-canvas-live h2,.xsb-preview-canvas-live h3,.xsb-preview-canvas-live h4,.xsb-preview-canvas-live h5,.xsb-preview-canvas-live h6{font-family:${ globalFonts.heading }}` : '' }${ sharedStyleRules }` }</style> }
			{structure.zones.map((zone, zoneIndex) => (
				<ZoneContainer
					key={zone.id}
					zoneId={zone.id}
					label={zone.label}
					blocks={zoneBundles[zone.id] || []}
					isActive={isDragging}
					selectedIndex={selectedIndex}
					onSelect={onSelect}
					onRemove={onRemove}
					onUpdateSettings={onUpdateSettings}
					selectedNested={selectedNested}
					onSelectNested={onSelectNested}
					onUpdateNested={onUpdateNested}
					stylePanel={defaultStylePanel}
					onCloseStylePanel={closeStylePanel}
					device={device}
					onStyleDevice={onStyleDevice}
					callbacks={cb}
					dropGuide={dropGuide}
					activeDragId={activeDragId}
					showEmptyHint={ zoneIndex === structure.zones.length - 1 }
					showEndHint={ zoneIndex === structure.zones.length - 1 }
					onMove={onMove}
					onDuplicate={onDuplicate}
					onOpenStyle={onOpenStyle}
					onMoveNested={onMoveNested}
					onDuplicateNested={onDuplicateNested}
					onOpenStyleNested={onOpenStyleNested}
				/>
			))}
		</div>
	);
}

export default PreviewCanvas;
