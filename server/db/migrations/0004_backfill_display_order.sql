-- 0004_backfill_display_order.sql
-- Backfill display_order for rows stuck at the default 0.
-- For deployed DBs where 0002 ran but backfill was skipped or
-- new rows were inserted with the DEFAULT 0.
-- Idempotent: WHERE display_order = 0 ensures no-ops on re-run.

UPDATE cars         SET display_order = rowid WHERE display_order = 0;
UPDATE locations    SET display_order = rowid WHERE display_order = 0;
UPDATE route_data   SET display_order = rowid WHERE display_order = 0;
UPDATE faqs         SET display_order = rowid WHERE display_order = 0;
UPDATE route_groups SET display_order = rowid WHERE display_order = 0;
