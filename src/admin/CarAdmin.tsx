import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars, adminReorderCars } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { CarCard } from './CarCard';
import { CAR_CATEGORIES, CATEGORY_LABELS } from './carHelpers';

interface CarListProps {
  cars: Car[];
  expandedId: string | null;
  isReordering: boolean;
  onToggleCar: (id: string) => void;
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
  onReorder: (next: Car[]) => void;
}

function CarList({ cars, expandedId, isReordering, onToggleCar, onUpdated, onDeleted, onReorder }: CarListProps) {
  const dragIdRef = useRef<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(cars.map((c) => c.id).join(','));
  const sorted = [...cars].sort((a, b) => a.displayOrder - b.displayOrder);

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
            onDragStart={(e) => {
              dragIdRef.current = car.id;
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, car.id)}
          />
          <div className="min-w-0 flex-1">
            <CarCard group={car} expanded={expandedId === car.id} onToggle={() => onToggleCar(car.id)} onUpdated={onUpdated} onDeleted={onDeleted} />
          </div>
        </li>
      ))}
      {sorted.length === 0 && (
        <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد سيارات بعد.</li>
      )}
    </ul>
  );
}

export function CarAdmin() {
  const [cars, setCars] = useState<Car[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState<Car['category']>('sedan');
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
    try {
      setCars(await adminGetCars());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل السيارات');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);
  function resetForm(): void {
    setNameAr(''); setCategory('sedan'); setDescription(''); setImages([]); setFeatures([]);
  }
  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault(); setCreateError(null);
    try {
      const body = { id: generateId('car'), nameAr, category, categoryAr: CATEGORY_LABELS[category], description, images, features };
      await adminCreateCar(body as unknown as Omit<Car, 'id'>); resetForm(); await load();
    } catch (e) { setCreateError(e instanceof Error ? e.message : 'فشل إنشاء السيارة'); }
  }
  function handleUpdated(next: Car): void { setCars((prev) => prev.map((c) => (c.id === next.id ? next : c))); }
  function handleDeleted(deletedId: string): void { setCars((prev) => prev.filter((c) => c.id !== deletedId)); if (expandedId === deletedId) setExpandedId(null); }
  async function doReorder(next: Car[]): Promise<void> {
    if (isReordering) return;
    const prev = [...cars];
    const nextWithOrder = next.map((c, i) => ({ ...c, displayOrder: i }));
    const ids = nextWithOrder.map((c) => c.id);
    setCars(nextWithOrder);
    setReorderError(null);
    setIsReordering(true);
    try {
      await adminReorderCars(ids);
    } catch (e) {
      setCars(prev);
      setReorderError(e instanceof Error ? e.message : 'فشل إعادة الترتيب');
    } finally {
      setIsReordering(false);
    }
  }
  return (
    <Panel title="السيارات">
      {error && <ErrorText message={error} />}
      {reorderError && <ErrorText message={reorderError} />}
      <div dir="rtl" className="mb-6 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
        <button type="button" onClick={() => setCreateOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-[hsl(var(--muted))/0.4]">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">سيارة جديدة</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{createOpen ? 'إخفاء' : 'عرض'}</span>
        </button>
        {createOpen && (
          <form onSubmit={handleCreate} className="space-y-3 border-t border-[hsl(var(--border))] p-4">
            {createError && <ErrorText message={createError} />}
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">الفئة</span>
                <select value={category} onChange={(e) => setCategory(e.target.value as Car['category'])} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none">
                  {CAR_CATEGORIES.map((c) => (<option key={c} value={c}>{CATEGORY_LABELS[c]}</option>))}
                </select>
              </label>
              <Field label="الوصف" value={description} onChange={setDescription} textarea />
              <div className="sm:col-span-2"><ImageDropzone mode="multiple" value={images} onChange={(v) => setImages(v as string[])} maxImages={10} testId="car-images" label="الصور" /></div>
              <ChipInput label="المميزات" value={features} onChange={setFeatures} placeholder="اكتب واضغط Enter" testId="chip-input-features" />
            </div>
            <PrimaryButton type="submit">إنشاء سيارة</PrimaryButton>
          </form>
        )}
      </div>
      {loading ? <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p> : (
        <CarList
          cars={cars}
          expandedId={expandedId}
          isReordering={isReordering}
          onToggleCar={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onReorder={(next) => void doReorder(next)}
        />
      )}
    </Panel>
  );
}