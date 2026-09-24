#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

out="${1:?usage: export-corpus.sh <output.tsv>}"

./scripts/dev/compose.sh exec -T db psql -U qafiyah -d qafiyah -v ON_ERROR_STOP=1 -c "\copy (
  SELECT p.id,
         p.slug,
         pt.slug,
         m.slug,
         r.slug,
         string_agg(v.content, '|' ORDER BY pv.position)
  FROM poems p
  JOIN poem_types pt ON pt.id = p.poem_type_id
  JOIN meters m ON m.id = p.meter_id
  JOIN rhymes r ON r.id = p.rhyme_id
  JOIN poem_verses pv ON pv.poem_id = p.id
  JOIN verses v ON v.id = pv.verse_id
  GROUP BY p.id, p.slug, pt.slug, m.slug, r.slug
) TO STDOUT WITH (FORMAT csv, DELIMITER E'\t', QUOTE E'\x01')" >"$out"

echo "exported $(wc -l <"$out" | tr -d ' ') poems to $out"
