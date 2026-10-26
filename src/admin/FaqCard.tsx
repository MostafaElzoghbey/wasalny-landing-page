import { useState } from 'react';
import type { FaqWithId } from '@/types';
import { adminUpdateFaq } from '@/data/api';
import { Field, ErrorText, PrimaryButton, DangerButton } from './ui';

interface FaqCardProps {
  faq: FaqWithId;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: FaqWithId) => void;
  onDeleted: (id: string) => void;
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function FaqCard({ faq, expanded, onToggle, onUpdated, onDeleted }: FaqCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState(faq.question);
  const [draftAnswer, setDraftAnswer] = useState(faq.answer);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  function enterEdit(): void {
    setDraftQuestion(faq.question);
    setDraftAnswer(faq.answer);
    setLocalError(null);
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraftQuestion(faq.question);
    setDraftAnswer(faq.answer);
    setLocalError(null);
    setEditing(false);
  }

  async function handleSave(): Promise<void> {
    setLocalError(null);
    const q = draftQuestion.trim();
    const a = draftAnswer.trim();
    if (q === '') {
      setLocalError('السؤال مطلوب');
      return;
    }
    if (a === '') {
      setLocalError('الإجابة مطلوبة');
      return;
    }
    setSaving(true);
    try {
      await adminUpdateFaq(faq.id, { question: q, answer: a });
      onUpdated({ ...faq, question: q, answer: a });
      setEditing(false);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'فشل تحديث السؤال');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid={`faq-card-${faq.id}`}
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition"
    >
      <button
        type="button"
        data-testid={`faq-expand-${faq.id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition-colors hover:bg-[hsl(var(--muted))/0.5]"
      >
        <div className="min-w-0 flex-1">
          <p data-testid={`faq-question-${faq.id}`} className="truncate font-medium text-[hsl(var(--foreground))]">
            {faq.question}
          </p>
          <p data-testid={`faq-answer-${faq.id}`} className="mt-0.5 truncate text-sm text-[hsl(var(--muted-foreground))]">
            {truncate(faq.answer)}
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
        <div
          data-testid="faq-item"
          className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))/0.4] p-4"
        >
          {localError && <ErrorText message={localError} />}

          {!editing ? (
            <>
              <div className="mb-3 space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{faq.question}</p>
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{faq.answer}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  type="button"
                  data-testid={`faq-edit-${faq.id}`}
                  onClick={enterEdit}
                >
                  تعديل
                </PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton
                      type="button"
                      data-testid="faq-delete-confirm"
                      onClick={() => {
                        setConfirmDelete(false);
                        onDeleted(faq.id);
                      }}
                    >
                      تأكيد
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
                  <DangerButton
                    type="button"
                    data-testid="faq-delete"
                    onClick={() => setConfirmDelete(true)}
                  >
                    حذف
                  </DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Field
                label="السؤال"
                testid={`faq-edit-question-${faq.id}`}
                value={draftQuestion}
                onChange={setDraftQuestion}
                required
              />
              <Field
                label="الإجابة"
                testid={`faq-edit-answer-${faq.id}`}
                value={draftAnswer}
                onChange={setDraftAnswer}
                textarea
                required
              />
              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  type="button"
                  data-testid={`faq-save-${faq.id}`}
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid={`faq-cancel-${faq.id}`}
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
