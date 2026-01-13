import { useState, useRef } from 'react';
import gsap, { animConfig, revealTrigger } from '../lib/gsap';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface TextRevealOptions {
  type?: 'lines' | 'words' | 'chars';
  stagger?: number;
  delay?: number;
  duration?: number;
  start?: string;
  split?: 'lines' | 'words' | 'chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
}

export const useTextReveal = (
  ref: React.RefObject<HTMLElement | null>, 
  options: TextRevealOptions = {}
) => {
  const { 
    type = 'words', 
    stagger = 0.05, 
    delay = 0,
    duration = 0.8,
    start = "top 85%",
    split: splitType,
    from,
    to
  } = options;

  const actualType = splitType || type;

  useGSAP(() => {
    if (!ref.current) return;

    // Use SplitType to split text
    const split = new SplitType(ref.current, { types: actualType });
    
    // Select the elements to animate based on type
    const elements = actualType === 'chars' ? split.chars : 
                    actualType === 'words' ? split.words : 
                    split.lines;

    if (!elements || elements.length === 0) return;

    if (from || to) {
        gsap.fromTo(elements, 
            {
                y: 20,
                opacity: 0,
                ...from
            },
            {
                y: 0,
                opacity: 1,
                duration: duration,
                stagger: stagger,
                ease: animConfig.easeOut,
                delay: delay,
                scrollTrigger: {
                    trigger: ref.current,
                    start: start,
                    toggleActions: "play none none reverse"
                },
                ...to
            }
        );
    } else {
        gsap.from(elements, {
          scrollTrigger: {
            trigger: ref.current,
            start: start,
            toggleActions: "play none none reverse"
          },
          y: 20,
          opacity: 0,
          duration: duration,
          stagger: stagger,
          ease: animConfig.easeOut,
          delay: delay
        });
    }

    return () => {
      split.revert();
    };
  }, { scope: ref, dependencies: [actualType, stagger, delay, duration, start] });
};

export const useParallax = (
  ref: React.RefObject<HTMLElement | null>, 
  speed: number = 0.5
) => {
  useGSAP(() => {
    if (!ref.current) return;

    gsap.to(ref.current, {
      scrollTrigger: {
        trigger: ref.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      },
      y: () => -speed * ScrollTrigger.maxScroll(window) * 0.1, // Simple parallax calc
      ease: "none"
    });
  }, { scope: ref, dependencies: [speed] });
};

export const useMagneticButton = (
  ref: React.RefObject<HTMLElement | null>,
  strength: number = 0.5
) => {
  useGSAP(() => {
    if (!ref.current) return;

    const xTo = gsap.quickTo(ref.current, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(ref.current, "y", { duration: 0.5, ease: "power3" });
    const el = ref.current;

    const mouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (clientX - (left + width / 2)) * strength;
      const y = (clientY - (top + height / 2)) * strength;
      
      xTo(x);
      yTo(y);
    };

    const mouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", mouseMove);
    el.addEventListener("mouseleave", mouseLeave);

    return () => {
      el.removeEventListener("mousemove", mouseMove);
      el.removeEventListener("mouseleave", mouseLeave);
    };
  }, { scope: ref });
};

export const useScrollProgress = (ref: React.RefObject<HTMLElement | null>) => {
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    if (!ref.current) return;

    ScrollTrigger.create({
      trigger: ref.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setProgress(self.progress);
      }
    });
  }, { scope: ref });

  return progress;
};

interface CounterOptions {
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  ease?: string;
  scrollTrigger?: ScrollTrigger.Vars;
}

export const useCounterAnimation = (
  ref: React.RefObject<HTMLElement | null>,
  endValue: number,
  options: CounterOptions = {}
) => {
  useGSAP(() => {
    if (!ref.current) return;

    const { duration = 2, delay = 0, prefix = '', suffix = '', ease = "power2.out", scrollTrigger } = options;
    const obj = { value: 0 };

    gsap.to(obj, {
      value: endValue,
      duration: duration,
      delay: delay,
      ease: ease,
      scrollTrigger: scrollTrigger || revealTrigger(ref.current),
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.floor(obj.value)}${suffix}`;
        }
      }
    });
  }, { scope: ref, dependencies: [endValue] });
};

// Hook for standard section reveal
export const useSectionReveal = (
  ref: React.RefObject<HTMLElement | null>,
  stagger: number = 0.1
) => {
  useGSAP(() => {
    if (!ref.current) return;
    
    // Select all direct children or specific elements if needed
    const children = ref.current.children;
    
    if (children.length === 0) return;

    gsap.from(children, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: stagger,
      ease: animConfig.easeOut,
      scrollTrigger: {
        trigger: ref.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  }, { scope: ref });
};

// Hook for floating animation (replaces framer motion float)
export const useFloatingAnimation = (
  ref: React.RefObject<HTMLElement | null>,
  options: { amplitude?: number; duration?: number } = {}
) => {
  const { amplitude = 15, duration = 3 } = options;

  useGSAP(() => {
    if (!ref.current) return;

    gsap.to(ref.current, {
      y: -amplitude,
      duration: duration,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  }, { scope: ref, dependencies: [amplitude, duration] });
};

// Hook for scale on scroll (0 to 1 as element enters viewport)
export const useScaleOnScroll = (
  ref: React.RefObject<HTMLElement | null>,
  options: { startScale?: number; endScale?: number } = {}
) => {
  const { startScale = 0.8, endScale = 1 } = options;

  useGSAP(() => {
    if (!ref.current) return;

    gsap.fromTo(ref.current, 
      { scale: startScale, opacity: 0 },
      {
        scale: endScale,
        opacity: 1,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          end: "top 50%",
          scrub: 1
        }
      }
    );
  }, { scope: ref, dependencies: [startScale, endScale] });
};

interface TiltOptions {
  max?: number;
  speed?: number;
  glare?: boolean;
}

// Hook for 3D tilt effect on cards
export const useTiltEffect = (
    ref: React.RefObject<HTMLElement | null>,
    options: TiltOptions = {}
) => {
  const { max = 15, speed = 400 } = options;

  useGSAP(() => {
    if (!ref.current) return;
    
    const el = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      gsap.to(el, {
        rotationY: x * max,
        rotationX: -y * max,
        transformPerspective: 1000,
        duration: speed / 1000, // convert ms to s for gsap
        ease: "power2.out"
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(el, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    };
    
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: ref, dependencies: [max, speed] });
};

interface BatchRevealOptions {
  selector: string;
  interval?: number;
  stagger?: number;
  y?: number;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
}

// Hook for staggered batch reveal (for grids)
export const useBatchReveal = (
  options: BatchRevealOptions
): [React.RefObject<HTMLDivElement | null>] => {
  const { selector, interval = 0.1, stagger, y = 30, from, to } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  // Backwards compatibility for stagger vs interval
  const actualStagger = stagger !== undefined ? stagger : interval;
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    const items = containerRef.current.querySelectorAll(selector);
    if (items.length === 0) return;
    
    if (from || to) {
        gsap.fromTo(items, 
            {
                y: y,
                opacity: 0,
                ...from
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: actualStagger,
                ease: animConfig.easeOut,
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                },
                ...to
            }
        );
    } else {
        gsap.from(items, {
            y: y,
            opacity: 0,
            duration: 0.6,
            stagger: actualStagger,
            ease: animConfig.easeOut,
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });
    }
  }, { scope: containerRef, dependencies: [selector, actualStagger, y] });

  return [containerRef];
};

// Hook for draw SVG path animation
export const useDrawPath = (
  ref: React.RefObject<SVGPathElement | null>,
  options: { duration?: number; scrub?: boolean } = {}
) => {
  const { duration = 2, scrub = false } = options;

  useGSAP(() => {
    if (!ref.current) return;
    
    const path = ref.current;
    const length = path.getTotalLength();
    
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length
    });
    
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: scrub ? 1 : duration,
      ease: scrub ? "none" : "power2.inOut",
      scrollTrigger: {
        trigger: path,
        start: "top 80%",
        end: scrub ? "bottom 20%" : undefined,
        scrub: scrub,
        toggleActions: scrub ? undefined : "play none none reverse"
      }
    });
  }, { scope: ref, dependencies: [duration, scrub] });
};

// Hook for image reveal with clip-path
export const useImageReveal = (
  ref: React.RefObject<HTMLElement | null>,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom'
) => {
  useGSAP(() => {
    if (!ref.current) return;
    
    const clips = {
      left: { from: 'inset(0 100% 0 0)', to: 'inset(0 0% 0 0)' },
      right: { from: 'inset(0 0 0 100%)', to: 'inset(0 0 0 0%)' },
      top: { from: 'inset(100% 0 0 0)', to: 'inset(0% 0 0 0)' },
      bottom: { from: 'inset(0 0 100% 0)', to: 'inset(0 0 0% 0)' }
    };
    
    gsap.fromTo(ref.current,
      { clipPath: clips[direction].from },
      {
        clipPath: clips[direction].to,
        duration: 1,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, { scope: ref, dependencies: [direction] });
};
