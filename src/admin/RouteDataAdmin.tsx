import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { RouteData } from '@/types';
import { adminCreateRouteData, adminGetRouteData, adminReorderRouteData } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { RouteDataCard } from './RouteDataCard';
import { validateRouteData } from './routeDataHelpers';

export function RouteDataAdmin() {
  const [items, setItems] = useState<RouteData[]>([]);
  const [fromLabel, setFromLabel] = useState('');
  const [toLabel, setToLabel] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [priceStart, setPriceStart] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(items.map((r) => r.id).join(','));

  async function load() {
    setLoading(true);
    try {
      setItems(await adminGetRouteData());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل بيانات المسارات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setFromLabel('');
    setToLabel('');
    setTitle('');
    setDescription('');
    setMetaTitle('');
    setMetaDescription('');
    setHeroImage('');
    setPriceStart('');
    setDistance('');
    setDuration('');
    setFeatures([]);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body: RouteData = {
        id: generateId('route'),
        fromLabel,
        toLabel,
        title,
        description,
        metaTitle,
        metaDescription,
        heroImage,
        priceStart,
        distance,
        duration,
        features,
        faqs: [],
        displayOrder: 0,
      };
      const vErr = validateRouteData(body);
      if (vErr) {
        setError(vErr);
        return;
      }
      await adminCreateRouteData(body);
      resetForm();
      setCreateOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إنشاء بيانات المسار');
    }
  }

  function handleUpdated(next: RouteData) {
    setItems((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  }

  function handleDeleted(deletedId: string) {
    setItems((prev) => prev.filter((r) => r.id !== deletedId));
    if (expandedId === deletedId) setExpandedId(null);
  }

  async function doReorder(next: RouteData[]): Promise<void> {
    const prev = [...items];
    const nextWithOrder = next.map((r, i) => ({ ...r, displayOrder: i }));
    const ids = nextWithOrder.map((r) => r.id);
    setItems(nextWithOrder);
    setReorderError(null);
    try {
      await adminReorderRouteData(ids);
    } catch (e) {
      setItems(prev);
      setReorderError(e instanceof Error ? e.message : 'فشل إعادة الترتيب');
    }
  }

  function handleMove(id: string, dir: -1 | 1): void {
    const idx = items.findIndex((r) => r.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= items.length) return;
    capture();
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    void doReorder(next);
  }

  function toggleExpand(itemId: string) {
    setExpandedId((prev) => (prev === itemId ? null : itemId));
  }

  return (
    <Panel title="بيانات المسارات">
      {error && <ErrorText message={error} />}
      {reorderError && <ErrorText message={reorderError} />}

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-start text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))/0.5] sm:px-4 sm:py-3"
          data-testid="routedata-create-toggle"
        >
          <span>إنشاء بيانات مسار</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={createOpen ? 'rotate-180 transition-transform' : 'transition-transform'}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {createOpen && (
          <form onSubmit={handleCreate} className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 rounded-lg border border-[hsl(var(--border))] p-3 sm:grid-cols-2 sm:p-4">
            <Field label="العنوان" value={title} onChange={setTitle} required />
            <Field label="من" value={fromLabel} onChange={setFromLabel} required />
            <Field label="إلى" value={toLabel} onChange={setToLabel} required />
            <Field label="عنوان الميتا" value={metaTitle} onChange={setMetaTitle} />
            <Field label="السعر الابتدائي" value={priceStart} onChange={setPriceStart} />
            <Field label="المسافة" value={distance} onChange={setDistance} />
            <Field label="المدة" value={duration} onChange={setDuration} />
            <div className="sm:col-span-2">
              <ImageDropzone mode="single" value={heroImage} onChange={(v) => setHeroImage(v as string)} testId="routedata-hero" label="صورة البطل" />
            </div>
            <Field label="وصف الميتا" value={metaDescription} onChange={setMetaDescription} textarea />
            <Field label="الوصف" value={description} onChange={setDescription} textarea />
            <ChipInput label="المميزات" value={features} onChange={setFeatures} placeholder="اكتب واضغط Enter" testId="chip-input-features" />
            <div className="sm:col-span-2">
              <PrimaryButton type="submit">إنشاء بيانات المسار</PrimaryButton>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      ) : (
        <ul ref={listRef} className="space-y-2">
          {items.map((r, idx) => (
            <li key={r.id} dir="rtl" data-reorder-item={r.id} className="reorder-item flex items-stretch gap-2 text-start" style={{ transitionDelay: `${idx * 15}ms` }}>
              <ReorderControls
                id={r.id}
                index={idx}
                total={items.length}
                displayOrder={r.displayOrder}
                onMoveUp={() => handleMove(r.id, -1)}
                onMoveDown={() => handleMove(r.id, 1)}
                onDragStart={(e) => {
                  dragIdRef.current = r.id;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = dragIdRef.current;
                  dragIdRef.current = null;
                  if (!draggedId || draggedId === r.id) return;
                  const from = items.findIndex((x) => x.id === draggedId);
                  if (from === -1) return;
                  capture();
                  const next = [...items];
                  const [moved] = next.splice(from, 1);
                  next.splice(idx, 0, moved);
                  void doReorder(next);
                }}
              />
              <div className="min-w-0 flex-1">
                <RouteDataCard
                  group={r}
                  expanded={expandedId === r.id}
                  onToggle={() => toggleExpand(r.id)}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد بيانات مسارات بعد.</li>}
        </ul>
      )}
    </Panel>
  );
}
