#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <before-dir> <after-dir> <output-file>" >&2
  exit 1
fi

before_dir="$1"
after_dir="$2"
out_file="$3"

if [[ ! -d "${before_dir}" ]]; then
  echo "[diff-state] no before snapshot at ${before_dir}, skipping (first dump?)" >&2
  exit 0
fi

body="$(mktemp)"
chunk="$(mktemp)"
trap 'rm -f "${body}" "${chunk}"' EXIT

if ! diff -u --label "schema.sql (before)" --label "schema.sql (after)" "${before_dir}/schema.sql" "${after_dir}/schema.sql" >"${chunk}"; then
  {
    echo "## Schema"
    echo '```diff'
    cat "${chunk}"
    echo '```'
    echo
  } >>"${body}"
fi

shopt -s nullglob
mapfile -t before_tables < <(cd "${before_dir}/data" 2>/dev/null && ls -- *.csv 2>/dev/null | sed 's/\.csv$//')
mapfile -t after_tables < <(cd "${after_dir}/data" 2>/dev/null && ls -- *.csv 2>/dev/null | sed 's/\.csv$//')
mapfile -t tables < <(printf '%s\n' "${before_tables[@]}" "${after_tables[@]}" | sort -u)

data_header_written=false
for table in "${tables[@]}"; do
  before_csv="${before_dir}/data/${table}.csv"
  [[ -f "${before_csv}" ]] || before_csv=/dev/null
  after_csv="${after_dir}/data/${table}.csv"
  [[ -f "${after_csv}" ]] || after_csv=/dev/null

  if ! diff -u --label "${table}.csv (before)" --label "${table}.csv (after)" "${before_csv}" "${after_csv}" >"${chunk}"; then
    if [[ "${data_header_written}" == false ]]; then
      echo "## Data" >>"${body}"
      data_header_written=true
    fi
    {
      echo "### ${table}"
      echo '```diff'
      cat "${chunk}"
      echo '```'
      echo
    } >>"${body}"
  fi
done

if [[ -s "${body}" ]]; then
  mkdir -p "$(dirname "${out_file}")"
  {
    echo "# Changes since previous dump"
    echo
    cat "${body}"
  } >"${out_file}"
  echo "[diff-state] wrote ${out_file}"
else
  echo "[diff-state] no differences found"
fi
