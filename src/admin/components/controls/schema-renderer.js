/**
 * Schema Renderer for Xcodesol Page Builder.
 * Renders sections and controls declared in any widget schema, using the lazy control registry.
 *
 * @package Xcodesol_Page_Builder
 */

import { renderControl } from './index';
import { orderPanelSections, panelControlConfig, panelSectionTitle } from '../../schemas/display-names';

/**
 * Checks whether a condition object is satisfied by the current values map.
 */
function checkCondition( condition, values ) {
	if ( ! condition || typeof condition !== 'object' ) {
		return true;
	}
	return Object.entries( condition ).every( ( [ key, expected ] ) => {
		const actual = values ? values[ key ] : undefined;
		if ( Array.isArray( expected ) ) {
			return expected.includes( actual );
		}
		if ( typeof expected === 'object' && expected !== null ) {
			return Object.entries( expected ).every( ( [ subK, subV ] ) => actual?.[ subK ] === subV );
		}
		return actual === expected;
	} );
}

export default function SchemaRenderer( {
	schema = {},
	values = {},
	onChange,
	device = 'desktop',
	state = 'normal',
	sectionId,
	tab,
} ) {
	const {
		sections = [],
		controls = [],
		manifest,
	} = schema;

	// Filter sections if tab or sectionId is provided
	const activeSections = orderPanelSections( sections.filter( ( sec ) => {
		if ( tab && sec.tab !== tab ) return false;
		if ( sectionId && sec.id !== sectionId ) return false;
		if ( sec.condition && ! checkCondition( sec.condition, values ) ) return false;
		return true;
	} ), tab );

	return (
		<div className="xsb-schema-renderer">
			{ activeSections.map( ( sec ) => {
				const sectionControls = controls.filter( ( ctrl ) => {
					if ( ctrl.section !== sec.id ) return false;
					if ( tab && ctrl.tab !== tab ) return false;
					if ( ctrl.condition && ! checkCondition( ctrl.condition, values ) ) return false;
					return true;
				} );

				if ( sectionControls.length === 0 ) {
					return null;
				}

				return (
					<div key={ sec.id } className="xsb-schema-section" id={ `xsb-sec-${ sec.id }` }>
						{ sec.title && (
							<div className="xsb-schema-section-title">
								<span>{ panelSectionTitle( sec ) }</span>
							</div>
						) }
						<div className="xsb-schema-section-controls">
							{ sectionControls.map( ( ctrl ) => {
								const val = values ? values[ ctrl.id ] : undefined;

								return (
									<div key={ ctrl.id } className="xsb-schema-control-item">
										{ renderControl(
											ctrl.type,
											{
											config: panelControlConfig( ctrl ),
												value: val,
												onChange: ( newVal ) => onChange( ctrl.id, newVal ),
												device,
												state,
											},
											manifest
										) }
									</div>
								);
							} ) }
						</div>
					</div>
				);
			} ) }
		</div>
	);
}
