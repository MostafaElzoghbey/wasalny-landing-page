import { useState } from 'react';
import type { Location } from '@/types/pricing';
import { adminDeleteLocation, adminUpdateLocation } from '@/data/api';
import { DangerButton, ErrorText, Field, PrimaryButton } from './ui';
import { filterArabicName } from './arabicName';
import { cloneLocation, validateLocation } from './locationHelpers';

interface LocationCardProps {
  group: Location;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: Location) => void;
  onDeleted: (id: string) => void;
}

export function LocationCard({ group, expanded, onToggle, onUpdated, onDeleted }: LocationCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Location>(() => cloneLocation(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  function enterEdit(): void {
    setDraft(cloneLocation(group));
    setError(null);
    setConfirmDelete(false);
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraft(cloneLocation(group));
    setError(null);
    setEditing(false);
  }

  async function handleSave(): Promise<void> {
    setError(null);
    const trimmed = draft.nameAr.trim();
    const candidate: Location = { ...draft, name: trimmed, nameAr: trimmed };
    const validation = validateLocation(candidate);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    try {
      const normalized: Location = {
        id: group.id,
        name: trimmed,
        nameAr: trimmed,
        type: group.type,
        displayOrder: group.displayOrder,
      };
      await adminUpdateLocation(group.id, {
        name: normalized.name,
        nameAr: normalized.nameAr,
      });
      onUpdated(normalized);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحديث الموقع');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError(null);
    try {
      await adminDeleteLocation(group.id);
      onDeleted(group.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <div
      data-testid={`location-card-${group.id}`}
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition"
    >
      <button
        type="button"
        data-testid={`location-expand-${group.id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition-colors hover:bg-[hsl(var(--muted))/0.5]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.nameAr}</span>
          </div>
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
              <div className="mb-3 grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">الاسم</p>
                  <p className="text-[hsl(var(--foreground))]">{group.nameAr}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`location-edit-${group.id}`} onClick={enterEdit}>
                  تعديل
                </PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton
                      type="button"
                      data-testid={`location-delete-confirm-${group.id}`}
                      onClick={() => void handleDelete()}
                    >
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
                  <DangerButton type="button" data-testid={`location-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>
                    حذف
                  </DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <Field
                  label="الاسم"
                  value={draft.nameAr}
                  onChange={(v) => {
                    const next = filterArabicName(v);
                    setDraft((prev) => ({ ...prev, name: next, nameAr: next }));
                  }}
                  required
                  dir="rtl"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">الحروف العربية فقط</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  type="button"
                  data-testid={`location-save-${group.id}`}
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid={`location-cancel-${group.id}`}
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
