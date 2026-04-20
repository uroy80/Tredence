import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useToastStore, type Toast, type ToastVariant } from '@/store/toastStore';
import { AlertIcon, CheckIcon, XIcon } from './icons';

const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; icon: typeof CheckIcon; iconColor: string }
> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckIcon,
    iconColor: 'text-emerald-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertIcon,
    iconColor: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: CheckIcon,
    iconColor: 'text-blue-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertIcon,
    iconColor: 'text-amber-600',
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
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-3.5 py-2.5 shadow-lg backdrop-blur-sm',
        style.bg,
        style.border,
      )}
    >
      <Icon className={clsx('mt-0.5 shrink-0', style.iconColor)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--color-ink)]">
          {toast.title}
        </div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">
            {toast.description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 text-[var(--color-muted)] hover:bg-white/60 hover:text-[var(--color-ink)]"
      >
        <XIcon width={14} height={14} />
      </button>
    </div>
  );
}
