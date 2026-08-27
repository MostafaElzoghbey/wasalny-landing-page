import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Faq } from '@/types';
import {
  adminGetFaqs,
  adminCreateFaq,
  adminDeleteFaq,
} from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton, DangerButton } from './ui';

interface AdminFaq extends Faq {
  id: string;
}

export function FaqAdmin() {
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const list = (await adminGetFaqs()) as AdminFaq[];
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
      await adminCreateFaq({ question, answer });
      setQuestion('');
      setAnswer('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create FAQ');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this FAQ?')) return;
    setError(null);
    try {
      await adminDeleteFaq(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete FAQ');
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

      {loading ? (
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
              <DangerButton onClick={() => handleDelete(f.id)}>Delete</DangerButton>
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
