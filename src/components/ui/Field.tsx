import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
        {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
      </span>
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11px] text-[var(--color-danger)]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] leading-snug text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-all duration-150 placeholder:text-[var(--color-faint)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-4 focus:ring-[var(--color-primary)]/10 disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-muted)]';

export function TextInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={clsx(inputBase, className)} />;
}

export function TextArea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={clsx(inputBase, 'min-h-[80px] resize-y leading-relaxed', className)}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={clsx(
          inputBase,
          'appearance-none bg-[var(--color-surface)] pr-9',
          className,
        )}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-ink)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[var(--color-border-strong)] text-[var(--color-primary)] accent-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/30"
      />
      <span className="flex flex-col">
        <span>{label}</span>
        {description && (
          <span className="text-[11px] text-[var(--color-muted)]">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
