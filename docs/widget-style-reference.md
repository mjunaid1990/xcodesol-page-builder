# Widget Style Reference — full styling spec per widget

> **How to read this doc.** Every widget card has **elements** (tabs when there are several). Every element carries **style groups** (accordions). This is the *full, richest* proposal — review it, then the JSON twin (`widget-style-reference.json`) drives the style engine.

## Style groups — everything they contain

| Group | Full property set |
|---|---|
| **Layout** | display, width, min/max-width, height, min/max-height, position, overflow, z-index, flex-direction, flex-wrap, justify-content, align-items, gap, row-gap, column-gap, grid-template-columns, content width (max-width), text/box alignment |
| **Spacing** | margin top/right/bottom/left, padding top/right/bottom/left, **linked-sides mode**, per-side units, spacing presets (0 · xs · sm · md · lg · xl) |
| **Dimensions** | width, height, min/max-width, min/max-height, **aspect ratio / crop fit** for media |
| **Typography** | font family, size, weight, style (italic/oblique), line-height, letter-spacing, word-spacing, text-align, text-transform, text-decoration (+ underline offset/color), **text-shadow**, **max text width**, overflow behavior (wrap / ellipsis / line-clamp) |
| **Colors** | text, background, **link**, **link hover/active**, heading, icon, border, placeholder, overlay, disabled, focus — every role that element can have |
| **Background** | solid color, **gradient (linear/radial, angle, position, two+ stops)**, image (position, size, repeat, attachment, **focal point**), **overlay color + overlay opacity**, hover background swap |
| **Border** | style (solid/dashed/dotted…), width per side, color, **outline + offset (keyboard focus ring)** |
| **Radius** | per-corner radius (top-left/right, bottom-left/right), pill/square presets |
| **Shadow** | box-shadow presets (none · soft · medium · hard · floating), x/y offset, blur, spread, color, opacity, inset |
| **Effects** | animation presets (fade, slide, zoom, bounce, pulse, float…), duration, delay, easing, transition presets (fast/smooth/bouncy), opacity, cursor, **CSS transform group — transform_type, transform_tx, transform_ty, transform_scale, transform_rotate, transform_origin**, **filter presets (grayscale, sepia, brightness, contrast, blur, hue)** |
| **Transform** | translate X/Y (px), scale (×), rotate (deg), transform origin — exposed as the **CSS transform** accordion inside **Effects**. Available on almost every widget element via the shared `effectsWithTransform()` config helper. |
| **Visibility** | display, visibility, opacity, pointer-events — **available on every element** (hide this title/image/button on mobile) |
| **Responsive** | **every group above per breakpoint: desktop · tablet · mobile** (each element) |
| **Advanced** | custom CSS class(es), raw custom CSS (collapsed, for power users only) |

**Global rules (applied to every widget/element):**
- **Responsive** (desktop/tablet/mobile) + **Visibility** exist on every element of every widget.
- **Advanced** (class + raw CSS) exists on every element, collapsed at the bottom.
- **Keyboard focus** — anything focusable (links, buttons, inputs, selects) gets a **focus-visible** state with outline/ring styling; default ring never removed unless the user sets a visible alternative.
- **Reduced motion** — all animation/transition values auto-respect `prefers-reduced-motion` (engine-level, no user action needed).
- **States** — per element: `default · hover · active · focus · focus-visible · disabled · selected · loading`, shown only where the element is interactive.
- Colors accept hex / rgba / CSS-named; every value is sanitized on save and rendered via scoped CSS variables.

**Content vs Style** — layout *structure* that defines what the widget shows stays in the right inspector (columns, badge position/corners, simple/ribbon, overlay direction, dropdown/radio, limits…). This doc lists only *styling*.

---

## ARCHIVE widgets (Shop · Category · Tag · Term pages)

### xcosb/ar-title — Archive Title
| Element | Groups | Plus |
|---|---|---|
| **Title text** | Typography · Colors · Layout · Spacing · **Effects(transform)** · Responsive | link color + hover underline when title links somewhere; text-shadow; max text width |

### xcosb/ar-description — Archive Description
| Element | Groups | Plus |
|---|---|---|
| **Text** | Typography · Colors · Layout · Spacing · **Effects(transform)** · Responsive | text-shadow (over image headers); max text width; drop-ellipsis |
| **Box** | Spacing · Background · Border · Radius · Shadow · Effects · Responsive | min-height; box gradient behind intro sections |

### xcosb/ar-result-count — Result Count
| Element | Groups | Plus |
|---|---|---|
| **Text** | Typography · Colors · Layout · Spacing · **Effects(transform)** · Responsive | muted/secondary tone; weight + letter spacing for eyebrow look |

### xcosb/ar-ordering — Sort Products
| Element | Groups | Plus |
|---|---|---|
| **Box** | Layout · Spacing · **Effects(transform)** · Responsive | push right/left; flex with result-count |
| **Select / radio** | Dimensions · Spacing · Typography · Colors · Border · Radius · Shadow · **Effects(transform)** · Responsive · States(hover, focus, focus-visible) | **dropdown caret color**; **radio accent color** when radio style; placeholder color; focus ring outline; per-option row hover when radio |

### xcosb/ar-loop — Product Grid
| Element | Groups | Plus |
|---|---|---|
| **Grid** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | gap / row-gap / column-gap; min-height; hover effect on grid itself (rare) |

### xcosb/ar-pagination — Pagination
| Element | Groups | Plus |
|---|---|---|
| **Box** | Layout · Spacing · Responsive | center/left/right; prev–next separated |
| **Page button/link** | Layout · Spacing · Typography · Colors · Background · Border · Radius · Shadow · Effects · Responsive · States(hover, active, focus-visible, disabled, **selected**) | current-page fill; disabled ghosting; **prev/next arrow color + hover lift** |

---

## SINGLE PRODUCT widgets

### xcosb/sp-title — Product Title
| Element | Groups | Plus |
|---|---|---|
| **Title text** | Typography · Colors · Layout · Spacing · Effects · Responsive · States(hover) | heading line-height/letter-spacing; link hover color + underline |

### xcosb/sp-price — Product Price
| Element | Groups | Plus |
|---|---|---|
| **Price text** | Typography · Colors · Layout · Spacing · Effects · Responsive | sale price color/weight separate from regular; currency symbol same size toggle; price-per-unit secondary tone |

### xcosb/sp-image — Product Image
| Element | Groups | Plus |
|---|---|---|
| **Image** | Dimensions · Border · Radius · Shadow · Effects · Responsive · States(hover) | **aspect-ratio/crop fit**; **filters (grayscale/sepia/brightness/contrast)**; hover zoom + lift shadow; transition easing |
| **Box** (gallery wrap) | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | badge/sale corner overlay inside image box; min-height |

### xcosb/sp-add-to-cart — Add to Cart (button + qty)
| Element | Groups | Plus |
|---|---|---|
| **Box** | Layout · Spacing · Responsive | flex row + gap; stretch/left/right |
| **Button** | Layout · Spacing · Typography · Colors · Background · Border · Radius · Shadow · Effects · Responsive · States(hover, active, focus-visible, disabled, **loading**) | **letter-spacing + uppercase transform**; full-width toggle; **hover translateY lift + shadow swap**; loading spinner accent; focus ring outline |
| **Quantity input** | Dimensions · Spacing · Typography · Colors · Border · Radius · Effects · Responsive · States(hover, focus, focus-visible) | **stepper arrows color**; border on hover; focus ring; disabled while stock=0 |

### xcosb/sp-excerpt — Product Excerpt
| Element | Groups | Plus |
|---|---|---|
| **Text** | Typography · Colors · Layout · Spacing · Effects · Responsive | max text width; line-clamp; first-letter styling |

---

## PRODUCT CARD widgets (Product Card templates)

> **Card surface (whole card)** — Product Card templates also expose a top-level **Card** element that wraps all card blocks:
> Layout · Spacing(padding) · Background · Border · Radius · Shadow · Effects · Responsive · States(hover) — for whole-card chrome: hover lift/shadow, full-bleed-image setups (card padding 0 + inner container padding), hover border-color. *(Listed in the JSON under `cardSurface`.)*

### xcosb/cd-image — Card Image
| Element | Groups | Plus |
|---|---|---|
| **Image** | Dimensions · Border · Radius · Shadow · Effects · Responsive · States(hover) | **aspect-ratio/crop**; **filters**; hover zoom + reveal; overlay fade handled by image settings |

### xcosb/cd-badge — Sale Badge
| Element | Groups | Plus |
|---|---|---|
| **Badge chip** | Spacing · Colors · Background · Border · Radius · Shadow · Effects · Responsive · States(hover) | ribbon fold shadow; gradient badge; **pulse/float animation**; padding presets |
| **Badge text** | Typography · Colors · Layout · Responsive | letter-spacing + uppercase; text-shadow for contrast on images |

### xcosb/cd-title — Card Title
| Element | Groups | Plus |
|---|---|---|
| **Title text** | Typography · Colors · Layout · Spacing · Effects · Responsive · States(hover) | 2-line clamp; link hover color + underline |

### xcosb/cd-price — Card Price
| Element | Groups | Plus |
|---|---|---|
| **Price text** | Typography · Colors · Layout · Spacing · Responsive | sale color/weight; old-price strikethrough tone |

### xcosb/cd-rating — Card Rating
| Element | Groups | Plus |
|---|---|---|
| **Stars** | **Typography(star size)** · Colors(filled / empty / hover) · Spacing(gap) · Layout · Responsive | half-star color handling; count text secondary tone |

### xcosb/cd-excerpt — Card Excerpt
| Element | Groups | Plus |
|---|---|---|
| **Text** | Typography · Colors · Layout · Spacing · Effects · Responsive | line-clamp; max text width |

### xcosb/cd-add-to-cart — Card Add to Cart
| Element | Groups | Plus |
|---|---|---|
| **Button** | Layout · Spacing · Typography · Colors · Background · Border · Radius · Shadow · Effects · Responsive · States(hover, active, focus-visible, disabled, loading) | full-width toggle; letter-spacing/uppercase; hover lift; loading spinner |
| **Box** | Layout · Spacing · Responsive | center/left/right; margin above/below |

### xcosb/cd-categories · xcosb/cd-tags — Card Categories / Tags
| Element | Groups | Plus |
|---|---|---|
| **List box** | Layout · Spacing · Responsive | flex wrap + gap; separators |
| **Chip/link** | Spacing · Typography · Colors · Border · Radius · Shadow · Effects · Responsive · States(hover, focus-visible) | pill vs square; hover fill swap; separators (", ") color via colors.border |

### xcosb/cd-stock — Card Stock Status
| Element | Groups | Plus |
|---|---|---|
| **Status text** | Typography · Colors · Layout · Spacing · Responsive | **per-status colors: in-stock (green) / low stock (amber) / out-of-stock (red/disabled tone) / on-backorder (blue)**; icon dot color; label weight |

### xcosb/cd-sku — Card SKU
| Element | Groups | Plus |
|---|---|---|
| **Text row** | Typography · Colors · Layout · Spacing · Responsive | prefix label muted vs value; letter spacing |

---

## GENERAL widgets

### xcosb/gb-banner — Banner (tabs: Heading · Paragraph · Button · Background & box · Content box)
| Element | Groups | Plus |
|---|---|---|
| **Heading** | Typography · Colors · Layout · Spacing · Effects · Responsive | **text-shadow (over image/video)**; max text width; line-height; letter-spacing |
| **Paragraph** | Typography · Colors · Layout · Spacing · Effects · Responsive | text-shadow; max text width; line-height |
| **Button** | Layout · Spacing · Typography · Colors · Background · Border · Radius · Shadow · Effects · Responsive · States(hover, active, focus-visible) | **gradient CTA**; hover translateY lift; letter-spacing/uppercase; second CTA offset gap |
| **Background & box** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | **video + image + gradient all layered**; min-height; parallax attachment; overlay color/opacity behind text; entrance animation presets |
| **Content box** | Layout · Spacing · Colors · Border · Radius · Shadow · Effects · Responsive | **max content width**; vertical + horizontal alignment; semi-transparent glass panel (bg + blur backdrop); inner gap between heading/para/button |

### xcosb/gb-divider — Divider
| Element | Groups | Plus |
|---|---|---|
| **Line** | Colors · Background(gradient line) · Layout(width/align) · Spacing(margin) · Effects · Responsive | gradient fade line; **grow-on-scroll animation**; dashed/solid from settings; vertical divider option (height) |

### xcosb/gb-breadcrumb — Breadcrumb
| Element | Groups | Plus |
|---|---|---|
| **Box** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | wrap control; separator spacing |
| **Links text** | Typography · Colors · Layout · Spacing · Responsive · States(hover, focus-visible) | **link / hover / current-page colors**; separator color; underline on hover; focus ring outline |

### xcosb/gb-text — Text
| Element | Groups | Plus |
|---|---|---|
| **Text** | Typography · Colors · Layout · Spacing · Effects · Responsive · States(hover for links) | text-shadow; max text width; drop cap; link + hover underline |
| **Box** | Spacing · Background · Border · Radius · Shadow · Effects · Responsive | callout/gradient backgrounds |

### xcosb/gb-container — Container (12-col grid) + **each column**
| Element | Groups | Plus |
|---|---|---|
| **Container** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | columns/gap settings mirrored in Layout; equal-height columns; min-height |
| **Column 1 … N** (each) | Layout(inner align, vertical align, order) · Spacing(padding) · Background · Border · Radius · Shadow · Effects · Responsive | per-column gradient; per-column hide-on-mobile; per-column vertical centering — every column styled separately |

### xcosb/gb-text-widget — Text Widget (classic)
| Element | Groups | Plus |
|---|---|---|
| **Title** | Typography · Colors · Layout · Spacing · Effects · Responsive | heading styling (accent underline optional via border-bottom) |
| **Content** | Typography · Colors(text + links) · Layout · Spacing · Effects · Responsive | link/hover colors; list bullets color; image margins |
| **Box** | Spacing · Background · Border · Radius · Shadow · Effects · Responsive | widget card chrome |

---

## WOOCOMMERCE helper widgets

### xcosb/woo-categories — Product Categories (grid/list)
| Element | Groups | Plus |
|---|---|---|
| **Title** | Typography · Colors · Layout · Spacing · Effects · Responsive | text-shadow over image variants |
| **Grid wrapper** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | columns/gap; equal heights |
| **Category card** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive · States(hover) | **hover lift + shadow + border-color**; image overlay tint |
| **Image** | Dimensions · Border · Radius · Shadow · Effects · Responsive · States(hover) | aspect/crop; **filters**; hover zoom; radius top-follow-card |
| **Name** | Typography · Colors · Layout · Spacing · Effects · Responsive · States(hover) | link color/hover underline; letter spacing |
| **Count** | Typography · Colors · Spacing · Responsive | **count badge chip** (bg/radius) vs plain muted text |

### xcosb/woo-tags — Product Tags (cloud/list)
| Element | Groups | Plus |
|---|---|---|
| **Title** | Typography · Colors · Layout · Spacing · Effects · Responsive | — |
| **List box** | Layout · Spacing · Responsive | wrap + gap + align |
| **Tag chip** | Spacing · Typography · Colors · Border · Radius · Shadow · Effects · Responsive · States(hover, focus-visible) | pill vs square; **hover fill + lift**; focus ring |

### xcosb/woo-attributes — Product Attributes (term lists)
| Element | Groups | Plus |
|---|---|---|
| **Title** | Typography · Colors · Layout · Spacing · Effects · Responsive | — |
| **List box** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | card chrome around table |
| **Term row** | Spacing · Typography · Colors · Border(bottom separators) · Radius · Shadow · Effects · Responsive · States(hover) | row hover bg; term/value alignment; chips variant (same as tags) |

### xcosb/woo-search — Product Search
| Element | Groups | Plus |
|---|---|---|
| **Form box** | Layout · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | flex row + direction; **focus-within ring highlight**; padding presets |
| **Input** | Dimensions · Spacing · Typography · Colors · Border · Radius · Effects · Responsive · States(hover, focus, focus-visible) | **placeholder color**; caret color; icon spacing; focus ring outline |
| **Button** | Spacing · Typography · Colors · Background · Border · Radius · Shadow · Effects · Responsive · States(hover, active, focus-visible, disabled) | icon+text gap; hover lift; disabled ghost |

---

## PAGE CONTENT widgets (Cart & Checkout templates)

### xcosb/cc-cart — Cart (WooCommerce)
| Element | Groups | Plus |
|---|---|---|
| **Cart box** | Layout(align, max-width) · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | centered column card; mobile full-bleed override; min-height empty state |
| *(Inner WooCommerce table/coupon markup stays untouched — never styled directly so hooks + notices keep working)* | | |

### xcosb/cc-checkout — Checkout (WooCommerce)
| Element | Groups | Plus |
|---|---|---|
| **Checkout box** | Layout(align, max-width) · Spacing · Background · Border · Radius · Shadow · Effects · Responsive | form column card; focus visible accent inherits theme |

---

## Appendix — element role cheat sheet
| Role | Always has | Plus |
|---|---|---|
| Text / heading | Typography, Colors(text/link), Layout(align), Spacing, Effects, Responsive | text-shadow, max width, hover state for links |
| Box / surface | Layout, Spacing, Background, Border, Radius, Shadow, Effects, Responsive, Visibility, Advanced | gradient, image/video bg, overlay |
| Image / media | Dimensions, Border, Radius, Shadow, Effects, Responsive | crop/fit, filters, hover zoom |
| Button | Layout, Spacing, Typography, Colors, Background, Border, Radius, Shadow, Effects, Responsive, States(hover/active/focus-visible/disabled/loading) | uppercase/letterspacing, lift, focus ring |
| Input / select | Dimensions, Spacing, Typography, Colors, Border, Radius, Responsive, States(hover/focus/focus-visible) | placeholder, caret/stepper/accent colors, focus ring |
| Chip / item | Spacing, Typography, Colors, Border, Radius, Shadow, Effects, Responsive, States(hover) | fill swap, lift, focus ring when link |
| Link-in-list | Typography, Colors(text/link/hover), Spacing, Responsive, States(hover/focus-visible) | underline offset, separators color |
