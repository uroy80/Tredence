import type {
  ValidationIssue,
  ValidationResult,
  WorkflowEdge,
  WorkflowNode,
} from '@/types';

interface ValidateArgs {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function validateWorkflow({ nodes, edges }: ValidateArgs): ValidationResult {
  const issues: ValidationIssue[] = [];

  const startNodes = nodes.filter((n) => n.data.kind === 'start');
  const endNodes = nodes.filter((n) => n.data.kind === 'end');

  if (startNodes.length === 0) {
    issues.push({ kind: 'error', message: 'Workflow must contain a Start node.' });
  } else if (startNodes.length > 1) {
    issues.push({
      kind: 'error',
      message: `Workflow must have exactly one Start node (found ${startNodes.length}).`,
    });
  }

  if (endNodes.length === 0) {
    issues.push({ kind: 'warning', message: 'Workflow has no End node.' });
  }

  for (const node of nodes) {
    if (node.data.kind === 'start') {
      const incoming = edges.filter((e) => e.target === node.id);
      if (incoming.length > 0) {
        issues.push({
          kind: 'error',
          nodeId: node.id,
          message: 'Start node cannot have incoming connections.',
        });
      }
    }

    if (node.data.kind === 'end') {
      const outgoing = edges.filter((e) => e.source === node.id);
      if (outgoing.length > 0) {
        issues.push({
          kind: 'error',
          nodeId: node.id,
          message: 'End node cannot have outgoing connections.',
        });
      }
    }

    if (node.data.kind !== 'start' && node.data.kind !== 'end') {
      const incoming = edges.filter((e) => e.target === node.id);
      const outgoing = edges.filter((e) => e.source === node.id);
      if (incoming.length === 0) {
        issues.push({
          kind: 'warning',
          nodeId: node.id,
          message: `"${describeNode(node)}" has no incoming connection.`,
        });
      }
      if (outgoing.length === 0) {
        issues.push({
          kind: 'warning',
          nodeId: node.id,
          message: `"${describeNode(node)}" has no outgoing connection.`,
        });
      }
    }

    if (node.data.kind === 'task') {
      if (!node.data.title.trim()) {
        issues.push({
          kind: 'error',
          nodeId: node.id,
          message: 'Task node is missing a title.',
        });
      }
    }
    if (node.data.kind === 'approval') {
      if (!node.data.title.trim()) {
        issues.push({
          kind: 'error',
          nodeId: node.id,
          message: 'Approval node is missing a title.',
        });
      }
    }
    if (node.data.kind === 'automated') {
      if (!node.data.actionId) {
        issues.push({
          kind: 'error',
          nodeId: node.id,
          message: 'Automated step has no action selected.',
        });
      }
    }
  }

  if (hasCycle(nodes, edges)) {
    issues.push({ kind: 'error', message: 'Workflow contains a cycle.' });
  }

  if (startNodes[0] && endNodes[0]) {
    const reachable = bfs(startNodes[0].id, edges);
    if (!reachable.has(endNodes[0].id)) {
      issues.push({
        kind: 'warning',
        message: 'End node is not reachable from Start node.',
      });
    }
  }

  return {
    ok: issues.every((i) => i.kind !== 'error'),
    issues,
  };
}

function describeNode(node: WorkflowNode): string {
  const data = node.data;
  if ('title' in data && typeof data.title === 'string' && data.title) {
    return data.title;
  }
  return `${data.kind} node`;
}

function bfs(startId: string, edges: WorkflowEdge[]): Set<string> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }
  const visited = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of adj.get(id) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) adj.get(e.source)?.push(e.target);

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const n of nodes) color.set(n.id, WHITE);

  const dfs = (id: string): boolean => {
    color.set(id, GRAY);
    for (const next of adj.get(id) ?? []) {
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  };

  for (const n of nodes) {
    if (color.get(n.id) === WHITE && dfs(n.id)) return true;
  }
  return false;
}
