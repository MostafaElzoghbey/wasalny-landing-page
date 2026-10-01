-- 0005_route_data_labels.sql
-- Adds free-text Arabic origin/destination labels to route_data and backfills
-- them from the legacy content.routes JSON so the derived public cards keep
-- today's wording. Column names avoid the SQL keyword FROM.
--
-- D1 NOTES
--   * JSON1 is compiled into D1, so json_extract / json_each need no
--     extension. Both run inside a read subquery of an UPDATE, so this file
--     stays a single write statement per column with no D1 batch needed.
--   * json_each raises "malformed JSON" on invalid input. The routes value is
--     therefore filtered through json_valid() in an inner subquery, so a
--     corrupt content.routes no longer aborts the file — and with it the whole
--     transaction, since D1 applies one migration as one transaction. Verified:
--     the pre-audit statement shape fails with "malformed JSON" on a malformed
--     routes value, the guarded shape completes and leaves the labels empty for
--     a human to fill rather than guessing them.
--   * The inner subquery also narrows content to the single routes row, which
--     keeps D1's rows-read accounting at one row per backfill instead of a
--     full content scan per route_data row.
--   * Idempotent: the WHERE fromLabel = '' / toLabel = '' guards make a re-run
--     select nothing, and COALESCE never overwrites a label that is already
--     set, so Arabic wording can only ever be filled in, never rewritten.
--   * No INSERT OR REPLACE is involved, and none is needed: the file only
--     backfills columns it adds itself. INSERT OR REPLACE remains in use in
--     queries.ts (route_pricing, pricing_config) and seed.ts and is unchanged.

ALTER TABLE route_data ADD COLUMN fromLabel TEXT NOT NULL DEFAULT '';
ALTER TABLE route_data ADD COLUMN toLabel TEXT NOT NULL DEFAULT '';

UPDATE route_data SET fromLabel = COALESCE((
  SELECT json_extract(j.value, '$.from')
  FROM (
    SELECT value FROM content WHERE key = 'routes' AND json_valid(value)
  ) c, json_each(c.value) j
  WHERE json_extract(j.value, '$.id') = route_data.id
), fromLabel) WHERE fromLabel = '';

UPDATE route_data SET toLabel = COALESCE((
  SELECT json_extract(j.value, '$.to')
  FROM (
    SELECT value FROM content WHERE key = 'routes' AND json_valid(value)
  ) c, json_each(c.value) j
  WHERE json_extract(j.value, '$.id') = route_data.id
), toLabel) WHERE toLabel = '';
