import { useState, lazy, Suspense, useEffect } from 'react';

// Third-party
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Local
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
    <div className="min-h-[50vh] flex items-center justify-center bg-[hsl(var(--section-alt))]">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Handle scroll reset and GSAP refresh on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  const { lenis } = useLenis();

  useEffect(() => {
    // Immediate scroll to top only if no hash
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
    }

    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let refreshScheduled = false;

    const scheduleRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;

      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        refreshScheduled = false;
        ScrollTrigger.refresh();
      });
    };

    // Refresh on route change
    scheduleRefresh();

    // Refresh on resize (content loading) without risking body-observer loops
    if (typeof ResizeObserver !== 'undefined') {
      let lastScrollHeight = document.documentElement.scrollHeight;

      resizeObserver = new ResizeObserver(() => {
        const nextScrollHeight = document.documentElement.scrollHeight;
        if (nextScrollHeight === lastScrollHeight) return;
        lastScrollHeight = nextScrollHeight;
        scheduleRefresh();
      });

      resizeObserver.observe(document.documentElement);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [pathname, lenis]);

  return null;
}

function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        // Delay slightly to ensure content is rendered/hydrated
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [hash]);

  return (
    <main>
      <title>وصلني - خدمة نقل الركاب</title>
      <meta
        name="description"
        content="وصلني - خدمة نقل الركاب من دمياط إلى القاهرة والمطار. سيارات حديثة ومريحة وأسعار مناسبة."
      />
      <link rel="canonical" href="https://wasalny.pages.dev/" />
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
    </ThemeProvider>
  );
}

export function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
