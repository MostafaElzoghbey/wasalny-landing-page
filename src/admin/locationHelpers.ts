import type { Location } from '@/types/pricing';
import { validateArabicName } from './arabicName';

export function cloneLocation(loc: Location): Location {
  return { ...loc };
}

export function validateLocation(loc: Location): string | null {
  const nameError = validateArabicName(loc.name);
  if (nameError !== null) return nameError;
  if (loc.type !== 'travel' && loc.type !== 'internal') return 'نوع غير صالح';
  return null;
}
