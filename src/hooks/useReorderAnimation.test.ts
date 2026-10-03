// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Flip } from '@/lib/gsap';
import { useReorderAnimation } from './useReorderAnimation';

vi.mock('@/lib/gsap', () => ({
  Flip: {
    getState: vi.fn(() => ({})),
    from: vi.fn(),
  },
  animConfig: {
    easeOut: 'power2.out',
    easeIn: 'power2.in',
    easeInOut: 'power2.inOut',
    duration: { fast: 0.3, medium: 0.6, slow: 1.0 },
    stagger: { fast: 0.05, medium: 0.1, slow: 0.2 },
  },
  gsap: {},
}));

function createMatchMedia(matches: boolean): (query: string) => MediaQueryList {
  return (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

function runReorderFlow(depsKey: string): void {
  const { result, rerender } = renderHook(
    ({ key }: { key: string }) => useReorderAnimation(key),
    { initialProps: { key: depsKey } },
  );

  const ul = document.createElement('ul');
  depsKey.split(',').forEach(() => {
    const li = document.createElement('li');
    li.setAttribute('data-reorder-item', '');
    ul.appendChild(li);
  });
  result.current.ref.current = ul;
  result.current.capture();
  rerender({ key: `${depsKey},extra` });
}

beforeEach(() => {
  window.matchMedia = createMatchMedia(false);
  vi.clearAllMocks();
});

describe('useReorderAnimation corrected Flip contract', () => {
  it('calls Flip.from with duration 0.3', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'duration must stay 0.3 (animConfig.duration.fast)').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: 0.3 }),
    );
  });

  it('uses power2.inOut ease for a smooth reorder', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'ease must be power2.inOut, not power2.out').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ease: 'power2.inOut' }),
    );
  });

  it('uses absolute: true so items animate from their old position', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'absolute must be true, not false').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ absolute: true }),
    );
  });

  it('uses scale: true so items scale during the flip', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'scale must be true').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ scale: true }),
    );
  });

  it('uses simple: true for a lightweight flip', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'simple must be true').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ simple: true }),
    );
  });

  it('uses stagger 0.03 for a cascading reorder', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'stagger must be 0.03, not 0.02').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ stagger: 0.03 }),
    );
  });

  it('targets .reorder-item so only reorder items animate', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'targets must be ".reorder-item"').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ targets: '.reorder-item' }),
    );
  });

  it('clears inline props with clearProps: all after the flip', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'clearProps must be "all"').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clearProps: 'all' }),
    );
  });

  it('keeps prune: true so stale Flip states are discarded', () => {
    runReorderFlow('a,b,c');
    expect(Flip.from, 'prune must stay true').toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ prune: true }),
    );
  });

  it('skips Flip entirely when prefers-reduced-motion is set', () => {
    window.matchMedia = createMatchMedia(true);
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useReorderAnimation(key),
      { initialProps: { key: 'a,b,c' } },
    );

    const ul = document.createElement('ul');
    const li = document.createElement('li');
    li.setAttribute('data-reorder-item', '');
    ul.appendChild(li);
    result.current.ref.current = ul;
    result.current.capture();
    rerender({ key: 'a,b,c,d' });

    expect(Flip.getState, 'getState must be skipped under reduced motion').not.toHaveBeenCalled();
    expect(Flip.from, 'from must be skipped under reduced motion').not.toHaveBeenCalled();
  });
});