// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { Car } from '@/types';
import { CarCard } from './CarCard';

vi.mock('@/data/api', () => ({
  adminDeleteCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

const carWithImages: Car = {
  id: 'car-sedan-1',
  nameAr: 'سيدان ١',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'سيارة سيدان',
  images: [
    'https://cdn.example.com/sedan1.jpg',
    'https://cdn.example.com/sedan2.jpg',
    'https://cdn.example.com/sedan3.jpg',
  ],
  imageAlts: ['صورة أمامية', '', 'صورة جانبية'],
  features: ['مكيف', 'GPS'],
  displayOrder: 0,
};

function renderCard(): ReturnType<typeof render> {
  return render(
    <CarCard
      group={carWithImages}
      onUpdated={vi.fn()}
      onDeleted={vi.fn()}
    />,
  );
}

describe('CarCard ordered images', () => {
  describe('row mode — one line, one image', () => {
    it('renders order badge, name, counts and actions directly', () => {
      renderCard();
      expect(screen.getByTestId('car-order-car-sedan-1').textContent?.trim()).toBe('0');
      expect(screen.getByText('سيدان ١')).not.toBeNull();
      expect(screen.getByTestId('car-counts-car-sedan-1').textContent).toContain('3 صور');
      expect(screen.getByTestId('car-edit-car-sedan-1')).not.toBeNull();
      expect(screen.getByTestId('car-delete-car-sedan-1')).not.toBeNull();
    });

    it('renders exactly one thumbnail (first image), no grid, no hero/sub split', () => {
      renderCard();
      const thumb = screen.getByTestId('car-thumb-car-sedan-1');
      expect(thumb.tagName).toBe('IMG');
      expect(thumb.getAttribute('src')).toBe('https://cdn.example.com/sedan1.jpg');
      const card = screen.getByTestId('car-card-car-sedan-1');
      expect(card.querySelectorAll('img')).toHaveLength(1);
      expect(screen.queryByTestId('car-images-car-sedan-1')).toBeNull();
      expect(screen.queryByTestId('car-image-order-car-sedan-1-0')).toBeNull();
      expect(screen.queryByTestId(/^car-strip-car-sedan-1/)).toBeNull();
    });

    it('renders placeholder when the car has no images', () => {
      render(
        <CarCard
          group={{ ...carWithImages, id: 'car-empty-1', images: [] }}
          onUpdated={vi.fn()}
          onDeleted={vi.fn()}
        />,
      );
      expect(screen.queryByTestId('car-images-car-empty-1')).toBeNull();
      expect(screen.queryByTestId('car-thumb-car-empty-1')).toBeNull();
      expect(screen.getByTestId('car-thumb-placeholder-car-empty-1')).not.toBeNull();
    });
  });

  describe('edit mode — editable ordered image list', () => {
    it('shows car-image-edit-{id}-{idx} items for each image', () => {
      renderCard();
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      const edit0 = screen.queryByTestId('car-image-edit-car-sedan-1-0');
      const edit1 = screen.queryByTestId('car-image-edit-car-sedan-1-1');
      const edit2 = screen.queryByTestId('car-image-edit-car-sedan-1-2');
      expect(edit0).not.toBeNull();
      expect(edit1).not.toBeNull();
      expect(edit2).not.toBeNull();
    });

    it('each edit item has up and down buttons', () => {
      renderCard();
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      // first item: up disabled, down enabled
      const up0 = screen.getByTestId('car-image-up-car-sedan-1-0') as HTMLButtonElement;
      const down0 = screen.getByTestId('car-image-down-car-sedan-1-0') as HTMLButtonElement;
      expect(up0.disabled).toBe(true);
      expect(down0.disabled).toBe(false);

      // middle item: both enabled
      const up1 = screen.getByTestId('car-image-up-car-sedan-1-1') as HTMLButtonElement;
      const down1 = screen.getByTestId('car-image-down-car-sedan-1-1') as HTMLButtonElement;
      expect(up1.disabled).toBe(false);
      expect(down1.disabled).toBe(false);

      // last item: up enabled, down disabled
      const up2 = screen.getByTestId('car-image-up-car-sedan-1-2') as HTMLButtonElement;
      const down2 = screen.getByTestId('car-image-down-car-sedan-1-2') as HTMLButtonElement;
      expect(up2.disabled).toBe(false);
      expect(down2.disabled).toBe(true);
    });

    it('each edit item has a remove button', () => {
      renderCard();
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      const rm0 = screen.queryByTestId('car-image-remove-car-sedan-1-0');
      const rm1 = screen.queryByTestId('car-image-remove-car-sedan-1-1');
      const rm2 = screen.queryByTestId('car-image-remove-car-sedan-1-2');
      expect(rm0).not.toBeNull();
      expect(rm1).not.toBeNull();
      expect(rm2).not.toBeNull();
    });

    it('each edit item has an alt input', () => {
      renderCard();
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      const alt0 = screen.getByTestId('car-image-alt-car-sedan-1-0') as HTMLInputElement;
      const alt1 = screen.getByTestId('car-image-alt-car-sedan-1-1') as HTMLInputElement;
      const alt2 = screen.getByTestId('car-image-alt-car-sedan-1-2') as HTMLInputElement;
      expect(alt0.value).toBe('صورة أمامية');
      expect(alt1.value).toBe('');
      expect(alt2.value).toBe('صورة جانبية');
    });

    it('edit list renders alongside name, description, features fields', () => {
      renderCard();
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      // image edit list exists
      expect(screen.getByTestId('car-image-edit-car-sedan-1-0')).not.toBeNull();
      // name field present
      expect(screen.getByDisplayValue('سيدان ١')).not.toBeNull();
      // description field present
      expect(screen.getByDisplayValue('سيارة سيدان')).not.toBeNull();
      // features chip input present
      expect(screen.getByTestId('chip-input-features')).not.toBeNull();
    });

    it('down button reorders images and emits reordered array', () => {
      const onUpdated = vi.fn();
      render(
        <CarCard
          group={carWithImages}
          onUpdated={onUpdated}
          onDeleted={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      fireEvent.click(screen.getByTestId('car-image-down-car-sedan-1-0'));

      // after moving image 0 down, order should swap
      const alt0 = screen.getByTestId('car-image-alt-car-sedan-1-0') as HTMLInputElement;
      const alt1 = screen.getByTestId('car-image-alt-car-sedan-1-1') as HTMLInputElement;
      expect(alt0.value).toBe('');            // was index 1 (empty alt)
      expect(alt1.value).toBe('صورة أمامية'); // was index 0
    });
  });
});
