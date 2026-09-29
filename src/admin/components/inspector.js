/**
 * Modern Right-side Contextual Inspector.
 * Linear, Framer, and Figma-inspired design.
 *
 * Features:
 * - Non-clipped sticky header with block icon, breadcrumb, and actions (Duplicate, Delete, Close).
 * - Segmented tabs: Content | Style | Advanced.
 * - Collapsible groups with hairline dividers and state memory.
 * - Replaced native controls: Icon Alignment segmented, Size segmented, Color swatch + hex + popover + eyedropper,
 *   Link input with icon + new tab + nofollow, drag-to-scrub numbers with unit switchers, visual box-model spacing.
 * - Responsive device overrides indicator with reset action.
 * - Live button normal/hover preview at top of Style tab.
 * - Section reset actions.
 * - Friendly empty state when no block is selected.
 *
 * @package Xcodesol_Page_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';

import TemplateSettings from './template-settings';
import ConditionsEditor from './conditions-editor';
import StyleEditor from './style-editor';
import { hasStylePopover } from './style-popover';
import {
	IconClose,
	IconSettings,
	IconInfo,
	IconCopy,
	IconTrash,
	IconRotateCcw,
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

import {
	CollapsibleSection,
	AlignmentControl,
	SizeControl,
	ColorPickerControl,
	LinkControl,
	NumberScrubberControl,
	BoxModelSpacingControl,
	ButtonLivePreview,
	InspectorEmptyState,
	SchemaInspectorRenderer,
	SelectControl,
	TextControl,
} from './inspector-controls';

import { CONTAINER_SCHEMA } from '../schemas/container-schema';
import { manifestFor } from '../schemas';

const BLOCK_NAMES = {
	'xcopb/gb-container': __( 'Container', 'xcodesol-page-builder' ),
	'xcopb/gb-heading': __( 'Heading', 'xcodesol-page-builder' ),
	'xcopb/gb-text': __( 'Text Editor', 'xcodesol-page-builder' ),
	'xcopb/gb-image': __( 'Image', 'xcodesol-page-builder' ),
	'xcopb/gb-button': __( 'Button', 'xcodesol-page-builder' ),
	'xcopb/gb-divider': __( 'Divider', 'xcodesol-page-builder' ),
	'xcopb/gb-banner': __( 'Hero Banner', 'xcodesol-page-builder' ),
	'xcopb/gb-shortcode': __( 'Shortcode', 'xcodesol-page-builder' ),
	'xcopb/gb-breadcrumb': __( 'Breadcrumbs', 'xcodesol-page-builder' ),
	'xcopb/gb-text-widget': __( 'HTML Widget', 'xcodesol-page-builder' ),
	'xcopb/sp-title': __( 'Post Title', 'xcodesol-page-builder' ),
	'xcopb/sp-content': __( 'Post Content', 'xcodesol-page-builder' ),
	'xcopb/sp-featured-image': __( 'Featured Image', 'xcodesol-page-builder' ),
	'xcopb/sp-post-meta': __( 'Post Meta', 'xcodesol-page-builder' ),
	'xcopb/sp-comments': __( 'Post Comments', 'xcodesol-page-builder' ),
	'xcopb/ar-title': __( 'Archive Title', 'xcodesol-page-builder' ),
	'xcopb/ar-description': __( 'Archive Description', 'xcodesol-page-builder' ),
	'xcopb/ar-loop': __( 'Posts Loop', 'xcodesol-page-builder' ),
	'xcopb/ar-pagination': __( 'Pagination', 'xcodesol-page-builder' ),
};

function getBlockIcon( type ) {
	if ( ! type ) return <IconWidgetContainer width={ 16 } height={ 16 } />;
	if ( type.includes( 'container' ) ) return <IconWidgetContainer width={ 16 } height={ 16 } />;
	if ( type.includes( 'heading' ) ) return <IconWidgetHeading width={ 16 } height={ 16 } />;
	if ( type.includes( 'text-widget' ) ) return <IconWidgetShortcode width={ 16 } height={ 16 } />;
	if ( type.includes( 'text' ) ) return <IconWidgetText width={ 16 } height={ 16 } />;
	if ( type.includes( 'image' ) ) return <IconWidgetImage width={ 16 } height={ 16 } />;
	if ( type.includes( 'button' ) ) return <IconWidgetButton width={ 16 } height={ 16 } />;
	if ( type.includes( 'divider' ) ) return <IconWidgetDivider width={ 16 } height={ 16 } />;
	if ( type.includes( 'banner' ) ) return <IconWidgetBanner width={ 16 } height={ 16 } />;
	if ( type.includes( 'shortcode' ) ) return <IconWidgetShortcode width={ 16 } height={ 16 } />;
	if ( type.includes( 'breadcrumb' ) ) return <IconWidgetBreadcrumb width={ 16 } height={ 16 } />;
	if ( type.includes( 'loop' ) || type.includes( 'product' ) ) return <IconWidgetProduct width={ 16 } height={ 16 } />;
	return <IconWidgetContainer width={ 16 } height={ 16 } />;
}

function TemplateRulesView( { viewOptions, viewType, setViewType, rules } ) {
	return (
		<div className="xsb-inspector-rules">
			<CollapsibleSection id="template-view-type" title={ __( 'Page & Template Type', 'xcodesol-page-builder' ) } defaultOpen={ true }>
				<div className="xsb-control-field">
					<label className="xsb-control-label">{ __( 'View Type', 'xcodesol-page-builder' ) }</label>
					<select
						className="xsb-select-input"
						value={ viewType }
						onChange={ ( e ) => setViewType( e.target.value ) }
					>
						{ Object.keys( viewOptions ).map( ( key ) => (
							<option key={ key } value={ key }>
								{ viewOptions[ key ]?.label || viewOptions[ key ] }
							</option>
						) ) }
					</select>
				</div>
			</CollapsibleSection>

			<TemplateSettings
				priority={ rules.priority }
				setPriority={ rules.setPriority }
				settings={ rules.settings }
				setSettings={ rules.setSettings }
			/>

			<ConditionsEditor
				conditions={ rules.conditions }
				setConditions={ rules.setConditions }
				viewType={ viewType }
			/>
		</div>
	);
}

function BlockAdvancedTab( { settings = {}, onChange } ) {
	return (
		<div className="xsb-inspector-advanced">
			<CollapsibleSection
				id="adv-classes"
				title={ __( 'Attributes & Classes', 'xcodesol-page-builder' ) }
				defaultOpen={ true }
				onReset={ () => {
					onChange( 'css_id', '' );
					onChange( 'css_class', '' );
				} }
			>
				<div className="xsb-control-row-2col">
					<div className="xsb-control-field">
						<label className="xsb-control-label">{ __( 'CSS ID', 'xcodesol-page-builder' ) }</label>
						<input
							type="text"
							className="xsb-text-input"
							placeholder="my-id"
							value={ settings.css_id || '' }
							onChange={ ( e ) => onChange( 'css_id', e.target.value.replace( /\s+/g, '-' ) ) }
						/>
					</div>
					<div className="xsb-control-field">
						<label className="xsb-control-label">{ __( 'CSS Classes', 'xcodesol-page-builder' ) }</label>
						<input
							type="text"
							className="xsb-text-input"
							placeholder="class-a class-b"
							value={ settings.css_class || '' }
							onChange={ ( e ) => onChange( 'css_class', e.target.value ) }
						/>
					</div>
				</div>
			</CollapsibleSection>

			<CollapsibleSection
				id="adv-visibility"
				title={ __( 'Responsive Visibility', 'xcodesol-page-builder' ) }
				onReset={ () => {
					onChange( 'hide_desktop', false );
					onChange( 'hide_tablet', false );
					onChange( 'hide_mobile', false );
				} }
			>
				<div className="xsb-toggle-list">
					<div className="xsb-toggle-item">
						<ToggleControl
							label={ __( 'Hide on Desktop', 'xcodesol-page-builder' ) }
							checked={ !! settings.hide_desktop }
							onChange={ ( val ) => onChange( 'hide_desktop', val ) }
						/>
					</div>
					<div className="xsb-toggle-item">
						<ToggleControl
							label={ __( 'Hide on Tablet', 'xcodesol-page-builder' ) }
							checked={ !! settings.hide_tablet }
							onChange={ ( val ) => onChange( 'hide_tablet', val ) }
						/>
					</div>
					<div className="xsb-toggle-item">
						<ToggleControl
							label={ __( 'Hide on Mobile', 'xcodesol-page-builder' ) }
							checked={ !! settings.hide_mobile }
							onChange={ ( val ) => onChange( 'hide_mobile', val ) }
						/>
					</div>
				</div>
			</CollapsibleSection>
		</div>
	);
}

/**
 * Clean Content Settings for individual blocks (Content Tab only: text, links, sources, structure).
 * Styling controls (colors, size, alignment) live in Style tab.
 */
function BlockContentInspector( { block, onChange } ) {
	const settings = block.settings || {};

	switch ( block.type ) {
		case 'xcopb/gb-heading':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="heading-content" title={ __( 'Content', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Title Text', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								placeholder={ __( 'Enter heading text', 'xcodesol-page-builder' ) }
								value={ settings.title || settings.text || '' }
								onChange={ ( e ) => onChange( 'title', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'HTML Tag', 'xcodesol-page-builder' ) }</label>
							<select
								className="xsb-select-input"
								value={ settings.tag || 'h2' }
								onChange={ ( e ) => onChange( 'tag', e.target.value ) }
							>
								<option value="h1">H1</option>
								<option value="h2">H2</option>
								<option value="h3">H3</option>
								<option value="h4">H4</option>
								<option value="h5">H5</option>
								<option value="h6">H6</option>
								<option value="p">Paragraph (p)</option>
								<option value="span">Inline (span)</option>
								<option value="div">Block (div)</option>
							</select>
						</div>
					</CollapsibleSection>

					<CollapsibleSection id="heading-link" title={ __( 'Link', 'xcodesol-page-builder' ) }>
						<LinkControl
							value={ settings.link || '' }
							onChangeUrl={ ( val ) => onChange( 'link', val ) }
							targetBlank={ settings.link_target === '_blank' }
							onChangeTargetBlank={ ( val ) => onChange( 'link_target', val ? '_blank' : '' ) }
							nofollow={ !! settings.link_nofollow }
							onChangeNofollow={ ( val ) => onChange( 'link_nofollow', val ) }
						/>
					</CollapsibleSection>
				</div>
			);

		case 'xcopb/gb-button':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="btn-content" title={ __( 'Content', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Button Text', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								placeholder={ __( 'Click Here', 'xcodesol-page-builder' ) }
								value={ settings.text || '' }
								onChange={ ( e ) => onChange( 'text', e.target.value ) }
							/>
						</div>
					</CollapsibleSection>

					<CollapsibleSection id="btn-link" title={ __( 'Link', 'xcodesol-page-builder' ) }>
						<LinkControl
							value={ settings.link || '' }
							onChangeUrl={ ( val ) => onChange( 'link', val ) }
							targetBlank={ settings.link_target === '_blank' }
							onChangeTargetBlank={ ( val ) => onChange( 'link_target', val ? '_blank' : '' ) }
							nofollow={ !! settings.link_nofollow }
							onChangeNofollow={ ( val ) => onChange( 'link_nofollow', val ) }
						/>
					</CollapsibleSection>
				</div>
			);

		case 'xcopb/gb-text':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="text-content" title={ __( 'Content', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Text', 'xcodesol-page-builder' ) }</label>
							<textarea
								className="xsb-text-input xsb-textarea-input"
								rows={ 5 }
								value={ settings.content || '' }
								onChange={ ( e ) => onChange( 'content', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'HTML Tag', 'xcodesol-page-builder' ) }</label>
							<select
								className="xsb-select-input"
								value={ settings.tag || 'p' }
								onChange={ ( e ) => onChange( 'tag', e.target.value ) }
							>
								<option value="p">Paragraph (p)</option>
								<option value="div">Block (div)</option>
								<option value="blockquote">Blockquote</option>
								<option value="span">Span</option>
							</select>
						</div>
					</CollapsibleSection>
				</div>
			);

		case 'xcopb/gb-image':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="image-content" title={ __( 'Image Source', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Image URL', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								placeholder="https://example.com/image.jpg"
								value={ settings.url || settings.src || '' }
								onChange={ ( e ) => onChange( 'url', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Alt Text (Accessibility)', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								placeholder={ __( 'Describe the image', 'xcodesol-page-builder' ) }
								value={ settings.alt || '' }
								onChange={ ( e ) => onChange( 'alt', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Caption', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								placeholder={ __( 'Optional caption', 'xcodesol-page-builder' ) }
								value={ settings.caption || '' }
								onChange={ ( e ) => onChange( 'caption', e.target.value ) }
							/>
						</div>
					</CollapsibleSection>

					<CollapsibleSection id="image-link" title={ __( 'Link', 'xcodesol-page-builder' ) }>
						<LinkControl
							value={ settings.link || '' }
							onChangeUrl={ ( val ) => onChange( 'link', val ) }
							targetBlank={ settings.link_target === '_blank' }
							onChangeTargetBlank={ ( val ) => onChange( 'link_target', val ? '_blank' : '' ) }
						/>
					</CollapsibleSection>
				</div>
			);

		case 'xcopb/gb-container':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="container-layout" title={ __( 'Columns & Layout', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Number of Columns', 'xcodesol-page-builder' ) }</label>
							<select
								className="xsb-select-input"
								value={ String( settings.columns || 2 ) }
								onChange={ ( e ) => {
									const n = parseInt( e.target.value, 10 ) || 2;
									onChange( 'columns', n );
								} }
							>
								{ [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => (
									<option key={ n } value={ String( n ) }>
										{ `${ n } ${ n === 1 ? __( 'Column', 'xcodesol-page-builder' ) : __( 'Columns', 'xcodesol-page-builder' ) }` }
									</option>
								) ) }
							</select>
						</div>
					</CollapsibleSection>
				</div>
			);

		case 'xcopb/gb-banner':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="banner-content" title={ __( 'Banner Content', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Title', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								value={ settings.title || '' }
								onChange={ ( e ) => onChange( 'title', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Subtitle', 'xcodesol-page-builder' ) }</label>
							<textarea
								className="xsb-text-input xsb-textarea-input"
								rows={ 3 }
								value={ settings.subtitle || '' }
								onChange={ ( e ) => onChange( 'subtitle', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Button Text', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								value={ settings.button_text || '' }
								onChange={ ( e ) => onChange( 'button_text', e.target.value ) }
							/>
						</div>
					</CollapsibleSection>

					<CollapsibleSection id="banner-link" title={ __( 'Button Link', 'xcodesol-page-builder' ) }>
						<LinkControl
							value={ settings.link || '' }
							onChangeUrl={ ( val ) => onChange( 'link', val ) }
						/>
					</CollapsibleSection>
				</div>
			);

		case 'xcopb/gb-shortcode':
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="shortcode-content" title={ __( 'Shortcode', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Title / Label', 'xcodesol-page-builder' ) }</label>
							<input
								type="text"
								className="xsb-text-input"
								value={ settings.title || '' }
								onChange={ ( e ) => onChange( 'title', e.target.value ) }
							/>
						</div>
						<div className="xsb-control-field">
							<label className="xsb-control-label">{ __( 'Shortcode', 'xcodesol-page-builder' ) }</label>
							<textarea
								className="xsb-text-input xsb-textarea-input"
								rows={ 4 }
								placeholder="[contact-form-7 id='123']"
								value={ settings.shortcode || '' }
								onChange={ ( e ) => onChange( 'shortcode', e.target.value ) }
							/>
						</div>
					</CollapsibleSection>
				</div>
			);

		default:
			return (
				<div className="xsb-inspector-content-flow">
					<CollapsibleSection id="gen-content" title={ __( 'Content', 'xcodesol-page-builder' ) } defaultOpen={ true }>
						{ settings.title !== undefined && (
							<div className="xsb-control-field">
								<label className="xsb-control-label">{ __( 'Title', 'xcodesol-page-builder' ) }</label>
								<input
									type="text"
									className="xsb-text-input"
									value={ settings.title || '' }
									onChange={ ( e ) => onChange( 'title', e.target.value ) }
								/>
							</div>
						) }
						{ settings.content !== undefined && (
							<div className="xsb-control-field">
								<label className="xsb-control-label">{ __( 'Content', 'xcodesol-page-builder' ) }</label>
								<textarea
									className="xsb-text-input xsb-textarea-input"
									rows={ 4 }
									value={ settings.content || '' }
									onChange={ ( e ) => onChange( 'content', e.target.value ) }
								/>
							</div>
						) }
					</CollapsibleSection>
				</div>
			);
	}
}

/**
 * Modern Style Inspector Tab:
 * Collapsible groups for Alignment, Typography, Colors, Spacing (box-model), Border & Shadow.
 * Live button preview at top.
 */
function BlockStyleInspector( { block, onChange, device = 'desktop', onDeviceChange } ) {
	const settings = block.settings || {};
	const isButton = block.type === 'xcopb/gb-button';
	const isBanner = block.type === 'xcopb/gb-banner';
	const isHeading = block.type === 'xcopb/gb-heading';
	const isImage = block.type === 'xcopb/gb-image';
	const isContainer = block.type === 'xcopb/gb-container';
	const isText = block.type === 'xcopb/gb-text';

	const activeColor = settings.bg_color || settings.background || settings.text_color || settings.color;
	const colorHint = activeColor ? (
		<span className="xsb-hint-swatch" style={ { background: activeColor } } />
	) : null;

	const paddingVal = settings.padding;
	const spacingHint = typeof paddingVal === 'object'
		? `${ paddingVal.top ?? 0 } / ${ paddingVal.right ?? 0 } / ${ paddingVal.bottom ?? 0 } / ${ paddingVal.left ?? 0 }`
		: `${ paddingVal ?? 0 }px`;

	return (
		<div className="xsb-inspector-style-flow">
			{/* 7. Live button state preview at top of Style tab */}
			{ isButton && <ButtonLivePreview settings={ settings } /> }

			{/* ALIGNMENT SECTION (Open by default if first) */}
			{ ( isHeading || isButton || isImage || isBanner || isText ) && (
				<CollapsibleSection
					id="style-alignment"
					title={ __( 'Alignment', 'xcodesol-page-builder' ) }
					defaultOpen={ true }
					hint={ settings.align ? settings.align.charAt( 0 ).toUpperCase() + settings.align.slice( 1 ) : 'Left' }
					onReset={ () => onChange( 'align', 'left' ) }
				>
					<AlignmentControl
						value={ settings.align || 'left' }
						onChange={ ( val ) => onChange( 'align', val ) }
						includeJustify={ ! isImage }
						device={ device }
						isOverridden={ device !== 'desktop' && !! settings[ `${ device }_align` ] }
						onResetDevice={ () => onChange( `${ device }_align`, undefined ) }
					/>
				</CollapsibleSection>
			) }

			{/* SIZE & TYPOGRAPHY SECTION */}
			{ isButton && (
				<CollapsibleSection
					id="style-size"
					title={ __( 'Size', 'xcodesol-page-builder' ) }
					hint={ ( settings.size || 'md' ).toUpperCase() }
					onReset={ () => onChange( 'size', 'md' ) }
				>
					<SizeControl
						value={ settings.size || 'md' }
						onChange={ ( val ) => onChange( 'size', val ) }
					/>
				</CollapsibleSection>
			) }

			{ isHeading && (
				<CollapsibleSection
					id="style-heading-typo"
					title={ __( 'Typography', 'xcodesol-page-builder' ) }
					hint={ `${ settings.font_size ?? 28 }px` }
					onReset={ () => onChange( 'font_size', 28 ) }
				>
					<NumberScrubberControl
						label={ __( 'Font Size', 'xcodesol-page-builder' ) }
						value={ settings.font_size ?? 28 }
						onChange={ ( val ) => onChange( 'font_size', val ) }
						min={ 10 }
						max={ 120 }
						unit="px"
						units={ [ 'px', 'rem' ] }
					/>
				</CollapsibleSection>
			) }

			{/* COLORS SECTION */}
			<CollapsibleSection
				id="style-colors"
				title={ __( 'Colors', 'xcodesol-page-builder' ) }
				defaultOpen={ isContainer }
				hint={ colorHint }
				onReset={ () => {
					onChange( 'bg_color', '' );
					onChange( 'text_color', '' );
					onChange( 'color', '' );
					onChange( 'background', '' );
				} }
			>
				{ ( isButton || isBanner || isContainer ) && (
					<div className="xsb-control-field">
						<ColorPickerControl
							label={ __( 'Background Color', 'xcodesol-page-builder' ) }
							value={ settings.bg_color || settings.background || '' }
							onChange={ ( val ) => {
								if ( isContainer || isBanner ) {
									onChange( 'background', val );
								} else {
									onChange( 'bg_color', val );
								}
							} }
							defaultColor="#4f46e5"
						/>
					</div>
				) }

				{ ( isButton || isBanner || isHeading || isText ) && (
					<div className="xsb-control-field">
						<ColorPickerControl
							label={ __( 'Text Color', 'xcodesol-page-builder' ) }
							value={ settings.text_color || settings.color || '' }
							onChange={ ( val ) => {
								if ( isText ) {
									onChange( 'color', val );
								} else {
									onChange( 'text_color', val );
								}
							} }
							defaultColor="#ffffff"
						/>
					</div>
				) }

				{ isButton && (
					<div className="xsb-control-row-2col">
						<ColorPickerControl
							label={ __( 'Hover Background', 'xcodesol-page-builder' ) }
							value={ settings.hover_bg_color || '' }
							onChange={ ( val ) => onChange( 'hover_bg_color', val ) }
							defaultColor="#4338ca"
						/>
						<ColorPickerControl
							label={ __( 'Hover Text', 'xcodesol-page-builder' ) }
							value={ settings.hover_text_color || '' }
							onChange={ ( val ) => onChange( 'hover_text_color', val ) }
							defaultColor="#ffffff"
						/>
					</div>
				) }
			</CollapsibleSection>

			{/* SPACING: VISUAL BOX-MODEL */}
			<CollapsibleSection
				id="style-spacing"
				title={ __( 'Spacing', 'xcodesol-page-builder' ) }
				hint={ spacingHint }
				onReset={ () => {
					onChange( 'padding', 0 );
					onChange( 'margin', 0 );
				} }
			>
				{ isContainer && (
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Column Gap', 'xcodesol-page-builder' ) }
							value={ settings.gap ?? 20 }
							onChange={ ( val ) => onChange( 'gap', val ) }
							min={ 0 }
							max={ 100 }
							unit="px"
							units={ [ 'px', 'rem', '%' ] }
						/>
					</div>
				) }

				<BoxModelSpacingControl
					label={ __( 'Padding', 'xcodesol-page-builder' ) }
					values={ typeof settings.padding === 'object' ? settings.padding : {
						top: Number( settings.padding ) || 0,
						right: Number( settings.padding ) || 0,
						bottom: Number( settings.padding ) || 0,
						left: Number( settings.padding ) || 0,
					} }
					onChange={ ( val ) => onChange( 'padding', typeof val === 'object' ? val.top : val ) }
				/>

				<BoxModelSpacingControl
					label={ __( 'Margin', 'xcodesol-page-builder' ) }
					values={ typeof settings.margin === 'object' ? settings.margin : {
						top: Number( settings.margin ) || 0,
						right: Number( settings.margin ) || 0,
						bottom: Number( settings.margin ) || 0,
						left: Number( settings.margin ) || 0,
					} }
					onChange={ ( val ) => onChange( 'margin', typeof val === 'object' ? val.top : val ) }
				/>
			</CollapsibleSection>

			{/* BORDER & CORNERS */}
			{ ( isButton || isImage || isContainer ) && (
				<CollapsibleSection
					id="style-border"
					title={ __( 'Border & Corners', 'xcodesol-page-builder' ) }
					hint={ `${ settings.border_radius ?? ( isButton ? 6 : 0 ) }px` }
					onReset={ () => onChange( 'border_radius', 0 ) }
				>
					<NumberScrubberControl
						label={ __( 'Corner Radius', 'xcodesol-page-builder' ) }
						value={ settings.border_radius ?? ( isButton ? 6 : 0 ) }
						onChange={ ( val ) => onChange( 'border_radius', val ) }
						min={ 0 }
						max={ 100 }
						unit="px"
						units={ [ 'px', '%', 'rem', 'em' ] }
					/>
				</CollapsibleSection>
			) }

			{/* Advanced docked style editor for deep CSS tokens if supported */}
			{ hasStylePopover( block.type ) && (
				<CollapsibleSection
					id="style-deep-engine"
					title={ __( 'Advanced Styles', 'xcodesol-page-builder' ) }
					defaultOpen={ false }
				>
					<StyleEditor
						type={ block.type }
						settings={ settings }
						onChange={ onChange }
						device={ device }
						onDeviceChange={ onDeviceChange }
						variant="docked"
					/>
				</CollapsibleSection>
			) }
		</div>
	);
}

function ParentLayoutChildSection( { parentMode, settings, onChange } ) {
	return (
		<CollapsibleSection
			id="child-layout-placement"
			title={ __( 'Parent Layout & Placement', 'xcodesol-page-builder' ) }
			defaultOpen={ true }
		>
			{ ( parentMode === 'list' || parentMode === 'row' ) && (
				<>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Align Self', 'xcodesol-page-builder' ) }
							value={ settings.align_self || 'auto' }
							onChange={ ( val ) => onChange( 'align_self', val ) }
							options={ [
								{ value: 'auto', label: 'Auto' },
								{ value: 'flex-start', label: 'Start' },
								{ value: 'center', label: 'Center' },
								{ value: 'flex-end', label: 'End' },
								{ value: 'stretch', label: 'Stretch' },
							] }
						/>
					</div>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Order', 'xcodesol-page-builder' ) }
							value={ settings.child_order ?? 0 }
							onChange={ ( val ) => onChange( 'child_order', val ) }
							min={ -10 }
							max={ 100 }
							units={ [] }
						/>
					</div>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Flex Grow', 'xcodesol-page-builder' ) }
							value={ settings.flex_grow ?? 0 }
							onChange={ ( val ) => onChange( 'flex_grow', val ) }
							min={ 0 }
							max={ 10 }
							units={ [] }
						/>
					</div>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Flex Shrink', 'xcodesol-page-builder' ) }
							value={ settings.flex_shrink ?? 1 }
							onChange={ ( val ) => onChange( 'flex_shrink', val ) }
							min={ 0 }
							max={ 10 }
							units={ [] }
						/>
					</div>
				</>
			) }

			{ parentMode === 'columns' && (
				<>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Width Override (Units 1-12)', 'xcodesol-page-builder' ) }
							value={ settings.col_width_override ?? 0 }
							onChange={ ( val ) => onChange( 'col_width_override', val ) }
							min={ 0 }
							max={ 12 }
							units={ [] }
						/>
					</div>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Order', 'xcodesol-page-builder' ) }
							value={ settings.child_order ?? 0 }
							onChange={ ( val ) => onChange( 'child_order', val ) }
							min={ -10 }
							max={ 100 }
							units={ [] }
						/>
					</div>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Align Self', 'xcodesol-page-builder' ) }
							value={ settings.align_self || 'auto' }
							onChange={ ( val ) => onChange( 'align_self', val ) }
							options={ [
								{ value: 'auto', label: 'Auto' },
								{ value: 'start', label: 'Top' },
								{ value: 'center', label: 'Center' },
								{ value: 'end', label: 'Bottom' },
								{ value: 'stretch', label: 'Stretch' },
							] }
						/>
					</div>
				</>
			) }

			{ parentMode === 'grid' && (
				<>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Column Span', 'xcodesol-page-builder' ) }
							value={ settings.grid_column_span ?? 1 }
							onChange={ ( val ) => onChange( 'grid_column_span', val ) }
							min={ 1 }
							max={ 12 }
							units={ [] }
						/>
					</div>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Row Span', 'xcodesol-page-builder' ) }
							value={ settings.grid_row_span ?? 1 }
							onChange={ ( val ) => onChange( 'grid_row_span', val ) }
							min={ 1 }
							max={ 12 }
							units={ [] }
						/>
					</div>
					<div className="xsb-control-field">
						<TextControl
							label={ __( 'Grid Area Name', 'xcodesol-page-builder' ) }
							value={ settings.grid_area || '' }
							onChange={ ( val ) => onChange( 'grid_area', val ) }
							placeholder="e.g. sidebar"
						/>
					</div>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Justify Self', 'xcodesol-page-builder' ) }
							value={ settings.grid_justify_self || 'auto' }
							onChange={ ( val ) => onChange( 'grid_justify_self', val ) }
							options={ [
								{ value: 'auto', label: 'Auto' },
								{ value: 'start', label: 'Start' },
								{ value: 'center', label: 'Center' },
								{ value: 'end', label: 'End' },
								{ value: 'stretch', label: 'Stretch' },
							] }
						/>
					</div>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Align Self', 'xcodesol-page-builder' ) }
							value={ settings.align_self || 'auto' }
							onChange={ ( val ) => onChange( 'align_self', val ) }
							options={ [
								{ value: 'auto', label: 'Auto' },
								{ value: 'start', label: 'Start' },
								{ value: 'center', label: 'Center' },
								{ value: 'end', label: 'End' },
								{ value: 'stretch', label: 'Stretch' },
							] }
						/>
					</div>
				</>
			) }

			{ parentMode === 'masonry' && (
				<>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Break Inside', 'xcodesol-page-builder' ) }
							value={ settings.masonry_item_break || 'avoid' }
							onChange={ ( val ) => onChange( 'masonry_item_break', val ) }
							options={ [
								{ value: 'avoid', label: 'Avoid (Keep together)' },
								{ value: 'auto', label: 'Auto' },
							] }
						/>
					</div>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Column Span', 'xcodesol-page-builder' ) }
							value={ settings.masonry_item_span || '1' }
							onChange={ ( val ) => onChange( 'masonry_item_span', val ) }
							options={ [
								{ value: '1', label: '1 Column' },
								{ value: 'all', label: 'Span All Columns' },
							] }
						/>
					</div>
				</>
			) }

			{ parentMode === 'scroll-row' && (
				<>
					<div className="xsb-control-field">
						<SelectControl
							label={ __( 'Scroll Snap Align', 'xcodesol-page-builder' ) }
							value={ settings.scroll_snap_align || 'start' }
							onChange={ ( val ) => onChange( 'scroll_snap_align', val ) }
							options={ [
								{ value: 'start', label: __( 'Start', 'xcodesol-page-builder' ) },
								{ value: 'center', label: __( 'Center', 'xcodesol-page-builder' ) },
								{ value: 'end', label: __( 'End', 'xcodesol-page-builder' ) },
							] }
						/>
					</div>
					<div className="xsb-control-field">
						<NumberScrubberControl
							label={ __( 'Order', 'xcodesol-page-builder' ) }
							value={ settings.child_order ?? 0 }
							onChange={ ( val ) => onChange( 'child_order', val ) }
							min={ -10 }
							max={ 100 }
							units={ [] }
						/>
					</div>
				</>
			) }
		</CollapsibleSection>
	);
}

export default function Inspector( {
	selectedIndex,
	selectedNested,
	layout = [],
	setLayout,
	onUpdateNested,
	onSelectBlock,
	onSelectNested,
	onDuplicate,
	onDelete,
	viewOptions = {},
	viewType,
	showTemplateSettings,
	setViewType,
	structure,
	open,
	onClose,
	device,
	onDeviceChange,
	rules,
} ) {
	const [ tab, setTab ] = useState( 'content' );
	const [ activeStyleState, setActiveStyleState ] = useState( 'default' );
	const [ searchQuery, setSearchQuery ] = useState( '' );

	if ( ! open ) {
		return null;
	}

	const nestedBlock =
		selectedNested &&
		layout[ selectedNested.ci ] &&
		Array.isArray( layout[ selectedNested.ci ].inner )
			? ( layout[ selectedNested.ci ].inner || [] )[ selectedNested.cj ]?.[ selectedNested.bi ]
			: null;

	const block = nestedBlock || ( selectedIndex !== null ? layout[ selectedIndex ] : null );

	const parentContainer =
		selectedNested && layout[ selectedNested.ci ]
			? layout[ selectedNested.ci ]
			: null;
	const parentSettings = parentContainer?.settings || {};
	const parentMode = parentSettings.layout_mode || ( parentSettings.layout_type === 'grid' ? 'grid' : 'columns' );
	const parentLayoutSummary = ( () => {
		switch ( parentMode ) {
			case 'grid':
				return `Grid (${ parentSettings.grid_columns_count || 3 } cols)`;
			case 'columns':
				return `Columns (${ parentSettings.columns || 2 } cols)`;
			case 'list':
				return __( 'List (Vertical)', 'xcodesol-page-builder' );
			case 'row':
				return __( 'Row (Horizontal)', 'xcodesol-page-builder' );
			case 'masonry':
				return `Masonry (${ parentSettings.masonry_columns || 3 } cols)`;
			case 'scroll-row':
				return __( 'Scroll Row', 'xcodesol-page-builder' );
			default:
				return __( 'Container', 'xcodesol-page-builder' );
		}
	} )();

	const handleSelectParent = () => {
		if ( selectedNested ) {
			if ( onSelectBlock ) {
				onSelectBlock( selectedNested.ci );
			}
			if ( onSelectNested ) {
				onSelectNested( null );
			}
		}
	};

	// 8. Empty state when nothing is selected and not pinned to template settings
	if ( ! block && ! showTemplateSettings ) {
		return (
			<aside className="xsb-inspector xcopb-inspector">
				<div className="xsb-inspector-head">
					<div className="xsb-inspector-head-title-wrap">
						<span className="xsb-inspector-head-icon" aria-hidden="true">
							<IconSettings width={ 14 } height={ 14 } />
						</span>
						<h3 className="xsb-inspector-subject">
							{ __( 'Inspector', 'xcodesol-page-builder' ) }
						</h3>
					</div>
					<button
						type="button"
						className="xsb-inspector-close-btn"
						onClick={ onClose }
						aria-label={ __( 'Close inspector', 'xcodesol-page-builder' ) }
					>
						<IconClose width={ 14 } height={ 14 } />
					</button>
				</div>
				<div className="xsb-inspector-body">
					<InspectorEmptyState />
				</div>
			</aside>
		);
	}

	// When template settings are explicitly pinned via the gear button:
	if ( showTemplateSettings || ! block ) {
		return (
			<aside className="xsb-inspector xcopb-inspector">
				<div className="xsb-inspector-head">
					<div className="xsb-inspector-head-title-wrap">
						<span className="xsb-inspector-head-icon" aria-hidden="true">
							<IconSettings width={ 14 } height={ 14 } />
						</span>
						<h3 className="xsb-inspector-subject">
							{ __( 'Template Rules & Settings', 'xcodesol-page-builder' ) }
						</h3>
					</div>
					<button
						type="button"
						className="xsb-inspector-close-btn"
						onClick={ onClose }
						aria-label={ __( 'Close inspector', 'xcodesol-page-builder' ) }
					>
						<IconClose width={ 14 } height={ 14 } />
					</button>
				</div>
				<div className="xsb-inspector-body">
					<TemplateRulesView
						viewOptions={ viewOptions }
						viewType={ viewType }
						setViewType={ setViewType }
						rules={ rules }
					/>
				</div>
			</aside>
		);
	}

	const updateSetting = nestedBlock
		? ( key, value ) =>
				onUpdateNested(
					selectedNested.ci,
					selectedNested.cj,
					selectedNested.bi,
					key,
					value
				)
		: ( key, value ) => {
				const next = [ ...layout ];
				const patch =
					key && typeof key === 'object' && ! Array.isArray( key )
						? key
						: { [ key ]: value };
				next[ selectedIndex ] = {
					...next[ selectedIndex ],
					settings: {
						...next[ selectedIndex ].settings,
						...patch,
					},
				};
				setLayout( next );
			};

	const blockLabel = BLOCK_NAMES[ block.type ] || block.label || block.type.replace( /^xcopb\/|^xcosb\//, '' );

	// Build breadcrumb (show last 2 levels, full path in tooltip)
	const rawBreadcrumb = selectedNested
		? [ __( 'Page', 'xcodesol-page-builder' ), __( 'Container', 'xcodesol-page-builder' ), blockLabel ]
		: [ __( 'Page', 'xcodesol-page-builder' ), blockLabel ];
	const cleanBreadcrumb = rawBreadcrumb.filter( ( item, idx, arr ) => idx === 0 || item !== arr[ idx - 1 ] );
	const breadcrumbDisplay = cleanBreadcrumb.length > 2 ? cleanBreadcrumb.slice( -2 ) : cleanBreadcrumb;

	const handleTabsKeyDown = ( e ) => {
		const tabList = [ 'content', 'style', 'advanced' ];
		const currentIndex = tabList.indexOf( tab );
		if ( e.key === 'ArrowRight' ) {
			e.preventDefault();
			const nextTab = tabList[ ( currentIndex + 1 ) % tabList.length ];
			setTab( nextTab );
		} else if ( e.key === 'ArrowLeft' ) {
			e.preventDefault();
			const prevTab = tabList[ ( currentIndex - 1 + tabList.length ) % tabList.length ];
			setTab( prevTab );
		}
	};

	return (
		<aside className="xsb-inspector xcopb-inspector">
			{/* 1. Header (sticky): icon + name + breadcrumb, actions on right (duplicate, delete, close) */}
			<div className="xsb-inspector-head">
				<div className="xsb-inspector-head-title-wrap">
					<span className="xsb-inspector-head-icon" aria-hidden="true">
						{ getBlockIcon( block.type ) }
					</span>
					<div className="xsb-inspector-head-info">
						<h3 className="xsb-inspector-subject" title={ blockLabel }>
							{ blockLabel }
						</h3>
						<div className="xsb-inspector-breadcrumb" title={ cleanBreadcrumb.join( ' / ' ) }>
							{ breadcrumbDisplay.map( ( part, i ) => (
								<span key={ i } className="xsb-bc-item">
									{ part }
									{ i < breadcrumbDisplay.length - 1 && <span className="xsb-bc-sep">/</span> }
								</span>
							) ) }
						</div>
					</div>
				</div>

				<div className="xsb-inspector-actions">
					{ onDuplicate && (
						<button
							type="button"
							className="xsb-inspector-act-btn"
							onClick={ onDuplicate }
							title={ __( 'Duplicate element', 'xcodesol-page-builder' ) }
							aria-label={ __( 'Duplicate element', 'xcodesol-page-builder' ) }
						>
							<IconCopy width={ 14 } height={ 14 } />
						</button>
					) }
					{ onDelete && (
						<button
							type="button"
							className="xsb-inspector-act-btn is-danger"
							onClick={ onDelete }
							title={ __( 'Delete element', 'xcodesol-page-builder' ) }
							aria-label={ __( 'Delete element', 'xcodesol-page-builder' ) }
						>
							<IconTrash width={ 14 } height={ 14 } />
						</button>
					) }
					<button
						type="button"
						className="xsb-inspector-close-btn"
						onClick={ onClose }
						title={ __( 'Close inspector', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Close inspector', 'xcodesol-page-builder' ) }
					>
						<IconClose width={ 15 } height={ 15 } />
					</button>
				</div>
			</div>

			{ selectedNested && parentContainer && (
				<div className="xsb-parent-layout-banner">
					<div className="xsb-parent-layout-info">
						<span className="dashicons dashicons-layout" aria-hidden="true" style={ { fontSize: '15px', width: '15px', height: '15px' } } />
						<span>{ sprintf( __( 'Inside: %s', 'xcodesol-page-builder' ), parentLayoutSummary ) }</span>
					</div>
					<button
						type="button"
						className="xsb-select-parent-btn"
						onClick={ handleSelectParent }
					>
						{ __( 'Select parent', 'xcodesol-page-builder' ) }
					</button>
				</div>
			) }

			{/* 2. Tabs: Content | Style | Advanced (Segmented Track) */}
			<div className="xsb-inspector-tabs" role="tablist" onKeyDown={ handleTabsKeyDown }>
				<button
					type="button"
					role="tab"
					tabIndex={ tab === 'content' ? 0 : -1 }
					aria-selected={ tab === 'content' }
					className={ `xsb-inspector-tab${ tab === 'content' ? ' is-active' : '' }` }
					onClick={ () => setTab( 'content' ) }
				>
					{ __( 'Content', 'xcodesol-page-builder' ) }
				</button>
				<button
					type="button"
					role="tab"
					tabIndex={ tab === 'style' ? 0 : -1 }
					aria-selected={ tab === 'style' }
					className={ `xsb-inspector-tab${ tab === 'style' ? ' is-active' : '' }` }
					onClick={ () => setTab( 'style' ) }
				>
					{ __( 'Style', 'xcodesol-page-builder' ) }
				</button>
				<button
					type="button"
					role="tab"
					tabIndex={ tab === 'advanced' ? 0 : -1 }
					aria-selected={ tab === 'advanced' }
					className={ `xsb-inspector-tab${ tab === 'advanced' ? ' is-active' : '' }` }
					onClick={ () => setTab( 'advanced' ) }
				>
					{ __( 'Advanced', 'xcodesol-page-builder' ) }
				</button>
			</div>

			{/* State Tabs: Normal / Hover state switch rendered in the same tab style as Content | Style | Advanced */}
			{ block.type === 'xcopb/gb-container' && ( tab === 'style' || ( tab === 'advanced' && ( CONTAINER_SCHEMA.sections || [] ).some( ( s ) => s.tab === 'advanced' && s.stateful ) ) ) && (
				<div className="xsb-state-tabs" role="tablist">
					<button
						type="button"
						role="tab"
						tabIndex={ activeStyleState === 'default' ? 0 : -1 }
						aria-selected={ activeStyleState === 'default' }
						className={ `xsb-state-tab${ activeStyleState === 'default' ? ' is-active' : '' }` }
						onClick={ () => setActiveStyleState( 'default' ) }
					>
						{ __( 'Normal', 'xcodesol-page-builder' ) }
					</button>
					<button
						type="button"
						role="tab"
						tabIndex={ activeStyleState === 'hover' ? 0 : -1 }
						aria-selected={ activeStyleState === 'hover' }
						className={ `xsb-state-tab${ activeStyleState === 'hover' ? ' is-active' : '' }` }
						onClick={ () => setActiveStyleState( 'hover' ) }
					>
						{ __( 'Hover', 'xcodesol-page-builder' ) }
					</button>
				</div>
			) }

			<div className="xsb-inspector-body">
				{ block.type === 'xcopb/gb-container' ? (
					<SchemaInspectorRenderer
						schema={ CONTAINER_SCHEMA }
						manifest={ manifestFor( block.type ) || CONTAINER_SCHEMA.manifest }
						settings={ block.settings || {} }
						activeTab={ tab }
						activeDevice={ device }
						activeState={ activeStyleState }
						onUpdateSetting={ updateSetting }
						searchQuery={ searchQuery }
					/>
				) : (
					<>
						{ tab === 'content' && (
							<>
								{ selectedNested && parentContainer && (
									<ParentLayoutChildSection
										parentMode={ parentMode }
										settings={ block.settings || {} }
										onChange={ updateSetting }
									/>
								) }
								<BlockContentInspector
									block={ block }
									onChange={ updateSetting }
								/>
							</>
						) }

						{ tab === 'style' && (
							<BlockStyleInspector
								block={ block }
								onChange={ updateSetting }
								device={ device }
								onDeviceChange={ onDeviceChange }
							/>
						) }

						{ tab === 'advanced' && (
							<BlockAdvancedTab
								settings={ block.settings || {} }
								onChange={ updateSetting }
							/>
						) }
					</>
				) }
			</div>

			{/* Always-visible panel footer */}
			<div className="xsb-inspector-footer">
				<button
					type="button"
					className="xsb-inspector-footer-btn"
					onClick={ () => {
						if ( tab === 'style' ) {
							updateSetting( {
								bg_color: undefined,
								text_color: undefined,
								color: undefined,
								background: undefined,
								padding: undefined,
								margin: undefined,
								border_radius: undefined,
								align: undefined,
								font_size: undefined,
							} );
						} else if ( tab === 'advanced' ) {
							updateSetting( {
								margin: undefined,
								position: undefined,
								z_index: undefined,
								rotate: undefined,
								scale: undefined,
								transform_origin: undefined,
								transition_duration: undefined,
								animation: undefined,
								animation_duration: undefined,
								animation_delay: undefined,
								hover_animation: undefined,
								hide_desktop: false,
								hide_tablet: false,
								hide_mobile: false,
								css_id: '',
								css_class: '',
								custom_css: '',
							} );
						}
					} }
					title={ __( 'Reset current section values', 'xcodesol-page-builder' ) }
				>
					<IconRotateCcw width={ 13 } height={ 13 } />
					<span>{ __( 'Reset section', 'xcodesol-page-builder' ) }</span>
				</button>
				<button
					type="button"
					className="xsb-inspector-footer-btn"
					onClick={ () => {
						try {
							navigator.clipboard.writeText( JSON.stringify( block.settings || {}, null, 2 ) );
						} catch ( e ) {}
					} }
					title={ __( 'Copy current styles to clipboard', 'xcodesol-page-builder' ) }
				>
					<IconCopy width={ 13 } height={ 13 } />
					<span>{ __( 'Copy style', 'xcodesol-page-builder' ) }</span>
				</button>
			</div>
		</aside>
	);
}