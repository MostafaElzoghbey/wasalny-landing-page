import type { RouteType } from '@/data/pricing';

export interface PricingPreset {
    routeType: RouteType;
    fromLocation?: string;
    toLocation?: string;
}

const EVENT_NAME = 'wasalny:pricing-preset';

/**
 * Dispatch a pricing preset event to pre-fill the pricing calculator.
 */
export function dispatchPricingPreset(preset: PricingPreset): void {
    document.dispatchEvent(
        new CustomEvent<PricingPreset>(EVENT_NAME, { detail: preset })
    );
}

/**
 * Subscribe to pricing preset events. Returns an unsubscribe function.
 */
export function subscribePricingPreset(
    callback: (preset: PricingPreset) => void
): () => void {
    const handler = (e: Event) => {
        callback((e as CustomEvent<PricingPreset>).detail);
    };
    document.addEventListener(EVENT_NAME, handler);
    return () => document.removeEventListener(EVENT_NAME, handler);
}
