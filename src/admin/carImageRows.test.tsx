// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { Car } from '@/types';
import { adminGetCars } from '@/data/api';
import { CarAdmin } from './CarAdmin';

const { mockCapture, mockRef } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockRef: { current: null },
}));

vi.mock('@/data/api', () => ({
  adminGetCars: vi.fn(),
  adminCreateCar: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminDeleteCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: mockRef, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

const carFixture: Car = {
  id: 'car-imgtest-1',
  nameAr: 'سيدان مميزة اختبار',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'سيارة اختبار',
  images: [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
    'https://example.com/img3.jpg',
  ],
  imageAlts: ['صورة أولى', 'صورة ثانية', 'صورة ثالثة'],
  features: ['مكيف', 'واي فاي'],
  displayOrder: 0,
};

const FORBIDDEN_STRINGS = [
  'مجموعة السيدان المميزة',
  'مجموعة الدفع الرباعي',
  'المجموعة العائلية',
  'مجموعة الميني باص',
  'ملاكي للزفاف',
] as const;

async function drillIntoSedan(): Promise<void> {
  render(<CarAdmin />);
  await screen.findByTestId('category-grid');
  // Click the sedan category card to drill down
  screen.getByTestId('category-card-sedan').click();
  await screen.findByTestId(`category-drilldown-sedan`);
}

describe('carImageRows – admin drilldown image row rendering', () => {
  beforeEach(() => {
    vi.mocked(adminGetCars).mockResolvedValue([carFixture]);
    mockCapture.mockClear();
  });

  it('renders exactly 3 car-imagerow rows with data-testid pattern car-imagerow-{carId}-{index}', async () => {
    await drillIntoSedan();

    // These assertions will FAIL because car-imagerow rows do not exist yet
    for (let i = 0; i < carFixture.images.length; i++) {
      const row = screen.getByTestId(`car-imagerow-${carFixture.id}-${i}`);
      expect(row).toBeTruthy();
    }

    const allRows = document.querySelectorAll('[data-testid^="car-imagerow-car-imgtest-1-"]');
    expect(allRows).toHaveLength(3);
  });

  it('has exactly one <img> inside each image row', async () => {
    await drillIntoSedan();

    for (let i = 0; i < carFixture.images.length; i++) {
      const row = screen.getByTestId(`car-imagerow-${carFixture.id}-${i}`);
      const imgs = row.querySelectorAll('img');
      expect(imgs).toHaveLength(1);
    }
  });

  it('does not show nameAr in the read-only image row view', async () => {
    await drillIntoSedan();

    for (let i = 0; i < carFixture.images.length; i++) {
      const row = screen.getByTestId(`car-imagerow-${carFixture.id}-${i}`);
      expect(row.textContent).not.toContain(carFixture.nameAr);
    }
  });

  it('contains none of the forbidden group-name Arabic strings in the document', async () => {
    await drillIntoSedan();

    const body = document.body.textContent ?? '';
    for (const forbidden of FORBIDDEN_STRINGS) {
      expect(body).not.toContain(forbidden);
    }
  });
});
