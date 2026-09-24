#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

./scripts/dev/compose.sh down -v "$@"
./scripts/dev/db-up.sh "$@"
