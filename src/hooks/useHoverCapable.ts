/**
 * Detects whether the device has a hover-capable pointer (mouse/trackpad).
 * Returns false on touch-only devices (phones/tablets) to prevent
 * sticky hover states and unnecessary GSAP hover animations.
 */
export function canHover(): boolean {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
