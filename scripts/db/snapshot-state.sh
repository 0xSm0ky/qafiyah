#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <output-dir> <table>..." >&2
  exit 1
fi

out_dir="$1"
shift
tables=("$@")

user="${POSTGRES_USER:-qafiyah}"
db="${POSTGRES_DB:-qafiyah}"

exec_db() {
  ./scripts/dev/compose.sh exec -T db "$@"
}

mkdir -p "${out_dir}/data"

echo "[snapshot-state] dumping schema..." >&2
exec_db pg_dump -U "${user}" -d "${db}" \
  --schema=public --schema-only --no-owner --no-privileges --no-tablespaces |
  grep -Ev '^\\(un)?restrict ' >"${out_dir}/schema.sql"

for table in "${tables[@]}"; do
  mapfile -t order_cols < <(exec_db psql -U "${user}" -d "${db}" -Atc "
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = '${table}'::regclass AND i.indisprimary
    ORDER BY array_position(i.indkey, a.attnum);
  ")
  if [[ ${#order_cols[@]} -eq 0 ]]; then
    mapfile -t order_cols < <(exec_db psql -U "${user}" -d "${db}" -Atc "
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
      ORDER BY ordinal_position;
    ")
  fi
  order_by=$(
    IFS=,
    echo "${order_cols[*]}"
  )

  echo "[snapshot-state] exporting ${table}..." >&2
  exec_db psql -U "${user}" -d "${db}" -v ON_ERROR_STOP=1 \
    -c "\copy (SELECT * FROM ${table} ORDER BY ${order_by}) TO STDOUT WITH CSV HEADER" \
    >"${out_dir}/data/${table}.csv"
done

echo "[snapshot-state] wrote ${out_dir}" >&2
