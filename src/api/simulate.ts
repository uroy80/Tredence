import { nanoid } from 'nanoid';
import type {
  SimulationRequest,
  SimulationResult,
  SimulationStep,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from '@/types';
import { validateWorkflow } from '@/utils/validation';
import { findAutomation } from './automations';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function simulateWorkflow(
  request: SimulationRequest,
): Promise<SimulationResult> {
  const { graph } = request;
  const startedAt = new Date().toISOString();
  await delay(250);

  const validation = validateWorkflow(graph);

  const steps: SimulationStep[] = [];
  let elapsed = 0;

  for (const issue of validation.issues.filter((i) => i.kind === 'error')) {
    elapsed += 15;
    steps.push({
      id: `step-${nanoid(6)}`,
      nodeId: issue.nodeId ?? '',
      kind: 'start',
      title: 'Validation error',
      status: 'error',
      message: issue.message,
      elapsedMs: elapsed,
    });
  }

  if (!validation.ok) {
    const finishedAt = new Date().toISOString();
    return {
      ok: false,
      steps,
      startedAt,
      finishedAt,
      summary: 'Workflow failed validation. See errors above.',
    };
  }

  const start = graph.nodes.find((n) => n.data.kind === 'start');
  if (!start) {
    const finishedAt = new Date().toISOString();
    return {
      ok: false,
      steps: [
        {
          id: `step-${nanoid(6)}`,
          nodeId: '',
          kind: 'start',
          title: 'Missing Start node',
          status: 'error',
          message: 'No Start node found in workflow.',
          elapsedMs: 0,
        },
      ],
      startedAt,
      finishedAt,
      summary: 'Workflow cannot be simulated without a Start node.',
    };
  }

  const adj = buildAdjacency(graph.edges);
  const visited = new Set<string>();
  const order: string[] = [];

  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    order.push(id);
    for (const next of adj.get(id) ?? []) walk(next);
  };
  walk(start.id);

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const id of order) {
    const node = nodeMap.get(id);
    if (!node) continue;
    const tookMs = 40 + Math.floor(Math.random() * 80);
    elapsed += tookMs;
    await delay(tookMs / 4);
    steps.push(simulateNode(node, elapsed));
  }

  const unreached = graph.nodes.filter((n) => !visited.has(n.id));
  for (const node of unreached) {
    elapsed += 10;
    steps.push({
      id: `step-${nanoid(6)}`,
      nodeId: node.id,
      kind: node.data.kind,
      title: describeNode(node.data),
      status: 'skipped',
      message: 'Node not reachable from Start — skipped.',
      elapsedMs: elapsed,
    });
  }

  const finishedAt = new Date().toISOString();
  return {
    ok: true,
    steps,
    startedAt,
    finishedAt,
    summary: `Executed ${order.length} of ${graph.nodes.length} nodes (${unreached.length} skipped) in ${elapsed} ms.`,
  };
}

function simulateNode(node: WorkflowNode, elapsed: number): SimulationStep {
  const data = node.data;
  const base = {
    id: `step-${nanoid(6)}`,
    nodeId: node.id,
    kind: data.kind,
    title: describeNode(data),
    elapsedMs: elapsed,
  } as const;

  switch (data.kind) {
    case 'start':
      return {
        ...base,
        status: 'info',
        message: `Workflow started: "${data.title}".`,
      };
    case 'task':
      return {
        ...base,
        status: 'ok',
        message: `Task assigned to ${data.assignee || 'unassigned'}${
          data.dueDate ? ` (due ${data.dueDate})` : ''
        }.`,
      };
    case 'approval':
      return {
        ...base,
        status: data.autoApproveThreshold > 0 ? 'ok' : 'info',
        message:
          data.autoApproveThreshold > 0
            ? `Auto-approved below threshold ${data.autoApproveThreshold} (role: ${data.approverRole}).`
            : `Awaiting approval from ${data.approverRole}.`,
      };
    case 'automated': {
      const action = findAutomation(data.actionId);
      if (!action) {
        return {
          ...base,
          status: 'error',
          message: 'No action configured for this automated step.',
        };
      }
      const missing = action.params.filter(
        (p) => !data.actionParams[p] || !data.actionParams[p].trim(),
      );
      if (missing.length) {
        return {
          ...base,
          status: 'error',
          message: `Action "${action.label}" missing params: ${missing.join(', ')}.`,
        };
      }
      return {
        ...base,
        status: 'ok',
        message: `Executed "${action.label}" with ${action.params
          .map((p) => `${p}=${data.actionParams[p]}`)
          .join(', ')}.`,
      };
    }
    case 'end':
      return {
        ...base,
        status: 'ok',
        message: data.summary
          ? `Workflow finished: ${data.message} (summary emitted).`
          : `Workflow finished: ${data.message}.`,
      };
  }
}

function describeNode(data: WorkflowNodeData): string {
  if (data.kind === 'end') return data.message || 'End';
  if ('title' in data && typeof data.title === 'string' && data.title) {
    return data.title;
  }
  return data.kind;
}

function buildAdjacency(edges: WorkflowEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }
  return adj;
}
