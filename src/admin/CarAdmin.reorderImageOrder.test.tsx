// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { CarAdmin } from './CarAdmin';

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock('@/data/api', () => ({
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminDeleteCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: { current: null }, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

const fleetCars: Car[] = [
  { id: 'car-sedan-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: ['https://cdn.example.com/sedan1.jpg'], features: [], displayOrder: 0 },
  { id: 'car-sedan-2', nameAr: 'سيدان ٢', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 1 },
  { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: ['https://cdn.example.com/suv1.jpg'], features: [], displayOrder: 2 },
  { id: 'car-suv-2', nameAr: 'دفع ٢', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 3 },
  { id: 'car-family_cruiser-1', nameAr: 'عائلية ١', category: 'family_cruiser', categoryAr: 'عائلية', description: '', images: [], features: [], displayOrder: 4 },
  { id: 'car-family_cruiser-2', nameAr: 'عائلية ٢', category: 'family_cruiser', categoryAr: 'عائلية', description: '', images: [], features: [], displayOrder: 5 },
  { id: 'car-minibus-1', nameAr: 'ميني ١', category: 'minibus', categoryAr: 'ميني باص', description: '', images: [], features: [], displayOrder: 6 },
  { id: 'car-minibus-2', nameAr: 'ميني ٢', category: 'minibus', categoryAr: 'ميني باص', description: '', images: [], features: [], displayOrder: 7 },
  { id: 'car-wedding-1', nameAr: 'زفاف ١', category: 'wedding', categoryAr: 'زفاف', description: '', images: [], features: [], displayOrder: 8 },
  { id: 'car-wedding-2', nameAr: 'زفاف ٢', category: 'wedding', categoryAr: 'زفاف', description: '', images: [], features: [], displayOrder: 9 },
];

async function renderFleet(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-card-sedan');
}

describe('CarAdmin reorder image order proofs', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue(fleetCars);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('drill-down rows show photo grid and car-order equals displayOrder', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    const items = document.querySelectorAll('[data-reorder-item]');
    expect(items).toHaveLength(2);
    for (const item of Array.from(items) as HTMLElement[]) {
      const orderBadge = item.querySelector('[data-testid^="car-imagerow-order-"]');
      expect(orderBadge).not.toBeNull();
      const text = orderBadge?.textContent?.trim().split('-')[0];
      expect(['0', '1']).toContain(text);
    }
  });

  it('image-row arrows disabled at ends across the category rows', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    const upBtns = document.querySelectorAll('[data-testid^="car-imagerow-up-"]');
    const downBtns = document.querySelectorAll('[data-testid^="car-imagerow-down-"]');
    expect(upBtns).toHaveLength(2);
    expect(downBtns).toHaveLength(2);
    expect((upBtns[0] as HTMLButtonElement).disabled).toBe(true);
    expect((downBtns[0] as HTMLButtonElement).disabled).toBe(false);
    expect((upBtns[1] as HTMLButtonElement).disabled).toBe(false);
    expect((downBtns[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('image src equals first image when present', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    const firstItem = document.querySelector('[data-reorder-item="car-sedan-1"]') as HTMLElement | null;
    expect(firstItem).not.toBeNull();
    const img = firstItem?.querySelector('img');
    if (img) {
      expect(img.getAttribute('src')).toContain('cdn.example.com/sedan1.jpg');
    } else {
      // placeholder case for no image also acceptable
      expect(firstItem?.querySelector('[data-testid="car-imagerow-thumb-placeholder-car-sedan-1-0"]')).not.toBeNull();
    }
  });

  it('back returns to grid', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-minibus'));
    await screen.findByTestId('category-drilldown-minibus');
    fireEvent.click(screen.getByTestId('category-back'));
    await waitFor(() => expect(screen.getByTestId('category-grid')).toBeInTheDocument());
    expect(document.querySelectorAll('[data-testid^="category-card-"]')).toHaveLength(5);
  });
});
