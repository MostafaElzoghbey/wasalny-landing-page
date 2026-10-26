import { createContext, useContext, useEffect, useState } from 'react';
import type { SiteData, PricingData } from '@/data/api';
import { fetchSiteData, fetchPricing } from '@/data/api';
import { services, features, routes, stats, contactInfo } from '@/data/content';
import { faqs } from '@/data/faqs';
import { routeData } from '@/data/routeData';
import { cars, carCategories, carImages, mockupImages, logoImage } from '@/data/cars';
import {
  locations,
  routeGroups,
  vehiclePricing,
  pricingConfig,
} from '@/data/pricing';

export type DataContextValue = SiteData & { pricing: PricingData; loading: boolean };

// eslint-disable-next-line react-refresh/only-export-components -- context shared with provider/hook in same file
export const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [data, setData] = useState<DataContextValue>({
    services,
    features,
    routes,
    stats,
    contactInfo,
    cars,
    carCategories: [...carCategories],
    carImages,
    mockupImages,
    logoImage,
    faqs,
    routeData,
    pricing: { locations, routeGroups, vehiclePricing, pricingConfig },
    loading: true,
  });

  useEffect(() => {
    let active = true;
    Promise.all([fetchSiteData(), fetchPricing()])
      .then(([site, pricingData]) => {
        if (!active) return;
        setData((prev) => ({ ...prev, ...site, pricing: pricingData, loading: false }));
      })
      .catch((err) => {
        if (!active) return;
        console.error('[DataProvider] failed to load live data, using static fallback:', err);
        setData((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      active = false;
    };
  }, []);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with provider
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}
