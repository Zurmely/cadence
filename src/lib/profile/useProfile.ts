import { useEffect, useState } from 'react';
import { createEmptyProfile, type Profile } from './schema';
import { getProfileStore, type ProfileStore } from './store';

/**
 * The profile lives in `localStorage`, which the static build never sees.
 * The first render (including hydration) always starts from an empty
 * profile, matching the statically built markup, and swaps in whatever the
 * store actually holds inside a `useEffect`. Reading `store.get()` directly
 * in the `useState` initializer would pull in real client data during
 * hydration and mismatch the server-rendered HTML.
 */
export function useProfile(store: ProfileStore = getProfileStore()): {
  profile: Profile;
  store: ProfileStore;
} {
  const [profile, setProfile] = useState<Profile>(createEmptyProfile);

  useEffect(() => {
    store.hydrateFromWindow();
    return store.subscribe(setProfile);
  }, [store]);

  return { profile, store };
}
