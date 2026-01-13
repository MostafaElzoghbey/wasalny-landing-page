import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface LenisContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: object) => void;
  stop: () => void;
  start: () => void;
}

const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useLenis = () => useContext(LenisContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  
  useLayoutEffect(() => {
    // Initialize Lenis
    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo.out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    setLenis(lenisInstance);

    // Sync Lenis with GSAP ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update);

    // Add Lenis to GSAP Ticker
    const rafCallback = (time: number) => {
      lenisInstance.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);

    // Disable lag smoothing in GSAP to prevent jumpiness with Lenis
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Cleanup
      gsap.ticker.remove(rafCallback);
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []);

  const scrollTo = (target: string | HTMLElement | number, options?: object) => {
    lenis?.scrollTo(target, options);
  };

  const stop = () => {
    lenis?.stop();
  };

  const start = () => {
    lenis?.start();
  };

  const value = {
    lenis,
    scrollTo,
    stop,
    start
  };

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
};
