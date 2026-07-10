import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function useFetch<T = unknown>(path: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: !!path,
    error: null,
  });

  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path)
      .then((data: T) => alive && setState({ data, loading: false, error: null }))
      .catch((err: unknown) => alive && setState({ data: null, loading: false, error: (err as Error).message }));
    return () => {
      alive = false;
    };
  }, deps);

  return state;
}
