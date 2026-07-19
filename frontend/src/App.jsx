import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { Toaster } from '@/components/ui/toaster';
import { useStore } from './store';
import { isDagClient } from './lib/graph';

// Live graph status: node/edge counts + DAG validity, so feedback isn't
// submit-only. Numbers use the mono tabular .vs-index treatment.
function GraphStatus() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  if (nodes.length === 0) return null;
  const dag = isDagClient(nodes, edges);
  return (
    <div className="hidden items-center gap-3 text-[12px] text-vs-muted sm:flex">
      <span>
        <span className="vs-index">{nodes.length}</span> nodes
      </span>
      <span className="text-vs-faint">·</span>
      <span>
        <span className="vs-index">{edges.length}</span> edges
      </span>
      <span className="text-vs-faint">·</span>
      <span className={dag ? 'text-vs-accent-hover' : 'text-vs-danger'}>
        {dag ? 'valid DAG' : 'has cycle'}
      </span>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-vs-border bg-vs-surface px-5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tracking-tight text-vs-ink">VectorShift</span>
        <span className="vs-em text-lg text-vs-accent">Builder</span>
      </div>
      <div className="flex items-center gap-5">
        <GraphStatus />
        <SubmitButton />
      </div>
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
