import type { Car } from '@/types';

export const CAR_CATEGORIES: readonly Car['category'][] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
  'wedding',
] as const;

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function cloneCar(car: Car): Car {
  return {
    id: car.id,
    nameAr: car.nameAr,
    category: car.category,
    categoryAr: car.categoryAr,
    description: car.description,
    seoDescription: car.seoDescription,
    images: [...car.images],
    imageAlts: car.imageAlts ? [...car.imageAlts] : undefined,
    features: [...car.features],
    displayOrder: car.displayOrder,
  };
}

export function validateCar(car: Partial<Car>): string | null {
  if (car.nameAr === undefined || car.nameAr.trim() === '') {
    return 'الاسم (عربي) مطلوب';
  }
  if (car.categoryAr === undefined || car.categoryAr.trim() === '') {
    return 'الفئة (عربي) مطلوبة';
  }
  if (car.category !== undefined) {
    const allowed: readonly string[] = CAR_CATEGORIES;
    if (!allowed.includes(car.category)) {
      return 'فئة غير صالحة';
    }
  }
  return null;
}
