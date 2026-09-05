// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars } from '@/data/api';
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

const newCar: Car = {
  id: 'car-new',
  nameAr: 'سيارة جديدة',
  category: 'suv',
  categoryAr: 'دفع رباعي',
  description: '',
  images: ['https://cdn.example.com/new.jpg'],
  features: [],
  displayOrder: 10,
};

describe('CarAdmin drilldown create+image contract', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue(fleetCars);
    vi.mocked(adminCreateCar).mockResolvedValue(newCar as unknown as Car);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('SC-A fix-create in-category: new car appears in drilldown not separate, car-sync-hidden null while drilled', async () => {
    const { rerender } = render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');
    expect(screen.queryByTestId('car-sync-hidden')).toBeNull();
    const drill = screen.getByTestId('category-drilldown-suv');
    expect(within(drill).queryAllByTestId(/^car-row-/)).toHaveLength(2);
    const form = within(drill).getByTestId('fleet-create');
    const input = form.querySelector('input') as HTMLInputElement | null;
    if (input) fireEvent.change(input, { target: { value: 'سيارة جديدة' } });
    // mock second load returns 11 cars including newCar
    const fleetWithNew = [...fleetCars, newCar];
    vi.mocked(adminGetCars).mockResolvedValueOnce(fleetWithNew);
    vi.mocked(adminCreateCar).mockResolvedValueOnce(newCar as unknown as Car);
    const submit = within(form).getByText('إنشاء سيارة');
    fireEvent.click(submit);
    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalled());
    // after load, drilldown should contain new car
    await waitFor(() => expect(within(screen.getByTestId('category-drilldown-suv')).queryByTestId('car-card-car-new')).not.toBeNull());
    const drillAfter = screen.getByTestId('category-drilldown-suv');
    expect(within(drillAfter).getAllByTestId(/^car-row-/)).toHaveLength(3);
    expect(screen.queryByTestId('car-sync-hidden')).toBeNull();
    expect(document.querySelectorAll('[data-testid^="category-card-"]')).toHaveLength(0);
  });

  it('SC-B image preview: expanded shows img preview grid not path text', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-suv');
    fireEvent.click(screen.getByTestId('category-card-suv'));
    await screen.findByTestId('category-drilldown-suv');
    fireEvent.click(screen.getByTestId('car-expand-car-suv-1'));
    await waitFor(() => expect(screen.getByTestId('car-card-car-suv-1')).toBeInTheDocument());
    const card = screen.getByTestId('car-card-car-suv-1');
    const preview = within(card).queryByTestId('car-images-preview-car-suv-1');
    expect(preview, 'expected preview grid with images').not.toBeNull();
    const imgs = preview ? within(preview as HTMLElement).getAllByTestId(/^car-preview-img-/) : [];
    expect(imgs.length).toBeGreaterThan(0);
    const imgEl = imgs[0] as HTMLImageElement;
    expect(imgEl.getAttribute('src')).toContain('suv1.jpg');
    expect(imgEl.className).toContain('h-28');
    expect(imgEl.className).toContain('object-cover');
    expect(within(card).queryByText('https://cdn.example.com/suv1.jpg')).toBeNull();
  });
});
