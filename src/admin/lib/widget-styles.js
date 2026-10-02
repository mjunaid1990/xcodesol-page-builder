/**
 * Shared preview style resolvers for the image, text, button, and divider
 * widgets. The corresponding PHP style builders live in Block Registry.
 *
 * @package Xcodesol_Page_Builder
 */

export const SHADOW_PRESETS = {
	soft: '0 4px 14px rgba(0,0,0,.12)',
	medium: '0 10px 28px rgba(0,0,0,.18)',
	strong: '0 18px 50px rgba(0,0,0,.28)',
};

export function resolveTextWidgetStyle( settings = {} ) {
	const style = {
		textAlign: settings.align || 'left',
		color: settings.color || undefined,
		fontSize: settings.font_size !== undefined && settings.font_size !== '' ? `${ Number( settings.font_size ) }px` : undefined,
		fontWeight: settings.font_weight || undefined,
		fontStyle: settings.font_style || undefined,
		fontFamily: settings.font_family || undefined,
		textTransform: settings.text_transform && settings.text_transform !== 'none' ? settings.text_transform : undefined,
		textDecorationLine: settings.text_decoration && settings.text_decoration !== 'none' ? settings.text_decoration : undefined,
		textDecorationStyle: settings.text_decoration_style || undefined,
		textDecorationColor: settings.text_decoration_color || undefined,
		textShadow: settings.text_shadow || undefined,
		lineHeight: settings.line_height || undefined,
		letterSpacing: settings.letter_spacing !== undefined && settings.letter_spacing !== '' ? `${ Number( settings.letter_spacing ) }px` : undefined,
		backgroundColor: settings.background_color || settings.blockquote_background || undefined,
		opacity: settings.opacity !== undefined && settings.opacity !== '' && Number.isFinite( Number( settings.opacity ) ) ? Math.min( 100, Math.max( 0, Number( settings.opacity ) ) ) / 100 : undefined,
		border: Number( settings.border_width ) > 0 ? `${ Math.min( 20, Number( settings.border_width ) ) }px ${ settings.border_style || 'solid' } ${ settings.border_color || settings.blockquote_color || '#000' }` : undefined,
		borderLeft: settings.blockquote_color ? `${ Math.max( 2, Number( settings.border_width ) || 0 ) }px solid ${ settings.blockquote_color }` : undefined,
		borderRadius: Number( settings.border_radius ) > 0 ? `${ Math.min( 100, Number( settings.border_radius ) ) }px` : undefined,
		padding: Number( settings.padding ) > 0 ? `${ Math.min( 100, Number( settings.padding ) ) }px` : undefined,
		boxSizing: Number( settings.padding ) > 0 || Number( settings.border_width ) > 0 ? 'border-box' : undefined,
		wordBreak: settings.word_break === 'keep-all' ? 'keep-all' : undefined,
		overflowWrap: settings.word_break === 'break-word' ? 'anywhere' : undefined,
		'--xsb-text-link-color': settings.link_color || undefined,
		'--xsb-text-paragraph-gap': Number.isFinite( Number( settings.paragraph_spacing ) ) ? `${ Number( settings.paragraph_spacing ) }px` : undefined,
	};
	if ( Number( settings.text_columns ) > 1 ) {
		style.columns = Number( settings.text_columns );
		style.columnGap = `${ Number( settings.column_gap ) || 24 }px`;
	}
	if ( settings.animation && settings.animation !== 'none' ) {
		style.animation = `xsb-motion-${ settings.animation } ${ Number( settings.animation_duration ) || 600 }ms ${ settings.animation_easing || 'ease' } ${ settings.animation_repeat || '1' } both`;
		style.animationDelay = `${ Number( settings.animation_delay ) || 0 }ms`;
	}
	return style;
}

export function resolveButtonWidgetStyle( settings = {}, buttonBackground = '' ) {
	const size = settings.size || 'md';
	const sizes = { xs: [ 12, 6, 12 ], sm: [ 13, 8, 16 ], md: [ 15, 12, 24 ], lg: [ 17, 16, 32 ], xl: [ 19, 20, 40 ] };
	const [ defaultFontSize, defaultY, defaultX ] = sizes[ size ] || sizes.md;
	return {
		display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: `${ Math.min( 60, Number( settings.icon_gap ?? 8 ) ) }px`,
		background: buttonBackground || settings.bg_color || '#2563eb', color: settings.text_color || '#fff',
		padding: `${ Number( settings.padding_y ?? defaultY ) }px ${ Number( settings.padding_x ?? defaultX ) }px`,
		fontSize: `${ Number( settings.font_size ) || defaultFontSize }px`, fontWeight: settings.font_weight || 600,
		fontStyle: settings.font_style || 'normal', lineHeight: Number( settings.line_height ) || 1.2,
		fontFamily: settings.font_family || undefined, letterSpacing: Number( settings.letter_spacing ) ? `${ Number( settings.letter_spacing ) }px` : undefined,
		textTransform: settings.text_transform || undefined, textShadow: settings.text_shadow || undefined,
		borderRadius: `${ Number( settings.border_radius ?? 6 ) }px`,
		border: settings.border_style && settings.border_style !== 'none' ? `${ Number( settings.border_width ) || 1 }px ${ settings.border_style } ${ settings.border_color || '#2563eb' }` : 'none',
		boxShadow: SHADOW_PRESETS[ settings.box_shadow ] || undefined, textDecoration: 'none', cursor: 'pointer',
		transition: `all ${ Math.min( 2000, Number( settings.transition_duration ?? 200 ) ) }ms ease`,
		width: settings.full_width ? '100%' : undefined,
		minWidth: Number( settings.min_width ) > 0 ? `${ Math.min( 1200, Number( settings.min_width ) ) }px` : undefined,
		'--xsb-hover-lift': `${ Math.min( 30, Number( settings.hover_lift ) || 0 ) }px`,
	};
}

export function resolveDividerWidgetStyles( settings = {} ) {
	const color = settings.color || '#e6e9f0';
	const height = Math.max( 1, Number( settings.height ) || 2 );
	const style = settings.style || 'solid';
	const line = {
		position: 'relative',
		width: `${ Math.min( 100, Math.max( 5, Number( settings.width ) || 100 ) ) }%`,
		height: `${ height }px`, margin: `${ Number( settings.margin ) || 24 }px 0`,
		background: style === 'gradient' ? `linear-gradient(${ Math.min( 360, Number( settings.gradient_angle ) || 90 ) }deg, ${ color }, ${ settings.gradient_color || '#4f46e5' })` : color,
		border: style === 'double' ? `${ height / 3 }px double ${ color }` : 'none',
		borderRadius: `${ Math.min( 100, Number( settings.line_radius ) || 0 ) }px`,
		opacity: Math.min( 100, Math.max( 0, Number( settings.line_opacity ?? 100 ) ) ) / 100,
		boxShadow: SHADOW_PRESETS[ settings.line_shadow ] || undefined,
		marginLeft: settings.align === 'left' ? '0' : 'auto', marginRight: settings.align === 'right' ? '0' : 'auto',
	};
	if ( [ 'dashed', 'dotted' ].includes( style ) ) {
		line.height = '0'; line.borderTop = `${ height }px ${ style } ${ color }`; line.background = 'transparent';
	}
	const label = {
		position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: `0 ${ Math.min( 60, Number( settings.label_padding ?? 10 ) ) }px`,
		color: settings.label_color || '#64748b', background: settings.label_background || '#fff',
		fontSize: `${ Number( settings.label_size ) || 14 }px`, fontFamily: settings.label_font_family || undefined,
		fontWeight: settings.label_font_weight || '400', letterSpacing: `${ Number( settings.label_letter_spacing ) || 0 }px`, whiteSpace: 'nowrap',
	};
	return { line, label };
}
