# Autopilot v4.2 — Reglas operativas

Tag identificador: **[AP-v4.2]** (aparece en commits y Telegram).

## Lectura obligatoria antes de cada sprint

1. `git log -40 --oneline` para no duplicar trabajo recién hecho.
2. `npx tsc --noEmit` debe estar verde antes de empezar. Si está roja, el sprint es FIX SPRINT.
3. Leer `backlog/BACKLOG.md` → sección **SPRINT ACTUAL**.
4. Leer `backlog/PROGRESS.md` (últimas 10 entradas) para contexto.
5. Leer `backlog/UPDATES.md` (últimas 5 decisiones).

## Stack

- Next.js 15.2.6 + TypeScript + Tailwind 4 + shadcn/ui
- Supabase (Auth + DB) — cookie `sb-*-auth-token`
- Package manager: **npm**
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build` (= `next build`)
- Tests: `npm test` (vitest) + `npx playwright test` para e2e
- Plataforma local: macOS. **No correr scripts `.ps1`**.

## Paths clave

- `app/` — App Router pages
- `app/workspace/` — Partner workspace (auth)
- `app/merch/[slug]/` — Storefronts públicos
- `app/api/partners/` — APIs partner
- `components/workspace/` — UI workspace
- `lib/rag/`, `lib/assistant/`, `lib/partners/` — lógica
- `migrations/` — SQL Supabase

## Zonas prohibidas (HANDS-OFF)

- `.env*`, `.vercel/`, `.next/`, `node_modules/`
- `.planning/` — sistema GSD histórico, **no modificar**
- `.ralphy/`, `.agent/` — scaffolding de otros frameworks
- `scripts/watchdog.ps1` y `scripts/watchdog-startup.*` — sistema watchdog separado
- `CLAUDE.md` — instrucciones de proyecto
- `migrations/*.sql` ya aplicadas — solo crear migraciones nuevas si está en el alcance
- `package.json` "dependencies" — no instalar paquetes nuevos sin tarea explícita
- CI/CD configs

Si una tarea requiere tocar zona prohibida → abortar el sprint y dejar nota en `PROGRESS.md` con `STATUS: BLOCKED`.

## Reglas de commit

- **Un commit por tarea**. No mezclar tareas distintas.
- Formato: `feat(scope): descripción [AP-v4.2 TASK-ID]` o `fix(scope): ... [AP-v4.2 TASK-ID]`.
- `npx tsc --noEmit` **verde** antes de cada commit.
- **PROHIBIDO** `--no-verify`, `--no-gpg-sign`, `git push --force`.
- **PROHIBIDO** auto-push. Solo commits locales. El humano pushea cuando revisa.
- Si pre-commit hook falla → fix issue → re-stage → NUEVO commit (no `--amend`).

## Reglas por área

- **Frontend UI**: después de cambios, anotar en el commit si se requiere verificación visual.
- **API routes**: validar entrada en boundaries, no romper contratos existentes.
- **DB**: no DROP, no DELETE sin WHERE, no ALTER destructivo. Migraciones nuevas en `migrations/` con número siguiente.
- **Auth**: nunca bypassear `getRequestTenant()` ni `supabaseAdmin.auth.getUser()`.
- **RAG**: cambios en `lib/rag/` requieren probar `lib/rag/chat.ts` no rompe.

## Qué NO hacer

- No refactorizar fuera del alcance de la tarea.
- No agregar dependencias.
- No tocar configs de Next/Tailwind/TS sin tarea explícita.
- No borrar archivos sin verificar uso (`grep`).
- No "limpiar código viejo" oportunísticamente.
- No crear archivos `.md` de documentación salvo que la tarea lo pida.

## Deploy checklist (antes de cerrar sprint)

1. `npx tsc --noEmit` → verde.
2. `npm run build` → verde.
3. Si tocó UI: anotar en commit "requiere verificación visual".
4. Si tocó DB: anotar migración en `UPDATES.md`.
5. NO push. NO deploy. Solo commits locales.

## Modelo Claude

- Default: `sonnet`.
- Override: `MODEL=haiku bash scripts/autopilot-loop.sh` (tareas atómicas).
- `opus` solo si el sprint detecta keywords arquitectónicas (auto-escalado en autopilot-v2.sh).
