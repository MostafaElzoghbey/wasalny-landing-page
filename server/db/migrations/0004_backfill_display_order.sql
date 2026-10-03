-- 0004_backfill_display_order.sql
-- Catch-up backfill for rows stuck at the default display_order = 0:
--   * deployed Node DBs where 0002's backfill was skipped, and
--   * rows inserted through a path that left display_order at the default.
-- Idempotent: WHERE display_order = 0 means a re-run matches nothing.
-- Identical to the 0002 backfill — keep the two in sync.
--
-- D1 NOTES
--   * No `rowid`. display_order used to be seeded from rowid, which SQLite
--     reassigns on VACUUM / auto-vacuum / table rewrite and which D1's
--     export+import path does not preserve. D1's documentation makes no
--     stability promise about rowid, so order is now derived from the
--     primary key (id ASC) — a declared value, not an implicit one.
--   * Rows that already carry a curated display_order are never touched: the
--     backfill appends after the highest existing value, so it can neither
--     overwrite nor collide with an order an admin saved.
--   * One transaction under both runners (migrate.ts db.transaction; one D1
--     migration file = one implicit transaction).
--   * MATERIALIZED is load-bearing: without it the inlined CTE is
--     re-evaluated per written row and every row ends up with the same rank.
--     See the backfill note in 0002_add_display_order.sql for the rationale.

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM cars) AS base
  FROM cars WHERE display_order = 0
)
UPDATE cars SET display_order = (SELECT base + rn FROM pending WHERE pending.id = cars.id) WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM locations) AS base
  FROM locations WHERE display_order = 0
)
UPDATE locations SET display_order = (SELECT base + rn FROM pending WHERE pending.id = locations.id) WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM route_data) AS base
  FROM route_data WHERE display_order = 0
)
UPDATE route_data SET display_order = (SELECT base + rn FROM pending WHERE pending.id = route_data.id) WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM faqs) AS base
  FROM faqs WHERE display_order = 0
)
UPDATE faqs SET display_order = (SELECT base + rn FROM pending WHERE pending.id = faqs.id) WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM route_groups) AS base
  FROM route_groups WHERE display_order = 0
)
UPDATE route_groups SET display_order = (SELECT base + rn FROM pending WHERE pending.id = route_groups.id) WHERE display_order = 0;
