import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import type { Location, RouteGroup, VehicleCategory } from '@/types/pricing';
import {
  adminCreateRouteGroup,
  adminGetLocations,
  adminGetRouteGroups,
} from '@/data/api';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { RouteGroupCard } from './RouteGroupCard';

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

function emptyPricing(): RouteGroup['pricing'] {
  return {
    sedan: { oneWay: 0, roundTrip: 0 },
    suv: { oneWay: 0, roundTrip: 0 },
    family_cruiser: { oneWay: 0, roundTrip: 0 },
    minibus: { oneWay: 0, roundTrip: 0 },
  };
}

export function RouteGroupAdmin() {
  const [items, setItems] = useState<RouteGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  const [createOpen, setCreateOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [groups, locs] = await Promise.all([adminGetRouteGroups(), adminGetLocations()]);
      setItems(groups);
      setLocations(locs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load route groups');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setPrice(category: VehicleCategory, field: 'oneWay' | 'roundTrip', value: string): void {
    setPrices((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (id.trim() === '' || nameAr.trim() === '') {
      setCreateError('ID and Name (AR) are required');
      return;
    }
    const pricing = VEHICLE_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = {
          oneWay: Number(prices[category].oneWay),
          roundTrip: Number(prices[category].roundTrip),
        };
        return acc;
      },
      {} as RouteGroup['pricing'],
    );
    for (const cat of VEHICLE_CATEGORIES) {
      const p = pricing[cat];
      if (!Number.isInteger(p.oneWay) || !Number.isInteger(p.roundTrip) || p.oneWay < 0 || p.roundTrip < 0) {
        setCreateError('Pricing must be non-negative integers');
        return;
      }
    }
    try {
      const body: RouteGroup = {
        id: id.trim(),
        type,
        nameAr: nameAr.trim(),
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
      setPrices({
        sedan: { oneWay: '0', roundTrip: '0' },
        suv: { oneWay: '0', roundTrip: '0' },
        family_cruiser: { oneWay: '0', roundTrip: '0' },
        minibus: { oneWay: '0', roundTrip: '0' },
      });
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create route group');
    }
  }

  function handleUpdated(next: RouteGroup): void {
    setItems((prev) => prev.map((g) => (g.id === next.id ? next : g)));
  }

  function handleDeleted(deletedId: string): void {
    setItems((prev) => prev.filter((g) => g.id !== deletedId));
    if (expandedId === deletedId) setExpandedId(null);
  }

  return (
    <Panel title="Route Groups">
      {error && <ErrorText message={error} />}

      <div className="mb-6 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[hsl(var(--muted))/0.4]"
        >
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">New Route Group</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{createOpen ? 'Hide' : 'Show'}</span>
        </button>
        {createOpen && (
          <form onSubmit={handleCreate} className="space-y-3 border-t border-[hsl(var(--border))] p-4">
            {createError && <ErrorText message={createError} />}
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

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VEHICLE_CATEGORIES.map((category) => (
                <div key={category} className="rounded-lg border border-[hsl(var(--border))] p-2">
                  <p className="mb-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{category}</p>
                  <Field label="One Way" type="number" value={prices[category].oneWay} onChange={(v) => setPrice(category, 'oneWay', v)} />
                  <Field label="Round Trip" type="number" value={prices[category].roundTrip} onChange={(v) => setPrice(category, 'roundTrip', v)} />
                </div>
              ))}
            </div>

            <PrimaryButton type="submit" data-testid="route-group-create">
              Create Route Group
            </PrimaryButton>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((g) => (
            <RouteGroupCard
              key={g.id}
              group={g}
              locations={locations}
              expanded={expandedId === g.id}
              onToggle={() => setExpandedId((prev) => (prev === g.id ? null : g.id))}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
          {items.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No route groups yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}

// keep helper used in tests if needed
export function _emptyPricing(): RouteGroup['pricing'] {
  return emptyPricing();
}
