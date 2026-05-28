#!/usr/bin/env bash
# autopilot-v2.sh — Un sprint del autopilot v4.2.
# Tag identificador: [AP-v4.2]
#
# Lee backlog/BACKLOG.md "SPRINT ACTUAL", arma prompt para `claude -p`,
# ejecuta, verifica tsc + build, notifica por Telegram.
#
# NO hace push. Solo commits locales.
#
# Env:
#   MODEL=sonnet|haiku|opus   override modelo (default: auto)
#   QA_EVERY_N=5              cada N sprints corre QA en vez de features
#   DISABLE_AUTO_FEEDER=1     no corre auto-feeder antes
#   DISABLE_TELEGRAM=1        no manda mensajes
#   SPRINT_NUMBER=N           override del nro de sprint (lo setea autopilot-loop.sh)
#
# Exit codes:
#   0 → sprint OK
#   2 → sprint vacío (no tasks PENDING en SPRINT ACTUAL) — exit limpio sin tokens
#   3 → tsc o build fallaron post-sprint
#   4 → rate limit persistente
#   5 → error interno

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ---- Config ----
TAG="[AP-v4.2]"
STATE_FILE="scripts/.autopilot-state.json"
BACKLOG="backlog/BACKLOG.md"
PROGRESS="backlog/PROGRESS.md"
QA_EVERY_N="${QA_EVERY_N:-5}"
MAX_RATE_LIMIT_RETRIES=10

# Cargar .env.local si existe (para Telegram)
if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID_ERRORS)=' .env.local)
  set +a
fi

TG_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TG_CHAT="${TELEGRAM_CHAT_ID_ERRORS:-}"

log() { echo "$TAG $*"; }

telegram() {
  [[ "${DISABLE_TELEGRAM:-0}" == "1" ]] && return 0
  [[ -z "$TG_TOKEN" || -z "$TG_CHAT" ]] && return 0
  local msg="$1"
  curl -sS -m 10 -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -d "chat_id=${TG_CHAT}" \
    -d "parse_mode=Markdown" \
    --data-urlencode "text=🤖 *${TAG}* ${msg}" > /dev/null 2>&1 || true
}

# ---- State ----
if [[ ! -f "$STATE_FILE" ]]; then
  echo '{"sprint":0,"total_ok":0,"total_fail":0,"last_error":null}' > "$STATE_FILE"
fi

SPRINT_NUMBER="${SPRINT_NUMBER:-$(($(grep -oE '"sprint":[0-9]+' "$STATE_FILE" | grep -oE '[0-9]+') + 1))}"

# ---- Detectar tipo de sprint ----
SPRINT_TYPE="FEATURE"
if (( SPRINT_NUMBER % QA_EVERY_N == 0 )); then
  SPRINT_TYPE="QA"
fi

# ---- Auto-feeder ----
if [[ "${DISABLE_AUTO_FEEDER:-0}" != "1" ]]; then
  log "Sprint $SPRINT_NUMBER — corriendo auto-feeder..."
  bash scripts/backlog-auto-feeder.sh || log "auto-feeder devolvió error (continúa)"
fi

# ---- Detectar tareas PENDING en SPRINT ACTUAL ----
pending_count=$(awk '
  /^## SPRINT ACTUAL/{flag=1; next}
  /^## /{flag=0}
  flag && /\| PENDING \|/{c++}
  END{print c+0}
' "$BACKLOG")

if [[ "$SPRINT_TYPE" == "FEATURE" && "$pending_count" -eq 0 ]]; then
  log "SPRINT ACTUAL vacío (0 tareas PENDING). Exit limpio sin consumir tokens."
  telegram "Sprint $SPRINT_NUMBER skip — backlog vacío. Cargá tareas en \`backlog/BACKLOG.md\`."
  exit 2
fi

# ---- Selección de modelo ----
if [[ -n "${MODEL:-}" ]]; then
  CHOSEN_MODEL="$MODEL"
else
  CHOSEN_MODEL="sonnet"
  if [[ "$SPRINT_TYPE" == "QA" ]]; then
    CHOSEN_MODEL="sonnet"
  fi
  # Auto-escalar a opus si el backlog tiene keywords arquitectónicas
  if grep -qiE 'architecture|migration|breaking change|security audit|payment' "$BACKLOG" 2>/dev/null; then
    head_pending=$(awk '/^## SPRINT ACTUAL/,/^## /' "$BACKLOG" | grep -m1 'PENDING')
    if echo "$head_pending" | grep -qiE 'architecture|migration|breaking|security|payment'; then
      CHOSEN_MODEL="opus"
    fi
  fi
fi

log "Sprint $SPRINT_NUMBER tipo=$SPRINT_TYPE modelo=$CHOSEN_MODEL"
telegram "Sprint *$SPRINT_NUMBER* arrancó — tipo: \`$SPRINT_TYPE\`, modelo: \`$CHOSEN_MODEL\`"

# ---- Pre-flight tsc ----
if ! npx tsc --noEmit > /tmp/ap-tsc-pre.log 2>&1; then
  log "tsc pre-sprint ROJO → forzando FIX SPRINT"
  SPRINT_TYPE="FIX"
fi

# ---- Construir prompt ----
PROMPT_FILE="$(mktemp)"
trap 'rm -f "$PROMPT_FILE"' EXIT

case "$SPRINT_TYPE" in
  FEATURE)
    cat > "$PROMPT_FILE" <<'PROMPT'
Sos el AUTOPILOT v4.2 de este repo. Tag obligatorio en commits: [AP-v4.2]

REGLAS DURAS:
- Leé backlog/RULES.md ANTES de empezar.
- Leé backlog/BACKLOG.md sección "SPRINT ACTUAL".
- Corré `git log -40 --oneline` para no duplicar.
- Máximo 3 tareas por sprint, en el orden de la tabla.
- Solo tareas con Estado PENDING.
- Un commit por tarea. Formato: `feat(scope): desc [AP-v4.2 TASK-ID]` o `fix(scope): ...`.
- `npx tsc --noEmit` verde antes de cada commit.
- NO push. NO --no-verify. NO tocar .env*, .planning/, .ralphy/, .agent/, CLAUDE.md.
- Si una tarea pide zona prohibida → marcala BLOCKED en backlog/PROGRESS.md y pasá a la siguiente.

DESPUÉS DE CADA TAREA DONE:
- Actualizá Estado en backlog/BACKLOG.md de PENDING → DONE.
- Agregá entrada en backlog/PROGRESS.md.
- Si hubo decisión técnica no obvia → entrada en backlog/UPDATES.md.

NO instales paquetes. NO tomes decisiones de arquitectura grandes. Si una tarea es ambigua, marcala BLOCKED y seguí.

Empezá ahora.
PROMPT
    ;;
  QA)
    cat > "$PROMPT_FILE" <<'PROMPT'
Sos el AUTOPILOT v4.2 en modo QA SPRINT. Tag: [AP-v4.2-QA]

OBJETIVO: revisar los últimos 20 commits y detectar bugs reales.

PASOS:
1. `git log -20 --oneline` y `git diff HEAD~20 HEAD --stat`.
2. Buscá: imports rotos, null checks faltantes, auth gaps, mobile breakages, types `any` sospechosos, race conditions en API routes.
3. Si encontrás un bug real, fixealo. Un commit por fix, formato: `fix(scope): desc [AP-v4.2-QA]`.
4. `npx tsc --noEmit` verde antes de cada commit.
5. Máximo 3 fixes en este sprint.
6. Si no hay bugs claros → no commitees nada, dejá nota en backlog/PROGRESS.md "QA Sprint N — clean".

PROHIBIDO: refactorizar, agregar features, tocar zonas hands-off (.env*, .planning/, .ralphy/, .agent/), push.

Empezá.
PROMPT
    ;;
  FIX)
    cat > "$PROMPT_FILE" <<'PROMPT'
Sos el AUTOPILOT v4.2 en modo FIX SPRINT. Tag: [AP-v4.2-FIX]

OBJETIVO: tsc está roja. Arreglar SOLO los errores de tsc.

PASOS:
1. `npx tsc --noEmit` y leer la lista de errores.
2. Fix mínimo por archivo. Un commit por archivo, formato: `fix(types): desc [AP-v4.2-FIX]`.
3. NO refactorizar. NO cambiar lógica. Solo hacer que tsc pase.
4. Verificá `npx tsc --noEmit` verde antes de cada commit.

Empezá.
PROMPT
    ;;
esac

# ---- Ejecutar claude con retry on rate limit ----
RETRIES=0
SPRINT_OK=0
while (( RETRIES < MAX_RATE_LIMIT_RETRIES )); do
  log "Ejecutando claude -p --model $CHOSEN_MODEL (intento $((RETRIES+1)))"
  claude_log="$(mktemp)"
  if claude -p "$(cat "$PROMPT_FILE")" --model "$CHOSEN_MODEL" --permission-mode bypassPermissions 2>&1 | tee "$claude_log"; then
    SPRINT_OK=1
    break
  fi
  if grep -qiE 'rate limit|429|529|overloaded|quota|capacity' "$claude_log"; then
    RETRIES=$((RETRIES + 1))
    backoff=$(( 30 * (2 ** (RETRIES - 1)) ))
    (( backoff > 600 )) && backoff=600
    log "Rate limit detectado. Backoff ${backoff}s (retry $RETRIES/$MAX_RATE_LIMIT_RETRIES)"
    telegram "Sprint $SPRINT_NUMBER ⏳ rate limit, esperando ${backoff}s (retry $RETRIES)"
    sleep "$backoff"
    continue
  fi
  log "claude falló sin rate limit. Salgo."
  break
done
rm -f "$claude_log" 2>/dev/null || true

if (( RETRIES >= MAX_RATE_LIMIT_RETRIES )); then
  telegram "Sprint $SPRINT_NUMBER ❌ rate limit persistente después de $MAX_RATE_LIMIT_RETRIES retries"
  exit 4
fi

# ---- Verify post-sprint ----
log "Verificando tsc post-sprint..."
if ! npx tsc --noEmit > /tmp/ap-tsc-post.log 2>&1; then
  errcount=$(grep -cE '^[^ ].+\([0-9]+,[0-9]+\): error ' /tmp/ap-tsc-post.log || echo 0)
  telegram "Sprint $SPRINT_NUMBER ⚠️ tsc ROJO post-sprint ($errcount errores). Próximo sprint será FIX."
  log "tsc rojo: $errcount errores"
  # actualizar state
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
s['sprint'] = $SPRINT_NUMBER
s['total_fail'] = s.get('total_fail',0) + 1
s['last_error'] = 'tsc post-sprint: $errcount errores'
json.dump(s, open('$STATE_FILE','w'), indent=2)
" 2>/dev/null || true
  exit 3
fi

log "tsc verde. Corriendo build (puede tardar)..."
if ! npm run build > /tmp/ap-build.log 2>&1; then
  telegram "Sprint $SPRINT_NUMBER ⚠️ build FALLÓ. Revisar /tmp/ap-build.log"
  log "build falló"
  exit 3
fi

# ---- Update state ----
commits_this_sprint=$(git log --oneline --since="10 minutes ago" | grep -c '\[AP-v4.2' || echo 0)
python3 -c "
import json
s = json.load(open('$STATE_FILE'))
s['sprint'] = $SPRINT_NUMBER
s['total_ok'] = s.get('total_ok',0) + 1
s['last_error'] = None
json.dump(s, open('$STATE_FILE','w'), indent=2)
" 2>/dev/null || true

telegram "Sprint *$SPRINT_NUMBER* ✅ OK — $commits_this_sprint commits nuevos, tsc+build verdes"
log "Sprint $SPRINT_NUMBER COMPLETE. Commits nuevos: $commits_this_sprint"
exit 0
