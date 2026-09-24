#!/usr/bin/env bash

print_reclaimable() {
  command -v docker >/dev/null 2>&1 || return 0
  local df body=""
  df=$(docker system df --format '{{.Type}}'$'\t''{{.Reclaimable}}' 2>/dev/null) || return 0
  while IFS=$'\t' read -r type recl; do
    case "$type" in
      Images | Containers | "Build Cache") ;;
      *) continue ;;
    esac
    case "${recl%% *}" in *MB | *GB | *TB) ;; *) continue ;; esac
    body="${body}  ${type}: ${recl}"$'\n'
  done <<<"$df"
  [ -n "$body" ] || return 0
  echo ""
  echo "── reclaimable docker leftovers (optional cleanup) ──"
  printf '%s' "$body"
  echo "  → docker system prune    (frees the above; keeps all named volumes, incl. db/es data)"
  echo ""
}
