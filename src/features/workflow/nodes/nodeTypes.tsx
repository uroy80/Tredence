import { memo } from 'react';
import type { NodeProps, NodeTypes } from '@xyflow/react';
import { NodeShell } from './NodeShell';
import {
  ApprovalIcon,
  BoltIcon,
  FlagIcon,
  PlayIcon,
  TaskIcon,
} from '@/components/icons';
import { findAutomation } from '@/api';
import type {
  ApprovalNode as ApprovalNodeType,
  AutomatedNode as AutomatedNodeType,
  EndNode as EndNodeType,
  StartNode as StartNodeType,
  TaskNode as TaskNodeType,
} from '@/types';

export const StartNode = memo(
  ({ data, selected }: NodeProps<StartNodeType>) => (
    <NodeShell
      kind="start"
      title={data.title}
      subtitle="Workflow entry point"
      icon={<PlayIcon />}
      selected={selected}
      hasTarget={false}
    >
      {data.metadata.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.metadata.slice(0, 3).map((m) => (
            <span
              key={m.id}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {m.key}: {m.value}
            </span>
          ))}
        </div>
      )}
    </NodeShell>
  ),
);
StartNode.displayName = 'StartNode';

export const TaskNode = memo(({ data, selected }: NodeProps<TaskNodeType>) => (
  <NodeShell
    kind="task"
    title={data.title}
    subtitle={data.description || 'Human task'}
    icon={<TaskIcon />}
    selected={selected}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="truncate">
        {data.assignee ? `👤 ${data.assignee}` : 'Unassigned'}
      </span>
      {data.dueDate && (
        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
          {data.dueDate}
        </span>
      )}
    </div>
  </NodeShell>
));
TaskNode.displayName = 'TaskNode';

export const ApprovalNode = memo(
  ({ data, selected }: NodeProps<ApprovalNodeType>) => (
    <NodeShell
      kind="approval"
      title={data.title}
      subtitle={`Approver: ${data.approverRole}`}
      icon={<ApprovalIcon />}
      selected={selected}
    >
      {data.autoApproveThreshold > 0 ? (
        <span>Auto-approve ≤ {data.autoApproveThreshold}</span>
      ) : (
        <span>Manual approval</span>
      )}
    </NodeShell>
  ),
);
ApprovalNode.displayName = 'ApprovalNode';

export const AutomatedNode = memo(
  ({ data, selected }: NodeProps<AutomatedNodeType>) => {
    const action = findAutomation(data.actionId);
    return (
      <NodeShell
        kind="automated"
        title={data.title}
        subtitle={action ? `Action: ${action.label}` : 'No action configured'}
        icon={<BoltIcon />}
        selected={selected}
      >
        {action && (
          <div className="flex flex-wrap gap-1">
            {action.params.map((p) => {
              const v = data.actionParams[p];
              return (
                <span
                  key={p}
                  className={
                    v
                      ? 'rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700'
                      : 'rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700'
                  }
                >
                  {p}
                  {v ? `: ${v.length > 10 ? v.slice(0, 10) + '…' : v}` : ' (missing)'}
                </span>
              );
            })}
          </div>
        )}
      </NodeShell>
    );
  },
);
AutomatedNode.displayName = 'AutomatedNode';

export const EndNode = memo(({ data, selected }: NodeProps<EndNodeType>) => (
  <NodeShell
    kind="end"
    title={data.message}
    subtitle={data.summary ? 'Summary: enabled' : 'Summary: disabled'}
    icon={<FlagIcon />}
    selected={selected}
    hasSource={false}
  />
));
EndNode.displayName = 'EndNode';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  end: EndNode,
};
