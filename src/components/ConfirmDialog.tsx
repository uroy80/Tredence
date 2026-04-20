import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useConfirmStore } from '@/store/confirmStore';
import { Button } from './ui/Button';
import { AlertIcon } from './icons';

export function ConfirmDialog() {
  const active = useConfirmStore((s) => s.active);
  const resolve = useConfirmStore((s) => s.resolve);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const prevActive = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resolve(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        resolve(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prevActive?.focus();
    };
  }, [active, resolve]);

  if (!active || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={active.description ? 'confirm-dialog-desc' : undefined}
      onClick={() => resolve(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-scale-in w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-xl)]"
      >
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              active.destructive
                ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                : 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
            )}
          >
            <AlertIcon />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2
              id="confirm-dialog-title"
              className="text-[15px] font-semibold text-[var(--color-ink)]"
            >
              {active.title}
            </h2>
            {active.description && (
              <p
                id="confirm-dialog-desc"
                className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-muted)]"
              >
                {active.description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => resolve(false)}>
            {active.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            ref={confirmRef}
            size="sm"
            variant={active.destructive ? 'danger' : 'primary'}
            onClick={() => resolve(true)}
          >
            {active.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
