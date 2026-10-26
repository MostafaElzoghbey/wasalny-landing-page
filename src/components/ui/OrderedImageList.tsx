interface OrderedImageListProps {
  value: string[];
  alts?: string[];
  onChange: (next: string[]) => void;
  onAltsChange?: (next: string[]) => void;
  testIdPrefix: string;
  itemId: string;
}

export function OrderedImageList({
  value,
  alts = [],
  onChange,
  onAltsChange,
  testIdPrefix,
  itemId,
}: OrderedImageListProps) {
  function move(from: number, to: number) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    if (onAltsChange) {
      const paired = value.map((_, i) => alts[i] ?? '');
      const [movedAlt] = paired.splice(from, 1);
      paired.splice(to, 0, movedAlt ?? '');
      onAltsChange(paired);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
    if (onAltsChange) {
      const paired = value.map((_, i) => alts[i] ?? '');
      onAltsChange(paired.filter((_, i) => i !== idx));
    }
  }

  function updateAlt(idx: number, v: string) {
    if (!onAltsChange) return;
    const next = value.map((_, i) => alts[i] ?? '');
    next[idx] = v;
    onAltsChange(next);
  }

  return (
    <ol dir="rtl" className="space-y-2">
      {value.map((src, idx) => (
        <li
          key={`${src}-${idx}`}
          data-testid={`${testIdPrefix}-edit-${itemId}-${idx}`}
          className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2"
        >
          <img
            src={src}
            alt="صورة"
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded object-cover"
          />
          <input
            value={alts[idx] ?? ""}
            onChange={(e) => updateAlt(idx, e.target.value)}
            data-testid={`${testIdPrefix}-alt-${itemId}-${idx}`}
            placeholder="وصف الصورة"
            className="min-h-[44px] min-w-0 flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-2 text-base text-[hsl(var(--foreground))] sm:text-sm"
          />
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => move(idx, idx - 1)}
              data-testid={`${testIdPrefix}-up-${itemId}-${idx}`}
              className="min-h-[44px] min-w-[44px] rounded bg-[hsl(var(--muted))] px-3 py-2.5 text-sm disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={idx === value.length - 1}
              onClick={() => move(idx, idx + 1)}
              data-testid={`${testIdPrefix}-down-${itemId}-${idx}`}
              className="min-h-[44px] min-w-[44px] rounded bg-[hsl(var(--muted))] px-3 py-2.5 text-sm disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(idx)}
              data-testid={`${testIdPrefix}-remove-${itemId}-${idx}`}
              className="min-h-[44px] min-w-[44px] rounded bg-red-600 px-3 py-2.5 text-sm text-white"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
