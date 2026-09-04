-- 0003_remove_car_name_passengers.sql
-- Drops `name` and `passengers` from the cars table.
-- Idempotency: guaranteed by the migration runner (migrate.ts checks
--   schema_migrations; wrangler d1 migrations apply tracks internally).
--   Direct re-runs of this SQL outside the runner WILL error on the
--   missing `cars` table — that is expected SQLite behaviour.
-- Pattern: recreate-table (CREATE new -> copy -> DROP old -> RENAME),
--   preserving display_order from 0002 and all remaining columns.

CREATE TABLE cars_new (
  id              TEXT PRIMARY KEY,
  nameAr          TEXT NOT NULL,
  category        TEXT NOT NULL,
  categoryAr      TEXT NOT NULL,
  description     TEXT NOT NULL,
  seo_description TEXT,
  images          TEXT NOT NULL DEFAULT '[]',
  image_alts      TEXT NOT NULL DEFAULT '[]',
  features        TEXT NOT NULL DEFAULT '[]',
  display_order   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO cars_new
  (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
SELECT
  id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order
FROM cars;

DROP TABLE cars;

ALTER TABLE cars_new RENAME TO cars;