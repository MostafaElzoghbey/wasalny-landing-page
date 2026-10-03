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
  placeholder?: string;
  dir?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
}

export function Field({
  label,
  testid,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
  placeholder,
  dir,
  inputMode,
  autoComplete,
}: FieldProps) {
  const inputClass =
    'w-full min-h-[44px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-base text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 sm:text-sm';
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
          placeholder={placeholder}
          dir={dir}
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
          placeholder={placeholder}
          dir={dir}
          inputMode={inputMode}
          autoComplete={autoComplete}
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
    <section dir="rtl" className="card p-4 sm:p-5">
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
        'min-h-[44px] rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'min-h-[44px] rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
