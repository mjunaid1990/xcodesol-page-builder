/**
 * Shared compact unit dropdown, styled like Elementor's px/% select:
 * a tiny unit label with a caret that opens the allowed units. One
 * component so every control (number, slider, gap, spacing, box model)
 * stays visually identical.
 *
 * @package Xcodesol_Page_Builder
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function UnitSelect( { units = [], value, onChange, label } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const wrapRef = useRef( null );

	const current = units.includes( value ) ? value : ( units[ 0 ] || 'px' );

	useEffect( () => {
		if ( ! isOpen ) {
			return undefined;
		}
		const onDocClick = ( e ) => {
			if ( wrapRef.current && ! wrapRef.current.contains( e.target ) ) {
				setIsOpen( false );
			}
		};
		const onKey = ( e ) => {
			if ( 'Escape' === e.key ) {
				setIsOpen( false );
			}
		};
		document.addEventListener( 'mousedown', onDocClick );
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'mousedown', onDocClick );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [ isOpen ] );

	if ( ! units || units.length < 2 ) {
		return units.length === 1 ? (
			<span className="xsb-unit-select is-static" aria-label={ label }>{ units[ 0 ] }</span>
		) : null;
	}

	return (
		<span className="xsb-unit-select" ref={ wrapRef }>
			<button
				type="button"
				className={ `xsb-unit-select__btn${ isOpen ? ' is-open' : '' }` }
				onClick={ () => setIsOpen( ( v ) => ! v ) }
				aria-haspopup="listbox"
				aria-expanded={ isOpen }
				aria-label={ label || __( 'Unit', 'xcodesol-page-builder' ) }
			>
				{ current }
				<svg className="xsb-unit-select__caret" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
					<path d="M1 2.5L4 5.5L7 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
				</svg>
			</button>
			{ isOpen && (
				<span className="xsb-unit-select__list" role="listbox" aria-label={ label || __( 'Unit', 'xcodesol-page-builder' ) }>
					{ units.map( ( u ) => (
						<button
							key={ u }
							type="button"
							role="option"
							aria-selected={ u === current }
							className={ `xsb-unit-select__option${ u === current ? ' is-active' : '' }` }
							onClick={ () => {
								onChange( u );
								setIsOpen( false );
							} }
						>
							{ u }
						</button>
					) ) }
				</span>
			) }
		</span>
	);
}
