process.env.NODE_ENV = 'test';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('S-ANIM reorder animation contract', () => {
  it('index.css has reorder utilities without dead keyframes', () => {
    const css = readFileSync(resolve('src/index.css'), 'utf8');
    expect(css).not.toMatch(/reorder-move/);
    expect(css).not.toMatch(/reorder-enter/);
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

  it('CarAdmin flat list has FLIP reorder (no CarCategoryGroup)', () => {
    let grpExists = true;
    try {
      readFileSync(resolve('src/admin/CarCategoryGroup.tsx'), 'utf8');
    } catch {
      grpExists = false;
    }
    expect(grpExists).toBe(false);
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).toMatch(/useReorderAnimation/);
    expect(admin).toMatch(/data-reorder-item/);
  });

  it('flat admins have reorder-item class', () => {
    for (const f of ['FaqAdmin.tsx', 'LocationAdmin.tsx', 'RouteDataAdmin.tsx', 'RouteGroupAdmin.tsx']) {
      const content = readFileSync(resolve(`src/admin/${f}`), 'utf8');
      expect(content, f).toMatch(/reorder-item/);
    }
  });
});
