// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { CATEGORY_LABELS } from './carHelpers';
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

const fleetCars: Car[] = [
  { id: 'car-sedan-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 0 },
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

const categories: readonly Car['category'][] = ['sedan', 'suv', 'family_cruiser', 'minibus', 'wedding'];

async function renderFleet(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-card-sedan');
}

describe('CarAdmin fleet big-categories contract', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue(fleetCars);
    vi.mocked(adminCreateCar).mockResolvedValue({ id: 'car-new', nameAr: 'جديد', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 10 } as Car);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('grid shows 5 big cards with counts, flip ids and Arabic labels', async () => {
    await renderFleet();
    const cards = document.querySelectorAll('[data-testid^="category-card-"]');
    expect(cards, 'expected 5 category cards, got 0').toHaveLength(5);
    for (const cat of categories) {
      const card = screen.getByTestId(`category-card-${cat}`);
      expect(card).toBeInTheDocument();
      expect(card.getAttribute('data-flip-id')).toBe(`category-${cat}`);
      const countEl = screen.getByTestId(`category-count-${cat}`);
      expect(countEl.textContent).toBe('2');
      expect(card.textContent).toContain(CATEGORY_LABELS[cat]);
    }
  });

  it('grid uses Tailwind auto-fit and dir rtl', async () => {
    await renderFleet();
    const grid = screen.getByTestId('category-grid');
    expect(grid).toBeInTheDocument();
    expect(grid.getAttribute('dir')).toBe('rtl');
    expect(grid.className).toContain('grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]');
  });

  it('click category-card-suv drills down with filtered list and reorder controls', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await waitFor(() => expect(screen.getByTestId('category-drilldown-suv')).toBeInTheDocument());
    expect(screen.getByTestId('category-back')).toBeInTheDocument();
    expect(screen.queryByTestId('category-grid')).toBeNull();
    const items = document.querySelectorAll('[data-reorder-item]');
    expect(items).toHaveLength(2);
    for (const item of Array.from(items) as HTMLElement[]) {
      const hasThumb = item.querySelector('[data-testid^="car-thumb"]') !== null;
      const hasPlaceholder = item.querySelector('[data-testid^="car-thumb-placeholder"]') !== null;
      expect(hasThumb || hasPlaceholder).toBe(true);
      expect(item.querySelector('[data-testid^="car-order-"]')).not.toBeNull();
    }
    expect(document.querySelectorAll('[data-testid^="move-up-"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-testid^="move-down-"]')).toHaveLength(2);
  });

  it('click back returns to grid with 5 cards', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');
    fireEvent.click(screen.getByTestId('category-back'));
    await waitFor(() => expect(screen.getByTestId('category-grid')).toBeInTheDocument());
    expect(document.querySelectorAll('[data-testid^="category-card-"]')).toHaveLength(5);
  });

  it('drill-down create is locked to selected category with pill and no free select', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');
    const createForm = screen.getByTestId('fleet-create');
    expect(createForm).toBeInTheDocument();
    expect(createForm.textContent).toContain(CATEGORY_LABELS['suv']);
    expect(createForm.textContent).toContain('دفع رباعي');
    const select = createForm.querySelector('select');
    if (select) {
      expect(select.hasAttribute('disabled') || select.hidden || select.style.display === 'none').toBe(true);
    } else {
      expect(createForm.querySelector('select')).toBeNull();
    }
    const nameInput = createForm.querySelector('input') as HTMLInputElement | null;
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: 'سيارة جديدة' } });
    }
    const submitBtn = createForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (submitBtn) fireEvent.click(submitBtn);
    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalled());
    const callArg = vi.mocked(adminCreateCar).mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(callArg['category']).toBe('suv');
    expect(callArg['categoryAr']).toBe(CATEGORY_LABELS['suv']);
    expect(String(callArg['id'])).toMatch(/^car-[a-f0-9]{12}$/);
    expect(callArg['category']).not.toBe('rocket');
  });

  it('per-category useReorderAnimation uses filtered ids not global 10 ids', async () => {
    await renderFleet();
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');
    await waitFor(() => {
      const calls = vi.mocked(useReorderAnimation).mock.calls.map((c) => c[0] as string);
      expect(calls.length).toBeGreaterThan(0);
    });
    const calls = vi.mocked(useReorderAnimation).mock.calls.map((c) => c[0] as string);
    const expectedFiltered = 'car-suv-1,car-suv-2';
    const globalIds = fleetCars.map((c) => c.id).join(',');
    expect(calls, `expected useReorderAnimation called with filtered ids ${expectedFiltered}`).toContain(expectedFiltered);
    expect(calls, `expected not called with global 10 ids`).not.toContain(globalIds);
  });
});
