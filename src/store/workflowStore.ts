import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react';
import type {
  NodeKind,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from '@/types';
import { createNodeData } from '@/features/workflow/nodes/nodeRegistry';

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (kind: NodeKind, position: XYPosition) => WorkflowNode;
  updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;

  setSelectedNode: (nodeId: string | null) => void;

  loadGraph: (graph: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  resetGraph: () => void;
}

const seedNodes: WorkflowNode[] = [
  {
    id: 'start-seed',
    type: 'start',
    position: { x: 80, y: 120 },
    data: { kind: 'start', title: 'Workflow Start', metadata: [] },
  },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: seedNodes,
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    if (connection.source === connection.target) return;
    set({
      edges: addEdge(
        { ...connection, id: `e-${nanoid(8)}`, animated: true },
        get().edges,
      ),
    });
  },

  addNode: (kind, position) => {
    const node = {
      id: `${kind}-${nanoid(6)}`,
      type: kind,
      position,
      data: createNodeData(kind),
    } as WorkflowNode;
    set({ nodes: [...get().nodes, node] });
    return node;
  },

  updateNodeData: (nodeId, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? ({ ...n, data: { ...n.data, ...patch } } as WorkflowNode)
          : n,
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  deleteEdge: (edgeId) => {
    set({ edges: get().edges.filter((e) => e.id !== edgeId) });
  },

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  loadGraph: (graph) =>
    set({ nodes: graph.nodes, edges: graph.edges, selectedNodeId: null }),

  resetGraph: () =>
    set({ nodes: seedNodes, edges: [], selectedNodeId: null }),
}));

export const selectSelectedNode = (state: WorkflowState): WorkflowNode | null =>
  state.selectedNodeId
    ? (state.nodes.find((n) => n.id === state.selectedNodeId) ?? null)
    : null;
