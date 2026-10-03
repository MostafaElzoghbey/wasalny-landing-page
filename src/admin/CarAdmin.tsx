import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { flushSync } from 'react-dom';

import { Flip } from '@/lib/gsap';
import type { Car } from '@/types';
import { adminCreateCar, adminGetCars } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { CarImageRow } from './CarImageRow';
import { CategoryCard } from './CategoryCard';
import { CAR_CATEGORIES, CATEGORY_LABELS, validateCar } from './carHelpers';
import { expandCarToImageRows } from './carImageRows';
import { useImageRowMoves } from './useImageRowMoves';
import { useCategoryDrilldownHistory } from './useCategoryDrilldownHistory';

interface CategoryCarListProps {
  categoryCars: Car[];
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
}

function CategoryCarList({ categoryCars, onUpdated, onDeleted }: CategoryCarListProps) {
  const sorted = [...categoryCars].sort((a, b) => a.displayOrder - b.displayOrder);
  const imageMoves = useImageRowMoves(sorted, onUpdated, onDeleted);
  const { imageError, imageMoving, moveUp, moveDown } = imageMoves;
  const rowPlans = imageMoves.movePlans;
  const rowsByCar = sorted.map((car) => ({ car, rows: expandCarToImageRows(car) }));
  return (
    <ul className="space-y-2">
      {imageError && <ErrorText message={imageError} />}
      {rowsByCar.map(({ car, rows }, idx) => {
        const base = rowsByCar
          .slice(0, idx)
          .reduce((total, group) => total + group.rows.length, 0);
        return (
        <li key={car.id} dir="rtl" data-reorder-item={car.id} data-testid={`car-row-${car.id}`} className="reorder-item text-right" style={{ transitionDelay: `${idx * 15}ms` }}>
          <div className="min-w-0 flex-1 space-y-2">
            <ul className="space-y-1.5">
              {rows.map((row, rowIdx) => {
                const plan = rowPlans.get(`${car.id}-${row.index}`);
                return (
                  <CarImageRow
                    key={`${row.carId}-${row.index}`}
                    car={car}
                    row={row}
                    rowNumber={base + rowIdx + 1}
                    categoryLabel={CATEGORY_LABELS[car.category]}
                    onUpdated={onUpdated}
                    onDeleted={onDeleted}
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
        );
      })}
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
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try { setCars(await adminGetCars()); } catch (e) { setError(e instanceof Error ? e.message : 'فشل تحميل السيارات'); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function transitionToCategory(next: Car['category'] | null): void {
    if (next === selectedCategory) return;
    setError(null);
    setCreateError(null);
    if (prefersReduced()) { setSelectedCategory(next); return; }
    const state = Flip.getState('[data-flip-id]');
    flushSync(() => setSelectedCategory(next));
    Flip.from(state, { duration: 0.35, ease: 'power2.inOut', absolute: true, scale: true, stagger: 0.03, targets: '[data-flip-id]', prune: true, clearProps: 'all' });
  }
  const { recordDrilldownEntry, consumeDrilldownEntry } = useCategoryDrilldownHistory({
    enterCategory: (category: Car['category']) => transitionToCategory(category),
    exitToGrid: () => transitionToCategory(null),
  });
  function handleSelectCategory(cat: Car['category']): void {
    transitionToCategory(cat);
    recordDrilldownEntry(cat);
  }
  function handleBackToGrid(): void {
    transitionToCategory(null);
    consumeDrilldownEntry();
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
        const el = document.querySelector(`[data-testid="car-imagerow-${created.id}-0"]`);
        if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    } catch (err) { setCreateError(err instanceof Error ? err.message : 'فشل إنشاء السيارة'); } finally { setIsCreating(false); }
  }
  function handleUpdated(next: Car): void { setCars((prev) => prev.map((c) => (c.id === next.id ? next : c))); }
  function handleDeleted(deletedId: string): void { setCars((prev) => prev.filter((c) => c.id !== deletedId)); }

  const filtered = selectedCategory === null ? [] : cars.filter((c) => c.category === selectedCategory).sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Panel title="السيارات">
      {error && <ErrorText message={error} />}
      <div className="mb-4 h-1 w-full max-w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500" />
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
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1 text-sm font-bold text-white">{CATEGORY_LABELS[selectedCategory]}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{filtered.length} سيارات</span></div>
          <form data-testid="fleet-create" dir="rtl" onSubmit={handleCreate} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-sm space-y-3 sm:p-4">
            <div className="h-1 w-full max-w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 mb-2" />
            <h4 className="font-semibold">إضافة سيارة — {CATEGORY_LABELS[selectedCategory]}</h4>
            {createError && <ErrorText message={createError} />}
            <div className="flex flex-wrap items-center gap-2 text-sm"><span className="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white">{CATEGORY_LABELS[selectedCategory]}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">الفئة مقفلة</span></div>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
              <Field label="الوصف" value={description} onChange={setDescription} textarea />
              <Field label="وصف تحسين محركات البحث" value={seoDescription} onChange={setSeoDescription} />
              <div className="sm:col-span-2"><ImageDropzone mode="multiple" value={images} onChange={(v) => setImages(v as string[])} testId="car-images-create" label="الصور" /></div>
              <ChipInput label="المميزات" value={features} onChange={setFeatures} placeholder="اكتب واضغط Enter" testId="chip-input-features" />
            </div>
            <PrimaryButton type="submit" disabled={isCreating}>{isCreating ? 'جارٍ الإنشاء…' : 'إنشاء سيارة'}</PrimaryButton>
          </form>
          <CategoryCarList categoryCars={filtered} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        </div>
      )}
    </Panel>
  );
}
