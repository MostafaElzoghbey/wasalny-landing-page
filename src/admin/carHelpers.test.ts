process.env.NODE_ENV = 'test';

import { describe, it, expect } from 'vitest';
import type { Car } from '@/types';
import { validateCar, cloneCar, syncAlts, CAR_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICON_MAP, CATEGORY_COLORS, getCategoryMeta, REQUIRE_CAR_IMAGE } from './carHelpers';

describe('carHelpers', () => {
  describe('validateCar', () => {
    it('returns null for a valid car without name or passengers fields', () => {
      const valid: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img.jpg'],
      };
      expect(validateCar(valid)).toBeNull();
    });

    it('returns error when nameAr is missing', () => {
      const car: Partial<Car> = {
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBe('\u0627\u0644\u0627\u0633\u0645 (\u0639\u0631\u0628\u064a) \u0645\u0637\u0644\u0648\u0628');
    });

    it('returns error when nameAr is empty string', () => {
      const car: Partial<Car> = {
        nameAr: '  ',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBe('\u0627\u0644\u0627\u0633\u0645 (\u0639\u0631\u0628\u064a) \u0645\u0637\u0644\u0648\u0628');
    });

    it('does not require categoryAr', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBeNull();
    });

    it('does not require categoryAr even when empty string', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: '  ',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBeNull();
    });

    it('CATEGORY_LABELS maps all 5 categories exhaustively', () => {
      for (const cat of CAR_CATEGORIES) {
        expect(CATEGORY_LABELS[cat]).toBeTruthy();
        expect(typeof CATEGORY_LABELS[cat]).toBe('string');
      }
      expect(CATEGORY_LABELS['sedan']).toBeTruthy();
      expect(CATEGORY_LABELS['suv']).toBeTruthy();
      expect(CATEGORY_LABELS['wedding']).toBeTruthy();
    });

    it('returns error for invalid category', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'rocket' as Car['category'],
        categoryAr: 'rocket',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBe('\u0641\u0626\u0629 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629');
    });

    it('does not reference name or passengers in validation', () => {
      const car: Partial<Car> = {
        nameAr: 'fan',
        category: 'minibus',
        categoryAr: 'fan',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBeNull();
    });

    // --- NEW: category required ---
    it('returns error when category is missing', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        categoryAr: 'sidan',
        images: ['img.jpg'],
      };
      expect(validateCar(car)).toBe('category required');
    });

    // --- NEW: images required ---
    it('returns error when images is missing', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
      };
      expect(validateCar(car)).toBe(REQUIRE_CAR_IMAGE);
    });

    // --- NEW: images empty array ---
    it('returns error when images is empty array', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: [],
      };
      expect(validateCar(car)).toBe(REQUIRE_CAR_IMAGE);
    });

    // --- NEW: images only whitespace ---
    it('returns error when images contains only empty strings', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['  ', ''],
      };
      expect(validateCar(car)).toBe(REQUIRE_CAR_IMAGE);
    });

    // --- NEW: images not an array ---
    it('returns error when images is not an array', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: 'img.jpg' as unknown as string[],
      };
      expect(validateCar(car)).toBe(REQUIRE_CAR_IMAGE);
    });

    // --- NEW: valid images accepted ---
    it('accepts valid images array', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img1.jpg', 'img2.jpg'],
      };
      expect(validateCar(car)).toBeNull();
    });

    // --- NEW: imageAlts length mismatch ---
    it('returns error when imageAlts length does not match images length', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img1.jpg', 'img2.jpg'],
        imageAlts: ['alt1'],
      };
      expect(validateCar(car)).toBe('imageAlts length must match images');
    });

    // --- NEW: imageAlts matches ---
    it('accepts when imageAlts matches images length', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img1.jpg', 'img2.jpg'],
        imageAlts: ['alt1', 'alt2'],
      };
      expect(validateCar(car)).toBeNull();
    });

    // --- NEW: imageAlts undefined is fine ---
    it('accepts when imageAlts is undefined', () => {
      const car: Partial<Car> = {
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        images: ['img1.jpg'],
      };
      expect(validateCar(car)).toBeNull();
    });

    // --- NEW: all valid categories accepted ---
    it('accepts all valid categories', () => {
      for (const cat of CAR_CATEGORIES) {
        const car: Partial<Car> = {
          nameAr: 'sidan',
          category: cat,
          categoryAr: 'sidan',
          images: ['img.jpg'],
        };
        expect(validateCar(car)).toBeNull();
      }
    });
  });

  describe('cloneCar', () => {
    it('produces a deep copy without name or passengers', () => {
      const original: Car = {
        id: 'car-1',
        nameAr: 'sidan',
        category: 'sedan',
        categoryAr: 'sidan',
        description: 'desc',
        images: ['img.jpg'],
        imageAlts: ['alt'],
        features: ['feat'],
        displayOrder: 1,
      };
      const cloned = cloneCar(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.images).not.toBe(original.images);
      expect(cloned.features).not.toBe(original.features);

      // Ensure name/passengers are not present
      expect(cloned).not.toHaveProperty('name');
      expect(cloned).not.toHaveProperty('passengers');
    });
  });

  describe('CAR_CATEGORIES', () => {
    it('contains all expected categories', () => {
      expect(CAR_CATEGORIES).toEqual([
        'sedan',
        'suv',
        'family_cruiser',
        'minibus',
        'wedding',
      ]);
    });
  });

  describe('CATEGORY_ICON_MAP', () => {
    it('maps all 5 categories to icon name strings', () => {
      for (const cat of CAR_CATEGORIES) {
        expect(typeof CATEGORY_ICON_MAP[cat]).toBe('string');
        expect(CATEGORY_ICON_MAP[cat].length).toBeGreaterThan(0);
      }
      expect(CATEGORY_ICON_MAP.sedan).toBe('Car');
      expect(CATEGORY_ICON_MAP.suv).toBe('Truck');
      expect(CATEGORY_ICON_MAP.family_cruiser).toBe('Bus');
      expect(CATEGORY_ICON_MAP.minibus).toBe('UsersRound');
      expect(CATEGORY_ICON_MAP.wedding).toBe('Heart');
    });
  });

  describe('CATEGORY_COLORS', () => {
    it('maps all 5 categories to objects with primary, accent, solid, ring', () => {
      for (const cat of CAR_CATEGORIES) {
        const c = CATEGORY_COLORS[cat];
        expect(typeof c.primary).toBe('string');
        expect(typeof c.accent).toBe('string');
        expect(typeof c.solid).toBe('string');
        expect(typeof c.ring).toBe('string');
      }
      expect(CATEGORY_COLORS.sedan.primary).toContain('blue');
      expect(CATEGORY_COLORS.suv.solid).toContain('emerald');
      expect(CATEGORY_COLORS.wedding.ring).toContain('rose');
    });
  });

  describe('getCategoryMeta', () => {
    it('returns label, icon, and colors for every category', () => {
      for (const cat of CAR_CATEGORIES) {
        const meta = getCategoryMeta(cat);
        expect(meta.label).toBe(CATEGORY_LABELS[cat]);
        expect(meta.icon).toBe(CATEGORY_ICON_MAP[cat]);
        expect(meta.colors).toEqual(CATEGORY_COLORS[cat]);
      }
    });

    it('returns correct values for sedan', () => {
      const meta = getCategoryMeta('sedan');
      expect(meta).toEqual({
        label: CATEGORY_LABELS.sedan,
        icon: 'Car',
        colors: CATEGORY_COLORS.sedan,
      });
    });
  });

  describe('REQUIRE_CAR_IMAGE', () => {
    it('is a non-empty string constant', () => {
      expect(typeof REQUIRE_CAR_IMAGE).toBe('string');
      expect(REQUIRE_CAR_IMAGE.length).toBeGreaterThan(0);
    });
  });

  describe('syncAlts', () => {
    it('returns empty array when images is empty', () => {
      expect(syncAlts([], ['a', 'b'])).toEqual([]);
    });

    it('pads short alts with empty strings to match images length', () => {
      expect(syncAlts(['a', 'b', 'c'], ['x'])).toEqual(['x', '', '']);
    });

    it('truncates long alts to match images length', () => {
      expect(syncAlts(['a', 'b'], ['x', 'y', 'z'])).toEqual(['x', 'y']);
    });

    it('returns same-length alts unchanged', () => {
      expect(syncAlts(['a', 'b'], ['x', 'y'])).toEqual(['x', 'y']);
    });

    it('returns all empty strings when alts is undefined', () => {
      expect(syncAlts(['a', 'b'])).toEqual(['', '']);
    });

    it('returns all empty strings when alts is empty array but images is not', () => {
      expect(syncAlts(['a', 'b'], [])).toEqual(['', '']);
    });

    it('always returns result.length === images.length', () => {
      const images = ['1', '2', '3', '4', '5'];
      const alts = ['only-one'];
      const result = syncAlts(images, alts);
      expect(result.length).toBe(images.length);
    });
  });
});
