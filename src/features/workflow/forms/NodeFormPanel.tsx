import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { selectSelectedNode, useWorkflowStore } from '@/store/workflowStore';
import type { WorkflowNodeData } from '@/types';
import { Button } from '@/components/ui/Button';
import { TrashIcon, XIcon } from '@/components/icons';
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
      <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Inspector
          </div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">
            Node Configuration
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <div className="text-sm font-medium text-[var(--color-ink)]">
            No node selected
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            Click a node on the canvas to edit its configuration, or drag a new
            node from the palette.
          </div>
        </div>
      </aside>
    );
  }

  const descriptor = NODE_REGISTRY[node.data.kind];

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {descriptor.label} Node
          </div>
          <div className="truncate text-sm font-semibold text-[var(--color-ink)]">
            Edit configuration
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-[var(--color-muted)]">
            {node.id}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedNode(null)}
          aria-label="Close inspector"
        >
          <XIcon />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <FormForNode node={node} onPatch={onPatch} />
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-3">
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
