/**
 * Modern 3-zone Elements, Layers & Templates palette with search and favorites.
 *
 * @package Xcodesol_Page_Builder
 */

import { useState, useMemo, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDraggable } from '@dnd-kit/core';
import {
	IconElements,
	IconLayers,
	IconTemplates,
	IconSearch,
	IconClose,
	IconStar,
	IconStarFilled,
	IconChevronDown,
	IconChevronRight,
	IconGrip,
	IconPlus,
	IconTrash,
	IconArrowUp,
	IconArrowDown,
	IconWidgetContainer,
	IconWidgetHeading,
	IconWidgetText,
	IconWidgetImage,
	IconWidgetButton,
	IconWidgetDivider,
	IconWidgetBanner,
	IconWidgetShortcode,
	IconWidgetBreadcrumb,
	IconWidgetProduct,
} from './icons';

// 1. Layout & Containers
export const CONTAINER_BLOCKS = [
	{
		type: 'xcopb/gb-container',
		label: __( 'Container', 'xcodesol-page-builder' ),
		// A new container starts as one full-width column so its own layout
		// mode (Columns / Grid / Masonry…) is what splits it up, instead of
		// being pre-split into two halves.
		defaults: { columns: 1, column_widths: [ 12 ], gap: 20, padding: { top: 20, right: 20, bottom: 20, left: 20, unit: 'px', isLinked: true }, align: 'stretch', background: '', border_radius: 8, content_width: 'boxed', max_width: { value: 1200, unit: 'px' } },
		icon: 'dashicons-editor-table',
		category: 'layout',
		description: __( 'Responsive container: full width until you give it a layout.', 'xcodesol-page-builder' ),
	},
];

// 2. Core Basic Elements (Elementor-Style)
export const BASIC_BLOCKS = [
	{
		type: 'xcopb/gb-heading',
		label: __( 'Heading', 'xcodesol-page-builder' ),
		defaults: { title: __( 'Add Your Heading Text', 'xcodesol-page-builder' ), tag: 'h2', align: 'left' },
		icon: 'dashicons-heading',
		category: 'basic',
		description: __( 'Add eye-catching headlines.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/gb-image',
		label: __( 'Image', 'xcodesol-page-builder' ),
		defaults: { url: '', alt: '', align: 'left', max_width: '100%', border_radius: 0 },
		icon: 'dashicons-format-image',
		category: 'basic',
		description: __( 'Insert responsive photos and media.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/gb-text',
		label: __( 'Text Editor', 'xcodesol-page-builder' ),
		defaults: { content: __( 'Add your text here. A paragraph with rich typography and styling.', 'xcodesol-page-builder' ), tag: 'p', color: '', align: 'left' },
		icon: 'dashicons-editor-paragraph',
		category: 'basic',
		description: __( 'Rich text paragraphs with formatting.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/gb-button',
		label: __( 'Button', 'xcodesol-page-builder' ),
		defaults: { text: __( 'Click Here', 'xcodesol-page-builder' ), link: '#', align: 'left', size: 'md', bg_color: '#4f46e5', text_color: '#ffffff', border_radius: 6 },
		icon: 'dashicons-button',
		category: 'basic',
		description: __( 'Interactive call-to-action buttons.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/gb-divider',
		label: __( 'Divider', 'xcodesol-page-builder' ),
		defaults: { height: 2, color: '#e2e8f0', style: 'solid', margin: 24 },
		icon: 'dashicons-minus',
		category: 'basic',
		description: __( 'Divide sections with lines or whitespace.', 'xcodesol-page-builder' ),
	},
];

// 3. General & Advanced Elements
export const GENERAL_BLOCKS = [
	{
		type: 'xcopb/gb-banner',
		label: __( 'Hero Banner', 'xcodesol-page-builder' ),
		defaults: { title: __( 'Designed for Creators', 'xcodesol-page-builder' ), subtitle: __( 'Take visual control over your website with effortless drag & drop.', 'xcodesol-page-builder' ), link: '', button_text: __( 'Get Started', 'xcodesol-page-builder' ), align: 'center', background: '#4f46e5', text_color: '#ffffff', padding: 80 },
		icon: 'dashicons-megaphone',
		category: 'general',
		description: __( 'Hero section with CTA and rich backgrounds.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/gb-shortcode',
		label: __( 'Shortcode', 'xcodesol-page-builder' ),
		defaults: { title: '', shortcode: '' },
		icon: 'dashicons-shortcode',
		category: 'general',
		description: __( 'Embed any WordPress or plugin shortcode.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/gb-breadcrumb',
		label: __( 'Breadcrumbs', 'xcodesol-page-builder' ),
		defaults: {},
		icon: 'dashicons-menu-alt3',
		category: 'general',
		description: __( 'Display navigation trail hierarchy.', 'xcodesol-page-builder' ),
	},
];

// 4. Classic Rich HTML widget
export const WIDGET_BLOCKS = [
	{
		type: 'xcopb/gb-text-widget',
		label: __( 'HTML / Text Widget', 'xcodesol-page-builder' ),
		defaults: { title: '', content: '' },
		icon: 'dashicons-editor-code',
		category: 'general',
		description: __( 'Custom HTML, embeds, or formatted widgets.', 'xcodesol-page-builder' ),
	},
];

// Single Post Template Elements
export const SINGLE_POST_BLOCKS = [
	{
		type: 'xcopb/sp-title',
		label: __( 'Post Title', 'xcodesol-page-builder' ),
		defaults: { tag: 'h1', align: 'left', font_size: 32 },
		icon: 'dashicons-heading',
		category: 'single_post',
		description: __( 'Displays the dynamic post or page title.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/sp-content',
		label: __( 'Post Content', 'xcodesol-page-builder' ),
		defaults: {},
		icon: 'dashicons-media-document',
		category: 'single_post',
		description: __( 'The main body content of the post.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/sp-featured-image',
		label: __( 'Featured Image', 'xcodesol-page-builder' ),
		defaults: { align: 'center', border_radius: 8 },
		icon: 'dashicons-format-image',
		category: 'single_post',
		description: __( 'Displays the featured image dynamically.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/sp-post-meta',
		label: __( 'Post Meta', 'xcodesol-page-builder' ),
		defaults: { show_author: true, show_date: true, show_categories: true },
		icon: 'dashicons-admin-users',
		category: 'single_post',
		description: __( 'Author, published date, and categories.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/sp-comments',
		label: __( 'Post Comments', 'xcodesol-page-builder' ),
		defaults: {},
		icon: 'dashicons-admin-comments',
		category: 'single_post',
		description: __( 'WordPress comment list and submission form.', 'xcodesol-page-builder' ),
	},
];

// Archive Template Elements
export const ARCHIVE_BLOCKS = [
	{
		type: 'xcopb/ar-title',
		label: __( 'Archive Title', 'xcodesol-page-builder' ),
		defaults: { tag: 'h1', align: 'left' },
		icon: 'dashicons-heading',
		category: 'archive',
		description: __( 'Displays category, tag, or author archive title.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/ar-description',
		label: __( 'Archive Description', 'xcodesol-page-builder' ),
		defaults: { align: 'left' },
		icon: 'dashicons-editor-paragraph',
		category: 'archive',
		description: __( 'Description text for the current taxonomy term.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/ar-loop',
		label: __( 'Posts Loop / Grid', 'xcodesol-page-builder' ),
		defaults: { columns: 3, posts_per_page: 9 },
		icon: 'dashicons-grid-view',
		category: 'archive',
		description: __( 'Responsive grid or list of archive posts.', 'xcodesol-page-builder' ),
	},
	{
		type: 'xcopb/ar-pagination',
		label: __( 'Archive Pagination', 'xcodesol-page-builder' ),
		defaults: { align: 'center' },
		icon: 'dashicons-ellipsis',
		category: 'archive',
		description: __( 'Previous/Next and numeric page navigation.', 'xcodesol-page-builder' ),
	},
];

export const WOO_CONTENT_BLOCKS = [];

export function getBlocksForView( viewType ) {
	if ( 'single_post' === viewType || 'single' === viewType ) {
		return [ ...SINGLE_POST_BLOCKS, ...CONTAINER_BLOCKS, ...GENERAL_BLOCKS, ...WIDGET_BLOCKS ];
	}
	if ( 'archive' === viewType ) {
		return [ ...ARCHIVE_BLOCKS, ...CONTAINER_BLOCKS, ...GENERAL_BLOCKS, ...WIDGET_BLOCKS ];
	}
	return [ ...CONTAINER_BLOCKS, ...GENERAL_BLOCKS, ...SINGLE_POST_BLOCKS, ...ARCHIVE_BLOCKS, ...WIDGET_BLOCKS ];
}

// Starter Layout Presets for Templates tab
const STARTER_PRESETS = [
	{
		id: 'hero-banner',
		title: __( 'Hero Banner', 'xcodesol-page-builder' ),
		desc: __( 'Eye-catching headline with CTA and description.', 'xcodesol-page-builder' ),
		category: 'Hero',
		blocks: [
			{
				type: 'xcopb/gb-banner',
				settings: {
					title: __( 'Empower Your Online Presence', 'xcodesol-page-builder' ),
					subtitle: __( 'High performance, visual editing crafted for WordPress creators.', 'xcodesol-page-builder' ),
					button_text: __( 'Get Started Free', 'xcodesol-page-builder' ),
					background: '#4f46e5',
					text_color: '#ffffff',
					padding: 72,
					align: 'center',
				},
			},
		],
	},
	{
		id: 'two-col-features',
		title: __( '2-Column Split', 'xcodesol-page-builder' ),
		desc: __( 'Text + Button on the left, visual card on the right.', 'xcodesol-page-builder' ),
		category: 'Features',
		blocks: [
			{
				type: 'xcopb/gb-container',
				settings: { columns: 2, column_widths: [ 6, 6 ], gap: 32, padding: 32 },
				inner: [
					[
						{ type: 'xcopb/gb-heading', settings: { title: __( 'Modern Page Building', 'xcodesol-page-builder' ), tag: 'h2' } },
						{ type: 'xcopb/gb-text', settings: { content: __( 'Full control over layouts, typography, and styling without writing a single line of code.', 'xcodesol-page-builder' ) } },
						{ type: 'xcopb/gb-button', settings: { text: __( 'Learn More', 'xcodesol-page-builder' ), bg_color: '#4f46e5', text_color: '#ffffff' } },
					],
					[
						{ type: 'xcopb/gb-banner', settings: { title: __( 'Live Preview', 'xcodesol-page-builder' ), subtitle: __( 'Instant visual feedback', 'xcodesol-page-builder' ), padding: 50, background: '#1e1b4b' } },
					],
				],
			},
		],
	},
	{
		id: 'three-col-cards',
		title: __( '3-Column Features', 'xcodesol-page-builder' ),
		desc: __( 'Three feature columns with title and description text.', 'xcodesol-page-builder' ),
		category: 'Cards',
		blocks: [
			{
				type: 'xcopb/gb-container',
				settings: { columns: 3, column_widths: [ 4, 4, 4 ], gap: 24, padding: 24 },
				inner: [
					[
						{ type: 'xcopb/gb-heading', settings: { title: __( 'Fast & Lightweight', 'xcodesol-page-builder' ), tag: 'h3' } },
						{ type: 'xcopb/gb-text', settings: { content: __( 'Built for maximum performance and clean semantic markup.', 'xcodesol-page-builder' ) } },
					],
					[
						{ type: 'xcopb/gb-heading', settings: { title: __( 'Responsive Views', 'xcodesol-page-builder' ), tag: 'h3' } },
						{ type: 'xcopb/gb-text', settings: { content: __( 'Preview and refine layouts for desktop, tablet, and mobile.', 'xcodesol-page-builder' ) } },
					],
					[
						{ type: 'xcopb/gb-heading', settings: { title: __( 'Flexible Options', 'xcodesol-page-builder' ), tag: 'h3' } },
						{ type: 'xcopb/gb-text', settings: { content: __( 'Custom styles, popover editors, and display condition rules.', 'xcodesol-page-builder' ) } },
					],
				],
			},
		],
	},
	{
		id: 'blank-container',
		title: __( 'Empty Container', 'xcodesol-page-builder' ),
		desc: __( 'A clean 2-column flex container ready for custom widgets.', 'xcodesol-page-builder' ),
		category: 'Layout',
		blocks: [
			{
				type: 'xcopb/gb-container',
				settings: { columns: 2, column_widths: [ 6, 6 ], gap: 20, padding: 24 },
				inner: [ [], [] ],
			},
		],
	},
];

function renderBlockIcon( type, fallbackIcon ) {
	if ( type.includes( 'container' ) ) return <IconWidgetContainer width={ 20 } height={ 20 } />;
	if ( type.includes( 'heading' ) ) return <IconWidgetHeading width={ 20 } height={ 20 } />;
	if ( type.includes( 'text-widget' ) ) return <IconWidgetShortcode width={ 20 } height={ 20 } />;
	if ( type.includes( 'text' ) ) return <IconWidgetText width={ 20 } height={ 20 } />;
	if ( type.includes( 'image' ) ) return <IconWidgetImage width={ 20 } height={ 20 } />;
	if ( type.includes( 'button' ) ) return <IconWidgetButton width={ 20 } height={ 20 } />;
	if ( type.includes( 'divider' ) ) return <IconWidgetDivider width={ 20 } height={ 20 } />;
	if ( type.includes( 'banner' ) ) return <IconWidgetBanner width={ 20 } height={ 20 } />;
	if ( type.includes( 'shortcode' ) ) return <IconWidgetShortcode width={ 20 } height={ 20 } />;
	if ( type.includes( 'breadcrumb' ) ) return <IconWidgetBreadcrumb width={ 20 } height={ 20 } />;
	if ( type.includes( 'loop' ) || type.includes( 'product' ) ) return <IconWidgetProduct width={ 20 } height={ 20 } />;
	return <span className={ `dashicons ${ fallbackIcon || 'dashicons-admin-generic' }` } />;
}

function FavoriteChip( { block, uid, onToggleFavorite, onClick } ) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable( {
		id: `fav-chip-${ uid }`,
		data: { fromPalette: true, block },
	} );

	return (
		<div
			ref={ setNodeRef }
			{ ...attributes }
			{ ...listeners }
			role="button"
			tabIndex={ 0 }
			className={ `xsb-fav-chip${ isDragging ? ' is-dragging' : '' }` }
			onClick={ onClick }
			onKeyDown={ ( e ) => {
				if ( e.key === 'Enter' || e.key === ' ' ) {
					e.preventDefault();
					onClick();
				}
			} }
			title={ `${ block.label } — ${ block.description || '' }` }
			aria-label={ sprintf( __( 'Add %s', 'xcodesol-page-builder' ), block.label ) }
		>
			<span className="xsb-fav-chip__icon" aria-hidden="true">
				{ renderBlockIcon( block.type, block.icon ) }
			</span>
			<button
				type="button"
				className="xsb-fav-chip__unfav"
				onClick={ ( e ) => {
					e.stopPropagation();
					onToggleFavorite( block.type );
				} }
				title={ __( 'Remove from favorites', 'xcodesol-page-builder' ) }
				aria-label={ __( 'Remove from favorites', 'xcodesol-page-builder' ) }
			>
				&times;
			</button>
		</div>
	);
}

function PaletteItem( { block, uid, isFavorite, onToggleFavorite, onClick } ) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable( {
		id: uid,
		data: { fromPalette: true, block },
	} );

	return (
		<div
			ref={ setNodeRef }
			{ ...attributes }
			{ ...listeners }
			role="button"
			tabIndex={ 0 }
			className={ `xsb-palette-card xcopb-palette-card${ isDragging ? ' is-dragging' : '' }` }
			onClick={ onClick }
			onKeyDown={ ( e ) => {
				if ( e.key === 'Enter' || e.key === ' ' ) {
					e.preventDefault();
					onClick();
				}
			} }
			title={ block.description ? `${ block.label } — ${ block.description }` : block.label }
			aria-label={ sprintf( __( 'Add %s', 'xcodesol-page-builder' ), block.label ) }
		>
			<button
				type="button"
				className={ `xsb-palette-card__fav-btn${ isFavorite ? ' is-fav' : '' }` }
				onClick={ ( e ) => {
					e.stopPropagation();
					onToggleFavorite( block.type );
				} }
				title={ isFavorite ? __( 'Remove from favorites', 'xcodesol-page-builder' ) : __( 'Add to favorites', 'xcodesol-page-builder' ) }
				aria-label={ isFavorite ? __( 'Remove from favorites', 'xcodesol-page-builder' ) : __( 'Add to favorites', 'xcodesol-page-builder' ) }
			>
				{ isFavorite ? <IconStarFilled width={ 13 } height={ 13 } /> : <IconStar width={ 13 } height={ 13 } /> }
			</button>

			<span className="xsb-palette-card__icon" aria-hidden="true">
				{ renderBlockIcon( block.type, block.icon ) }
			</span>

			<span className="xsb-palette-card__label">{ block.label }</span>
		</div>
	);
}

export default function BlockPalette( {
	viewType,
	structure,
	allowedBlockTypes,
	layout = [],
	selectedIndex = null,
	selectedNested = null,
	onSelectBlockIndex,
	onSelectNestedBlock,
	onMoveBlockIndex,
	onDeleteBlockIndex,
	onAdd,
	onAddPreset,
} ) {
	const [ activeTab, setActiveTab ] = useState( 'elements' );
	const [ search, setSearch ] = useState( '' );
	const [ favorites, setFavorites ] = useState( () => {
		try {
			const saved = localStorage.getItem( 'xcopb_fav_blocks' );
			return saved ? JSON.parse( saved ) : [];
		} catch ( e ) {
			return [];
		}
	} );

	const [ collapsedGroups, setCollapsedGroups ] = useState( {} );
	const searchInputRef = useRef( null );

	// Save favorites in localStorage
	useEffect( () => {
		try {
			localStorage.setItem( 'xcopb_fav_blocks', JSON.stringify( favorites ) );
		} catch ( e ) {}
	}, [ favorites ] );

	// Listen for "/" shortcut to focus search
	useEffect( () => {
		function handleGlobalSlash( e ) {
			if ( e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' ) {
				e.preventDefault();
				setActiveTab( 'elements' );
				setTimeout( () => searchInputRef.current?.focus(), 50 );
			}
		}
		window.addEventListener( 'keydown', handleGlobalSlash );
		return () => window.removeEventListener( 'keydown', handleGlobalSlash );
	}, [] );

	function toggleFavorite( blockType ) {
		setFavorites( ( prev ) =>
			prev.includes( blockType )
				? prev.filter( ( t ) => t !== blockType )
				: [ ...prev, blockType ]
		);
	}

	function toggleGroup( groupId ) {
		setCollapsedGroups( ( prev ) => ( {
			...prev,
			[ groupId ]: ! prev[ groupId ],
		} ) );
	}

	const isSingle = 'single_post' === viewType || 'single' === viewType;
	const isArchive = 'archive' === viewType;

	// All available blocks list (no duplicate basic blocks)
	const allBlocks = useMemo( () => {
		return [
			...CONTAINER_BLOCKS,
			...BASIC_BLOCKS,
			...GENERAL_BLOCKS,
			...WIDGET_BLOCKS,
			...( isSingle ? SINGLE_POST_BLOCKS : [] ),
			...( isArchive ? ARCHIVE_BLOCKS : [] ),
		];
	}, [ isSingle, isArchive ] );

	// Filter blocks by search query
	const query = search.trim().toLowerCase();
	const matchesSearch = ( b ) => {
		if ( ! query ) return true;
		return (
			b.label.toLowerCase().includes( query ) ||
			( b.description && b.description.toLowerCase().includes( query ) )
		);
	};

	const favoriteBlocksList = useMemo( () => {
		return allBlocks.filter( ( b ) => favorites.includes( b.type ) && matchesSearch( b ) );
	}, [ allBlocks, favorites, query ] );

	const renderGroup = ( title, list, groupId, defaultExpanded = true ) => {
		// Prevent duplicates: if an element is in pinned favorites, exclude it from lower category
		const availableList = ( ! query && favoriteBlocksList.length > 0 )
			? list.filter( ( b ) => ! favorites.includes( b.type ) )
			: list;

		const filtered = availableList.filter( matchesSearch );
		if ( filtered.length === 0 ) {
			return null;
		}

		const isCollapsed = collapsedGroups[ groupId ] !== undefined
			? collapsedGroups[ groupId ]
			: ! defaultExpanded;

		return (
			<div className={ `xsb-palette-group${ isCollapsed ? ' is-collapsed' : '' }` }>
				<button
					type="button"
					className={ `xsb-palette-group-toggle${ isCollapsed ? ' is-collapsed' : '' }` }
					onClick={ () => toggleGroup( groupId ) }
					aria-expanded={ ! isCollapsed }
				>
					<span className="xsb-palette-group-title">
						{ title }
						<span className="xsb-palette-group-count">{ filtered.length }</span>
					</span>
					<span className={ `xsb-palette-group-arrow${ isCollapsed ? ' is-collapsed' : '' }` }>
						<IconChevronDown width={ 14 } height={ 14 } />
					</span>
				</button>
				{ ! isCollapsed && (
					<div className="xsb-palette-grid">
						{ filtered.map( ( block ) => (
							<PaletteItem
								key={ `${ groupId }-${ block.type }` }
								uid={ `${ groupId }-${ block.type }` }
								block={ block }
								isFavorite={ favorites.includes( block.type ) }
								onToggleFavorite={ toggleFavorite }
								onClick={ () => onAdd( block ) }
							/>
						) ) }
					</div>
				) }
			</div>
		);
	};

	return (
		<div className="xsb-left-palette">
			{/* Top Panel Tabs: 3-column equal-width segmented control */}
			<div className="xsb-palette-tabs" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={ activeTab === 'elements' }
					className={ `xsb-palette-tab${ activeTab === 'elements' ? ' is-active' : '' }` }
					onClick={ () => setActiveTab( 'elements' ) }
					title={ __( 'Elements', 'xcodesol-page-builder' ) }
				>
					<span className="xsb-palette-tab__icon-wrap">
						<IconElements width={ 15 } height={ 15 } />
					</span>
					<span className="xsb-palette-tab__label">{ __( 'Elements', 'xcodesol-page-builder' ) }</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={ activeTab === 'layers' }
					className={ `xsb-palette-tab${ activeTab === 'layers' ? ' is-active' : '' }` }
					onClick={ () => setActiveTab( 'layers' ) }
					title={ __( 'Layers', 'xcodesol-page-builder' ) }
				>
					<span className="xsb-palette-tab__icon-wrap">
						<IconLayers width={ 15 } height={ 15 } />
						{ layout.length > 0 && <span className="xsb-tab-dot-badge" title={ sprintf( __( '%d layers', 'xcodesol-page-builder' ), layout.length ) } /> }
					</span>
					<span className="xsb-palette-tab__label">{ __( 'Layers', 'xcodesol-page-builder' ) }</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={ activeTab === 'templates' }
					className={ `xsb-palette-tab${ activeTab === 'templates' ? ' is-active' : '' }` }
					onClick={ () => setActiveTab( 'templates' ) }
					title={ __( 'Library', 'xcodesol-page-builder' ) }
				>
					<span className="xsb-palette-tab__icon-wrap">
						<IconTemplates width={ 15 } height={ 15 } />
					</span>
					<span className="xsb-palette-tab__label">{ __( 'Library', 'xcodesol-page-builder' ) }</span>
				</button>
			</div>

			{/* ELEMENTS TAB */}
			{ activeTab === 'elements' && (
				<div className="xsb-palette-pane xsb-palette-pane--elements">
					{/* Search input with keyboard shortcut indicator */}
					<div className="xsb-palette-search-wrap">
						<span className="xsb-palette-search-icon">
							<IconSearch width={ 15 } height={ 15 } />
						</span>
						<input
							ref={ searchInputRef }
							type="text"
							className="xsb-palette-search-input"
							placeholder={ __( 'Search elements', 'xcodesol-page-builder' ) }
							value={ search }
							onChange={ ( e ) => setSearch( e.target.value ) }
							aria-label={ __( 'Search elements', 'xcodesol-page-builder' ) }
						/>
						{ search ? (
							<button
								type="button"
								className="xsb-palette-search-clear"
								onClick={ () => setSearch( '' ) }
								aria-label={ __( 'Clear search', 'xcodesol-page-builder' ) }
							>
								<IconClose width={ 13 } height={ 13 } />
							</button>
						) : (
							<kbd className="xsb-kbd xsb-palette-search-kbd">/</kbd>
						) }
					</div>

					<div className="xsb-palette-scroll">
						{/* Favorites Section: single horizontal row of small icon chips (36px) */}
						{ favoriteBlocksList.length > 0 && ! search && (
							<div className="xsb-palette-favs-row">
								<div className="xsb-palette-favs-chips">
									{ favoriteBlocksList.map( ( block ) => (
										<FavoriteChip
											key={ `fav-chip-${ block.type }` }
											uid={ block.type }
											block={ block }
											onToggleFavorite={ toggleFavorite }
											onClick={ () => onAdd( block ) }
										/>
									) ) }
								</div>
							</div>
						) }

						{ renderGroup( __( 'Layout & Containers', 'xcodesol-page-builder' ), CONTAINER_BLOCKS, 'layout', true ) }
						{ isSingle && renderGroup( __( 'Single Post Elements', 'xcodesol-page-builder' ), SINGLE_POST_BLOCKS, 'single_post', true ) }
						{ isArchive && renderGroup( __( 'Archive Elements', 'xcodesol-page-builder' ), ARCHIVE_BLOCKS, 'archive', true ) }
						{ renderGroup( __( 'Basic Elements', 'xcodesol-page-builder' ), BASIC_BLOCKS, 'basic', true ) }
						{ renderGroup( __( 'General & Media', 'xcodesol-page-builder' ), GENERAL_BLOCKS, 'general', true ) }
						{ renderGroup( __( 'Custom & Widgets', 'xcodesol-page-builder' ), WIDGET_BLOCKS, 'widgets', true ) }
					</div>
				</div>
			) }

			{/* LAYERS TAB (TREE OUTLINE) */}
			{ activeTab === 'layers' && (
				<div className="xsb-palette-pane xsb-palette-pane--layers">
					<div className="xsb-layers-header">
						<span className="xsb-layers-title">{ __( 'Page Structure Tree', 'xcodesol-page-builder' ) }</span>
						<span className="xsb-layers-subtitle">{ __( 'Click to select, reorder, or edit elements.', 'xcodesol-page-builder' ) }</span>
					</div>

					<div className="xsb-layers-tree">
						{ layout.length === 0 ? (
							<div className="xsb-layers-empty">
								<IconLayers width={ 32 } height={ 32 } style={ { opacity: 0.3, marginBottom: 8 } } />
								<p>{ __( 'No blocks added to the canvas yet.', 'xcodesol-page-builder' ) }</p>
								<button
									type="button"
									className="xsb-btn xsb-btn--primary xsb-btn--sm"
									onClick={ () => setActiveTab( 'elements' ) }
								>
									{ __( 'Browse Elements', 'xcodesol-page-builder' ) }
								</button>
							</div>
						) : (
							layout.map( ( block, index ) => {
								const isSelected = selectedIndex === index && ! selectedNested;
								const isContainer = block.type === 'xcopb/gb-container' || block.type === 'xcosb/gb-container';

								return (
									<div key={ `layer-${ index }` } className={ `xsb-layer-node${ isSelected ? ' is-selected' : '' }` }>
										<div
											className="xsb-layer-node__row"
											onClick={ () => onSelectBlockIndex && onSelectBlockIndex( index ) }
										>
											<span className="xsb-layer-node__icon">
												{ renderBlockIcon( block.type, block.icon ) }
											</span>
											<span className="xsb-layer-node__label">
												{ block.settings?.title || block.label || block.type.replace( /^xcopb\/|^xcosb\//, '' ) }
											</span>
											<div className="xsb-layer-node__actions">
												{ onMoveBlockIndex && (
													<>
														<button
															type="button"
															disabled={ index === 0 }
															onClick={ ( e ) => {
																e.stopPropagation();
																onMoveBlockIndex( index, -1 );
															} }
															title={ __( 'Move Up', 'xcodesol-page-builder' ) }
														>
															<IconArrowUp width={ 12 } height={ 12 } />
														</button>
														<button
															type="button"
															disabled={ index === layout.length - 1 }
															onClick={ ( e ) => {
																e.stopPropagation();
																onMoveBlockIndex( index, 1 );
															} }
															title={ __( 'Move Down', 'xcodesol-page-builder' ) }
														>
															<IconArrowDown width={ 12 } height={ 12 } />
														</button>
													</>
												) }
												{ onDeleteBlockIndex && (
													<button
														type="button"
														className="is-danger"
														onClick={ ( e ) => {
															e.stopPropagation();
															onDeleteBlockIndex( index );
														} }
														title={ __( 'Delete block', 'xcodesol-page-builder' ) }
													>
														<IconTrash width={ 12 } height={ 12 } />
													</button>
												) }
											</div>
										</div>

										{/* Nested Container Columns & Children */}
										{ isContainer && Array.isArray( block.inner ) && (
											<div className="xsb-layer-nested-group">
												{ block.inner.map( ( col, cj ) => (
													<div key={ `col-${ cj }` } className="xsb-layer-col-group">
														<div className="xsb-layer-col-header">
															<span>{ sprintf( __( 'Column %d', 'xcodesol-page-builder' ), cj + 1 ) }</span>
															<span className="xsb-layer-col-count">{ col.length }</span>
														</div>
														<div className="xsb-layer-col-items">
															{ col.map( ( nested, bi ) => {
																const isNestedSelected =
																	selectedNested &&
																	selectedNested.ci === index &&
																	selectedNested.cj === cj &&
																	selectedNested.bi === bi;

																return (
																	<div
																		key={ `nested-${ bi }` }
																		className={ `xsb-layer-nested-item${ isNestedSelected ? ' is-selected' : '' }` }
																		onClick={ ( e ) => {
																			e.stopPropagation();
													onSelectNestedBlock && onSelectNestedBlock( index, cj, bi );
																		} }
																	>
																		<span className="xsb-layer-node__icon">
																			{ renderBlockIcon( nested.type, nested.icon ) }
																		</span>
																		<span className="xsb-layer-node__label">
																			{ nested.settings?.title || nested.label || nested.type.replace( /^xcopb\/|^xcosb\//, '' ) }
																		</span>
																	</div>
																);
															} ) }
														</div>
													</div>
												) ) }
											</div>
										) }
									</div>
								);
							} )
						) }
					</div>
				</div>
			) }

			{/* TEMPLATES TAB */}
			{ activeTab === 'templates' && (
				<div className="xsb-palette-pane xsb-palette-pane--templates">
					<div className="xsb-templates-header">
						<span className="xsb-templates-title">{ __( 'Pre-made Sections', 'xcodesol-page-builder' ) }</span>
						<span className="xsb-templates-desc">{ __( 'Insert designed sections with a single click.', 'xcodesol-page-builder' ) }</span>
					</div>

					<div className="xsb-templates-list">
						{ STARTER_PRESETS.map( ( preset ) => (
							<div key={ preset.id } className="xsb-template-card">
								<div className="xsb-template-card__header">
									<span className="xsb-template-card__badge">{ preset.category }</span>
									<h4 className="xsb-template-card__title">{ preset.title }</h4>
								</div>
								<p className="xsb-template-card__desc">{ preset.desc }</p>
								<div className="xsb-template-card__footer">
									<button
										type="button"
										className="xsb-btn xsb-btn--primary xsb-btn--sm"
										onClick={ () => onAddPreset && onAddPreset( preset.blocks ) }
									>
										<IconPlus width={ 14 } height={ 14 } />
										<span>{ __( 'Insert Section', 'xcodesol-page-builder' ) }</span>
									</button>
								</div>
							</div>
						) ) }
					</div>
				</div>
			) }
		</div>
	);
}
