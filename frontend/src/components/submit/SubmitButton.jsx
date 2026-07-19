// SubmitButton — POSTs the pipeline to the backend and surfaces the result as a
// styled toast (num_nodes, num_edges, is_dag).

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ResultToast } from './ResultToast';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const SubmitButton = () => {
  const [loading, setLoading] = useState(false);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      toast({ content: <ResultToast {...data} /> });
    } catch (err) {
      toast({
        content: (
          <div className="flex flex-col gap-0.5">
            <span className="vs-eyebrow text-vs-danger">Submit failed</span>
            <p className="text-[13px] text-vs-body">
              {err.message}. Is the backend running on {API_URL}?
            </p>
          </div>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const empty = nodes.length === 0;

  return (
    <Button
      onClick={handleSubmit}
      disabled={loading || empty}
      title={empty ? 'Add nodes to the canvas first' : undefined}
      className="gap-1.5"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Parsing…
        </>
      ) : (
        <>
          Submit
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
};
