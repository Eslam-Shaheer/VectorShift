# VectorShift Frontend Technical Assessment — Engineering Report

A ReactFlow-based visual pipeline builder. Frontend: JavaScript/React + Vite +
Tailwind v4 + shadcn/ui primitives. Backend: Python/FastAPI.

This report documents what was built, the decisions behind it, how each of the
four assessment parts was implemented, the extra UX work, how everything was
verified, and what would change for production.

---

## 1. Build tooling — Create React App → Vite

**Decision:** migrate the provided CRA project to Vite as step zero.

**Why:**
- `shadcn/ui` officially dropped Create React App support — its CLI targets
  Vite/Next and assumes path aliases + `components.json`. Forcing it onto
  `react-scripts` means hand-vendoring every component plus CRACO hacks, which
  reads as poor engineering judgment in a take-home.
- CRA itself is deprecated (React docs no longer recommend it).
- Tailwind v4 (`@theme`), which the design system uses, is Vite-first.

**How it stayed low-risk:** the migration reused 100% of `src/` — the store,
nodes, and canvas logic were untouched by the bundler swap. The assessment's
run commands still hold: `npm i && npm start` (Vite maps `start` → `vite`),
plus `npm run build` / `npm run preview`.

Config added: `vite.config.js` (React plugin, Tailwind plugin, `@` → `src`
alias, `.js`-as-JSX loader so the provided `.js` files containing JSX still
compile), `jsconfig.json`, and a root `index.html` entry.

---

## 2. Architecture

### File structure (layer/type-based)

```
frontend/src/
  main.jsx                 # entry
  App.jsx                  # composition only
  index.css                # design tokens + primitives + ReactFlow overrides
  store/
    pipelineStore.js       # Zustand store (nodes, edges, history, clipboard…)
    index.js               # re-export → "@/store" resolves
  hooks/
    useAutoResize.js       # textarea auto-grow
  lib/
    utils.js               # cn() classname helper
    graph.js               # client DAG check, dagre layout, handle helpers
    parseVariables.js      # {{ variable }} parser
  nodes/                   # node domain
    BaseNode.jsx           # generic config-driven renderer
    NodeField.jsx          # field kind → control
    NodeHandle.jsx         # handle + labels + "+" affordance
    AddNodePicker.jsx      # node-type picker popover
    registry.js            # ALL node configs (data) + palette groups
    nodeTypes.js           # builds ReactFlow nodeTypes from registry
  components/
    ui/                    # shadcn primitives (Button, Input, Select, …)
    canvas/                # Canvas, ButtonEdge, ContextMenu
    palette/               # NodePalette, PaletteNode
    topbar/                # TopBar, GraphStatus
    submit/                # SubmitButton, ResultToast

backend/
  main.py                  # FastAPI: /pipelines/parse
  requirements.txt
```

### State management (Zustand)

All graph state lives in one Zustand store (`store/pipelineStore.js`) wrapped in
the `persist` middleware:

- `nodes`, `edges`, `nodeIDs` (per-type id counter), `past`/`future` (undo
  history), `clipboard`.
- ReactFlow wiring: `onNodesChange`, `onEdgesChange`, `onConnect`.
- Mutations: `addNode`, `addConnectedNode`, `insertNodeOnEdge`, `duplicateNode`,
  `copySelected`, `paste`, `removeNode`, `removeEdge`, `updateNodeField`,
  `autoLayout`, `clear`, `undo`, `redo`.
- `isValidConnection` guard.

**Data flow:** nodes render from the store; field edits write back through
`updateNodeField`, so field values live in `node.data` and reach the backend on
submit. (The original nodes used local `useState` and never persisted their
values — a latent bug that would have made Submit lose all field data.)

---

## 3. Part 1 — Node abstraction

**Goal:** separate a node's *description* (config data) from its *rendering* so a
new node is a few lines of config with zero repeated boilerplate.

### The abstraction

One generic component, `BaseNode`, renders every node. A node is described by a
plain config object in `registry.js`:

```js
{
  type: 'customInput',        // ReactFlow node type
  label: 'Input',             // heading
  category: 'INPUTS',         // palette group + eyebrow
  icon: LogIn,                // lucide icon (n8n-style header tile)
  width?: 240,
  handles: [                  // connection points
    { id: 'value', kind: 'source', position: 'right', label? },
  ],
  fields: [                   // form controls
    { key, label, kind: 'text'|'select'|'textarea'|'number'|'display',
      default, options, placeholder, required, autoGrow },
  ],
  computeHandles?: (data) => [...],  // dynamic handles (Text variables)
  computeWidth?:  (data) => number,  // dynamic width (Text auto-grow)
}
```

`BaseNode` responsibilities:
- Container, icon-tile header (label + category eyebrow).
- Maps `handles` (static + `computeHandles`) → `NodeHandle`, **evenly spaced by
  index** per edge (`(i+1)/(n+1)`) — this replaced the LLM node's hand-tuned
  `top: 100/3%` / `200/3%` math.
- Maps `fields` → `NodeField`, which switches on `kind` and renders the matching
  themed control, reading/writing the store.
- Selected-state ring; required-but-empty amber "incomplete" dot.

`nodeTypes.js` builds ReactFlow's `nodeTypes` map from the registry — every entry
is `BaseNode` bound to one config.

### The nine nodes (all config only)

- **Refactored:** Input, Output, LLM, Text.
- **New (to stress the abstraction):**
  - **Filter** — 1 in / 1 out + condition text.
  - **Transform** — 2 in / 1 out + operation select.
  - **API Request** — url (required) + method select, 1 in / 1 out.
  - **Conditional** — 1 in / 2 labeled outs (true · false).
  - **Note** — no handles, just a textarea (proves handle-less config works).

Adding a node is now: append one config object (+ list it in a palette group).

---

## 4. Part 2 — Styling

**Approach:** Tailwind v4 with a token-driven `@theme` block, plus hand-vendored
shadcn/ui primitives for form controls inside nodes and the result panel. Nodes,
handles, canvas, edges, and toolbar are ReactFlow-native, styled directly from
the same tokens (not shadcn).

**Identity:** warm editorial / institutional-finance — cream "paper" surfaces,
warm near-black ink, a single antique-gold accent, and three type roles (Geist
sans, Playfair Display italic for one emphasis word, Geist Mono for eyebrows and
numbers). Signature primitives `.vs-eyebrow`, `.vs-em`, `.vs-index` used
sparingly.

**Tokens:** every color, radius, and shadow is a CSS variable in `index.css`
(`--color-vs-*`, `--shadow-node`, `--radius-*`). shadcn's semantic vars
(`--background`, `--primary`, `--ring`, …) are mapped onto these tokens. There
are **no hardcoded colors** in components (grep-verified).

**n8n-style UX** (added on request): icon-forward node headers, round/box
handles, smooth gray bezier edges, dotted canvas, flat hairline Controls, palette
chips with node icons, and the "+"-to-add affordance (see §7).

---

## 5. Part 3 — Text node logic

### Auto-resize

`useAutoResize` measures the textarea and grows its height to fit content. The
Text config also declares `computeWidth(data)` so the node widens with the
longest line (clamped 240–460px). Verified: typing a long multi-line value grew
the node from 240px to 457px.

### Variables → dynamic handles

`lib/parseVariables.js` scans the text for `{{ name }}` templates and returns the
valid ones:

- Regex extracts the inner token of each `{{ … }}`.
- Each token is validated as a legal JS identifier
  (`/^[A-Za-z_$][A-Za-z0-9_$]*$/`).
- Results are **deduped, first-seen order preserved** (so handle positions stay
  stable as text changes).

The Text config's `computeHandles(data)` turns each variable into a left-side
target handle. Because handles are derived data merged by `BaseNode`, the same
even-spacing and labeling apply automatically. Verified with
`"…{{ greeting }}…{{ user }}…{{ tone }}… {{ 1bad }} … {{ user }}"` → exactly 3
handles (`1bad` rejected, duplicate `user` deduped).

---

## 6. Part 4 — Backend integration

### Frontend

`SubmitButton` POSTs `{ nodes, edges }` as JSON to
`${VITE_API_URL ?? http://localhost:8000}/pipelines/parse`, with loading and
error states. On success it shows a **styled ResultToast** (not a raw
`window.alert`) presenting `num_nodes` and `num_edges` in mono tabular numerals
and `is_dag` as a status pill ("Valid DAG" vs "Contains a cycle"). A raw alert
was deliberately upgraded to an on-brand toast to satisfy "user-friendly manner".

### Backend (`backend/main.py`)

- Pydantic models for the request (`{nodes:[{id}], edges:[{source,target}]}`).
- `POST /pipelines/parse` returns `{num_nodes:int, num_edges:int, is_dag:bool}`.
- **DAG detection via Kahn's algorithm** (topological sort): build in-degree map,
  queue zero-in-degree nodes, peel them off; if every node is visited there is no
  cycle. Edges referencing unknown nodes are ignored; an empty graph is trivially
  a DAG.
- CORS middleware added so the Vite dev origin can call it.

Verified with curl: acyclic chain → `is_dag:true`; 2-node cycle → `is_dag:false`;
empty → `{0,0,true}`.

---

## 7. Extra UX (built on request — "go all")

- **"+" quick-add / connect** — each right-side source handle *is* an n8n-style
  "+" button. **Click** opens a node picker and spawns a new connected node;
  **drag** pulls a live connection to an existing node. (Root-cause fix: the Plus
  icon was intercepting the mousedown, so ReactFlow saw the icon rather than the
  handle and never started a connection — solved with `pointer-events:none` on
  the icon.)
- **Edge-insert** — hovering an edge shows a "+" that drops a node onto the edge,
  splitting it into two wired edges.
- **Hover-delete** — node hover shows a trash button (cascades: removes connected
  edges); edge hover shows a "✕" at the midpoint. Keyboard Backspace/Delete also
  works.
- **Persistence** — the pipeline is stored in localStorage and survives refresh.
  The id counter (`nodeIDs`) is persisted too, so restored + newly added nodes
  never collide (verified: after reload the next Input is `input-3`, not a second
  `input-1`).
- **Undo / redo** — `⌘Z` / `⌘⇧Z`, snapshotting on discrete commits (add, remove,
  connect, drag-stop) rather than every drag tick, so one undo reverts one
  gesture. Rehydration pushes no history entry.
- **Duplicate / copy-paste** — `⌘D` / `⌘C` / `⌘V`, no-op while typing in a field.
- **Right-click context menu** — node: Duplicate / Delete; canvas: Paste /
  Auto-layout / Clear.
- **Auto-layout** — dagre left-to-right layout using each node's *measured* size
  (so the auto-growing Text node lays out correctly), plus fit-to-view.
- **Control panel + minimap** — undo/redo/tidy/clear buttons and a token-styled
  minimap on the canvas.
- **Connection guardrails** — `isValidConnection` blocks self-loops and a second
  edge into an already-filled input handle.
- **Live status + affordances** — TopBar shows "N nodes · M edges · valid DAG"
  live; Submit is disabled on an empty canvas; required-but-empty fields show a
  subtle amber dot.

---

## 8. Bugs fixed in the provided code

- `updateNodeField` mutated `node.data` in place → replaced with an immutable
  update; nodes now persist field values to the store.
- Node fields used local `useState` and never wrote to the store → Submit would
  have sent empty `data`. Now store-backed.
- `width: '100wv'` typo in the canvas wrapper.
- `submit.js` was a bare button; the endpoint was a `GET` taking a form field.
  Both corrected to a `POST`/JSON contract.

---

## 9. Verification

Every feature was exercised in a real browser (Playwright driving system Chrome),
not just unit-tested:

- Drag-drop from palette; manual connect; "+" click-add and drag-connect;
  edge-insert split; node and edge hover-delete; persistence across reload with
  id-collision check; undo/redo coalescing; context menu; auto-layout; full
  submit → backend → toast round-trip.
- The variable parser and the backend DAG algorithm were additionally checked
  with direct case tables (dedupe/invalid/multi; DAG/cycle/empty).
- Screenshots were reviewed at each step; a real layout bug (handle labels
  rendering on the wrong side of the LLM node) was caught this way and fixed.
- Zero console errors across all runs.

---

## 10. How to run

**Frontend**
```
cd frontend
npm i
npm start          # Vite dev server on http://localhost:3000
```

**Backend**
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

Optional: set `VITE_API_URL` if the backend runs elsewhere.

---

## 11. Production notes / what I'd change

- **CORS** is currently `allow_origins=["*"]` with `allow_credentials=True` — a
  contradictory combination. It works here because the frontend sends no
  credentials; in production I'd pin the deployed origin and drop credentials.
- **Field typing** — number fields store strings; I'd add coercion (and a schema)
  if the backend consumed field values.
- **Undo/redo scope** — history covers structural changes and drag-stops, not
  per-keystroke field edits, to avoid a noisy stack. A production editor might add
  debounced field-edit history.
- **Copy/paste** currently duplicates nodes but not the edges among a
  multi-selection; that would be the next increment.
- **Repo hygiene** — `frontend/` currently carries its own nested `.git`; for a
  single clean submission I'd flatten it or make it a proper submodule.
- The Part 4 file `submit.js` now lives at
  `components/submit/SubmitButton.jsx` after the restructure (the assessment
  permits file changes); a thin `submit.js` re-export can be added if the literal
  filename is expected.
