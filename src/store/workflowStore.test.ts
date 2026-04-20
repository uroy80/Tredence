import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkflowStore, useTemporalStore } from './workflowStore';

describe('workflowStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWorkflowStore.getState().resetGraph();
    useTemporalStore.getState().clear();
  });

  it('seeds a single Start node on first boot', () => {
    const { nodes, edges } = useWorkflowStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].data.kind).toBe('start');
    expect(edges).toHaveLength(0);
  });

  it('addNode appends a new node with the correct kind', () => {
    const { addNode } = useWorkflowStore.getState();
    const task = addNode('task', { x: 100, y: 200 });
    expect(task.data.kind).toBe('task');
    expect(useWorkflowStore.getState().nodes).toHaveLength(2);
  });

  it('updateNodeData patches a node and preserves other fields', () => {
    const { addNode, updateNodeData } = useWorkflowStore.getState();
    const task = addNode('task', { x: 0, y: 0 });
    updateNodeData(task.id, { title: 'Patched' });
    const found = useWorkflowStore
      .getState()
      .nodes.find((n) => n.id === task.id);
    if (!found || found.data.kind !== 'task')
      throw new Error('node missing or wrong kind');
    expect(found.data.title).toBe('Patched');
    expect(found.data.assignee).toBe('');
  });

  it('deleteNode removes the node and any connected edges', () => {
    const { addNode, onConnect, deleteNode } = useWorkflowStore.getState();
    const start = useWorkflowStore.getState().nodes[0];
    const task = addNode('task', { x: 0, y: 100 });
    onConnect({
      source: start.id,
      target: task.id,
      sourceHandle: null,
      targetHandle: null,
    });
    expect(useWorkflowStore.getState().edges).toHaveLength(1);
    deleteNode(task.id);
    expect(useWorkflowStore.getState().nodes).toHaveLength(1);
    expect(useWorkflowStore.getState().edges).toHaveLength(0);
  });

  it('rejects self-loops and duplicate edges', () => {
    const { addNode, onConnect } = useWorkflowStore.getState();
    const start = useWorkflowStore.getState().nodes[0];
    const task = addNode('task', { x: 0, y: 100 });

    onConnect({
      source: start.id,
      target: start.id,
      sourceHandle: null,
      targetHandle: null,
    });
    expect(useWorkflowStore.getState().edges).toHaveLength(0);

    onConnect({
      source: start.id,
      target: task.id,
      sourceHandle: null,
      targetHandle: null,
    });
    onConnect({
      source: start.id,
      target: task.id,
      sourceHandle: null,
      targetHandle: null,
    });
    expect(useWorkflowStore.getState().edges).toHaveLength(1);
  });

  it('undo reverts the last mutation', () => {
    const { addNode } = useWorkflowStore.getState();
    addNode('task', { x: 0, y: 0 });
    expect(useWorkflowStore.getState().nodes).toHaveLength(2);
    useTemporalStore.getState().undo();
    expect(useWorkflowStore.getState().nodes).toHaveLength(1);
  });

  it('redo re-applies an undone mutation', () => {
    const { addNode } = useWorkflowStore.getState();
    addNode('task', { x: 0, y: 0 });
    useTemporalStore.getState().undo();
    useTemporalStore.getState().redo();
    expect(useWorkflowStore.getState().nodes).toHaveLength(2);
  });
});
