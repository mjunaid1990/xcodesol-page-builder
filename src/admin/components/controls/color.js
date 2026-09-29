/**
 * Color picker control with a full popover picker (saturation area, hue +
 * alpha sliders, hex input) plus theme token swatches — the Elementor
 * colour-picker pattern.
 *
 * @package Xcodesol_Page_Builder
 */

import { useEffect, useRef, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

const THEME_COLOR_SWATCHES = [
	{ label: 'Primary', value: '#2563eb' },
	{ label: 'Indigo', value: '#4f46e5' },
	{ label: 'Dark', value: '#0f172a' },
	{ label: 'Body', value: '#334155' },
	{ label: 'Muted', value: '#64748b' },
	{ label: 'Light', value: '#f8fafc' },
	{ label: 'White', value: '#ffffff' },
	{ label: 'Accent', value: '#06b6d4' },
];

/* ----- hsl <-> hex helpers (tiny, dependency-free) ---------------------- */

function hexToRgb( hex ) {
	const m = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec( String( hex || '' ).trim() );
	if ( ! m ) {
		return null;
	}
	let h = m[ 1 ];
	if ( 3 === h.length ) {
		h = h.split( '' ).map( ( c ) => c + c ).join( '' );
	}
	const n = parseInt( h, 16 );
	return { r: ( n >> 16 ) & 255, g: ( n >> 8 ) & 255, b: n & 255 };
}

function rgbToHex( r, g, b ) {
	const to = ( v ) => Math.max( 0, Math.min( 255, Math.round( v ) ) ).toString( 16 ).padStart( 2, '0' );
	return `#${ to( r ) }${ to( g ) }${ to( b ) }`;
}

function rgbToHsv( r, g, b ) {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max( r, g, b );
	const min = Math.min( r, g, b );
	const d = max - min;
	let h = 0;
	if ( d ) {
		if ( max === r ) h = ( ( g - b ) / d ) % 6;
		else if ( max === g ) h = ( b - r ) / d + 2;
		else h = ( r - g ) / d + 4;
		h = Math.round( h * 60 );
		if ( h < 0 ) h += 360;
	}
	return { h, s: max ? d / max : 0, v: max };
}

function hsvToRgb( h, s, v ) {
	const c = v * s;
	const x = c * ( 1 - Math.abs( ( ( h / 60 ) % 2 ) - 1 ) );
	const m = v - c;
	let rgb = [ c, x, 0 ];
	if ( h < 60 ) rgb = [ c, x, 0 ];
	else if ( h < 120 ) rgb = [ x, c, 0 ];
	else if ( h < 180 ) rgb = [ 0, c, x ];
	else if ( h < 240 ) rgb = [ 0, x, c ];
	else if ( h < 300 ) rgb = [ x, 0, c ];
	else rgb = [ c, 0, x ];
	return { r: ( rgb[ 0 ] + m ) * 255, g: ( rgb[ 1 ] + m ) * 255, b: ( rgb[ 2 ] + m ) * 255 };
}

function parseAlpha( color ) {
	const m = /rgba?\([^)]*?,\s*([01]?\.?\d*)\s*\)$/i.exec( String( color || '' ) );
	if ( m ) {
		return Math.round( parseFloat( m[ 1 ] ) * 100 );
	}
	const hex8 = /^#[a-f\d]{8}$/i.exec( String( color || '' ).trim() );
	if ( hex8 ) {
		return Math.round( ( parseInt( color.slice( 7, 9 ), 16 ) / 255 ) * 100 );
	}
	return 100;
}

function clamp( v, min, max ) {
	return Math.max( min, Math.min( max, v ) );
}

export default function ColorControl( {
	config = {},
	value,
	onChange,
	device,
	state,
} ) {
	const {
		id,
		label,
		description,
		default: defaultValue = '',
	} = config;

	const currentColor = value !== undefined && value !== null ? String( value ) : String( defaultValue || '' );
	const isModified = currentColor !== String( defaultValue || '' );
	const [ showPalette, setShowPalette ] = useState( false );
	const [ areaHue, setAreaHue ] = useState( 0 );
	const areaRef = useRef( null );

	const handleHexChange = ( e ) => {
		onChange( e.target.value );
	};

	// Seed the area hue from the current color when the popover opens.
	useEffect( () => {
		if ( ! showPalette ) {
			return;
		}
		const rgb = hexToRgb( currentColor.startsWith( '#' ) ? currentColor.slice( 0, 7 ) : '' );
		if ( rgb ) {
			setAreaHue( rgbToHsv( rgb.r, rgb.g, rgb.b ).h );
		}
	}, [ showPalette ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const alpha = parseAlpha( currentColor );

	const baseRgb = hexToRgb( currentColor.startsWith( '#' ) && currentColor.length >= 7
		? currentColor.slice( 0, 7 )
		: ( currentColor || '#000000' ) ) || { r: 0, g: 0, b: 0 };
	const hsv = rgbToHsv( baseRgb.r, baseRgb.g, baseRgb.b );

	const emit = useCallback( ( h, s, v, a ) => {
		const { r, g, b } = hsvToRgb( h, s, v );
		const hex = rgbToHex( r, g, b );
		if ( a < 100 ) {
			onChange( `rgba(${ Math.round( r ) }, ${ Math.round( g ) }, ${ Math.round( b ) }, ${ ( a / 100 ).toFixed( 2 ) })` );
		} else {
			onChange( hex );
		}
	}, [ onChange ] );

	const pickFromArea = useCallback( ( e ) => {
		const el = areaRef.current;
		if ( ! el ) {
			return;
		}
		const apply = ( ev ) => {
			const rect = el.getBoundingClientRect();
			const s = clamp( ( ev.clientX - rect.left ) / rect.width, 0, 1 );
			const v = 1 - clamp( ( ev.clientY - rect.top ) / rect.height, 0, 1 );
			emit( areaHue, s, v, alpha );
		};
		apply( e );
		const onMove = ( ev ) => apply( ev );
		const onUp = () => {
			window.removeEventListener( 'mousemove', onMove );
			window.removeEventListener( 'mouseup', onUp );
		};
		window.addEventListener( 'mousemove', onMove );
		window.addEventListener( 'mouseup', onUp );
	}, [ areaHue, alpha, emit ] );

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ isModified }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-color"
		>
			<div className="xsb-color-control-wrap">
				<div className="xsb-color-input-row">
					<div
						className="xsb-color-swatch-chip"
						style={ { backgroundColor: currentColor || 'transparent' } }
					>
						<input
							type="color"
							id={ id ? `xsb-ctrl-${ id }` : undefined }
							value={ currentColor.startsWith( '#' ) && currentColor.length >= 7 ? currentColor.slice( 0, 7 ) : '#2563eb' }
							onChange={ handleHexChange }
							className="xsb-native-color-picker"
							title="Pick color"
						/>
					</div>
					<input
						type="text"
						value={ currentColor }
						placeholder="#000000 or rgba()"
						onChange={ handleHexChange }
						className="xsb-color-hex-input"
					/>
					<button
						type="button"
						className={ `xsb-color-palette-btn${ showPalette ? ' is-open' : '' }` }
						onClick={ () => setShowPalette( ( prev ) => ! prev ) }
						title={ __( 'Color picker', 'xcodesol-page-builder' ) }
						aria-expanded={ showPalette }
					>
						<span className="dashicons dashicons-admin-appearance" aria-hidden="true" />
					</button>
				</div>
				{ showPalette && (
					<div className="xsb-color-popover">
						<div
							className="xsb-color-picker-area"
							ref={ areaRef }
							style={ { '--xsb-area-hue': `hsl(${ areaHue } 100% 50%)` } }
							onMouseDown={ pickFromArea }
							role="presentation"
						>
							<span
								className="xsb-color-picker-dot"
								style={ {
									left: `${ hsv.s * 100 }%`,
									top: `${ ( 1 - hsv.v ) * 100 }%`,
								} }
							/>
						</div>
						<input
							type="range"
							min="0"
							max="360"
							value={ areaHue }
							onChange={ ( e ) => {
								const h = Number( e.target.value );
								setAreaHue( h );
								emit( h, hsv.s || 1, hsv.v || 1, alpha );
							} }
							className="xsb-color-picker-slider xsb-color-picker-slider--hue"
							aria-label={ __( 'Hue', 'xcodesol-page-builder' ) }
						/>
						<input
							type="range"
							min="0"
							max="100"
							value={ alpha }
							onChange={ ( e ) => emit( areaHue, hsv.s, hsv.v, Number( e.target.value ) ) }
							className="xsb-color-picker-slider xsb-color-picker-slider--alpha"
							style={ { '--xsb-area-hue': `hsl(${ areaHue } 100% 50%)` } }
							aria-label={ __( 'Opacity', 'xcodesol-page-builder' ) }
						/>
						<div className="xsb-color-picker-footer">
							<span
								className="xsb-color-picker-alpha-btn"
								style={ { '--xsb-pick-fill': currentColor } }
								aria-hidden="true"
							>
								A
							</span>
							<input
								type="text"
								value={ currentColor }
								placeholder="#000000"
								onChange={ handleHexChange }
								className="xsb-color-hex-input"
								aria-label={ __( 'Hex color', 'xcodesol-page-builder' ) }
							/>
						</div>
						<div className="xsb-theme-swatches-grid">
							{ THEME_COLOR_SWATCHES.map( ( s ) => (
								<button
									key={ s.value }
									type="button"
									className={ `xsb-swatch-dot${ currentColor.toLowerCase() === s.value.toLowerCase() ? ' is-active' : '' }` }
									style={ { backgroundColor: s.value } }
									onClick={ () => {
										onChange( s.value );
										setShowPalette( false );
									} }
									title={ s.label }
								/>
							) ) }
						</div>
					</div>
				) }
			</div>
		</ControlBase>
	);
}
