import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import type { Location, RouteGroup, VehicleCategory } from '@/types/pricing';
import {
  adminCreateRouteGroup,
  adminGetLocations,
  adminGetRouteGroups,
  adminReorderRouteGroups,
} from '@/data/api';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { generateId } from '@/utils/id';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { RouteGroupCard } from './RouteGroupCard';

const TYPES: RouteGroup['type'][] = ['travel', 'internal'];
const VEHICLE_CATEGORIES: VehicleCategory[] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
];

function emptyPricing(): RouteGroup['pricing'] {
  return {
    sedan: { oneWay: 0, roundTrip: 0 },
    suv: { oneWay: 0, roundTrip: 0 },
    family_cruiser: { oneWay: 0, roundTrip: 0 },
    minibus: { oneWay: 0, roundTrip: 0 },
  };
}

export function RouteGroupAdmin() {
  const [items, setItems] = useState<RouteGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [type, setType] = useState<RouteGroup['type']>('travel');
  const [nameAr, setNameAr] = useState('');
  const [fromLocations, setFromLocations] = useState<string[]>([]);
  const [toLocations, setToLocations] = useState<string[]>([]);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [prices, setPrices] = useState<Record<VehicleCategory, { oneWay: string; roundTrip: string }>>({
    sedan: { oneWay: '0', roundTrip: '0' },
    suv: { oneWay: '0', roundTrip: '0' },
    family_cruiser: { oneWay: '0', roundTrip: '0' },
    minibus: { oneWay: '0', roundTrip: '0' },
  });
  const [createOpen, setCreateOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dragIdRef = useRef<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(items.map((g) => g.id).join(','));

  async function load() {
    setLoading(true);
    try {
      const [groups, locs] = await Promise.all([adminGetRouteGroups(), adminGetLocations()]);
      setItems(groups);
      setLocations(locs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل مجموعات المسارات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setPrice(category: VehicleCategory, field: 'oneWay' | 'roundTrip', value: string): void {
    setPrices((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (nameAr.trim() === '') {
      setCreateError('الاسم (عربي) مطلوب');
      return;
    }
    const pricing = VEHICLE_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = {
          oneWay: Number(prices[category].oneWay),
          roundTrip: Number(prices[category].roundTrip),
        };
        return acc;
      },
      {} as RouteGroup['pricing'],
    );
    for (const cat of VEHICLE_CATEGORIES) {
      const p = pricing[cat];
      if (!Number.isInteger(p.oneWay) || !Number.isInteger(p.roundTrip) || p.oneWay < 0 || p.roundTrip < 0) {
        setCreateError('يجب أن تكون الأسعار أعدادًا صحيحة غير سالبة');
        return;
      }
    }
    try {
      if (fromLocations.length === 0 || toLocations.length === 0) {
        setCreateError('اختر موقعًا واحدًا على الأقل في كل من الانطلاق والوجهة');
        return;
      }
      const bidirectional = type === 'travel';
      const body: RouteGroup = {
        id: generateId('rg'),
        type,
        nameAr: nameAr.trim(),
        fromLocations,
        toLocations,
        bidirectional,
        pricing,
        displayOrder: 0,
      };
      await adminCreateRouteGroup(body);
      setNameAr('');
      setFromLocations([]);
      setToLocations([]);
      setPrices({
        sedan: { oneWay: '0', roundTrip: '0' },
        suv: { oneWay: '0', roundTrip: '0' },
        family_cruiser: { oneWay: '0', roundTrip: '0' },
        minibus: { oneWay: '0', roundTrip: '0' },
      });
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'فشل إنشاء مجموعة المسار');
    }
  }

  function handleUpdated(next: RouteGroup): void {
    setItems((prev) => prev.map((g) => (g.id === next.id ? next : g)));
  }

  function handleDeleted(deletedId: string): void {
    setItems((prev) => prev.filter((g) => g.id !== deletedId));
    if (expandedId === deletedId) setExpandedId(null);
  }

  async function doReorder(next: RouteGroup[]): Promise<void> {
    const prev = [...items];
    const nextWithOrder = next.map((g, i) => ({ ...g, displayOrder: i }));
    const ids = nextWithOrder.map((g) => g.id);
    setItems(nextWithOrder);
    setReorderError(null);
    try {
      await adminReorderRouteGroups(ids);
    } catch (e) {
      setItems(prev);
      setReorderError(e instanceof Error ? e.message : 'فشل إعادة الترتيب');
    }
  }

  function handleMove(id: string, dir: -1 | 1): void {
    const idx = items.findIndex((g) => g.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= items.length) return;
    capture();
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    void doReorder(next);
  }

  return (
    <Panel title="مجموعات المسارات">
      {error && <ErrorText message={error} />}
      {reorderError && <ErrorText message={reorderError} />}

      <div className="mb-6 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-[hsl(var(--muted))/0.4]"
        >
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">مجموعة مسار جديدة</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{createOpen ? 'إخفاء' : 'عرض'}</span>
        </button>
        {createOpen && (
          <form onSubmit={handleCreate} className="space-y-3 border-t border-[hsl(var(--border))] p-4">
            {createError && <ErrorText message={createError} />}
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">النوع</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as RouteGroup['type'])}
                  className="min-h-[44px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-base text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none sm:text-sm"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'travel' ? 'سفر' : 'داخلي'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">مواقع الانطلاق</span>
                <p className="mb-2 text-xs text-[hsl(var(--muted-foreground))]">اختر من المواقع الحالية (أنشئها أولاً في تبويب المواقع)</p>
                <input
                  type="text"
                  value={fromSearch}
                  onChange={(e) => setFromSearch(e.target.value)}
                  placeholder="بحث..."
                  className="mb-2 min-h-[44px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1.5 text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary-500 focus:outline-none sm:text-sm"
                />
                <div
                  data-testid="route-group-from-picker"
                  className="max-h-56 overflow-y-auto scroll-smooth rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 overscroll-contain shadow-inner"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
                >
                  {(() => {
                    const filtered = locations.filter(
                      (loc) =>
                        !toLocations.includes(loc.id) &&
                        (fromSearch === '' ||
                          loc.nameAr.toLowerCase().includes(fromSearch.toLowerCase()) ||
                          loc.id.toLowerCase().includes(fromSearch.toLowerCase())),
                    );
                    if (locations.length === 0) return <p className="py-2 text-center text-xs text-[hsl(var(--muted-foreground))]">لا توجد مواقع</p>;
                    if (filtered.length === 0) return <p className="py-2 text-center text-xs text-[hsl(var(--muted-foreground))]">لا توجد مواقع مطابقة</p>;
                    return filtered.map((loc) => (
                      <label
                        key={loc.id}
                        className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
                      >
                        <input
                          type="checkbox"
                          checked={fromLocations.includes(loc.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFromLocations((prev) =>
                              checked ? [...prev, loc.id] : prev.filter((x) => x !== loc.id),
                            );
                          }}
                          className="h-5 w-5 shrink-0 rounded border-[hsl(var(--border))] accent-primary-600"
                        />
                        <span className="flex-1 truncate text-[hsl(var(--foreground))]">{loc.nameAr}</span>
                        <span className="hidden shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))] min-[420px]:inline">{loc.id}</span>
                        <span
                          className={
                            loc.type === 'travel'
                              ? 'shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white'
                              : 'shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white'
                          }
                        >
                          {loc.type === 'travel' ? 'سفر' : 'داخلي'}
                        </span>
                      </label>
                    ));
                  })()}
                </div>
                {fromLocations.length > 0 && (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{fromLocations.length} محدد</p>
                )}
              </div>
              <div className="min-w-0">
                <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">مواقع الوصول</span>
                <p className="mb-2 text-xs text-[hsl(var(--muted-foreground))]">اختر الوجهات المتاحة</p>
                <input
                  type="text"
                  value={toSearch}
                  onChange={(e) => setToSearch(e.target.value)}
                  placeholder="بحث..."
                  className="mb-2 min-h-[44px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1.5 text-base text-[hsl(var(--muted-foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary-500 focus:outline-none sm:text-sm"
                />
                <div
                  data-testid="route-group-to-picker"
                  className="max-h-56 overflow-y-auto scroll-smooth rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 overscroll-contain shadow-inner"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
                >
                  {(() => {
                    const filtered = locations.filter(
                      (loc) =>
                        !fromLocations.includes(loc.id) &&
                        (toSearch === '' ||
                          loc.nameAr.toLowerCase().includes(toSearch.toLowerCase()) ||
                          loc.id.toLowerCase().includes(toSearch.toLowerCase())),
                    );
                    if (locations.length === 0) return <p className="py-2 text-center text-xs text-[hsl(var(--muted-foreground))]">لا توجد مواقع</p>;
                    if (filtered.length === 0) return <p className="py-2 text-center text-xs text-[hsl(var(--muted-foreground))]">لا توجد مواقع مطابقة</p>;
                    return filtered.map((loc) => (
                      <label
                        key={loc.id}
                        className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
                      >
                        <input
                          type="checkbox"
                          checked={toLocations.includes(loc.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setToLocations((prev) =>
                              checked ? [...prev, loc.id] : prev.filter((x) => x !== loc.id),
                            );
                          }}
                          className="h-5 w-5 shrink-0 rounded border-[hsl(var(--border))] accent-primary-600"
                        />
                        <span className="flex-1 truncate text-[hsl(var(--foreground))]">{loc.nameAr}</span>
                        <span className="hidden shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))] min-[420px]:inline">{loc.id}</span>
                        <span
                          className={
                            loc.type === 'travel'
                              ? 'shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white'
                              : 'shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white'
                          }
                        >
                          {loc.type === 'travel' ? 'سفر' : 'داخلي'}
                        </span>
                      </label>
                    ));
                  })()}
                </div>
                {toLocations.length > 0 && (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{toLocations.length} محدد</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-4">
              {VEHICLE_CATEGORIES.map((category) => (
                <div key={category} className="min-w-0 rounded-lg border border-[hsl(var(--border))] p-2">
                  <p className="mb-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{category === 'sedan' ? 'سيدان' : category === 'suv' ? 'دفع رباعي' : category === 'family_cruiser' ? 'عائلي' : 'ميكروباص'}</p>
                  <Field label="ذهاب فقط" type="number" inputMode="numeric" value={prices[category].oneWay} onChange={(v) => setPrice(category, 'oneWay', v)} />
                  <Field label="ذهاب وعودة" type="number" inputMode="numeric" value={prices[category].roundTrip} onChange={(v) => setPrice(category, 'roundTrip', v)} />
                </div>
              ))}
            </div>

            <PrimaryButton type="submit" data-testid="route-group-create">
              إنشاء مجموعة المسار
            </PrimaryButton>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      ) : (
        <ul ref={listRef} className="space-y-3">
          {items.map((g, idx) => (
            <li key={g.id} dir="rtl" data-reorder-item={g.id} className="reorder-item flex items-stretch gap-2 text-right" style={{ transitionDelay: `${idx * 15}ms` }}>
              <ReorderControls
                id={g.id}
                index={idx}
                total={items.length}
                displayOrder={g.displayOrder}
                onMoveUp={() => handleMove(g.id, -1)}
                onMoveDown={() => handleMove(g.id, 1)}
                onDragStart={(e) => {
                  dragIdRef.current = g.id;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = dragIdRef.current;
                  dragIdRef.current = null;
                  if (!draggedId || draggedId === g.id) return;
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
                <RouteGroupCard
                  group={g}
                  locations={locations}
                  expanded={expandedId === g.id}
                  onToggle={() => setExpandedId((prev) => (prev === g.id ? null : g.id))}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد مجموعات مسارات بعد.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}

// keep helper used in tests if needed
// eslint-disable-next-line react-refresh/only-export-components -- helper co-exported with component for tests
export function _emptyPricing(): RouteGroup['pricing'] {
  return emptyPricing();
}
