# Partners OS — Migration Plan

**Fecha:** 2026-03-13 (actualizado con pricing tiers)
**Decisión arquitectónica principal:** Partners OS se construye DENTRO de novamente4.2 como módulo separado, no como app nueva.

---

## Pricing Tiers

### Starter (Free)
- Storefront con template estándar (sin customización avanzada)
- Hasta 10 productos en catálogo
- Branding básico (logo + 1 color)
- Formulario de contacto/leads (limitado a 20/mes)
- **Sin SEO/GEO** (noindex, no indexa en Google)
- Sin Design Engine
- Badge "Powered by Novamente" visible
- Acceso a precios mayoristas de prendas

### Growth (~$25 USD/mes en ARS al TC del día)
- Storefront con branding completo (colores, fonts, hero, CTA custom)
- Productos ilimitados
- **SEO completo** (indexación, metadata, JSON-LD, sitemap)
- **GEO** (optimizado para AI search)
- Design Engine básico (mockups + presets de estilos)
- Leads ilimitados
- Badge "Powered by Novamente" removible
- Analytics básico (visitas, leads, conversiones)
- Soporte por email

### Pro (~$100 USD/mes en ARS al TC del día)
- Todo lo de Growth +
- **Chatbot de ventas personalizado** (WhatsApp)
- **Setup completo de Meta Business** (cuenta, pixel, catálogo)
- **Setup y plantillas de Meta Ads** (campañas básicas)
- Design Engine completo (brand-fit, paleta custom, estilos exclusivos)
- SEM ready (landing pages para ads, UTM tracking, conversion tracking)
- Soporte prioritario WhatsApp con equipo Novamente
- Onboarding asistido (1 call de setup)
- Dashboard de analytics avanzado
- Feed para Meta Commerce / Google Merchant

### Feature Gating Matrix

| Feature | Starter | Growth | Pro |
|---------|:-------:|:------:|:---:|
| Storefront básica | SI | SI | SI |
| Branding completo | - | SI | SI |
| Productos (límite) | 10 | Ilimitado | Ilimitado |
| Leads (límite/mes) | 20 | Ilimitado | Ilimitado |
| SEO/Indexación | noindex | SI | SI |
| GEO (AI search) | - | SI | SI |
| SEM (UTM, tracking) | - | - | SI |
| Design Engine | - | Básico | Completo |
| Chatbot WhatsApp | - | - | SI |
| Meta Business setup | - | - | SI |
| Meta Ads plantillas | - | - | SI |
| Analytics | - | Básico | Avanzado |
| Badge removible | - | SI | SI |
| Soporte | - | Email | WhatsApp prioritario |
| Feed Meta/Google | - | - | SI |
| Onboarding call | - | - | SI |

### Modelo de revenue dual
1. **SaaS** ($0-100/mes) — recurrente, por plan
2. **Wholesale** (prendas a precio mayorista) — transaccional, todos los tiers

---

## Decisión #1: ¿Dónde vive Partners OS?

### Opción elegida: DENTRO de novamente4.2

**Razones:**
1. novamente4.2 ya tiene storefront de partners (`/merch/[brand]`), checkout, cart, diseño, componentes UI
2. Next.js App Router permite rutas independientes sin contaminar el resto
3. Compartir componentes (shadcn/ui, ProductCard, GarmentSelector, etc.)
4. Un solo deploy, un solo Supabase, un solo R2
5. El PRD pide que "novamente sea la infraestructura", no que sea otra app

**Estructura propuesta:**

```
novamente4.2/
├── app/
│   ├── (novamente)/          # Rutas existentes de novamente.ar
│   │   ├── page.tsx           # Homepage
│   │   ├── design/
│   │   ├── products/
│   │   ├── cart/
│   │   └── checkout/
│   │
│   ├── partners/              # NUEVO — Landing + onboarding
│   │   ├── page.tsx           # Landing principal Partners OS
│   │   ├── join/              # Wizard de onboarding (7 pasos)
│   │   └── login/             # Login de partner
│   │
│   ├── p/[slug]/              # NUEVO — Storefront pública por partner
│   │   ├── page.tsx           # Homepage del partner
│   │   ├── [product]/         # Detalle de producto
│   │   ├── catalog/           # Catálogo completo
│   │   ├── designer/          # Design Engine (si plan lo permite)
│   │   └── contact/           # Formulario de contacto/lead
│   │
│   ├── workspace/             # NUEVO — Panel del partner
│   │   ├── layout.tsx         # Layout con sidebar partner
│   │   ├── page.tsx           # Dashboard
│   │   ├── branding/          # Logo, colores, textos
│   │   ├── catalog/           # Gestión de productos
│   │   ├── design-engine/     # Config del Design Engine
│   │   ├── leads/             # Leads recibidos
│   │   ├── orders/            # Pedidos
│   │   └── settings/          # Configuración general
│   │
│   ├── admin/                 # NUEVO — Admin interno Novamente
│   │   ├── partners/          # Gestión de partners
│   │   ├── review/            # Aprobación de assets/storefronts
│   │   └── metrics/           # Métricas cross-tenant
│   │
│   ├── api/
│   │   ├── partners/          # APIs de Partners OS
│   │   │   ├── onboarding/
│   │   │   ├── catalog/
│   │   │   ├── assets/
│   │   │   ├── branding/
│   │   │   ├── storefront/
│   │   │   └── leads/
│   │   └── ... (APIs existentes)
│   │
│   └── merch/                 # MIGRAR gradualmente a /p/[slug]
│
├── lib/
│   ├── partners/              # NUEVO — Lógica de Partners OS
│   │   ├── tenant.ts          # Resolución y contexto de tenant
│   │   ├── catalog.ts         # CRUD catálogo por tenant
│   │   ├── assets.ts          # Asset library por tenant
│   │   ├── branding.ts        # Branding configurable
│   │   ├── onboarding.ts      # Wizard logic
│   │   ├── storefront.ts      # Config de storefront
│   │   ├── design-engine.ts   # Config Design Engine por partner
│   │   ├── plans.ts           # Feature gating por plan
│   │   └── readiness.ts       # Discovery readiness score
│   └── ... (libs existentes)
```

---

## Decisión #2: Qué se mantiene, qué se refactoriza, qué se crea

### MANTENER (no tocar)

| Componente | Razón |
|-----------|-------|
| shadcn/ui components | Totalmente neutros |
| R2 storage client | Solo necesita prefijo por tenant |
| Gemini client | Modelo y API key compartidos |
| MercadoPago SDK | Se puede instanciar por tenant si necesario |
| Supabase client setup | Solo agregar tenant context |
| MockupCanvas, GarmentSelector | Componentes de UI reutilizables |
| ImageGenerator core | Lógica de generación intacta |
| Tailwind config base | Solo extender con variables por tenant |
| Cart system (localStorage fallback) | Funciona, agregar tenant isolation |

### REFACTORIZAR (modificar sin romper)

| Componente | Cambio necesario | Riesgo |
|-----------|-----------------|--------|
| **Navbar + Footer** | Agregar variante "partner" que use branding dinámico | Bajo |
| **`/merch/[brand]` → `/p/[slug]`** | Migrar de datos estáticos a DB queries | Medio |
| **Auth middleware** | Agregar resolución de tenant + rol por tenant | Medio |
| **Product display** | De `lib/products.ts` estático a API fetch por tenant | Medio |
| **Checkout** | Agregar tenant_id a orders, branding dinámico en MP preference | Bajo |
| **Meta Commerce feed** | Generar por tenant (dinámico desde DB) | Bajo |

### CREAR NUEVO

| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Tabla `tenants`** | Config, branding, plan, status, slug | Fase 1 |
| **Tabla `tenant_users`** | Roles por tenant | Fase 1 |
| **Tabla `products` (DB)** | Catálogo canónico multi-tenant | Fase 2 |
| **Tabla `product_variants`** | Variantes con precio/color/talle | Fase 2 |
| **Tabla `partner_assets`** | Asset library aislada | Fase 2 |
| **Tabla `partner_leads`** | Leads por partner | Fase 3 |
| **Tabla `partner_design_config`** | Config Design Engine por partner | Fase 4 |
| **Landing `/partners`** | Página principal del programa | Fase 1 |
| **Wizard `/partners/join`** | Onboarding 7 pasos | Fase 1 |
| **Workspace `/workspace`** | Panel completo del partner | Fase 1 |
| **Storefront `/p/[slug]`** | Template configurable | Fase 1 |
| **Admin `/admin/partners`** | Gestión de partners | Fase 1 |
| **API CRUD catálogo** | `/api/partners/catalog` | Fase 2 |
| **API assets** | `/api/partners/assets` | Fase 2 |
| **Readiness checker** | Validaciones de completitud | Fase 5 |
| **Feed builder** | Export TSV/JSON por tenant | Fase 5 |

### NO TOCAR (al principio)

| Componente | Razón |
|-----------|-------|
| Homepage de novamente.ar (`/`) | No afecta Partners OS |
| `/design` (generador público Novamente) | Funciona independiente |
| Dashboard de novamente-platform | Seguirá operando para el bot |
| Bot WhatsApp | Se integra después (Fase 4+) |
| Lead system de platform | Se puede extender pero no rehacer |
| Learning system | Bajo impacto, no prioritario |
| Fulfillment (Google Sheets, shipping) | Funciona, se extiende después |

---

## Fase 1 — Foundations (2-3 semanas)

### 1.1 Schema multi-tenant

```sql
-- Tabla principal de tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'AR',
  currency TEXT DEFAULT 'ARS',
  industry TEXT,
  website TEXT,
  instagram TEXT,
  description TEXT,

  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  hero_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#FFFFFF',
  accent_color TEXT,
  font_preference TEXT DEFAULT 'inter',

  -- Plan & status
  plan TEXT DEFAULT 'base' CHECK (plan IN ('base', 'growth', 'premium')),
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'paused', 'suspended')),

  -- Config
  storefront_published BOOLEAN DEFAULT FALSE,
  design_engine_mode TEXT DEFAULT 'disabled' CHECK (design_engine_mode IN ('disabled', 'mockups_only', 'presets', 'full_brand_fit')),
  commerce_mode TEXT DEFAULT 'leads' CHECK (commerce_mode IN ('leads', 'quote', 'sample', 'whatsapp', 'external', 'checkout')),

  -- Metadata
  completeness_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios por tenant
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'operator', 'viewer')),
  invited_by UUID,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- Novamente como tenant especial (seeder)
INSERT INTO tenants (slug, name, email, plan, status, storefront_published)
VALUES ('novamente', 'Novamente', 'apolonio@novamente.ar', 'premium', 'active', true);
```

### 1.2 Auth middleware actualizado

```typescript
// lib/partners/tenant.ts
export async function resolveTenant(request: NextRequest): Promise<Tenant | null> {
  // Opción 1: Ruta /p/[slug]
  const slugMatch = request.nextUrl.pathname.match(/^\/p\/([^/]+)/)
  if (slugMatch) return getTenantBySlug(slugMatch[1])

  // Opción 2: Workspace (desde JWT/session)
  if (request.nextUrl.pathname.startsWith('/workspace')) {
    const user = await getUser(request)
    return getTenantByUserId(user.id)
  }

  // Opción 3: Admin (cualquier tenant, seleccionado en UI)
  return null // sin tenant específico
}
```

### 1.3 Landing Partners (`/partners`)

- Hero: "Transformá tu marca con novamente Partners"
- Qué incluye cada plan (base, growth, premium)
- Ejemplos de partners activos
- Beneficios clave
- CTA: "Empezar ahora" → `/partners/join`
- CTA secundario: "Hablar con un asesor" → WhatsApp

### 1.4 Onboarding wizard (`/partners/join`)

Wizard de 7 pasos con persistencia en `tenants` + `tenant_users`:
1. Datos básicos → crea tenant con status='onboarding'
2. Identidad visual → upload logo/banner, auto-detect desde URL
3. Tipo de partner → define commerce_mode y design_engine_mode
4. Estilo visual → seleccionar entre presets
5. Catálogo inicial → skip o carga básica
6. Comercialización → leads/quote/sample/whatsapp
7. Preview + publicar

### 1.5 Storefront template mínima (`/p/[slug]`)

Template con bloques configurables (datos desde DB):
- Hero (imagen + texto)
- Logo + nombre
- Descripción
- Productos (grid)
- CTA principal
- Contacto

### 1.6 Workspace mínimo (`/workspace`)

Dashboard con:
- Estado del tenant (publicado/no)
- Completeness score
- Productos cargados
- Leads recibidos
- Acceso rápido a branding y catálogo

### 1.7 Admin Partners (`/admin/partners`)

Listado de partners con:
- Status, plan, completeness
- Acciones: aprobar, pausar, editar
- Link a storefront

---

## Fase 2 — Catálogo y branding (2 semanas)

### 2.1 Catálogo canónico en DB

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  slug TEXT NOT NULL,
  price DECIMAL,
  currency TEXT DEFAULT 'ARS',
  availability TEXT DEFAULT 'available',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'needs_review', 'ready', 'published', 'hidden', 'archived')),
  images JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  collection TEXT,
  seo_title TEXT,
  seo_description TEXT,
  metadata JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  color TEXT,
  size TEXT,
  material TEXT,
  price DECIMAL,
  image_url TEXT,
  availability TEXT DEFAULT 'available',
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 CRUD + import

- API: `/api/partners/catalog` (GET/POST/PUT/DELETE)
- Import CSV: parseo server-side, validación Zod
- Workspace: tabla editable de productos

### 2.3 Asset library

```sql
CREATE TABLE partner_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('logo', 'banner', 'hero', 'product', 'mockup', 'generated', 'approved', 'other')),
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processed', 'approved', 'public', 'archived')),
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Branding configurable

Workspace panel para editar:
- Logo, colores (primary, secondary, accent)
- Banner/hero
- Textos (tagline, about, CTA)
- Preview en vivo

---

## Fase 3 — Comercialización (1-2 semanas)

### 3.1 Partner leads

```sql
CREATE TABLE partner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'storefront',
  product_interest TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Formularios configurables

Según `commerce_mode` del tenant:
- `leads` → formulario de contacto
- `quote` → solicitud de presupuesto
- `sample` → solicitud de muestra
- `whatsapp` → link directo a WhatsApp del partner
- `external` → redirect a sitio externo
- `checkout` → flujo de compra (futuro)

### 3.3 Notificaciones

- Email al partner cuando recibe lead
- Telegram opcional
- Panel en workspace

---

## Fase 4 — Design Engine (2 semanas)

### 4.1 Tenantización del Designer

- Mover Designer UI de `/dashboard/designer` a componente embebible
- Filtrar estilos por partner config (`supported_styles`)
- Inyectar paleta y restricciones en prompt optimizer
- Sessions aisladas por tenant

### 4.2 Config por partner

```sql
CREATE TABLE partner_design_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  mode TEXT DEFAULT 'disabled',
  palette JSONB DEFAULT '{}',
  forbidden_colors JSONB DEFAULT '[]',
  tone TEXT,
  preferred_background TEXT,
  logo_usage BOOLEAN DEFAULT TRUE,
  supported_garments JSONB DEFAULT '[]',
  supported_styles JSONB DEFAULT '[]',
  custom_prompts JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Design Engine en storefront

Si plan lo permite, renderizar Designer en `/p/[slug]/designer`

---

## Fase 5 — Discovery Layer (1-2 semanas)

### 5.1 SEO dinámico

- Metadata por partner: `generateMetadata()` con datos de tenant
- JSON-LD: Product, Organization, BreadcrumbList
- Sitemap dinámico: `/sitemap.xml` que incluya todos los partners publicados
- Canonical URLs: `https://novamente.ar/p/{slug}/{product}`

### 5.2 Readiness score

Calcular automáticamente:
- Logo presente (+10)
- Banner (+5)
- >=1 producto publicado (+15)
- Descripción completa (+10)
- Colores configurados (+5)
- CTA definido (+10)
- FAQ agregadas (+5)
- Contacto (+10)
- Imágenes de producto (+15)
- SEO metadata (+15)

### 5.3 Feed builder

- `/api/partners/[slug]/feed.json` → catálogo en JSON
- `/api/partners/[slug]/feed.tsv` → catálogo en TSV (Meta Commerce)

---

## Fase 6 — Agent Commerce Layer (1-2 semanas)

### 6.1 Endpoints estructurados

- `/api/partners/[slug]/catalog.json` — catálogo canónico
- `/api/partners/[slug]/seller.json` — perfil del seller
- `/api/partners/[slug]/policies.json` — políticas
- `/api/partners/[slug]/availability.json` — estado de stock

### 6.2 Validaciones

- Schema validation con Zod
- Alertas por datos incompletos
- Score de "agent-readiness"

---

## Timeline estimado

| Fase | Duración | Entregable clave |
|------|----------|-----------------|
| Fase 0 (actual) | Completada | Auditoría + plan |
| Fase 1 | 2-3 semanas | Landing + onboarding + storefront + workspace mínimo |
| Fase 2 | 2 semanas | Catálogo en DB + asset library + branding |
| Fase 3 | 1-2 semanas | Leads + formularios + notificaciones |
| Fase 4 | 2 semanas | Design Engine tenantizado |
| Fase 5 | 1-2 semanas | SEO + readiness + feeds |
| Fase 6 | 1-2 semanas | Agent Commerce endpoints |

**Total estimado: 9-13 semanas** de desarrollo incremental.

---

## Secuencia de refactor mínimo viable

1. **Crear tablas `tenants` + `tenant_users`** (sin tocar tablas existentes)
2. **Crear rutas nuevas** (`/partners`, `/p/[slug]`, `/workspace`, `/admin/partners`)
3. **Conectar storefront a DB** (en vez de `partners.ts` estático)
4. **Agregar `tenant_id` a tablas existentes** (gradual, empezando por `orders` y `products`)
5. **Migrar `/merch/[brand]` → `/p/[slug]`** (redirect 301)
6. **Extender auth** con tenant context
7. **Tenantizar Designer** (sesiones, config, estilos filtrados)
8. **Agregar SEO dinámico** a storefronts
9. **Exponer endpoints agent-ready** cuando catálogo esté estable
