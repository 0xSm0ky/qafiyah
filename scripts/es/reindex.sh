#!/usr/bin/env bash
set -euo pipefail

./scripts/dev/compose.sh run --rm --no-deps -e SEARCH_INDEXER_FORCE=true search-indexer "$@"
