# Phase 15: Fix Pricing Inconsistencies + Dashboard Fake Data
**Priority:** HIGH — data integrity issue across multiple files
**Depends on:** None
**Status:** Multiple hardcoded price values conflict with lib/partners/plans.ts

## Current State

**The single source of truth** for pricing is `lib/partners/plans.ts`:
- Starter: $0
- Growth: $25/mo, $255/yr ($21.25/mo annual)
- Pro: $100/mo, $1020/yr ($85/mo annual)

**Problem:** At least 3 files duplicate these values as hardcoded literals:

### Issue A: `app/partners/join/page.tsx`
- Line ~1263: `const annualPrice = plan.id === 'growth' ? '$21' : plan.id === 'pro' ? '$85' : null`
  - Should be: `$${PLAN_PRICING_MONTHLY_FROM_ANNUAL[plan.id]}`
- Line ~2016: Hardcoded CTA prices `'21' : '25'` and `'85' : '100'`
  - Should derive from plans.ts constants
- `PLAN_CARDS` array (line ~1158): Hardcodes `"$25 USD /mes"`, `"$100 USD /mes"`
  - Should use `PLAN_PRICING_USD[planId]`

### Issue B: `components/partners/upgrade-modal.tsx`
- Lines ~40, ~63: `priceMonthly: 25`, `priceAnnualMonth: 21.25`, `priceMonthly: 100`, `priceAnnualMonth: 85`
  - Should import from plans.ts

### Issue C: `app/workspace/billing/page.tsx`
- Lines ~75-102: Local `PLAN_FEATURES` object duplicates what's in plans.ts
- Description typo: "mas" vs "más" (missing accent)
- Should import `PLAN_FEATURES`, `PLAN_PRICING_USD`, etc. from plans.ts

### Issue D: Dashboard shows zeros for new tenants
- `/workspace` dashboard sparklines show flat zeros with no helpful context
- Should show "Sin datos aún" or sample data to help partners understand the dashboard

---

## What Must Be TRUE When Done

1. ALL pricing references derive from `lib/partners/plans.ts` — NO hardcoded price literals anywhere
2. Changing a price in plans.ts updates it everywhere: onboarding, billing, upgrade modal, subscribe API
3. Dashboard shows meaningful empty state for new tenants (not confusing zeros)
4. No duplicate PLAN_FEATURES definitions — single import from plans.ts
5. All text consistent (accents, descriptions)

---

## Task 15-1: Export Pricing Helpers from plans.ts

**File:** `lib/partners/plans.ts`

Add utility functions:
```typescript
export function getMonthlyPrice(plan: Plan): number {
  return PLAN_PRICING_USD[plan]
}

export function getAnnualMonthlyPrice(plan: Plan): number {
  return PLAN_PRICING_MONTHLY_FROM_ANNUAL[plan]
}

export function getAnnualPrice(plan: Plan): number {
  return PLAN_PRICING_ANNUAL_USD[plan]
}

export function formatPriceLabel(plan: Plan, cycle: 'monthly' | 'annual'): string {
  if (plan === 'starter') return 'Gratis'
  const price = cycle === 'annual' ? getAnnualMonthlyPrice(plan) : getMonthlyPrice(plan)
  return `$${Math.round(price)} USD /mes${cycle === 'annual' ? ' (anual)' : ''}`
}
```

---

## Task 15-2: Fix Onboarding Wizard Pricing

**File:** `app/partners/join/page.tsx`

1. Import `PLAN_PRICING_USD`, `PLAN_PRICING_MONTHLY_FROM_ANNUAL`, `PLAN_NAMES`, `PLAN_DESCRIPTIONS` from plans.ts
2. Replace `PLAN_CARDS` hardcoded prices with dynamic values:
   ```typescript
   price: plan === 'starter' ? 'Gratis' : `$${PLAN_PRICING_USD[plan]} USD /mes`
   ```
3. Replace annual price calculation:
   ```typescript
   const annualPrice = PLAN_PRICING_MONTHLY_FROM_ANNUAL[data.selectedPlan]
   ```
4. Replace CTA button price:
   ```typescript
   const displayPrice = data.billingCycle === 'annual'
     ? Math.round(PLAN_PRICING_MONTHLY_FROM_ANNUAL[data.selectedPlan])
     : PLAN_PRICING_USD[data.selectedPlan]
   ```

---

## Task 15-3: Fix Upgrade Modal Pricing

**File:** `components/partners/upgrade-modal.tsx`

1. Import pricing constants from plans.ts
2. Replace hardcoded `priceMonthly` and `priceAnnualMonth` with:
   ```typescript
   priceMonthly: PLAN_PRICING_USD[planId],
   priceAnnualMonth: PLAN_PRICING_MONTHLY_FROM_ANNUAL[planId],
   ```

---

## Task 15-4: Fix Billing Page Duplication

**File:** `app/workspace/billing/page.tsx`

1. Import `PLAN_FEATURES`, `PLAN_NAMES`, `PLAN_DESCRIPTIONS`, `PLAN_PRICING_USD` from plans.ts
2. Remove local `PLAN_FEATURES` duplicate object
3. Fix description accent: "más" not "mas"
4. Use imported constants for all feature lists and pricing displays

---

## Task 15-5: Dashboard Empty State

**File:** `app/workspace/page.tsx` (main dashboard)

When all sparkline values are 0:
- Show friendly empty state per metric card:
  - Products: "Agregá productos a tu catálogo" with link to `/workspace/catalog`
  - Leads: "Compartí tu storefront para recibir consultas" with copy URL button
  - Analytics: "Las métricas aparecen cuando tu storefront reciba visitas"
- Sparkline still renders but with a subtle "Sin datos" label
- Don't show fake/random data — real zeros are honest

---

## Verification Checklist
- [ ] Change Growth price in plans.ts → reflected in onboarding wizard
- [ ] Change Growth price in plans.ts → reflected in upgrade modal
- [ ] Change Growth price in plans.ts → reflected in billing page
- [ ] Change Growth price in plans.ts → reflected in subscribe API amount
- [ ] No `grep -r "\\$25" --include="*.tsx"` hits outside plans.ts (except comments)
- [ ] No `grep -r "\\$100" --include="*.tsx"` hits outside plans.ts (except comments)
- [ ] Dashboard shows helpful empty state for new tenant with 0 data
- [ ] All descriptions use "más" not "mas"
- [ ] `npx next build` passes
