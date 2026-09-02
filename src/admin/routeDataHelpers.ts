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
  };
}

export function validateRouteData(data: RouteData): string | null {
  if (data.title.trim() === '') {
    return 'Title is required';
  }
  return null;
}
