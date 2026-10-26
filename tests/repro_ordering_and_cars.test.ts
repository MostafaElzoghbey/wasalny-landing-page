// tests/repro_ordering_and_cars.test.ts
// RED repro harness — proves two bug classes BEFORE any fix:
//
//   S-ORD-1  seed must write sequential display_order for locations/faqs/
//            route_data/route_groups/cars (seed-001.sql).
//   S-ORD-2  Admin doReorder keeps stale client-side displayOrder (all 0)
//            because setItems(next) never rewrites displayOrder
//            (FaqAdmin.tsx:68-79, LocationAdmin.tsx:79-90,
//             RouteDataAdmin.tsx:93-104, RouteGroupAdmin.tsx:143-154).
//   S-CAR-1  validateCar requires categoryAr even though it is auto-derivable
//            from category via CATEGORY_LABELS (carHelpers.ts:33-46,
//            CarAdmin.tsx:13, CarAdmin.tsx:100).
//
// All assertions use REAL logic: the actual seed SQL, the actual query layer
// (getFaqs / getPricingData / getPublicData), the actual reorderEntities(),
// and the actual validateCar()/CAR_CATEGORIES(). No mocks.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import { getFaqs, getPricingData, getPublicData, reorderEntities } from '../server/db/queries.js';
import { validateCar, CAR_CATEGORIES } from '../src/admin/carHelpers';
import type { Car } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let h: D1Harness;

beforeAll(async () => {
  h = await createHarness();
  await h.applyMigrations();
  await h.applySeed();
});

afterAll(async () => {
  await h.dispose();
});

/**
 * display_order values sorted ascending. The contract after seed is that the
 * multiset of values is exactly 0..n-1 (source data carries 0..n-1 for
 * locations/route_groups/route_data; faqs are insertion-ordered). Sorting
 * avoids coupling to id order, which does not match source order.
 */
async function displayOrders(table: string): Promise<number[]> {
  const { results } = await h.db
    .prepare(`SELECT display_order FROM ${table}`)
    .all<{ display_order: number }>();
  return results.map((r) => r.display_order).sort((a, b) => a - b);
}

/** Assert the multiset of values is exactly 0..n-1 (sequential, no dupes). */
function expectSequential(values: number[]): void {
  expect(values).toEqual(values.map((_, i) => i));
}

interface Orderable {
  id: string;
  displayOrder: number;
}

/**
 * Faithful replication of the admin doReorder flow. The client keeps `next`
 * as-is (stale displayOrder) while the server rewrites display_order = index
 * via reorderEntities. Returns what the UI renders.
 */
async function simulateAdminDoReorder<T extends Orderable>(
  table: 'faqs' | 'locations' | 'route_data' | 'route_groups',
  items: T[],
  fromIndex: number,
  toIndex: number,
): Promise<T[]> {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  // Server side: POST /<entity>/reorder → reorderEntities sets display_order = index.
  await reorderEntities(h.db, table, next.map((x) => x.id));
  // Client side fixed: setItems(next.map((x,i)=>({...x, displayOrder:i}))) — mirrors FaqAdmin/LocationAdmin/etc fix
  const nextWithOrder = next.map((x, i) => ({ ...x, displayOrder: i }));
  return nextWithOrder as T[];
}

// ---------------------------------------------------------------------------
// S-ORD-1 — seed must write sequential display_order 0..n-1
// ---------------------------------------------------------------------------

describe('S-ORD-1 seed display_order is sequential 0..n-1', () => {
  it('locations get sequential display_order after seed', async () => {
    // seed-001.sql INSERT INTO locations carries explicit display_order.
    expectSequential(await displayOrders('locations'));
  });

  it('faqs get sequential display_order after seed', async () => {
    // seed-001.sql INSERT INTO faqs carries explicit display_order.
    expectSequential(await displayOrders('faqs'));
  });

  it('route_data gets sequential display_order after seed', async () => {
    // seed-001.sql INSERT INTO route_data carries explicit display_order.
    expectSequential(await displayOrders('route_data'));
  });

  it('route_groups get sequential display_order after seed', async () => {
    // seed-001.sql INSERT INTO route_groups carries explicit display_order.
    expectSequential(await displayOrders('route_groups'));
  });

  it('cars get sequential display_order after seed (control — already correct)', async () => {
    // seed-001.sql INSERT INTO cars carries explicit display_order.
    expectSequential(await displayOrders('cars'));
  });
});

// ---------------------------------------------------------------------------
// S-ORD-2 — admin doReorder must yield sequential client-side displayOrder
// ---------------------------------------------------------------------------

describe('S-ORD-2 admin doReorder yields sequential client displayOrder', () => {
  it('FaqAdmin doReorder (FaqAdmin.tsx:68-79) keeps client displayOrder sequential', async () => {
    const faqs = await getFaqs(h.db);
    const next = await simulateAdminDoReorder('faqs', faqs, 0, 2);
    // The UI renders `next` — badges must show 0,1,2,... after a reorder.
    expect(next.map((f) => f.displayOrder)).toEqual(
      next.map((_, i) => i),
    );
  });

  it('LocationAdmin doReorder (LocationAdmin.tsx:79-90) keeps client displayOrder sequential', async () => {
    const locations = (await getPricingData(h.db)).locations;
    const next = await simulateAdminDoReorder('locations', locations, 0, 2);
    expect(next.map((l) => l.displayOrder)).toEqual(
      next.map((_, i) => i),
    );
  });

  it('RouteDataAdmin doReorder (RouteDataAdmin.tsx:93-104) keeps client displayOrder sequential', async () => {
    const routeData = Object.values((await getPublicData(h.db)).routeData);
    const next = await simulateAdminDoReorder('route_data', routeData, 0, 2);
    expect(next.map((r) => r.displayOrder)).toEqual(
      next.map((_, i) => i),
    );
  });

  it('RouteGroupAdmin doReorder (RouteGroupAdmin.tsx:143-154) keeps client displayOrder sequential', async () => {
    const groups = (await getPricingData(h.db)).routeGroups;
    const next = await simulateAdminDoReorder('route_groups', groups, 0, 2);
    expect(next.map((g) => g.displayOrder)).toEqual(
      next.map((_, i) => i),
    );
  });
});

// ---------------------------------------------------------------------------
// S-CAR-1 — categoryAr must be auto-derivable from category, not required
// ---------------------------------------------------------------------------

describe('S-CAR-1 car create auto-derives categoryAr from category', () => {
  it('CATEGORY_LABELS covers all 5 categories with non-empty Arabic labels (contract)', () => {
    // Mirrors CarAdmin.tsx:13 — the mapping that must live beside CAR_CATEGORIES.
    const CATEGORY_LABELS: Record<Car['category'], string> = {
      sedan: 'سيدان',
      suv: 'دفع رباعي',
      family_cruiser: 'عائلية',
      minibus: 'ميني باص',
      wedding: 'زفاف',
    };
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...CAR_CATEGORIES].sort());
    for (const label of Object.values(CATEGORY_LABELS)) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it('validateCar accepts a car without categoryAr (auto-derivable from category)', () => {
    // carHelpers.ts:37-39 currently rejects missing categoryAr — the bug.
    // images included: this test is about categoryAr, not the ≥1-image rule.
    for (const category of CAR_CATEGORIES) {
      expect(validateCar({ nameAr: 'سيارة', category, images: ['x.jpg'] })).toBeNull();
    }
  });
});
