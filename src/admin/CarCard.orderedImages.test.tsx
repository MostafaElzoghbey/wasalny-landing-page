// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import type { Car } from '@/types';
import { adminDeleteCar, adminUpdateCar } from '@/data/api';
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

function renderCard(expanded: boolean): ReturnType<typeof render> {
  return render(
    <CarCard
      group={carWithImages}
      expanded={expanded}
      onToggle={vi.fn()}
      onUpdated={vi.fn()}
      onDeleted={vi.fn()}
    />,
  );
}

describe('CarCard ordered images', () => {
  describe('preview mode — numbered ordered list', () => {
    it('renders ol with testid car-images-{id}', () => {
      renderCard(true);
      const ol = screen.queryByTestId('car-images-car-sedan-1');
      expect(ol).not.toBeNull();
      expect(ol?.tagName).toBe('OL');
    });

    it('shows order badges car-image-order-{id}-{idx} with sequential 1,2,3', () => {
      renderCard(true);
      const badge0 = screen.getByTestId('car-image-order-car-sedan-1-0');
      const badge1 = screen.getByTestId('car-image-order-car-sedan-1-1');
      const badge2 = screen.getByTestId('car-image-order-car-sedan-1-2');
      expect(badge0.textContent?.trim()).toBe('1');
      expect(badge1.textContent?.trim()).toBe('2');
      expect(badge2.textContent?.trim()).toBe('3');
    });

    it('lists images in the ol in display order', () => {
      renderCard(true);
      const ol = screen.getByTestId('car-images-car-sedan-1');
      const items = within(ol).getAllByRole('listitem');
      expect(items).toHaveLength(3);
      const imgs = items.map((li) => {
        const img = li.querySelector('img');
        return img?.getAttribute('src') ?? '';
      });
      expect(imgs).toEqual([
        'https://cdn.example.com/sedan1.jpg',
        'https://cdn.example.com/sedan2.jpg',
        'https://cdn.example.com/sedan3.jpg',
      ]);
    });
  });

  describe('edit mode — editable ordered image list', () => {
    it('shows car-image-edit-{id}-{idx} items for each image', () => {
      renderCard(true);
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      const edit0 = screen.queryByTestId('car-image-edit-car-sedan-1-0');
      const edit1 = screen.queryByTestId('car-image-edit-car-sedan-1-1');
      const edit2 = screen.queryByTestId('car-image-edit-car-sedan-1-2');
      expect(edit0).not.toBeNull();
      expect(edit1).not.toBeNull();
      expect(edit2).not.toBeNull();
    });

    it('each edit item has up and down buttons', () => {
      renderCard(true);
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
      renderCard(true);
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      const rm0 = screen.queryByTestId('car-image-remove-car-sedan-1-0');
      const rm1 = screen.queryByTestId('car-image-remove-car-sedan-1-1');
      const rm2 = screen.queryByTestId('car-image-remove-car-sedan-1-2');
      expect(rm0).not.toBeNull();
      expect(rm1).not.toBeNull();
      expect(rm2).not.toBeNull();
    });

    it('each edit item has an alt input', () => {
      renderCard(true);
      fireEvent.click(screen.getByTestId('car-edit-car-sedan-1'));

      const alt0 = screen.getByTestId('car-image-alt-car-sedan-1-0') as HTMLInputElement;
      const alt1 = screen.getByTestId('car-image-alt-car-sedan-1-1') as HTMLInputElement;
      const alt2 = screen.getByTestId('car-image-alt-car-sedan-1-2') as HTMLInputElement;
      expect(alt0.value).toBe('صورة أمامية');
      expect(alt1.value).toBe('');
      expect(alt2.value).toBe('صورة جانبية');
    });

    it('edit list renders alongside name, description, features fields', () => {
      renderCard(true);
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
          expanded={true}
          onToggle={vi.fn()}
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
