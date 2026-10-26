import { describe, it, expect } from 'vitest';
import { filterArabicName, validateArabicName } from './arabicName';

describe('arabicName', () => {
  describe('filterArabicName', () => {
    it('returns Arabic text unchanged', () => {
      expect(filterArabicName('دمياط الجديدة')).toBe('دمياط الجديدة');
    });

    it('keeps only the Arabic part of mixed Arabic and Latin input', () => {
      expect(filterArabicName('القاهرةCairo')).toBe('القاهرة');
    });

    it('removes ASCII digits', () => {
      expect(filterArabicName('مطار 123')).toBe('مطار ');
    });

    it('removes Arabic-Indic digits', () => {
      expect(filterArabicName('مطار ١٢٣')).toBe('مطار ');
      expect(filterArabicName('مطار ۰۱۲')).toBe('مطار ');
    });

    it('removes Latin punctuation and emoji', () => {
      expect(filterArabicName('القاهرة.؟! (test) 😀-؛')).toBe('القاهرة  ');
    });

    it('preserves spaces and the Arabic comma', () => {
      expect(filterArabicName('القاهرة، مصر')).toBe('القاهرة، مصر');
    });

    it('preserves tashkeel and tatweel', () => {
      expect(filterArabicName('مُحَمَّد ـ')).toBe('مُحَمَّد ـ');
    });

    it('removes newlines, tabs, and non-breaking spaces', () => {
      expect(filterArabicName('دمياط\nالجديدة\tأ\u00A0ب')).toBe('دمياطالجديدةأب');
    });

    it('does not collapse or trim whitespace', () => {
      expect(filterArabicName('  دمياط  ')).toBe('  دمياط  ');
    });
  });

  describe('validateArabicName', () => {
    it('returns required error for empty string', () => {
      expect(validateArabicName('')).toBe('الاسم مطلوب');
    });

    it('returns required error for whitespace only', () => {
      expect(validateArabicName('   ')).toBe('الاسم مطلوب');
    });

    it('returns Arabic-only error for Latin input', () => {
      expect(validateArabicName('Cairo')).toBe('الاسم يجب أن يكون باللغة العربية فقط');
    });

    it('returns Arabic-only error when the name contains a digit', () => {
      expect(validateArabicName('مطار 1')).toBe('الاسم يجب أن يكون باللغة العربية فقط');
    });

    it('returns Arabic-only error when the name contains Latin punctuation', () => {
      expect(validateArabicName('القاهرة.')).toBe('الاسم يجب أن يكون باللغة العربية فقط');
    });

    it('returns Arabic-only error for a value of only disallowed characters', () => {
      expect(validateArabicName('123')).toBe('الاسم يجب أن يكون باللغة العربية فقط');
    });

    it('returns null for a valid two-word name', () => {
      expect(validateArabicName('دمياط الجديدة')).toBeNull();
    });

    it('returns null for a name with hamza', () => {
      expect(validateArabicName('رأس البر')).toBeNull();
    });

    it('returns null for a name with tashkeel and tatweel', () => {
      expect(validateArabicName('مُحَمَّد ـ')).toBeNull();
    });
  });
});
