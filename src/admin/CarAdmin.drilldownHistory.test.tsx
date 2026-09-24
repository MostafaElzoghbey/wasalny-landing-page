// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars } from '@/data/api';
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
  { id: 'car-sedan-1', nameAr: 'سيدان ١', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 0 },
  { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 0 },
];

async function enterSuvDrilldown(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-card-suv');
  fireEvent.click(screen.getByTestId('category-card-suv'));
  await screen.findByTestId('category-drilldown-suv');
}

describe('CarAdmin drilldown history', () => {
  beforeEach(() => {
    window.history.replaceState(null, '');
    vi.mocked(adminGetCars).mockResolvedValue(fleetCars);
    mockCapture.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('entering a category pushes a history marker holding that category', async () => {
    await enterSuvDrilldown();
    expect(window.history.state).toMatchObject({ namespace: 'car-drilldown', category: 'suv' });
  });

  it('popstate with no marker returns to the category grid', async () => {
    await enterSuvDrilldown();
    window.history.replaceState(null, '');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });
    expect(screen.getByTestId('category-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('category-drilldown-suv')).toBeNull();
  });

  it('popstate carrying the marker re-enters that drilldown', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-grid');
    window.history.replaceState({ namespace: 'car-drilldown', category: 'suv' }, '');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { namespace: 'car-drilldown', category: 'suv' } }));
    });
    expect(await screen.findByTestId('category-drilldown-suv')).toBeInTheDocument();
    expect(screen.queryByTestId('category-grid')).toBeNull();
  });

  it('back button renders the grid immediately and consumes the pushed entry', async () => {
    await enterSuvDrilldown();
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    fireEvent.click(screen.getByTestId('category-back'));
    expect(screen.getByTestId('category-grid')).toBeInTheDocument();
    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
