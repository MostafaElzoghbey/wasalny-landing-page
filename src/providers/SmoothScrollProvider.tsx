import React, { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react';
import Lenis from 'lenis';
import gsap, { ScrollTrigger } from '@/lib/gsap';

interface LenisContextType {
  lenis: React.RefObject<Lenis | null>;
  scrollTo: (target: string | HTMLElement | number, options?: object) => void;
  stop: () => void;
  start: () => void;
}

const LenisContext = createContext<LenisContextType>({
  lenis: { current: null },
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useLenis = () => useContext(LenisContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useLayoutEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 2.5,
    });

    lenisRef.current = lenisInstance;

    lenisInstance.on('scroll', ScrollTrigger.update);

    const rafCallback = (time: number) => {
      lenisInstance.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafCallback);
      lenisInstance.destroy();
      lenisRef.current = null;
    };
  }, []);

  const value = useMemo(() => ({
    lenis: lenisRef,
    scrollTo: (target: string | HTMLElement | number, options?: object) => {
      lenisRef.current?.scrollTo(target, options);
    },
    stop: () => { lenisRef.current?.stop(); },
    start: () => { lenisRef.current?.start(); },
  }), []);

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}
