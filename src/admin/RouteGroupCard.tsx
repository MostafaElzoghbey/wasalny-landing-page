import { useState } from 'react';

import type { Location, RouteGroup, VehicleCategory } from '@/types/pricing';
import { adminDeleteRouteGroup, adminUpdateRouteGroup } from '@/data/api';
import { Field, ErrorText, PrimaryButton, DangerButton } from './ui';
import { PricingDisplay, PricingEdit } from './RouteGroupPricingGrid';
import {
  cloneGroup,
  formatPrice,
  minPrice,
  validatePricing,
} from './routeGroupPricing';

interface RouteGroupCardProps {
  group: RouteGroup;
  locations: Location[];
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: RouteGroup) => void;
  onDeleted: (id: string) => void;
}

export function RouteGroupCard({
  group,
  locations,
  expanded,
  onToggle,
  onUpdated,
  onDeleted,
}: RouteGroupCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RouteGroup>(() => cloneGroup(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  const locName = (id: string) => locations.find((l) => l.id === id)?.nameAr ?? id;
  const fromSummary = group.fromLocations.map(locName).join('، ');
  const toSummary = group.toLocations.map(locName).join('، ');

  function enterEdit(): void {
    setDraft(cloneGroup(group));
    setError(null);
    setFromSearch('');
    setToSearch('');
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraft(cloneGroup(group));
    setError(null);
    setFromSearch('');
    setToSearch('');
    setEditing(false);
  }

  function setDraftPrice(
    category: VehicleCategory,
    field: 'oneWay' | 'roundTrip',
    raw: string,
  ): void {
    const num = raw === '' ? 0 : Number(raw);
    setDraft((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [category]: { ...prev.pricing[category], [field]: Number.isNaN(num) ? 0 : num },
      },
    }));
  }

  async function handleSave(): Promise<void> {
    setError(null);
    if (draft.nameAr.trim() === '') {
      setError('الاسم (عربي) مطلوب');
      return;
    }
    const pErr = validatePricing(draft.pricing);
    if (pErr) {
      setError(pErr);
      return;
    }
    setSaving(true);
    try {
      const payload: RouteGroup = {
        ...draft,
        nameAr: draft.nameAr.trim(),
        id: group.id,
        bidirectional: draft.type === 'travel',
      };
      await adminUpdateRouteGroup(group.id, payload);
      onUpdated(payload);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحديث مجموعة المسار');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError(null);
    try {
      await adminDeleteRouteGroup(group.id);
      onDeleted(group.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <li
      data-testid={`route-group-card-${group.id}`}
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition"
    >
      <button
        type="button"
        data-testid={`route-group-expand-${group.id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-[hsl(var(--muted))/0.5]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.nameAr}</span>
            <span
              className={
                group.type === 'travel'
                  ? 'rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white'
              }
            >
              {group.type === 'travel' ? 'سفر' : 'داخلي'}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
            {fromSummary || group.fromLocations.join(', ')} → {toSummary || group.toLocations.join(', ')}
            <span className="mx-2 text-[hsl(var(--border))]">|</span>
            <span className="font-medium text-[hsl(var(--foreground))]">ابتداءً من {formatPrice(minPrice(group.pricing))}</span>
            <span className="mx-1 text-[hsl(var(--muted-foreground))]">·</span>
            <span className="font-mono text-xs">{group.id}</span>
          </p>
        </div>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]"
          aria-hidden
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))/0.4] p-4">
          {error && <ErrorText message={error} />}

          {!editing ? (
            <>
              <div className="mb-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">الانطلاق</p>
                  <p className="text-[hsl(var(--foreground))]">{fromSummary || '—'}</p>
                  <p className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.fromLocations.join(', ')}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">الوصول</p>
                  <p className="text-[hsl(var(--foreground))]">{toSummary || '—'}</p>
                  <p className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.toLocations.join(', ')}</p>
                </div>
              </div>

              <PricingDisplay pricing={group.pricing} />

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`route-group-edit-${group.id}`} onClick={enterEdit}>
                  تعديل
                </PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton type="button" data-testid={`route-group-delete-confirm-${group.id}`} onClick={handleDelete}>
                      تأكيد الحذف
                    </DangerButton>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <DangerButton type="button" data-testid={`route-group-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>
                    حذف
                  </DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Field label="الاسم (عربي)" value={draft.nameAr} onChange={(v) => setDraft((p) => ({ ...p, nameAr: v }))} required />
                <label className="mb-3 block">
                  <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">النوع</span>
                  <select
                    value={draft.type}
                    onChange={(e) => {
                      const nextType = e.target.value as RouteGroup['type'];
                      setDraft((p) => ({ ...p, type: nextType, bidirectional: nextType === 'travel' }));
                    }}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
                  >
                    <option value="travel">سفر</option>
                    <option value="internal">داخلي</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">مواقع الانطلاق</span>
                  <input
                    type="text"
                    value={fromSearch}
                    onChange={(e) => setFromSearch(e.target.value)}
                    placeholder="بحث..."
                    className="mb-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary-500 focus:outline-none"
                  />
                  <div className="max-h-56 overflow-y-auto scroll-smooth rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 overscroll-contain shadow-inner" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}>
                    {(() => {
                      const filtered = locations.filter(
                        (loc) =>
                          !draft.toLocations.includes(loc.id) &&
                          (fromSearch === '' ||
                            loc.nameAr.toLowerCase().includes(fromSearch.toLowerCase()) ||
                            loc.id.toLowerCase().includes(fromSearch.toLowerCase())),
                      );
                      if (filtered.length === 0) return <p className="py-2 text-center text-xs text-[hsl(var(--muted-foreground))]">لا توجد مواقع مطابقة</p>;
                      return filtered.map((loc) => (
                        <label
                          key={loc.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
                        >
                          <input
                            type="checkbox"
                            checked={draft.fromLocations.includes(loc.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDraft((p) => ({
                                ...p,
                                fromLocations: checked
                                  ? [...p.fromLocations, loc.id]
                                  : p.fromLocations.filter((x) => x !== loc.id),
                              }));
                            }}
                            className="h-4 w-4 rounded border-[hsl(var(--border))] accent-primary-600"
                          />
                          <span className="flex-1 truncate text-[hsl(var(--foreground))]">{loc.nameAr}</span>
                          <span className="shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))]">{loc.id}</span>
                        </label>
                      ));
                    })()}
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">مواقع الوصول</span>
                  <input
                    type="text"
                    value={toSearch}
                    onChange={(e) => setToSearch(e.target.value)}
                    placeholder="بحث..."
                    className="mb-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary-500 focus:outline-none"
                  />
                  <div className="max-h-56 overflow-y-auto scroll-smooth rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 overscroll-contain shadow-inner" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}>
                    {(() => {
                      const filtered = locations.filter(
                        (loc) =>
                          !draft.fromLocations.includes(loc.id) &&
                          (toSearch === '' ||
                            loc.nameAr.toLowerCase().includes(toSearch.toLowerCase()) ||
                            loc.id.toLowerCase().includes(toSearch.toLowerCase())),
                      );
                      if (filtered.length === 0) return <p className="py-2 text-center text-xs text-[hsl(var(--muted-foreground))]">لا توجد مواقع مطابقة</p>;
                      return filtered.map((loc) => (
                        <label
                          key={loc.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-[hsl(var(--muted))]"
                        >
                          <input
                            type="checkbox"
                            checked={draft.toLocations.includes(loc.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDraft((p) => ({
                                ...p,
                                toLocations: checked
                                  ? [...p.toLocations, loc.id]
                                  : p.toLocations.filter((x) => x !== loc.id),
                              }));
                            }}
                            className="h-4 w-4 rounded border-[hsl(var(--border))] accent-primary-600"
                          />
                        <span className="flex-1 truncate text-[hsl(var(--foreground))]">{loc.nameAr}</span>
                        <span className="shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))]">{loc.id}</span>
                      </label>
                    ));
                    })()}
                  </div>
                </div>
              </div>

              <PricingEdit pricing={draft.pricing} onChange={setDraftPrice} />

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`route-group-save-${group.id}`} onClick={handleSave} disabled={saving}>
                  {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid={`route-group-cancel-${group.id}`}
                  onClick={cancelEdit}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
