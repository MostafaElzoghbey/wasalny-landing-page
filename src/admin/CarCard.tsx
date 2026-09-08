import { useState } from 'react';

import type { Car } from '@/types';
import { adminDeleteCar, adminUpdateCar } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { OrderedImageList } from '@/components/ui/OrderedImageList';
import { DangerButton, ErrorText, Field, PrimaryButton } from './ui';
import { CAR_CATEGORIES, CATEGORY_LABELS, cloneCar, validateCar } from './carHelpers';

interface CarCardProps {
  group: Car;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
}

export function CarCard({ group, expanded, onToggle, onUpdated, onDeleted }: CarCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Car>(() => cloneCar(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  function enterEdit(): void {
    setDraft(cloneCar(group));
    setError(null);
    setConfirmDelete(false);
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraft(cloneCar(group));
    setError(null);
    setEditing(false);
  }

  async function handleSave(): Promise<void> {
    setError(null);
    const normalized: Car = {
      ...draft,
      nameAr: draft.nameAr.trim(),
      categoryAr: CATEGORY_LABELS[draft.category],
      description: draft.description.trim(),
      id: group.id,
    };
    const validation = validateCar(normalized);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    try {
      const { id: _id, ...payload } = normalized; // eslint-disable-line @typescript-eslint/no-unused-vars
      await adminUpdateCar(group.id, payload as Partial<Car>);
      onUpdated(normalized);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحديث السيارة');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError(null);
    try {
      await adminDeleteCar(group.id);
      onDeleted(group.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <div
      data-testid={`car-card-${group.id}`}
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition"
    >
      <button
        type="button"
        data-testid={`car-expand-${group.id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-[hsl(var(--muted))/0.5]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {group.images[0] ? (
              <img src={group.images[0]} alt="" loading="lazy" data-testid={`car-thumb-${group.id}`} className="h-10 w-10 shrink-0 rounded-lg border border-[hsl(var(--border))] object-cover" />
            ) : (
              <div data-testid={`car-thumb-placeholder-${group.id}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-xs text-[hsl(var(--muted-foreground))]">—</div>
            )}
            <span data-testid={`car-order-${group.id}`} className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--muted-foreground))]">{group.displayOrder}</span>
            <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.nameAr}</span>
            <span className={group.category === 'sedan' || group.category === 'wedding' ? 'rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white' : 'rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white'}>{CATEGORY_LABELS[group.category]}</span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.id}</p>
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
              <div className="mb-3 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                    <p className="text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">الفئة (عربي)</p>
                    <p className="text-[hsl(var(--foreground))]">{CATEGORY_LABELS[group.category]}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">الوصف</p>
                    <p className="text-[hsl(var(--foreground))]">{group.description || '—'}</p>
                    {group.seoDescription && (
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">تحسين محركات البحث: {group.seoDescription}</p>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">الصور</p>
                  {group.images.length > 0 ? (
                    <ol data-testid={`car-images-${group.id}`} className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {group.images.map((src, idx) => (
                        <li key={`${src}-${idx}`} className="relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                          <img src={src} alt="" loading="lazy" className="h-28 w-full object-cover" />
                          <span data-testid={`car-image-order-${group.id}-${idx}`} className="absolute left-1 top-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-xs font-bold text-white">{idx + 1}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">لا توجد صور</p>
                  )}
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">المميزات</p>
                  {group.features.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {group.features.map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--foreground))]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">لا توجد مميزات</p>
                  )}
                </div>
                <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">المعرّف: {group.id}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`car-edit-${group.id}`} onClick={enterEdit}>
                  تعديل
                </PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton type="button" data-testid={`car-delete-confirm-${group.id}`} onClick={handleDelete}>
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
                  <DangerButton type="button" data-testid={`car-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>
                    حذف
                  </DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">المعرّف: {group.id} (غير قابل للتعديل)</p>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Field label="الاسم (عربي)" value={draft.nameAr} onChange={(v) => setDraft((p) => ({ ...p, nameAr: v }))} required />
                <label className="mb-3 block">
                  <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">الفئة</span>
                  <select
                    value={draft.category}
                    onChange={(e) => {
                      const cat = e.target.value as Car['category'];
                      setDraft((p) => ({ ...p, category: cat, categoryAr: CATEGORY_LABELS[cat] }));
                    }}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
                  >
                    {CAR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="وصف تحسين محركات البحث" value={draft.seoDescription ?? ''} onChange={(v) => setDraft((p) => ({ ...p, seoDescription: v }))} />
              </div>
              <Field label="الوصف" value={draft.description} onChange={(v) => setDraft((p) => ({ ...p, description: v }))} textarea />
              <ImageDropzone mode="multiple" value={draft.images} onChange={(v) => setDraft((p) => ({ ...p, images: v as string[] }))} maxImages={10} testId="car-images" label="الصور" />
              {draft.images.length > 0 && (
                <OrderedImageList
                  value={draft.images}
                  alts={draft.imageAlts}
                  onChange={(images) => setDraft((p) => ({ ...p, images }))}
                  onAltsChange={(imageAlts) => setDraft((p) => ({ ...p, imageAlts }))}
                  testIdPrefix="car-image"
                  itemId={group.id}
                />
              )}
              <ChipInput label="المميزات" value={draft.features} onChange={(v) => setDraft((p) => ({ ...p, features: v }))} placeholder="اكتب واضغط Enter" testId="chip-input-features" />

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`car-save-${group.id}`} onClick={handleSave} disabled={saving}>
                  {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid={`car-cancel-${group.id}`}
                  onClick={cancelEdit}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
