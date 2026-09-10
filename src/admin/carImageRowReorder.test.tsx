// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars, adminReorderCars, adminUpdateCar } from '@/data/api';
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

const parentA: Car = {
  id: 'car-re-a',
  nameAr: 'سيدان أ',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف أ',
  images: ['https://cdn.example.com/a0.jpg', 'https://cdn.example.com/a1.jpg'],
  imageAlts: ['أمامية أ', 'جانبية أ'],
  features: ['مكيف'],
  displayOrder: 0,
};

const parentB: Car = {
  id: 'car-re-b',
  nameAr: 'سيدان ب',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف ب',
  images: ['https://cdn.example.com/b0.jpg'],
  imageAlts: ['أمامية ب'],
  features: [],
  displayOrder: 1,
};

// Post-move state: a1 moved down from A index 1 into B index 0
const parentA_after: Car = {
  ...parentA,
  images: ['https://cdn.example.com/a0.jpg'],
  imageAlts: ['أمامية أ'],
};

const parentB_after: Car = {
  ...parentB,
  images: ['https://cdn.example.com/a1.jpg', 'https://cdn.example.com/b0.jpg'],
  imageAlts: ['جانبية أ', 'أمامية ب'],
};

async function drillIntoSedan(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-grid');
  screen.getByTestId('category-card-sedan').click();
  await screen.findByTestId('category-drilldown-sedan');
}

describe('carImageRowReorder – per-row image reorder', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue([parentA, parentB]);
  });

  it('within-parent up → exactly 1 PUT with reordered arrays, no parent reorder call', async () => {
    await drillIntoSedan();

    fireEvent.click(screen.getByTestId(`car-imagerow-up-${parentA.id}-1`));

    await waitFor(() => expect(vi.mocked(adminUpdateCar)).toHaveBeenCalledTimes(1));
    const [putId, payload] = vi.mocked(adminUpdateCar).mock.calls[0] as unknown as [string, Partial<Car>];
    expect(putId).toBe(parentA.id);
    expect(payload.images).toEqual(['https://cdn.example.com/a1.jpg', 'https://cdn.example.com/a0.jpg']);
    expect(payload.imageAlts).toEqual(['جانبية أ', 'أمامية أ']);
    expect(vi.mocked(adminReorderCars)).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByTestId(`car-imagerow-${parentA.id}-0`).textContent).toContain('جانبية أ'),
    );
  });

  it('cross-parent down into next parent → 2 PUTs source-spliced + target-inserted, no parent reorder call', async () => {
    await drillIntoSedan();

    // Fetches after the click observe the post-move server state (same pattern as carImageMove.test.tsx)
    vi.mocked(adminGetCars).mockResolvedValue([parentA_after, parentB_after]);
    fireEvent.click(screen.getByTestId(`car-imagerow-down-${parentA.id}-1`));

    await waitFor(() => expect(vi.mocked(adminUpdateCar)).toHaveBeenCalledTimes(2));
    const [srcId, srcPayload] = vi.mocked(adminUpdateCar).mock.calls[0] as unknown as [string, Partial<Car>];
    const [tgtId, tgtPayload] = vi.mocked(adminUpdateCar).mock.calls[1] as unknown as [string, Partial<Car>];
    expect(srcId).toBe(parentA.id);
    expect(srcPayload.images).toEqual(['https://cdn.example.com/a0.jpg']);
    expect(srcPayload.imageAlts).toEqual(['أمامية أ']);
    expect(tgtId).toBe(parentB.id);
    expect(tgtPayload.images).toEqual(['https://cdn.example.com/a1.jpg', 'https://cdn.example.com/b0.jpg']);
    expect(tgtPayload.imageAlts).toEqual(['جانبية أ', 'أمامية ب']);
    expect(vi.mocked(adminReorderCars)).not.toHaveBeenCalled();
  });

  it('boundary rows stay disabled and fire zero api calls', async () => {
    await drillIntoSedan();

    const firstUp = screen.getByTestId(`car-imagerow-up-${parentA.id}-0`) as HTMLButtonElement;
    const lastDown = screen.getByTestId(`car-imagerow-down-${parentB.id}-0`) as HTMLButtonElement;
    expect(firstUp.disabled).toBe(true);
    expect(lastDown.disabled).toBe(true);
    fireEvent.click(firstUp);
    fireEvent.click(lastDown);
    expect(vi.mocked(adminUpdateCar)).not.toHaveBeenCalled();
    expect(vi.mocked(adminReorderCars)).not.toHaveBeenCalled();
  });
});
