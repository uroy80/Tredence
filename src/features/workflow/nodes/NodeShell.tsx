import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import clsx from 'clsx';
import type { NodeKind } from '@/types';

interface NodeShellProps {
  kind: NodeKind;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  selected?: boolean;
  hasTarget?: boolean;
  hasSource?: boolean;
  children?: ReactNode;
  badge?: ReactNode;
}

const accentMap: Record<
  NodeKind,
  { ring: string; dot: string; text: string; bgSoft: string; pillBorder: string }
> = {
  start: {
    ring: 'ring-[var(--color-start)]',
    dot: 'bg-[var(--color-start)]',
    text: 'text-[var(--color-start)]',
    bgSoft: 'bg-[var(--color-start-soft)]',
    pillBorder: 'border-[var(--color-start)]/20',
  },
  task: {
    ring: 'ring-[var(--color-task)]',
    dot: 'bg-[var(--color-task)]',
    text: 'text-[var(--color-task)]',
    bgSoft: 'bg-[var(--color-task-soft)]',
    pillBorder: 'border-[var(--color-task)]/20',
  },
  approval: {
    ring: 'ring-[var(--color-approval)]',
    dot: 'bg-[var(--color-approval)]',
    text: 'text-[var(--color-approval)]',
    bgSoft: 'bg-[var(--color-approval-soft)]',
    pillBorder: 'border-[var(--color-approval)]/20',
  },
  automated: {
    ring: 'ring-[var(--color-automated)]',
    dot: 'bg-[var(--color-automated)]',
    text: 'text-[var(--color-automated)]',
    bgSoft: 'bg-[var(--color-automated-soft)]',
    pillBorder: 'border-[var(--color-automated)]/20',
  },
  end: {
    ring: 'ring-[var(--color-end)]',
    dot: 'bg-[var(--color-end)]',
    text: 'text-[var(--color-end)]',
    bgSoft: 'bg-[var(--color-end-soft)]',
    pillBorder: 'border-[var(--color-end)]/20',
  },
};

function NodeShellImpl({
  kind,
  title,
  subtitle,
  icon,
  selected,
  hasTarget = true,
  hasSource = true,
  children,
  badge,
}: NodeShellProps) {
  const accent = accentMap[kind];

  return (
    <div
      className={clsx(
        'group relative min-w-[230px] max-w-[270px] rounded-2xl border bg-[var(--color-surface)] transition-all duration-200',
        selected
          ? `border-transparent ring-2 ${accent.ring} shadow-[var(--shadow-lg)]`
          : 'border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]',
      )}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className="!top-[-5px]"
        />
      )}

      <div className="flex items-start gap-3 px-3.5 pt-3 pb-2">
        <div
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            accent.bgSoft,
          )}
        >
          <div
            className={clsx(
              'flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-[var(--shadow-sm)]',
              accent.dot,
            )}
          >
            {icon}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                'rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.08em]',
                accent.text,
                accent.pillBorder,
                accent.bgSoft,
              )}
            >
              {kind}
            </span>
            {badge}
          </div>
          <div className="mt-0.5 truncate text-[13px] font-semibold leading-tight text-[var(--color-ink)]">
            {title || (
              <span className="text-[var(--color-faint)] italic">Untitled</span>
            )}
          </div>
          {subtitle && (
            <div className="truncate text-[11px] leading-snug text-[var(--color-muted)]">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {children && (
        <div className="border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-2)_60%,transparent)] px-3.5 py-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
          {children}
        </div>
      )}

      {hasSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bottom-[-5px]"
        />
      )}
    </div>
  );
}

export const NodeShell = memo(NodeShellImpl);
