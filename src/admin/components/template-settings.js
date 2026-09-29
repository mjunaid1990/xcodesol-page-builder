/**
 * Template settings (priority and options) for the builder.
 *
 * @package Xcodesol_Page_Builder
 */

import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import { IconInfo } from './icons';

export default function TemplateSettings( { priority, setPriority, settings, setSettings } ) {
	return (
		<div className="xsb-inspector-card">
			<div className="xsb-inspector-card__header">
				<h4 className="xsb-inspector-card__title">
					{ __( 'Execution & Priority', 'xcodesol-page-builder' ) }
				</h4>
				<span
					className="xsb-inline-help"
					title={ __( 'Higher priority templates are evaluated first. If multiple templates match the current page, the highest priority template wins.', 'xcodesol-page-builder' ) }
				>
					<IconInfo width={ 14 } height={ 14 } />
				</span>
			</div>

			<div className="xsb-inspector-field-group">
				<div className="xsb-field-row">
					<label className="xsb-field-label" htmlFor="xcopb-priority-input">
						{ __( 'Priority', 'xcodesol-page-builder' ) }
					</label>
					<div className="xsb-number-stepper">
						<button
							type="button"
							className="xsb-stepper-btn"
							onClick={ () => setPriority( Math.max( 1, ( parseInt( priority, 10 ) || 10 ) - 1 ) ) }
							aria-label="Decrease priority"
						>
							−
						</button>
						<input
							id="xcopb-priority-input"
							type="number"
							className="xsb-stepper-input"
							value={ priority }
							min={ 1 }
							onChange={ ( e ) => setPriority( parseInt( e.target.value, 10 ) || 1 ) }
						/>
						<button
							type="button"
							className="xsb-stepper-btn"
							onClick={ () => setPriority( ( parseInt( priority, 10 ) || 10 ) + 1 ) }
							aria-label="Increase priority"
						>
							+
						</button>
					</div>
				</div>
			</div>

			<div className="xsb-inspector-card__divider" />

			<div className="xsb-inspector-card__header">
				<h4 className="xsb-inspector-card__title">
					{ __( 'Device & Theme Overrides', 'xcodesol-page-builder' ) }
				</h4>
			</div>

			<div className="xsb-toggle-list">
				<div className="xsb-toggle-item">
					<ToggleControl
						label={
							<span className="xsb-toggle-label-wrap">
								<span>{ __( 'Disable on mobile devices', 'xcodesol-page-builder' ) }</span>
								<span className="xsb-inline-help" title={ __( 'Skips this builder template when visitors browse on smartphones (< 768px).', 'xcodesol-page-builder' ) }>
									<IconInfo width={ 13 } height={ 13 } />
								</span>
							</span>
						}
						checked={ !! settings.disable_on_mobile }
						onChange={ ( checked ) =>
							setSettings( { ...settings, disable_on_mobile: checked } )
						}
					/>
				</div>

				<div className="xsb-toggle-item">
					<ToggleControl
						label={
							<span className="xsb-toggle-label-wrap">
								<span>{ __( 'Respect active theme templates', 'xcodesol-page-builder' ) }</span>
								<span className="xsb-inline-help" title={ __( 'If your theme has a custom PHP template override, let theme take precedence.', 'xcodesol-page-builder' ) }>
									<IconInfo width={ 13 } height={ 13 } />
								</span>
							</span>
						}
						checked={ !! settings.respect_theme_templates }
						onChange={ ( checked ) =>
							setSettings( { ...settings, respect_theme_templates: checked } )
						}
					/>
				</div>
			</div>
		</div>
	);
}
