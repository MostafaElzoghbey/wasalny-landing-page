// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { Car } from '@/types';
import { adminUpdateCar } from '@/data/api';
import { CarCard } from '@/admin/CarCard';
import { OrderedImageList } from './OrderedImageList';

vi.mock('@/data/api', () => ({
  adminDeleteCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

const IMAGES = ['a.jpg', 'b.jpg', 'c.jpg'];
const ALTS = ['aa', 'bb', 'cc'];

function renderList(images: string[] = IMAGES, alts: string[] = ALTS) {
  const onChange = vi.fn();
  const onAltsChange = vi.fn();
  render(
    <OrderedImageList
      value={images}
      alts={alts}
      onChange={onChange}
      onAltsChange={onAltsChange}
      testIdPrefix="pair"
      itemId="t1"
    />,
  );
  return { onChange, onAltsChange };
}

describe('OrderedImageList image/alt pairing', () => {
  it('moves the paired alt when the middle image moves to top', () => {
    const { onChange, onAltsChange } = renderList();
    fireEvent.click(screen.getByTestId('pair-up-t1-1'));
    expect(onChange).toHaveBeenCalledWith(['b.jpg', 'a.jpg', 'c.jpg']);
    expect(onAltsChange).toHaveBeenCalledWith(['bb', 'aa', 'cc']);
  });

  it('drops the same index from both arrays on remove index 0', () => {
    const { onChange, onAltsChange } = renderList();
    fireEvent.click(screen.getByTestId('pair-remove-t1-0'));
    expect(onChange).toHaveBeenCalledWith(['b.jpg', 'c.jpg']);
    expect(onAltsChange).toHaveBeenCalledWith(['bb', 'cc']);
  });

  it('keeps alts.length === images.length after move when alts are short', () => {
    const { onAltsChange } = renderList(IMAGES, ['aa']);
    fireEvent.click(screen.getByTestId('pair-up-t1-1'));
    const next = onAltsChange.mock.calls[0]?.[0] as string[];
    expect(next).toHaveLength(IMAGES.length);
    expect(next).toEqual(['', 'aa', '']);
  });

  it('pads alts before set on updateAlt when alts are short', () => {
    const { onAltsChange } = renderList(IMAGES, ['aa']);
    fireEvent.change(screen.getByTestId('pair-alt-t1-2'), { target: { value: 'cc' } });
    const next = onAltsChange.mock.calls[0]?.[0] as string[];
    expect(next).toHaveLength(IMAGES.length);
    expect(next).toEqual(['aa', '', 'cc']);
  });
});

describe('CarCard save sends paired trimmed imageAlts', () => {
  it('syncs short alts to images length and trims before update', async () => {
    const group: Car = {
      id: 'car-pair-1',
      nameAr: 'سيدان',
      category: 'sedan',
      categoryAr: 'سيدان',
      description: 'وصف',
      images: ['a.jpg', 'b.jpg', 'c.jpg'],
      imageAlts: ['  aa  '],
      features: [],
      displayOrder: 0,
    };
    const onUpdated = vi.fn();
    render(
      <CarCard group={group} expanded={true} onToggle={vi.fn()} onUpdated={onUpdated} onDeleted={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId('car-edit-car-pair-1'));
    fireEvent.click(screen.getByTestId('car-save-car-pair-1'));

    await vi.waitFor(() => expect(adminUpdateCar).toHaveBeenCalled());
    const payload = vi.mocked(adminUpdateCar).mock.calls[0]?.[1] as Partial<Car>;
    expect(payload.imageAlts).toEqual(['aa', '', '']);
  });
});
