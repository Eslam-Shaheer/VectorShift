// submit.js — the pipeline submit entry point named by the assessment brief.
// Sends the current nodes and edges to the backend's /pipelines/parse endpoint
// via the generic API service and returns { num_nodes, num_edges, is_dag }.
// SubmitButton drives this through a React Query mutation.

import { api } from '@/lib/api';

export const PARSE_ENDPOINT = `${api.baseUrl}/pipelines/parse`;

export function submitPipeline(nodes, edges) {
  return api.post('/pipelines/parse', { nodes, edges });
}
