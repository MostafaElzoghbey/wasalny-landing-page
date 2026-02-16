# Visual Enhancement & Best Practices Plan

## 1. Visual Analysis
- **Current Style**: Modern, clean, using Tailwind CSS and GSAP animations.
- **Strengths**: Good layout, interactive elements (carousel, lightbox).
- **Improvements**: Could use more refined typography, micro-interactions, and consistent spacing.

## 2. Aesthetics & Polish

### A. Typography
- **Consolidate**: Ensure consistent font usage (Cairo/Inter).
- **Hierarchy**: Check heading sizes and line heights for better readability on mobile.

### B. Micro-interactions
- **Buttons**: Add subtle hover states (scale, brightness, shadow).
- **Cards**: Add lift-on-hover effects.
- **Links**: Add underline animations.

### C. Layout & Spacing
- **Whitespace**: Increase padding between sections for better breathing room.
- **Consistency**: Use a spacing scale (e.g., `gap-4`, `gap-8`, `gap-12`).

### D. Dark Mode
- **Review**: Ensure all text has sufficient contrast in dark mode.
- **Palette**: Use a dedicated dark mode color palette if needed (e.g., slate-900 instead of pure black).

## 3. Accessibility (A11y)
- **Alt Text**: Ensure all images have meaningful `alt` attributes.
- **Focus States**: Ensure all interactive elements have visible focus rings.
- **Contrast**: Verify text contrast ratios (aim for WCAG AA).
- **Semantic HTML**: Verify proper use of `<section>`, `<article>`, `<main>`, `<header>`, `<footer>`.

## 4. Performance (Core Web Vitals)
- **LCP**: Optimize hero image loading (preload, correct sizing).
- **CLS**: Ensure all images have explicit `width` and `height` attributes (or aspect-ratio CSS) to prevent layout shifts.
- **FID/INP**: Minimize long tasks on the main thread (defer heavy JS).

## 5. Security Best Practices
- **Rel attributes**: Ensure external links use `rel="noopener noreferrer"`.
- **Dependencies**: Audit `package.json` for outdated or vulnerable packages.

## 6. Implementation Steps
1.  **Refine Typography**: Update `tailwind.config.js` or `index.css`.
2.  **Enhance Buttons**: Create/Update `Button.tsx` with new variants/animations.
3.  **Audit Accessibility**: Run Lighthouse or axe-core.
4.  **Fix Layout Shifts**: Add dimensions to all images.
