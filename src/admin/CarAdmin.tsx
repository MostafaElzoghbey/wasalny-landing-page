import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Car } from '@/types';
import {
  adminGetCars,
  adminCreateCar,
  adminDeleteCar,
} from '@/data/api';
import { Field, ErrorText, Panel, PrimaryButton, DangerButton } from './ui';

const CATEGORIES: Car['category'][] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
  'wedding',
];

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function CarAdmin() {
  const [cars, setCars] = useState<Car[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState<Car['category']>('sedan');
  const [categoryAr, setCategoryAr] = useState('');
  const [description, setDescription] = useState('');
  const [passengers, setPassengers] = useState('4');
  const [images, setImages] = useState('');
  const [features, setFeatures] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setCars(await adminGetCars());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cars');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setId('');
    setName('');
    setNameAr('');
    setCategory('sedan');
    setCategoryAr('');
    setDescription('');
    setPassengers('4');
    setImages('');
    setFeatures('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body: Omit<Car, 'id'> & { id?: string } = {
        name,
        nameAr,
        category,
        categoryAr,
        description,
        passengers: Number(passengers) || 0,
        images: splitList(images),
        features: splitList(features),
      };
      if (id.trim().length > 0) body.id = id.trim();
      await adminCreateCar(body);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create car');
    }
  }

  async function handleDelete(carId: string) {
    if (!window.confirm('Delete this car?')) return;
    setError(null);
    try {
      await adminDeleteCar(carId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete car');
    }
  }

  return (
    <Panel title="Cars">
      {error && <ErrorText message={error} />}
      <form
        onSubmit={handleCreate}
        className="mb-6 grid grid-cols-1 gap-x-4 rounded-lg border border-[hsl(var(--border))] p-4 sm:grid-cols-2"
      >
        <Field label="ID (optional)" value={id} onChange={setId} />
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Name (AR)" value={nameAr} onChange={setNameAr} required />
        <Field label="Category AR" value={categoryAr} onChange={setCategoryAr} required />
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Car['category'])}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <Field label="Passengers" type="number" value={passengers} onChange={setPassengers} required />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <Field label="Images (comma separated)" value={images} onChange={setImages} />
        <Field label="Features (comma separated)" value={features} onChange={setFeatures} />
        <div className="sm:col-span-2">
          <PrimaryButton type="submit">Create Car</PrimaryButton>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {cars.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">
                  {c.name} <span className="text-xs text-[hsl(var(--muted-foreground))]">({c.category})</span>
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{c.nameAr}</p>
              </div>
              <DangerButton onClick={() => handleDelete(c.id)}>Delete</DangerButton>
            </li>
          ))}
          {cars.length === 0 && (
            <li className="text-sm text-[hsl(var(--muted-foreground))]">No cars yet.</li>
          )}
        </ul>
      )}
    </Panel>
  );
}
