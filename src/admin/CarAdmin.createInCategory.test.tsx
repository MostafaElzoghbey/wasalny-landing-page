// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { CarAdmin } from './CarAdmin';
import { addDropzoneImage } from '../../tests/helpers/addDropzoneImage';

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
  { id: 'car-sedan-2', nameAr: 'سيدان ٢', category: 'sedan', categoryAr: 'سيدان', description: '', images: [], features: [], displayOrder: 1 },
  { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 2 },
  { id: 'car-suv-2', nameAr: 'دفع ٢', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 3 },
];

const newSuvCar: Car = {
  id: 'car-suv-new',
  nameAr: 'دفع جديدة',
  category: 'suv',
  categoryAr: 'دفع رباعي',
  description: '',
  images: [],
  features: [],
  displayOrder: 4,
};

describe('CarAdmin create in-category contract', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockReset().mockResolvedValue(fleetCars);
    vi.mocked(adminCreateCar).mockReset().mockResolvedValue(newSuvCar as unknown as Car);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  async function fillNameAndImage(form: HTMLElement, name: string): Promise<void> {
    const input = form.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: name } });
    await addDropzoneImage(form, 'car-images-create');
  }

  it('create in suv: displayOrder = category max+1, new card in drilldown, selectedCategory preserved, form reset', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-suv');
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');

    const drill = screen.getByTestId('category-drilldown-suv');
    const form = within(drill).getByTestId('fleet-create');
    await fillNameAndImage(form, 'دفع جديدة');

    const fleetWithNew = [...fleetCars, newSuvCar];
    vi.mocked(adminGetCars).mockResolvedValueOnce(fleetWithNew);
    vi.mocked(adminCreateCar).mockResolvedValueOnce(newSuvCar as unknown as Car);

    fireEvent.click(within(form).getByText('إنشاء سيارة'));
    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalled());

    // displayOrder: max(suv orders: 2,3) + 1 = 4
    const callArg = vi.mocked(adminCreateCar).mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(callArg['displayOrder']).toBe(4);

    // new car appears inside drilldown-suv as its own image row (0-image → placeholder row)
    await waitFor(() => {
      expect(within(screen.getByTestId('category-drilldown-suv')).queryByTestId('car-imagerow-car-suv-new-0')).not.toBeNull();
    });

    // no separate block (no category grid)
    expect(screen.queryByTestId('category-grid')).toBeNull();

    // selectedCategory preserved: still in suv drilldown
    expect(screen.getByTestId('category-drilldown-suv')).toBeInTheDocument();

    // form reset
    await waitFor(() => {
      const inputAfter = form.querySelector('input') as HTMLInputElement;
      expect(inputAfter.value).toBe('');
    });
  });

  it('create in empty category (fleet has cars elsewhere): displayOrder = 0, not global max+1', async () => {
    // Fleet has only suv cars — sedan is empty
    const suvOnly: Car[] = [
      { id: 'car-suv-1', nameAr: 'دفع ١', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 0 },
      { id: 'car-suv-2', nameAr: 'دفع ٢', category: 'suv', categoryAr: 'دفع رباعي', description: '', images: [], features: [], displayOrder: 1 },
    ];
    vi.mocked(adminGetCars).mockResolvedValue(suvOnly);

    const newSedanFromEmpty: Car = {
      id: 'car-sedan-empty',
      nameAr: 'سيدان من فراغ',
      category: 'sedan',
      categoryAr: 'سيدان',
      description: '',
      images: [],
      features: [],
      displayOrder: 0,
    };

    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    await screen.findByTestId('category-drilldown-sedan');

    const drill = screen.getByTestId('category-drilldown-sedan');
    const form = within(drill).getByTestId('fleet-create');
    await fillNameAndImage(form, 'سيدان من فراغ');

    vi.mocked(adminGetCars).mockResolvedValueOnce([...suvOnly, newSedanFromEmpty]);
    vi.mocked(adminCreateCar).mockResolvedValueOnce(newSedanFromEmpty as unknown as Car);

    fireEvent.click(within(form).getByText('إنشاء سيارة'));
    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalled());

    // empty category → displayOrder = 0 (not global max+1)
    const callArg = vi.mocked(adminCreateCar).mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(callArg['displayOrder']).toBe(0);
  });

  it('displayOrder is always defined, never undefined', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-suv');
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');

    const drill = screen.getByTestId('category-drilldown-suv');
    const form = within(drill).getByTestId('fleet-create');
    await fillNameAndImage(form, 'دفع جديدة');

    vi.mocked(adminCreateCar).mockResolvedValueOnce(newSuvCar as unknown as Car);

    fireEvent.click(within(form).getByText('إنشاء سيارة'));
    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalled());

    const callArg = vi.mocked(adminCreateCar).mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(callArg['displayOrder']).toBeDefined();
    expect(typeof callArg['displayOrder']).toBe('number');
  });
});
