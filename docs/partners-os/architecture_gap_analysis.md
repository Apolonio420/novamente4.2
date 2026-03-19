# Architecture Gap Analysis — Partners OS

**Fecha:** 2026-03-13
**Diagnóstico:** Brechas entre el sistema actual y los requerimientos del PRD

---

## Resumen ejecutivo

El ecosistema Novamente tiene una base técnica sólida pero está **100% diseñado como single-tenant**. La brecha más crítica es la ausencia total de aislamiento por tenant en datos, auth, config, branding y lógica de negocio. Sin embargo, la arquitectura modular (Next.js API routes + Supabase + R2) facilita una migración incremental.

---

## 1. Multi-tenancy

### Estado actual: INEXISTENTE

| Componente | Brecha | Severidad |
|-----------|--------|-----------|
| **Database schema** | Ninguna tabla tiene `tenant_id`. Todos los datos son globales. | CRÍTICA |
| **RLS policies** | RLS existe pero no filtra por tenant, solo por user_id o service_role. | CRÍTICA |
| **Auth middleware** | No extrae ni inyecta tenant context. Protege rutas pero no aísla datos. | CRÍTICA |
| **Config** | `novamente_b2b_bot_config.json` es un archivo estático global. | ALTA |
| **Admin emails** | `ADMIN_EMAILS` hardcoded en `lib/auth/roles.ts`. | ALTA |
| **Env vars** | Todas las credenciales son globales (1 MP token, 1 Gemini key, 1 R2 bucket). | MEDIA |

### Lo que se necesita

1. Tabla `tenants` con config, branding, plan, status
2. Columna `tenant_id` en TODAS las tablas operativas
3. RLS policies que filtren por `tenant_id`
4. Middleware que resuelva tenant desde ruta (`/p/[slug]`) o subdomain
5. Tabla `tenant_users` con roles por tenant (owner, operator, viewer)
6. Config dinámica por tenant (productos, precios, branding, credenciales)

---

## 2. Catálogo de productos

### Estado actual: HARDCODED

| Repo | Cómo define productos | Problema |
|------|----------------------|----------|
| **4.2** | `lib/products.ts` (25 items inline) + `src/data/partners.ts` (FALCO inline) | TypeScript estático, no DB |
| **platform** | `novamente_b2b_bot_config.json` (8 items con pricing) | JSON estático, sin tenant |
| **bot** | `CATALOG` inline en `payment-link.ts` (8 items) | Duplicado del platform |

### Lo que se necesita (PRD sección 16)

```
products (tabla DB)
├── id, tenant_id, name, description, category
├── price, currency, availability
├── images (array), variants (relación)
├── slug, url, status (draft/ready/published/archived)
├── metadata_seo, metadata_geo
└── collection_id

product_variants (tabla DB)
├── id, product_id, sku
├── color, size, material, price
├── image, availability
└── attributes (JSONB)
```

**Brecha:** No existe catálogo en DB. Todo es TypeScript/JSON estático. Necesita migración completa a tablas con CRUD + import CSV + estados + SEO metadata.

---

## 3. Asset library

### Estado actual: PARCIAL

| Componente | Estado | Brecha |
|-----------|--------|--------|
| R2 storage | Funcional | Sin namespacing por tenant (`images/`, `mockups/`, global) |
| `customer_assets` tabla | Existe en platform | Sin tenant_id, solo por phone_e164 |
| Upload API | `/api/admin/designer/upload` | Sin tenant context |
| Imágenes de prendas | `/public/garments/` estáticas | No extensible por partner |
| Assets de partners | `/public/partners/<slug>/` | Solo filesystem, no DB-driven |

### Lo que se necesita (PRD sección 17)

```
partner_assets (tabla DB)
├── id, tenant_id
├── type (logo, banner, hero, product_image, mockup, generated, approved)
├── status (uploaded, processed, approved, public, archived)
├── storage_key, public_url
├── metadata (JSONB)
└── created_at
```

**R2 namespacing:** `tenants/{tenant_id}/assets/{type}/{filename}`

---

## 4. Storefront pública

### Estado actual: EMBRIONARIO

| Componente | Estado | Brecha |
|-----------|--------|--------|
| `/merch/[brand]` | Existe, renderiza datos de `partners.ts` | Datos hardcoded, no DB |
| `/merch/[brand]/[product]` | Existe, detalle de producto | Sin variantes dinámicas |
| Brand story | Se muestra (slogan, description, values, mission) | Inline en TypeScript |
| Hero/banner | Soportado | Solo paths estáticos |
| Layout configurable | NO | Template fijo |
| CTA configurable | NO | Hardcoded |
| FAQs | NO | No existe |
| Políticas | NO | No existe |
| Design Engine embebido | NO | El designer está en dashboard, no en storefront |
| Formulario lead/contacto | NO | Solo join form genérico |

### Lo que se necesita (PRD sección 14)

Template de storefront con bloques configurables:
- Hero principal (imagen + texto)
- Logo + branding (colores, fuente)
- Mensaje de marca
- Categorías/colecciones
- Galería de productos (desde DB)
- CTA principal configurable
- FAQs configurables
- Contacto/formulario
- Políticas
- Design Engine (opcional, según plan)
- Formulario de compra/muestra/lead

---

## 5. Onboarding de partners

### Estado actual: MÍNIMO

| Componente | Estado | Brecha |
|-----------|--------|--------|
| Formulario de aplicación | `/merchs/join` + `/api/partners` | Solo captura nombre, email, Instagram, message |
| Tabla `partner_applications` | Existe | Solo `pending` status, sin wizard |
| Notificación | Telegram al equipo | Manual review |
| Wizard guiado | NO EXISTE | No hay pasos, ni progreso, ni setup automático |
| Extracción automática (URL) | NO EXISTE | No hay scraping de sitio web del partner |
| Branding auto-detect | NO EXISTE | No hay detección de colores/logo desde URL |

### Lo que se necesita (PRD sección 11-12)

Wizard de 7 pasos:
1. Datos básicos (nombre, email, WhatsApp, rubro)
2. Identidad visual (logo, banners, colores, URL extraction)
3. Tipo de partner (catálogo fijo / mockups / Design Engine)
4. Estilo visual (minimal, bold, editorial, sport, corporate, urbano, creativo)
5. Catálogo (manual, CSV import, plantilla)
6. Comercialización (leads, presupuesto, muestra, WhatsApp, compra)
7. Preview y publicación

---

## 6. Workspace del partner

### Estado actual: NO EXISTE

No hay ningún panel para que el partner administre su propio negocio.

### Lo que se necesita (PRD sección 15)

| Sección | Función |
|---------|---------|
| Dashboard | Estado, productos, leads, pedidos, completitud score |
| Branding | Logo, paleta, tipografía, hero, textos, CTA |
| Catálogo | Productos, variantes, precios, imágenes, colecciones |
| Design Engine | Presets, resultados, aprobación, prompts |
| Leads/Pedidos | Consultas, muestras, pedidos, fuentes |
| Discovery/Readiness | Calidad catálogo, metadata, errores, score |

---

## 7. Design Engine como servicio

### Estado actual: FUNCIONAL PERO SINGLE-TENANT

| Componente | Estado | Brecha |
|-----------|--------|--------|
| 37 estilos artísticos | Funcionan | Globales, no configurables por partner |
| Prompt optimizer | Funciona | Sin paleta/tono/restricciones por partner |
| Generación NB2 | Funciona | Sin aislamiento de sesiones por tenant |
| Mockup compositing | Funciona | Sin prendas custom por partner |
| Session persistence | En DB | Sin tenant_id |
| Designer UI | En dashboard | No embebible en storefront |

### Lo que se necesita (PRD sección 18)

```
partner_design_config (tabla DB)
├── tenant_id
├── mode (disabled, mockups_only, presets, full_brand_fit)
├── palette (JSONB: colores permitidos + prohibidos)
├── tone (TEXT: estético, tono de campaña)
├── preferred_background (TEXT)
├── logo_usage (BOOLEAN)
├── logo_placement (TEXT)
├── supported_garments (JSONB: array de garment keys)
├── supported_styles (JSONB: array de style ids)
└── custom_prompts (JSONB)
```

---

## 8. Agent Commerce Layer

### Estado actual: NO EXISTE

No hay capa estructural de datos canónicos. Los datos están dispersos en:
- TypeScript estático (productos)
- JSON estático (pricing)
- Supabase (órdenes, assets)
- R2 (imágenes)

### Lo que se necesita (PRD sección 19)

- Catálogo canónico (DB) con slugs, URLs limpias, metadata
- Seller profile (por tenant)
- Políticas públicas
- FAQs
- Export/feed builder
- Readiness score (validaciones automáticas)
- Endpoints estructurados para futura exposición

---

## 9. Discovery Layer (SEO + GEO + SEM)

### Estado actual: BÁSICO

| Componente | Estado | Brecha |
|-----------|--------|--------|
| Metadata global | `title: "Novamente \| Ropa personalizada con IA"` | Hardcoded Novamente |
| OG tags | Existen en páginas principales | Sin personalización por partner |
| Canonical URLs | Solo para novamente.ar | Sin canonicals por partner storefront |
| Structured data | Mínimo (OG + Twitter cards) | Sin JSON-LD de producto/organización |
| Sitemap | NO EXISTE | Necesario para indexación |
| robots.txt | Básico | Sin reglas por partner |
| Meta Commerce feed | TSV para Novamente | Sin feed por partner |
| UTM tracking | NO | No hay tracking de campañas |

### Lo que se necesita

- Metadata dinámica por partner (title, description, OG image)
- JSON-LD para Product, Organization, BreadcrumbList
- Sitemap dinámico (por partner, por producto)
- Canonical URLs por storefront
- UTM tracking en links y formularios
- Feed builder por partner (TSV, JSON)

---

## 10. Auth y permisos

### Estado actual: INSUFICIENTE

| Componente | Estado | Brecha |
|-----------|--------|--------|
| Auth | Supabase Auth funcional | Solo para equipo Novamente |
| Roles | admin/viewer (2 roles) | Sin owner/operator por tenant |
| Middleware | Protege /dashboard y /api/admin | Sin tenant context |
| API route checks | NINGUNO | Viewer puede llamar APIs admin si conoce URL |
| Bot access | x-bot-secret header | OK para M2M |

### Lo que se necesita

```
tenant_users (tabla DB)
├── id, tenant_id, user_id (FK auth.users)
├── role (owner, operator, viewer)
├── permissions (JSONB: granular)
├── invited_by, accepted_at
└── created_at

Middleware actualizado:
1. Resolver tenant desde ruta o subdomain
2. Verificar que user pertenece a tenant
3. Verificar rol y permisos
4. Inyectar tenant_id en request context
```

---

## 11. Chatbot

### Estado actual: FUNCIONAL PERO ACOPLADO

| Aspecto | Estado | Brecha |
|---------|--------|--------|
| Motor SACE | Funcional (estados, slots, acciones) | System prompt hardcoded a Novamente |
| Catálogo de ventas | Inline en bot (`CATALOG`) | Duplicado, no dinámico |
| Platform bridge | HTTP calls | OK — desacoplado |
| Múltiples WhatsApp numbers | NO | 1 phone_id global |
| Tenant context | NO | No sabe qué partner atiende |
| Onboarding capability | NO | No hay flujo de captación partner |

### Análisis detallado en `chatbot_integration_audit.md`

---

## 12. Tabla de brechas priorizadas

| # | Brecha | Severidad | Esfuerzo | Fase PRD |
|---|--------|-----------|----------|----------|
| 1 | Sin multi-tenancy en DB | CRÍTICA | Alto | Fase 1 |
| 2 | Sin tabla de tenants | CRÍTICA | Medio | Fase 1 |
| 3 | Catálogo hardcoded (no DB) | CRÍTICA | Alto | Fase 2 |
| 4 | Sin onboarding wizard | ALTA | Alto | Fase 1 |
| 5 | Sin workspace partner | ALTA | Alto | Fase 1 |
| 6 | Sin storefront configurable | ALTA | Alto | Fase 1 |
| 7 | Auth sin tenant context | ALTA | Medio | Fase 1 |
| 8 | Sin asset library aislada | ALTA | Medio | Fase 2 |
| 9 | Design Engine sin tenantización | MEDIA | Medio | Fase 4 |
| 10 | Sin SEO/GEO/SEM dinámico | MEDIA | Medio | Fase 5 |
| 11 | Sin Agent Commerce Layer | MEDIA | Alto | Fase 6 |
| 12 | Chatbot acoplado a Novamente | MEDIA | Alto | Fase 4+ |
| 13 | Sin readiness score | BAJA | Bajo | Fase 5 |
| 14 | Sin feed builder por tenant | BAJA | Bajo | Fase 5 |
