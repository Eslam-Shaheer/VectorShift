"""Tests for the /pipelines/parse endpoint and its DAG algorithm.

Run:  cd backend && pip install -r requirements.txt && pytest
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def parse(nodes, edges):
    ids = [{"id": n} for n in nodes]
    es = [{"source": s, "target": t} for s, t in edges]
    res = client.post("/pipelines/parse", json={"nodes": ids, "edges": es})
    assert res.status_code == 200
    return res.json()


def test_acyclic_chain_is_dag():
    body = parse(["a", "b", "c"], [("a", "b"), ("b", "c")])
    assert body == {"num_nodes": 3, "num_edges": 2, "is_dag": True}


def test_two_node_cycle_is_not_dag():
    body = parse(["a", "b"], [("a", "b"), ("b", "a")])
    assert body["is_dag"] is False


def test_self_loop_is_not_dag():
    # A->A must be caught server-side, independent of the frontend guard.
    body = parse(["a"], [("a", "a")])
    assert body["is_dag"] is False


def test_empty_graph():
    assert parse([], []) == {"num_nodes": 0, "num_edges": 0, "is_dag": True}


def test_edge_to_unknown_node_ignored_in_traversal():
    # Edge b->ghost references a missing node; traversal ignores it, and the
    # remaining graph (a->b) is still a valid DAG. Counts reflect input as-received.
    body = parse(["a", "b"], [("a", "b"), ("b", "ghost")])
    assert body == {"num_nodes": 2, "num_edges": 2, "is_dag": True}


def test_counts_match_input_exactly():
    nodes = ["a", "b", "c", "d"]
    edges = [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]
    body = parse(nodes, edges)
    assert body["num_nodes"] == len(nodes)
    assert body["num_edges"] == len(edges)
    assert body["is_dag"] is True
