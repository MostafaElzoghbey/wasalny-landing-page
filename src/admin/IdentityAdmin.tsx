import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { adminGetContent, adminUpdateContent } from '@/data/api';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { ErrorText, Panel, PrimaryButton } from './ui';
import { moveItem, removeItemAt, replaceItemAt } from './identityHelpers';

const CONTENT_KEY = 'mockupImages';

const ADD_ERROR = 'أضف صورة واحدة على الأقل';
const LOAD_ERROR = 'فشل تحميل الهوية';

export function IdentityAdmin() {
  const [images, setImages] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [draftImage, setDraftImage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(images.join(','));

  useEffect(() => {
    let cancelled = false;
    adminGetContent(CONTENT_KEY)
      .then((value) => {
        if (cancelled) return;
        setImages(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : LOAD_ERROR);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Optimistic whole-array persist; restores the previous list when the write fails. */
  async function persist(next: string[], prev: string[], fallbackMsg: string): Promise<boolean> {
    setImages(next);
    setBusy(true);
    try {
      await adminUpdateContent(CONTENT_KEY, next);
      return true;
    } catch (e) {
      setImages(prev);
      setError(e instanceof Error ? e.message : fallbackMsg);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleExpand(index: number): void {
    setError(null);
    setConfirmDelete(null);
    if (expandedId === index) {
      setExpandedId(null);
      return;
    }
    setExpandedId(index);
    setDraftImage(images[index] ?? '');
  }

  async function handleAdd(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (busy) return;
    if (pending.length === 0) {
      setError(ADD_ERROR);
      return;
    }
    setError(null);
    const prev = images;
    const ok = await persist([...prev, ...pending], prev, 'فشل إضافة الصور');
    if (ok) setPending([]);
  }

  async function handleSave(index: number): Promise<void> {
    if (draftImage === '') {
      setError('لا يمكن حفظ صف فارغ');
      return;
    }
    setError(null);
    const prev = images;
    const next = replaceItemAt(prev, index, draftImage);
    const ok = await persist(next, prev, 'فشل حفظ الصورة');
    if (ok) handleCancel();
  }

  function handleCancel(): void {
    setExpandedId(null);
    setDraftImage('');
  }

  async function handleDeleteConfirm(index: number): Promise<void> {
    setError(null);
    setConfirmDelete(null);
    if (expandedId === index) handleCancel();
    const prev = images;
    await persist(removeItemAt(prev, index), prev, 'فشل حذف الصورة');
  }

  async function handleMove(index: number, dir: -1 | 1): Promise<void> {
    if (index + dir < 0 || index + dir >= images.length || busy) return;
    setError(null);
    capture();
    const prev = images;
    await persist(moveItem(prev, index, dir), prev, 'فشل إعادة الترتيب');
  }

  return (
    <Panel title="هوية وصلني">
      {error && <ErrorText message={error} />}

      <form
        data-testid="identity-create"
        dir="rtl"
        onSubmit={handleAdd}
        className="mb-6 space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm"
      >
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-500" />
        <h4 className="font-semibold">إضافة صور الهوية</h4>
        <ImageDropzone
          mode="multiple"
          value={pending}
          onChange={(v) => setPending(Array.isArray(v) ? v : v ? [v] : [])}
          testId="identity-upload-create"
          label="الصور"
        />
        <PrimaryButton type="submit" data-testid="identity-add" disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : 'إضافة الصور'}
        </PrimaryButton>
      </form>

      {loading ? <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p> : (
        <ul ref={listRef} className="space-y-2">
          {images.map((src, i) => (
            <li
              key={`${src}-${i}`}
              dir="rtl"
              data-reorder-item={String(i)}
              data-testid={`identity-card-${i}`}
              className="reorder-item rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-right"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                  {i + 1}
                </span>
                <img
                  src={src}
                  alt={`صورة الهوية ${i + 1}`}
                  loading="lazy"
                  className="h-12 w-16 shrink-0 rounded-lg border border-[hsl(var(--border))] object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[hsl(var(--foreground))]">صورة الهوية {i + 1}</span>
                <button
                  type="button"
                  data-testid={`identity-expand-${i}`}
                  onClick={() => handleExpand(i)}
                  className="shrink-0 rounded-xl border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                >
                  {expandedId === i ? 'إغلاق' : 'تعديل'}
                </button>
                {confirmDelete === i ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      data-testid={`identity-delete-confirm-${i}`}
                      onClick={() => void handleDeleteConfirm(i)}
                      disabled={busy}
                      className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      type="button"
                      data-testid={`identity-delete-cancel-${i}`}
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-xl border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold transition hover:bg-[hsl(var(--muted))] active:scale-95"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid={`identity-delete-${i}`}
                    onClick={() => {
                      setError(null);
                      setConfirmDelete(i);
                    }}
                    className="shrink-0 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:scale-95"
                  >
                    حذف
                  </button>
                )}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    data-testid={`identity-move-up-${i}`}
                    onClick={() => void handleMove(i, -1)}
                    disabled={i === 0 || busy}
                    aria-label="تحريك الصورة لأعلى"
                    className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none transition hover:bg-[hsl(var(--border))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    data-testid={`identity-move-down-${i}`}
                    onClick={() => void handleMove(i, 1)}
                    disabled={i === images.length - 1 || busy}
                    aria-label="تحريك الصورة لأسفل"
                    className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none transition hover:bg-[hsl(var(--border))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
              </div>

              {expandedId === i && (
                <div className="mt-3 space-y-3 border-t border-[hsl(var(--border))] pt-3">
                  <ImageDropzone
                    mode="single"
                    value={draftImage}
                    onChange={(v) => setDraftImage(Array.isArray(v) ? (v[0] ?? '') : v)}
                    testId={`identity-upload-edit-${i}`}
                    previewPrefix={`identity-edit-${i}`}
                    label="الصورة"
                  />
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton
                      type="button"
                      data-testid="identity-save"
                      onClick={() => void handleSave(i)}
                      disabled={busy}
                    >
                      {busy ? 'جارٍ الحفظ…' : 'حفظ'}
                    </PrimaryButton>
                    <button
                      type="button"
                      data-testid="identity-cancel"
                      onClick={handleCancel}
                      className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold transition hover:bg-[hsl(var(--muted))] active:scale-95"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {images.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد صور هوية بعد.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}