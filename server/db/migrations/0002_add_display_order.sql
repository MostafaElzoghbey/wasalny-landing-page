-- 0002_add_display_order.sql
-- Adds display_order column for sortable admin ordering on five content tables.
-- Idempotency: guaranteed by the migration runner (migrate.ts checks
--   schema_migrations; wrangler d1 migrations apply tracks internally).
--   Direct re-runs of this SQL outside the runner WILL error on duplicate
--   columns — that is expected SQLite behaviour.
-- Backfill: assigns rowid (insertion order) to every existing row.
--   The WHERE display_order = 0 clause makes UPDATEs idempotent.

-- ─── Add columns ───────────────────────────────────────────────────

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

-- ─── Backfill insertion-order values ────────────────────────────────
-- Only rows still at the default (0) are updated; reruns are no-ops.

UPDATE cars         SET display_order = rowid WHERE display_order = 0;
UPDATE locations    SET display_order = rowid WHERE display_order = 0;
UPDATE route_data   SET display_order = rowid WHERE display_order = 0;
UPDATE faqs         SET display_order = rowid WHERE display_order = 0;
UPDATE route_groups SET display_order = rowid WHERE display_order = 0;
