import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('prepends the given prefix followed by a dash', () => {
    const id = generateId('car');
    expect(id.startsWith('car-')).toBe(true);
  });

  it('produces an id of length prefix + 1 + 12 hex chars', () => {
    const id = generateId('loc');
    // 'loc' (3) + '-' (1) + 12 hex chars = 16
    expect(id).toHaveLength(16);
    const suffix = id.slice('loc-'.length);
    expect(suffix).toMatch(/^[0-9a-f]{12}$/);
  });

  it('generates 1000 unique ids for the same prefix', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId('car'));
    }
    expect(ids.size).toBe(1000);
  });
});
