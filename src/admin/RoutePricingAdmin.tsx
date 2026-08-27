import { useState } from 'react';
import type { FormEvent } from 'react';
import type { VehicleCategory } from '@/types/pricing';
import { adminCreateRoutePrice, type RoutePriceInput } from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';

const CATEGORIES: VehicleCategory[] = ['sedan', 'suv', 'family_cruiser', 'minibus'];

export function RoutePricingAdmin() {
  const [routeGroupId, setRouteGroupId] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('sedan');
  const [oneWay, setOneWay] = useState('');
  const [roundTrip, setRoundTrip] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const body: RoutePriceInput = {
        routeGroupId: routeGroupId.trim(),
        vehicleCategory,
        oneWay: Number(oneWay) || 0,
        roundTrip: Number(roundTrip) || 0,
      };
      await adminCreateRoutePrice(body);
      setRouteGroupId('');
      setOneWay('');
      setRoundTrip('');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create route price');
    }
  }

  return (
    <Panel title="Route Pricing">
      {error && <ErrorText message={error} />}
      {saved && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40">
          Saved.
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Field label="Route Group ID" value={routeGroupId} onChange={setRouteGroupId} required />
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Vehicle Category</span>
          <select
            value={vehicleCategory}
            onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <Field label="One Way" type="number" value={oneWay} onChange={setOneWay} required />
        <Field label="Round Trip" type="number" value={roundTrip} onChange={setRoundTrip} required />
        <div className="sm:col-span-2">
          <PrimaryButton type="submit">Create Route Price</PrimaryButton>
        </div>
      </form>
    </Panel>
  );
}
