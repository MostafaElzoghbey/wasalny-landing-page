import { useCallback, useLayoutEffect, useRef } from 'react';
import { Flip } from '@/lib/gsap';
import { animConfig } from '@/lib/gsap';

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useReorderAnimation(depsKey: string) {
  const ref = useRef<HTMLUListElement | null>(null);
  const prevStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const capture = useCallback(() => {
    if (prefersReduced()) {
      prevStateRef.current = null;
      return;
    }
    const el = ref.current;
    if (!el) {
      prevStateRef.current = null;
      return;
    }
    const children = el.querySelectorAll('[data-reorder-item]');
    if (children.length === 0) {
      prevStateRef.current = null;
      return;
    }
    prevStateRef.current = Flip.getState(children);
  }, []);

  useLayoutEffect(() => {
    if (prefersReduced()) return;
    const state = prevStateRef.current;
    if (!state) return;
    prevStateRef.current = null;
    Flip.from(state, {
      duration: 0.3,
      ease: 'power2.inOut',
      absolute: true,
      scale: true,
      simple: true,
      stagger: 0.03,
      targets: '.reorder-item',
      prune: true,
      clearProps: 'all',
    });
  }, [depsKey]);

  return { ref, capture } as const;
}

export function useExpandCollapse(expanded: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    import('gsap').then(({ default: gsap }) => {
      if (expanded) {
        gsap.fromTo(
          el,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.28, ease: animConfig.easeOut, clearProps: 'all' },
        );
      }
    });
  }, [expanded]);

  return ref;
}
