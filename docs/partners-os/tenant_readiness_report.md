# Tenant Readiness Report

**Fecha:** 2026-03-13
**Pregunta central:** ¿Puede el sistema actual soportar multi-tenancy?
**Respuesta corta:** NO, pero la migración es factible e incremental.

---

## 1. ¿Soporta multi-tenant? NO

### Datos duros

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| `tenant_id` en tablas | NO | 0 de 14 tablas tienen tenant_id |
| Tabla de tenants | NO | No existe |
| RLS por tenant | NO | RLS existe pero filtra por user_id, no tenant |
| Resolución de tenant | NO | No hay middleware ni lógica de tenant |
| Config por tenant | NO | Todo en archivos estáticos |
| Credenciales por tenant | NO | 1 set global de API keys |

### Elementos hardcoded a Novamente

```
novamente4.2:
├── lib/products.ts               → 25 productos Novamente hardcoded
├── src/data/partners.ts          → FALCO como único partner (993 líneas inline)
├── app/layout.tsx                → title: "Novamente | Ropa personalizada con IA"
├── tailwind.config.ts            → novamente-blue, novamente-purple, novamente-magenta
├── components/Navbar.tsx         → Logo Novamente hardcoded
├── components/Footer.tsx         → Links Novamente hardcoded
├── app/api/checkout/route.ts     → statement_descriptor: "NOVAMENTE"
├── /meta/catalog                 → Feed branded Novamente
└── next.config.mjs               → metadataBase: novamente.ar

novamente-platform:
├── novamente_b2b_bot_config.json → Nombre, pitch, productos Novamente
├── lib/auth/roles.ts             → ADMIN_EMAILS = [@novamente.ar]
├── lib/fulfillment/              → Shipping origin: Villa Martelli CP 1603
├── lib/leads/templates.ts        → Email templates branded Novamente
└── middleware.ts                  → Sin tenant context

whatsapp-sales-bot:
├── System prompts                → "Sos el asesor de ventas de Novamente"
├── lib/payments/payment-link.ts  → CATALOG inline con precios Novamente
├── /admin/dashboard              → Sin autenticación ni tenant
└── META_PHONE_ID                 → 1 número de WhatsApp global
```

---

## 2. ¿Soporta branding por partner? PARCIAL

### Lo que ya funciona

| Componente | Estado | Detalle |
|-----------|--------|--------|
| Partner data structure | SI | `src/data/partners.ts` tiene logo, banner, slogan, description, values, mission |
| Partner storefront template | SI | `/merch/[brand]` renderiza por slug con brand story |
| Partner product cards | SI | `ProductCard` acepta props dinámicos |
| Asset paths por partner | SI | `/public/partners/<slug>/` convention |
| Colores por partner | NO | Tailwind config global, sin CSS variables dinámicas |
| Fonts por partner | NO | Solo Inter hardcoded |
| Navbar/Footer por partner | NO | Siempre muestra Novamente |

### Lo que falta

1. **Colores dinámicos:** Inyectar CSS variables (`--partner-primary`, `--partner-secondary`) desde config de tenant
2. **Layout condicional:** Navbar y Footer que muestren branding del partner en `/p/[slug]`
3. **Favicon dinámico:** `<link rel="icon">` desde tenant config
4. **OG images:** Dinámicas por partner (logo + banner)
5. **Email templates:** Branded por partner (logo, colores, nombre)

### Esfuerzo estimado: MEDIO (1-2 semanas)

La base existe. Falta:
- Mover datos de `partners.ts` a tabla `tenants`
- Crear layout wrapper que inyecte CSS variables del tenant
- Hacer Navbar/Footer condicionales

---

## 3. ¿Soporta catálogo por tenant? NO

### Estado actual

```
novamente4.2:
  lib/products.ts (estático, 25 items Novamente)
  src/data/partners.ts (estático, FALCO products inline)

novamente-platform:
  novamente_b2b_bot_config.json (estático, 8 items con pricing)

whatsapp-sales-bot:
  CATALOG inline en payment-link.ts (estático, 8 items)
```

**3 copias de catálogo** en 3 repos, todas estáticas, ninguna en DB.

### Lo que se necesita

1. **Tabla `products`** con `tenant_id` (UUID FK → tenants)
2. **Tabla `product_variants`** con `product_id` (FK → products)
3. **API CRUD** `/api/partners/catalog` (autenticada por tenant)
4. **Migración de datos:** Convertir `lib/products.ts` + `partners.ts` en seed data
5. **Import CSV:** Para carga masiva
6. **Estados de publicación:** draft → needs_review → ready → published

### Esfuerzo estimado: ALTO (2 semanas)

Requiere nueva tabla, nuevas APIs, nueva UI en workspace, migración de datos, y actualizar storefronts para leer de DB.

---

## 4. ¿Soporta storefront por partner? PARCIAL

### Lo que ya existe

```
/merch                    → Lista de partners (grid)
/merch/[brand]            → Storefront por partner (hero, brand story, products grid)
/merch/[brand]/[product]  → Detalle de producto (fotos, colores, talles, precio, comprar)
```

**Componentes que ya renderizan por partner:**
- Hero con banner del partner
- Logo del partner
- Brand story (3 párrafos)
- Grid de productos con ProductCard
- Detalle de producto con variantes de color, fotos lifestyle, talles
- Instagram link

### Lo que falta

| Elemento PRD | Existe | Brecha |
|-------------|--------|--------|
| Hero configurable | PARCIAL | Datos inline, no DB |
| Logo + branding | PARCIAL | Solo logo path, sin colores dinámicos |
| Categorías/colecciones | NO | Sin grouping de productos |
| CTA configurable | NO | Siempre "Comprar" hardcoded |
| FAQs | NO | No existe |
| Políticas | NO | No existe |
| Design Engine embebido | NO | Designer está en dashboard |
| Formulario de lead/contacto | NO | Solo JoinForm genérico |
| Formulario de muestra | NO | No existe |
| Checkout por partner | PARCIAL | Checkout existe pero sin branding partner |

### Esfuerzo estimado: MEDIO-ALTO (2 semanas)

La base de renderizado por slug existe. Falta:
- Conectar a DB en vez de archivo estático
- Agregar bloques faltantes (FAQs, contacto, políticas)
- Hacer CTA configurable
- Agregar Design Engine como bloque opcional

---

## 5. ¿Soporta panel por partner? NO

### Estado actual

No existe workspace ni dashboard para partners. Solo hay:
- Dashboard de Novamente en `novamente-platform` (chats, designer, analytics, leads)
- Admin panel del bot en `whatsapp-sales-bot` (sin auth)

### Lo que se necesita

**Workspace `/workspace` con:**

| Sección | Complejidad | Descripción |
|---------|------------|-------------|
| Dashboard | Baja | Estado, score, métricas básicas |
| Branding | Media | Editor de logo, colores, textos |
| Catálogo | Alta | CRUD productos, variantes, import CSV |
| Design Engine | Media | Config de estilos, paleta, previews |
| Leads | Baja | Lista de leads recibidos, status |
| Orders | Media | Lista de pedidos, status, tracking |
| Settings | Baja | Datos de cuenta, plan, facturación |

### Esfuerzo estimado: ALTO (3-4 semanas para MVP)

Es el módulo más grande por construir. Pero puede ser incremental:
1. Fase 1: Dashboard + branding básico
2. Fase 2: Catálogo CRUD
3. Fase 3: Leads + orders
4. Fase 4: Design Engine config

---

## 6. ¿Qué hay que cambiar? Resumen

### Cambios en DB (Supabase)

| Acción | Tablas | Impacto |
|--------|--------|---------|
| Crear tabla `tenants` | Nueva | Sin impacto |
| Crear tabla `tenant_users` | Nueva | Sin impacto |
| Crear tabla `products` | Nueva | Sin impacto |
| Crear tabla `product_variants` | Nueva | Sin impacto |
| Crear tabla `partner_assets` | Nueva | Sin impacto |
| Crear tabla `partner_leads` | Nueva | Sin impacto |
| Crear tabla `partner_design_config` | Nueva | Sin impacto |
| Agregar `tenant_id` a `orders` | ALTER TABLE | Requires data migration |
| Agregar `tenant_id` a `images` | ALTER TABLE | Requires data migration |
| Agregar `tenant_id` a `cart_items` | ALTER TABLE | Requires data migration |
| Actualizar RLS policies | ALTER | Requires testing |

### Cambios en código

| Área | Cambio | Riesgo |
|------|--------|--------|
| Middleware | Agregar tenant resolution | Bajo (nuevo código) |
| Navbar/Footer | Variante partner | Bajo (condicional) |
| Storefront | Conectar a DB | Medio (reescritura) |
| Auth | Agregar tenant roles | Medio |
| Checkout | tenant_id en orders | Bajo |
| Designer | Sesiones por tenant | Medio |
| Meta feed | Dinámico por tenant | Bajo |

### Riesgo general: MEDIO

La migración es **aditiva**, no destructiva. Las tablas nuevas no afectan las existentes. Los cambios en código son en rutas nuevas. El mayor riesgo es el refactor de auth/middleware y la migración de storefront de estático a dinámico.

---

## 7. Recomendación

### Estrategia: "Novamente como Tenant 0"

1. **Crear tabla `tenants`** e insertar Novamente como primer tenant (slug: 'novamente')
2. **Crear rutas nuevas** sin tocar las existentes
3. **Migrar `/merch/[brand]` → `/p/[slug]`** gradualmente
4. **Agregar `tenant_id` a tablas existentes** como columna nullable al principio
5. **Novamente opera igual** hasta que todo esté migrado
6. **Partners nuevos** usan la infraestructura nueva desde el inicio

Esta estrategia **no rompe nada** y permite migración incremental.
