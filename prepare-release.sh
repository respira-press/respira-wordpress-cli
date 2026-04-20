#!/usr/bin/env bash
# prepare-release.sh — build, test, and dry-run npm publish for all three packages.
# usage: bash packages/cli/prepare-release.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

build_pkg() {
  local dir="$1"
  echo ""
  echo "=== $dir ==="
  cd "$ROOT/$dir"
  npm install
  npm run typecheck
  npm run build
  npm test
  echo "--- npm publish --dry-run ---"
  npm publish --dry-run
}

build_pkg "cli-core"
build_pkg "sdk"
build_pkg "cli"

echo ""
echo "all three packages built, tested, and publish-dry-run passed."
echo "to actually publish: cd packages/<name> && npm publish --access public"
