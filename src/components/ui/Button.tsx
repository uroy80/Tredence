import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'xs' | 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconOnly?: boolean;
}

const variantMap: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-faint)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] shadow-[var(--shadow-sm)]',
  outline:
    'bg-transparent text-[var(--color-ink)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  ghost:
    'bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]',
  danger:
    'bg-[var(--color-surface)] text-[var(--color-danger)] border border-[var(--color-border)] hover:border-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]',
};

const sizeMap: Record<Size, string> = {
  xs: 'text-[11px] px-2 py-1 rounded-md gap-1',
  sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
};

const iconOnlySize: Record<Size, string> = {
  xs: 'p-1 rounded-md',
  sm: 'p-1.5 rounded-lg',
  md: 'p-2 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    iconOnly,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        variantMap[variant],
        iconOnly ? iconOnlySize[size] : sizeMap[size],
        className,
      )}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
});
