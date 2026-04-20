import { describe, expect, it } from 'vitest';
import { simulateWorkflow } from './simulate';
import type { WorkflowEdge, WorkflowNode } from '@/types';

const buildGraph = (): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} => ({
  nodes: [
    {
      id: 's1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { kind: 'start', title: 'Start', metadata: [] },
    },
    {
      id: 't1',
      type: 'task',
      position: { x: 0, y: 100 },
      data: {
        kind: 'task',
        title: 'Collect forms',
        description: '',
        assignee: 'hr@co',
        dueDate: '',
        customFields: [],
      },
    },
    {
      id: 'a1',
      type: 'automated',
      position: { x: 0, y: 200 },
      data: {
        kind: 'automated',
        title: 'Email',
        actionId: 'send_email',
        actionParams: { to: 'hr@co', subject: 'Welcome', body: 'Hi' },
      },
    },
    {
      id: 'e1',
      type: 'end',
      position: { x: 0, y: 300 },
      data: { kind: 'end', message: 'Done', summary: true },
    },
  ],
  edges: [
    { id: 'ee1', source: 's1', target: 't1' },
    { id: 'ee2', source: 't1', target: 'a1' },
    { id: 'ee3', source: 'a1', target: 'e1' },
  ],
});

describe('simulateWorkflow', () => {
  it('walks a valid linear graph end-to-end', async () => {
    const graph = buildGraph();
    const result = await simulateWorkflow({ graph });
    expect(result.ok).toBe(true);
    expect(result.steps.map((s) => s.nodeId)).toEqual([
      's1',
      't1',
      'a1',
      'e1',
    ]);
    expect(result.steps.every((s) => s.status !== 'error')).toBe(true);
  });

  it('marks unreachable nodes as skipped', async () => {
    const graph = buildGraph();
    graph.nodes.push({
      id: 'orphan',
      type: 'task',
      position: { x: 500, y: 500 },
      data: {
        kind: 'task',
        title: 'Orphan',
        description: '',
        assignee: '',
        dueDate: '',
        customFields: [],
      },
    });
    const result = await simulateWorkflow({ graph });
    const orphanStep = result.steps.find((s) => s.nodeId === 'orphan');
    expect(orphanStep?.status).toBe('skipped');
  });

  it('surfaces missing automated params as a step error', async () => {
    const graph = buildGraph();
    const auto = graph.nodes.find((n) => n.id === 'a1');
    if (auto && auto.data.kind === 'automated') {
      auto.data.actionParams = {};
    }
    const result = await simulateWorkflow({ graph });
    const step = result.steps.find((s) => s.nodeId === 'a1');
    expect(step?.status).toBe('error');
    expect(step?.message).toMatch(/missing params/i);
  });

  it('fails up-front if the graph has a cycle', async () => {
    const graph = buildGraph();
    graph.edges.push({ id: 'cyc', source: 'a1', target: 't1' });
    const result = await simulateWorkflow({ graph });
    expect(result.ok).toBe(false);
    expect(result.steps.some((s) => /cycle/i.test(s.message))).toBe(true);
  });
});
