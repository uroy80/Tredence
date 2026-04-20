import { useCallback } from 'react';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { selectSelectedNode, useWorkflowStore } from '@/store/workflowStore';
import type { NodeKind, WorkflowNodeData } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  ApprovalIcon,
  BoltIcon,
  FlagIcon,
  PlayIcon,
  TaskIcon,
  TrashIcon,
  XIcon,
} from '@/components/icons';
import { StartNodeForm } from './StartNodeForm';
import { TaskNodeForm } from './TaskNodeForm';
import { ApprovalNodeForm } from './ApprovalNodeForm';
import { AutomatedNodeForm } from './AutomatedNodeForm';
import { EndNodeForm } from './EndNodeForm';
import { NODE_REGISTRY } from '@/features/workflow/nodes/nodeRegistry';

export interface NodeFormProps<TData extends WorkflowNodeData> {
  data: TData;
  onPatch: (patch: Partial<TData>) => void;
}

const iconMap: Record<NodeKind, typeof PlayIcon> = {
  start: PlayIcon,
  task: TaskIcon,
  approval: ApprovalIcon,
  automated: BoltIcon,
  end: FlagIcon,
};

const accentMap: Record<NodeKind, { bg: string; dot: string }> = {
  start: { bg: 'bg-[var(--color-start-soft)]', dot: 'bg-[var(--color-start)]' },
  task: { bg: 'bg-[var(--color-task-soft)]', dot: 'bg-[var(--color-task)]' },
  approval: { bg: 'bg-[var(--color-approval-soft)]', dot: 'bg-[var(--color-approval)]' },
  automated: { bg: 'bg-[var(--color-automated-soft)]', dot: 'bg-[var(--color-automated)]' },
  end: { bg: 'bg-[var(--color-end-soft)]', dot: 'bg-[var(--color-end)]' },
};

export function NodeFormPanel() {
  const { node, updateNodeData, deleteNode, setSelectedNode } = useWorkflowStore(
    useShallow((s) => ({
      node: selectSelectedNode(s),
      updateNodeData: s.updateNodeData,
      deleteNode: s.deleteNode,
      setSelectedNode: s.setSelectedNode,
    })),
  );

  const onPatch = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      if (!node) return;
      updateNodeData(node.id, patch);
    },
    [node, updateNodeData],
  );

  if (!node) {
    return (
      <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-5 py-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Inspector
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-[var(--color-ink)]">
            Node Configuration
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-faint)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v4" />
              <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
              <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
              <path d="M3 9V5a2 2 0 0 1 2-2h4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--color-ink)]">
              No node selected
            </div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-muted)]">
              Click any node on the canvas to edit it here, or drag a new one
              from the palette on the left.
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const descriptor = NODE_REGISTRY[node.data.kind];
  const Icon = iconMap[node.data.kind];
  const accent = accentMap[node.data.kind];

  return (
    <aside
      key={node.id}
      className="anim-fade-in flex h-full w-[340px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] px-5 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              accent.bg,
            )}
          >
            <div
              className={clsx(
                'flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-[var(--shadow-sm)]',
                accent.dot,
              )}
            >
              <Icon width={13} height={13} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
              {descriptor.label} Node
            </div>
            <div className="text-[13px] font-semibold text-[var(--color-ink)]">
              Edit configuration
            </div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--color-faint)]">
              {node.id}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => setSelectedNode(null)}
          aria-label="Close inspector"
          icon={<XIcon />}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <FormForNode node={node} onPatch={onPatch} />
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3">
        <Button
          variant="danger"
          size="sm"
          onClick={() => deleteNode(node.id)}
          icon={<TrashIcon />}
        >
          Delete node
        </Button>
      </div>
    </aside>
  );
}

function FormForNode({
  node,
  onPatch,
}: {
  node: NonNullable<ReturnType<typeof selectSelectedNode>>;
  onPatch: (patch: Partial<WorkflowNodeData>) => void;
}) {
  const data = node.data;
  switch (data.kind) {
    case 'start':
      return <StartNodeForm data={data} onPatch={onPatch} />;
    case 'task':
      return <TaskNodeForm data={data} onPatch={onPatch} />;
    case 'approval':
      return <ApprovalNodeForm data={data} onPatch={onPatch} />;
    case 'automated':
      return <AutomatedNodeForm data={data} onPatch={onPatch} />;
    case 'end':
      return <EndNodeForm data={data} onPatch={onPatch} />;
  }
}
