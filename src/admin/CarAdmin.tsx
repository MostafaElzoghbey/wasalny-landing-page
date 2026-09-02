import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import type { Car } from '@/types';
import { adminCreateCar, adminGetCars } from '@/data/api';
import { ErrorText, Field, Panel, PrimaryButton } from './ui';
import { CarCard } from './CarCard';
import { CAR_CATEGORIES, splitList } from './carHelpers';

export function CarAdmin() {
  const [cars, setCars] = useState<Car[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
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
  const [createError, setCreateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      setCars(await adminGetCars());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل السيارات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm(): void {
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

  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    setCreateError(null);
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
      setCreateError(e instanceof Error ? e.message : 'فشل إنشاء السيارة');
    }
  }

  function handleUpdated(next: Car): void {
    setCars((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  }

  function handleDeleted(deletedId: string): void {
    setCars((prev) => prev.filter((c) => c.id !== deletedId));
    if (expandedId === deletedId) setExpandedId(null);
  }

  return (
    <Panel title="السيارات">
      {error && <ErrorText message={error} />}

      <div className="mb-6 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-[hsl(var(--muted))/0.4]"
        >
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">سيارة جديدة</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{createOpen ? 'إخفاء' : 'عرض'}</span>
        </button>
        {createOpen && (
          <form onSubmit={handleCreate} className="space-y-3 border-t border-[hsl(var(--border))] p-4">
            {createError && <ErrorText message={createError} />}
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="المعرّف (اختياري)" value={id} onChange={setId} />
              <Field label="الاسم" value={name} onChange={setName} required />
              <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
              <Field label="الفئة (عربي)" value={categoryAr} onChange={setCategoryAr} required />
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">الفئة</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Car['category'])}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
                >
                  {CAR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="عدد الركاب" type="number" value={passengers} onChange={setPassengers} required />
              <Field label="الوصف" value={description} onChange={setDescription} textarea />
              <Field label="الصور (مفصولة بفواصل)" value={images} onChange={setImages} />
              <Field label="المميزات (مفصولة بفواصل)" value={features} onChange={setFeatures} />
            </div>
            <PrimaryButton type="submit">إنشاء سيارة</PrimaryButton>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">جارٍ التحميل…</p>
      ) : (
        <ul className="space-y-3">
          {cars.map((c) => (
            <CarCard
              key={c.id}
              group={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId((prev) => (prev === c.id ? null : c.id))}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
          {cars.length === 0 && <li className="text-sm text-[hsl(var(--muted-foreground))]">لا توجد سيارات بعد.</li>}
        </ul>
      )}
    </Panel>
  );
}
