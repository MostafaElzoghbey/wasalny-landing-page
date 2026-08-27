import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { RouteData } from '@/types';
import {
  adminGetRouteData,
  adminCreateRouteData,
  adminDeleteRouteData,
} from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton, DangerButton } from './ui';

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

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
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create route data');
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm('Delete this route data?')) return;
    setError(null);
    try {
      await adminDeleteRouteData(itemId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete route data');
    }
  }

  return (
    <Panel title="Route Data">
      {error && <ErrorText message={error} />}
      <form
        onSubmit={handleCreate}
        className="mb-6 grid grid-cols-1 gap-x-4 rounded-lg border border-[hsl(var(--border))] p-4 sm:grid-cols-2"
      >
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

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">{r.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{r.id}</p>
              </div>
              <DangerButton onClick={() => handleDelete(r.id)}>Delete</DangerButton>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No route data yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
