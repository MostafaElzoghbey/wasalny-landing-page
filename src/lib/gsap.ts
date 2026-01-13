import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

// Configure GSAP
gsap.config({
  autoSleep: 60,
  nullTargetWarn: false,
});

// RTL Helper - negates x values if document is RTL
export const rtlX = (value: number): number => {
  if (typeof document === 'undefined') return value;
  return document.dir === 'rtl' ? -value : value;
};

// Check if RTL
export const isRTL = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.dir === 'rtl';
};

// Common animation configurations
export const animConfig = {
  // Easing presets
  easeOut: "power2.out",
  easeIn: "power2.in",
  easeInOut: "power2.inOut",
  elastic: "elastic.out(1, 0.3)",
  expo: "expo.out",
  
  // Stagger defaults
  stagger: {
    fast: 0.05,
    medium: 0.1,
    slow: 0.2
  },
  
  // Duration defaults
  duration: {
    fast: 0.3,
    medium: 0.6,
    slow: 1.0
  }
};

// Animation Presets
export const animations = {
  fadeInUp: {
    y: 50,
    opacity: 0,
    duration: animConfig.duration.medium,
    ease: animConfig.easeOut
  },
  fadeIn: {
    opacity: 0,
    duration: animConfig.duration.medium,
    ease: animConfig.easeOut
  },
  scaleIn: {
    scale: 0.9,
    opacity: 0,
    duration: animConfig.duration.medium,
    ease: animConfig.easeOut
  }
};

// Default ScrollTrigger config for reveal animations
export const revealTrigger = (trigger: Element | string) => ({
  trigger,
  start: "top 85%",
  toggleActions: "play none none reverse" as const,
  markers: false
});

// Batch animation helper for grids/lists
export const createBatchAnimation = (
  selector: string,
  fromVars: gsap.TweenVars,
  stagger: number = 0.1
) => {
  ScrollTrigger.batch(selector, {
    onEnter: (elements) => {
      gsap.from(elements, {
        ...fromVars,
        stagger: stagger
      });
    },
    start: "top 85%",
    once: true
  });
};

// Export gsap instance and ScrollTrigger
export { ScrollTrigger, useGSAP };
export default gsap;
