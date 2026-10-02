// @vitest-environment jsdom
// Guards the brand-identity marquee against the module-scope-static-rows bug:
// `const row1Items = [...mockupImages]` at module scope froze the 17 static
// `@/data/cars` paths, so admin edits to the `mockupImages` content key never
// reached the landing section. Both rows, the lightbox index space, and the
// row-2 reversal must be derived from the live `useData()` value instead.
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { useData } from '@/context/DataProvider';
import { mockupImages as staticMockupImages } from '@/data/cars';
import { AppShowcaseSection } from './AppShowcaseSection';

vi.mock('@/context/DataProvider', () => ({ useData: vi.fn() }));

vi.mock('@/lib/gsap', () => ({
  default: {
    fromTo: vi.fn(() => ({ kill: vi.fn(), scrollTrigger: null })),
    to: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      play: vi.fn(),
      reverse: vi.fn(),
      kill: vi.fn(),
    })),
    registerPlugin: vi.fn(),
    config: vi.fn(),
  },
  useGSAP: vi.fn(),
}));

const HOOK_IMAGES = [
  '/assets/images/mockups/live-alpha.jpeg',
  '/assets/images/mockups/live-beta.jpeg',
  '/assets/images/mockups/live-gamma.jpeg',
];

const OTHER_IMAGES = ['/assets/images/mockups/other-one.jpeg'];

function mockImages(images: string[]): void {
  vi.mocked(useData).mockReturnValue({ mockupImages: images } as never);
}

/** Distinct `src` values across every marquee row, ignoring the triple buffer repeats. */
function marqueeSources(container: HTMLElement): string[] {
  return [
    ...new Set(
      Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src') ?? ''),
    ),
  ];
}

/** Row track element — `.marquee-track` is the row contract under `.marquee-container`. */
function rows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.marquee-track'));
}

describe('AppShowcaseSection brand-identity images from useData', () => {
  it('renders every marquee row from the live useData images, not the static bundle', () => {
    mockImages([...HOOK_IMAGES]);
    const { container } = render(<AppShowcaseSection />);

    expect(rows(container)).toHaveLength(2);
    expect(marqueeSources(container).sort()).toEqual([...HOOK_IMAGES].sort());
  });

  it('does not leak static @/data/cars paths into the marquee when the hook has images', () => {
    mockImages([...HOOK_IMAGES]);
    const { container } = render(<AppShowcaseSection />);

    for (const src of marqueeSources(container)) {
      expect(staticMockupImages).not.toContain(src);
    }
  });

  it('re-renders both rows when the useData value changes', () => {
    mockImages([...HOOK_IMAGES]);
    const { container, rerender } = render(<AppShowcaseSection />);
    expect(marqueeSources(container)).toHaveLength(3);

    mockImages([...OTHER_IMAGES]);
    rerender(<AppShowcaseSection />);

    expect(marqueeSources(container)).toEqual(OTHER_IMAGES);
  });

  it('opens the lightbox on the live array index and walks that same array', () => {
    mockImages([...HOOK_IMAGES]);
    const { container } = render(<AppShowcaseSection />);

    const target = Array.from(container.querySelectorAll('img')).find(
      (img) => img.getAttribute('src') === HOOK_IMAGES[1],
    );
    if (!target) throw new Error('expected the live image to be rendered in a marquee row');
    fireEvent.click(target);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByAltText('هوية وصلني').getAttribute('src')).toBe(HOOK_IMAGES[1]);

    fireEvent.click(screen.getByLabelText('الصورة التالية'));

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByAltText('هوية وصلني').getAttribute('src')).toBe(HOOK_IMAGES[2]);
  });

  it('keeps the marquee wrapper LTR even though the page renders RTL', () => {
    mockImages([...HOOK_IMAGES]);
    const { container } = render(<AppShowcaseSection />);

    const marqueeRoot = container.querySelector('[dir="ltr"]');
    expect(marqueeRoot).not.toBeNull();
    expect(marqueeRoot?.querySelectorAll('.marquee-container')).toHaveLength(2);
  });
});