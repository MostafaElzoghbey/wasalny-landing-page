// Shared Vitest setup. Registers jest-dom matchers (toBeInTheDocument, etc.)
// for component tests and cleans up between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Functional canvas doubles so the real `compressImage`
// (`src/utils/imageCompress.ts`) runs end-to-end in jsdom. Plain writable
// properties: override per test with `vi.stubGlobal` / `vi.spyOn`, or bypass
// them by injecting `deps`, which is what that module's tests do.
if (typeof window !== 'undefined') {
  globalThis.createImageBitmap = (() =>
    Promise.resolve({
      width: 100,
      height: 75,
      close: (): void => {},
    })) as unknown as typeof globalThis.createImageBitmap;

  const canvasProto = window.HTMLCanvasElement.prototype;
  // The fake 2D context is structurally different from CanvasRenderingContext2D, so bridge with `as unknown as`.
  canvasProto.getContext = (() => ({
    fillStyle: '',
fillRect: (): void => {},
      clearRect: (): void => {},
      drawImage: (): void => {},
    getImageData: (_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4);
      // Report transparency so `compressImage` takes the PNG branch.
      if (data.length >= 4) data[3] = 0;
      return { data };
    },
  })) as unknown as typeof canvasProto.getContext;
  canvasProto.toBlob = (callback: BlobCallback, type?: string): void => {
    callback(new Blob(['x'], { type: type ?? 'image/png' }));
  };
}

afterEach(() => {
  cleanup();
});
