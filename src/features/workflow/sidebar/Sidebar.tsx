import type { DragEvent } from 'react';
import clsx from 'clsx';
import { NODE_ORDER, NODE_REGISTRY } from '@/features/workflow/nodes/nodeRegistry';
import type { NodeKind } from '@/types';
import {
  ApprovalIcon,
  BoltIcon,
  FlagIcon,
  PlayIcon,
  SparkleIcon,
  TaskIcon,
} from '@/components/icons';
import { hotkeyLabel } from '@/hooks/useHotkeys';

export const DRAG_MIME = 'application/x-workflow-node-kind';

const iconMap: Record<NodeKind, typeof PlayIcon> = {
  start: PlayIcon,
  task: TaskIcon,
  approval: ApprovalIcon,
  automated: BoltIcon,
  end: FlagIcon,
};

const accentMap: Record<NodeKind, { bg: string; border: string; dot: string }> = {
  start: {
    bg: 'bg-[var(--color-start-soft)]',
    border: 'hover:border-[var(--color-start)]/40',
    dot: 'bg-[var(--color-start)]',
  },
  task: {
    bg: 'bg-[var(--color-task-soft)]',
    border: 'hover:border-[var(--color-task)]/40',
    dot: 'bg-[var(--color-task)]',
  },
  approval: {
    bg: 'bg-[var(--color-approval-soft)]',
    border: 'hover:border-[var(--color-approval)]/40',
    dot: 'bg-[var(--color-approval)]',
  },
  automated: {
    bg: 'bg-[var(--color-automated-soft)]',
    border: 'hover:border-[var(--color-automated)]/40',
    dot: 'bg-[var(--color-automated)]',
  },
  end: {
    bg: 'bg-[var(--color-end-soft)]',
    border: 'hover:border-[var(--color-end)]/40',
    dot: 'bg-[var(--color-end)]',
  },
};

function handleDragStart(e: DragEvent<HTMLDivElement>, kind: NodeKind) {
  e.dataTransfer.setData(DRAG_MIME, kind);
  e.dataTransfer.effectAllowed = 'move';
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          <SparkleIcon width={11} height={11} />
          Node Palette
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-[var(--color-ink)]">
          Building Blocks
        </div>
        <div className="text-[11px] leading-snug text-[var(--color-muted)]">
          Drag any node onto the canvas to build your workflow.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-1.5">
          {NODE_ORDER.map((kind) => {
            const desc = NODE_REGISTRY[kind];
            const Icon = iconMap[kind];
            const accent = accentMap[kind];
            return (
              <div
                key={kind}
                draggable
                onDragStart={(e) => handleDragStart(e, kind)}
                className={clsx(
                  'group relative flex cursor-grab items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-left transition-all duration-200',
                  accent.border,
                  'hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] active:cursor-grabbing active:translate-y-0',
                )}
              >
                <div
                  className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                    accent.bg,
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-6 w-6 items-center justify-center rounded-md text-white shadow-[var(--shadow-sm)]',
                      accent.dot,
                    )}
                  >
                    <Icon width={13} height={13} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[var(--color-ink)]">
                    {desc.label}
                  </div>
                  <div className="truncate text-[11px] leading-snug text-[var(--color-muted)]">
                    {desc.description}
                  </div>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[var(--color-faint)] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <path d="M5 9l-3 3 3 3" />
                  <path d="M9 5l-3 3 3 3" />
                  <path d="M15 19l3-3-3-3" />
                  <path d="M19 15l3-3-3-3" />
                  <path d="M2 12h20" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Shortcuts
        </div>
        <ul className="flex flex-col gap-1 text-[11px] text-[var(--color-ink-soft)]">
          <ShortcutRow combo={hotkeyLabel('mod+z')} label="Undo" />
          <ShortcutRow combo={hotkeyLabel('mod+shift+z')} label="Redo" />
          <ShortcutRow combo={hotkeyLabel('mod+enter')} label="Simulate" />
          <ShortcutRow combo="Del" label="Delete selected" />
        </ul>
      </div>
    </aside>
  );
}

function ShortcutRow({ combo, label }: { combo: string; label: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-[var(--color-muted)]">{label}</span>
      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-soft)] shadow-[var(--shadow-sm)]">
        {combo}
      </kbd>
    </li>
  );
}
