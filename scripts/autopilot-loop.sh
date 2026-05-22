#!/usr/bin/env bash
# autopilot-loop.sh — Wrapper con safety breaks sobre autopilot-v2.sh.
# Tag: [AP-v4.2-LOOP]
#
# Env:
#   MAX_SPRINTS=15                 (default)
#   DELAY_BETWEEN_SPRINTS=180      segundos (default 3 min)
#   MAX_CONSECUTIVE_FAILURES=3     (default)
#   MODEL=sonnet|haiku|opus        passthrough
#
# Corta si:
# - Llega a MAX_SPRINTS
# - autopilot-v2.sh devuelve exit 2 (backlog vacío) — exit limpio
# - MAX_CONSECUTIVE_FAILURES seguidas
# - Usuario Ctrl+C

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MAX_SPRINTS="${MAX_SPRINTS:-15}"
DELAY_BETWEEN_SPRINTS="${DELAY_BETWEEN_SPRINTS:-180}"
MAX_CONSECUTIVE_FAILURES="${MAX_CONSECUTIVE_FAILURES:-3}"

LOG_FILE="autopilot-loop-$(date +%Y%m%d).log"
TAG="[AP-v4.2-LOOP]"

START_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
START_TIME="$(date +%s)"
SPRINTS_OK=0
SPRINTS_FAIL=0
CONSECUTIVE_FAILURES=0

log() {
  local msg="$TAG $(date +'%H:%M:%S') $*"
  echo "$msg" | tee -a "$LOG_FILE"
}

# Telegram (load from .env.local)
if [[ -f .env.local ]]; then
  set -a
  source <(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID_ERRORS)=' .env.local)
  set +a
fi
telegram() {
  [[ "${DISABLE_TELEGRAM:-0}" == "1" ]] && return 0
  [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID_ERRORS:-}" ]] && return 0
  curl -sS -m 10 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID_ERRORS}" \
    -d "parse_mode=Markdown" \
    --data-urlencode "text=🔁 *${TAG}* $1" > /dev/null 2>&1 || true
}

cleanup() {
  local exit_code=$?
  local end_commit elapsed
  end_commit="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
  elapsed=$(( $(date +%s) - START_TIME ))
  log "=== LOOP END ==="
  log "Sprints OK: $SPRINTS_OK | FAIL: $SPRINTS_FAIL"
  log "Commits range: $START_COMMIT..$end_commit"
  log "Elapsed: ${elapsed}s"
  telegram "Loop terminado. OK: $SPRINTS_OK, FAIL: $SPRINTS_FAIL. Rango: \`$START_COMMIT..$end_commit\`"
  exit $exit_code
}
trap cleanup EXIT INT TERM

log "=== LOOP START === MAX_SPRINTS=$MAX_SPRINTS DELAY=$DELAY_BETWEEN_SPRINTS MAX_FAILS=$MAX_CONSECUTIVE_FAILURES"
log "Start commit: $START_COMMIT"
telegram "Loop arrancó. MAX_SPRINTS=$MAX_SPRINTS, modelo=${MODEL:-auto}"

for (( i=1; i<=MAX_SPRINTS; i++ )); do
  log "--- Sprint iteration $i/$MAX_SPRINTS ---"

  rc=0
  bash scripts/autopilot-v2.sh 2>&1 | tee -a "$LOG_FILE" || rc=$?
  # Accept SIGPIPE (141) as OK if there was at least one new commit
  if [[ $rc -eq 141 ]]; then
    new_commits=$(git log --oneline "$START_COMMIT..HEAD" 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$new_commits" -gt 0 ]]; then
      log "Exit 141 (SIGPIPE) pero hubo commits → considero OK"
      rc=0
    fi
  fi

  case "$rc" in
    0)
      SPRINTS_OK=$((SPRINTS_OK + 1))
      CONSECUTIVE_FAILURES=0
      log "Sprint $i OK"
      ;;
    2)
      log "Backlog vacío. Exit limpio del loop."
      telegram "Loop detenido — backlog vacío en sprint $i. Cargá tareas y relanzá."
      break
      ;;
    *)
      SPRINTS_FAIL=$((SPRINTS_FAIL + 1))
      CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
      log "Sprint $i FAIL (rc=$rc). Consecutive failures: $CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES"
      if [[ "$CONSECUTIVE_FAILURES" -ge "$MAX_CONSECUTIVE_FAILURES" ]]; then
        log "Demasiados fallos consecutivos. Corto."
        telegram "❌ Loop cortado en sprint $i — $CONSECUTIVE_FAILURES fallos consecutivos."
        break
      fi
      ;;
  esac

  if (( i < MAX_SPRINTS )); then
    log "Cooldown ${DELAY_BETWEEN_SPRINTS}s..."
    sleep "$DELAY_BETWEEN_SPRINTS"
  fi
done

log "Loop iteración terminada (no por error)."
