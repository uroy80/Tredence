import { useRef } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { Button } from '@/components/ui/Button';
import {
  DownloadIcon,
  RunIcon,
  TrashIcon,
  UploadIcon,
} from '@/components/icons';
import type { WorkflowEdge, WorkflowNode } from '@/types';

interface ToolbarProps {
  onOpenSandbox: () => void;
}

export function Toolbar({ onOpenSandbox }: ToolbarProps) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const resetGraph = useWorkflowStore((s) => s.resetGraph);
  const loadGraph = useWorkflowStore((s) => s.loadGraph);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onExport = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => fileRef.current?.click();

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        nodes?: WorkflowNode[];
        edges?: WorkflowEdge[];
      };
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        alert('Invalid workflow file: missing nodes/edges arrays.');
        return;
      }
      loadGraph({ nodes: parsed.nodes, edges: parsed.edges });
    } catch (e) {
      alert(`Failed to parse workflow JSON: ${(e as Error).message}`);
    }
  };

  const onReset = () => {
    if (confirm('Reset the canvas? All unsaved changes will be lost.')) {
      resetGraph();
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">
            HR Workflow Designer
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">
            Design, configure, and simulate HR workflows
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
        <Button size="sm" onClick={onImportClick} icon={<UploadIcon />}>
          Import
        </Button>
        <Button size="sm" onClick={onExport} icon={<DownloadIcon />}>
          Export
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={onReset}
          icon={<TrashIcon />}
        >
          Reset
        </Button>
        <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenSandbox}
          icon={<RunIcon />}
        >
          Simulate
        </Button>
      </div>
    </header>
  );
}
