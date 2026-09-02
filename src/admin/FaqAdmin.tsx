import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { FaqWithId } from '@/types';
import { adminGetFaqs, adminCreateFaq, adminDeleteFaq } from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';
import { FaqCard } from './FaqCard';

export function FaqAdmin() {
  const [faqs, setFaqs] = useState<FaqWithId[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    if (question.trim() === '' || answer.trim() === '') {
      setError('Question and answer are required');
      return;
    }
    try {
      const created = await adminCreateFaq({ question: question.trim(), answer: answer.trim() });
      setFaqs((prev) => [...prev, created]);
      setQuestion('');
      setAnswer('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create FAQ');
    }
  }

  function handleUpdated(next: FaqWithId) {
    setFaqs((prev) => prev.map((f) => (f.id === next.id ? next : f)));
  }

  async function handleDelete(id: string) {
    setError(null);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
    try {
      await adminDeleteFaq(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete FAQ');
      await load();
    }
  }

  return (
    <Panel title="FAQs">
      {error && <ErrorText message={error} />}
      <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-[hsl(var(--border))] p-4">
        <Field label="Question" testid="faq-question" value={question} onChange={setQuestion} required />
        <Field label="Answer" testid="faq-answer" value={answer} onChange={setAnswer} textarea required />
        <PrimaryButton type="submit" data-testid="faq-create-submit">
          Create FAQ
        </PrimaryButton>
      </form>

      {faqs.length === 0 && loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {faqs.map((f) => (
            <FaqCard
              key={f.id}
              faq={f}
              expanded={expandedId === f.id}
              onToggle={() => setExpandedId((prev) => (prev === f.id ? null : f.id))}
              onUpdated={handleUpdated}
              onDeleted={(id) => void handleDelete(id)}
            />
          ))}
          {faqs.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No FAQs yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
