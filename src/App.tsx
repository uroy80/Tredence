import { useState } from 'react';
import { Sidebar } from '@/features/workflow/sidebar/Sidebar';
import { Canvas } from '@/features/workflow/canvas/Canvas';
import { NodeFormPanel } from '@/features/workflow/forms/NodeFormPanel';
import { SandboxPanel } from '@/features/workflow/sandbox/SandboxPanel';
import { Toolbar } from '@/features/workflow/toolbar/Toolbar';

export function App() {
  const [sandboxOpen, setSandboxOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <Toolbar onOpenSandbox={() => setSandboxOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-w-0 flex-1">
          <Canvas />
        </main>
        <NodeFormPanel />
      </div>
      <SandboxPanel open={sandboxOpen} onClose={() => setSandboxOpen(false)} />
    </div>
  );
}
