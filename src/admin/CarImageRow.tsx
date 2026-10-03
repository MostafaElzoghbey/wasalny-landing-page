import { useState } from 'react';

import type { Car } from '@/types';
import { adminDeleteCar, adminUpdateCar } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import type { ImageRow } from './carImageRows';
import { buildRowDeletePayload, buildRowEditPayload, imageRowDisplayName } from './carImageRows';
import { validateCar } from './carHelpers';
import { ErrorText, Field, PrimaryButton, DangerButton, GhostButton } from './ui';

interface CarImageRowProps {
  car: Car;
  row: ImageRow;
  rowNumber: number;
  categoryLabel: string;
  onUpdated: (next: Car) => void;
  onDeleted: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function CarImageRow({ car, row, rowNumber, categoryLabel, onUpdated, onDeleted, canMoveUp, canMoveDown, onMoveUp, onMoveDown }: CarImageRowProps) {
  const name = imageRowDisplayName(car, row.index);
  const rowTestId = `car-imagerow-${row.carId}-${row.index}`;
  const hasPhoto = row.imageUrl !== null && row.imageUrl !== '';
  const [editing, setEditing] = useState(false);
  const [draftNameAr, setDraftNameAr] = useState(car.nameAr);
  const [draftDescription, setDraftDescription] = useState(car.description);
  const [draftFeatures, setDraftFeatures] = useState<string[]>([...car.features]);
  const [draftImage, setDraftImage] = useState(car.images[row.index] ?? '');
  const [draftAlt, setDraftAlt] = useState(car.imageAlts?.[row.index] ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function enterEdit(): void {
    setDraftNameAr(car.nameAr);
    setDraftDescription(car.description);
    setDraftFeatures([...car.features]);
    setDraftImage(car.images[row.index] ?? '');
    setDraftAlt(car.imageAlts?.[row.index] ?? '');
    setError(null);
    setEditing(true);
  }

  function cancelEdit(): void {
    setError(null);
    setEditing(false);
  }

  async function handleSave(): Promise<void> {
    setError(null);
    const normalized: Car = buildRowEditPayload(car, row.index, {
      nameAr: draftNameAr,
      description: draftDescription,
      image: draftImage,
      alt: draftAlt,
      features: draftFeatures,
    });
    const validation = validateCar(normalized);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    try {
      // NOTE: last-write-wins — two rows of the same parent editing shared
      // fields (nameAr/description/features) concurrently overwrite each other;
      // acceptable for the single-admin panel.
      const { id: _id, ...payload } = normalized; // eslint-disable-line @typescript-eslint/no-unused-vars
      await adminUpdateCar(car.id, payload as Partial<Car>);
      onUpdated(normalized);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحديث الصورة');
    } finally {
      setSaving(false);
    }
  }

  function enterDelete(): void {
    setError(null);
    setConfirmDelete(true);
  }

  function cancelDelete(): void {
    setConfirmDelete(false);
  }

  async function handleDeleteConfirm(): Promise<void> {
    setError(null);
    if (car.images.length <= 1) {
      setDeleting(true);
      try {
        await adminDeleteCar(car.id);
        onDeleted(car.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل حذف السيارة');
      } finally {
        setDeleting(false);
        setConfirmDelete(false);
      }
      return;
    }
    const normalized: Car = buildRowDeletePayload(car, row.index);
    setDeleting(true);
    try {
      const { id: _id, ...payload } = normalized; // eslint-disable-line @typescript-eslint/no-unused-vars
      await adminUpdateCar(car.id, payload as Partial<Car>);
      onUpdated(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حذف الصورة');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <li
      dir="rtl"
      data-testid={rowTestId}
      className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-end"
    >
      {error && <ErrorText message={error} />}
      {!editing ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            data-testid={`car-imagerow-order-${row.carId}-${row.index}`}
            className="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--muted-foreground))]"
          >
            {rowNumber}
          </span>
          {row.imageUrl ? (
            <img
              data-testid={`car-imagerow-thumb-${row.carId}-${row.index}`}
              src={row.imageUrl}
              alt={row.alt}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-lg border border-[hsl(var(--border))] object-cover sm:w-16"
            />
          ) : (
            <span
              data-testid={`car-imagerow-thumb-placeholder-${row.carId}-${row.index}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-xs text-[hsl(var(--muted-foreground))] sm:w-16"
            >
              لا صورة
            </span>
          )}
          <span className="min-w-0 flex-1 basis-full truncate text-sm font-medium text-[hsl(var(--foreground))] sm:basis-auto">{name}</span>
          <span className="hidden shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-semibold text-[hsl(var(--muted-foreground))] sm:inline-block">
            {categoryLabel}
          </span>
          <GhostButton
            type="button"
            data-testid={`car-imagerow-edit-${row.carId}-${row.index}`}
            onClick={enterEdit}
            className="shrink-0"
          >
            تعديل
          </GhostButton>
          {confirmDelete ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DangerButton
                type="button"
                data-testid={`car-imagerow-delete-confirm-${row.carId}-${row.index}`}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {car.images.length <= 1 ? 'تأكيد حذف السيارة' : 'تأكيد الحذف'}
              </DangerButton>
              <GhostButton
                type="button"
                data-testid={`car-imagerow-delete-cancel-${row.carId}-${row.index}`}
                onClick={cancelDelete}
              >
                إلغاء
              </GhostButton>
            </div>
          ) : (
            <button
              type="button"
              data-testid={`car-imagerow-delete-${row.carId}-${row.index}`}
              onClick={enterDelete}
              className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:scale-95"
            >
              حذف
            </button>
          )}
          <div className="flex shrink-0 flex-col gap-0.5">
            <button
              type="button"
              data-testid={`car-imagerow-up-${row.carId}-${row.index}`}
              onClick={onMoveUp}
              disabled={!canMoveUp || !hasPhoto}
              aria-label="تحريك الصورة لأعلى"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--border))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              data-testid={`car-imagerow-down-${row.carId}-${row.index}`}
              onClick={onMoveDown}
              disabled={!canMoveDown || !hasPhoto}
              aria-label="تحريك الصورة لأسفل"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--border))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↓
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            السيارة الأصل: <span className="font-semibold text-[hsl(var(--foreground))]">{car.nameAr}</span> (للقراءة فقط)
          </p>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Field label="الاسم (عربي)" value={draftNameAr} onChange={setDraftNameAr} required testid={`car-imagerow-name-${row.carId}-${row.index}`} />
            <Field label="الوصف" value={draftDescription} onChange={setDraftDescription} textarea testid={`car-imagerow-desc-${row.carId}-${row.index}`} />
            <Field label="النص البديل للصورة" value={draftAlt} onChange={setDraftAlt} testid={`car-imagerow-alt-${row.carId}-${row.index}`} />
            <div className="sm:col-span-2">
              <ImageDropzone
                mode="single"
                value={draftImage}
                onChange={(v) => setDraftImage(v as string)}
                testId={`car-imagerow-images-${row.carId}-${row.index}`}
                label="الصورة"
              />
            </div>
            <ChipInput
              label="المميزات"
              value={draftFeatures}
              onChange={setDraftFeatures}
              placeholder="اكتب واضغط Enter"
              testId={`car-imagerow-features-${row.carId}-${row.index}`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              data-testid={`car-imagerow-save-${row.carId}-${row.index}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
            </PrimaryButton>
            <GhostButton
              type="button"
              data-testid={`car-imagerow-cancel-${row.carId}-${row.index}`}
              onClick={cancelEdit}
            >
              إلغاء
            </GhostButton>
          </div>
        </div>
      )}
    </li>
  );
}
