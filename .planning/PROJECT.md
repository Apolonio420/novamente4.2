# Partners OS — Complete Feature Implementation

## Vision
Make every feature promised in the Novamente Partners pricing page real and functional. Partners paying $25-100 USD/month should receive genuine value — not placeholder features.

## Context
- **Platform:** Next.js 15.2.6 + Supabase + Tailwind + shadcn/ui
- **Current state:** 5 of 19 plan features are implemented (26%)
- **Stack:** Supabase Auth, Supabase Postgres, Cloudflare R2, MercadoPago, Meta WhatsApp API
- **Three plans:** Starter (free), Growth ($25/mo), Pro ($100/mo)
- **Partners get:** Branded storefront at `/p/[slug]`, product catalog, lead capture, design engine, chatbot (Pro)

## What Must Be TRUE When Done
1. Every feature listed on `/partners` pricing page is real and functional
2. Growth partners ($25) get: real analytics dashboard, real email support, real SEO
3. Pro partners ($100) get: everything in Growth + Meta Business setup guide, ad templates, product feed export, onboarding call booking, WhatsApp priority support, advanced analytics
4. Pricing is consistent everywhere (landing, wizard, FAQ schema, backend)
5. Dashboard shows real metrics with real sparkline trends
6. Onboarding wizard persists file uploads and progress
7. No fake data anywhere

## Key Files
- `lib/partners/plans.ts` — Feature matrix (source of truth)
- `lib/partners/types.ts` — All TypeScript interfaces
- `app/partners/page.tsx` — Landing page with pricing
- `app/partners/join/page.tsx` — 8-step onboarding wizard
- `app/workspace/` — Partner dashboard
- `app/p/[slug]/` — Public storefront
- `app/api/partners/` — All partner API routes
