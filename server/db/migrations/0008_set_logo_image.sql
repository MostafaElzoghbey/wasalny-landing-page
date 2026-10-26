-- 0008_set_logo_image.sql
-- Re-points the content KV row for the site logo ("logoImage") at the new
-- logo asset set in /assets/images/new-logo/.
--
-- Idempotency: conditional UPDATE — the row is only touched when its value
-- still matches the previous logo path exactly. If the value is absent or
-- was curated to anything else through the admin content CRUD, this file is
-- a no-op re-run. Safe under both runners (better-sqlite3 migrate.ts and
-- `wrangler d1 migrations apply`): one value UPDATE inside the runner's
-- implicit transaction.
--
-- The stored value is a JSON-quoted string (seed writes
-- `JSON.stringify(logoImage)`), hence the inner double quotes.

UPDATE content
SET value = '"/assets/images/new-logo/logo.jpeg"'
WHERE key = 'logoImage'
  AND value = '"/assets/images/logo/logo.jpeg"';
