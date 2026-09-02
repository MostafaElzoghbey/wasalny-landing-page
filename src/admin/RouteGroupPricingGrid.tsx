import type { RouteGroup, VehicleCategory } from '@/types/pricing';
import { Field } from './ui';
import { CATEGORY_LABEL, VEHICLE_CATEGORIES, formatPrice } from './routeGroupPricing';

interface DisplayProps {
  pricing: RouteGroup['pricing'];
}

export function PricingDisplay({ pricing }: DisplayProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {VEHICLE_CATEGORIES.map((cat) => (
        <div key={cat} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">
            {CATEGORY_LABEL[cat]}
          </p>
          <div className="space-y-1 text-sm">
            <p data-testid={`route-group-price-${cat}-oneWay`} className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">ذهاب فقط</span>
              <span className="font-medium text-[hsl(var(--foreground))]">{formatPrice(pricing[cat].oneWay)}</span>
            </p>
            <p data-testid={`route-group-price-${cat}-roundTrip`} className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">ذهاب وعودة</span>
              <span className="font-medium text-[hsl(var(--foreground))]">{formatPrice(pricing[cat].roundTrip)}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface EditProps {
  pricing: RouteGroup['pricing'];
  onChange: (cat: VehicleCategory, field: 'oneWay' | 'roundTrip', raw: string) => void;
}

export function PricingEdit({ pricing, onChange }: EditProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {VEHICLE_CATEGORIES.map((cat) => (
        <div key={cat} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2">
          <p className="mb-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{CATEGORY_LABEL[cat]}</p>
          <Field
            label="ذهاب فقط"
            testid={`route-group-price-${cat}-oneWay`}
            type="number"
            value={String(pricing[cat].oneWay)}
            onChange={(v) => onChange(cat, 'oneWay', v)}
          />
          <Field
            label="ذهاب وعودة"
            testid={`route-group-price-${cat}-roundTrip`}
            type="number"
            value={String(pricing[cat].roundTrip)}
            onChange={(v) => onChange(cat, 'roundTrip', v)}
          />
        </div>
      ))}
    </div>
  );
}
