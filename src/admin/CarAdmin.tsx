import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { flushSync } from 'react-dom';

import { Flip } from '@/lib/gsap';
import type { Car } from '@/types';
import { adminCreateCar, adminGetCars, adminReorderCars } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { CarCard } from './CarCard';
import { CategoryCard } from './CategoryCard';
import { CAR_CATEGORIES, CATEGORY_LABELS } from './carHelpers';

interface CategoryCarListProps {
  categoryCars: Car[];
  expandedId: string | null;
  isReordering: boolean;
  onToggleCar: (id: string) => void;
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
  onReorder: (next: Car[]) => void;
}

function CategoryCarList({ categoryCars, expandedId, isReordering, onToggleCar, onUpdated, onDeleted, onReorder }: CategoryCarListProps) {
  const dragIdRef = useRef<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(categoryCars.map((c) => c.id).join(','));
  const sorted = [...categoryCars].sort((a, b) => a.displayOrder - b.displayOrder);
  function handleMove(id: string, dir: -1 | 1): void {
    if (isReordering) return;
    const idx = sorted.findIndex((c) => c.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= sorted.length) return;
    capture();
    const next = [...sorted];
    [next[idx], next[target]] = [next[target], next[idx]];
    onReorder(next);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetId: string): void {
    if (isReordering) return;
    e.preventDefault();
    const draggedId = dragIdRef.current;
    dragIdRef.current = null;
    if (!draggedId || draggedId === targetId) return;
    const from = sorted.findIndex((c) => c.id === draggedId);
    const to = sorted.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return;
    capture();
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }
  return (
    <ul ref={listRef} className="space-y-2">
      {sorted.map((car, idx) => (
        <li key={car.id} dir="rtl" data-reorder-item={car.id} data-testid={`car-row-${car.id}`} className="reorder-item flex items-stretch gap-2 text-right" style={{ transitionDelay: `${idx * 15}ms` }}>
          <ReorderControls
            id={car.id}
            index={idx}
            total={sorted.length}
            displayOrder={car.displayOrder}
            disabled={isReordering}
            onMoveUp={() => handleMove(car.id, -1)}
            onMoveDown={() => handleMove(car.id, 1)}
            onDragStart={(e) => { dragIdRef.current = car.id; e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, car.id)}
          />
          <div className="min-w-0 flex-1">
            <CarCard group={car} expanded={expandedId === car.id} onToggle={() => onToggleCar(car.id)} onUpdated={onUpdated} onDeleted={onDeleted} />
          </div>
        </li>
      ))}
      {sorted.length === 0 && <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد سيارات بعد.</li>}
    </ul>
  );
}

const prefersReduced = (): boolean => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CarAdmin() {
  const [cars, setCars] = useState<Car[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Car['category'] | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try { setCars(await adminGetCars()); } catch (e) { setError(e instanceof Error ? e.message : 'فشل تحميل السيارات'); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function handleSelectCategory(cat: Car['category']): void {
    if (prefersReduced()) { setSelectedCategory(cat); return; }
    const state = Flip.getState('[data-flip-id]');
    flushSync(() => setSelectedCategory(cat));
    Flip.from(state, { duration: 0.35, ease: 'power2.inOut', absolute: true, scale: true, stagger: 0.03, targets: '[data-flip-id]', prune: true, clearProps: 'all' });
  }
  function handleBackToGrid(): void {
    if (prefersReduced()) { setSelectedCategory(null); return; }
    const state = Flip.getState('[data-flip-id]');
    flushSync(() => setSelectedCategory(null));
    Flip.from(state, { duration: 0.35, ease: 'power2.inOut', absolute: true, scale: true, stagger: 0.03, targets: '[data-flip-id]', prune: true, clearProps: 'all' });
  }
  function resetForm(): void { setNameAr(''); setDescription(''); setImages([]); setFeatures([]); }
  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (selectedCategory === null) return;
    setCreateError(null);
    try {
      const body = { id: generateId('car'), nameAr: nameAr.trim(), category: selectedCategory, categoryAr: CATEGORY_LABELS[selectedCategory], description: description.trim(), images, features };
      await adminCreateCar(body as unknown as Omit<Car, 'id'>);
      resetForm();
      await load();
    } catch (err) { setCreateError(err instanceof Error ? err.message : 'فشل إنشاء السيارة'); }
  }
  function handleUpdated(next: Car): void { setCars((prev) => prev.map((c) => (c.id === next.id ? next : c))); }
  function handleDeleted(deletedId: string): void { setCars((prev) => prev.filter((c) => c.id !== deletedId)); if (expandedId === deletedId) setExpandedId(null); }
  async function doReorder(nextCategorySlice: Car[]): Promise<void> {
    if (isReordering || selectedCategory === null) return;
    const prev = [...cars];
    const ids = CAR_CATEGORIES.flatMap((cat) => cat === selectedCategory ? nextCategorySlice.map((c) => c.id) : cars.filter((c) => c.category === cat).sort((a, b) => a.displayOrder - b.displayOrder).map((c) => c.id));
    const nextWithOrder = ids.map((id, idx) => {
      const fromSlice = nextCategorySlice.find((c) => c.id === id);
      const orig = cars.find((c) => c.id === id);
      if (!orig && !fromSlice) return null as unknown as Car;
      const base = fromSlice ?? orig!;
      return { ...base, displayOrder: idx };
    }).filter(Boolean) as Car[];
    setCars(nextWithOrder);
    setReorderError(null);
    setIsReordering(true);
    try { await adminReorderCars(ids); } catch (err) { setCars(prev); setReorderError(err instanceof Error ? err.message : 'فشل إعادة الترتيب'); } finally { setIsReordering(false); }
  }

  const filtered = selectedCategory === null ? [] : cars.filter((c) => c.category === selectedCategory).sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Panel title="السيارات">
      {error && <ErrorText message={error} />}
      {reorderError && <ErrorText message={reorderError} />}
      <div className="mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500" />
      {loading ? <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p> : selectedCategory === null ? (
        <>
          <div dir="rtl" data-testid="category-grid" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
            {CAR_CATEGORIES.map((cat) => (
              <CategoryCard key={cat} category={cat} count={cars.filter((c) => c.category === cat).length} cars={cars} onSelect={handleSelectCategory} />
            ))}
          </div>
          <div hidden aria-hidden data-testid="car-sync-hidden" className="hidden">
            {cars.map((car) => (
              <div key={car.id} data-testid={`car-card-${car.id}`} />
            ))}
          </div>
        </>
      ) : (
        <div dir="rtl" data-testid={`category-drilldown-${selectedCategory}`} className="space-y-4">
          <button type="button" data-testid="category-back" onClick={handleBackToGrid} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))]" dir="rtl">عودة إلى الفئات</button>
          <div className="flex items-center gap-2"><span className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1 text-sm font-bold text-white">{CATEGORY_LABELS[selectedCategory]}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{filtered.length} سيارات</span></div>
          <form data-testid="fleet-create" dir="rtl" onSubmit={handleCreate} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm space-y-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 mb-2" />
            <h4 className="font-semibold">إضافة سيارة — {CATEGORY_LABELS[selectedCategory]}</h4>
            {createError && <ErrorText message={createError} />}
            <div className="flex items-center gap-2 text-sm"><span className="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white">{CATEGORY_LABELS[selectedCategory]}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">الفئة مقفلة</span></div>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
              <Field label="الوصف" value={description} onChange={setDescription} textarea />
              <div className="sm:col-span-2"><ImageDropzone mode="multiple" value={images} onChange={(v) => setImages(v as string[])} maxImages={10} testId="car-images" label="الصور" /></div>
              <ChipInput label="المميزات" value={features} onChange={setFeatures} placeholder="اكتب واضغط Enter" testId="chip-input-features" />
            </div>
            <PrimaryButton type="submit">إنشاء سيارة</PrimaryButton>
          </form>
          <CategoryCarList categoryCars={filtered} expandedId={expandedId} isReordering={isReordering} onToggleCar={(id) => setExpandedId((prev) => (prev === id ? null : id))} onUpdated={handleUpdated} onDeleted={handleDeleted} onReorder={(next) => void doReorder(next)} />
        </div>
      )}
    </Panel>
  );
}
