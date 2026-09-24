#!/usr/bin/env bash
set -euo pipefail

source ./scripts/lib/remote.sh

echo "→ Reindexing Elasticsearch on ${REMOTE_HOST} (full rebuild + alias swap) ..."

remote_exec <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
docker compose run --rm -e SEARCH_INDEXER_FORCE=true search-indexer
REMOTE
