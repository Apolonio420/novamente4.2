# Phase 5: Meta Ads Templates (Pro)
**Priority:** MEDIUM — Pro differentiator
**Depends on:** None (uses existing product/tenant data)
**Tier gating:** Pro only

## What Must Be TRUE When Done

1. Pro partners can generate ad creatives from their product images + branding
2. 6 template types available: Product Showcase, Carousel, Story, Collection, Before/After, Testimonial
3. Ad copy auto-generated using brand voice + product details
4. Creatives exportable as PNG/JPG for manual upload to Meta Ads Manager
5. Recommended budgets and targeting suggestions per industry
6. UTM parameter generator for campaign tracking

---

## Task 5-1: Create Ad Template System
**New file:** `lib/partners/ad-templates.ts`
**Implementation:**
```typescript
type AdTemplateType = 'showcase' | 'carousel' | 'story' | 'collection' | 'before_after' | 'testimonial'

interface AdTemplate {
  type: AdTemplateType
  name: string
  description: string
  dimensions: { width: number; height: number } // in px
  format: 'feed' | 'story' | 'reels'
  slots: { label: string; type: 'image' | 'text' | 'color' }[]
}

// 6 templates:
// 1. Product Showcase: Single product hero (1080x1080) — large product image, brand name, CTA
// 2. Carousel: Multi-product (1080x1080 x 3-5 slides) — one product per slide with price
// 3. Story: Vertical format (1080x1920) — full-screen product with swipe-up CTA
// 4. Collection: Grid layout (1080x1080) — 4 products in a grid with brand header
// 5. Before/After: Split view (1080x1080) — plain garment vs branded design
// 6. Testimonial: Quote overlay (1080x1080) — customer quote over product image

// generateAdCopy(template, tenant, product) → { headline, primaryText, description, cta }
//   Uses tenant.name, product.name, product.price, tenant.industry for context
//   Multiple variants per template (3 options to choose from)
```

## Task 5-2: Create Ad Creative Generator
**New file:** `lib/partners/ad-creative-generator.ts`
**Implementation:**
- Takes template type + tenant data + selected product(s)
- Uses HTML Canvas (via `@napi-rs/canvas` or browser Canvas) to compose the ad image
- Layers: background color (tenant.primary_color) → product image → text overlays → CTA button → brand logo
- For carousel: generates array of images
- Output: base64 PNG or Buffer for download
- **Alternative approach:** Use HTML→image conversion with a hidden div + html2canvas, rendered server-side

**Approach decision:** Server-side canvas generation is more reliable. Use `@napi-rs/canvas` (already in webpack externals in next.config.mjs) or a simpler approach with sharp for image compositing.

## Task 5-3: Create Ad Creative API Route
**New file:** `app/api/partners/ad-creative/route.ts`
- POST: `{ templateType, productIds, customText?, variants? }`
- Gate: Pro only (`features.metaAdsTemplates`)
- Returns: `{ images: [{ url: string, copy: { headline, primaryText, description } }] }`
- Images uploaded to R2 for download

**New file:** `app/api/partners/ad-creative/[id]/download/route.ts`
- GET: returns the generated image as PNG/JPG for download

## Task 5-4: Create UTM Generator
**New file:** `lib/partners/utm-generator.ts`
```typescript
// generateUtmUrl(baseUrl, params: { source, medium, campaign, content?, term? }) → string
// generateMetaAdUtm(tenant, templateType, productId?) → full URL with UTM params
// Presets per ad type:
//   source: 'facebook' | 'instagram'
//   medium: 'cpc' | 'social'
//   campaign: auto-generated from tenant slug + template type
```

## Task 5-5: Create Meta Ads Dashboard Page
**New file:** `app/workspace/meta-ads/page.tsx`
**Layout:**

**Section 1: Template Gallery**
- 6 template cards (2x3 grid) with preview mockup, name, description
- Each card has "Crear anuncio" button

**Section 2: Creative Builder (after selecting template)**
- Left panel: Product selector (dropdown/grid of partner's products)
- Center: Live preview of the ad creative
- Right panel:
  - Auto-generated ad copy (3 variants, click to select)
  - Edit fields: headline, primary text, description
  - UTM link auto-generated below
- Bottom: "Descargar PNG" button + "Copiar copy" button

**Section 3: Recommendations**
- Budget recommendations by industry:
  - "Para {industry}, recomendamos empezar con $X/día en Meta Ads"
  - Targeting suggestions: age range, interests, location
- Quick guide: "Cómo subir tu anuncio a Meta Ads Manager" (3 steps)

**Section 4: Generated History**
- List of previously generated creatives with thumbnails
- Re-download or regenerate

## Task 5-6: Workspace Navigation Link
- Add "Meta Ads" link in workspace nav
- Pro: accessible, Growth/Starter: locked with Pro badge

---

## Verification Checklist
- [ ] Pro partner can access `/workspace/meta-ads`
- [ ] All 6 template types generate valid images
- [ ] Ad copy is contextual (uses tenant name, product details)
- [ ] PNG downloads work and have correct dimensions
- [ ] UTM links auto-generated with correct params
- [ ] Budget recommendations show for partner's industry
- [ ] Non-Pro partners see upgrade prompt
- [ ] Images render correctly (product images, logo overlay, text)
- [ ] `npx next build` passes
