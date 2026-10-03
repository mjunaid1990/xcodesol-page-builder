<?php
/**
 * Built-in pre-made template presets for Xcodesol Page Builder.
 *
 * Elementor-style page and section layouts using the core page builder widgets:
 * Container, Heading, Text, Image, Button, Banner, Divider, Shortcode, Breadcrumb.
 *
 * @package Xcodesol_Page_Builder
 */

defined( 'ABSPATH' ) || exit;

return array(
	'landing-page' => array(
		'slug'        => 'landing-page',
		'title'       => __( 'Modern Landing Page', 'xcodesol-page-builder' ),
		'family'      => 'modern',
		'description' => __( 'Full landing page with high-converting hero, 3-column features, media showcase, and shortcode area.', 'xcodesol-page-builder' ),
		'view_type'   => 'page',
		'structure'   => 'landing-page',
		'layout'      => array(
			array(
				'type'     => 'xcopb/gb-banner',
				'settings' => array(
					'title'          => __( 'Build Stunning Pages Effortlessly', 'xcodesol-page-builder' ),
					'subtitle'       => __( 'A fast, flexible, drag-and-drop page builder for WordPress. Create beautiful responsive websites in minutes.', 'xcodesol-page-builder' ),
					'button_text'    => __( 'Get Started Today', 'xcodesol-page-builder' ),
					'link'           => '#',
					'align'          => 'center',
					'bg_type'        => 'gradient',
					'bg_color'       => '#1e293b',
					'gradient_color_a' => '#0f172a',
					'gradient_color_b' => '#3b82f6',
					'gradient_angle' => 135,
					'min_height'     => 520,
					'padding_top'    => 100,
					'padding_bottom' => 100,
					'title_color'    => '#ffffff',
					'subtitle_color' => '#e2e8f0',
					'button_text_color' => '#ffffff',
					'button_border_color' => '#60a5fa',
				),
			),
			array(
				'type'     => 'xcopb/gb-container',
				'settings' => array(
					'columns'        => 3,
					'column_widths'  => array( 4, 4, 4 ),
					'gap'            => 28,
					'padding'        => 48,
					'align'          => 'stretch',
					'border_radius'  => 0,
					'background'     => '#f8fafc',
				),
				'inner'    => array(
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title'       => __( 'Lightning Fast', 'xcodesol-page-builder' ),
								'tag'         => 'h3',
								'color'       => '#0f172a',
								'font_size'   => 22,
								'font_weight' => '700',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content'   => __( 'Engineered for maximum speed and zero bloat. Your pages load instantly on every device.', 'xcodesol-page-builder' ),
								'color'     => '#64748b',
								'font_size' => 15,
							),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array(
								'text'     => __( 'Learn More', 'xcodesol-page-builder' ),
								'link'     => '#',
								'size'     => 'sm',
								'bg_color' => '#3b82f6',
							),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title'       => __( 'Responsive Design', 'xcodesol-page-builder' ),
								'tag'         => 'h3',
								'color'       => '#0f172a',
								'font_size'   => 22,
								'font_weight' => '700',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content'   => __( 'Pixel-perfect responsiveness across desktop, tablet, and mobile with custom breakpoints.', 'xcodesol-page-builder' ),
								'color'     => '#64748b',
								'font_size' => 15,
							),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array(
								'text'     => __( 'View Features', 'xcodesol-page-builder' ),
								'link'     => '#',
								'size'     => 'sm',
								'bg_color' => '#3b82f6',
							),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title'       => __( 'Easy Customization', 'xcodesol-page-builder' ),
								'tag'         => 'h3',
								'color'       => '#0f172a',
								'font_size'   => 22,
								'font_weight' => '700',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content'   => __( 'Intuitive visual controls for colors, typography, spacing, shadows, and animations.', 'xcodesol-page-builder' ),
								'color'     => '#64748b',
								'font_size' => 15,
							),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array(
								'text'     => __( 'Get Started', 'xcodesol-page-builder' ),
								'link'     => '#',
								'size'     => 'sm',
								'bg_color' => '#3b82f6',
							),
						),
					),
				),
			),
			array(
				'type'     => 'xcopb/gb-divider',
				'settings' => array(
					'height' => 1,
					'color'  => '#e2e8f0',
					'margin' => 40,
				),
			),
			array(
				'type'     => 'xcopb/gb-container',
				'settings' => array(
					'columns'       => 2,
					'column_widths' => array( 6, 6 ),
					'gap'           => 40,
					'padding'       => 32,
					'align'         => 'center',
				),
				'inner'    => array(
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title'       => __( 'Everything You Need to Build Modern Sites', 'xcodesol-page-builder' ),
								'tag'         => 'h2',
								'color'       => '#0f172a',
								'font_size'   => 32,
								'font_weight' => '700',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content'   => __( 'Design headers, heroes, feature sections, and custom page layouts with flexible multi-column grids and live styling feedback.', 'xcodesol-page-builder' ),
								'color'     => '#475569',
								'font_size' => 16,
							),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array(
								'text'     => __( 'Explore Showcase', 'xcodesol-page-builder' ),
								'link'     => '#',
								'size'     => 'md',
								'bg_color' => '#0f172a',
							),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-image',
							'settings' => array(
								'alt'           => 'Showcase',
								'border_radius' => 0,
								'max_width'     => '100%',
							),
						),
					),
				),
			),
			array(
				'type'     => 'xcopb/gb-shortcode',
				'settings' => array(
					'title'     => '',
					'shortcode' => '',
				),
			),
		),
		'zones'       => array( 'hero', 'features', 'divider', 'showcase', 'embed' ),
		'settings'    => array(
			'disable_on_mobile'       => false,
			'respect_theme_templates' => true,
		),
	),

	'about-page' => array(
		'slug'        => 'about-page',
		'title'       => __( 'About Us Page', 'xcodesol-page-builder' ),
		'family'      => 'modern',
		'description' => __( 'Clean 2-column About page layout with company overview and team intro.', 'xcodesol-page-builder' ),
		'view_type'   => 'page',
		'structure'   => 'split-layout',
		'layout'      => array(
			array(
				'type'     => 'xcopb/gb-banner',
				'settings' => array(
					'title'       => __( 'About Our Mission', 'xcodesol-page-builder' ),
					'subtitle'    => __( 'We craft exceptional digital experiences designed to empower creators worldwide.', 'xcodesol-page-builder' ),
					'button_text' => '',
					'align'       => 'center',
					'bg_type'     => 'color',
					'bg_color'    => '#1e293b',
					'min_height'  => 360,
					'padding_top' => 80,
					'padding_bottom' => 80,
				),
			),
			array(
				'type'     => 'xcopb/gb-container',
				'settings' => array(
					'columns'       => 2,
					'column_widths' => array( 6, 6 ),
					'gap'           => 40,
					'padding'       => 48,
				),
				'inner'    => array(
					array(
						array(
							'type'     => 'xcopb/gb-image',
							'settings' => array(
								'border_radius' => 0,
							),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title'       => __( 'Who We Are', 'xcodesol-page-builder' ),
								'tag'         => 'h2',
								'color'       => '#0f172a',
								'font_size'   => 28,
								'font_weight' => '700',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content' => __( 'We are a dedicated team passionate about crafting intuitive tools that simplify web development for everyone.', 'xcodesol-page-builder' ),
								'color'   => '#475569',
							),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array(
								'text'     => __( 'Contact Us', 'xcodesol-page-builder' ),
								'link'     => '#',
								'bg_color' => '#2563eb',
							),
						),
					),
				),
			),
		),
		'zones'       => array( 'header', 'content' ),
		'settings'    => array(
			'disable_on_mobile'       => false,
			'respect_theme_templates' => true,
		),
	),

	'contact-page' => array(
		'slug'        => 'contact-page',
		'title'       => __( 'Contact Page', 'xcodesol-page-builder' ),
		'family'      => 'modern',
		'description' => __( 'Contact page with banner, information panel, and shortcode area for forms.', 'xcodesol-page-builder' ),
		'view_type'   => 'page',
		'structure'   => 'hero-content',
		'layout'      => array(
			array(
				'type'     => 'xcopb/gb-banner',
				'settings' => array(
					'title'       => __( 'Get in Touch', 'xcodesol-page-builder' ),
					'subtitle'    => __( 'Have questions or ideas? We would love to hear from you.', 'xcodesol-page-builder' ),
					'button_text' => '',
					'align'       => 'center',
					'bg_color'    => '#0f172a',
					'min_height'  => 320,
				),
			),
			array(
				'type'     => 'xcopb/gb-container',
				'settings' => array(
					'columns'       => 2,
					'column_widths' => array( 5, 7 ),
					'gap'           => 40,
					'padding'       => 48,
				),
				'inner'    => array(
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title' => __( 'Contact Information', 'xcodesol-page-builder' ),
								'tag'   => 'h3',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content' => __( 'Email: support@example.com<br>Phone: +1 (555) 123-4567<br>Hours: Mon - Fri, 9am - 6pm', 'xcodesol-page-builder' ),
							),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-shortcode',
							'settings' => array(
								'title'     => __( 'Send Us a Message', 'xcodesol-page-builder' ),
								'shortcode' => '',
							),
						),
					),
				),
			),
		),
		'zones'       => array( 'header', 'form_section' ),
		'settings'    => array(
			'disable_on_mobile'       => false,
			'respect_theme_templates' => true,
		),
	),

	'hero-section' => array(
		'slug'        => 'hero-section',
		'title'       => __( 'Hero Callout Section', 'xcodesol-page-builder' ),
		'family'      => 'sections',
		'description' => __( 'Standout hero section block ready to embed in any page or template.', 'xcodesol-page-builder' ),
		'view_type'   => 'section',
		'structure'   => 'hero-content',
		'layout'      => array(
			array(
				'type'     => 'xcopb/gb-banner',
				'settings' => array(
					'title'          => __( 'Designed for Creators', 'xcodesol-page-builder' ),
					'subtitle'       => __( 'Take complete visual control over your website with effortless drag & drop editing.', 'xcodesol-page-builder' ),
					'button_text'    => __( 'Discover More', 'xcodesol-page-builder' ),
					'align'          => 'center',
					'bg_color'       => '#2563eb',
					'min_height'     => 440,
					'padding_top'    => 80,
					'padding_bottom' => 80,
				),
			),
		),
		'zones'       => array( 'hero' ),
		'settings'    => array(
			'disable_on_mobile'       => false,
			'respect_theme_templates' => true,
		),
	),

	'features-section' => array(
		'slug'        => 'features-section',
		'title'       => __( 'Features Grid Section', 'xcodesol-page-builder' ),
		'family'      => 'sections',
		'description' => __( 'Three-column feature grid with headings, descriptions, and CTA links.', 'xcodesol-page-builder' ),
		'view_type'   => 'section',
		'structure'   => 'three-columns',
		'layout'      => array(
			array(
				'type'     => 'xcopb/gb-container',
				'settings' => array(
					'columns'       => 3,
					'column_widths' => array( 4, 4, 4 ),
					'gap'           => 24,
					'padding'       => 40,
				),
				'inner'    => array(
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array( 'title' => __( 'Clean Code', 'xcodesol-page-builder' ), 'tag' => 'h3' ),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array( 'content' => __( 'Standards-compliant, highly optimized markup.', 'xcodesol-page-builder' ) ),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array( 'text' => __( 'Read More', 'xcodesol-page-builder' ), 'size' => 'sm' ),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array( 'title' => __( 'Full Flexibility', 'xcodesol-page-builder' ), 'tag' => 'h3' ),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array( 'content' => __( 'Custom columns, responsive margins, and colors.', 'xcodesol-page-builder' ) ),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array( 'text' => __( 'Read More', 'xcodesol-page-builder' ), 'size' => 'sm' ),
						),
					),
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array( 'title' => __( 'Shortcode Ready', 'xcodesol-page-builder' ), 'tag' => 'h3' ),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array( 'content' => __( 'Embed templates anywhere with [xcodesol_page_builder id="..."]', 'xcodesol-page-builder' ) ),
						),
						array(
							'type'     => 'xcopb/gb-button',
							'settings' => array( 'text' => __( 'Read More', 'xcodesol-page-builder' ), 'size' => 'sm' ),
						),
					),
				),
			),
		),
		'zones'       => array( 'features_grid' ),
		'settings'    => array(
			'disable_on_mobile'       => false,
			'respect_theme_templates' => true,
		),
	),

	'blank-page' => array(
		'slug'        => 'blank-page',
		'title'       => __( 'Blank Canvas', 'xcodesol-page-builder' ),
		'family'      => 'starter',
		'description' => __( 'A completely blank canvas ready for custom sections and widgets.', 'xcodesol-page-builder' ),
		'view_type'   => 'page',
		'structure'   => 'blank',
		'layout'      => array(
			array(
				'type'     => 'xcopb/gb-container',
				'settings' => array(
					'columns'       => 1,
					'column_widths' => array( 12 ),
					'padding'       => 40,
				),
				'inner'    => array(
					array(
						array(
							'type'     => 'xcopb/gb-heading',
							'settings' => array(
								'title' => __( 'Your Page Starts Here', 'xcodesol-page-builder' ),
								'tag'   => 'h1',
								'align' => 'center',
							),
						),
						array(
							'type'     => 'xcopb/gb-text',
							'settings' => array(
								'content' => __( 'Drag widgets from the palette or add new columns to build your page.', 'xcodesol-page-builder' ),
								'align'   => 'center',
							),
						),
					),
				),
			),
		),
		'zones'       => array( 'canvas' ),
		'settings'    => array(
			'disable_on_mobile'       => false,
			'respect_theme_templates' => true,
		),
	),
);
