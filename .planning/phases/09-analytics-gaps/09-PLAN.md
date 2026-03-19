# Phase 9: Analytics Dashboard — Gaps & Completion
**Priority:** HIGH — core value prop for Growth/Pro partners
**Depends on:** Migration applied (partner_analytics_events table EXISTS)
**Status of existing code:** REAL — all queries, API, and UI implemented

## Current State

The analytics system is **fully coded** and hits real DB:
- `lib/partners/analytics.ts` — trackEvent(), getMetricTimeSeries(), getDashboardTrends()
- `lib/partners/analytics-queries.ts` — 7 query functions (visits, conversion, top products, traffic, funnel, UTM)
- `app/api/partners/analytics/route.ts` — GET with period + plan gating
- `app/api/partners/analytics/export/route.ts` — CSV export (Pro)
- `app/workspace/analytics/page.tsx` — Full recharts UI with plan gating

**Problem:** No data flows in. Analytics events are only tracked if the storefront pages call `trackEvent()`. Need to verify the tracking pipeline works end-to-end.

---

## What Must Be TRUE When Done

1. Every storefront page view fires a `page_view` event to `partner_analytics_events`
2. Every product view fires a `product_view` event
3. Every lead submission fires a `lead_submit` event
4. Every order creation fires an `order_created` event
5. Dashboard `/workspace` shows real sparkline trends (not zeros)
6. Analytics page `/workspace/analytics` renders real charts with period selector
7. New storefronts with 0 data show a friendly empty state (not broken charts)
8. Starter plan sees upgrade overlay, Growth sees basic, Pro sees advanced

---

## Task 9-1: Verify & Fix Storefront Event Tracking

**Check files:**
- `app/merch/[brand]/page.tsx` — must call `trackEvent('page_view')` on mount
- `app/merch/[brand]/[product]/page.tsx` — must call `trackEvent('product_view')`
- `app/api/partners/leads/route.ts` — must call `trackEvent('lead_submit')` on POST
- `app/api/partners/orders/route.ts` — must call `trackEvent('order_created')` on POST

**If missing:** Add a `<StorefrontTracker tenantId={tenant.id} />` client component that:
- Sends `navigator.sendBeacon('/api/partners/track', payload)` on mount
- Payload: `{ tenantId, eventType, eventData: { page, slug }, referrer, visitorId }`
- visitorId: stored in localStorage `nvm_vid` (random UUID, persisted)

**API endpoint:** `app/api/partners/track/route.ts`
- POST: validates tenantId exists, calls `trackEvent()` with request metadata
- No auth required (public tracking endpoint)
- Rate limit: skip if identical event within 1 second (simple dedup)

---

## Task 9-2: Empty State for Analytics

**File:** `app/workspace/analytics/page.tsx`

When API returns all zeros (no events yet), show:
- Illustration + message: "Todavía no hay datos de analytics"
- Subtitle: "Compartí tu storefront para empezar a ver métricas"
- CTA: Copy storefront URL button
- Do NOT show empty charts (confusing)

Check: recharts handles empty data gracefully? If not, conditionally render.

---

## Task 9-3: Dashboard Sparklines Real Data

**File:** `app/workspace/page.tsx` (main dashboard)

Verify it calls `/api/partners/dashboard` which uses `getDashboardTrends()`.
Ensure sparklines render with real data and show "Sin datos aún" when all zeros.

---

## Task 9-4: Seed Test Events (Dev Only)

**New file:** `scripts/seed-analytics.ts` (NOT deployed)

Script that inserts 30 days of fake events for a given tenantId:
- 50-200 page_views/day (random)
- 5-20 product_views/day
- 1-5 lead_submits/day
- 0-2 order_created/day
- Varied referrers (google, instagram, direct)
- Varied visitor_ids

Purpose: Test charts look good before real traffic arrives.
Run: `npx tsx scripts/seed-analytics.ts <tenantId>`

---

## Verification Checklist
- [ ] Visit `/merch/{slug}` → event appears in `partner_analytics_events`
- [ ] Visit `/merch/{slug}/{product}` → product_view event logged
- [ ] Submit lead → lead_submit event logged
- [ ] `/workspace/analytics` shows real charts after seeding
- [ ] Period selector (7d/30d/90d) works
- [ ] Empty state shows when no data
- [ ] Starter sees upgrade overlay
- [ ] Pro sees funnel + UTM sections
- [ ] CSV export downloads with real data
- [ ] Dashboard sparklines show real trends
- [ ] `npx next build` passes
