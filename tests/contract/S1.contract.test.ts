// tests/contract/S1.contract.test.ts
// S1: /api/data, /api/pricing shapes.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHarness, type D1Harness } from '../helpers/d1.js';
import { app } from '../../server/app.js';

describe('S1: public data/pricing shapes', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
    await h.applySeed();
  });

  afterAll(async () => {
    await h.dispose();
  });

  it('GET /api/data returns expected top-level keys', async () => {
    const req = new Request('http://localhost/api/data');
    const res = await app.request(req, {}, h.env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('cars');
    expect(json).toHaveProperty('locations');
    expect(json).toHaveProperty('routeData');
    expect(json).toHaveProperty('faqs');
    expect(json).toHaveProperty('routeGroups');
    expect(json).toHaveProperty('content');
    expect(json).toHaveProperty('pricing');
  });

  it('GET /api/pricing returns expected shape', async () => {
    const req = new Request('http://localhost/api/pricing');
    const res = await app.request(req, {}, h.env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('routePricing');
    expect(json).toHaveProperty('vehiclePricing');
    expect(json).toHaveProperty('config');
  });
});
