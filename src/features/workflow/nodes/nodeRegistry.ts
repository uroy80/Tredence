import type {
  ApprovalNodeData,
  AutomatedNodeData,
  EndNodeData,
  NodeKind,
  NodeTypeDescriptor,
  StartNodeData,
  TaskNodeData,
  WorkflowNodeData,
} from '@/types';

const defaults: Record<NodeKind, () => WorkflowNodeData> = {
  start: (): StartNodeData => ({
    kind: 'start',
    title: 'Workflow Start',
    metadata: [],
  }),
  task: (): TaskNodeData => ({
    kind: 'task',
    title: 'New Task',
    description: '',
    assignee: '',
    dueDate: '',
    customFields: [],
  }),
  approval: (): ApprovalNodeData => ({
    kind: 'approval',
    title: 'Approval Step',
    approverRole: 'Manager',
    autoApproveThreshold: 0,
  }),
  automated: (): AutomatedNodeData => ({
    kind: 'automated',
    title: 'Automated Step',
    actionId: null,
    actionParams: {},
  }),
  end: (): EndNodeData => ({
    kind: 'end',
    message: 'Workflow complete',
    summary: true,
  }),
};

export const NODE_REGISTRY: Record<NodeKind, NodeTypeDescriptor> = {
  start: {
    kind: 'start',
    label: 'Start',
    description: 'Workflow entry point',
    accent: 'start',
    createPosition: (p) => p,
    createData: defaults.start,
  },
  task: {
    kind: 'task',
    label: 'Task',
    description: 'Human task (e.g., collect documents)',
    accent: 'task',
    createPosition: (p) => p,
    createData: defaults.task,
  },
  approval: {
    kind: 'approval',
    label: 'Approval',
    description: 'Manager or HR approval step',
    accent: 'approval',
    createPosition: (p) => p,
    createData: defaults.approval,
  },
  automated: {
    kind: 'automated',
    label: 'Automated Step',
    description: 'System-triggered action (email, PDF)',
    accent: 'automated',
    createPosition: (p) => p,
    createData: defaults.automated,
  },
  end: {
    kind: 'end',
    label: 'End',
    description: 'Workflow completion',
    accent: 'end',
    createPosition: (p) => p,
    createData: defaults.end,
  },
};

export const NODE_ORDER: NodeKind[] = ['start', 'task', 'approval', 'automated', 'end'];

export function createNodeData(kind: NodeKind): WorkflowNodeData {
  return NODE_REGISTRY[kind].createData();
}

export function getNodeLabel(kind: NodeKind): string {
  return NODE_REGISTRY[kind].label;
}

export function getAccentClass(kind: NodeKind): string {
  const map: Record<NodeKind, string> = {
    start: 'border-[var(--color-start)]',
    task: 'border-[var(--color-task)]',
    approval: 'border-[var(--color-approval)]',
    automated: 'border-[var(--color-automated)]',
    end: 'border-[var(--color-end)]',
  };
  return map[kind];
}

export function getAccentBg(kind: NodeKind): string {
  const map: Record<NodeKind, string> = {
    start: 'bg-[var(--color-start)]',
    task: 'bg-[var(--color-task)]',
    approval: 'bg-[var(--color-approval)]',
    automated: 'bg-[var(--color-automated)]',
    end: 'bg-[var(--color-end)]',
  };
  return map[kind];
}
