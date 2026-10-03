// server/db/photos.ts
// One `photos` row per uploaded image (migration `0007_photos.sql`).
//
// WHY ROWS INSTEAD OF BASE64 IN A JSON ARRAY
//   `cars.images` used to hold `data:` URLs verbatim, so one cell carried the
//   entire array. D1 caps a single string / BLOB / row at 2,000,000 bytes
//   (https://developers.cloudflare.com/d1/platform/limits/), which an
//   uncompressed phone photo exceeds. Splitting the bytes into their own rows
//   removes the ceiling: no single `data` value can approach 2 MB once the
//   client compresses (target <=200KB binary ~= 267K base64 chars), and the
//   `cars.images` array shrinks from megabytes of base64 to ~50-byte paths.
//
// THE OWNER ARRAY IS UNCHANGED IN SHAPE
//   `cars.images` KEEPS its ordered `string[]`, only the strings change: a new
//   upload becomes `/api/photos/<id>` instead of a `data:` URL. Ordering and
//   the positional `imageAlts` invariant (`validateCar`,
//   `src/admin/carImageRows.ts`) are therefore untouched, and the 333 existing
//   `/assets/...` paths — served by the static asset server, not from D1 — pass
//   through verbatim with NO backfill.
//
// MIGRATION TO R2
//   Swapping `getPhotoById`'s `SELECT` for an `R2.get()` is the only change a
//   later task needs: `photos.id` is the stable key on both sides, and nothing
//   else in this module addresses the bytes.

import type {
  D1Database,
  D1PreparedStatement,
} from '@cloudflare/workers-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PhotoOwnerType = 'car' | 'content';

/** Polymorphic owner of a photo set: a `cars.id` or a `content` key. */
interface PhotoOwner {
  readonly type: PhotoOwnerType;
  readonly key: string;
}

/**
 * The write-side view of one photo: which row, whose it is, at which index, and
 * with which alt. Bundled into one object so the statement builders take a
 * single argument instead of a positional run of the same four values.
 */
interface PhotoWrite {
  readonly id: string;
  readonly owner: PhotoOwner;
  readonly position: number;
  readonly alt: string;
}

/** A full `photos` row, `data` included. Returned only by `getPhotoById`. */
export interface PhotoRow {
  readonly id: string;
  readonly owner_type: PhotoOwnerType;
  readonly owner_key: string;
  readonly position: number;
  readonly alt: string;
  readonly mime: string;
  readonly data: string;
  readonly created_at: string;
}

/** Metadata-only projection — `data` is intentionally absent from list paths. */
export interface PhotoMeta {
  readonly id: string;
  readonly owner_type: PhotoOwnerType;
  readonly owner_key: string;
  readonly position: number;
  readonly alt: string;
  readonly mime: string;
}

export interface PhotoInput {
  /** Either a `data:` URL (a new upload) or an already-stored path. */
  readonly source: string;
  readonly alt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Public URL prefix `GET /photos/:id` is mounted at, under `/api`. */
const PHOTO_PATH_PREFIX = '/api/photos/';

/**
 * D1's documented hard cap is 100 bound parameters per statement. 90 ids plus
 * the two owner columns leaves headroom, so an id list is chunked at 90 rather
 * than at the absolute limit.
 */
const MAX_ID_CHUNK = 90;

/**
 * D1's "Maximum string, BLOB or table row size | 2,000,000 bytes"
 * (https://developers.cloudflare.com/d1/platform/limits/). Enforced here, in
 * the application layer, rather than as a CHECK constraint: a byte-count rule
 * in the schema would not stay portable.
 */
export const PHOTO_ROW_MAX_BYTES = 2_000_000;

/** Admin-facing rejection text, shared so the route and the query agree. */
export const PHOTO_TOO_LARGE_MESSAGE =
  'الصورة كبيرة جدًا بعد الضغط — جرّب صورة أصغر';

/**
 * Media type out of a `data:` URL header, matched as RFC 2045 `type/subtype`
 * tokens only. Restricting the character set is also a header-injection guard:
 * the captured value is echoed back verbatim as `Content-Type` by
 * `GET /api/photos/:id`, so a CR/LF here would be a response-splitting bug.
 */
const MIME_IN_DATA_URL =
  /^data:([A-Za-z0-9!#$%&'*+.^_`|~-]+\/[A-Za-z0-9!#$%&'*+.^_`|~-]+)[;,]/;

const DEFAULT_MIME = 'application/octet-stream';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** True for a `data:` URL — a new upload, as opposed to an already-stored path. */
export function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

/** The value written into the owner's ordered array for a stored photo. */
export function photoPath(id: string): string {
  return `${PHOTO_PATH_PREFIX}${id}`;
}

/**
 * The inverse of {@link photoPath}: the id inside a stored-photo path, or
 * `null` for anything else — including a legacy `/assets/...` static path,
 * which must never be mistaken for a `photos` row.
 */
export function photoIdFromPath(value: string): string | null {
  if (!value.startsWith(PHOTO_PATH_PREFIX)) return null;
  const id = value.slice(PHOTO_PATH_PREFIX.length);
  return id === '' ? null : id;
}

/**
 * True when `source` is a `data:` URL whose UTF-8 length would exceed one
 * `photos.data` cell. A non-`data:` source is never over budget: it is either
 * a stored path (its bytes are already in D1) or a static-asset path (its
 * bytes are in the bundle).
 */
export function exceedsPhotoRowLimit(source: string): boolean {
  if (!isDataUrl(source)) return false;
  return new TextEncoder().encode(source).length > PHOTO_ROW_MAX_BYTES;
}

/** `data:image/jpeg;base64,QUJD` -> `image/jpeg`. See MIME_IN_DATA_URL. */
function mimeFromDataUrl(source: string): string {
  return MIME_IN_DATA_URL.exec(source)?.[1] ?? DEFAULT_MIME;
}

/**
 * Split a list so every resulting `IN (...)` query stays under D1's bound
 * parameter cap. Duplicated from `queries.ts` rather than shared, because
 * `queries.ts` imports this module and a back-import would be circular.
 */
function chunked<T>(items: readonly T[], size: number = MAX_ID_CHUNK): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** `?, ?, ?` — one placeholder per value, never an interpolated literal. */
function placeholders(length: number): string {
  return new Array<string>(length).fill('?').join(', ');
}

// ---------------------------------------------------------------------------
// Write path
// ---------------------------------------------------------------------------

/**
 * Ids of the stored-photo paths in `items` that still resolve to a live
 * `photos` row. Resolved in one `IN`-chunked read so a reorder costs no writes:
 * an id that is absent here is treated as a plain path and emitted verbatim.
 */
async function findReusableIds(
  db: D1Database,
  items: readonly PhotoInput[],
): Promise<Set<string>> {
  const candidates = items
    .filter((item) => !isDataUrl(item.source))
    .map((item) => photoIdFromPath(item.source))
    .filter((id): id is string => id !== null);

  const found = new Set<string>();
  for (const chunk of chunked(candidates)) {
    const { results } = await db
      .prepare(`SELECT id FROM photos WHERE id IN (${placeholders(chunk.length)})`)
      .bind(...chunk)
      .all<{ id: string }>();
    for (const row of results) {
      found.add(row.id);
    }
  }
  return found;
}

/** `INSERT` one new photo row. `created_at` takes the schema default. */
function insertStatement(
  db: D1Database,
  write: PhotoWrite,
  item: PhotoInput,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO photos (id, owner_type, owner_key, position, alt, mime, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      write.id,
      write.owner.type,
      write.owner.key,
      write.position,
      write.alt,
      mimeFromDataUrl(item.source),
      item.source,
    );
}

/**
 * Re-point an existing row at this owner and index. `data` and `mime` are
 * deliberately absent from the SET list: a reorder must rewrite zero bytes, and
 * re-encoding the payload would change its mime or lose the original bytes.
 * Writing `owner_type` / `owner_key` unconditionally is how a photo moves
 * between owners — when they already match, the write is a no-op.
 */
function reuseStatement(
  db: D1Database,
  write: PhotoWrite,
): D1PreparedStatement {
  return db
    .prepare(
      `UPDATE photos SET owner_type = ?, owner_key = ?, position = ?, alt = ?
       WHERE id = ?`,
    )
    .bind(write.owner.type, write.owner.key, write.position, write.alt, write.id);
}

/** Ids currently stored for one owner — the set the prune subtracts from. */
async function listOwnerIds(
  db: D1Database,
  owner: PhotoOwner,
): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT id FROM photos WHERE owner_type = ? AND owner_key = ?')
    .bind(owner.type, owner.key)
    .all<{ id: string }>();
  return results.map((row) => row.id);
}

/**
 * `DELETE` the owner's rows named in `toDelete`, chunked at
 * {@link MAX_ID_CHUNK}. The predicate MUST stay a positive `id IN (...)`: every
 * target row is in exactly one chunk, whereas a chunked `id NOT IN (...)`
 * deletes each chunk's complement, so past {@link MAX_ID_CHUNK} kept ids every
 * chunk wipes the others and the owner silently loses ALL its photos. An empty
 * `toDelete` yields no statement, so "keep everything" issues zero deletes.
 */
function pruneStatements(
  db: D1Database,
  owner: PhotoOwner,
  toDelete: readonly string[],
): D1PreparedStatement[] {
  const where = 'owner_type = ? AND owner_key = ?';
  return chunked(toDelete).map((chunk) =>
    db
      .prepare(
        `DELETE FROM photos
         WHERE ${where} AND id IN (${placeholders(chunk.length)})`,
      )
      .bind(owner.type, owner.key, ...chunk),
  );
}

/**
 * Make `photos` hold exactly `items`, in order, for one owner, and return the
 * ordered array to persist in the owner's JSON column.
 *
 * Each entry of the result corresponds positionally to the `items` entry at the
 * same index, so `imageAlts` stays aligned with `images`. Per item, in order:
 *
 *   1. `data:` URL — INSERT a new row, emit `/api/photos/<newId>`.
 *   2. path whose id still exists — REUSE the row, emit the path UNCHANGED. Only
 *      `position` / `alt` / owner move; `data` is never rewritten, so a reorder
 *      of existing photos writes zero bytes.
 *   3. anything else (a legacy `/assets/...` static path, or an id with no row) —
 *      emit verbatim and create no row. This is what keeps the shipped bundle
 *      images working with no backfill.
 *
 * All writes, including the prune, land in ONE `db.batch()` so a partial save
 * cannot leave the owner's rows half-replaced. Every id is a bound parameter and
 * the prune's delete list is chunked at {@link MAX_ID_CHUNK}.
 */
export async function replacePhotosForOwner(
  db: D1Database,
  ownerType: PhotoOwnerType,
  ownerKey: string,
  items: readonly PhotoInput[],
): Promise<string[]> {
  for (const item of items) {
    if (exceedsPhotoRowLimit(item.source)) {
      throw new Error(PHOTO_TOO_LARGE_MESSAGE);
    }
  }

  const owner: PhotoOwner = { type: ownerType, key: ownerKey };
  const reusable = await findReusableIds(db, items);
  const statements: D1PreparedStatement[] = [];
  const kept = new Set<string>();
  const paths: string[] = [];

  for (const [position, item] of items.entries()) {
    if (isDataUrl(item.source)) {
      const id = `photo-${crypto.randomUUID()}`;
      statements.push(
        insertStatement(db, { id, owner, position, alt: item.alt }, item),
      );
      kept.add(id);
      paths.push(photoPath(id));
      continue;
    }

    const existingId = photoIdFromPath(item.source);
    if (existingId !== null && reusable.has(existingId)) {
      statements.push(
        reuseStatement(db, { id: existingId, owner, position, alt: item.alt }),
      );
      kept.add(existingId);
      paths.push(item.source);
      continue;
    }

    paths.push(item.source);
  }

  const ownerIds = await listOwnerIds(db, owner);
  statements.push(
    ...pruneStatements(
      db,
      owner,
      ownerIds.filter((id) => !kept.has(id)),
    ),
  );
  // D1 rejects an empty batch (real `db.batch([])` throws, surfacing as a 500
  // from the car/content admin routes), while a legacy-only save — every input
  // a static `/assets/...` path or an already-pruned id, and the owner holding
  // no photo rows — legitimately produces zero statements. Skip the round trip
  // and return the verbatim paths. (The better-sqlite3 test shim tolerates an
  // empty batch, which is why the existing suite never caught this.)
  if (statements.length === 0) return paths;
  await db.batch(statements);
  return paths;
}

/**
 * Delete every photo row belonging to one owner. Callers must invoke this in
 * the same write path that deletes the owner itself: `photos.owner_key` is
 * polymorphic and carries no foreign key (see the `0007_photos.sql` header),
 * so nothing cascades for us.
 */
export async function deletePhotosForOwner(
  db: D1Database,
  ownerType: PhotoOwnerType,
  ownerKey: string,
): Promise<void> {
  await db
    .prepare('DELETE FROM photos WHERE owner_type = ? AND owner_key = ?')
    .bind(ownerType, ownerKey)
    .run();
}

// ---------------------------------------------------------------------------
// Read paths
// ---------------------------------------------------------------------------

/**
 * Every photo owned by one key, in index order, WITHOUT the bytes — the shape
 * an admin list or a public payload wants. Listing metadata rather than rows
 * keeps a 200-photo owner from pulling ~53MB into one response.
 */
export async function listPhotoMetadataByOwner(
  db: D1Database,
  ownerType: PhotoOwnerType,
  ownerKey: string,
): Promise<PhotoMeta[]> {
  const { results } = await db
    .prepare(
      `SELECT id, owner_type, owner_key, position, alt, mime
       FROM photos WHERE owner_type = ? AND owner_key = ? ORDER BY position ASC, id ASC`,
    )
    .bind(ownerType, ownerKey)
    .all<PhotoMeta>();
  return results;
}

/**
 * One photo including its bytes, or `null` when the id is unknown. This is the
 * ONLY read path that touches `data`, and the only one a move to R2 has to
 * replace: `R2.get(id)` behind the same signature, `photos.id` as the key.
 */
export async function getPhotoById(
  db: D1Database,
  id: string,
): Promise<PhotoRow | null> {
  return await db
    .prepare(
      `SELECT id, owner_type, owner_key, position, alt, mime, data, created_at
       FROM photos WHERE id = ?`,
    )
    .bind(id)
    .first<PhotoRow>();
}