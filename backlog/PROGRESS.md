# Progress Log — Autopilot v4.2

Reverse-chronological. Cada sprint appendea su entrada al tope.

Formato:

---

## Sprint 028 — 2026-05-27
**Model:** sonnet
**Tasks DONE:**
- TASK-020 — feat(design): "Subí tu diseño" como acción primaria del workspace (P8)
  - `lib/partners/plan-limits.ts` — creado con `DESIGN_UPLOAD_LIMIT_BY_PLAN` (Starter=20, Growth=100, Pro=∞)
  - `migrations/design_source_column.sql` — ADD COLUMN source TEXT en partner_assets (NO ejecutada — Juan la corre en Supabase)
  - `app/api/partners/upload/route.ts` — gate de plan para design uploads + campo `source='uploaded'` + `status='active'` para que aparezcan en biblioteca
  - `components/workspace/QuickDesignUpload.tsx` — nuevo componente: dropzone PNG/SVG, validaciones, warnings no-bloqueantes (transparencia + resolución), preview, 3 botones post-upload (Mockup / Biblioteca / Publicar)
  - `app/workspace/page.tsx` — card "Subí tu propio diseño" entre BusinessModelBanner y QuickStartCard (descartable con X)
  - `app/workspace/design-engine/page.tsx` — tabs "Generar con IA / Subir mi PNG" en header del Studio; panel QuickDesignUpload en modo upload
  - `app/workspace/catalog/page.tsx` — lee `?prefilledDesignUrl=` y abre el modal de crear producto con la imagen precargada
**Tasks BLOCKED:**
- (ninguna)
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- TASK-020: requiere verificación visual — (a) abrir dashboard y verificar card upload; (b) abrir design-engine y verificar tab "Subir mi PNG"; (c) subir un PNG y verificar los 3 botones post-upload
- Migración `migrations/design_source_column.sql` pendiente de correr en Supabase Studio antes de que los uploads se guarden con source correctamente
- La card de upload en dashboard es siempre visible (no tiene estado persistente de dismiss — KISS por ahora)

---
```
## Sprint NNN — YYYY-MM-DD HH:MM
**Model:** sonnet|haiku|opus
**Tasks DONE:**
- TASK-001 — descripción (commit abc1234)
**Tasks BLOCKED:**
- TASK-002 — razón
**tsc:** PASS|FAIL
**build:** PASS|FAIL|SKIPPED
```

---

## Sprint 027 — 2026-05-26
**Model:** sonnet
**Tasks DONE:**
- TASK-022 — feat(workspace): tooltip Storefront Score actualizado con cálculo real
  - app/workspace/page.tsx: título → "¿Cómo subir tu Storefront Score?", body con factores exactos (logo, banner, desc, tagline, colores, CTA, industria, redes, SEO)
  - Nota: score NO deriva del checklist de productos — se verifica en lib/partners/tenant.ts:calculateCompletenessScore
- TASK-026 — feat(navbar): dropdown "Soy Cliente / Soy Partner" ante del AuthModal
  - components/Navbar.tsx: botón → DropdownMenu con 2 ítems, íconos ShoppingBag/Store, subtítulos descriptivos
  - "Soy Cliente" → abre AuthModal (comportamiento anterior), "Soy Partner" → /partners/login
**Tasks BLOCKED:**
- TASK-023 — necesita 2-3 semanas de data de TASK-016 (first_login_at / funnel timestamps). Re-evaluar ~2026-06-15.
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- TASK-022: requiere verificación visual — abrir dashboard workspace y hacer hover en el icono ? del Storefront Score
- TASK-026: requiere verificación visual — abrir navbar en incógnito y verificar dropdown + ambas opciones

---

## Sprint 026 — 2026-05-26
**Model:** sonnet
**Tasks DONE:**
- TASK-018 — feat(nova): bienvenida proactiva al primer login del workspace (commit e2d86cf)
  - components/PublicAssistant.tsx: useEffect + welcomeInjectedRef + localStorage flag
  - Solo para mode=partner en /workspace/*, sin DB ni migración
- TASK-019 — feat(catalog): desglose costo/PVP/ganancia en formulario de producto (commit eeaaa2a)
  - components/workspace/MarginBreakdown.tsx: creado
  - app/workspace/catalog/page.tsx: formGarmentKey state + selector prenda + MarginBreakdown
- TASK-021 — RESEARCH: partner_type del wizard (ver reporte abajo)
**Tasks BLOCKED:**
- TASK-020 — criterio DONE y archivos esperados están como TBD en el backlog. Necesita que Juan defina el alcance antes de ejecutar.
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- TASK-018: requiere verificación visual — abrir workspace en un tenant nuevo/sin flag y confirmar que Nova se abre con el mensaje de bienvenida
- TASK-019: requiere verificación visual — abrir modal de catálogo, seleccionar prenda base, cambiar precio y ver breakdown actualizar en vivo

---

### TASK-021 — Reporte: partner_type del wizard (2026-05-26)

**Pregunta:** ¿el campo `partner_type` del wizard (step 3) se respeta en la UI del workspace o quedó dato muerto?

**Hallazgo: DATO MUERTO**

El campo `partnerType` existe en el estado del wizard (`WizardData.partnerType`, `app/partners/join/page.tsx:78`) con 3 valores:
- `catalog_only` → label "Solo catálogo fijo"
- `catalog_mockups` → label "Catálogo + Mockups"
- `catalog_design_engine` → label "Catálogo + Design Engine completo"

El mapeo `PARTNER_TYPE_TO_ENGINE` (línea 1854) convierte esos valores a `design_engine_mode` de la DB:
- `catalog_only` → `'disabled'`
- `catalog_mockups` → `'mockups_only'`
- `catalog_design_engine` → `'full_brand_fit'`

**Problema:** `PARTNER_TYPE_TO_ENGINE` está definido pero **nunca se llama/usa**. Grep en todo el codebase no encuentra ninguna referencia de uso. La función `buildStepPayload` (línea 1867) tampoco envía `partnerType` a la API en ningún step.

**Cómo se setea `design_engine_mode` HOY:**
- Scripts manuales: `create-partner.ts:378` lo deriva del plan (pro → full_brand_fit, growth → presets, starter → disabled)
- Cambio de plan: `billing/route.ts:90` lo actualiza cuando el partner cambia de tier
- Scripts de migración: `fix-tenant-design-mode.ts`, `create-sm-partner.ts` lo setean directo

**`design_engine_mode` SÍ se usa activamente:**
- `app/api/partners/design/generate/route.ts:32` — gatea acceso a generación IA
- `app/api/partners/design/config/route.ts:25` — gatea acceso a config del engine
- `app/api/partners/design/mockup/route.ts:33` — gatea acceso a mockups

**Recomendación:** Dado que TASK-024 quiere acortar el wizard (ya BLOCKED), el step 3 con `partnerType` es candidato para eliminación. El `design_engine_mode` real lo controla el plan (billing), no la elección del wizard. Si Juan quiere que la elección del wizard tenga efecto, hay que conectar `PARTNER_TYPE_TO_ENGINE` en `buildStepPayload` (step 3 → API con `design_engine_mode`). Abrir una TASK explícita para decidir.

---

## Sprint 025 — 2026-05-26
**Model:** sonnet
**Tasks DONE:**
- TASK-015 — feat(catalog): validar precio obligatorio antes de publicar
  - app/workspace/catalog/page.tsx: bloqueo en handleSave + mensaje inline ámbar
  - app/api/partners/catalog/[id]/route.ts: validación 400 si published && price null/0
- TASK-016 — feat(onboarding): métricas de funnel — timestamps por hito
  - migrations/onboarding_funnel_timestamps.sql: creado (NO ejecutado — pendiente humano)
  - lib/partners/types.ts: 6 nuevos campos de timestamp en Tenant
  - app/api/partners/dashboard/route.ts: set first_login_at (fire-and-forget)
  - app/api/partners/branding/route.ts: set first_branding_save_at + storefront_published_at
  - app/api/partners/design/sessions/route.ts: set first_design_at
  - app/api/partners/catalog/route.ts: set first_product_draft_at
  - app/api/partners/catalog/[id]/route.ts: set first_product_published_at
- TASK-017 — feat(workspace): QuickStartCard "tu primer producto en 3 pasos"
  - components/workspace/QuickStartCard.tsx: creado (3 pasos, done states, responsive)
  - app/workspace/page.tsx: renderizado cuando data.products === 0
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- TASK-016: el humano debe correr migrations/onboarding_funnel_timestamps.sql en Supabase Studio
- TASK-016: todos los timestamps son fire-and-forget (no bloquean la respuesta)
- TASK-016: query SQL de inspección del funnel incluida como comentario en el .sql
- TASK-017: la card desaparece automáticamente cuando products >= 1 (sin dismiss explícito)
- TASK-017: requiere verificación visual — especialmente layout responsive en mobile

**Cómo consultar el funnel (query SQL de ejemplo):**
```sql
SELECT
  COUNT(*) FILTER (WHERE first_login_at IS NOT NULL) AS logged_in,
  COUNT(*) FILTER (WHERE first_branding_save_at IS NOT NULL) AS saved_branding,
  COUNT(*) FILTER (WHERE first_design_at IS NOT NULL) AS created_design,
  COUNT(*) FILTER (WHERE first_product_draft_at IS NOT NULL) AS created_draft,
  COUNT(*) FILTER (WHERE first_product_published_at IS NOT NULL) AS published_product
FROM tenants
WHERE status NOT IN ('suspended') AND created_at >= NOW() - INTERVAL '90 days';
```

---

## Sprint 024 — 2026-05-26
**Model:** sonnet
**Tasks DONE:**
- TASK-012 — feat(settings): actualizar copy del hint CBU — modelo liquidación inmediata
  - app/workspace/settings/page.tsx: label, placeholder y hint actualizados
- TASK-013 — feat(workspace): banner explicativo del modelo de negocio descartable
  - components/workspace/BusinessModelBanner.tsx: creado (3 bullets, dismiss persiste)
  - app/workspace/page.tsx: renderizado sobre el checklist (condicional al flag)
  - app/api/partners/dashboard/route.ts: expone onboarding_dismissed_business_model
  - app/api/partners/settings/route.ts: acepta onboarding_dismissed_business_model en PUT
  - lib/partners/types.ts: campo agregado a Tenant
  - migrations/onboarding_dismiss_flags.sql: creado (NO ejecutado — pendiente humano)
- TASK-014 — fix(workspace): checklist "Generar diseño IA" deja de ser hardcoded false
  - app/api/partners/dashboard/route.ts: cuenta partner_design_sessions, expone `designs`
  - app/workspace/page.tsx: DashboardData.designs + done: data.designs > 0
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- TASK-013: el humano debe correr migrations/onboarding_dismiss_flags.sql en Supabase Studio
- TASK-013: mientras no se corra la migración, el banner siempre se muestra (columna inexistente devuelve null → false por default con `?? false`)
- TASK-014: requiere verificación — seleccionar un partner con sesiones existentes, confirmar que el ítem del checklist se marca como done

---

## Sprint 023 — 2026-05-20
**Model:** sonnet
**Tasks DONE:**
- TASK-005 — feat(orders): bridge B2C sales to partner_orders via tenant_id (commit 632b7a4)
  - checkout/route.ts: ya tenía tenant_id, código estaba listo
  - mercadopago webhook: bridge a partner_orders en payment approved
  - migrations/add_tenant_id_to_orders.sql: ALTER TABLE + idx (NO ejecutada — pendiente humano)
  - lib/db.ts: Order interface con tenant_id
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- El humano debe correr `migrations/add_tenant_id_to_orders.sql` en Supabase Studio antes de que el bridge funcione en producción
- Una vez aplicada la migración, las ventas de storefronts partner se reflejarán en partner_orders y el dashboard mostrará revenue real

---

## Sprint 022 — 2026-05-19
**Model:** sonnet
**Tasks DONE:**
- TASK-011 — fix(design-engine): mensaje límite semanal explícito + helper text en modal catálogo (design-engine/page.tsx)
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- Cuando `usage.used >= usage.limit`: banner ámbar sobre el input con conteo N/N y link a /workspace/billing
- Botón Send deshabilitado mientras se alcanza el límite (no solo el API rechaza)
- Modal "Agregar al catálogo": helper text ámbar bajo campo nombre cuando está vacío
- Requiere verificación visual en mobile (Chrome Android)

---

## Sprint 021 — 2026-05-19
**Model:** sonnet
**Tasks DONE:**
- TASK-010 — fix(contact): unificar WhatsApp a +54 9 2235 16-9720 (commit 73907c5) — 12 archivos, 3 números incorrectos → 5492235169720
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- Números reemplazados: 5491162377535 (9 landings), 5491161759011 (demo x2), 5491169696741 (merch-para-creadores x2)
- Audit final: único número en wa.me/* es 5492235169720

---

## Sprint 020 — 2026-05-19
**Model:** sonnet
**Tasks DONE:**
- TASK-009 — feat(design-engine): garment mismatch fix + toggle Frente/Espalda + selector modo estampa (Grande/Logo pecho/Logo manga) en mockup route y page
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- UI ya tenía selectedSide + selectedStampMode states y ambos controles visuales implementados en working tree (unstaged desde commit previo 8c7f3a3).
- Mockup route recibe y aplica correctamente side + stampMode al prompt de Gemini.
- garment-mappings.ts tiene path builders para todos los garment types del catálogo.
- Requiere verificación visual: seleccionar Aldea Classic Fit → mockup debe salir en esa prenda.

---

## Sprint 019 — 2026-05-19
**Model:** sonnet
**Tasks DONE:**
- AUTOFEED-20260518-4 — fix(design-library): `a.url` → `a.public_url` en PartnerAsset map (commit b6ecc1e)
- AUTOFEED-20260518-5 — fix(whatsapp-webhook): cast `supabaseAdmin as any` para whatsapp_chats insert (commit f65d3fb)
**Tasks BLOCKED:** ninguna
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- Ambos fixes ya estaban aplicados como cambios working-tree no commiteados; se commitearon en este sprint.
- Sprint ACTUAL queda sin tareas PENDING. Próximo sprint requiere nuevas tareas del backlog.

---

## Sprint 018 — 2026-05-19
**Model:** sonnet
**Tasks DONE:**
- AUTOFEED-20260518-1 — fix(tests): add `beforeAll` to vitest imports in rag-sources.test.ts (commit b410ce1)
- AUTOFEED-20260518-2 — cubierto por el mismo commit que -1 (mismo archivo, mismo import faltante)
- AUTOFEED-20260518-3 — fix(tests): add `afterEach` to vitest imports in generate-stamp.test.ts (commit f78eba0)
**Tasks BLOCKED:** ninguna
**tsc:** PASS (verificado pre y post commit)
**build:** SKIPPED
**Notas:**
- AUTOFEED-4 y -5 quedan PENDING para próximo sprint (max 3 tareas por sprint)
- AUTOFEED-4: `app/api/partners/design/library/route.ts` TS2339 Property 'url' does not exist on PartnerAsset
- AUTOFEED-5: `app/api/webhooks/whatsapp/route.ts` TS2769 No overload matches

---

## Sprint 017 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 17mo sprint consecutivo. `node <script>` bloqueado por sandbox. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** SKIPPED (sin cambios de código)
**build:** SKIPPED
**Notas:**
- El autopilot está en loop permanente. Esta entrada es la última repetición del mismo bloqueo.
- **ACCIÓN REQUERIDA DEL USUARIO (elegir UNA antes del próximo sprint):**
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego hacer commit manual con `[AP-v4.2 TASK-004]` y marcar TASK-004 como DONE en BACKLOG.md
  2. **Aprobar `node` en Claude Code:** Settings → Permissions → agregar `node` como comando permitido para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 016 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 16to sprint consecutivo. `node <script>` bloqueado por sandbox de Claude Code (solo `node --version` está permitido). Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** SKIPPED (sin cambios de código)
**build:** SKIPPED
**Notas:**
- `node --version` funciona, pero `node scripts/regen-heroes.js` y variantes con path absoluto siguen bloqueados.
- **Acción requerida del usuario** (elegir UNA):
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego commit con `[AP-v4.2 TASK-004]`
  2. **Aprobar scripts node en Claude Code:** Settings → Permissions → permitir `node <archivo>` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 015 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 15to sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** SKIPPED (Bash bloqueado)
**build:** SKIPPED
**Notas:**
- TASK-004 sigue siendo la única tarea PENDING. El script `scripts/regen-heroes.js` está listo pero `node` no está aprobado.
- **Acción requerida del usuario** (elegir UNA):
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego hacer commit con `[AP-v4.2 TASK-004]`
  2. **Aprobar `node` en Claude Code:** Settings → Permissions → agregar `node` como comando permitido
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear con fixes TypeScript

---

## Sprint 014 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 14to sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** SKIPPED (Bash bloqueado)
**build:** SKIPPED
**Notas:**
- El autopilot está en un loop permanente. TASK-004 es la única tarea PENDING y requiere `node` para ejecutar el script de regeneración de imágenes.
- **Acción requerida del usuario** (elegir UNA):
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego hacer commit con `[AP-v4.2 TASK-004]`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks al SPRINT ACTUAL para desbloquear con fixes TypeScript

---

## Sprint 013 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 13mo sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 012 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 12mo sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 011 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 11mo sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 010 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 10mo sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 009 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 9no sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 008 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 8vo sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 007 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 7mo sprint consecutivo. `node` requiere aprobación manual. Sin otras tareas PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004 es la única tarea PENDING. Para desbloquear el autopilot, el usuario debe elegir UNA opción:
  1. **Ejecutar manualmente:** `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos en Claude Code:** Settings → Permissions → permitir `node` para este proyecto
  3. **Mover TASK-004 a BACKLOG FUTURO** y promover AUTOFEED tasks (AUTOFEED-20260518-1 al 5) al SPRINT ACTUAL para desbloquear el autopilot con fixes TypeScript

---

## Sprint 006 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 6to sprint consecutivo. `node` requiere aprobación manual en este entorno. Script listo en `scripts/regen-heroes.js`. TASK-004 es la única tarea PENDING en SPRINT ACTUAL.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004: Para desbloquear elige UNA opción:
  1. Ejecutar manualmente: `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del repo, luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. Claude Code Settings → Permissions → agregar `node` como comando permitido
  3. Mover TASK-004 a BACKLOG FUTURO y promover AUTOFEED tasks al SPRINT ACTUAL para continuar con fixes TypeScript

---

## Sprint 005 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 5to sprint consecutivo. El entorno Claude Code no permite ejecutar `node` sin aprobación explícita. El script `scripts/regen-heroes.js` está verificado y listo para correr.
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004: Script listo. Para desbloquear DEFINITIVAMENTE, el usuario DEBE elegir una opción:
  1. **Ejecutar manualmente** desde la raíz del repo: `node --env-file .env.local scripts/regen-heroes.js` → luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. **Aprobar permisos**: En Claude Code Settings → Permissions → agregar permiso para ejecutar `node` en este proyecto
  3. **Responder "aprueba node"** en el próximo prompt del autopilot para que el Bash tool reciba aprobación inline

---

## Sprint 004 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 4to sprint consecutivo. El entorno Claude Code bloquea `node` sin aprobación explícita del usuario. Script `scripts/regen-heroes.js` verificado y listo. Dependencias confirmadas (`@google/generative-ai` ✓, `sharp` ✓).
**tsc:** PASS (sin cambios de código)
**build:** SKIPPED
**Notas:**
- TASK-004: Para desbloquear DEFINITIVAMENTE elige UNA opción:
  1. Ejecutar manualmente: `node --env-file .env.local scripts/regen-heroes.js` (desde la raíz del repo) y luego `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar 5 imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
  2. En Claude Code Settings → Permissions → agregar permiso para `node scripts/` en este directorio
  3. Responder al autopilot con "aprueba node" para que el Bash tool obtenga aprobación inline

---

## Sprint 003 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna
**Tasks BLOCKED:**
- TASK-004 — BLOQUEADA 3er sprint consecutivo. El entorno no permite ejecución de `node scripts/regen-heroes.js` sin aprobación manual explícita del usuario. Script ya escrito y commiteado (a43b8fc). Para desbloquear: el usuario debe ejecutar manualmente `node --env-file .env.local scripts/regen-heroes.js` desde la raíz del proyecto, o aprobar explícitamente la ejecución en Claude Code settings.
**tsc:** PASS (sin cambios de código desde Sprint 001)
**build:** SKIPPED
**Notas:**
- TASK-004: para desbloquear definitivamente, el usuario puede correr el script y luego hacer el commit manualmente con `git add public/marketing/lifestyle/ backlog/UPDATES.md && git commit -m "feat(marketing): regenerar N imágenes hero a alta calidad con Gemini [AP-v4.2 TASK-004]"`
- Alternativa: agregar `node` a las herramientas permitidas en settings de Claude Code para el directorio del proyecto.

---

## Sprint 002 — 2026-05-18
**Model:** sonnet
**Tasks DONE:** ninguna (TASK-004 bloqueada por permisos de ejecucion)
**Tasks BLOCKED:**
- TASK-004 — Script `scripts/regen-heroes.js` escrito y listo. Auditoria completa (5 candidatos). Regeneracion no ejecutada: la politica de permisos del entorno bloquea `node` sin aprobacion manual. Para ejecutar: `node --env-file .env.local scripts/regen-heroes.js`
**tsc:** PASS
**build:** SKIPPED
**Notas:**
- TASK-004: audit completo en UPDATES.md. Script listo. El humano debe correr el script y luego hacer commit con [AP-v4.2 TASK-004].
- TASK-004: imagenes candidatas sprint siguiente (6-10 en lista) documentadas en UPDATES.md.

---

## Sprint 001 — 2026-05-18
**Model:** sonnet
**Tasks DONE:**
- TASK-001 — CBU + alias bancario en /workspace/settings (4 archivos: settings page, API route, types, migration SQL)
- TASK-002 — Tickets disponibles para todos los tiers (removido gate starter en frontend + backend)
- TASK-003 — Auditoría tracking de ventas (reporte en UPDATES.md, bugs documentados como TASK-005 y TASK-006)
**Tasks BLOCKED:** ninguna
**tsc:** PASS (verificado 2x: post TASK-001 y post TASK-002)
**build:** SKIPPED (requiere env vars de producción)
**Notas:**
- TASK-001: migración `migrations/partner_bank_info.sql` creada, NO ejecutada — el humano debe correrla en Supabase
- TASK-001: UI requiere verificación visual en /workspace/settings
- TASK-002: UI requiere verificación visual en /workspace/support (starter debe ver form completo)
- TASK-003: BUG-1 crítico detectado — ventas B2C no llegan al dashboard del partner (ver TASK-005)
