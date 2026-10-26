-- 0007_photos.sql
-- One row per uploaded photo: `id`, `owner_type`, `owner_key`, `position`,
-- `alt`, `mime`, `data`, `created_at`. Replaces base64 data-URL arrays packed
-- into single TEXT columns (today `mockupImages` stores the ENTIRE array in
-- ONE `content.value` cell; 200 compressed photos x ~267KB ~= 53MB in a single
-- row, far past the D1 row-size cap even after client-side compression).
-- Splitting to one row per photo is what makes 100-200 photo uploads possible.
-- Idempotency: guaranteed by the migration runner (migrate.ts checks
--   schema_migrations; wrangler d1 migrations apply tracks in d1_migrations),
--   AND by the IF NOT EXISTS guards below — unlike the recreate-table (0003)
--   and ALTER-style (0002/0005/0006) migrations, a direct re-run of this file
--   outside the runner succeeds as a no-op instead of erroring.
--
-- NO FOREIGN KEY (deliberate)
--   `photos.owner_key` is polymorphic: it points at `cars.id` for
--   owner_type = 'car' and at a `content` key (e.g. 'mockupImages') for
--   owner_type = 'content'. SQLite cannot reference two parent tables from one
--   column, so no REFERENCES clause is declared. The codebase already
--   establishes the precedent of explicit batched deletes instead of cascades
--   (see deleteRouteGroup in server/db/queries.ts, and the header note in
--   0003_remove_car_name_passengers.sql explaining that `cars` is a leaf
--   table). Orphan cleanup is therefore the CALLER's responsibility: whoever
--   deletes a car or clears a content key must delete that owner's photo rows
--   in the same write path.
--
-- D1 ROW-SIZE BUDGET
--   `data` holds a full `data:` URL. D1's documented maximum string/BLOB/row
--   size is 2,000,000 bytes
--   (https://developers.cloudflare.com/d1/platform/limits/).
--   The client compresses to a <=200KB binary target (~267K base64 chars)
--   before upload, leaving large headroom per row. The application layer —
--   NOT a CHECK constraint — enforces the cap, because a CHECK would embed a
--   byte-count rule in the schema and must stay portable.
--
-- POSITION AND ALT
--   `position` mirrors the array index the admin UI uses. `cars.imageAlts` is
--   positionally indexed against `cars.images` (enforced by validateCar in
--   src/admin/carHelpers.ts), so the photo row must carry its own `alt` and
--   its own `position` to preserve that invariant. Readers order by
--   (owner_type, owner_key, position) via idx_photos_owner below.
--
-- EMPTY TABLE, NO DATA MOVED
--   This migration creates an EMPTY table. Existing base64 arrays remain in
--   `cars.images` / `content.mockupImages` until the next admin save triggers
--   a full-replace. That coexistence is the accepted transitional state, not
--   a half-migration: no backfill is attempted because the source cells hold
--   either static-asset PATH strings (today's production state) or data URLs
--   whose owner mapping only the application layer knows.
--
-- OWNER_TYPE VALUES
--   Allowed values are 'car' and 'content'. The plan deliberately omits a
--   CHECK constraint for the same portability reason as the size cap above —
--   validation happens in the application layer.
--
-- DEPLOY STEP (manual)
--   GitHub auto-redeploy does NOT run D1 migrations, so after merge someone
--   must run:
--     wrangler d1 migrations apply wasalny-db --remote

CREATE TABLE IF NOT EXISTS photos (
  id         TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_key  TEXT NOT NULL,
  position   INTEGER NOT NULL,
  alt        TEXT NOT NULL DEFAULT '',
  mime       TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_photos_owner
  ON photos (owner_type, owner_key, position);
