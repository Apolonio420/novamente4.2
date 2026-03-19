# QMD Active - novamente4.2

**Project**: novamente4.2 (partner storefront platform)
**Branch**: N/A (no git)
**Last action**: Completed all 3 subscription launch batches + Playwright tests
**State**: All done — build passing, 43 e2e tests passing
**Blockers**: DB migration pending (subscription fields)

## Subscription Launch — COMPLETE

### Batch 1 (Fixes + Notifications) ✅
- [x] Fix upgrade modal (checkoutUrl → init_point)
- [x] Fix brandingFull gate (Starter locked, Growth+ full)
- [x] Fix support API plan validation (403 for Starter)
- [x] Fix analytics unlock button (onClick → /workspace/billing)
- [x] Fix support redirect (→ /workspace/billing)
- [x] Telegram notifications (subscription + lead + expiring + suspended)
- [x] Billing page in workspace (plan, status, dates, downgrade/cancel)

### Batch 2 (Professionalization) ✅
- [x] Admin panel for partners (/admin/partners)
- [x] Usage warnings in dashboard (progress bars, limits)
- [x] Downgrade/cancel flow (billing page)
- [x] Legal pages (ToS + Privacy)

### Batch 3 (Recurring Revenue) ✅
- [x] MP subscription with billing cycle (monthly + annual -15%)
- [x] Webhook updates (extends expiration on payment + Telegram)
- [x] Auto-suspend for non-payment + grace period (3 strikes)
- [x] Dunning flow (expiring notifications via Telegram)
- [x] Subscription check cron (/api/cron/partners/check-subscriptions)

### Extra
- [x] Billing cycle toggle in onboarding wizard (StepPlan)
- [x] CTA price reflects billing cycle
- [x] 43 Playwright e2e tests passing

## DB Migration Needed
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_failures INTEGER DEFAULT 0;
```

## All 8 Feature Phases COMPLETE (previous session)
1-8: Foundations, Analytics, Support, Meta Business, Meta Ads, Feed Export, Onboarding Call, Badge

## SEO/GEO Plan COMPLETE (previous session)
Fases 0-8 all implemented
