import { BASE_URL } from '@/config/env';
import type { Service, Feature, Route, Faq, RouteData, Car, FaqWithId } from '@/types';
import type { Location, RouteGroup, VehiclePricing } from '@/types/pricing';

// ============================================
// AGGREGATE TYPES (mirror static data shapes)
// ============================================

export interface Stat {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
}

export interface PricingConfig {
  whatsappNumber: string;
}

export interface CarCategory {
  id: string;
  nameAr: string;
  icon: string;
}

export interface SiteData {
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

export interface PricingData {
  locations: Location[];
  routeGroups: RouteGroup[];
  vehiclePricing: VehiclePricing[];
  pricingConfig: PricingConfig;
}

// ============================================
// PUBLIC FETCHERS
// ============================================

export async function fetchSiteData(): Promise<SiteData> {
  const res = await fetch(`${BASE_URL}/api/data`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch site data: ${res.status}`);
  }
  return (await res.json()) as SiteData;
}

export async function fetchPricing(): Promise<PricingData> {
  const res = await fetch(`${BASE_URL}/api/pricing`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch pricing: ${res.status}`);
  }
  return (await res.json()) as PricingData;
}

// ============================================
// ADMIN AUTH FETCHERS
// ============================================

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ ok: boolean; email?: string }> {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) {
    return { ok: false };
  }
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }
  const data = (await res.json()) as { ok: true; email: string };
  return { ok: true, email: data.email };
}

export async function adminLogout(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Logout failed: ${res.status}`);
  }
}

export async function fetchAdminMe(): Promise<{ email: string } | null> {
  const res = await fetch(`${BASE_URL}/api/admin/me`, {
    credentials: 'include',
  });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch admin session: ${res.status}`);
  }
  return (await res.json()) as { email: string };
}

async function adminJson<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/admin/${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error(`Admin request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function adminGetCars(): Promise<Car[]> {
  return adminJson<Car[]>('GET', 'cars');
}

export async function adminCreateCar(body: Omit<Car, 'id'>): Promise<Car> {
  return adminJson<Car>('POST', 'cars', body);
}

export async function adminUpdateCar(id: string, body: Partial<Car>): Promise<void> {
  await adminJson<{ ok: true }>('PUT', `cars/${id}`, body);
}

export async function adminDeleteCar(id: string): Promise<void> {
  await adminJson<{ ok: true }>('DELETE', `cars/${id}`);
}

export async function adminGetFaqs(): Promise<FaqWithId[]> {
  return adminJson<FaqWithId[]>('GET', 'faqs');
}

export async function adminCreateFaq(body: {
  question: string;
  answer: string;
}): Promise<FaqWithId> {
  return adminJson<FaqWithId>('POST', 'faqs', body);
}

export async function adminUpdateFaq(id: string, body: Partial<Faq>): Promise<void> {
  await adminJson<{ ok: true }>('PUT', `faqs/${id}`, body);
}

export async function adminDeleteFaq(id: string): Promise<void> {
  await adminJson<{ ok: true }>('DELETE', `faqs/${id}`);
}

export async function adminGetRouteData(): Promise<RouteData[]> {
  return adminJson<RouteData[]>('GET', 'route-data');
}

export async function adminCreateRouteData(body: Omit<RouteData, 'id'>): Promise<RouteData> {
  return adminJson<RouteData>('POST', 'route-data', body);
}

export async function adminUpdateRouteData(
  id: string,
  body: Partial<Omit<RouteData, 'id'>>,
): Promise<void> {
  await adminJson<{ ok: true }>('PUT', `route-data/${id}`, body);
}

export async function adminDeleteRouteData(id: string): Promise<void> {
  await adminJson<{ ok: true }>('DELETE', `route-data/${id}`);
}

export async function adminGetContent(key: string): Promise<unknown> {
  const data = await adminJson<{ value: unknown }>(
    'GET',
    `content/${encodeURIComponent(key)}`,
  );
  return data.value;
}

export async function adminUpdateContent(key: string, value: unknown): Promise<void> {
  await adminJson<{ ok: true }>('PATCH', 'content', { key, value });
}

export async function adminGetLocations(): Promise<Location[]> {
  return adminJson<Location[]>('GET', 'locations');
}

export async function adminCreateLocation(body: Omit<Location, 'id' | 'type'> & { type?: Location['type'] }): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'locations', body);
}

export async function adminUpdateLocation(
  id: string,
  patch: Partial<Location>,
): Promise<void> {
  await adminJson<{ ok: true }>('PUT', `locations/${id}`, patch);
}

export async function adminDeleteLocation(id: string): Promise<void> {
  await adminJson<{ ok: true }>('DELETE', `locations/${id}`);
}

export async function adminGetRouteGroups(): Promise<RouteGroup[]> {
  return adminJson<RouteGroup[]>('GET', 'route-groups');
}

export async function adminCreateRouteGroup(body: Omit<RouteGroup, 'id'>): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'route-groups', body);
}

export async function adminUpdateRouteGroup(
  id: string,
  body: RouteGroup,
): Promise<void> {
  await adminJson<{ ok: true }>('PUT', `route-groups/${id}`, body);
}

export async function adminDeleteRouteGroup(id: string): Promise<void> {
  await adminJson<{ ok: true }>('DELETE', `route-groups/${id}`);
}

export async function adminSetPricingConfig(key: string, value: string): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'pricing-config', { key, value });
}

export async function adminReorderCars(ids: string[]): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'cars/reorder', { ids });
}

export async function adminReorderLocations(ids: string[]): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'locations/reorder', { ids });
}

export async function adminReorderRouteData(ids: string[]): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'route-data/reorder', { ids });
}

export async function adminReorderFaqs(ids: string[]): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'faqs/reorder', { ids });
}

export async function adminReorderRouteGroups(ids: string[]): Promise<void> {
  await adminJson<{ ok: true }>('POST', 'route-groups/reorder', { ids });
}
