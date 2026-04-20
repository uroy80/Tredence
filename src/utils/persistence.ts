import { z } from 'zod';
import type { WorkflowGraph } from '@/types';
import { logger } from './logger';

const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'hr-workflow-designer:workflow';
const MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const KeyValuePairSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
});

const NodeDataSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('start'),
    title: z.string(),
    metadata: z.array(KeyValuePairSchema),
  }),
  z.object({
    kind: z.literal('task'),
    title: z.string(),
    description: z.string(),
    assignee: z.string(),
    dueDate: z.string(),
    customFields: z.array(KeyValuePairSchema),
  }),
  z.object({
    kind: z.literal('approval'),
    title: z.string(),
    approverRole: z.enum(['Manager', 'HRBP', 'Director', 'CEO']),
    autoApproveThreshold: z.number().min(0),
  }),
  z.object({
    kind: z.literal('automated'),
    title: z.string(),
    actionId: z.string().nullable(),
    actionParams: z.record(z.string(), z.string()),
  }),
  z.object({
    kind: z.literal('end'),
    message: z.string(),
    summary: z.boolean(),
  }),
]);

const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'task', 'approval', 'automated', 'end']),
  position: z.object({ x: z.number(), y: z.number() }),
  data: NodeDataSchema,
});

const EdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
  })
  .and(z.record(z.string(), z.unknown()));

const GraphSchema = z.object({
  nodes: z.array(NodeSchema).max(500),
  edges: z.array(EdgeSchema).max(2000),
});

const PersistedSchema = z.object({
  version: z.number(),
  graph: GraphSchema,
  savedAt: z.string(),
});

export type ImportOutcome =
  | { ok: true; graph: WorkflowGraph }
  | { ok: false; reason: string };

export function parseImportedWorkflow(raw: string): ImportOutcome {
  if (raw.length > MAX_IMPORT_SIZE_BYTES) {
    return {
      ok: false,
      reason: `File is larger than the ${MAX_IMPORT_SIZE_BYTES / 1024 / 1024} MB limit.`,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: `Invalid JSON: ${(e as Error).message}` };
  }

  const direct = GraphSchema.safeParse(json);
  if (direct.success) {
    return { ok: true, graph: direct.data as unknown as WorkflowGraph };
  }

  const wrapped = PersistedSchema.safeParse(json);
  if (wrapped.success) {
    return { ok: true, graph: wrapped.data.graph as unknown as WorkflowGraph };
  }

  return {
    ok: false,
    reason: formatZodError(direct.error),
  };
}

function formatZodError(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return 'Schema mismatch.';
  const path = first.path.length ? first.path.join('.') : '(root)';
  return `${path}: ${first.message}`;
}

export function saveToLocalStorage(graph: WorkflowGraph): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      version: SCHEMA_VERSION,
      graph,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    logger.warn('Failed to persist workflow to localStorage', {
      error: (e as Error).message,
    });
  }
}

export function loadFromLocalStorage(): WorkflowGraph | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw);
    const parsed = PersistedSchema.safeParse(json);
    if (!parsed.success) {
      logger.warn('Stored workflow failed schema check, discarding', {
        error: formatZodError(parsed.error),
      });
      return null;
    }
    if (parsed.data.version !== SCHEMA_VERSION) {
      logger.warn('Stored workflow has an incompatible schema version', {
        found: parsed.data.version,
        expected: SCHEMA_VERSION,
      });
      return null;
    }
    return parsed.data.graph as unknown as WorkflowGraph;
  } catch (e) {
    logger.warn('Failed to load workflow from localStorage', {
      error: (e as Error).message,
    });
    return null;
  }
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const PERSISTENCE_CONSTANTS = {
  SCHEMA_VERSION,
  STORAGE_KEY,
  MAX_IMPORT_SIZE_BYTES,
};
