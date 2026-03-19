# Phase 1: Fix Foundations
**Priority:** CRITICAL — blocks everything else
**Estimated tasks:** 12

## What Must Be TRUE When Done

1. Pricing is identical everywhere: landing page ($25/$100), FAQ schema ($25/$100), wizard ($25/$100), subscribe API (dynamic rate)
2. Dashboard sparklines show real time-series data from Supabase, not hardcoded arrays
3. USD→ARS conversion uses Bluelytics API (dolar blue) with 24h cache fallback
4. File uploads in onboarding wizard persist to R2 immediately on Step 2
5. Wizard progress saves to localStorage so users can resume from last completed step
6. No fake data anywhere in the workspace dashboard

---

## Task 1A: Fix Pricing Inconsistencies

### 1A-1: Fix FAQ Schema Pricing on Landing Page
**File:** `app/partners/page.tsx` (lines 109-146)
**Change:** Update FAQ JSON-LD — Growth "$29 USD/mes" → "$25 USD/mes", Pro "$79 USD/mes" → "$100 USD/mes"
**Verification:** View source of `/partners`, confirm FAQ schema has correct prices

### 1A-2: Create Dynamic USD→ARS Rate Utility
**New file:** `lib/partners/currency.ts`
**Implementation:**
```typescript
// Fetch from Bluelytics API: https://api.bluelytics.com.ar/v2/latest
// Returns: { blue: { value_sell: number }, oficial: { value_sell: number } }
// Use blue.value_sell as the rate
// Cache in module-level variable with 24h TTL
// Fallback: hardcoded rate (last known) if API fails
// Export: getUsdToArs(): Promise<number>
// Export: convertUsdToArs(usd: number): Promise<number>
```
**Verification:** Call function, confirm returns reasonable rate (>1000 ARS/USD as of 2026)

### 1A-3: Update Subscribe API to Use Dynamic Rate
**File:** `app/api/partners/subscribe/route.ts`
**Change:** Replace `const USD_TO_ARS = 1200` with `const rate = await getUsdToArs()`
**Import:** `getUsdToArs` from `lib/partners/currency`
**Verification:** POST to subscribe endpoint, confirm price_ars uses current blue rate

### 1A-4: Show Dynamic Price on Landing Page
**File:** `app/partners/page.tsx`
**Change:** Convert to client component OR use server-side fetch to show ARS prices next to USD
**Approach:** Server component with `getUsdToArs()` call in the component, show "US$25/mes (~ARS XX.XXX)" format
**Verification:** Landing page shows both USD and approximate ARS price

---

## Task 1B: Real Dashboard Metrics

### 1B-1: Create Analytics Events Table
**Migration SQL:**
```sql
CREATE TABLE IF NOT EXISTS partner_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'lead_submit', 'order_created'
  event_data JSONB DEFAULT '{}',
  visitor_id TEXT, -- anonymous fingerprint or session ID
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- hashed IP for privacy
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_tenant_type ON partner_analytics_events(tenant_id, event_type);
CREATE INDEX idx_analytics_tenant_date ON partner_analytics_events(tenant_id, created_at);
CREATE INDEX idx_analytics_created ON partner_analytics_events(created_at);
```

### 1B-2: Create Analytics Tracking Library
**New file:** `lib/partners/analytics.ts`
**Functions:**
```typescript
// trackEvent(tenantId, eventType, eventData, request?) — insert into partner_analytics_events
// getMetricTimeSeries(tenantId, metric, days = 7) — returns number[] for sparkline
//   metric: 'page_views' | 'unique_visitors' | 'leads' | 'orders'
//   Groups by day, returns array of counts
// getDashboardMetrics(tenantId) — returns { products, leads, orders, score, trends: { products: number[], leads: number[], orders: number[], score: number[] } }
```

### 1B-3: Create Tracking Pixel API Route
**New file:** `app/api/partners/track/route.ts`
**Implementation:**
- POST endpoint accepts `{ tenantId, event, data? }`
- GET endpoint returns 1x1 transparent GIF (for image pixel tracking)
- Rate limited: 100 req/min per IP
- Extracts referrer, user-agent from request headers
- Hashes IP with SHA-256 for privacy
- Calls `trackEvent()` from analytics lib

### 1B-4: Instrument Storefront Pages with Tracking
**Files:** `app/p/[slug]/page.tsx`, `app/p/[slug]/[product]/page.tsx`
**Change:** Add `<img>` tracking pixel or `fetch()` beacon on page load
**Approach:** Add a client component `<StorefrontTracker tenantId={id} event="page_view" />` that fires a beacon on mount
**New file:** `components/partners/storefront-tracker.tsx` (client component, useEffect with fetch POST)

### 1B-5: Replace Fake Sparkline Data in Dashboard
**File:** `app/workspace/page.tsx` (lines 290-296)
**Change:** Remove `SPARKLINE_DATA` constant. Fetch real trends from updated dashboard API.
**File:** `app/api/partners/dashboard/route.ts`
**Change:** Add time-series data to response:
```typescript
// Import getMetricTimeSeries from analytics lib
// Add to response: trends: { products: number[], leads: number[], orders: number[], score: number[] }
// Each array has 7 values (last 7 days)
```
**Verification:** Dashboard shows real sparklines. New tenant shows flat lines (zeros), not fake upward trends.

---

## Task 1C: File Upload Persistence in Onboarding

### 1C-1: Upload Files to R2 on Step 2
**File:** `app/partners/join/page.tsx` (Step 2 — branding step)
**Change:** When user selects logo/banner, upload immediately to R2 via existing upload API
**Current behavior:** Files stored in browser memory, lost on refresh
**New behavior:** On file selection → upload to R2 → store URL in wizard state + localStorage
**API:** Use existing `/api/partners/upload` or create one if missing

### 1C-2: Add localStorage Progress Saving
**File:** `app/partners/join/page.tsx`
**Change:** After each step completion, save wizard state to localStorage key `novamente_onboarding_progress`
**Format:** `{ step: number, data: WizardData, updatedAt: ISO string }`
**On mount:** Check localStorage, if found and < 7 days old, offer to resume
**UI:** Show small banner "Tenés un registro sin terminar. ¿Querés continuar?" with Resume/Start Over buttons

### 1C-3: Resume Wizard from Last Completed Step
**File:** `app/partners/join/page.tsx`
**Change:** On resume, populate wizard state from localStorage and jump to saved step
**Edge case:** If tenant was already created (step 1 completed), verify tenant still exists via API before resuming

---

## Verification Checklist
- [ ] `/partners` FAQ schema shows $25/$100 prices
- [ ] Subscribe API uses dynamic Bluelytics rate
- [ ] Landing page shows ARS equivalent price
- [ ] `partner_analytics_events` table exists
- [ ] Storefront pages fire tracking events
- [ ] Dashboard sparklines show real data (zeros for new tenants)
- [ ] Onboarding wizard uploads persist to R2
- [ ] Wizard progress saves to localStorage
- [ ] Wizard can resume from last step
- [ ] `npx next build` passes
