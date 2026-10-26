// tests/contract/S3.contract.test.ts
// S3: API JSON 404 versus Wrangler SPA fallback.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHarness, type D1Harness } from '../helpers/d1.js';
import { app } from '../../server/app.js';

describe('S3: API 404 contract', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
  });

  afterAll(async () => {
    await h.dispose();
  });

  it('GET /api/nonexistent returns 404 with JSON', async () => {
    const req = new Request('http://localhost/api/nonexistent');
    const res = await app.request(req, {}, h.env);
    expect(res.status).toBe(404);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/application\/json/i);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });
});
