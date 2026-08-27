import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  testid?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}

export function Field({
  label,
  testid,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
}: FieldProps) {
  const inputClass =
    'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none';
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {textarea ? (
        <textarea
          data-testid={testid}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'min-h-[72px] resize-y')}
          rows={3}
        />
      ) : (
        <input
          data-testid={testid}
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </label>
  );
}

export function ErrorText({ message }: { message: string }) {
  return (
    <p
      className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40"
      role="alert"
    >
      {message}
    </p>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
      {children}
    </section>
  );
}

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-testid'?: string;
}

export function PrimaryButton({ children, className, ...rest }: PrimaryButtonProps) {
  return (
    <button {...rest} className={cn('btn-primary', className)}>
      {children}
    </button>
  );
}

export function DangerButton({ children, className, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
