#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <dump-dir>" >&2
  exit 1
fi

dump_dir="${1%/}"
if [[ ! -d "${dump_dir}" ]]; then
  echo "[encrypt-dump] no such directory: ${dump_dir}" >&2
  exit 1
fi

dump_name="$(basename "${dump_dir}")"
if [[ "${dump_name}" == "0000_default" ]]; then
  echo "[encrypt-dump] data/db/0000_default is never encrypted" >&2
  exit 1
fi
var_name="DUMP_KEY__${dump_name}"
manifest="data/db/keys.manifest"

passphrase="${!var_name:-}"
if [[ -z "${passphrase}" ]]; then
  read -r -s -p "Passphrase for ${dump_name}: " passphrase
  echo
fi
if [[ -z "${passphrase}" ]]; then
  echo "[encrypt-dump] empty passphrase, aborting" >&2
  exit 1
fi

manifest_salt="a17f92c3d84e6b01"
hash="$(openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -S "${manifest_salt}" -pass "pass:${passphrase}" -P 2>/dev/null | awk -F= '/^key/{print $2}')"

if [[ -f "${manifest}" ]]; then
  while read -r other_name other_hash; do
    [[ -z "${other_name}" ]] && continue
    if [[ "${other_name}" != "${dump_name}" && "${other_hash}" == "${hash}" ]]; then
      echo "[encrypt-dump] this passphrase is already used by ${other_name}, choose a different one" >&2
      exit 1
    fi
  done <"${manifest}"
fi

mapfile -t files < <(find "${dump_dir}" -maxdepth 1 \( -name '*.dump' -o -name '*.dump.part-*' -o -name 'CHANGES.md' \) ! -name '*.enc' -type f | sort)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "[encrypt-dump] no plaintext dump files found in ${dump_dir}" >&2
  exit 1
fi

for f in "${files[@]}"; do
  echo "[encrypt-dump] encrypting $(basename "${f}")..."
  openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass "pass:${passphrase}" -in "${f}" -out "${f}.enc"
  rm -f "${f}"
done

tmp_manifest="$(mktemp)"
if [[ -f "${manifest}" ]]; then
  grep -v "^${dump_name} " "${manifest}" >"${tmp_manifest}" || true
fi
echo "${dump_name} ${hash}" >>"${tmp_manifest}"
sort -o "${tmp_manifest}" "${tmp_manifest}"
mv "${tmp_manifest}" "${manifest}"

echo "[encrypt-dump] done: ${dump_name} encrypted, manifest updated"
