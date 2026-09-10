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
import { CarImageRow } from './CarImageRow';
import { CategoryCard } from './CategoryCard';
import { CAR_CATEGORIES, CATEGORY_LABELS, validateCar } from './carHelpers';
import { expandCarToImageRows } from './carImageRows';
import { useImageRowMoves } from './useImageRowMoves';

interface CategoryCarListProps {
  categoryCars: Car[];
  isReordering: boolean;
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
  onReorder: (next: Car[]) => void;
}

function CategoryCarList({ categoryCars, isReordering, onUpdated, onDeleted, onReorder }: CategoryCarListProps) {
  const dragIdRef = useRef<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(categoryCars.map((c) => c.id).join(','));
  const sorted = [...categoryCars].sort((a, b) => a.displayOrder - b.displayOrder);
  const imageMoves = useImageRowMoves(sorted, isReordering, onUpdated);
  const { imageError, imageMoving, moveUp, moveDown } = imageMoves;
  const rowPlans = imageMoves.movePlans;
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
      {imageError && <ErrorText message={imageError} />}
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
          <div className="min-w-0 flex-1 space-y-2">
            <CarCard group={car} onUpdated={onUpdated} onDeleted={onDeleted} />
            <ul className="space-y-1.5">
              {expandCarToImageRows(car).map((row) => {
                const plan = rowPlans.get(`${car.id}-${row.index}`);
                return (
                  <CarImageRow
                    key={`${row.carId}-${row.index}`}
                    car={car}
                    row={row}
                    categoryLabel={CATEGORY_LABELS[car.category]}
                    onUpdated={onUpdated}
                    canMoveUp={plan !== undefined && plan.canMoveUp && !imageMoving}
                    canMoveDown={plan !== undefined && plan.canMoveDown && !imageMoving}
                    onMoveUp={() => moveUp(car.id, row.index)}
                    onMoveDown={() => moveDown(car.id, row.index)}
                  />
                );
              })}
            </ul>
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
  const [selectedCategory, setSelectedCategory] = useState<Car['category'] | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try { setCars(await adminGetCars()); } catch (e) { setError(e instanceof Error ? e.message : 'فشل تحميل السيارات'); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function handleSelectCategory(cat: Car['category']): void {
    setError(null);
    setCreateError(null);
    if (prefersReduced()) { setSelectedCategory(cat); return; }
    const state = Flip.getState('[data-flip-id]');
    flushSync(() => setSelectedCategory(cat));
    Flip.from(state, { duration: 0.35, ease: 'power2.inOut', absolute: true, scale: true, stagger: 0.03, targets: '[data-flip-id]', prune: true, clearProps: 'all' });
  }
  function handleBackToGrid(): void {
    setError(null);
    setCreateError(null);
    if (prefersReduced()) { setSelectedCategory(null); return; }
    const state = Flip.getState('[data-flip-id]');
    flushSync(() => setSelectedCategory(null));
    Flip.from(state, { duration: 0.35, ease: 'power2.inOut', absolute: true, scale: true, stagger: 0.03, targets: '[data-flip-id]', prune: true, clearProps: 'all' });
  }
  function resetForm(): void { setNameAr(''); setDescription(''); setSeoDescription(''); setImages([]); setFeatures([]); }
  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (selectedCategory === null || isCreating) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      const categoryCars = cars.filter((c) => c.category === selectedCategory);
      const nextOrder = categoryCars.length ? Math.max(...categoryCars.map((c) => c.displayOrder)) + 1 : 0;
      const body = { id: generateId('car'), nameAr: nameAr.trim(), category: selectedCategory, categoryAr: CATEGORY_LABELS[selectedCategory], description: description.trim(), seoDescription: seoDescription.trim(), images, features, displayOrder: nextOrder };
      const validation = validateCar(body);
      if (validation) {
        setCreateError(validation);
        return;
      }
      const created = await adminCreateCar(body as unknown as Omit<Car, 'id'>);
      setCars((prev) => [...prev, created]);
      resetForm();
      window.setTimeout(() => {
        if (typeof document === 'undefined') return;
        const el = document.querySelector(`[data-testid="car-card-${created.id}"]`);
        if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    } catch (err) { setCreateError(err instanceof Error ? err.message : 'فشل إنشاء السيارة'); } finally { setIsCreating(false); }
  }
  function handleUpdated(next: Car): void { setCars((prev) => prev.map((c) => (c.id === next.id ? next : c))); }
  function handleDeleted(deletedId: string): void { setCars((prev) => prev.filter((c) => c.id !== deletedId)); }
  async function doReorder(nextCategorySlice: Car[]): Promise<void> {
    if (isReordering || selectedCategory === null) return;
    const prev = [...cars];
    const ids = CAR_CATEGORIES.flatMap((cat) => cat === selectedCategory ? nextCategorySlice.map((c) => c.id) : cars.filter((c) => c.category === cat).sort((a, b) => a.displayOrder - b.displayOrder).map((c) => c.id));
    const sliceIndex = new Map(nextCategorySlice.map((c, i) => [c.id, i]));
    const nextWithOrder = ids.map((id, idx) => {
      const fromSlice = nextCategorySlice.find((c) => c.id === id);
      const orig = cars.find((c) => c.id === id);
      if (!orig && !fromSlice) return null as unknown as Car;
      const base = fromSlice ?? orig!;
      const itemIndex = sliceIndex.get(id) ?? (orig?.displayOrder ?? idx);
      return { ...base, displayOrder: itemIndex };
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
              <Field label="وصف تحسين محركات البحث" value={seoDescription} onChange={setSeoDescription} />
              <div className="sm:col-span-2"><ImageDropzone mode="multiple" value={images} onChange={(v) => setImages(v as string[])} maxImages={10} testId="car-images-create" label="الصور" /></div>
              <ChipInput label="المميزات" value={features} onChange={setFeatures} placeholder="اكتب واضغط Enter" testId="chip-input-features" />
            </div>
            <PrimaryButton type="submit" disabled={isCreating}>{isCreating ? 'جارٍ الإنشاء…' : 'إنشاء سيارة'}</PrimaryButton>
          </form>
          <CategoryCarList categoryCars={filtered} isReordering={isReordering} onUpdated={handleUpdated} onDeleted={handleDeleted} onReorder={(next) => void doReorder(next)} />
        </div>
      )}
    </Panel>
  );
}
