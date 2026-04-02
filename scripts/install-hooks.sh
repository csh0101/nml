#!/bin/sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit

echo "Installed git hooks path: $ROOT_DIR/.githooks"
echo "pre-commit is now enforced: npm run unittest (in validator/)"
