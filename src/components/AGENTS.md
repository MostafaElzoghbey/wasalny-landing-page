# Components

10 page sections, 10 UI atoms, 3 pricing sub-components, 2 layout shells, 1 SEO component.

## Structure

```
components/
├── layout/           # Page-level structure
│   ├── Header.tsx    # Nav, mobile menu, theme toggle, scroll-aware opacity
│   └── Footer.tsx    # Links, social, copyright
├── sections/         # Full-width page blocks (barrel exported via index.ts)
│   ├── HeroSection.tsx
│   ├── ServicesSection.tsx
│   ├── FleetSection.tsx
│   ├── AppShowcaseSection.tsx
│   ├── RoutesSection.tsx
│   ├── PricingCalculator.tsx
│   ├── FeaturesSection.tsx
│   ├── FAQSection.tsx
│   ├── CTASection.tsx
│   └── MapEmbed.tsx
├── ui/               # Reusable atoms
│   ├── Button.tsx          # Magnetic effect, variants, sizes
│   ├── AnimatedCard.tsx    # GSAP-powered card with hover tilt
│   ├── SectionHeading.tsx  # Consistent section title + subtitle
│   ├── CustomSelect.tsx    # Styled dropdown
│   ├── FloatingCTA.tsx     # Fixed-position WhatsApp CTA
│   ├── PageLoader.tsx      # Initial page load animation
│   ├── OptimizedImage.tsx  # Lazy-loaded responsive images
│   ├── PriceBreakdown.tsx  # Pricing detail display
│   ├── ServiceSelector.tsx # Service type picker
│   └── ThemeToggle.tsx     # Dark/light mode switch
├── pricing/          # PricingCalculator sub-components
│   ├── DateTimeCard.tsx
│   ├── RouteSelectionCard.tsx
│   └── VehicleCard.tsx
└── SEO/
    └── JsonLd.tsx    # Schema.org structured data
```

## Adding a Section

1. Create `src/components/sections/YourSection.tsx` with named export
2. Add to barrel: `export { YourSection } from './YourSection';` in `index.ts`
3. Lazy load in `App.tsx`: `const YourSection = lazy(() => import(...).then(...))`
4. Place inside appropriate `<Suspense>` boundary in `HomePage`

## Adding a UI Component

1. Create `src/components/ui/YourComponent.tsx`
2. Define props interface directly above component
3. Use named export (not default)
4. Use `cn()` for conditional Tailwind classes

## Patterns

- **Sections**: Each receives no props (data from `@/data/`). Self-contained with own animations. Service cards in `ServicesSection` use custom events to trigger actions in other sections.
- **UI atoms**: Props-driven, reusable. No direct data imports.
- **Animations**: Use hooks from `@/hooks/useAnimations.ts` — not inline GSAP in components.
- **Inter-Component Events**: Use `dispatchPricingPreset` from `@/utils/pricingEvents.ts` for cross-section communication (e.g., Services → Pricing).
- **Barrel exports**: Only `sections/` uses barrel. UI components import directly.

## Anti-Patterns

- Default exports — use named exports only
- Inline GSAP setup — use animation hooks or `useGSAP` with cleanup
- Direct data fetching — this is a static site, data lives in `@/data/`
- Importing `ScrollTrigger` from `gsap/ScrollTrigger` — use `@/lib/gsap`
