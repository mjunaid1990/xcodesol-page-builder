/**
 * Consistent Lucide-style SVG icons for Xcodesol Page Builder.
 * 1.5px to 1.75px stroke, modern and elegant.
 *
 * @package Xcodesol_Page_Builder
 */

import { createElement } from '@wordpress/element';

const defaultProps = {
	width: 16,
	height: 16,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.6,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
};

export function IconElements( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="7" height="7" x="3" y="3" rx="1.5" />
			<rect width="7" height="7" x="14" y="3" rx="1.5" />
			<rect width="7" height="7" x="14" y="14" rx="1.5" />
			<rect width="7" height="7" x="3" y="14" rx="1.5" />
		</svg>
	);
}

export function IconLayers( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<polygon points="12 2 2 7 12 12 22 7 12 2" />
			<polyline points="2 17 12 22 22 17" />
			<polyline points="2 12 12 17 22 12" />
		</svg>
	);
}

export function IconTemplates( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<path d="M3 9h18" />
			<path d="M9 21V9" />
		</svg>
	);
}

export function IconSearch( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="11" cy="11" r="7" />
			<path d="m21 21-4.3-4.3" />
		</svg>
	);
}

export function IconDesktop( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="20" height="14" x="2" y="3" rx="2" />
			<line x1="8" x2="16" y1="21" y2="21" />
			<line x1="12" x2="12" y1="17" y2="21" />
		</svg>
	);
}

export function IconTablet( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="16" height="20" x="4" y="2" rx="2" />
			<line x1="12" x2="12.01" y1="18" y2="18" />
		</svg>
	);
}

export function IconMobile( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="14" height="20" x="5" y="2" rx="2" />
			<line x1="12" x2="12.01" y1="17" y2="17" />
		</svg>
	);
}

export function IconUndo( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M3 7v6h6" />
			<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
		</svg>
	);
}

export function IconRedo( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M21 7v6h-6" />
			<path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
		</svg>
	);
}

export function IconZoomIn( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="11" cy="11" r="7" />
			<line x1="21" x2="16.65" y1="21" y2="16.65" />
			<line x1="11" x2="11" y1="8" y2="14" />
			<line x1="8" x2="14" y1="11" y2="11" />
		</svg>
	);
}

export function IconZoomOut( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="11" cy="11" r="7" />
			<line x1="21" x2="16.65" y1="21" y2="16.65" />
			<line x1="8" x2="14" y1="11" y2="11" />
		</svg>
	);
}

export function IconSun( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	);
}

export function IconMoon( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	);
}

export function IconCommand( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
		</svg>
	);
}

export function IconHelp( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="12" cy="12" r="10" />
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
			<path d="M12 17h.01" />
		</svg>
	);
}

export function IconSettings( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export function IconEye( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export function IconShare( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
			<line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
		</svg>
	);
}

export function IconSave( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
			<polyline points="17 21 17 13 7 13 7 21" />
			<polyline points="7 3 7 8 15 8" />
		</svg>
	);
}

export function IconCheck( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

export function IconChevronDown( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

export function IconChevronRight( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

export function IconChevronLeft( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m15 18-6-6 6-6" />
		</svg>
	);
}

export function IconStar( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
		</svg>
	);
}

export function IconStarFilled( props ) {
	return (
		<svg { ...defaultProps } fill="currentColor" { ...props }>
			<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
		</svg>
	);
}

export function IconTrash( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M3 6h18" />
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
		</svg>
	);
}

export function IconCopy( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
	);
}

export function IconArrowUp( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="12" x2="12" y1="19" y2="5" />
			<polyline points="5 12 12 5 19 12" />
		</svg>
	);
}

export function IconArrowDown( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="12" x2="12" y1="5" y2="19" />
			<polyline points="19 12 12 19 5 12" />
		</svg>
	);
}

export function IconPlus( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="12" x2="12" y1="5" y2="19" />
			<line x1="5" x2="19" y1="12" y2="12" />
		</svg>
	);
}

export function IconClose( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="18" x2="6" y1="6" y2="18" />
			<line x1="6" x2="18" y1="6" y2="18" />
		</svg>
	);
}

export function IconGrip( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="9" cy="12" r="1" />
			<circle cx="9" cy="5" r="1" />
			<circle cx="9" cy="19" r="1" />
			<circle cx="15" cy="12" r="1" />
			<circle cx="15" cy="5" r="1" />
			<circle cx="15" cy="19" r="1" />
		</svg>
	);
}

export function IconGridGuides( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<path d="M3 9h18" />
			<path d="M3 15h18" />
			<path d="M9 3v18" />
			<path d="M15 3v18" />
		</svg>
	);
}

export function IconSparkles( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
		</svg>
	);
}

export function IconInfo( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</svg>
	);
}

// Widget-specific icons for cards
export function IconWidgetContainer( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="18" x="3" y="3" rx="2" strokeDasharray="3 3" />
			<path d="M12 3v18" />
		</svg>
	);
}

export function IconWidgetHeading( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M6 12h12" />
			<path d="M6 4v16" />
			<path d="M18 4v16" />
		</svg>
	);
}

export function IconWidgetText( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M17 6.1H3" />
			<path d="M21 12.1H3" />
			<path d="M15.1 18H3" />
		</svg>
	);
}

export function IconWidgetImage( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<path d="m21 15-5-5L5 21" />
		</svg>
	);
}

export function IconWidgetButton( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="12" x="3" y="6" rx="3" />
			<path d="m10 12 4-2-4-2v4Z" fill="currentColor" />
		</svg>
	);
}

export function IconWidgetDivider( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="3" x2="21" y1="12" y2="12" strokeDasharray="4 2" />
		</svg>
	);
}

export function IconWidgetBanner( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="20" height="14" x="2" y="5" rx="2" />
			<path d="M2 10h20" />
			<path d="m8 15 4-2-4-2v4Z" fill="currentColor" />
		</svg>
	);
}

export function IconWidgetShortcode( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<polyline points="16 18 22 12 16 6" />
			<polyline points="8 6 2 12 8 18" />
		</svg>
	);
}

export function IconWidgetBreadcrumb( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m9 18 6-6-6-6" />
			<circle cx="5" cy="12" r="1" />
			<circle cx="19" cy="12" r="1" />
		</svg>
	);
}

export function IconWidgetProduct( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
			<path d="M3 6h18" />
			<path d="M16 10a4 4 0 0 1-8 0" />
		</svg>
	);
}

export function IconAlignLeft( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="21" x2="3" y1="6" y2="6" />
			<line x1="15" x2="3" y1="12" y2="12" />
			<line x1="17" x2="3" y1="18" y2="18" />
		</svg>
	);
}

export function IconAlignCenter( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="21" x2="3" y1="6" y2="6" />
			<line x1="17" x2="7" y1="12" y2="12" />
			<line x1="19" x2="5" y1="18" y2="18" />
		</svg>
	);
}

export function IconAlignRight( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="21" x2="3" y1="6" y2="6" />
			<line x1="21" x2="9" y1="12" y2="12" />
			<line x1="21" x2="7" y1="18" y2="18" />
		</svg>
	);
}

export function IconAlignJustify( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="21" x2="3" y1="6" y2="6" />
			<line x1="21" x2="3" y1="12" y2="12" />
			<line x1="21" x2="3" y1="18" y2="18" />
		</svg>
	);
}

export function IconLink( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
		</svg>
	);
}

export function IconUnlink( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
			<path d="m5.16 11.75-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" />
			<line x1="2" x2="22" y1="2" y2="22" />
		</svg>
	);
}

export function IconExternalLink( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
			<polyline points="15 3 21 3 21 9" />
			<line x1="10" x2="21" y1="14" y2="3" />
		</svg>
	);
}

export function IconPipette( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m2 22 1-1h3l9-9" />
			<path d="M19 8a2.12 2.12 0 0 0 0-3l-2-2a2.12 2.12 0 0 0-3 0L3.5 13.5a2 2 0 0 0-.5.9V18h3.6a2 2 0 0 0 .9-.5L19 8Z" />
		</svg>
	);
}

export function IconRotateCcw( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		</svg>
	);
}

export function IconArrowRight( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="5" y1="12" x2="19" y2="12" />
			<polyline points="12 5 19 12 12 19" />
		</svg>
	);
}

export function IconArrowLeft( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="19" y1="12" x2="5" y2="12" />
			<polyline points="12 19 5 12 12 5" />
		</svg>
	);
}

export function IconLayoutFlex( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<line x1="10" y1="3" x2="10" y2="21" />
			<line x1="15" y1="3" x2="15" y2="21" />
		</svg>
	);
}

export function IconLayoutGrid( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="7" height="7" x="3" y="3" rx="1" />
			<rect width="7" height="7" x="14" y="3" rx="1" />
			<rect width="7" height="7" x="14" y="14" rx="1" />
			<rect width="7" height="7" x="3" y="14" rx="1" />
		</svg>
	);
}

export function IconBoxed( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="12" height="16" x="6" y="4" rx="1.5" />
			<line x1="2" y1="12" x2="4" y2="12" />
			<line x1="20" y1="12" x2="22" y2="12" />
		</svg>
	);
}

export function IconFullWidth( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="14" x="3" y="5" rx="1.5" />
			<polyline points="7 10 4 12 7 14" />
			<polyline points="17 10 20 12 17 14" />
		</svg>
	);
}

export function IconJustifyStart( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="4" y1="3" x2="4" y2="21" />
			<rect width="5" height="10" x="7" y="7" rx="1" />
			<rect width="5" height="10" x="14" y="7" rx="1" />
		</svg>
	);
}

export function IconJustifyCenter( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2" />
			<rect width="5" height="10" x="5" y="7" rx="1" />
			<rect width="5" height="10" x="14" y="7" rx="1" />
		</svg>
	);
}

export function IconJustifyEnd( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="20" y1="3" x2="20" y2="21" />
			<rect width="5" height="10" x="5" y="7" rx="1" />
			<rect width="5" height="10" x="12" y="7" rx="1" />
		</svg>
	);
}

export function IconJustifyBetween( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="3" y1="3" x2="3" y2="21" />
			<line x1="21" y1="3" x2="21" y2="21" />
			<rect width="4" height="10" x="6" y="7" rx="1" />
			<rect width="4" height="10" x="14" y="7" rx="1" />
		</svg>
	);
}

export function IconJustifyAround( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="4" height="10" x="5" y="7" rx="1" />
			<rect width="4" height="10" x="15" y="7" rx="1" />
			<line x1="2" y1="3" x2="2" y2="21" strokeOpacity="0.4" />
			<line x1="22" y1="3" x2="22" y2="21" strokeOpacity="0.4" />
		</svg>
	);
}

export function IconJustifyEvenly( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="4" height="10" x="6" y="7" rx="1" />
			<rect width="4" height="10" x="14" y="7" rx="1" />
			<line x1="2" y1="12" x2="4" y2="12" />
			<line x1="20" y1="12" x2="22" y2="12" />
		</svg>
	);
}

export function IconAlignStart( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="3" y1="4" x2="21" y2="4" />
			<rect width="10" height="5" x="7" y="7" rx="1" />
			<rect width="10" height="5" x="7" y="14" rx="1" />
		</svg>
	);
}

export function IconAlignEnd( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="3" y1="20" x2="21" y2="20" />
			<rect width="10" height="5" x="7" y="5" rx="1" />
			<rect width="10" height="5" x="7" y="12" rx="1" />
		</svg>
	);
}

export function IconAlignStretch( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="3" y1="3" x2="21" y2="3" />
			<line x1="3" y1="21" x2="21" y2="21" />
			<rect width="12" height="10" x="6" y="7" rx="1" />
		</svg>
	);
}

export function IconWrap( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M3 6h15a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H3" />
			<polyline points="7 16 3 12 7 8" />
			<line x1="3" y1="18" x2="13" y2="18" />
		</svg>
	);
}

export function IconNoWrap( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<line x1="3" y1="8" x2="21" y2="8" />
			<line x1="3" y1="16" x2="21" y2="16" />
			<polyline points="17 4 21 8 17 12" />
		</svg>
	);
}

export function IconBrush( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" />
			<path d="M18 3a3 3 0 0 0-3 3c0 .88.38 1.67 1 2.22L13 11l6 6 2.78-3c.55.62 1.34 1 2.22 1a3 3 0 0 0 3-3c0-2-3-8-9-9Z" />
		</svg>
	);
}

export function IconGradient( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 3a9 9 0 0 1 0 18v-18Z" fill="currentColor" fillOpacity="0.4" />
		</svg>
	);
}

export function IconBan( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="12" cy="12" r="9" />
			<line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
		</svg>
	);
}

export function IconImage( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<path d="m21 15-5-5L5 21" />
		</svg>
	);
}

export function IconVideo( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<polygon points="23 7 16 12 23 17 23 7" />
			<rect width="13" height="14" x="2" y="5" rx="2" />
		</svg>
	);
}

export function IconGlobe( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<circle cx="12" cy="12" r="10" />
			<line x1="2" x2="22" y1="12" y2="12" />
			<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
		</svg>
	);
}

export function IconPalette( props ) {
	return (
		<svg { ...defaultProps } { ...props }>
			<path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.45-3.38 1.7 1.7 0 0 1 1.23-2.87H18a3 3 0 0 0 3-3c0-4.85-4.03-8.75-9-8.75Z" />
			<circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14" cy="7.5" r="1" />
		</svg>
	);
}

