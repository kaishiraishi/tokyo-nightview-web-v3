#!/usr/bin/env bash
# Run every check and report each result. Exit non-zero if any check fails.
set -uo pipefail
cd "$(dirname "$0")/.."

status=0
run() {
  local name="$1"; shift
  if "$@" > /tmp/verify-"$name".log 2>&1; then
    echo "PASS  $name"
  else
    echo "FAIL  $name  (log: /tmp/verify-$name.log)"
    tail -n 5 /tmp/verify-"$name".log
    status=1
  fi
}

run lint npm run lint
run typecheck npx tsc --noEmit
run build npm run build
exit $status
