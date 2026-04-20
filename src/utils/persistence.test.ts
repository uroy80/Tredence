import { describe, expect, it } from 'vitest';
import {
  clearLocalStorage,
  loadFromLocalStorage,
  parseImportedWorkflow,
  saveToLocalStorage,
} from './persistence';

const validGraph = {
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { kind: 'start', title: 'Start', metadata: [] },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 200, y: 0 },
      data: { kind: 'end', message: 'Done', summary: true },
    },
  ],
  edges: [{ id: 'e1', source: 'start-1', target: 'end-1' }],
};

describe('parseImportedWorkflow', () => {
  it('rejects non-JSON input', () => {
    const result = parseImportedWorkflow('<html>');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/JSON/i);
  });

  it('accepts a well-formed raw graph', () => {
    const result = parseImportedWorkflow(JSON.stringify(validGraph));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.graph.nodes).toHaveLength(2);
      expect(result.graph.edges).toHaveLength(1);
    }
  });

  it('accepts a persisted graph wrapper', () => {
    const persisted = {
      version: 1,
      savedAt: '2026-04-21T00:00:00.000Z',
      graph: validGraph,
    };
    const result = parseImportedWorkflow(JSON.stringify(persisted));
    expect(result.ok).toBe(true);
  });

  it('rejects a graph with an unknown node kind', () => {
    const bad = JSON.parse(JSON.stringify(validGraph));
    bad.nodes[0].data.kind = 'mystery';
    const result = parseImportedWorkflow(JSON.stringify(bad));
    expect(result.ok).toBe(false);
  });

  it('rejects a graph that exceeds the size limit', () => {
    const huge = 'x'.repeat(5 * 1024 * 1024);
    const result = parseImportedWorkflow(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/larger/);
  });
});

describe('localStorage roundtrip', () => {
  it('stores and retrieves the graph verbatim', () => {
    clearLocalStorage();
    saveToLocalStorage(validGraph as never);
    const got = loadFromLocalStorage();
    expect(got).not.toBeNull();
    expect(got?.nodes).toHaveLength(2);
    expect(got?.edges[0]?.source).toBe('start-1');
  });

  it('returns null when localStorage is empty', () => {
    clearLocalStorage();
    expect(loadFromLocalStorage()).toBeNull();
  });

  it('discards a mismatched schema silently', () => {
    window.localStorage.setItem(
      'hr-workflow-designer:workflow',
      JSON.stringify({ version: 99, graph: {}, savedAt: 'x' }),
    );
    expect(loadFromLocalStorage()).toBeNull();
  });
});
