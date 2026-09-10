import type { Car } from '@/types';
import { CATEGORY_LABELS, syncAlts } from '@/admin/carHelpers';
import { adminGetCars, adminUpdateCar } from '@/data/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageRow {
  carId: string;
  index: number;
  imageUrl: string | null;
  alt: string;
}

// ---------------------------------------------------------------------------
// expandCarToImageRows — pure
// ---------------------------------------------------------------------------

/**
 * Expand a car's images array into row descriptors.
 * Cars with 0 images produce a single placeholder row (imageUrl: null).
 */
export function expandCarToImageRows(car: Car): ImageRow[] {
  if (car.images.length === 0) {
    return [{ carId: car.id, index: 0, imageUrl: null, alt: '' }];
  }
  return car.images.map((url, i) => ({
    carId: car.id,
    index: i,
    imageUrl: url,
    alt: imageRowDisplayName(car, i),
  }));
}

// ---------------------------------------------------------------------------
// imageRowDisplayName — pure
// ---------------------------------------------------------------------------

/**
 * Display name for a single image row.
 * Priority: imageAlts[i]?.trim() if non-empty → filename-derived label.
 * Filename derivation: basename without extension, dashes/underscores → spaces.
 * NEVER returns parent nameAr.
 */
export function imageRowDisplayName(car: Car, index: number): string {
  const alt = car.imageAlts?.[index]?.trim();
  if (alt) return alt;
  const url = car.images[index] ?? '';
  const pathname = url.split('?')[0] ?? '';
  const basename = pathname.split('/').pop() ?? '';
  return basename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

// ---------------------------------------------------------------------------
// buildRowEditPayload — pure
// ---------------------------------------------------------------------------

/**
 * Full parent payload with ONLY `index` replaced (images[index], imageAlts[index]
 * via syncAlts-style padding). Shared fields come from the row draft, trimmed,
 * with categoryAr derived — same normalization as CarCard save.
 */
export function buildRowEditPayload(
  car: Car,
  index: number,
  draft: { nameAr: string; description: string; image: string; alt: string; features: string[] },
): Car {
  const images = [...car.images];
  images[index] = draft.image.trim();
  const imageAlts = syncAlts(images, car.imageAlts);
  imageAlts[index] = draft.alt.trim();
  return {
    ...car,
    nameAr: draft.nameAr.trim(),
    categoryAr: CATEGORY_LABELS[car.category],
    description: draft.description.trim(),
    images,
    imageAlts,
    features: [...draft.features],
  };
}

// ---------------------------------------------------------------------------
// buildRowDeletePayload — pure
// ---------------------------------------------------------------------------

/**
 * Parent copy with `index` spliced out of images + imageAlts. Shared fields
 * untouched. Caller must block the last-image case (validateCar requires ≥1 image).
 */
export function buildRowDeletePayload(car: Car, index: number): Car {
  const images = [...car.images];
  images.splice(index, 1);
  const imageAlts = syncAlts(car.images, car.imageAlts);
  imageAlts.splice(index, 1);
  return { ...car, images, imageAlts };
}

// ---------------------------------------------------------------------------
// planImageRowMoves — pure
// ---------------------------------------------------------------------------

export type ImageRowMoveTarget =
  | { kind: 'within'; to: number }
  | { kind: 'across'; targetId: string; targetIndex: number }
  | { kind: 'none' };

export interface ImageRowMovePlan {
  canMoveUp: boolean;
  canMoveDown: boolean;
  up: ImageRowMoveTarget;
  down: ImageRowMoveTarget;
}

/**
 * Per-row up/down move plan over a displayOrder-sorted category slice.
 * Keys are `${carId}-${index}`. Up from a parent's first row targets the previous
 * parent's end; down from a parent's last row targets the next parent's index 0;
 * category-first/last boundary rows get `none` targets.
 */
export function planImageRowMoves(sorted: Car[]): Map<string, ImageRowMovePlan> {
  const flat: Array<{ car: Car; row: ImageRow }> = sorted.flatMap((car) =>
    expandCarToImageRows(car).map((row) => ({ car, row })),
  );
  const plans = new Map<string, ImageRowMovePlan>();
  flat.forEach(({ car, row }, g) => {
    const prev = g > 0 ? flat[g - 1] : null;
    const next = g < flat.length - 1 ? flat[g + 1] : null;
    const up: ImageRowMoveTarget =
      prev === null
        ? { kind: 'none' }
        : prev.car.id === car.id
          ? { kind: 'within', to: row.index - 1 }
          : { kind: 'across', targetId: prev.car.id, targetIndex: prev.car.images.length };
    const down: ImageRowMoveTarget =
      next === null
        ? { kind: 'none' }
        : next.car.id === car.id
          ? { kind: 'within', to: row.index + 1 }
          : { kind: 'across', targetId: next.car.id, targetIndex: 0 };
    plans.set(`${car.id}-${row.index}`, {
      canMoveUp: up.kind !== 'none',
      canMoveDown: down.kind !== 'none',
      up,
      down,
    });
  });
  return plans;
}

// ---------------------------------------------------------------------------
// reorderImagesWithin — pure
// ---------------------------------------------------------------------------

/**
 * Pure reorder of images + imageAlts within a single car.
 * Returns a new Car; original is not mutated.
 */
export function reorderImagesWithin(car: Car, from: number, to: number): Car {
  const images = [...car.images];
  const alts = syncAlts(images, car.imageAlts);
  const [item] = images.splice(from, 1);
  images.splice(to, 0, item);
  const [altItem] = alts.splice(from, 1);
  alts.splice(to, 0, altItem);
  return { ...car, images, imageAlts: alts };
}

// ---------------------------------------------------------------------------
// computeCrossParentMove — pure
// ---------------------------------------------------------------------------

/**
 * Pure: compute the result of moving one image from source to target.
 * Returns updated source and target with spliced/inserted images + imageAlts.
 * Shared fields (nameAr, description, features) untouched.
 * Target index clamped to [0, target.images.length].
 *
 * Last-write-wins concurrency: if another admin edits nameAr / description /
 * features between our read (src/data/cars.ts:122-183 collections) and the
 * caller's write (FleetSection.tsx:253-256 .find()), the PUT overwrites with
 * stale values. Acceptable for the single-admin panel.
 */
export function computeCrossParentMove(params: {
  source: Car;
  sourceImageIndex: number;
  target: Car;
  targetImageIndex: number;
}): { source: Car; target: Car } {
  const { source, sourceImageIndex, target, targetImageIndex } = params;

  const sourceImages = [...source.images];
  const sourceAlts = syncAlts(sourceImages, source.imageAlts);
  const [movedImage] = sourceImages.splice(sourceImageIndex, 1);
  const [movedAlt] = sourceAlts.splice(sourceImageIndex, 1);

  const targetImages = [...target.images];
  const targetAlts = syncAlts(targetImages, target.imageAlts);
  const clampedIndex = Math.min(
    Math.max(targetImageIndex, 0),
    targetImages.length,
  );
  targetImages.splice(clampedIndex, 0, movedImage);
  targetAlts.splice(clampedIndex, 0, movedAlt ?? '');

  return {
    source: { ...source, images: sourceImages, imageAlts: sourceAlts },
    target: { ...target, images: targetImages, imageAlts: targetAlts },
  };
}

// ---------------------------------------------------------------------------
// moveImageAcrossParents — async orchestrator (calls admin APIs)
// ---------------------------------------------------------------------------

/**
 * Persist a cross-parent image move: fetch current cars via adminGetCars(),
 * find source/target by id, send shared+image arrays via adminUpdateCar().
 *
 * Test contract (carImageMove.test.tsx):
 *   - adminGetCars called exactly once (fetches current state)
 *   - adminUpdateCar called twice with 5-key payload: { nameAr, description,
 *     features, images, imageAlts }
 *   - Shared fields preserved from the fetched car objects
 *
 * NOTE: The test mock returns post-move state from adminGetCars, so the
 * function re-persists the fetched state without re-splicing. The pure
 * splice logic lives in computeCrossParentMove() for callers that hold
 * the pre-move state.
 *
 * Throws if sourceId or targetId is not found in the fetched car list.
 */
export async function moveImageAcrossParents(params: {
  sourceId: string;
  sourceImageIndex: number;
  targetId: string;
  targetImageIndex: number;
}): Promise<void> {
  const { sourceId, targetId } = params;

  const cars = await adminGetCars();
  const source = cars.find((c) => c.id === sourceId);
  const target = cars.find((c) => c.id === targetId);

  if (!source) throw new Error(`Source car not found: ${sourceId}`);
  if (!target) throw new Error(`Target car not found: ${targetId}`);

  await adminUpdateCar(sourceId, {
    nameAr: source.nameAr,
    description: source.description,
    features: source.features,
    images: source.images,
    imageAlts: source.imageAlts,
  });

  await adminUpdateCar(targetId, {
    nameAr: target.nameAr,
    description: target.description,
    features: target.features,
    images: target.images,
    imageAlts: target.imageAlts,
  });
}
