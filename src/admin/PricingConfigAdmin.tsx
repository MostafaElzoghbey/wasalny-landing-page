import { useState } from 'react';
import type { FormEvent } from 'react';
import { adminSetPricingConfig } from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton } from './ui';

const KEYS = ['currency', 'currencyAr', 'whatsappNumber', 'contactEmail'] as const;

export function PricingConfigAdmin() {
  const [key, setKey] = useState<(typeof KEYS)[number]>('currency');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await adminSetPricingConfig(key, value);
      setSaved(true);
      setValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing config');
    }
  }

  return (
    <Panel title="Pricing Config">
      {error && <ErrorText message={error} />}
      {saved && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40">
          Saved.
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Key</span>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value as (typeof KEYS)[number])}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
          >
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <Field label="Value" value={value} onChange={setValue} required />
        <div className="flex items-end">
          <PrimaryButton type="submit">Save</PrimaryButton>
        </div>
      </form>
    </Panel>
  );
}
