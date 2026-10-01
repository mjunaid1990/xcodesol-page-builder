/** Shared WordPress CodeMirror CSS editor with snippets and CSS completion. */
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const CSS_WORDS = [
	'align-items', 'animation', 'background', 'background-color', 'background-image', 'background-position', 'background-size',
	'border', 'border-radius', 'box-shadow', 'color', 'display', 'filter', 'flex', 'flex-direction', 'font-family', 'font-size',
	'font-weight', 'gap', 'grid-template-columns', 'height', 'justify-content', 'letter-spacing', 'line-height', 'margin',
	'max-width', 'min-height', 'opacity', 'overflow', 'padding', 'position', 'text-align', 'text-decoration', 'text-shadow',
	'transform', 'transition', 'width', 'z-index',
];

function registerCssHints( CodeMirror ) {
	if ( ! CodeMirror || CodeMirror.__xcopbCssHints || typeof CodeMirror.registerHelper !== 'function' ) return;
	CodeMirror.registerHelper( 'hint', 'css', ( cm ) => {
		const cursor = cm.getCursor();
		const line = cm.getLine( cursor.line );
		const before = line.slice( 0, cursor.ch );
		const match = before.match( /[\w-]*$/ );
		const from = CodeMirror.Pos( cursor.line, cursor.ch - ( match ? match[ 0 ].length : 0 ) );
		const token = match ? match[ 0 ].toLowerCase() : '';
		const list = CSS_WORDS.filter( ( word ) => ! token || word.startsWith( token ) ).slice( 0, 12 );
		return { list, from, to: CodeMirror.Pos( cursor.line, cursor.ch ) };
	} );
	CodeMirror.__xcopbCssHints = true;
}

export default function CssEditor( { value = '', onChange, placeholder, rows = 8, label, compact = false } ) {
	const textareaRef = useRef( null );
	const editorRef = useRef( null );
	const changeRef = useRef( onChange );
	const [ snippet, setSnippet ] = useState( '' );
	const [ suggestions, setSuggestions ] = useState( [] );
	changeRef.current = onChange;

	useEffect( () => {
		const wp = window.wp;
		const settings = window.xcopbBuilderConfig?.cssEditorSettings;
		if ( ! textareaRef.current || ! wp?.codeEditor?.initialize || ! settings?.codemirror ) return undefined;
		const CodeMirror = window.CodeMirror || wp.CodeMirror;
		registerCssHints( CodeMirror );
		const editorSettings = {
			...settings,
			codemirror: {
				...( settings.codemirror || {} ), mode: 'css', lineNumbers: true, lineWrapping: true,
				indentUnit: 2, tabSize: 2, indentWithTabs: false, matchBrackets: true,
				autoCloseBrackets: true, extraKeys: { ...( settings.codemirror?.extraKeys || {} ), 'Ctrl-Space': ( cm ) => {
					const hint = CodeMirror?.hint?.css;
					if ( cm.showHint && hint ) cm.showHint( { hint, completeSingle: false } );
				} },
			},
		};
		const initialized = wp.codeEditor.initialize( textareaRef.current, editorSettings );
		const cm = initialized?.codemirror;
		if ( ! cm ) return undefined;
		editorRef.current = cm;
		if ( value && cm.getValue() !== value ) cm.setValue( value );
		cm.on( 'change', () => changeRef.current?.( cm.getValue() ) );
		cm.on( 'inputRead', ( editor ) => {
			const cursor = editor.getCursor();
			const token = editor.getTokenAt( cursor );
			const current = String( token.string || '' ).toLowerCase();
			const list = current ? CSS_WORDS.filter( ( word ) => word.startsWith( current ) ).slice( 0, 6 ) : [];
			setSuggestions( list );
			if ( editor.showHint && CodeMirror?.hint?.css ) editor.showHint( { hint: CodeMirror.hint.css, completeSingle: false } );
		} );
		cm.on( 'blur', () => setSuggestions( [] ) );
		return () => {
			cm.toTextArea?.();
			editorRef.current = null;
		};
	}, [] );

	useEffect( () => {
		const cm = editorRef.current;
		if ( cm && value !== cm.getValue() ) cm.setValue( value || '' );
	}, [ value ] );

	const insertSnippet = ( kind ) => {
		const cm = editorRef.current;
		const snippets = {
			base: 'selector {\n  color: #222222;\n}\n',
			hover: 'selector:hover {\n  opacity: 0.85;\n}\n',
			mobile: '@media (max-width: 767px) {\n  selector {\n    padding: 12px;\n  }\n}\n',
		};
		const text = snippets[ kind ];
		if ( ! text ) return;
		if ( cm ) {
			cm.replaceSelection( text );
			cm.focus();
		} else {
			const next = `${ value || '' }${ value ? '\n' : '' }${ text }`;
			onChange?.( next );
		}
		setSnippet( '' );
	};
	const applySuggestion = ( suggestion ) => {
		const cm = editorRef.current;
		if ( ! cm ) return;
		const cursor = cm.getCursor();
		const token = cm.getTokenAt( cursor );
		cm.replaceRange( suggestion, { line: cursor.line, ch: token.start }, { line: cursor.line, ch: token.end } );
		cm.focus();
		setSuggestions( [] );
	};

	return (
		<div className={ `xsb-css-editor${ compact ? ' is-compact' : '' }` }>
			{ label && <label className="xsb-control-label">{ label }</label> }
			<div className="xsb-css-editor__toolbar">
				<span>{ __( 'CSS', 'xcodesol-page-builder' ) }</span>
				<select aria-label={ __( 'Insert CSS starter', 'xcodesol-page-builder' ) } value={ snippet } onChange={ ( event ) => insertSnippet( event.target.value ) }>
					<option value="">{ __( 'Insert starter…', 'xcodesol-page-builder' ) }</option>
					<option value="base">{ __( 'Element styles', 'xcodesol-page-builder' ) }</option>
					<option value="hover">{ __( 'Hover styles', 'xcodesol-page-builder' ) }</option>
					<option value="mobile">{ __( 'Mobile styles', 'xcodesol-page-builder' ) }</option>
				</select>
				<kbd>Ctrl + Space</kbd>
			</div>
			<div className="xsb-css-editor__surface">
				<textarea ref={ textareaRef } rows={ rows } defaultValue={ value || '' } onChange={ ( event ) => onChange?.( event.target.value ) } placeholder={ placeholder || 'selector {\n  color: #222;\n}' } spellCheck="false" />
				{ suggestions.length > 0 && <div className="xsb-css-editor__suggestions" role="listbox">{ suggestions.map( ( suggestion ) => <button type="button" key={ suggestion } onMouseDown={ ( event ) => event.preventDefault() } onClick={ () => applySuggestion( suggestion ) }>{ suggestion }</button> ) }</div> }
			</div>
			<p className="xsb-css-editor__help">{ __( 'Use selector to target this element. Press Ctrl + Space for CSS suggestions.', 'xcodesol-page-builder' ) }</p>
		</div>
	);
}
