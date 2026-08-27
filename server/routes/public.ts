import { Hono } from 'hono';
import { getDb } from '../db/connection.js';
import { getPublicData, getPricingData } from '../db/queries.js';

export const publicApi = new Hono();

publicApi.get('/data', (c) => {
  const db = getDb();
  return c.json(getPublicData(db));
});

publicApi.get('/pricing', (c) => {
  const db = getDb();
  return c.json(getPricingData(db));
});
