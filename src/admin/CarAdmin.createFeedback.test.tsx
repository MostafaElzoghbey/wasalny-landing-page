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

const createdCar: Car = {
  id: 'car-sedan-new',
  nameAr: 'سيدان جديدة',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف السيارة',
  images: ['https://cdn.example.com/new.jpg'],
  features: ['تكييف'],
  displayOrder: 0,
};

describe('CarAdmin create feedback', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockReset().mockResolvedValue([]);
    vi.mocked(adminCreateCar).mockReset().mockResolvedValue(createdCar as unknown as Car);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('newly created car auto-expands so the result is visible', async () => {
    render(<CarAdmin />);
    await screen.findByTestId('category-card-sedan');
    fireEvent.click(screen.getByTestId('category-card-sedan'));
    const drilldown = await screen.findByTestId('category-drilldown-sedan');
    const form = within(drilldown).getByTestId('fleet-create');

    const urlInput = within(form).getByTestId('car-images-create-url-input') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://cdn.example.com/new.jpg' } });
    fireEvent.click(within(form).getByTestId('car-images-create-url-add'));

    const input = form.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'سيدان جديدة' } });
    fireEvent.click(within(form).getByText('إنشاء سيارة'));

    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('car-imagerow-edit-car-sedan-new-0')).toBeInTheDocument();
  });
});
