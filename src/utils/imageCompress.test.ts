// @vitest-environment jsdom
import { type Mock, describe, expect, it, vi } from 'vitest';
import {
  JPEG_QUALITY,
  ROW_BYTE_LIMIT,
  compressImage,
  computeTargetSize,
  dataUrlExceedsRowLimit,
  isSvgFile,
  type CanvasLike,
  type DecodedImage,
} from './imageCompress';

type ToBlob = (callback: (blob: Blob | null) => void, type?: string, quality?: number) => void;

interface FakeCanvas {
  readonly canvas: CanvasLike;
  /** Every 2d-context mutation, in call order, so ordering is assertable. */
  readonly calls: readonly string[];
  readonly toBlob: Mock<ToBlob>;
}

interface FakeBitmap {
  readonly bitmap: DecodedImage;
  readonly close: Mock<() => void>;
}

function createFakeCanvas(
  options: { readonly transparentPixel?: number; readonly emittedType?: string } = {},
): FakeCanvas {
  const calls: string[] = [];
  const toBlob = vi.fn<ToBlob>((callback, type) => {
    callback(new Blob(['x'], { type: options.emittedType ?? type ?? '' }));
  });
  const canvas: CanvasLike = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillStyle: '',
      fillRect: () => { calls.push('fillRect'); },
      clearRect: () => { calls.push('clearRect'); },
      drawImage: () => { calls.push('drawImage'); },
      getImageData: (_x, _y, w, h) => {
        const data = new Uint8ClampedArray(w * h * 4).fill(255);
        if (options.transparentPixel !== undefined) data[options.transparentPixel * 4 + 3] = 0;
        return { data };
      },
    }),
    toBlob,
  };
  return { canvas, calls, toBlob };
}

function createFakeBitmap(width: number, height: number): FakeBitmap {
  const close = vi.fn<() => void>();
  return { bitmap: { width, height, close }, close };
}

const SVG_SOURCE = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';

describe('isSvgFile', () => {
  it('is true for an image/svg+xml file', () => {
    expect(isSvgFile(new File([SVG_SOURCE], 'logo.svg', { type: 'image/svg+xml' }))).toBe(true);
  });

  it('is true for an empty-type file whose name ends in .svg', () => {
    expect(isSvgFile(new File([SVG_SOURCE], 'brand/logo.svg', { type: '' }))).toBe(true);
  });

  it('is false for a png', () => {
    expect(isSvgFile(new File(['x'], 'photo.png', { type: 'image/png' }))).toBe(false);
  });
});

describe('computeTargetSize', () => {
  it('leaves a small image untouched instead of upscaling it', () => {
    expect(computeTargetSize(400, 300)).toEqual({ width: 400, height: 300 });
  });

  it('scales a landscape image down to the long edge', () => {
    expect(computeTargetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  });

  it('scales a portrait image down to the long edge', () => {
    expect(computeTargetSize(1000, 4000)).toEqual({ width: 400, height: 1600 });
  });
});

describe('dataUrlExceedsRowLimit', () => {
  it('is false for a short ascii data url', () => {
    expect(dataUrlExceedsRowLimit('data:image/jpeg;base64,AAAA')).toBe(false);
  });

  it('counts UTF-8 bytes, not UTF-16 code units', () => {
    // 1_000_001 code units of two-byte Arabic: under the char cap, over the byte cap.
    const multiByte = '\u0627'.repeat(1_000_001);
    expect(multiByte.length).toBeLessThan(ROW_BYTE_LIMIT);
    expect(dataUrlExceedsRowLimit(multiByte)).toBe(true);
  });
});

describe('compressImage', () => {
  it('returns an svg byte-identical and never decodes it', async () => {
    const file = new File([SVG_SOURCE], 'logo.svg', { type: 'image/svg+xml' });
    const decodeBitmap = vi.fn<() => Promise<DecodedImage>>();
    const createCanvas = vi.fn<(width: number, height: number) => never>(() => {
      throw new Error('an svg must never be rasterised');
    });

    const result = await compressImage(file, { decodeBitmap, createCanvas });

    expect(result.startsWith('data:image/svg+xml')).toBe(true);
    expect(atob(result.slice(result.indexOf(',') + 1))).toBe(SVG_SOURCE);
    expect(decodeBitmap).not.toHaveBeenCalled();
    expect(createCanvas).not.toHaveBeenCalled();
  });

  it('encodes an opaque image as jpeg and mattes it white', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const fake = createFakeCanvas();
    const { bitmap, close } = createFakeBitmap(8, 8);

    const result = await compressImage(file, {
      decodeBitmap: () => Promise.resolve(bitmap),
      createCanvas: (width, height) => {
        fake.canvas.width = width;
        fake.canvas.height = height;
        return fake.canvas;
      },
      blobToDataUrl: () => Promise.resolve('data:image/jpeg;base64,AAAA'),
    });

    expect(result).toBe('data:image/jpeg;base64,AAAA');
    expect(fake.toBlob.mock.calls[0]).toEqual([expect.any(Function), 'image/jpeg', JPEG_QUALITY]);
    // The photo must land ON TOP of the white matte. Filling after the draw is
    // what produced solid-white uploads, so the final operation is asserted too.
    expect(fake.calls).toEqual(['drawImage', 'clearRect', 'fillRect', 'drawImage']);
    expect(fake.calls.at(-1)).toBe('drawImage');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('encodes an image with transparency as png and leaves it unfilled', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const fake = createFakeCanvas({ transparentPixel: 0 });
    const { bitmap } = createFakeBitmap(8, 8);

    await compressImage(file, {
      decodeBitmap: () => Promise.resolve(bitmap),
      createCanvas: (width, height) => {
        fake.canvas.width = width;
        fake.canvas.height = height;
        return fake.canvas;
      },
      blobToDataUrl: () => Promise.resolve('data:image/png;base64,AAAA'),
    });

    expect(fake.toBlob.mock.calls[0]).toEqual([expect.any(Function), 'image/png']);
    expect(fake.calls).not.toContain('fillRect');
  });

  it('rejects when the encoder returns a different type than requested', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const fake = createFakeCanvas({ emittedType: 'image/png' });
    const { bitmap, close } = createFakeBitmap(8, 8);

    await expect(
      compressImage(file, {
        decodeBitmap: () => Promise.resolve(bitmap),
        createCanvas: () => fake.canvas,
        blobToDataUrl: () => Promise.resolve('data:image/png;base64,AAAA'),
      }),
    ).rejects.toThrow('تعذر ترميز الصورة');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('rejects a data url over the d1 row limit', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const fake = createFakeCanvas();
    const { bitmap } = createFakeBitmap(8, 8);

    await expect(
      compressImage(file, {
        decodeBitmap: () => Promise.resolve(bitmap),
        createCanvas: () => fake.canvas,
        blobToDataUrl: () => Promise.resolve('a'.repeat(ROW_BYTE_LIMIT + 1)),
      }),
    ).rejects.toThrow('الصورة كبيرة جدًا بعد الضغط — جرّب صورة أصغر');
  });

  it('propagates a decode failure without creating a canvas', async () => {
    const file = new File(['x'], 'broken.jpg', { type: 'image/jpeg' });
    const createCanvas = vi.fn<(width: number, height: number) => CanvasLike>();

    await expect(
      compressImage(file, {
        decodeBitmap: () => Promise.reject(new Error('صورة تالفة')),
        createCanvas,
      }),
    ).rejects.toThrow('صورة تالفة');
    expect(createCanvas).not.toHaveBeenCalled();
  });

  it('hands the original file to decodeBitmap', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const fake = createFakeCanvas();
    const { bitmap } = createFakeBitmap(8, 8);
    const decodeBitmap = vi.fn<(uploaded: Blob) => Promise<DecodedImage>>(() => Promise.resolve(bitmap));

    await compressImage(file, {
      decodeBitmap,
      createCanvas: () => fake.canvas,
      blobToDataUrl: () => Promise.resolve('data:image/jpeg;base64,AAAA'),
    });

    expect(decodeBitmap).toHaveBeenCalledTimes(1);
    expect(decodeBitmap.mock.calls[0]?.[0]).toBe(file);
  });

  it('closes the bitmap it decoded', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const fake = createFakeCanvas();
    const { bitmap, close } = createFakeBitmap(8, 8);

    await compressImage(file, {
      decodeBitmap: () => Promise.resolve(bitmap),
      createCanvas: () => fake.canvas,
      blobToDataUrl: () => Promise.resolve('data:image/jpeg;base64,AAAA'),
    });

    expect(close).toHaveBeenCalledTimes(1);
  });
});