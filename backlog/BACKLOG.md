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
