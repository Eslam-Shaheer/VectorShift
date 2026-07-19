"""VectorShift Builder — pipeline parsing API."""

from collections import defaultdict, deque

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="VectorShift Builder API")

# The frontend runs on a separate origin (Vite dev server), so allow it to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the deployed frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    id: str


class Edge(BaseModel):
    source: str
    target: str


class Pipeline(BaseModel):
    nodes: list[Node] = []
    edges: list[Edge] = []


def is_dag(nodes: list[Node], edges: list[Edge]) -> bool:
    """True if the directed graph has no cycles (Kahn's topological sort).

    Edges referencing unknown nodes are ignored so a partially-built pipeline
    still parses. A graph with no nodes is trivially a DAG.
    """
    node_ids = {n.id for n in nodes}
    adjacency: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        if edge.source in node_ids and edge.target in node_ids:
            adjacency[edge.source].append(edge.target)
            in_degree[edge.target] += 1

    queue = deque(node_id for node_id, deg in in_degree.items() if deg == 0)
    visited = 0
    while queue:
        current = queue.popleft()
        visited += 1
        for neighbor in adjacency[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # If we couldn't visit every node, a cycle blocked the remainder.
    return visited == len(node_ids)


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(pipeline: Pipeline):
    return {
        "num_nodes": len(pipeline.nodes),
        "num_edges": len(pipeline.edges),
        "is_dag": is_dag(pipeline.nodes, pipeline.edges),
    }
