import { describe, expect, it } from 'vitest';
import { validateWorkflow } from './validation';
import type { WorkflowEdge, WorkflowNode } from '@/types';

const node = (id: string, kind: WorkflowNode['data']['kind']): WorkflowNode => {
  const pos = { x: 0, y: 0 };
  switch (kind) {
    case 'start':
      return {
        id,
        type: 'start',
        position: pos,
        data: { kind: 'start', title: 'Start', metadata: [] },
      };
    case 'task':
      return {
        id,
        type: 'task',
        position: pos,
        data: {
          kind: 'task',
          title: 'Task',
          description: '',
          assignee: '',
          dueDate: '',
          customFields: [],
        },
      };
    case 'approval':
      return {
        id,
        type: 'approval',
        position: pos,
        data: {
          kind: 'approval',
          title: 'Approval',
          approverRole: 'Manager',
          autoApproveThreshold: 0,
        },
      };
    case 'automated':
      return {
        id,
        type: 'automated',
        position: pos,
        data: {
          kind: 'automated',
          title: 'Auto',
          actionId: 'send_email',
          actionParams: {},
        },
      };
    case 'end':
      return {
        id,
        type: 'end',
        position: pos,
        data: { kind: 'end', message: 'Done', summary: true },
      };
  }
};

const edge = (source: string, target: string): WorkflowEdge => ({
  id: `e-${source}-${target}`,
  source,
  target,
});

describe('validateWorkflow', () => {
  it('flags missing Start node as an error', () => {
    const result = validateWorkflow({
      nodes: [node('end-1', 'end')],
      edges: [],
    });
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        kind: 'error',
        message: expect.stringContaining('Start'),
      }),
    );
  });

  it('flags multiple Start nodes', () => {
    const result = validateWorkflow({
      nodes: [node('s1', 'start'), node('s2', 'start'), node('e1', 'end')],
      edges: [edge('s1', 'e1')],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.filter(
        (i) => i.kind === 'error' && /Start/.test(i.message),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('flags Start node with incoming edges', () => {
    const result = validateWorkflow({
      nodes: [
        node('s1', 'start'),
        node('t1', 'task'),
        node('e1', 'end'),
      ],
      edges: [edge('t1', 's1'), edge('s1', 'e1')],
    });
    expect(
      result.issues.some(
        (i) => i.kind === 'error' && /incoming/.test(i.message),
      ),
    ).toBe(true);
  });

  it('flags End node with outgoing edges', () => {
    const result = validateWorkflow({
      nodes: [
        node('s1', 'start'),
        node('t1', 'task'),
        node('e1', 'end'),
      ],
      edges: [edge('s1', 'e1'), edge('e1', 't1')],
    });
    expect(
      result.issues.some(
        (i) => i.kind === 'error' && /outgoing/.test(i.message),
      ),
    ).toBe(true);
  });

  it('flags cycles', () => {
    const result = validateWorkflow({
      nodes: [
        node('s1', 'start'),
        node('t1', 'task'),
        node('t2', 'task'),
        node('e1', 'end'),
      ],
      edges: [edge('s1', 't1'), edge('t1', 't2'), edge('t2', 't1'), edge('t1', 'e1')],
    });
    expect(
      result.issues.some((i) => i.kind === 'error' && /cycle/i.test(i.message)),
    ).toBe(true);
  });

  it('warns when End is unreachable from Start', () => {
    const result = validateWorkflow({
      nodes: [node('s1', 'start'), node('t1', 'task'), node('e1', 'end')],
      edges: [edge('s1', 't1')],
    });
    expect(
      result.issues.some(
        (i) => i.kind === 'warning' && /unreachable/i.test(i.message),
      ),
    ).toBe(true);
  });

  it('errors when an Automated Step has no action selected', () => {
    const auto = node('a1', 'automated');
    if (auto.data.kind === 'automated') auto.data.actionId = null;
    const result = validateWorkflow({
      nodes: [node('s1', 'start'), auto, node('e1', 'end')],
      edges: [edge('s1', 'a1'), edge('a1', 'e1')],
    });
    expect(
      result.issues.some(
        (i) =>
          i.kind === 'error' &&
          i.nodeId === 'a1' &&
          /action/i.test(i.message),
      ),
    ).toBe(true);
  });

  it('errors when a Task has no title', () => {
    const task = node('t1', 'task');
    if (task.data.kind === 'task') task.data.title = '';
    const result = validateWorkflow({
      nodes: [node('s1', 'start'), task, node('e1', 'end')],
      edges: [edge('s1', 't1'), edge('t1', 'e1')],
    });
    expect(
      result.issues.some(
        (i) => i.kind === 'error' && i.nodeId === 't1' && /title/i.test(i.message),
      ),
    ).toBe(true);
  });

  it('passes a well-formed linear workflow', () => {
    const result = validateWorkflow({
      nodes: [
        node('s1', 'start'),
        node('t1', 'task'),
        node('a1', 'approval'),
        node('au1', 'automated'),
        node('e1', 'end'),
      ],
      edges: [
        edge('s1', 't1'),
        edge('t1', 'a1'),
        edge('a1', 'au1'),
        edge('au1', 'e1'),
      ],
    });
    expect(result.ok).toBe(true);
    expect(
      result.issues.filter((i) => i.kind === 'error'),
    ).toHaveLength(0);
  });
});
