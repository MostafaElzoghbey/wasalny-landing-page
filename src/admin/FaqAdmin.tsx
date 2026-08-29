import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { FaqWithId } from '@/types';
import {
  adminGetFaqs,
  adminCreateFaq,
  adminDeleteFaq,
} from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton, DangerButton } from './ui';

export function FaqAdmin() {
  const [faqs, setFaqs] = useState<FaqWithId[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await adminGetFaqs();
      setFaqs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await adminCreateFaq({ question, answer });
      setFaqs((prev) => [...prev, created]);
      setQuestion('');
      setAnswer('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create FAQ');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    try {
      await adminDeleteFaq(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete FAQ');
      await load();
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <Panel title="FAQs">
      {error && <ErrorText message={error} />}
      <form
        onSubmit={handleCreate}
        className="mb-6 rounded-lg border border-[hsl(var(--border))] p-4"
      >
        <Field
          label="Question"
          testid="faq-question"
          value={question}
          onChange={setQuestion}
          required
        />
        <Field
          label="Answer"
          testid="faq-answer"
          value={answer}
          onChange={setAnswer}
          textarea
          required
        />
        <PrimaryButton type="submit" data-testid="faq-create-submit">
          Create FAQ
        </PrimaryButton>
      </form>

      {faqs.length === 0 && loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {faqs.map((f) => (
            <li
              key={f.id}
              data-testid="faq-item"
              className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">{f.question}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{f.answer}</p>
              </div>
              {confirmId === f.id ? (
                <div className="flex items-center gap-2">
                  <DangerButton
                    type="button"
                    data-testid="faq-delete-confirm"
                    onClick={() => handleDelete(f.id)}
                  >
                    Confirm
                  </DangerButton>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <DangerButton
                  type="button"
                  data-testid="faq-delete"
                  onClick={() => setConfirmId(f.id)}
                >
                  Delete
                </DangerButton>
              )}
            </li>
          ))}
          {faqs.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No FAQs yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
