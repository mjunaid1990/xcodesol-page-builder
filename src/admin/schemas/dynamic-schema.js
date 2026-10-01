const types = [
	'xcopb/post-title', 'xcopb/post-content', 'xcopb/post-featured-image',
	'xcopb/post-meta', 'xcopb/post-excerpt', 'xcopb/post-author-box',
	'xcopb/post-navigation', 'xcopb/post-comments', 'xcopb/archive-title',
	'xcopb/archive-description', 'xcopb/archive-posts',
];

export const manifest = {
	widget: 'dynamic-template',
	type: types[ 0 ],
	aliases: types.slice( 1 ),
	controls: [ 'text', 'textarea', 'select', 'number', 'toggle', 'color', 'dimensions', 'typography', 'visibility', 'code' ],
};

const on = ( ...blockTypes ) => ( { type: blockTypes } );
const postTitle = on( 'xcopb/post-title' );
const archiveTitle = on( 'xcopb/archive-title' );
const featuredImage = on( 'xcopb/post-featured-image' );
const postMeta = on( 'xcopb/post-meta' );
const postExcerpt = on( 'xcopb/post-excerpt' );
const archiveDescription = on( 'xcopb/archive-description' );
const archivePosts = on( 'xcopb/archive-posts' );
const authorBox = on( 'xcopb/post-author-box' );
const postNavigation = on( 'xcopb/post-navigation' );
const titleTypes = on( 'xcopb/post-title', 'xcopb/archive-title' );
const typographyTypes = on( 'xcopb/post-title', 'xcopb/post-excerpt', 'xcopb/archive-title', 'xcopb/archive-description' );
const marginTypes = on( 'xcopb/post-title', 'xcopb/post-featured-image', 'xcopb/post-meta', 'xcopb/post-excerpt', 'xcopb/archive-title', 'xcopb/archive-description' );

const commonStyle = [
	{ id: 'align', type: 'select', label: 'Alignment', tab: 'style', section: 'style', condition: on( 'xcopb/post-title', 'xcopb/post-featured-image', 'xcopb/post-meta', 'xcopb/post-excerpt', 'xcopb/archive-title', 'xcopb/archive-description' ), options: [ 'left', 'center', 'right' ].map( value => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
	{ id: 'color', type: 'color', label: 'Text color', tab: 'style', section: 'style', condition: on( 'xcopb/post-title', 'xcopb/post-meta', 'xcopb/post-excerpt', 'xcopb/archive-title', 'xcopb/archive-description' ) },
	{ id: 'font_size', type: 'number', label: 'Text size (px)', tab: 'style', section: 'style', min: 8, max: 120, condition: on( 'xcopb/post-title', 'xcopb/post-excerpt', 'xcopb/archive-title' ) },
	{ id: 'font_weight', type: 'select', label: 'Weight', tab: 'style', section: 'style', condition: on( 'xcopb/post-title', 'xcopb/archive-title' ), options: [ '300', '400', '500', '600', '700', '800' ].map( value => ( { value, label: value } ) ) },
	{ id: 'line_height', type: 'number', label: 'Line spacing', tab: 'style', section: 'style', min: 0.8, max: 3, step: 0.05, condition: on( 'xcopb/post-title', 'xcopb/post-excerpt' ) },
	{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', units: [ 'px', 'rem', '%' ], allowNegative: true, condition: marginTypes },
	{ id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', tab: 'advanced', section: 'visibility' },
	{ id: 'hide_tablet', type: 'toggle', label: 'Hide on tablet', tab: 'advanced', section: 'visibility' },
	{ id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', tab: 'advanced', section: 'visibility' },
	{ id: 'css_id', type: 'text', label: 'CSS ID', tab: 'advanced', section: 'attributes' },
	{ id: 'css_class', type: 'text', label: 'CSS classes', tab: 'advanced', section: 'attributes' },
];

export const DYNAMIC_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'content', tab: 'content', title: 'Content & layout', defaultOpen: true },
		{ id: 'style', tab: 'style', title: 'Typography', defaultOpen: true },
		{ id: 'spacing', tab: 'style', title: 'Spacing' },
		{ id: 'visibility', tab: 'advanced', title: 'Responsive visibility' },
		{ id: 'attributes', tab: 'advanced', title: 'Attributes' },
	],
	controls: [
		{ id: 'tag', type: 'select', label: 'HTML tag', tab: 'content', section: 'content', condition: titleTypes, options: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div' ].map( value => ( { value, label: value.toUpperCase() } ) ) },
		{ id: 'link_to_post', type: 'toggle', label: 'Link title to post', tab: 'content', section: 'content', condition: postTitle },
		{ id: 'include_context', type: 'toggle', label: 'Include archive context', tab: 'content', section: 'content', default: true, condition: archiveTitle },
		{ id: 'size', type: 'select', label: 'Image size', tab: 'content', section: 'content', condition: featuredImage, options: [ 'thumbnail', 'medium', 'large', 'full' ].map( value => ( { value, label: value[ 0 ].toUpperCase() + value.slice( 1 ) } ) ) },
		{ id: 'link_to_post', type: 'toggle', label: 'Link image to post', tab: 'content', section: 'content', condition: featuredImage },
		{ id: 'show_date', type: 'toggle', label: 'Show date', tab: 'content', section: 'content', condition: postMeta },
		{ id: 'show_author', type: 'toggle', label: 'Show author', tab: 'content', section: 'content', condition: postMeta },
		{ id: 'show_comments', type: 'toggle', label: 'Show comment count', tab: 'content', section: 'content', condition: postMeta },
		{ id: 'show_categories', type: 'toggle', label: 'Show categories', tab: 'content', section: 'content', condition: postMeta },
		{ id: 'columns', type: 'number', label: 'Posts per row', tab: 'content', section: 'content', min: 1, max: 6, default: 3, condition: archivePosts },
		{ id: 'show_image', type: 'toggle', label: 'Show featured image', tab: 'content', section: 'content', default: true, condition: archivePosts },
		{ id: 'show_meta', type: 'toggle', label: 'Show post details', tab: 'content', section: 'content', default: true, condition: archivePosts },
		{ id: 'show_excerpt', type: 'toggle', label: 'Show excerpt', tab: 'content', section: 'content', default: true, condition: archivePosts },
		{ id: 'show_button', type: 'toggle', label: 'Show read more link', tab: 'content', section: 'content', default: true, condition: archivePosts },
		{ id: 'button_text', type: 'text', label: 'Read more label', tab: 'content', section: 'content', default: 'Read More', condition: archivePosts },
		{ id: 'gap', type: 'number', label: 'Space between cards (px)', tab: 'content', section: 'content', min: 0, max: 100, default: 24, condition: archivePosts },
		{ id: 'prev_label', type: 'text', label: 'Previous post label', tab: 'content', section: 'content', condition: postNavigation },
		{ id: 'next_label', type: 'text', label: 'Next post label', tab: 'content', section: 'content', condition: postNavigation },
		{ id: 'border_radius', type: 'number', label: 'Corner roundness (px)', tab: 'style', section: 'style', min: 0, max: 50, default: 8, condition: on( 'xcopb/post-featured-image', 'xcopb/post-author-box' ) },
		{ id: 'align', type: 'select', label: 'Alignment', tab: 'style', section: 'style', condition: commonStyle[ 0 ].condition, options: commonStyle[ 0 ].options },
		{ id: 'color', type: 'color', label: 'Text color', tab: 'style', section: 'style', condition: commonStyle[ 1 ].condition },
		{ id: 'font_size', type: 'number', label: 'Text size (px)', tab: 'style', section: 'style', min: 8, max: 120, condition: on( 'xcopb/post-title', 'xcopb/post-excerpt', 'xcopb/archive-title' ) },
		{ id: 'font_weight', type: 'select', label: 'Weight', tab: 'style', section: 'style', condition: on( 'xcopb/post-title', 'xcopb/archive-title' ), options: commonStyle[ 3 ].options },
		{ id: 'line_height', type: 'number', label: 'Line spacing', tab: 'style', section: 'style', min: 0.8, max: 3, step: 0.05, condition: postExcerpt },
		{ id: 'margin', type: 'dimensions', label: 'Outer spacing', tab: 'style', section: 'spacing', units: [ 'px', 'rem', '%' ], allowNegative: true, condition: marginTypes },
		...commonStyle.filter( control => [ 'hide_desktop', 'hide_tablet', 'hide_mobile', 'css_id', 'css_class' ].includes( control.id ) ),
	],
};
