import { BaseNode } from './BaseNode';
import { nodeRegistry } from './registry';

// Turns each registry config into a ReactFlow node component. Every node shares
// one renderer (BaseNode); only the config differs.
export const nodeTypes = Object.fromEntries(
  Object.entries(nodeRegistry).map(([type, config]) => [
    type,
    (props) => <BaseNode {...props} config={config} />,
  ])
);
