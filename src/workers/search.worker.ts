/**
 * Web Worker entry for MiniSearch over lazily-fetched JSON chunks (ICD-10 /
 * CID-10 diagnostic codes and medication formulations). Runs entirely off
 * the main thread: chunk fetch + JSON parse + MiniSearch indexing all happen
 * here, so typing in the combobox never blocks the UI thread.
 *
 * Chunks live under public/data/{icd10,meds}/<letter>.json, partitioned by
 * the initial character of the record's primary key (ICD-10 code / med id).
 * On each query we first try the chunk that matches the query's own initial
 * character (fast path — usually the only fetch needed). If that chunk has
 * no matches (e.g. the user typed a description whose first letter differs
 * from the record's key, common across pt-BR/en-US), we lazily widen the
 * search by loading every remaining chunk for that dataset, once, and cache
 * the merged index for the rest of the session.
 */
import type { AnyIndex } from '../lib/search/indexer';
import { buildIndex, searchIndex } from '../lib/search/indexer';
import { chunkUrl, manifestUrl, resolveChunkKey } from '../lib/search/chunking';
import type {
  ChunkManifest,
  SearchDataset,
  SearchWorkerRequest,
  SearchWorkerResponse,
} from '../lib/search/types';

type DatasetState = {
  manifest: Promise<ChunkManifest> | null;
  chunkIndices: Map<string, Promise<AnyIndex>>;
  fullIndex: Promise<AnyIndex> | null;
};

const state: Record<SearchDataset, DatasetState> = {
  icd10: { manifest: null, chunkIndices: new Map(), fullIndex: null },
  meds: { manifest: null, chunkIndices: new Map(), fullIndex: null },
};

/** Site base path (respects Astro's `base` config), with no trailing slash. */
function publicBase(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return (await response.json()) as T;
}

function getManifest(dataset: SearchDataset): Promise<ChunkManifest> {
  const bucket = state[dataset];
  if (!bucket.manifest) {
    bucket.manifest = fetchJson<ChunkManifest>(manifestUrl(publicBase(), dataset));
  }
  return bucket.manifest;
}

function getChunkIndex(dataset: SearchDataset, chunkKey: string): Promise<AnyIndex> {
  const bucket = state[dataset];
  let promise = bucket.chunkIndices.get(chunkKey);
  if (!promise) {
    promise = fetchJson<unknown[]>(chunkUrl(publicBase(), dataset, chunkKey)).then((entries) =>
      buildIndex(dataset, entries),
    );
    bucket.chunkIndices.set(chunkKey, promise);
  }
  return promise;
}

async function getFullIndex(dataset: SearchDataset): Promise<AnyIndex> {
  const bucket = state[dataset];
  if (!bucket.fullIndex) {
    bucket.fullIndex = getManifest(dataset).then(async (manifest) => {
      const chunks = await Promise.all(
        manifest.chunks.map((key) =>
          fetchJson<unknown[]>(chunkUrl(publicBase(), dataset, key)),
        ),
      );
      return buildIndex(dataset, chunks.flat());
    });
  }
  return bucket.fullIndex;
}

async function handleSearch(request: SearchWorkerRequest): Promise<SearchWorkerResponse> {
  const { dataset, query, locale, limit, requestId } = request;
  if (!query.trim()) return { type: 'result', requestId, items: [] };

  const chunkKey = resolveChunkKey(query);
  if (chunkKey) {
    const manifest = await getManifest(dataset);
    if (manifest.chunks.includes(chunkKey)) {
      const index = await getChunkIndex(dataset, chunkKey);
      const items = searchIndex(dataset, index, query, locale, limit);
      if (items.length > 0) return { type: 'result', requestId, items };
    }
  }

  // Fallback: widen to the full (still lazily loaded, then cached) dataset.
  const fullIndex = await getFullIndex(dataset);
  const items = searchIndex(dataset, fullIndex, query, locale, limit);
  return { type: 'result', requestId, items };
}

self.addEventListener('message', (event: MessageEvent<SearchWorkerRequest>) => {
  const request = event.data;
  if (!request || request.type !== 'search') return;

  handleSearch(request)
    .then((response) => self.postMessage(response))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Search failed';
      self.postMessage({ type: 'error', requestId: request.requestId, message } satisfies SearchWorkerResponse);
    });
});

export {};
