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
    name: car.name,
    nameAr: car.nameAr,
    category: car.category,
    categoryAr: car.categoryAr,
    description: car.description,
    seoDescription: car.seoDescription,
    passengers: car.passengers,
    images: [...car.images],
    imageAlts: car.imageAlts ? [...car.imageAlts] : undefined,
    features: [...car.features],
  };
}

export function validateCar(car: Partial<Car>): string | null {
  if (car.name === undefined || car.name.trim() === '') {
    return 'Name is required';
  }
  if (car.nameAr === undefined || car.nameAr.trim() === '') {
    return 'Name (AR) is required';
  }
  if (car.categoryAr === undefined || car.categoryAr.trim() === '') {
    return 'Category (AR) is required';
  }
  if (car.category !== undefined) {
    const allowed: readonly string[] = CAR_CATEGORIES;
    if (!allowed.includes(car.category)) {
      return 'Invalid category';
    }
  }
  if (car.passengers !== undefined) {
    if (!Number.isInteger(car.passengers) || car.passengers < 0) {
      return 'Passengers must be a non-negative integer';
    }
  }
  return null;
}
