/**
 * Generic category renderers for the style popover.
 *
 * Each renderer is driven by an element config (config.js) and knows
 * nothing about specific widgets — it writes flat settings keys through
 * the same (key, value) onChange used by the whole builder. This is what
 * keeps the popover reusable: a new widget only needs a config entry.
 *
 * Note: the settings key is passed through the `setKey` prop, never React's
 * reserved `key` prop.
 *
 * @package WooCommerce_Template_Builder
 */

import { __ } from '@wordpress/i18n';

import MediaUploader from '../media-uploader';

import {
	PropertyRow,
	SpacingGroup,
	StyleGroup,
	SegmentedControl,
	PresetChips,
	CssColorField,
	FONT_OPTIONS,
	FONT_WEIGHT_OPTIONS,
	ALIGN_OPTIONS,
	BORDER_STYLE_OPTIONS,
	TRANSFORM_OPTIONS,
	SHADOW_OPTIONS,
	RADIUS_PRESETS,
	isKeySet,
	readKey,
} from './controls';

/* ------------------------------------------------------------------ *
 * Keyed property rows — label + control + inherited/custom + reset
 * ------------------------------------------------------------------ */

function KeyedNumber( { settings, onChange, setKey, label, min, max, step, suffix, help } ) {
	const custom = isKeySet( settings, setKey );
	const raw = settings ? settings[ setKey ] : undefined;
	const value = raw === undefined || raw === null ? '' : raw;
	return (
		<PropertyRow label={ label } custom={ custom } onReset={ () => onChange( setKey, undefined ) } help={ help }>
			<div className="xsb-number-row">
				<input
					className="xsb-number-input"
					type="number"
					value={ value === '' ? '' : String( value ) }
					min={ min }
					max={ max }
					step={ step }
					onChange={ ( e ) => onChange( setKey, e.target.value === '' ? '' : Number( e.target.value ) ) }
				/>
				{ suffix && <span className="xsb-number-suffix">{ suffix }</span> }
			</div>
		</PropertyRow>
	);
}

function KeyedSelect( { settings, onChange, setKey, label, options, help } ) {
	const custom = isKeySet( settings, setKey );
	const raw = settings ? settings[ setKey ] : undefined;
	return (
		<PropertyRow label={ label } custom={ custom } onReset={ () => onChange( setKey, undefined ) } help={ help }>
			<select
				className="xsb-select-input"
				value={ raw === undefined || raw === '' ? ( options[ 0 ]?.value || '' ) : String( raw ) }
				onChange={ ( e ) => onChange( setKey, e.target.value ) }
			>
				{ options.map( ( opt ) => (
					<option key={ opt.value } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
			</select>
		</PropertyRow>
	);
}

function KeyedColor( { settings, onChange, setKey, label, css = false } ) {
	const custom = isKeySet( settings, setKey );
	const value = settings ? settings[ setKey ] : '';
	return (
		<PropertyRow label={ label } custom={ custom } onReset={ () => onChange( setKey, undefined ) }>
			{ css ? (
				<CssColorField label={ label } value={ value } onChange={ ( v ) => onChange( setKey, v ) } />
			) : (
				<div className="xsb-color-tools">
					<input
						className="xsb-keyed-color"
						type="color"
						value={ toHex( value ) }
						onChange={ ( e ) => onChange( setKey, e.target.value ) }
						aria-label={ label }
					/>
					<label className="xsb-color-custom">
						<span className="xsb-color-custom-label">#</span>
						<input
							type="text"
							value={ String( value || '' ).startsWith( '#' ) ? ( value || '' ).replace( '#', '' ).slice( 0, 6 ) : '' }
							placeholder="2563eb"
							onChange={ ( e ) =>
								onChange( setKey, '#' + e.target.value.replace( /[^0-9a-fA-F]/g, '' ).slice( 0, 6 ) )
							}
						/>
					</label>
				</div>
			) }
		</PropertyRow>
	);
}

function toHex( value ) {
	const raw = String( value || '' ).trim().toLowerCase();
	let m = raw.match( /^#([0-9a-f]{6})$/ );
	if ( m ) {
		return raw;
	}
	m = raw.match( /^#([0-9a-f]{3})$/ );
	if ( m ) {
		const [ r, g, b ] = m[ 1 ].split( '' );
		return `#${ r }${ r }${ g }${ g }${ b }${ b }`;
	}
	return '#2271b1';
}

function KeyedAlign( { settings, onChange, setKey, label } ) {
	const custom = isKeySet( settings, setKey );
	const value = settings ? settings[ setKey ] : undefined;
	return (
		<PropertyRow label={ label || __( 'Alignment', 'xcodesol-page-builder' ) } custom={ custom } onReset={ () => onChange( setKey, undefined ) }>
			<SegmentedControl
				label={ label || __( 'Alignment', 'xcodesol-page-builder' ) }
				options={ ALIGN_OPTIONS }
				value={ value || 'left' }
				onChange={ ( v ) => onChange( setKey, v ) }
			/>
		</PropertyRow>
	);
}

function KeyedPreset( { settings, onChange, setKey, label, presets } ) {
	const custom = isKeySet( settings, setKey );
	const value = settings ? settings[ setKey ] : undefined;
	return (
		<PropertyRow label={ label } custom={ custom } onReset={ () => onChange( setKey, undefined ) }>
			<PresetChips label={ label } presets={ presets } value={ value } onChange={ ( v ) => onChange( setKey, v ) } />
		</PropertyRow>
	);
}

/* ------------------------------------------------------------------ *
 * Typography
 * ------------------------------------------------------------------ */

/**
 * cfg.typography: {
 *   prefix: '' | 'title' | 'subtitle' | 'button' | 'item' | 'field',
 *   align, transform, family, size, weight, lineHeight, letterSpacing (bool)
 * }
 */
export function renderTypographyCategory( { settings, onChange, cfg } ) {
	const tp = cfg.typography || {};
	const p = tp.prefix ? `${ tp.prefix }_` : '';
	const rows = [];
	const rowKey = ( k ) => `tp-${ p || 'root' }-${ k }`;

	if ( tp.align ) {
		rows.push(
			<KeyedAlign key={ rowKey( 'align' ) } settings={ settings } onChange={ onChange } setKey="align" label={ __( 'Alignment', 'xcodesol-page-builder' ) } />
		);
	}
	if ( tp.family !== false ) {
		const full = `${ p }font_family`;
		const custom = isKeySet( settings, full );
		const raw = readKey( settings, tp.prefix || '', 'font_family', '' );
		rows.push(
			<PropertyRow
				key={ rowKey( 'family' ) }
				label={ __( 'Font family', 'xcodesol-page-builder' ) }
				custom={ custom }
				onReset={ () => onChange( full, undefined ) }
			>
				<select className="xsb-select-input" value={ raw } onChange={ ( e ) => onChange( full, e.target.value ) }>
					<option value="">{ __( 'Theme default', 'xcodesol-page-builder' ) }</option>
					{ FONT_OPTIONS.map( ( opt ) => (
						<option key={ opt.value } value={ opt.value }>
							{ opt.label }
						</option>
					) ) }
				</select>
			</PropertyRow>
		);
	}
	if ( tp.size !== false ) {
		rows.push(
			<KeyedNumber
				key={ rowKey( 'size' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }font_size` }
				label={ __( 'Font size', 'xcodesol-page-builder' ) }
				suffix={ __( 'px', 'xcodesol-page-builder' ) }
				min={ 0 }
				max={ 200 }
			/>
		);
	}
	if ( tp.weight !== false ) {
		rows.push(
			<KeyedSelect
				key={ rowKey( 'weight' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }font_weight` }
				label={ __( 'Font weight', 'xcodesol-page-builder' ) }
				options={ [ { label: __( 'Default', 'xcodesol-page-builder' ), value: '' }, ...FONT_WEIGHT_OPTIONS ] }
			/>
		);
	}
	if ( tp.lineHeight !== false ) {
		rows.push(
			<KeyedNumber
				key={ rowKey( 'lh' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }line_height` }
				label={ __( 'Line height', 'xcodesol-page-builder' ) }
				min={ 0.5 }
				max={ 3 }
				step={ 0.1 }
			/>
		);
	}
	if ( tp.letterSpacing !== false ) {
		rows.push(
			<KeyedNumber
				key={ rowKey( 'ls' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }letter_spacing` }
				label={ __( 'Letter spacing', 'xcodesol-page-builder' ) }
				suffix={ __( 'px', 'xcodesol-page-builder' ) }
				min={ -20 }
				max={ 50 }
			/>
		);
	}
	if ( tp.transform ) {
		rows.push(
			<KeyedSelect
				key={ rowKey( 'transform' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }text_transform` }
				label={ __( 'Text transform', 'xcodesol-page-builder' ) }
				options={ TRANSFORM_OPTIONS }
			/>
		);
	}
	if ( tp.style !== false ) {
		rows.push(
			<KeyedSelect
				key={ rowKey( 'style' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }font_style` }
				label={ __( 'Font style', 'xcodesol-page-builder' ) }
				options={ [
					{ label: __( 'Default', 'xcodesol-page-builder' ), value: '' },
					{ label: __( 'Normal', 'xcodesol-page-builder' ), value: 'normal' },
					{ label: __( 'Italic', 'xcodesol-page-builder' ), value: 'italic' },
				] }
			/>
		);
	}
	if ( tp.decoration !== false ) {
		rows.push(
			<KeyedSelect
				key={ rowKey( 'decoration' ) }
				settings={ settings }
				onChange={ onChange }
				setKey={ `${ p }text_decoration` }
				label={ __( 'Text decoration', 'xcodesol-page-builder' ) }
				options={ [
					{ label: __( 'Default', 'xcodesol-page-builder' ), value: '' },
					{ label: __( 'None', 'xcodesol-page-builder' ), value: 'none' },
					{ label: __( 'Underline', 'xcodesol-page-builder' ), value: 'underline' },
					{ label: __( 'Line through', 'xcodesol-page-builder' ), value: 'line-through' },
				] }
			/>
		);
	}

	return rows;
}

/* ------------------------------------------------------------------ *
 * Colors
 * ------------------------------------------------------------------ */

/**
 * cfg.colors: [ { setKey, label, css? } ]
 */
export function renderColorsCategory( { settings, onChange, cfg } ) {
	return ( cfg.colors || [] ).map( ( item, i ) => (
		<KeyedColor
			key={ item.setKey || i }
			settings={ settings }
			onChange={ onChange }
			setKey={ item.setKey }
			label={ item.label }
			css={ item.css }
		/>
	) );
}

/* ------------------------------------------------------------------ *
 * Background
 * ------------------------------------------------------------------ */

/**
 * cfg.background: { type: 'box', setKey: 'background' } or { type: 'banner' }.
 */
export function renderBackgroundCategory( { settings, onChange, cfg } ) {
	const bg = cfg.background || {};

	if ( bg.type === 'banner' ) {
		return <BannerBackgroundFields settings={ settings } onChange={ onChange } />;
	}

	return (
		<KeyedColor
			settings={ settings }
			onChange={ onChange }
			setKey={ bg.setKey || 'background' }
			label={ __( 'Background color', 'xcodesol-page-builder' ) }
			css={ bg.css }
		/>
	);
}

/**
 * Full background-with-type panel (color / gradient / image / video +
 * overlay). Banner is the only consumer today, but the renderer is generic
 * and could back any hero-style element.
 */
function BannerBackgroundFields( { settings, onChange } ) {
	const bgType = settings.bg_type || 'color';
	const withImage = 'image' === bgType;
	const withOverlay = withImage || 'video' === bgType;

	return (
		<>
			<StyleGroup title={ __( 'Type', 'xcodesol-page-builder' ) } defaultOpen>
				<SegmentedControl
					label={ __( 'Background type', 'xcodesol-page-builder' ) }
					options={ [
						{ label: __( 'Color', 'xcodesol-page-builder' ), value: 'color' },
						{ label: __( 'Gradient', 'xcodesol-page-builder' ), value: 'gradient' },
						{ label: __( 'Image', 'xcodesol-page-builder' ), value: 'image' },
						{ label: __( 'Video', 'xcodesol-page-builder' ), value: 'video' },
					] }
					value={ bgType }
					onChange={ ( v ) => onChange( 'bg_type', v ) }
				/>
			</StyleGroup>
			{ 'gradient' === bgType ? (
				<StyleGroup title={ __( 'Gradient', 'xcodesol-page-builder' ) }>
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="gradient_type" label={ __( 'Gradient type', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'Linear', 'xcodesol-page-builder' ), value: 'linear' },
						{ label: __( 'Radial', 'xcodesol-page-builder' ), value: 'radial' },
					] } />
					{ 'linear' === ( settings.gradient_type || 'linear' ) ? (
						<>
							<KeyedSelect settings={ settings } onChange={ onChange } setKey="gradient_angle" label={ __( 'Direction', 'xcodesol-page-builder' ) } options={ [
								{ label: __( 'To bottom', 'xcodesol-page-builder' ), value: '180' },
								{ label: __( 'To top', 'xcodesol-page-builder' ), value: '0' },
								{ label: __( 'To right', 'xcodesol-page-builder' ), value: '90' },
								{ label: __( 'To left', 'xcodesol-page-builder' ), value: '270' },
								{ label: __( 'Bottom right', 'xcodesol-page-builder' ), value: '135' },
								{ label: __( 'Bottom left', 'xcodesol-page-builder' ), value: '225' },
							] } />
							<KeyedNumber settings={ settings } onChange={ onChange } setKey="gradient_angle" label={ __( 'Angle', 'xcodesol-page-builder' ) } suffix={ __( 'deg', 'xcodesol-page-builder' ) } min={ 0 } max={ 360 } />
						</>
					) : (
						<>
							<KeyedSelect settings={ settings } onChange={ onChange } setKey="gradient_radial_shape" label={ __( 'Shape', 'xcodesol-page-builder' ) } options={ [
								{ label: __( 'Circle', 'xcodesol-page-builder' ), value: 'circle' },
								{ label: __( 'Ellipse', 'xcodesol-page-builder' ), value: 'ellipse' },
							] } />
							<KeyedSelect settings={ settings } onChange={ onChange } setKey="gradient_position" label={ __( 'Position', 'xcodesol-page-builder' ) } options={ [
								{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
								{ label: __( 'Top', 'xcodesol-page-builder' ), value: 'top' },
								{ label: __( 'Bottom', 'xcodesol-page-builder' ), value: 'bottom' },
								{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
								{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
								{ label: __( 'Top left', 'xcodesol-page-builder' ), value: 'top left' },
								{ label: __( 'Top right', 'xcodesol-page-builder' ), value: 'top right' },
								{ label: __( 'Bottom left', 'xcodesol-page-builder' ), value: 'bottom left' },
								{ label: __( 'Bottom right', 'xcodesol-page-builder' ), value: 'bottom right' },
							] } />
						</>
					) }
					<KeyedColor settings={ settings } onChange={ onChange } setKey="gradient_color_a" label={ __( 'First color', 'xcodesol-page-builder' ) } />
					<KeyedColor settings={ settings } onChange={ onChange } setKey="gradient_color_b" label={ __( 'Second color', 'xcodesol-page-builder' ) } />
				</StyleGroup>
			) : (
				<StyleGroup title={ __( 'Color', 'xcodesol-page-builder' ) }>
					<KeyedColor settings={ settings } onChange={ onChange } setKey="bg_color" label={ __( 'Background color', 'xcodesol-page-builder' ) } />
				</StyleGroup>
			) }
			{ withImage && (
				<StyleGroup title={ __( 'Image', 'xcodesol-page-builder' ) }>
					<MediaUploader
						label={ __( 'Background image', 'xcodesol-page-builder' ) }
						mediaType="image"
						value={ settings.bg_image || '' }
						onChange={ ( v ) => onChange( 'bg_image', v ) }
					/>
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="bg_size" label={ __( 'Size', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'Cover', 'xcodesol-page-builder' ), value: 'cover' },
						{ label: __( 'Contain', 'xcodesol-page-builder' ), value: 'contain' },
						{ label: __( 'Auto', 'xcodesol-page-builder' ), value: 'auto' },
					] } />
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="bg_position" label={ __( 'Position', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center center' },
						{ label: __( 'Top', 'xcodesol-page-builder' ), value: 'top center' },
						{ label: __( 'Bottom', 'xcodesol-page-builder' ), value: 'bottom center' },
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'center left' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'center right' },
					] } />
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="bg_repeat" label={ __( 'Repeat', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'No repeat', 'xcodesol-page-builder' ), value: 'no-repeat' },
						{ label: __( 'Repeat', 'xcodesol-page-builder' ), value: 'repeat' },
						{ label: __( 'Repeat X', 'xcodesol-page-builder' ), value: 'repeat-x' },
						{ label: __( 'Repeat Y', 'xcodesol-page-builder' ), value: 'repeat-y' },
					] } />
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="bg_attachment" label={ __( 'Attachment', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'Scroll', 'xcodesol-page-builder' ), value: 'scroll' },
						{ label: __( 'Fixed (parallax)', 'xcodesol-page-builder' ), value: 'fixed' },
					] } />
				</StyleGroup>
			) }
			{ 'video' === bgType && (
				<StyleGroup title={ __( 'Video', 'xcodesol-page-builder' ) }>
					<MediaUploader
						label={ __( 'Background video (MP4)', 'xcodesol-page-builder' ) }
						mediaType="video"
						value={ settings.bg_video || '' }
						onChange={ ( v ) => onChange( 'bg_video', v ) }
					/>
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="bg_video_fit" label={ __( 'Fit', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'Cover', 'xcodesol-page-builder' ), value: 'cover' },
						{ label: __( 'Contain', 'xcodesol-page-builder' ), value: 'contain' },
						{ label: __( 'Fill', 'xcodesol-page-builder' ), value: 'fill' },
					] } />
					<KeyedSelect settings={ settings } onChange={ onChange } setKey="bg_video_position" label={ __( 'Position', 'xcodesol-page-builder' ) } options={ [
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center center' },
						{ label: __( 'Top', 'xcodesol-page-builder' ), value: 'center top' },
						{ label: __( 'Bottom', 'xcodesol-page-builder' ), value: 'center bottom' },
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right center' },
					] } />
				</StyleGroup>
			) }
			{ withOverlay && (
				<StyleGroup title={ __( 'Overlay', 'xcodesol-page-builder' ) }>
					<KeyedColor settings={ settings } onChange={ onChange } setKey="overlay_color" label={ __( 'Overlay color', 'xcodesol-page-builder' ) } css />
					<KeyedNumber settings={ settings } onChange={ onChange } setKey="overlay_opacity" label={ __( 'Overlay opacity', 'xcodesol-page-builder' ) } suffix="%" min={ 0 } max={ 100 } help={ __( 'The overlay always sits behind the banner text.', 'xcodesol-page-builder' ) } />
				</StyleGroup>
			) }
		</>
	);
}

/* ------------------------------------------------------------------ *
 * Spacing — Margin AND Padding, identical linked 4-side inputs
 * ------------------------------------------------------------------ */

/**
 * cfg.spacing: {
 *   margin: true | 'tb' | false,
 *   padding: 'all' | 'xy' | 'single' | false,
 *   paddingPrefix: '' | 'button' | 'field' | 'item' | 'badge' | 'card',
 *   extra: [ { setKey, label, suffix, min, max } ]
 * }
 */
export function renderSpacingCategory( { settings, onChange, cfg } ) {
	const sp = cfg.spacing || {};
	const rows = [];
	let firstOpen = true;

	const pushGroup = ( title, body ) => {
		rows.push(
			<StyleGroup key={ title } title={ title } defaultOpen={ firstOpen }>
				{ body }
			</StyleGroup>
		);
		firstOpen = false;
	};

	if ( sp.margin === 'tb' ) {
		pushGroup( __( 'Margin', 'xcodesol-page-builder' ), (
			<>
				<KeyedNumber settings={ settings } onChange={ onChange } setKey="margin_top" label={ __( 'Space above', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ -500 } max={ 500 } />
				<KeyedNumber settings={ settings } onChange={ onChange } setKey="margin_bottom" label={ __( 'Space below', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ -500 } max={ 500 } />
			</>
		) );
	} else if ( sp.margin ) {
		const readMargin = ( side ) => settings ? settings[ `margin_${ side }` ] : '';
		pushGroup( __( 'Margin', 'xcodesol-page-builder' ), (
			<SpacingGroup
				label={ __( 'Margin', 'xcodesol-page-builder' ) }
				values={ {
					top: readMargin( 'top' ),
					right: readMargin( 'right' ),
					bottom: readMargin( 'bottom' ),
					left: readMargin( 'left' ),
				} }
				onChange={ ( side, value ) => onChange( `margin_${ side }`, value ) }
			/>
		) );
	}

	const pp = sp.paddingPrefix ? `${ sp.paddingPrefix }_` : '';
	if ( sp.padding === 'all' ) {
		const readPad = ( side ) => settings ? settings[ `${ pp }padding_${ side }` ] : '';
		pushGroup( __( 'Padding', 'xcodesol-page-builder' ), (
			<SpacingGroup
				label={ __( 'Padding', 'xcodesol-page-builder' ) }
				values={ {
					top: readPad( 'top' ),
					right: readPad( 'right' ),
					bottom: readPad( 'bottom' ),
					left: readPad( 'left' ),
				} }
				onChange={ ( side, value ) => onChange( `${ pp }padding_${ side }`, value ) }
			/>
		) );
	} else if ( sp.padding === 'xy' ) {
		pushGroup( __( 'Padding', 'xcodesol-page-builder' ), (
			<>
				<KeyedNumber settings={ settings } onChange={ onChange } setKey={ `${ pp }padding_x` } label={ __( 'Padding left / right', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ 0 } max={ 200 } />
				<KeyedNumber settings={ settings } onChange={ onChange } setKey={ `${ pp }padding_y` } label={ __( 'Padding top / bottom', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ 0 } max={ 200 } />
			</>
		) );
	} else if ( sp.padding === 'single' ) {
		pushGroup( __( 'Padding', 'xcodesol-page-builder' ), (
			<KeyedNumber settings={ settings } onChange={ onChange } setKey={ `${ pp }padding` } label={ __( 'Padding', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ 0 } max={ 300 } />
		) );
	}

	( sp.extra || [] ).forEach( ( item ) => {
		rows.push(
			<KeyedNumber
				key={ `sp-${ item.setKey }` }
				settings={ settings }
				onChange={ onChange }
				setKey={ item.setKey }
				label={ item.label }
				suffix={ item.suffix || __( 'px', 'xcodesol-page-builder' ) }
				min={ item.min }
				max={ item.max }
			/>
		);
	} );

	return rows;
}

/* ------------------------------------------------------------------ *
 * Border & radius
 * ------------------------------------------------------------------ */

/**
 * cfg.border: {
 *   prefix: '' | 'item' | 'img' | 'badge' | 'button',
 *   style: bool (default true),
 *   widthSetKey, colorSetKey, radiusSetKey (explicit key overrides)
 * }
 */
export function renderBorderCategory( { settings, onChange, cfg } ) {
	const b = cfg.border || {};

	/* Radius-only variant (e.g. pagination's current-page pill). */
	if ( b.radiusOnly ) {
		const radiusKey = b.radiusSetKey || 'border_radius';
		return (
			<StyleGroup title={ b.radiusLabel || __( 'Corner radius', 'xcodesol-page-builder' ) } defaultOpen>
				<KeyedPreset settings={ settings } onChange={ onChange } setKey={ radiusKey } label={ __( 'Radius', 'xcodesol-page-builder' ) } presets={ RADIUS_PRESETS } />
				<KeyedNumber settings={ settings } onChange={ onChange } setKey={ radiusKey } label={ __( 'Custom radius', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ 0 } max={ 300 } />
			</StyleGroup>
		);
	}

	const p = b.prefix ? `${ b.prefix }_` : '';
	const widthKey = b.widthSetKey || `${ p }border_width`;
	const colorKey = b.colorSetKey || `${ p }border_color`;
	const styleKey = b.styleSetKey || `${ p }border_style`;
	const radiusKey = b.radiusSetKey || `${ p }border_radius`;

	return (
		<>
			{ b.style !== false && (
				<KeyedSelect settings={ settings } onChange={ onChange } setKey={ styleKey } label={ __( 'Border style', 'xcodesol-page-builder' ) } options={ BORDER_STYLE_OPTIONS } />
			) }
			<KeyedNumber settings={ settings } onChange={ onChange } setKey={ widthKey } label={ __( 'Border width', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ 0 } max={ 100 } />
			<KeyedColor settings={ settings } onChange={ onChange } setKey={ colorKey } label={ __( 'Border color', 'xcodesol-page-builder' ) } />
			<StyleGroup title={ __( 'Corner radius', 'xcodesol-page-builder' ) } defaultOpen>
				<KeyedPreset settings={ settings } onChange={ onChange } setKey={ radiusKey } label={ __( 'Radius', 'xcodesol-page-builder' ) } presets={ RADIUS_PRESETS } />
				<KeyedNumber settings={ settings } onChange={ onChange } setKey={ radiusKey } label={ __( 'Custom radius', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ 0 } max={ 300 } />
			</StyleGroup>
		</>
	);
}

/* ------------------------------------------------------------------ *
 * Shadow
 * ------------------------------------------------------------------ */

/**
 * cfg.shadow: { setKey: 'box_shadow' | 'shadow' | 'item_shadow' | ... }
 */
export function renderShadowCategory( { settings, onChange, cfg } ) {
	const setKey = ( cfg.shadow && cfg.shadow.setKey ) || 'box_shadow';
	return (
			<StyleGroup title={ __( 'Box shadow', 'xcodesol-page-builder' ) }>
			<KeyedPreset settings={ settings } onChange={ onChange } setKey={ setKey } label={ __( 'Shadow', 'xcodesol-page-builder' ) } presets={ SHADOW_OPTIONS } />
			<p className="xsb-field-help">{ __( 'Shadows are subtle by default — pick a stronger preset for floating cards.', 'xcodesol-page-builder' ) }</p>
		</StyleGroup>
	);
}

/* ------------------------------------------------------------------ *
 * Effects (transform)
 * ------------------------------------------------------------------ */

/**
 * Entrance animations are edited in the inspector's Advanced tab. Keep the
 * style popover's Effects category focused on transforms.
 */
export function renderEffectsCategory( { settings, onChange, cfg } ) {
	return <TransformAnimCategory settings={ settings } onChange={ onChange } cfg={ cfg } />;
}

/**
 * Transform controls inside the Effects category. cfg is the full effects
 * category config ({ effects: { animationSetKey, ..., transform } }); the
 * transform group is rendered from cfg.effects.transform so it writes the
 * same flat keys as the standalone CSS transform category. Configs without
 * a transform sub-config (plain { effects: {} }) render nothing extra.
 */
function TransformAnimCategory( { settings, onChange, cfg } ) {
	const ef = ( cfg && cfg.effects ) || {};
	if ( ! ef.transform ) {
		return null;
	}
	return renderTransformCategory( { settings, onChange, cfg: { transform: ef.transform } } );
}

/* ------------------------------------------------------------------ *
 * CSS transform (translate / scale / rotate)
 * ------------------------------------------------------------------ */

const TRANSFORM_TYPE_OPTIONS = [
	{ label: __( 'None', 'xcodesol-page-builder' ), value: 'none' },
	{ label: __( 'Custom', 'xcodesol-page-builder' ), value: 'custom' },
];

export function renderTransformCategory( { settings, onChange, cfg } ) {
	const tf = cfg.transform || {};
	const typeKey = tf.typeSetKey || 'transform_type';
	const txKey = tf.txSetKey || 'transform_tx';
	const tyKey = tf.tySetKey || 'transform_ty';
	const scaleKey = tf.scaleSetKey || 'transform_scale';
	const rotateKey = tf.rotateSetKey || 'transform_rotate';
	const originKey = tf.originSetKey || 'transform_origin';

	const typeVal = settings ? settings[ typeKey ] : 'none';

	return (
		<StyleGroup title={ __( 'CSS transform', 'xcodesol-page-builder' ) }>
			<KeyedSelect
				settings={ settings }
				onChange={ onChange }
				setKey={ typeKey }
				label={ __( 'Transform type', 'xcodesol-page-builder' ) }
				options={ TRANSFORM_TYPE_OPTIONS }
				help={ __( 'Custom lets you nudge, scale or rotate this element with CSS transform. It does not change the layout flow the way margin or position do.', 'xcodesol-page-builder' ) }
			/>

			{ typeVal && typeVal !== 'none' && (
				<>
					<div className="xsb-transform-grid">
						<div>
							<KeyedNumber
								settings={ settings }
								onChange={ onChange }
								setKey={ txKey }
								label={ __( 'Translate X', 'xcodesol-page-builder' ) }
								suffix={ __( 'px', 'xcodesol-page-builder' ) }
								min={ -2000 }
								max={ 2000 }
								step={ 1 }
							/>
						</div>
						<div>
							<KeyedNumber
								settings={ settings }
								onChange={ onChange }
								setKey={ tyKey }
								label={ __( 'Translate Y', 'xcodesol-page-builder' ) }
								suffix={ __( 'px', 'xcodesol-page-builder' ) }
								min={ -2000 }
								max={ 2000 }
								step={ 1 }
							/>
						</div>
					</div>
					<KeyedNumber
						settings={ settings }
						onChange={ onChange }
						setKey={ scaleKey }
						label={ __( 'Scale', 'xcodesol-page-builder' ) }
						suffix={ __( '×', 'xcodesol-page-builder' ) }
						min={ 0 }
						max={ 500 }
						step={ 1 }
						help={ __( '100 = original size. Set a scale and the element grows or shrinks from its transform origin.', 'xcodesol-page-builder' ) }
				/>
					<KeyedNumber
						settings={ settings }
						onChange={ onChange }
						setKey={ rotateKey }
						label={ __( 'Rotate', 'xcodesol-page-builder' ) }
						suffix={ __( 'deg', 'xcodesol-page-builder' ) }
						min={ -3600 }
						max={ 3600 }
						step={ 1 }
				/>
					<KeyedSelect
						settings={ settings }
						onChange={ onChange }
						setKey={ originKey }
						label={ __( 'Transform origin', 'xcodesol-page-builder' ) }
						options={ TRANSFORM_ORIGIN_OPTIONS }
						help={ __( 'The point the scale and rotate turn around. For absolutely placed widgets this is relative to the element itself.', 'xcodesol-page-builder' ) }
				/>
				</>
			) }
		</StyleGroup>
	);
}

const TRANSFORM_ORIGIN_OPTIONS = [
	{ label: __( 'Top left', 'xcodesol-page-builder' ), value: 'top left' },
	{ label: __( 'Top center', 'xcodesol-page-builder' ), value: 'top center' },
	{ label: __( 'Top right', 'xcodesol-page-builder' ), value: 'top right' },
	{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
	{ label: __( 'Bottom left', 'xcodesol-page-builder' ), value: 'bottom left' },
	{ label: __( 'Bottom center', 'xcodesol-page-builder' ), value: 'bottom center' },
	{ label: __( 'Bottom right', 'xcodesol-page-builder' ), value: 'bottom right' },
];

export function transformKeysFromCfg( cfg ) {
	const tf = cfg.transform || {};
	return [
		(tf.typeSetKey || 'transform_type'),
		(tf.txSetKey || 'transform_tx'),
		(tf.tySetKey || 'transform_ty'),
		(tf.scaleSetKey || 'transform_scale'),
		(tf.rotateSetKey || 'transform_rotate'),
		(tf.originSetKey || 'transform_origin'),
	];
}


/* ------------------------------------------------------------------ *
 * Field list (shared by Layout / Dimensions)
 * ------------------------------------------------------------------ */

/**
 * items: [ { type: 'align'|'select'|'number'|'toggle', setKey, label, ... } ]
 */
function renderFieldList( { settings, onChange, items } ) {
	return ( items || [] ).map( ( item, i ) => {
		if ( item.type === 'align' ) {
			return <KeyedAlign key={ item.setKey || i } settings={ settings } onChange={ onChange } setKey={ item.setKey } label={ item.label } />;
		}
		if ( item.type === 'select' ) {
			return <KeyedSelect key={ item.setKey || i } settings={ settings } onChange={ onChange } setKey={ item.setKey } label={ item.label } options={ item.options || [] } help={ item.help } />;
		}
		if ( item.type === 'toggle' ) {
			return <KeyedToggle key={ item.setKey || i } settings={ settings } onChange={ onChange } setKey={ item.setKey } label={ item.label } help={ item.help } />;
		}
		if ( item.type === 'color' ) {
			return <KeyedColor key={ item.setKey || i } settings={ settings } onChange={ onChange } setKey={ item.setKey } label={ item.label } css={ item.css } />;
		}
		return (
			<KeyedNumber
				key={ item.setKey || i }
				settings={ settings }
				onChange={ onChange }
				setKey={ item.setKey }
				label={ item.label }
				min={ item.min }
				max={ item.max }
				step={ item.step }
				suffix={ item.suffix }
				help={ item.help }
			/>
		);
	} );
}

/**
 * cfg.layout: { items: [field specs] }
 */
export function renderLayoutCategory( { settings, onChange, cfg } ) {
	return renderFieldList( { settings, onChange, items: cfg.layout && cfg.layout.items } );
}

/**
 * cfg.dimensions: { items: [field specs] }
 */
export function renderDimensionsCategory( { settings, onChange, cfg } ) {
	return renderFieldList( { settings, onChange, items: cfg.dimensions && cfg.dimensions.items } );
}

/* ------------------------------------------------------------------ *
 * Position — how a widget sits in the layout: in-flow, relative,
 * absolute or fixed, plus fine X/Y offsets and a stack order.
 * ------------------------------------------------------------------ */

/**
 * Position vocabulary matches the PHP emitter exactly so the editor and
 * front-end switch on the same values.
 */
export const POSITION_PRESETS = [
	{ label: __( 'In flow (default)', 'xcodesol-page-builder' ), value: '' },
	{ label: __( 'Relative', 'xcodesol-page-builder' ), value: 'relative' },
	{ label: __( 'Absolute', 'xcodesol-page-builder' ), value: 'absolute' },
	{ label: __( 'Fixed', 'xcodesol-page-builder' ), value: 'fixed' },
];

/**
 * Generic Position control — shared by every widget element via config.js.
 * The PHP emitter mirrors this logic, including the responsive
 * tablet_/mobile_ variants.
 */
export function renderPositionCategory( { settings, onChange } ) {
	const position = settings ? settings.position : '';
	return (
		<>
			<StyleGroup title={ __( 'Position', 'xcodesol-page-builder' ) } defaultOpen>
				<KeyedSelect
					settings={ settings }
					onChange={ onChange }
					setKey="position"
					label={ __( 'Position type', 'xcodesol-page-builder' ) }
					options={ POSITION_PRESETS }
					help={ __( 'Relative keeps the element in the normal layout and lets you nudge it. Absolute removes it from the flow and positions it relative to the nearest positioned box. Fixed pins it to the browser window.', 'xcodesol-page-builder' ) }
				/>
				{ position && position !== '' && (
					<>
						<KeyedNumber settings={ settings } onChange={ onChange } setKey="pos_x" label={ __( 'Horizontal offset', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ -800 } max={ 800 } help={ __( 'For relative, this shifts left/right. For absolute and fixed, the offset is applied as a transform from the top-left corner.', 'xcodesol-page-builder' ) } />
						<KeyedNumber settings={ settings } onChange={ onChange } setKey="pos_y" label={ __( 'Vertical offset', 'xcodesol-page-builder' ) } suffix={ __( 'px', 'xcodesol-page-builder' ) } min={ -800 } max={ 800 } />
						<KeyedNumber settings={ settings } onChange={ onChange } setKey="pos_z" label={ __( 'Stack order', 'xcodesol-page-builder' ) } suffix={ __( 'z-index', 'xcodesol-page-builder' ) } min={ 0 } max={ 999 } help={ __( 'Higher values sit above widgets that overlap. Auto when left at 0.', 'xcodesol-page-builder' ) } />
					</>
				) }
			</StyleGroup>
		</>
	);
}

/**
 * cfg.imageEffects: { items: [field specs] }
 */
export function renderImageEffectsCategory( { settings, onChange, cfg } ) {
	const items = ( cfg.imageEffects && cfg.imageEffects.items ) || [];
	if ( ! items.length ) {
		return null;
	}
	return (
		<StyleGroup title={ __( 'Image overlay', 'xcodesol-page-builder' ) } defaultOpen>
			{ renderFieldList( { settings, onChange, items } ) }
		</StyleGroup>
	);
}

/**
 * cfg.imageSettings: { items: [field specs] } — niche per-widget settings
 * that are visual enough to live in the popover (badge placement etc.).
 */
export function renderImageSettingsCategory( { settings, onChange, cfg } ) {
	return renderFieldList( { settings, onChange, items: cfg.imageSettings && cfg.imageSettings.items } );
}

/* Toggle helper used by renderFieldList above. */
function KeyedToggle( { settings, onChange, setKey, label, help } ) {
	const custom = isKeySet( settings, setKey );
	return (
		<PropertyRow label={ label } custom={ custom } onReset={ () => onChange( setKey, undefined ) } help={ help }>
			<label className="xsb-style-switch">
				<input
					type="checkbox"
					checked={ !! ( settings && settings[ setKey ] ) }
					onChange={ ( e ) => onChange( setKey, e.target.checked ) }
				/>
				<span className="xsb-style-switch__track" aria-hidden="true" />
			</label>
		</PropertyRow>
	);
}

/* ------------------------------------------------------------------ *
 * Per-column layout options (container)
 * ------------------------------------------------------------------ */

export const COLUMN_LAYOUT_ITEMS = [
	{
		type: 'select',
		setKey: 'align_h',
		label: __( 'Content horizontal', 'xcodesol-page-builder' ),
		options: [
			{ label: __( 'Stretch', 'xcodesol-page-builder' ), value: '' },
			{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
			{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
			{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
		],
	},
	{
		type: 'select',
		setKey: 'align_v',
		label: __( 'Content vertical', 'xcodesol-page-builder' ),
		options: [
			{ label: __( 'Top', 'xcodesol-page-builder' ), value: '' },
			{ label: __( 'Middle', 'xcodesol-page-builder' ), value: 'center' },
			{ label: __( 'Bottom', 'xcodesol-page-builder' ), value: 'bottom' },
		],
	},
	{
		type: 'select',
		setKey: 'start',
		label: __( 'Column start', 'xcodesol-page-builder' ),
		help: __( 'Where this column begins on the 12-unit row — choose a unit to leave empty space before it.', 'xcodesol-page-builder' ),
		options: [
			{ label: __( 'Auto (right after previous)', 'xcodesol-page-builder' ), value: '0' },
			...Array.from( { length: 12 }, ( _, i ) => ( {
				label: __( 'Unit', 'xcodesol-page-builder' ) + ` ${ i + 1 }`,
				value: String( i + 1 ),
			} ) ),
		],
	},
];

/* ------------------------------------------------------------------ *
 * Advanced — CSS class / HTML id (every widget element)
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Visibility — hide on desktop / tablet / mobile
 * ------------------------------------------------------------------ */

/**
 * cfg.visibility: { hideDesktop, hideTablet, hideMobile } key names.
 */
export function renderVisibilityCategory( { settings, onChange, cfg } ) {
	const vis = ( cfg && cfg.visibility ) || {};
	const desktopKey = vis.hideDesktop || 'hide_on_desktop';
	const tabletKey = vis.hideTablet || 'hide_on_tablet';
	const mobileKey = vis.hideMobile || 'hide_on_mobile';

	return (
		<StyleGroup title={ __( 'Hide on device', 'xcodesol-page-builder' ) } defaultOpen>
			<KeyedToggle
				settings={ settings }
				onChange={ onChange }
				setKey={ desktopKey }
				label={ __( 'Hide on desktop', 'xcodesol-page-builder' ) }
			/>
			<KeyedToggle
				settings={ settings }
				onChange={ onChange }
				setKey={ tabletKey }
				label={ __( 'Hide on tablet', 'xcodesol-page-builder' ) }
			/>
			<KeyedToggle
				settings={ settings }
				onChange={ onChange }
				setKey={ mobileKey }
				label={ __( 'Hide on mobile', 'xcodesol-page-builder' ) }
			/>
			<p className="xsb-field-help">
				{ __( 'The widget still exists in the layout on other devices. Use this to simplify small screens without deleting the block.', 'xcodesol-page-builder' ) }
			</p>
		</StyleGroup>
	);
}

export function renderAdvancedCategory( { settings, onChange, cfg } ) {
	const adv = ( cfg && cfg.advanced ) || {};
	const classKey = adv.classKey || 'css_class';
	const idKey = adv.idKey || 'css_id';

	return (
		<div className="xsb-advanced-category">
			<StyleGroup title={ __( 'Custom class & ID', 'xcodesol-page-builder' ) }>
				<PropertyRow
					label={ __( 'CSS class', 'xcodesol-page-builder' ) }
					custom={ isKeySet( settings, classKey ) }
					onReset={ () => onChange( classKey, undefined ) }
					help={ __( 'One or more class names, space separated. Applied to this widget’s wrapper so you can target it from your own CSS.', 'xcodesol-page-builder' ) }
				>
					<input
						className="xsb-text-input xsb-advanced-input"
						type="text"
						placeholder={ __( 'my-custom-class', 'xcodesol-page-builder' ) }
						value={ settings && settings[ classKey ] ? String( settings[ classKey ] ) : '' }
						onChange={ ( e ) => onChange( classKey, e.target.value ) }
					/>
				</PropertyRow>
				<PropertyRow
					label={ __( 'HTML ID', 'xcodesol-page-builder' ) }
					custom={ isKeySet( settings, idKey ) }
					onReset={ () => onChange( idKey, undefined ) }
					help={ __( 'A unique id for this widget on the page.', 'xcodesol-page-builder' ) }
				>
					<input
						className="xsb-text-input xsb-advanced-input"
						type="text"
						placeholder={ __( 'my-widget-id', 'xcodesol-page-builder' ) }
						value={ settings && settings[ idKey ] ? String( settings[ idKey ] ) : '' }
						onChange={ ( e ) => onChange( idKey, e.target.value ) }
					/>
				</PropertyRow>
			</StyleGroup>
		</div>
	);
}
