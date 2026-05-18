# Progress Log — Autopilot v4.2

Reverse-chronological. Cada sprint appendea su entrada al tope.

Formato:
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
