/**
 * Individual block settings inspector.
 *
 * Shows technical/content settings only. Styling controls (colors, fonts,
 * spacing, shadows, animations) live in the floating style popover that
 * appears directly on the selected widget in the canvas.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { SelectControl, TextControl, TextareaControl, ToggleControl, PanelBody, RangeControl } from '@wordpress/components';

import { columnCount, equalColumnWidths, resolveColumnWidths, gridUnitOptions } from '../lib/columns';

// Shared per-device layout building blocks (device tabs, inheritance
// helpers, inherit/reset actions, ready-made select field). New per-device
// settings (gap, alignment, padding, …) should import from this module
// instead of re-implementing the device layer.
import * as DeviceField from './device-field';


/** Options for integer column-count pickers (1–6). */
const COLUMN_OPTIONS = [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => ( {
	label: String( n ),
	value: String( n ),
} ) );

function HeadingSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Heading', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Title', 'xcodesol-page-builder' ) }
					value={ block.settings.title || block.settings.text || '' }
					onChange={ ( value ) => updateSetting( 'title', value ) }
				/>
				<TextControl
					type="url"
					label={ __( 'Link', 'xcodesol-page-builder' ) }
					value={ block.settings.link || '' }
					onChange={ ( value ) => updateSetting( 'link', value ) }
				/>
				<SelectControl
					label={ __( 'HTML Tag', 'xcodesol-page-builder' ) }
					value={ block.settings.tag || 'h2' }
					options={ [
						{ label: 'H1', value: 'h1' },
						{ label: 'H2', value: 'h2' },
						{ label: 'H3', value: 'h3' },
						{ label: 'H4', value: 'h4' },
						{ label: 'H5', value: 'h5' },
						{ label: 'H6', value: 'h6' },
						{ label: 'div', value: 'div' },
						{ label: 'span', value: 'span' },
						{ label: 'p', value: 'p' },
					] }
					onChange={ ( value ) => updateSetting( 'tag', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
						{ label: __( 'Justified', 'xcodesol-page-builder' ), value: 'justify' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function ButtonSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Button', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Text', 'xcodesol-page-builder' ) }
					value={ block.settings.text || '' }
					onChange={ ( value ) => updateSetting( 'text', value ) }
				/>
				<TextControl
					type="url"
					label={ __( 'Link', 'xcodesol-page-builder' ) }
					value={ block.settings.link || '' }
					onChange={ ( value ) => updateSetting( 'link', value ) }
				/>
				<SelectControl
					label={ __( 'Size', 'xcodesol-page-builder' ) }
					value={ block.settings.size || 'md' }
					options={ [
						{ label: __( 'Small', 'xcodesol-page-builder' ), value: 'small' },
						{ label: __( 'Medium', 'xcodesol-page-builder' ), value: 'medium' },
						{ label: __( 'Large', 'xcodesol-page-builder' ), value: 'large' },
						{ label: __( 'Extra Large', 'xcodesol-page-builder' ), value: 'xl' },
					] }
					onChange={ ( value ) => updateSetting( 'size', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
						{ label: __( 'Justified', 'xcodesol-page-builder' ), value: 'justify' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<TextControl
					label={ __( 'Background Color', 'xcodesol-page-builder' ) }
					value={ block.settings.bg_color || '' }
					onChange={ ( value ) => updateSetting( 'bg_color', value ) }
				/>
				<TextControl
					label={ __( 'Text Color', 'xcodesol-page-builder' ) }
					value={ block.settings.text_color || '' }
					onChange={ ( value ) => updateSetting( 'text_color', value ) }
				/>
				<TextControl
					label={ __( 'Border Radius (px)', 'xcodesol-page-builder' ) }
					type="number"
					value={ String( block.settings.border_radius ?? 6 ) }
					onChange={ ( value ) => updateSetting( 'border_radius', Number( value ) ) }
				/>
			</PanelBody>
		</div>
	);
}

function ImageSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Image', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Image URL', 'xcodesol-page-builder' ) }
					value={ block.settings.url || block.settings.src || '' }
					onChange={ ( value ) => updateSetting( 'url', value ) }
				/>
				<TextControl
					label={ __( 'Alt Text', 'xcodesol-page-builder' ) }
					value={ block.settings.alt || '' }
					onChange={ ( value ) => updateSetting( 'alt', value ) }
				/>
				<TextControl
					label={ __( 'Caption', 'xcodesol-page-builder' ) }
					value={ block.settings.caption || '' }
					onChange={ ( value ) => updateSetting( 'caption', value ) }
				/>
				<TextControl
					type="url"
					label={ __( 'Link URL (optional)', 'xcodesol-page-builder' ) }
					value={ block.settings.link || '' }
					onChange={ ( value ) => updateSetting( 'link', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<TextControl
					label={ __( 'Border Radius (px)', 'xcodesol-page-builder' ) }
					type="number"
					value={ String( block.settings.border_radius ?? 0 ) }
					onChange={ ( value ) => updateSetting( 'border_radius', Number( value ) ) }
				/>
			</PanelBody>
		</div>
	);
}

function ShortcodeSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Shortcode', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Title / Label', 'xcodesol-page-builder' ) }
					value={ block.settings.title || '' }
					onChange={ ( value ) => updateSetting( 'title', value ) }
				/>
				<TextareaControl
					label={ __( 'Enter your shortcode', 'xcodesol-page-builder' ) }
					help={ __( 'Example: [contact-form-7 id="123"]', 'xcodesol-page-builder' ) }
					rows={ 4 }
					value={ block.settings.shortcode || '' }
					onChange={ ( value ) => updateSetting( 'shortcode', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function BannerSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody
				title={ __( 'Content', 'xcodesol-page-builder' ) }
				initialOpen={ true }
			>
				<SelectControl
					label={ __( 'Title source', 'xcodesol-page-builder' ) }
					value={ block.settings.title_source || 'custom' }
					options={ [
						{
							label: __( 'Custom text', 'xcodesol-page-builder' ),
							value: 'custom',
						},
						{
							label: __( 'Archive title', 'xcodesol-page-builder' ),
							value: 'archive_title',
						},
					] }
					onChange={ ( value ) => updateSetting( 'title_source', value ) }
				/>
				{ 'custom' === ( block.settings.title_source || 'custom' ) && (
					<TextControl
						label={ __( 'Title', 'xcodesol-page-builder' ) }
						value={ block.settings.title || '' }
						onChange={ ( value ) => updateSetting( 'title', value ) }
					/>
				) }
				<TextControl
					label={ __( 'Subtitle', 'xcodesol-page-builder' ) }
					value={ block.settings.subtitle || '' }
					onChange={ ( value ) => updateSetting( 'subtitle', value ) }
				/>
				<TextControl
					label={ __( 'Button text', 'xcodesol-page-builder' ) }
					value={ block.settings.button_text || '' }
					onChange={ ( value ) => updateSetting( 'button_text', value ) }
				/>
				<TextControl
					type="url"
					label={ __( 'Button link', 'xcodesol-page-builder' ) }
					value={ block.settings.link || '' }
					onChange={ ( value ) => updateSetting( 'link', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function DividerSettings() {
	return (
		<p className="xsb-inspector-none">
			{ __( 'Thickness, color and spacing are in the Style tab.', 'xcodesol-page-builder' ) }
		</p>
	);
}

function TextSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<SelectControl
				label={ __( 'Tag', 'xcodesol-page-builder' ) }
				value={ block.settings.tag || 'p' }
				options={ [
					'p',
					'h1',
					'h2',
					'h3',
					'h4',
					'h5',
					'h6',
					'div',
					'span',
					'blockquote',
				].map( ( tag ) => ( {
					label: tag.toUpperCase(),
					value: tag,
				} ) ) }
				onChange={ ( value ) => updateSetting( 'tag', value ) }
			/>
			<TextControl
				label={ __( 'Text', 'xcodesol-page-builder' ) }
				value={ block.settings.content || '' }
				onChange={ ( value ) => updateSetting( 'content', value ) }
			/>
		</div>
	);
}

function ContainerSettings( { block, updateSetting, device = 'desktop', onDeviceChange } ) {
	const cols = columnCount( block.settings.columns );

	// Widths for the active device: the tablet/mobile layers store their own
	// column_widths arrays (mobile inherits tablet, tablet inherits desktop).
	const widths = resolveColumnWidths( cols, DeviceField.deviceEffective( block.settings, 'column_widths', device ) );
	const total = widths.reduce( ( sum, width ) => sum + width, 0 );

	const changeColumnCount = ( value ) => {
		const n = columnCount( parseInt( value, 10 ) );
		// Update the count and reset the widths to an even split in one go.
		// Stale per-device width arrays are cleared so no old span lingers.
		updateSetting( {
			columns: n,
			column_widths: equalColumnWidths( n ),
			tablet_column_widths: undefined,
			mobile_column_widths: undefined,
		} );
	};

	const changeWidth = ( colIndex, value ) => {
		const next = [ ...widths ];
		const unit = Math.min( 12, Math.max( 1, parseInt( value, 10 ) || 1 ) );
		next[ colIndex ] = unit;
		// The first edit on Tablet/Mobile stores a full array for that device
		// (inheriting the currently shown values), so later edits are stable.
		updateSetting( DeviceField.deviceKeyFor( 'column_widths', device ), next );
	};

	return (
		<div className="xsb-block-settings">
			<p className="xsb-inspector-help">
				{ __(
					'Columns sit on a 12-unit grid: set the column count, then give each column its own width (e.g. 3 + 9). Switch to Tablet or Mobile to give the columns different widths there so they reflow.',
					'xcodesol-page-builder'
				) }
			</p>
			<SelectControl
				label={ __( 'Columns', 'xcodesol-page-builder' ) }
				help={ __( 'The number of columns is the same on every device — only their widths can differ. Changing the count resets widths to an even split; widgets in removed columns are kept but not shown until the count grows again.', 'xcodesol-page-builder' ) }
				value={ String( cols ) }
				options={ [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => ( {
					label: `${ n } ${ n === 1 ? __( 'column', 'xcodesol-page-builder' ) : __( 'columns', 'xcodesol-page-builder' ) }`,
					value: String( n ),
				} ) ) }
				onChange={ changeColumnCount }
			/>
			<div className="xsb-inspector-column-widths">
				<DeviceField.DeviceShell
					settings={ block.settings }
					device={ device }
					onDeviceChange={ onDeviceChange }
					baseKey="column_widths"
					noun={ __( 'column widths', 'xcodesol-page-builder' ) }
					valueLabel={ widths.join( ' + ' ) }
					resetLabel={ __( 'Inherit desktop widths', 'xcodesol-page-builder' ) }
					onReset={ () => updateSetting( DeviceField.deviceKeyFor( 'column_widths', device ), undefined ) }
				>
					{ ( { device: activeDevice, resetLink, inheritedNote } ) => (
						<>
							{ widths.map( ( width, colIndex ) => (
								<SelectControl
									key={ colIndex }
									label={ DeviceField.deviceLabelOf( sprintf( __( 'Column %d width', 'xcodesol-page-builder' ), colIndex + 1 ), activeDevice ) }
									value={ String( width ) }
									options={ gridUnitOptions() }
									onChange={ ( value ) => changeWidth( colIndex, value ) }
								/>
							) ) }
							<div className="xsb-inspector-device-field__row xsb-column-width-total-row">
								<p className="xsb-column-width-total">
									{ sprintf( __( 'Widths: %1$s = %2$d of 12', 'xcodesol-page-builder' ), widths.join( ' + ' ), total ) }
								</p>
								{ resetLink }
								{ inheritedNote && <p className="xsb-field-help">{ inheritedNote }</p> }
							</div>
						</>
					) }
				</DeviceField.DeviceShell>
			</div>
		</div>
	);
}

function CategoriesSettings( { block, updateSetting, device = 'desktop', onDeviceChange } ) {
	return (
		<div className="xsb-block-settings">
			<TextControl
				label={ __( 'Title', 'xcodesol-page-builder' ) }
				help={ __( 'Heading shown above the categories. Leave empty to hide it.', 'xcodesol-page-builder' ) }
				value={ block.settings.title || '' }
				onChange={ ( value ) => updateSetting( 'title', value ) }
			/>
			<SelectControl
				label={ __( 'Display', 'xcodesol-page-builder' ) }
				value={ block.settings.display || 'grid' }
				options={ [
					{ label: __( 'Grid of cards', 'xcodesol-page-builder' ), value: 'grid' },
					{ label: __( 'Simple list', 'xcodesol-page-builder' ), value: 'list' },
				] }
				onChange={ ( value ) => updateSetting( 'display', value ) }
			/>
			{ ( block.settings.display || 'grid' ) === 'grid' && (
				<DeviceField.DeviceSelectField
					settings={ block.settings }
					set={ updateSetting }
					device={ device }
					onDeviceChange={ onDeviceChange }
					baseKey="columns"
					label={ __( 'Columns', 'xcodesol-page-builder' ) }
					options={ COLUMN_OPTIONS }
					fallback={ 4 }
					parse={ Number }
				/>
			) }
			<SelectControl
				label={ __( 'Order by', 'xcodesol-page-builder' ) }
				value={ block.settings.orderby || 'name' }
				options={ [
					{ label: __( 'Name', 'xcodesol-page-builder' ), value: 'name' },
					{ label: __( 'Product count', 'xcodesol-page-builder' ), value: 'count' },
					{ label: __( 'Slug', 'xcodesol-page-builder' ), value: 'slug' },
				] }
				onChange={ ( value ) => updateSetting( 'orderby', value ) }
			/>
			<SelectControl
				label={ __( 'Order', 'xcodesol-page-builder' ) }
				value={ block.settings.order || 'asc' }
				options={ [
					{ label: __( 'Ascending', 'xcodesol-page-builder' ), value: 'asc' },
					{ label: __( 'Descending', 'xcodesol-page-builder' ), value: 'desc' },
				] }
				onChange={ ( value ) => updateSetting( 'order', value ) }
			/>
			<ToggleControl
				label={ __( 'Hide empty categories', 'xcodesol-page-builder' ) }
				checked={ block.settings.hide_empty !== false }
				onChange={ ( value ) => updateSetting( 'hide_empty', value ) }
			/>
			<ToggleControl
				label={ __( 'Show product count', 'xcodesol-page-builder' ) }
				checked={ !! block.settings.show_count }
				onChange={ ( value ) => updateSetting( 'show_count', value ) }
			/>
		</div>
	);
}

function TagsSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<TextControl
				label={ __( 'Title', 'xcodesol-page-builder' ) }
				help={ __( 'Heading shown above the tags. Leave empty to hide it.', 'xcodesol-page-builder' ) }
				value={ block.settings.title || '' }
				onChange={ ( value ) => updateSetting( 'title', value ) }
			/>
			<SelectControl
				label={ __( 'Display', 'xcodesol-page-builder' ) }
				value={ block.settings.display || 'cloud' }
				options={ [
					{ label: __( 'Tag cloud', 'xcodesol-page-builder' ), value: 'cloud' },
					{ label: __( 'Chip list', 'xcodesol-page-builder' ), value: 'list' },
				] }
				onChange={ ( value ) => updateSetting( 'display', value ) }
			/>
			<TextControl
				type="number"
				label={ __( 'Tag limit (0 = all)', 'xcodesol-page-builder' ) }
				min={ 0 }
				max={ 100 }
				value={ String( block.settings.limit ?? 0 ) }
				onChange={ ( value ) => updateSetting( 'limit', Math.min( 100, Math.max( 0, parseInt( value, 10 ) || 0 ) ) ) }
			/>
			<SelectControl
				label={ __( 'Order by', 'xcodesol-page-builder' ) }
				value={ block.settings.orderby || 'count' }
				options={ [
					{ label: __( 'Product count', 'xcodesol-page-builder' ), value: 'count' },
					{ label: __( 'Name', 'xcodesol-page-builder' ), value: 'name' },
					{ label: __( 'Slug', 'xcodesol-page-builder' ), value: 'slug' },
				] }
				onChange={ ( value ) => updateSetting( 'orderby', value ) }
			/>
			<SelectControl
				label={ __( 'Order', 'xcodesol-page-builder' ) }
				value={ block.settings.order || 'desc' }
				options={ [
					{ label: __( 'Descending', 'xcodesol-page-builder' ), value: 'desc' },
					{ label: __( 'Ascending', 'xcodesol-page-builder' ), value: 'asc' },
				] }
				onChange={ ( value ) => updateSetting( 'order', value ) }
			/>
			<ToggleControl
				label={ __( 'Hide empty tags', 'xcodesol-page-builder' ) }
				checked={ block.settings.hide_empty !== false }
				onChange={ ( value ) => updateSetting( 'hide_empty', value ) }
			/>
		</div>
	);
}

function AttributesSettings( { block, updateSetting } ) {
	const known = ( window.xcosbBuilderConfig && Array.isArray( window.xcosbBuilderConfig.productAttributes ) )
		? window.xcosbBuilderConfig.productAttributes
		: [];
	const current = block.settings.attribute || '';
	const options = [
		{ label: __( '— Select an attribute —', 'xcodesol-page-builder' ), value: '' },
		...known.map( ( attr ) => ( { label: attr.label, value: attr.value } ) ),
	];

	if ( current && ! options.some( ( opt ) => opt.value === current ) ) {
		options.push( { label: current, value: current } );
	}

	return (
		<div className="xsb-block-settings">
			<TextControl
				label={ __( 'Title', 'xcodesol-page-builder' ) }
				help={ __( 'Leave empty to use the attribute name (e.g. “Color”). Type your own heading to replace it.', 'xcodesol-page-builder' ) }
				value={ block.settings.title || '' }
				onChange={ ( value ) => updateSetting( 'title', value ) }
			/>
			{ known.length > 0 ? (
				<SelectControl
					label={ __( 'Attribute', 'xcodesol-page-builder' ) }
					help={ __( 'The attribute terms shown (e.g. Color → Red, Blue…). Add attributes under Products → Attributes.', 'xcodesol-page-builder' ) }
					value={ current }
					options={ options }
					onChange={ ( value ) => updateSetting( 'attribute', value ) }
				/>
			) : (
				<TextControl
					label={ __( 'Attribute slug', 'xcodesol-page-builder' ) }
					help={ __( 'WooCommerce taxonomy slug, e.g. pa_color. Add attributes under Products → Attributes.', 'xcodesol-page-builder' ) }
					value={ current }
					placeholder="pa_color"
					onChange={ ( value ) => updateSetting( 'attribute', value ) }
				/>
			) }
			<ToggleControl
				label={ __( 'Hide empty terms', 'xcodesol-page-builder' ) }
				checked={ block.settings.hide_empty !== false }
				onChange={ ( value ) => updateSetting( 'hide_empty', value ) }
			/>
		</div>
	);
}

function SearchSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<TextControl
				label={ __( 'Placeholder', 'xcodesol-page-builder' ) }
				value={ block.settings.placeholder || '' }
				onChange={ ( value ) => updateSetting( 'placeholder', value ) }
			/>
			<TextControl
				label={ __( 'Button text', 'xcodesol-page-builder' ) }
				value={ block.settings.button_text || '' }
				onChange={ ( value ) => updateSetting( 'button_text', value ) }
			/>
			<ToggleControl
				label={ __( 'Show search button', 'xcodesol-page-builder' ) }
				checked={ block.settings.show_button !== false }
				onChange={ ( value ) => updateSetting( 'show_button', value ) }
			/>
		</div>
	);
}

let wysiwygCounter = 0;

/**
 * A WordPress default editor (TinyMCE with a Text/Quicktags tab) bound to a
 * React value. Used by the Text Widget block so content is edited the same
 * way as any normal WP widget/post.
 *
 * Falls back to a plain textarea when wp.editor is unavailable.
 *
 * @param {Object}   props
 * @param {string}   props.label   Field label.
 * @param {string}   props.help    Help text below the editor.
 * @param {string}   props.value   Current HTML content.
 * @param {Function} props.onChange New HTML content callback.
 */
function WysiwygEditor( { label, help, value = '', onChange } ) {
	const editorId = useRef( `xsb-text-editor-${ ++wysiwygCounter }` );
	const [ mounted, setMounted ] = useState( false );

	useEffect( () => {
		// Wait a frame so the textarea is in the DOM before init.
		setMounted( true );
	}, [] );

	useEffect( () => {
		if ( ! mounted ) {
			return undefined;
		}

		const wpEditor = window.wp && window.wp.editor;
		if ( ! wpEditor || typeof wpEditor.initialize !== 'function' ) {
			return undefined;
		}

		const id = editorId.current;
		if ( window.tinymce && window.tinymce.get( id ) ) {
			return undefined;
		}

		wpEditor.initialize( id, {
			tinymce: {
				wpautop: true,
				toolbar1: 'bold,italic,underline,strikethrough,|,link,unlink,|,bullist,numlist,blockquote,|,alignleft,aligncenter,alignright,|,undo,redo',
				toolbar2: '',
				height: 200,
				menubar: false,
				setup: ( editor ) => {
					editor.on( 'change input undo redo keyup', () => {
						const content = editor.getContent();
						if ( content !== value ) {
							onChange( content );
						}
					} );
				},
			},
			quicktags: true,
			mediaButtons: false,
		} );

		return () => {
			if ( wpEditor && typeof wpEditor.remove === 'function' ) {
				try {
					wpEditor.remove( id );
				} catch ( e ) {
					// Editor already torn down – ignore.
				}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ mounted ] );

	useEffect( () => {
		if ( ! mounted ) {
			return;
		}

		const id = editorId.current;
		const editor = window.tinymce ? window.tinymce.get( id ) : null;

		if ( editor && editor.getContent() !== value ) {
			editor.setContent( value || '' );
		} else if ( ! editor ) {
			const textarea = document.getElementById( id );
			if ( textarea && textarea.value !== value ) {
				textarea.value = value || '';
			}
		}
	}, [ value, mounted ] );

	return (
		<div className="xsb-inspector-field-block xsb-wysiwyg-field">
			<label className="xsb-field-label">{ label }</label>
			<textarea
				id={ editorId.current }
				rows={ 6 }
				defaultValue={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
			/>
			{ help && <p className="xsb-field-help">{ help }</p> }
		</div>
	);
}

function TextWidgetSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<TextControl
				label={ __( 'Title', 'xcodesol-page-builder' ) }
				value={ block.settings.title || '' }
				onChange={ ( value ) => updateSetting( 'title', value ) }
			/>
			<WysiwygEditor
				label={ __( 'Content', 'xcodesol-page-builder' ) }
				help={ __( 'Edited with the WordPress editor. Formatting and links are supported, like the classic Text widget.', 'xcodesol-page-builder' ) }
				value={ block.settings.content || '' }
				onChange={ ( value ) => updateSetting( 'content', value ) }
			/>
		</div>
	);
}

function PostTitleSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Post Title', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'HTML Tag', 'xcodesol-page-builder' ) }
					value={ block.settings.tag || 'h1' }
					options={ [
						{ label: 'H1', value: 'h1' },
						{ label: 'H2', value: 'h2' },
						{ label: 'H3', value: 'h3' },
						{ label: 'H4', value: 'h4' },
						{ label: 'H5', value: 'h5' },
						{ label: 'H6', value: 'h6' },
						{ label: 'div', value: 'div' },
						{ label: 'span', value: 'span' },
						{ label: 'p', value: 'p' },
					] }
					onChange={ ( value ) => updateSetting( 'tag', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
						{ label: __( 'Justified', 'xcodesol-page-builder' ), value: 'justify' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<ToggleControl
					label={ __( 'Link to Post', 'xcodesol-page-builder' ) }
					checked={ !! block.settings.link_to_post }
					onChange={ ( value ) => updateSetting( 'link_to_post', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function PostFeaturedImageSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Featured Image', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'Image Size', 'xcodesol-page-builder' ) }
					value={ block.settings.size || 'full' }
					options={ [
						{ label: __( 'Full', 'xcodesol-page-builder' ), value: 'full' },
						{ label: __( 'Large', 'xcodesol-page-builder' ), value: 'large' },
						{ label: __( 'Medium Large', 'xcodesol-page-builder' ), value: 'medium_large' },
						{ label: __( 'Medium', 'xcodesol-page-builder' ), value: 'medium' },
						{ label: __( 'Thumbnail', 'xcodesol-page-builder' ), value: 'thumbnail' },
					] }
					onChange={ ( value ) => updateSetting( 'size', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'center' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<TextControl
					label={ __( 'Border Radius (px)', 'xcodesol-page-builder' ) }
					type="number"
					value={ String( block.settings.border_radius ?? 8 ) }
					onChange={ ( value ) => updateSetting( 'border_radius', Number( value ) ) }
				/>
				<ToggleControl
					label={ __( 'Link to Post', 'xcodesol-page-builder' ) }
					checked={ !! block.settings.link_to_post }
					onChange={ ( value ) => updateSetting( 'link_to_post', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function PostContentSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Post Content', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || '' }
					options={ [
						{ label: __( 'Default', 'xcodesol-page-builder' ), value: '' },
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
						{ label: __( 'Justified', 'xcodesol-page-builder' ), value: 'justify' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<p className="xsb-inspector-help">
					{ __( 'Dynamically outputs the full post content using WordPress standard formatting and shortcode filters.', 'xcodesol-page-builder' ) }
				</p>
			</PanelBody>
		</div>
	);
}

function PostMetaSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Post Meta', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<ToggleControl
					label={ __( 'Show Author', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_author !== false }
					onChange={ ( value ) => updateSetting( 'show_author', value ) }
				/>
				<ToggleControl
					label={ __( 'Show Date', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_date !== false }
					onChange={ ( value ) => updateSetting( 'show_date', value ) }
				/>
				<ToggleControl
					label={ __( 'Show Comments Count', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_comments !== false }
					onChange={ ( value ) => updateSetting( 'show_comments', value ) }
				/>
				<ToggleControl
					label={ __( 'Show Categories', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_categories !== false }
					onChange={ ( value ) => updateSetting( 'show_categories', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function PostExcerptSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Post Excerpt', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
						{ label: __( 'Justified', 'xcodesol-page-builder' ), value: 'justify' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<TextControl
					label={ __( 'Font Size (px)', 'xcodesol-page-builder' ) }
					type="number"
					value={ String( block.settings.font_size || '16' ) }
					onChange={ ( value ) => updateSetting( 'font_size', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function PostAuthorBoxSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Author Box', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Border Radius (px)', 'xcodesol-page-builder' ) }
					type="number"
					value={ String( block.settings.border_radius ?? 8 ) }
					onChange={ ( value ) => updateSetting( 'border_radius', Number( value ) ) }
				/>
				<p className="xsb-inspector-help">
					{ __( 'Displays the author avatar, display name, biography, and link to their posts.', 'xcodesol-page-builder' ) }
				</p>
			</PanelBody>
		</div>
	);
}

function PostNavigationSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Post Navigation', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Previous Post Label', 'xcodesol-page-builder' ) }
					value={ block.settings.prev_label ?? __( 'Previous Post', 'xcodesol-page-builder' ) }
					onChange={ ( value ) => updateSetting( 'prev_label', value ) }
				/>
				<TextControl
					label={ __( 'Next Post Label', 'xcodesol-page-builder' ) }
					value={ block.settings.next_label ?? __( 'Next Post', 'xcodesol-page-builder' ) }
					onChange={ ( value ) => updateSetting( 'next_label', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function PostCommentsSettings() {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Post Comments', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<p className="xsb-inspector-help">
					{ __( 'Outputs standard WordPress comment templates, including list of comments and response form.', 'xcodesol-page-builder' ) }
				</p>
			</PanelBody>
		</div>
	);
}

function ArchiveTitleSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Archive Title', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'HTML Tag', 'xcodesol-page-builder' ) }
					value={ block.settings.tag || 'h1' }
					options={ [
						{ label: 'H1', value: 'h1' },
						{ label: 'H2', value: 'h2' },
						{ label: 'H3', value: 'h3' },
						{ label: 'H4', value: 'h4' },
						{ label: 'div', value: 'div' },
					] }
					onChange={ ( value ) => updateSetting( 'tag', value ) }
				/>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<ToggleControl
					label={ __( 'Include Context Prefix', 'xcodesol-page-builder' ) }
					help={ __( 'E.g. "Category: News" vs "News".', 'xcodesol-page-builder' ) }
					checked={ block.settings.include_context !== false }
					onChange={ ( value ) => updateSetting( 'include_context', value ) }
				/>
			</PanelBody>
		</div>
	);
}

function ArchiveDescriptionSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Archive Description', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'Alignment', 'xcodesol-page-builder' ) }
					value={ block.settings.align || 'left' }
					options={ [
						{ label: __( 'Left', 'xcodesol-page-builder' ), value: 'left' },
						{ label: __( 'Center', 'xcodesol-page-builder' ), value: 'center' },
						{ label: __( 'Right', 'xcodesol-page-builder' ), value: 'right' },
					] }
					onChange={ ( value ) => updateSetting( 'align', value ) }
				/>
				<p className="xsb-inspector-help">
					{ __( 'Renders category, tag, author, or term archive description.', 'xcodesol-page-builder' ) }
				</p>
			</PanelBody>
		</div>
	);
}

function ArchivePostsSettings( { block, updateSetting } ) {
	return (
		<div className="xsb-block-settings">
			<PanelBody title={ __( 'Archive Posts Grid', 'xcodesol-page-builder' ) } initialOpen={ true }>
				<SelectControl
					label={ __( 'Columns', 'xcodesol-page-builder' ) }
					value={ String( block.settings.columns || 3 ) }
					options={ [
						{ label: '1', value: '1' },
						{ label: '2', value: '2' },
						{ label: '3', value: '3' },
						{ label: '4', value: '4' },
						{ label: '5', value: '5' },
						{ label: '6', value: '6' },
					] }
					onChange={ ( value ) => updateSetting( 'columns', Number( value ) ) }
				/>
				<TextControl
					label={ __( 'Grid Gap (px)', 'xcodesol-page-builder' ) }
					type="number"
					value={ String( block.settings.gap ?? 24 ) }
					onChange={ ( value ) => updateSetting( 'gap', Number( value ) ) }
				/>
				<ToggleControl
					label={ __( 'Show Featured Image', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_image !== false }
					onChange={ ( value ) => updateSetting( 'show_image', value ) }
				/>
				<ToggleControl
					label={ __( 'Show Post Meta (Date / Author)', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_meta !== false }
					onChange={ ( value ) => updateSetting( 'show_meta', value ) }
				/>
				<ToggleControl
					label={ __( 'Show Excerpt', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_excerpt !== false }
					onChange={ ( value ) => updateSetting( 'show_excerpt', value ) }
				/>
				<ToggleControl
					label={ __( 'Show Read More Button', 'xcodesol-page-builder' ) }
					checked={ block.settings.show_button !== false }
					onChange={ ( value ) => updateSetting( 'show_button', value ) }
				/>
				{ block.settings.show_button !== false && (
					<TextControl
						label={ __( 'Button Text', 'xcodesol-page-builder' ) }
						value={ block.settings.button_text || __( 'Read More', 'xcodesol-page-builder' ) }
						onChange={ ( value ) => updateSetting( 'button_text', value ) }
					/>
				) }
			</PanelBody>
		</div>
	);
}

function BlockInspector( { block, index, updateSetting, device = 'desktop', onDeviceChange } ) {
	const { type } = block;
	const set = ( key, value ) => updateSetting( index, key, value );

	if ( type === 'xcopb/post-title' ) {
		return <PostTitleSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-featured-image' ) {
		return <PostFeaturedImageSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-content' ) {
		return <PostContentSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-meta' ) {
		return <PostMetaSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-excerpt' ) {
		return <PostExcerptSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-author-box' ) {
		return <PostAuthorBoxSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-navigation' ) {
		return <PostNavigationSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/post-comments' ) {
		return <PostCommentsSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/archive-title' ) {
		return <ArchiveTitleSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/archive-description' ) {
		return <ArchiveDescriptionSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/archive-posts' ) {
		return <ArchivePostsSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-heading' ) {
		return <HeadingSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-button' ) {
		return <ButtonSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-image' ) {
		return <ImageSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-shortcode' ) {
		return <ShortcodeSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-banner' || type === 'xcosb/gb-banner' ) {
		return <BannerSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-container' || type === 'xcopb/container' || type === 'xcosb/gb-container' ) {
		return <ContainerSettings block={ block } updateSetting={ set } device={ device } onDeviceChange={ onDeviceChange } />;
	}

	if ( type === 'xcopb/gb-divider' || type === 'xcosb/gb-divider' ) {
		return <DividerSettings />;
	}

	if ( type === 'xcopb/gb-text' || type === 'xcosb/gb-text' ) {
		return <TextSettings block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-text-widget' || type === 'xcosb/gb-text-widget' ) {
		return <TextWidgetSettings key={ index } block={ block } updateSetting={ set } />;
	}

	if ( type === 'xcopb/gb-breadcrumb' || type === 'xcosb/gb-breadcrumb' ) {
		return (
			<p className="xsb-inspector-none">
				{ __(
					'This block has no settings.',
					'xcodesol-page-builder'
				) }
			</p>
		);
	}

	if ( type === 'xcosb/sp-title' ) {
		return (
			<SelectControl
				label={ __( 'Tag', 'xcodesol-page-builder' ) }
				value={ block.settings.tag || 'h2' }
				options={ [
					{ label: 'H1', value: 'h1' },
					{ label: 'H2', value: 'h2' },
					{ label: 'H3', value: 'h3' },
					{ label: 'H4', value: 'h4' },
				] }
				onChange={ ( value ) => set( 'tag', value ) }
			/>
		);
	}

	if ( type === 'xcosb/sp-image' ) {
		return (
			<SelectControl
				label={ __( 'Image Size', 'xcodesol-page-builder' ) }
				value={ block.settings.size || 'woocommerce_thumbnail' }
				options={ [
					{
						label: __(
							'Thumbnail',
							'xcodesol-page-builder'
						),
						value: 'woocommerce_thumbnail',
					},
					{
						label: __( 'Large', 'xcodesol-page-builder' ),
						value: 'large',
					},
					{
						label: __( 'Full', 'xcodesol-page-builder' ),
						value: 'full',
					},
				] }
				onChange={ ( value ) => set( 'size', value ) }
			/>
		);
	}

	if ( type === 'xcosb/ar-title' ) {
		return (
			<SelectControl
				label={ __( 'Heading tag', 'xcodesol-page-builder' ) }
				value={ block.settings.tag || 'h1' }
				options={ [ 'h1', 'h2', 'h3', 'h4' ].map( ( tag ) => ( {
					label: tag.toUpperCase(),
					value: tag,
				} ) ) }
				onChange={ ( value ) => set( 'tag', value ) }
			/>
		);
	}

	if ( type === 'xcosb/ar-ordering' ) {
		return (
			<>
				<TextControl
					label={ __( 'Title', 'xcodesol-page-builder' ) }
					help={ __( 'Heading shown above the sort control. Leave empty to hide it.', 'xcodesol-page-builder' ) }
					value={ block.settings.title || '' }
					onChange={ ( value ) => set( 'title', value ) }
				/>
				<SelectControl
					label={ __( 'Display as', 'xcodesol-page-builder' ) }
					help={ __( 'How the sort options are shown to customers. Defaults to a dropdown.', 'xcodesol-page-builder' ) }
					value={ block.settings.display_type || 'dropdown' }
					options={ [
						{
							label: __( 'Dropdown', 'xcodesol-page-builder' ),
							value: 'dropdown',
						},
						{
							label: __( 'Radio buttons', 'xcodesol-page-builder' ),
							value: 'radio',
						},
					] }
					onChange={ ( value ) => set( 'display_type', value ) }
				/>
			</>
		);
	}

	if ( type === 'xcosb/ar-loop' ) {
		return (
			<>
				<DeviceField.DeviceSelectField
					settings={ block.settings }
					set={ set }
					device={ device }
					onDeviceChange={ onDeviceChange }
					baseKey="columns"
					label={ __( 'Columns', 'xcodesol-page-builder' ) }
					options={ COLUMN_OPTIONS }
					fallback={ 3 }
					parse={ Number }
				/>
				<p className="xsb-inspector-help">
					{ __(
						'The product card inside this grid is designed with a Product Card template — create one and build the card from card blocks (image, title, price, button, badges…). Different card templates can target the shop, category, tag or other archive pages via their WooCommerce Page Type setting and rules.',
						'xcodesol-page-builder'
					) }
				</p>
			</>
		);
	}

	if ( type === 'xcosb/cd-image' ) {
		return (
			<>
				<SelectControl
					label={ __( 'Image Size', 'xcodesol-page-builder' ) }
					value={ block.settings.size || 'woocommerce_thumbnail' }
					options={ [
						{ label: __( 'Thumbnail', 'xcodesol-page-builder' ), value: 'woocommerce_thumbnail' },
						{ label: __( 'Large', 'xcodesol-page-builder' ), value: 'large' },
						{ label: __( 'Full', 'xcodesol-page-builder' ), value: 'full' },
					] }
					onChange={ ( value ) => set( 'size', value ) }
				/>
				<ToggleControl
					label={ __( 'Link image to product', 'xcodesol-page-builder' ) }
					checked={ block.settings.link !== false }
					onChange={ ( value ) => set( 'link', value ) }
				/>
			</>
		);
	}

	if ( type === 'xcosb/cd-title' ) {
		return (
			<>
				<SelectControl
					label={ __( 'Tag', 'xcodesol-page-builder' ) }
					value={ block.settings.tag || 'h2' }
					options={ [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' ].map( ( tag ) => ( {
						label: tag.toUpperCase(),
						value: tag,
					} ) ) }
					onChange={ ( value ) => set( 'tag', value ) }
				/>
				<ToggleControl
					label={ __( 'Link title to product', 'xcodesol-page-builder' ) }
					checked={ block.settings.link !== false }
					onChange={ ( value ) => set( 'link', value ) }
				/>
			</>
		);
	}

	if ( type === 'xcosb/cd-badge' ) {
		return (
			<TextControl
				label={ __( 'Badge text', 'xcodesol-page-builder' ) }
				help={ __( 'Shown when the product is on sale.', 'xcodesol-page-builder' ) }
				value={ block.settings.text || '' }
				onChange={ ( value ) => set( 'text', value ) }
			/>
		);
	}

	if ( type === 'xcosb/cd-categories' || type === 'xcosb/cd-tags' ) {
		return (
			<>
				<TextControl
					label={ __( 'Max terms (0 = all)', 'xcodesol-page-builder' ) }
					type="number"
					min={ 0 }
					max={ 20 }
					value={ String( block.settings.limit ?? 0 ) }
					onChange={ ( value ) => set( 'limit', Number( value ) ) }
				/>
				<TextControl
					label={ __( 'Separator', 'xcodesol-page-builder' ) }
					value={ block.settings.separator || ', ' }
					onChange={ ( value ) => set( 'separator', value ) }
				/>
				<ToggleControl
					label={ __( 'Link terms to their pages', 'xcodesol-page-builder' ) }
					checked={ block.settings.link !== false }
					onChange={ ( value ) => set( 'link', value ) }
				/>
			</>
		);
	}

	if ( type === 'xcosb/cd-sku' ) {
		return (
			<TextControl
				label={ __( 'Prefix', 'xcodesol-page-builder' ) }
				value={ block.settings.prefix || '' }
				onChange={ ( value ) => set( 'prefix', value ) }
			/>
		);
	}

	if ( type === 'xcosb/cc-cart' || type === 'xcosb/cc-cart-items' || type === 'xcosb/cc-cart-totals' || type === 'xcosb/cc-checkout' || type === 'xcosb/cc-checkout-contact' || type === 'xcosb/cc-checkout-billing' || type === 'xcosb/cc-checkout-shipping' || type === 'xcosb/cc-checkout-notes' || type === 'xcosb/cc-checkout-totals' || type === 'xcosb/cc-checkout-payment' ) {
		let message;
		const isCheckoutPart = type.indexOf( 'xcosb/cc-checkout-' ) === 0;

		if ( type === 'xcosb/cc-cart' ) {
			message = __(
				'Renders the complete WooCommerce cart (table, totals, coupon and cross-sells). Place it inside containers to build your own cart layout — its box, width and spacing are styled from the widget itself.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-cart-items' ) {
			message = __(
				'Renders the cart item table, quantities, coupon field and “Update cart” button (the WooCommerce cart form). Pair it with Cart Totals inside a two-column container for a split cart layout.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-cart-totals' ) {
			message = __(
				'Renders the cart totals panel (subtotal, shipping, total) with the “Proceed to checkout” button. Pair it with Cart Items inside a two-column container for a split cart layout.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-checkout-contact' ) {
			message = __(
				'Renders the contact fields (email, phone). Must be inside a Checkout template — all checkout widgets share one form.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-checkout-billing' ) {
			message = __(
				'Renders the billing address fields (name, country, address, city, state, postcode). Must be inside a Checkout template.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-checkout-shipping' ) {
			message = __(
				'Renders the “Ship to a different address?” toggle and shipping fields. Must be inside a Checkout template.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-checkout-notes' ) {
			message = __(
				'Renders the order notes textarea (“Additional information”). Must be inside a Checkout template.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-checkout-totals' ) {
			message = __(
				'Renders the order review (products + totals). Must be inside a Checkout template.',
				'xcodesol-page-builder'
			);
		} else if ( type === 'xcosb/cc-checkout-payment' ) {
			message = __(
				'Renders the payment methods and the “Place order” button. Must be inside a Checkout template.',
				'xcodesol-page-builder'
			);
		} else {
			message = __(
				'Renders the complete WooCommerce checkout (billing/shipping form and order review). Place it inside containers to build your own checkout layout — its box, width and spacing are styled from the widget itself.',
				'xcodesol-page-builder'
			);
		}

		return (
			<>
				<p className="xsb-inspector-help">
					{ message }
				</p>
				{ isCheckoutPart && (
					<TextControl
						label={ __( 'Section heading (optional)', 'xcodesol-page-builder' ) }
						help={ __( 'Leave empty for no heading — headings are not included by default; add a Text widget instead if you want one.', 'xcodesol-page-builder' ) }
						value={ block.settings.title || '' }
						onChange={ ( value ) => set( 'title', value ) }
					/>
				) }
			</>
		);
	}

	return (
		<p className="xsb-inspector-none">
			{ __(
				'This block has no settings.',
				'xcodesol-page-builder'
			) }
		</p>
	);
}

export default BlockInspector;