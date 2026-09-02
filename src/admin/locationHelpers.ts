import type { Location } from '@/types/pricing';

export function cloneLocation(loc: Location): Location {
  return { ...loc };
}

export function validateLocation(loc: Location): string | null {
  if (loc.name.trim() === '') return 'Name is required';
  if (loc.nameAr.trim() === '') return 'Name (AR) is required';
  if (loc.type !== 'travel' && loc.type !== 'internal') return 'Invalid type';
  return null;
}
