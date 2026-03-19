# Phase 2: Analytics Dashboard
**Priority:** HIGH — most valuable feature for Growth partners
**Depends on:** Phase 1B (analytics events table + tracking)
**Tier gating:** Growth = basic, Pro = advanced

## What Must Be TRUE When Done

1. Growth partners see a real analytics dashboard with: visits, unique visitors, lead conversion rate, top products, traffic sources, geographic distribution
2. Pro partners see everything Growth gets PLUS: funnel visualization, revenue tracking, customer demographics, UTM campaign performance, CSV export
3. Analytics data comes from `partner_analytics_events` table (real data)
4. Dashboard respects plan tier — Starter sees "Upgrade to Growth" overlay
5. Charts use a lightweight library (recharts or similar, already in deps)

---

## Task 2-1: Create Analytics Data Layer
**New file:** `lib/partners/analytics-queries.ts`
**Functions (all take tenantId + dateRange):**
```typescript
// === BASIC (Growth+) ===
// getVisitStats(tenantId, days) → { total: number, unique: number, byDay: { date: string, total: number, unique: number }[] }
// getLeadConversionRate(tenantId, days) → { visits: number, leads: number, rate: number }
// getTopProducts(tenantId, days, limit = 10) → { productId: string, name: string, views: number, leads: number }[]
// getTrafficSources(tenantId, days) → { source: string, count: number, percentage: number }[]
//   Sources derived from referrer: 'direct', 'google', 'social', 'referral', 'other'
// getGeographicDistribution(tenantId, days) → { province: string, count: number }[]
//   Province from IP geolocation (MaxMind GeoLite2 or ipinfo.io free tier)

// === ADVANCED (Pro only) ===
// getFunnelData(tenantId, days) → { stage: string, count: number, dropoff: number }[]
//   Stages: page_view → product_view → lead_submit → order_created
// getRevenueByPeriod(tenantId, days) → { date: string, revenue: number, orders: number }[]
// getCustomerDemographics(tenantId, days) → { metric: string, breakdown: { label: string, count: number }[] }[]
// getUtmPerformance(tenantId, days) → { campaign: string, source: string, medium: string, visits: number, leads: number, conversion: number }[]
```

## Task 2-2: Create Analytics API Route
**New file:** `app/api/partners/analytics/route.ts`
**Implementation:**
- GET with query params: `?period=7d|30d|90d&section=basic|advanced`
- Auth: requires authenticated partner (use `getRequestTenant`)
- Gate: if `features.analytics === 'none'` → 403 with upgrade message
- Gate: if `features.analytics === 'basic'` and section=advanced → 403
- Response shape:
```json
{
  "period": "7d",
  "visits": { "total": 245, "unique": 180, "byDay": [...] },
  "conversion": { "visits": 245, "leads": 12, "rate": 4.9 },
  "topProducts": [...],
  "trafficSources": [...],
  "geographic": [...],
  "funnel": null,       // only for Pro
  "revenue": null,      // only for Pro
  "demographics": null,  // only for Pro
  "utmCampaigns": null   // only for Pro
}
```

## Task 2-3: Create Analytics Dashboard Page
**New file:** `app/workspace/analytics/page.tsx`
**Layout:**
- Period selector (7d / 30d / 90d) top right
- **Row 1:** 4 metric cards — Total Visits, Unique Visitors, Leads, Conversion Rate (with sparklines from Phase 1B)
- **Row 2:** Two columns
  - Left: Line chart — visits over time (byDay data)
  - Right: Donut chart — traffic sources breakdown
- **Row 3:** Two columns
  - Left: Bar chart — top 10 products by views
  - Right: Map/list — geographic distribution by province
- **Pro section (gated):**
  - Row 4: Funnel visualization (horizontal bar chart showing drop-off at each stage)
  - Row 5: Revenue line chart + UTM campaign performance table
  - Export CSV button (top right, Pro only)

**Starter overlay:** Full page blur overlay with lock icon + "Actualizá a Growth para ver analytics"
**Growth view:** Basic analytics, Pro sections show upgrade teaser (small, non-intrusive)

## Task 2-4: Add Chart Components
**New file:** `components/partners/analytics/visit-chart.tsx` — Line chart (visits over time)
**New file:** `components/partners/analytics/source-donut.tsx` — Donut chart (traffic sources)
**New file:** `components/partners/analytics/product-bar.tsx` — Horizontal bar chart (top products)
**New file:** `components/partners/analytics/funnel-chart.tsx` — Funnel visualization (Pro)
**New file:** `components/partners/analytics/revenue-chart.tsx` — Revenue line chart (Pro)
**New file:** `components/partners/analytics/utm-table.tsx` — UTM campaign table (Pro)
**Library:** Use recharts (check if already installed, if not add it)

## Task 2-5: CSV Export (Pro Only)
**New file:** `app/api/partners/analytics/export/route.ts`
**Implementation:**
- GET with `?period=7d|30d|90d`
- Gate: Pro only (`features.analytics !== 'advanced'` → 403)
- Returns CSV with Content-Type: text/csv, Content-Disposition: attachment
- Includes: date, visits, unique_visitors, leads, orders, revenue, top_source

## Task 2-6: Add Analytics Link to Workspace Navigation
**File:** `app/workspace/layout.tsx` or wherever the sidebar nav is defined
**Change:** Add "Analytics" link with BarChart3 icon, pointing to `/workspace/analytics`
**Badge:** Show plan tier indicator (e.g., "Growth" or "Pro") next to the link

---

## Verification Checklist
- [ ] `/workspace/analytics` loads for Growth partner with real data
- [ ] Period selector (7d/30d/90d) changes all charts
- [ ] Traffic sources donut shows correct breakdown
- [ ] Top products bar chart shows actual product views
- [ ] Pro partner sees funnel + revenue + UTM sections
- [ ] Starter partner sees upgrade overlay
- [ ] Growth partner sees Pro teaser (non-intrusive)
- [ ] CSV export works for Pro, returns 403 for Growth
- [ ] Analytics nav link appears in workspace sidebar
- [ ] Charts render correctly on mobile (responsive)
- [ ] `npx next build` passes
