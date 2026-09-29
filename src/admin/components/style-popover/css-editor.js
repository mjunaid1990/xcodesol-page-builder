/**
 * CssCodeField — a lightweight, dependency-free CSS editor used by the
 * Advanced category of the style popover.
 *
 * It layers three pieces over a single native <textarea>:
 *   • a line-number gutter,
 *   • a syntax-highlighted mirror that sits *under* the transparent-text
 *     textarea (the classic "highlight behind the caret" trick), and
 *   • the textarea itself, which keeps native selection, caret and undo.
 *
 * Because the popover is portaled into document.body but still lives inside
 * the canvas widget's React tree, synthetic keydown events would bubble up to
 * the widget's drag-and-drop activator (that is why Shift+Enter used to
 * "activate" the widget). Every key handler here stops propagation, and the
 * popover shell also guards keydown globally.
 *
 * @package WooCommerce_Template_Builder
 */

import { __, sprintf } from '@wordpress/i18n';
import { useState, useRef, useMemo, useCallback, useLayoutEffect } from '@wordpress/element';

const INDENT = '  ';

/* ---------------------------- diagnostics --------------------------- */

/**
 * Lightweight live CSS validator. Flags unambiguous structural mistakes
 * (stray closing brackets, unterminated strings/comments, unbalanced
 * blocks) — the things that can never be part of valid CSS — so typing
 * feedback never depends on a full CSS grammar.
 *
 * @param {string} css Raw CSS text.
 * @return {Array<{line:number, msg:string}>} 1-based line + message.
 */
export function cssDiagnostics( css ) {
	const errs = [];
	const seen = new Set();
	const push = ( line, msg ) => {
		const key = line + '|' + msg;
		if ( ! seen.has( key ) ) {
			seen.add( key );
			errs.push( { line, msg } );
		}
	};

	const opens = []; // { ch, line } of currently open { [ (.
	let strCh = null; // quote char when inside a string.
	let strStart = 0;
	let inComment = false;
	let commentStart = 0;

	let line = 1;
	let i = 0;
	const n = css.length;

	while ( i < n ) {
		const c = css[ i ];
		const next = css[ i + 1 ];

		if ( c === '\n' ) {
			// A raw line break inside a string is invalid CSS.
			if ( strCh ) {
				push( strStart, __( 'Unterminated string — close it with “' + strCh + '”', 'xcodesol-page-builder' ) );
				strCh = null;
			}
			line++;
			i++;
			continue;
		}
		if ( inComment ) {
			if ( c === '*' && next === '/' ) {
				inComment = false;
				i += 2;
			} else {
				i++;
			}
			continue;
		}
		if ( strCh ) {
			if ( c === '\\' ) {
				i += 2;
				continue;
			}
			if ( c === strCh ) {
				strCh = null;
			}
			i++;
			continue;
		}
		if ( c === '/' && next === '*' ) {
			inComment = true;
			commentStart = line;
			i += 2;
			continue;
		}
		if ( c === '"' || c === "'" ) {
			strCh = c;
			strStart = line;
			i++;
			continue;
		}
		if ( c === '{' || c === '[' || c === '(' ) {
			opens.push( { ch: c === '{' ? '}' : c === '[' ? ']' : ')', line } );
			i++;
			continue;
		}
		if ( c === '}' || c === ']' || c === ')' ) {
			const top = opens[ opens.length - 1 ];
			if ( top && top.ch === c ) {
				opens.pop();
			} else {
				push( line, __( 'Unexpected “' + c + '” — nothing open to close', 'xcodesol-page-builder' ) );
			}
			i++;
			continue;
		}
		i++;
	}

	if ( inComment ) {
		push( commentStart, __( 'Unterminated comment — add “*/”', 'xcodesol-page-builder' ) );
	}
	if ( strCh ) {
		push( strStart, __( 'Unterminated string — close it with “' + strCh + '”', 'xcodesol-page-builder' ) );
	}
	// Open blocks that were never closed.
	opens.slice( 0, 12 ).forEach( ( o ) => {
		push( o.line, __( 'Block opened here — missing “' + o.ch + '”', 'xcodesol-page-builder' ) );
	} );

	return errs;
}

/* ----------------------------- highlight ---------------------------- */

/**
 * Tokenise CSS into an HTML string with .tk-* spans. A small state machine
 * decides whether a word is a selector, a property or a value by looking at
 * brace depth and the surrounding punctuation — plenty for hand-written CSS.
 *
 * @param {string} css Raw CSS text.
 * @return {string} Highlighted HTML (safe: all raw text is HTML-escaped).
 */
function highlightCss( css ) {
	const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
	const esc = ( t ) => String( t ).replace( /[&<>]/g, ( m ) => ESC[ m ] );

	// Comment | string | at-rule | hex colour | number+unit | word | punct | ws | other.
	const RE =
		/(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|(-?(?:\d+\.?\d*|\.\d+)(?:[a-z%]+)?\b)|(-?[_a-zA-Z][\w-]*)|([{}();:,>+~.*#=])|(\s+)|(.)/g;

	let out = '';
	let match;
	let zone = 'sel'; // 'sel' = selector | 'prop' = expecting a property | 'val' = declaration value.

	while ( ( match = RE.exec( css ) ) !== null ) {
		const [ raw, com, str, at, hex, num, word, punct, ws ] = match;

		if ( com ) {
			out += '<span class="tk-com">' + esc( com ) + '</span>';
			continue;
		}
		if ( str ) {
			out += '<span class="tk-str">' + esc( str ) + '</span>';
			continue;
		}
		if ( at ) {
			// @media / @supports / @import… — keep the following rule context.
			out += '<span class="tk-at">' + esc( at ) + '</span>';
			zone = at === '@media' || at === '@supports' || at === '@container' ? 'sel' : zone;
			continue;
		}
		if ( ws ) {
			out += esc( ws );
			continue;
		}
		if ( punct ) {
			const p = raw;
			if ( p === '{' ) {
				zone = 'prop';
			} else if ( p === '}' ) {
				zone = 'sel';
			} else if ( p === ';' ) {
				zone = 'prop';
			} else if ( p === ':' ) {
				// A ':' after a property starts the value; inside a selector it is
				// a pseudo-class and must not flip the zone.
				if ( zone === 'prop' ) {
					zone = 'val';
				}
			} else if ( p === ',' ) {
				// Selector lists stay selectors, value lists stay values.
			} else if ( p === '(' ) {
				if ( zone === 'sel' ) {
					zone = 'sel'; // :not(…) / :is(…) inside selectors.
				}
			} else if ( p === ')' ) {
				if ( zone === 'sel' ) {
					zone = 'sel';
				}
			}
			out += '<span class="tk-punc">' + esc( p ) + '</span>';
			continue;
		}

		if ( word !== undefined ) {
			const nextNonWs = css.slice( RE.lastIndex ).replace( /^\s*/, '' )[ 0 ];
			const isProp = zone === 'prop' && nextNonWs === ':' && ! word.startsWith( '--' );
			let cls = 'tk-w';
			if ( zone === 'val' ) {
				cls = nextNonWs === '(' ? 'tk-fn' : 'tk-val';
			} else if ( isProp || word.startsWith( '--' ) ) {
				cls = 'tk-prop';
			} else {
				cls = 'tk-sel';
			}
			out += '<span class="' + cls + '">' + esc( word ) + '</span>';
			continue;
		}
		if ( hex !== undefined ) {
			out += zone === 'val' ? '<span class="tk-color">' + esc( hex ) + '</span>' : '<span class="tk-sel">' + esc( hex ) + '</span>';
			continue;
		}
		if ( num !== undefined ) {
			out += '<span class="tk-num">' + esc( num ) + '</span>';
			continue;
		}
		out += esc( raw );
	}

	return out;
}

/* ------------------------------ component --------------------------- */

/**
 * @param {Object}   props
 * @param {string}   props.value       Current CSS text.
 * @param {Function} props.onChange    (nextValue) => void.
 * @param {string}   props.placeholder Placeholder text.
 * @param {string}   props.label       Accessible label.
 * @param {number}   props.minHeight   Editor min height in px.
 */
export function CssCodeField( { value = '', onChange, placeholder, label, minHeight = 148 } ) {
	const taRef = useRef( null );
	const gutterRef = useRef( null );
	const mirrorRef = useRef( null );
	const [ vscroll, setVscroll ] = useState( false );

	const html = useMemo( () => highlightCss( value ), [ value ] );
	const errors = useMemo( () => cssDiagnostics( value ), [ value ] );
	const errorLines = useMemo( () => new Set( errors.map( ( e ) => e.line ) ), [ errors ] );
	const lineCount = value.split( '\n' ).length;
	const gutterHtml = useMemo( () => {
		const lines = [];
		for ( let i = 1; i <= lineCount; i++ ) {
			lines.push(
				errorLines.has( i )
					? '<span class="is-err" title="' + errors.filter( ( e ) => e.line === i ).map( ( e ) => e.msg ).join( ' · ' ).replace( /"/g, '&quot;' ) + '">' + i + '</span>'
					: String( i )
			);
		}
		return lines.join( '\n' );
	}, [ lineCount, errorLines, errors ] );

	/* Keep the mirror + gutter geometry identical to the textarea content
	   box so the highlight always lines up with the real text. */
	const syncGeometry = useCallback( () => {
		const ta = taRef.current;
		const gutter = gutterRef.current;
		const mirror = mirrorRef.current;
		if ( ! ta || ! gutter || ! mirror ) {
			return;
		}
		mirror.style.width = ta.clientWidth + 'px';
		mirror.style.height = ta.clientHeight + 'px';
		gutter.style.height = ta.clientHeight + 'px';
		mirror.scrollTop = ta.scrollTop;
		mirror.scrollLeft = ta.scrollLeft;
		gutter.scrollTop = ta.scrollTop;
		setVscroll( ta.scrollHeight > ta.clientHeight );
	}, [] );

	useLayoutEffect( () => {
		syncGeometry();
	}, [ syncGeometry, value ] );

	useLayoutEffect( () => {
		const ta = taRef.current;
		if ( ! ta || typeof ResizeObserver === 'undefined' ) {
			return undefined;
		}
		const ro = new ResizeObserver( () => syncGeometry() );
		ro.observe( ta );
		return () => ro.disconnect();
	}, [ syncGeometry ] );

	const onScroll = () => {
		const ta = taRef.current;
		const gutter = gutterRef.current;
		const mirror = mirrorRef.current;
		if ( ! ta || ! gutter || ! mirror ) {
			return;
		}
		mirror.scrollTop = ta.scrollTop;
		mirror.scrollLeft = ta.scrollLeft;
		gutter.scrollTop = ta.scrollTop;
		setVscroll( ta.scrollHeight > ta.clientHeight );
	};

	/* Insert text at the caret directly in the DOM (keeps the caret exactly
	   where we want it) and then push the new value through onChange. */
	const insertAtCaret = ( text ) => {
		const ta = taRef.current;
		if ( ! ta ) {
			return;
		}
		const s = ta.selectionStart;
		const e = ta.selectionEnd;
		const next = ta.value.slice( 0, s ) + text + ta.value.slice( e );
		ta.value = next;
		const caret = s + text.length;
		ta.selectionStart = ta.selectionEnd = caret;
		onChange( next );
	};

	const onKeyDown = ( event ) => {
		// Never let Enter / Space / shortcuts bubble to the canvas widget.
		event.stopPropagation();

		if ( event.key === 'Tab' ) {
			event.preventDefault();
			if ( event.shiftKey ) {
				dedentLine();
			} else {
				insertAtCaret( INDENT );
			}
			return;
		}

		if ( event.key === 'Enter' && ! event.shiftKey ) {
			// Code-editor nicety: keep the previous line's indentation.
			event.preventDefault();
			const ta = taRef.current;
			const s = ta.selectionStart;
			const v = ta.value;
			const lineStart = v.lastIndexOf( '\n', s - 1 ) + 1;
			const indent = /^[ \t]*/.exec( v.slice( lineStart, s ) )[ 0 ];
			insertAtCaret( '\n' + indent );
		}
		// Shift+Enter (and plain Enter in a lone textarea) falls through to
		// the browser's default line break.
	};

	const dedentLine = () => {
		const ta = taRef.current;
		if ( ! ta ) {
			return;
		}
		const s = ta.selectionStart;
		const v = ta.value;
		const lineStart = v.lastIndexOf( '\n', s - 1 ) + 1;
		const lineEnd = v.indexOf( '\n', s );
		const end = lineEnd === -1 ? v.length : lineEnd;
		const before = v.slice( 0, lineStart );
		const line = v.slice( lineStart, end );
		const after = v.slice( end );
		const remove = Math.min( 2, line.length - line.replace( /^ */, '' ).length );
		const next = before + line.slice( remove ) + after;
		ta.value = next;
		const caret = Math.max( lineStart, s - remove );
		ta.selectionStart = ta.selectionEnd = caret;
		onChange( next );
	};

	const visibleErrors = errors.slice( 0, 3 );
	const moreCount = errors.length - visibleErrors.length;

	return (
		<>
			<div className={ `xsb-css-editor${ vscroll ? ' has-vscroll' : '' }` } style={ { minHeight } }>
				<div className="xsb-css-editor__gutter" ref={ gutterRef } aria-hidden="true">
					<pre dangerouslySetInnerHTML={ { __html: gutterHtml } } />
				</div>
				<div className="xsb-css-editor__mirror" ref={ mirrorRef } aria-hidden="true">
					<pre dangerouslySetInnerHTML={ { __html: html } } />
				</div>
				<textarea
					ref={ taRef }
					className="xsb-css-editor__input"
					style={ { minHeight } }
					value={ value }
					placeholder={ placeholder }
					aria-label={ label }
					aria-describedby={ errors.length ? 'xsb-css-errors' : undefined }
					spellCheck={ false }
					autoCapitalize="off"
					autoCorrect="off"
					autoComplete="off"
					wrap="off"
					rows={ 2 }
					onKeyDown={ onKeyDown }
					onScroll={ onScroll }
					onChange={ ( e ) => onChange( e.target.value.replace( /\t/g, INDENT ) ) }
				/>
				<span className="screen-reader-text">{ __( 'CSS code editor — Tab indents, Shift+Tab outdents, Enter auto-indents.', 'xcodesol-page-builder' ) }</span>
			</div>
			{ errors.length > 0 && (
				<div className="xsb-css-errors" id="xsb-css-errors" role="status" aria-live="polite">
					<span className="xsb-css-errors__badge" aria-hidden="true">
						{ sprintf( /* translators: %d: number of CSS problems. */ __( '%d errors', 'xcodesol-page-builder' ), errors.length ) }
					</span>
					<ul className="xsb-css-errors__list">
						{ visibleErrors.map( ( e, idx ) => (
							<li key={ idx }>
								{ sprintf( /* translators: %1$d: line number, %2$s: message. */ __( 'Line %1$d: %2$s', 'xcodesol-page-builder' ), e.line, e.msg ) }
							</li>
						) ) }
						{ moreCount > 0 && <li>{ sprintf( /* translators: %d: additional problems. */ __( '+%d more', 'xcodesol-page-builder' ), moreCount ) }</li> }
					</ul>
				</div>
			) }
		</>
	);
}
