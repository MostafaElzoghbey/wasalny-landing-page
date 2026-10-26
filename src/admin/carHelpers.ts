import type { Car } from '@/types';

export const CAR_CATEGORIES: readonly Car['category'][] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
  'wedding',
] as const;

export const CATEGORY_LABELS: Record<Car['category'], string> = {
  sedan: 'سيدان',
  suv: 'دفع رباعي',
  family_cruiser: 'عائلية',
  minibus: 'ميني باص',
  wedding: 'زفاف',
};

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

export const CATEGORY_ICON_MAP: Record<
  Car['category'],
  'Car' | 'Truck' | 'Bus' | 'UsersRound' | 'Heart'
> = {
  sedan: 'Car',
  suv: 'Truck',
  family_cruiser: 'Bus',
  minibus: 'UsersRound',
  wedding: 'Heart',
};

export const CATEGORY_COLORS: Record<
  Car['category'],
  { primary: string; accent: string; solid: string; ring: string }
> = {
  sedan: { primary: 'from-blue-500/15', accent: 'to-cyan-500/10', solid: 'bg-blue-600', ring: 'ring-blue-500/20' },
  suv: { primary: 'from-emerald-500/15', accent: 'to-teal-500/10', solid: 'bg-emerald-600', ring: 'ring-emerald-500/20' },
  family_cruiser: { primary: 'from-purple-500/15', accent: 'to-pink-500/10', solid: 'bg-purple-600', ring: 'ring-purple-500/20' },
  minibus: { primary: 'from-orange-500/15', accent: 'to-amber-500/10', solid: 'bg-orange-600', ring: 'ring-orange-500/20' },
  wedding: { primary: 'from-rose-500/15', accent: 'to-pink-500/10', solid: 'bg-rose-600', ring: 'ring-rose-500/20' },
};

export const REQUIRE_CAR_IMAGE = 'At least one image is required';

export function getCategoryMeta(cat: Car['category']) {
  return { label: CATEGORY_LABELS[cat], icon: CATEGORY_ICON_MAP[cat], colors: CATEGORY_COLORS[cat] };
}

export function syncAlts(images: string[], alts?: string[]): string[] {
  const base = Array.isArray(alts) ? alts : [];
  return images.map((_, i) => base[i] ?? '');
}

export function validateCar(car: Partial<Car>): string | null {
  if (car.nameAr === undefined || car.nameAr.trim() === '') {
    return 'الاسم (عربي) مطلوب';
  }
  if (car.category === undefined || car.category === null) {
    return 'category required';
  }
  const allowed: readonly string[] = CAR_CATEGORIES;
  if (!allowed.includes(car.category)) {
    return 'فئة غير صالحة';
  }
  if (!Array.isArray(car.images) || car.images.length === 0 || !car.images.every((img) => typeof img === 'string' && img.trim() !== '')) {
    return REQUIRE_CAR_IMAGE;
  }
  if (car.imageAlts !== undefined && car.imageAlts !== null && car.imageAlts.length !== car.images.length) {
    return 'imageAlts length must match images';
  }
  return null;
}
