import { useState } from 'react';

import type { Location, RouteGroup, VehicleCategory } from '@/types/pricing';
import { adminDeleteRouteGroup, adminUpdateRouteGroup } from '@/data/api';
import { Field, ErrorText, PrimaryButton, DangerButton } from './ui';
import { PricingDisplay, PricingEdit } from './RouteGroupPricingGrid';
import {
  cloneGroup,
  formatPrice,
  minPrice,
  splitList,
  validatePricing,
} from './routeGroupPricing';

interface RouteGroupCardProps {
  group: RouteGroup;
  locations: Location[];
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: RouteGroup) => void;
  onDeleted: (id: string) => void;
}

export function RouteGroupCard({
  group,
  locations,
  expanded,
  onToggle,
  onUpdated,
  onDeleted,
}: RouteGroupCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RouteGroup>(() => cloneGroup(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const locName = (id: string) => locations.find((l) => l.id === id)?.nameAr ?? id;
  const fromSummary = group.fromLocations.map(locName).join('، ');
  const toSummary = group.toLocations.map(locName).join('، ');

  function enterEdit(): void {
    setDraft(cloneGroup(group));
    setError(null);
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraft(cloneGroup(group));
    setError(null);
    setEditing(false);
  }

  function setDraftPrice(
    category: VehicleCategory,
    field: 'oneWay' | 'roundTrip',
    raw: string,
  ): void {
    const num = raw === '' ? 0 : Number(raw);
    setDraft((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [category]: { ...prev.pricing[category], [field]: Number.isNaN(num) ? 0 : num },
      },
    }));
  }

  async function handleSave(): Promise<void> {
    setError(null);
    if (draft.nameAr.trim() === '') {
      setError('Name (AR) is required');
      return;
    }
    const pErr = validatePricing(draft.pricing);
    if (pErr) {
      setError(pErr);
      return;
    }
    setSaving(true);
    try {
      const payload: RouteGroup = { ...draft, nameAr: draft.nameAr.trim(), id: group.id };
      await adminUpdateRouteGroup(group.id, payload);
      onUpdated(payload);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update route group');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError(null);
    try {
      await adminDeleteRouteGroup(group.id);
      onDeleted(group.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <li
      data-testid={`route-group-card-${group.id}`}
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition"
    >
      <button
        type="button"
        data-testid={`route-group-expand-${group.id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--muted))/0.5]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.nameAr}</span>
            <span
              className={
                group.type === 'travel'
                  ? 'rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white'
              }
            >
              {group.type}
            </span>
            {group.bidirectional && (
              <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                ↔ bidirectional
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
            {fromSummary || group.fromLocations.join(', ')} → {toSummary || group.toLocations.join(', ')}
            <span className="mx-2 text-[hsl(var(--border))]">|</span>
            <span className="font-medium text-[hsl(var(--foreground))]">from {formatPrice(minPrice(group.pricing))}</span>
            <span className="mx-1 text-[hsl(var(--muted-foreground))]">·</span>
            <span className="font-mono text-xs">{group.id}</span>
          </p>
        </div>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]"
          aria-hidden
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))/0.4] p-4">
          {error && <ErrorText message={error} />}

          {!editing ? (
            <>
              <div className="mb-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">FROM</p>
                  <p className="text-[hsl(var(--foreground))]">{fromSummary || '—'}</p>
                  <p className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.fromLocations.join(', ')}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">TO</p>
                  <p className="text-[hsl(var(--foreground))]">{toSummary || '—'}</p>
                  <p className="mt-1 font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.toLocations.join(', ')}</p>
                </div>
              </div>

              <PricingDisplay pricing={group.pricing} />

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`route-group-edit-${group.id}`} onClick={enterEdit}>
                  Edit
                </PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton type="button" data-testid={`route-group-delete-confirm-${group.id}`} onClick={handleDelete}>
                      Confirm delete
                    </DangerButton>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <DangerButton type="button" data-testid={`route-group-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>
                    Delete
                  </DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Field label="Name (AR)" value={draft.nameAr} onChange={(v) => setDraft((p) => ({ ...p, nameAr: v }))} required />
                <label className="mb-3 block">
                  <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Type</span>
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value as RouteGroup['type'] }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
                  >
                    <option value="travel">travel</option>
                    <option value="internal">internal</option>
                  </select>
                </label>
                <Field
                  label="From Locations (IDs, comma)"
                  value={draft.fromLocations.join(', ')}
                  onChange={(v) => setDraft((p) => ({ ...p, fromLocations: splitList(v) }))}
                />
                <Field
                  label="To Locations (IDs, comma)"
                  value={draft.toLocations.join(', ')}
                  onChange={(v) => setDraft((p) => ({ ...p, toLocations: splitList(v) }))}
                />
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
                  <input
                    type="checkbox"
                    checked={draft.bidirectional}
                    onChange={(e) => setDraft((p) => ({ ...p, bidirectional: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Bidirectional
                </label>
              </div>

              <PricingEdit pricing={draft.pricing} onChange={setDraftPrice} />

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`route-group-save-${group.id}`} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid={`route-group-cancel-${group.id}`}
                  onClick={cancelEdit}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
