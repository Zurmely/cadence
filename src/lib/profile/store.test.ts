import { describe, expect, it, vi } from 'vitest';
import { createEmptyProfile, createProfileStore, encodeProfileToHash } from './index';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe('profile store', () => {
  it('autosaves a versioned key after debounce', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const store = createProfileStore({ storage, debounceMs: 200 });
    store.update((current) => ({
      ...current,
      person: { ...current.person, fullName: 'Ana' },
    }));
    expect(storage.getItem(store.key)).toBeNull();
    vi.advanceTimersByTime(200);
    const stored = JSON.parse(storage.getItem(store.key) ?? '{}');
    expect(store.key).toBe('cadence.profile.v1');
    expect(stored.person.fullName).toBe('Ana');
    store.destroy();
    vi.useRealTimers();
  });

  it('hydrates from a hash and notifies subscribers', () => {
    const storage = memoryStorage();
    const store = createProfileStore({ storage, debounceMs: 0 });
    const seen: string[] = [];
    const unsubscribe = store.subscribe((profile) => {
      seen.push(profile.person.fullName);
    });
    const seed = createEmptyProfile();
    seed.person.fullName = 'Hash User';
    store.hydrateFromHash(encodeProfileToHash(seed));
    expect(store.get().person.fullName).toBe('Hash User');
    expect(seen.includes('Hash User')).toBe(true);
    unsubscribe();
    store.destroy();
  });
});
