import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars, adminReorderCars } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { CarCategoryGroup } from './CarCategoryGroup';
import { CAR_CATEGORIES, CATEGORY_LABELS } from './carHelpers';

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
  const [expandedCategories, setExpandedCategories] = useState<Set<Car['category']>>(() => new Set(CAR_CATEGORIES as unknown as Car['category'][]));
  const dragIdRef = useRef<string | null>(null);

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
    const prev = [...cars]; const nextWithOrder = next.map((c, i) => ({ ...c, displayOrder: i })); const ids = nextWithOrder.map((c) => c.id); setCars(nextWithOrder); setReorderError(null); setIsReordering(true);
    try { await adminReorderCars(ids); } catch (e) { setCars(prev); setReorderError(e instanceof Error ? e.message : 'فشل إعادة الترتيب'); } finally { setIsReordering(false); }
  }
  const grouped = CAR_CATEGORIES.map((cat) => ({ category: cat, cars: cars.filter((c) => c.category === cat).sort((a, b) => a.displayOrder - b.displayOrder) }));
  function toggleCategory(cat: Car['category']): void {
    setExpandedCategories((prev) => { const next = new Set(prev); if (next.has(cat)) next.delete(cat); else next.add(cat); return next; });
  }
  function handleMove(id: string, cat: Car['category'], dir: -1 | 1): void {
    if (isReordering) return;
    const group = grouped.find((g) => g.category === cat); if (!group) return;
    const idx = group.cars.findIndex((c) => c.id === id); const target = idx + dir;
    if (idx === -1 || target < 0 || target >= group.cars.length) return;
    const reordered = [...group.cars]; const [moved] = reordered.splice(idx, 1); reordered.splice(target, 0, moved);
    const next = CAR_CATEGORIES.flatMap((c) => (c === cat ? reordered : (grouped.find((g) => g.category === c)?.cars ?? [])));
    void doReorder(next);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetId: string, cat: Car['category']): void {
    if (isReordering) return;
    e.preventDefault(); const draggedId = dragIdRef.current; dragIdRef.current = null;
    if (!draggedId || draggedId === targetId) return;
    const dragged = cars.find((c) => c.id === draggedId); if (!dragged || dragged.category !== cat) return;
    const group = grouped.find((g) => g.category === cat); if (!group) return;
    const from = group.cars.findIndex((c) => c.id === draggedId); const to = group.cars.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return;
    const reordered = [...group.cars]; const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
    const next = CAR_CATEGORIES.flatMap((c) => (c === cat ? reordered : (grouped.find((g) => g.category === c)?.cars ?? [])));
    void doReorder(next);
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
        <div className="space-y-4">
          {grouped.map(({ category: cat, cars: groupCars }) => (
            <CarCategoryGroup key={cat} category={cat} labelAr={CATEGORY_LABELS[cat]} cars={groupCars} expanded={expandedCategories.has(cat)} onToggle={() => toggleCategory(cat)} expandedId={expandedId} onToggleCar={(id) => setExpandedId((prev) => (prev === id ? null : id))} onUpdated={handleUpdated} onDeleted={handleDeleted} onMove={(id, dir) => handleMove(id, cat, dir)} onDragStart={(e, id) => { dragIdRef.current = id; e.dataTransfer.effectAllowed = 'move'; }} onDragOver={(e) => e.preventDefault()} onDrop={(e, targetId) => handleDrop(e, targetId, cat)} isReordering={isReordering} />
          ))}
        </div>
      )}
    </Panel>
  );
}
