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
| 11 | TASK-008 | Storefront Falco roto: logo + banner no cargan en /p/falco | 1 | sí (migración SQL corrida en Supabase 2026-05-19) | DONE |
| 12 | TASK-009 | Design engine: garment mismatch + controles de placement y tamaño de estampa | 3 | sí (con auditoría componente) | DONE |
| 13 | TASK-010 | Unificar todos los WhatsApp (bubbles + links + tel) a +54 9 2235 16-9720 | 1 | sí | DONE |
| 14 | TASK-011 | Mobile UX Design Engine + claridad de límites (drawer X + banner + límite semanal) | 1 | sí | DONE |
| 15 | TASK-006 | Corregir ventana temporal de conversionRate (BUG-2, ventana rolling 30d para leads) | 1 | sí | DONE |
| 16 | TASK-005 | Bridgear ventas B2C → partner_orders (BUG-1 crítico: tenant_id en orders + webhook MP) | 2 | sí (con migración SQL nueva) | DONE |
| 17 | TASK-012 | Actualizar copy del hint del campo CBU (modelo "liquidación en el momento") | 1 | sí | DONE |
| 18 | TASK-013 | Banner explicativo del modelo de negocio en /workspace (dashboard) | 1 | sí | DONE |
| 19 | TASK-014 | Fix bug checklist: "Generar primer diseño IA" tiene `done:false` hardcodeado | 1 | sí | DONE |
| 20 | TASK-015 | Validar precio obligatorio antes de publicar producto en catálogo | 1 | sí | DONE |
| 21 | TASK-016 | Métricas mínimas de onboarding: timestamps por hito del funnel | 1 | sí (con migración SQL nueva) | DONE |
| 22 | TASK-017 | Quick-start "tu primer producto en 3 pasos" en dashboard (P6) | 2 | sí | DONE |
| 23 | TASK-018 | Nova proactivo: bienvenida automática al primer login (P9) | 2 | sí | DONE |
| 24 | TASK-019 | Desglose costo/PVP/ganancia en formulario de producto (P7) | 2 | sí | DONE |
| 25 | TASK-020 | "Subí tu diseño" como acción primaria del workspace (P8) | 3 | sí | BLOCKED — criterio DONE y archivos TBD, necesita refinamiento |
| 26 | TASK-021 | RESEARCH: ¿el campo `partner_type` del wizard se respeta en UI o quedó dato muerto? | 1 | sí (research, no code) | DONE — dato muerto, ver PROGRESS.md Sprint 026 |
| 27 | TASK-022 | Storefront Score: tooltip "cómo subir tu score" + explicación del cálculo | 1 | sí | PENDING |
| 28 | TASK-023 | RESEARCH: cuantificar impacto del localStorage device-switch en wizard | 1 | sí (research) | PENDING |
| 29 | TASK-024 | Acortar wizard de alta (7 pasos → versión express + el resto al workspace) | 3 | sí | BLOCKED — necesita data de TASK-016 |
| 30 | TASK-025 | FAQ content para /workspace/support — CANCELADA (Juan decidió 2026-05-26 no hacerla) | — | — | CANCELLED |
| 31 | TASK-026 | Navbar: dropdown "Soy Cliente / Soy Partner" antes del popup de auth | 1 | sí | PENDING |

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

### TASK-011 — Mobile UX Design Engine + claridad de límites

**Por qué:** Partner real (+54 9 2236 68-1701, Shopsur) reportó por WhatsApp el 2026-05-19 que (a) no encontraba cómo cerrar el drawer de prendas en mobile, (b) entró a "Agregar producto" buscando elegir una prenda Novamente y no aparecía el selector, (c) "no me deja poner más" en Design Engine sin entender que era el límite semanal Starter (2/5 generaciones).

**Alcance hecho (DONE en este commit):**
- [app/workspace/design-engine/page.tsx](app/workspace/design-engine/page.tsx) — header del drawer "Prendas Base" ahora `sticky top-0`, botón cerrar pasó de X chiquito a un botón "✕ Cerrar" con label visible, fondo `bg-zinc-800`, touch target ≥40px, solo en mobile (`lg:hidden`).
- [app/workspace/catalog/page.tsx](app/workspace/catalog/page.tsx) — banner clickeable arriba del modal "Nuevo producto" (solo en modo `create`) que linkea a `/workspace/design-engine` y explica que ese formulario es para subir el producto propio del partner, no para diseñar sobre prendas Novamente.

**Pending (NO incluido todavía — sumar a próximo sprint):**
- [ ] Cuando el partner alcanza el límite semanal de generaciones en Design Engine (ej. 5/5 Starter), mostrar un mensaje explícito tipo "Llegaste a 5/5 generaciones esta semana. Renueva el lunes o pasá a Growth para 25/semana" en lugar de simplemente bloquear silenciosamente el botón send.
- [ ] Botón "Crear producto" en catálogo: cuando está `disabled` porque falta `formName.trim()`, agregar tooltip o helper text inline ("Falta nombre del producto") para que no parezca un bug.
- [ ] Revisar contraste de los botones flotantes del chat (Aplicar a prenda, zoom, abrir) en pantallas ≤375px — el cliente reportó "no se ven bien" aunque visualmente parecen OK; pedir screenshot adicional si se vuelve a quejar.

**Validación:**
- [x] `npx tsc --noEmit` verde tras los dos fixes aplicados.
- [ ] Smoke manual en mobile real (Chrome Android) — abrir drawer en Design Engine, verificar que "Cerrar" cierra el panel; abrir "Agregar producto" desde catálogo, verificar banner clickeable hacia design-engine.

**Sprints estimados:** 1 (para cerrar pendientes).

---

## BACKLOG FUTURO (no corre todavía)

Mover items acá cuando aparecen ideas pero no están listas para sprint.

_(vacío al 2026-05-22)_


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

<!-- Auto-feeder entries del 2026-05-18 (page.ts:34) y 2026-05-19
     (DesignCanvas.tsx react-konva / konva) verificadas como obsoletas
     al 2026-05-22: tsc --noEmit pasa limpio. Resueltas en commits posteriores
     que no actualizaron el backlog. Eliminadas para no falsear pendientes. -->

---

# Sprint Onboarding (2026-05-26) — derivado de [docs/onboarding-audit-2026-05.md](../docs/onboarding-audit-2026-05.md)

Casos disparadores: Elyar, Gabriel, Karina, Daniel (mails 23-25/05).

---

### TASK-012 — Actualizar copy del hint del campo CBU

**Por qué:** El campo `bank_cbu` ya existe en [app/workspace/settings/page.tsx:764](app/workspace/settings/page.tsx#L764) con el hint actual "Tu CBU es donde recibirás los pagos de ventas. Debe tener exactamente 22 dígitos." Es correcto pero no comunica (a) que la liquidación es **inmediata**, (b) que **no hace falta conectar pasarela** (Gabriel se confundió con esto).

**Alcance:**
- Cambiar el texto del hint debajo del campo CBU en [app/workspace/settings/page.tsx](app/workspace/settings/page.tsx) (línea ~780) por:
  > "Acá te depositamos tu ganancia **en el momento** cada vez que vendés. No necesitás conectar MercadoPago ni ninguna pasarela — el cliente le paga a Novamente y nosotros te liquidamos directo a esta cuenta."
- Mantener la validación de 22 dígitos.
- Cambiar el label del campo de "CBU" a "CBU / CVU para recibir tus liquidaciones".
- El hint sobre "22 dígitos" pasar a `placeholder` del input para no duplicar la palabra "dígitos".

**Archivos:**
- `app/workspace/settings/page.tsx` (modificar líneas ~764-780)

**Criterio DONE:**
- [ ] Label y hint actualizados según copy de arriba
- [ ] Validación 22 dígitos sigue funcionando
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-012]`

**NO hacer:** mover el campo a otra página/sección todavía (eso vendría con TASK-024).

---

### TASK-013 — Banner explicativo del modelo de negocio en /workspace

**Por qué:** El partner que llega al workspace no encuentra en NINGÚN lado copy que explique cómo funciona el flujo de plata. Gabriel asumió que tenía que conectar MercadoPago. Daniel no entendía cuál era su ganancia. Necesitamos un mensaje claro arriba del checklist del dashboard.

**Alcance:**
- Crear componente `<BusinessModelBanner />` en `components/workspace/`.
- Renderizarlo en [app/workspace/page.tsx](app/workspace/page.tsx) **arriba del checklist** (antes del bloque que arranca en la línea ~600 donde aparece Recent Activity/Checklist).
- Contenido (3 bullets):
  - "El cliente le paga directo a Novamente — no necesitás pasarela."
  - "Producimos y enviamos en 24-48hs cuando hay venta."
  - "Te liquidamos tu ganancia (PVP − costo Novamente) **en el momento** a tu CBU/alias."
- Card descartable: agregar columna `onboarding_dismissed_business_model BOOLEAN DEFAULT FALSE` a tabla `tenants` (migración nueva).
- Click en "Entendido" (X) hace PATCH al setting y oculta la card.
- Mientras `onboarding_dismissed_business_model === false`, se muestra; si es `true`, no renderiza.
- Estilos: card con icono `Sparkles` o `Info`, fondo suave (emerald/amber sutil), no robar protagonismo a los KPIs.

**Archivos:**
- `components/workspace/BusinessModelBanner.tsx` (crear)
- `app/workspace/page.tsx` (modificar — importar y renderizar)
- `app/api/partners/settings/route.ts` o equivalente (extender PATCH para aceptar el nuevo flag — buscar si existe ya)
- `migrations/<próximo-número>_onboarding_dismiss_flags.sql` (crear, NO ejecutar)

**Criterio DONE:**
- [ ] Banner visible al primer login con los 3 bullets exactos
- [ ] Botón cerrar persiste el dismiss (refresh no lo revive)
- [ ] Migración SQL creada (NO ejecutada — Juan la corre en Supabase)
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-013]`

---

### TASK-014 — Fix bug checklist: "Generar primer diseño IA" hardcodeado

**Por qué:** En [app/workspace/page.tsx:310](app/workspace/page.tsx#L310) el ítem del checklist "Generar tu primer diseño con IA" tiene `done: false` con un comentario `// TODO: track from design assets`. Nunca se marca como hecho aunque el partner haya generado 10 diseños. Es percepción de plataforma rota.

**Alcance:**
- Buscar la tabla/colección donde se almacenan las generaciones del Studio (probablemente `design_assets`, `design_sessions` o algo en `lib/design-engine/`). Grep recomendado: `design_asset`, `design_session`, `studio_generation`.
- Extender el endpoint que provee la data del dashboard (probablemente `app/api/partners/dashboard/route.ts` o `app/api/partners/stats/route.ts`) para incluir `design_count: number`.
- En [app/workspace/page.tsx:308-312](app/workspace/page.tsx#L308-L312) reemplazar `done: false` por `done: data.designs > 0` (o el nombre que se decida).
- Actualizar el type `DashboardData` (línea 39) con el nuevo campo.

**Archivos:**
- `app/workspace/page.tsx` (modificar)
- `app/api/partners/dashboard/route.ts` o equivalente (extender)

**Criterio DONE:**
- [ ] Ítem se marca como done cuando hay ≥1 diseño generado por ese tenant
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-014]`

**NO hacer:** rediseñar el checklist completo, eso es parte de TASK-017.

---

### TASK-015 — Validar precio obligatorio antes de publicar producto

**Por qué:** Hoy en [app/workspace/catalog/page.tsx:52](app/workspace/catalog/page.tsx#L52) el precio es `price: number | null`. Un partner puede publicar un producto sin precio. Eso rompe el storefront y confunde al cliente final.

**Alcance:**
- En el modal/form de catálogo, cuando el partner cambia el `status` a `published` o hace click en "Publicar":
  - Si `price === null || price <= 0`, bloquear la acción y mostrar mensaje inline: "Necesitás definir un precio antes de publicar este producto."
  - Mantener "Guardar como borrador" sin esa restricción.
- También bloquear en el backend (PATCH del producto): si `status === 'published'` y `price` es nulo/cero, devolver 400.

**Archivos:**
- `app/workspace/catalog/page.tsx` (modificar)
- `app/api/partners/catalog/[id]/route.ts` o equivalente (revisar y agregar validación backend)

**Criterio DONE:**
- [ ] No se puede publicar un producto sin precio (UI bloquea + backend rechaza)
- [ ] Mensaje de error visible y claro
- [ ] Borrador sigue funcionando sin precio
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-015]`

---

### TASK-016 — Métricas mínimas de onboarding (funnel timestamps)

**Por qué:** Sin data no podemos medir el impacto de TASK-012/013/014/015 ni decidir qué pasos del wizard sacar (TASK-024). Necesitamos los timestamps básicos del funnel ya.

**Alcance:**
- Migración SQL nueva: agregar a tabla `tenants` (o tabla aparte `tenant_funnel` si se considera más prolijo):
  - `created_at` (ya existe seguramente)
  - `first_login_at TIMESTAMPTZ NULL`
  - `first_branding_save_at TIMESTAMPTZ NULL`
  - `first_design_at TIMESTAMPTZ NULL` (al generar primer diseño en Studio)
  - `first_product_draft_at TIMESTAMPTZ NULL`
  - `first_product_published_at TIMESTAMPTZ NULL`
  - `storefront_published_at TIMESTAMPTZ NULL` (si no está ya)
- Disparar cada timestamp **solo la primera vez** (UPDATE ... WHERE field IS NULL):
  - `first_login_at`: en `/api/auth/set-session` o donde se setea la cookie post-login.
  - `first_branding_save_at`: en el PATCH de branding/settings cuando `logo_url || banner_url || tagline` se completan.
  - `first_design_at`: en el endpoint del Studio que persiste un diseño.
  - `first_product_draft_at`: en el POST de creación de producto.
  - `first_product_published_at`: en el PATCH cuando `status: 'published'` y la columna sigue NULL.
- No hacer dashboard de visualización — los datos quedan en DB para queries manuales en Supabase.

**Archivos:**
- `migrations/<próximo-número>_onboarding_funnel_timestamps.sql` (crear)
- Identificar y modificar los endpoints listados arriba (research previo necesario)

**Criterio DONE:**
- [ ] Migración SQL creada
- [ ] Cada timestamp se setea correctamente la primera vez y no se sobreescribe
- [ ] Documentar en `backlog/PROGRESS.md` cómo consultar el funnel (query SQL ejemplo)
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-016]`

**NO hacer:** dashboards, gráficos, ni eventos PostHog/Mixpanel. Solo timestamps en DB.

---

### TASK-017 — Quick-start "tu primer producto en 3 pasos" (P6)

**Por qué:** El checklist de 10 ítems no guía al partner nuevo. Karina ("¿y ahora qué?") es el caso. Necesitamos una versión condensada que solo aparezca para tenants con 0 productos. Implementación conservadora — **no remueve ni modifica el checklist actual**, solo agrega una card visual arriba que desaparece cuando ya no aplica.

**Alcance:**
- Crear componente `components/workspace/QuickStartCard.tsx`.
- Renderizar en [app/workspace/page.tsx](app/workspace/page.tsx) **debajo del banner de TASK-013 y arriba del checklist actual**, solo si `data.products === 0`.
- Cuando `data.products >= 1`, el componente retorna `null` y el partner ve el checklist completo de siempre.
- Estructura visual: card con título "Tu primer producto en 3 pasos" y 3 sub-cards horizontales (stack vertical en mobile), cada una con:
  1. **"Subí tu logo"** → CTA "Configurar branding" → `/workspace/branding`. Done si `tenant.logo_url !== null`.
  2. **"Generá o subí tu primer diseño"** → CTA "Ir al Studio" → `/workspace/design-engine`. Done si la nueva columna del dashboard (TASK-014) reporta `data.designs > 0`. Si TASK-014 todavía no está mergeada, usar `false` y aceptar el detalle estético.
  3. **"Publicá tu primer producto"** → CTA "Crear producto" → `/workspace/catalog`. Done si `data.products > 0` (en ese caso ya no se muestra el componente entero, pero por completitud).
- Cada sub-card muestra `CheckCircle2` verde si done, `Circle` gris si pendiente. Misma estética que el checklist actual.
- Borde sutil violeta/emerald, fondo `bg-zinc-900/60` para combinar con el resto del dashboard.

**Archivos:**
- `components/workspace/QuickStartCard.tsx` (crear)
- `app/workspace/page.tsx` (importar y renderizar condicionalmente)

**Criterio DONE:**
- [ ] Card visible solo cuando `data.products === 0`
- [ ] Los 3 pasos linkean correctamente
- [ ] Estados done/pendiente reflejan la realidad del tenant
- [ ] El checklist completo de 10 ítems sigue intacto debajo (NO se elimina ni modifica)
- [ ] Responsive (stack en mobile, row en desktop)
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-017]`

**NO hacer:** modificar el checklist actual de 10 ítems, ni cambiar el cálculo del Storefront Score, ni tocar el `KpiOverview`. Es un componente nuevo y aditivo.

---

### TASK-018 — Nova proactivo: bienvenida al primer login (P9)

**Por qué:** Nova ya existe como FAB en workspace (commit 5c73c9a). Falta que se abra proactivamente la primera vez con un mensaje de bienvenida y opciones rápidas. Implementación conservadora — **no modifica la lógica de chat existente de Nova, solo agrega un mensaje inicial inyectado bajo cierta condición**.

**Alcance:**
- En [components/PublicAssistant.tsx](components/PublicAssistant.tsx), al inicializar el componente:
  - Si `mode === 'partner'` && `pageContext` es del workspace && el partner cumple condición de "primer login" (ver abajo) → abrir el panel automáticamente con un mensaje precargado en la lista de mensajes.
- **Condición de primer login (conservadora, sin tocar DB):** usar `localStorage` con key `nv_nova_welcome_shown_<tenantId>`. Si no existe → mostrar welcome y setear flag. Si existe → comportamiento normal (Nova queda como FAB cerrado).
  - **Por qué localStorage y no DB:** evita migración, evita endpoints nuevos, no rompe nada. Trade-off conocido: si el partner limpia storage o cambia dispositivo lo verá de nuevo (aceptable para un mensaje de bienvenida).
- Mensaje inicial (rol `assistant`, prepended a la conversación):
  > "¡Bienvenido a Novamente! 👋 Soy Nova, tu asistente. Estoy acá para ayudarte a arrancar. ¿Por dónde querés empezar?"
- Quick replies (botones bajo el mensaje, reusar la UI de quick replies existente):
  - "¿Cómo funciona el modelo?" → envía el texto literal al chat (ya existe la infra de quick replies)
  - "Ayudame a subir mi primer diseño"
  - "Mostrame cómo configurar mi tienda"
- Si el partner cierra el panel sin interactuar, igual marcamos el flag (`nv_nova_welcome_shown_<tenantId> = true`) — no insistimos.

**Archivos:**
- `components/PublicAssistant.tsx` (modificar — agregar `useEffect` que dispara welcome)
- `lib/hooks/useAssistantAuth.ts` o similar — leer `tenantId` del response del `/api/assistant/identify` (ya existe)

**Criterio DONE:**
- [ ] Partner logueado con tenant nuevo ve el panel abierto con mensaje + 3 quick replies en el primer ingreso al workspace
- [ ] Refresh inmediato NO vuelve a abrir el panel (flag localStorage seteado)
- [ ] Quick replies envían el mensaje al chat existente correctamente
- [ ] Visitante público (`mode === 'visitor'`) y admin NO ven el welcome
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-018]`

**NO hacer:** modificar el endpoint `/api/assistant/chat`, ni tocar la lógica de role detection, ni crear tablas nuevas. Esta tarea es 100% client-side encima de la infra de Nova que ya funciona.

---

### TASK-019 — Desglose costo/PVP/ganancia en formulario de producto (P7)

**Por qué:** Daniel preguntó "¿cuál sería mi ganancia?". El catálogo solo muestra `price`. Necesitamos breakdown "costo: X / PVP: Y / ganancia: Z" al lado del campo precio. **Verificado 2026-05-26:** la lógica de planes ya está integrada en [lib/partners/garment-pricing.ts:50-75](lib/partners/garment-pricing.ts#L50-L75) — existen las funciones `getPartnerPlanPrice(garmentKey, plan)` y `getPartnerPlanMargin(garmentKey, plan)` con los 3 planes (`starter`/`growth`/`pro`). Sin dependencia bloqueante.

**Alcance:**
- En el formulario/modal de producto en [app/workspace/catalog/page.tsx](app/workspace/catalog/page.tsx), debajo del input de `price`:
  - Componente nuevo `<MarginBreakdown />` que toma `(price, garmentKey, plan)`.
  - Renderiza solo si el producto tiene `garmentKey` mapeable (si no, mostrar nota "Asociá una prenda para ver tu margen").
  - Lee el `plan` actual del tenant desde el contexto/dashboard data (ya disponible en `data.tenant.plan`).
- Layout (3 filas, alineadas tabla):
  ```
  Tu PVP:           $15.000
  Costo Novamente:  $7.500    (tu plan: Growth)
  Tu ganancia:      $7.500    (50%)
  ```
- Recalcular en vivo al editar el precio (efecto sobre el state del modal).
- Si `getPartnerPlanPrice` devuelve `null` (prenda no encontrada en el mapa), ocultar el desglose silenciosamente.
- Color: ganancia en verde si margen >0%, ámbar si <20%, rojo si negativo. (Si margen negativo, agregar warning: "Estás vendiendo por debajo del costo.")

**Archivos:**
- `components/workspace/MarginBreakdown.tsx` (crear)
- `app/workspace/catalog/page.tsx` (importar y renderizar dentro del modal)
- `lib/partners/garment-pricing.ts` (solo lectura, no modificar)

**Criterio DONE:**
- [ ] Desglose visible al lado del precio en el modal del catálogo
- [ ] Recalcula en vivo al editar el precio
- [ ] Refleja el plan del tenant correctamente
- [ ] Warning visible si margen es negativo
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-019]`

**NO hacer:** modificar `garment-pricing.ts` ni cambiar el modelo de planes. Solo consumir lo que ya existe.

---

### TASK-020 — "Subí tu diseño" como acción primaria (P8)

**Por qué:** Elyar dijo "tengo diseños propios pero tampoco puedo subir mi archivo". Hoy el upload de PNG está mezclado en (a) imágenes de producto en catálogo (máx 5) y (b) input para mockup IA en Studio. No hay una acción primaria "subí tu diseño y lo aplicamos a la remera".

**Alcance:**
- Agregar card prominente en `/workspace` (dashboard) y en `/workspace/design-library` con CTA "Subí tu diseño".
- Click abre un componente drop-zone con:
  - Aceptar PNG/SVG con fondo transparente (validar `image/png` con canal alpha — opcional, warn si no transparente).
  - Validar resolución mínima recomendada (≥1500px lado largo o ≥300 DPI).
  - Preview inmediato.
- Después del upload, ofrecer:
  - Aplicar a mockup (link al Studio precargado con el PNG)
  - Guardar en Biblioteca
  - Publicar como producto (link a catálogo precargado)
- Persistir el PNG en R2 (reutilizar infra existente de uploads).

**Archivos:** TBD (probablemente nuevo componente `components/workspace/QuickDesignUpload.tsx` + endpoint reutilizado).

**Criterio DONE:** TBD.

---

### TASK-021 — RESEARCH: ¿`partner_type` del wizard se respeta en UI?

**Por qué:** En el paso 3 del wizard de alta ([app/partners/join/page.tsx:78](app/partners/join/page.tsx#L78)) el partner elige entre `catalog_only | catalog_mockups | catalog_design_engine`. Hay que confirmar si esa decisión modifica la UI del workspace o quedó como dato muerto.

**Alcance (research, no code):**
- Grep en codebase: `partner_type`, `catalog_only`, `catalog_mockups`, `catalog_design_engine`.
- Identificar todos los puntos donde se lee el campo.
- Reportar en `backlog/PROGRESS.md`:
  - Dónde se lee.
  - Qué cambia en la UI según el valor.
  - Si es dato muerto: recomendar activarlo o sacarlo del wizard.

**Criterio DONE:**
- [ ] Reporte agregado a `PROGRESS.md`
- [ ] Si es dato muerto, abrir TASK siguiente para decidir activar/quitar
- [ ] Commit con tag `[AP-v4.2 TASK-021]` (aunque sea solo cambio en PROGRESS.md)

---

### TASK-022 — Storefront Score: tooltip explicativo

**Por qué:** El dashboard muestra un "Storefront Score" como ring de progreso pero no explica cómo se calcula. El partner ve "30%" y no sabe qué hacer.

**Alcance:**
- En el componente que renderiza el score (probablemente dentro de `KpiOverview` o en `app/workspace/page.tsx`), agregar un tooltip (shadcn `Tooltip` ya está disponible) con icono `?` al lado del título "Storefront Score".
- Contenido del tooltip:
  > "Tu Storefront Score mide qué tan completa está tu tienda. Sube a medida que completás los pasos del checklist: branding, productos, primer diseño y publicación. Score 100% = tu tienda está lista para vender."
- Si el cálculo del score es derivado del checklist (probable), confirmar en el código y mencionarlo en el tooltip.

**Archivos:**
- `app/workspace/page.tsx` o `components/workspace/KpiOverview.tsx`

**Criterio DONE:**
- [ ] Tooltip visible al hover sobre el icono `?` junto al título
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-022]`

---

### TASK-023 — RESEARCH: impacto de localStorage device-switch en wizard

**Por qué:** El wizard de alta guarda progreso en `localStorage` ([app/partners/join/page.tsx:326](app/partners/join/page.tsx#L326), key `novamente_onboarding_progress`). Si el partner empieza en mobile y termina en desktop (o limpia cookies), pierde el progreso. ¿Qué tan grave es esto?

**Alcance (research):**
- Una vez TASK-016 tenga unas semanas de datos, query a la tabla `tenants`:
  - ¿Cuántos partners crearon registro en step 1 pero nunca completaron step 7?
  - ¿Cuántos volvieron a empezar el wizard desde cero (mismo email)?
- Reportar en `PROGRESS.md` con números.
- Si el impacto es >10% de signups, abrir TASK para migrar el storage a server-side (`tenant_onboarding_progress` tabla).

**Estado:** TODO (depende de TASK-016 + 2-3 semanas de data).

---

### TASK-024 — Acortar wizard de alta (BLOCKED)

**Estado:** BLOCKED hasta tener data de TASK-016 sobre dónde abandonan.

**Por qué:** El wizard tiene 7 pasos (Datos básicos → Identidad visual → Tipo partner → Estilo visual → Catálogo → Comercialización → Plan → Preview). Es demasiado largo para un partner que solo quiere probar. Versión express probable: 2 pasos (email + business name) + el resto al workspace.

**Decisión pendiente:** qué pasos sacar/mover. Se decide después de ver data de TASK-016.

---

### TASK-025 — FAQ content para /workspace/support — CANCELLED

**Estado:** CANCELLED por decisión de Juan el 2026-05-26. No se va a hacer por ahora. El form de tickets en `/workspace/support` sigue funcionando como hoy (TASK-002 + TASK-007 DONE).

---

### TASK-026 — Navbar: dropdown "Soy Cliente / Soy Partner"

**Por qué:** Hoy el botón "Iniciar sesión o registrarse" del navbar abre directamente el `AuthModal` (popup de email/contraseña). Pero ese popup es solo para clientes B2C — los partners deberían loguearse en `/partners/login`. Hace falta un dropdown intermedio que segmente.

**Alcance:**
- En [components/Navbar.tsx:200-201](components/Navbar.tsx#L200-L201) reemplazar el `onClick` que abre directo el modal por un dropdown (usar `DropdownMenu` de shadcn — ya está en el proyecto).
- El dropdown tiene 2 opciones:
  1. **"Soy Cliente"** — abre el `AuthModal` actual (`setAuthTab('signup')` + `setShowAuthModal(true)`, comportamiento idéntico al de hoy).
  2. **"Soy Partner"** — navega a `/partners/login` (usar `<Link href="/partners/login">` o `router.push`).
- El trigger del dropdown sigue diciendo "Iniciar sesión o registrarse" (mantener el mismo texto y estilo del botón actual).
- Ítems del dropdown con iconos:
  - "Soy Cliente" → icono `ShoppingBag` o `User`
  - "Soy Partner" → icono `Store` o `Briefcase`
- Subtítulo opcional debajo de cada ítem (texto chico, gris):
  - "Soy Cliente" → "Comprá remeras y buzos personalizados"
  - "Soy Partner" → "Accedé a tu workspace de marca"
- Aplicar tanto en desktop como en mobile (el navbar tiene versión sm: oculta para el texto, mantener consistencia).

**Archivos:**
- `components/Navbar.tsx` (modificar líneas ~195-210)

**Criterio DONE:**
- [ ] Click en "Iniciar sesión o registrarse" abre dropdown (no modal directo)
- [ ] "Soy Cliente" abre el AuthModal igual que antes
- [ ] "Soy Partner" navega a `/partners/login`
- [ ] Funciona en desktop y mobile
- [ ] `npx tsc --noEmit` verde
- [ ] Commit con tag `[AP-v4.2 TASK-026]`

**NO hacer:** cambiar el AuthModal en sí (sigue siendo solo para clientes B2C). Ni tocar `/partners/login`.
