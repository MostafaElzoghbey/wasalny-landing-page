interface ReorderControlsProps {
  id: string;
  index: number;
  total: number;
  displayOrder: number;
  disabled?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (e: React.DragEvent<HTMLSpanElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function ReorderControls({
  id,
  index,
  total,
  displayOrder,
  disabled = false,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}: ReorderControlsProps) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (disabled) return;
    if (e.key === "ArrowUp") { e.preventDefault(); if (index > 0) onMoveUp(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (index < total - 1) onMoveDown(); }
  }
  return (
    <div
      dir="rtl"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-2 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
    >
      <span
        draggable={!disabled}
        data-testid={`reorder-handle-${id}`}
        onDragStart={onDragStart}
        className={`ms-2 select-none rounded px-1 py-0.5 text-sm font-bold leading-none text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}
        aria-label="اسحب لإعادة الترتيب"
        title="اسحب لإعادة الترتيب"
      >
        ⋮⋮
      </span>
      <span aria-live="polite" aria-label={`الترتيب ${displayOrder}`} className="font-mono text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">{displayOrder}</span>
      <div className="flex flex-col gap-0.5">
        <button type="button" data-testid={`move-up-${id}`} disabled={disabled || index === 0} aria-disabled={disabled || index === 0} onClick={onMoveUp} aria-label="تحريك لأعلى" className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--border))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]">↑</button>
        <button type="button" data-testid={`move-down-${id}`} disabled={disabled || index === total - 1} aria-disabled={disabled || index === total - 1} onClick={onMoveDown} aria-label="تحريك لأسفل" className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--border))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]">↓</button>
      </div>
    </div>
  );
}
