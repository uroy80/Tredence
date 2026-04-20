import type { DragEvent } from 'react';
import clsx from 'clsx';
import { NODE_ORDER, NODE_REGISTRY } from '@/features/workflow/nodes/nodeRegistry';
import type { NodeKind } from '@/types';
import {
  ApprovalIcon,
  BoltIcon,
  FlagIcon,
  PlayIcon,
  TaskIcon,
} from '@/components/icons';

export const DRAG_MIME = 'application/x-workflow-node-kind';

const iconMap: Record<NodeKind, typeof PlayIcon> = {
  start: PlayIcon,
  task: TaskIcon,
  approval: ApprovalIcon,
  automated: BoltIcon,
  end: FlagIcon,
};

const bgMap: Record<NodeKind, string> = {
  start: 'bg-[var(--color-start)]',
  task: 'bg-[var(--color-task)]',
  approval: 'bg-[var(--color-approval)]',
  automated: 'bg-[var(--color-automated)]',
  end: 'bg-[var(--color-end)]',
};

function handleDragStart(e: DragEvent<HTMLDivElement>, kind: NodeKind) {
  e.dataTransfer.setData(DRAG_MIME, kind);
  e.dataTransfer.effectAllowed = 'move';
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          Node Palette
        </div>
        <div className="text-sm font-semibold text-[var(--color-ink)]">
          Workflow Designer
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-1 text-[11px] text-[var(--color-muted)]">
          Drag a node onto the canvas to add it to your workflow.
        </p>
        <div className="flex flex-col gap-2">
          {NODE_ORDER.map((kind) => {
            const desc = NODE_REGISTRY[kind];
            const Icon = iconMap[kind];
            return (
              <div
                key={kind}
                draggable
                onDragStart={(e) => handleDragStart(e, kind)}
                className="group flex cursor-grab items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-white p-2.5 text-left shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md active:cursor-grabbing"
              >
                <div
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white',
                    bgMap[kind],
                  )}
                >
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[var(--color-ink)]">
                    {desc.label}
                  </div>
                  <div className="truncate text-[11px] text-[var(--color-muted)]">
                    {desc.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-3 text-[11px] text-[var(--color-muted)]">
        <div className="font-medium text-[var(--color-ink)]">Tips</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Click a node to edit it</li>
          <li>Drag from ● handles to connect</li>
          <li>Select + Backspace to delete</li>
        </ul>
      </div>
    </aside>
  );
}
