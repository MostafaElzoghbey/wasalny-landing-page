import { ThemeProvider } from '@/context/ThemeContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  HeroSection,
  ServicesSection,
  FleetSection,
  RoutesSection,
  FeaturesSection,
  AppShowcaseSection,
  CTASection,
} from '@/components/sections';

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
