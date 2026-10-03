import { useEffect, useRef } from 'react';

import type { Car } from '@/types';

type DrilldownCategory = Car['category'];

interface DrilldownHistoryMarker {
  namespace: 'car-drilldown';
  category: DrilldownCategory;
}

interface CategoryDrilldownTransitions {
  enterCategory: (category: DrilldownCategory) => void;
  exitToGrid: () => void;
}

interface CategoryDrilldownHistory {
  recordDrilldownEntry: (category: DrilldownCategory) => void;
  consumeDrilldownEntry: () => void;
}

const DRILLDOWN_MARKER_NAMESPACE = 'car-drilldown';

function isDrilldownMarker(value: unknown): value is DrilldownHistoryMarker {
  if (typeof value !== 'object' || value === null) return false;
  if (!('namespace' in value) || !('category' in value)) return false;
  return value.namespace === DRILLDOWN_MARKER_NAMESPACE && typeof value.category === 'string';
}

function readDrilldownMarker(state: unknown): DrilldownHistoryMarker | null {
  if (!isDrilldownMarker(state)) return null;
  return state;
}

function pushDrilldownMarker(category: DrilldownCategory): void {
  const marker: DrilldownHistoryMarker = { namespace: DRILLDOWN_MARKER_NAMESPACE, category };
  window.history.pushState(marker, '');
}

export function useCategoryDrilldownHistory(transitions: CategoryDrilldownTransitions): CategoryDrilldownHistory {
  const transitionsRef = useRef(transitions);
  const hasPushedRef = useRef(false);
  const deferredRef = useRef<DrilldownCategory | null>(null);

  useEffect(() => {
    transitionsRef.current = transitions;
  });

  useEffect(() => {
    function handlePopState(event: PopStateEvent): void {
      const marker = readDrilldownMarker(event.state);
      if (marker === null) {
        const deferred = deferredRef.current;
        deferredRef.current = null;
        if (deferred !== null) {
          pushDrilldownMarker(deferred);
          hasPushedRef.current = true;
          return;
        }
        hasPushedRef.current = false;
        transitionsRef.current.exitToGrid();
        return;
      }
      deferredRef.current = null;
      hasPushedRef.current = true;
      transitionsRef.current.enterCategory(marker.category);
    }
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function recordDrilldownEntry(category: DrilldownCategory): void {
    if (!hasPushedRef.current && isDrilldownMarker(window.history.state)) {
      deferredRef.current = category;
      return;
    }
    pushDrilldownMarker(category);
    hasPushedRef.current = true;
  }

  function consumeDrilldownEntry(): void {
    deferredRef.current = null;
    if (!hasPushedRef.current) return;
    hasPushedRef.current = false;
    window.history.back();
  }

  return { recordDrilldownEntry, consumeDrilldownEntry };
}
