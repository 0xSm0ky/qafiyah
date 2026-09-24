#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
source ./scripts/secrets/lib.sh

env_name="${1:-dev}"
target_file="$(secrets_file_for "${env_name}")"
require_sops
editor="$(resolve_editor)"

SOPS_UNCHANGED=200

while true; do
  status=0
  SOPS_EDITOR="${editor}" sops_dotenv edit "${target_file}" || status=$?
  if ((status == SOPS_UNCHANGED)); then
    echo "[secrets] no changes to ${target_file}" >&2
    exit 0
  fi
  if ((status != 0)); then
    echo "[secrets] sops edit with ${editor} failed (exit ${status}), nothing was saved" >&2
    exit "${status}"
  fi
  if bun scripts/secrets/check.ts "${env_name}"; then
    break
  fi
  read -r -p "[secrets] ${target_file} is invalid. Reopen the editor? [Y/n] " reply
  if [[ "${reply}" =~ ^[Nn]$ ]]; then
    echo "[secrets] left ${target_file} invalid; bun run ci will refuse to commit it" >&2
    exit 1
  fi
done

if [[ "${env_name}" == dev ]]; then
  ./scripts/secrets/pull.sh dev
else
  echo "[secrets] commit ${target_file} and run bun run deploy to apply it" >&2
fi
