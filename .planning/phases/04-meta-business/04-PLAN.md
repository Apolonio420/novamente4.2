# Phase 4: Meta Business Setup (Pro)
**Priority:** MEDIUM — Pro differentiator
**Depends on:** None (independent)
**Tier gating:** Pro only

## What Must Be TRUE When Done

1. Pro partners get a step-by-step guided wizard for setting up Meta Business
2. Meta Pixel code is auto-generated and injected into their storefront pages
3. Guides include screenshots/illustrations for Facebook Page, Instagram Business, Meta Business Suite
4. Progress is tracked with a checklist (persisted per tenant)
5. Non-Pro partners see a locked teaser in workspace

---

## Task 4-1: Create Meta Setup Checklist Table
**Migration SQL:**
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_setup_progress JSONB DEFAULT '{}';
-- Format: { "pixel_installed": true, "fb_page_created": false, "ig_business_linked": false, "business_suite_connected": false, "catalog_connected": false }
```

## Task 4-2: Auto-Generate Meta Pixel Code
**New file:** `lib/partners/meta-pixel.ts`
**Functions:**
```typescript
// generatePixelSnippet(pixelId: string) → string (returns <script> tag)
// The pixel ID is stored in tenant.meta_pixel_id (new field)
// Default events to track: PageView, ViewContent (on product pages), Lead (on lead submit)
```

**Migration SQL:**
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT DEFAULT NULL;
```

## Task 4-3: Inject Pixel into Storefront
**File:** `app/p/[slug]/page.tsx`
**Change:** If tenant has `meta_pixel_id` AND plan is Pro:
- Inject Meta Pixel base code in `<head>` via metadata or Script component
- Fire `fbq('track', 'PageView')` on storefront load

**File:** `app/p/[slug]/[product]/page.tsx`
**Change:** If pixel exists, fire `fbq('track', 'ViewContent', { content_name, content_ids, value, currency })` on product page

**New file:** `components/partners/meta-pixel-script.tsx`
- Client component that renders the pixel script + fires appropriate event
- Props: `pixelId: string, event: string, eventData?: object`

## Task 4-4: Create Meta Business Setup Wizard Page
**New file:** `app/workspace/meta-business/page.tsx`
**Layout:**
- Hero card: "Configurá tu presencia en Meta" with Meta logo
- Progress bar showing completed steps / total steps
- **Step cards (accordion or stepper):**

**Step 1: Meta Pixel**
- Input field for Pixel ID (with link to "Cómo obtener tu Pixel ID" guide)
- "Instalar automáticamente" button → saves to tenant, pixel gets injected
- Verification: show green check if pixel is installed
- Preview: show the events that will fire

**Step 2: Facebook Page**
- Step-by-step visual guide with screenshots:
  1. Ir a facebook.com/pages/create
  2. Elegir categoría "Tienda de ropa" o similar
  3. Usar nombre de marca y logo de storefront
  4. Agregar link a storefront como website
- Download button: "Descargar logo para Facebook" (tenant logo resized to 180x180)
- Download button: "Descargar cover para Facebook" (tenant banner resized to 820x312)
- Checkbox: "Ya creé mi página de Facebook" → marks step complete

**Step 3: Instagram Business**
- Guide to convert personal IG to business account
- Link IG to Facebook Page
- Visual guide with numbered steps
- Checkbox: "Ya linkée Instagram Business"

**Step 4: Meta Business Suite**
- Guide to access business.facebook.com
- Connect Facebook Page + Instagram
- Overview of tools available
- Checkbox: "Ya accedí a Meta Business Suite"

**Step 5: Connect Product Catalog (optional, depends on Phase 6)**
- If feed export exists, show feed URL for Meta Commerce
- Guide to import feed in Commerce Manager
- Checkbox: "Catálogo conectado"

## Task 4-5: Save Setup Progress
**File:** `app/api/partners/meta-business/route.ts`
- GET: returns current progress + pixel_id
- PATCH: update progress checklist + pixel_id
- Gate: Pro only (check `features.metaBusinessSetup`)

## Task 4-6: Workspace Navigation Link
**File:** workspace nav component
**Change:** Add "Meta Business" link with globe/meta icon
- Pro: clickable, shows setup wizard
- Growth/Starter: grayed out with "Pro" badge, click shows upgrade modal

---

## Verification Checklist
- [ ] Pro partner can access `/workspace/meta-business`
- [ ] Pixel ID input saves to tenant
- [ ] Pixel script injected into storefront pages
- [ ] Each guide step has clear instructions
- [ ] Progress persists across sessions
- [ ] Non-Pro partners see locked state
- [ ] Logo/banner download buttons work with correct dimensions
- [ ] `npx next build` passes
