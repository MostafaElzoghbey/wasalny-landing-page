// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Car } from '@/types';
import { adminGetCars, adminReorderCars } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { CarAdmin } from './CarAdmin';

const { mockCapture, mockRef } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockRef: { current: null },
}));

vi.mock('@/data/api', () => ({
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminDeleteCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: mockRef, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

const cars: Car[] = [
  { id: 'car-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 0 },
  { id: 'car-2', nameAr: 'سيدان ٢', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 1 },
  { id: 'car-3', nameAr: 'دفع رباعي', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 2 },
];

async function renderAdmin(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('car-card-car-1');
}

describe.skip('CarAdmin flatness contract (retired — flat → big-category drill-down)', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue(cars);
    vi.mocked(adminReorderCars).mockResolvedValue(undefined);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('renders a single flat ul holding all cars as data-reorder-item', async () => {
    await renderAdmin();
    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(document.querySelectorAll('[data-reorder-item]')).toHaveLength(cars.length);
  });

  it('renders no CarCategoryGroup header toggle buttons', async () => {
    await renderAdmin();
    expect(document.querySelectorAll('[data-testid^="car-category-"]')).toHaveLength(0);
  });

  it('applies flat transitionDelay of idx*15ms per reorder item', async () => {
    await renderAdmin();
    const items = Array.from(document.querySelectorAll('[data-reorder-item]')) as HTMLElement[];
    expect(items).toHaveLength(cars.length);
    expect(items[1]).toHaveStyle('transition-delay: 15ms');
  });

  it('renders no per-category group sections (only the Panel section)', async () => {
    await renderAdmin();
    expect(document.querySelectorAll('section')).toHaveLength(1);
  });

  it('calls useReorderAnimation once with the full flat id list', async () => {
    await renderAdmin();
    expect(vi.mocked(useReorderAnimation)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(useReorderAnimation)).toHaveBeenCalledWith('car-1,car-2,car-3');
  });

  it('calls capture() before a move', async () => {
    await renderAdmin();
    fireEvent.click(screen.getByTestId('move-down-car-1'));
    expect(mockCapture).toHaveBeenCalled();
  });

  it('keeps CAR_CATEGORIES out of grouping containers in CarAdmin source', () => {
    const source = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(source).not.toMatch(/CarCategoryGroup/);
    expect(source).not.toMatch(/expandedCategories/);
    expect(source).not.toMatch(/cars\.filter\(\(c\) => c\.category === cat\)/);
  });
});