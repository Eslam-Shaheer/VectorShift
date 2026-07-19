import { useStore } from '@/store';
import { isDagClient } from '@/lib/graph';

// Live graph status: node/edge counts + DAG validity, so feedback isn't
// submit-only. Numbers use the mono tabular .vs-index treatment.
export function GraphStatus() {
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
