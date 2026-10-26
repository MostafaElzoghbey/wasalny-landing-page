import { useState } from 'react';

import { cn } from '@/lib/utils';

interface ChipInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  testId?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ChipInput({
  label,
  value,
  onChange,
  placeholder,
  testId,
  error,
  required = false,
  disabled = false,
}: ChipInputProps) {
  const [draft, setDraft] = useState('');

  function addTokens(raw: string) {
    const parts = raw
      .split(/[,،\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;
    const next = [...value];
    let changed = false;
    for (const p of parts) {
      if (!next.includes(p)) {
        next.push(p);
        changed = true;
      }
    }
    if (changed) onChange(next);
  }

  function commitDraft() {
    if (draft.trim().length === 0) return;
    addTokens(draft);
    setDraft('');
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div dir="rtl" className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div
        data-testid={testId ?? `chip-input-${label}`}
        className={cn(
          'flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border bg-[hsl(var(--card))] p-2 text-sm focus-within:border-primary-500 focus-within:outline-none',
          error
            ? 'border-red-500 focus-within:border-red-500'
            : 'border-[hsl(var(--border))]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        onClick={() => {
          if (disabled) return;
          document.getElementById(`chip-input-${label}`)?.focus();
        }}
      >
        {value.map((v, i) => (
          <span
            key={`${v}-${i}`}
            data-testid={`chip-${v}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-sm font-medium text-white"
          >
            {v}
            <button
              type="button"
              aria-label={`إزالة ${v}`}
              data-testid={`chip-remove-${v}`}
              disabled={disabled}
              onClick={() => removeAt(i)}
              className="ms-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/20 text-base leading-none transition hover:bg-white/30 disabled:opacity-50"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={`chip-input-${label}`}
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          dir="rtl"
          aria-label={label}
          required={required && value.length === 0}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === '،' || e.key === 'Tab') {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === 'Backspace' && draft === '' && value.length > 0) {
              e.preventDefault();
              removeAt(value.length - 1);
            }
          }}
          onBlur={commitDraft}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (/[,،\n]/.test(text)) {
              e.preventDefault();
              addTokens(text);
              setDraft('');
            }
          }}
          className="min-w-0 flex-1 bg-transparent p-1 text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none disabled:cursor-not-allowed sm:min-w-[120px] sm:text-sm"
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
