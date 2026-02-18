import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Third-party
import { ScrollTrigger } from '@/lib/gsap';
import '@/lib/gsap';

// Context/Providers
import { ThemeProvider } from '@/context/ThemeContext';
import { SmoothScrollProvider, useLenis } from '@/providers/SmoothScrollProvider';

// Components
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/ui/PageLoader';
import { FloatingCTA } from '@/components/ui/FloatingCTA';
import { HeroSection } from '@/components/sections/HeroSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { JsonLd } from '@/components/SEO/JsonLd';

// Pages
import { RoutePage } from '@/pages/RoutePage';
import { NotFound } from '@/pages/NotFound';

// Data
import { cars } from '@/data/cars';

// Lazy load below-the-fold sections
const FleetSection = lazy(() => import('@/components/sections/FleetSection').then(module => ({ default: module.FleetSection })));
const RoutesSection = lazy(() => import('@/components/sections/RoutesSection').then(module => ({ default: module.RoutesSection })));
const FeaturesSection = lazy(() => import('@/components/sections/FeaturesSection').then(module => ({ default: module.FeaturesSection })));
const AppShowcaseSection = lazy(() => import('@/components/sections/AppShowcaseSection').then(module => ({ default: module.AppShowcaseSection })));
const CTASection = lazy(() => import('@/components/sections/CTASection').then(module => ({ default: module.CTASection })));
const PricingCalculator = lazy(() => import('@/components/sections/PricingCalculator').then(module => ({ default: module.PricingCalculator })));
const FAQSection = lazy(() => import('@/components/sections/FAQSection').then(module => ({ default: module.FAQSection })));
const MapEmbed = lazy(() => import('@/components/sections/MapEmbed').then(module => ({ default: module.MapEmbed })));

function SectionLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Handle scroll reset and GSAP refresh on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  const { lenis } = useLenis();

  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }

    let rafId1: number | null = null;
    let rafId2: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const refresh = () => {
      if (rafId1 !== null) cancelAnimationFrame(rafId1);
      if (rafId2 !== null) cancelAnimationFrame(rafId2);

      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      });
    };

    // Refresh on route change
    refresh();

    // Refresh on body resize (content loading)
    resizeObserver = new ResizeObserver(() => {
      refresh();
    });
    resizeObserver.observe(document.body);

    return () => {
      if (rafId1 !== null) cancelAnimationFrame(rafId1);
      if (rafId2 !== null) cancelAnimationFrame(rafId2);
      resizeObserver?.disconnect();
    };
  }, [pathname, lenis]);

  return null;
}

function HomePage() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <Suspense fallback={<SectionLoader />}>
        <FleetSection />
        <AppShowcaseSection />
        <RoutesSection />
        <PricingCalculator />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <FeaturesSection />
        <FAQSection />
        <CTASection />
        <MapEmbed />
      </Suspense>
    </main>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ThemeProvider>
      <HelmetProvider>
        <JsonLd cars={cars} />
        {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}
        <SmoothScrollProvider>
          <ScrollToTop />
          <div className="min-h-screen">
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/routes/:id" element={<RoutePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            <FloatingCTA />
          </div>
        </SmoothScrollProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
