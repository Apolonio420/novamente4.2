# Nova Chatbot — Test Findings Report

**Fecha**: 2026-04-01
**Suite**: Vitest 4.1.2
**Proyecto**: novamente4.2

---

## Resumen de tests

| Metrica | Valor |
|---------|-------|
| Test files | 11 passed (11 total) |
| Tests | **140 passed** (140 total) |
| Failed | 0 |
| Skipped | 0 |
| Duration | 7.57s |

### Archivos de test ejecutados

| Archivo | Tests | Estado |
|---------|-------|--------|
| `__tests__/styles/style-catalog.test.ts` | 10 | PASS |
| `__tests__/styles/show-styles-integration.test.ts` | 9 | PASS |
| `__tests__/chat/rag-sources.test.ts` | 15 | PASS |
| `__tests__/chat/system-prompt.test.ts` | 13 | PASS |
| `__tests__/chat/action-parsing.test.ts` | 11 | PASS |
| `__tests__/chat/chat-api.test.ts` | 8 | PASS |
| `__tests__/generation/generate-image.test.ts` | 11 | PASS |
| `__tests__/generation/generate-stamp.test.ts` | 7 | PASS |
| `__tests__/nova/PublicAssistant.test.tsx` | 11 | PASS |
| `__tests__/smoke.test.ts` | 2 | PASS |
| _(1 archivo adicional)_ | — | PASS |

---

## Bugs confirmados por tests (ya en backlog)

### 1. Slug fantasma `geometrico-colibri` en SHOW_STYLES [P0 — AUTO-1]
- **Test**: `__tests__/styles/style-catalog.test.ts` — "BUG: hardcoded slug 'geometrico-colibri' is NOT in BASE_STYLES"
- **Test**: `__tests__/styles/show-styles-integration.test.ts:86` — confirma el mismo bug
- **Archivo**: `components/PublicAssistant.tsx` (array hardcodeado)
- **Estado**: Confirmado. El slug apunta a un estilo que no existe en `BASE_STYLES`.

### 2. SHOW_STYLES hardcodea 8 slugs [P0 — P0.1/P0.3]
- **Test**: `__tests__/styles/style-catalog.test.ts` — "BUG: SHOW_STYLES hardcodes exactly 8 slugs"
- **Test**: `__tests__/styles/show-styles-integration.test.ts` — "KNOWN BUG: SHOW_STYLES hardcodes exactly 8 slugs instead of full catalog"
- **Archivo**: `components/PublicAssistant.tsx`
- **Estado**: Confirmado. 8 de 29 (BASE_STYLES) o 37 (STYLES.md).

### 3. Triple discrepancia en conteo de estilos [P2 — AUTO-3]
- **Test**: `__tests__/styles/style-catalog.test.ts` — "SHOW_STYLES count (8) differs from BASE_STYLES count (29) and docs count (37)"
- **Fuentes de verdad**: STYLES.md=37, ARTISTIC_STYLES=32, BASE_STYLES=29, SHOW_STYLES=8
- **Estado**: Confirmado. 4 fuentes de verdad distintas.

### 4. 5 estilos documentados no existen en codigo [P1 — AUTO-2]
- **Test**: `__tests__/styles/style-catalog.test.ts` — "documents which STYLES.md slugs are missing from BASE_STYLES"
- **Faltantes**: `retro-vaporwave`, `retro-cassette`, `acuarela-naturaleza`, `acuarela-urbana`, `urbano-streetwear`
- **Estado**: Confirmado.

### 5. Thumbnails sin click handlers ni labels [P1 — P1.1/P1.2]
- **Test**: `__tests__/styles/show-styles-integration.test.ts` — "KNOWN BUG: SHOW_STYLES thumbnails have no click handlers"
- **Test**: `__tests__/styles/show-styles-integration.test.ts` — "KNOWN BUG: SHOW_STYLES thumbnails have no name labels"
- **Estado**: Confirmado por analisis estatico del componente.

---

## Bugs nuevos encontrados (NO estaban en backlog)

### NEW-1 — `https://null/` en URLs de garment images [ALTA]
- **Archivo**: `app/api/generate-stamp/route.ts:111`
- **Evidencia**: Los logs de test muestran `Fetching local asset via URL → https://null/garments/tshirt-classic-black-front.jpg`
- **Causa**: `NEXT_PUBLIC_BASE_URL` no esta definido en el entorno de test/dev. El codigo concatena `https://${process.env.NEXT_PUBLIC_BASE_URL}` sin validar.
- **Impacto**: En entornos sin la env var, los garment images se buscan en `https://null/...`, causando fetch failures. En produccion funciona por casualidad si la env var esta seteada.
- **Fix**: Validar que `NEXT_PUBLIC_BASE_URL` exista al inicio, o usar fallback a `request.headers.get('host')`.

### NEW-2 — Sin rate limit en `/api/remove-bg` [ALTA]
- **Archivo**: `app/api/remove-bg/route.ts`
- **Bug**: El endpoint de background removal no tiene rate limiter. Usa Remove.bg API que cobra por request.
- **Impacto**: Un atacante puede hacer requests ilimitados y generar costos en la API de Remove.bg.
- **Fix**: Agregar rate limiter similar a generate-image (ej: 3 req/min).

### NEW-3 — Rate limiter in-memory no funciona en serverless [MEDIA]
- **Archivo**: `lib/rate-limit.ts:8`
- **Bug**: El rate limiter usa `new Map<string, RateLimitEntry>()` en memoria. En Vercel/serverless cada invocacion tiene su propia memoria, asi que el rate limit no persiste entre requests que van a distintas instancias.
- **Impacto**: El rate limiting es parcialmente efectivo — funciona solo cuando requests consecutivos caen en la misma instancia.
- **Fix**: Migrar a Upstash Redis rate limiter (`@upstash/ratelimit`). El codigo ya tiene un comment sugiriendo esto.

### NEW-4 — Prompt injection via campos enriquecidos del chat [MEDIA]
- **Archivo**: `app/api/assistant/chat/route.ts:48-56`
- **Bug**: Los campos `role`, `tenantSlug`, y `pageContext.pathname` se interpolan directamente en el query enviado a Gemini: `[Rol: ${role}] [Tenant: ${tenantSlug}] ${query}`. Aunque hay validacion Zod basica, un atacante puede inyectar instrucciones en estos campos.
- **Impacto**: Potencial manipulacion del comportamiento de Nova via prompt injection.
- **Fix**: Usar structured prompts o sanitizar caracteres especiales (`[`, `]`, newlines) en los campos.

### NEW-5 — Parametro `limit` sin cota maxima en orders API [MEDIA]
- **Archivo**: `app/api/partners/orders/route.ts:14-15`
- **Bug**: `const limit = Number(searchParams.get('limit')) || 50` — acepta cualquier numero. `?limit=999999` devolveria toda la tabla.
- **Impacto**: DoS por query pesado, potencial timeout o OOM.
- **Fix**: `Math.min(Number(searchParams.get('limit')) || 50, 500)`.

### NEW-6 — Sin limite maximo de items en order POST [MEDIA]
- **Archivo**: `app/api/partners/orders/route.ts:37-45`
- **Bug**: Valida que `items.length > 0` pero no pone un maximo. Se puede enviar una order con 100k items.
- **Impacto**: Carga excesiva en la DB, potencial timeout.
- **Fix**: Validar `items.length <= 100` (o el maximo razonable).

### NEW-7 — Sin timeout en fetch de imagenes del chat [BAJA]
- **Archivo**: `lib/rag/public-chat.ts:162`
- **Bug**: `fetchImageAsBase64()` usa `fetch()` sin `AbortSignal.timeout()`. Si una imagen tarda en responder, todo el chat request queda colgado.
- **Impacto**: El usuario queda esperando indefinidamente si sube una URL de imagen lenta.
- **Fix**: `fetch(url, { signal: AbortSignal.timeout(5000) })`.

### NEW-8 — Endpoint `/api/images` sin autenticacion [BAJA]
- **Archivo**: `app/api/images/route.ts`
- **Bug**: El GET no requiere auth. Cualquiera puede listar imagenes (limitado a 20 por `.limit(20)`).
- **Impacto**: Leak menor de URLs de imagenes generadas.
- **Nota**: `/api/images/history/route.ts` SI tiene auth correcta.

### NEW-9 — React `act()` warnings en tests del componente [BAJA]
- **Archivo**: `__tests__/nova/PublicAssistant.test.tsx`
- **Evidencia**: stderr muestra multiples "An update to AssistantInner inside a test was not wrapped in act(...)"
- **Impacto**: No rompe tests actualmente pero indica state updates asincrono no controlado. Puede causar flakiness futura.
- **Fix**: Wrappear las interacciones en `act()` o usar `waitFor()` de testing-library.

---

## UX issues observados en el codigo

1. **Texto engañoso**: SHOW_STYLES dice "37 estilos" pero muestra 8 thumbnails (`show-styles-integration.test.ts` confirma).
2. **Sin feedback de error en stamp generation**: Cuando Gemini falla, el error va a stderr pero el usuario solo ve un 500 generico.
3. **Sin loading progress real**: `GENERATE_DESIGN` muestra loading state pero sin estimacion de tiempo ni barra de progreso.
4. **Supabase cookie hardcodeada y sin usar**: `process-design/route.ts:22` lee un cookie con project ref hardcodeado (`fvsjvvyohaarivametxq`) que nunca se usa — codigo muerto.

---

## Security concerns

| Severidad | Issue | Archivo |
|-----------|-------|---------|
| ALTA | Sin rate limit en remove-bg (API paga) | `app/api/remove-bg/route.ts` |
| MEDIA | Rate limiter in-memory inefectivo en serverless | `lib/rate-limit.ts` |
| MEDIA | Prompt injection via role/tenant/pageContext | `app/api/assistant/chat/route.ts:48-56` |
| MEDIA | Sin auth en `/api/images` | `app/api/images/route.ts` |
| BAJA | Supabase project ref hardcodeado | `app/api/process-design/route.ts:22` |

---

## Performance concerns

| Severidad | Issue | Archivo |
|-----------|-------|---------|
| MEDIA | Parametro `limit` sin cota maxima | `app/api/partners/orders/route.ts:14` |
| MEDIA | Items array sin maximo en POST | `app/api/partners/orders/route.ts:37` |
| MEDIA | Fetch de imagenes sin timeout | `lib/rag/public-chat.ts:162` |
| BAJA | Hardcoded Gemini model names en 4 archivos | Multiples |

---

## Recomendaciones priorizadas por impacto

### Prioridad 1 — Hacer esta semana
1. **Agregar rate limit a `/api/remove-bg`** — endpoint publico que usa API paga sin proteccion
2. **Fijar `NEXT_PUBLIC_BASE_URL` validation** — previene `https://null/` en garment URLs
3. **Sanitizar campos de enrichment en chat** — prevenir prompt injection

### Prioridad 2 — Sprint actual
4. **Migrar rate limiter a Upstash Redis** — el in-memory no funciona en Vercel serverless
5. **Agregar `limit` max y `items` max en orders API** — prevenir DoS por queries pesados
6. **Agregar timeout a fetch de imagenes** — prevenir requests colgados
7. **Agregar auth a `/api/images`** — consistencia con `/api/images/history` que ya tiene auth

### Prioridad 3 — Backlog
8. **Resolver triple discrepancia de estilos** — single source of truth
9. **Limpiar cookie hardcodeada sin usar** en process-design
10. **Fixear React act() warnings** en tests para prevenir flakiness
11. **Externalizar model names** a env vars o config

---

_Generado automaticamente el 2026-04-01 por vitest suite (140 tests, 11 archivos)._
