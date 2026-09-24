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

## Admin Pattern — Expandable Inline Edit (Wave 2-6, verified Wave 7)

List admins use a unified expand / inline-edit / two-step delete pattern. Extract the card to `*Card.tsx` + helpers to `*Helpers.ts` when the admin file approaches the 250 pure-LOC ceiling.

- **Card**: `CarCard`, `LocationCard`, `RouteDataCard`, `FaqCard`, `RouteGroupCard` each own `expanded` (parent-controlled), `editing` (internal), `draft` (clone of group), `confirmDelete`, `saving`, `error`. Header is a `<button data-testid="*-expand-{id}">` that toggles `expanded`. Body shows read-only summary (Edit/Delete) or edit form (Save/Cancel). Save calls `adminUpdate*` (PUT), then `onUpdated` patches parent list without reload. Cancel discards draft (re-clones from props). Delete is two-step: Delete -> Confirm/Cancel. Confirm calls `adminDelete*` then `onDeleted` removes from parent list.
- **Parent**: holds `expandedId` (single open at a time), `items[]`, `handleUpdated` (`map` replace), `handleDeleted` (`filter` + clear `expandedId` if deleted).
- **Validation**: via `carHelpers.validateCar`, `locationHelpers.validateLocation`, `routeDataHelpers.validateRouteData`, inline `FaqCard` checks. Error shown via `<ErrorText>`. Data-testid per card: `car-card-{id}`, `car-expand-{id}`, `car-edit-{id}`, `car-save-{id}`, `car-cancel-{id}`, `car-delete-{id}`, `car-delete-confirm-{id}` (same scheme for location/routedata/faq with `faq-delete`/`faq-delete-confirm` generic).
- **LOC**: `CarCard.tsx` 250, `LocationCard.tsx` 206, `RouteDataCard.tsx` 133, `FaqCard.tsx` 186 pure LOC (all ≤250). Keep under ceiling by extracting `*Helpers.ts` and `ui.tsx` primitives.

### Singleton Config — No-Change Justification (ContentAdmin, PricingConfigAdmin)

`ContentAdmin` (88 LOC) edits a single `contactInfo` object (`phone, whatsapp, email, address, facebook`) loaded via `adminGetContent('contactInfo')` and saved via `adminUpdateContent('contactInfo', info)` PATCH `/content`. `PricingConfigAdmin` (130 LOC, 116 pure) edits a singleton `whatsappNumber` string loaded via `fetchPricing()` and saved via `adminSetPricingConfig('whatsappNumber', normalized)` POST `/pricing-config`. Both render a single `<form>` with `Save Contact Info` / `Save` and inline validation (`PricingConfigAdmin` has `normalizeWhatsappNumber` + E.164 regex `^\+?[0-9]{7,15}$`, required check, help text `هذا الرقم يُستخدم للحجز عبر واتساب`, `type="tel" dir="ltr"`).

Adding card expansion here would be an anti-pattern: there is no list to expand, no per-item identity, no toggle, no two-step delete. A collapsible card around one row would add a click, hide the form by default, break the existing `Save` affordance, and duplicate the validation already on the form, all cost, no gain. The singleton save path is already the inline-edit equivalent. Intentionally no change; verified green in Wave 7.

## Admin Pattern — ChipImageOrderGrouped (Wave 8)

Adds automatic id, chip input, image dropzone, displayOrder ordering, and grouped cars view. Keeps the Wave 2-6 expand / inline-edit pattern, import order, and RTL rules.

- **Automatic id**: client generates `generateId('car')` in `src/admin/CarAdmin.tsx:51` via `src/utils/id.ts:8` (`crypto.randomUUID` sliced to 12 hex, `prefix-xxxxxxxxxxxx`). Server fallback in `server/db/queries.ts:327` (`car-${randomUUID()}`) if `input.id` is absent. Create path sends `id` in body, update path strips it (`CarCard.tsx:56`). Example: `const body: Car = { id: generateId('car'), name, ... }` then `adminCreateCar(body)`.

- **ChipInput** `src/components/ui/ChipInput.tsx:1-132`: RTL chip editor for `features`. Tokenize on `Enter`, `,`, `،`, `Tab` (`ChipInput.tsx:103`), paste splits on `/[,،\n]+/` (`ChipInput.tsx:29`, `ChipInput.tsx:114`), Backspace on empty draft removes last (`ChipInput.tsx:108`), deduped via `includes` check (`ChipInput.tsx:37`). Props: `label`, `value: string[]`, `onChange`, `placeholder`, `testId`, `error`, `disabled`. Used in `CarAdmin.tsx:109` and `CarCard.tsx:235` as `<ChipInput label="المميزات" value={features} onChange={...} placeholder="اكتب واضغط Enter" testId="chip-input-features" />`.

- **ImageDropzone** `src/components/ui/ImageDropzone.tsx`: single and multiple modes. `mode="single" | "multiple"`, `value: string | string[]`, `onChange`, `testId`, `label`, `previewPrefix`. Single emits `next[0]`, multiple emits `string[]` with no image-count cap. Validates files with `MAX_FILE_BYTES` + `ALLOWED_MIME`/`EXT_RE`, reads them via `FileReader` data URLs with `URL.revokeObjectURL` cleanup. Single mode shows the `صورة واحدة` hint; multiple mode shows no numeric cap hint. Drag reorder inside the preview grid. Used as `multiple` (unlimited) in `CarAdmin.tsx` (`testId="car-images-create"`) and `CarCard.tsx` (`testId="car-images-edit-{id}"`), and as `single` in `CarImageRow.tsx`, `RouteDataCard.tsx`, and `RouteDataAdmin.tsx`.

- **displayOrder and reorder API** `server/db/migrations/0002_add_display_order.sql:12-34` adds `display_order INTEGER NOT NULL DEFAULT 0` to `cars`, `locations`, `route_data`, `faqs`, `route_groups` and backfills `rowid` where `display_order = 0`. Queries order by `display_order ASC, id ASC` (`server/db/queries.ts:195`, `267`, `296`). `createCar` defaults to `MAX(display_order)+1` (`queries.ts:328`). `reorderEntities` in `server/db/queries.ts:714-740` is transactional, rejects duplicates, throws if id missing, sets `display_order = index`. API is `POST /reorder { ids: string[] }` via `src/data/api.ts:255-272` (`adminReorderCars`, `adminReorderLocations`, etc.) and `adminJson('POST', 'cars/reorder', { ids })`. Client does optimistic update with rollback on failure (`CarAdmin.tsx:57-60`): `setCars(next)` then `adminReorderCars(ids)` else revert and show `reorderError`.

- **Grouped Cars view** `src/admin/CarCategoryGroup.tsx:22-103` with `src/admin/CarAdmin.tsx:31-72` and `src/components/ui/ReorderControls.tsx:13-66`: five collapsible groups (one per `CAR_CATEGORIES` in `carHelpers.ts`). `CarAdmin.tsx:31` holds `expandedCategories: Set<Car['category']>` init to all open, `toggleCategory` flips (`CarAdmin.tsx:62`). `grouped` maps categories to sorted `cars.filter(...).sort(displayOrder)` (`CarAdmin.tsx:61`). Each `CarCategoryGroup` renders a header button `data-testid="car-category-{category}"` with count badge and chevron (`CarCategoryGroup.tsx:39`), body lists `ReorderControls` plus `CarCard` per row (`CarCategoryGroup.tsx:73`). `ReorderControls` shows handle `⋮⋮`, mono `displayOrder`, up/down buttons disabled at ends (`ReorderControls.tsx:31`, `46`, `55`). Reorder is arrow move (`CarAdmin.tsx:65`) or drag and drop via `dragIdRef` and `handleDrop` constrained to same category (`CarAdmin.tsx:73`). Flat `next` preserves global order via `CAR_CATEGORIES.flatMap` before `doReorder` (`CarAdmin.tsx:70`, `81`).

Import order and RTL stay strict: React, third-party, `@/` aliases, relative, CSS only at entry. `CarAdmin.tsx:1-10` respects this. RTL via `dir="rtl"` on ChipInput, ImageDropzone, ReorderControls, CarCategoryGroup, and file header.

## Architecture Notes

- **Lazy loading**: All below-fold sections use `React.lazy` in `App.tsx` with `Suspense` boundaries.
- **Lenis + GSAP sync**: `SmoothScrollProvider` adds `lenis.raf` to `gsap.ticker` and disables lag smoothing. `ScrollTrigger.update` fires on every Lenis scroll event.
- **ScrollToTop**: `App.tsx` contains a `ScrollToTop` component with `ResizeObserver` that calls `ScrollTrigger.refresh()` on content height changes.
- **Hover detection**: `useHoverCapable` → `canHover()` detects fine pointers to prevent sticky hover on touch devices. Used by `useTiltEffect`.
- **Data-driven**: Cars, routes, pricing, FAQs are served from SQLite via the Hono API at `/api/data` and `/api/pricing`. `src/data/*` is only the initial static fallback for first paint, overwritten on mount by `useData()` from `DataProvider`.
