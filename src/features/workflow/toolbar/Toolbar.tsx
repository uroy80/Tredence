import { useRef } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useWorkflowStore, useTemporalStore } from '@/store/workflowStore';
import { confirmDialog } from '@/store/confirmStore';
import { toast } from '@/store/toastStore';
import { parseImportedWorkflow, PERSISTENCE_CONSTANTS } from '@/utils/persistence';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/Button';
import {
  DownloadIcon,
  RedoIcon,
  RunIcon,
  TrashIcon,
  UndoIcon,
  UploadIcon,
} from '@/components/icons';
import { hotkeyLabel } from '@/hooks/useHotkeys';

interface ToolbarProps {
  onOpenSandbox: () => void;
}

export function Toolbar({ onOpenSandbox }: ToolbarProps) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const resetGraph = useWorkflowStore((s) => s.resetGraph);
  const loadGraph = useWorkflowStore((s) => s.loadGraph);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { undo, redo, canUndo, canRedo } = useStore(
    useTemporalStore,
    useShallow((s) => ({
      undo: s.undo,
      redo: s.redo,
      canUndo: s.pastStates.length > 0,
      canRedo: s.futureStates.length > 0,
    })),
  );

  const onExport = () => {
    try {
      const data = JSON.stringify({ nodes, edges }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Workflow exported', `${nodes.length} nodes · ${edges.length} edges`);
    } catch (e) {
      logger.error('Export failed', { error: (e as Error).message });
      toast.error('Export failed', (e as Error).message);
    }
  };

  const onImportClick = () => fileRef.current?.click();

  const onImport = async (file: File) => {
    try {
      if (file.size > PERSISTENCE_CONSTANTS.MAX_IMPORT_SIZE_BYTES) {
        toast.error(
          'File too large',
          `Maximum size is ${PERSISTENCE_CONSTANTS.MAX_IMPORT_SIZE_BYTES / 1024 / 1024} MB.`,
        );
        return;
      }
      const text = await file.text();
      const result = parseImportedWorkflow(text);
      if (!result.ok) {
        toast.error('Import failed', result.reason);
        logger.warn('Import rejected', { reason: result.reason, file: file.name });
        return;
      }
      loadGraph(result.graph);
      toast.success(
        'Workflow imported',
        `${result.graph.nodes.length} nodes · ${result.graph.edges.length} edges`,
      );
    } catch (e) {
      const message = (e as Error).message;
      logger.error('Import threw', { error: message });
      toast.error('Import failed', message);
    }
  };

  const onReset = async () => {
    const confirmed = await confirmDialog({
      title: 'Reset the canvas?',
      description:
        'All nodes, connections, and configuration will be cleared. This can be undone with ⌘Z.',
      confirmLabel: 'Reset canvas',
      destructive: true,
    });
    if (confirmed) {
      resetGraph();
      toast.info('Canvas reset');
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
        <Button
          size="sm"
          variant="secondary"
          disabled={!canUndo}
          onClick={() => undo()}
          icon={<UndoIcon />}
          title={`Undo (${hotkeyLabel('mod+z')})`}
        >
          Undo
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canRedo}
          onClick={() => redo()}
          icon={<RedoIcon />}
          title={`Redo (${hotkeyLabel('mod+shift+z')})`}
        >
          Redo
        </Button>

        <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />

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
        <Button
          size="sm"
          onClick={onExport}
          icon={<DownloadIcon />}
          title={`Export (${hotkeyLabel('mod+s')})`}
        >
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
          title={`Simulate (${hotkeyLabel('mod+enter')})`}
        >
          Simulate
        </Button>
      </div>
    </header>
  );
}
