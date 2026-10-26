import type { Car } from '@/types';

export const CATEGORY_CAPACITY: Record<Car['category'], number> = {
  sedan: 4,
  suv: 7,
  family_cruiser: 7,
  minibus: 13,
  wedding: 4,
};

export function formatCapacity(count: number): string {
  if (count === 1) return 'شخص واحد';
  if (count === 2) return 'شخصان';
  if (count <= 10) return `${count} أشخاص`;
  return `${count} راكبًا`;
}
