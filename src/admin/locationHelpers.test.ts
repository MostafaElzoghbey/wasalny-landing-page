import { describe, it, expect } from 'vitest';
import type { Location } from '@/types/pricing';
import { validateLocation } from './locationHelpers';

describe('locationHelpers', () => {
  describe('validateLocation', () => {
    it('returns null for a fully Arabic location', () => {
      const loc: Location = {
        id: 'loc-1',
        name: 'دمياط الجديدة',
        nameAr: 'دمياط الجديدة',
        type: 'travel',
        displayOrder: 0,
      };
      expect(validateLocation(loc)).toBeNull();
    });

    it('returns required error when name is empty', () => {
      const loc: Location = {
        id: 'loc-1',
        name: '',
        nameAr: '',
        type: 'travel',
        displayOrder: 0,
      };
      expect(validateLocation(loc)).toBe('الاسم مطلوب');
    });

    it('returns Arabic-only error when name is Latin', () => {
      const loc: Location = {
        id: 'loc-1',
        name: 'Cairo',
        nameAr: 'Cairo',
        type: 'travel',
        displayOrder: 0,
      };
      expect(validateLocation(loc)).toBe('الاسم يجب أن يكون باللغة العربية فقط');
    });

    it('returns Arabic-only error when Arabic name contains a digit', () => {
      const loc: Location = {
        id: 'loc-1',
        name: 'مطار 1',
        nameAr: 'مطار 1',
        type: 'travel',
        displayOrder: 0,
      };
      expect(validateLocation(loc)).toBe('الاسم يجب أن يكون باللغة العربية فقط');
    });

    it('returns type error for an Arabic name with invalid type', () => {
      const loc: Location = {
        id: 'loc-1',
        name: 'دمياط الجديدة',
        nameAr: 'دمياط الجديدة',
        type: 'other' as Location['type'],
        displayOrder: 0,
      };
      expect(validateLocation(loc)).toBe('نوع غير صالح');
    });

    it('returns null for a valid Arabic name with valid type', () => {
      const loc: Location = {
        id: 'loc-2',
        name: 'رأس البر',
        nameAr: 'رأس البر',
        type: 'internal',
        displayOrder: 1,
      };
      expect(validateLocation(loc)).toBeNull();
    });
  });
});
