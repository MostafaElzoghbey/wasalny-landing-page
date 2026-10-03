/**
 * Browser-side image compression for admin uploads.
 *
 * WHY THIS EXISTS
 * `ImageDropzone` used to read every upload straight into a base64 data URL. A
 * 3MB phone photo becomes a ~4MB string, which D1 rejects at request time
 * ("Maximum string, BLOB or table row size | 2,000,000 bytes"). Decoding into a
 * canvas, re-encoding as JPEG, and returning the result as a data URL keeps a
 * typical upload at ~13% of the row instead of 200% of it.
 *
 * SOURCE — https://developers.cloudflare.com/d1/platform/limits/
 */

/** Longest edge kept after downscaling; above this the payload is wasted bytes. */
export const MAX_LONG_EDGE_PX = 1600;
export const JPEG_QUALITY = 0.78;
/** Budget a single compressed image is sized against. Not a hard stop: PNG has no
 *  quality knob, so a legitimately large transparent image must still upload. */
export const TARGET_BYTES = 200 * 1024;
/** D1 "Maximum string, BLOB or table row size | 2,000,000 bytes (2 MB)". */
export const ROW_BYTE_LIMIT = 2_000_000;
export const SVG_MIME = 'image/svg+xml';

const PNG_MIME = 'image/png';
const JPEG_MIME = 'image/jpeg';
const SVG_NAME_RE = /\.svg(\?.*)?$/i;
/** Both encode failures read the same to the admin; one string keeps them aligned. */
const ENCODE_FAILED = 'تعذر ترميز الصورة';

export interface DecodedImage {
  readonly width: number;
  readonly height: number;
  close?: () => void;
}

export interface Canvas2DLike {
  fillStyle: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  drawImage(source: DecodedImage, dx: number, dy: number, dw: number, dh: number): void;
  getImageData(x: number, y: number, w: number, h: number): { readonly data: Uint8ClampedArray };
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(contextId: '2d'): Canvas2DLike | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

export interface CompressDeps {
  readonly decodeBitmap?: (file: Blob) => Promise<DecodedImage>;
  readonly createCanvas?: (width: number, height: number) => CanvasLike;
  readonly blobToDataUrl?: (blob: Blob) => Promise<string>;
}

function decodeBitmapWithOrientation(file: Blob): Promise<DecodedImage> {
  // `imageOrientation: 'from-image'` is mandatory: without it the EXIF rotation
  // of a phone photo is dropped and the image uploads sideways.
  // `resizeWidth`/`resizeHeight`/`quality` are deliberately unused — they take
  // WebKit down a decode slow path slower than drawing to a canvas.
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

function createCanvasElement(width: number, height: number): CanvasLike {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // The DOM declares `fillStyle` as `string | CanvasGradient | CanvasPattern`.
  // This module only ever writes a CSS colour, so the narrower contract holds at
  // runtime; the cast bridges the wider declaration and nothing else.
  return canvas as unknown as CanvasLike;
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // `readAsDataURL` is specified to yield a string, but the DOM types
      // `result` as `string | ArrayBuffer | null`. Narrow instead of asserting.
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('فشل قراءة الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

export function isSvgFile(file: File): boolean {
  if (file.type === SVG_MIME) return true;
  // Some drops arrive with `type: ''`; the name is then the only signal left.
  // Mirrors the empty-type branch of `ImageDropzone.validateFile`.
  return file.type === '' && SVG_NAME_RE.test(file.name);
}

export function computeTargetSize(
  naturalWidth: number,
  naturalHeight: number,
  maxEdge: number = MAX_LONG_EDGE_PX,
): { readonly width: number; readonly height: number } {
  const longest = Math.max(naturalWidth, naturalHeight);
  // Clamped at 1 so a small image is never upscaled: re-encoding a 400px logo at
  // 1600px would inflate it for nothing.
  const scale = Math.min(1, maxEdge / longest);
  // Rounded, then floored at 1: a zero dimension throws on canvas allocation.
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

export function dataUrlExceedsRowLimit(dataUrl: string): boolean {
  // D1 counts bytes; `String.length` counts UTF-16 code units, which under-counts
  // every non-ASCII payload by up to 3x and would let an oversized row through.
  return new TextEncoder().encode(dataUrl).length > ROW_BYTE_LIMIT;
}

export async function compressImage(file: File, deps: CompressDeps = {}): Promise<string> {
  // Rasterising an SVG would destroy its vector scaling, so vectors pass through
  // untouched — and they are already far below the row cap.
  if (isSvgFile(file)) return fileToDataUrl(file);

  const decodeBitmap = deps.decodeBitmap ?? decodeBitmapWithOrientation;
  const createCanvas = deps.createCanvas ?? createCanvasElement;
  const blobToDataUrl = deps.blobToDataUrl ?? fileToDataUrl;

  const bitmap = await decodeBitmap(file);
  try {
    const { width, height } = computeTargetSize(bitmap.width, bitmap.height);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('تعذر تجهيز الصورة');

    ctx.drawImage(bitmap, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    let hasAlpha = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) {
        hasAlpha = true;
        break;
      }
    }

    let mime = PNG_MIME;
    if (!hasAlpha) {
      // JPEG has no alpha channel, so a semi-transparent pixel would encode as
      // BLACK. The white matte therefore has to sit UNDER the photo: flood the
      // canvas first, then composite the bitmap on top. Filling *after* the draw
      // (the intuitive ordering) paints over the image and encodes a solid white
      // rectangle, which is why the draw is repeated here.
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      mime = JPEG_MIME;
    }

    // PNG gets no quality argument: the parameter is meaningless to its encoder.
    const blob = hasAlpha
      ? await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime))
      : await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, JPEG_QUALITY));
    if (blob === null) throw new Error(ENCODE_FAILED);
    // Never trust the encoder's silence. Safari answers a `toBlob('image/webp')`
    // request with an `image/png` blob that is ~20x larger, which then blows the
    // D1 row cap, so the requested type has to be verified and never assumed.
    if (blob.type !== mime) throw new Error(ENCODE_FAILED);

    const dataUrl = await blobToDataUrl(blob);
    if (dataUrlExceedsRowLimit(dataUrl)) {
      throw new Error('الصورة كبيرة جدًا بعد الضغط — جرّب صورة أصغر');
    }
    return dataUrl;
  } finally {
    // A decoded bitmap pins the full-resolution image in memory until it is
    // closed, so this has to run on the throw paths too.
    bitmap.close?.();
  }
}