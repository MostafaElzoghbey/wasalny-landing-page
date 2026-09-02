interface ReorderControlsProps {
  id: string;
  index: number;
  total: number;
  displayOrder: number;
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
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}: ReorderControlsProps) {
  return (
    <div
      dir="rtl"
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-2 text-right"
    >
      <span
        draggable
        data-testid={`reorder-handle-${id}`}
        onDragStart={onDragStart}
        className="cursor-grab select-none rounded px-1 py-0.5 text-sm font-bold leading-none text-[hsl(var(--muted-foreground))] active:cursor-grabbing hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        aria-label="اسحب لإعادة الترتيب"
        title="اسحب لإعادة الترتيب"
      >
        ⋮⋮
      </span>
      <span className="font-mono text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">{displayOrder}</span>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          data-testid={`move-up-${id}`}
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label="تحريك لأعلى"
          className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--border))] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↑
        </button>
        <button
          type="button"
          data-testid={`move-down-${id}`}
          disabled={index === total - 1}
          onClick={onMoveDown}
          aria-label="تحريك لأسفل"
          className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs leading-none text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--border))] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
