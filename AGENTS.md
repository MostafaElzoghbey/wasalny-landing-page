# Agent Guidelines for Wasalny Landing Project

## Project Overview
React 19 + TypeScript + Vite landing page with GSAP animations, Tailwind CSS v4, and Lenis smooth scrolling.
This is a bilingual (Arabic/English) landing page for a passenger transport service in Egypt.

---

## Build & Development Commands

### Development
```bash
npm run dev              # Start Vite dev server at http://localhost:5173
```

### Building
```bash
npm run build            # TypeScript compile + Vite build (outputs to dist/)
tsc -b                   # TypeScript-only check (no bundling)
```

### Linting
```bash
npm run lint             # Run ESLint on all .ts/.tsx files
```

### Preview
```bash
npm run preview          # Preview production build locally
```

### Testing
**No test framework configured.** Tests must be added manually (Vitest recommended for Vite projects).

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Footer
│   ├── sections/        # HeroSection, ServicesSection, FleetSection, etc.
│   └── ui/              # Button, AnimatedCard, SectionHeading, ThemeToggle, PageLoader
├── context/             # ThemeContext (dark/light mode)
├── providers/           # SmoothScrollProvider (Lenis integration)
├── hooks/               # useAnimations.ts (all GSAP animation hooks)
├── lib/                 # gsap.ts (GSAP config), utils.ts (cn utility)
├── data/                # cars.ts, content.ts (static content)
├── types/               # TypeScript type definitions
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

---

## Code Style Guidelines

### General Principles
- **Strict TypeScript**: `strict: true` with `noUnusedLocals`, `noUnusedParameters` enabled
- **Modern ES2022**: Target ES2022 with ESNext modules
- **Functional Components**: React functional components with hooks only
- **No prop spreading**: Explicitly define and pass props

### Import Organization
**Order (top to bottom):**
1. React imports (`react`, `react-dom`)
2. Third-party libraries (`gsap`, `lucide-react`, `clsx`, etc.)
3. Absolute imports using `@/` aliases (`@/components/*`, `@/lib/*`, `@/hooks/*`)
4. Types (`import type { ... }`)
5. Side-effect imports (`import '@/lib/gsap'`)

**Example:**
```typescript
import { useState, useRef } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTextReveal } from '@/hooks/useAnimations';
import type { Car } from '@/types';
import '@/lib/gsap';
```

### Path Aliases
- Use `@/*` for `src/*` imports (e.g., `@/components/ui/Button`)
- Use `@assets/*` for asset imports (configured but rarely used)
- **Never use relative imports** across different directories (e.g., `../../lib/utils`)

### TypeScript Conventions
- **Interface naming**: Use PascalCase, no `I` prefix (`Car`, not `ICar`)
- **Props interfaces**: Name as `ComponentProps` (e.g., `ButtonProps`)
- **Type imports**: Use `import type` for type-only imports
- **Strict nullability**: Never use `as any`, `@ts-ignore`, or `@ts-expect-error`
- **Explicit types**: Always type function parameters and return values for hooks/utilities

### Component Structure
```typescript
// 1. Imports (organized as above)
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { ComponentProps } from './types';

// 2. Interface/type definitions
interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

// 3. Component function (named export for sections/pages, default for leaf components)
export function MyComponent({ variant = 'primary', children, className }: MyComponentProps) {
  // 4. Refs first
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 5. Custom hooks (useTextReveal, useGSAP, etc.)
  useTextReveal(containerRef);
  
  // 6. Event handlers
  const handleClick = () => { /* ... */ };
  
  // 7. JSX return
  return (
    <div ref={containerRef} className={cn('base-classes', className)}>
      {children}
    </div>
  );
}
```

### Styling Conventions
- **Tailwind CSS v4**: Use Tailwind utility classes exclusively
- **CSS Variables**: Access theme colors via `hsl(var(--variable))` (e.g., `text-[hsl(var(--foreground))]`)
- **Class merging**: Always use `cn()` utility from `@/lib/utils` for conditional classes
- **Button variants**: Use predefined classes (`btn-primary`, `btn-secondary`, `btn-accent`)
- **Dark mode**: Support via `dark:` prefix (e.g., `dark:bg-gray-800`)
- **RTL support**: Text is primarily Arabic (RTL), design accommodates both RTL/LTR

**Example:**
```typescript
className={cn(
  'base-class another-class',
  variant === 'primary' && 'btn-primary',
  disabled && 'opacity-50 cursor-not-allowed',
  className // User-provided override
)}
```

### GSAP Animation Patterns
**ALWAYS use custom hooks from `@/hooks/useAnimations.ts`:**

- `useTextReveal()` - Text split animations (words, chars, lines)
- `useGSAP()` - Direct GSAP animations with automatic cleanup
- `useFloatingAnimation()` - Continuous floating effect
- `useParallax()` - Scroll-based parallax
- `useMagneticButton()` - Magnetic cursor effect
- `useBatchReveal()` - Staggered grid/list reveals
- `useTiltEffect()` - 3D tilt on hover
- `useImageReveal()` - Clip-path image reveals

**Never:**
- Import `gsap` directly in components unless using `useGSAP` hook
- Create ScrollTriggers manually (use hooks with `scrollTrigger` options)
- Forget cleanup (hooks handle this automatically)

**Example:**
```typescript
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    if (!ref.current) return;
    
    gsap.from(ref.current, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    });
  }, { scope: ref }); // Scope ensures proper cleanup
  
  return <div ref={ref}>Content</div>;
}
```

### Error Handling
- **No try-catch for rendering**: React boundaries handle this
- **Event handlers**: Validate user input, fail gracefully
- **External calls**: Check null/undefined before accessing properties

### Naming Conventions
- **Components**: PascalCase (`HeroSection`, `Button`)
- **Hooks**: camelCase with `use` prefix (`useTextReveal`)
- **Utilities**: camelCase (`cn`, `rtlX`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_ITEMS`)
- **Files**: Match component name (`HeroSection.tsx`)

---

## State Management
- **Theme**: Context API via `ThemeContext` (light/dark mode)
- **No global state library**: Props drilling or Context for shared state
- **Local state**: `useState` for component-specific state
- **Refs**: `useRef` for DOM access and mutable values (not triggering re-renders)

---

## Animation Performance
- **Lenis**: Smooth scroll provider wraps entire app
- **GSAP ScrollTrigger**: Tied to Lenis for synchronized scroll animations
- **Lazy triggers**: Animations start at `top 85-92%` (before element fully visible)
- **Cleanup**: All hooks use `useGSAP` with scope for automatic cleanup

---

## Common Gotchas

### 1. Dark Mode CSS Variables
✅ **Correct:**
```typescript
className="text-[hsl(var(--foreground))] bg-[hsl(var(--background))]"
```
❌ **Wrong:**
```typescript
className="text-foreground bg-background" // Won't work with Tailwind v4
```

### 2. GSAP + React Strict Mode
- `useGSAP` handles React 18+ Strict Mode double-mounting
- Always provide `scope` option to prevent duplicate animations

### 3. RTL Text
- Primary content is Arabic (RTL direction)
- Use `rtlX()` helper from `@/lib/gsap` for horizontal animations
- Test both RTL and LTR layouts

### 4. Image Paths
- Images imported from `@/data/cars.ts` as URLs
- Ensure paths resolve correctly in production build

---

## Commit Guidelines
- **Format**: `type: description` (e.g., `feat: add fleet section`, `fix: button hover effect`)
- **Types**: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `perf`
- **Scope**: Keep commits atomic (one feature/fix per commit)

---

## AI Agent Instructions

### When Making Changes
1. **Read first**: Check existing implementations before creating new patterns
2. **Match style**: Follow existing component structure and naming
3. **Verify types**: Run `tsc -b` to check TypeScript errors
4. **Run lint**: `npm run lint` before committing
5. **Test animations**: Start dev server and verify GSAP animations work

### When Adding Features
1. **Check hooks**: Use existing animation hooks from `useAnimations.ts`
2. **Reuse components**: Extend `Button`, `AnimatedCard`, etc. instead of creating new ones
3. **Follow patterns**: Match existing section structure (ref management, hook usage)
4. **Update types**: Add types to `@/types/index.ts` if introducing new data structures

### When Fixing Bugs
1. **Identify scope**: Component-level vs. app-level issue
2. **Check console**: Look for TypeScript errors, GSAP warnings
3. **Verify refs**: Ensure refs are not null before accessing in animations
4. **Test dark mode**: Ensure fix works in both light and dark themes

---

**Last Updated**: 2026-01-16
