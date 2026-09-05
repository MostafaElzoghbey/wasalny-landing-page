process.env.NODE_ENV = 'test';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('S-ANIM reorder animation contract', () => {
  it('index.css has reorder keyframes and utilities', () => {
    const css = readFileSync(resolve('src/index.css'), 'utf8');
    expect(css).toMatch(/reorder-move/);
    expect(css).toMatch(/reorder-item/);
    expect(css).toMatch(/prefers-reduced-motion/);
  });

  it('gsap lib registers Flip', () => {
    const gsapLib = readFileSync(resolve('src/lib/gsap.ts'), 'utf8');
    expect(gsapLib).toMatch(/Flip/);
    expect(gsapLib).toMatch(/registerPlugin.*Flip/);
  });

  it('useReorderAnimation hook exists', () => {
    const hook = readFileSync(resolve('src/hooks/useReorderAnimation.ts'), 'utf8');
    expect(hook).toMatch(/Flip/);
    expect(hook).toMatch(/getState|from/);
  });

  it('ReorderControls has transition and dragging polish', () => {
    const rc = readFileSync(resolve('src/components/ui/ReorderControls.tsx'), 'utf8');
    expect(rc).toMatch(/transition/);
    expect(rc).toMatch(/reorder-item|dragging|scale/);
  });

  it('CarCategoryGroup has expand animation and FLIP', () => {
    const grp = readFileSync(resolve('src/admin/CarCategoryGroup.tsx'), 'utf8');
    expect(grp).toMatch(/reorder-item|useReorderAnimation|Flip/);
  });

  it('flat admins have reorder-item class', () => {
    for (const f of ['FaqAdmin.tsx', 'LocationAdmin.tsx', 'RouteDataAdmin.tsx', 'RouteGroupAdmin.tsx']) {
      const content = readFileSync(resolve(`src/admin/${f}`), 'utf8');
      expect(content, f).toMatch(/reorder-item/);
    }
  });
});
