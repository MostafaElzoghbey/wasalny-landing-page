# AGENTS.md - Wasalny Landing Page

## Project Overview

React 19 + TypeScript + Vite landing page for Wasalny (وصلني) - a transportation service in Damietta, Egypt. Uses GSAP for animations, Lenis for smooth scrolling, and Tailwind CSS v4 for styling.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server

# Build
npm run build        # TypeScript check + Vite production build

# Lint
npm run lint         # ESLint on all files

# Preview
npm run preview      # Preview production build locally
```

**Note**: No test framework is configured. No single-test commands available.

## Tech Stack

- **Framework**: React 19 with TypeScript 5.9
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Animations**: GSAP + @gsap/react + ScrollTrigger
- **Smooth Scroll**: Lenis
- **Icons**: lucide-react
- **Utilities**: clsx, tailwind-merge

## Project Structure

```
src/
├── components/
│   ├── layout/       # Header, Footer
│   ├── sections/     # Page sections (Hero, Features, Fleet, etc.)
│   └── ui/           # Reusable UI components (Button, AnimatedCard, etc.)
├── context/          # React contexts (ThemeContext)
├── providers/        # Providers (SmoothScrollProvider with Lenis)
├── hooks/            # Custom hooks (useAnimations with GSAP)
├── lib/              # Utilities (gsap.ts config, utils.ts with cn())
├── data/             # Static data (cars.ts, content.ts)
└── types/            # TypeScript interfaces
```

## Code Style Guidelines

### Imports

Order imports as follows:
1. React imports
2. Third-party libraries
3. Path aliases (`@/...`)
4. Relative imports
5. CSS imports (in entry files only)

```typescript
import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
```

### Path Aliases

Always use path aliases defined in tsconfig:
- `@/*` → `src/*`
- `@assets/*` → `assets/*`

```typescript
// Good
import { Button } from '@/components/ui/Button';

// Bad
import { Button } from '../../../components/ui/Button';
```

### TypeScript

- **Strict mode enabled** - no implicit any, strict null checks
- Use explicit interface definitions in `src/types/index.ts`
- Prefer `interface` over `type` for object shapes
- Use union types for constrained values: `'sedan' | 'suv' | 'family_cruiser'`

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Components

- Use **function declarations** with named exports
- Props interface defined above component
- Refs typed explicitly: `useRef<HTMLElement>(null)`

```typescript
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  // ...
}
```

### Styling

- Use Tailwind CSS classes exclusively
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- CSS custom properties for theme colors: `hsl(var(--foreground))`
- Dark mode via `dark:` prefix

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'px-4 py-2 rounded-xl',
  variant === 'primary' && 'btn-primary',
  disabled && 'opacity-50 cursor-not-allowed'
)} />
```

### Animations (GSAP)

- Register plugins in `src/lib/gsap.ts` (imported in App.tsx)
- Use `useGSAP` hook from `@gsap/react` for React integration
- Custom animation hooks in `src/hooks/useAnimations.ts`
- Always provide cleanup in useGSAP callbacks

```typescript
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

useGSAP(() => {
  gsap.to(ref.current, { opacity: 1 });
}, { scope: containerRef, dependencies: [dep] });
```

Available custom hooks:
- `useTextReveal` - Split text animation
- `useParallax` - Parallax scrolling
- `useMagneticButton` - Magnetic hover effect
- `useBatchReveal` - Staggered grid reveal
- `useFloatingAnimation` - Continuous float animation
- `useTiltEffect` - 3D tilt on hover

### Naming Conventions

- **Components**: PascalCase (`HeroSection.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAnimations.ts`)
- **Utilities**: camelCase (`utils.ts`)
- **Data files**: camelCase (`content.ts`)
- **Types**: PascalCase interfaces (`interface Car {}`)

### Error Handling

- Use optional chaining: `ref.current?.method()`
- Early returns for null refs in hooks
- Cleanup event listeners in useGSAP return

```typescript
useGSAP(() => {
  if (!ref.current) return;
  
  const handler = () => {};
  el.addEventListener('click', handler);
  
  return () => el.removeEventListener('click', handler);
}, { scope: ref });
```

### RTL Support

This is an Arabic (RTL) website. Use RTL helpers from `src/lib/gsap.ts`:

```typescript
import { rtlX, isRTL } from '@/lib/gsap';

// Negate x values for RTL
gsap.to(el, { x: rtlX(100) });
```

## Barrel Exports

Sections use barrel export in `src/components/sections/index.ts`:

```typescript
export { HeroSection } from './HeroSection';
export { ServicesSection } from './ServicesSection';
// ...
```

## ESLint Rules

- TypeScript recommended rules
- React Hooks rules (dependencies, rules of hooks)
- React Refresh rules for Vite HMR

## Do Not

- Use `as any` or `@ts-ignore`
- Use inline styles (use Tailwind classes)
- Import from `gsap` directly for ScrollTrigger (use `@/lib/gsap`)
- Create components without proper TypeScript interfaces
- Skip cleanup functions in animation hooks
