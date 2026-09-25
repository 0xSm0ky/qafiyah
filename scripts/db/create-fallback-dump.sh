#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

POEM_COUNT="${1:-100}"

newest_dir="$(find data/db -mindepth 1 -maxdepth 1 -type d ! -name '0000_default' | sort -r | head -1)"
if [[ -z "${newest_dir}" ]]; then
  echo "[create-fallback-dump] no real dump directory found under data/db/" >&2
  exit 1
fi

fixture_poets="$(bun -e "import { SAMPLE_FIXTURE_POETS } from './scripts/smoke/fixtures'; console.log(SAMPLE_FIXTURE_POETS.map((poet) => poet.slug).join(','))")"

echo "[create-fallback-dump] sampling ${POEM_COUNT} Jahili-era poems (fixture poets ${fixture_poets}, then one poem per poet) from ${newest_dir}..."

container_name="qafiyah-fallback-scratch-$$"
docker run -d --rm --name "${container_name}" \
  -e POSTGRES_PASSWORD=scratch -e POSTGRES_DB=qafiyah \
  postgres:18-alpine >/dev/null

cleanup() { docker stop "${container_name}" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "[create-fallback-dump] waiting for scratch postgres..."
ready=false
for _ in $(seq 1 60); do
  if docker exec "${container_name}" pg_isready -U postgres >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "${ready}" != true ]]; then
  echo "[create-fallback-dump] scratch postgres never became ready" >&2
  exit 1
fi

dump="$(find "${newest_dir}" -maxdepth 1 -name '*.dump' -type f | head -1)"
if [[ -z "${dump}" ]]; then
  mapfile -t parts < <(find "${newest_dir}" -maxdepth 1 -name '*.dump.part-*' ! -name '*.enc' -type f | sort)
  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "[create-fallback-dump] no plaintext dump found in ${newest_dir}, decrypt it first" >&2
    exit 1
  fi
  dump="/tmp/$(basename "${parts[0]%.part-*}")"
  cat "${parts[@]}" >"${dump}"
  trap 'rm -f "${dump}"; cleanup' EXIT
fi

docker cp "${dump}" "${container_name}:/tmp/source.dump"
docker exec "${container_name}" psql -U postgres -d qafiyah -c 'DROP SCHEMA IF EXISTS public CASCADE;'
docker exec "${container_name}" pg_restore -U postgres -d qafiyah --format=custom --no-owner --no-acl /tmp/source.dump
echo "[create-fallback-dump] analyzing before sampling..."
docker exec "${container_name}" psql -U postgres -d qafiyah -c 'ANALYZE;'

docker cp scripts/db/sql/sample-dump.sql "${container_name}:/tmp/sample-dump.sql"
docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -v poem_count="${POEM_COUNT}" -v fixture_poets="${fixture_poets}" -U postgres -d qafiyah -f /tmp/sample-dump.sql

echo "[create-fallback-dump] refreshing the taxonomy stats tables for the sampled corpus..."
docker cp scripts/db/sql/refresh-taxonomy-stats.sql "${container_name}:/tmp/refresh-taxonomy-stats.sql"
docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres -d qafiyah -f /tmp/refresh-taxonomy-stats.sql
docker exec "${container_name}" psql -v ON_ERROR_STOP=1 -U postgres -d qafiyah -c 'SELECT public.refresh_taxonomy_stats();'

docker exec "${container_name}" pg_dump -U postgres -d qafiyah \
  --schema=public --no-owner --no-privileges --no-tablespaces \
  -Fc -f /tmp/sample.dump

mkdir -p data/db/0000_default
docker cp "${container_name}:/tmp/sample.dump" data/db/0000_default/qafiyah_public_sample.dump

docker exec -i "${container_name}" psql -v ON_ERROR_STOP=1 -v source="$(basename "${newest_dir}")" -U postgres -d qafiyah -At >data/db/0000_default/manifest.json <<'SQL'
SELECT jsonb_pretty(jsonb_build_object(
  'source', :'source',
  'eras', (SELECT jsonb_agg(DISTINCT e.slug) FROM poems p JOIN eras e ON e.id = p.era_id),
  'poets', (
    SELECT jsonb_agg(jsonb_build_object(
      'slug', pt.slug,
      'poems', (SELECT jsonb_agg(p.slug ORDER BY p.id) FROM poems p WHERE p.poet_id = pt.id)
    ) ORDER BY pt.slug)
    FROM poets pt
  )
));
SQL

echo "[create-fallback-dump] wrote data/db/0000_default/qafiyah_public_sample.dump and manifest.json"
