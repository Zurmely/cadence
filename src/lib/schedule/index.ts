/**
 * Local-first daily compliance tracking — extension point for the schedule UI.
 *
 * Store API:
 *   getComplianceStore() -> { isChecked, setChecked, toggle, getDaySummary, getStreak, prune, clear, subscribe }
 *   createComplianceStore({ storage, key }) for tests or isolated views
 *
 * Helpers:
 *   todayIso(date?) -> "YYYY-MM-DD" local date, no timezone shift
 *   expectedKeysForProfile(medications) -> { medicationId, slot }[]
 */
export * from './compliance';
export { useCompliance } from './useCompliance';
