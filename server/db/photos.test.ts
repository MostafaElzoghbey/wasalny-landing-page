// server/db/photos.test.ts
// Behaviour of the one-row-per-photo write path, against a real SQLite engine
// (better-sqlite3 behind the `D1Database` facade in `tests/helpers/d1Shim.ts`),
// so `db.batch()` atomicity and the bound-parameter `NOT IN` chunking are
// exercised for real rather than mocked.

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createHarness, type D1Harness } from '../../tests/helpers/d1.js';
import {
  deletePhotosForOwner,
  exceedsPhotoRowLimit,
  getPhotoById,
  isDataUrl,
  listPhotoMetadataByOwner,
  photoIdFromPath,
  photoPath,
  replacePhotosForOwner,
  PHOTO_ROW_MAX_BYTES,
  PHOTO_TOO_LARGE_MESSAGE,
} from './photos.js';
import type { PhotoInput, PhotoRow } from './photos.js';

const JPEG = 'data:image/jpeg;base64,QUJD';
const PNG = 'data:image/png;base64,QkJC';
const LEGACY = '/assets/images/cars/sedan/kia-cerato.jpeg';

/** A `data:` URL padded past the 2,000,000-byte per-row cap. */
function oversizedDataUrl(): string {
  return `data:image/jpeg;base64,${'A'.repeat(PHOTO_ROW_MAX_BYTES)}`;
}

async function countPhotos(db: D1Harness['db']): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM photos')
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * `count` distinct `data:` URLs. Only the header is ever parsed, so the body is
 * opaque bytes here and needs only be distinct.
 */
function distinctUploads(count: number): PhotoInput[] {
  return Array.from({ length: count }, (_, i) => ({
    source: `data:image/jpeg;base64,QUJD-${i}`,
    alt: `alt-${i}`,
  }));
}

/** `[id, data]` per row, id-ordered so a comparison ignores `position`. */
async function idDataPairs(
  db: D1Harness['db'],
): Promise<readonly (readonly [string, string])[]> {
  const { results } = await db
    .prepare('SELECT id, data FROM photos ORDER BY id ASC')
    .all<{ id: string; data: string }>();
  return results.map((row) => [row.id, row.data] as const);
}

describe('photos', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
  });

  afterAll(async () => {
    await h.dispose();
  });

  beforeEach(async () => {
    await h.db.prepare('DELETE FROM photos').run();
  });

  describe('path and mime helpers', () => {
    it('isDataUrl separates a new upload from an already-stored path', () => {
      expect(isDataUrl(JPEG)).toBe(true);
      expect(isDataUrl(LEGACY)).toBe(false);
      expect(isDataUrl(photoPath('photo-1'))).toBe(false);
    });

    it('photoIdFromPath round-trips photoPath', () => {
      expect(photoIdFromPath(photoPath('photo-abc'))).toBe('photo-abc');
    });

    it('photoIdFromPath returns null for a legacy static path', () => {
      expect(photoIdFromPath(LEGACY)).toBeNull();
      expect(photoIdFromPath('/api/photos/')).toBeNull();
      expect(photoIdFromPath('https://example.com/api/photos/x')).toBeNull();
    });
  });

  describe('replacePhotosForOwner', () => {
    it('creates exactly one row per data URL and returns its /api/photos path', async () => {
      const paths = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: 'alt-one' },
      ]);

      expect(paths).toHaveLength(1);
      expect(paths[0]).toBe(photoPath(photoIdFromPath(paths[0]) ?? ''));
      expect(await countPhotos(h.db)).toBe(1);

      const stored = await h.db
        .prepare('SELECT owner_type, owner_key, position, alt, mime, data FROM photos')
        .first<Omit<PhotoRow, 'id' | 'created_at'>>();
      expect(stored).toEqual({
        owner_type: 'car',
        owner_key: 'car-1',
        position: 0,
        alt: 'alt-one',
        mime: 'image/jpeg',
        data: JPEG,
      });
    });

    it('parses the mime of each data URL independently', async () => {
      const paths = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: '' },
        { source: PNG, alt: '' },
      ]);

      const { results } = await h.db
        .prepare('SELECT mime, position FROM photos ORDER BY position ASC')
        .all<{ mime: string; position: number }>();

      expect(results.map((row) => row.mime)).toEqual(['image/jpeg', 'image/png']);
      expect(results.map((row) => row.position)).toEqual([0, 1]);
      expect(paths).toHaveLength(2);
    });

    it('a reorder rewrites no bytes and creates zero new rows', async () => {
      const first = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: 'one' },
        { source: PNG, alt: 'two' },
      ]);
      const before = await countPhotos(h.db);

      const reordered = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: first[1], alt: 'two' },
        { source: first[0], alt: 'one' },
      ]);

      expect(await countPhotos(h.db)).toBe(before);
      expect(reordered).toEqual([first[1], first[0]]);

      // Same two ids, same bytes, only `position` moved.
      const { results } = await h.db
        .prepare('SELECT id, position, data FROM photos ORDER BY position ASC')
        .all<{ id: string; position: number; data: string }>();
      expect(results.map((row) => row.id)).toEqual([
        photoIdFromPath(first[1] ?? ''),
        photoIdFromPath(first[0] ?? ''),
      ]);
      expect(results.map((row) => row.data)).toEqual([PNG, JPEG]);
    });

    it('passes a legacy /assets path through verbatim and creates no row', async () => {
      const paths = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: LEGACY, alt: 'legacy' },
      ]);

      expect(paths).toEqual([LEGACY]);
      expect(await countPhotos(h.db)).toBe(0);
    });

    it('passes a path whose photo row is gone through without crashing or writing', async () => {
      const paths = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: photoPath('photo-does-not-exist'), alt: 'stale' },
      ]);

      expect(paths).toEqual([photoPath('photo-does-not-exist')]);
      expect(await countPhotos(h.db)).toBe(0);
    });

    it('drops the rows of images the caller removed', async () => {
      const both = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: '' },
        { source: PNG, alt: '' },
      ]);
      expect(await countPhotos(h.db)).toBe(2);

      await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: both[0] ?? '', alt: '' },
      ]);

      expect(await countPhotos(h.db)).toBe(1);
      const kept = await h.db.prepare('SELECT id FROM photos').first<{ id: string }>();
      expect(kept?.id).toBe(photoIdFromPath(both[0] ?? ''));
    });

    it('clearing every image removes every row the owner had', async () => {
      await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: '' },
        { source: PNG, alt: '' },
      ]);

      await replacePhotosForOwner(h.db, 'car', 'car-1', []);

      expect(await countPhotos(h.db)).toBe(0);
    });

    it('rejects an over-2,000,000-byte data URL with the Arabic message and writes nothing', async () => {
      await expect(
        replacePhotosForOwner(h.db, 'car', 'car-1', [
          { source: JPEG, alt: '' },
          { source: oversizedDataUrl(), alt: '' },
        ]),
      ).rejects.toThrow(PHOTO_TOO_LARGE_MESSAGE);

      expect(await countPhotos(h.db)).toBe(0);
    });

    it('exceedsPhotoRowLimit accepts a compressed-size data URL and ignores paths', () => {
      expect(exceedsPhotoRowLimit(JPEG)).toBe(false);
      expect(exceedsPhotoRowLimit(oversizedDataUrl())).toBe(true);
      expect(exceedsPhotoRowLimit(LEGACY)).toBe(false);
    });

    // Regression: `MAX_ID_CHUNK` is 90, so 91 kept ids make the prune span two
    // chunks. A chunked `id NOT IN (...)` deletes each chunk's complement —
    // every chunk therefore deletes every other chunk's rows, and the owner is
    // left with nothing while the batch reports success.
    describe('past the single-chunk prune limit', () => {
      it('keeps all 91 rows when 91 uploads exceed the chunk size', async () => {
        const paths = await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          distinctUploads(91),
        );

        expect(paths).toHaveLength(91);
        expect(await countPhotos(h.db)).toBe(91);
      });

      it('reorders 91 rows without rewriting a byte', async () => {
        const first = await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          distinctUploads(91),
        );
        const before = await idDataPairs(h.db);

        const reordered = [...first].reverse().map((source) => ({
          source,
          alt: '',
        }));
        await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          reordered,
        );

        expect(await countPhotos(h.db)).toBe(91);
        expect(await idDataPairs(h.db)).toEqual(before);
        const { results } = await h.db
          .prepare('SELECT position FROM photos ORDER BY position ASC')
          .all<{ position: number }>();
        expect(results.map((row) => row.position)).toEqual(
          Array.from({ length: 91 }, (_, i) => i),
        );
      });

      it('shrinks 91 rows to 30 by sending back 30 of the paths', async () => {
        const first = await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          distinctUploads(91),
        );

        await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          first.slice(0, 30).map((source) => ({ source, alt: '' })),
        );

        expect(await countPhotos(h.db)).toBe(30);
        const { results } = await h.db
          .prepare('SELECT id FROM photos')
          .all<{ id: string }>();
        expect(new Set(results.map((row) => row.id))).toEqual(
          new Set(first.slice(0, 30).map((source) => photoIdFromPath(source))),
        );
      });

      it('removes 90 rows and keeps 1 when a 91-row owner is cut to one image', async () => {
        const first = await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          distinctUploads(91),
        );

        await replacePhotosForOwner(h.db, 'content', 'mockupImages', [
          { source: first[0] ?? '', alt: '' },
        ]);

        expect(await countPhotos(h.db)).toBe(1);
        const kept = await h.db.prepare('SELECT id FROM photos').first<{
          id: string;
        }>();
        expect(kept?.id).toBe(photoIdFromPath(first[0] ?? ''));
      });

      it('removes 170 rows across two delete chunks when a 200-row owner is cut to 30', async () => {
        const first = await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          distinctUploads(200),
        );

        await replacePhotosForOwner(
          h.db,
          'content',
          'mockupImages',
          first.slice(0, 30).map((source) => ({ source, alt: '' })),
        );

        expect(await countPhotos(h.db)).toBe(30);
      });
    });
  });

  describe('read paths', () => {
    it('getPhotoById returns the full row including data', async () => {
      const [path] = await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: 'alt-one' },
      ]);
      const id = photoIdFromPath(path ?? '');

      const photo = await getPhotoById(h.db, id ?? '');

      expect(photo).toEqual({
        id,
        owner_type: 'car',
        owner_key: 'car-1',
        position: 0,
        alt: 'alt-one',
        mime: 'image/jpeg',
        data: JPEG,
        created_at: expect.any(String),
      });
    });

    it('getPhotoById returns null for an unknown id', async () => {
      expect(await getPhotoById(h.db, 'photo-nope')).toBeNull();
    });

    it('listPhotoMetadataByOwner omits data and orders by position', async () => {
      await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: 'one' },
        { source: PNG, alt: 'two' },
      ]);

      const meta = await listPhotoMetadataByOwner(h.db, 'car', 'car-1');

      expect(meta.map((row) => row.position)).toEqual([0, 1]);
      expect(meta.map((row) => row.mime)).toEqual(['image/jpeg', 'image/png']);
      expect(Object.keys(meta[0] ?? {})).not.toContain('data');
    });
  });

  describe('deletePhotosForOwner', () => {
    it('removes only the named owner rows', async () => {
      await replacePhotosForOwner(h.db, 'car', 'car-1', [
        { source: JPEG, alt: '' },
        { source: PNG, alt: '' },
      ]);
      await replacePhotosForOwner(h.db, 'car', 'car-2', [
        { source: JPEG, alt: '' },
      ]);
      await replacePhotosForOwner(h.db, 'content', 'mockupImages', [
        { source: PNG, alt: '' },
      ]);

      await deletePhotosForOwner(h.db, 'car', 'car-1');

      const { results } = await h.db
        .prepare('SELECT owner_type, owner_key FROM photos ORDER BY owner_key')
        .all<{ owner_type: string; owner_key: string }>();
      expect(results).toEqual([
        { owner_type: 'car', owner_key: 'car-2' },
        { owner_type: 'content', owner_key: 'mockupImages' },
      ]);
    });
  });

  describe('owner isolation', () => {
    it('two owners never see or delete each other rows', async () => {
      const carPhotos = await replacePhotosForOwner(
        h.db,
        'car',
        'car-1',
        [{ source: JPEG, alt: '' }],
      );
      const contentPhotos = await replacePhotosForOwner(
        h.db,
        'content',
        'mockupImages',
        [{ source: PNG, alt: '' }],
      );

      expect(await listPhotoMetadataByOwner(h.db, 'car', 'car-1')).toHaveLength(1);
      expect(
        await listPhotoMetadataByOwner(h.db, 'content', 'mockupImages'),
      ).toHaveLength(1);
      expect(carPhotos[0]).not.toBe(contentPhotos[0]);
      expect(await countPhotos(h.db)).toBe(2);
    });
  });
});