import { useState } from 'react';
import type { FormEvent } from 'react';
import type { VehicleCategory, VehiclePricing } from '@/types/pricing';
import { adminCreateVehiclePricing } from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';

const CATEGORIES: VehicleCategory[] = ['sedan', 'suv', 'family_cruiser', 'minibus'];

export function VehiclePricingAdmin() {
  const [category, setCategory] = useState<VehicleCategory>('sedan');
  const [categoryAr, setCategoryAr] = useState('');
  const [maxPassengers, setMaxPassengers] = useState('');
  const [minPassengers, setMinPassengers] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const body: VehiclePricing = {
        category,
        categoryAr,
        maxPassengers: Number(maxPassengers) || 0,
        minPassengers: Number(minPassengers) || 0,
      };
      await adminCreateVehiclePricing(body);
      setCategoryAr('');
      setMaxPassengers('');
      setMinPassengers('');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle pricing');
    }
  }

  return (
    <Panel title="Vehicle Pricing">
      {error && <ErrorText message={error} />}
      {saved && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40">
          Saved.
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VehicleCategory)}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <Field label="Category (AR)" value={categoryAr} onChange={setCategoryAr} required />
        <Field label="Max Passengers" type="number" value={maxPassengers} onChange={setMaxPassengers} required />
        <Field label="Min Passengers" type="number" value={minPassengers} onChange={setMinPassengers} required />
        <div className="sm:col-span-2">
          <PrimaryButton type="submit">Create Vehicle Pricing</PrimaryButton>
        </div>
      </form>
    </Panel>
  );
}
