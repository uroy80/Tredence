import { useCallback, useState } from 'react';
import { useStore } from 'zustand';
import { Sidebar } from '@/features/workflow/sidebar/Sidebar';
import { Canvas } from '@/features/workflow/canvas/Canvas';
import { NodeFormPanel } from '@/features/workflow/forms/NodeFormPanel';
import { SandboxPanel } from '@/features/workflow/sandbox/SandboxPanel';
import { Toolbar } from '@/features/workflow/toolbar/Toolbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toasts } from '@/components/Toasts';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useTemporalStore, useWorkflowStore } from '@/store/workflowStore';
import { toast } from '@/store/toastStore';

export function App() {
  const [sandboxOpen, setSandboxOpen] = useState(false);

  const { undo, redo } = useStore(useTemporalStore, (s) => ({
    undo: s.undo,
    redo: s.redo,
  }));
  const exportGraph = useWorkflowStore((s) => s.exportGraph);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const onExportShortcut = useCallback(() => {
    try {
      const { nodes, edges } = exportGraph();
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
      toast.error('Export failed', (e as Error).message);
    }
  }, [exportGraph]);

  useHotkeys([
    {
      keys: 'mod+z',
      description: 'Undo',
      handler: (e) => {
        e.preventDefault();
        undo();
      },
    },
    {
      keys: ['mod+shift+z', 'mod+y'],
      description: 'Redo',
      handler: (e) => {
        e.preventDefault();
        redo();
      },
    },
    {
      keys: 'mod+s',
      description: 'Export workflow',
      allowInInputs: true,
      handler: (e) => {
        e.preventDefault();
        onExportShortcut();
      },
    },
    {
      keys: 'mod+enter',
      description: 'Open simulator',
      handler: (e) => {
        e.preventDefault();
        setSandboxOpen(true);
      },
    },
    {
      keys: 'escape',
      description: 'Close sandbox / deselect',
      handler: () => {
        if (sandboxOpen) {
          setSandboxOpen(false);
        } else {
          setSelectedNode(null);
        }
      },
    },
  ]);

  return (
    <ErrorBoundary scope="app-root">
      <div className="flex h-screen min-h-0 flex-col">
        <Toolbar onOpenSandbox={() => setSandboxOpen(true)} />
        <div className="flex min-h-0 flex-1">
          <ErrorBoundary scope="sidebar">
            <Sidebar />
          </ErrorBoundary>
          <main className="relative min-w-0 flex-1">
            <ErrorBoundary scope="canvas">
              <Canvas />
            </ErrorBoundary>
          </main>
          <ErrorBoundary scope="inspector">
            <NodeFormPanel />
          </ErrorBoundary>
        </div>
        <ErrorBoundary scope="sandbox">
          <SandboxPanel
            open={sandboxOpen}
            onClose={() => setSandboxOpen(false)}
          />
        </ErrorBoundary>
        <Toasts />
        <ConfirmDialog />
      </div>
    </ErrorBoundary>
  );
}
