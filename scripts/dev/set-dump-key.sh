#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
source ./scripts/secrets/lib.sh
require_sops

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

mapfile -t dump_dirs < <(find data/db -mindepth 1 -maxdepth 1 -type d ! -name '0000_default' | sort -r)
if [[ ${#dump_dirs[@]} -eq 0 ]]; then
  echo "[set-dump-key] no dump directories found under data/db/" >&2
  exit 1
fi

manifest="data/db/keys.manifest"
manifest_salt="a17f92c3d84e6b01"
GREEN=$'\033[32m'
RED=$'\033[31m'
YELLOW=$'\033[33m'
RESET=$'\033[0m'

manifest_hash_for() {
  [[ -f "${manifest}" ]] && awk -v n="$1" '$1 == n { print $2 }' "${manifest}"
}

passphrase_hash() {
  openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -S "${manifest_salt}" -pass "pass:$1" -P 2>/dev/null | awk -F= '/^key/{print $2}'
}

echo "Dump key status:"
selectable_dirs=()
for i in "${!dump_dirs[@]}"; do
  dump_name="$(basename "${dump_dirs[$i]}")"
  var_name="DUMP_KEY__${dump_name}"
  passphrase="${!var_name:-}"
  expected_hash="$(manifest_hash_for "${dump_name}")"
  if [[ -z "${passphrase}" ]]; then
    status="${YELLOW}not set${RESET}"
  elif [[ -z "${expected_hash}" ]]; then
    status="${YELLOW}no manifest entry${RESET}"
  elif [[ "$(passphrase_hash "${passphrase}")" == "${expected_hash}" ]]; then
    status="${GREEN}✓ correct key${RESET}"
  else
    status="${RED}✗ wrong key${RESET}"
  fi

  if [[ "${status}" == "${GREEN}✓ correct key${RESET}" ]]; then
    printf '    %-24s [%s]\n' "${dump_name}" "${status}"
  else
    selectable_dirs+=("${dump_dirs[$i]}")
    printf '%2d) %-24s [%s]\n' "${#selectable_dirs[@]}" "${dump_name}" "${status}"
  fi
done

if [[ ${#selectable_dirs[@]} -eq 0 ]]; then
  echo "[set-dump-key] every dump already has its correct key set, nothing to do"
  exit 0
fi

while true; do
  read -r -p "Pick a dump to set a key for: " reply
  if [[ "${reply}" =~ ^[0-9]+$ ]] && ((reply >= 1 && reply <= ${#selectable_dirs[@]})); then
    break
  fi
  echo "invalid choice, try again"
done

choice="${selectable_dirs[$((reply - 1))]}"
dump_name="$(basename "${choice}")"
var_name="DUMP_KEY__${dump_name}"

shopt -s nullglob
enc_files=("${choice}"/*.dump.enc "${choice}"/*.dump.part-*.enc)
if [[ ${#enc_files[@]} -eq 0 ]]; then
  echo "[set-dump-key] no encrypted files found in ${choice}, nothing to verify against" >&2
  exit 1
fi
test_file="${enc_files[0]}"

while true; do
  read -r -s -p "Passphrase for ${dump_name}: " passphrase
  echo
  if [[ -z "${passphrase}" ]]; then
    echo "empty passphrase, try again"
    continue
  fi
  tmp_out="$(mktemp)"
  if openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "pass:${passphrase}" -in "${test_file}" -out "${tmp_out}" 2>/dev/null; then
    rm -f "${tmp_out}"
    echo "${GREEN}✓ correct key${RESET}"
    break
  fi
  rm -f "${tmp_out}"
  echo "${RED}✗ wrong key${RESET}, try again"
done

secrets_file="$(secrets_file_for dev)"
printf '%s' "${passphrase}" | jq -Rs . | sops_dotenv set --value-stdin "${secrets_file}" "[\"${var_name}\"]"
bun scripts/secrets/check.ts dev
./scripts/secrets/pull.sh dev

echo "[set-dump-key] ${GREEN}✓${RESET} saved ${var_name} to ${secrets_file}, bun run dev will now use ${dump_name}"
