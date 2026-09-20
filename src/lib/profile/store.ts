import {
  createEmptyProfile,
  parseProfile,
  PROFILE_SCHEMA_VERSION,
  type Profile,
} from './schema';
import { decodeProfileFromHash, readHashFromLocation } from './hash';

/** Versioned localStorage key. Change the suffix when the on-disk shape breaks. */
export const PROFILE_STORAGE_KEY = `cadence.profile.v${PROFILE_SCHEMA_VERSION}`;
export const DEFAULT_SAVE_DEBOUNCE_MS = 350;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type ProfileListener = (profile: Profile) => void;

export type ProfileStore = {
  key: string;
  get: () => Profile;
  set: (profile: Profile) => Profile;
  update: (updater: (current: Profile) => Profile) => Profile;
  reset: () => Profile;
  hydrateFromHash: (hash: string) => Profile | null;
  hydrateFromWindow: () => Profile;
  subscribe: (listener: ProfileListener) => () => void;
  flush: () => void;
  destroy: () => void;
};

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function resolveStorage(storage?: StorageLike): StorageLike {
  if (storage) return storage;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* private mode / SSR */
  }
  return memoryStorage();
}

function readStoredProfile(storage: StorageLike, key: string): Profile {
  try {
    const raw = storage.getItem(key);
    if (!raw) return createEmptyProfile();
    return parseProfile(JSON.parse(raw));
  } catch {
    return createEmptyProfile();
  }
}

/**
 * Local-first profile store. Autosaves a versioned JSON blob to storage
 * after `debounceMs`. Parallel islands should subscribe rather than
 * reading localStorage directly.
 */
export function createProfileStore(options: {
  storage?: StorageLike;
  debounceMs?: number;
  key?: string;
} = {}): ProfileStore {
  const key = options.key ?? PROFILE_STORAGE_KEY;
  const debounceMs = options.debounceMs ?? DEFAULT_SAVE_DEBOUNCE_MS;
  const storage = resolveStorage(options.storage);

  let profile = readStoredProfile(storage, key);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<ProfileListener>();

  const persist = (next: Profile, immediate: boolean) => {
    profile = next;
    for (const listener of listeners) listener(profile);

    const write = () => {
      try {
        storage.setItem(key, JSON.stringify(profile));
      } catch {
        /* quota / private mode */
      }
    };

    if (immediate || debounceMs <= 0) {
      if (timer) clearTimeout(timer);
      timer = undefined;
      write();
      return;
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      write();
    }, debounceMs);
  };

  const store: ProfileStore = {
    key,
    get: () => profile,
    set: (next) => {
      persist(parseProfile(next), false);
      return profile;
    },
    update: (updater) => {
      persist(parseProfile(updater(profile)), false);
      return profile;
    },
    reset: () => {
      persist(createEmptyProfile(), true);
      return profile;
    },
    hydrateFromHash: (hash) => {
      const decoded = decodeProfileFromHash(hash);
      if (!decoded) return null;
      persist(decoded.profile, true);
      return profile;
    },
    hydrateFromWindow: () => {
      if (typeof window === 'undefined') return profile;
      const decoded = readHashFromLocation(window.location);
      if (decoded) persist(decoded.profile, true);
      return profile;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(profile);
      return () => {
        listeners.delete(listener);
      };
    },
    flush: () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      try {
        storage.setItem(key, JSON.stringify(profile));
      } catch {
        /* ignore */
      }
    },
    destroy: () => {
      if (timer) clearTimeout(timer);
      listeners.clear();
    },
  };

  return store;
}

let singleton: ProfileStore | undefined;

/** App-wide store. Islands import this; tests should call createProfileStore(). */
export function getProfileStore(): ProfileStore {
  if (!singleton) singleton = createProfileStore();
  return singleton;
}

export function resetProfileStoreForTests(): void {
  singleton?.destroy();
  singleton = undefined;
}
