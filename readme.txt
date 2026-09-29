=== Xcodesol Page Builder ===
Contributors: xcodesol
Tags: woocommerce, ecommerce, page builder, product templates, checkout
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 2.1.30
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Design WooCommerce shop, product and checkout pages with a drag-and-drop builder — style every widget, go responsive, apply templates in one click.

== Description ==

Xcodesol Page Builder is a visual, drag-and-drop builder made for WooCommerce. Design your store pages on a live canvas — no code, no template files — and they render on the front end automatically.

= Features =

* **Visual builder** — drag widgets onto the canvas, drop them into container columns and reorder with insertion guides.
* **Style everything** — colors, typography, spacing, borders, shadows and entrance animations per widget, with separate desktop / tablet / mobile values.
* **Every store page** — design the shop page, product category and tag archives, single product page, cart and checkout.
* **Product card builder** — design the card used in product loops: image, sale badge, title, price, rating, stock, SKU and add-to-cart.
* **Pre-made templates** — ready-made designs for shop, category and cart/checkout pages, applied in one click and kept separate from your own templates.
* **Conditional rules** — show templates by page type, category, tag, price, on-sale status and more, with priority control when several match.
* **Export / import** — move templates between sites as JSON.
* **Compatible with classic and block themes**, and with WooCommerce High-Performance Order Storage (HPOS).

== Installation ==

1. In WordPress go to **Plugins → Add New → Upload Plugin** and choose the `xcodesol-page-builder.zip` file — or upload the `xcodesol-page-builder` folder to `/wp-content/plugins/`.
2. Activate the plugin on the *Plugins* screen. **WooCommerce must be active.**
3. Open the new **Page Builder** menu in the admin.
4. Click **Pre-made Templates → Use this template** for an instant design, or **Add New Template** to build your own.

Templates apply automatically: a Shop template renders on the shop page, a Category template on category archives, a Checkout template on checkout, and so on.

== Frequently Asked Questions ==

= Do I need to write code? =

No. Layouts, styling, responsive values and rules are all handled visually in the builder.

= Which pages can I design? =

Shop, product category and tag archives, single product, product cards, cart and checkout.

= My templates don't show on the front end. =

If WooCommerce's **Coming soon** mode is on, logged-out visitors see an interstitial instead of your store. Set WooCommerce → Settings → Site visibility → **Live**.

= Can I move templates to another site? =

Yes. Use **Export JSON** / **Import JSON** on the template list or in the editor.

== Changelog ==

= 2.1.30 =
* Upgraded Cart and Checkout templates: added modern 2-column express checkout designs (Shopify style), perks & trust banners, sticky order summaries, and minimalist studio layout.
* Deprecated legacy Cart Classic and Checkout Classic presets in favor of high-conversion modern templates.
* Improved style inspector controls with searchable style categories, collapsible panels, and streamlined action bars.
* Canvas and preview enhancements: resolved toolbar overflow clipping and enhanced responsive live rendering.

= 2.1.29 =
* Security and standards review fixes: every rendered template is escaped on output with the plugin's own HTML allowlist, all global names now use the unique `xcosb` prefix (existing `xsb` templates, presets, settings and layouts are migrated automatically), and the generic Shortcode and Custom HTML widgets were removed — the Text widget no longer runs shortcodes, so the plugin never stores or executes user-supplied code.

= 2.1.27 =
* Checkout split widgets: Contact Info, Billing Address, Shipping Address, Order Notes, Order Review & Totals and Payment & Place Order — each independently stylable, all submitting as one checkout form. Redesigned "Checkout – Classic" preset with page title, breadcrumb and two-column layout. Product images in the order review (with placeholder fallback) and styled country/state dropdowns.

= 2.1.26 =
* Cart split widgets (Cart Items / Cart Totals), redesigned "Cart – Classic" preset with quantity +/− steppers, coupon row and totals card; fixed cart form inputs being stripped.

= 2.1.25 =
* Polished cart and checkout styling: two-column layouts, rounded thumbnails, totals panel, blue action buttons and rounded form fields.

= 2.1.24 =
* New pre-made templates: Cart – Classic and Checkout – Classic.

= 2.1.18 =
* Pagination redesigned: modern pill buttons with a filled current-page chip and circular prev/next arrows.
