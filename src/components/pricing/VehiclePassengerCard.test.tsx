// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VehiclePassengerCard } from './VehiclePassengerCard';
import { DataContext } from '@/context/DataProvider';
import type { DataContextValue } from '@/context/DataProvider';
import { cars as staticCars } from '@/data/cars';
import {
  locations,
  routeGroups,
  vehiclePricing,
  pricingConfig,
} from '@/data/pricing';
import { services, features, routes, stats, contactInfo } from '@/data/content';
import { faqs } from '@/data/faqs';
import { routeData } from '@/data/routeData';
import { carCategories, carImages, mockupImages, logoImage } from '@/data/cars';
import type { Car } from '@/types';

function makeCtx(overrides: Partial<DataContextValue> = {}): DataContextValue {
  return {
    services,
    features,
    routes,
    stats,
    contactInfo,
    cars: staticCars,
    carCategories: [...carCategories],
    carImages,
    mockupImages,
    logoImage,
    faqs,
    routeData,
    pricing: { locations, routeGroups, vehiclePricing, pricingConfig },
    loading: false,
    ...overrides,
  };
}

function renderCard(ctx: DataContextValue) {
  const noop = vi.fn();
  return render(
    <DataContext.Provider value={ctx}>
      <VehiclePassengerCard
        vehicleCategory="sedan"
        setVehicleCategory={noop}
        passengerCount={2}
        setPassengerCount={noop}
      />
    </DataContext.Provider>
  );
}

describe('VehiclePassengerCard live thumbnails + wedding lockout', () => {
  it('shows live admin car image instead of stale static bundle image', () => {
    const liveSedanImage = '/live/admin-sedan-updated.jpeg';
    const liveCars: Car[] = staticCars.map((c) =>
      c.category === 'sedan' ? { ...c, images: [liveSedanImage] } : c
    );
    renderCard(makeCtx({ cars: liveCars }));
    const img = screen.getByAltText('سيدان') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(liveSedanImage);
  });

  it('renders exactly 4 pricing tiles even when wedding pricing exists (wedding is gallery-only)', () => {
    const weddingPricing = {
      category: 'wedding',
      categoryAr: 'زفاف',
      maxPassengers: 3,
      minPassengers: 1,
    };
    renderCard(
      makeCtx({
        pricing: {
          locations,
          routeGroups,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vehiclePricing: [...vehiclePricing, weddingPricing as any],
          pricingConfig,
        },
      })
    );
    const tiles = screen.getAllByRole('button', { name: /.+/ }).filter((b) => b.getAttribute('aria-pressed') !== null);
    expect(tiles).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'زفاف' })).toBeNull();
  });
});
