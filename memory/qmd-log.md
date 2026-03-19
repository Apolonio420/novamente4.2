# QMD Log - novamente4.2

### [2026-03-18] Subscription Launch — 3 Batches Complete
**Goal**: Implement full subscription system: bug fixes, Telegram notifications, billing page, admin panel, legal pages, recurring payments, auto-suspend, dunning
**Done**:
- Fixed 5 bugs: upgrade modal init_point, brandingFull gate, support API 403, analytics button, support redirect
- Telegram notifications: notifyPartnerSubscription, notifyNewLead, notifySubscriptionExpiring, notifySubscriptionSuspended
- Billing page (/workspace/billing): plan info, subscription details, downgrade flow with feature loss warning, cancel flow
- Admin panel (/admin/partners): table with stats, plan/status management, auth-gated to admin emails
- Legal pages: Terms of Service (/partners/terms) + Privacy Policy (/partners/privacy), 10 sections each
- Subscribe API rewritten: supports billingCycle (monthly/annual), calculates expiration, saves subscription fields
- Webhook updated: extends expiration on payment, resets payment_failures, sends Telegram notification
- Cron endpoint (/api/cron/partners/check-subscriptions): grace period (3 strikes), auto-suspend, dunning notifications
- Usage warnings in dashboard with progress bars and upgrade CTAs
- Billing cycle toggle in onboarding wizard StepPlan + dynamic CTA pricing
- Updated types.ts with subscription fields, plans.ts with PLAN_PRICING_ANNUAL_USD
- 43 Playwright e2e tests written and passing
**Decisions**: Used managed renewal (cron + one-time MP payments) instead of MP PreApproval API due to complexity
**Blockers/Pending**: DB migration for subscription fields needs to be run in Supabase
**Next**: Run migration, deploy, test live subscription flow end-to-end

### [2026-03-18] Phase 4+5 — Meta Business Setup + Meta Ads Templates (Pro)
**Goal**: Build Meta Business setup wizard and Meta Ads template system for Pro partners
**Done**:
- Created `lib/partners/meta-pixel.ts` — generatePixelSnippet (fbevents.js base code) + generatePixelEvent (fbq track calls)
- Created `components/partners/meta-pixel-script.tsx` — Client component using next/script strategy="afterInteractive"
- Created `app/api/partners/meta-business/route.ts` — GET returns meta_setup_progress + meta_pixel_id; PATCH updates both; Pro-gated via getPlanFeatures
- Created `app/workspace/meta-business/page.tsx` — 5-step accordion wizard (Pixel, Facebook Page, IG Business, Business Suite, Product Catalog) with progress bar, locked state for non-Pro
- Created `lib/partners/ad-templates.ts` — 6 ad templates (showcase/carousel/story/collection/before_after/testimonial), generateAdCopy with 3 variants, getBudgetRecommendation by industry, getTargetingSuggestions
- Created `lib/partners/utm-generator.ts` — generateUtmUrl + generateMetaAdUtm (meta/paid_social convention)
- Created `app/workspace/meta-ads/page.tsx` — Template gallery (2x3 grid) + builder view (product selector, 3 copy variants, UTM link with copy button, download, budget recs, targeting suggestions, quick guide)
**Decisions**: Used `as unknown as Record<string, unknown>` for tenant meta fields not yet in Tenant type; budget recs are ARS-based per industry; UTM format uses tenant_slug + template_type as campaign name
**Blockers/Pending**: DB migration needed for `meta_pixel_id` TEXT and `meta_setup_progress` JSONB on tenants table
**Next**: Execute remaining phases or test meta flows

### [2026-03-18] Phase 7 — Onboarding Call Scheduling (Pro)
**Goal**: Build onboarding call booking system for Pro partners
**Done**:
- Created `lib/partners/calendar-invite.ts` — ICS file generator with ART timezone (UTC-3), 15min reminder alarm
- Created `lib/partners/onboarding-call.ts` — Service layer: createBooking, getBooking, cancelBooking using supabaseAdmin
- Created `app/api/partners/onboarding-call/route.ts` — GET/POST/DELETE with Pro-only gate via getPlanFeatures
- Created `app/api/partners/onboarding-call/ics/route.ts` — .ics download endpoint (Content-Type: text/calendar)
- Created `app/workspace/onboarding-call/page.tsx` — 3-state page: locked (non-Pro), booking form, confirmation card
- Workspace layout already had nav item + Phone icon (added in prior session)
**Decisions**: Auto-cancel previous pending/confirmed bookings on new booking; weekday-only validation (M-F); 30-day max window
**Blockers/Pending**: Need `partner_onboarding_calls` table migration in Supabase
**Next**: Run migration, test end-to-end flow

### [2026-03-13] Plan Selection + MercadoPago Payment for Partner Onboarding
**Goal**: Add plan selection step and MercadoPago payment to the partner onboarding wizard
**Done**:
- Added Step 7 "Plan" to wizard (`app/partners/join/page.tsx`): 3 plan cards (Starter/Growth/Pro) with features, radio-style selection, `selectedPlan` field in WizardData
- Updated wizard from 7 to 8 steps: Plan is step 7, Preview becomes step 8
- Modified activate button: Starter activates immediately, Growth/Pro redirects to MercadoPago checkout
- Created `app/api/partners/subscribe/route.ts`: Creates MP preference with USD→ARS conversion (1 USD = 1200 ARS), saves plan to tenant
- Created `app/api/partners/webhook/mercadopago/route.ts`: Handles MP payment notifications, activates tenant on approval, applies plan features
- Created `app/partners/payment/success/page.tsx`: Polls tenant status, shows activation confirmation or processing state
- Created `app/partners/payment/failure/page.tsx`: Error page with retry CTA
- Created `app/api/partners/onboarding/status/route.ts`: GET endpoint for success page polling
- Updated `app/api/partners/onboarding/route.ts`: Added step 7 (plan) and step 8 (publish), paid plans stay in onboarding until webhook confirms
**Decisions**: Used fixed USD_TO_ARS=1200 rate (hardcoded for now); external_reference format `partner_sub_{tenantId}_{timestamp}` for webhook matching; auto_return='approved' enabled for partners (unlike main checkout)
**Blockers/Pending**: None
**Next**: Test with real MercadoPago sandbox, consider adding recurring subscription support

### [2026-03-13] Agent Commerce Layer (Phase 6)
**Goal**: Build AI sales agent chatbot for Pro-tier partner storefronts
**Done**:
- Created `lib/partners/agent.ts` — service layer: getAgentConfig, processMessage (Gemini 2.5-flash chat), buildAgentContext (system prompt with tenant brand + catalog + commerce instructions), createAgentSession, getSessionMessages, getTenantSessions
- Created `migrations/create_agent_tables.sql` — agent_sessions + agent_messages tables with RLS
- Created `app/api/partners/agent/chat/route.ts` — public POST endpoint for visitor chat (validates Pro plan + chatbot feature)
- Created `app/api/partners/agent/sessions/route.ts` — GET auth-protected endpoint for workspace session list
- Created `app/api/partners/agent/sessions/[id]/route.ts` — GET auth-protected session detail with messages
- Created `components/partners/chat-widget.tsx` — floating chat bubble widget, mobile-first (full-screen mobile, 380x500 desktop), localStorage session persistence, typing dots animation, tenant-colored
- Created `app/workspace/chatbot/page.tsx` — dashboard for viewing agent conversations: metrics (total/active/today), session list with status dots, message transcript view
- Updated `app/p/[slug]/page.tsx` — conditionally renders ChatWidget for Pro plan tenants
- Updated `app/workspace/layout.tsx` — added Chatbot nav item with MessageSquare icon
**Decisions**: Used Gemini startChat() with history for multi-turn conversations; system prompt includes full product catalog with prices; commerce_mode drives CTA instructions; no external deps (inline SVGs for icons in widget)
**Blockers/Pending**: None
**Next**: Test with real Pro tenant, consider adding session close/export, message search

### [2026-03-13] Tenantize Design Engine (Phase 4)
**Goal**: Make the Design Engine work per-tenant with config-based restrictions
**Done**:
- Created `lib/partners/design-engine.ts` — service layer with getDesignConfig, getAvailableStyles, getAvailableGarments, validateDesignAccess, buildTenantPrompt, saveDesignAsset, getDesignAssets, updateDesignConfig
- Created `app/api/partners/design/generate/route.ts` — POST generates design via Gemini with tenant palette/forbidden colors/custom prompts applied, uploads to R2, saves to partner_assets
- Created `app/api/partners/design/mockup/route.ts` — POST creates garment mockup via Gemini, validates garment against tenant's allowed garments, uploads + saves
- Created `app/api/partners/design/config/route.ts` — GET returns config + filtered styles/garments + access info; PUT updates config (owner/operator only)
- Created `app/api/partners/design/assets/route.ts` — GET lists tenant's generated assets with type filter
- Created `app/workspace/design-engine/page.tsx` — full 'use client' design tool page: style grid selector, prompt textarea, garment/color/side selectors, generate + mockup buttons, gallery with type filter, lightbox, plan badge, disabled state with upgrade CTA
**Decisions**: Used discriminated union for DesignAccessResult; applied `(access as any).reason` to avoid TS narrowing issues in route handlers; effective mode is min(plan mode, tenant config mode)
**Blockers/Pending**: None
**Next**: Wire up workspace auth flow, test with real tenant

### [2026-03-13] SEO/Discovery system (Phase 5)
**Goal**: Build complete SEO infrastructure for Partners OS storefronts
**Done**:
- Created `app/p/sitemap.ts` — dynamic sitemap for all seo_indexable tenants + their published products (priority 0.8/0.6)
- Created `app/robots.ts` — allows all crawlers, references /p/sitemap.xml
- Created `app/p/[slug]/[product]/page.tsx` — product detail page with full SEO metadata, JSON-LD Product schema, image gallery, breadcrumb, related products, WhatsApp CTA
- Created `app/partners/directory/page.tsx` + `directory-filter.tsx` — public partner directory with client-side search/filter by industry, responsive 1/2/3 col grid
- Created `app/api/partners/catalog/public/route.ts` — public catalog API (no auth, GET ?slug=xxx)
- Added JSON-LD Organization schema to `app/p/[slug]/page.tsx` (existing storefront page)
**Decisions**: Used existing `[product]` folder name (not `[productSlug]`) since product cards already link to that route structure
**Blockers/Pending**: None
**Next**: Consider adding OG image generation, structured data for BreadcrumbList, or analytics tracking

### [2026-03-13] Connect workspace dashboard to real database data
**Goal**: Replace hardcoded placeholder values in workspace dashboard with real tenant data from Supabase
**Done**:
- Created `lib/partners/auth.ts` — shared auth helper (`getRequestTenant`) that extracts user from Bearer token or Supabase session cookie
- Created `app/api/partners/me/route.ts` — returns current user's tenant info (name, slug, logo, plan, email)
- Created `app/api/partners/dashboard/route.ts` — returns metrics (products count, leads this month, completeness score) + tenant metadata
- Converted `app/workspace/page.tsx` from server to client component with `useEffect` fetch
  - Real metrics from DB (products, leads, score)
  - Dynamic checklist based on tenant data (logo, description, products, branding, published)
  - Checklist items are clickable links to relevant workspace pages
  - Loading skeleton while fetching
  - Error state with retry button
  - Welcome message shows tenant name and plan badge
  - "Ver storefront" links to `/p/{slug}`
- Updated `app/workspace/layout.tsx` to fetch tenant info and show:
  - Tenant name in sidebar header (instead of "Mi Workspace")
  - Tenant logo or initial in sidebar
  - Tenant email in bottom user section
  - Tenant logo/name in top header
**Decisions**: Used `getAll()` on `NextRequest.cookies` (not `for...of`) for proper Next.js API compatibility
**Blockers/Pending**: None
**Next**: Wire up workspace auth flow (login/redirect if unauthenticated)
