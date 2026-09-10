// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { Car } from '@/types';
import { adminDeleteCar, adminGetCars, adminUpdateCar } from '@/data/api';
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

const threeImageCar: Car = {
  id: 'car-del-row-1',
  nameAr: 'سيدان للحذف',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف ثابت',
  images: ['https://cdn.example.com/d0.jpg', 'https://cdn.example.com/d1.jpg', 'https://cdn.example.com/d2.jpg'],
  imageAlts: ['بديل صفر', 'بديل واحد', 'بديل اثنين'],
  features: ['مكيف', 'واي فاي'],
  displayOrder: 2,
};

const singleImageCar: Car = {
  id: 'car-del-single-1',
  nameAr: 'وحيدة الصورة',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف وحيد',
  images: ['https://cdn.example.com/only.jpg'],
  imageAlts: ['البديل الوحيد'],
  features: [],
  displayOrder: 3,
};

async function drillIntoSedan(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-grid');
  screen.getByTestId('category-card-sedan').click();
  await screen.findByTestId('category-drilldown-sedan');
}

describe('carImageRowDelete – per-row two-step delete', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue([threeImageCar, singleImageCar]);
  });

  it('multi-image row delete → exactly 1 PUT with index spliced, shared fields unchanged, row gone', async () => {
    await drillIntoSedan();

    const row = screen.getByTestId(`car-imagerow-${threeImageCar.id}-1`);
    fireEvent.click(within(row).getByTestId(`car-imagerow-delete-${threeImageCar.id}-1`));
    fireEvent.click(within(row).getByTestId(`car-imagerow-delete-confirm-${threeImageCar.id}-1`));

    await waitFor(() => expect(vi.mocked(adminUpdateCar)).toHaveBeenCalledTimes(1));
    const [putId, payload] = vi.mocked(adminUpdateCar).mock.calls[0] as unknown as [string, Partial<Car>];
    expect(putId).toBe(threeImageCar.id);
    expect(payload.images).toEqual(['https://cdn.example.com/d0.jpg', 'https://cdn.example.com/d2.jpg']);
    expect(payload.imageAlts).toEqual(['بديل صفر', 'بديل اثنين']);
    expect(payload.nameAr).toBe(threeImageCar.nameAr);
    expect(payload.description).toBe(threeImageCar.description);
    expect(payload.features).toEqual(threeImageCar.features);
    expect(vi.mocked(adminDeleteCar)).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByTestId(`car-imagerow-${threeImageCar.id}-1`).textContent).toContain('بديل اثنين'),
    );
    expect(screen.getByTestId(`car-imagerow-${threeImageCar.id}-0`)).toBeInTheDocument();
    // rows re-index after splice: only 2 rows left for this car
    expect(screen.queryByTestId(`car-imagerow-${threeImageCar.id}-2`)).toBeNull();
  });

  it('last-image row delete → BLOCKED with visible Arabic message, zero api calls, car row survives', async () => {
    await drillIntoSedan();

    const row = screen.getByTestId(`car-imagerow-${singleImageCar.id}-0`);
    fireEvent.click(within(row).getByTestId(`car-imagerow-delete-${singleImageCar.id}-0`));
    fireEvent.click(within(row).getByTestId(`car-imagerow-delete-confirm-${singleImageCar.id}-0`));

    await waitFor(() =>
      expect(
        within(row).getByTestId(`car-imagerow-delete-blocked-${singleImageCar.id}-0`),
      ).toBeInTheDocument(),
    );
    expect(vi.mocked(adminUpdateCar)).not.toHaveBeenCalled();
    expect(vi.mocked(adminDeleteCar)).not.toHaveBeenCalled();
    // car itself untouched: row + parent card still present
    expect(screen.getByTestId(`car-imagerow-${singleImageCar.id}-0`)).toBeInTheDocument();
    expect(screen.getByTestId(`car-row-${singleImageCar.id}`)).toBeInTheDocument();
  });

  it('full-car DELETE stays on the parent CarCard control and calls adminDeleteCar', async () => {
    vi.mocked(adminDeleteCar).mockResolvedValue(undefined as unknown as Car);
    await drillIntoSedan();

    fireEvent.click(screen.getByTestId(`car-delete-${singleImageCar.id}`));
    fireEvent.click(screen.getByTestId(`car-delete-confirm-${singleImageCar.id}`));

    await waitFor(() => expect(vi.mocked(adminDeleteCar)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(adminDeleteCar)).toHaveBeenCalledWith(singleImageCar.id);
    expect(vi.mocked(adminUpdateCar)).not.toHaveBeenCalled();
  });
});
