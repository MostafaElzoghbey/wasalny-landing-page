// server/routes/public.photos.test.ts
// `GET /api/photos/:id` — the byte-serving endpoint.
//
// The cache is the load-bearing part of this route (see the comment in
// `public.ts`), so it is stubbed rather than left untested: the assertions
// prove a second request is served WITHOUT touching D1, not merely that a
// `cache.put` was called.

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { createHarness, type D1Harness } from '../../tests/helpers/d1.js';
import { publicApi } from './public.js';
import {
  replacePhotosForOwner,
  photoIdFromPath,
} from '../db/photos.js';

const JPEG = 'data:image/jpeg;base64,QUJD';

/** Where `app.ts` / `worker.ts` mount `publicApi`; see `photoPath()` for the stored form. */
const MOUNT_PREFIX = '/api';

function routePath(storedPath: string): string {
  return storedPath.slice(MOUNT_PREFIX.length);
}

/**
 * The Workers runtime always passes an `ExecutionContext`, and `app.request()`
 * takes one as its 4th argument. Without it Hono's `executionCtx` getter throws,
 * so a test that wants to observe the cache write has to supply it.
 */
function executionCtx(): { ctx: ExecutionContext; settled: Promise<unknown>[] } {
  const settled: Promise<unknown>[] = [];
  return {
    ctx: {
      waitUntil: (promise: Promise<unknown>) => {
        settled.push(promise);
      },
      passThroughOnException: () => {},
    } as unknown as ExecutionContext,
    settled,
  };
}

/** Minimal in-memory `Cache`, keyed by request URL like the Workers Cache API. */
function fakeCaches(): CacheStorage {
  const store = new Map<string, Response>();
  const cache: Cache = {
    match: async (request: RequestInfo | URL) =>
      store.get(String(request)) ?? undefined,
    put: async (request: RequestInfo | URL, response: Response) => {
      store.set(String(request), response);
    },
  };
  return { default: cache } as unknown as CacheStorage;
}

describe('GET /api/photos/:id', () => {
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
    vi.stubGlobal('caches', fakeCaches());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('decodes the stored data URL into the image bytes', async () => {
    const [path] = await replacePhotosForOwner(h.db, 'car', 'car-1', [
      { source: JPEG, alt: '' },
    ]);

    const res = await publicApi.request(routePath(path ?? ''), {}, h.env);
    const bytes = new Uint8Array(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect([...bytes]).toEqual([...'ABC'].map((c) => c.charCodeAt(0)));
  });

  it('serves immutable caching headers keyed on the photo id', async () => {
    const [path] = await replacePhotosForOwner(h.db, 'car', 'car-1', [
      { source: JPEG, alt: '' },
    ]);

    const res = await publicApi.request(routePath(path ?? ''), {}, h.env);

    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Content-Length')).toBe('3');
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(res.headers.get('ETag')).toBe(`"${photoIdFromPath(path ?? '')}"`);
  });

  it('a second request is served from cache, not from D1', async () => {
    const [path] = await replacePhotosForOwner(h.db, 'car', 'car-1', [
      { source: JPEG, alt: '' },
    ]);
    const { ctx, settled } = executionCtx();
    const first = await publicApi.request(
      routePath(path ?? ''),
      {},
      h.env,
      ctx,
    );
    expect(first.status).toBe(200);
    await Promise.all(settled);

    // Removing the row proves the second hit cannot have read D1.
    await h.db.prepare('DELETE FROM photos').run();

    const second = await publicApi.request(
      routePath(path ?? ''),
      {},
      h.env,
      ctx,
    );

    expect(second.status).toBe(200);
    expect(new Uint8Array(await second.arrayBuffer()).byteLength).toBe(3);
  });

  it('still serves when caches exists but no execution context does', async () => {
    const [path] = await replacePhotosForOwner(h.db, 'car', 'car-1', [
      { source: JPEG, alt: '' },
    ]);

    // No 4th argument: Hono's `executionCtx` getter throws, so the route must
    // fall back to an uncached read instead of failing the request.
    const res = await publicApi.request(routePath(path ?? ''), {}, h.env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('returns 404 JSON for an unknown id', async () => {
    const res = await publicApi.request('/photos/photo-nope', {}, h.env);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not Found' });
  });

  it('serves uncached rather than throwing where caches is absent', async () => {
    vi.stubGlobal('caches', undefined);
    const [path] = await replacePhotosForOwner(h.db, 'car', 'car-1', [
      { source: JPEG, alt: '' },
    ]);

    const res = await publicApi.request(routePath(path ?? ''), {}, h.env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });
});