async function request(path: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) => request(path, { method: 'POST', body }),
  put: (path: string, body?: unknown) => request(path, { method: 'PUT', body }),
  patch: (path: string, body?: unknown) => request(path, { method: 'PATCH', body }),
  del: (path: string) => request(path, { method: 'DELETE' }),
};
