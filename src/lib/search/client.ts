import type { Locale } from '../i18n';
import type {
  SearchDataset,
  SearchResultItem,
  SearchWorkerRequest,
  SearchWorkerResponse,
} from './types';

export const DEFAULT_SEARCH_DEBOUNCE_MS = 150;
export const DEFAULT_SEARCH_LIMIT = 8;

export type SearchClient = {
  /**
   * Debounced, cancellation-safe search. Resolves with the latest results
   * for this dataset; if a newer call supersedes this one before the worker
   * responds, this promise resolves to `null` instead of stale data.
   */
  search: (dataset: SearchDataset, query: string, locale: Locale) => Promise<SearchResultItem[] | null>;
  destroy: () => void;
};

type PendingResolver = (items: SearchResultItem[] | null) => void;

export type WorkerFactory = () => Worker;

/** Default factory: spawns the real module worker (browser-only). */
function defaultWorkerFactory(): Worker {
  return new Worker(new URL('../../workers/search.worker.ts', import.meta.url), {
    type: 'module',
  });
}

/**
 * Creates a client around the search Web Worker. One worker instance is
 * shared across datasets; `createSearchClient` is cheap to call multiple
 * times in tests but should be a singleton in the app (see `getSearchClient`).
 */
export function createSearchClient(options: {
  workerFactory?: WorkerFactory;
  debounceMs?: number;
  limit?: number;
} = {}): SearchClient {
  const debounceMs = options.debounceMs ?? DEFAULT_SEARCH_DEBOUNCE_MS;
  const limit = options.limit ?? DEFAULT_SEARCH_LIMIT;

  let worker: Worker | null = null;
  let nextRequestId = 1;
  /** Highest request id issued per dataset; responses to older ids are stale and dropped. */
  const latestRequestId = new Map<SearchDataset, number>();
  const pending = new Map<number, PendingResolver>();
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function ensureWorker(): Worker {
    if (!worker) {
      worker = (options.workerFactory ?? defaultWorkerFactory)();
      worker.addEventListener('message', (event: MessageEvent<SearchWorkerResponse>) => {
        const response = event.data;
        const resolve = pending.get(response.requestId);
        if (!resolve) return;
        pending.delete(response.requestId);
        resolve(response.type === 'result' ? response.items : []);
      });
    }
    return worker;
  }

  function dispatch(dataset: SearchDataset, query: string, locale: Locale): Promise<SearchResultItem[] | null> {
    const requestId = nextRequestId++;
    latestRequestId.set(dataset, requestId);

    return new Promise((resolve) => {
      pending.set(requestId, (items) => {
        // Drop stale responses: only the most recent request per dataset wins.
        resolve(latestRequestId.get(dataset) === requestId ? items : null);
      });
      const message: SearchWorkerRequest = {
        type: 'search',
        requestId,
        dataset,
        query,
        locale,
        limit,
      };
      ensureWorker().postMessage(message);
    });
  }

  return {
    search(dataset, query, locale) {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (!query.trim()) {
        latestRequestId.set(dataset, nextRequestId++);
        return Promise.resolve([]);
      }
      return new Promise((resolve) => {
        debounceTimer = setTimeout(() => {
          dispatch(dataset, query, locale).then(resolve);
        }, debounceMs);
      });
    },
    destroy() {
      if (debounceTimer) clearTimeout(debounceTimer);
      pending.clear();
      worker?.terminate();
      worker = null;
    },
  };
}

let singleton: SearchClient | undefined;

/** App-wide client. Islands should share this instance rather than spawning many workers. */
export function getSearchClient(): SearchClient {
  if (!singleton) singleton = createSearchClient();
  return singleton;
}

export function resetSearchClientForTests(): void {
  singleton?.destroy();
  singleton = undefined;
}
