# Partners OS — Feature Implementation Roadmap

## Phase 1: Fix Foundations (Critical — blocks everything)
**Goal:** Pricing consistency, real dashboard data, file upload persistence

### 1A — Fix Pricing Inconsistencies
- Sync pricing across landing page, wizard, FAQ schema, subscribe API
- Source of truth: `PLAN_PRICING_USD` in `lib/partners/plans.ts`
- Fix hardcoded USD_TO_ARS rate → dynamic via Bluelytics API

### 1B — Real Dashboard Metrics
- Replace fake sparkline data with real time-series from Supabase
- Track: page views, unique visitors, lead conversions, orders over time
- Create `partner_analytics_events` table for event tracking
- Lightweight tracking pixel/middleware for storefront visits

### 1C — File Upload Persistence in Onboarding
- Logo/banner uploads → R2 immediately on Step 2
- Store URLs in tenant record
- Add localStorage progress saving across all steps
- Resume wizard from last completed step

---

## Phase 2: Analytics Dashboard (Growth: basic, Pro: advanced)
**Goal:** Partners can see how their storefront performs

### Basic Analytics (Growth)
- Storefront visits (daily/weekly/monthly)
- Lead conversion rate
- Top products by views
- Traffic sources (direct, search, social, referral)
- Geographic distribution (by province)

### Advanced Analytics (Pro)
- All of Basic +
- Funnel visualization (visit → product view → lead → order)
- Revenue tracking per period
- Customer demographics
- UTM campaign performance
- Export to CSV

---

## Phase 3: Support System (Growth: email, Pro: WhatsApp)
**Goal:** Partners can get help through their plan's support channel

### Email Support (Growth)
- Support ticket creation from workspace
- Ticket list with status (open, in_progress, resolved, closed)
- Email notifications on ticket updates (nodemailer)
- Admin view for Novamente team to respond

### WhatsApp Priority Support (Pro)
- Everything in email +
- Dedicated WhatsApp number for Pro partners
- Priority queue / SLA badge
- Direct WhatsApp link in workspace header

---

## Phase 4: Meta Business Setup (Pro)
**Goal:** Pro partners get guided Meta Business integration

### Implementation: Guided Setup Wizard (not API automation)
- Step-by-step wizard with screenshots
- Auto-generate Meta Pixel code snippet for their storefront
- Install pixel on partner's `/p/[slug]` pages automatically
- Facebook Page creation guide with brand assets
- Instagram Business linking guide
- Meta Business Suite walkthrough
- Checklist with completion tracking

---

## Phase 5: Meta Ads Templates (Pro)
**Goal:** Pro partners get ready-to-use ad creatives

### Implementation
- Ad creative generator using partner's product images + branding
- 6 template types: Product Showcase, Carousel, Story, Collection, Before/After, Testimonial
- Auto-fill ad copy with partner brand voice + product details
- Export as PNG/JPG for manual upload to Meta Ads Manager
- Recommended budgets and targeting by industry
- UTM parameter generator for campaign tracking

---

## Phase 6: Feed Export (Pro)
**Goal:** Pro partners can sync products to Google Shopping and Meta Commerce

### Google Shopping Feed
- Dynamic XML route: `/api/partners/feed/google/[tenantId]`
- Google Merchant Center format (RSS 2.0 with g: namespace)
- Required fields: id, title, description, link, image_link, price, availability, brand
- Auto-generated from partner's published products

### Meta Commerce Feed
- Dynamic TSV route: `/api/partners/feed/meta/[tenantId]`
- Facebook Commerce format (TSV with required columns)
- Same product data, different format
- Instructions for connecting feed URL in Meta Business Suite

---

## Phase 7: Onboarding Call (Pro)
**Goal:** Pro partners can book a 1:1 onboarding call

### Implementation
- Cal.com embed integration (free tier, or self-hosted)
- Embedded calendar in workspace dashboard
- Booking widget shows available slots
- Email confirmation + calendar invite
- Fallback: Simple form → WhatsApp/email scheduling

---

## Phase 8: Badge & Branding Control
**Goal:** `badgeRemovable` flag actually controls the "Powered by Novamente" badge

### Implementation
- Use `badgeRemovable` from `getPlanFeatures()` instead of hardcoded plan check
- Starter: badge always shows
- Growth/Pro: badge hidden

---

## Execution Order (Original Phases 1-8)

```
Phase 1 (Foundations) ← FIRST — quick fixes, high trust impact
├── Phase 2 (Analytics) ← Most valuable for Growth partners
├── Phase 3 (Support) ← Table stakes for any paid plan
├── Phase 8 (Badge fix) ← 5 minute fix
Then:
├── Phase 4 (Meta Business) ← Pro differentiator
├── Phase 5 (Meta Ads) ← Pro differentiator
├── Phase 6 (Feed Export) ← Pro differentiator
└── Phase 7 (Onboarding Call) ← Pro differentiator
```

---

## Phases 9-16: Gap Analysis & Completion (2026-03-18)

After implementing Phases 1-8, a gap analysis revealed that most features are **coded but incomplete**. Phases 9-16 address the remaining gaps.

### Phase 9: Analytics Dashboard — Gaps & Completion (HIGH)
- **Status:** Code is REAL (all queries, API, UI exist). Missing: event tracking pipeline, empty states
- **Key tasks:** Wire StorefrontTracker to fire events, empty state UI, seed script for testing
- **Plan:** `.planning/phases/09-analytics-gaps/09-PLAN.md`

### Phase 10: Support System — Notifications (MEDIUM)
- **Status:** CRUD is REAL. Missing: email/WhatsApp notifications, ticket detail page, admin UI
- **Key tasks:** Email on ticket creation, WhatsApp for Pro, admin support dashboard, conversation thread UI
- **Plan:** `.planning/phases/10-support-notifications/10-PLAN.md`

### Phase 11: Meta Business Setup — Gaps (MEDIUM)
- **Status:** Wizard UI is REAL. Missing: pixel injection into storefront, Meta event tracking, feed validation in setup
- **Key tasks:** Inject pixel via next/script, fire ViewContent/Lead events, pixel verification button
- **Plan:** `.planning/phases/11-meta-business-gaps/11-PLAN.md`

### Phase 12: Meta Ads Templates — Backend (MEDIUM)
- **Status:** UI is REAL, NO backend. Missing: API route, saved ads table, persistence
- **Key tasks:** Create partner_saved_ads table, CRUD API, "Mis Anuncios" tab, export functionality
- **Plan:** `.planning/phases/12-meta-ads-backend/12-PLAN.md`

### Phase 13: Feed Export — Gaps (LOW)
- **Status:** Fully implemented. Missing: slug-based URLs, Google taxonomy mapping, currency verification
- **Key tasks:** Switch URLs from UUID to slug, category mapping, currency format verification
- **Plan:** `.planning/phases/13-feed-export-gaps/13-PLAN.md`

### Phase 14: Onboarding Call — Gaps (LOW)
- **Status:** Fully implemented. Missing: admin notification, double-booking prevention, admin dashboard
- **Key tasks:** Telegram/email on booking, block booked slots, admin calls view
- **Plan:** `.planning/phases/14-onboarding-call-gaps/14-PLAN.md`

### Phase 15: Fix Pricing Inconsistencies + Dashboard Empty State (HIGH)
- **Status:** 3+ files have hardcoded prices duplicating plans.ts
- **Key tasks:** Consolidate all pricing to plans.ts imports, fix billing page duplicate, dashboard empty state
- **Plan:** `.planning/phases/15-pricing-consistency/15-PLAN.md`

### Phase 16: Fix File Upload Persistence in Onboarding (HIGH)
- **Status:** Blob URLs die on refresh, File objects not serializable, orphaned R2 files
- **Key tasks:** Filter blob URLs from localStorage, upload error/retry UI, R2 cleanup cron
- **Plan:** `.planning/phases/16-upload-persistence/16-PLAN.md`

### Execution Order (Phases 9-16)

```
HIGH PRIORITY (fix first):
├── Phase 15 (Pricing consistency) ← data integrity, blocks trust
├── Phase 16 (Upload persistence) ← data loss bug, blocks onboarding
├── Phase 9 (Analytics gaps) ← most visible partner feature
Then MEDIUM:
├── Phase 10 (Support notifications) ← needed for real support flow
├── Phase 11 (Meta Business gaps) ← Pro value prop
├── Phase 12 (Meta Ads backend) ← Pro value prop
Then LOW:
├── Phase 13 (Feed export gaps) ← mostly cosmetic fixes
└── Phase 14 (Onboarding call gaps) ← nice-to-have improvements
```

## Dependencies
- Phase 2 needs Phase 1B (analytics events table)
- Phase 5 uses Design Engine mockup API (already exists)
- Phase 6 uses catalog data (already exists)
- All Pro features need Phase 1A (correct pricing)
- Phase 9 depends on Phase 1B migration (APPLIED 2026-03-18)
- Phase 10, 11, 14 need email sending capability (nodemailer or Resend)
- Phase 12 needs new DB migration (partner_saved_ads table)
- Phase 15 is independent (can run first)
