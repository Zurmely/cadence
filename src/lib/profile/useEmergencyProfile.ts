import { useEffect, useState } from 'react';
import { resolveEmergencyProfile, type EmergencyProfileResult } from './emergencySource';
import { createEmptyProfile } from './schema';
import { getProfileStore, type ProfileStore } from './store';

function readHash(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hash;
}

/**
 * Emergency-view profile: reads `#data=` first, falls back to the local
 * profile store, and never persists a shared hash back into local storage
 * (see `resolveEmergencyProfile`). Once the hash and local profile have been
 * read, the page works fully offline — nothing here fetches over the
 * network.
 *
 * Both the hash and the local store are client-only, so the first render
 * (including hydration) always starts from an empty local-source result —
 * matching the statically built markup — and resolves the real hash/local
 * data inside a `useEffect`.
 */
export function useEmergencyProfile(store: ProfileStore = getProfileStore()): EmergencyProfileResult {
  const [result, setResult] = useState<EmergencyProfileResult>(() => ({
    profile: createEmptyProfile(),
    source: 'local',
    mode: null,
  }));

  useEffect(() => {
    const recompute = () => setResult(resolveEmergencyProfile(readHash(), store.get()));
    recompute();

    window.addEventListener('hashchange', recompute);
    const unsubscribe = store.subscribe(() => {
      setResult((prev) => (prev.source === 'hash' ? prev : resolveEmergencyProfile(readHash(), store.get())));
    });

    return () => {
      window.removeEventListener('hashchange', recompute);
      unsubscribe();
    };
  }, [store]);

  return result;
}
