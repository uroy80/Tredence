import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useToastStore, type Toast, type ToastVariant } from '@/store/toastStore';
import { AlertIcon, CheckIcon, XIcon } from './icons';

const variantStyles: Record<
  ToastVariant,
  {
    bg: string;
    border: string;
    icon: typeof CheckIcon;
    iconBg: string;
    iconColor: string;
  }
> = {
  success: {
    bg: 'bg-[var(--color-surface)]',
    border: 'border-[var(--color-border)]',
    icon: CheckIcon,
    iconBg: 'bg-[var(--color-success-soft)]',
    iconColor: 'text-[var(--color-success)]',
  },
  error: {
    bg: 'bg-[var(--color-surface)]',
    border: 'border-[var(--color-border)]',
    icon: AlertIcon,
    iconBg: 'bg-[var(--color-danger-soft)]',
    iconColor: 'text-[var(--color-danger)]',
  },
  info: {
    bg: 'bg-[var(--color-surface)]',
    border: 'border-[var(--color-border)]',
    icon: CheckIcon,
    iconBg: 'bg-[var(--color-info-soft)]',
    iconColor: 'text-[var(--color-info)]',
  },
  warning: {
    bg: 'bg-[var(--color-surface)]',
    border: 'border-[var(--color-border)]',
    icon: AlertIcon,
    iconBg: 'bg-[var(--color-warn-soft)]',
    iconColor: 'text-[var(--color-warn)]',
  },
};

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body,
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = variantStyles[toast.variant];
  const Icon = style.icon;

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(id);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'anim-slide-in-right pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-3.5 py-2.5 shadow-[var(--shadow-lg)] backdrop-blur-md',
        style.bg,
        style.border,
      )}
    >
      <div
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          style.iconBg,
          style.iconColor,
        )}
      >
        <Icon width={14} height={14} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-[13px] font-semibold leading-tight text-[var(--color-ink)]">
          {toast.title}
        </div>
        {toast.description && (
          <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--color-muted)]">
            {toast.description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-[var(--color-faint)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
      >
        <XIcon width={12} height={12} />
      </button>
    </div>
  );
}
