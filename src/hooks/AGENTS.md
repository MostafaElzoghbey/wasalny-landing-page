# Hooks

3 files, 12 GSAP animation hooks + 1 pricing calculator + 1 hover detection utility.

## Files

| File | Purpose |
|------|---------|
| `useAnimations.ts` | 12 GSAP animation hooks (490 lines) — the animation toolbox |
| `useHoverCapable.ts` | `canHover()` — detects fine pointer (mouse vs touch) |
| `usePricingCalculator.ts` | Pricing form state, validation, calculation logic + listens for preset events |

## Animation Hooks (`useAnimations.ts`)

| Hook | What it does | Key params |
|------|-------------|------------|
| `useTextReveal` | SplitType text animation (lines/words/chars) | `ref`, `{ type, stagger, delay, start }` |
| `useParallax` | Scroll-linked y-offset | `ref`, `speed` |
| `useMagneticButton` | Magnetic cursor attraction via `gsap.quickTo` | `ref` |
| `useScrollProgress` | Returns scroll progress 0→1 for a section | `ref` → `progress` state |
| `useCounterAnimation` | Animated number counter | `ref`, `endValue`, `{ duration, prefix, suffix }` |
| `useSectionReveal` | Staggered fade-up for section children | `ref` |
| `useFloatingAnimation` | Infinite y-axis float loop | `ref`, `{ amplitude, duration }` |
| `useScaleOnScroll` | Scale element based on scroll position | `ref`, `{ startScale, endScale }` |
| `useTiltEffect` | 3D perspective tilt on hover (mouse only) | `ref`, `{ max, speed }` |
| `useBatchReveal` | `ScrollTrigger.batch` for grid items | `containerRef`, `{ selector, stagger }` |
| `useDrawPath` | SVG path stroke animation | `ref`, `{ duration, scrub }` |
| `useImageReveal` | Clip-path reveal animation | `ref` |

## Adding a New Hook

Follow this exact pattern:

```typescript
export const useMyHook = (
  ref: React.RefObject<HTMLElement | null>,
  options: MyHookOptions = {}
) => {
  const { param = defaultValue } = options;

  useGSAP(() => {
    if (!ref.current) return;

    const tween = gsap.to(ref.current, { /* ... */ });

    return () => { tween.kill(); };
  }, { scope: ref, dependencies: [param] });
};
```

## Rules

- ALWAYS use `useGSAP` (from `@/lib/gsap`), never `useEffect`
- ALWAYS null-check `ref.current` at the top
- ALWAYS return cleanup: `tween.kill()`, `scrollTrigger?.kill()`
- Use `animConfig` presets from `@/lib/gsap` for consistent easing/duration
- Use `revealTrigger()` helper for standard scroll-triggered reveals
- Wrap x-axis values in `rtlX()` for RTL correctness
- `useTiltEffect` auto-disables on touch via `canHover()` from `useHoverCapable`
