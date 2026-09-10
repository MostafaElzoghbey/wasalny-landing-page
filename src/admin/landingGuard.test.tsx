/**
 * S4 Regression Guard — admin car drilldown must never import landing car-rendering modules.
 *
 * This is a PASS-guard (not a RED test). It statically reads source files via readFileSync
 * and asserts they contain NO imports from the forbidden landing modules, ensuring the
 * admin drilldown never couples to landing rendering code.
 *
 * Forbids:
 *   - @/components/sections/FleetSection
 *   - @/components/pricing/VehiclePassengerCard
 *   - @/components/sections/PricingCalculator
 *   - @/components/sections/HeroSection
 *   - find-by-CATEGORY selector `.find(car => car.category ...)` (landing
 *     activeCar logic duplication — FleetSection.tsx `activeCar` useMemo).
 *     Find-by-ID lookups (`cars.find((c) => c.id === ...)`) are legitimate
 *     admin data access (carImageRows.ts moveImageAcrossParents, CarAdmin.tsx
 *     reorder) and are NOT banned.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(__dirname, '../..');

const FORBIDDEN_IMPORTS = [
  '@/components/sections/FleetSection',
  '@/components/pricing/VehiclePassengerCard',
  '@/components/sections/PricingCalculator',
  '@/components/sections/HeroSection',
];

/** Files that form the admin car drilldown and must never import landing modules. */
const ADMIN_SOURCE_FILES = [
  'src/admin/CarAdmin.tsx',
  'src/admin/CarCard.tsx',
  'src/admin/carImageRows.ts', // skip if absent
];

// ── helpers ────────────────────────────────────────────────────────────────
function readSrc(relativePath: string): string {
  const full = resolve(ROOT, relativePath);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf-8');
}

// ── tests ──────────────────────────────────────────────────────────────────
describe('S4 regression guard — admin drilldown must not import landing modules', () => {
  // ── baseline HTML existence ──────────────────────────────────────────────
  it('/tmp/baseline/fleet-before.html exists and byte size is recorded', () => {
    const baselinePath = '/tmp/baseline/fleet-before.html';
    expect(existsSync(baselinePath)).toBe(true);
    const size = readFileSync(baselinePath).length;
    console.log(`[landingGuard] baseline html byte size: ${size}`);
    expect(size).toBeGreaterThan(0);
  });

  // ── forbidden imports ────────────────────────────────────────────────────
  for (const filePath of ADMIN_SOURCE_FILES) {
    it(`${filePath} contains no forbidden landing imports`, () => {
      const content = readSrc(filePath);
      if (content === '') {
        // file does not exist (e.g. carImageRows.ts) — skip gracefully
        console.log(`[landingGuard] ${filePath} not found, skipping`);
        return;
      }

      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(content, `${filePath} must not import ${forbidden}`).not.toContain(forbidden);
      }
    });
  }

  // ── find-by-category duplication guard ────────────────────────────────────
  // Only guard CarCard.tsx and carImageRows.ts (rendering components) — CarAdmin.tsx
  // legitimately uses cars.find for its own reorder/data operations.
  // Banned pattern is the landing activeCar selector: `.find(car => car.category ...)`.
  // Find-by-ID (`cars.find((c) => c.id === ...)`) is allowed admin data access.
  const FIND_BY_CATEGORY_RE = /\.find\(\s*\(?\s*car\s*\)?\s*=>\s*car\.category\b/;
  const RENDER_FILES = ['src/admin/CarCard.tsx', 'src/admin/carImageRows.ts'];
  it('guard regex stays honest: matches the landing find-by-category shape, ignores find-by-id', () => {
    expect(FIND_BY_CATEGORY_RE.test('cars.find(car => car.category === activeCategory)')).toBe(true);
    expect(FIND_BY_CATEGORY_RE.test('return cars.find((car) => car.category === activeCategory) || cars[0];')).toBe(true);
    expect(FIND_BY_CATEGORY_RE.test('const source = cars.find((c) => c.id === sourceId);')).toBe(false);
    expect(FIND_BY_CATEGORY_RE.test('const target = cars.find((c) => c.id === targetId);')).toBe(false);
  });
  for (const filePath of RENDER_FILES) {
    it(`${filePath} contains no find-by-category activeCar logic duplication`, () => {
      const content = readSrc(filePath);
      if (content === '') {
        console.log(`[landingGuard] ${filePath} not found, skipping`);
        return;
      }

      // landing activeCar selector pattern — admin rendering must not duplicate it
      expect(content, `${filePath} must not contain a find-by-category car selector`).not.toMatch(FIND_BY_CATEGORY_RE);
    });
  }
});
