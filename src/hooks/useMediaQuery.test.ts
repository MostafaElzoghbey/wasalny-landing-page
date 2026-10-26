// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { createElement } from 'react';

import { useMediaQuery } from './useMediaQuery';

const QUERY = '(min-width: 1024px)';

const realMatchMedia = window.matchMedia;

interface FakeState {
  matches: boolean;
}

class FakeMediaQueryList {
  onchange = null;
  media: string;
  private listeners = new Set<() => void>();

  constructor(
    private readonly state: FakeState,
    media: string,
  ) {
    this.media = media;
  }

  get matches(): boolean {
    return this.state.matches;
  }

  addEventListener(_type: string, cb: () => void): void {
    this.listeners.add(cb);
  }

  removeEventListener(_type: string, cb: () => void): void {
    this.listeners.delete(cb);
  }

  addListener(): void {}

  removeListener(): void {}

  dispatchEvent(): boolean {
    return false;
  }

  emit(): void {
    this.listeners.forEach((cb) => cb());
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

const state: FakeState = { matches: false };
const created: FakeMediaQueryList[] = [];

function installMatchMedia(): void {
  // Real browsers return the same MediaQueryList for a given query, so the fake
  // caches per query too. Otherwise the hook's getSnapshot and subscribe calls
  // would each get a different object and never share listeners.
  const cache = new Map<string, FakeMediaQueryList>();
  window.matchMedia = ((query: string) => {
    const existing = cache.get(query);
    if (existing) return existing;
    const mql = new FakeMediaQueryList(state, query);
    cache.set(query, mql);
    created.push(mql);
    return mql;
  }) as unknown as typeof window.matchMedia;
}

function setMatches(next: boolean): void {
  state.matches = next;
  act(() => {
    created.forEach((mql) => mql.emit());
  });
}

let seen: boolean[] = [];

function Probe() {
  seen.push(useMediaQuery(QUERY));
  return null;
}

beforeEach(() => {
  seen = [];
  created.length = 0;
  state.matches = false;
  installMatchMedia();
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

describe('useMediaQuery', () => {
  it('reports false when the query does not match', () => {
    render(createElement(Probe));
    expect(seen[0]).toBe(false);
  });

  it('reports true when the query matches', () => {
    state.matches = true;
    render(createElement(Probe));
    expect(seen[0]).toBe(true);
  });

  it('re-renders when the query starts matching later', () => {
    render(createElement(Probe));
    expect(seen[0]).toBe(false);
    setMatches(true);
    expect(seen[seen.length - 1]).toBe(true);
  });

  it('re-renders when the query stops matching later', () => {
    state.matches = true;
    render(createElement(Probe));
    expect(seen[0]).toBe(true);
    setMatches(false);
    expect(seen[seen.length - 1]).toBe(false);
  });

  it('subscribes while mounted and unsubscribes on unmount', () => {
    const { unmount } = render(createElement(Probe));
    expect(created[0]?.listenerCount).toBe(1);
    unmount();
    expect(created[0]?.listenerCount).toBe(0);
  });

  it('passes the query string through to matchMedia', () => {
    render(createElement(Probe));
    expect(created[0]?.media).toBe(QUERY);
  });

  it('degrades to false when matchMedia is unavailable', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    render(createElement(Probe));
    expect(seen[0]).toBe(false);
  });
});
