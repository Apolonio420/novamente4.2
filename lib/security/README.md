# lib/security — blindaje de endpoints públicos de generación de imagen

Protege los 12 endpoints anónimos que llaman a Gemini (imagen/vision):
`generate-image`, `generate-stamp`, `magic-remove-bg`,
`process-design`, `public/design/{edit,lifestyle,
mockup-lifestyle,remove-bg,try-on}`, `storefront/[slug]/studio/{generate,mockup}`
y `partners/onboarding/extract`. Ver auditoría 2026-07-11 (commit `ac4ee45`).
(`apply-design` y `remove-background` fueron borrados 2026-07-16: página
huérfana `/gemini-flow` sin callers, 0 tráfico desde que se instrumentó.)

## Piezas

- **`cors.ts`** — allowlist de orígenes (novamente.ar, `v0-nova-mente-storefront*.vercel.app`,
  localhost solo en dev). Requests sin header `Origin` (server-to-server) no se
  bloquean por CORS: eso lo cubre el guard.
- **`public-image-guard.ts`** — `guardPublicImageGen(req, familia)`: rate-limit
  DB-backed **10/min y 60/día por IP** (hasheada sha256, no se guarda cruda) por
  familia de endpoint + **tope global diario** cross-instancia sobre todos los
  endpoints públicos combinados. Backend: tabla `public_imagegen_requests`
  (`migrations/create_public_imagegen_requests.sql`). Si la DB no responde, cae
  a un limiter en memoria (no fail-open ilimitado).
- **`meter-usage.ts`** — `meterPublicImageGen(...)`: inserta el costo de cada
  generación exitosa en `api_usage` (la lee finanzas-sync en platform-master).
  Falla siempre en silencio.

## Variables de entorno

| Var | Default | Qué hace |
| --- | --- | --- |
| `PUBLIC_IMAGEGEN_DAILY_CAP` | `400` | Tope global diario (UTC) de generaciones públicas. Al **80%** manda alerta Telegram (vía `notifyError`); al 100% los endpoints devuelven 429 amigable. |
| `PUBLIC_IMAGEGEN_ENABLED` | `true` | Kill-switch. `false` = todos los endpoints públicos de imagen devuelven 503 al instante (sin tocar DB). |
| `INTERNAL_API_SECRET` | *(sin setear)* | Si está seteada, requests con header `x-internal-secret: <valor>` quedan **exentas** de rate-limit y cap (para callers server-to-server de confianza, ej. bot/platform). Hoy está inerte: la Fase 0 (2026-07-11) no encontró ningún caller interno real de estos endpoints. |

> **OJO antes de una campaña de ads:** subir `PUBLIC_IMAGEGEN_DAILY_CAP` en
> Vercel. El tráfico actual pico es ~18 generaciones/día; el default 400 tiene
> mucho margen orgánico pero una campaña que empuje `/crear` puede comérselo.

## Exenciones

- Header `x-internal-secret` correcto (ver arriba).
- En `storefront/[slug]/studio/*`: sesión de partner **dueña del mismo tenant
  del slug** (ya paga su cupo vía `checkUsageLimit` del plan). Una sesión de
  cualquier otro tenant NO exime — ver test
  `__tests__/generation/storefront-studio-guard.test.ts`.

## Mantenimiento

- `public_imagegen_requests` no tiene purga automática todavía; las filas de
  más de ~2 días no sirven para nada. TODO: cron de limpieza si crece.
- `cost_ars` en el metering queda en 0 (no hay util de tipo de cambio en el
  ecosistema). TODO cuando exista (ver Faro Unit Economics).
