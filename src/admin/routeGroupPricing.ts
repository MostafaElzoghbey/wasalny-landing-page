import { CURRENCY_AR } from '@/data/pricing';
import type { RouteGroup, VehicleCategory } from '@/types/pricing';

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
];

export const CATEGORY_LABEL: Record<VehicleCategory, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  family_cruiser: 'Family Cruiser',
  minibus: 'Minibus',
};

export function formatPrice(n: number): string {
  return `${Math.round(n)} ${CURRENCY_AR}`;
}

export function validatePricing(pricing: RouteGroup['pricing']): string | null {
  for (const cat of VEHICLE_CATEGORIES) {
    const p = pricing[cat];
    if (!Number.isInteger(p.oneWay) || !Number.isInteger(p.roundTrip)) {
      return 'Pricing must be integers';
    }
    if (p.oneWay < 0 || p.roundTrip < 0) {
      return 'Pricing must be >= 0';
    }
  }
  return null;
}

export function minPrice(pricing: RouteGroup['pricing']): number {
  let m = Infinity;
  for (const cat of VEHICLE_CATEGORIES) {
    m = Math.min(m, pricing[cat].oneWay, pricing[cat].roundTrip);
  }
  return m === Infinity ? 0 : m;
}

export function cloneGroup(group: RouteGroup): RouteGroup {
  return {
    id: group.id,
    type: group.type,
    nameAr: group.nameAr,
    bidirectional: group.bidirectional,
    fromLocations: [...group.fromLocations],
    toLocations: [...group.toLocations],
    pricing: {
      sedan: { ...group.pricing.sedan },
      suv: { ...group.pricing.suv },
      family_cruiser: { ...group.pricing.family_cruiser },
      minibus: { ...group.pricing.minibus },
    },
  };
}

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
