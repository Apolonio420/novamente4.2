# Phase 12: Meta Ads Templates — Backend & Persistence
**Priority:** MEDIUM — Pro-only, UI exists but no backend
**Depends on:** None (new table needed)
**Status of existing code:** UI REAL, Backend MISSING

## Current State

The Meta Ads workspace page is **fully coded as UI**:
- `app/workspace/meta-ads/page.tsx` — Template gallery (6 types), template builder with product selector, copy variant generator, UTM link builder, budget recommendations, targeting suggestions
- Imports from `lib/partners/ad-templates` — `AD_TEMPLATES`, `generateAdCopy()`, `getBudgetRecommendation()`, `getTargetingSuggestions()`, `generateMetaAdUtm()`

**What's MISSING:**
1. **No API route** at `/api/partners/meta-ads` — file doesn't exist
2. **No persistence** — generated ad variants are lost on page refresh
3. **No saved ads table** — nowhere to store generated campaigns
4. **No download/export** — can't export ad creative for upload to Meta Ads Manager

---

## What Must Be TRUE When Done

1. Partners can save generated ad variants to DB
2. Saved ads persist and appear in a "Mis Anuncios" list
3. Partners can edit/delete saved ads
4. Partners can download ad creative as a ZIP or individual images
5. Partners can copy ad text variants for pasting into Meta Ads Manager
6. API route exists at `/api/partners/meta-ads` for CRUD

---

## Task 12-1: Create Saved Ads Table

**New migration:** `.planning/migrations/partner-saved-ads.sql`

```sql
CREATE TABLE IF NOT EXISTS partner_saved_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,  -- 'showcase', 'carousel', 'story', etc.
  product_id UUID REFERENCES partner_products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta_url TEXT,
  utm_params JSONB DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  budget_recommendation JSONB DEFAULT '{}',
  targeting JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_ads_tenant ON partner_saved_ads(tenant_id);
```

---

## Task 12-2: Create Meta Ads API Route

**New file:** `app/api/partners/meta-ads/route.ts`

```typescript
// GET — List saved ads for tenant
// Query params: ?status=draft|ready|published|archived
// Returns: { ads: SavedAd[], count: number }

// POST — Save new ad variant
// Body: { templateType, productId?, name, headline, primaryText, description, ctaUrl, utmParams, imageUrls, budgetRecommendation, targeting }
// Returns: { ad: SavedAd }
```

**New file:** `app/api/partners/meta-ads/[id]/route.ts`

```typescript
// PUT — Update saved ad
// DELETE — Delete saved ad
```

**Plan gating:** Pro only (check `features.metaAdsTemplates`)

---

## Task 12-3: Create Meta Ads Service Layer

**New file:** `lib/partners/meta-ads.ts`

```typescript
export interface SavedAd {
  id: string
  tenant_id: string
  template_type: string
  product_id: string | null
  name: string
  headline: string | null
  primary_text: string | null
  description: string | null
  cta_url: string | null
  utm_params: Record<string, string>
  image_urls: string[]
  budget_recommendation: Record<string, unknown>
  targeting: Record<string, unknown>
  status: 'draft' | 'ready' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export async function createSavedAd(tenantId: string, input: Partial<SavedAd>): Promise<SavedAd | null>
export async function getSavedAds(tenantId: string, status?: string): Promise<SavedAd[]>
export async function getSavedAdById(id: string, tenantId: string): Promise<SavedAd | null>
export async function updateSavedAd(id: string, updates: Partial<SavedAd>): Promise<SavedAd | null>
export async function deleteSavedAd(id: string): Promise<boolean>
```

---

## Task 12-4: Update Workspace Meta Ads Page

**File:** `app/workspace/meta-ads/page.tsx`

Add to existing UI:
1. **"Mis Anuncios" tab** alongside template gallery — shows saved ads list
2. **"Guardar Anuncio" button** in template builder → POST to API
3. **Saved ad cards** with: template type badge, product name, headline preview, status, edit/delete actions
4. **Copy text buttons** next to headline, primary text, description fields
5. **Status management**: draft → ready → published (manual tracking, not Meta API integration)

---

## Task 12-5: Ad Creative Export

**In workspace meta-ads page:**
- "Descargar Creativo" button per saved ad → downloads image(s)
- "Copiar Todo" button → copies all text variants to clipboard as formatted text:
  ```
  Headline: {headline}
  Primary Text: {primaryText}
  Description: {description}
  URL: {ctaUrl}
  ```

For image download: if single image, direct download. If carousel, consider ZIP (or just download each separately).

---

## Verification Checklist
- [ ] Migration creates `partner_saved_ads` table
- [ ] POST `/api/partners/meta-ads` saves ad and returns it
- [ ] GET `/api/partners/meta-ads` lists saved ads
- [ ] PUT `/api/partners/meta-ads/{id}` updates ad
- [ ] DELETE `/api/partners/meta-ads/{id}` removes ad
- [ ] "Mis Anuncios" tab shows saved ads
- [ ] "Guardar Anuncio" persists current template builder state
- [ ] Copy text buttons work
- [ ] Download image works
- [ ] Non-Pro partners can't access (403)
- [ ] `npx next build` passes
