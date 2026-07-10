import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client.js';
import type { Profile } from '../types.js';

interface ProfileContextValue {
  profiles: Profile[] | null;
  loadError: string | null;
  profile: Profile | null;
  profileId: number | null;
  setProfileId: (id: number) => void;
  version: number;
  bump: () => void;
}

const Ctx = createContext<ProfileContextValue | null>(null);
const STORAGE_KEY = 'HoneyHold.profileId';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileId, setProfileIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    api
      .get('/profiles')
      .then(setProfiles)
      .catch((err: unknown) => setLoadError((err as Error).message));
  }, []);

  const value = useMemo<ProfileContextValue>(() => {
    const setProfileId = (id: number) => {
      localStorage.setItem(STORAGE_KEY, String(id));
      setProfileIdState(id);
    };
    const profile = profiles?.find((p) => p.id === profileId) ?? null;
    return {
      profiles,
      loadError,
      profile,
      profileId: profile ? profileId : null,
      setProfileId,
      version,
      bump: () => setVersion((v) => v + 1),
    };
  }, [profiles, loadError, profileId, version]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProfile = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};
