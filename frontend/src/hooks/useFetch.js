import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Tiny data hook: pass a path (or null to idle) and a deps array.
// Views refetch by including `version` from ProfileContext in deps.
export function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: !!path, error: null });

  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err.message }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
