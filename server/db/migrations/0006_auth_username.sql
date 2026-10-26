-- 0006_auth_username.sql
-- Username login for the admin API (S2 contract) without breaking existing
-- email rows or sessions.
--
--   * admins gains `username TEXT UNIQUE` and `role TEXT NOT NULL DEFAULT
--     'admin'`. `email` becomes nullable (username-only rows exist) and
--     `password_salt` becomes nullable: the PBKDF2 parameters travel inside
--     `password_hash` (`pbkdf2-sha256$iterations$salt$hash`), so a NULL salt
--     column means "verify against the embedded salt". A non-NULL salt must
--     still agree with the embedded one (fail-closed, as before).
--   * sessions gains `created_at TEXT NOT NULL DEFAULT ''` so session rows can
--     carry their creation time.
--
-- SQLite cannot ALTER a column's nullability, so admins is rebuilt (create,
-- copy, drop, rename) while sessions only needs ADD COLUMN. Existing rows are
-- preserved byte-for-byte; existing sessions keep pointing at the same
-- admins.id values because ids are copied, not regenerated.

CREATE TABLE admins_new (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL DEFAULT ''
);
INSERT INTO admins_new (id, username, email, password_hash, password_salt, role, created_at)
  SELECT id, NULL, email, password_hash, password_salt, 'admin', created_at FROM admins;
DROP TABLE admins;
ALTER TABLE admins_new RENAME TO admins;
ALTER TABLE sessions ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
