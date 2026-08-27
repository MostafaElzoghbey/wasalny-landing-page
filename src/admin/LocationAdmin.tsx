import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Location } from '@/types/pricing';
import {
  adminGetLocations,
  adminCreateLocation,
  adminDeleteLocation,
} from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton, DangerButton } from './ui';

const TYPES: Location['type'][] = ['travel', 'internal'];

export function LocationAdmin() {
  const [items, setItems] = useState<Location[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState<Location['type']>('travel');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await adminGetLocations());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load locations');
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
      const body: Location = { id: id.trim(), name, nameAr, type };
      await adminCreateLocation(body);
      setId('');
      setName('');
      setNameAr('');
      setType('travel');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create location');
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm('Delete this location?')) return;
    setError(null);
    try {
      await adminDeleteLocation(itemId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete location');
    }
  }

  return (
    <Panel title="Locations">
      {error && <ErrorText message={error} />}
      <form
        onSubmit={handleCreate}
        className="mb-6 grid grid-cols-1 gap-x-4 rounded-lg border border-[hsl(var(--border))] p-4 sm:grid-cols-2"
      >
        <Field label="ID" value={id} onChange={setId} required />
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Name (AR)" value={nameAr} onChange={setNameAr} required />
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Location['type'])}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <PrimaryButton type="submit">Create Location</PrimaryButton>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => (
            <li
              key={l.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">
                  {l.name} <span className="text-xs text-[hsl(var(--muted-foreground))]">({l.type})</span>
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{l.nameAr}</p>
              </div>
              <DangerButton onClick={() => handleDelete(l.id)}>Delete</DangerButton>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No locations yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
