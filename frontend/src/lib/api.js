// api.js — a small generic HTTP service used by all backend calls.
// Centralizes the base URL, JSON encoding/decoding, and error handling so
// feature code (and React Query hooks) stay thin.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Core request: resolves to parsed JSON, throws ApiError on a non-2xx status.
export async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(`Server responded ${res.status}`, res.status);
  }
  // 204 / empty bodies resolve to null.
  return res.status === 204 ? null : res.json();
}

export const api = {
  baseUrl: BASE_URL,
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
