import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { FaqWithId } from '@/types';
import { adminGetFaqs, adminCreateFaq, adminDeleteFaq, adminReorderFaqs } from '@/data/api';
import { ReorderControls } from '@/components/ui/ReorderControls';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';
import { FaqCard } from './FaqCard';

export function FaqAdmin() {
  const [faqs, setFaqs] = useState<FaqWithId[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const { ref: listRef, capture } = useReorderAnimation(faqs.map((f) => f.id).join(','));

  async function load() {
    setLoading(true);
    try {
      const list = await adminGetFaqs();
      setFaqs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الأسئلة الشائعة');
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
      setError('السؤال والإجابة مطلوبان');
      return;
    }
    try {
      const created = await adminCreateFaq({ question: question.trim(), answer: answer.trim() });
      setFaqs((prev) => [...prev, created]);
      setQuestion('');
      setAnswer('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إنشاء السؤال');
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
      setError(e instanceof Error ? e.message : 'فشل حذف السؤال');
      await load();
    }
  }

  async function doReorder(next: FaqWithId[]): Promise<void> {
    const prev = [...faqs];
    const nextWithOrder = next.map((f, i) => ({ ...f, displayOrder: i }));
    const ids = nextWithOrder.map((f) => f.id);
    setFaqs(nextWithOrder);
    setReorderError(null);
    try {
      await adminReorderFaqs(ids);
    } catch (e) {
      setFaqs(prev);
      setReorderError(e instanceof Error ? e.message : 'فشل إعادة الترتيب');
    }
  }

  function handleMove(id: string, dir: -1 | 1): void {
    const idx = faqs.findIndex((f) => f.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= faqs.length) return;
    capture();
    const next = [...faqs];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    void doReorder(next);
  }

  return (
    <Panel title="الأسئلة الشائعة">
      {error && <ErrorText message={error} />}
      {reorderError && <ErrorText message={reorderError} />}
      <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-[hsl(var(--border))] p-4">
        <Field label="السؤال" testid="faq-question" value={question} onChange={setQuestion} required />
        <Field label="الإجابة" testid="faq-answer" value={answer} onChange={setAnswer} textarea required />
        <PrimaryButton type="submit" data-testid="faq-create-submit">
          إنشاء سؤال
        </PrimaryButton>
      </form>

      {faqs.length === 0 && loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      ) : (
        <ul ref={listRef} className="space-y-2">
          {faqs.map((f, idx) => (
            <li key={f.id} dir="rtl" data-reorder-item={f.id} className="reorder-item flex items-stretch gap-2 text-right" style={{ transitionDelay: `${idx * 15}ms` }}>
              <ReorderControls
                id={f.id}
                index={idx}
                total={faqs.length}
                displayOrder={f.displayOrder}
                onMoveUp={() => handleMove(f.id, -1)}
                onMoveDown={() => handleMove(f.id, 1)}
                onDragStart={(e) => {
                  dragIdRef.current = f.id;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = dragIdRef.current;
                  dragIdRef.current = null;
                  if (!draggedId || draggedId === f.id) return;
                  const from = faqs.findIndex((x) => x.id === draggedId);
                  if (from === -1) return;
                  capture();
                  const next = [...faqs];
                  const [moved] = next.splice(from, 1);
                  next.splice(idx, 0, moved);
                  void doReorder(next);
                }}
              />
              <div className="min-w-0 flex-1">
                <FaqCard
                  faq={f}
                  expanded={expandedId === f.id}
                  onToggle={() => setExpandedId((prev) => (prev === f.id ? null : f.id))}
                  onUpdated={handleUpdated}
                  onDeleted={(id) => void handleDelete(id)}
                />
              </div>
            </li>
          ))}
          {faqs.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد أسئلة بعد.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
