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
];

const createdCar: Car = {
  id: 'car-sedan-new',
  nameAr: 'سيدان جديدة',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف السيارة',
  seoDescription: 'وصف SEO',
  images: ['https://cdn.example.com/new.jpg'],
  features: ['تكييف'],
  displayOrder: 2,
};

async function openSedanDrilldown() {
  render(<CarAdmin />);
  await screen.findByTestId('category-card-sedan');
  fireEvent.click(screen.getByTestId('category-card-sedan'));
  await screen.findByTestId('category-drilldown-sedan');
  return within(screen.getByTestId('category-drilldown-sedan')).getByTestId('fleet-create');
}

function addImageUrl(form: HTMLElement, url: string) {
  const urlInput = within(form).getByTestId('car-images-create-url-input') as HTMLInputElement;
  fireEvent.change(urlInput, { target: { value: url } });
  fireEvent.click(within(form).getByTestId('car-images-create-url-add'));
}

describe('CarAdmin validate-gated create + seoDescription', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockReset().mockResolvedValue(fleetCars);
    vi.mocked(adminCreateCar).mockReset().mockResolvedValue(createdCar as unknown as Car);
    mockCapture.mockClear();
    vi.mocked(useReorderAnimation).mockClear();
  });

  it('spaces-only nameAr shows inline error and sends zero POSTs', async () => {
    const form = await openSedanDrilldown();
    addImageUrl(form, 'https://cdn.example.com/new.jpg');

    const input = form.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });

    fireEvent.click(within(form).getByText('إنشاء سيارة'));

    await waitFor(() => {
      expect(within(form).getByRole('alert')).toBeInTheDocument();
    });
    expect(vi.mocked(adminCreateCar)).not.toHaveBeenCalled();
  });

  it('create payload includes trimmed nameAr/description, derived categoryAr, seoDescription, images, features, explicit displayOrder', async () => {
    const form = await openSedanDrilldown();
    addImageUrl(form, 'https://cdn.example.com/new.jpg');

    const inputs = form.querySelectorAll('input');
    const nameInput = inputs[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '  سيدان جديدة  ' } });

    const textareas = form.querySelectorAll('textarea');
    const descArea = textareas[0] as HTMLTextAreaElement | undefined;
    if (descArea) fireEvent.change(descArea, { target: { value: '  وصف السيارة  ' } });

    // seoDescription field follows CarCard label
    const seoField = within(form).queryByText('وصف تحسين محركات البحث');
    expect(seoField, 'seoDescription field must exist in create form').not.toBeNull();
    const seoLabel = seoField!.closest('label') as HTMLElement;
    const seoControl = seoLabel.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
    fireEvent.change(seoControl, { target: { value: '  وصف SEO  ' } });

    const chipInput = within(form).getByPlaceholderText('اكتب واضغط Enter') as HTMLInputElement;
    fireEvent.change(chipInput, { target: { value: 'تكييف' } });
    fireEvent.keyDown(chipInput, { key: 'Enter' });

    vi.mocked(adminCreateCar).mockResolvedValueOnce(createdCar as unknown as Car);

    fireEvent.click(within(form).getByText('إنشاء سيارة'));
    await waitFor(() => expect(vi.mocked(adminCreateCar)).toHaveBeenCalled());

    const callArg = vi.mocked(adminCreateCar).mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(callArg['nameAr']).toBe('سيدان جديدة');
    expect(callArg['description']).toBe('وصف السيارة');
    expect(callArg['categoryAr']).toBe('سيدان');
    expect(callArg['seoDescription']).toBe('وصف SEO');
    expect(callArg['images']).toEqual(['https://cdn.example.com/new.jpg']);
    expect(callArg['features']).toEqual(['تكييف']);
    expect(callArg['displayOrder']).toBe(2);
  });
});
