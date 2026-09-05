import type { Car } from '@/types';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { useReorderAnimation, useExpandCollapse } from '@/hooks/useReorderAnimation';

import { CAR_CATEGORIES } from './carHelpers';
import { CarCard } from './CarCard';

interface CarCategoryGroupProps {
  category: Car['category']; labelAr: string; cars: Car[];
  expanded: boolean; onToggle: () => void;
  expandedId: string | null; onToggleCar: (id: string) => void;
  onUpdated: (next: Car) => void; onDeleted: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDragStart: (e: React.DragEvent<HTMLSpanElement>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetId: string) => void;
  isReordering: boolean;
}

export function CarCategoryGroup({ category, labelAr, cars, expanded, onToggle, expandedId, onToggleCar, onUpdated, onDeleted, onMove, onDragStart, onDragOver, onDrop, isReordering }: CarCategoryGroupProps) {
  if (CAR_CATEGORIES.length !== 5) throw new Error('CAR_CATEGORIES must be 5 flat groups');
  const expandRef = useExpandCollapse(expanded);
  const { ref: listRef, capture } = useReorderAnimation(cars.map((c) => c.id).join(','));
  const wrappedOnMove = (id: string, dir: -1 | 1) => {
    capture();
    onMove(id, dir);
  };
  const wrappedOnDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    capture();
    onDrop(e, targetId);
  };
  return (
    <section dir="rtl" className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <button
        type="button"
        data-testid={`car-category-${category}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-[hsl(var(--muted))/0.4]"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{labelAr}</span>
          <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{cars.length}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{expanded ? 'إخفاء' : 'عرض'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={`shrink-0 text-[hsl(var(--muted-foreground))] transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {expanded && (
        <div ref={expandRef} className="overflow-hidden border-t border-[hsl(var(--border))] p-3">
          {cars.length === 0 ? (
            <p className="py-2 text-center text-sm text-[hsl(var(--muted-foreground))]">لا توجد سيارات في هذه الفئة.</p>
          ) : (
            <ul ref={listRef} className="space-y-3">
              {cars.map((c, idx) => (
                <li key={c.id} dir="rtl" data-reorder-item={c.id} className="reorder-item flex items-stretch gap-2 text-right" style={{ transitionDelay: `${idx * 20}ms` }}>
                  <ReorderControls
                    id={c.id}
                    index={idx}
                    total={cars.length}
                    displayOrder={c.displayOrder}
                    disabled={isReordering}
                    onMoveUp={() => wrappedOnMove(c.id, -1)}
                    onMoveDown={() => wrappedOnMove(c.id, 1)}
                    onDragStart={(e) => onDragStart(e, c.id)}
                    onDragOver={onDragOver}
                    onDrop={(e) => wrappedOnDrop(e, c.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <CarCard group={c} expanded={expandedId === c.id} onToggle={() => onToggleCar(c.id)} onUpdated={onUpdated} onDeleted={onDeleted} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
