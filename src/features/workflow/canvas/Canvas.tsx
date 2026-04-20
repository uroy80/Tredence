import { useCallback, useMemo, useRef, type DragEvent } from 'react';
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
  type Node,
} from '@xyflow/react';
import { useWorkflowStore } from '@/store/workflowStore';
import { nodeTypes } from '@/features/workflow/nodes/nodeTypesMap';
import { DRAG_MIME } from '@/features/workflow/sidebar/Sidebar';
import type { NodeKind, WorkflowNode } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const MINIMAP_COLORS: Record<'light' | 'dark', Record<NodeKind, string>> = {
  light: {
    start: '#5E8F73',
    task: '#4F6F9B',
    approval: '#C88A40',
    automated: '#7A5FB8',
    end: '#B85C47',
  },
  dark: {
    start: '#7DAE92',
    task: '#779AC7',
    approval: '#D9A660',
    automated: '#9E87D4',
    end: '#D17865',
  },
};

const BG_DOT_COLORS: Record<'light' | 'dark', string> = {
  light: '#D8D2C3',
  dark: '#3A3631',
};

const MASK_COLORS: Record<'light' | 'dark', string> = {
  light: 'rgba(250, 249, 245, 0.78)',
  dark: 'rgba(31, 30, 28, 0.78)',
};

const MINIMAP_BG: Record<'light' | 'dark', string> = {
  light: '#FFFFFF',
  dark: '#26241F',
};

const MINIMAP_STROKE: Record<'light' | 'dark', string> = {
  light: '#ECE7DD',
  dark: '#3A3631',
};

function CanvasInner() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { theme } = useTheme();

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
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
      setSelectedNode(first ? first.id : null);
    },
    [setSelectedNode],
  );

  const nodeColor = useCallback(
    (n: Node) => {
      const kind = (n.type as NodeKind) ?? 'task';
      return MINIMAP_COLORS[theme][kind] ?? MINIMAP_COLORS[theme].task;
    },
    [theme],
  );

  const nodeStrokeColor = useCallback(
    (n: Node) => {
      const kind = (n.type as NodeKind) ?? 'task';
      return MINIMAP_COLORS[theme][kind] ?? MINIMAP_COLORS[theme].task;
    },
    [theme],
  );

  const minimapStyle = useMemo(
    () => ({
      backgroundColor: MINIMAP_BG[theme],
      border: `1px solid ${MINIMAP_STROKE[theme]}`,
      width: 180,
      height: 120,
    }),
    [theme],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.2}
          color={BG_DOT_COLORS[theme]}
        />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          ariaLabel="Workflow minimap"
          nodeColor={nodeColor}
          nodeStrokeColor={nodeStrokeColor}
          nodeStrokeWidth={3}
          nodeBorderRadius={6}
          maskColor={MASK_COLORS[theme]}
          maskStrokeColor={MINIMAP_STROKE[theme]}
          maskStrokeWidth={1}
          offsetScale={2}
          style={minimapStyle}
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
