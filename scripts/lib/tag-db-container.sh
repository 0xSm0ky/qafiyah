#!/usr/bin/env bash

tag_db_container() {
  local container_id="$1"
  [[ -n "${container_id}" ]] || return 0

  if [[ -f .env ]]; then
    set -a
    source .env
    set +a
  fi

  local dump_number
  dump_number="$(docker exec "${container_id}" psql -v ON_ERROR_STOP=1 \
    --username "${POSTGRES_USER:-qafiyah}" --dbname "${POSTGRES_DB:-qafiyah}" \
    -tAc "SELECT shobj_description(oid, 'pg_database') FROM pg_database WHERE datname = current_database();" \
    2>/dev/null | tr -d '[:space:]')"
  if [[ -z "${dump_number}" ]]; then
    echo "[tag-db] could not read the restored dump's number, leaving the container name as-is" >&2
    return 0
  fi

  local current_name base_name
  current_name="$(docker inspect --format '{{.Name}}' "${container_id}")"
  current_name="${current_name#/}"
  base_name="${current_name%-[0-9][0-9][0-9][0-9]}"
  [[ "${current_name}" == "${base_name}-${dump_number}" ]] && return 0

  docker rename "${container_id}" "${base_name}-${dump_number}"
  echo "[tag-db] renamed ${current_name} -> ${base_name}-${dump_number}"
}
