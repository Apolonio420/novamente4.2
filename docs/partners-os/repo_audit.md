# Repo Audit — novamente ecosystem

**Fecha:** 2026-03-13
**Repos auditados:** novamente4.2, novamente-platform, whatsapp-sales-bot

---

## 1. novamente4.2 (Frontend E-commerce + Design Engine)

**Stack:** Next.js 15.2.6, React 19, Tailwind 3.4, shadcn/ui, Supabase, Gemini AI, MercadoPago, Cloudflare R2
**Estado:** Producción (build passing)

### Rutas públicas

| Ruta | Función |
|------|---------|
| `/` | Homepage Novamente |
| `/design` | Generador de diseños con IA (Gemini) |
| `/design/[imageId]` | Detalle/customización de diseño |
| `/products` | Listado de productos (estático) |
| `/styles` | Showcase de estilos |
| `/cart` | Carrito de compras |
| `/checkout` | Flujo de checkout (info, envío, pago) |
| `/checkout/success\|cancel\|pending\|transfer` | Páginas post-pago |
| `/quote` | Generador de cotizaciones PDF |
| `/visualizador-custom` | Visualizador custom (drag & drop diseño sobre prenda) |
| `/merch` | **Listado de partners/marcas** |
| `/merch/[brand]` | **Storefront de marca partner** (productos, brand story) |
| `/merch/[brand]/[product]` | **Detalle de producto por partner** |
| `/merchs/join` | **Formulario de aplicación partner** |

### API Routes (25+)

| Área | Endpoints | Función |
|------|-----------|---------|
| Imágenes | `/api/generate-image`, `/api/generate-stamp`, `/api/generate-mockup`, `/api/magic-remove-bg`, `/api/remove-bg`, `/api/process-design`, `/api/apply-design`, `/api/optimize-prompt` | Generación y procesamiento de diseños |
| CRUD imágenes | `/api/images` (GET/POST/DELETE), `/api/images/[id]`, `/api/images/cleanup` | Gestión de imágenes |
| E-commerce | `/api/cart`, `/api/checkout`, `/api/checkout/transfer`, `/api/garments` | Carrito, checkout, prendas |
| Webhooks | `/api/webhooks/mercadopago`, `/api/webhooks/whatsapp` | Pagos, WhatsApp legacy |
| Partners | `/api/partners` (POST) | Aplicación de partner (Supabase + Telegram notify) |
| Meta | `/meta/catalog` (TSV) | Feed de catálogo para Meta Commerce |
| Utilidades | `/api/log`, `/api/proxy-image`, `/api/r2-public`, `/api/temp-image`, `/api/upload-receipt`, `/api/quote/pdf` | Logging, proxy, storage, PDF |

### Componentes principales

| Componente | Tipo | Reutilizable para Partners |
|-----------|------|---------------------------|
| `ImageGenerator` | Generador de diseños | SI — core del Design Engine |
| `DesignerShell` + `StickyStepper` | Shell del designer | SI — con tematización |
| `MockupComposer` | Composición diseño+prenda | SI — directo |
| `GarmentSelector` | Selector prenda/color/talle | SI — con catálogo dinámico |
| `MockupCanvas` | Canvas interactivo | SI — directo |
| `CartDrawer` + `CartBadge` | Carrito | SI — con aislamiento por tenant |
| `ProductCard` | Card de producto | SI — ya se usa en /merch |
| `JoinForm` | Formulario partner | SI — base del onboarding |
| `AutoScrollGallery` | Galería auto-scroll | SI — para landing partners |
| `Navbar` + `Footer` | Layout | PARCIAL — hardcoded Novamente branding |
| `AuthModal` | Login Google OAuth | SI — con tenant context |
| `CustomVisualizer/*` | Upload + MockupViewer | SI — componentes independientes |
| `ui/*` (shadcn) | 20+ componentes base | SI — totalmente reutilizables |

### Base de datos (Supabase)

| Tabla | Columnas clave | Tenant-ready |
|-------|---------------|--------------|
| `images` | id, url, prompt, user_id, storage_key, has_bg_removed | NO — sin tenant_id |
| `cart_items` | user_id, image_url, product_type, color, size, quantity, price | NO |
| `orders` | order_number, user_id, customer_*, payment_*, status, total | NO |
| `order_items` | order_id, product_type, mockup_url, design_position | NO |
| `partner_applications` | full_name, email, brand_name, instagram, status | PARCIAL — tiene datos de marca |

### Sistema de partners existente

**Estructura de datos (`src/data/partners.ts` — 993 líneas):**

```typescript
interface Partner {
  id: string           // slug (e.g. "falco")
  name, slogan, description, values, mission: string
  logo, banner: string // paths a assets
  instagramUrl?: string
  featured?: boolean
  products: Product[]  // catálogo inline
}

interface Product {
  id, name, price, priceLabel, category, brand: string
  colors: ProductColor[]  // {name, hex, images:{front,back,lifestyle[]}}
  sizes: string[]
  description, detailedDescription: string
  features: string[]
  sizing: Record<string, string>
}
```

**Partner activo:** FALCO (hoodie + remera, 4 colores, S-XL)
**Assets:** `/public/falco/`, `/public/partners/<slug>/`

### Integraciones externas

| Servicio | Uso | Credenciales |
|----------|-----|-------------|
| Gemini AI | Generación de imágenes, text, remove-bg | GEMINI_API_KEY |
| MercadoPago | Checkout, webhook de pagos | MP_ACCESS_TOKEN |
| Supabase | Auth (Google OAuth), DB, Storage | SUPABASE_* |
| Cloudflare R2 | Storage primario de imágenes | CLOUDFLARE_R2_* |
| Telegram | Notificaciones (apps partner, errores) | TELEGRAM_BOT_TOKEN* |
| Facebook Pixel | Analytics | Hardcoded |
| Meta Commerce | Feed TSV de catálogo | Vía /meta/catalog |

### Styling

- **Tailwind 3.4** con CSS variables (HSL)
- **Dark mode** (class-based)
- Colores Novamente: `novamente-blue` (#00BFFF), `novamente-purple` (#7000FF), `novamente-magenta` (#FF00FF)
- **Font:** Inter (Google Fonts)
- **shadcn/ui** como base de componentes

---

## 2. novamente-platform (Backend Admin + Bot Engine)

**Stack:** Next.js 16.1.6, React 19.2.3, Vitest, Supabase + @supabase/ssr, Gemini, MercadoPago, R2
**Estado:** 223 tests passing, 31 archivos de test, build passing

### Dashboard (`/dashboard/*`)

| Página | Función | Acceso |
|--------|---------|--------|
| `/dashboard` | Pools de conversaciones WhatsApp (sidebar + chat view) | Authenticated |
| `/dashboard/[phone]` | Chat individual con cliente | Authenticated |
| `/dashboard/designer` | Super Designer (37 estilos, generación IA, sessions) | Authenticated |
| `/dashboard/analytics` | Métricas (conversiones, revenue, handoff) | Admin only |
| `/dashboard/leads` | CRM de leads B2B (scraper, enricher, campaigns) | sambu@ y apolonio@ only |
| `/login` | Supabase Auth login | Public |

### API Routes (40+ endpoints)

| Área | Endpoints | Función |
|------|-----------|---------|
| Designer | `/api/admin/designer/{generate,mockup,remove-bg,styles,upload,sessions}` | Super Designer completo |
| Conversaciones | `/api/admin/conversations`, `/api/admin/conversations/[phone]/messages` | Pool de chats |
| Clientes | `/api/admin/customers/[phone]/{assets,generate-design,generate-mockup,send,send-url}` | Assets + acciones por cliente |
| Analytics | `/api/admin/analytics` | Métricas rolling 30 días |
| Leads | `/api/admin/leads/{*}`, `/api/admin/leads/campaigns/{*}` | CRM completo (13 rutas) |
| Cron | `/api/cron/leads/{scrape,enrich,outreach,score}` | Jobs programados |
| Pagos | `/api/checkout`, `/api/webhooks/mercadopago` | MercadoPago + fulfillment |
| Catálogo | `/api/admin/catalog` | Retorna catálogo desde config JSON |
| Tracking | `/api/leads/track/open` | Pixel de email (público) |

### Base de datos (14 tablas core)

| Tabla | Propósito | Registros típicos |
|-------|-----------|-------------------|
| `sace_sessions` | Estado conversacional (SACE v2) | 1 por cliente activo |
| `conversation_messages` | Historial de mensajes | Miles |
| `conversations` | Metadata de conversaciones | 1 por teléfono |
| `conversation_outcomes` | Resultados (sale/lost/recurring) | Post-análisis |
| `successful_examples` | Ejemplos exitosos para learning | Curados |
| `design_library` | Diseños con performance | Curados |
| `customer_assets` | Assets por cliente (logos, diseños, mockups) | Por conversación |
| `designer_sessions` | Sesiones del Super Designer | Por usuario admin |
| `designer_messages` | Mensajes del Designer | Por sesión |
| `whatsapp_orders` | Pedidos (con MP, envío, fulfillment) | Por venta |
| `leads` | Leads B2B (scrapeados/enriquecidos) | Por campaña |
| `lead_campaigns` | Campañas de outreach | Manuales |
| `lead_interactions` | Timeline de interacciones por lead | Por acción |
| `lead_scrape_jobs` | Jobs de scraping | Por ejecución |

### Auth & Roles

- **Supabase Auth** con middleware (`@supabase/ssr`)
- **2 roles:** admin, viewer (hardcoded en `ADMIN_EMAILS`)
- **Middleware protege:** `/dashboard/*` y `/api/admin/*`
- **Bot bypass:** header `x-bot-secret` + env `BOT_API_SECRET`
- **PROBLEMA:** No hay checks de rol en las API routes, solo en UI

### Sistema de diseño (Super Designer)

- **37 estilos artísticos** con thumbnails PNG
- **Prompt optimizer:** 400 chars max, fuerza output vectorial
- **Modelos:** NB2 (diseños), gemini-2.5-flash-image (mockups/stamps)
- **Sessions:** Persistidas en DB por usuario
- **Image attachment:** Soporte multimodal (FormData)
- **Variantes:** 2 estilos compatibles auto-generados

### Pricing Engine

- **Fuente:** `novamente_b2b_bot_config.json`
- **5 tiers:** on_demand, b2c_web, b2b_starter, b2b_pro, b2b_drop
- **Determinístico:** getPrice(productKey, mode, quantity) → PriceResult
- **8 productos** con pricing completo

### Fulfillment

- **Orquestador post-pago** (non-blocking)
- **Shipping:** Andreani API (pendiente credenciales) + fallback fijo (AMBA $5.5k, Interior $7k, Resto $9k)
- **Google Sheets:** Webhook a Apps Script
- **Image resolver:** customer_assets → conversation_messages fallback
- **Telegram notification:** Detalle completo de venta

---

## 3. whatsapp-sales-bot (Bot Conversacional)

**Stack:** Next.js 16.1.6, Gemini 2.0-Flash, Meta WhatsApp Cloud API, Supabase, R2
**Estado:** Producción

### Arquitectura

- **Motor:** SACE v2 (State And Conversation Engine)
- **Estados:** GREETING → QUALIFY → DESIGN → MOCKUP_CONFIG → MOCKUP_GEN → QUOTE → CLOSING → HUMAN_HANDOFF
- **IA:** Gemini 2.0-Flash con JSON schema (acciones determinísticas)
- **Debounce:** 10s window + dedup por wa_id
- **Handoff:** Flag manual_control para intervención humana

### Canales y mensajes

- **WhatsApp ONLY** (Meta Cloud API v22.0)
- **Tipos soportados:** text, image, audio (transcripción Gemini), video, document, sticker, reaction, location, contacts
- **Audio:** Descarga → base64 → Gemini transcribe → texto

### Platform Bridge (HTTP a novamente-platform)

| Función | Endpoint llamado | Modelo |
|---------|-----------------|--------|
| Diseño | `/api/admin/designer/generate` | NB2 |
| Mockup | `/api/admin/designer/mockup` | gemini-2.5-flash-image |
| Remove-bg | `/api/admin/designer/remove-bg` | Gemini |
| Checkout | `/api/checkout` | MercadoPago SDK |

### Ventas

- **B2C:** OFFER_B2C_PAYMENT → payment link directo (precios b2c_web)
- **B2B:** QUALIFY → DESIGN → QUOTE → CLOSING (precios por tier)
- **8 productos** con pricing inline en `CATALOG`
- **Order extraction:** Gemini parsea conversación → items estructurados

### Admin Dashboard (`/admin/dashboard`)

- Lista de conversaciones con pools
- Chat view con manual controls
- **Sin autenticación en API routes** (PROBLEMA de seguridad)

---

## 4. Inventario de módulos reutilizables

| Módulo | Ubicación | Reutilizable para Partners OS |
|--------|-----------|-------------------------------|
| Design Engine (37 estilos) | platform: `lib/designer/` | SI — core del Design Engine as a Service |
| Prompt Optimizer | platform: `lib/designer/prompt-optimizer.ts` | SI — parametrizable por partner |
| Garment Mapping | platform: `lib/mockup/garment-mapping.ts` | SI — extensible con prendas partner |
| Pricing Engine | platform: `lib/pricing/pricing-engine.ts` | SI — necesita catálogo por tenant |
| Order System | platform: `lib/bot/ai/order-*.ts` | SI — con tenant_id |
| Fulfillment | platform: `lib/fulfillment/` | SI — shipping configurable por partner |
| Lead System | platform: `lib/leads/` | SI — con aislamiento por tenant |
| SACE Engine | bot: `lib/sace/` | PARCIAL — necesita desacoplar de Novamente |
| Platform Bridge | bot: `lib/whatsapp/platform-bridge.ts` | SI — ya es HTTP |
| Payment Link | bot: `lib/payments/payment-link.ts` | SI — con catálogo dinámico |
| Product Card | 4.2: `components/ProductCard` | SI — ya multi-brand |
| Cart System | 4.2: `lib/db.ts` + CartDrawer | SI — con tenant context |
| Checkout Flow | 4.2: `app/checkout/` | SI — con branding dinámico |
| Partner storefront template | 4.2: `app/merch/[brand]/` | SI — base de storefront |
| shadcn/ui components | 4.2: `components/ui/` | SI — totalmente neutros |

---

## 5. Dependencias compartidas

| Paquete | novamente4.2 | platform | bot |
|---------|:---:|:---:|:---:|
| Next.js | 15.2.6 | 16.1.6 | 16.1.6 |
| React | 19 | 19.2.3 | 19.2.3 |
| @supabase/supabase-js | SI | SI | SI |
| @google/generative-ai | SI | SI | SI |
| mercadopago | SI | SI | - |
| @aws-sdk/client-s3 | SI | SI | SI |
| Tailwind | 3.4 | 4 | 4 |
| shadcn/ui | SI | SI | - |
| Zod | SI | SI | - |
| Zustand | SI | - | - |
| cheerio | - | SI | - |
| nodemailer | - | SI | - |
| playwright | - | SI | - |
