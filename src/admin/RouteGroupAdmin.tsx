import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { RouteGroup, VehicleCategory } from '@/types/pricing';
import {
  adminGetRouteGroups,
  adminCreateRouteGroup,
  adminDeleteRouteGroup,
} from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton, DangerButton } from './ui';

const TYPES: RouteGroup['type'][] = ['travel', 'internal'];
const VEHICLE_CATEGORIES: VehicleCategory[] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
];

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function RouteGroupAdmin() {
  const [items, setItems] = useState<RouteGroup[]>([]);
  const [id, setId] = useState('');
  const [type, setType] = useState<RouteGroup['type']>('travel');
  const [nameAr, setNameAr] = useState('');
  const [fromLocations, setFromLocations] = useState('');
  const [toLocations, setToLocations] = useState('');
  const [bidirectional, setBidirectional] = useState(true);
  const [prices, setPrices] = useState<Record<VehicleCategory, { oneWay: string; roundTrip: string }>>({
    sedan: { oneWay: '0', roundTrip: '0' },
    suv: { oneWay: '0', roundTrip: '0' },
    family_cruiser: { oneWay: '0', roundTrip: '0' },
    minibus: { oneWay: '0', roundTrip: '0' },
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await adminGetRouteGroups());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load route groups');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setPrice(category: VehicleCategory, field: 'oneWay' | 'roundTrip', value: string) {
    setPrices((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const pricing = VEHICLE_CATEGORIES.reduce(
        (acc, category) => {
          acc[category] = {
            oneWay: Number(prices[category].oneWay) || 0,
            roundTrip: Number(prices[category].roundTrip) || 0,
          };
          return acc;
        },
        {} as RouteGroup['pricing'],
      );
      const body: RouteGroup = {
        id: id.trim(),
        type,
        nameAr,
        fromLocations: splitList(fromLocations),
        toLocations: splitList(toLocations),
        bidirectional,
        pricing,
      };
      await adminCreateRouteGroup(body);
      setId('');
      setNameAr('');
      setFromLocations('');
      setToLocations('');
      setBidirectional(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create route group');
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm('Delete this route group?')) return;
    setError(null);
    try {
      await adminDeleteRouteGroup(itemId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete route group');
    }
  }

  return (
    <Panel title="Route Groups">
      {error && <ErrorText message={error} />}
      <form
        onSubmit={handleCreate}
        className="mb-6 space-y-3 rounded-lg border border-[hsl(var(--border))] p-4"
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field label="ID" value={id} onChange={setId} required />
          <Field label="Name (AR)" value={nameAr} onChange={setNameAr} required />
          <Field label="From Locations (IDs, comma)" value={fromLocations} onChange={setFromLocations} />
          <Field label="To Locations (IDs, comma)" value={toLocations} onChange={setToLocations} />
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RouteGroup['type'])}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
            <input
              type="checkbox"
              checked={bidirectional}
              onChange={(e) => setBidirectional(e.target.checked)}
              className="h-4 w-4"
            />
            Bidirectional
          </label>
        </div>

        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
          {VEHICLE_CATEGORIES.map((category) => (
            <div key={category} className="rounded-lg border border-[hsl(var(--border))] p-2">
              <p className="mb-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{category}</p>
              <Field
                label="One Way"
                type="number"
                value={prices[category].oneWay}
                onChange={(v) => setPrice(category, 'oneWay', v)}
              />
              <Field
                label="Round Trip"
                type="number"
                value={prices[category].roundTrip}
                onChange={(v) => setPrice(category, 'roundTrip', v)}
              />
            </div>
          ))}
        </div>

        <PrimaryButton type="submit">Create Route Group</PrimaryButton>
      </form>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((g) => (
            <li
              key={g.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">
                  {g.nameAr} <span className="text-xs text-[hsl(var(--muted-foreground))]">({g.type})</span>
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{g.id}</p>
              </div>
              <DangerButton onClick={() => handleDelete(g.id)}>Delete</DangerButton>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No route groups yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
