// server/types.ts
// API DTO types for the Wasalny data-access layer.
//
// Domain types that already live in the frontend (`src/types`) are re-used via
// `import type` (erased at runtime, so no runtime resolution is needed under
// tsx). Types that are only produced by the server-side content table
// (Stat / ContactInfo / CarCategory) are defined here so the query layer can
// return a fully-typed shape that mirrors the original `src/data/*` exports.

import type {
  Car,
  Service,
  Route,
  Feature,
  Faq,
  RouteData,
} from '@/types';
import type {
  Location,
  RouteGroup,
  VehiclePricing,
  VehicleCategory,
} from '@/types/pricing';

// ---------------------------------------------------------------------------
// Content-derived types (not present in src/types)
// ---------------------------------------------------------------------------

/** A single homepage stat tile, e.g. "5+ years of experience". */
export interface Stat {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

/** Public contact details rendered in the footer / header. */
export interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
}

/** A car category chip shown in the gallery filter bar. */
export interface CarCategory {
  id: string;
  nameAr: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Read shapes (mirror src/data/* exactly so the React frontend is unchanged)
// ---------------------------------------------------------------------------

/** Shape returned by `getPublicData` — consumed by the public API. */
export interface PublicData {
  services: Service[];
  features: Feature[];
  routes: Route[];
  stats: Stat[];
  contactInfo: ContactInfo;
  cars: Car[];
  carCategories: CarCategory[];
  carImages: Record<string, string[]>;
  mockupImages: string[];
  logoImage: string;
  faqs: Faq[];
  routeData: Record<string, RouteData>;
}

/** Shape returned by `getPricingData` — consumed by the pricing API. */
export interface PricingConfig {
  currency: string;
  currencyAr: string;
  whatsappNumber: string;
  contactEmail: string;
}

export interface PricingData {
  locations: Location[];
  routeGroups: RouteGroup[];
  vehiclePricing: VehiclePricing[];
  pricingConfig: PricingConfig;
}

// ---------------------------------------------------------------------------
// Admin CRUD input types
// ---------------------------------------------------------------------------

/** Car payload. `id` is optional; when omitted the query layer generates one. */
export type CarInput = Omit<Car, 'id'> & { id?: string };

/** FAQ payload (the `Faq` type has no `id`, so this is just `Faq`). */
export type FaqInput = Faq;

/** RouteData payload without the caller-supplied `id`. */
export type RouteDataInput = Omit<RouteData, 'id'>;

/** A persisted FAQ row (includes the generated `id`). */
export interface FaqRecord extends Faq {
  id: string;
}

/** A persisted RouteData row (id is supplied by the caller). */
export type RouteDataRecord = RouteData;

/** Patch for partial updates. */
export type CarPatch = Partial<CarInput>;
export type FaqPatch = Partial<FaqInput>;
export type RouteDataPatch = Partial<RouteDataInput>;

export type { Location, RouteGroup, VehiclePricing, VehicleCategory };
