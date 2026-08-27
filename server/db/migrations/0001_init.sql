-- 0001_init.sql
-- Idempotent initial schema for the Wasalny landing-page data layer.
-- All JSON / array values are stored as TEXT (parsed by the application layer).
-- Safe to re-run: every statement uses CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS locations (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  nameAr   TEXT NOT NULL,
  type     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS route_groups (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  nameAr          TEXT NOT NULL,
  bidirectional   INTEGER NOT NULL DEFAULT 0,
  from_locations  TEXT NOT NULL DEFAULT '[]',
  to_locations    TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS route_pricing (
  route_group_id    TEXT NOT NULL,
  vehicle_category  TEXT NOT NULL,
  one_way           INTEGER NOT NULL DEFAULT 0,
  round_trip        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (route_group_id, vehicle_category),
  FOREIGN KEY (route_group_id) REFERENCES route_groups(id)
);

CREATE TABLE IF NOT EXISTS vehicle_pricing (
  category       TEXT PRIMARY KEY,
  categoryAr     TEXT NOT NULL,
  max_passengers INTEGER NOT NULL,
  min_passengers INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pricing_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cars (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  nameAr          TEXT NOT NULL,
  category        TEXT NOT NULL,
  categoryAr      TEXT NOT NULL,
  description     TEXT NOT NULL,
  seo_description TEXT,
  passengers      INTEGER NOT NULL,
  images          TEXT NOT NULL DEFAULT '[]',
  image_alts      TEXT NOT NULL DEFAULT '[]',
  features        TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS content (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faqs (
  id       TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS route_data (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  metaTitle     TEXT NOT NULL,
  metaDescription TEXT NOT NULL,
  heroImage     TEXT NOT NULL,
  priceStart    TEXT NOT NULL,
  distance      TEXT NOT NULL,
  duration      TEXT NOT NULL,
  features      TEXT NOT NULL DEFAULT '[]',
  faqs          TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS admins (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  admin_id   TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
