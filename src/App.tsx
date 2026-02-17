import { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/ui/PageLoader';
import { FloatingCTA } from '@/components/ui/FloatingCTA';
import {
  HeroSection,
  ServicesSection,
} from '@/components/sections';

// Lazy load below-the-fold sections for better initial performance
const FleetSection = lazy(() => import('@/components/sections/FleetSection').then(module => ({ default: module.FleetSection })));
const RoutesSection = lazy(() => import('@/components/sections/RoutesSection').then(module => ({ default: module.RoutesSection })));
const FeaturesSection = lazy(() => import('@/components/sections/FeaturesSection').then(module => ({ default: module.FeaturesSection })));
const AppShowcaseSection = lazy(() => import('@/components/sections/AppShowcaseSection').then(module => ({ default: module.AppShowcaseSection })));
const CTASection = lazy(() => import('@/components/sections/CTASection').then(module => ({ default: module.CTASection })));
const PricingCalculator = lazy(() => import('@/components/sections/PricingCalculator').then(module => ({ default: module.PricingCalculator })));

import { JsonLd } from '@/components/SEO/JsonLd';
import { cars } from '@/data/cars';

// Import GSAP config to register plugins
import '@/lib/gsap';

// Loading fallback component
const SectionLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ThemeProvider>
      <JsonLd cars={cars} />
      {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}
      <SmoothScrollProvider>
        <div className="min-h-screen">
          <Header />
          <main>
            <HeroSection />
            <ServicesSection />
            <Suspense fallback={<SectionLoader />}>
              <FleetSection />
              <AppShowcaseSection />
              <RoutesSection />
              <PricingCalculator />
              <FeaturesSection />
              <CTASection />
            </Suspense>
          </main>
          <Footer />
          <FloatingCTA />
        </div>
      </SmoothScrollProvider>
    </ThemeProvider>
  );
}

export default App;
