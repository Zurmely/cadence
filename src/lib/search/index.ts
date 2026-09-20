/**
 * Medical autocomplete search — typed client for src/workers/search.worker.ts.
 *
 *   getSearchClient() -> { search(dataset, query, locale), destroy() }
 *   createSearchClient({ workerFactory?, debounceMs?, limit? }) for tests/isolated clients
 *
 * Pure helpers (safe to unit test without a worker or DOM):
 *   resolveChunkKey(query) -> chunk letter or null
 *   buildIcd10Index(entries) / buildMedIndex(entries) -> MiniSearch instance
 *   searchIcd10(index, query, locale, limit) / searchMeds(...)
 */
export * from './types';
export * from './chunking';
export * from './indexer';
export * from './client';
