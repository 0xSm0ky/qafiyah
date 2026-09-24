#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

source ./scripts/lib/tag-db-container.sh

./scripts/dev/compose.sh up -d --wait db "$@"
tag_db_container "$(./scripts/dev/compose.sh ps -q db "$@")"
