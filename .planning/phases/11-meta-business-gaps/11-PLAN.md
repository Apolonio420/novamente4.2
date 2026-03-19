# Phase 11: Meta Business Setup — Gaps & Completion
**Priority:** MEDIUM — Pro-only feature, mostly implemented
**Depends on:** Migration applied (meta_pixel_id, meta_setup_progress columns EXIST)
**Status of existing code:** REAL — pixel generation, 5-step wizard, DB persistence all work

## Current State

The Meta Business Setup is **fully coded**:
- `lib/partners/meta-pixel.ts` — generatePixelSnippet(), generatePixelEvent()
- `app/api/partners/meta-business/route.ts` — GET/PATCH for pixel ID + progress
- `app/workspace/meta-business/page.tsx` — 5-step accordion wizard (Pro gated)

**What's MISSING:**
1. Pixel code is generated but NOT injected into storefront pages
2. No automatic event tracking (ViewContent, Lead, Purchase) on storefront
3. Step 5 (Product Catalog) shows feed URL but doesn't verify feed is working
4. No confirmation/test that pixel fires correctly
5. Setup instructions reference generic Meta docs, could be more specific

---

## What Must Be TRUE When Done

1. When Pro partner enters Pixel ID → pixel snippet injected into their storefront `<head>`
2. Storefront fires standard Meta events: PageView, ViewContent (product), Lead, Purchase
3. Pixel test tool: "Verificar Pixel" button that checks pixel loads correctly
4. Feed URL in step 5 links to actual working `/api/partners/feed/meta/{tenantId}`
5. Progress saves correctly and persists across sessions

---

## Task 11-1: Inject Meta Pixel into Storefront

**File:** `app/merch/[brand]/layout.tsx` or `app/merch/[brand]/page.tsx`

When rendering a DB partner's storefront:
1. Check if tenant has `meta_pixel_id` set
2. If yes, inject `generatePixelSnippet(pixelId)` via `<Script>` component (next/script)
3. Use `strategy="afterInteractive"` to not block rendering

**Implementation:**
```typescript
// In the storefront page (server component):
const pixelId = tenant.meta_pixel_id
// Pass to client component or use next/script directly
{pixelId && (
  <Script id="meta-pixel" strategy="afterInteractive"
    dangerouslySetInnerHTML={{ __html: generatePixelSnippet(pixelId) }}
  />
)}
```

---

## Task 11-2: Fire Standard Meta Events

**File:** Extend the `<StorefrontTracker>` component (from Phase 9) or create `<MetaPixelEvents>`

Events to fire:
- `PageView` — every storefront page (automatic with pixel snippet)
- `ViewContent` — on product detail page: `fbq('track', 'ViewContent', { content_ids: [productSlug], content_type: 'product' })`
- `Lead` — on lead form submission: `fbq('track', 'Lead')`
- `Purchase` — on order confirmation (if applicable)

**Client component** that checks `window.fbq` exists before calling.

---

## Task 11-3: Pixel Verification Button

**File:** `app/workspace/meta-business/page.tsx`

Add "Verificar Pixel" button in Step 1:
- Opens storefront in new tab with `?pixel_debug=1` query param
- Shows instructions: "Abrí tu storefront, luego verificá en Meta Events Manager"
- Link to: `https://business.facebook.com/events_manager`

(Real pixel testing requires Meta's Pixel Helper browser extension — we can only guide the user)

---

## Task 11-4: Feed URL Validation in Step 5

**File:** `app/workspace/meta-business/page.tsx`

In Step 5 (Product Catalog):
- Show the Meta feed URL: `/api/partners/feed/meta/{tenantId}`
- Add "Probar Feed" button that fetches the URL and shows:
  - Number of products in feed
  - Any validation warnings (from `/api/partners/feed/validate/{tenantId}`)
  - Status badge: "Listo" (green) or "Problemas" (yellow) with details

---

## Verification Checklist
- [ ] Pro partner with pixel ID → storefront page source contains Meta Pixel snippet
- [ ] Product detail page fires ViewContent event (check browser console)
- [ ] Lead submission fires Lead event
- [ ] "Verificar Pixel" button opens storefront + shows instructions
- [ ] Feed URL in Step 5 returns valid TSV with products
- [ ] "Probar Feed" shows product count + validation status
- [ ] Non-Pro partners don't see Meta Business page
- [ ] Progress persists across page reloads
- [ ] `npx next build` passes
