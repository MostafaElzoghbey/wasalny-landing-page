import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/ui/PageLoader';
import {
  HeroSection,
  ServicesSection,
  FleetSection,
  RoutesSection,
  FeaturesSection,
  AppShowcaseSection,
  CTASection,
} from '@/components/sections';

// Import GSAP config to register plugins
import '@/lib/gsap';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ThemeProvider>
      {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}
      <SmoothScrollProvider>
        <div className="min-h-screen">
          <Header />
          <main>
            <HeroSection />
            <ServicesSection />
            <FleetSection />
            <AppShowcaseSection />
            <RoutesSection />
            <FeaturesSection />
            <CTASection />
          </main>
          <Footer />
        </div>
      </SmoothScrollProvider>
    </ThemeProvider>
  );
}

export default App;
