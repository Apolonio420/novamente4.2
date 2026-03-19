# Phase 6: Feed Export (Pro)
**Priority:** MEDIUM — Pro differentiator, enables Google Shopping + Meta Commerce
**Depends on:** None (uses existing catalog data)
**Tier gating:** Pro only

## What Must Be TRUE When Done

1. Pro partners have a live Google Shopping XML feed at `/api/partners/feed/google/[tenantId]`
2. Pro partners have a live Meta Commerce TSV feed at `/api/partners/feed/meta/[tenantId]`
3. Feeds auto-generate from published products with correct formatting
4. Feed URLs shown in workspace with copy button + setup instructions
5. Feeds are cached (1 hour ISR) for performance
6. Non-Pro partners see the feature as locked

---

## Task 6-1: Create Google Shopping Feed Route
**New file:** `app/api/partners/feed/google/[tenantId]/route.ts`
**Implementation:**
- GET: returns XML (Content-Type: application/xml)
- Cache: `Cache-Control: public, s-maxage=3600`
- Format: RSS 2.0 with `g:` namespace (Google Merchant Center)
- Required fields per item:
  ```xml
  <item>
    <g:id>{product.id}</g:id>
    <title>{product.name}</title>
    <description>{product.description}</description>
    <link>https://www.novamente.ar/p/{tenant.slug}/{product.slug}</link>
    <g:image_link>{product.images[0]}</g:image_link>
    <g:additional_image_link>{product.images[1+]}</g:additional_image_link>
    <g:price>{product.price} ARS</g:price>
    <g:availability>in_stock</g:availability>
    <g:brand>{tenant.name}</g:brand>
    <g:condition>new</g:condition>
    <g:product_type>Apparel &amp; Accessories > Clothing</g:product_type>
    <g:shipping>
      <g:country>AR</g:country>
      <g:service>Standard</g:service>
      <g:price>0 ARS</g:price>
    </g:shipping>
  </item>
  ```
- Gate check: verify tenant plan is Pro, else return 403
- Only include published products (status = 'published')

## Task 6-2: Create Meta Commerce Feed Route
**New file:** `app/api/partners/feed/meta/[tenantId]/route.ts`
**Implementation:**
- GET: returns TSV (Content-Type: text/tab-separated-values)
- Cache: `Cache-Control: public, s-maxage=3600`
- Format: Facebook Commerce Manager TSV
- Header row + data rows:
  ```
  id	title	description	availability	condition	price	link	image_link	brand	additional_image_link
  {product.id}	{name}	{desc}	in stock	new	{price} ARS	{url}	{tenant.name}	{images[1+] pipe-separated}
  ```
- Gate: Pro only
- Only published products

## Task 6-3: Create Feed Generation Library
**New file:** `lib/partners/feed-generator.ts`
**Functions:**
```typescript
// generateGoogleShoppingXml(tenant, products) → string (XML)
// generateMetaCommerceTsv(tenant, products) → string (TSV)
// Shared helpers:
//   sanitizeForXml(text) → escaped string
//   sanitizeForTsv(text) → tab/newline stripped string
//   formatPrice(price, currency = 'ARS') → "12500.00 ARS"
//   getProductUrl(tenant, product) → full canonical URL
//   getProductCategory(product) → Google product taxonomy string
```

## Task 6-4: Create Feed Management Page in Workspace
**New file:** `app/workspace/feeds/page.tsx`
**Layout:**

**Section 1: Feed URLs**
- Google Shopping Feed card:
  - URL: `https://www.novamente.ar/api/partners/feed/google/{tenantId}`
  - Copy button (clipboard)
  - "Validar feed" link → Google Merchant Center feed testing tool
  - Status badge: "Activo — {N} productos"
  - Last generated timestamp

- Meta Commerce Feed card:
  - URL: `https://www.novamente.ar/api/partners/feed/meta/{tenantId}`
  - Copy button
  - Status badge: "Activo — {N} productos"

**Section 2: Setup Guides**
- Google Merchant Center:
  1. Crear cuenta en merchants.google.com
  2. Agregar feed → Scheduled fetch
  3. Pegar URL del feed
  4. Verificar productos importados

- Meta Commerce Manager:
  1. Ir a Commerce Manager en Meta Business Suite
  2. Crear catálogo → "E-commerce"
  3. Agregar data feed → Scheduled
  4. Pegar URL del feed

**Section 3: Product Preview**
- Table showing what products will appear in feeds
- Columns: image, name, price, status (published/draft)
- Warning if product missing required fields (no description, no image)

**Starter/Growth gate:** Locked state with "Disponible en plan Pro" + upgrade CTA

## Task 6-5: Feed Validation Endpoint
**New file:** `app/api/partners/feed/validate/[tenantId]/route.ts`
- GET: validates feed data and returns issues
- Response: `{ valid: boolean, products: number, issues: { productId, field, message }[] }`
- Checks: missing descriptions, missing images, missing prices, invalid characters

## Task 6-6: Workspace Navigation Link
- Add "Feeds" link in workspace nav with RSS icon
- Pro: accessible, others: locked with Pro badge

---

## Verification Checklist
- [ ] Google Shopping XML feed returns valid XML for Pro tenant
- [ ] Meta Commerce TSV feed returns valid TSV for Pro tenant
- [ ] Feeds only include published products
- [ ] Non-Pro tenants get 403 on feed URLs
- [ ] Feed URLs are copyable from workspace
- [ ] Setup guides are clear and accurate
- [ ] Product preview table shows correct data
- [ ] Feed validation catches missing fields
- [ ] XML validates against Google Merchant Center spec
- [ ] `npx next build` passes
