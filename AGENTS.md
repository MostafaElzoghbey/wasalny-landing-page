# AGENTS.md - Wasalny Landing Page

**Generated:** 2026-03-05 | **Commit:** c352ddd | **Branch:** main

## Overview

React 19 + TypeScript 5.9 + Vite 7 landing page for Wasalny (وصلني) — passenger transport service in Damietta, Egypt. Arabic RTL site. GSAP for animations, Lenis for smooth scrolling, Tailwind CSS v4 for styling.

## Structure

```
src/
├── App.tsx               # Router, providers, lazy-loaded sections
├── main.tsx              # Entry point
├── index.css             # Tailwind v4 theme (@theme block, layers)
├── components/           # → has own AGENTS.md
│   ├── layout/           # Header, Footer
│   ├── sections/         # 10 page sections (barrel exported, lazy loaded)
│   ├── ui/               # 10 reusable atoms (Button, AnimatedCard, etc.)
│   ├── pricing/          # Pricing calculator sub-components
│   └── SEO/              # JsonLd structured data
├── hooks/                # → has own AGENTS.md
│   ├── useAnimations.ts  # 12 GSAP animation hooks
│   ├── useHoverCapable.ts
│   └── usePricingCalculator.ts
├── lib/
│   ├── gsap.ts           # GSAP config, plugin registration, RTL helpers, presets
│   └── utils.ts          # cn() = clsx + tailwind-merge
├── data/                 # Static content: cars, routes, pricing, FAQs, content
├── providers/            # SmoothScrollProvider (Lenis + GSAP ticker sync)
├── context/              # ThemeContext (dark/light mode)
├── pages/                # RoutePage, NotFound
├── types/                # Centralized TypeScript interfaces
└── utils/                # pricingCalculator.ts, pricingEvents.ts
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add new page section | `src/components/sections/` | Create component + add to barrel `index.ts` + lazy load in `App.tsx` |
| Add reusable UI element | `src/components/ui/` | Named export, props interface required |
| Add animation hook | `src/hooks/useAnimations.ts` | Follow existing pattern with `useGSAP` + cleanup |
| Change theme colors | `src/index.css` | `@theme` block with CSS custom properties |
| Add GSAP plugin | `src/lib/gsap.ts` | Register here, NOT in individual components |
| Update car/route data | `src/data/` | Static JSON-like TS files |
| Add new route | `src/App.tsx` | Inside `<Routes>` in `AppContent` |
| Modify smooth scroll | `src/providers/SmoothScrollProvider.tsx` | Lenis config + GSAP ticker integration |
| Add TypeScript types | `src/types/index.ts` | Centralized interfaces |

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

No test framework configured.

## Conventions

### Imports (strict order)

1. React → 2. Third-party → 3. `@/` aliases → 4. Relative → 5. CSS (entry only)

### Path Aliases

- `@/*` → `src/*`
- `@assets/*` → `assets/*`
- ALWAYS use aliases. Never `../../../`.

### TypeScript

- Strict mode. `interface` over `type` for objects. Union types for constrained values.
- Centralize interfaces in `src/types/index.ts`.

### Components

- Function declarations with named exports (not arrow + default).
- Props interface defined directly above component.
- Refs typed explicitly: `useRef<HTMLDivElement>(null)`.

### Styling

- Tailwind classes only. `cn()` for conditional classes.
- Theme via CSS custom properties: `hsl(var(--foreground))`.
- Dark mode via `dark:` prefix.

### Animations (GSAP)

- Import `ScrollTrigger`, `useGSAP` from `@/lib/gsap` — never from `gsap` directly.
- Use `useGSAP` hook (not `useEffect`) for all animation lifecycle.
- ALWAYS return cleanup: `tween.kill()`, `scrollTrigger.kill()`.
- Wrap horizontal transforms in `rtlX()` for RTL correctness.

### RTL

Arabic site. `document.dir === 'rtl'`.
- `rtlX(value)` from `@/lib/gsap` negates x-axis values.
- `.flip-rtl` CSS class flips icons via `rtl:-scale-x-100`.
- Every new horizontal animation MUST use `rtlX()`.

## Anti-Patterns

- `as any`, `@ts-ignore`, `@ts-expect-error` — forbidden
- Inline styles — use Tailwind
- `import { ScrollTrigger } from 'gsap/ScrollTrigger'` in components — use `@/lib/gsap`
- Components without TypeScript interfaces
- Missing cleanup in `useGSAP` callbacks
- `useEffect` for animations — use `useGSAP` instead
- Redundant `gsap.registerPlugin(ScrollTrigger)` in components — already in `@/lib/gsap.ts`

## Architecture Notes

- **Lazy loading**: All below-fold sections use `React.lazy` in `App.tsx` with `Suspense` boundaries.
- **Lenis + GSAP sync**: `SmoothScrollProvider` adds `lenis.raf` to `gsap.ticker` and disables lag smoothing. `ScrollTrigger.update` fires on every Lenis scroll event.
- **ScrollToTop**: `App.tsx` contains a `ScrollToTop` component with `ResizeObserver` that calls `ScrollTrigger.refresh()` on content height changes.
- **Hover detection**: `useHoverCapable` → `canHover()` detects fine pointers to prevent sticky hover on touch devices. Used by `useTiltEffect`.
- **Data-driven**: Cars, routes, pricing, FAQs stored in `src/data/` as typed TS objects — not fetched from API.
