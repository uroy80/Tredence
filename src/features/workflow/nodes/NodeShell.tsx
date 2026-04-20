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

const accentMap: Record<NodeKind, { ring: string; dot: string; text: string }> = {
  start: {
    ring: 'ring-[var(--color-start)]',
    dot: 'bg-[var(--color-start)]',
    text: 'text-[var(--color-start)]',
  },
  task: {
    ring: 'ring-[var(--color-task)]',
    dot: 'bg-[var(--color-task)]',
    text: 'text-[var(--color-task)]',
  },
  approval: {
    ring: 'ring-[var(--color-approval)]',
    dot: 'bg-[var(--color-approval)]',
    text: 'text-[var(--color-approval)]',
  },
  automated: {
    ring: 'ring-[var(--color-automated)]',
    dot: 'bg-[var(--color-automated)]',
    text: 'text-[var(--color-automated)]',
  },
  end: {
    ring: 'ring-[var(--color-end)]',
    dot: 'bg-[var(--color-end)]',
    text: 'text-[var(--color-end)]',
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
        'group relative min-w-[220px] max-w-[260px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all',
        selected && `ring-2 ${accent.ring} shadow-md`,
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
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white',
            accent.dot,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={clsx('text-[10px] font-semibold uppercase tracking-wider', accent.text)}>
              {kind}
            </div>
            {badge}
          </div>
          <div className="truncate text-sm font-semibold text-[var(--color-ink)]">
            {title || <span className="text-[var(--color-muted)]">Untitled</span>}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-[var(--color-muted)]">{subtitle}</div>
          )}
        </div>
      </div>

      {children && (
        <div className="border-t border-[var(--color-border)] px-3.5 py-2 text-xs text-[var(--color-muted)]">
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
