#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

mapfile -t dump_dirs < <(find data/db -mindepth 1 -maxdepth 1 -type d ! -name '0000_default' | sort -r)
if [[ ${#dump_dirs[@]} -eq 0 ]]; then
  echo "[check-dump-key] no dump directories found under data/db/" >&2
  exit 1
fi

PS3="Pick a dump: "
echo "Which dump do you want to check a passphrase against?"
select choice in "${dump_dirs[@]}"; do
  if [[ -n "${choice}" ]]; then
    break
  fi
  echo "invalid choice, try again"
done

dump_name="$(basename "${choice}")"

shopt -s nullglob
enc_files=("${choice}"/*.dump.enc "${choice}"/*.dump.part-*.enc)
if [[ ${#enc_files[@]} -eq 0 ]]; then
  echo "[check-dump-key] no encrypted files found in ${choice}, nothing to check against" >&2
  exit 1
fi
test_file="${enc_files[0]}"

read -r -s -p "Passphrase for ${dump_name}: " passphrase
echo

tmp_out="$(mktemp)"
if openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "pass:${passphrase}" -in "${test_file}" -out "${tmp_out}" 2>/dev/null; then
  rm -f "${tmp_out}"
  echo "correct"
else
  rm -f "${tmp_out}"
  echo "incorrect"
fi
