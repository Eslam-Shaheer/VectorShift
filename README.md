# VectorShift Builder

A ReactFlow-based visual pipeline builder — drag nodes onto a canvas, wire them
together, and submit the graph to a FastAPI backend that reports its size and
whether it forms a DAG. Built for the VectorShift frontend technical assessment.

**Frontend:** JavaScript / React · Vite · Tailwind v4 · shadcn/ui primitives ·
Zustand · React Query · ReactFlow
**Backend:** Python / FastAPI

This single document is both the quick start and the full engineering write-up:
decisions, algorithms, how each part was verified, and what would change for
production.

---

## Parts at a glance

| Assessment part | Where it's implemented | Status |
| --- | --- | --- |
| Part 1 — Node abstraction | §3 (`nodes/BaseNode.jsx`, `nodes/registry.js`) | ✓ |
| Part 2 — Styling | §4 (`index.css` tokens, `components/**`) | ✓ |
| Part 3 — Text node logic | §5 (`hooks/useAutoResize.js`, `lib/parseVariables.js`) | ✓ |
| Part 4 — Backend integration | §6 (`src/submit.js`, `backend/main.py`) | ✓ |

Tests: `cd backend && pytest` (DAG endpoint) · `cd frontend && npm test` (variable parser).

---

## Quick start

**Backend** (terminal 1)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # http://localhost:8000
```

**Frontend** (terminal 2)
```bash
cd frontend
npm install
npm start                          # http://localhost:3000
```

Open http://localhost:3000, drag nodes from the palette, connect them, and click
**Submit**. Set `VITE_API_URL` if the backend runs somewhere other than
`http://localhost:8000`.

### Tests
```bash
cd backend  && pip install -r requirements-dev.txt && pytest   # DAG endpoint
cd frontend && npm test                                        # variable parser (Vitest)
```

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

### Repository layout

```
VectorShift/
  frontend/     React + Vite app (the pipeline builder UI)
  backend/      FastAPI service (/pipelines/parse)
  README.md     this document
```

### Frontend file structure (layer/type-based)

```
frontend/src/
  main.jsx                 # entry (mounts App inside QueryClientProvider)
  App.jsx                  # composition only
  index.css                # design tokens + primitives + ReactFlow overrides
  submit.js                # pipeline submit entry point (named by the brief)
  store/
    pipelineStore.js       # Zustand store (nodes, edges, history, clipboard, linking…)
    index.js               # re-export → "@/store" resolves
  hooks/
    useAutoResize.js       # textarea auto-grow
  lib/
    api.js                 # generic HTTP service (get/post/put/del + ApiError)
    utils.js               # cn() classname helper
    graph.js               # client DAG check, dagre layout, handle helpers
    parseVariables.js      # {{ variable }} parser
    parseVariables.test.js # Vitest unit tests
  nodes/                   # node domain
    BaseNode.jsx           # generic config-driven renderer
    NodeField.jsx          # field kind → control
    NodeHandle.jsx         # handles + labels + point/"+" output affordance
    AddNodePicker.jsx      # node-type picker popover
    registry.js            # ALL node configs (data) + palette groups
    nodeTypes.js           # builds ReactFlow nodeTypes from registry
  components/
    ui/                    # shadcn primitives (Button, Input, Select, Toast, …)
    canvas/                # Canvas, ButtonEdge, ConnectionLine, LinkingOverlay,
                           #   ConnectionDropMenu, ContextMenu
    palette/               # NodePalette, PaletteNode
    topbar/                # TopBar, GraphStatus
    submit/                # SubmitButton, ResultToast

backend/
  main.py                  # FastAPI: /pipelines/parse
  test_main.py             # pytest for the DAG endpoint
  requirements.txt
  requirements-dev.txt     # + pytest, httpx
```

### State management (Zustand)

All graph state lives in one Zustand store (`store/pipelineStore.js`) wrapped in
the `persist` middleware:

- `nodes`, `edges`, `nodeIDs` (per-type id counter), `past`/`future` (undo
  history), `clipboard`, and a transient `linking` (the "+"-drag overlay state).
- ReactFlow wiring: `onNodesChange`, `onEdgesChange`, `onConnect`,
  `isValidConnection`.
- Mutations: `addNode`, `addConnectedNode` (optionally at a drop position),
  `insertNodeOnEdge`, `duplicateNode`, `copySelected`, `paste`, `removeNode`,
  `removeEdge`, `updateNodeField`, `autoLayout`, `clear`, `undo`, `redo`.

Only `nodes`, `edges`, and `nodeIDs` are persisted (via `partialize`), so history,
clipboard, and the transient link state never leak into localStorage.

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

**n8n-style UX:** icon-forward node headers, round handles, wavy bezier edges,
dotted canvas, flat hairline Controls, palette chips with node icons, and the
point/"+" output affordance (see §7).

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
handles (`1bad` rejected, duplicate `user` deduped). Covered by Vitest in
`lib/parseVariables.test.js`.

---

## 6. Part 4 — Backend integration

### Frontend

`src/submit.js` is the named submit entry point. It calls the generic API service
(`lib/api.js`) to POST `{ nodes, edges }` to `/pipelines/parse`. `SubmitButton`
drives it through a React Query **mutation** (`useMutation` — the correct primitive
for a POST-on-click; the `QueryClientProvider` in `main.jsx` also makes any real
GET a `useQuery`), with loading and error states. On success it shows a **styled
ResultToast** (not a raw `window.alert`) presenting `num_nodes`/`num_edges` in
mono tabular numerals and `is_dag` as a status pill ("Valid DAG" vs "Contains a
cycle"). The generic service centralizes the base URL, JSON encoding, and error
handling behind `api.get/post/put/del` + an `ApiError`.

### Backend (`backend/main.py`)

- Pydantic models for the request (`{nodes:[{id}], edges:[{source,target}]}`).
- `POST /pipelines/parse` returns `{num_nodes:int, num_edges:int, is_dag:bool}`.
- **Counts reflect the payload as received:** `num_nodes == len(nodes)` and
  `num_edges == len(edges)`. Dangling edges (referencing an unknown node id) are
  still counted in `num_edges` but are skipped during traversal, so `is_dag`
  stays correct on a partially-built or dirty graph.
- **DAG detection via Kahn's algorithm** (topological sort): build in-degree map,
  queue zero-in-degree nodes, peel them off; if every node is visited there is no
  cycle. A self-loop (`A→A`) gives node A in-degree 1 with nothing to seed the
  queue, so it is correctly reported as not a DAG — caught server-side,
  independent of the frontend's connection guard. An empty graph is trivially a
  DAG.
- CORS middleware pins the frontend origin (see §11).

Verified by `pytest` (`backend/test_main.py`, see §9) and curl: acyclic chain →
`is_dag:true`; 2-node cycle and self-loop → `is_dag:false`; empty → `{0,0,true}`.

---

## 7. Extra UX

- **Point + "+" output (n8n-style).** Each source output shows a circle **point**
  at the node edge and, while unconnected, a **"+" box** beyond a short stub.
  - The point is the single connection handle: drag it to draw a **wavy** line
    (`ConnectionLine`) and connect to a node, or drop on empty canvas to open the
    picker at the drop point (`ConnectionDropMenu`).
  - The "+" box **click** opens the picker; **drag** drives a manual link overlay
    (`LinkingOverlay`) whose line always originates at the **point** (never the
    "+"), connecting via hit-test on drop. Once the output is connected the "+"
    hides, leaving the point to branch further. A single point handle per output
    means edges always anchor at the point (no phantom gap).
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
- `submit.js` was a bare button and the endpoint was a `GET` taking a form field.
  Both corrected to a `POST`/JSON contract.

---

## 9. Verification

Every feature was exercised in a real browser (Playwright driving system Chrome),
not just unit-tested:

- Drag-drop from palette; manual connect; point-drag and "+"-drag connect (line
  verified to originate at the point); drop-on-empty picker; edge-insert split;
  node and edge hover-delete; persistence across reload with id-collision check;
  undo/redo coalescing; context menu; auto-layout; full submit → backend → toast
  round-trip.
- The variable parser (Vitest, 6 cases) and the backend DAG endpoint (pytest, 6
  cases) are covered by re-runnable unit tests.
- Screenshots were reviewed at each step; real layout bugs (handle labels on the
  wrong side, a label overlapping the "+", an edge-anchor gap) were caught this
  way and fixed.
- Zero console errors across all runs.

---

## 10. Production notes / what I'd change

- **CORS** pins `allow_origins=["http://localhost:3000"]` with
  `allow_credentials=False` for local dev; in production this becomes the deployed
  frontend origin.
- **Field typing** — number fields store strings; I'd add coercion (and a schema)
  if the backend consumed field values.
- **Undo/redo scope** — history covers structural changes and drag-stops, not
  per-keystroke field edits, to avoid a noisy stack. A production editor might add
  debounced field-edit history.
- **Copy/paste** currently duplicates nodes but not the edges among a
  multi-selection; that would be the next increment.
- **API layer** — `lib/api.js` is intentionally minimal (fetch + JSON + one error
  type). A larger app would add request cancellation, retries/backoff, and typed
  responses.
