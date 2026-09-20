import { useEffect, useState } from 'react';
import type { Profile } from './schema';
import { getProfileStore, type ProfileStore } from './store';

export function useProfile(store: ProfileStore = getProfileStore()): {
  profile: Profile;
  store: ProfileStore;
} {
  const [profile, setProfile] = useState<Profile>(() => store.get());

  useEffect(() => {
    store.hydrateFromWindow();
    return store.subscribe(setProfile);
  }, [store]);

  return { profile, store };
}
