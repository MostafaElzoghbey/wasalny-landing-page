import { useEffect, useState } from 'react';

import type { Car } from '@/types';
import { adminDeleteCar, adminUpdateCar } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { OrderedImageList } from '@/components/ui/OrderedImageList';
import { DangerButton, ErrorText, Field, PrimaryButton } from './ui';
import { CAR_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS, cloneCar, syncAlts, validateCar } from './carHelpers';

interface CarCardProps {
  group: Car;
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
}

export function CarCard({ group, onUpdated, onDeleted }: CarCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Car>(() => cloneCar(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(cloneCar(group));
  }, [group, editing]);

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
      imageAlts: syncAlts(draft.images, draft.imageAlts).map((a) => a.trim()),
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
      {error && (
        <div className="px-4 pt-3">
          <ErrorText message={error} />
        </div>
      )}

      {!editing ? (
        <div className="flex items-center gap-3 px-4 py-2.5 text-right">
          <span data-testid={`car-order-${group.id}`} className="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--muted-foreground))]">{group.displayOrder}</span>
          {group.images.length > 0 ? (
            <img
              data-testid={`car-thumb-${group.id}`}
              src={group.images[0]}
              alt=""
              loading="lazy"
              className="h-12 w-16 shrink-0 rounded-lg border border-[hsl(var(--border))] object-cover"
            />
          ) : (
            <span data-testid={`car-thumb-placeholder-${group.id}`} className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[10px] text-[hsl(var(--muted-foreground))]">لا صورة</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.nameAr}</span>
              <span className={`rounded-full ${CATEGORY_COLORS[group.category].solid} px-2 py-0.5 text-xs font-semibold text-white`}>{CATEGORY_LABELS[group.category]}</span>
            </div>
            <p data-testid={`car-counts-${group.id}`} className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">
              {group.images.length} صور • {group.features.length} ميزات • <span className="font-mono">{group.id}</span>
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex shrink-0 items-center gap-2">
              <DangerButton type="button" data-testid={`car-delete-confirm-${group.id}`} onClick={handleDelete} disabled={saving}>
                تأكيد الحذف
              </DangerButton>
              <button
                type="button"
                data-testid={`car-delete-cancel-${group.id}`}
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <PrimaryButton type="button" data-testid={`car-edit-${group.id}`} onClick={enterEdit} disabled={saving}>
                تعديل
              </PrimaryButton>
              <DangerButton type="button" data-testid={`car-delete-${group.id}`} onClick={() => setConfirmDelete(true)} disabled={saving}>
                حذف
              </DangerButton>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-4">
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
          <ImageDropzone mode="multiple" value={draft.images} onChange={(v) => setDraft((p) => ({ ...p, images: v as string[] }))} testId={`car-images-edit-${group.id}`} label="الصور" previewPrefix={group.id} />
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
  );
}
