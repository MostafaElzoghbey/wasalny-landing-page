import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { RouteData } from '@/types';
import { adminGetRouteData, adminCreateRouteData } from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';
import { RouteDataCard } from './RouteDataCard';
import { splitList } from './routeDataHelpers';

export function RouteDataAdmin() {
  const [items, setItems] = useState<RouteData[]>([]);
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [priceStart, setPriceStart] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [features, setFeatures] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await adminGetRouteData());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load route data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setId('');
    setTitle('');
    setDescription('');
    setMetaTitle('');
    setMetaDescription('');
    setHeroImage('');
    setPriceStart('');
    setDistance('');
    setDuration('');
    setFeatures('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body: Omit<RouteData, 'id'> = {
        title,
        description,
        metaTitle,
        metaDescription,
        heroImage,
        priceStart,
        distance,
        duration,
        features: splitList(features),
        faqs: [],
      };
      await adminCreateRouteData(id.trim(), body);
      resetForm();
      setCreateOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create route data');
    }
  }

  function handleUpdated(next: RouteData) {
    setItems((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  }

  function handleDeleted(deletedId: string) {
    setItems((prev) => prev.filter((r) => r.id !== deletedId));
    if (expandedId === deletedId) setExpandedId(null);
  }

  function toggleExpand(itemId: string) {
    setExpandedId((prev) => (prev === itemId ? null : itemId));
  }

  return (
    <Panel title="Route Data">
      {error && <ErrorText message={error} />}

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))/0.5]"
          data-testid="routedata-create-toggle"
        >
          <span>Create Route Data</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={createOpen ? 'rotate-180 transition-transform' : 'transition-transform'}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {createOpen && (
          <form onSubmit={handleCreate} className="mt-3 grid grid-cols-1 gap-x-4 rounded-lg border border-[hsl(var(--border))] p-4 sm:grid-cols-2">
            <Field label="ID" value={id} onChange={setId} required />
            <Field label="Title" value={title} onChange={setTitle} required />
            <Field label="Meta Title" value={metaTitle} onChange={setMetaTitle} />
            <Field label="Price Start" value={priceStart} onChange={setPriceStart} />
            <Field label="Distance" value={distance} onChange={setDistance} />
            <Field label="Duration" value={duration} onChange={setDuration} />
            <Field label="Hero Image URL" value={heroImage} onChange={setHeroImage} />
            <Field label="Meta Description" value={metaDescription} onChange={setMetaDescription} textarea />
            <Field label="Description" value={description} onChange={setDescription} textarea />
            <Field label="Features (comma separated)" value={features} onChange={setFeatures} />
            <div className="sm:col-span-2">
              <PrimaryButton type="submit">Create Route Data</PrimaryButton>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <RouteDataCard
              key={r.id}
              group={r}
              expanded={expandedId === r.id}
              onToggle={() => toggleExpand(r.id)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
          {items.length === 0 && <li className="text-sm text-[hsl(var(--muted-foreground))]">No route data yet.</li>}
        </ul>
      )}
    </Panel>
  );
}
