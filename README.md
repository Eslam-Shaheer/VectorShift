# VectorShift Builder

A ReactFlow-based visual pipeline builder — drag nodes onto a canvas, wire them
together, and submit the graph to a FastAPI backend that reports its size and
whether it forms a DAG. Built for the VectorShift frontend technical assessment.

**Frontend:** JavaScript / React · Vite · Tailwind v4 · shadcn/ui primitives ·
Zustand · ReactFlow
**Backend:** Python / FastAPI

> A detailed engineering write-up (decisions, algorithms, verification, and
> production notes) lives in [`REPORT.md`](./REPORT.md).

---

## Repository layout

```
VectorShift/
  frontend/     React + Vite app (the pipeline builder UI)
  backend/      FastAPI service (/pipelines/parse)
  README.md     you are here
  REPORT.md     full engineering report
```

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

---

## What was built

### Part 1 — Node abstraction
A single config-driven `BaseNode` renders every node. A node is described by a
plain object in `frontend/src/nodes/registry.js` (title, category, icon, handles,
fields); adding a node is a few lines of config with zero repeated boilerplate.
The four provided nodes (Input, Output, LLM, Text) were refactored onto it, plus
five new demo nodes (Filter, Transform, API Request, Conditional, Note — the last
proving handle-less config works).

### Part 2 — Styling
A cohesive warm editorial identity (cream paper, ink, a single gold accent, three
type roles) driven entirely by CSS design tokens — no hardcoded colors. Tailwind
v4 `@theme` tokens plus hand-vendored shadcn/ui form primitives, with an
n8n-inspired canvas UX (icon-forward node headers, round handles, bezier edges,
grouped palette).

### Part 3 — Text node logic
The Text node auto-grows in width and height as you type, and any
`{{ variable }}` in the text dynamically becomes a left-side input handle
(validated as a legal JS identifier, deduped, added/removed live).

### Part 4 — Backend integration
Submit POSTs the nodes and edges to `POST /pipelines/parse`, which returns
`{ num_nodes, num_edges, is_dag }` (DAG detection via Kahn's topological sort,
with CORS enabled). The result is shown in a styled, on-brand toast.

### Extra UX
Quick-add / drag-to-connect from a node's "+" handle, edge-insert, hover-delete
for nodes and edges, localStorage persistence, undo/redo, copy-paste, a
right-click context menu, dagre auto-layout, a minimap, connection guardrails,
and a live node/edge/DAG status readout in the top bar.

See [`REPORT.md`](./REPORT.md) for the full breakdown, the bugs fixed in the
provided code, how each feature was verified, and production considerations.
