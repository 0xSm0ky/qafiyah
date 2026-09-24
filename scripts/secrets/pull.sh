#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
source ./scripts/secrets/lib.sh

env_name="${1:-dev}"
source_file="$(secrets_file_for "${env_name}")"
require_sops
[[ -f "${source_file}" ]] || { echo "[secrets] ${source_file} does not exist" >&2; exit 1; }
if [[ "${env_name}" == dev ]]; then
  bun scripts/secrets/check.ts dev
fi

umask 077
tmp_env="$(mktemp .env.XXXXXX)"
trap 'rm -f "${tmp_env}"' EXIT
{
  echo "# Generated from ${source_file} by scripts/secrets/pull.sh. Edit with: bun run secrets:edit ${env_name}"
  sops_dotenv decrypt "${source_file}"
} >"${tmp_env}"
mv "${tmp_env}" .env
trap - EXIT

echo "[secrets] wrote .env from ${source_file}" >&2
