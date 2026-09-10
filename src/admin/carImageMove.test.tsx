// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Car } from '@/types';
import { adminGetCars, adminUpdateCar } from '@/data/api';
import { moveImageAcrossParents } from '@/admin/carImageRows';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/data/api', () => ({
  adminGetCars: vi.fn(),
  adminUpdateCar: vi.fn(),
  adminCreateCar: vi.fn(),
  adminDeleteCar: vi.fn(),
  adminReorderCars: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures — S3 cross-parent image move
// ---------------------------------------------------------------------------

const parentA: Car = {
  id: 'car-a',
  nameAr: 'سيدان أ',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف سيدان أ',
  images: ['https://cdn.example.com/a0.jpg', 'https://cdn.example.com/a1.jpg'],
  imageAlts: ['صورة أ أمامية', 'صورة أ جانبية'],
  features: ['مكيف', 'نوافذ كهربائية'],
  displayOrder: 0,
};

const parentB: Car = {
  id: 'car-b',
  nameAr: 'سيدان ب',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'وصف سيدان ب',
  images: ['https://cdn.example.com/b0.jpg'],
  imageAlts: ['صورة ب أمامية'],
  features: ['مكيف', 'نظام صوتي'],
  displayOrder: 1,
};

// After move: image 0 from A → B at index 1
const parentA_afterMove: Car = {
  ...parentA,
  images: ['https://cdn.example.com/a1.jpg'],
  imageAlts: ['صورة أ جانبية'],
};

const parentB_afterMove: Car = {
  ...parentB,
  images: ['https://cdn.example.com/b0.jpg', 'https://cdn.example.com/a0.jpg'],
  imageAlts: ['صورة ب أمامية', 'صورة أ أمامية'],
};

// ---------------------------------------------------------------------------
// Test suite — S3: cross-parent image move
// ---------------------------------------------------------------------------

describe('S3 cross-parent image move', () => {
  beforeEach(() => {
    vi.mocked(adminUpdateCar).mockResolvedValue(undefined);
    vi.mocked(adminGetCars).mockResolvedValue([parentA_afterMove, parentB_afterMove]);
  });

  it('splices image+alt from parentA, inserts at targetIndex in parentB, sends two PUT payloads with full arrays', async () => {
    await moveImageAcrossParents({
      sourceId: parentA.id,
      sourceImageIndex: 0,
      targetId: parentB.id,
      targetImageIndex: 1,
    });

    // Exactly two adminUpdateCar calls: one for source (A), one for target (B)
    expect(adminUpdateCar).toHaveBeenCalledTimes(2);

    // --- First call: parent A — image spliced out ---
    const callA = vi.mocked(adminUpdateCar).mock.calls[0];
    expect(callA[0]).toBe('car-a');
    expect(callA[1]).toEqual({
      nameAr: parentA.nameAr,
      description: parentA.description,
      features: parentA.features,
      images: ['https://cdn.example.com/a1.jpg'],
      imageAlts: ['صورة أ جانبية'],
    });

    // --- Second call: parent B — image inserted at index 1 ---
    const callB = vi.mocked(adminUpdateCar).mock.calls[1];
    expect(callB[0]).toBe('car-b');
    expect(callB[1]).toEqual({
      nameAr: parentB.nameAr,
      description: parentB.description,
      features: parentB.features,
      images: ['https://cdn.example.com/b0.jpg', 'https://cdn.example.com/a0.jpg'],
      imageAlts: ['صورة ب أمامية', 'صورة أ أمامية'],
    });
  });

  it('re-fetches cars after the move so the UI reflects the new state', async () => {
    await moveImageAcrossParents({
      sourceId: parentA.id,
      sourceImageIndex: 0,
      targetId: parentB.id,
      targetImageIndex: 1,
    });

    expect(adminGetCars).toHaveBeenCalledTimes(1);
  });

  it('does not mutate the original shared fields (nameAr, description, features) on either parent', async () => {
    // Capture the payloads to inspect them directly
    await moveImageAcrossParents({
      sourceId: parentA.id,
      sourceImageIndex: 0,
      targetId: parentB.id,
      targetImageIndex: 1,
    });

    const payloadA = vi.mocked(adminUpdateCar).mock.calls[0][1] as Partial<Car>;
    const payloadB = vi.mocked(adminUpdateCar).mock.calls[1][1] as Partial<Car>;

    // Shared fields unchanged — must be sent through but identical to originals
    expect(payloadA.nameAr).toBe(parentA.nameAr);
    expect(payloadA.description).toBe(parentA.description);
    expect(payloadA.features).toEqual(parentA.features);

    expect(payloadB.nameAr).toBe(parentB.nameAr);
    expect(payloadB.description).toBe(parentB.description);
    expect(payloadB.features).toEqual(parentB.features);
  });
});
