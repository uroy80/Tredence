import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useWorkflowStore } from '@/store/workflowStore';
import { simulateWorkflow } from '@/api';
import { validateWorkflow } from '@/utils/validation';
import { toast } from '@/store/toastStore';
import { logger } from '@/utils/logger';
import type {
  SimulationResult,
  ValidationResult,
  WorkflowEdge,
  WorkflowNode,
} from '@/types';
import { Button } from '@/components/ui/Button';
import {
  AlertIcon,
  CheckIcon,
  RunIcon,
  XIcon,
} from '@/components/icons';

interface SandboxPanelProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SandboxPanel({ open, onClose }: SandboxPanelProps) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const runBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    runBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prevActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const run = async () => {
    setRunning(true);
    const v = validateWorkflow({ nodes, edges });
    setValidation(v);
    try {
      const res = await simulateWorkflow({ graph: { nodes, edges } });
      setResult(res);
      if (res.ok) {
        toast.success('Simulation complete', res.summary);
      } else {
        toast.warning('Simulation blocked', res.summary);
      }
    } catch (e) {
      const message = (e as Error).message;
      logger.error('Simulation threw', { error: message });
      toast.error('Simulation failed', message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-end bg-slate-900/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex h-full w-full max-w-[560px] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
        role="dialog"
        aria-label="Workflow sandbox"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Sandbox
            </div>
            <div className="text-base font-semibold text-[var(--color-ink)]">
              Simulate Workflow
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
              {nodes.length} nodes · {edges.length} edges
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              ref={runBtnRef}
              variant="primary"
              size="sm"
              disabled={running}
              onClick={run}
              icon={<RunIcon />}
            >
              {running ? 'Simulating…' : 'Run simulation'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sandbox">
              <XIcon />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!validation && !result && <EmptyState />}

          {validation && (
            <ValidationReport
              validation={validation}
              onSelectNode={(id) => {
                setSelectedNode(id);
                onClose();
              }}
            />
          )}

          {result && (
            <ExecutionTimeline
              result={result}
              nodes={nodes}
              edges={edges}
              onSelectNode={(id) => {
                setSelectedNode(id);
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[var(--color-muted)]">
      <RunIcon width={28} height={28} />
      <div className="font-medium text-[var(--color-ink)]">
        Ready to simulate
      </div>
      <p className="max-w-sm text-xs">
        The sandbox will validate your workflow structure and walk through each
        reachable node using the mock <code>/simulate</code> API.
      </p>
    </div>
  );
}

function ValidationReport({
  validation,
  onSelectNode,
}: {
  validation: ValidationResult;
  onSelectNode: (id: string) => void;
}) {
  const errors = validation.issues.filter((i) => i.kind === 'error');
  const warnings = validation.issues.filter((i) => i.kind === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        <CheckIcon />
        Structure valid — no issues detected.
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-red-800">
            <AlertIcon />
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-xs text-red-700">
            {errors.map((e, i) => (
              <li key={i} className="list-disc">
                {e.message}
                {e.nodeId && (
                  <button
                    className="ml-2 text-[11px] text-red-800 underline"
                    onClick={() => onSelectNode(e.nodeId!)}
                  >
                    locate
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-800">
            <AlertIcon />
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-xs text-amber-700">
            {warnings.map((w, i) => (
              <li key={i} className="list-disc">
                {w.message}
                {w.nodeId && (
                  <button
                    className="ml-2 text-[11px] text-amber-800 underline"
                    onClick={() => onSelectNode(w.nodeId!)}
                  >
                    locate
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ExecutionTimeline({
  result,
  nodes,
  edges: _edges,
  onSelectNode,
}: {
  result: SimulationResult;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onSelectNode: (id: string) => void;
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const statusStyles: Record<
    'ok' | 'skipped' | 'error' | 'info',
    { dot: string; label: string; text: string }
  > = {
    ok: { dot: 'bg-emerald-500', label: 'OK', text: 'text-emerald-700' },
    skipped: { dot: 'bg-slate-400', label: 'SKIP', text: 'text-slate-600' },
    error: { dot: 'bg-red-500', label: 'ERR', text: 'text-red-700' },
    info: { dot: 'bg-blue-500', label: 'INFO', text: 'text-blue-700' },
  };

  return (
    <div>
      <div
        className={clsx(
          'mb-4 rounded-lg border px-3 py-2 text-sm',
          result.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800',
        )}
      >
        <div className="flex items-center gap-2 font-medium">
          {result.ok ? <CheckIcon /> : <AlertIcon />}
          {result.ok ? 'Simulation complete' : 'Simulation failed'}
        </div>
        <div className="mt-0.5 text-xs opacity-90">{result.summary}</div>
      </div>

      <div className="flex flex-col gap-2">
        {result.steps.map((step, idx) => {
          const style = statusStyles[step.status];
          const node = nodeMap.get(step.nodeId);
          return (
            <div
              key={step.id}
              className="flex gap-3 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5"
            >
              <div className="flex flex-col items-center">
                <div className="font-mono text-[10px] text-[var(--color-muted)]">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div
                  className={clsx(
                    'mt-1 h-3 w-3 rounded-full ring-2 ring-white',
                    style.dot,
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      style.text,
                      'bg-slate-50',
                    )}
                  >
                    {style.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    {step.kind}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-[var(--color-muted)]">
                    +{step.elapsedMs}ms
                  </span>
                </div>
                <div className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">
                  {step.title}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {step.message}
                </div>
                {node && (
                  <button
                    className="mt-1 text-[11px] text-[var(--color-primary)] underline"
                    onClick={() => onSelectNode(node.id)}
                  >
                    locate node
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-4 rounded-lg border border-[var(--color-border)] bg-slate-50 px-3 py-2 text-xs">
        <summary className="cursor-pointer font-medium text-[var(--color-muted)]">
          Run metadata
        </summary>
        <pre className="mt-2 overflow-x-auto text-[11px] leading-relaxed text-slate-700">
{JSON.stringify(
  {
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    steps: result.steps.length,
  },
  null,
  2,
)}
        </pre>
      </details>
    </div>
  );
}
