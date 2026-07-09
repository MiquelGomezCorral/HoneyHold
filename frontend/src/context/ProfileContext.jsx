import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

// The active profile IS the data scope: every request the views make is built
// from profileId, so switching profiles swaps the queries and nothing else.
const Ctx = createContext(null);
const STORAGE_KEY = 'hucha.profileId';

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(null);
  const [profileId, setProfileIdState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [version, setVersion] = useState(0); // bump() → every view refetches

  useEffect(() => {
    api
      .get('/profiles')
      .then(setProfiles)
      .catch((err) => setLoadError(err.message));
  }, []);

  const value = useMemo(() => {
    const setProfileId = (id) => {
      localStorage.setItem(STORAGE_KEY, String(id));
      setProfileIdState(id);
    };
    const profile = profiles?.find((p) => p.id === profileId) ?? null;
    return {
      profiles,
      loadError,
      profile,
      profileId: profile ? profileId : null, // ignore stale ids after a db reset
      setProfileId,
      version,
      bump: () => setVersion((v) => v + 1),
    };
  }, [profiles, loadError, profileId, version]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
