/**
 * Color control with an inline, full-featured picker.
 *
 * @package Xcodesol_Page_Builder
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ControlBase from './control-base';

const PALETTE = [
	'#4f46e5', '#6366f1', '#0f172a', '#334155', '#64748b', '#ffffff',
	'#10b981', '#f59e0b', '#ef4444', '#f8fafc', '#06b6d4', '#000000',
];

function toHex( color ) {
	if ( ! color ) return '#2563eb';
	const match = color.match( /^#([\da-f]{3}|[\da-f]{6})$/i );
	if ( ! match ) return '#2563eb';
	if ( match[ 1 ].length === 3 ) {
		return `#${ match[ 1 ].split( '' ).map( ( digit ) => digit + digit ).join( '' ) }`;
	}
	return `#${ match[ 1 ] }`;
}

function rgbToHex( red, green, blue ) {
	return `#${ [ red, green, blue ].map( ( value ) => Math.max( 0, Math.min( 255, Math.round( value ) ) ).toString( 16 ).padStart( 2, '0' ) ).join( '' ) }`;
}

function hslToRgb( hue, saturation, lightness ) {
	const h = ( ( hue % 360 ) + 360 ) % 360 / 360;
	const s = saturation / 100;
	const l = lightness / 100;
	const channel = ( n ) => {
		const k = ( n + h * 12 ) % 12;
		const a = s * Math.min( l, 1 - l );
		return 255 * ( l - a * Math.max( -1, Math.min( k - 3, 9 - k, 1 ) ) );
	};
	return [ channel( 0 ), channel( 8 ), channel( 4 ) ];
}

function parseColor( color ) {
	const source = String( color || '' ).trim();
	const hex = source.match( /^#([\da-f]{3}|[\da-f]{6})$/i );
	if ( hex ) {
		const normalized = toHex( source ).slice( 1 );
		return { rgb: [ 0, 2, 4 ].map( ( offset ) => parseInt( normalized.slice( offset, offset + 2 ), 16 ) ), alpha: 1 };
	}
	const rgb = source.match( /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i );
	if ( rgb ) return { rgb: [ Number( rgb[ 1 ] ), Number( rgb[ 2 ] ), Number( rgb[ 3 ] ) ], alpha: rgb[ 4 ] === undefined ? 1 : Math.max( 0, Math.min( 1, Number( rgb[ 4 ] ) ) ) };
	const hsl = source.match( /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i );
	if ( hsl ) return { rgb: hslToRgb( Number( hsl[ 1 ] ), Number( hsl[ 2 ] ), Number( hsl[ 3 ] ) ), alpha: hsl[ 4 ] === undefined ? 1 : Math.max( 0, Math.min( 1, Number( hsl[ 4 ] ) ) ) };
	const fallback = toHex( source ).slice( 1 );
	return { rgb: [ 0, 2, 4 ].map( ( offset ) => parseInt( fallback.slice( offset, offset + 2 ), 16 ) ), alpha: 1 };
}

function colorFormatFor( color ) {
	if ( /^rgba\(/i.test( color ) ) return 'rgba';
	if ( /^rgb\(/i.test( color ) ) return 'rgb';
	if ( /^hsla\(/i.test( color ) ) return 'hsla';
	if ( /^hsl\(/i.test( color ) ) return 'hsl';
	return 'hex';
}

function hsvToRgb( hue, saturation, value ) {
	const chroma = value * saturation;
	const x = chroma * ( 1 - Math.abs( ( hue / 60 ) % 2 - 1 ) );
	const match = value - chroma;
	let rgb = [ 0, 0, 0 ];
	if ( hue < 60 ) rgb = [ chroma, x, 0 ];
	else if ( hue < 120 ) rgb = [ x, chroma, 0 ];
	else if ( hue < 180 ) rgb = [ 0, chroma, x ];
	else if ( hue < 240 ) rgb = [ 0, x, chroma ];
	else if ( hue < 300 ) rgb = [ x, 0, chroma ];
	else rgb = [ chroma, 0, x ];
	return rgb.map( ( part ) => ( part + match ) * 255 );
}

function formatColor( hsv, alpha, format ) {
	const rgb = hsvToRgb( hsv.hue, hsv.saturation, hsv.value );
	if ( format === 'hex' ) return rgbToHex( ...rgb );
	if ( format === 'hsl' || format === 'hsla' ) {
		const saturation = hsv.saturation;
		const lightness = hsv.value * ( 1 - saturation / 2 );
		const hslSaturation = lightness === 0 || lightness === 1 ? 0 : ( hsv.value - lightness ) / Math.min( lightness, 1 - lightness );
		const values = `${ Math.round( hsv.hue ) }, ${ Math.round( hslSaturation * 100 ) }%, ${ Math.round( lightness * 100 ) }%`;
		return format === 'hsla' ? `hsla(${ values }, ${ Number( alpha.toFixed( 2 ) ) })` : `hsl(${ values })`;
	}
	const values = rgb.map( ( channel ) => Math.round( channel ) ).join( ', ' );
	return format === 'rgba' ? `rgba(${ values }, ${ Number( alpha.toFixed( 2 ) ) })` : `rgb(${ values })`;
}

function hexToHsv( hex ) {
	const [ redValue, greenValue, blueValue ] = parseColor( hex ).rgb;
	const red = redValue / 255;
	const green = greenValue / 255;
	const blue = blueValue / 255;
	const max = Math.max( red, green, blue );
	const min = Math.min( red, green, blue );
	const delta = max - min;
	let hue = 0;
	if ( delta ) {
		if ( max === red ) hue = ( ( green - blue ) / delta ) % 6;
		else if ( max === green ) hue = ( blue - red ) / delta + 2;
		else hue = ( red - green ) / delta + 4;
		hue = Math.round( hue * 60 );
		if ( hue < 0 ) hue += 360;
	}
	return { hue, saturation: max ? delta / max : 0, value: max };
}

function hsvToHex( hue, saturation, value ) {
	const chroma = value * saturation;
	const x = chroma * ( 1 - Math.abs( ( hue / 60 ) % 2 - 1 ) );
	const match = value - chroma;
	let rgb = [ 0, 0, 0 ];
	if ( hue < 60 ) rgb = [ chroma, x, 0 ];
	else if ( hue < 120 ) rgb = [ x, chroma, 0 ];
	else if ( hue < 180 ) rgb = [ 0, chroma, x ];
	else if ( hue < 240 ) rgb = [ 0, x, chroma ];
	else if ( hue < 300 ) rgb = [ x, 0, chroma ];
	else rgb = [ chroma, 0, x ];
	return `#${ rgb.map( ( part ) => Math.round( ( part + match ) * 255 ).toString( 16 ).padStart( 2, '0' ) ).join( '' ) }`;
}

export default function ColorControl( { config = {}, value, onChange, device, state, customPalette = [], overlayPopover = false } ) {
	const { id, label, description, default: defaultValue = '' } = config;
	const currentColor = value !== undefined && value !== null ? String( value ) : String( defaultValue || '' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ hsv, setHsv ] = useState( () => hexToHsv( currentColor ) );
	const [ alpha, setAlpha ] = useState( () => parseColor( currentColor ).alpha );
	const [ colorFormat, setColorFormat ] = useState( () => colorFormatFor( currentColor ) );
	const wrapperRef = useRef( null );
	const areaRef = useRef( null );
	const displayColor = currentColor || 'transparent';

	useEffect( () => {
		setHsv( hexToHsv( currentColor ) );
		setAlpha( parseColor( currentColor ).alpha );
		setColorFormat( colorFormatFor( currentColor ) );
	}, [ currentColor ] );
	useEffect( () => {
		if ( ! isOpen ) return undefined;
		const closeOnOutside = ( event ) => {
			if ( wrapperRef.current && ! wrapperRef.current.contains( event.target ) ) setIsOpen( false );
		};
		document.addEventListener( 'mousedown', closeOnOutside );
		return () => document.removeEventListener( 'mousedown', closeOnOutside );
	}, [ isOpen ] );

	const pickFromArea = ( event ) => {
		if ( ! areaRef.current ) return;
		const rect = areaRef.current.getBoundingClientRect();
		const saturation = Math.max( 0, Math.min( 1, ( event.clientX - rect.left ) / rect.width ) );
		const brightness = 1 - Math.max( 0, Math.min( 1, ( event.clientY - rect.top ) / rect.height ) );
		const next = { ...hsv, saturation, value: brightness };
		setHsv( next );
		onChange( formatColor( next, alpha, colorFormat ) );
	};

	const startAreaPick = ( event ) => {
		event.preventDefault();
		pickFromArea( event );
		const move = ( moveEvent ) => pickFromArea( moveEvent );
		const stop = () => {
			document.removeEventListener( 'mousemove', move );
			document.removeEventListener( 'mouseup', stop );
		};
		document.addEventListener( 'mousemove', move );
		document.addEventListener( 'mouseup', stop );
	};

	return (
		<ControlBase
			id={ id }
			label={ label }
			description={ description }
			device={ device }
			state={ state }
			isModified={ currentColor !== String( defaultValue || '' ) }
			onReset={ () => onChange( defaultValue ) }
			className="xsb-ctrl-color"
		>
			<div className="xsb-color-control-wrap" ref={ wrapperRef }>
				<div className="xsb-color-input-row">
					<button
						type="button"
						id={ id ? `xsb-ctrl-${ id }` : undefined }
						className="xsb-color-swatch-chip xsb-color-picker-trigger"
						style={ { backgroundColor: currentColor || 'transparent' } }
						title={ __( 'Choose color', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Choose color', 'xcodesol-page-builder' ) }
						aria-expanded={ isOpen }
						onClick={ () => setIsOpen( ( open ) => ! open ) }
					/>
					<input
						type="text"
						value={ currentColor }
						placeholder="HEX, RGB, RGBA, HSL or HSLA"
						onChange={ ( event ) => onChange( event.target.value ) }
						className="xsb-color-hex-input"
						aria-label={ label || __( 'Color value', 'xcodesol-page-builder' ) }
					/>
				</div>
				{ isOpen && (
					<div className={ `xsb-color-popover${ overlayPopover ? ' xsb-color-popover--anchored' : ' xsb-color-popover--inline' }` }>
						<div
							ref={ areaRef }
							className="xsb-color-picker-area"
									style={ { '--xsb-area-hue': hsvToHex( hsv.hue, 1, 1 ) } }
							onMouseDown={ startAreaPick }
							role="presentation"
						>
							<span className="xsb-color-picker-dot" style={ { left: `${ hsv.saturation * 100 }%`, top: `${ ( 1 - hsv.value ) * 100 }%` } } />
						</div>
						<input
							type="range"
							min="0"
							max="360"
							value={ hsv.hue }
							className="xsb-color-picker-slider xsb-color-picker-slider--hue"
							aria-label={ __( 'Hue', 'xcodesol-page-builder' ) }
							onChange={ ( event ) => {
								const hue = Number( event.target.value );
								const next = { ...hsv, hue };
								setHsv( next );
									onChange( formatColor( next, alpha, colorFormat ) );
								} }
						/>
						{ [ 'rgba', 'hsla' ].includes( colorFormat ) && (
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={ alpha }
								className="xsb-color-picker-slider xsb-color-picker-slider--alpha"
								aria-label={ __( 'Opacity', 'xcodesol-page-builder' ) }
								onChange={ ( event ) => {
									const nextAlpha = Number( event.target.value );
									setAlpha( nextAlpha );
									onChange( formatColor( hsv, nextAlpha, colorFormat ) );
								} }
							/>
						) }
						<div className="xsb-color-format-row">
							<label htmlFor={ id ? `xsb-color-format-${ id }` : undefined }>{ __( 'Format', 'xcodesol-page-builder' ) }</label>
							<select
								id={ id ? `xsb-color-format-${ id }` : undefined }
								value={ colorFormat }
								aria-label={ __( 'Color format', 'xcodesol-page-builder' ) }
								onChange={ ( event ) => {
									const nextFormat = event.target.value;
									setColorFormat( nextFormat );
									const nextAlpha = nextFormat === 'rgba' || nextFormat === 'hsla' ? alpha : 1;
									onChange( formatColor( hsv, nextAlpha, nextFormat ) );
								} }
							>
								<option value="hex">HEX</option>
								<option value="rgb">RGB</option>
								<option value="rgba">RGBA</option>
								<option value="hsl">HSL</option>
								<option value="hsla">HSLA</option>
							</select>
						</div>
						<div className="xsb-color-picker-footer">
							<span className="xsb-color-picker-preview" style={ { backgroundColor: displayColor } } />
							<code className="xsb-color-format-value">{ currentColor }</code>
						</div>
						<div className="xsb-color-swatch-grid" aria-label={ __( 'Color palette', 'xcodesol-page-builder' ) }>
							{ [ ...new Set( [ ...customPalette, ...PALETTE ].filter( ( color ) => typeof color === 'string' && color ) ) ].map( ( color ) => (
								<button
									key={ color }
									type="button"
									className={ `xsb-swatch-chip${ displayColor.toLowerCase() === color ? ' is-selected' : '' }` }
									style={ { backgroundColor: color } }
									title={ color }
									aria-label={ color }
									onClick={ () => onChange( color ) }
								/>
							) ) }
						</div>
					</div>
				) }
			</div>
		</ControlBase>
	);
}
