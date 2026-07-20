#!/usr/bin/env bash
# Legacy wrapper - delegates to the TypeScript validator.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [[ ! -f dist/skills/validate-cli.js ]]; then
  npm run build
fi
node dist/skills/validate-cli.js
