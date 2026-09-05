import { Bus, Car, Heart, Truck, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Car as CarType } from '@/types';
import { CATEGORY_COLORS, CATEGORY_ICON_MAP, CATEGORY_LABELS, getCategoryMeta } from './carHelpers';

const iconComponents = { Car, Truck, Bus, UsersRound, Heart };

interface CategoryCardProps {
  category: CarType['category'];
  count: number;
  cars: CarType[];
  onSelect: (cat: CarType['category']) => void;
  testId?: string;
}

export function CategoryCard({ category, count, cars, onSelect, testId }: CategoryCardProps) {
  void getCategoryMeta(category);
  const colors = CATEGORY_COLORS[category];
  const Icon = iconComponents[CATEGORY_ICON_MAP[category]];
  const firstImage = cars.find((c) => c.category === category)?.images[0];

  return (
    <button
      dir="rtl"
      data-testid={testId ?? `category-card-${category}`}
      data-flip-id={`category-${category}`}
      onClick={() => onSelect(category)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-0 text-right transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary-500/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 flex flex-col',
        colors.ring,
      )}
    >
      <div className={`aspect-video w-full bg-gradient-to-br ${colors.primary} ${colors.accent} flex items-center justify-center relative`}>
        {firstImage ? (
          <img
            src={firstImage}
            className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            alt=""
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-white/80 group-hover:scale-110 transition-transform duration-200 drop-shadow" />
        </div>
        <span
          data-testid={`category-count-${category}`}
          className="absolute end-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-mono font-bold text-[hsl(var(--foreground))] shadow backdrop-blur"
        >
          {count}
        </span>
      </div>
      <div className="p-4 flex flex-1 flex-col gap-1">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{CATEGORY_LABELS[category]}</h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{count} سيارات</p>
        {count > 0 ? (
          <span className="mt-1 text-xs font-mono text-[hsl(var(--muted-foreground))]">
            #{Math.min(...cars.filter((c) => c.category === category).map((c) => c.displayOrder))}
          </span>
        ) : null}
      </div>
    </button>
  );
}
