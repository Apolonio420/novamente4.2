# Phase 13: Feed Export — Gaps & Completion
**Priority:** LOW — Pro-only, code is fully implemented
**Depends on:** Products exist in DB with proper data
**Status of existing code:** REAL — generators, APIs, validation, UI all implemented

## Current State

Feed export is **fully coded**:
- `lib/partners/feed-generator.ts` — generateGoogleShoppingXml(), generateMetaCommerceTsv(), validateFeedProducts()
- `app/api/partners/feed/google/[tenantId]/route.ts` — Public XML feed
- `app/api/partners/feed/meta/[tenantId]/route.ts` — Public TSV feed
- `app/api/partners/feed/validate/[tenantId]/route.ts` — Validation endpoint
- `app/workspace/feeds/page.tsx` — Feed management UI with URLs, validation, guides

**What's MISSING / TO VERIFY:**
1. Feed URLs use `tenantId` (UUID) not slug — not user-friendly for sharing
2. Products need proper category mapping for Google Shopping taxonomy
3. No automatic feed refresh/ping mechanism (Google/Meta need to re-fetch)
4. Currency formatting may not match Google Shopping requirements (ARS)
5. Products from `dbProductToProduct()` transformer may have incomplete data for feeds

---

## What Must Be TRUE When Done

1. Feed URLs work and return valid XML/TSV with real product data
2. Google Shopping XML passes Google Merchant Center validation
3. Meta Commerce TSV passes Meta Commerce Manager validation
4. Products have required fields: title, description, link, image, price, category
5. Workspace feeds page shows correct URLs and validation status
6. Feed URLs use tenant slug (not UUID) for readability

---

## Task 13-1: Switch Feed URLs to Use Slug

**Files:**
- `app/api/partners/feed/google/[tenantId]/route.ts` → rename to `[slug]/route.ts`
- `app/api/partners/feed/meta/[tenantId]/route.ts` → rename to `[slug]/route.ts`
- `app/api/partners/feed/validate/[tenantId]/route.ts` → rename to `[slug]/route.ts`

**Change:** Resolve tenant by slug instead of UUID:
```typescript
const tenant = await getTenantBySlug(slug)
if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
```

**Update workspace feeds page** to show slug-based URLs.

---

## Task 13-2: Verify Product Data Completeness for Feeds

**Check:** `lib/partners/feed-generator.ts`

Ensure products passed to feed generators have:
- `name` (required, ≤150 chars)
- `description` (required, ≤5000 chars)
- `price` > 0
- At least 1 image URL
- `category` mapped to Google Product Taxonomy (e.g., "Apparel & Accessories > Clothing > Shirts & Tops")

**If category is generic** (e.g., "remera"), add a mapping:
```typescript
const CATEGORY_MAP: Record<string, string> = {
  'remera': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'hoodie': 'Apparel & Accessories > Clothing > Outerwear > Hoodies & Sweatshirts',
  'pantalon': 'Apparel & Accessories > Clothing > Pants',
  'gorra': 'Apparel & Accessories > Clothing Accessories > Hats',
  'tote': 'Apparel & Accessories > Handbags, Wallets & Cases > Tote Bags',
}
```

---

## Task 13-3: Currency & Price Format Verification

**Check:** Feed generator price output

Google Shopping requires: `{amount} {currency}` format (e.g., `28000.00 ARS`)
Meta Commerce requires: `{amount} {currency}` (same format)

Verify:
- Price is formatted with 2 decimal places
- Currency code is correct (`ARS` for Argentina)
- compare_at_price maps to `sale_price` in Google feed

---

## Task 13-4: Add Refresh Instructions

**File:** `app/workspace/feeds/page.tsx`

Add clear instructions for:
- **Google Merchant Center:** "Creá un feed programado con esta URL. Google lo actualizará automáticamente cada día."
- **Meta Commerce Manager:** "Agregá esta URL como Data Feed Source en tu catálogo."
- Include direct links to:
  - `https://merchants.google.com/` (Google Merchant Center)
  - `https://business.facebook.com/commerce/` (Meta Commerce Manager)

---

## Verification Checklist
- [ ] `/api/partners/feed/google/{slug}` returns valid XML
- [ ] `/api/partners/feed/meta/{slug}` returns valid TSV
- [ ] Products have proper Google taxonomy categories
- [ ] Prices formatted correctly with ARS currency
- [ ] Validation endpoint reports issues accurately
- [ ] Workspace feeds page shows correct slug-based URLs
- [ ] Feed works with real DB products (not just static)
- [ ] Non-Pro tenants get 403
- [ ] `npx next build` passes
