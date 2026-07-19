// SubmitButton — POSTs the pipeline to the backend and surfaces the result as a
// styled toast (num_nodes, num_edges, is_dag).

import { ArrowRight, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { submitPipeline, PARSE_ENDPOINT } from '@/submit';
import { ResultToast } from './ResultToast';

export const SubmitButton = () => {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  // Submit is a POST triggered on click, so it's a mutation (not a query).
  const { mutate, isPending: loading } = useMutation({
    mutationFn: () => submitPipeline(nodes, edges),
    onSuccess: (data) => toast({ content: <ResultToast {...data} /> }),
    onError: (err) =>
      toast({
        content: (
          <div className="flex flex-col gap-0.5">
            <span className="vs-eyebrow text-vs-danger">Submit failed</span>
            <p className="text-[13px] text-vs-body">
              {err.message}. Is the backend running at {PARSE_ENDPOINT}?
            </p>
          </div>
        ),
      }),
  });

  const handleSubmit = () => mutate();
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
