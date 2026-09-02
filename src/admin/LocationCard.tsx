import { useState } from 'react';
import type { Location } from '@/types/pricing';
import { adminDeleteLocation, adminUpdateLocation } from '@/data/api';
import { DangerButton, ErrorText, Field, PrimaryButton } from './ui';
import { cloneLocation, validateLocation } from './locationHelpers';

interface LocationCardProps {
  group: Location;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (next: Location) => void;
  onDeleted: (id: string) => void;
}

export function LocationCard({ group, expanded, onToggle, onUpdated, onDeleted }: LocationCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Location>(() => cloneLocation(group));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  function enterEdit(): void {
    setDraft(cloneLocation(group));
    setError(null);
    setConfirmDelete(false);
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraft(cloneLocation(group));
    setError(null);
    setEditing(false);
  }

  async function handleSave(): Promise<void> {
    setError(null);
    const validation = validateLocation(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    try {
      const normalized: Location = {
        id: group.id,
        name: draft.name.trim(),
        nameAr: draft.nameAr.trim(),
        type: draft.type,
      };
      await adminUpdateLocation(group.id, {
        name: normalized.name,
        nameAr: normalized.nameAr,
        type: normalized.type,
      });
      onUpdated(normalized);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update location');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError(null);
    try {
      await adminDeleteLocation(group.id);
      onDeleted(group.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <li
      data-testid={`location-card-${group.id}`}
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition"
    >
      <button
        type="button"
        data-testid={`location-expand-${group.id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--muted))/0.5]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[hsl(var(--foreground))]">{group.name}</span>
            <span className="truncate text-sm text-[hsl(var(--muted-foreground))]">{group.nameAr}</span>
            <span
              className={
                group.type === 'travel'
                  ? 'rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white'
              }
            >
              {group.type}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-[hsl(var(--muted-foreground))]">{group.id}</p>
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
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">NAME</p>
                  <p className="text-[hsl(var(--foreground))]">{group.name}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">NAME (AR)</p>
                  <p className="text-[hsl(var(--foreground))]">{group.nameAr}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">TYPE</p>
                  <p className="text-[hsl(var(--foreground))]">{group.type}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">ID</p>
                  <p className="font-mono text-xs text-[hsl(var(--foreground))]">{group.id}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" data-testid={`location-edit-${group.id}`} onClick={enterEdit}>
                  Edit
                </PrimaryButton>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <DangerButton
                      type="button"
                      data-testid={`location-delete-confirm-${group.id}`}
                      onClick={() => void handleDelete()}
                    >
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
                  <DangerButton type="button" data-testid={`location-delete-${group.id}`} onClick={() => setConfirmDelete(true)}>
                    Delete
                  </DangerButton>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">ID: {group.id} (immutable)</p>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Field label="Name" value={draft.name} onChange={(v) => setDraft((p) => ({ ...p, name: v }))} required />
                <Field label="Name (AR)" value={draft.nameAr} onChange={(v) => setDraft((p) => ({ ...p, nameAr: v }))} required />
                <label className="mb-3 block">
                  <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">Type</span>
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value as Location['type'] }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none"
                  >
                    <option value="travel">travel</option>
                    <option value="internal">internal</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  type="button"
                  data-testid={`location-save-${group.id}`}
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </PrimaryButton>
                <button
                  type="button"
                  data-testid={`location-cancel-${group.id}`}
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
