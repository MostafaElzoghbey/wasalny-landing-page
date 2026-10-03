import type { RouteData } from '@/types';

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function cloneRouteData(group: RouteData): RouteData {
  return {
    id: group.id,
    fromLabel: group.fromLabel,
    toLabel: group.toLabel,
    title: group.title,
    description: group.description,
    metaTitle: group.metaTitle,
    metaDescription: group.metaDescription,
    heroImage: group.heroImage,
    priceStart: group.priceStart,
    distance: group.distance,
    duration: group.duration,
    features: [...group.features],
    faqs: [...group.faqs],
    displayOrder: group.displayOrder,
  };
}

export function validateRouteData(data: RouteData): string | null {
  if (data.title.trim() === '') {
    return 'العنوان مطلوب';
  }
  if (data.fromLabel.trim() === '') {
    return 'مسار الانطلاق مطلوب';
  }
  if (data.toLabel.trim() === '') {
    return 'مسار الوصول مطلوب';
  }
  return null;
}
