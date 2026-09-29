/**
 * Visual Condition Builder for Template Display Rules.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import { IconPlus, IconTrash, IconInfo } from './icons';

function defaultsFor( type ) {
	if ( type === 'page' ) {
		return { page: 'shop', operator: 'is' };
	}
	if ( type === 'taxonomy' ) {
		return { taxonomy: 'product_cat', operator: 'in', term_ids: [] };
	}
	if ( type === 'product_ids' ) {
		return { operator: 'in', values: [] };
	}
	if ( type === 'sale' ) {
		return { operator: 'is', value: false };
	}
	return {};
}

function VisualRuleItem( { rule, index, isLast, onChange, onRemove } ) {
	function updateField( field, value ) {
		onChange( index, { ...rule, [ field ]: value } );
	}

	return (
		<div className="xsb-condition-card">
			<div className="xsb-condition-card__top">
				<div className="xsb-condition-badge xsb-condition-badge--if">
					{ index === 0 ? __( 'IF', 'xcodesol-page-builder' ) : __( 'AND', 'xcodesol-page-builder' ) }
				</div>

				<select
					className="xsb-chip-select xsb-chip-select--type"
					value={ rule.type || 'taxonomy' }
					onChange={ ( e ) => {
						const nextType = e.target.value;
						onChange( index, { type: nextType, operator: rule.operator || 'in', ...defaultsFor( nextType ) } );
					} }
				>
					<option value="page">{ __( 'Page / Screen', 'xcodesol-page-builder' ) }</option>
					<option value="taxonomy">{ __( 'Taxonomy Term', 'xcodesol-page-builder' ) }</option>
					<option value="product_ids">{ __( 'Specific IDs', 'xcodesol-page-builder' ) }</option>
					<option value="sale">{ __( 'On Sale State', 'xcodesol-page-builder' ) }</option>
				</select>

				<button
					type="button"
					className="xsb-condition-delete-btn"
					onClick={ () => onRemove( index ) }
					title={ __( 'Remove condition', 'xcodesol-page-builder' ) }
				>
					<IconTrash width={ 13 } height={ 13 } />
				</button>
			</div>

			<div className="xsb-condition-card__row">
				{ rule.type === 'page' && (
					<>
						<select
							className="xsb-chip-select"
							value={ rule.operator || 'is' }
							onChange={ ( e ) => updateField( 'operator', e.target.value ) }
						>
							<option value="is">{ __( 'is', 'xcodesol-page-builder' ) }</option>
							<option value="is_not">{ __( 'is not', 'xcodesol-page-builder' ) }</option>
						</select>

						<select
							className="xsb-chip-select xsb-chip-select--target"
							value={ rule.page || 'shop' }
							onChange={ ( e ) => updateField( 'page', e.target.value ) }
						>
							<option value="shop">{ __( 'Shop page', 'xcodesol-page-builder' ) }</option>
							<option value="product_category">{ __( 'Product category pages', 'xcodesol-page-builder' ) }</option>
							<option value="product_tag">{ __( 'Product tag pages', 'xcodesol-page-builder' ) }</option>
							<option value="product_archive">{ __( 'Other product archives', 'xcodesol-page-builder' ) }</option>
						</select>
					</>
				) }

				{ rule.type === 'taxonomy' && (
					<>
						<select
							className="xsb-chip-select"
							value={ rule.taxonomy || 'product_cat' }
							onChange={ ( e ) => updateField( 'taxonomy', e.target.value ) }
						>
							<option value="product_cat">{ __( 'Category', 'xcodesol-page-builder' ) }</option>
							<option value="product_tag">{ __( 'Tag', 'xcodesol-page-builder' ) }</option>
						</select>

						<select
							className="xsb-chip-select"
							value={ rule.operator || 'in' }
							onChange={ ( e ) => updateField( 'operator', e.target.value ) }
						>
							<option value="in">{ __( 'in', 'xcodesol-page-builder' ) }</option>
							<option value="not_in">{ __( 'not in', 'xcodesol-page-builder' ) }</option>
						</select>

						<input
							type="text"
							className="xsb-chip-input"
							placeholder={ __( 'IDs (e.g. 12, 18)', 'xcodesol-page-builder' ) }
							value={ Array.isArray( rule.term_ids ) ? rule.term_ids.join( ',' ) : '' }
							onChange={ ( e ) => {
								const val = e.target.value;
								updateField(
									'term_ids',
									val
										.split( ',' )
										.map( ( id ) => parseInt( id.trim(), 10 ) )
										.filter( ( id ) => ! Number.isNaN( id ) )
								);
							} }
						/>
					</>
				) }

				{ rule.type === 'product_ids' && (
					<>
						<select
							className="xsb-chip-select"
							value={ rule.operator || 'in' }
							onChange={ ( e ) => updateField( 'operator', e.target.value ) }
						>
							<option value="in">{ __( 'in', 'xcodesol-page-builder' ) }</option>
							<option value="not_in">{ __( 'not in', 'xcodesol-page-builder' ) }</option>
						</select>

						<input
							type="text"
							className="xsb-chip-input"
							placeholder={ __( 'Post IDs (comma separated)', 'xcodesol-page-builder' ) }
							value={ Array.isArray( rule.values ) ? rule.values.join( ',' ) : '' }
							onChange={ ( e ) => {
								const val = e.target.value;
								updateField(
									'values',
									val
										.split( ',' )
										.map( ( id ) => parseInt( id.trim(), 10 ) )
										.filter( ( id ) => ! Number.isNaN( id ) )
								);
							} }
						/>
					</>
				) }

				{ rule.type === 'sale' && (
					<select
						className="xsb-chip-select xsb-chip-select--target"
						value={ rule.value ? 'yes' : 'no' }
						onChange={ ( e ) => updateField( 'value', e.target.value === 'yes' ) }
					>
						<option value="yes">{ __( 'is On Sale', 'xcodesol-page-builder' ) }</option>
						<option value="no">{ __( 'is Not on sale', 'xcodesol-page-builder' ) }</option>
					</select>
				) }
			</div>
		</div>
	);
}

export default function ConditionsEditor( { conditions, setConditions, viewType } ) {
	const mode = conditions.mode || 'include';
	const rules = Array.isArray( conditions.rules ) ? conditions.rules : [];

	function setMode( nextMode ) {
		setConditions( { ...conditions, mode: nextMode } );
	}

	function addRule() {
		setConditions( {
			...conditions,
			rules: [ ...rules, { type: 'taxonomy', operator: 'in', term_ids: [] } ],
		} );
	}

	function updateRule( index, updatedRule ) {
		const next = [ ...rules ];
		next[ index ] = updatedRule;
		setConditions( { ...conditions, rules: next } );
	}

	function removeRule( index ) {
		const next = [ ...rules ];
		next.splice( index, 1 );
		setConditions( { ...conditions, rules: next } );
	}

	return (
		<div className="xsb-inspector-card">
			<div className="xsb-inspector-card__header">
				<h4 className="xsb-inspector-card__title">
					{ __( 'Display Conditions', 'xcodesol-page-builder' ) }
				</h4>
				<span
					className="xsb-inline-help"
					title={ __( 'Control exactly where this template applies across your site. Leave empty to apply globally to all matching pages.', 'xcodesol-page-builder' ) }
				>
					<IconInfo width={ 14 } height={ 14 } />
				</span>
			</div>

			<div className="xsb-segmented-control" role="radiogroup" aria-label={ __( 'Condition Mode', 'xcodesol-page-builder' ) }>
				<button
					type="button"
					role="radio"
					aria-checked={ mode === 'include' }
					className={ `xsb-segmented-btn${ mode === 'include' ? ' is-active' : '' }` }
					onClick={ () => setMode( 'include' ) }
				>
					{ __( 'Include (Apply when matches)', 'xcodesol-page-builder' ) }
				</button>
				<button
					type="button"
					role="radio"
					aria-checked={ mode === 'exclude' }
					className={ `xsb-segmented-btn${ mode === 'exclude' ? ' is-active' : '' }` }
					onClick={ () => setMode( 'exclude' ) }
				>
					{ __( 'Exclude (Invert match)', 'xcodesol-page-builder' ) }
				</button>
			</div>

			<div className="xsb-conditions-list">
				{ rules.length === 0 ? (
					<div className="xsb-conditions-empty">
						<p>{ __( 'No conditions set — this template applies everywhere in its view type.', 'xcodesol-page-builder' ) }</p>
					</div>
				) : (
					rules.map( ( rule, index ) => (
						<VisualRuleItem
							key={ index }
							rule={ rule }
							index={ index }
							isLast={ index === rules.length - 1 }
							onChange={ updateRule }
							onRemove={ removeRule }
						/>
					) )
				) }
			</div>

			<button
				type="button"
				className="xsb-btn xsb-btn--secondary xsb-btn--add-condition"
				onClick={ addRule }
			>
				<IconPlus width={ 14 } height={ 14 } />
				<span>{ __( 'Add Condition', 'xcodesol-page-builder' ) }</span>
			</button>
		</div>
	);
}
