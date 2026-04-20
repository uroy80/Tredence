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
  SparkleIcon,
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
      className="anim-fade-in fixed inset-0 z-40 flex items-stretch justify-end bg-[color-mix(in_srgb,var(--color-ink)_30%,transparent)] backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="anim-slide-in-right flex h-full w-full max-w-[580px] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]"
        role="dialog"
        aria-label="Workflow sandbox"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
              <SparkleIcon width={11} height={11} />
              Sandbox
            </div>
            <div className="mt-0.5 text-[17px] font-semibold text-[var(--color-ink)]">
              Simulate Workflow
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono">
                {nodes.length} nodes
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono">
                {edges.length} edges
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              ref={runBtnRef}
              variant="primary"
              size="sm"
              disabled={running}
              onClick={run}
              icon={running ? <Spinner /> : <RunIcon />}
            >
              {running ? 'Simulating…' : 'Run simulation'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onClose}
              aria-label="Close sandbox"
              icon={<XIcon />}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
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

function Spinner() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <RunIcon width={26} height={26} />
      </div>
      <div>
        <div className="text-[14px] font-semibold text-[var(--color-ink)]">
          Ready to simulate
        </div>
        <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-[var(--color-muted)]">
          The sandbox will validate your workflow structure and walk through
          each reachable node using the mock{' '}
          <code className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 py-0.5 font-mono text-[11px] text-[var(--color-ink-soft)]">
            /simulate
          </code>{' '}
          endpoint.
        </p>
      </div>
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
      <div className="anim-slide-up mb-5 flex items-center gap-2.5 rounded-xl border border-[var(--color-success)]/25 bg-[var(--color-success-soft)] px-3.5 py-2.5 text-sm text-[var(--color-success-ink)]">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-success)] text-white">
          <CheckIcon width={12} height={12} />
        </div>
        <span className="font-medium">
          Structure valid — no issues detected.
        </span>
      </div>
    );
  }

  return (
    <div className="anim-slide-up mb-5 flex flex-col gap-2.5">
      {errors.length > 0 && (
        <div className="rounded-xl border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-[var(--color-danger-ink)]">
            <AlertIcon width={13} height={13} />
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-[12px] text-[var(--color-danger-ink)]">
            {errors.map((e, i) => (
              <li key={i} className="list-disc leading-relaxed">
                {e.message}
                {e.nodeId && (
                  <button
                    className="ml-2 text-[11px] underline underline-offset-2 hover:no-underline"
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
        <div className="rounded-xl border border-[var(--color-warn)]/25 bg-[var(--color-warn-soft)] px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-[var(--color-warn-ink)]">
            <AlertIcon width={13} height={13} />
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-[12px] text-[var(--color-warn-ink)]">
            {warnings.map((w, i) => (
              <li key={i} className="list-disc leading-relaxed">
                {w.message}
                {w.nodeId && (
                  <button
                    className="ml-2 text-[11px] underline underline-offset-2 hover:no-underline"
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
    {
      dot: string;
      ring: string;
      label: string;
      pill: string;
      pillBorder: string;
    }
  > = {
    ok: {
      dot: 'bg-[var(--color-success)]',
      ring: 'ring-[var(--color-success)]/15',
      label: 'OK',
      pill: 'text-[var(--color-success-ink)] bg-[var(--color-success-soft)]',
      pillBorder: 'border-[var(--color-success)]/20',
    },
    skipped: {
      dot: 'bg-[var(--color-faint)]',
      ring: 'ring-[var(--color-faint)]/20',
      label: 'SKIP',
      pill: 'text-[var(--color-muted)] bg-[var(--color-surface-2)]',
      pillBorder: 'border-[var(--color-border-strong)]',
    },
    error: {
      dot: 'bg-[var(--color-danger)]',
      ring: 'ring-[var(--color-danger)]/15',
      label: 'ERR',
      pill: 'text-[var(--color-danger-ink)] bg-[var(--color-danger-soft)]',
      pillBorder: 'border-[var(--color-danger)]/20',
    },
    info: {
      dot: 'bg-[var(--color-info)]',
      ring: 'ring-[var(--color-info)]/15',
      label: 'INFO',
      pill: 'text-[var(--color-info-ink)] bg-[var(--color-info-soft)]',
      pillBorder: 'border-[var(--color-info)]/20',
    },
  };

  return (
    <div className="anim-slide-up">
      <div
        className={clsx(
          'mb-5 flex items-start gap-3 rounded-xl border px-4 py-3',
          result.ok
            ? 'border-[var(--color-success)]/25 bg-[var(--color-success-soft)]'
            : 'border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)]',
        )}
      >
        <div
          className={clsx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white',
            result.ok
              ? 'bg-[var(--color-success)]'
              : 'bg-[var(--color-danger)]',
          )}
        >
          {result.ok ? <CheckIcon width={13} height={13} /> : <AlertIcon width={13} height={13} />}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={clsx(
              'text-[13px] font-semibold',
              result.ok
                ? 'text-[var(--color-success-ink)]'
                : 'text-[var(--color-danger-ink)]',
            )}
          >
            {result.ok ? 'Simulation complete' : 'Simulation failed'}
          </div>
          <div
            className={clsx(
              'mt-0.5 text-[12px] leading-relaxed',
              result.ok
                ? 'text-[var(--color-success-ink)]/80'
                : 'text-[var(--color-danger-ink)]/80',
            )}
          >
            {result.summary}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--color-border-strong)] via-[var(--color-border)] to-transparent" />
        <div className="flex flex-col gap-2.5">
          {result.steps.map((step, idx) => {
            const style = statusStyles[step.status];
            const node = nodeMap.get(step.nodeId);
            return (
              <div
                key={step.id}
                className="relative flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative flex flex-col items-center">
                  <div className="font-mono text-[10px] text-[var(--color-faint)]">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div
                    className={clsx(
                      'mt-1.5 h-3.5 w-3.5 rounded-full ring-4',
                      style.dot,
                      style.ring,
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]',
                        style.pill,
                        style.pillBorder,
                      )}
                    >
                      {style.label}
                    </span>
                    <span className="text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                      {step.kind}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-[var(--color-faint)]">
                      +{step.elapsedMs}ms
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] font-semibold leading-tight text-[var(--color-ink)]">
                    {step.title}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--color-muted)]">
                    {step.message}
                  </div>
                  {node && (
                    <button
                      className="mt-1.5 text-[11px] font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                      onClick={() => onSelectNode(node.id)}
                    >
                      locate node →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <details className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[11.5px]">
        <summary className="cursor-pointer font-semibold text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]">
          Run metadata
        </summary>
        <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-[var(--color-ink-soft)]">
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
