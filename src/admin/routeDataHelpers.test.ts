import { describe, it, expect } from 'vitest';
import type { RouteData } from '@/types';
import { cloneRouteData, validateRouteData } from './routeDataHelpers';

const baseRoute: RouteData = {
  id: 'route-1',
  fromLabel: 'دمياط',
  toLabel: 'القاهرة',
  title: 'سفر من دمياط إلى القاهرة',
  description: 'سافر براحة وأمان من باب منزلك في دمياط إلى أي مكان في القاهرة.',
  metaTitle: '',
  metaDescription: '',
  heroImage: '',
  priceStart: '1500',
  distance: '290 كم',
  duration: '3 ساعات',
  features: [],
  faqs: [],
  displayOrder: 0,
};

describe('routeDataHelpers', () => {
  describe('validateRouteData', () => {
    it('returns null when title and both labels are non-empty', () => {
      expect(validateRouteData(baseRoute)).toBeNull();
    });

    it('returns title error when title is whitespace-only', () => {
      expect(validateRouteData({ ...baseRoute, title: '   ' })).toBe('العنوان مطلوب');
    });

    it('returns origin error when fromLabel is whitespace-only', () => {
      expect(validateRouteData({ ...baseRoute, fromLabel: '   ' })).toBe('مسار الانطلاق مطلوب');
    });

    it('returns destination error when toLabel is whitespace-only', () => {
      expect(validateRouteData({ ...baseRoute, toLabel: '   ' })).toBe('مسار الوصول مطلوب');
    });
  });

  describe('cloneRouteData', () => {
    it('copies fromLabel and toLabel', () => {
      const clone = cloneRouteData(baseRoute);
      expect(clone.fromLabel).toBe('دمياط');
      expect(clone.toLabel).toBe('القاهرة');
    });
  });
});