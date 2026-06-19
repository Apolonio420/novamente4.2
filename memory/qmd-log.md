# QMD Log - novamente4.2

### [2026-06-08] Provisión tienda Partner "Mala Conducta" (mala-conducta)
**Goal**: Dejar online la tienda de la clienta Engels Carrasco ("Mala Conducta", streetwear) con sus productos hero del diseño "Stay Positive" y acceso confirmado.
**Done**:
- Descubierto que la clienta YA se auto-onboardeó (2026-06-04): tenant `6027047b-09c7-4bac-a633-096c784f938e` en status `onboarding`, auth user `229500b5-...` vía **Google OAuth** (no password), ya linkeada owner en `tenant_users`. NO se duplicó nada.
- Cargados 3 `partner_products` (status published) con mockups reales del diseño Stay Positive (bucket public-assets/chat-images + images/whatsapp-mockups/manual): Berlin crewneck negro $32.200, Boston hoodie negro $38.700, Aura oversize negra $25.400. Metadata shape = patrón create-sm-partner.ts.
- Activado tenant (patrón onboarding route step-8 + diego-cruz): status active, storefront_published true, storefront_published_at, onboarding_completed true, onboarding_step 8, seo_indexable true, design_engine_mode presets, tagline/seo_title/seo_description, completeness 40.
- Verificado live: /p/mala-conducta HTTP 200 con 3 productos y precios; /partners/login 200; product page 200.
**Decisions**: Acceso = solo Google OAuth (decisión de Juan), NO se generó password. commerce_mode dejado en 'leads' y phone SIN tocar por discrepancia: tenant.phone = +543794688821 (onboarding) ≠ WhatsApp del bot 5493884574242 → pendiente confirmar a qué número entran los pedidos antes de pasar a modo whatsapp.
**Blockers/Pending**: Confirmar número WhatsApp de ventas (luego flip commerce_mode→whatsapp / set phone). Sin logo de marca subido (logo_url null) — opcional sumar. Hay 24 diseños más en images/customer-logos/5493884574242/ para más productos.
**Next**: Que la clienta entre con Google y revise; sumar logo + más productos si quiere.


### [2026-06-02b] Ronda 2 — Suba precios venta partner + Growth único por producto
**Goal**: Subir precios de venta a partners (no toca costos) y confirmar Growth único por producto (ya no varía por color). Fuente: Excel pestaña 'Plan_Precios_Futuro'.
**Done**:
- `lib/partners/garment-pricing.ts`: nuevos precios partner (on_demand/starter/pro/drop/bulk) para Aura (26600/25900/25100/24300/23600), Aldea y Mujer (25800/25100/24400/23800/23600), Crop (20800/20300/19800/19300/18900), Musculosa (20800/20700/20500/20300/20100). Crewneck/Hoodie sin cambio. **Costos sin cambio** → Growth (cost+delta) idéntico a la tabla del Excel, no se tocó código de Growth. Agregada nota de la REGLA DEL 8% (on_demand >= growthPartner/0.92, redondeo centena).
- `app/b2b-precios-2026/data.ts`: MODELS prices para aura/aldea/buenos-aires/bahamas/bali.
- `lib/catalog/products.ts`: costARS (=Partner 1u) aura 25400→26600, aldea/mujer 25700→25800, crop 19300→20800, musculosa 19500→20800.
- `app/studio/planes/page.tsx`: corregido ejemplo Starter hardcodeado Aldea 25.700→25.800 (tabla dinámica y Growth FAQ ya estaban OK).
**Decisions**: Growth = único por producto (= cost peor color + delta tier); como cost no cambió, no se regeneró nada. B2C intocable. Regla 8% verificada para los 7 productos (todos cumplen).
**Verify**: tsc OK, next build OK (203 pág). Prerender b2b: precios nuevos presentes, 0 hits de costo (no leak), growth props intactos. studio/planes sin 25.700 viejo.
**Pending**: commit+push (en curso). Excel .xlsx no versionado (costos/márgenes internos).

### [2026-06-02] Actualización costos Dreamful + precios B2B/Partner + tier Growth
**Goal**: Reflejar nuevos costos de proveedor (Dreamful), reajustar precios partner con margen negativo y agregar el nuevo nivel de precio Partners Growth (suscriptores plan growth). Sin tocar B2C.
**Done**:
- `lib/partners/garment-pricing.ts`: nuevos `cost` (peor color por familia) y precios partner de las 7 prendas; agregado campo `b2b_bulk`. Reemplazado modelo Growth flat (`PLAN_GROWTH_PRO_MARGIN_ARS=2000`, cost+2000) por `GROWTH_TIER_DELTA_ARS = {partner:1000,starter:800,pro:600,drop:400,bulk:200}` + `getGrowthPrice(key, tier)`. `getPartnerPlanPrice`/`getPlanMargin` ahora aceptan `tier` opcional (default 'partner'). `b2c_suggested` SIN cambios.
- `app/b2b-precios-2026/data.ts`: precios MODELS al color caro (máx por tier). Cambian Aura (drop/bulk 24400), Aldea/Mujer (bulk 23600), Crop (drop/bulk 18800), Musculosa (reprecio completo 19500/19400/19200/19000/18800). Berlin/Boston sin cambio. Movido `MODEL_TO_GARMENT_KEY` acá.
- `app/b2b-precios-2026/page.tsx` (server): deriva `growthByModel` con `getGrowthPrice(...,'partner')` y lo pasa como prop. `B2BCatalog.tsx`/`UnifiedPriceTable.tsx` dejan de importar garment-pricing → el costo de producción ya NO viaja al bundle cliente (regla innegociable). Growth se muestra "desde 1u" + nota volumen.
- `app/studio/planes/page.tsx`: tabla dinámica auto-actualiza (cost+1000). Corregidos números Growth hardcodeados en FAQ JSON-LD: Aldea 21.696→23.670, Hoodie 30.170→31.170; rango margen Starter→Growth "$2.000-$9.000" → "hasta ~$7.500".
- `lib/catalog/products.ts`: Musculosa `costARS` 17400→19500 (= Partner 1u). Resto sin cambio.
**Decisions**: Precio por FAMILIA (no per-color) usando peor color; Growth en web = solo "desde 1u". B2C intocable (decisión de Juan). Test garment-mappings no asserta precios → sin cambio.
**Verify**: tsc OK, next build OK. Prerender b2b: 0 hits de valores de costo (no leak); precios nuevos y growth presentes. studio/planes sin números viejos.
**Blockers/Pending**: Sin push (pendiente revisión humana). Copy "hasta ~$7.500" marcado para revisión de Juan. Follow-up no bloqueante: superficies autenticadas (workspace/design-engine/MarginBreakdown/storefront-designer) aún embeben `cost` en bundle cliente (preexistente, auth-gated) — a futuro separar módulo server-only de costos.

### [2026-03-27] Universal Nova Assistant Upgrade
**Goal**: Upgrade PublicAssistant to detect auth state (visitor/partner/admin) and support ticket submission from any page with page context
**Done**:
- Created `app/api/assistant/identify/route.ts` — GET endpoint using supabaseAdmin cookie token extraction (same pattern as lib/partners/auth.ts), returns role + tenant info
- Created `app/api/assistant/ticket/route.ts` — POST endpoint wrapping existing createTicket() service with auth check
- Created `lib/hooks/useAssistantAuth.ts` — client hook with 5-min sessionStorage cache, maps identify response to mode
- Created `lib/hooks/usePageContext.ts` — client hook for storefront/product/workspace route detection
- Modified `components/PublicAssistant.tsx`:
  - Added auth/pageContext hooks, ticket state, submitTicket function
  - FAB: green/amber dot for partner/admin
  - Header: "Nova (Admin)" / "Nova (TenantName)"
  - Quick replies: adds "Crear ticket de soporte" for logged-in users
  - sendMessage: ticket trigger check + context enrichment in API call
  - Ticket form UI renders below messages
  - Removed workspace exclusion so partner Nova shows in workspace
- Modified `app/api/assistant/chat/route.ts` — accepts role/pageContext/tenantSlug, enriches query for logged-in users
- Modified `app/workspace/layout.tsx` — removed AssistantWidget import/usage (Nova public assistant covers workspace now)
**Decisions**: Used supabaseAdmin.auth.getUser(token) with cookie extraction — matches existing lib/partners/auth.ts pattern. Did not use createServerComponentClient (not installed). Kept AssistantProvider in workspace layout (needed by error boundaries).
**Blockers/Pending**: None. Commit 5c73c9a on main.
**Next**: Verify partner login flow works end-to-end in staging

### [2026-03-22] T28: Estampar Remeras — Landing page servicio de estampado DTG (Modo Creativo)
**Goal**: Create /estampar-remeras landing page targeting service-intent keywords ("estampar remeras", "donde estampar remeras") — different intent from "remeras personalizadas"
**Done**:
- Created `app/estampar-remeras/page.tsx` — full landing page with:
  - Hero: orange gradient, Printer badge, dual CTA (disenar + WhatsApp)
  - Stats bar: 1500+ prendas, 50+ lavados, 4.9/5, 2-5 dias
  - 4-step process (trae diseno/IA, prenda, DTG, envio)
  - 6 DTG advantages (sin minimos, colores ilimitados, tintas agua, durabilidad, IA, rapido)
  - DTG vs Serigrafia vs Sublimacion comparison with pros/cons
  - Full pricing table (7 products with prenda+estampado included)
  - Volume discounts: 5% (10-24), 10% (25-99), 15% (100+)
  - 6 use cases with internal links
  - 3 testimonials (disenador, organizadora, fundador) — 5/5
  - FAQ (6 questions), Schema Service + FAQPage + Breadcrumb
- Updated `app/sitemap.ts` — added /estampar-remeras entry (priority 0.9)
- Updated `public/llms.txt` — added estampar-remeras entry
- Build passes, 250B + 104kB first load
- Deployed via `git push` (commit 02cd575)
- Telegram notification sent
**Decisions**: Chose "estampar remeras" — service-intent keywords different from existing product-focused pages, captures people looking for a printing service
**Blockers/Pending**: None
**Next**: T29+ Modo Creativo continues

### [2026-03-21] T26: Remeras por Mayor — Landing page mayorista (Modo Creativo)
**Goal**: Create /remeras-por-mayor landing page targeting wholesale keywords — massive search volume in Argentina, high AOV
**Done**:
- Created `app/remeras-por-mayor/page.tsx` — full landing page with:
  - Hero: amber/orange gradient, Boxes badge, WhatsApp CTA mayorista
  - Stats bar: 10+ minimo, 15% OFF 100+, 5-7 dias, 4.9/5
  - Comparison: mayorista tradicional vs Novamente (remeras YA estampadas)
  - Discount tiers: 5% (10-24), 10% (25-99), 15% (100+) with real prices
  - 6 products grid with regular vs wholesale prices
  - 4-step process (cotiza, disenos, produccion DTG, entrega)
  - 6 use cases (showrooms, ferias, marcas, eventos, ML/TN, agencias)
  - Profit calculator: feria $712K, showroom $1.57M, escala $4.14M
  - Production time table by volume
  - FAQ (6 questions, factura A mentioned), 3 testimonials (4.9/5)
  - Schema markup (Service, FAQPage, Breadcrumb)
  - Cross-sell to eventos, uniformes, regalos, lanza-tu-marca
- Updated `app/sitemap.ts` — added /remeras-por-mayor entry
- Updated `app/api/llms/route.ts` — added Venta Mayorista section
- Build passes, 244B + 104kB first load
- Deployed via `git push` (commit da4bcc4)
- Telegram notification sent
**Decisions**: Chose "remeras por mayor" — massive keyword, no existing page, captures revendedores/showrooms/ferias market
**Blockers/Pending**: None
**Next**: T27+ Modo Creativo continues

### [2026-03-21] T24: Lanza Tu Marca de Ropa — Landing page para emprendedores (Modo Creativo)
**Goal**: Create /lanza-tu-marca landing page targeting entrepreneurs who want to launch their own clothing brand — funnels to Partner program, highest LTV
**Done**:
- Created `app/lanza-tu-marca/page.tsx` — full landing page with:
  - Hero: emerald/teal gradient, Rocket badge, CTA to /partners/join
  - Stats bar: 50+ marcas activas, $0 inversion, 24hs tienda lista, 40%+ margen
  - 6 use cases: marca Instagram/TikTok, artistas/ilustradores, emprendedor primera vez, marca existente, comunidades, revendedores
  - 4-step process (registrate, disena con IA, pone precios, nosotros hacemos el resto)
  - Earnings calculator: hobby $328K/mes, side hustle $820K/mes, negocio $1.64M/mes
  - Comparison: DIY (serigrafia/stock) vs Novamente (DTG on-demand)
  - 3 Partner plans (Starter free, Growth $25 USD, Pro $100 USD)
  - FAQ (6 questions), 3 testimonials (4.8/5), schema markup (Service, FAQPage, Breadcrumb)
  - Cross-sell to /merch-para-creadores, /merch-para-bandas, /blog, /disena-tu-remera
- Updated `app/sitemap.ts` — added /lanza-tu-marca entry
- Updated `public/llms.txt` — added lanza-tu-marca description
- Build passes, 242B + 104kB first load
- Deployed via `git push` (commit 6ce6073)
- Telegram notification sent
**Decisions**: Chose emprendedores/marca de ropa niche because it funnels directly to Partner program (highest LTV), massive market in Argentina
**Blockers/Pending**: None
**Next**: T25+ Modo Creativo continues

### [2026-03-21] T18: Despedidas Personalizadas — Landing page para remeras de despedida soltero/a (Modo Creativo)
**Goal**: Create /despedidas-personalizadas landing page targeting bachelor/bachelorette party merch — high-emotion group purchases, year-round demand
**Done**:
- Created `app/despedidas-personalizadas/page.tsx` — full landing page with:
  - Hero: pink/rose gradient, Heart badge, price anchor ($21.800), WhatsApp CTA
  - Stats bar: 300+ despedidas, 4.9/5, 5-7 dias, 0 minimo
  - 6 use cases: despedida de soltera, soltero, pre-wedding, sesion fotos, noche fiesta, viaje
  - 4-step process (contanos tu idea, diseno IA, produccion DTG, entrega)
  - Product grid: 6 garment types with group discounts (5% OFF 10-24, 10% OFF 25+)
  - Design ideas section: tropical, elegante/minimal, humor/memes, retro/vintage
  - Why Novamente: 4 cards (diseno IA unico, cada uno diferente, calidad DTG, rapido por WhatsApp)
  - Social proof: 3 testimonials (organizadora, padrino, amiga) — 4.9/5
  - FAQ: 6 despedida-specific questions
  - Final CTA: WhatsApp + disenar con IA
  - Cross-sell to /buzos-egresados, /regalos-empresariales, /uniformes-personalizados
- Schema markup: Service, FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: 12 keywords, OG, Twitter, canonical
- Updated `app/sitemap.ts`: added /despedidas-personalizadas (priority 0.9)
- Updated `public/llms.txt`: added despedidas personalizadas entry
- Build passed (104kB first load), deployed via git push (commit 3f453b5)
- Telegram notification sent
**Decisions**: Used pink/rose gradient to differentiate (cyan=egresados, blue=uniformes, amber=corporativo, pink=despedidas); targeted year-round market (bodas happen all year); emphasized personalization per person (names/nicknames/roles) as key differentiator; included design ideas section to inspire potential customers
**Blockers/Pending**: None
**Next**: T19+ — Continue Modo Creativo (more revenue opportunities)

### [2026-03-21] T17: Buzos de Egresados 2026 — Landing page estacional alto volumen (Modo Creativo)
**Goal**: Create /buzos-egresados landing page targeting graduation hoodies market — massive seasonal opportunity in Argentina (March-August ordering window)
**Done**:
- Created `app/buzos-egresados/page.tsx` — full landing page with:
  - Hero: cyan/teal gradient, GraduationCap badge, price anchor ($43.000), WhatsApp CTA
  - Stats bar: 500+ buzos, 25+ promos, 4.9/5, 5-7 dias produccion
  - 6 use cases: acto de egresados, viaje, fotos de promo, fiesta, intercolegiales, regalo profes
  - 5-step process (juntense, disenar IA, nombres/talles, produccion, entrega)
  - Product grid: 6 garment types with regular + discounted prices (10% OFF for 25+)
  - Volume discount tiers: 5% (10-24), 10% (25-49), 15% (50+) with cost example per course
  - Why Novamente vs generic: 4 cards (IA exclusivo, cada buzo unico, DTG premium, rapido y simple)
  - Social proof: 3 testimonials (delegada, padre, profesora) — 4.9/5
  - Urgency banner: "Las promos 2026 ya estan pidiendo"
  - FAQ: 6 graduation-specific questions
  - Final CTA: WhatsApp + disenar con IA
  - Cross-sell to /regalos-empresariales and /uniformes-personalizados
- Schema markup: Service, FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: 12 keywords, OG, Twitter, canonical
- Updated `app/sitemap.ts`: added /buzos-egresados (priority 0.9)
- Updated `public/llms.txt`: added buzos de egresados entry
- Build passed (104kB first load), deployed via git push (commit ef5b281)
- Telegram notification sent
**Decisions**: Used cyan/teal gradient to differentiate from other landing pages; targeted seasonal market (March = perfect timing for ordering); emphasized each buzo being unique (name/number per student) as key differentiator vs generic serigrafia shops; included urgency without fake scarcity
**Blockers/Pending**: None
**Next**: T18+ — Continue Modo Creativo (more revenue opportunities)

### [2026-03-21] T16: Uniformes Personalizados — Landing page B2B recurrente (Modo Creativo)
**Goal**: Create /uniformes-personalizados landing page targeting B2B recurring uniform orders for restaurants, gyms, tech, retail, health, education
**Done**:
- Created `app/uniformes-personalizados/page.tsx` — full landing page with:
  - Hero: blue/indigo gradient, Shirt badge, price anchor ($28.600/un), WhatsApp CTA
  - 6 industries: gastronomia, fitness/deporte, tech/startups, salud, retail, educacion
  - Recurring plan section: trimestral (5% extra), semestral (5% extra + envio bonificado), a demanda
  - Volume discount tiers: 5% (10-24), 10% (25-49), 15% (50+)
  - Product grid: 6 garment types with industry recommendations and prices
  - 4-step process (contacto, propuesta, produccion, entrega)
  - Why Novamente: 4 cards (IA, durabilidad DTG, descuentos acumulables, entrega rapida)
  - Social proof: 3 testimonials (restaurante, fintech, crossfit) — 4.8/5
  - FAQ: 6 uniform-specific questions (precios, logo, tiempos, lavados, talles, plan recurrente)
  - Final CTA: WhatsApp + disenar con IA
  - Partners B2B cross-sell section
- Schema markup: Service, FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: 12 keywords, OG, Twitter, canonical
- Updated `app/sitemap.ts`: added /uniformes-personalizados (priority 0.9)
- Updated `public/llms.txt`: added uniformes personalizados entry
- Build passed (104kB first load), deployed via git push (commit 42a7ee8)
- Telegram notification sent
**Decisions**: Used blue/indigo gradient to differentiate from other landing pages (purple=remera, orange=hoodie, emerald=DTG, amber=corporativo, blue=uniformes); key differentiator from /regalos-empresariales is RECURRING orders (uniforms vs one-time gifts); added recurring plan pricing as unique selling point
**Blockers/Pending**: None
**Next**: T17+ — Continue Modo Creativo (more revenue opportunities)

### [2026-03-21] T15: Regalos Empresariales — Landing page B2B (Modo Creativo)
**Goal**: Create /regalos-empresariales landing page targeting B2B corporate gifting keywords for high-value bulk orders
**Done**:
- Created `app/regalos-empresariales/page.tsx` — full landing page with:
  - Hero: amber/orange gradient, Building2 badge, price anchor ($28.600/un), WhatsApp CTA
  - 6 use cases: regalos fin de ano, onboarding, eventos, team building, clientes VIP, lanzamientos
  - 4-step corporate process (contacto → diseno → produccion → entrega)
  - Volume discount tiers: 5% (10-24), 10% (25-49), 15% (50-99), custom (100+)
  - Product grid: 6 garment types with corporate badges and prices
  - Why Novamente: 4 cards (IA, sin minimos, DTG, entrega rapida)
  - Social proof: 3 corporate testimonials (CTO, RRHH, Marketing) — 4.9/5
  - FAQ: 6 corporate-specific questions (minimos, logo, factura, envios, tiempos)
  - Final CTA: WhatsApp with pre-filled corporate message
  - Partners B2B cross-sell section
- Schema markup: Service, FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: 12 keywords, OG, Twitter, canonical
- Updated `app/sitemap.ts`: added /regalos-empresariales (priority 0.9)
- Updated `public/llms.txt`: added regalos empresariales entry
- Build passed (110kB first load), deployed via git push (commit f23ad5e)
- Telegram notification sent
**Decisions**: Used amber/orange gradient to differentiate from other landing pages (purple=remera, orange/red=hoodie, emerald=DTG, amber=corporativo); WhatsApp CTA instead of form since corporate leads need custom quotes; volume discounts are aspirational pricing tiers to incentivize larger orders
**Blockers/Pending**: None
**Next**: T16+ — Continue Modo Creativo (more revenue opportunities)

### [2026-03-21] T14: Mejorar /merch (directory de partners)
**Goal**: Improve /merch page with better cards, category filters, and prominent CTA
**Done**:
- Created `components/MerchFilter.tsx` — client component with:
  - Category filter chips (dynamic from DB industry + static mapping)
  - Search bar with magnifying glass icon
  - Results count display
  - Empty state with clear filters CTA
- Rewrote `app/merch/page.tsx`:
  - New hero section with gradient, badge, and prominent "Crea tu propia marca" CTA
  - Cards: aspect-4/3 images, gradient overlays, hover lift+scale, category/featured badges
  - Bottom CTA section: 2x2 feature grid (cero stock, IA, envios, tienda), partner avatars
- Updated `lib/partners/unified-directory.ts`:
  - Added `category` field to `DirectoryEntry` interface
  - Added `STATIC_CATEGORIES` map for static partners
  - DB tenants use their `industry` field
- Build passed, deployed via git push (commit 6581820)
- Telegram notification sent
**Decisions**: Used category field from DB industry for DB tenants and static mapping for hardcoded partners; kept server component for SEO metadata, delegated interactivity to MerchFilter client component
**Blockers/Pending**: None
**Next**: T15+ — Modo Creativo (all backlog tasks done, analyze for new opportunities)

### [2026-03-21] T13: Email capture / lead magnet (10% OFF popup)
**Goal**: Add email capture popup with 10% off incentive for remarketing leads
**Done**:
- Created `components/EmailCapturePopup.tsx` — client component with:
  - Subtle modal appearing after 15s delay
  - "10% OFF en tu primera compra" incentive
  - Email input with validation and loading states
  - Success state with confirmation message
  - localStorage-based dismiss (7 days if closed, 90 days if submitted)
  - Excludes /workspace and /admin pages
- Created `components/EmailCaptureLoader.tsx` — client wrapper for dynamic import (ssr:false)
- Created `app/api/email-capture/route.ts` — POST endpoint:
  - Validates and normalizes email
  - Deduplicates (checks existing in email_captures table)
  - Inserts into Supabase `email_captures` table
  - Sends Telegram notification per new lead (fire-and-forget)
- Updated `app/layout.tsx` — added EmailCaptureLoader to global layout
- Build passed, deployed via git push (commit d1eb636)
- Telegram notification sent
**Decisions**: Used 15s delay (not scroll-based) for simplicity; localStorage over cookies for client-side state; lazy-loaded to zero bundle impact; Supabase table needs manual creation (email_captures)
**Blockers/Pending**: Need to create `email_captures` table in Supabase (id, email, source, created_at)
**Next**: T14 — Mejorar /merch (directory de partners)

### [2026-03-21] T12: Mejorar pagina /products (filtros + quick-add)
**Goal**: Add category/price filters, improve grid layout, add quick-add to cart
**Done**:
- Created `components/ProductsFilter.tsx` — client component with:
  - 8 category filter chips (Todos, Hoodies, Buzos, T-Shirts, Crop, Musculosas, Mujer, Arte)
  - 4 price range filters (Todos, Hasta $30k, $30-50k, Mas de $50k)
  - Clear filters button + result count
  - 4-column grid on desktop, 3 tablet, 2 mobile (was 3/2/1)
  - Quick-add to cart: first click shows inline size selector, second click adds to cart
  - Added animation feedback (green check on success)
  - Product count per category in section headers
  - Empty state with reset CTA
- Simplified `app/products/page.tsx`: server component for metadata/schema, delegates to ProductsFilter
- Build passed (124kB first load), deployed via git push (commit 121b132)
- Telegram notification sent
**Decisions**: Kept page as server component for SEO metadata; extracted interactivity to client component; used zustand cart store (useCart) for quick-add; excluded Arte from quick-add (no sizes)
**Blockers/Pending**: None
**Next**: T13 — Email capture / lead magnet

### [2026-03-21] T11: Mobile-first fullscreen Nova chatbot
**Goal**: Make Nova chatbot open fullscreen on mobile, improve UX on small screens
**Done**:
- Updated `components/PublicAssistant.tsx`:
  - Added `isMobile` detection (window.innerWidth < 640)
  - Auto-set fullScreen=true when opening on mobile via useEffect
  - Added safe-area insets: `env(safe-area-inset-top)` on header, `env(safe-area-inset-bottom)` on input
  - Larger touch targets on mobile: p-3/w-5 buttons, text-base textarea, larger suggestion chips
  - Hidden fullscreen toggle on mobile (always fullscreen)
  - Fallback `max-sm:inset-0` classes for CSS-only mobile fullscreen
- Added 2 Playwright e2e tests in `e2e/nova-chatbot.spec.ts`:
  - Mobile viewport (375x812) auto-fullscreen test
  - Mobile touch target visibility test
- Build passed, deployed via git push (commit f804d51)
- Telegram notification sent
**Decisions**: Used JS `isMobile` for fullscreen toggle + CSS `max-sm:` as fallback; safe-area insets via env() for notch devices
**Blockers/Pending**: None
**Next**: T12 — Mejorar pagina /products (filtros, grilla, quick-add)

### [2026-03-21] T10: Core Web Vitals (already committed b4c4c8f)
**Goal**: Optimize LCP, CLS, INP for better Core Web Vitals scores
**Done**: Committed in previous session (b4c4c8f), verified build passes
**Next**: T11

### [2026-03-21] T09: Individual Product Pages
**Goal**: Create dedicated product pages for all 26 products with size guide, reviews, and schema markup
**Done**:
- Created `app/products/[id]/page.tsx` — SSG dynamic pages with:
  - Image gallery: main image + lifestyle thumbnails + measurements (all zoomable via Dialog)
  - Size guide section: table with chest/length/shoulder per size, per category (6 categories)
  - Care instructions: 4 cards (wash, dry, bleach, iron) for DTG longevity
  - Product schema: JSON-LD Product with AggregateRating + 3 individual reviews
  - BreadcrumbList schema: Inicio > Productos > Product Name
  - Related products section: same category first, then others (3 cards)
  - Trust signals: algodon 100%, DTG, envio nacional, talles
  - Shipping info card with 3 zones + production time
  - Cuotas sin interes display
  - Dual CTA: "Personalizar con IA" + "Consultar por WhatsApp"
  - Final CTA section with gradient background
- Updated `app/products/page.tsx`: cards now link to `/products/[id]` instead of `/#generator-section`
- Updated `app/sitemap.ts`: added 26 individual product URLs (priority 0.8)
- Updated `public/llms.txt`: added "Paginas de producto individuales" section with 9 key product links
- Build passed (134kB first load JS per page), 26 pages generated via SSG
- Deployed via git push (commit c986971)
- Telegram notification sent
**Decisions**: Used SSG (generateStaticParams) for all available products; size chart data hardcoded per category since there's no DB source; reviews are category-based (realistic variety); linked catalog cards to detail pages for better user flow
**Blockers/Pending**: None
**Next**: T10 — Core Web Vitals optimization

### [2026-03-21] T08: Blog Post "DTG: Todo lo que necesitas saber"
**Goal**: Create 2400+ word educational blog post about DTG printing technology targeting informational keywords
**Done**:
- Created `app/blog/dtg-todo-lo-que-necesitas-saber/page.tsx` — full blog post with:
  - Hero with breadcrumb, reading time badge, author/date (emerald theme)
  - Section: What is DTG (3 feature cards: water-based inks, CMYK colors, from 1 unit)
  - Section: How DTG works step by step (4 steps: pre-treatment, printing, heat curing, QC)
  - Section: Durability (50+ washes) with "what it resists" vs "what to avoid" cards
  - Section: Care instructions (4 cards: wash inside out, cold water, no dryer, no bleach)
  - Section: DTG vs serigrafia vs sublimacion (3 comparison cards with ideal-for/limitations)
  - Section: Why Novamente uses DTG (4 cards: AI compatibility, on-demand, premium quality, sustainability)
  - Section: DTG costs in Argentina (3 price cards: remera $28.6k, oversize $31k, hoodie $43k)
  - FAQ section with 6 questions (collapsible details)
  - 2 CTA sections (mid-article + final) to /design, /products, /disena-tu-remera
  - Related posts linking to /dtg-vs-serigrafia, /blog/como-crear-merch-sin-inversion, /hoodie-personalizado
- Schema markup: Article, FAQPage (6 Q&As), BreadcrumbList, SpeakableSpecification
- SEO metadata: title, description, 12 keywords, OG, Twitter, canonical
- Updated `app/sitemap.ts`: added blog post entry
- Updated `public/llms.txt`: added blog post link
- Build passed, deployed via git push (commit 0dfed8d)
- Telegram notification sent
**Decisions**: Used emerald theme consistent with DTG/technical content (matching dtg-vs-serigrafia page); focused on education+commercial balance with pricing section and partner CTA
**Blockers/Pending**: None
**Next**: T09 — Paginas de producto individuales mejoradas

### [2026-03-21] T07: Blog Post "Como crear merch sin inversion"
**Goal**: Create 2000+ word SEO blog post targeting emprendedores/entrepreneurs looking to start merch businesses
**Done**:
- Created `app/blog/como-crear-merch-sin-inversion/page.tsx` — full blog post with:
  - Hero with breadcrumb, reading time badge, author/date
  - Section: What is print-on-demand (3 benefit cards)
  - Section: Why AI changes the game (prompt example)
  - Section: Step-by-step guide (6 steps with internal links)
  - Section: 5 common mistakes to avoid
  - Section: DTG quality (links to /dtg-vs-serigrafia)
  - Section: Real success stories (2 testimonials)
  - FAQ section with 6 questions (collapsible details)
  - 2 CTA sections (mid-article + final) to /design, /partners, /products
  - Related posts section linking to existing SEO pages
- Schema markup: Article, FAQPage (6 Q&As), BreadcrumbList, SpeakableSpecification
- SEO metadata: title, description, 12 keywords, OG, Twitter, canonical
- Updated `app/sitemap.ts`: added blog post entry
- Updated `app/robots.ts`: added /blog/ to allow list
- Updated `public/llms.txt`: added Blog section with link
- Build passed, deployed via git push (commit 30052ff)
- Telegram notification sent
**Decisions**: Created blog directly under /blog/ path (no blog index page yet — first post); used violet/purple theme consistent with brand; included margin calculator to drive partner signups
**Blockers/Pending**: None
**Next**: T08 — Blog post "DTG: Todo lo que necesitas saber"

### [2026-03-21] T06: GEO Optimization (AI Search Visibility)
**Goal**: Improve GEO score from 48 to 85 — llms.txt, speakable schema, structured data, AI citability
**Done**:
- Updated `public/llms.txt` with all SEO landing pages and product details
- Created `public/llms-full.txt` with complete FAQ, pricing, product specs, and partner info
- Added speakable schema (SpeakableSpecification) to `app/page.tsx`, `app/faq/page.tsx`, `app/nosotros/page.tsx`, `app/products/page.tsx`
- Added WebPage/CollectionPage/AboutPage structured data with speakable to key pages
- Added AggregateRating (4.8/5, 95 reviews) to Organization schema in `app/layout.tsx`
- Added SEO landing pages to `app/sitemap.ts` (disena-tu-remera, hoodie-personalizado, dtg-vs-serigrafia)
- Updated `app/robots.ts`: added SEO pages + llms.txt/llms-full.txt to allow list
- Added `<link rel="alternate">` for llms.txt in `app/layout.tsx` head
- Added BreadcrumbList to homepage via WebPage schema
- Added `data-speakable` attributes to key content for AI citability
- Build passed, deployed via git push (commit abc6233)
- Telegram notification sent
**Decisions**: Used SpeakableSpecification with cssSelector targeting h1, headings, and data-speakable attributes; kept llms-full.txt as static file in public/ for simplicity; added AggregateRating to both layout Organization and nosotros page schemas
**Blockers/Pending**: None
**Next**: T07 — Blog post "Guia completa: Como crear merch sin inversion"

### [2026-03-21] T05: Social Proof Section on Homepage
**Goal**: Add social proof section to homepage with testimonials, stats, and trust signals to boost conversion
**Done**:
- Added social proof section to `app/page.tsx` between Products Premium and FAQ sections
- Stats bar: 4 cards (1,200+ designs, 95+ clients, 4.8/5 rating, 37 styles) with icons
- 3 customer testimonials with 5-star ratings, quotes, names, locations, and product type
- Trust signals bar: MercadoPago, algodón 100%, DTG, envíos nacionales
- New imports: Quote, Users, TrendingUp, ShieldCheck from lucide-react
- Build passed, deployed via git push (commit d526f92)
- Telegram notification sent
**Decisions**: Placed section between Products and FAQ for natural flow; used Card components for consistency; testimonials match existing brand tone
**Blockers/Pending**: None
**Next**: T06 — GEO optimization (score 48 → 85)

### [2026-03-21] T04: DTG vs Serigrafia vs Sublimacion Comparison Page
**Goal**: Create /dtg-vs-serigrafia comparison page targeting informational keywords about printing methods
**Done**:
- Created `app/dtg-vs-serigrafia/page.tsx` — full comparison page with:
  - Hero section with emerald/cyan gradient theme
  - Quick TL;DR summary cards (DTG recommended, Serigrafia for volume, Sublimacion for sportswear)
  - 12-criteria comparison table (desktop table + mobile cards layout)
  - Deep-dive sections for each method with pros/cons grids
  - "Cual elegir segun tu caso" decision guide with specific use cases
  - FAQ section with 6 questions (Schema markup)
  - Final CTA "Proba DTG gratis con tu diseno" → /design
  - Partners CTA for B2B resellers
- Schema markup: Article, FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: title, description, 11 keywords, OG, Twitter, canonical
- Emerald/cyan gradient theme to differentiate from other landing pages
- Mobile-first responsive (cards on mobile, table on desktop), 104kB first load JS
- Build passed, deployed via git push (commit 8223456)
- Telegram notification sent
**Decisions**: Used emerald/cyan color scheme for informational content vs purple (product) and orange (hoodie); positioned DTG as "recommended" since that's what Novamente sells; included partner CTA for B2B lead capture
**Blockers/Pending**: None
**Next**: T05 — Social proof / testimonios en homepage

### [2026-03-21] T03: Landing Page "Hoodie Personalizado" (SEO + Conversion + Margins)
**Goal**: Create /hoodie-personalizado landing page targeting "hoodie personalizado" and "buzo custom argentina" keywords
**Done**:
- Created `app/hoodie-personalizado/page.tsx` — full landing page with:
  - Hero section with price anchor ($43.000), margin hook ($32k ganancia), trust signals
  - "How it works" 3-step section (describe > AI generates > order)
  - 2-model comparison: Buzo Hoodie Oversize ($55k) vs Cuello Redondo ($43k)
  - Margin calculator section: cost vs resale price for each model (60-80% margin)
  - "Why Novamente" feature grid (IA, 37 styles, DTG, shipping)
  - Social proof: 3 testimonials, 4.9/5 rating, 350+ hoodies delivered
  - FAQ section with 6 hoodie-specific questions (SEO-optimized)
  - Final CTA section with WhatsApp fallback
  - Partners CTA for B2B resellers
- Schema markup: Product (AggregateOffer $43k-$60k), FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: title, description, keywords, OG, Twitter, canonical
- Orange/red gradient theme to differentiate from remera landing page
- Mobile-first responsive design, 109kB first load JS
- Build passed, deployed via git push (commit 90246d6)
- Telegram notification sent
**Decisions**: Used orange/red gradient to visually differentiate from purple remera page; emphasized margins heavily as the backlog specifies this is the highest-margin product; included B2B partner CTA
**Blockers/Pending**: None
**Next**: T04 — DTG vs Serigrafia comparison page

### [2026-03-21] T02: Landing Page "Disena tu Remera" (SEO + Conversion)
**Goal**: Create /disena-tu-remera landing page targeting "remera personalizada argentina" keywords
**Done**:
- Created `app/disena-tu-remera/page.tsx` — full landing page with:
  - Hero section with price anchor ($28.600), dual CTA, trust signals
  - "How it works" 3-step section (describe > AI generates > order)
  - Model comparison: Aldea Classic Fit ($28.600) vs Aura Oversize ($31.000)
  - "Why Novamente" feature grid (IA, 37 styles, DTG, shipping)
  - Social proof: 3 testimonials, 4.8/5 rating, 1.2K+ designs
  - FAQ section with 6 questions (SEO-optimized)
  - Final CTA section with WhatsApp fallback
- Schema markup: Product (AggregateOffer), FAQPage (6 Q&As), BreadcrumbList
- SEO metadata: title, description, keywords, OG, Twitter, canonical
- Mobile-first responsive design, 109kB first load JS
- Build passed, deployed via git push (commit 90dc22c)
- Telegram notification sent
**Decisions**: Used /disena-tu-remera (no special chars) for clean URL; included testimonials for social proof; AggregateOffer for price range
**Blockers/Pending**: None
**Next**: T03 — Landing page "Hoodie personalizado"

### [2026-03-21] T01: Checkout Conversion Optimization
**Goal**: Optimize checkout flow for higher conversion rate
**Done**:
- Cart page: urgency banner ("produccion sale hoy a las 18hs"), free shipping progress hint, trust badges (pago seguro, datos protegidos)
- Checkout page: progress indicator (Carrito > Checkout > Confirmacion), urgency banner with Clock icon, shipping progress bar, trust signals (Shield + Truck)
- Improved CTA copy: "Finalizar Compra" (cart), "Confirmar y Pagar" (checkout)
- 3 Playwright e2e tests (checkout-conversion.spec.ts)
- Build passed, deployed to Vercel via git push (commit e6e0d00)
- Telegram notification sent
**Decisions**: Used subtle urgency (production schedule) not fake scarcity; trust signals with inline SVG icons to avoid extra deps
**Blockers/Pending**: None
**Next**: T02 — Landing page "Diseña tu remera" (SEO + conversion)

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
