// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars } from '@/data/api';
import { CarAdmin } from './CarAdmin';

vi.mock('@/data/api', () => ({
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminDeleteCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: { current: null }, capture: vi.fn() })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

const sedanCars: Car[] = [
  {
    id: 'car-zero-images',
    nameAr: 'بدون صور',
    category: 'sedan',
    categoryAr: 'سيدان',
    description: '',
    images: [],
    features: [],
    displayOrder: 0,
  },
  {
    id: 'car-one-image',
    nameAr: 'صورة واحدة',
    category: 'sedan',
    categoryAr: 'سيدان',
    description: '',
    images: ['https://cdn.example.com/single.jpg'],
    features: [],
    displayOrder: 1,
  },
];

describe('CarImageRows edge cases — S3 expansion', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockReset().mockResolvedValue(sedanCars);
  });

  it('car with 0 images → exactly ONE placeholder row, no <img>, shows لا صورة', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    screen.getByTestId('category-card-sedan').click();
    await screen.findByTestId('category-drilldown-sedan');

    const drill = screen.getByTestId('category-drilldown-sedan');
    const row0 = within(drill).getByTestId('car-imagerow-car-zero-images-0');
    expect(row0).toBeInTheDocument();

    // exactly ONE row — no row-1 exists
    expect(within(drill).queryByTestId('car-imagerow-car-zero-images-1')).toBeNull();

    // no <img> inside the placeholder row
    expect(row0.querySelector('img')).toBeNull();

    // Arabic placeholder text visible
    expect(row0.textContent).toContain('لا صورة');
  });

  it('car with 1 image → exactly ONE image row with one <img>', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    screen.getByTestId('category-card-sedan').click();
    await screen.findByTestId('category-drilldown-sedan');

    const drill = screen.getByTestId('category-drilldown-sedan');
    const row0 = within(drill).getByTestId('car-imagerow-car-one-image-0');
    expect(row0).toBeInTheDocument();

    // exactly ONE row — no row-1 exists
    expect(within(drill).queryByTestId('car-imagerow-car-one-image-1')).toBeNull();

    // exactly one <img> inside the image row
    const imgs = row0.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('src')).toBe('https://cdn.example.com/single.jpg');
  });

  it('placeholder row move arrows stay disabled — nothing to move', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    screen.getByTestId('category-card-sedan').click();
    await screen.findByTestId('category-drilldown-sedan');

    const drill = screen.getByTestId('category-drilldown-sedan');
    expect(
      (within(drill).getByTestId('car-imagerow-up-car-zero-images-0') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (within(drill).getByTestId('car-imagerow-down-car-zero-images-0') as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
