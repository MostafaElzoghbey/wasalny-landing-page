import type { Location } from '@/types/pricing';

export function cloneLocation(loc: Location): Location {
  return { ...loc };
}

export function validateLocation(loc: Location): string | null {
  if (loc.name.trim() === '') return 'الاسم مطلوب';
  if (loc.nameAr.trim() === '') return 'الاسم (عربي) مطلوب';
  if (loc.type !== 'travel' && loc.type !== 'internal') return 'نوع غير صالح';
  return null;
}
