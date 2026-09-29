#!/usr/bin/env bash
# Run Luna (codex CLI) on a prompt file and save its report.
# Usage: scripts/luna.sh <NNN-slug> [read|write|net]
#   read  : read-only sandbox
#   write : can edit files in the workspace, no network (default)
#   net   : can edit files and use the network
# Reads tasks/<NNN-slug>.prompt.md, writes tasks/<NNN-slug>.result.md.
set -euo pipefail

TASK="${1:?usage: scripts/luna.sh <NNN-slug> [read|write|net]}"
MODE="${2:-write}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT="$ROOT/tasks/$TASK.prompt.md"
RESULT="$ROOT/tasks/$TASK.result.md"

[ -f "$PROMPT" ] || { echo "missing $PROMPT" >&2; exit 1; }

EXTRA=()
case "$MODE" in
  read)  SANDBOX="read-only" ;;
  write) SANDBOX="workspace-write" ;;
  net)   SANDBOX="workspace-write"; EXTRA=(-c "sandbox_workspace_write.network_access=true") ;;
  *) echo "unknown mode: $MODE (read|write|net)" >&2; exit 1 ;;
esac

cd "$ROOT"
codex exec -m gpt-5.6-luna -c model_reasoning_effort="max" \
  -s "$SANDBOX" ${EXTRA[@]+"${EXTRA[@]}"} \
  -o "$RESULT" < "$PROMPT"
echo "done: $RESULT"
