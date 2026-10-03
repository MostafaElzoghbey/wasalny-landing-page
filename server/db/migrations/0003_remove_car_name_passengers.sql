-- 0003_remove_car_name_passengers.sql
-- Drops `name` and `passengers` from the cars table.
-- Idempotency: guaranteed by the migration runner (migrate.ts checks
--   schema_migrations; wrangler d1 migrations apply tracks in d1_migrations).
--   Direct re-runs of this SQL outside the runner WILL error on the
--   missing `cars` table — that is expected SQLite behaviour.
-- Pattern: recreate-table (CREATE new -> copy -> DROP old -> RENAME),
--   preserving display_order from 0002 and all remaining columns.
--
-- FOREIGN KEYS / DEFERRABLE
--   Schema-wide FK inventory (only two FK clauses exist, both declared in
--   0001_init.sql):
--       route_pricing.route_group_id -> route_groups(id)
--       sessions.admin_id            -> admins(id)
--   `cars` appears in neither list: it declares no FOREIGN KEY clause and
--   nothing references it, so it is a leaf. DROP TABLE cars and the RENAME
--   below therefore cannot violate referential integrity under
--   foreign_keys = ON (Node: connection.ts pragma) or under D1, where FK
--   enforcement is always on. No DEFERRABLE clause is required here, and
--   adding one would be a lie about a constraint this table does not have.
--
--   D1 mechanics that shape any future FK-bearing recreate here:
--     1. D1 applies one migration file as one implicit transaction, so the
--        create/copy/drop/rename sequence is atomic in both runners, and an
--        explicit BEGIN/COMMIT would be rejected outright.
--     2. FK enforcement is always on in D1 (verified: PRAGMA foreign_keys
--        returns 1) and cannot be switched off from inside a query or a
--        migration. The supported escape hatch is
--            PRAGMA defer_foreign_keys = on;
--        as the first statement of the migration file — D1 pragmas apply to
--        the current transaction, which is the whole file. Note it defers
--        constraint checks only: ON DELETE CASCADE still fires.
--     3. DEFERRABLE INITIALLY DEFERRED on the replacement table's FOREIGN KEY
--        clause is the declaration-time equivalent and composes with (2) if a
--        child must outlive its parent across statements; it is plain SQLite
--        DDL that D1 passes through, but D1's own docs only document the
--        pragma above.
--     4. Drop order, for a recreate that does carry FKs: drop children
--        before parents, or recreate the parent and let
--        `ALTER TABLE <new> RENAME TO <old>` re-point the children's FK
--        clauses. That rewrite is the default (legacy_alter_table = OFF)
--        behaviour and is what makes the parent-recreate path safe; do not
--        run these migrations with legacy_alter_table = ON.
--   0001's two FK clauses are deliberately left as plain (immediate) FKs:
--   queries.ts writes parent-then-children inside one transaction
--   (upsertRouteGroupWithPricing), so nothing relies on deferred checking,
--   and changing them here would break sqlite_master parity with the Node DB.

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

-- Explicit column lists on both sides: the copy must not depend on the
-- physical column order of `cars`, which differs between a Node DB migrated
-- by 0002 (ALTER TABLE ... ADD COLUMN appends) and any table recreated by a
-- later migration.
INSERT INTO cars_new
  (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
SELECT
  id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order
FROM cars;

DROP TABLE cars;

ALTER TABLE cars_new RENAME TO cars;
