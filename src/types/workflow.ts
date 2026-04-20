import type { Edge, Node, XYPosition } from '@xyflow/react';

export const NODE_KINDS = ['start', 'task', 'approval', 'automated', 'end'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

export interface StartNodeData extends Record<string, unknown> {
  kind: 'start';
  title: string;
  metadata: KeyValuePair[];
}

export interface TaskNodeData extends Record<string, unknown> {
  kind: 'task';
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  customFields: KeyValuePair[];
}

export type ApproverRole = 'Manager' | 'HRBP' | 'Director' | 'CEO';

export interface ApprovalNodeData extends Record<string, unknown> {
  kind: 'approval';
  title: string;
  approverRole: ApproverRole;
  autoApproveThreshold: number;
}

export interface AutomatedNodeData extends Record<string, unknown> {
  kind: 'automated';
  title: string;
  actionId: string | null;
  actionParams: Record<string, string>;
}

export interface EndNodeData extends Record<string, unknown> {
  kind: 'end';
  message: string;
  summary: boolean;
}

export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedNodeData
  | EndNodeData;

export type StartNode = Node<StartNodeData, 'start'>;
export type TaskNode = Node<TaskNodeData, 'task'>;
export type ApprovalNode = Node<ApprovalNodeData, 'approval'>;
export type AutomatedNode = Node<AutomatedNodeData, 'automated'>;
export type EndNode = Node<EndNodeData, 'end'>;

export type WorkflowNode =
  | StartNode
  | TaskNode
  | ApprovalNode
  | AutomatedNode
  | EndNode;
export type WorkflowEdge = Edge;

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface AutomationDefinition {
  id: string;
  label: string;
  description?: string;
  params: string[];
}

export interface SimulationStep {
  id: string;
  nodeId: string;
  kind: NodeKind;
  title: string;
  status: 'ok' | 'skipped' | 'error' | 'info';
  message: string;
  elapsedMs: number;
}

export interface SimulationResult {
  ok: boolean;
  steps: SimulationStep[];
  startedAt: string;
  finishedAt: string;
  summary: string;
}

export interface SimulationRequest {
  graph: WorkflowGraph;
}

export interface ValidationIssue {
  kind: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface NodeTypeDescriptor {
  kind: NodeKind;
  label: string;
  description: string;
  accent: string;
  createPosition: (position: XYPosition) => XYPosition;
  createData: () => WorkflowNodeData;
}
