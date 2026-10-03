-- 0002_add_display_order.sql
-- Adds display_order column for sortable admin ordering on five content tables.
-- Idempotency: guaranteed by the migration runner (migrate.ts checks
--   schema_migrations; wrangler d1 migrations apply tracks in d1_migrations).
--   Direct re-runs of this SQL outside the runner WILL error on duplicate
--   columns — that is expected SQLite behaviour.
-- Backfill: deterministic, primary-key derived order (see "Backfill" below).
--
-- D1 NOTES
--   * No `rowid` anywhere. display_order used to be seeded from rowid
--     (insertion order). SQLite gives rowid no stability guarantee — it is
--     reassigned by VACUUM / auto-vacuum and by any table rewrite, and D1's
--     export+import path does not preserve insertion order (D1 runs
--     auto-vacuum). Cloudflare's D1 documentation makes no promise about
--     rowid, so the backfill is now driven by the primary key: a declared
--     value rather than an implicit one.
--   * Only display_order = 0 rows are touched, so an already-curated admin
--     order is never rewritten.
--   * The append base (highest existing display_order + 1) guarantees the
--     backfill can never collide with a value an admin already assigned.
--   * The whole file runs as one transaction under both runners
--     (better-sqlite3: migrate.ts db.transaction; D1: one migration file =
--     one implicit transaction), so a failure in any statement leaves no
--     half-backfilled table behind.

-- ─── Add columns ───────────────────────────────────────────────────
-- NOT NULL + DEFAULT 0 is required: SQLite cannot add a NOT NULL column
-- without a non-null default, and D1 enforces the same rule.

ALTER TABLE cars ADD COLUMN
  display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE locations ADD COLUMN
  display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE route_data ADD COLUMN
  display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE faqs ADD COLUMN
  display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE route_groups ADD COLUMN
  display_order INTEGER NOT NULL DEFAULT 0;

-- ─── Backfill: deterministic order, no rowid ───────────────────────
-- Rows still at the default (0) are numbered after the highest already
-- assigned display_order, in primary-key (id ASC) order:
--
--   next_order = COALESCE(MAX(display_order), -1) + 1
--   display_order = next_order + (rank of this id among the 0-rows, id ASC)
--
-- MATERIALIZED is load-bearing, not decoration. An UPDATE re-reads its own
-- target table as it writes, so an inlined subquery is re-evaluated per row
-- and only ever sees the rows not yet written — which silently collapses the
-- rank (every row ends up with the same value). MATERIALIZED pins the CTE to
-- a single pre-update snapshot, so the rank and the MAX base are both read
-- from the state before the first write. Verified on SQLite 3.53.4 and on D1
-- (both support MATERIALIZED and window functions).
--
-- Idempotent: after a successful run no row is left at 0, so a re-run matches
-- nothing. All five statements are structurally identical; only the table
-- name changes. This reproduces the old 1..N result for a fully-defaulted
-- table, and differs from the old rowid version only for partially-ordered
-- tables, where the old version could assign a value colliding with a
-- curated one.

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM cars) AS base
  FROM cars WHERE display_order = 0
)
UPDATE cars SET display_order = (SELECT base + rn FROM pending WHERE pending.id = cars.id)
WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM locations) AS base
  FROM locations WHERE display_order = 0
)
UPDATE locations SET display_order = (SELECT base + rn FROM pending WHERE pending.id = locations.id)
WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM route_data) AS base
  FROM route_data WHERE display_order = 0
)
UPDATE route_data SET display_order = (SELECT base + rn FROM pending WHERE pending.id = route_data.id)
WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM faqs) AS base
  FROM faqs WHERE display_order = 0
)
UPDATE faqs SET display_order = (SELECT base + rn FROM pending WHERE pending.id = faqs.id)
WHERE display_order = 0;

WITH pending AS MATERIALIZED (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn,
         (SELECT COALESCE(MAX(display_order), -1) + 1 FROM route_groups) AS base
  FROM route_groups WHERE display_order = 0
)
UPDATE route_groups SET display_order = (SELECT base + rn FROM pending WHERE pending.id = route_groups.id)
WHERE display_order = 0;
