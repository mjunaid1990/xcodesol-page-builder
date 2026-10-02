import { __ } from '@wordpress/i18n';

export const DYNAMIC_CONTENT_OPTIONS = [
	{ value: 'post_title', label: __( 'Post title', 'xcodesol-page-builder' ) },
	{ value: 'post_excerpt', label: __( 'Post excerpt', 'xcodesol-page-builder' ) },
	{ value: 'post_content', label: __( 'Post content', 'xcodesol-page-builder' ) },
	{ value: 'site_title', label: __( 'Site title', 'xcodesol-page-builder' ) },
	{ value: 'site_tagline', label: __( 'Site description', 'xcodesol-page-builder' ) },
	{ value: 'archive_title', label: __( 'Archive title', 'xcodesol-page-builder' ) },
	{ value: 'archive_description', label: __( 'Archive description', 'xcodesol-page-builder' ) },
	{ value: 'current_date', label: __( 'Current date', 'xcodesol-page-builder' ) },
];

const PREVIEW_FALLBACKS = {
	post_title: __( 'Sample post title', 'xcodesol-page-builder' ),
	post_excerpt: __( 'A short summary of the current post.', 'xcodesol-page-builder' ),
	post_content: __( 'The current post content will appear here.', 'xcodesol-page-builder' ),
	site_title: __( 'Your site title', 'xcodesol-page-builder' ),
	site_tagline: __( 'Your site description', 'xcodesol-page-builder' ),
	archive_title: __( 'Archive title', 'xcodesol-page-builder' ),
	archive_description: __( 'The current archive description will appear here.', 'xcodesol-page-builder' ),
	current_date: new Intl.DateTimeFormat().format( new Date() ),
};

export function resolveDynamicPreview( source ) {
	const values = window.xcopbBuilderConfig?.dynamicPreviewValues || window.xcosbBuilderConfig?.dynamicPreviewValues || {};
	return values[ source ] || PREVIEW_FALLBACKS[ source ] || '';
}
