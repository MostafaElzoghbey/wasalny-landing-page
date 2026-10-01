import { Hono } from 'hono';
import { getDb } from '../db/d1.js';
import type { AppEnv } from '../db/d1.js';
import { getPublicData, getPricingData, getContentEntries } from '../db/queries.js';
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
