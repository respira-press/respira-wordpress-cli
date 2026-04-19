#!/usr/bin/env bash
# prepare-release.sh — install, typecheck, build, test all three packages, and show a npm publish dry-run.
# usage: bash prepare-release.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "=== npm install (workspaces) ==="
npm install

echo ""
echo "=== typecheck ==="
npm run typecheck --workspaces --if-present

echo ""
echo "=== build ==="
npm run build --workspaces --if-present

echo ""
echo "=== test ==="
npm test --workspaces --if-present

echo ""
echo "=== npm publish --dry-run ==="
for pkg in cli-core sdk cli; do
  echo "--- @respira/$pkg ---"
  npm publish --dry-run --workspace="@respira/$pkg"
done

echo ""
echo "all three packages built, tested, and publish-dry-run passed."
echo "to actually publish: push a git tag like v0.1.0 (release.yml handles publish),"
echo "or run: npm publish --access public --workspace=@respira/<name>"
