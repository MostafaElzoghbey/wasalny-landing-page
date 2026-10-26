// tests/pricingCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from '../src/utils/pricingCalculator';

describe('formatPrice', () => {
  it('Given 150, When formatPrice(150), Then returns "150 جنيه" without any config param', () => {
    // formatPrice should accept only a number and return a static currency string.
    // This test will FAIL on current code because formatPrice requires a pricingConfig param.
    expect(formatPrice(150)).toBe('150 جنيه');
  });

  it('Given 1800, When formatPrice(1800), Then returns "1800 جنيه"', () => {
    expect(formatPrice(1800)).toBe('1800 جنيه');
  });

  it('Given 0, When formatPrice(0), Then returns "0 جنيه"', () => {
    expect(formatPrice(0)).toBe('0 جنيه');
  });

  it('Given 123.7, When formatPrice(123.7), Then rounds down to "124 جنيه"', () => {
    expect(formatPrice(123.7)).toBe('124 جنيه');
  });
});
