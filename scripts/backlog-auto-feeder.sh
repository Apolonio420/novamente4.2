#!/usr/bin/env bash
# backlog-auto-feeder.sh — Detecta issues con tsc (y opcionalmente lint) y los
# appendea como tareas nuevas a backlog/BACKLOG.md. CERO tokens (solo CPU local).
#
# Tag: [AP-v4.2-FEEDER]
#
# Env opcional:
#   ENABLE_LINT=1     → también corre `npm run lint`
#   MAX_FINDINGS=5    → máximo de tareas nuevas por corrida (default 5)
#   DRY_RUN=1         → no appendea, solo printea
#
# Exit codes:
#   0 → corrida OK (haya o no findings nuevos)
#   1 → error interno (no rompe autopilot)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BACKLOG="backlog/BACKLOG.md"
HISTORY="backlog/AUTO-FEEDER-HISTORY.md"
MAX_FINDINGS="${MAX_FINDINGS:-5}"
TODAY="$(date +%Y-%m-%d)"
LOG_PREFIX="[AP-v4.2-FEEDER]"

if [[ ! -f "$BACKLOG" || ! -f "$HISTORY" ]]; then
  echo "$LOG_PREFIX ERROR: backlog/ no inicializado" >&2
  exit 1
fi

log() { echo "$LOG_PREFIX $*"; }

# ---- Recolectar findings ----
findings_file="$(mktemp)"
trap 'rm -f "$findings_file"' EXIT

log "Corriendo tsc --noEmit (gratis, sin tokens)..."
tsc_out="$(mktemp)"
if ! npx tsc --noEmit > "$tsc_out" 2>&1; then
  # tsc errors: "path/file.ts(LINE,COL): error TSXXXX: message"
  grep -E '^[^ ].+\([0-9]+,[0-9]+\): error ' "$tsc_out" | head -50 | while read -r line; do
    file="$(echo "$line" | sed -E 's/^([^(]+)\(([0-9]+),[0-9]+\): error.*/\1/')"
    lineno="$(echo "$line" | sed -E 's/^([^(]+)\(([0-9]+),[0-9]+\): error.*/\2/')"
    msg="$(echo "$line" | sed -E 's/^[^:]+: error //')"
    echo "tsc|$file|$lineno|$msg" >> "$findings_file"
  done
fi
rm -f "$tsc_out"

if [[ "${ENABLE_LINT:-0}" == "1" ]]; then
  log "Corriendo npm run lint..."
  lint_out="$(mktemp)"
  if ! npm run lint > "$lint_out" 2>&1; then
    # Best-effort parsing; varía por config
    grep -E '^\s*[0-9]+:[0-9]+' "$lint_out" | head -20 | while read -r line; do
      echo "lint|n/a|n/a|$line" >> "$findings_file"
    done
  fi
  rm -f "$lint_out"
fi

if [[ ! -s "$findings_file" ]]; then
  log "Sin findings nuevos. Backlog intacto."
  exit 0
fi

# ---- Dedup contra history ----
new_items=0
appendix="$(mktemp)"
trap 'rm -f "$findings_file" "$appendix"' EXIT

while IFS='|' read -r kind file lineno msg; do
  [[ "$new_items" -ge "$MAX_FINDINGS" ]] && break
  hash="$(echo -n "$kind|$file|$lineno|$msg" | shasum | awk '{print $1}')"
  if grep -q "^$hash" "$HISTORY" 2>/dev/null; then
    continue
  fi
  new_items=$((new_items + 1))
  task_id="AUTOFEED-${TODAY//-/}-${new_items}"
  {
    echo ""
    echo "### $task_id — $kind: $(basename "$file"):$lineno"
    echo ""
    echo "**Por qué:** Detectado por auto-feeder ($kind)."
    echo ""
    echo "**Archivos:**"
    echo "- \`$file\` línea $lineno"
    echo ""
    echo "**Error:**"
    echo "\`\`\`"
    echo "$msg"
    echo "\`\`\`"
    echo ""
    echo "**Criterio DONE:**"
    echo "- [ ] Error resuelto"
    echo "- [ ] \`npx tsc --noEmit\` verde"
    echo "- [ ] Commit con tag \`[AP-v4.2 $task_id]\`"
    echo ""
    echo "---"
  } >> "$appendix"
  echo "$hash  $TODAY  $file:$lineno  $msg" >> "$HISTORY.tmp"
done < "$findings_file"

if [[ "$new_items" -eq 0 ]]; then
  log "Findings encontrados pero todos ya están en history. Backlog intacto."
  rm -f "$HISTORY.tmp"
  exit 0
fi

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  log "DRY_RUN: $new_items items detectados pero no se appendea."
  cat "$appendix"
  rm -f "$HISTORY.tmp"
  exit 0
fi

# Append a BACKLOG.md y HISTORY
{
  echo ""
  echo "## AUTO-FEEDER — $TODAY"
  echo ""
  echo "Detectados por \`scripts/backlog-auto-feeder.sh\`. Mover a SPRINT ACTUAL si se quieren correr."
  cat "$appendix"
} >> "$BACKLOG"

cat "$HISTORY.tmp" >> "$HISTORY"
rm -f "$HISTORY.tmp"

log "Appendeados $new_items items nuevos a $BACKLOG."
