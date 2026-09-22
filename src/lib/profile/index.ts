/**
 * Profile domain — extension point for autocomplete, glyph, PDF, emergency UI.
 *
 * Store API (use this from islands; do not read localStorage directly):
 *   getProfileStore() -> { get, set, update, reset, subscribe, hydrateFromHash, hydrateFromWindow, flush }
 *   createProfileStore({ storage, debounceMs, key }) for tests or isolated editors
 *
 * Hash codec:
 *   encodeProfileToHash(profile, { emergencyOnly?: boolean }) -> "#data=..."
 *   decodeProfileFromHash(hash) -> { profile, mode } | null
 *
 * Schema:
 *   Profile, Medication, Allergy, Condition, EmergencyContact, Doctor
 *   MedicationGlyphParams (form, primaryColor, secondaryColor, scoring)
 *   SCHEDULE_SLOTS, createEmptyMedication, parseProfile, toEmergencyProfile
 *
 * Emergency view:
 *   useEmergencyProfile() -> hash-first, local-fallback, never overwrites storage
 *   resolveEmergencyProfile(hash, localProfile) -> pure resolver used by the hook
 */
export * from './schema';
export * from './store';
export * from './hash';
export { useProfile } from './useProfile';
export * from './emergencySource';
export { useEmergencyProfile } from './useEmergencyProfile';
