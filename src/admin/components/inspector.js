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
import { useMemo, useState } from '@wordpress/element';
import { SelectControl as WPSelectControl, TextControl as WPTextControl, ToggleControl } from '@wordpress/components';

import TemplateSettings from './template-settings';
import ConditionsEditor from './conditions-editor';
import StyleEditor from './style-editor';
import { hasStylePopover } from './style-popover';
import {
	IconClose,
	IconSettings,
	IconPalette,
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
	CodeEditorControl,
	ButtonLivePreview,
	InspectorEmptyState,
	SchemaInspectorRenderer,
	SelectControl,
	TextControl,
} from './inspector-controls';

import { manifestFor, schemaFor } from '../schemas';
import GradientControl from './controls/gradient';
import MediaPickerControl from './controls/media';
import SpacingBoxControl from './controls/spacing-box';
import { MOTION_OPTIONS } from '../lib/motion-controls';

const BLOCK_NAMES = {
	'xcopb/gb-container': __( 'Container', 'xcodesol-page-builder' ),
	'xcopb/gb-heading': __( 'Heading', 'xcodesol-page-builder' ),
	'xcopb/gb-text': __( 'Text Editor', 'xcodesol-page-builder' ),
	'xcopb/gb-image': __( 'Image', 'xcodesol-page-builder' ),
	'xcopb/gb-button': __( 'Button', 'xcodesol-page-builder' ),
	'xcopb/gb-divider': __( 'Divider', 'xcodesol-page-builder' ),
	'xcopb/gb-banner': __( 'Slider', 'xcodesol-page-builder' ),
	'xcosb/gb-banner': __( 'Slider', 'xcodesol-page-builder' ),
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

function MotionSettingsPanel( { blockType, instanceId, settings = {}, onChange } ) {
	const isBanner = [ 'xcopb/gb-banner', 'xcosb/gb-banner' ].includes( blockType );
	const MotionSelect = ( { setting, label } ) => (
		<div className="xsb-control-field">
			<label className="xsb-control-label" htmlFor={ `motion-${ setting }` }>{ label }</label>
			<select id={ `motion-${ setting }` } className="xsb-select-input" value={ typeof settings[ setting ] === 'string' ? settings[ setting ] : 'none' } onChange={ ( event ) => onChange( setting, event.target.value ) }>
				<option value="none">{ __( 'No animation', 'xcodesol-page-builder' ) }</option>
				{ MOTION_OPTIONS.filter( ( option ) => option.value !== 'none' ).map( ( option ) => <option key={ option.value } value={ option.value }>{ option.label }</option> ) }
			</select>
		</div>
	);

	return (
		<CollapsibleSection
			id={ `motion-settings-${ blockType }-${ instanceId }` }
			title={ __( 'Animations', 'xcodesol-page-builder' ) }
			defaultOpen={ false }
			onReset={ () => {
				onChange( {
					...( isBanner
						? { heading_animation: 'none', description_animation: 'none', button_animation: 'none' }
						: { animation: 'none' } ),
					animation_duration: 600,
					animation_delay: 0,
					animation_easing: 'ease',
					animation_repeat: '1',
				} );
			} }
		>
			{ isBanner ? (
				<>
					<MotionSelect setting="heading_animation" label={ __( 'Heading', 'xcodesol-page-builder' ) } />
					<MotionSelect setting="description_animation" label={ __( 'Description', 'xcodesol-page-builder' ) } />
					<MotionSelect setting="button_animation" label={ __( 'Button', 'xcodesol-page-builder' ) } />
					{ [ 'heading_animation', 'description_animation', 'button_animation' ].some( ( key ) => settings[ key ] && settings[ key ] !== 'none' ) && (
						<>
							<NumberScrubberControl label={ __( 'Duration', 'xcodesol-page-builder' ) } value={ settings.animation_duration ?? 600 } onChange={ ( value ) => onChange( 'animation_duration', value ) } min={ 100 } max={ 5000 } unit="ms" />
							<NumberScrubberControl label={ __( 'Delay', 'xcodesol-page-builder' ) } value={ settings.animation_delay ?? 0 } onChange={ ( value ) => onChange( 'animation_delay', value ) } min={ 0 } max={ 3000 } unit="ms" />
						</>
					) }
				</>
			) : (
				<>
					<MotionSelect setting="animation" label={ __( 'Animation', 'xcodesol-page-builder' ) } />
					{ typeof settings.animation === 'string' && settings.animation !== 'none' && (
						<>
							<NumberScrubberControl label={ __( 'Duration', 'xcodesol-page-builder' ) } value={ settings.animation_duration ?? 600 } onChange={ ( value ) => onChange( 'animation_duration', value ) } min={ 100 } max={ 5000 } unit="ms" />
							<NumberScrubberControl label={ __( 'Delay', 'xcodesol-page-builder' ) } value={ settings.animation_delay ?? 0 } onChange={ ( value ) => onChange( 'animation_delay', value ) } min={ 0 } max={ 3000 } unit="ms" />
							<div className="xsb-control-field"><label className="xsb-control-label" htmlFor="motion-timing">{ __( 'Timing', 'xcodesol-page-builder' ) }</label><select id="motion-timing" className="xsb-select-input" value={ settings.animation_easing || 'ease' } onChange={ ( event ) => onChange( 'animation_easing', event.target.value ) }>{ [ 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear' ].map( ( value ) => <option key={ value } value={ value }>{ value.replace( /-/g, ' ' ) }</option> ) }</select></div>
							<div className="xsb-control-field"><label className="xsb-control-label" htmlFor="motion-repeat">{ __( 'Repeat', 'xcodesol-page-builder' ) }</label><select id="motion-repeat" className="xsb-select-input" value={ settings.animation_repeat || '1' } onChange={ ( event ) => onChange( 'animation_repeat', event.target.value ) }><option value="1">{ __( 'Once', 'xcodesol-page-builder' ) }</option><option value="2">2 { __( 'times', 'xcodesol-page-builder' ) }</option><option value="3">3 { __( 'times', 'xcodesol-page-builder' ) }</option><option value="infinite">{ __( 'Loop', 'xcodesol-page-builder' ) }</option></select></div>
						</>
					) }
				</>
			) }
		</CollapsibleSection>
	);
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

function PageSettingsView( { title, setTitle, settings = {}, setSettings, pageTemplateOptions = [] } ) {
	const update = ( key, value ) => setSettings( ( current ) => ( { ...current, [ key ]: value } ) );
	const chooseFeaturedImage = () => {
		if ( ! window.wp?.media ) {
			return;
		}
		const frame = window.wp.media( {
			title: __( 'Choose featured image', 'xcodesol-page-builder' ),
			button: { text: __( 'Use as featured image', 'xcodesol-page-builder' ) },
			library: { type: 'image' },
			multiple: false,
		} );
		frame.on( 'select', () => {
			const image = frame.state().get( 'selection' ).first()?.toJSON();
			if ( image ) {
				update( 'featured_image_id', image.id );
				update( 'featured_image_url', image.sizes?.medium?.url || image.url );
			}
		} );
		frame.open();
	};
	const pageLayouts = pageTemplateOptions.length
		? pageTemplateOptions
		: [ { value: '', label: __( 'Default', 'xcodesol-page-builder' ) } ];

	return (
		<div className="xsb-inspector-rules xsb-page-settings">
			<CollapsibleSection id="page-general-settings" title={ __( 'General Settings', 'xcodesol-page-builder' ) } defaultOpen={ true }>
				<WPTextControl label={ __( 'Title', 'xcodesol-page-builder' ) } value={ title || '' } onChange={ setTitle } />
				<WPSelectControl
					label={ __( 'Status', 'xcodesol-page-builder' ) }
					value={ settings.status || 'draft' }
					options={ [
						{ label: __( 'Draft', 'xcodesol-page-builder' ), value: 'draft' },
						{ label: __( 'Published', 'xcodesol-page-builder' ), value: 'publish' },
						{ label: __( 'Pending review', 'xcodesol-page-builder' ), value: 'pending' },
						{ label: __( 'Private', 'xcodesol-page-builder' ), value: 'private' },
					] }
					onChange={ ( value ) => update( 'status', value ) }
				/>
				<div className="xsb-page-featured-image">
					<span className="xsb-control-label">{ __( 'Featured Image', 'xcodesol-page-builder' ) }</span>
					{ settings.featured_image_url ? (
						<div className="xsb-page-featured-image__preview">
							<img src={ settings.featured_image_url } alt="" />
							<div className="xsb-page-featured-image__actions">
								<button type="button" className="xsb-btn xsb-btn--secondary" onClick={ chooseFeaturedImage }>{ __( 'Replace', 'xcodesol-page-builder' ) }</button>
								<button type="button" className="xsb-btn xsb-btn--secondary" onClick={ () => { update( 'featured_image_id', 0 ); update( 'featured_image_url', '' ); } }>{ __( 'Remove', 'xcodesol-page-builder' ) }</button>
							</div>
						</div>
					) : (
						<button type="button" className="xsb-page-featured-image__empty" onClick={ chooseFeaturedImage }>
							<span className="dashicons dashicons-plus-alt2" aria-hidden="true" />
							<span>{ __( 'Choose image', 'xcodesol-page-builder' ) }</span>
						</button>
					) }
				</div>
				<WPTextControl
					label={ __( 'Order', 'xcodesol-page-builder' ) }
					type="number"
					value={ settings.order ?? 0 }
					onChange={ ( value ) => update( 'order', Number( value ) || 0 ) }
				/>
				<div className="xsb-page-settings__toggle">
					<ToggleControl label={ __( 'Allow Comments', 'xcodesol-page-builder' ) } checked={ !! settings.comments } onChange={ ( value ) => update( 'comments', value ) } />
				</div>
				<div className="xsb-page-settings__toggle">
					<ToggleControl label={ __( 'Hide Title', 'xcodesol-page-builder' ) } checked={ !! settings.hide_title } onChange={ ( value ) => update( 'hide_title', value ) } />
				</div>
			</CollapsibleSection>
		<CollapsibleSection id="page-layout-settings" title={ __( 'Page Layout', 'xcodesol-page-builder' ) }>
				<WPSelectControl
					label={ __( 'Layout', 'xcodesol-page-builder' ) }
					value={ settings.page_template || '' }
					options={ pageLayouts }
					onChange={ ( value ) => update( 'page_template', value ) }
				/>
				<p className="xsb-page-settings__help">{ __( 'Choose a WordPress page template. Page layouts are separate from archive and single-post display templates.', 'xcodesol-page-builder' ) }</p>
			</CollapsibleSection>
			<CollapsibleSection id="page-spacing-settings" title={ __( 'Margin & Padding', 'xcodesol-page-builder' ) }>
				<SpacingBoxControl config={ { id: 'page-margin', label: __( 'Margin', 'xcodesol-page-builder' ), units: [ 'px', '%', 'em', 'rem', 'vw', 'vh' ], allowNegative: true, default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } } value={ settings.margin || { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } onChange={ ( value ) => update( 'margin', value ) } />
				<SpacingBoxControl config={ { id: 'page-padding', label: __( 'Padding', 'xcodesol-page-builder' ), units: [ 'px', '%', 'em', 'rem', 'vw', 'vh' ], default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } } value={ settings.padding || { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } onChange={ ( value ) => update( 'padding', value ) } />
			</CollapsibleSection>
			<CollapsibleSection id="page-advanced-settings" title={ __( 'Advanced', 'xcodesol-page-builder' ) }>
				<div className="xsb-control-row-2col">
					<WPTextControl label={ __( 'CSS ID', 'xcodesol-page-builder' ) } value={ settings.css_id || '' } onChange={ ( value ) => update( 'css_id', value.replace( /[^a-zA-Z0-9_-]/g, '' ) ) } />
					<WPTextControl label={ __( 'CSS Classes', 'xcodesol-page-builder' ) } value={ settings.css_class || '' } onChange={ ( value ) => update( 'css_class', value ) } />
				</div>
				<CodeEditorControl label={ __( 'Page Custom CSS', 'xcodesol-page-builder' ) } value={ settings.custom_css || '' } onChange={ ( value ) => update( 'custom_css', value ) } placeholder={ "selector {\n  /* Styles for this page */\n}" } />
				<p className="xsb-page-settings__help">{ __( 'Use selector to target this page’s builder content.', 'xcodesol-page-builder' ) }</p>
			</CollapsibleSection>
		</div>
	);
}

function SiteSettingsView( { settings = {}, setSettings, fontOptions = [] } ) {
	const [ newColorName, setNewColorName ] = useState( '' );
	const [ newColorValue, setNewColorValue ] = useState( '#6366f1' );
	const updateColor = ( key, value ) => setSettings( ( current ) => ( { ...current, global_colors: { ...( current.global_colors || {} ), [ key ]: value } } ) );
	const updateFont = ( key, value ) => setSettings( ( current ) => ( { ...current, global_fonts: { ...( current.global_fonts || {} ), [ key ]: value } } ) );
	const updateTypography = ( key, value ) => setSettings( ( current ) => ( { ...current, typography: { ...( current.typography || {} ), [ key ]: value } } ) );
	const updateButtonStyle = ( key, value ) => setSettings( ( current ) => ( { ...current, button_style: { ...( current.button_style || {} ), [ key ]: value } } ) );
	const colors = settings.global_colors || {};
	const fonts = settings.global_fonts || {};
	const typography = settings.typography || {};
	const buttonStyle = settings.button_style || {};
	const backgroundImage = settings.background_image || {};
	const backgroundImageStyle = settings.background_image_style || {};
	const customColors = Array.isArray( settings.custom_colors ) ? settings.custom_colors : [];
	const customPalette = [ ...Object.values( colors ), ...customColors.map( ( color ) => color.value ) ];
	const fontsList = [ { label: __( 'Theme default', 'xcodesol-page-builder' ), value: fonts.body || 'system-ui' }, ...fontOptions.map( ( item ) => ( { label: item.label || item.name || item.value, value: item.value || item.family || item.name } ) ).filter( ( item ) => item.value ) ];
	const tokenRows = [ [ 'primary', __( 'Primary', 'xcodesol-page-builder' ) ], [ 'secondary', __( 'Secondary', 'xcodesol-page-builder' ) ], [ 'text', __( 'Text', 'xcodesol-page-builder' ) ], [ 'accent', __( 'Accent', 'xcodesol-page-builder' ) ] ];
	return <div className="xsb-inspector-rules xsb-page-settings xsb-site-settings">
		<p className="xsb-site-settings__intro">{ __( 'Set shared colours and fonts once. Use them across your pages for a consistent look.', 'xcodesol-page-builder' ) }</p>
		<CollapsibleSection id="site-global-colors" title={ __( 'Global Colours', 'xcodesol-page-builder' ) } defaultOpen>
			<div className="xsb-site-settings__group-title">{ __( 'System Colours', 'xcodesol-page-builder' ) }</div>
			<div className="xsb-site-settings__color-list">
				{ tokenRows.map( ( [ key, label ] ) => <div className="xsb-site-settings__color-row" key={ key }><span className="xsb-site-settings__color-label">{ label }</span><ColorPickerControl value={ colors[ key ] || '' } onChange={ ( value ) => updateColor( key, value ) } showTokens={ false } inlinePopover customPalette={ customPalette } /></div> ) }
			</div>
			<div className="xsb-site-settings__group-title xsb-site-settings__custom-title">{ __( 'Custom Colours', 'xcodesol-page-builder' ) }</div>
			{ customColors.length > 0 && <div className="xsb-site-settings__color-list">{ customColors.map( ( item ) => <div className="xsb-site-settings__color-row" key={ item.id }><span className="xsb-site-settings__color-label">{ item.name }</span><ColorPickerControl value={ item.value } onChange={ ( value ) => setSettings( ( current ) => ( { ...current, custom_colors: ( current.custom_colors || [] ).map( ( color ) => color.id === item.id ? { ...color, value } : color ) } ) ) } showTokens={ false } inlinePopover customPalette={ customPalette } /><button type="button" className="xsb-site-settings__remove-color" aria-label={ sprintf( __( 'Remove %s', 'xcodesol-page-builder' ), item.name ) } onClick={ () => setSettings( ( current ) => ( { ...current, custom_colors: ( current.custom_colors || [] ).filter( ( color ) => color.id !== item.id ) } ) ) }><IconTrash width={ 14 } height={ 14 } /></button></div> ) }</div> }
			<div className="xsb-site-settings__add-color"><input className="xsb-text-input" value={ newColorName } onChange={ ( event ) => setNewColorName( event.target.value ) } placeholder={ __( 'Colour name', 'xcodesol-page-builder' ) } /><ColorPickerControl value={ newColorValue } onChange={ setNewColorValue } showTokens={ false } inlinePopover customPalette={ customPalette } /><button type="button" className="xsb-btn xsb-btn--secondary" disabled={ ! newColorName.trim() } onClick={ () => { const id = `custom-${ Date.now() }`; setSettings( ( current ) => ( { ...current, custom_colors: [ ...( current.custom_colors || [] ), { id, name: newColorName.trim(), value: newColorValue } ] } ) ); setNewColorName( '' ); } }>{ __( 'Add Colour', 'xcodesol-page-builder' ) }</button></div>
		</CollapsibleSection>
		<CollapsibleSection id="site-global-fonts" title={ __( 'Global Fonts', 'xcodesol-page-builder' ) }>
			<p className="xsb-site-settings__help">{ __( 'Choose the typefaces used for body text and headings throughout your site.', 'xcodesol-page-builder' ) }</p>
			<WPSelectControl label={ __( 'Body Text', 'xcodesol-page-builder' ) } value={ fonts.body || 'system-ui' } options={ fontsList } onChange={ ( value ) => updateFont( 'body', value ) } />
			<WPSelectControl label={ __( 'Headings', 'xcodesol-page-builder' ) } value={ fonts.heading || 'system-ui' } options={ fontsList } onChange={ ( value ) => updateFont( 'heading', value ) } />
			<div className="xsb-site-settings__subheading">{ __( 'Typography', 'xcodesol-page-builder' ) }</div>
			<div className="xsb-site-settings__field-grid"><label>{ __( 'Body size (px)', 'xcodesol-page-builder' ) }<input className="xsb-text-input" type="number" min="10" max="48" value={ typography.body_size || 16 } onChange={ ( event ) => updateTypography( 'body_size', Number( event.target.value ) ) } /></label><label>{ __( 'Body weight', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ typography.body_weight || '400' } onChange={ ( event ) => updateTypography( 'body_weight', event.target.value ) }><option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option></select></label><label>{ __( 'Line height', 'xcodesol-page-builder' ) }<input className="xsb-text-input" type="number" min="1" max="3" step="0.1" value={ typography.line_height || 1.6 } onChange={ ( event ) => updateTypography( 'line_height', Number( event.target.value ) ) } /></label><label>{ __( 'Paragraph spacing (px)', 'xcodesol-page-builder' ) }<input className="xsb-text-input" type="number" min="0" max="100" value={ typography.paragraph_spacing ?? 16 } onChange={ ( event ) => updateTypography( 'paragraph_spacing', Number( event.target.value ) ) } /></label></div>
		</CollapsibleSection>
		<CollapsibleSection id="site-button-style" title={ __( 'Buttons', 'xcodesol-page-builder' ) }>
			<p className="xsb-site-settings__help">{ __( 'Set default and hover styles for buttons across the site.', 'xcodesol-page-builder' ) }</p>
			<div className="xsb-site-settings__subheading">{ __( 'Size', 'xcodesol-page-builder' ) }</div>
			<div className="xsb-site-settings__choice-chips" role="group" aria-label={ __( 'Button size', 'xcodesol-page-builder' ) }>{ [ [ 'xs', __( 'Extra small', 'xcodesol-page-builder' ), 11, 6, 12 ], [ 'small', __( 'Small', 'xcodesol-page-builder' ), 13, 8, 16 ], [ 'medium', __( 'Medium', 'xcodesol-page-builder' ), 16, 12, 24 ], [ 'large', __( 'Large', 'xcodesol-page-builder' ), 18, 15, 30 ], [ 'xl', __( 'Extra large', 'xcodesol-page-builder' ), 20, 18, 36 ], [ 'custom', __( 'Custom', 'xcodesol-page-builder' ), null, null, null ] ].map( ( [ value, label, fontSize, paddingY, paddingX ] ) => <button type="button" key={ value } className={ `xsb-site-settings__choice-chip${ ( buttonStyle.size || 'medium' ) === value ? ' is-active' : '' }` } aria-pressed={ ( buttonStyle.size || 'medium' ) === value } onClick={ () => { updateButtonStyle( 'size', value ); if ( value !== 'custom' ) { updateButtonStyle( 'font_size', fontSize ); updateButtonStyle( 'padding', { top: paddingY, right: paddingX, bottom: paddingY, left: paddingX, unit: 'px', isLinked: false } ); } } }>{ label }</button> ) }</div>
			<ColorPickerControl label={ __( 'Text colour', 'xcodesol-page-builder' ) } value={ buttonStyle.text || '' } onChange={ ( value ) => updateButtonStyle( 'text', value ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
			<ColorPickerControl label={ __( 'Background', 'xcodesol-page-builder' ) } value={ buttonStyle.background || '' } onChange={ ( value ) => updateButtonStyle( 'background', value ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
			<ColorPickerControl label={ __( 'Hover text colour', 'xcodesol-page-builder' ) } value={ buttonStyle.hover_text || '' } onChange={ ( value ) => updateButtonStyle( 'hover_text', value ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
			<ColorPickerControl label={ __( 'Hover background', 'xcodesol-page-builder' ) } value={ buttonStyle.hover_background || '' } onChange={ ( value ) => updateButtonStyle( 'hover_background', value ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
			<ToggleControl label={ __( 'Use gradient background', 'xcodesol-page-builder' ) } checked={ !! buttonStyle.gradient_enabled } onChange={ ( value ) => updateButtonStyle( 'gradient_enabled', value ) } />
			{ buttonStyle.gradient_enabled && <GradientControl config={ { id: 'site-button-gradient', label: __( 'Background gradient', 'xcodesol-page-builder' ), default: { type: 'linear', angle: 90, colorA: '#4f46e5', colorB: '#06b6d4', posA: 0, posB: 100 } } } value={ buttonStyle.gradient || {} } onChange={ ( value ) => updateButtonStyle( 'gradient', value ) } customPalette={ customPalette } /> }
			<ToggleControl label={ __( 'Use hover gradient', 'xcodesol-page-builder' ) } checked={ !! buttonStyle.hover_gradient_enabled } onChange={ ( value ) => updateButtonStyle( 'hover_gradient_enabled', value ) } />
			{ buttonStyle.hover_gradient_enabled && <GradientControl config={ { id: 'site-button-hover-gradient', label: __( 'Hover gradient', 'xcodesol-page-builder' ), default: { type: 'linear', angle: 90, colorA: '#4338ca', colorB: '#0891b2', posA: 0, posB: 100 } } } value={ buttonStyle.hover_gradient || {} } onChange={ ( value ) => updateButtonStyle( 'hover_gradient', value ) } customPalette={ customPalette } /> }
			<div className="xsb-site-settings__subheading">{ __( 'Border', 'xcodesol-page-builder' ) }</div>
			<ColorPickerControl label={ __( 'Border colour', 'xcodesol-page-builder' ) } value={ buttonStyle.border_color || '' } onChange={ ( value ) => updateButtonStyle( 'border_color', value ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
			<div className="xsb-site-settings__field-grid"><label>{ __( 'Border style', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ buttonStyle.border_style || 'solid' } onChange={ ( event ) => updateButtonStyle( 'border_style', event.target.value ) }><option value="solid">{ __( 'Solid', 'xcodesol-page-builder' ) }</option><option value="dashed">{ __( 'Dashed', 'xcodesol-page-builder' ) }</option><option value="dotted">{ __( 'Dotted', 'xcodesol-page-builder' ) }</option><option value="double">{ __( 'Double', 'xcodesol-page-builder' ) }</option></select></label></div>
			<SpacingBoxControl config={ { id: 'site-button-border-width', label: __( 'Border width', 'xcodesol-page-builder' ), units: [ 'px' ], default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } } value={ typeof buttonStyle.border_width === 'object' ? buttonStyle.border_width : { top: buttonStyle.border_width ?? 0, right: buttonStyle.border_width ?? 0, bottom: buttonStyle.border_width ?? 0, left: buttonStyle.border_width ?? 0, unit: 'px', isLinked: true } } onChange={ ( value ) => updateButtonStyle( 'border_width', value ) } />
			<SpacingBoxControl config={ { id: 'site-button-corner-radius', label: __( 'Corner radius', 'xcodesol-page-builder' ), units: [ 'px' ], default: { top: 6, right: 6, bottom: 6, left: 6, unit: 'px', isLinked: true } } } value={ typeof buttonStyle.radius === 'object' ? buttonStyle.radius : { top: buttonStyle.radius ?? 6, right: buttonStyle.radius ?? 6, bottom: buttonStyle.radius ?? 6, left: buttonStyle.radius ?? 6, unit: 'px', isLinked: true } } onChange={ ( value ) => updateButtonStyle( 'radius', value ) } />
			{ ( buttonStyle.size || 'medium' ) === 'custom' && <><SpacingBoxControl config={ { id: 'site-button-padding', label: __( 'Padding', 'xcodesol-page-builder' ), units: [ 'px' ], default: { top: 12, right: 24, bottom: 12, left: 24, unit: 'px', isLinked: false } } } value={ typeof buttonStyle.padding === 'object' ? buttonStyle.padding : { top: buttonStyle.padding_y ?? 12, right: buttonStyle.padding_x ?? 24, bottom: buttonStyle.padding_y ?? 12, left: buttonStyle.padding_x ?? 24, unit: 'px', isLinked: false } } onChange={ ( value ) => updateButtonStyle( 'padding', value ) } /><div className="xsb-site-settings__field-grid"><label>{ __( 'Text size (px)', 'xcodesol-page-builder' ) }<input className="xsb-text-input" type="number" min="8" max="48" value={ buttonStyle.font_size ?? 16 } onChange={ ( event ) => updateButtonStyle( 'font_size', Number( event.target.value ) ) } /></label></div></> }
			<div className="xsb-site-settings__subheading">{ __( 'Shadow', 'xcodesol-page-builder' ) }</div>
			<div className="xsb-site-settings__shadow-chips" role="group" aria-label={ __( 'Button shadow', 'xcodesol-page-builder' ) }>{ [ [ 'none', __( 'None', 'xcodesol-page-builder' ), 'none' ], [ 'soft', __( 'Soft', 'xcodesol-page-builder' ), '0 2px 8px rgba(15,23,42,.12)' ], [ 'medium', __( 'Medium', 'xcodesol-page-builder' ), '0 6px 16px rgba(15,23,42,.18)' ], [ 'strong', __( 'Strong', 'xcodesol-page-builder' ), '0 12px 28px rgba(15,23,42,.24)' ] ].map( ( [ value, label, shadow ] ) => <button type="button" key={ value } className={ `xsb-site-settings__shadow-chip${ ( buttonStyle.shadow_preset || 'none' ) === value ? ' is-active' : '' }` } aria-pressed={ ( buttonStyle.shadow_preset || 'none' ) === value } onClick={ () => { updateButtonStyle( 'shadow_preset', value ); updateButtonStyle( 'shadow', shadow ); } }><span className="xsb-site-settings__shadow-sample" style={ { boxShadow: shadow === 'none' ? 'inset 0 0 0 1px #cbd5e1' : shadow } } /><span>{ label }</span></button> ) }</div>
			<label className="xsb-site-settings__custom-shadow">{ __( 'Custom box shadow (CSS)', 'xcodesol-page-builder' ) }<input className="xsb-text-input" type="text" value={ buttonStyle.shadow_preset === 'custom' ? ( buttonStyle.shadow || '' ) : '' } placeholder="0 4px 12px rgba(0, 0, 0, .15)" onChange={ ( event ) => { updateButtonStyle( 'shadow_preset', 'custom' ); updateButtonStyle( 'shadow', event.target.value ); } } /></label>
		</CollapsibleSection>
		<CollapsibleSection id="site-theme-background" title={ __( 'Site Background', 'xcodesol-page-builder' ) }>
			<p className="xsb-site-settings__help">{ __( 'Set the default page background. Individual containers can use their own background.', 'xcodesol-page-builder' ) }</p>
			<ColorPickerControl label={ __( 'Background colour', 'xcodesol-page-builder' ) } value={ colors.background || '' } onChange={ ( value ) => updateColor( 'background', value ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
			<MediaPickerControl config={ { id: 'site-background-image', label: __( 'Background image', 'xcodesol-page-builder' ), allowedTypes: [ 'image' ] } } value={ backgroundImage } onChange={ ( value ) => setSettings( ( current ) => ( { ...current, background_image: value } ) ) } />
			{ ( backgroundImage.url || backgroundImage.id ) && <>
				<div className="xsb-site-settings__field-grid">
					<label>{ __( 'Image size', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ backgroundImageStyle.size || 'cover' } onChange={ ( event ) => setSettings( ( current ) => ( { ...current, background_image_style: { ...( current.background_image_style || {} ), size: event.target.value } } ) ) }><option value="cover">{ __( 'Cover', 'xcodesol-page-builder' ) }</option><option value="contain">{ __( 'Contain', 'xcodesol-page-builder' ) }</option><option value="auto">{ __( 'Original size', 'xcodesol-page-builder' ) }</option></select></label>
					<label>{ __( 'Repeat', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ backgroundImageStyle.repeat || 'no-repeat' } onChange={ ( event ) => setSettings( ( current ) => ( { ...current, background_image_style: { ...( current.background_image_style || {} ), repeat: event.target.value } } ) ) }><option value="no-repeat">{ __( 'No repeat', 'xcodesol-page-builder' ) }</option><option value="repeat">{ __( 'Repeat', 'xcodesol-page-builder' ) }</option><option value="repeat-x">{ __( 'Repeat horizontally', 'xcodesol-page-builder' ) }</option><option value="repeat-y">{ __( 'Repeat vertically', 'xcodesol-page-builder' ) }</option></select></label>
					<label>{ __( 'Position', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ backgroundImageStyle.position || 'center center' } onChange={ ( event ) => setSettings( ( current ) => ( { ...current, background_image_style: { ...( current.background_image_style || {} ), position: event.target.value } } ) ) }>{ [ 'center center', 'center top', 'center bottom', 'left center', 'right center', 'left top', 'right top', 'left bottom', 'right bottom' ].map( ( position ) => <option key={ position } value={ position }>{ position.replace( /\b\w/g, ( letter ) => letter.toUpperCase() ) }</option> ) }</select></label>
					<label>{ __( 'Attachment', 'xcodesol-page-builder' ) }<select className="xsb-select-input" value={ backgroundImageStyle.attachment || 'scroll' } onChange={ ( event ) => setSettings( ( current ) => ( { ...current, background_image_style: { ...( current.background_image_style || {} ), attachment: event.target.value } } ) ) }><option value="scroll">{ __( 'Scroll', 'xcodesol-page-builder' ) }</option><option value="fixed">{ __( 'Fixed', 'xcodesol-page-builder' ) }</option></select></label>
				</div>
				<ColorPickerControl label={ __( 'Image overlay colour', 'xcodesol-page-builder' ) } value={ backgroundImageStyle.overlay || '' } onChange={ ( value ) => setSettings( ( current ) => ( { ...current, background_image_style: { ...( current.background_image_style || {} ), overlay: value } } ) ) } showTokens={ false } inlinePopover customPalette={ customPalette } />
				<label className="xsb-site-settings__range-label">{ __( 'Overlay opacity', 'xcodesol-page-builder' ) }<input type="range" min="0" max="100" value={ backgroundImageStyle.overlay_opacity ?? 0 } onChange={ ( event ) => setSettings( ( current ) => ( { ...current, background_image_style: { ...( current.background_image_style || {} ), overlay_opacity: Number( event.target.value ) } } ) ) } /><span>{ backgroundImageStyle.overlay_opacity ?? 0 }%</span></label>
			</> }
		</CollapsibleSection>
		<CollapsibleSection id="site-custom-css" title={ __( 'Custom CSS', 'xcodesol-page-builder' ) }>
			<p className="xsb-site-settings__help">{ __( 'Add site-wide CSS for details that are not available in the visual controls.', 'xcodesol-page-builder' ) }</p>
			<CodeEditorControl label={ __( 'Site-wide CSS', 'xcodesol-page-builder' ) } value={ settings.custom_css || '' } onChange={ ( value ) => setSettings( ( current ) => ( { ...current, custom_css: value } ) ) } placeholder={ "body {\n  /* Site-wide styles */\n}" } />
		</CollapsibleSection>
	</div>;
}

function BlockAdvancedTab( { blockType, instanceId, settings = {}, onChange } ) {
	return (
		<div className="xsb-inspector-advanced">
			<CollapsibleSection
				id="adv-spacing"
				title={ __( 'Spacing (Padding & Margin)', 'xcodesol-page-builder' ) }
				defaultOpen={ true }
				onReset={ () => {
					onChange( 'padding', 0 );
					onChange( 'margin', 0 );
				} }
			>
				<SpacingBoxControl
					config={ { id: 'advanced-padding', label: __( 'Padding', 'xcodesol-page-builder' ), units: [ 'px', '%', 'rem', 'em' ], default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } }
					value={ typeof settings.padding === 'object' ? settings.padding : { top: Number( settings.padding ) || 0, right: Number( settings.padding ) || 0, bottom: Number( settings.padding ) || 0, left: Number( settings.padding ) || 0 } }
					onChange={ ( value ) => onChange( 'padding', value ) }
				/>
				<SpacingBoxControl
					config={ { id: 'advanced-margin', label: __( 'Margin', 'xcodesol-page-builder' ), units: [ 'px', '%', 'rem', 'em' ], allowNegative: true, default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } }
					value={ typeof settings.margin === 'object' ? settings.margin : { top: Number( settings.margin ) || 0, right: Number( settings.margin ) || 0, bottom: Number( settings.margin ) || 0, left: Number( settings.margin ) || 0 } }
					onChange={ ( value ) => onChange( 'margin', value ) }
				/>
			</CollapsibleSection>
			<MotionSettingsPanel blockType={ blockType } instanceId={ instanceId } settings={ settings } onChange={ onChange } />
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
	const hasAlignmentSection = isHeading || isButton || isImage || isBanner || isText;

	const activeColor = settings.bg_color || settings.background || settings.text_color || settings.color;
	const colorHint = activeColor ? (
		<span className="xsb-hint-swatch" style={ { background: activeColor } } />
	) : null;

	return (
		<div className="xsb-inspector-style-flow">
			{/* 7. Live button state preview at top of Style tab */}
			{ isButton && <ButtonLivePreview settings={ settings } /> }

			{/* ALIGNMENT SECTION (Open by default if first) */}
			{ hasAlignmentSection && (
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
				defaultOpen={ ! hasAlignmentSection }
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
							customPalette={ customPalette }
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
							customPalette={ customPalette }
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
							customPalette={ customPalette }
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

			{/* BORDER & CORNERS */}
			{ ( isButton || isImage || isContainer ) && (
				<CollapsibleSection
					id="style-border"
					title={ __( 'Border & Corners', 'xcodesol-page-builder' ) }
					hint={ typeof settings.border_radius === 'object' ? `${ settings.border_radius.top ?? 0 } / ${ settings.border_radius.right ?? 0 } / ${ settings.border_radius.bottom ?? 0 } / ${ settings.border_radius.left ?? 0 }px` : `${ settings.border_radius ?? ( isButton ? 6 : 0 ) }px` }
					onReset={ () => onChange( 'border_radius', 0 ) }
				>
					<SpacingBoxControl config={ { id: 'block-border-width', label: __( 'Border width', 'xcodesol-page-builder' ), units: [ 'px' ], default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } } value={ typeof settings.border_width === 'object' ? settings.border_width : { top: settings.border_width ?? 0, right: settings.border_width ?? 0, bottom: settings.border_width ?? 0, left: settings.border_width ?? 0, unit: 'px', isLinked: true } } onChange={ ( val ) => onChange( 'border_width', val ) } />
					<SpacingBoxControl config={ { id: 'block-border-radius', label: __( 'Corner radius', 'xcodesol-page-builder' ), units: [ 'px', '%', 'rem', 'em' ], default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', isLinked: true } } } value={ typeof settings.border_radius === 'object' ? settings.border_radius : { top: settings.border_radius ?? ( isButton ? 6 : 0 ), right: settings.border_radius ?? ( isButton ? 6 : 0 ), bottom: settings.border_radius ?? ( isButton ? 6 : 0 ), left: settings.border_radius ?? ( isButton ? 6 : 0 ), unit: 'px', isLinked: true } } onChange={ ( val ) => onChange( 'border_radius', val ) } />
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
	showPageSettings,
	showGlobalSettings,
	globalSettings,
	customPalette = [],
	setGlobalSettings,
	globalFontOptions,
	onSaveGlobalSettings,
	pageSettings,
	setPageSettings,
	pageTemplateOptions,
	title,
	setTitle,
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
	const [ sectionStates, setSectionStates ] = useState( {} );
	const [ schemaResetVersion, setSchemaResetVersion ] = useState( 0 );
	const inspectorClassName = `xsb-inspector xcopb-inspector${ open ? ' is-open' : ' is-closed' }`;
	const configuredFeaturedImage = window.xcopbBuilderConfig?.featuredImageUrl || window.xcosbBuilderConfig?.featuredImageUrl || '';
	const hasPageFeaturedImageSetting = Object.prototype.hasOwnProperty.call( pageSettings || {}, 'featured_image_url' ) || Object.prototype.hasOwnProperty.call( pageSettings || {}, 'featured_image_id' );
	const currentFeaturedImageUrl = hasPageFeaturedImageSetting ? ( pageSettings.featured_image_url || '' ) : configuredFeaturedImage;

	if ( showPageSettings ) {
		return (
			<aside className={ inspectorClassName } aria-hidden={ ! open } inert={ ! open }>
				<div className="xsb-inspector-head">
					<div className="xsb-inspector-head-title-wrap">
						<span className="xsb-inspector-head-icon" aria-hidden="true"><span className="dashicons dashicons-admin-page" /></span>
						<h3 className="xsb-inspector-subject">{ __( 'Page Settings', 'xcodesol-page-builder' ) }</h3>
					</div>
					<button type="button" className="xsb-inspector-close-btn" onClick={ onClose } aria-label={ __( 'Close inspector', 'xcodesol-page-builder' ) }>
						<IconClose width={ 14 } height={ 14 } />
					</button>
				</div>
				<div className="xsb-inspector-body">
					<PageSettingsView title={ title } setTitle={ setTitle } settings={ pageSettings } setSettings={ setPageSettings } pageTemplateOptions={ pageTemplateOptions } />
				</div>
			</aside>
		);
	}
	if ( showGlobalSettings ) {
		return <aside className={ `${ inspectorClassName } xsb-inspector--site-settings` } aria-hidden={ ! open } inert={ ! open }><div className="xsb-inspector-head"><div className="xsb-inspector-head-title-wrap"><span className="xsb-inspector-head-icon"><IconPalette width={ 15 } height={ 15 } /></span><h3 className="xsb-inspector-subject">{ __( 'Site Settings', 'xcodesol-page-builder' ) }</h3></div><button type="button" className="xsb-inspector-close-btn" onClick={ onClose } aria-label={ __( 'Close inspector', 'xcodesol-page-builder' ) }><IconClose width={ 14 } height={ 14 } /></button></div><div className="xsb-inspector-body"><SiteSettingsView settings={ globalSettings } setSettings={ setGlobalSettings } fontOptions={ globalFontOptions } /></div><div className="xsb-inspector-footer"><button type="button" className="xsb-inspector-footer-btn xsb-inspector-footer-btn--primary" onClick={ onSaveGlobalSettings }>{ __( 'Save Changes', 'xcodesol-page-builder' ) }</button></div></aside>;
	}

	const nestedBlock = ( () => {
		if ( ! selectedNested || ! layout[ selectedNested.ci ] ) return null;
		const path = Array.isArray( selectedNested.path ) && selectedNested.path.length
			? selectedNested.path
			: [ selectedNested ];
		let current = layout[ selectedNested.ci ];
		for ( const step of path ) {
			current = current?.inner?.[ Number( step.cj ) ]?.[ Number( step.bi ) ];
			if ( ! current ) return null;
		}
		return current;
	} )();

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
			<aside className={ inspectorClassName } aria-hidden={ ! open } inert={ ! open }>
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
			<aside className={ inspectorClassName } aria-hidden={ ! open } inert={ ! open }>
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
					value,
					selectedNested.path
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
	const blockSchema = schemaFor( block.type );
	const schemaManifest = manifestFor( block.type );

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
		<aside className={ inspectorClassName } aria-hidden={ ! open } inert={ ! open }>
				{/* Selected widget title and inspector actions. */}
			<div className="xsb-inspector-head">
				<div className="xsb-inspector-head-title-wrap">
					<span className="xsb-inspector-head-icon" aria-hidden="true">
						{ getBlockIcon( block.type ) }
					</span>
					<h3 className="xsb-inspector-subject" title={ blockLabel }>{ blockLabel }</h3>
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

			{ blockSchema && (
				<div className="xsb-inspector-search">
					<input
						type="search"
						className="xsb-inspector-search__input"
						value={ searchQuery }
						placeholder={ __( 'Find a setting…', 'xcodesol-page-builder' ) }
						aria-label={ __( 'Find a setting', 'xcodesol-page-builder' ) }
						onChange={ ( event ) => setSearchQuery( event.target.value ) }
					/>
				</div>
			) }

			<div className="xsb-inspector-body">
				{ blockSchema ? (
					<SchemaInspectorRenderer
						schema={ blockSchema }
						manifest={ schemaManifest || blockSchema.manifest }
						settings={ block.settings || {} }
						context={ { isNested: !! selectedNested, parent_layout_mode: selectedNested ? parentMode : null } }
						activeTab={ tab }
						activeDevice={ device }
						activeState={ activeStyleState }
						sectionStates={ sectionStates }
						setSectionStates={ setSectionStates }
						resetVersion={ schemaResetVersion }
						blockType={ block.type }
						insertedPanel={ tab === 'advanced' && ! searchQuery ? <MotionSettingsPanel blockType={ block.type } instanceId={ block.id || `block-${ selectedIndex }` } settings={ block.settings || {} } onChange={ updateSetting } /> : null }
						insertBeforeSectionIds={ [ 'visibility', 'responsive_visibility' ] }
						dynamicPreview={ { featuredImageUrl: currentFeaturedImageUrl } }
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
							<>
								<BlockAdvancedTab blockType={ block.type } instanceId={ block.id || `block-${ selectedIndex }` } settings={ block.settings || {} } onChange={ updateSetting } />
							</>
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
						if ( blockSchema ) {
							const nextSettings = { ...( block.settings || {} ) };
							blockSchema.controls.filter( control => control.tab === tab ).forEach( control => {
								[ control.id, `hover_${ control.id }`, `focus_${ control.id }`, `hover_${ control.id }_tablet`, `hover_${ control.id }_mobile`, `focus_${ control.id }_tablet`, `focus_${ control.id }_mobile`, ...[ 'tablet', 'mobile' ].map( deviceName => `${ deviceName }_${ control.id }` ) ].forEach( key => { delete nextSettings[ key ]; } );
							} );
							if ( tab === 'advanced' ) {
								[ 'animation', 'animation_duration', 'animation_delay', 'animation_easing', 'animation_repeat', 'heading_animation', 'description_animation', 'button_animation' ].forEach( key => { delete nextSettings[ key ]; } );
							}
							updateSetting( nextSettings );
							setSectionStates( {} );
							setSchemaResetVersion( version => version + 1 );
							return;
						}
						if ( tab === 'style' ) {
							updateSetting( {
								bg_color: undefined,
								text_color: undefined,
								color: undefined,
								background: undefined,
								border_radius: undefined,
								align: undefined,
								font_size: undefined,
							} );
						} else if ( tab === 'advanced' ) {
							updateSetting( {
								margin: undefined,
								padding: undefined,
								widget_padding: undefined,
								position: undefined,
								z_index: undefined,
								rotate: undefined,
								scale: undefined,
								transform_origin: undefined,
								transition_duration: undefined,
								animation: undefined,
								animation_duration: undefined,
								animation_delay: undefined,
								animation_easing: undefined,
								animation_repeat: undefined,
								heading_animation: undefined,
								description_animation: undefined,
								button_animation: undefined,
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
