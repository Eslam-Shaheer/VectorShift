import { NodePalette } from '@/components/palette/NodePalette';
import { Canvas } from '@/components/canvas/Canvas';
import { TopBar } from '@/components/topbar/TopBar';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <div className="flex h-screen flex-col bg-vs-surface">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <NodePalette />
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
