import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { Toaster } from '@/components/ui/toaster';

function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-vs-border bg-vs-surface px-5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tracking-tight text-vs-ink">VectorShift</span>
        <span className="vs-em text-lg text-vs-accent">Builder</span>
      </div>
      <SubmitButton />
    </header>
  );
}

function App() {
  return (
    <div className="flex h-screen flex-col bg-vs-surface">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <PipelineToolbar />
        <main className="min-w-0 flex-1">
          <PipelineUI />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
