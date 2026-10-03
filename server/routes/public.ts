// server/routes/public.ts
// Public read API: the landing page's data payload and the photo byte endpoint.
// Mounted at `/api` in both `app.ts` and `worker.ts`.

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getDb } from '../db/d1.js';
import type { AppEnv } from '../db/d1.js';
import { getPublicData, getPricingData, getContentEntries } from '../db/queries.js';
import { getPhotoById } from '../db/photos.js';
import type { DataResponse, PricingResponse } from '../types.js';

export const publicApi = new Hono<{ Bindings: AppEnv }>();

publicApi.get('/data', async (c) => {
  const db = getDb(c.env);
  const [pub, pricing, content] = await Promise.all([
    getPublicData(db),
    getPricingData(db),
    getContentEntries(db),
  ]);
  const body: DataResponse = {
    ...pub,
    locations: pricing.locations,
    routeGroups: pricing.routeGroups,
    content,
    pricing,
  };
  return c.json(body);
});

publicApi.get('/pricing', async (c) => {
  const db = getDb(c.env);
  const pricing = await getPricingData(db);
  const body: PricingResponse = {
    ...pricing,
    routePricing: Object.fromEntries(
      pricing.routeGroups.map((group) => [group.id, group.pricing]),
    ),
    config: pricing.pricingConfig,
  };
  return c.json(body);
});

// ---------------------------------------------------------------------------
// Photo bytes
// ---------------------------------------------------------------------------

/**
 * WHY THE CACHE IS MANDATORY, NOT AN OPTIMISATION
 *   One pageview fetches ~20 images, so 20 of the 21 Worker invocations a
 *   single visit produces are image requests. Workers Free allows 100,000
 *   requests/day: uncached, that ceiling is about 4,700 pageviews/day — the
 *   site stops working for everyone else. With `caches.default` the second and
 *   every later view of a photo is served from the edge, costing zero D1 reads
 *   AND zero Worker invocations, which is the only way the numbers work.
 *
 * `caches.default` and `c.executionCtx` both exist on Workers but not on every
 * runtime this module is imported by (the Node runner in `server/index.ts`, and
 * Vitest's `app.request()`), so both are feature-detected and degrade to an
 * uncached read instead of throwing. Hono's `executionCtx` getter THROWS when
 * the context is absent — hence the try/catch rather than a null check.
 */
publicApi.get('/photos/:id', async (c) => {
  const cache = typeof caches === 'undefined' ? null : caches.default;
  const cached = cache === null ? undefined : await cache.match(c.req.raw);
  if (cached !== undefined) return cached;

  const db = getDb(c.env);
  const photo = await getPhotoById(db, c.req.param('id'));
  if (photo === null) return c.json({ error: 'Not Found' }, 404);

  const payload = base64PayloadOf(photo.data);
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const response = new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': photo.mime,
      'Content-Length': String(bytes.byteLength),
      // `photos.id` is immutable: a replacement upload mints a NEW id, so this
      // body can never change under a given URL. One year, no revalidation.
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: `"${photo.id}"`,
    },
  });

  if (cache !== null) storeInCache(c, cache, response.clone());
  return response;
});

/** `data:image/jpeg;base64,QUJD` -> `QUJD`; a comma-less value yields `''`. */
function base64PayloadOf(dataUrl: string): string {
  const separator = dataUrl.indexOf(',');
  return separator === -1 ? '' : dataUrl.slice(separator + 1);
}

/**
 * Hand the response to `caches.default` without blocking the visitor on it.
 * The `put` is a D1-free round trip, so it runs in `waitUntil`; the context
 * getter throws off-Workers, hence the catch.
 */
function storeInCache(
  c: Context<{ Bindings: AppEnv }>,
  cache: Cache,
  response: Response,
): void {
  try {
    c.executionCtx.waitUntil(cache.put(c.req.raw, response));
  } catch {
    // No execution context (Node runner / tests): serve uncached, do not fail.
  }
}