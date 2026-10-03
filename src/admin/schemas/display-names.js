/**
 * Canonical panel copy. These labels affect presentation only; schema ids and
 * setting keys remain the source of storage and behavior.
 */
export const PANEL_SECTIONS = Object.freeze( {
	layout: 'Layout',
	typography: 'Typography',
	color: 'Colors',
	colors: 'Colors',
	background: 'Background',
	background_overlay: 'Background',
	border: 'Border',
	shape: 'Border',
	spacing: 'Spacing',
	effects: 'Effects',
	box_shadow: 'Effects',
	shadow: 'Effects',
	position: 'Advanced',
	transform: 'Advanced',
	motion: 'Advanced',
	responsive_visibility: 'Advanced',
	visibility: 'Advanced',
	attributes: 'Advanced',
	custom_code: 'Advanced',
	advanced: 'Advanced',
	image: 'Image',
	link: 'Link',
	content: 'Content',
	line: 'Line',
	decoration: 'Label',
	appearance: 'Style',
	frame: 'Background',
	size: 'Layout',
	overlay: 'Effects',
	paragraphs: 'Typography',
	blockquote: 'Border',
	style: 'Style',
	'button-style': 'Button',
	'arrows-style': 'Arrows',
	'arrow-style': 'Arrows',
	'heading-style': 'Typography',
	'description-style': 'Typography',
	'pagination-style': 'Effects',
	'content-position': 'Layout',
	'content-box': 'Background',
	'posts-query': 'Content',
	'post-query': 'Content',
	'slider': 'Layout',
	'slides': 'Content',
} );

export const PANEL_LABELS = Object.freeze( {
	font_size: 'Size', font_weight: 'Weight', font_family: 'Font', font_style: 'Style',
	line_height: 'Line height', letter_spacing: 'Spacing', text_transform: 'Transform',
	text_decoration: 'Decoration', text_decoration_color: 'Color', text_decoration_style: 'Style',
	border_width: 'Width', border_style: 'Style', border_color: 'Color', border_radius: 'Radius',
	button_border_width: 'Width', button_border_color: 'Color', button_border_radius: 'Radius',
	arrow_border_width: 'Width', arrow_border_color: 'Color', arrow_border_radius: 'Radius',
	background_color: 'Background', bg_color: 'Background', color: 'Text color',
	padding: 'Padding', margin: 'Margin', align: 'Alignment', text_align: 'Alignment',
	css_id: 'CSS ID', css_class: 'CSS class', hide_desktop: 'Hide on desktop',
	hide_tablet: 'Hide on tablet', hide_mobile: 'Hide on mobile',
} );

const LABEL_ALIASES = Object.freeze( {
	'Heading Typography Settings': 'Typography',
	'Background Color of the Button': 'Background',
	'Padding Around Content': 'Padding',
	'Border Radius Value': 'Radius',
	'Corner roundness (px)': 'Radius',
	'Corner radius (px)': 'Radius',
	'Border Radius (Corners)': 'Radius',
	'Border Type': 'Style',
	'Border Width': 'Width',
	'Border Color': 'Color',
	'Border Style': 'Style',
	'Text size (px)': 'Size',
	'Font size': 'Size',
	'Font weight': 'Weight',
	'Line spacing': 'Line height',
	'Letter spacing (px)': 'Spacing',
	'Outer spacing': 'Margin',
	'Inner spacing': 'Padding',
	'Space between paragraphs (px)': 'Paragraph spacing',
	'Overlay Opacity': 'Opacity',
	'Background color': 'Background',
	'Text color': 'Text color',
	'Link color': 'Link color',
	'Image alt text': 'Alt text',
	'Heading HTML tag': 'HTML tag',
	'Button destination URL': 'URL',
	'Open in a new tab': 'New tab',
	'Pause on hover and focus': 'Pause on hover',
	'Pause after user interaction': 'Pause on interaction',
	'Show previous / next arrows': 'Show arrows',
	'Only posts with a featured image': 'Has featured image',
	'Slide heading comes from': 'Heading source',
	'Slide description comes from': 'Description source',
	'Slide image comes from': 'Image source',
	'Clicking a slide': 'Slide link',
	'Button label alignment': 'Alignment',
	'Button alignment': 'Alignment',
	'Horizontal padding (px)': 'Padding X',
	'Vertical padding (px)': 'Padding Y',
	'Arrow icon size (px)': 'Icon size',
	'Distance from edge (px)': 'Inset',
	'Inactive color / track': 'Inactive color',
	'Active color / fill': 'Active color',
	'Active dot length (px)': 'Active length',
	'Space between dots (px)': 'Dot spacing',
	'Progress thickness (px)': 'Thickness',
	'Progress side inset (px)': 'Inset',
	'Progress track color': 'Track color',
	'Progress fill color': 'Fill color',
	'Content horizontal': 'Horizontal align',
	'Content vertical': 'Vertical align',
	'Horizontal offset': 'Offset X',
	'Vertical offset': 'Offset Y',
	'Custom radius': 'Radius',
	'Background type': 'Type',
	'Background video (MP4)': 'Video',
	'Image position': 'Position',
	'Image fit': 'Fit',
	'Content box color': 'Background',
	'Use content box': 'Content box',
	'Build slides from': 'Source',
	'Maximum slides': 'Slide count',
	'No results message': 'Empty message',
	'Responsive visibility': 'Visibility',
	'Attributes & Custom CSS': 'Advanced',
	'Attributes & custom CSS': 'Advanced',
	'Layout & Motion': 'Advanced',
	'Content & layout': 'Content',
	'Arrange Items': 'Layout',
	'Columns Settings': 'Columns',
	'Grid Settings': 'Grid',
	'Masonry Settings': 'Masonry',
	'Scroll Row Settings': 'Scroll row',
	'Additional Options': 'Options',
	'Background Overlay': 'Background',
	'Border & Corners': 'Border',
	'Box Shadow': 'Effects',
	'Box Shadows': 'Shadow',
	'Effects & Filters': 'Effects',
	'Typography Inheritance': 'Typography',
	'Spacing (Padding & Margin)': 'Spacing',
	'Size & crop': 'Layout',
	'Frame background': 'Background',
	'Border & shape': 'Border',
	'Image effects': 'Effects',
	'Optional label': 'Label',
	'Text & Link': 'Content',
	'WordPress block': 'Block',
	'Block markup': 'Markup',
	'Shortcode': 'Content',
} );

export function panelLabel( label, id ) {
	if ( id && PANEL_LABELS[ id ] ) {
		return PANEL_LABELS[ id ];
	}
	if ( id ) {
		if ( /(?:^|_)font_size$/.test( id ) ) return 'Size';
		if ( /(?:^|_)font_weight$/.test( id ) ) return 'Weight';
		if ( /(?:^|_)font_family$/.test( id ) ) return 'Font';
		if ( /(?:^|_)font_style$/.test( id ) ) return 'Style';
		if ( /(?:^|_)line_height$/.test( id ) ) return 'Line height';
		if ( /(?:^|_)letter_spacing$/.test( id ) ) return 'Spacing';
		if ( /(?:^|_)border_width$/.test( id ) ) return 'Width';
		if ( /(?:^|_)border_style$/.test( id ) ) return 'Style';
		if ( /(?:^|_)border_color$/.test( id ) ) return 'Color';
		if ( /(?:^|_)border_radius$/.test( id ) ) return 'Radius';
	}
	const source = typeof label === 'string' ? label : '';
	const normalized = LABEL_ALIASES[ source ] || source
		.replace( /\s*\((?:px|rem|em|%)\)/gi, '' )
		.replace( /\b(?:Font )?(?:size)\b/gi, 'Size' )
		.replace( /\b(?:Border )?radius\b/gi, 'Radius' )
		.replace( /\b(?:Padding around|Outer)\s+/gi, '' )
		.replace( /\s+(?:of the|value)\b/gi, '' )
		.replace( /\s+comes from\b/gi, ' source' )
		.replace( /^Slide\s+/i, '' )
		.replace( /^Button\s+(?:destination|style)\s+/i, '' )
		.trim();
	return normalized.split( /\s+/ ).length > 3 ? normalized.split( /\s+/ ).slice( 0, 3 ).join( ' ' ) : normalized;
}

export function panelControlConfig( control ) {
	const config = { ...control, label: panelLabel( control.label, control.id ) };
	if ( Array.isArray( control.itemSchema ) ) {
		config.itemSchema = control.itemSchema.map( panelControlConfig );
	}
	return config;
}

export function panelSectionTitle( section ) {
	const rawTitle = PANEL_SECTIONS[ section.id ] || LABEL_ALIASES[ section.title ] || section.title;
	const title = rawTitle ? rawTitle.replace( /\b[a-z]/g, ( letter ) => letter.toUpperCase() ) : rawTitle;
	return title && title.split( /\s+/ ).length > 2 ? title.split( /\s+/ ).slice( 0, 2 ).join( ' ' ) : title;
}

const STYLE_ORDER = [ 'Layout', 'Typography', 'Colors', 'Background', 'Border', 'Spacing', 'Effects', 'Advanced' ];

export function orderPanelSections( sections, tab ) {
	if ( tab !== 'style' ) {
		return sections;
	}
	return [ ...sections ].sort( ( first, second ) => {
		const firstTitle = panelSectionTitle( first );
		const secondTitle = panelSectionTitle( second );
		const firstOrder = STYLE_ORDER.indexOf( firstTitle );
		const secondOrder = STYLE_ORDER.indexOf( secondTitle );
		return ( firstOrder < 0 ? STYLE_ORDER.length : firstOrder ) - ( secondOrder < 0 ? STYLE_ORDER.length : secondOrder );
	} );
}
