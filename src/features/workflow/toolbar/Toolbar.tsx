import { useRef, useState } from 'react';
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
  LogoIcon,
  MoonIcon,
  RedoIcon,
  RunIcon,
  SunIcon,
  TrashIcon,
  UndoIcon,
  UploadIcon,
} from '@/components/icons';
import { hotkeyLabel } from '@/hooks/useHotkeys';
import { useTheme } from '@/hooks/useTheme';

interface ToolbarProps {
  onOpenSandbox: () => void;
}

export function Toolbar({ onOpenSandbox }: ToolbarProps) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const resetGraph = useWorkflowStore((s) => s.resetGraph);
  const loadGraph = useWorkflowStore((s) => s.loadGraph);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [editingName, setEditingName] = useState(false);

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
      const data = JSON.stringify({ name: workflowName, nodes, edges }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
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
        'All nodes, connections, and configuration will be cleared. You can undo this with ⌘Z.',
      confirmLabel: 'Reset canvas',
      destructive: true,
    });
    if (confirmed) {
      resetGraph();
      toast.info('Canvas reset');
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-5 py-2.5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <LogoIcon width={32} height={32} className="shrink-0" />
        <div className="flex min-w-0 flex-col leading-tight">
          {editingName ? (
            <input
              autoFocus
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => {
                if (!workflowName.trim()) setWorkflowName('Untitled Workflow');
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-[240px] rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-0.5 text-[13px] font-semibold text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="group flex items-center gap-1.5 rounded-md px-1 -mx-1 py-0.5 text-left text-[13px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
              title="Click to rename"
            >
              <span className="truncate max-w-[240px]">{workflowName}</span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[var(--color-faint)] opacity-0 transition-opacity group-hover:opacity-100"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--color-muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            <span>Auto-saved</span>
            <span className="text-[var(--color-faint)]">·</span>
            <span>
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} ·{' '}
              {edges.length} edge{edges.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 shadow-[var(--shadow-sm)]">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            disabled={!canUndo}
            onClick={() => undo()}
            icon={<UndoIcon />}
            title={`Undo (${hotkeyLabel('mod+z')})`}
            aria-label="Undo"
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            disabled={!canRedo}
            onClick={() => redo()}
            icon={<RedoIcon />}
            title={`Redo (${hotkeyLabel('mod+shift+z')})`}
            aria-label="Redo"
          />
        </div>

        <div className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />

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

        <div className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />

        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={toggleTheme}
          icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        />

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
