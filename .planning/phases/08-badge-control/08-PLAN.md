# Phase 8: Badge & Branding Control
**Priority:** LOW — 5 minute fix
**Depends on:** None
**Tier gating:** Starter = badge shows, Growth/Pro = badge hidden

## What Must Be TRUE When Done

1. "Powered by Novamente" badge visibility controlled by `features.badgeRemovable` flag
2. Starter storefronts show the badge (always)
3. Growth and Pro storefronts hide the badge
4. No hardcoded plan checks — uses `getPlanFeatures()` exclusively

---

## Task 8-1: Find and Fix Badge Logic
**File to search:** Storefront layout/page files (`app/p/[slug]/`)
**Current state:** Badge is likely hardcoded with `if (plan === 'starter')` or always shown
**Fix:**
```typescript
import { getPlanFeatures } from '@/lib/partners/plans'

const features = getPlanFeatures(tenant.plan)
// Show badge ONLY when badgeRemovable is FALSE (Starter)
{!features.badgeRemovable && (
  <div className="...">
    Powered by <a href="https://www.novamente.ar">Novamente</a>
  </div>
)}
```

## Task 8-2: Verify All Storefront Templates
Check all storefront rendering paths:
- `app/p/[slug]/page.tsx` — main storefront
- `app/p/[slug]/[product]/page.tsx` — product page
- Any shared layout in `app/p/[slug]/layout.tsx`

Ensure badge logic is consistent across all pages.

## Task 8-3: Add Badge Indicator in Workspace Settings
**File:** `app/workspace/settings/page.tsx`
**Change:** In the plan/branding section, show:
- Starter: "Tu storefront muestra el badge 'Powered by Novamente'. Actualizá tu plan para removerlo."
- Growth/Pro: "El badge de Novamente está oculto en tu storefront." (green check)

---

## Verification Checklist
- [ ] Starter storefront shows "Powered by Novamente" badge
- [ ] Growth storefront does NOT show badge
- [ ] Pro storefront does NOT show badge
- [ ] Badge logic uses `features.badgeRemovable`, not hardcoded plan check
- [ ] Settings page shows correct badge status per plan
- [ ] `npx next build` passes
