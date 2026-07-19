import {
  LogIn,
  LogOut,
  Bot,
  Type,
  Filter as FilterIcon,
  Shuffle,
  GitBranch,
  Globe,
  StickyNote,
} from 'lucide-react';
import { parseVariables } from '@/lib/parseVariables';

// ============================================================================
// Node registry — every node is data. A node is a BaseNode driven by one config
// object below; adding a node means appending a config, nothing else.
//
// config = {
//   type,            ReactFlow node type (must match getNodeID/palette)
//   label,           node heading
//   category,        palette group + node eyebrow
//   width?,          fixed px width (default 240)
//   handles?,        [{ id, kind: 'source'|'target', position, label? }]
//   fields?,         [{ key, label?, kind, ... }]  see NodeField
//   computeHandles?, (data) => handles   dynamic handles (Text variables)
//   computeWidth?,   (data) => number    dynamic width (Text auto-grow)
// }
// ============================================================================

// Rough character width for the Geist Mono/sans mix, used to auto-size the Text
// node so long lines stay readable without a scrollbar.
const CHAR_PX = 7.3;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export const nodeRegistry = {
  // ---- INPUTS ----------------------------------------------------------------
  customInput: {
    type: 'customInput',
    label: 'Input',
    category: 'INPUTS',
    icon: LogIn,
    handles: [{ id: 'value', kind: 'source', position: 'right' }],
    fields: [
      {
        key: 'inputName',
        label: 'Name',
        kind: 'text',
        default: (id) => id.replace('customInput-', 'input_'),
      },
      {
        key: 'inputType',
        label: 'Type',
        kind: 'select',
        options: ['Text', 'File'],
        default: 'Text',
      },
    ],
  },

  // ---- OUTPUTS ---------------------------------------------------------------
  customOutput: {
    type: 'customOutput',
    label: 'Output',
    category: 'OUTPUTS',
    icon: LogOut,
    handles: [{ id: 'value', kind: 'target', position: 'left' }],
    fields: [
      {
        key: 'outputName',
        label: 'Name',
        kind: 'text',
        default: (id) => id.replace('customOutput-', 'output_'),
      },
      {
        key: 'outputType',
        label: 'Type',
        kind: 'select',
        options: ['Text', 'Image'],
        default: 'Text',
      },
    ],
  },

  // ---- MODELS ----------------------------------------------------------------
  llm: {
    type: 'llm',
    label: 'LLM',
    category: 'MODELS',
    icon: Bot,
    handles: [
      { id: 'system', kind: 'target', position: 'left', label: 'system' },
      { id: 'prompt', kind: 'target', position: 'left', label: 'prompt' },
      { id: 'response', kind: 'source', position: 'right', label: 'response' },
    ],
    fields: [
      { key: 'info', kind: 'display', text: 'Routes a system + prompt to a language model.' },
      {
        key: 'model',
        label: 'Model',
        kind: 'select',
        default: 'claude-opus-4-8',
        options: [
          { value: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
          { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
          { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
        ],
      },
    ],
  },

  // ---- TEXT (dynamic variable handles) ---------------------------------------
  text: {
    type: 'text',
    label: 'Text',
    category: 'TEXT',
    icon: Type,
    handles: [{ id: 'output', kind: 'source', position: 'right' }],
    fields: [
      {
        key: 'text',
        label: 'Text',
        kind: 'textarea',
        autoGrow: true,
        default: 'Hello {{ name }}',
        placeholder: 'Type text. Use {{ variable }} to add inputs.',
      },
    ],
    // Each {{ variable }} becomes a left-side target handle.
    computeHandles: (data) =>
      parseVariables(data?.text ?? 'Hello {{ name }}').map((name) => ({
        id: `var-${name}`,
        kind: 'target',
        position: 'left',
        label: name,
      })),
    // Width follows the longest line so text stays readable as it grows.
    computeWidth: (data) => {
      const text = data?.text ?? 'Hello {{ name }}';
      const longest = text.split('\n').reduce((m, l) => Math.max(m, l.length), 0);
      return clamp(Math.round(longest * CHAR_PX) + 48, 240, 460);
    },
  },

  // ---- LOGIC -----------------------------------------------------------------
  filter: {
    type: 'filter',
    label: 'Filter',
    category: 'LOGIC',
    icon: FilterIcon,
    handles: [
      { id: 'in', kind: 'target', position: 'left' },
      { id: 'out', kind: 'source', position: 'right' },
    ],
    fields: [
      {
        key: 'condition',
        label: 'Keep where',
        kind: 'text',
        placeholder: 'item.value > 0',
      },
    ],
  },

  transform: {
    type: 'transform',
    label: 'Transform',
    category: 'LOGIC',
    icon: Shuffle,
    handles: [
      { id: 'a', kind: 'target', position: 'left', label: 'a' },
      { id: 'b', kind: 'target', position: 'left', label: 'b' },
      { id: 'out', kind: 'source', position: 'right' },
    ],
    fields: [
      {
        key: 'operation',
        label: 'Operation',
        kind: 'select',
        default: 'concat',
        options: [
          { value: 'concat', label: 'Concatenate' },
          { value: 'merge', label: 'Merge' },
          { value: 'zip', label: 'Zip' },
          { value: 'sum', label: 'Sum' },
        ],
      },
    ],
  },

  conditional: {
    type: 'conditional',
    label: 'Conditional',
    category: 'LOGIC',
    icon: GitBranch,
    handles: [
      { id: 'in', kind: 'target', position: 'left' },
      { id: 'true', kind: 'source', position: 'right', label: 'true' },
      { id: 'false', kind: 'source', position: 'right', label: 'false' },
    ],
    fields: [
      { key: 'condition', label: 'If', kind: 'text', placeholder: 'value === true' },
    ],
  },

  // ---- INTEGRATIONS ----------------------------------------------------------
  apiRequest: {
    type: 'apiRequest',
    label: 'API Request',
    category: 'INTEGRATIONS',
    icon: Globe,
    width: 260,
    handles: [
      { id: 'in', kind: 'target', position: 'left' },
      { id: 'out', kind: 'source', position: 'right' },
    ],
    fields: [
      { key: 'url', label: 'URL', kind: 'text', required: true, placeholder: 'https://api.example.com' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    ],
  },

  // ---- NOTES (no handles — proves handle-less config works) -------------------
  note: {
    type: 'note',
    label: 'Note',
    category: 'NOTES',
    icon: StickyNote,
    width: 220,
    handles: [],
    fields: [
      {
        key: 'note',
        kind: 'textarea',
        autoGrow: true,
        placeholder: 'Write a note…',
      },
    ],
  },
};

// Palette grouping order.
export const paletteGroups = [
  { category: 'INPUTS', types: ['customInput'] },
  { category: 'OUTPUTS', types: ['customOutput'] },
  { category: 'MODELS', types: ['llm'] },
  { category: 'TEXT', types: ['text'] },
  { category: 'LOGIC', types: ['filter', 'transform', 'conditional'] },
  { category: 'INTEGRATIONS', types: ['apiRequest'] },
  { category: 'NOTES', types: ['note'] },
];
