BEGIN;

CREATE TEMP TABLE sampled_poem_ids AS
SELECT p.id
FROM poems p
JOIN eras e ON e.id = p.era_id
WHERE e.slug = 'jahili'
ORDER BY random()
LIMIT :poem_count;

DELETE FROM poems p WHERE NOT EXISTS (
  SELECT 1 FROM sampled_poem_ids s WHERE s.id = p.id
);

DELETE FROM verses v WHERE NOT EXISTS (
  SELECT 1 FROM poem_verses pv WHERE pv.verse_id = v.id
);

DELETE FROM poets pt WHERE NOT EXISTS (
  SELECT 1 FROM poems p WHERE p.poet_id = pt.id
);

COMMIT;
