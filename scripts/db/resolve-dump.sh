#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

shopt -s nullglob

mapfile -t dump_dirs < <(find data/db -mindepth 1 -maxdepth 1 -type d ! -name '0000_default' | sort -r)
latest_name=""
[[ ${#dump_dirs[@]} -gt 0 ]] && latest_name="$(basename "${dump_dirs[0]}")"

report_behind() {
  local behind="$1"
  if [[ "${behind}" -gt 0 ]]; then
    echo "[resolve-dump] ${behind} dump(s) behind latest (${latest_name}), run 'bun run dump:key:set' to catch up" >&2
  fi
}

for i in "${!dump_dirs[@]}"; do
  dump_dir="${dump_dirs[$i]}"
  dump_name="$(basename "${dump_dir}")"
  var_name="DUMP_KEY__${dump_name}"
  passphrase="${!var_name:-}"
  [[ -z "${passphrase}" ]] && continue

  enc_files=("${dump_dir}"/*.dump.enc "${dump_dir}"/*.dump.part-*.enc)
  if [[ ${#enc_files[@]} -eq 0 ]]; then
    report_behind "${i}"
    exit 0
  fi

  ok=true
  for f in "${enc_files[@]}"; do
    out="${f%.enc}"
    [[ -f "${out}" ]] && continue
    if ! openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "pass:${passphrase}" -in "${f}" -out "${out}" 2>/dev/null; then
      rm -f "${out}"
      ok=false
      break
    fi
  done

  if [[ "${ok}" == true ]]; then
    echo "[resolve-dump] using ${dump_name} (decrypted with ${var_name})" >&2
    report_behind "${i}"
  else
    echo "[resolve-dump] ${var_name} did not decrypt ${dump_name}, falling back to data/db/0000_default" >&2
    report_behind "${#dump_dirs[@]}"
  fi
  exit 0
done

report_behind "${#dump_dirs[@]}"
