// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars, adminUpdateCar } from '@/data/api';
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

const twoImageCar: Car = {
  id: 'car-edit-row-1',
  nameAr: 'سيدان قابلة للتحرير',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف مشترك',
  images: ['https://cdn.example.com/row0.jpg', 'https://cdn.example.com/row1.jpg'],
  imageAlts: ['بديل صفر', 'بديل واحد'],
  features: ['مكيف'],
  displayOrder: 4,
};

async function drillIntoSedan(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-grid');
  screen.getByTestId('category-card-sedan').click();
  await screen.findByTestId('category-drilldown-sedan');
}

describe('carImageRowEdit – per-row inline edit (S1)', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue([twoImageCar]);
    vi.mocked(adminUpdateCar).mockClear();
  });

  it('edit row 1 alt+image → exactly 1 PUT, index 1 replaced, index 0 byte-identical, shared fields sent', async () => {
    await drillIntoSedan();

    const row = screen.getByTestId(`car-imagerow-${twoImageCar.id}-1`);
    fireEvent.click(within(row).getByTestId(`car-imagerow-edit-${twoImageCar.id}-1`));

    const altInput = within(row).getByTestId(`car-imagerow-alt-${twoImageCar.id}-1`);
    fireEvent.change(altInput, { target: { value: 'بديل واحد جديد' } });

    const urlInput = within(row).getByTestId(`car-imagerow-images-${twoImageCar.id}-1-url-input`);
    fireEvent.change(urlInput, { target: { value: 'https://cdn.example.com/row1-new.jpg' } });
    fireEvent.click(within(row).getByTestId(`car-imagerow-images-${twoImageCar.id}-1-url-add`));

    fireEvent.click(within(row).getByTestId(`car-imagerow-save-${twoImageCar.id}-1`));

    await waitFor(() => expect(vi.mocked(adminUpdateCar)).toHaveBeenCalledTimes(1));
    const [putId, payload] = vi.mocked(adminUpdateCar).mock.calls[0] as unknown as [string, Partial<Car>];
    expect(putId).toBe(twoImageCar.id);
    expect(payload.images?.[1]).toBe('https://cdn.example.com/row1-new.jpg');
    expect(payload.images?.[0]).toBe('https://cdn.example.com/row0.jpg');
    expect(payload.imageAlts?.[1]).toBe('بديل واحد جديد');
    expect(payload.imageAlts?.[0]).toBe('بديل صفر');
    expect(payload.nameAr).toBe(twoImageCar.nameAr);
    expect(payload.description).toBe(twoImageCar.description);
    expect(payload.features).toEqual(twoImageCar.features);

    // patched parent state visible: row 1 shows the new alt, row 0 untouched
    await waitFor(() => expect(screen.getByTestId(`car-imagerow-${twoImageCar.id}-1`).textContent).toContain('بديل واحد جديد'));
    expect(screen.getByTestId(`car-imagerow-${twoImageCar.id}-0`).textContent).toContain('بديل صفر');
  });

  it('cancel discards the draft and sends no PUT', async () => {
    await drillIntoSedan();

    const row = screen.getByTestId(`car-imagerow-${twoImageCar.id}-0`);
    fireEvent.click(within(row).getByTestId(`car-imagerow-edit-${twoImageCar.id}-0`));
    fireEvent.change(within(row).getByTestId(`car-imagerow-alt-${twoImageCar.id}-0`), { target: { value: 'مسودة مهملة' } });
    fireEvent.click(within(row).getByTestId(`car-imagerow-cancel-${twoImageCar.id}-0`));

    expect(vi.mocked(adminUpdateCar)).not.toHaveBeenCalled();
    expect(screen.getByTestId(`car-imagerow-${twoImageCar.id}-0`).textContent).toContain('بديل صفر');
  });
});
