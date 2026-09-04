import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Location } from '@/types/pricing';
import { adminCreateLocation, adminGetLocations, adminReorderLocations } from '@/data/api';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { LocationCard } from './LocationCard';

const TYPES: readonly Location['type'][] = ['travel', 'internal'] as const;

export function LocationAdmin() {
  const [items, setItems] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState<Location['type']>('travel');
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      setItems(await adminGetLocations());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المواقع');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm(): void {
    setName('');
    setNameAr('');
    setType('travel');
  }

  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    setCreateError(null);
    if (name.trim() === '' || nameAr.trim() === '') {
      setCreateError('الاسم والاسم (عربي) مطلوبان');
      return;
    }
    try {
      const body: Location = {
        id: generateId('loc'),
        name: name.trim(),
        nameAr: nameAr.trim(),
        type,
        displayOrder: 0,
      };
      await adminCreateLocation(body);
      resetForm();
      setCreateOpen(false);
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'فشل إنشاء الموقع');
    }
  }

  function handleUpdated(next: Location): void {
    setItems((prev) => prev.map((l) => (l.id === next.id ? next : l)));
  }

  function handleDeleted(deletedId: string): void {
    setItems((prev) => prev.filter((l) => l.id !== deletedId));
    if (expandedId === deletedId) setExpandedId(null);
  }

  async function doReorder(next: Location[]): Promise<void> {
    const prev = [...items];
    const nextWithOrder = next.map((l, i) => ({ ...l, displayOrder: i }));
    const ids = nextWithOrder.map((l) => l.id);
    setItems(nextWithOrder);
    setReorderError(null);
    try {
      await adminReorderLocations(ids);
    } catch (e) {
      setItems(prev);
      setReorderError(e instanceof Error ? e.message : 'فشل إعادة الترتيب');
    }
  }

  function handleMove(id: string, dir: -1 | 1): void {
    const idx = items.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    void doReorder(next);
  }

  return (
    <Panel title="المواقع">
      {error && <ErrorText message={error} />}
      {reorderError && <ErrorText message={reorderError} />}

      <div className="mb-6 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
        <button
          type="button"
          data-testid="location-create-toggle"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-[hsl(var(--muted))/0.4]"
        >
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">موقع جديد</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{createOpen ? 'إخفاء' : 'عرض'}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={createOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
        {createOpen && (
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 border-t border-[hsl(var(--border))] p-4">
            {createError && <ErrorText message={createError} />}
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="الاسم" value={name} onChange={setName} required />
              <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">النوع</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Location['type'])}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <PrimaryButton type="submit" data-testid="location-create-submit">
              إنشاء موقع
            </PrimaryButton>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((l, idx) => (
            <li key={l.id} dir="rtl" className="flex items-stretch gap-2 text-right">
              <ReorderControls
                id={l.id}
                index={idx}
                total={items.length}
                displayOrder={l.displayOrder}
                onMoveUp={() => handleMove(l.id, -1)}
                onMoveDown={() => handleMove(l.id, 1)}
                onDragStart={(e) => {
                  dragIdRef.current = l.id;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = dragIdRef.current;
                  dragIdRef.current = null;
                  if (!draggedId || draggedId === l.id) return;
                  const from = items.findIndex((x) => x.id === draggedId);
                  if (from === -1) return;
                  const next = [...items];
                  const [moved] = next.splice(from, 1);
                  next.splice(idx, 0, moved);
                  void doReorder(next);
                }}
              />
              <div className="min-w-0 flex-1">
                <LocationCard
                  group={l}
                  expanded={expandedId === l.id}
                  onToggle={() => setExpandedId((prev) => (prev === l.id ? null : l.id))}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد مواقع بعد.</li>}
        </ul>
      )}
    </Panel>
  );
}
