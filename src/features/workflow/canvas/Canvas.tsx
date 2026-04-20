import { useCallback, useRef, type DragEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import { useWorkflowStore } from '@/store/workflowStore';
import { nodeTypes } from '@/features/workflow/nodes/nodeTypesMap';
import { DRAG_MIME } from '@/features/workflow/sidebar/Sidebar';
import type { NodeKind, WorkflowNode } from '@/types';

function CanvasInner() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const onDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData(DRAG_MIME) as NodeKind;
      if (!kind) return;
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addNode(kind, position);
    },
    [addNode, screenToFlowPosition],
  );

  const onNodeClick: NodeMouseHandler<WorkflowNode> = useCallback(
    (_e, node) => setSelectedNode(node.id),
    [setSelectedNode],
  );

  const onPaneClick = useCallback(
    () => setSelectedNode(null),
    [setSelectedNode],
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const first = params.nodes[0];
      if (first) setSelectedNode(first.id);
    },
    [setSelectedNode],
  );

  return (
    <div ref={wrapperRef} className="relative h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes.map((n) =>
          n.id === selectedNodeId ? { ...n, selected: true } : n,
        )}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.25, minZoom: 0.6, maxZoom: 1.4 }}
        proOptions={{ hideAttribution: false }}
        className="bg-[var(--color-bg)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#cbd5e1" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(n) => {
            const kind = (n.data as { kind?: NodeKind }).kind;
            const map: Record<NodeKind, string> = {
              start: '#10b981',
              task: '#3b82f6',
              approval: '#f59e0b',
              automated: '#8b5cf6',
              end: '#ef4444',
            };
            return map[kind ?? 'task'] ?? '#94a3b8';
          }}
          maskColor="rgba(248,250,252,0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
