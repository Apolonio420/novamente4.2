# Backlog — Autopilot v4.2

> Editá la sección **SPRINT ACTUAL** con tareas reales. Si está vacía, el autopilot
> hace exit limpio sin consumir tokens.
>
> Formato de ID: `TASK-NNN` (manual) o `AUTOFEED-YYYYMMDD-N` (auto-feeder).
> Orden de ejecución = orden en la tabla. Máx 3 tareas por sprint.

## SPRINT ACTUAL

| # | ID | Tarea | Sprints | Apto autopilot | Estado |
|---|----|-------|---------|----------------|--------|
| 1 | TASK-001 | CBU + alias de depósito en /workspace/settings | 1 | sí | DONE |
| 2 | TASK-002 | Tickets disponibles para todos los tiers | 1 | sí | DONE |
| 3 | TASK-003 | Auditar tracking de ventas (research, no code) | 1 | sí | DONE |
| 4 | TASK-004 | Auditar + regenerar con Gemini imágenes de marketing baja calidad (full-auto) | 2 | sí (con `node` aprobado manualmente) | DONE — 5 de 5 regeneradas |
| 5 | AUTOFEED-20260518-1 | tsc: rag-sources.test.ts:36 | 1 | sí | DONE |
| 6 | AUTOFEED-20260518-2 | tsc: rag-sources.test.ts:101 | 1 | sí | DONE |
| 7 | AUTOFEED-20260518-3 | tsc: generate-stamp.test.ts:105 | 1 | sí | DONE |
| 8 | AUTOFEED-20260518-4 | tsc: route.ts:37 | 1 | sí | DONE |
| 9 | AUTOFEED-20260518-5 | tsc: route.ts:40 | 1 | sí | DONE |
| 10 | TASK-007 | Soporte sidebar: quitar candado para Starter (consistencia con TASK-002) | 1 | sí | DONE |
| 11 | TASK-008 | Storefront Falco roto: logo + banner no cargan en /p/falco | 1 | sí (migración SQL lista, correr en Supabase) | NEEDS_MANUAL |
| 12 | TASK-009 | Design engine: garment mismatch + controles de placement y tamaño de estampa | 3 | sí (con auditoría componente) | DONE |
| 13 | TASK-010 | Unificar todos los WhatsApp (bubbles + links + tel) a +54 9 2235 16-9720 | 1 | sí | DONE |

---

### TASK-001 — CBU + alias de depósito en /workspace/settings

**Por qué:** Cada partner necesita declarar dónde recibir el dinero de las ventas. Hoy no hay campo en settings.

**Alcance:**
- Agregar dos campos al form de [app/workspace/settings/page.tsx](app/workspace/settings/page.tsx): `bank_cbu` (22 dígitos) y `bank_alias` (texto, alias bancario opcional).
- Validación client-side: CBU debe ser exactamente 22 dígitos numéricos. Alias acepta letras/números/punto/guion.
- Persistir en tabla `tenants` (Supabase). Crear migración nueva en `migrations/` con número siguiente: `ALTER TABLE tenants ADD COLUMN bank_cbu TEXT, ADD COLUMN bank_alias TEXT;` (nullable, sin default).
- Si ya existe un API route que guarda settings del tenant, extenderlo para aceptar estos campos. Si no, crear `PATCH` en `app/api/partners/settings/route.ts` (o similar, revisar lo que ya hay).
- Mostrar valor actual al cargar la página (GET inicial).
- Mostrar mensaje "Tu CBU es donde recibirás los pagos de ventas" debajo del campo.

**Archivos esperados:**
- `app/workspace/settings/page.tsx` (modificar)
- `migrations/<próximo-número>_partner_bank_info.sql` (crear)
- `lib/partners/types.ts` (agregar `bank_cbu` y `bank_alias` al type Tenant si existe)
- `app/api/partners/settings/route.ts` (modificar o crear)

**Criterio DONE:**
- [ ] Campos visibles y editables en `/workspace/settings`
- [ ] Validación de 22 dígitos en CBU funciona (error visible)
- [ ] Migración SQL creada (NO ejecutada — el humano la corre en Supabase)
- [ ] Valor persiste tras refresh
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-001]`

**NO hacer:** integración con pasarela de pago. Solo capturar y guardar el dato.

---

### TASK-002 — Tickets disponibles para todos los tiers

**Por qué:** Hoy [app/workspace/support/page.tsx:206](app/workspace/support/page.tsx#L206) bloquea la creación de tickets si `plan === 'starter'`. Queremos que tickets sea funcionalidad core para todos los partners, independiente del plan.

**Alcance:**
- Quitar el gate `if (plan === 'starter') { ... }` que muestra el upsell en lugar del form de tickets.
- Asegurar que el form de crear ticket renderiza para todos los planes (`starter`, `growth`, `pro`).
- Mantener intacta la diferenciación de la UI por plan en otras secciones (ej. "Soporte WhatsApp prioritario (plan Pro)" sigue siendo para Pro — solo el alta básica de tickets se democratiza).
- Verificar en el backend (`app/api/partners/support/*` o donde esté el POST de ticket) que NO rechaza por plan. Si rechaza por plan, quitarlo.
- Mantener la card de "Pro: WhatsApp priority" intacta — esa SÍ es solo Pro.

**Archivos esperados:**
- `app/workspace/support/page.tsx` (modificar)
- `app/api/partners/support/route.ts` o similar (revisar si tiene gate, quitar si sí)

**Criterio DONE:**
- [ ] Un partner con `plan === 'starter'` ve el form completo de crear ticket
- [ ] POST de ticket funciona para starter (probar grep + leer el handler)
- [ ] Card "Pro WhatsApp priority" sigue apareciendo solo para Pro
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-002]`

**NO hacer:** rediseñar la página de soporte. NO tocar la lógica de WhatsApp priority.

---

### TASK-003 — Auditar tracking de ventas (research, no code)

**Por qué:** El humano quiere confirmar que el tracking de ventas está bien implementado antes de tocar nada. Esta tarea es de auditoría, no de cambio.

**Alcance:**
- Revisar `app/workspace/orders/` y `app/workspace/analytics/` y reportar:
  1. Qué eventos de venta se trackean hoy y dónde se guardan (tabla DB).
  2. Si hay agujeros obvios (ej. ventas que no quedan registradas, métricas que no se calculan).
  3. Si el partner ve sus ventas en el dashboard con totales correctos.
- Generar un reporte breve appendeado a `backlog/UPDATES.md` con título "Auditoría tracking de ventas <fecha>".
- Si encontrás bugs concretos, NO los arregles en este sprint — agregalos como tareas nuevas `TASK-XXX` al final de SPRINT ACTUAL para que el humano decida prioridad.

**Archivos esperados:**
- `backlog/UPDATES.md` (append reporte)
- `backlog/BACKLOG.md` (append tareas nuevas si se detectan bugs)
- NO modificar código en este sprint.

**Criterio DONE:**
- [ ] Reporte appendeado a UPDATES.md con: tablas DB usadas, archivos clave, métricas calculadas, agujeros detectados
- [ ] Si hay bugs: tareas TASK-XXX agregadas al backlog
- [ ] Commit con tag `[AP-v4.2 TASK-003]` (solo cambios en `backlog/`)

**NO hacer:** modificar código de la app. Solo leer y reportar.

---

### TASK-004 — Auditar + regenerar imágenes baja calidad con Gemini (full-auto)

**Por qué:** El hero de [/lanza-tu-marca](https://novamente.ar/lanza-tu-marca) ([public/marketing/lifestyle/hero-lanza-tu-marca.webp](public/marketing/lifestyle/hero-lanza-tu-marca.webp), **48 KB**) y la mayoría de heroes en `public/marketing/lifestyle/` están en 40–80 KB — demasiado chicos para uso hero. Como ya se generaron originalmente con IA, regenerarlos con Gemini en mejor calidad es legítimo. **El proyecto ya tiene `lib/gemini.ts:14` `generateImage(prompt, width, height)` funcionando con `gemini-3-pro-image-preview` y `GEMINI_API_KEY` configurada.**

**Procedimiento (en orden estricto):**

1. **Audit:** recorrer `public/marketing/lifestyle/` y filtrar archivos que cumplan TODO:
   - tamaño < 100 KB
   - nombre empieza con `hero-` o `home-carousel-` o `blog-cover-`
   - se usa en algún `.tsx` bajo `app/` o `components/` (`grep -rln` del basename)

2. **Cap duro:** procesar como MÁXIMO **5 imágenes en este sprint**. Si hay más candidatos, dejarlos para sprint siguiente (anotar lista en `backlog/UPDATES.md`).

3. **Backup obligatorio:** crear carpeta `public/marketing/lifestyle/_originals/` si no existe. Para cada imagen a regenerar, copiar el archivo actual ahí ANTES de sobrescribir. Si la copia falla → abortar esa imagen.

4. **Análisis visual con Gemini multimodal:** para cada candidato, usar Gemini para "leer" la imagen actual (pasar el `.webp` con `inlineData` base64 al modelo) y pedir:
   - Descripción del contenido (sujeto, escena, estilo, paleta)
   - Prompt mejorado para regenerar la misma escena pero en alta calidad fotográfica profesional, mismo estilo y dirección artística
   - Si la imagen es ilegible/corrupta → marcar SKIP, no regenerar.

5. **Regenerar:** llamar `generateImage(promptMejorado, 1920, 1080)` (o 1080x1920 si el original es vertical — detectar dimensiones con `sharp` o `image-size`, ambos están instalados o instalables vía import de Node). Si la respuesta no es binario directo, parsear según el shape del response (mirar `lib/gemini.ts` y `lib/partners/lifestyle-mockup.ts:191` para el patrón). Convertir a WebP con calidad 85 usando `sharp` (ya está en node_modules; si no, importar via dynamic import y si falla → SKIP esa imagen, no instalar nada).

6. **Reemplazar:** sobrescribir el archivo original manteniendo el mismo nombre (para no romper referencias en código).

7. **Verificar:** que el archivo nuevo pese al menos **150 KB** y tenga al menos 1600 px en su lado mayor. Si no cumple → restaurar el backup de `_originals/` y marcar FAIL.

8. **Reporte:** appendear a `backlog/UPDATES.md` tabla con:
   | archivo | KB antes | KB después | dimensiones después | prompt usado | resultado (OK/SKIP/FAIL) |

9. **Commit único** con tag `[AP-v4.2 TASK-004]` agrupando: imágenes regeneradas + `_originals/` + actualización de `UPDATES.md`. Mensaje: `feat(marketing): regenerar N imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]`.

**Archivos esperados:**
- `public/marketing/lifestyle/*.webp` (sobrescritos, máx 5)
- `public/marketing/lifestyle/_originals/*.webp` (backups, creado nuevo)
- `backlog/UPDATES.md` (append reporte)
- NO modificar código de la app (los nombres se preservan).

**Criterio DONE:**
- [ ] Máx 5 imágenes regeneradas, todas ≥ 150 KB y ≥ 1600 px lado mayor
- [ ] Todas las regeneradas tienen su backup en `_originals/`
- [ ] Reporte con tabla completa en `UPDATES.md`
- [ ] `npx tsc --noEmit` verde (no debería cambiar, pero verificar)
- [ ] Commit único `[AP-v4.2 TASK-004]`

**Caps duros (NO los excedas):**
- Max 5 imágenes por sprint (cuota Gemini)
- Si una regeneración falla 2 veces seguidas → SKIP esa imagen
- Si quedan candidatos pendientes, listarlos en `UPDATES.md` para sprint siguiente
- NO instalar paquetes nuevos. Si `sharp` no está disponible, usá lo que haya (`image-size`, `probe-image-size`) o SKIP la imagen con nota en reporte.
- NO regenerar imágenes que NO sean hero/carousel/blog-cover (íconos, logos, mockups específicos de partner — esos quedan intactos).
- NO tocar `public/marketing/lifestyle/_originals/` después de crearlo (solo escribir backups).

**NO hacer:**
- NO borrar originales (mover a `_originals/`).
- NO renombrar archivos.
- NO tocar componentes ni rutas.
- NO regenerar más de 5 por sprint aunque haya quota.

---

| 3 | TASK-003 | Auditar tracking de ventas (research, no code) | 1 | sí | DONE |

---

### TASK-005 — Bridgear ventas B2C hacia partner_orders (BUG-1 crítico)

**Detectado por:** TASK-003 auditoría de tracking de ventas.

**Por qué:** Las ventas en storefronts públicos se guardan en `orders` (sin tenant_id). El dashboard del partner lee de `partner_orders`. No hay puente → el partner ve revenue = 0 aunque haya ventas reales.

**Alcance:**
1. Agregar `tenant_id` a la tabla `orders` (nuevo campo nullable, migración).
2. Modificar el checkout (`app/api/checkout/route.ts`) para recibir y guardar el `tenant_id` del storefront.
3. En el webhook MP principal (`app/api/webhooks/mercadopago/route.ts`), cuando `payment_status = approved`, upsert también en `partner_orders` usando el `tenant_id` de la orden.

**NO hacer:** tocar el modelo de datos de `partner_orders` ni la lógica de KPIs existente.

---

### TASK-006 — Corregir ventana temporal de conversionRate (BUG-2)

**Detectado por:** TASK-003 auditoría.

**Por qué:** `orders30d` usa ventana rolling de 30 días, `leadsThisMonth` usa mes calendario. El rate es inconsistente.

**Alcance:** En `lib/partners/dashboard-kpis.ts`, usar la misma ventana rolling de 30 días para contar leads (`gte created_at, t30d`).

---

### TASK-007 — Soporte sidebar: quitar candado para Starter

**Por qué:** TASK-002 democratizó tickets pero el sidebar de `/workspace/*` seguía mostrando el ítem **Soporte** con candado (ícono `Lock`) y opacidad reducida para partners Starter. El gate visual contradice la decisión comercial.

**Alcance:** En [app/workspace/layout.tsx:79](app/workspace/layout.tsx#L79) quitar el `requiredPlan: 'growth'` del ítem Soporte. Resto de los ítems (Chatbot, Meta Business, Meta Ads, Feeds, Analytics, Billing) mantienen su gating original.

**Criterio DONE:**
- [x] Partner Starter ve "Soporte" sin candado y con opacidad completa
- [x] Chatbot sigue con candado para Starter
- [x] Commit `[AP-v4.2 TASK-007]`

**Estado:** DONE en commit posterior.

---

### TASK-008 — Storefront Falco roto: logo + banner no cargan en /p/falco

**Por qué:** Visitando https://novamente.ar/p/falco el logo del halcón y el banner no renderizan (broken image). El asset existe en `public/falco/halcon-negro.png` y responde HTTP 200, pero la fila `tenants` de Falco en Supabase probablemente tiene `logo_url`/`banner_url` con valor incorrecto (null, path equivocado, o URL externa rota). Mismo síntoma en la card del directorio /marcas.

**Alcance:**
1. **Auditoría DB (read-only):** consultar Supabase tabla `tenants` donde `slug='falco'` y reportar valores actuales de `logo_url`, `banner_url`, `hero_url`, `card_image`. Documentar en `backlog/UPDATES.md`.
2. **Fix:** si los valores no apuntan a los paths correctos según [migrations/seed_existing_partners.sql](migrations/seed_existing_partners.sql), generar migración SQL nueva en `migrations/fix_falco_assets.sql` con:
   ```sql
   UPDATE tenants
   SET logo_url = '/falco/halcon-negro.png',
       banner_url = '/falco/anclas-watermark.png'
   WHERE slug = 'falco';
   ```
3. **NO ejecutar la migración** — el humano la corre en Supabase Studio manualmente.
4. **Verificar app:** después de que el humano corra la migración, abrir https://novamente.ar/p/falco y confirmar que ambos assets renderizan. Tomar screenshot para `backlog/UPDATES.md`.
5. Si la causa NO es la DB sino código (ej. el componente de /p/[slug] tiene un bug con paths que arrancan con `/`), fixearlo en `app/p/[slug]/page.tsx`.

**Archivos esperados:**
- `migrations/fix_falco_assets.sql` (crear si la DB tiene valores incorrectos)
- `backlog/UPDATES.md` (append diagnóstico)
- Posibles cambios en `app/p/[slug]/page.tsx` si el bug es código

**Criterio DONE:**
- [ ] Reporte de los valores actuales de Falco en `tenants` documentado
- [ ] Migración SQL creada (si aplica)
- [ ] Si código bug → fix aplicado y `tsc --noEmit` verde
- [ ] Commit `[AP-v4.2 TASK-008]`

**NO hacer:**
- NO ejecutar la migración en Supabase (solo crear el .sql)
- NO subir imágenes nuevas — usar las que ya están en `public/falco/`
- NO modificar `src/data/partners.ts` (esa estructura es legacy, ya no se usa en /p/[slug])

**Estado:** Migración SQL pre-emptiva creada en [migrations/fix_falco_assets.sql](migrations/fix_falco_assets.sql) cubriendo la causa más probable (logo_url/banner_url null o mal seteados en la fila `tenants WHERE slug='falco'`). El humano la corre manualmente en Supabase Studio. Si después de aplicarla los assets siguen rotos, escalar a investigar el componente `app/p/[slug]/page.tsx`.

---

### TASK-009 — Design engine: garment mismatch + controles de placement y tamaño de estampa

**Por qué:** Tres bugs/gaps observados en `/workspace/design-engine`:

1. **Garment mismatch (BUG):** el usuario selecciona "Remera Aldea Classic Fit" en el dropdown del input pero el preview muestra el mockup en `buzo-cuello-redondo · white · back`. El sistema está usando una prenda distinta a la elegida en el form.
2. **Sin control de cara (FEATURE):** no hay UI para elegir si la estampa va al frente o atrás de la prenda. El sistema parece elegirla solo (en el ejemplo eligió `back`).
3. **Sin control de tamaño/modo (FEATURE):** no hay UI para elegir el tamaño de la estampa ni si va en modo "logo" (chico en pecho/manga) o estampa grande.

**Alcance:**

**Bug-fix (prioridad 1):**
- Auditar [app/workspace/design-engine/page.tsx](app/workspace/design-engine/page.tsx) y `lib/partners/design-engine.ts`: detectar dónde se cruzan la `selectedGarment` del dropdown y la prenda que termina en el render del mockup.
- Asegurar que `applyToGarment(designUrl, garmentKey, ...)` reciba la `garmentKey` realmente seleccionada por el usuario, no la default ni la última cliqueada en el panel "Prendas Base".
- Test manual: seleccionar Aldea Classic Fit en el dropdown, generar diseño → el mockup debe ser `aldea-classic-tshirt`, no buzo.

**Features (prioridad 2):**
- Agregar selector de cara: dos botones `Frente / Espalda` debajo del preview (o cerca del botón "Aplicar a prenda"). Default: Frente.
- Agregar selector de modo de estampa: 3 opciones radio/segmented:
  - `Estampa grande` (≈30×30 cm centrada en pecho/espalda)
  - `Logo pecho` (≈10×10 cm, lado izquierdo arriba)
  - `Logo manga` (≈8×8 cm en manga, si la prenda lo soporta)
- Persistir `placement` y `stampMode` en la `DesignSession` (probable interfaz en `lib/partners/design-engine.ts`).
- Pasar esos parámetros a `lifestyle-mockup.ts` / pipeline de Gemini que genera el mockup final, ajustando el tamaño y posición del overlay.

**Archivos esperados:**
- `app/workspace/design-engine/page.tsx` (UI controles + state)
- `lib/partners/design-engine.ts` o `lib/partners/lifestyle-mockup.ts` (lógica placement/size)
- Tipos en `lib/partners/types.ts` si la sesión persiste estos campos

**Criterio DONE:**
- [ ] Repro confirmada: con Aldea Classic Fit seleccionada, el mockup sale en Aldea (no en buzo)
- [ ] Toggle Frente/Espalda funciona y se respeta en el mockup
- [ ] Selector de modo (Grande / Logo pecho / Logo manga) funciona
- [ ] `npx tsc --noEmit` verde
- [ ] Commit `[AP-v4.2 TASK-009]`

**NO hacer:**
- NO rediseñar el panel de "Prendas Base" del lado derecho — solo el flujo de input → preview.
- NO agregar opciones nuevas de prendas; las 8 actuales son la única lista.
- NO tocar lógica de cobro / pricing.

**Sprints estimados:** 3 (1 fix bug + 2 features de UI/lógica de placement).

---

### TASK-010 — Unificar todos los WhatsApp a +54 9 2235 16-9720

**Por qué:** Hay múltiples números de WhatsApp distintos hardcodeados en la web (`5491161759011`, `5491162377535`, `5491169696741`, además del oficial `5492235169720`). Esto disperse los leads a chats que pueden estar inactivos o ser personales. El número oficial único es **+54 9 2235 16-9720** (`5492235169720`).

**Alcance:**
- Reemplazar todos los números de WhatsApp en `app/**` (páginas públicas, demos, landings, workspace) por `5492235169720` en:
  - URLs `https://wa.me/<numero>` (preservar el `?text=...` existente de cada CTA, NO tocar el mensaje).
  - Campos `telephone:` de JSON-LD (`app/layout.tsx`, `app/nosotros/page.tsx`, etc.).
  - Texto visible tipo "+54 9 ..." que aparezca en la UI (ej. [app/nosotros/page.tsx:317](app/nosotros/page.tsx#L317)).
- Revisar también `components/`, `lib/`, `content/`, `data/`, `docs/` por si hay números en componentes compartidos, bubbles flotantes (WhatsApp floating button), constantes (`WA_NUMBER`, `CONTACT_PHONE`), o markdown.
- Si encontrás una constante centralizada de número de WhatsApp, usarla y dejar `5492235169720` ahí — preferir centralizar a reemplazar in-place cuando ya exista la constante.
- **NO** tocar números en `node_modules/`, `.next/`, `migrations/`, archivos de tests que validen formato genérico, ni en backups (`_originals/`, `.bak`).
- **NO** modificar los mensajes `?text=...` ni los `ref · NV-XXX` de tracking — solo el número.

**Candidatos detectados (no exhaustivo, verificar con grep):**
- `5491161759011` — `app/demo/page.tsx`, `app/demo/[slug]/page.tsx`
- `5491162377535` — `app/merch-para-bandas/page.tsx`, `app/lanza-tu-marca/page.tsx`, `app/uniformes-personalizados/page.tsx`, `app/indumentaria-deportiva/page.tsx`, `app/remeras-cumpleanos/page.tsx`
- `5491169696741` — `app/merch-para-creadores/page.tsx`

**Comando de auditoría sugerido antes y después:**
```bash
grep -rEn "wa\.me/[0-9]+|tel:\+?[0-9]{10,}|\b549[0-9]{10}\b" --include="*.tsx" --include="*.ts" app/ components/ lib/ 2>/dev/null | grep -v node_modules
```
Después del cambio, **el único número que debe aparecer es `5492235169720`** (o su forma con espacios/guiones `+54 9 2235 16-9720`).

**Checklist:**
- [ ] Audit inicial (grep) — listar todas las ocurrencias.
- [ ] Reemplazar números en `app/**`.
- [ ] Revisar `components/`, `lib/`, `data/`, `content/` por bubbles flotantes y constantes compartidas.
- [ ] Audit final (mismo grep) — solo debe quedar `5492235169720`.
- [ ] `npx tsc --noEmit` verde.
- [ ] `npm run build` verde.
- [ ] Commit `fix(contact): unificar WhatsApp a +54 9 2235 16-9720 [AP-v4.2 TASK-010]`.

**Sprints estimados:** 1.

---

## BACKLOG FUTURO (no corre todavía)

Mover items acá cuando aparecen ideas pero no están listas para sprint.

- **Excel `1.5.26 | Precios Nuevos Productos - dreamful - Update.xlsx`** — agregar dos tabs nuevas con la info de Plan Growth (sin tocar precios B2C existentes):
  - Tab `Plan_Growth`: una fila por producto con `Producto`, `Costo (peor color, Cost_2_Print)`, `Precio Plan Growth` (= Costo + $2.000), `Diferencia vs tier Partner 1u`, `Diferencia vs tier Bulk 100u`, `% ahorro vs Partner 1u`.
  - Tab `Summary_Planes`: tabla compacta con `Producto`, `B2C web`, `Partner gratis (Starter)`, `Plan Growth`, `Margen partner vendiendo a B2C` (= B2C − Growth).
  - NO recalcular ni modificar la columna B2C en otras hojas ni los tiers Partner/Starter/Pro/Drop/Bulk.
  - Ejecutarlo desde la extensión Claude Code del Excel (ver prompt guardado en chat de Sambu del 2026-05-18).


## AUTO-FEEDER — 2026-05-18

Detectados por `scripts/backlog-auto-feeder.sh`. Mover a SPRINT ACTUAL si se quieren correr.

### AUTOFEED-20260518-1 — tsc: rag-sources.test.ts:36

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `__tests__/chat/rag-sources.test.ts` línea 36

**Error:**
```
TS2304: Cannot find name 'beforeAll'.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260518-1]`

---

### AUTOFEED-20260518-2 — tsc: rag-sources.test.ts:101

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `__tests__/chat/rag-sources.test.ts` línea 101

**Error:**
```
TS2304: Cannot find name 'beforeAll'.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260518-2]`

---

### AUTOFEED-20260518-3 — tsc: generate-stamp.test.ts:105

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `__tests__/generation/generate-stamp.test.ts` línea 105

**Error:**
```
TS2304: Cannot find name 'afterEach'.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260518-3]`

---

### AUTOFEED-20260518-4 — tsc: route.ts:37

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `app/api/partners/design/library/route.ts` línea 37

**Error:**
```
TS2339: Property 'url' does not exist on type 'PartnerAsset'.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260518-4]`

---

### AUTOFEED-20260518-5 — tsc: route.ts:40

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `app/api/webhooks/whatsapp/route.ts` línea 40

**Error:**
```
TS2769: No overload matches this call.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260518-5]`

---

## AUTO-FEEDER — 2026-05-18

Detectados por `scripts/backlog-auto-feeder.sh`. Mover a SPRINT ACTUAL si se quieren correr.

### AUTOFEED-20260518-1 — tsc: page.ts:34

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `.next/types/app/design/[imageId]/page.ts` línea 34

**Error:**
```
TS2344: Type 'PageProps' does not satisfy the constraint 'import("/Users/sambujuan/novamente/dev/novamente4.2-main 2/.next/types/app/design/[imageId]/page").PageProps'.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260518-1]`

---

## AUTO-FEEDER — 2026-05-19

Detectados por `scripts/backlog-auto-feeder.sh`. Mover a SPRINT ACTUAL si se quieren correr.

### AUTOFEED-20260519-1 — tsc: DesignCanvas.tsx:4

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `app/crear/DesignCanvas.tsx` línea 4

**Error:**
```
TS2307: Cannot find module 'react-konva' or its corresponding type declarations.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260519-1]`

---

### AUTOFEED-20260519-2 — tsc: DesignCanvas.tsx:5

**Por qué:** Detectado por auto-feeder (tsc).

**Archivos:**
- `app/crear/DesignCanvas.tsx` línea 5

**Error:**
```
TS2307: Cannot find module 'konva' or its corresponding type declarations.
```

**Criterio DONE:**
- [ ] Error resuelto
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 AUTOFEED-20260519-2]`

---
