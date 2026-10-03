# Migration ledger: `schema_migrations` vs `d1_migrations`

The same seven SQL files in this directory are applied by two runners against two
different ledgers. This file is the mapping between them.

| | Node (better-sqlite3) | D1 (Workers) |
|---|---|---|
| Runner | `server/db/migrate.ts` (`npm run db:migrate`) | `npx wrangler d1 migrations apply <name>` |
| Ledger table | `schema_migrations` | `d1_migrations` (created by wrangler, not by us) |
| Ledger DDL | `version TEXT PRIMARY KEY, applied_at TEXT NOT NULL` | `id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| Stored value | `0001_init` (filename minus `.sql`) | `0001_init.sql` (full filename) |
| Written by | `INSERT INTO schema_migrations` after each file, inside the file's transaction | appended to the migration's own query string, inside the same transaction |
| Transaction | `db.transaction()` per file | one migration file = one implicit transaction; `BEGIN`/`COMMIT` rejected |
| Splitting | naive: strip `--` comments, split on `;` | the whole file is sent as one query string |
| Ordering | `readdirSync().sort()` | numeric-then-lexical on the leading number |
| File location | `server/db/migrations` (hardcoded `MIGRATIONS_DIR`) | `migrations_dir` in `wrangler.jsonc` → `server/db/migrations` |

`wrangler.jsonc` must keep `"migrations_dir": "server/db/migrations"`. Without it
wrangler looks in `./migrations`, finds nothing, and errors with
`No migrations present at <root>/migrations` — the D1 runner and the Node runner
must never diverge on the file set.

## `migrate.ts` status

`server/db/migrate.ts` is **obsolete for D1 and still required for Node**. It is
not deleted: it remains the only way to migrate `data/app.db` (the local Node
server, `npm test`, `scripts/create-admin.ts`). Two things it does that D1 does
not need any more:

- it creates `schema_migrations` itself before scanning the directory;
- it renames a legacy `'0001'` row to `'0001_init'` (the pre-`schema_migrations`
  runner stored the bare number). D1 has no such legacy state, so this does not
  exist on the D1 side.

`schema_migrations` is still created on D1 — by `0001_init.sql`, not by wrangler —
and is never written there. It is a harmless vestigial table. Removing it from
`0001_init.sql` would make the file diverge from the Node path, so it stays.

## Bootstrapping a D1 database from the existing Node data

**Use this order** (verified end to end):

1. `npx wrangler d1 migrations apply <db> --remote` — applies all seven files to an
   empty database.
2. `wrangler d1 export` from the Node DB → strip the schema (keep `INSERT`s) →
   `npx wrangler d1 execute <db> --remote --file dump.sql`.

Result verified locally: 11/11 tables byte-identical to the Node DB, including all
Arabic content, and `SELECT sql FROM sqlite_master` identical for every table
except the whitespace-only `schema_migrations` difference below.

### Do not import first

Importing a dump of an already-migrated Node DB and *then* running
`migrations apply` fails at `0002`:

```
ERROR  duplicate column name: display_order: SQLITE_ERROR
```

The columns are already there, and the ledger does not know. This is expected and
is the reason the ledger below has to be carried over.

### Baselining an already-migrated database

If a D1 database already holds the final schema, teach the ledger about it
instead of re-running anything (both commands verified locally):

```bash
npx wrangler d1 execute <db> --remote --command \
  "INSERT INTO d1_migrations (name) VALUES ('0001_init.sql'),
   ('0002_add_display_order.sql'),
   ('0003_remove_car_name_passengers.sql'),
   ('0004_backfill_display_order.sql'),
   ('0005_route_data_labels.sql'),
   ('0006_auth_username.sql'),
   ('0007_photos.sql')"

npx wrangler d1 migrations apply <db> --remote   # -> "No migrations to apply!"
```

`d1_migrations` is a normal table and `wrangler d1 execute` may write to it; there
is no official `wrangler d1 migrations baseline` command. The `UNIQUE` constraint
on `name` means re-running the `INSERT` errors, so it is a one-time step — verify
with `npx wrangler d1 migrations list <db> --remote` first.

## Known cosmetic schema difference

`schema_migrations` is the only table whose `sqlite_master.sql` text differs
between the two databases, and only in indentation: the Node DB's copy was
created by `migrate.ts`'s inline `CREATE TABLE` (6-space indent), while D1 gets
the copy from `0001_init.sql` (2-space). Whitespace-normalised the two are
identical, and no application query reads the DDL.

## Constraints the migrations are written against

- D1 free tier: 5M rows read / 100k rows written per day, 100 bound parameters and
  100 columns per statement, 100 KB per statement, 32 arguments per SQL function.
  The backfills use no bound parameters at all; `0005`'s inner subquery narrows
  `content` to the single `routes` row so it does not re-scan the table per row.
  Measured cost of the read/write paths against these caps is in
  [`../LIMITS.md`](../LIMITS.md), guarded by `tests/d1-limits.guard.test.ts`.
- `PRAGMA defer_foreign_keys` and `PRAGMA foreign_keys` are accepted by D1 but
  `foreign_keys` is a no-op (it cannot change inside a transaction) and is
  already `1`; `BEGIN`/`COMMIT` are rejected. See the FK notes in
  `0003_remove_car_name_passengers.sql`.
- `rowid` is not used for ordering anywhere: SQLite gives it no stability
  guarantee, and D1's export/import does not preserve insertion order.
  `display_order` is derived from the primary key instead.

## 0006_auth_username.sql (username login, S2)

Adds username login without breaking existing email rows or sessions: `admins`
gains `username TEXT UNIQUE` + `role TEXT NOT NULL DEFAULT 'admin'`, `email`
becomes nullable (username-only rows exist), `password_salt` becomes nullable
(the PBKDF2 parameters travel inside `password_hash`, so NULL salt means
"verify against the embedded salt"; a non-NULL salt must still agree with the
embedded one, fail-closed). `sessions` gains `created_at TEXT NOT NULL
DEFAULT ''`. SQLite cannot ALTER column nullability, so `admins` is rebuilt
(create, copy, drop, rename); ids are copied, not regenerated, so existing
sessions keep pointing at the same `admins.id` values. Login accepts either a
username or an email identifier (`server/routes/adminAuth.ts`).

## 0007_photos.sql (per-photo rows)

One row per uploaded photo (`photos`: `id`, `owner_type`, `owner_key`,
`position`, `alt`, `mime`, `data`, `created_at`, plus `idx_photos_owner` on
`(owner_type, owner_key, position)`), replacing base64 data-URL arrays packed
into single TEXT cells. `owner_key` is polymorphic (`cars.id` for
`owner_type='car'`, a `content` key such as `'mockupImages'` for
`owner_type='content'`), so no FOREIGN KEY is declared and orphan cleanup is
the caller's responsibility; `owner_type` (`'car'`/`'content'`) and the ~200KB
client-side size target are enforced by the application layer, not by CHECK
constraints. The table is created EMPTY — no data is moved — so this file is a
no-op re-run even outside the runners (`IF NOT EXISTS` on both statements).

Ledger values: `schema_migrations` stores `0007_photos` (filename minus
`.sql`); `d1_migrations` stores `0007_photos.sql` (full filename).
