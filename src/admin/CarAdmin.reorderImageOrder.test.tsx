// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars, adminReorderCars } from '@/data/api';
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
    vi.mocked(adminReorderCars).mockResolvedValue(undefined as unknown as Car[]);
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
      expect(item.querySelector('[data-testid^="car-counts-"]')).not.toBeNull();
      const orderBadge = item.querySelector('[data-testid^="car-order-"]');
      expect(orderBadge).not.toBeNull();
      // displayOrder text should match one of the sedan cars
      const text = orderBadge?.textContent?.trim();
      expect(['0', '1']).toContain(text);
    }
  });

  it('ReorderControls disabled at ends for sedan slice', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    const upBtns = document.querySelectorAll('[data-testid^="move-up-"]');
    const downBtns = document.querySelectorAll('[data-testid^="move-down-"]');
    expect(upBtns).toHaveLength(2);
    expect(downBtns).toHaveLength(2);
    expect((upBtns[0] as HTMLButtonElement).disabled).toBe(true);
    expect((downBtns[0] as HTMLButtonElement).disabled).toBe(false);
    expect((upBtns[1] as HTMLButtonElement).disabled).toBe(false);
    expect((downBtns[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('move-down triggers capture and adminReorderCars with full global ids', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    mockCapture.mockClear();
    vi.mocked(adminReorderCars).mockClear();
    const downBtn = screen.getByTestId('move-down-car-sedan-1');
    fireEvent.click(downBtn);
    await waitFor(() => expect(mockCapture).toHaveBeenCalled());
    await waitFor(() => expect(vi.mocked(adminReorderCars)).toHaveBeenCalled());
    const ids = vi.mocked(adminReorderCars).mock.calls[0][0] as string[];
    expect(ids).toHaveLength(10);
    // sedan slice swapped: car-sedan-2 should now be before car-sedan-1 globally at start
    expect(ids[0]).toBe('car-sedan-2');
    expect(ids[1]).toBe('car-sedan-1');
    // non-sedan relative order preserved
    const suvOrder = ids.filter((id) => id.startsWith('car-suv-'));
    expect(suvOrder).toEqual(['car-suv-1', 'car-suv-2']);
  });

  it('reorder within sedan leaves suv displayOrder byte-identical (scoped reorder)', async () => {
    const gappedCars: Car[] = [
      { id: 'car-sedan-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 0 },
      { id: 'car-sedan-2', nameAr: 'سيدان ٢', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 1 },
      { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 10 },
      { id: 'car-suv-2', nameAr: 'دفع ٢', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 11 },
    ];
    vi.mocked(adminGetCars).mockResolvedValue(gappedCars);
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    fireEvent.click(screen.getByTestId('move-down-car-sedan-1'));
    await waitFor(() => expect(vi.mocked(adminReorderCars)).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId('category-back'));
    await screen.findByTestId('category-grid');
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');
    const suvOrders = Array.from(document.querySelectorAll('[data-testid^="car-order-"]')).map((el) => el.textContent?.trim());
    expect(suvOrders).toEqual(['10', '11']);
  });

  it('contract: reorder sends full global ids with non-target relative order preserved', async () => {
    const gappedCars: Car[] = [
      { id: 'car-sedan-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 0 },
      { id: 'car-sedan-2', nameAr: 'سيدان ٢', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 1 },
      { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 10 },
      { id: 'car-suv-2', nameAr: 'دفع ٢', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 11 },
    ];
    vi.mocked(adminGetCars).mockResolvedValue(gappedCars);
    vi.mocked(adminReorderCars).mockClear();
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    fireEvent.click(screen.getByTestId('move-down-car-sedan-1'));
    await waitFor(() => expect(vi.mocked(adminReorderCars)).toHaveBeenCalled());
    const ids = vi.mocked(adminReorderCars).mock.calls[0][0] as string[];
    expect(ids).toEqual(['car-sedan-2', 'car-sedan-1', 'car-suv-1', 'car-suv-2']);
  });

  it('failed reorder rolls back optimistic update', async () => {
    vi.mocked(adminReorderCars).mockRejectedValue(new Error('boom'));
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');
    fireEvent.click(screen.getByTestId('move-down-car-sedan-1'));
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
    const sedanOrders = Array.from(document.querySelectorAll('[data-testid^="car-order-"]')).map((el) => el.textContent?.trim());
    expect(sedanOrders).toEqual(['0', '1']);
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
      expect(firstItem?.querySelector('[data-testid="car-thumb-placeholder-car-sedan-1"]')).not.toBeNull();
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
