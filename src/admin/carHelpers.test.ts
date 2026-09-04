process.env.NODE_ENV = 'test';

import { describe, it, expect } from 'vitest';
import type { Car } from '@/types';
import { validateCar, cloneCar, CAR_CATEGORIES, CATEGORY_LABELS } from './carHelpers';

describe('carHelpers', () => {
  describe('validateCar', () => {
    it('returns null for a valid car without name or passengers fields', () => {
      const valid: Partial<Car> = {
        nameAr: 'سيدان',
        category: 'sedan',
        categoryAr: 'سيدان',
      };
      expect(validateCar(valid)).toBeNull();
    });

    it('returns error when nameAr is missing', () => {
      const car: Partial<Car> = {
        category: 'sedan',
        categoryAr: 'سيدان',
      };
      expect(validateCar(car)).toBe('الاسم (عربي) مطلوب');
    });

    it('returns error when nameAr is empty string', () => {
      const car: Partial<Car> = {
        nameAr: '  ',
        category: 'sedan',
        categoryAr: 'سيدان',
      };
      expect(validateCar(car)).toBe('الاسم (عربي) مطلوب');
    });

    it('does not require categoryAr — auto-derived from category', () => {
      const car: Partial<Car> = {
        nameAr: 'سيدان',
        category: 'sedan',
      };
      expect(validateCar(car)).toBeNull();
    });

    it('does not require categoryAr even when empty string', () => {
      const car: Partial<Car> = {
        nameAr: 'سيدان',
        category: 'sedan',
        categoryAr: '  ',
      };
      expect(validateCar(car)).toBeNull();
    });

    it('CATEGORY_LABELS maps all 5 categories exhaustively', () => {
      for (const cat of CAR_CATEGORIES) {
        expect(CATEGORY_LABELS[cat]).toBeTruthy();
        expect(typeof CATEGORY_LABELS[cat]).toBe('string');
      }
      expect(CATEGORY_LABELS['sedan']).toBe('سيدان');
      expect(CATEGORY_LABELS['suv']).toBe('دفع رباعي');
      expect(CATEGORY_LABELS['wedding']).toBe('زفاف');
    });

    it('returns error for invalid category', () => {
      const car: Partial<Car> = {
        nameAr: 'سيدان',
        category: 'rocket' as Car['category'],
        categoryAr: 'روكيت',
      };
      expect(validateCar(car)).toBe('فئة غير صالحة');
    });

    it('does not reference name or passengers in validation', () => {
      // A car with only nameAr + categoryAr + category should pass
      // even though name and passengers are absent.
      const car: Partial<Car> = {
        nameAr: 'فان',
        category: 'minibus',
        categoryAr: 'فان',
      };
      expect(validateCar(car)).toBeNull();
    });
  });

  describe('cloneCar', () => {
    it('produces a deep copy without name or passengers', () => {
      const original: Car = {
        id: 'car-1',
        nameAr: 'سيدان',
        category: 'sedan',
        categoryAr: 'سيدان',
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
});
