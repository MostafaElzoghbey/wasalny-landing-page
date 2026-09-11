import { useState } from 'react';

import type { Car } from '@/types';
import { adminGetCars, adminUpdateCar } from '@/data/api';
import { computeCrossParentMove, moveImageAcrossParents, planImageRowMoves, reorderImagesWithin } from './carImageRows';
import type { ImageRowMovePlan, ImageRowMoveTarget } from './carImageRows';

interface UseImageRowMovesResult {
  movePlans: Map<string, ImageRowMovePlan>;
  imageError: string | null;
  imageMoving: boolean;
  moveUp: (carId: string, index: number) => void;
  moveDown: (carId: string, index: number) => void;
}

export function useImageRowMoves(sorted: Car[], onUpdated: (next: Car) => void): UseImageRowMovesResult {
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageMoving, setImageMoving] = useState(false);
  const movePlans = planImageRowMoves(sorted);

  async function handleImageMoveWithin(carId: string, from: number, to: number): Promise<void> {
    if (imageMoving) return;
    const car = sorted.find((c) => c.id === carId);
    if (!car) return;
    const next = reorderImagesWithin(car, from, to);
    setImageError(null);
    setImageMoving(true);
    onUpdated(next);
    try {
      const { id: _id, ...payload } = next; // eslint-disable-line @typescript-eslint/no-unused-vars
      await adminUpdateCar(carId, payload as Partial<Car>);
    } catch (e) {
      onUpdated(car);
      setImageError(e instanceof Error ? e.message : 'فشل نقل الصورة');
    } finally {
      setImageMoving(false);
    }
  }

  async function handleImageMoveAcross(sourceId: string, sourceImageIndex: number, targetId: string, targetImageIndex: number): Promise<void> {
    if (imageMoving) return;
    const source = sorted.find((c) => c.id === sourceId);
    const target = sorted.find((c) => c.id === targetId);
    if (!source || !target) return;
    const clampedTarget = Math.min(Math.max(targetImageIndex, 0), target.images.length);
    const computed = computeCrossParentMove({ source, sourceImageIndex, target, targetImageIndex: clampedTarget });
    setImageError(null);
    setImageMoving(true);
    onUpdated(computed.source);
    onUpdated(computed.target);
    try {
      await moveImageAcrossParents({ sourceId, sourceImageIndex, targetId, targetImageIndex: clampedTarget });
      const fresh = await adminGetCars();
      const freshSource = fresh.find((c) => c.id === sourceId);
      const freshTarget = fresh.find((c) => c.id === targetId);
      if (freshSource) onUpdated(freshSource);
      if (freshTarget) onUpdated(freshTarget);
    } catch (e) {
      onUpdated(source);
      onUpdated(target);
      setImageError(e instanceof Error ? e.message : 'فشل نقل الصورة');
    } finally {
      setImageMoving(false);
    }
  }

  function runTarget(carId: string, index: number, target: ImageRowMoveTarget): void {
    if (target.kind === 'within') void handleImageMoveWithin(carId, index, target.to);
    else if (target.kind === 'across') void handleImageMoveAcross(carId, index, target.targetId, target.targetIndex);
  }

  function dispatch(carId: string, index: number, dir: -1 | 1): void {
    const plan = movePlans.get(`${carId}-${index}`);
    if (!plan) return;
    if (dir === -1 && plan.canMoveUp) runTarget(carId, index, plan.up);
    if (dir === 1 && plan.canMoveDown) runTarget(carId, index, plan.down);
  }

  return {
    movePlans,
    imageError,
    imageMoving,
    moveUp: (carId, index) => dispatch(carId, index, -1),
    moveDown: (carId, index) => dispatch(carId, index, 1),
  };
}
