import { useState } from 'react';
import type { RouteData } from '@/types';
import { adminDeleteRouteData, adminUpdateRouteData } from '@/data/api';
import { ChipInput } from '@/components/ui/ChipInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { DangerButton, ErrorText, Field, PrimaryButton } from './ui';
import { cloneRouteData, validateRouteData } from './routeDataHelpers';

interface RouteDataCardProps {
  group: RouteData;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: RouteData) => void;
  onDeleted: (id: string) => void;
}

export function RouteDataCard({ group, expanded, onToggle, onUpdated, onDeleted }: RouteDataCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RouteData>(() => cloneRouteData(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  function enterEdit(): void {
    setDraft(cloneRouteData(group));
    setError(null);
    setConfirmDelete(false);
    setEditing(true);
  }
  function cancelEdit(): void {
    setDraft(cloneRouteData(group));
    setError(null);
    setConfirmDelete(false);
    setEditing(false);
  }
  async function handleSave(): Promise<void> {
    setError(null);
    if (draft.title.trim() === '') { setError('العنوان مطلوب'); return; }
    const vErr = validateRouteData(draft);
    if (vErr) { setError(vErr); return; }
    setSaving(true);
    try {
      const next: RouteData = { ...draft, title: draft.title.trim() };
      const patch = { title: next.title, fromLabel: next.fromLabel, toLabel: next.toLabel, description: next.description, metaTitle: next.metaTitle, metaDescription: next.metaDescription, heroImage: next.heroImage, priceStart: next.priceStart, distance: next.distance, duration: next.duration, features: next.features };
      await adminUpdateRouteData(group.id, patch);
      onUpdated(next);
      setEditing(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل التحديث'); } finally { setSaving(false); }
  }
  async function handleDelete(): Promise<void> {
    setError(null);
    try { await adminDeleteRouteData(group.id); onDeleted(group.id); } catch (e) { setError(e instanceof Error ? e.message : 'فشل الحذف'); } finally { setConfirmDelete(false); }
  }

  const pair = group.fromLabel && group.toLabel ? `${group.fromLabel} → ${group.toLabel}` : '';
  const summary = [pair, group.priceStart, group.distance, group.duration].filter(Boolean).join(' · ');

  return (
    <li data-testid={`routedata-card-${group.id}`} className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition">
      <button type="button" data-testid={`routedata-expand-${group.id}`} onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-[hsl(var(--muted))/0.5]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.title}</span>
            <span className="shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.id}</span>
          </div>
          {summary && <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">{summary}</p>}
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      {expanded && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))/0.4] p-4">
          {error && <ErrorText message={error} />}
          {!editing ? (
            <>
              <div className="mb-3 space-y-3 text-sm">
                {(group.metaTitle || group.metaDescription) && (
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                    {group.metaTitle && <p className="font-medium text-[hsl(var(--foreground))]">{group.metaTitle}</p>}
                    {group.metaDescription && <p className="mt-1 text-[hsl(var(--muted-foreground))]">{group.metaDescription}</p>}
                  </div>
                )}
                {group.heroImage && <img src={group.heroImage} alt={group.title} className="max-h-40 w-full rounded-lg object-cover" loading="lazy" />}
                {group.description && <p className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-[hsl(var(--foreground))]">{group.description}</p>}
                {group.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {group.features.map((f) => <span key={f} className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--foreground))]">{f}</span>)}
                  </div>
                )}
                <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">المعرّف: {group.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`routedata-edit-${group.id}`} onClick={enterEdit}>تعديل</PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton type="button" data-testid={`routedata-delete-confirm-${group.id}`} onClick={handleDelete}>تأكيد</DangerButton>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95">إلغاء</button>
                  </div>
                ) : (
                  <DangerButton type="button" data-testid={`routedata-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>حذف</DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Field label="العنوان" value={draft.title} onChange={(v) => setDraft((p) => ({ ...p, title: v }))} required />
                <Field label="من" value={draft.fromLabel} onChange={(v) => setDraft((p) => ({ ...p, fromLabel: v }))} required />
                <Field label="إلى" value={draft.toLabel} onChange={(v) => setDraft((p) => ({ ...p, toLabel: v }))} required />
                <Field label="عنوان الميتا" value={draft.metaTitle} onChange={(v) => setDraft((p) => ({ ...p, metaTitle: v }))} />
                <div className="sm:col-span-2">
                  <ImageDropzone mode="single" value={draft.heroImage} onChange={(v) => setDraft((p) => ({ ...p, heroImage: v as string }))} testId="routedata-hero" label="صورة البطل" />
                </div>
                <Field label="السعر الابتدائي" value={draft.priceStart} onChange={(v) => setDraft((p) => ({ ...p, priceStart: v }))} />
                <Field label="المسافة" value={draft.distance} onChange={(v) => setDraft((p) => ({ ...p, distance: v }))} />
                <Field label="المدة" value={draft.duration} onChange={(v) => setDraft((p) => ({ ...p, duration: v }))} />
                <Field label="وصف الميتا" value={draft.metaDescription} onChange={(v) => setDraft((p) => ({ ...p, metaDescription: v }))} textarea />
                <Field label="الوصف" value={draft.description} onChange={(v) => setDraft((p) => ({ ...p, description: v }))} textarea />
                <ChipInput label="المميزات" value={draft.features} onChange={(v) => setDraft((p) => ({ ...p, features: v }))} placeholder="اكتب واضغط Enter" testId="chip-input-features" />
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`routedata-save-${group.id}`} onClick={handleSave} disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</PrimaryButton>
                <button type="button" data-testid={`routedata-cancel-${group.id}`} onClick={cancelEdit} className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95">إلغاء</button>
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-3">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton type="button" data-testid={`routedata-delete-confirm-${group.id}`} onClick={handleDelete}>تأكيد الحذف</DangerButton>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95">إلغاء</button>
                  </div>
                ) : (
                  <DangerButton type="button" data-testid={`routedata-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>حذف</DangerButton>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
