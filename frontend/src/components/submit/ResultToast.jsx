import { Badge } from '@/components/ui/badge';

// The styled body shown in the toast after the backend parses a pipeline.
export function ResultToast({ num_nodes, num_edges, is_dag }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="vs-eyebrow">Pipeline parsed</span>
        <p className="text-lg text-vs-ink">
          Your pipeline {is_dag ? 'is a valid ' : 'is '}
          <span className="vs-em">{is_dag ? 'DAG' : 'graph with a cycle'}</span>.
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex flex-col">
          <span className="vs-index text-lg">{num_nodes}</span>
          <span className="vs-eyebrow">Nodes</span>
        </div>
        <div className="flex flex-col">
          <span className="vs-index text-lg">{num_edges}</span>
          <span className="vs-eyebrow">Edges</span>
        </div>
        <div className="ml-auto self-end">
          {is_dag ? (
            <Badge variant="accent">Valid DAG</Badge>
          ) : (
            <Badge variant="muted">Contains a cycle</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
