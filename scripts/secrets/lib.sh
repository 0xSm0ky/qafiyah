#!/usr/bin/env bash

secrets_file_for() {
  case "$1" in
    dev | prod) echo "secrets/$1.enc.env" ;;
    *)
      echo "[secrets] unknown environment '$1', expected dev or prod" >&2
      return 1
      ;;
  esac
}

require_sops() {
  if ! command -v sops >/dev/null 2>&1; then
    echo "[secrets] sops is not installed (brew install sops, or see docs/deployment/secrets.md)" >&2
    return 1
  fi
}

sops_dotenv() {
  sops "$1" --input-type dotenv --output-type dotenv "${@:2}"
}

resolve_editor() {
  local preferred="${SOPS_EDITOR:-${EDITOR:-}}"
  local candidate
  for candidate in "${preferred}" nano vi; do
    [[ -n "${candidate}" ]] || continue
    command -v "${candidate%% *}" >/dev/null 2>&1 || continue
    if [[ -n "${preferred}" && "${candidate}" != "${preferred}" ]]; then
      echo "[secrets] ${preferred%% *} not found, using ${candidate}" >&2
    fi
    echo "${candidate}"
    return 0
  done
  echo "[secrets] no editor found (tried ${preferred:+${preferred}, }nano, vi), nothing was saved" >&2
  return 1
}
