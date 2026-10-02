# Hero Banner widget

The Hero Banner uses the existing `xcopb/gb-banner` block and keeps its data in one settings object. The editor schema is in `src/admin/schemas/banner-schema.js`; shared defaults and the five presets are JSON in `includes/data/`; PHP sanitizes saved settings in `includes/class-xcopb-rest-templates.php`; frontend query, slide, and slider output lives in `includes/class-xcopb-hero-banner.php`; the block entry point remains `blocks/general/banner.php`. The canvas preview is `src/admin/components/banner-preview.js`.

## Example saved settings

```json
{
  "source_mode": "custom",
  "slides": [
    {
      "id": "hero-slide-1",
      "type": "custom",
      "badge": "New",
      "title": "Make your next idea real",
      "title_tag": "h1",
      "subtitle": "A short description for the page visitor.",
      "background_type": "image",
      "image": "https://example.test/wp-content/uploads/hero.jpg",
      "mobile_image": "",
      "image_alt": "A team working together",
      "buttons": [
        { "label": "Explore", "url": "/explore/", "style": "primary", "new_tab": false, "nofollow": false }
      ]
    }
  ],
  "slider_enabled": false,
  "loop": true,
  "autoplay": false,
  "transition": "fade",
  "pagination": "dots",
  "bg_type": "image",
  "bg_size": "cover",
  "bg_position": "center center",
  "overlay_color": "#000000",
  "overlay_opacity": 40,
  "min_height": 440
}
```

The builder registers the block as `xcopb/gb-banner` through `XCOPB_Block_Registry`; its default object comes from `includes/data/hero-banner-defaults.json`. Existing saved banner settings are still read by the legacy renderer fallback.

## Included controls

- Custom, posts-query, and mixed sources; public post type slug; count, offset, order, author, category, tag, include/exclude IDs, featured-image filter, and sticky-only filter.
- Post field mappings for heading, description, image, and link, plus a fallback image and empty-state message.
- Up to 20 custom slides, collapsible and duplicable/reorderable with move controls; each slide supports heading/tag, badge, description, background color/image/video, mobile image, whole-slide link, and up to three buttons.
- Static or looping slider output, slide/fade/zoom transitions, autoplay delay, interaction/hover pause, arrows, dots/numbers/fraction/progress pagination, keyboard navigation, and touch swipe.
- Layout, position, colors, type sizes, image fit/position, overlay, content box, responsive visibility, ID/class, and scoped custom CSS.
- Five JSON presets: `centered-gradient`, `left-image`, `split-image-right`, `bold-dark`, and `soft-minimal`.

Post-query slides use the current WordPress post title, excerpt/content, featured or category thumbnail, permalink, date, author, and first category. Custom and linked slides accept `{post_title}`, `{post_excerpt}`, `{post_url}`, `{post_date}`, `{author}`, and `{category}` tokens when a dynamic post ID is set.

## Extension points

- **Pagination:** add the rendering branch in `XCOPB_Hero_Banner::render_pagination()`, add its schema option, and update the shared frontend and canvas CSS/preview.
- **Layout:** add the variant to the schema and sanitizer allowlist, then add `.xsb-banner-layout--your-variant` rules in both public stylesheets and the canvas stylesheet.
- **Dynamic tag:** add the token to `XCOPB_Hero_Banner::replace_tokens()` and document it in the slide description help.
- **Slide type:** add the type to the repeater schema and sanitizer allowlist, then normalize it in `render_slide()` (or a focused helper) before rendering shared slide markup.
- **Preset:** add an object to `includes/data/hero-banner-presets.json`; the inspector reads that registry automatically.

## Settings reference

| Area | Settings | Purpose |
| --- | --- | --- |
| Source | `source_mode`, `slides` | Choose custom slides, live posts, or both; each custom slide stores its text, media, link, type, and buttons. |
| Query | `posts_post_type`, `posts_count`, `posts_offset`, `posts_orderby`, `posts_order` | Select a public post type and control result count and sort order. |
| Query filters | `posts_category`, `posts_tag`, `posts_author`, `posts_include_ids`, `posts_exclude_ids`, `posts_has_image`, `posts_sticky_only` | Narrow down the posts included in the banner. |
| Query mapping | `query_title_field`, `query_description_field`, `query_image_field`, `query_link_field`, `fallback_image`, `query_empty_message` | Choose which WordPress fields fill each visible part and set fallback behavior. |
| Slider | `slider_enabled`, `loop`, `transition`, `autoplay`, `autoplay_delay`, `pause_on_hover`, `pause_on_interaction`, `show_arrows`, `pagination` | Configure static vs. carousel behavior, movement, timing, pausing, and navigation. |
| Background | `bg_type`, `bg_color`, `gradient_type`, `gradient_angle`, `gradient_color_a`, `gradient_color_b`, `bg_image`, `bg_video`, `bg_size`, `bg_position`, `overlay_color`, `overlay_opacity` | Set the banner fallback background, media fit/position, and overlay. Per-slide backgrounds override the fallback. |
| Placement | `layout_variant`, `align`, `content_position_x`, `content_position_y`, `min_height`, `padding_top`, `padding_bottom`, `padding_left`, `padding_right` | Position content and set banner dimensions and spacing. |
| Appearance | `title_color`, `subtitle_color`, `title_font_size`, `subtitle_font_size`, `border_radius`, `content_box`, `content_box_bg`, `content_box_padding` | Style typography, shape, and optional content panel. Existing typography and button style settings remain supported. |
| Advanced | `hide_desktop`, `hide_tablet`, `hide_mobile`, `css_id`, `css_class`, `custom_css` | Control responsive visibility and add identifiers or scoped CSS. |

## Manual verification checklist

- [ ] Drop a banner, change each visible control, and verify the canvas updates immediately.
- [ ] Select each preset, then edit and save the banner.
- [ ] Upload/select desktop and mobile images; verify their preview, alt text, fit, and position on canvas and frontend.
- [ ] Save, refresh the editor, and confirm the image and all slide settings persist.
- [ ] Render a static banner, then a multi-slide banner; check arrows, each pagination mode, keyboard, swipe, autoplay, pause, and reduced-motion behavior.
- [ ] Test posts query with post and page types, include/exclude IDs, and an empty result set.
- [ ] Check desktop and mobile layout and verify no horizontal overflow.
- [ ] Confirm custom title/description/tag content is sanitized and new-tab links include safe `rel` attributes.
- [ ] Pin the left widget panel, move the pointer away, and scroll to the bottom; unpin and confirm it closes on pointer leave.

## Scope notes

The current first implementation does not yet include a searchable post picker, taxonomy query UI beyond category/tag, media focal-point control, YouTube/Vimeo player URLs, scheduled slides, per-slide responsive visibility/alignment/animation, drag-reorder, thumbnails/title-list pagination, inline canvas text editing, or advanced parallax/ken-burns/blend-mode controls. The JSON model is kept extensible so these can be added without changing the saved block type.
